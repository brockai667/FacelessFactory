#!/usr/bin/env python3
"""Lokálny MCP server „diktat“ pre Claude desktop: nástroj speak(text) prečíta text nahlas zvoleným hlasom
(edge-tts, hlas.voice v config.json). Volá ho stránka Diktat hlas cez capability mcp (host:diktat),
takže hlas ide z tvojho počítača, nie z prehliadača.

Registruje ho install.py --mcp do %APPDATA%\\Claude\\claude_desktop_config.json (mcpServers.diktat).
POZOR: stdout je protokol MCP – nikdy sem neprintovať; log ide do logs/hlas.log.
"""
from __future__ import annotations

import logging
import queue
import sys
import threading
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from diktat_core import config as cfgmod  # noqa: E402
from hlas import tts  # noqa: E402

LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s", datefmt="%H:%M:%S",
                    handlers=[logging.FileHandler(LOG_DIR / "hlas.log", encoding="utf-8")], force=True)
log = logging.getLogger("diktat.hlas")

from mcp.server.fastmcp import FastMCP  # noqa: E402

mcp = FastMCP("diktat")
_queue: queue.Queue = queue.Queue()


def _worker() -> None:
    while True:
        text = _queue.get()
        try:
            cfg = cfgmod.load_config().get("hlas", {})
            es = tts.engine_settings(cfg)
            log.info("hovorím (%s/%s): %s", es["engine"], es["voice"], text[:120])
            used = tts.speak_cfg(text, cfg)
            if used != es["engine"]:
                log.info("hovoril záložný engine %s", used)
        except Exception:  # noqa: BLE001
            log.exception("prehratie zlyhalo")
        finally:
            _queue.task_done()


threading.Thread(target=_worker, daemon=True, name="tts-worker").start()


def _tool(**kwargs):
    """mcp.tool s anotáciami, ak ich verzia SDK pozná (readOnlyHint → app sa nepýta na potvrdenie)."""
    try:
        from mcp.types import ToolAnnotations
        return mcp.tool(annotations=ToolAnnotations(**kwargs))
    except Exception:  # noqa: BLE001
        return mcp.tool()


@_tool(title="Prečítaj nahlas", readOnlyHint=True, destructiveHint=False)
def speak(text: str) -> str:
    """Prečíta text nahlas zvoleným slovenským hlasom (diktat, edge-tts). Vráti sa hneď, číta na pozadí."""
    text = (text or "").strip()
    if not text:
        return "prázdny text"
    _queue.put(text[:4000])
    return "ok"


@_tool(title="Zastav čítanie", readOnlyHint=True, destructiveHint=False)
def stop() -> str:
    """Zastaví prebiehajúce čítanie a vyprázdni front."""
    try:
        while True:
            _queue.get_nowait()
            _queue.task_done()
    except queue.Empty:
        pass
    tts.stop()
    return "ok"


@_tool(title="Aktuálny hlas", readOnlyHint=True, destructiveHint=False)
def voice() -> str:
    """Vráti engine a názov aktuálne nastaveného hlasu (sekcia hlas v config.json)."""
    es = tts.engine_settings(cfgmod.load_config().get("hlas", {}))
    return f"{es['engine']}:{es['voice']}"


if __name__ == "__main__":
    log.info("MCP server diktat štartuje")
    mcp.run()
