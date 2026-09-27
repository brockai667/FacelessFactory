# -*- coding: utf-8 -*-
"""Doplnenie fronty scenarov zadarmo (Groq): kym je vo fronte menej ako --target scenarov, napise dalsi z banky tem.
  python engine/refill.py [--target 10] [--max 3]
Scenare od Groq dostanu nazov 9NN-groq-<slug>.json -> fronta je FIFO podla nazvu, takze Claude-pisane davky (001-899)
maju vzdy prednost a Groq je len zaloha na koniec fronty. Kazdy scenar prejde validatorom (compose) a banka tem sa oznaci.
Kluc: GROQ_API_KEY alebo MODELS_TOKEN v env (CI secret), inak FactoryAnim/.env."""
import glob
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
FACTORY = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import compose  # noqa: E402
import topics  # noqa: E402
import writer  # noqa: E402

QDIR = os.path.join(FACTORY, "factory", "queue")


def queue_files():
    return sorted(f for f in os.listdir(QDIR) if f.endswith(".json")) if os.path.isdir(QDIR) else []


def next_groq_name(slug):
    nums = [int(m.group(1)) for f in queue_files() + os.listdir(os.path.join(FACTORY, "factory", "done"))
            for m in [re.match(r"^(9\d\d)-groq-", f)] if m]
    return f"{(max(nums) + 1) if nums else 900:03d}-groq-{slug[:40]}.json"


def refill(target=10, maximum=3):
    os.makedirs(QDIR, exist_ok=True)
    bank = topics.load()
    topics.sync(bank)
    if len(topics.unused(bank)) < 5:
        print("banka tem: doplnam", topics.top_up(bank, 30))
    topics.save(bank)
    made = 0
    while len(queue_files()) < target and made < maximum:
        free = topics.unused(bank)
        if not free:
            print("banka tem je prazdna"); break
        topic = free[0]
        try:
            S = writer.write_spec(topic)
            S.setdefault("slug", writer.slugify(S.get("title") or topic))
            C = compose.Composer(json.loads(json.dumps(S)))
            C.validate()
            if C.warn:
                print("   validator:", "; ".join(C.warn)[:300])
            nb = len(S.get("beats", []))
            if nb < 3 or not S.get("end", {}).get("line"):
                raise ValueError(f"slaby scenar ({nb} beatov)")
            name = next_groq_name(S["slug"])
            json.dump(S, open(os.path.join(QDIR, name), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            print(f"[fronta] + {name} ({nb} beatov)")
            made += 1
        except Exception as e:
            print(f"   [refill] {topic}: {type(e).__name__}: {str(e)[:160]} -> tema preskocena")
        bank["used"].append(topic)
        topics.save(bank)
    print(f"fronta: {len(queue_files())} scenarov (pridane {made})")
    return made


if __name__ == "__main__":
    a = sys.argv[1:]
    target = int(a[a.index("--target") + 1]) if "--target" in a else 10
    maximum = int(a[a.index("--max") + 1]) if "--max" in a else 3
    refill(target, maximum)
