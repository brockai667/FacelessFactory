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
        "chunk_seconds": 15,           # priebežný prepis: rež audio v pauzách po ~15 s (0 = až po stope)
        "chunk_max_seconds": 30,       # ak pauza nepríde, odrež natvrdo po 30 s
        "chunk_silence_rms": 0.008,    # čo je „ticho“ pri hľadaní pauzy
        "openai_model": "whisper-1",
        "openai_api_key_env": "OPENAI_API_KEY",
    },
    "audio": {
        "sample_rate": 16000,
        "device": None,
        "silence_auto_stop_seconds": 0,   # 0 = vypnuté (zastavuje sa len hotkey)
        "max_seconds": 900,
        "beep": True,
        "gate_rms": 0,                    # hlasitostná brána: tichšie bloky (vzdialené hlasy, hudba) sa vymažú; 0 = vypnuté
        "gate_hangover_seconds": 0.4,     # dozvuk po hlasnom bloku, aby sa neodrezali konce slov
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
        "send_keywords": ["pošli to", "odošli to", "poslať to", "odoslať to", "pošli", "odošli", "poslať",
                          "odoslať", "odoslanie", "enter", "send"],
        "restore_clipboard": False,      # text ostane v schránke → záloha: ručné Ctrl+V
    },
    "hook": {
        "llm": False,
    },
    "tray": {
        "notify": True,               # oznámenia Windows (režim --tray)
        "notify_start_stop": True,    # aj pri štarte a konci nahrávania (nie len po vložení)
    },
    "overlay": {
        "enabled": True,              # prúžok navrchu obrazovky so stavom (nahrávam / prepisujem / vložené)
        "alpha": 0.92,
        "font_size": 12,
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


def save_value(cfg: dict, dotted_key: str, value) -> Path:
    """Zapíše jednu hodnotu (napr. "audio.gate_rms") do používateľského config.json a vráti jeho cestu.
    Ak zatiaľ existuje len config.example.json, vytvorí config.json ako jeho kópiu s touto zmenou."""
    path = Path(cfg.get("_path") or "")
    if not path.is_file() or path.name != "config.json":
        target = PACKAGE_DIR / "config.json"
        data = {}
        src = path if path.is_file() else PACKAGE_DIR / "config.example.json"
        if src.is_file():
            with open(src, "r", encoding="utf-8") as fh:
                data = json.load(fh)
        path = target
    else:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    node = data
    keys = dotted_key.split(".")
    for k in keys[:-1]:
        node = node.setdefault(k, {})
    node[keys[-1]] = value
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    return path
