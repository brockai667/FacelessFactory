# -*- coding: utf-8 -*-
"""Rychla kontrola epizody bez renderu: build + snimky v zadanych casoch.
  python engine/snap.py episodes/<x> 1.0,2.6,9.9 [dalsie epizody ...]
Snimky: episodes/<x>/build/snapshots (stare sa zmazu)."""
import os
import shutil
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")   # Windows: presmerovany vystup je cp1250
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)


def snap(ep, times):
    ep = os.path.abspath(ep)
    r = subprocess.run([sys.executable, os.path.join(HERE, "build.py"), ep], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print((r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr) else "build: bez vystupu")
    b = os.path.join(ep, "build")
    shutil.rmtree(os.path.join(b, "snapshots"), ignore_errors=True)
    HF = os.environ.get("HF_CLI", "npx hyperframes")
    r = subprocess.run(f"{HF} snapshot . --at {times} --no-end --describe false", cwd=b, shell=True,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = (r.stdout or "") + (r.stderr or "")
    errs = [l for l in out.splitlines() if "rror" in l and "0 error" not in l]
    print(os.path.basename(ep), "snimky:", len([f for f in os.listdir(os.path.join(b, "snapshots")) if f.endswith(".png")]) if os.path.isdir(os.path.join(b, "snapshots")) else 0,
          "| chyby:", errs[:3] or "ziadne")


if __name__ == "__main__":
    args = sys.argv[1:]
    times = next(a for a in args if "," in a or a.replace(".", "").isdigit())
    for ep in [a for a in args if a != times]:
        snap(ep, times)
