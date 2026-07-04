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
    """Prevedie nazov temy na bezpecny nazov suboru: lowercase, nealfanum. znaky -> '_', max 50 znakov."""
    return re.sub(r"[^a-z0-9]+", "_", t.lower()).strip("_")[:50] or "video"


def main():
    """Vezme prvych N nepouzitych tem z banky, vyrenderuje kazdu cez make_video.py a oznaci
    ako pouzitu (used_topics.json) len ak render uspel - zlyhane sa skusia znova nabuduce."""
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    with open(BANK, encoding="utf-8") as f:
        bank = json.load(f)
    used = []
    if os.path.exists(STATE):
        with open(STATE, encoding="utf-8") as f:
            used = json.load(f)

    remaining = [t for t in bank if t["title"] not in used]
    # preferuj temy NOVEHO (PRO) formatu
    remaining.sort(key=lambda t: 0 if t.get("scenes") else 1)
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
        try:
            renderer = "pro_engine.py" if spec.get("scenes") else "make_video.py"
            r = subprocess.run([sys.executable, os.path.join(ROOT, renderer), path])
            ok = r.returncode == 0
        except OSError as e:
            # napr. make_video.py alebo interpreter sa nepodarilo spustit -> tato tema zlyhala,
            # ale davka pokracuje dalsou (skusi sa znova nabuduce, nie je v used_topics.json)
            print(f"[CHYBA] nepodarilo sa spustit make_video.py pre '{title}': {str(e)[:200]}")
            ok = False
        if ok:
            made.append(title)
            used.append(title)
            with open(STATE, "w", encoding="utf-8") as sf:
                json.dump(used, sf, ensure_ascii=False, indent=2)
        else:
            print(f"[CHYBA] render zlyhal pre: {title}")

    print(f"\n========== HOTOVO: vyrobenych {len(made)} videi ==========")
    for t in made:
        print("  +", t)
    print(f"Zostava nepouzitych tem v banke: {len([t for t in bank if t['title'] not in used])}")


if __name__ == "__main__":
    main()
