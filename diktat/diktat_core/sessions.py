"""Stav bežiacich Claude Code sessions pre panel v rohu obrazovky.

Každá session zapisuje svoj stav cez hooky do malých JSON súborov (jeden na session):

    ~/.claude/diktat/sessions/<session_id>.json
    {"session": "<id>", "name": "FacelessFactory", "state": "working", "since": 1694..., "cwd": "C:/..."}

Panel (diktat) tento priečinok číta raz za sekundu. Žiadny server, žiadne pripojenie – len súbory.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

# Hook → stav. Názvy udalostí sú tie, ktoré posiela Claude Code (hook_event_name).
EVENT_STATE = {
    "SessionStart": "ready",
    "UserPromptSubmit": "working",
    "PreToolUse": "working",
    "PostToolUse": "working",
    "Notification": "asking",   # spresní sa podľa notification_type
    "Stop": "done",
    "SessionEnd": "ended",
}

# Notification má vlastné typy (notification_type); len niektoré menia stav.
NOTIFICATION_STATE = {
    "permission_prompt": "asking",        # Claude čaká na povolenie nástroja
    "elicitation_dialog": "asking",
    "elicitation_url_dialog": "asking",
    "agent_needs_input": "asking",
    "idle_prompt": "done",                # dohovoril a čaká na teba
    "agent_completed": "done",
}

# stav → (ikona, slovom, farba)
STATE_LOOK = {
    "working": ("●", "pracuje", "#4a9eff"),
    "asking": ("●", "pýta sa ťa", "#ffb300"),
    "done": ("●", "hotovo", "#3ddc84"),
    "ready": ("○", "čaká", "#8a8a8a"),
}
STATE_ORDER = {"asking": 0, "done": 1, "working": 2, "ready": 3}


def default_dir() -> Path:
    """Priečinok so stavmi. Prepíše ho premenná DIKTAT_SESSION_DIR (používa ju aj hook)."""
    env = os.environ.get("DIKTAT_SESSION_DIR")
    if env:
        return Path(env)
    return Path.home() / ".claude" / "diktat" / "sessions"


def _safe_id(session_id: str) -> str:
    keep = [c for c in str(session_id or "neznama") if c.isalnum() or c in "-_"]
    return ("".join(keep) or "neznama")[:80]


def project_name(cwd: str | None, fallback: str = "") -> str:
    """Meno pre panel = názov priečinka projektu (C:/Users/x/FacelessFactory → FacelessFactory)."""
    if cwd:
        name = Path(str(cwd)).name or Path(str(cwd)).parent.name
        if name:
            return name
    return fallback or "session"


def record(event: str, payload: dict, directory: Path | None = None, now: float | None = None,
           extra: dict | None = None) -> Path | None:
    """Zapíše (alebo pri SessionEnd zmaže) stav jednej session. Vráti cestu k súboru, alebo None.
    Nikdy nevyhadzuje výnimku – hook nesmie zdržať ani zhodiť Claude."""
    directory = Path(directory or default_dir())
    now = time.time() if now is None else now
    state = EVENT_STATE.get(event)
    if state is None:
        return None
    if event == "Notification":
        state = NOTIFICATION_STATE.get(str(payload.get("notification_type") or ""), "")
        if not state:
            return None      # prihlásenie, limity a pod. stav session nemenia
    session_id = str(payload.get("session_id") or "").strip()
    path = directory / f"{_safe_id(session_id)}.json"
    try:
        if state == "ended":
            path.unlink(missing_ok=True)
            return path
        cwd = payload.get("cwd") or payload.get("project_dir") or ""
        old = _read_one(path) or {}
        entry = {
            "session": session_id,
            "name": project_name(cwd, old.get("name", "")),
            "cwd": str(cwd),
            "state": state,
            "since": now if old.get("state") != state else old.get("since", now),
            "updated": now,
        }
        if event == "Notification" and payload.get("message"):
            entry["note"] = str(payload["message"])[:80]
        if extra:
            entry.update(extra)
        directory.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(entry, ensure_ascii=False), encoding="utf-8")
        tmp.replace(path)
        return path
    except OSError:
        return None


def _read_one(path: Path) -> dict | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def read_states(directory: Path | None = None, now: float | None = None, done_keep_minutes: float = 30,
                stale_minutes: float = 240, max_rows: int = 6, demo_keep_minutes: float = 15) -> list[dict]:
    """Načíta stavy, zahodí staré a zoradí: najprv tie, čo čakajú na teba, potom hotové, potom pracujúce."""
    directory = Path(directory or default_dir())
    now = time.time() if now is None else now
    out: list[dict] = []
    try:
        files = sorted(directory.glob("*.json"))
    except OSError:
        return out
    for f in files:
        entry = _read_one(f)
        if not entry or entry.get("state") not in STATE_LOOK:
            continue
        age = now - float(entry.get("updated") or 0)
        if age > stale_minutes * 60:
            continue
        if entry.get("state") in ("done", "ready") and age > done_keep_minutes * 60:
            continue
        if entry.get("demo") and age > demo_keep_minutes * 60:
            continue     # ukážkové session sa samé vytratia, nech ich nikto nepovažuje za skutočné
        entry["age"] = age
        entry["elapsed"] = now - float(entry.get("since") or entry.get("updated") or now)
        out.append(entry)
    out.sort(key=lambda e: (STATE_ORDER.get(e["state"], 9), -float(e.get("updated") or 0)))
    return out[: max(1, int(max_rows))]


def prune(directory: Path | None = None, now: float | None = None, stale_minutes: float = 240) -> int:
    """Zmaže súbory sessions, ktoré sa dlho neozvali (počítač sa reštartoval a pod.). Vráti počet zmazaných."""
    directory = Path(directory or default_dir())
    now = time.time() if now is None else now
    removed = 0
    try:
        files = list(directory.glob("*.json"))
    except OSError:
        return 0
    for f in files:
        entry = _read_one(f)
        updated = float((entry or {}).get("updated") or 0)
        if entry is None or now - updated > stale_minutes * 60:
            try:
                f.unlink(missing_ok=True)
                removed += 1
            except OSError:
                pass
    return removed


DEMO_IDS = ("demo-pracuje", "demo-pyta", "demo-hotovo")


def demo(directory: Path | None = None, now: float | None = None) -> list[Path]:
    """Zapíše tri ukážkové session, nech je vidno, ako panel vyzerá, aj bez čakania na skutočné.
    Zmaže ich demo_clear()."""
    import time as _time
    now = _time.time() if now is None else now
    written = []
    for sid, name, event, payload in (
        (DEMO_IDS[0], "ukážka · pracuje", "UserPromptSubmit", {}),
        (DEMO_IDS[1], "ukážka · pýta sa", "Notification", {"notification_type": "permission_prompt"}),
        (DEMO_IDS[2], "ukážka · hotovo", "Stop", {}),
    ):
        path = record(event, {"session_id": sid, "cwd": f"C:/ukazka/{sid}", **payload}, directory, now,
                      extra={"name": name, "demo": True})
        if path:
            written.append(path)
    return written


def demo_clear(directory: Path | None = None) -> int:
    """Zmaže ukážkové session."""
    directory = Path(directory or default_dir())
    removed = 0
    for sid in DEMO_IDS:
        path = directory / f"{_safe_id(sid)}.json"
        try:
            if path.is_file():
                path.unlink()
                removed += 1
        except OSError:
            pass
    return removed


def human_time(seconds: float) -> str:
    """0:07, 3 min, 2 h – krátko, nech sa to zmestí do rohu."""
    seconds = max(0, int(seconds))
    if seconds < 60:
        return f"0:{seconds:02d}"
    if seconds < 3600:
        return f"{seconds // 60} min"
    return f"{seconds // 3600} h"


def restart_summary(states: list[dict]) -> tuple[bool, str]:
    """Dá sa teraz reštartovať Claude? (bezpečné?, veta pre používateľa)
    Pracujúca session = reštart jej preruší rozrobený ťah; hotové a čakajúce sa po reštarte len obnovia."""
    working = [e for e in states if e.get("state") == "working"]
    asking = [e for e in states if e.get("state") == "asking"]
    names = lambda items: ", ".join(str(e.get("name") or "session") for e in items)   # noqa: E731
    if working:
        return False, f"Počkaj, pracuje: {names(working)}. Reštart by im prerušil rozrobené."
    if asking:
        return True, f"Môžeš reštartovať. Pozor, čaká na tvoju odpoveď: {names(asking)}."
    if states:
        return True, f"Môžeš reštartovať, nič nepracuje ({len(states)} session sa po reštarte obnoví)."
    return True, "Môžeš reštartovať, žiadna session nebeží."


def row_for(entry: dict, show_time: bool = False) -> tuple[str, str, str]:
    """(ikona, text, farba) pre jeden riadok panela: „● epizodar · pracuje“.
    S show_time=True pribudne, ako dlho už je session v tomto stave."""
    icon, word, color = STATE_LOOK.get(entry.get("state", ""), STATE_LOOK["ready"])
    name = str(entry.get("name") or "session")[:18]
    text = f"{name} · {word}"
    if show_time:
        text = f"{text} {human_time(entry.get('elapsed', 0))}"
    return icon, text, color


def row_key(entry: dict) -> tuple:
    """Čo musí zostať rovnaké, aby sa panel nemusel prekresľovať (čas sa mení stále – ten tu nie je)."""
    return (entry.get("session"), entry.get("state"), entry.get("name"))
