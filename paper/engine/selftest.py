# -*- coding: utf-8 -*-
"""Rychly samotest fabriky bez renderu (na lokal aj CI): syntax kniznic, validator vsetkych scenarov, banka tem.
  python engine/selftest.py            -> 0 = OK, 1 = chyba (vypise co)
Kontroluje: node --check lib/*.js | compose (validator) pre specs/*.json, factory/queue/*.json, factory/done/*.json
| kazdy scenar ma povinne kluce | sceny/recepty zname (compose hlasi varovania) | topics.json ma nepouzite temy."""
import glob
import json
import os
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import compose  # noqa: E402

errors, warns = [], []


def v2_check(S, script):
    """pravidla davky v2 (10.-12. 11. 2026): jedna myslienka, stitok testu, overene fakty so zdrojmi, zapojenie divaka, bez pauz"""
    out = []
    t = S.get("test") or {}
    if t.get("hook") not in ("A", "B") or not t.get("engage"):
        out.append('chyba stitok "test": {"hook": "A"|"B", "engage": "..."}')
    if (t.get("hook") == "B") != (S.get("hook_mode") == "B"):
        out.append("test.hook a hook_mode si odporuju")
    for k in ("idea", "description", "tags"):
        if not S.get(k):
            out.append(f"chyba kluc {k}")
    facts = S.get("facts") or []
    if len(facts) < 3 or any(not (isinstance(x, dict) and x.get("claim") and x.get("source")) for x in facts):
        out.append("facts: treba aspon 3 tvrdenia, kazde so zdrojom")
    if (S.get("factcheck") or {}).get("ok") is not True:
        out.append("factcheck.ok nie je true (fakty neoverene)")
    lines = [S.get("hook", "")] + [b.get("line", "") for b in S.get("beats", [])] + [(S.get("end") or {}).get("line", "")]
    words = sum(len(x.split()) for x in lines)
    if not 60 <= words <= 125:                            # ~25-48 s pri tomto hlase
        out.append(f"dlzka: {words} slov (cakane 60-125)")
    for b in S.get("beats", []):
        for sh in b.get("shots") or []:
            if len(sh.get("do") or []) > 6:
                out.append(f"{b.get('key', '?')}: {len(sh['do'])} akcii v zabere (max 6, zvysok by sa zahodil)")
        if not any(sh.get("do") for sh in b.get("shots") or []):
            out.append(f"veta bez deja na obraze: {b.get('line', '')[:40]}")
    if S.get("gap", 0.14) > 0.25:
        out.append("gap > 0.25 s (pauzy medzi vetami)")
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tf:
        tf.write(script)
    r = subprocess.run(["node", "--check", tf.name], capture_output=True, text=True, encoding="utf-8", errors="replace")
    os.unlink(tf.name)
    if r.returncode != 0:
        out.append("script.js: " + (r.stderr or "").strip().splitlines()[-1][:160])
    return out

# 1) syntax kniznic
for f in sorted(glob.glob(os.path.join(FACTORY, "lib", "*.js"))):
    r = subprocess.run(["node", "--check", f], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        errors.append(f"node --check {os.path.basename(f)}: {(r.stderr or '').strip()[:200]}")

# 2) validator + compose kazdeho scenara (bez zapisu epizody)
files = sorted(glob.glob(os.path.join(FACTORY, "specs", "*.json")) + glob.glob(os.path.join(FACTORY, "specs", "v2", "*.json")) +
               glob.glob(os.path.join(FACTORY, "factory", "queue", "*.json")) + glob.glob(os.path.join(FACTORY, "factory", "done", "*.json")))
files = [f for f in files if not os.path.basename(f).startswith(("_mx_", "_test_"))]
for f in files:
    try:
        S = json.load(open(f, encoding="utf-8"))
        S.setdefault("slug", os.path.basename(f)[:-5])   # scenare vo fronte dostanu slug az od factory.py
        for k in ("title", "hook", "banner", "env", "beats", "end"):
            if k not in S:
                errors.append(f"{os.path.relpath(f, FACTORY)}: chyba kluc {k}")
        if "hero" not in S and "direction" not in S and "queue" not in f and "done" not in f:
            warns.append(f"{os.path.relpath(f, FACTORY)}: bez hero/direction (doplni ju factory.py)")
        C = compose.Composer(json.loads(json.dumps(S)))
        ep, script = C.compose()
        if S.get("v") == 2:                               # v2 je rucne zreziravane: kazde varovanie validatora je chyba
            rel = os.path.relpath(f, FACTORY)
            for w in C.warn:
                errors.append(f"{rel}: {w}")
            errors.extend(f"{rel}: {e}" for e in v2_check(S, script))
        else:
            for w in C.warn:
                warns.append(f"{os.path.relpath(f, FACTORY)}: {w}")
    except Exception as e:
        errors.append(f"{os.path.relpath(f, FACTORY)}: {type(e).__name__}: {str(e)[:160]}")

# 3) banka tem
try:
    bank = json.load(open(os.path.join(FACTORY, "factory", "topics.json"), encoding="utf-8"))
    free = [t for t in bank.get("topics", []) if t not in bank.get("used", [])]
    if len(free) < 5:
        warns.append(f"topics.json: malo nepouzitych tem ({len(free)}) -> python engine/topics.py --top-up 40")
    q = glob.glob(os.path.join(FACTORY, "factory", "queue", "*.json"))
    if len(q) < 3:
        warns.append(f"fronta: len {len(q)} scenare -> dopisat davku podla factory/WRITING.md")
except Exception as e:
    errors.append(f"topics.json: {e}")

# 4) kontrola faktov (factcheck.py): offline test s atrapami Groq + Wikipedie (bez siete a kluca)
import test_factcheck  # noqa: E402
for e in test_factcheck.run():
    errors.append("factcheck: " + e)
unchecked = [f for f in glob.glob(os.path.join(FACTORY, "factory", "queue", "*.json"))
             if json.load(open(f, encoding="utf-8")).get("source") == "groq" and (json.load(open(f, encoding="utf-8")).get("factcheck") or {}).get("ok") is not True]
if unchecked:
    warns.append(f"{len(unchecked)} groq scenarov vo fronte bez overenia faktov -> python engine/factcheck.py --queue")

# 5) samoucenie (learn.py): offline test s atrapami videos.json + Groq. Len varovanie: experimenty nesmu zastavit denne video
try:
    import test_learn  # noqa: E402
    for e in test_learn.run():
        warns.append("learn (samoucenie): " + e)
except Exception as e:
    warns.append(f"learn (samoucenie): test nespusteny: {type(e).__name__}: {str(e)[:160]}")

# 6) pisanie (writer.py): rotacia hakov, A/B koniec, vaha tem 2:1 - offline, bez Groq
try:
    import test_writer  # noqa: E402
    for e in test_writer.run():
        errors.append("writer: " + e)
except Exception as e:
    errors.append(f"writer: test nespusteny: {type(e).__name__}: {str(e)[:160]}")

print(f"selftest: {len(files)} scenarov, {len(errors)} chyb, {len(warns)} varovani")
for e in errors:
    print("  CHYBA:", e)
for w in warns:
    print("  varovanie:", w)
sys.exit(1 if errors else 0)
