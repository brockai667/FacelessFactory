"""Stav bežiacich Claude Code sessions pre panel v rohu obrazovky.

Každá session zapisuje svoj stav cez hooky do malých JSON súborov (jeden na session):

    ~/.claude/diktat/sessions/<session_id>.json
    {"session": "<id>", "name": "FacelessFactory", "state": "working", "since": 1694..., "cwd": "C:/..."}

Panel (diktat) tento priečinok číta raz za sekundu. Žiadny server, žiadne pripojenie – len súbory.

Názov riadka berieme v tomto poradí: názov chatu z bočného zoznamu aplikácie Claude (`app_title`),
uložený názov, súhrn z prepisu session, prvá ľudská správa, názov priečinka projektu.
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
    "ready": ("○", "čaká na zadanie", "#8a8a8a"),
}
STATE_ORDER = {"asking": 0, "done": 1, "working": 2, "ready": 3}

# Dlhý nástroj (render, build, test) beží aj 15 minút a do prepisu za ten čas nenapíše nič – preto sa
# „pracuje“ drží dlho po poslednom zápise. Že session naozaj pokračuje, poznať po tom, že sa do prepisu
# písalo ZRETEĽNE neskôr, než hook zapísal stav: keď ťah normálne skončí, posledný zápis a „hotovo“
# prídu v tej istej sekunde.
WORKING_WINDOW_SECONDS = 1800.0        # 30 min od posledného zápisu; potom už „pracuje“ neveríme
LIFT_AFTER_SECONDS = {"asking": 4.0}   # „pýta sa ťa“ zmizne skôr – kým čakáš na povolenie, nepíše sa nič
LIFT_AFTER_DEFAULT = 10.0              # „hotovo“ preklopíme, až keď sa písalo 10 s po ňom


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


SYSTEM_PREFIXES = ("<", "[Artifact comment", "[Request interrupted", "Caveat:", "This session is being continued")


def is_system_text(text: str) -> bool:
    """Prompty, ktoré nenapísal človek: obálky harnessu (<task-notification>, <wake…>, <system-reminder>),
    hlásenia o prerušení a pokračovaní. Takýto text nesmie byť názvom session."""
    t = " ".join(str(text or "").split())
    if not t:
        return True
    return t.startswith(SYSTEM_PREFIXES)


_TITLE_CACHE: dict[str, str] = {}


def title_from_transcript(path: str | Path | None, max_lines: int = 400, max_bytes: int = 3_000_000) -> str:
    """Názov session z jej prepisu: najprv súhrn, ktorý si robí Claude (to je presne ten názov, čo vidíš
    v zozname chatov), inak prvá ľudská správa. Formát prepisu je vnútorná vec Claude Code a môže sa
    zmeniť – preto len best-effort: čokoľvek nečakané = prázdny názov."""
    if not path:
        return ""
    key = str(path)
    if key in _TITLE_CACHE:
        return _TITLE_CACHE[key]
    first_human = ""
    try:
        read = 0
        with open(key, "r", encoding="utf-8", errors="replace") as fh:
            for i, line in enumerate(fh):
                read += len(line)
                if i >= max_lines or read > max_bytes:
                    break
                line = line.strip()
                if not line.startswith("{"):
                    continue
                try:
                    obj = json.loads(line)
                except ValueError:
                    continue
                if not isinstance(obj, dict):
                    continue
                summary = obj.get("summary") if obj.get("type") == "summary" else None
                if isinstance(summary, str) and summary.strip():
                    return _remember(key, clean_title(summary))
                if obj.get("type") != "user" or obj.get("isMeta") or first_human:
                    continue
                content = (obj.get("message") or {}).get("content")
                if isinstance(content, list):
                    text = " ".join(c.get("text", "") for c in content
                                    if isinstance(c, dict) and c.get("type") == "text")
                elif isinstance(content, str):
                    text = content
                else:
                    continue
                if not is_system_text(text):
                    first_human = clean_title(text)
    except OSError:
        return ""
    tail = _summary_from_tail(key)
    if tail:
        return _remember(key, tail)
    return _remember(key, first_human) if first_human else ""


def _summary_from_tail(path: str, tail_bytes: int = 262_144) -> str:
    """Súhrn (názov chatu) pribúda do prepisu aj neskôr – pozri sa aj na koniec súboru."""
    try:
        with open(path, "rb") as fh:
            fh.seek(0, 2)
            size = fh.tell()
            fh.seek(max(0, size - tail_bytes))
            chunk = fh.read().decode("utf-8", "replace")
    except OSError:
        return ""
    found = ""
    for line in chunk.splitlines():
        line = line.strip()
        if not line.startswith("{") or '"summary"' not in line:
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        summary = obj.get("summary") if isinstance(obj, dict) else None
        if isinstance(summary, str) and summary.strip():
            found = clean_title(summary)
    return found


def _remember(key: str, title: str) -> str:
    if len(_TITLE_CACHE) > 200:
        _TITLE_CACHE.clear()
    _TITLE_CACHE[key] = title
    return title

# ── Názvy chatov z aplikácie Claude ──────────────────────────────────────────────────────────────
# Aplikácia si každý chat z bočného zoznamu drží vo vlastnom malom JSON súbore
# (%APPDATA%\Claude\claude-code-sessions\…\local_<id>.json). Zaujímajú nás z neho dve políčka:
# "cliSessionId" (to isté id, aké hlásia hooky) a "title" (názov, čo vidíš v zozname – aj ten,
# ktorý si prepísal ručne). Formát je vnútorná vec Claude, takže všetko je best-effort:
# keď sa čokoľvek nečakane zmení, názov sa doberie postaru z prepisu.

APP_TITLE_DIR = "claude-code-sessions"
APP_TITLE_DEPTH = 4                    # layout je <priečinok>/<id>/<id>/local_<id>.json – hlbšie netreba

_APP_CACHE: dict[str, tuple[float, int, str, str, bool]] = {}   # súbor → (čas, veľkosť, id, názov, archivovaný)
_APP_TITLES: dict[str, str] = {}                          # id session → názov chatu
_APP_ARCHIVED: set[str] = set()                           # id session, ktoré už v bočnom zozname nie sú
_APP_SCANNED_AT = 0.0


def app_session_dirs() -> list[Path]:
    """Priečinky, kde má aplikácia Claude názvy chatov. Prepíše ich DIKTAT_APP_SESSION_DIR."""
    env = os.environ.get("DIKTAT_APP_SESSION_DIR")
    if env:
        candidates = [Path(p) for p in env.split(os.pathsep) if p.strip()]
    else:
        candidates = [root / APP_TITLE_DIR for root in app_roots()]
    out: list[Path] = []
    for path in candidates:
        try:
            if path.is_dir() and path not in out:
                out.append(path)
        except OSError:
            pass
    return out


def app_roots() -> list[Path]:
    """Kde môže byť dátový priečinok aplikácie Claude. APPDATA tu neberieme ako isté: daemon sa spúšťa
    cez wscript/Plánovač úloh a tam tá premenná nemusí byť – preto aj cesta poskladaná z domovského
    priečinka."""
    home = Path.home()
    roots = [Path(p) / "Claude" for p in (os.environ.get("APPDATA"), os.environ.get("LOCALAPPDATA")) if p]
    roots += [home / "AppData" / "Roaming" / "Claude", home / "AppData" / "Local" / "Claude",  # Windows
              home / "Library" / "Application Support" / "Claude",                             # macOS
              home / ".config" / "Claude"]                                                     # Linux
    return roots


def forget_app_titles() -> None:
    """Zahodí zapamätané názvy (po zmene priečinka, v testoch)."""
    global _APP_SCANNED_AT
    _APP_CACHE.clear()
    _APP_TITLES.clear()
    _APP_ARCHIVED.clear()
    _APP_SCANNED_AT = 0.0


def app_titles(ttl: float = 4.0, max_files: int = 600, head_bytes: int = 16_384) -> dict[str, str]:
    """{id session: názov chatu} podľa bočného zoznamu v aplikácii Claude.
    Panel sa pýta raz za sekundu, preto: hotový zoznam platí `ttl` sekúnd, číta sa len začiatok
    súboru a súbory, ktoré sa odvtedy nezmenili, sa preskočia."""
    global _APP_SCANNED_AT
    now = time.time()
    if _APP_SCANNED_AT and now - _APP_SCANNED_AT < ttl:
        return _APP_TITLES
    _APP_SCANNED_AT = now
    files: list[tuple[float, int, str]] = []
    for directory in app_session_dirs():
        files.extend(_json_files(directory))
    files.sort(key=lambda item: item[0])          # najnovšie nakoniec: pri rovnakom id vyhrá čerstvejší súbor
    fresh: dict[str, tuple[float, int, str, str, bool]] = {}
    found: dict[str, str] = {}
    gone: set[str] = set()
    for mtime, size, path in files[-max(1, int(max_files)):]:
        known = _APP_CACHE.get(path)
        if known and known[0] == mtime and known[1] == size:
            session_id, title, archived = known[2], known[3], known[4]
        else:
            session_id, title, archived = _app_title_of(path, head_bytes)
        fresh[path] = (mtime, size, session_id, title, archived)
        if not session_id:
            continue
        gone.discard(session_id)
        if archived:
            gone.add(session_id)
        if title:
            found[session_id] = title
    _APP_CACHE.clear()
    _APP_CACHE.update(fresh)
    _APP_TITLES.clear()
    _APP_TITLES.update(found)
    _APP_ARCHIVED.clear()
    _APP_ARCHIVED.update(gone)
    return _APP_TITLES


def app_title(session_id: str | None) -> str:
    """Názov chatu tak, ako ho vidíš v bočnom zozname aplikácie Claude.
    Keď ho nenájdeme (cloudová session, iná verzia aplikácie), vráti prázdno – názov sa doberie inak."""
    sid = str(session_id or "").strip()
    if not sid:
        return ""
    try:
        return app_titles().get(sid, "")
    except Exception:  # noqa: BLE001
        return ""      # panel nesmie spadnúť na tom, že aplikácia si prerobila svoje súbory


def _json_files(directory: Path, depth: int = APP_TITLE_DEPTH) -> list[tuple[float, int, str]]:
    """Súbory .json v priečinku aplikácie: (čas zmeny, veľkosť, cesta). Cez os.scandir, lebo ten na Windows
    dostane čas aj veľkosť rovno z výpisu priečinka – prejsť to raz za pár sekúnd je potom lacné."""
    out: list[tuple[float, int, str]] = []
    stack = [(str(directory), 0)]
    while stack:
        current, level = stack.pop()
        try:
            with os.scandir(current) as entries:
                for entry in entries:
                    try:
                        if entry.is_dir():
                            if level < depth:
                                stack.append((entry.path, level + 1))
                            continue
                        if not entry.name.endswith(".json"):
                            continue
                        st = entry.stat()
                    except OSError:
                        continue
                    out.append((st.st_mtime, st.st_size, entry.path))
        except OSError:
            continue
    return out


def app_archived(session_id: str | None) -> bool:
    """Je chat v aplikácii archivovaný? Len vtedy True – keď o ňom aplikácia nevie (napr. session z
    príkazového riadka), vráti False a riadok v paneli ostane."""
    sid = str(session_id or "").strip()
    if not sid:
        return False
    try:
        app_titles()
        return sid in _APP_ARCHIVED
    except Exception:  # noqa: BLE001
        return False


def _app_title_of(path: Path | str, head_bytes: int = 16_384) -> tuple[str, str, bool]:
    """Z jedného súboru aplikácie vytiahne (id session, názov chatu, je archivovaný?)."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(head_bytes)
    except OSError:
        return "", "", False
    fields = _top_level_fields(head.decode("utf-8", "replace"), ("cliSessionId", "title", "isArchived"))
    session_id = " ".join(str(fields.get("cliSessionId") or "").split())
    title = " ".join(str(fields.get("title") or "").split())
    return session_id, ("" if is_system_text(title) else title), fields.get("isArchived") is True


def _top_level_fields(text: str, wanted: tuple[str, ...]) -> dict[str, object]:
    """Hodnoty vrchných kľúčov z JSON textu, aj keď je useknutý na začiatku súboru.
    Do vnorených objektov schválne nelezie: „title“ je v tom súbore aj v popisoch nástrojov."""
    out: dict[str, object] = {}
    i, n, depth, key = 0, len(text), 0, None
    while i < n and len(out) < len(wanted):
        ch = text[i]
        if ch == '"' and depth == 1:
            value, i = _json_string(text, i)
            if value is None:
                break
            if key is None:
                key = value
            else:
                if key in wanted:
                    out[key] = value
                key = None
        elif ch in "{[":
            if depth == 0:
                depth, i = 1, i + 1
            else:
                i, key = _skip_nested(text, i), None     # hodnota, ktorá nás nezaujíma
        elif ch in "}]":
            break                                        # koniec vrchného objektu
        elif ch in ",:" or ch.isspace():
            i += 1
        else:
            start = i
            while i < n and text[i] not in ",}":         # číslo, true/false/null
                i += 1
            if key in wanted and i < n:                  # useknutý koniec hlavičky neberieme
                try:
                    out[key] = json.loads(text[start:i].strip())
                except ValueError:
                    pass
            key = None
    return out


def _json_string(text: str, i: int) -> tuple[str | None, int]:
    """Prečíta reťazec, ktorý sa začína úvodzovkou na indexe `i`. Vráti (hodnota, index za ním);
    pri useknutom texte (None, koniec)."""
    n, j = len(text), i + 1
    while j < n:
        if text[j] == "\\":
            j += 2
            continue
        if text[j] == '"':
            try:
                return json.loads(text[i:j + 1]), j + 1
            except ValueError:
                return "", j + 1
        j += 1
    return None, n


def _skip_nested(text: str, i: int) -> int:
    """Index za koncom vnoreného objektu alebo poľa, ktoré sa začína na `i`."""
    depth, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == '"':
            _, i = _json_string(text, i)
            continue
        if ch in "{[":
            depth += 1
        elif ch in "}]":
            depth -= 1
            if depth <= 0:
                return i + 1
        i += 1
    return n



LABEL_CHARS = 34          # koľko písmen názvu ukázať; panel sa šírkou prispôsobí najdlhšiemu riadku


def shorten(text: str, limit: int = LABEL_CHARS) -> str:
    """Skráti text na dĺžku, ktorá sa zmestí do panela (číslovanie duplicít sa pridáva až za to)."""
    t = " ".join(str(text or "").split())
    return t[:limit].rstrip(" ,.;:") + "…" if len(t) > limit else t


def clean_title(text: str, limit: int = LABEL_CHARS) -> str:
    """Z prvej ľudskej správy spraví názov, ktorý používateľ pozná zo zoznamu chatov v Claude."""
    t = " ".join(str(text or "").split())
    for marker in ("🎤", "[diktát]", "[diktat]", "[d]"):
        if t.startswith(marker):
            t = t[len(marker):].lstrip()
    return shorten(t.lstrip("/#>-• ").strip(), limit)


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
    if not session_id:
        return None      # bez id sa nedá povedať, ktorej session to patrí – radšej žiadny riadok ako cudzí
    path = directory / f"{_safe_id(session_id)}.json"
    try:
        if state == "ended":
            path.unlink(missing_ok=True)
            return path
        cwd = payload.get("cwd") or payload.get("project_dir") or ""
        old = _read_one(path) or {}
        entry = {
            "session": session_id,
            "transcript": str(payload.get("transcript_path") or old.get("transcript") or ""),
            "name": project_name(cwd, old.get("name", "")),
            "cwd": str(cwd),
            "state": state,
            "since": now if old.get("state") != state else old.get("since", now),
            "updated": now,
        }
        title = old.get("title") or ""
        if title and is_system_text(title):
            title = ""                 # zlý názov z predchádzajúcej verzie (napr. <task-notification>) – prepíš
        if not title:                  # názov = prvá ĽUDSKÁ správa session (tak ju poznáš zo zoznamu chatov)
            prompt = payload.get("prompt") or payload.get("user_input") or ""
            title = "" if is_system_text(prompt) else clean_title(prompt)
        if not title:
            title = title_from_transcript(payload.get("transcript_path"))
        if title:
            entry["title"] = title
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


# ── Zavreté riadky ───────────────────────────────────────────────────────────────────────────────
# Keď je session vybavená, klikneš na krížik a riadok zmizne. Vráti sa, až keď tá session hlási niečo
# nové (nový prompt, otázka na povolenie, koniec ťahu). Píše sem len panel – hooky na tento súbor
# nesiahajú, takže si nemajú čo prepísať.
HIDDEN_FILE = "_zavrete.json"


def hidden_rows(directory: Path | None = None) -> dict[str, float]:
    """{id session: po ktoré hlásenie je riadok zavretý}."""
    path = Path(directory or default_dir()) / HIDDEN_FILE
    data = _read_one(path) or {}
    return {str(k): float(v) for k, v in data.items() if isinstance(v, (int, float))}


def hide_row(session_id: str | None, reported: float | None, directory: Path | None = None) -> bool:
    """Zavrie riadok jednej session. Vráti, či sa to podarilo zapísať."""
    sid = str(session_id or "").strip()
    if not sid:
        return False
    directory = Path(directory or default_dir())
    rows = hidden_rows(directory)
    rows[sid] = float(reported or time.time())
    live = {_safe_id(s) for s in rows}
    try:
        for f in directory.glob("*.json"):       # zabudni na session, ktoré už neexistujú
            live.discard(f.stem)
        rows = {s: v for s, v in rows.items() if _safe_id(s) not in live}
        path = directory / HIDDEN_FILE
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        tmp.replace(path)
        return True
    except OSError:
        return False


def show_all_rows(directory: Path | None = None) -> int:
    """Znova ukáže všetky zavreté riadky. Vráti, koľko ich bolo."""
    directory = Path(directory or default_dir())
    rows = hidden_rows(directory)
    try:
        (directory / HIDDEN_FILE).unlink(missing_ok=True)
    except OSError:
        return 0
    return len(rows)


def read_states(directory: Path | None = None, now: float | None = None, done_keep_minutes: float = 30,
                stale_minutes: float = 240, max_rows: int = 6, demo_keep_minutes: float = 15,
                working_window_seconds: float = WORKING_WINDOW_SECONDS) -> list[dict]:
    """Načíta stavy, zahodí staré a zoradí: najprv tie, čo čakajú na teba, potom hotové, potom pracujúce."""
    directory = Path(directory or default_dir())
    now = time.time() if now is None else now
    out: list[dict] = []
    try:
        files = sorted(f for f in directory.glob("*.json") if not f.name.startswith("_"))
    except OSError:
        return out
    hidden = hidden_rows(directory)
    for f in files:
        entry = _read_one(f)
        if not entry or entry.get("state") not in STATE_LOOK:
            continue
        entry["reported"] = float(entry.get("updated") or 0)      # čas hlásenia hooku, pred dopočítaním
        if hidden.get(str(entry.get("session") or "")) is not None                 and hidden[str(entry.get("session"))] >= entry["reported"]:
            continue                      # zavretý riadok – vráti sa, až keď session hlási niečo nové
        if not entry.get("demo") and not str(entry.get("session") or "").strip():
            continue                      # zvyšok po staršej verzii: stav bez id session
        if app_archived(entry.get("session")):
            continue                      # chat, ktorý si v aplikácii archivoval – v bočnom zozname už nie je
        age = now - float(entry.get("updated") or 0)
        if age > stale_minutes * 60:
            continue
        if entry.get("state") in ("done", "ready") and age > done_keep_minutes * 60:
            continue
        if entry.get("demo") and age > demo_keep_minutes * 60:
            continue     # ukážkové session sa samé vytratia, nech ich nikto nepovažuje za skutočné
        refresh_from_transcript(entry, now, working_window_seconds)
        age = now - float(entry.get("updated") or 0)
        entry["age"] = age
        entry["elapsed"] = now - float(entry.get("since") or entry.get("updated") or now)
        title = app_title(entry.get("session")) or entry.get("title") or ""
        if not title or is_system_text(title):
            title = title_from_transcript(entry.get("transcript"))
        entry["label"] = shorten(title or entry.get("name") or "session")
        out.append(entry)
    out.sort(key=lambda e: (STATE_ORDER.get(e["state"], 9), -float(e.get("updated") or 0)))
    number_duplicates(out)
    return out[: max(1, int(max_rows))]


def number_duplicates(entries: list[dict]) -> list[dict]:
    """Dve sessions v tom istom priečinku (napr. dvakrát „Dokumenty“) by boli na nerozoznanie –
    druhá a ďalšie dostanú poradové číslo: „Dokumenty (2)“."""
    seen: dict[str, int] = {}
    for entry in entries:
        if entry.get("demo"):
            continue          # ukážkové riadky sa rozlíšia stavom, číslovať ich netreba
        label = str(entry.get("label") or entry.get("name") or "session")
        seen[label] = seen.get(label, 0) + 1
        if seen[label] > 1:
            entry["label"] = f"{label} ({seen[label]})"
    return entries


def refresh_from_transcript(entry: dict, now: float, idle_seconds: float = WORKING_WINDOW_SECONDS) -> dict:
    """Hooky hlásia len odoslanie promptu, otázku na povolenie a koniec ťahu. Keď session zobudí systém
    (dokončená úloha na pozadí) alebo keď jej práve povolíš nástroj, žiadny hook nepríde a v paneli by
    ostalo staré „hotovo“ či „pýta sa ťa“. Že session pokračuje, poznať po tom, že sa do jej prepisu
    písalo neskôr, než hook zapísal stav – vtedy „pracuje“ platí až do ďalšieho hlásenia hooku."""
    path = entry.get("transcript")
    state = entry.get("state")
    if not path or entry.get("demo") or state not in ("done", "ready", "asking"):
        return entry
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return entry
    delay = LIFT_AFTER_SECONDS.get(state, LIFT_AFTER_DEFAULT)
    if mtime > float(entry.get("updated") or 0) + delay and now - mtime < idle_seconds:
        entry["state"] = "working"
        entry["since"] = mtime
        entry["updated"] = mtime
    return entry


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
        (DEMO_IDS[0], "ukážka", "UserPromptSubmit", {}),
        (DEMO_IDS[1], "ukážka", "Notification", {"notification_type": "permission_prompt"}),
        (DEMO_IDS[2], "ukážka", "Stop", {}),
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
    name = str(entry.get("label") or entry.get("title") or entry.get("name") or "session")
    text = f"{name} · {word}"
    if show_time:
        text = f"{text} {human_time(entry.get('elapsed', 0))}"
    return icon, text, color


def row_key(entry: dict) -> tuple:
    """Čo musí zostať rovnaké, aby sa panel nemusel prekresľovať (čas sa mení stále – ten tu nie je)."""
    return (entry.get("session"), entry.get("state"), entry.get("label") or entry.get("name"))
