#!/usr/bin/env python3
"""
Generator davky videi z banky tem (topics_bank.json).

- Vyberie N tem, ktore este neboli pouzite (stav v used_topics.json).
- Pre kazdu vytvori scripts/auto_<slug>.json a vyrenderuje video cez make_video.py.
- Tym padom sa tema NIKDY nezopakuje.

Pouzitie:
  python generate_batch.py            # default 10 videi
  python generate_batch.py 5          # 5 videi
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
BANK = os.path.join(ROOT, "topics_bank.json")
STATE = os.path.join(ROOT, "used_topics.json")


def slug(t):
    return re.sub(r"[^a-z0-9]+", "_", t.lower()).strip("_")[:50] or "video"


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    bank = json.load(open(BANK, encoding="utf-8"))
    used = json.load(open(STATE, encoding="utf-8")) if os.path.exists(STATE) else []

    remaining = [t for t in bank if t["title"] not in used]
    if not remaining:
        print("Vsetky temy z banky su uz pouzite. Pridaj nove do topics_bank.json.")
        return
    batch = remaining[:n]
    if len(batch) < n:
        print(f"[pozn.] V banke ostava len {len(batch)} nepouzitych tem (chcel si {n}).")

    os.makedirs(os.path.join(ROOT, "scripts"), exist_ok=True)
    made = []
    for i, spec in enumerate(batch, 1):
        title = spec["title"]
        path = os.path.join(ROOT, "scripts", f"auto_{slug(title)}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(spec, f, ensure_ascii=False, indent=2)
        print(f"\n===== [{i}/{len(batch)}] {title} =====")
        r = subprocess.run([sys.executable, os.path.join(ROOT, "make_video.py"), path])
        if r.returncode == 0:
            made.append(title)
            used.append(title)
            json.dump(used, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        else:
            print(f"[CHYBA] render zlyhal pre: {title}")

    print(f"\n========== HOTOVO: vyrobenych {len(made)} videi ==========")
    for t in made:
        print("  +", t)
    print(f"Zostava nepouzitych tem v banke: {len([t for t in bank if t['title'] not in used])}")


if __name__ == "__main__":
    main()
