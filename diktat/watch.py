#!/usr/bin/env python3
"""Strážca: maličký proces (autoštart), ktorý spustí diktat, keď sa objaví Claude / prehliadač.

Sám diktat sa vypne, keď žiadny zo sledovaných programov (`follow.processes` v configu) nebeží
dlhšie ako `follow.exit_after_seconds` – pamäť je voľná napr. na hranie. Keď ich znova zapneš,
strážca diktat do pár sekúnd naštartuje. Ak je zoznam prázdny, strážca diktat len spustí a skončí.
"""
from __future__ import annotations

import logging
import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from diktat_core import config as cfgmod, procs  # noqa: E402

POLL_SECONDS = 5
START_GRACE_SECONDS = 45      # po spustení diktatu chvíľu nekontroluj (načítava model)
log = logging.getLogger("diktat.watch")


def launch_diktat() -> None:
    py = Path(sys.executable)
    pyw = py.with_name("pythonw.exe") if py.name.lower() == "python.exe" else py
    cmd = [str(pyw if pyw.is_file() else py), str(HERE / "app.py"), "--tray"]
    flags = 0x00000008 if sys.platform == "win32" else 0            # DETACHED_PROCESS
    subprocess.Popen(cmd, cwd=str(HERE), creationflags=flags, close_fds=True,
                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    log.info("spúšťam diktat: %s", " ".join(cmd))


def main() -> int:
    cfg = cfgmod.load_config()
    log_dir = HERE / (cfg.get("log_dir") or "logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s", datefmt="%H:%M:%S",
                        handlers=[logging.FileHandler(log_dir / "watch.log", encoding="utf-8")], force=True)
    follow = [p for p in (cfg.get("follow", {}).get("processes") or []) if p]
    if not follow:
        if not procs.diktat_running():
            launch_diktat()
        return 0
    log.info("strážca beží, sledujem: %s", ", ".join(follow))
    while True:
        try:
            if procs.any_running(follow) and not procs.diktat_running():
                launch_diktat()
                time.sleep(START_GRACE_SECONDS)
        except Exception:  # noqa: BLE001
            log.exception("chyba v slučke strážcu")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    sys.exit(main())
