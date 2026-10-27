# -*- coding: utf-8 -*-
"""Doplnenie fronty scenarov zadarmo (Groq): kym je vo fronte menej ako --target scenarov, napise dalsi z banky tem.
  python engine/refill.py [--target 10] [--max 3]
Scenare od Groq dostanu nazov 9NN-groq-<slug>.json -> fronta je FIFO podla nazvu, takze Claude-pisane davky (001-899)
maju vzdy prednost a Groq je len zaloha na koniec fronty. Kazdy scenar prejde validatorom (compose) a banka tem sa oznaci.
Kazdy nove napisany scenar prejde kontrolou faktov (engine/factcheck.py: Wikipedia + Groq); zamietnuty ide do factory/queue_rejected.
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
import factcheck  # noqa: E402
import topics  # noqa: E402
import writer  # noqa: E402

QDIR = os.path.join(FACTORY, "factory", "queue")


def queue_files():
    return sorted(f for f in os.listdir(QDIR) if f.endswith(".json")) if os.path.isdir(QDIR) else []


def next_groq_name(slug):
    old = [os.path.join(FACTORY, "factory", d) for d in ("done", "queue_rejected")]
    nums = [int(m.group(1)) for f in queue_files() + [x for d in old if os.path.isdir(d) for x in os.listdir(d)]
            for m in [re.match(r"^(9\d\d)-groq-", f)] if m]
    return f"{(max(nums) + 1) if nums else 900:03d}-groq-{slug[:40]}.json"


def refill(target=10, maximum=3):
    os.makedirs(QDIR, exist_ok=True)
    claude = [f for f in queue_files() if not re.match(r"^9\d\d-groq-", f)]
    if claude:                                           # Claude davka vo fronte -> Groq nepise (27.10.: experimentalne groq spisy by ju predbehli)
        print(f"fronta: {len(claude)} Claude scenarov -> Groq doplnanie pauzne")
        return 0
    bank = topics.load()
    topics.sync(bank)
    if len(topics.unused(bank)) < 5:
        try:
            print("banka tem: doplnam", topics.top_up(bank, 30))
        except Exception as e:                           # Groq vypadok nesmie zhodit doplnanie fronty z uz existujucich tem
            print(f"   [refill] doplnenie banky zlyhalo: {type(e).__name__}: {str(e)[:120]}")
    topics.save(bank)
    made = tries = 0
    while len(queue_files()) < target and made < maximum and tries < maximum * 3:   # strop pokusov: zamietnute/zle temy nezozerru celu banku
        tries += 1
        free = topics.unused(bank)
        if not free:
            print("banka tem je prazdna"); break
        free = topics.prefer_everyday(free, len(bank["used"]))   # vaha 2:1 bezne temy (strava/spanok/mozog) vs. exoticke
        try:                                             # tyzdenny experiment moze preferovat temovu rodinu (learn.py)
            import learn
            free = learn.order_topics(free)
        except Exception:
            pass
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
            st = factcheck.check_spec(S)                 # Wikipedia + Groq; pri vypadku ok = null (scenar sa nezablokuje)
            if st == "rejected":
                dst = factcheck.save_rejected(S, name)   # nikdy sa nemaze; tema nizsie ostane oznacena ako pouzita
                print(f"[factcheck] ZAMIETNUTE -> {os.path.relpath(dst, FACTORY)}: " + " | ".join(S["factcheck"].get("bad", []))[:300])
            else:
                json.dump(S, open(os.path.join(QDIR, name), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
                print(f"[fronta] + {name} ({nb} beatov, factcheck: {st})")
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
