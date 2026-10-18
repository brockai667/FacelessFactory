# -*- coding: utf-8 -*-
"""Automaticka kontrola faktov scenara (Groq ho napisal -> Wikipedia ho overi). Zadarmo: Wikipedia API bez kluca + Groq.
  python engine/factcheck.py --queue [--max N]   -> skontroluje vsetky nekontrolovane groq scenare vo factory/queue
  python engine/factcheck.py <scenar.json>       -> skontroluje jeden scenar a zapise don vysledok
Postup: 1) zdroj = 1-2 clanky Wikipedie (~3500 znakov, vybrane vety podla slov scenara)
2) Groq vypise kazde konkretne tvrdenie (mena, cisla, datumy, miesta, mechanizmy) s verdiktom supported / unsupported / contradicted
3) contradicted (alebo >2 unsupported konkretne mena/cisla) => JEDNO prepisanie len chybnych riadkov (posle sa iba zoznam chyb
   + opravy, nie cely scenar) a opakovana kontrola; stale zle => rejected: presun do factory/queue_rejected (nikdy sa nemaze),
   tema ostane oznacena ako pouzita
4) vysledok je v scenari: "factcheck": {"ok": true|false|null, "checked_at", "source": [url], "fixed": n}; Wikipedia URL nahradi
   vseobecne zdroje v "facts". Wikipedia/Groq nedostupne => ok = null (scenar sa nezablokuje, render ho zaradi az za overene).
Kluc: GROQ_API_KEY / MODELS_TOKEN (cita ho engine/llm.py, nikdy sa nevypisuje)."""
import datetime
import json
import os
import re
import shutil
import sys
import time
import unicodedata
import urllib.parse

import requests

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
sys.path.insert(0, HERE)

# ===== ADAPTER (cesty a tvar scenara; zvysok suboru je rovnaky v oboch fabrikach) =====
FDIR = os.path.join(FACTORY, "factory")
QDIR = os.path.join(FDIR, "queue")
RDIR = os.path.join(FDIR, "queue_rejected")      # sem ide scenar, ktory neprejde kontrolou (nikdy sa nemaze)
N_ARTICLES = 2
LINE_WORDS = (3, 26)                              # povolena dlzka prepisaneho hovoreneho riadka (slov)


def _it(iid, path, kind, ctx=None):
    return {"id": iid, "path": tuple(path), "kind": kind, "ctx": ctx}


def collect(S):
    """texty na kontrolu: hook, riadky beatov, koncovy riadok + text na obrazovke (stat karty)"""
    items = []
    if S.get("hook"):
        items.append(_it("h", ("hook",), "line"))
    for i, b in enumerate(S.get("beats") or []):
        if b.get("line"):
            items.append(_it(f"b{i}", ("beats", i, "line"), "line", b.get("label")))
        for j, sh in enumerate(b.get("shots") or []):
            if isinstance(sh, dict) and sh.get("panel") == "stat":
                for k in ("big", "small"):
                    if sh.get(k):
                        items.append(_it(f"b{i}s{j}{k[0]}", ("beats", i, "shots", j, k), "screen"))
    if isinstance(S.get("end"), dict) and S["end"].get("line"):
        items.append(_it("e", ("end", "line"), "line"))
    return items


def source_queries(S):
    """hladane vyrazy pre Wikipediu: najprv clanky, ktore navrhne Groq (temy typu "co ak..." nemaju priamy clanok), potom nazov/tema"""
    q = []
    try:
        plan = _llm("You name English Wikipedia articles. Return ONLY JSON.",
                    "Script topic: " + str(S.get("topic") or S.get("title")) + "\nTitle: " + str(S.get("title")) +
                    "\nSpoken lines:\n" + "\n".join(str(b.get("line")) for b in S.get("beats") or [])[:900] +
                    '\n\nGive up to 3 exact titles of English Wikipedia articles that best document the FACTS of this script '
                    '(the physiology / phenomenon itself, not the video). Return {"titles": ["...", "..."]}.',
                    temperature=0.1, max_tokens=1500, effort="low")
        q += [str(t) for t in (plan.get("titles") or []) if isinstance(t, str)][:3]
    except Exception as e:
        print(f"   [factcheck] navrh clankov zlyhal ({str(e)[:80]}) -> hladam podla temy")
    t = re.sub(r"^\s*what happens if (you |your |we )?", "", str(S.get("topic") or ""), flags=re.I).strip(" ?")
    return q + [x for x in (S.get("title"), t) if x]


def mark_topic_used(S):
    """zamietnuta tema ostane v banke ako pouzita (refill si vyberie inu)"""
    import topics
    bank = topics.load()
    t = S.get("topic")
    if t:
        if t not in bank["topics"]:
            bank["topics"].append(t)
        if t not in bank["used"]:
            bank["used"].append(t)
        topics.save(bank)
# ===== KONIEC ADAPTERA =====

UA = "FacelessFactoryFactcheck/1.0 (https://github.com/brockai667/FacelessFactory; automaticka kontrola faktov, nizky objem)"
API = "https://en.wikipedia.org/w/api.php"
SRC_CHARS = 3500            # zdroj spolu; Groq free ma 8k TPM VRATANE max_tokens -> prompt + max_tokens drzat pod ~7k
SHRINK = (1.0, 0.6, 0.35)   # pri 413 skracujeme zdroj
MAX_UNSUPPORTED = 2         # viac nepodlozenych konkretnych mien/cisel = zamietnut
MAX_TOKENS = 3500
CHECK_EFFORT = "low"         # medium zachytilo o malo viac, ale 2x viac 429 (TPM); podmienky mechanizmov model aj tak zachyti len niekedy

_TR = {"‑": "-", "–": "-", "—": " - ", "‘": "'", "’": "'", "“": '"', "”": '"', " ": " ", "…": "..."}


def _ascii(t):
    t = str(t)
    for k, v in _TR.items():
        t = t.replace(k, v)
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", t)).strip()


def _now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")


def _get(S, p):
    for k in p:
        S = S[k]
    return S


def _set(S, p, v):
    _get(S, p[:-1])[p[-1]] = v


def _llm(system, prompt, **kw):
    from llm import llm_json
    return llm_json(system, prompt, **kw)


# ---------- Wikipedia

def _wget(params):
    for att in range(2):
        r = requests.get(API, params=dict(params, format="json", formatversion="2"), headers={"User-Agent": UA}, timeout=20)
        if r.status_code == 429 and att == 0:
            time.sleep(8)
            continue
        r.raise_for_status()
        j = r.json()
        if "error" in j:
            raise RuntimeError("wikipedia: " + str(j["error"].get("info", ""))[:100])
        return j


def _search(query):
    j = _wget({"action": "query", "list": "search", "srsearch": query, "srlimit": 3, "srnamespace": 0})
    return [h["title"] for h in j.get("query", {}).get("search", [])]


def _extract(title):
    j = _wget({"action": "query", "prop": "extracts", "explaintext": 1, "exlimit": 1, "titles": title, "redirects": 1})
    for p in j.get("query", {}).get("pages", []):
        if p.get("extract"):
            return p["title"], p["extract"]
    return None


def wiki_articles(queries, n=N_ARTICLES):
    """[(nazov, cely text)] - z kazdeho hladaneho vyrazu najlepsi nenulovy clanok (bez rozcestnikov), max n"""
    out = []
    for q in queries:
        if len(out) >= n:
            break
        hits = _search(q)
        if not hits:
            continue
        got = _extract(hits[0])
        if not got or len(got[1]) < 400 or "may refer to" in got[1][:300] or got[0] in [a[0] for a in out]:
            continue
        out.append(got)
    return out


_STOP = set("this that with from have were been they their there which about after before when what while into over than then also would "
            "could should these those them his her its not but and for the are was has had one two".split())


def _stem(w):
    return w[:4]          # "Pennant" ~ "Penniston": aj preklep v scenari nasmeruje na spravnu vetu zdroja


def _kw(text):
    kw = {}
    for m in re.finditer(r"[A-Za-z0-9][A-Za-z0-9'-]*", text):
        w = m.group(0)
        lw = w.lower()
        if lw in _STOP or len(lw) < 3:
            continue
        kw[_stem(lw)] = max(kw.get(_stem(lw), 0), 2 if (w[0].isupper() or w[0].isdigit()) else 1)
    return kw


def select_text(extract, script, budget):
    """vety clanku: uvod + vety s najviac slovami zo scenara (mena/cisla maju vahu 2), v povodnom poradi, spolu <= budget znakov"""
    sents = []
    for para in extract.split("\n"):
        para = para.strip()
        if para and not para.startswith("="):
            sents += [s.strip()[:500] for s in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(])", para) if s.strip()]
    if not sents:
        return ""
    kw = _kw(script)

    def score(s):
        have = {_stem(x.lower()) for x in re.findall(r"[A-Za-z0-9]+", s)}
        return sum(wt for st, wt in kw.items() if st in have)

    chosen, used = set(), 0
    for i, s in enumerate(sents[:3]):                    # uvod clanku vzdy (kontext)
        if chosen and used + len(s) + 1 > budget * 0.4:
            break
        chosen.add(i)
        used += len(s) + 1
    for i in sorted(range(len(sents)), key=lambda i: (-score(sents[i]), i)):
        if i in chosen:
            continue
        if score(sents[i]) <= 0:
            break
        if used + len(sents[i]) + 1 <= budget:
            chosen.add(i)
            used += len(sents[i]) + 1
    for i in range(len(sents)):                          # zvysok miesta: nasledujuce vety v poradi
        if i not in chosen and used + len(sents[i]) + 1 <= budget * 0.8:
            chosen.add(i)
            used += len(sents[i]) + 1
    return " ".join(sents[i] for i in sorted(chosen))[:budget]


def build_source(arts, script, budget):
    per = max(300, budget // max(1, len(arts)))
    return "\n\n".join(f"[Wikipedia: {t}]\n{select_text(ex, script, per)}" for t, ex in arts)


def wiki_url(title):
    return "https://en.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"), safe="_(),'")


# ---------- kontrola (Groq)

SYS_CHECK = """You are a strict fact-checker for a short video script. You get SOURCE (Wikipedia excerpts) and numbered TEXTS
(spoken lines and short on-screen texts). List the concrete factual claims in the TEXTS: names, numbers, dates, places, objects,
mechanisms. Skip questions, opinions and pure framing. Check the CONDITIONS too: if the SOURCE says a mechanism needs a specific trigger (for example
the diving reflex needs cold water on the face, not just floating or swimming) and the scenario in TOPIC does not have that trigger,
the claim is contradicted. For each claim give a verdict:
- "supported": the SOURCE states it or clearly implies it.
- "contradicted": the SOURCE says something different (wrong or misspelled name, number, date, place, cause) OR it is plainly false by
  well-established knowledge. Put the exact correct fact in "correction" (copy the right name/number from the SOURCE).
- "unsupported": not in the SOURCE and not contradicted - cannot be verified.
"specific" is true ONLY when the claim contains a proper name, a number (digits or words), a date or a place. Ordinary effects ("feet may swell", "the heart beats faster") are NOT specific.
Return ONE JSON object: {"claims":[{"id":"b0","claim":"short claim (max 15 words)","verdict":"supported|unsupported|contradicted","specific":true|false,"correction":"only for contradicted"}]}
At most 16 claims; always include every name and number you find. Judge only the text, ignore writing style."""

SYS_FIX = """You are a careful copy editor fixing factual errors in a short video script. You get a few texts, each with the wrong claims
found in it and the correct fact. Rewrite ONLY those texts: replace every wrong fact with the given correction; when the correction
is missing or you are not sure, generalize (drop the exact name/number/date, say "a witness", "in the 1980s"). Never add new
specific facts. Keep the tone, keep about the same length, keep the listed KEEP words if they are still true. On-screen texts stay UPPERCASE
and short. Return ONE JSON object: {"fixes":[{"id":"b0","text":"..."}]} with one entry per given id."""


def _is_413(e):
    return str(e).startswith("413")


def _ask(system, prompt, **kw):
    """volanie LLM; pri 413 vyhodi vynimku, ktoru zachyti volajuci"""
    return _llm(system, prompt, temperature=0.1, max_tokens=MAX_TOKENS, effort=CHECK_EFFORT, fail_413=True, **kw)


def run_check(S, arts, items):
    """Groq: zoznam tvrdeni s verdiktom. Pri 413 skracuje zdroj. Vracia (claims, pouzity_budget)"""
    texts = "\n".join(f"{it['id']}" + (f" [{it['ctx']}]" if it.get("ctx") else "") + f": {_get(S, it['path'])}" for it in items)
    script = " ".join(str(_get(S, it["path"])) for it in items)
    last = None
    for f in SHRINK:
        src = build_source(arts, script, int(SRC_CHARS * f))
        prompt = f"TOPIC: {S.get('topic') or S.get('title')} (title: {S.get('title')})\n\nSOURCE:\n{src}\n\nTEXTS (id: text):\n{texts}"
        try:
            out = _ask(SYS_CHECK, prompt)
        except Exception as e:
            last = e
            if _is_413(e):
                print(f"   [factcheck] 413 -> skracujem zdroj na {int(SRC_CHARS * f * 0.6)} znakov")
                continue
            raise
        cl = out.get("claims") if isinstance(out, dict) else None
        if not isinstance(cl, list):
            raise ValueError("kontrola nevratila claims")
        res = []
        for c in cl:
            if not isinstance(c, dict):
                continue
            v = str(c.get("verdict", "")).strip().lower()
            v = "contradicted" if v.startswith("contra") else "supported" if v.startswith("support") else "unsupported"
            res.append({"id": str(c.get("id", "")).strip(), "claim": _ascii(c.get("claim", ""))[:160], "verdict": v,
                        "specific": c.get("specific") in (True, "true", "True", 1), "correction": _ascii(c.get("correction") or "")[:200]})
        return res
    raise last or RuntimeError("kontrola zlyhala")


_NUMW = re.compile(r"(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|percent|half|double|triple)", re.I)


def is_specific(c):
    """konkretne = model to povedal A tvrdenie ma cislo/ciselne slovo alebo vlastne meno (velke pismeno mimo zaciatku)"""
    t = c["claim"]
    return bool(c["specific"] and (re.search(r"\d", t) or _NUMW.search(t) or re.search(r"(?<=[a-z,] )[A-Z][a-z]+", t)))


def judge(claims):
    contra = [c for c in claims if c["verdict"] == "contradicted"]
    unsup = [c for c in claims if c["verdict"] == "unsupported" and is_specific(c)]
    return contra, unsup


def _anchors(S, it):
    if it["path"][0] != "beats":
        return []
    out = []

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ("at", "from") and isinstance(v, str):
                    out.append(v.partition("#")[0])
                else:
                    walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(S["beats"][it["path"][1]].get("shots"))
    return out


def run_rewrite(S, items, bad):
    """JEDNO prepisanie: posielame len texty s chybami + zoznam chyb (nie cely scenar). Vracia {id: novy text}"""
    by = {it["id"]: it for it in items}
    groups = {}
    for c in bad:
        if c["id"] in by:
            groups.setdefault(c["id"], []).append(c)
    if not groups:
        return {}
    blocks = []
    for iid, cs in groups.items():
        it = by[iid]
        probs = "; ".join(f'WRONG: "{c["claim"]}"' + (f' -> CORRECT: {c["correction"]}' if c["correction"] else " (cannot verify: generalize)") for c in cs)
        keep = ", ".join(sorted({a for a in _anchors(S, it) if a}))
        blocks.append(f'{iid} ({"spoken line" if it["kind"] == "line" else "on-screen text, UPPERCASE, max %d chars" % (len(_get(S, it["path"])) + 4)}): '
                      f'"{_get(S, it["path"])}"\n   PROBLEMS: {probs}' + (f"\n   KEEP words: {keep}" if keep and it["kind"] == "line" else ""))
    prompt = f"TOPIC: {S.get('title') or S.get('topic')}\n\nFIX THESE TEXTS:\n" + "\n".join(blocks)
    out = _llm(SYS_FIX, prompt, temperature=0.2, max_tokens=2000, effort="low")
    fixes = {}
    for f in (out.get("fixes") if isinstance(out, dict) else None) or []:
        if isinstance(f, dict) and f.get("id") in groups and isinstance(f.get("text"), str):
            fixes[f["id"]] = _ascii(f["text"])
    return fixes


def _words(s):
    return re.findall(r"[a-z0-9]+", s.lower())


def reanchor(beat):
    """po zmene riadka: kotvy ("at"/"from"), ktore uz vo vete nie su, nahradi slovom z noveho riadka (rovnomerne po vete)"""
    ws = _words(beat.get("line", ""))
    pool = [w for w in ws if len(w) >= 4] or ws
    if not pool:
        return
    cnt = [0]

    def walk(o):
        if isinstance(o, dict):
            for k in list(o):
                v = o[k]
                if k in ("at", "from") and isinstance(v, str) and v:
                    w, _, nth = v.partition("#")
                    if re.sub(r"[^a-z0-9]", "", w.lower()) not in ws:
                        o[k] = pool[min(len(pool) - 1, cnt[0] * 2)]
                        cnt[0] += 1
                else:
                    walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(beat.get("shots"))


def apply_fixes(S, items, fixes):
    by = {it["id"]: it for it in items}
    n, touched = 0, set()
    for iid, new in fixes.items():
        it = by[iid]
        old = str(_get(S, it["path"]))
        if not new or new == old:
            continue
        if it["kind"] == "line":
            if not LINE_WORDS[0] <= len(new.split()) <= LINE_WORDS[1]:
                continue
        else:
            new = new.upper() if old.isupper() else new
            if len(new) > len(old) + 6:
                continue
        print(f"   [factcheck] {iid}: {old}\n                -> {new}")
        _set(S, it["path"], new)
        n += 1
        if it["path"][0] == "beats":
            touched.add(it["path"][1])
    for i in touched:
        reanchor(S["beats"][i])
    return n


def _result(S, ok, urls, fixed, **extra):
    S["factcheck"] = dict({"ok": ok, "checked_at": _now(), "source": urls, "fixed": fixed}, **extra)
    return {True: "ok", False: "rejected", None: "unchecked"}[ok]


def check_spec(S):
    """skontroluje scenar (zmeny zapise priamo do S). Vracia "ok" | "rejected" | "unchecked". Nikdy nevyhadzuje vynimku:
    pri vypadku Wikipedie/Groq ostane factcheck.ok = null a pipeline pokracuje."""
    items = collect(S)
    if not items:
        return _result(S, None, [], 0, error="ziadne texty")
    try:
        arts = wiki_articles(source_queries(S))
    except Exception as e:
        print(f"   [factcheck] Wikipedia nedostupna: {type(e).__name__}: {str(e)[:100]} -> nekontrolovane")
        return _result(S, None, [], 0, error="wikipedia: " + str(e)[:100])
    if not arts:
        print("   [factcheck] ziadny clanok na Wikipedii -> nekontrolovane")
        return _result(S, None, [], 0, error="bez zdroja")
    urls = [wiki_url(t) for t, _ in arts]
    fixed = 0
    try:
        claims = run_check(S, arts, items)
        contra, unsup = judge(claims)
        print(f"   [factcheck] {len(claims)} tvrdeni: {len(contra)} contradicted, {len(unsup)} unsupported (konkretne)")
        if contra or len(unsup) > MAX_UNSUPPORTED:
            bad = contra + (unsup if len(unsup) > MAX_UNSUPPORTED else [])      # nepodlozene mena/cisla len ak je ich privela
            fixed = apply_fixes(S, items, run_rewrite(S, items, bad))
            items = collect(S)
            claims = run_check(S, arts, items)
            contra, unsup = judge(claims)
            print(f"   [factcheck] po oprave: {len(contra)} contradicted, {len(unsup)} unsupported (konkretne)")
    except Exception as e:
        print(f"   [factcheck] kontrola zlyhala: {type(e).__name__}: {str(e)[:120]} -> nekontrolovane")
        return _result(S, None, urls, fixed, error=str(e)[:100])
    if contra or len(unsup) > MAX_UNSUPPORTED:
        why = [f'{c["verdict"]}: {c["claim"]}' + (f' (spravne: {c["correction"]})' if c["correction"] else "") for c in contra + unsup]
        return _result(S, False, urls, fixed, bad=why[:8])
    S["facts"] = [{"claim": t, "source": u} for (t, _), u in zip(arts, urls)]     # vseobecne zdroje od Groq nahradia skutocne clanky
    return _result(S, True, urls, fixed, unsupported=len(unsup))


# ---------- praca s frontou

def queue_priority(S):
    """poradie pri renderi: 0 = Claude-pisane alebo overene, 1 = groq bez kontroly (az ked nic ine nie je), 2 = zamietnute"""
    ok = (S.get("factcheck") or {}).get("ok")
    if ok is False:
        return 2
    return 0 if (S.get("source") != "groq" or ok is True) else 1


def _unique(d, name):
    os.makedirs(d, exist_ok=True)
    base, ext = os.path.splitext(name)
    p, n = os.path.join(d, name), 2
    while os.path.exists(p):
        p = os.path.join(d, f"{base}-{n}{ext}")
        n += 1
    return p


def save_rejected(S, name):
    """zamietnuty scenar (s vysledkom kontroly) do queue_rejected; nic sa nemaze"""
    p = _unique(RDIR, name)
    json.dump(S, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return p


def run_queue(limit=None):
    names = sorted(f for f in os.listdir(QDIR) if f.endswith(".json")) if os.path.isdir(QDIR) else []
    stat = {"ok": 0, "rejected": 0, "unchecked": 0, "skipped": 0}
    done = fails = 0
    for name in names:
        path = os.path.join(QDIR, name)
        S = json.load(open(path, encoding="utf-8"))
        if S.get("source") != "groq" or (S.get("factcheck") or {}).get("ok") in (True, False):
            stat["skipped"] += 1
            continue
        if limit is not None and done >= limit:
            break
        print(f"[factcheck] {name}")
        st = check_spec(S)
        done += 1
        stat[st] += 1
        if st == "rejected":
            dst = save_rejected(S, name)
            os.remove(path)
            mark_topic_used(S)
            print(f"   ZAMIETNUTE -> {os.path.relpath(dst, FACTORY)}: " + " | ".join(S["factcheck"].get("bad", []))[:300])
        else:
            json.dump(S, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        fails = fails + 1 if st == "unchecked" else 0
        if fails >= 2:
            print("[factcheck] Wikipedia/Groq opakovane nedostupne -> koncim (zvysok ostane nekontrolovany)")
            break
    print("factcheck fronta: " + ", ".join(f"{k} {v}" for k, v in stat.items()))
    return stat


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--queue" in a:
        run_queue(int(a[a.index("--max") + 1]) if "--max" in a else None)
    elif a and not a[0].startswith("--"):
        S = json.load(open(a[0], encoding="utf-8"))
        st = check_spec(S)
        json.dump(S, open(a[0], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(st, json.dumps(S["factcheck"], ensure_ascii=False)[:400])
    else:
        print(__doc__)
