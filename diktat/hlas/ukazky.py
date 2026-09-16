#!/usr/bin/env python3
"""Ukážky hlasov: každý hlas sa predstaví, ty si vyberieš číslom. Výber sa uloží do config.json (sekcia hlas)
a používa ho stránka Diktat hlas cez mcp_server.py.

  python hlas/ukazky.py                       # engine z configu (default edge = Microsoft, zadarmo)
  python hlas/ukazky.py --engine elevenlabs   # ElevenLabs (kľúč: hlas.elevenlabs_api_key alebo ELEVENLABS_API_KEY)
  python hlas/ukazky.py --engine google       # Google Cloud TTS (kľúč: hlas.google_api_key alebo GOOGLE_TTS_API_KEY)
  python hlas/ukazky.py --only sk             # edge: len slovenské; --list len vypíše; --max 8 obmedzí počet
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from diktat_core import config as cfgmod  # noqa: E402
from hlas import tts  # noqa: E402

INTRO_M = "Ahoj, ja som {name}. Takto by som ti čítal, čo Claude spravil. A je hotové. B malo problém, mám dve riešenia, sú v texte."
INTRO_F = "Ahoj, ja som {name}. Takto by som ti čítala, čo Claude spravil. A je hotové. B malo problém, mám dve riešenia, sú v texte."
KEY_FIELD = {"elevenlabs": "elevenlabs_voice", "google": "google_voice", "edge": "voice"}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=list(tts.ENGINES), help="edge (Microsoft, zadarmo) | elevenlabs | google")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--only", choices=["sk", "cs", "multi"], help="edge: len časť hlasov")
    ap.add_argument("--max", type=int, default=12, help="najviac toľko ukážok (default 12)")
    ap.add_argument("--rate", default=None, help="napr. +10%% (default z configu)")
    ap.add_argument("--key", default=None, help="API kľúč (elevenlabs/google) – uloží sa do config.json")
    args = ap.parse_args(argv)

    cfg = cfgmod.load_config()
    hlas_cfg = dict(cfg.get("hlas", {}))
    engine = (args.engine or hlas_cfg.get("engine") or "edge").lower()
    if args.key:
        field = {"elevenlabs": "elevenlabs_api_key", "google": "google_api_key"}.get(engine)
        if field:
            cfgmod.save_value(cfg, f"hlas.{field}", args.key)
            hlas_cfg[field] = args.key
            print(f"✔ kľúč uložený do config.json ({field})")
    es = tts.engine_settings({**hlas_cfg, "engine": engine})
    rate = args.rate or hlas_cfg.get("rate", "+0%")
    if engine != "edge" and not es["api_key"]:
        print(f"Chýba API kľúč pre {engine}. Spusti: hlas_ukazky.bat --engine {engine} --key TVOJ_KLUC")
        return 1

    print(f"Načítavam hlasy ({engine})…", flush=True)
    try:
        voices = tts.list_engine_voices(engine, es["api_key"])
    except Exception as exc:  # noqa: BLE001
        print(f"✖ zoznam hlasov zlyhal: {exc}")
        return 1
    if engine == "edge" and args.only:
        pick = {"sk": lambda v: v["lang"].startswith("sk-"), "cs": lambda v: v["lang"].startswith("cs-"),
                "multi": lambda v: "Multilingual" in v["id"]}[args.only]
        voices = [v for v in voices if pick(v)]
    voices = voices[: max(1, args.max)]
    if not voices:
        print("Žiadne hlasy.")
        return 1

    current = hlas_cfg.get(KEY_FIELD[engine], "")
    print(f"\nEngine: {engine}   aktuálny hlas: {current or '(žiadny)'}\n")
    for i, v in enumerate(voices, 1):
        mark = "  ← aktuálny" if v["id"] == current else ""
        extra = " ".join(x for x in (v.get("gender", ""), v.get("lang", ""), v.get("note", "")) if x)
        print(f"{i:2d}. {v['name']:<22} {extra[:50]:<50} {v['id'] if v['id'] != v['name'] else ''}{mark}")
    if args.list:
        return 0

    out_dir = ROOT / "logs" / "hlasy"
    out_dir.mkdir(parents=True, exist_ok=True)
    print("\nPrehrávam ukážky (Ctrl+C preskočí na výber)…\n", flush=True)
    for i, v in enumerate(voices, 1):
        name = v["name"] if engine != "edge" else tts.friendly_name(v["id"])
        female = str(v.get("gender", "")).lower().startswith("f")
        text = (INTRO_F if female else INTRO_M).format(name=name)
        print(f"▶ {i:2d}. {name}", flush=True)
        try:
            safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in v["id"])[:60]
            path = tts.synthesize(text, v["id"], rate=rate, out=out_dir / f"{engine}_{i:02d}_{safe}.mp3",
                                  engine=engine, api_key=es["api_key"], model=es["model"])
            tts.play_file(path)
        except KeyboardInterrupt:
            print("\n(preskakujem na výber)")
            break
        except Exception as exc:  # noqa: BLE001
            print(f"   ✖ preskočené: {str(exc)[:120]}")

    try:
        choice = input("\nKtorý hlas chceš? (číslo, Enter = nechať aktuálny): ").strip()
    except (EOFError, KeyboardInterrupt):
        choice = ""
    if choice.isdigit() and 1 <= int(choice) <= len(voices):
        chosen = voices[int(choice) - 1]
        cfgmod.save_value(cfg, "hlas.engine", engine)
        path = cfgmod.save_value(cfg, f"hlas.{KEY_FIELD[engine]}", chosen["id"])
        print(f"✔ Uložené: {engine} / {chosen['name']} → {path.name}")
        try:
            tts.speak(f"Dobre, odteraz ti budem čítať ja, {chosen['name'] if engine != 'edge' else tts.friendly_name(chosen['id'])}.",
                      chosen["id"], rate=rate, engine=engine, api_key=es["api_key"], model=es["model"])
        except Exception:  # noqa: BLE001
            pass
    else:
        print("Hlas ostáva:", current or "(žiadny)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
