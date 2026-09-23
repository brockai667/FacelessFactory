#!/usr/bin/env python3
"""UserPromptSubmit hook pre Claude Code – globálna „bezpečnostná sieť" pre diktované prompty.

Claude Code hook NEMÔŽE prepísať prompt (dokumentácia: „can't replace the prompt; it only injects
additionalContext"), takže:
  * ak prompt začína značkou diktátu (🎤, [diktát], [d]) → pridá Claudovi kontext: že ide o hlasový
    prepis, pravidlá interpretácie a (ak sa líši) verziu vyčistenú pravidlami / Claudom;
  * inak nevypíše nič (prompt ide ďalej bez zmeny, cena ≈ 0).
Nikdy neblokuje prompt – každá chyba končí ticho s exit 0.

Konfigurácia: config.json vedľa tohto súboru (inštalátor ho tam skopíruje), inak defaulty.
`hook.llm: true` zapne aj čistenie cez Claude (pomalšie – hook má limit 30 s); env DIKTAT_HOOK_LLM=0/1 prebije.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
for candidate in (HERE, HERE.parent):
    if (candidate / "diktat_core").is_dir():
        sys.path.insert(0, str(candidate))
        break

CONTEXT_HEADER = """\
Používateľ tento prompt NADIKTOVAL hlasom (slovenčina, automatický prepis Whisper). \
Prepis môže obsahovať výplňové slová, prerieknutia, opravy („nie, teda…“, „škrtni to“, \
„ignoruj posledné dva riadky“, „odznova“ = zahoď všetko predtým) a zle rozpoznané technické názvy. \
Platí posledná verzia každej myšlienky; meta-príkazy vykonaj a neber ich ako obsah; \
názvy súborov/funkcií/knižníc odvoď z kontextu projektu. Pri vecnej nejasnosti sa spýtaj, \
štýl neriešiť."""


def build_context(prompt: str, cfg: dict, use_llm: bool) -> str | None:
    from diktat_core import cleanup

    markers = cfg.get("output", {}).get("markers_recognized") or []
    stripped, dictated = cleanup.strip_marker(prompt, markers)
    if not dictated:
        return None

    cleaned = cleanup.rules_clean(stripped, cfg.get("cleanup", {}).get("replacements"))
    cleaned, _send = cleanup.detect_send(cleaned, cfg.get("output", {}).get("send_keywords"))
    method = "pravidlá"
    if use_llm and cleaned:
        try:
            llm = cleanup.llm_clean(cleaned, cfg.get("cleanup", {}))
        except Exception:  # noqa: BLE001
            llm = None
        if llm:
            cleaned, method = llm, "Claude"

    parts = [CONTEXT_HEADER]
    if cleaned and cleanup.normalize_ws(cleaned) != cleanup.normalize_ws(stripped):
        parts.append(f"Orientačná verzia vyčistená automaticky ({method}); ak sa líši od zámeru v pôvodnom prepise, platí pôvodný prepis:\n{cleaned}")
    return "\n\n".join(parts)


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:  # noqa: BLE001
        return 0
    if not isinstance(data, dict):
        return 0
    try:    # pre panel so stavom sessions: od tejto chvíle session pracuje
        from diktat_core import sessions
        sessions.record("UserPromptSubmit", data)
    except Exception:  # noqa: BLE001
        pass
    prompt = data.get("prompt") or data.get("user_input") or ""
    if not prompt.strip():
        return 0
    try:
        from diktat_core import config as cfgmod
        cfg = cfgmod.load_config(HERE / "config.json")
        env = os.environ.get("DIKTAT_HOOK_LLM")
        use_llm = (env not in ("0", "false", "no")) if env is not None else bool(cfg.get("hook", {}).get("llm"))
        context = build_context(prompt, cfg, use_llm)
    except Exception:  # noqa: BLE001 – hook nikdy nesmie zhodiť prompt
        return 0
    if not context:
        return 0
    out = {"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": context[:9500]}}
    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()
    return 0


if __name__ == "__main__":
    sys.exit(main())
