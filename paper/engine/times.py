# -*- coding: utf-8 -*-
"""Casy slov hotoveho buildu (pomocka pri animovani v2): python engine/times.py <slug>
Cita episodes/<slug>/build/index.html (vznikne po compose.py ... --snap alebo --render) a vypise ku kazdej vete
jej zaciatok a absolutny cas kazdeho slova. Podla toho sa vyberaju casy pre --snap (cas kotvy + 0.3 az 0.8 s)."""
import json
import os
import re
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
slug = sys.argv[1]
html = open(os.path.join(os.path.dirname(HERE), "episodes", slug, "build", "index.html"), encoding="utf-8").read()
VO = json.loads(re.search(r"window\.__VO = (\{.*?\});", html, re.S).group(1))
for k, st in sorted(VO["start"].items(), key=lambda kv: kv[1]):
    print(f"{k:5} {VO['seg'][k][0]:6.2f}-{VO['seg'][k][1]:6.2f} | " + "  ".join(f"{w['w']}@{st + w['s']:.2f}" for w in VO["words"][k]))
print(f"spolu {VO['total']:.2f} s")
