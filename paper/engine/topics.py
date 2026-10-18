# -*- coding: utf-8 -*-
"""Banka tem factory/topics.json: automaticke doplnanie novych "What happens if ...?" tem (Groq, zadarmo) + sync s hotovymi videami.
  python engine/topics.py --sync             -> oznaci ako pouzite temy, ktore uz su v factory/done, queue alebo history
  python engine/topics.py --top-up 40        -> doplni banku tak, aby bolo aspon 40 nepouzitych tem (LLM navrhy, bez duplicit)
  python engine/topics.py --list             -> vypise nepouzite temy
  python engine/topics.py --prune            -> vyhodi jednotvarne navrhy (max 2 nepouzite temy s rovnakym uvodnym vyrazom)
Temy su len napady na scenar; fakty a scenar pise Claude (factory/WRITING.md), preto staci lacny model."""
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
FDIR = os.path.join(FACTORY, "factory")
TOPICS = os.path.join(FDIR, "topics.json")
STOP = {"what", "happens", "if", "you", "your", "a", "an", "the", "to", "of", "for", "in", "on", "at", "and", "or", "all", "every", "day", "only",
        "never", "stop", "start", "too", "much", "many", "with", "without", "do", "does", "get", "go", "keep", "just", "than", "more", "less"}
CATS = ["body & health (sleep, food, drink, exercise, habits)", "extreme environments (heat, cold, altitude, deep sea, desert, space)",
        "everyday habits (screens, sitting, caffeine, sugar, hydration, posture)", "senses & brain (noise, darkness, stress, boredom, memory)",
        "animals & nature compared to humans", "what-if physics of the body (falling, spinning, holding breath, no gravity)"]


def norm(t):
    return re.sub(r"[^a-z0-9 ]", "", t.lower()).strip()


def keys(t):
    return {w for w in norm(t).split() if w not in STOP and len(w) > 2}


def load():
    if os.path.exists(TOPICS):
        return json.load(open(TOPICS, encoding="utf-8"))
    return {"topics": [], "used": []}


def save(bank):
    json.dump(bank, open(TOPICS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def known_topics():
    """temy uz spracovane: factory/done + queue (kluc topic) + history.json"""
    out = []
    for sub in ("done", "queue"):
        d = os.path.join(FDIR, sub)
        for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            if f.endswith(".json"):
                try:
                    out.append(json.load(open(os.path.join(d, f), encoding="utf-8")).get("topic", ""))
                except Exception:
                    pass
    h = os.path.join(FDIR, "history.json")
    if os.path.exists(h):
        out += [x.get("topic", "") for x in json.load(open(h, encoding="utf-8"))]
    return [t for t in out if t]


def similar(a, b):
    ka, kb = keys(a), keys(b)
    return bool(ka) and bool(kb) and (len(ka & kb) / min(len(ka), len(kb)) >= 0.6 or norm(a) == norm(b))


def sync(bank):
    kn = known_topics()
    n = 0
    for t in bank["topics"]:
        if t not in bank["used"] and any(similar(t, k) for k in kn):
            bank["used"].append(t); n += 1
    return n


def unused(bank):
    return [t for t in bank["topics"] if t not in bank["used"]]


def lead(t):
    """uvodne sloveso temy ("eat only rice" -> "eat") -> strop na jednotvarnost (max 3 nepouzite temy s rovnakym slovesom)"""
    w = [x for x in norm(t).split() if x not in ("what", "happens", "if", "you", "your", "a", "an", "the")]
    return w[0] if w else ""


def prune(bank, cap=3):
    """v nepouzitych temach nechaj max `cap` s rovnakym uvodnym vyrazom (zvysok = jednotvarne navrhy LLM)"""
    seen, keep, drop = {}, [], []
    for t in bank["topics"]:
        if t in bank["used"]:
            keep.append(t); continue
        k = lead(t); seen[k] = seen.get(k, 0) + 1
        (keep if seen[k] <= cap else drop).append(t)
    bank["topics"] = keep
    return drop


def top_up(bank, target):
    from llm import llm_json
    need = target - len(unused(bank))
    if need <= 0:
        return 0
    have = bank["topics"] + known_topics()
    sysmsg = ("You propose short-video topics for a channel about what happens to the human body and mind in everyday and extreme situations. "
              "Return ONLY JSON: {\"topics\": [\"What happens if ...?\", ...]}.")
    prompt = (f"Propose {min(need + 6, 30)} NEW, mutually different topics, each a question starting with 'What happens if' (max 9 words, plain English, no numbers unless natural, "
              f"no medical advice, nothing gross or dangerous to imitate). Spread them across these categories: {'; '.join(CATS)}. "
              f"Avoid anything similar to these existing topics:\n- " + "\n- ".join(have[-80:]))
    out = llm_json(sysmsg, prompt, temperature=0.9, max_tokens=4000)   # gpt-oss: reasoning sa rata do max_tokens, odseknuty JSON = 400
    cand = out.get("topics", []) if isinstance(out, dict) else []
    added, seen = 0, {}
    for t in unused(bank):
        seen[lead(t)] = seen.get(lead(t), 0) + 1
    for t in cand:
        t = str(t).strip().strip('"')
        if not t.lower().startswith("what happens if") or len(t.split()) > 12:
            continue
        if not t.endswith("?"):
            t += "?"
        if any(similar(t, k) for k in have) or seen.get(lead(t), 0) >= 3:   # max 3 nepouzite temy s rovnakym slovesom
            continue
        seen[lead(t)] = seen.get(lead(t), 0) + 1
        bank["topics"].append(t); have.append(t); added += 1
        if added >= need:
            break
    return added


if __name__ == "__main__":
    bank = load()
    if "--prune" in sys.argv:
        d = prune(bank); print("vyhodene jednotvarne temy:", len(d)); save(bank)
    if "--sync" in sys.argv:
        print("sync: nove pouzite temy:", sync(bank)); save(bank)
    if "--top-up" in sys.argv:
        target = int(sys.argv[sys.argv.index("--top-up") + 1])
        sync(bank)
        print("doplnene temy:", top_up(bank, target)); save(bank)
    if "--list" in sys.argv or len(sys.argv) == 1:
        u = unused(bank)
        print(f"nepouzite temy: {len(u)} / {len(bank['topics'])}")
        for t in u:
            print("  -", t)
