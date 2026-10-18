#!/usr/bin/env python3
"""Hook, ktorý hlási stav session panelu diktatu (pravý horný roh okna Claude).

Registruje ho install.py na SessionStart, Notification, Stop a SessionEnd. Zapíše jeden malý JSON
súbor do ~/.claude/diktat/sessions a skončí. Nikdy nič nevypisuje a vždy končí exit 0, aby nezdržal
ani nezhodil Claude Code.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
for candidate in (HERE, HERE.parent):
    if (candidate / "diktat_core").is_dir():
        sys.path.insert(0, str(candidate))
        break


def state_dir():
    """panel.state_dir z config.json vedľa hooku, inak predvolený priečinok."""
    try:
        from diktat_core import config as cfgmod
        return (cfgmod.load_config(HERE / "config.json").get("panel", {}) or {}).get("state_dir") or None
    except Exception:  # noqa: BLE001
        return None


def main() -> int:
    try:    # stdin čítame ako bajty a dekódujeme UTF-8; inak by Windows použil kódovanie konzoly
        data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    except Exception:  # noqa: BLE001
        return 0
    if not isinstance(data, dict):
        return 0
    event = str(data.get("hook_event_name") or (sys.argv[1] if len(sys.argv) > 1 else ""))
    if not event:
        return 0
    try:
        from diktat_core import sessions
        sessions.record(event, data, state_dir())
    except Exception:  # noqa: BLE001 – hook nikdy nesmie zhodiť session
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
