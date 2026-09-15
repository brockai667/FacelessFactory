"""Načítanie konfigurácie nástroja diktat (config.json + defaulty, hlboké zlúčenie)."""
from __future__ import annotations

import copy
import json
import os
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent.parent

DEFAULTS: dict = {
    "hotkey": "numpad_decimal",  # numpad ,/Del pri pravom Enteri; alebo pynput reťazec "<f9>", "<ctrl>+<alt>+d"
    "mode": "toggle",            # toggle | hold
    "language": "sk",
    "stt": {
        "backend": "faster-whisper",   # faster-whisper | openai
        "model": "large-v3-turbo",
        "device": "auto",              # auto | cpu | cuda
        "compute_type": "auto",        # auto | int8 | float16 | ...
        "beam_size": 5,
        "vad_filter": True,
        "initial_prompt": "",
        "openai_model": "whisper-1",
        "openai_api_key_env": "OPENAI_API_KEY",
    },
    "audio": {
        "sample_rate": 16000,
        "device": None,
        "silence_auto_stop_seconds": 0,   # 0 = vypnuté (zastavuje sa len hotkey)
        "max_seconds": 900,
        "beep": True,
    },
    "cleanup": {
        "mode": "light",                  # light (default, zadarmo) | rules | llm | none
        "model": "claude-opus-5",
        "effort": "low",
        "max_tokens": 4000,
        "timeout_seconds": 25,
        "replacements": {},
    },
    "output": {
        "method": "paste",                # paste | type | print
        "paste_shortcut": "ctrl+v",
        "marker": "🎤 ",
        "markers_recognized": ["🎤", "[diktát]", "[diktat]", "[d]"],
        "auto_enter": False,
        "send_keywords": ["pošli to", "odošli to", "odošli", "pošli"],
        "restore_clipboard": True,
    },
    "hook": {
        "llm": False,
    },
    "log_dir": "logs",
}


def deep_merge(base: dict, override: dict) -> dict:
    """Vráti nový dict: `base` prepísaný hodnotami z `override` (rekurzívne pre dicty)."""
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = copy.deepcopy(value)
    return out


def find_config_path(explicit: str | os.PathLike | None = None) -> Path | None:
    """Nájde config: explicitná cesta > $DIKTAT_CONFIG > diktat/config.json > config.example.json."""
    candidates = []
    if explicit:
        candidates.append(Path(explicit))
    env = os.environ.get("DIKTAT_CONFIG")
    if env:
        candidates.append(Path(env))
    candidates.append(PACKAGE_DIR / "config.json")
    candidates.append(PACKAGE_DIR / "config.example.json")
    for path in candidates:
        if path.is_file():
            return path
    return None


def load_config(path: str | os.PathLike | None = None) -> dict:
    """Načíta config zlúčený s DEFAULTS. Chýbajúci súbor = len defaulty (nikdy nepadne)."""
    found = find_config_path(path)
    data: dict = {}
    if found is not None:
        with open(found, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    cfg = deep_merge(DEFAULTS, data)
    cfg["_path"] = str(found) if found else None
    return cfg
