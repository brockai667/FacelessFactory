#!/usr/bin/env python3
"""Nainštaluje diktat do Claude Code GLOBÁLNE (~/.claude) – platí pre všetky projekty a sessions.

Čo robí (idempotentne, dá sa spustiť opakovane):
  1. ~/.claude/CLAUDE.md            – pridá/obnoví blok pravidiel pre diktovaný vstup (medzi značkami diktat:begin/end)
  2. ~/.claude/skills/diktat/       – globálny skill /diktat
  3. ~/.claude/hooks/diktat/        – UserPromptSubmit hook + diktat_core + config.json
  4. ~/.claude/settings.json        – zaregistruje hook (exec forma: python + cesta, bez shellu, funguje aj na Windows)
     (pred zápisom sa spraví záloha settings.json.bak-<čas>)

Použitie:
  python install.py                # nainštaluj všetko
  python install.py --no-hook      # bez hooku (len CLAUDE.md + skill)
  python install.py --dry-run      # len ukáž, čo by sa zmenilo
  python install.py --uninstall    # odstráň všetko, čo inštalátor pridal
  python install.py --claude-dir C:/iná/cesta/.claude
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BEGIN, END = "<!-- diktat:begin -->", "<!-- diktat:end -->"
HOOK_FILE = "diktat_hook.py"


def default_claude_dir() -> Path:
    env = os.environ.get("CLAUDE_CONFIG_DIR")
    return Path(env) if env else Path.home() / ".claude"


# --- 1. CLAUDE.md ---------------------------------------------------------------------------------
def merge_claude_md(existing: str, snippet: str) -> str:
    snippet = snippet.strip("\n")
    if BEGIN in existing and END in existing:
        start = existing.index(BEGIN)
        end = existing.index(END) + len(END)
        return existing[:start] + snippet + existing[end:]
    base = existing.rstrip("\n")
    return (base + "\n\n" if base else "") + snippet + "\n"


def remove_from_claude_md(existing: str) -> str:
    if BEGIN not in existing or END not in existing:
        return existing
    start = existing.index(BEGIN)
    end = existing.index(END) + len(END)
    out = existing[:start].rstrip("\n") + "\n" + existing[end:].lstrip("\n")
    return out.strip("\n") + ("\n" if out.strip() else "")


# --- 4. settings.json -------------------------------------------------------------------------------
def _is_diktat_entry(entry: dict) -> bool:
    for h in entry.get("hooks", []) or []:
        blob = " ".join([str(h.get("command", ""))] + [str(a) for a in (h.get("args") or [])])
        if HOOK_FILE in blob:
            return True
    return False


def hook_entry(python_exe: str, hook_path: str, timeout: int = 25) -> dict:
    return {"hooks": [{"type": "command", "command": python_exe, "args": [hook_path], "timeout": timeout}]}


def add_hook(settings: dict, python_exe: str, hook_path: str) -> dict:
    hooks = settings.setdefault("hooks", {})
    entries = hooks.get("UserPromptSubmit")
    if not isinstance(entries, list):
        entries = []
    entries = [e for e in entries if not (isinstance(e, dict) and _is_diktat_entry(e))]
    entries.append(hook_entry(python_exe, hook_path))
    hooks["UserPromptSubmit"] = entries
    return settings


def remove_hook(settings: dict) -> dict:
    hooks = settings.get("hooks") or {}
    entries = hooks.get("UserPromptSubmit")
    if isinstance(entries, list):
        entries = [e for e in entries if not (isinstance(e, dict) and _is_diktat_entry(e))]
        if entries:
            hooks["UserPromptSubmit"] = entries
        else:
            hooks.pop("UserPromptSubmit", None)
    if not hooks:
        settings.pop("hooks", None)
    return settings


def _load_settings(path: Path) -> dict:
    if not path.is_file():
        return {}
    text = path.read_text(encoding="utf-8")
    if not text.strip():
        return {}
    return json.loads(text)   # neplatný JSON = radšej spadnúť než prepísať používateľove nastavenia


def _write_settings(path: Path, settings: dict, dry_run: bool) -> None:
    if dry_run:
        return
    if path.is_file():
        backup = path.with_name(f"settings.json.bak-{dt.datetime.now():%Y%m%d%H%M%S}")
        shutil.copy2(path, backup)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(settings, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


# --- orchestrácia -----------------------------------------------------------------------------------
def install(claude_dir: Path, with_hook: bool = True, python_exe: str | None = None,
            dry_run: bool = False, log=print) -> None:
    claude_dir = Path(claude_dir)
    python_exe = python_exe or sys.executable
    tag = "[dry-run] " if dry_run else ""

    # 1. CLAUDE.md
    snippet = (HERE / "claude" / "CLAUDE.diktat.md").read_text(encoding="utf-8")
    claude_md = claude_dir / "CLAUDE.md"
    existing = claude_md.read_text(encoding="utf-8") if claude_md.is_file() else ""
    merged = merge_claude_md(existing, snippet)
    if merged != existing:
        if not dry_run:
            claude_md.parent.mkdir(parents=True, exist_ok=True)
            claude_md.write_text(merged, encoding="utf-8")
        log(f"{tag}✔ {claude_md}: blok 'Diktovaný vstup' {'obnovený' if BEGIN in existing else 'pridaný'}")
    else:
        log(f"{tag}= {claude_md}: už aktuálne")

    # 2. skill
    skill_src = HERE / "claude" / "skills" / "diktat"
    skill_dst = claude_dir / "skills" / "diktat"
    if not dry_run:
        skill_dst.mkdir(parents=True, exist_ok=True)
        shutil.copy2(skill_src / "SKILL.md", skill_dst / "SKILL.md")
    log(f"{tag}✔ {skill_dst}: skill /diktat")

    # 3. + 4. hook
    if with_hook:
        hook_dir = claude_dir / "hooks" / "diktat"
        if not dry_run:
            hook_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(HERE / "hook" / HOOK_FILE, hook_dir / HOOK_FILE)
            core_dst = hook_dir / "diktat_core"
            if core_dst.exists():
                shutil.rmtree(core_dst)
            shutil.copytree(HERE / "diktat_core", core_dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
            cfg_src = HERE / "config.json" if (HERE / "config.json").is_file() else HERE / "config.example.json"
            shutil.copy2(cfg_src, hook_dir / "config.json")
        log(f"{tag}✔ {hook_dir}: hook + diktat_core + config.json")

        settings_path = claude_dir / "settings.json"
        settings = _load_settings(settings_path)
        add_hook(settings, Path(python_exe).as_posix(), (hook_dir / HOOK_FILE).as_posix())
        _write_settings(settings_path, settings, dry_run)
        log(f"{tag}✔ {settings_path}: UserPromptSubmit hook zaregistrovaný ({Path(python_exe).as_posix()})")
    else:
        log(f"{tag}- hook preskočený (--no-hook)")

    log("\nHotovo. Platí pre všetky projekty a sessions Claude Code na tomto počítači "
        "(CLI, desktop app, VS Code). Nové sessions to načítajú automaticky; bežiacu session reštartuj.")


def uninstall(claude_dir: Path, dry_run: bool = False, log=print) -> None:
    claude_dir = Path(claude_dir)
    tag = "[dry-run] " if dry_run else ""
    claude_md = claude_dir / "CLAUDE.md"
    if claude_md.is_file():
        existing = claude_md.read_text(encoding="utf-8")
        cleaned = remove_from_claude_md(existing)
        if cleaned != existing:
            if not dry_run:
                claude_md.write_text(cleaned, encoding="utf-8")
            log(f"{tag}✔ {claude_md}: blok odstránený")
    for sub in ("skills/diktat", "hooks/diktat"):
        path = claude_dir / sub
        if path.exists():
            if not dry_run:
                shutil.rmtree(path)
            log(f"{tag}✔ {path}: odstránené")
    settings_path = claude_dir / "settings.json"
    if settings_path.is_file():
        settings = _load_settings(settings_path)
        before = json.dumps(settings, sort_keys=True)
        remove_hook(settings)
        if json.dumps(settings, sort_keys=True) != before:
            _write_settings(settings_path, settings, dry_run)
            log(f"{tag}✔ {settings_path}: hook odregistrovaný")
    log("Hotovo.")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Nainštaluje diktat globálne do Claude Code (~/.claude).")
    ap.add_argument("--claude-dir", default=str(default_claude_dir()))
    ap.add_argument("--python", default=sys.executable, help="interpreter pre hook (default: tento)")
    ap.add_argument("--no-hook", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--uninstall", action="store_true")
    args = ap.parse_args(argv)
    if args.uninstall:
        uninstall(Path(args.claude_dir), dry_run=args.dry_run)
    else:
        install(Path(args.claude_dir), with_hook=not args.no_hook, python_exe=args.python, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
