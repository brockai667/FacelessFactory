# -*- coding: utf-8 -*-
"""Prehľad hotových videí na kontrolu pred zverejnením: out/prehlad.jpg (3 zábery z každého videa + názov)
a tabuľka: dĺžka, zvuk OK, slučka (rozdiel prvý/posledný snímok), hlasitosť podmazu.
  python engine/review.py [slug ...]   (bez argumentov = všetky out/*.mp4 okrem _remux)"""
import os
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")   # Windows: presmerovany vystup je cp1250
    except Exception:
        pass

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
OUT = os.path.join(FACTORY, "out")
sys.path.insert(0, HERE)
from build import audio_ok  # noqa: E402
from tts import probe  # noqa: E402


def frame(mp4, t, w=270):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{t:.2f}", "-i", mp4, "-frames:v", "1", "-vf", f"scale={w}:-1",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    h = len(raw) // (w * 3)
    return Image.frombytes("RGB", (w, h), raw) if h else Image.new("RGB", (w, 480))


def loop_diff(mp4):
    a = np.asarray(frame(mp4, 0.0, 360)).astype(int)
    b = np.asarray(frame(mp4, max(0.0, probe(mp4) - 0.05), 360)).astype(int)
    return round(float((np.abs(a - b).max(axis=2) > 40).mean() * 100), 2)


def bed_db(mp4):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", mp4, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    db = 20 * np.log10(np.array([np.sqrt(np.mean(x[i:i + 1600] ** 2)) + 1e-9 for i in range(0, len(x) - 1600, 1600)]))
    return round(float(np.percentile(db, 90) - np.percentile(db, 10)), 1)


def main():
    slugs = sys.argv[1:] or sorted(f[:-4] for f in os.listdir(OUT) if f.endswith(".mp4") and "_remux" not in f)
    try:
        font = ImageFont.truetype(os.path.join(FACTORY, "assets", "fonts", "Poppins-SemiBold.ttf"), 20)
    except Exception:
        font = None
    tiles, rows = [], []
    for s in slugs:
        mp4 = os.path.join(OUT, s + ".mp4")
        dur = probe(mp4)
        ok, nbad, nwarn = audio_ok(mp4)
        rows.append(f"{s:34s} {dur:5.1f} s | zvuk {'OK' if ok else 'CHYBA'} | slučka {loop_diff(mp4):4.2f} % | hlas-podmaz {bed_db(mp4):4.1f} dB")
        title = (open(os.path.join(OUT, s + ".txt"), encoding="utf-8").readline().strip() if os.path.exists(os.path.join(OUT, s + ".txt")) else s)
        t = Image.new("RGB", (3 * 270 + 20, 480 + 40), (30, 30, 34))
        d = ImageDraw.Draw(t)
        d.text((8, 8), title[:60], fill=(240, 240, 240), font=font)
        for i, fr in enumerate((0.25, 0.55, 0.85)):
            t.paste(frame(mp4, dur * fr), (5 + i * 275, 36))
        tiles.append(t)
    cols = 2
    W, H = tiles[0].width, tiles[0].height
    sheet = Image.new("RGB", (cols * W, ((len(tiles) + cols - 1) // cols) * H), (20, 20, 24))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * W, (i // cols) * H))
    sheet.save(os.path.join(OUT, "prehlad.jpg"), quality=86)
    print("\n".join(rows))
    print("prehlad:", os.path.join(OUT, "prehlad.jpg"))


if __name__ == "__main__":
    main()
