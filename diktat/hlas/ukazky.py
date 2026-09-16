#!/usr/bin/env python3
"""Ukážky hlasov: každý dostupný slovenský/český/viacjazyčný hlas sa predstaví, ty si vyberieš číslom.
Výber sa uloží do config.json (hlas.voice) a používa ho stránka Diktat hlas cez mcp_server.py.

  python hlas/ukazky.py            # prehrá ukážky, spýta sa na číslo
  python hlas/ukazky.py --list     # len vypíše hlasy
  python hlas/ukazky.py --only sk  # len slovenské (sk), české (cs) alebo viacjazyčné (multi)
"""
from __future__ import annotations

import argparse
import asyncio
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


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--only", choices=["sk", "cs", "multi"], help="len časť hlasov")
    ap.add_argument("--rate", default=None, help="napr. +10%% (default z configu)")
    args = ap.parse_args(argv)

    cfg = cfgmod.load_config()
    hlas_cfg = cfg.get("hlas", {})
    rate = args.rate or hlas_cfg.get("rate", "+0%")
    print("Načítavam zoznam hlasov (Microsoft edge-tts)…", flush=True)
    voices = tts.candidate_voices(asyncio.run(tts.list_voices_async()))
    if args.only == "sk":
        voices = [v for v in voices if v["Locale"].startswith("sk-")]
    elif args.only == "cs":
        voices = [v for v in voices if v["Locale"].startswith("cs-")]
    elif args.only == "multi":
        voices = [v for v in voices if "Multilingual" in v["ShortName"]]
    if not voices:
        print("Žiadne hlasy – skontroluj internet (edge-tts potrebuje pripojenie).")
        return 1

    current = hlas_cfg.get("voice", tts.DEFAULT_VOICE)
    print(f"\nAktuálne nastavený hlas: {current}\n")
    for i, v in enumerate(voices, 1):
        mark = "  ← aktuálny" if v["ShortName"] == current else ""
        print(f"{i:2d}. {tts.friendly_name(v['ShortName']):<10} {v['Gender']:<7} {v['Locale']:<6} {v['ShortName']}{mark}")
    if args.list:
        return 0

    out_dir = ROOT / "logs" / "hlasy"
    out_dir.mkdir(parents=True, exist_ok=True)
    print("\nPrehrávam ukážky (Ctrl+C preruší)…\n", flush=True)
    for i, v in enumerate(voices, 1):
        name = tts.friendly_name(v["ShortName"])
        text = (INTRO_F if v.get("Gender") == "Female" else INTRO_M).format(name=name)
        print(f"▶ {i:2d}. {name} ({v['Gender']}, {v['Locale']})", flush=True)
        try:
            path = tts.synthesize(text, v["ShortName"], rate=rate, out=out_dir / f"{i:02d}_{v['ShortName']}.mp3")
            tts.play_file(path)
        except KeyboardInterrupt:
            print("\n(prerušené)")
            break
        except Exception as exc:  # noqa: BLE001
            print(f"   ✖ {exc}")

    try:
        choice = input("\nKtorý hlas chceš? (číslo, Enter = nechať aktuálny): ").strip()
    except (EOFError, KeyboardInterrupt):
        choice = ""
    if choice.isdigit() and 1 <= int(choice) <= len(voices):
        chosen = voices[int(choice) - 1]["ShortName"]
        path = cfgmod.save_value(cfg, "hlas.voice", chosen)
        print(f"✔ Uložené: {chosen} → {path.name}")
        try:
            tts.speak(f"Dobre, odteraz ti budem čítať ja, {tts.friendly_name(chosen)}.", chosen, rate=rate)
        except Exception:  # noqa: BLE001
            pass
    else:
        print("Hlas ostáva:", current)
    return 0


if __name__ == "__main__":
    sys.exit(main())
