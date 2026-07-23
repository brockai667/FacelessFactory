#!/usr/bin/env python3
"""Doplni banku tem cez GitHub Models (zadarmo). Nika: FAKTY (veda/vesmir/telo/zvierata/historia).
NOVY FORMAT (PRO engine): tema = 5 scen (hook/fact/fact/callout/cta) s presnymi
subjektovymi queries, sync chipmi (len dolozitelne cisla) a kinetickym hookom.
Stare temy bez 'scenes' sa vyradia az ked su aspon 3 nove (den nikdy neostane bez videi)."""
import json
import os
import re
import sys
import time

import requests
try:
    import trends
except Exception:
    trends = None

ROOT = os.path.dirname(os.path.abspath(__file__))
BANK = os.path.join(ROOT, "topics_bank.json")
STATE = os.path.join(ROOT, "used_topics.json")

TARGET = int(os.environ.get("TOPICS_TARGET", "15"))
MODEL = os.environ.get("MODELS_MODEL", "openai/gpt-4o-mini")
BASE = os.environ.get("MODELS_BASE_URL", "https://models.github.ai/inference")
TOKEN = os.environ.get("MODELS_TOKEN") or os.environ.get("GITHUB_TOKEN")

TREND_SUBREDDITS = ['todayilearned', 'Damnthatsinteresting', 'interestingasfuck', 'explainlikeimfive']
TREND_YT_QUERIES = ['amazing facts', 'mind blowing facts', 'did you know facts']

SYSTEM = ("You are a scriptwriter for a short-form brand about mind-blowing TRUE facts across science, space, psychology, the human body, animals and history. "
          "ACCURACY IS CRITICAL: use ONLY widely-documented, verifiable facts. NEVER invent or guess "
          "numbers, percentages, dates or statistics - if a figure is not universally established, say "
          "it generally instead of making one up. You output strict JSON, nothing else.")

EXAMPLE = {
    "title": "The Animal With Three Hearts",
    "place": "",
    "country": "",
    "scenes": [
        {
            "role": "hook",
            "text": "An octopus has three hearts, nine brains, and blue blood.",
            "hook_top": "THREE HEARTS NINE BRAINS",
            "query": "octopus underwater close",
            "query2": "octopus swimming ocean"
        },
        {
            "role": "fact",
            "text": "Two of those hearts stop beating every time it swims, which is why it prefers to crawl.",
            "query": "octopus crawling seabed",
            "query2": "octopus tentacles macro",
            "chips": [
                {
                    "t": "3 HEARTS",
                    "on": "hearts",
                    "style": "white"
                },
                {
                    "t": "9 BRAINS",
                    "on": "brains",
                    "style": "accent"
                }
            ],
            "punch": "stop"
        },
        {
            "role": "fact",
            "text": "Its blood is blue because it runs on copper instead of iron.",
            "query": "octopus blue ocean",
            "query2": "deep ocean blue water",
            "chips": [
                {
                    "t": "COPPER BLOOD",
                    "on": "copper",
                    "style": "accent"
                }
            ]
        },
        {
            "role": "callout",
            "text": "And each of its eight arms can taste, touch, and decide on its own.",
            "query": "octopus tentacles suckers close",
            "query2": "octopus arm suckers",
            "label": "ARMS THAT THINK",
            "sub": "each one decides on its own",
            "label_on": "arms",
            "punch": "decide"
        },
        {
            "role": "cta",
            "text": "Follow for more facts that sound fake but are real.",
            "query": "octopus ocean cinematic",
            "query2": "underwater ocean light rays"
        }
    ],
    "description": "An octopus has 3 hearts, 9 brains and blue copper-based blood - and every arm thinks for itself. Follow for daily facts!",
    "hashtags": [
        "#facts",
        "#didyouknow",
        "#octopus",
        "#ocean",
        "#science",
        "#nature",
        "#shorts",
        "#fyp"
    ]
}


import random  # CTAS_ROTATE

CTAS = [
    "Follow for a mind-blowing fact every day.",
    "Follow if you love learning something new.",
    "Hit follow for your daily dose of wow.",
    "Follow for facts that sound fake but aren't.",
    "Follow so you never run out of fun facts.",
]



PERFORMANCE = (
    "\nPERFORMANCE DATA (real results - obey this, it decides reach):\n"
    "- WHAT PERFORMS (strongly prefer these): mystery-tinged science and body facts (Bermuda Triangle, "
    "instant-freezing water, the sixth-finger brain trick), 'why everyday things are like that' secrets, "
    "animal oddities with a twist. Concrete, visual, a little uncanny.\n"
    "- WHAT KILLS REACH (avoid): bland textbook facts with no twist, vague lists, anything without a "
    "curiosity gap or a concrete named subject.\n"
)


# ===== FORMATY (pestre kostry -> ziadne "video ako video") + live self-learning z RSS =====
CHANNEL_ID = "UCtSLinO4I6R9T7qyY9TNgoA"

FORMATS = {
    "COUNTDOWN": ["hook", "count", "count", "count", "cta"],
    "MYTH":      ["hook", "myth", "truth", "callout", "cta"],
    "REVEAL":    ["hook", "fact", "fact", "reveal", "cta"],
    "CLASSIC":   ["hook", "fact", "fact", "callout", "cta"],
    "DEEP":      ["hook", "fact", "callout", "cta"],
}
FORMAT_MIX = ["COUNTDOWN", "MYTH", "REVEAL", "CLASSIC", "COUNTDOWN"]

_ROLE_SPEC = {
    "hook":    "hook: text (<14 words, opens a curiosity gap); 'hook_top' = same idea in MAX 6 punchy UPPERCASE words.",
    "fact":    "fact: text (ONE concrete supporting fact); 'chips' = 1-2 {'t':'MAX 22 CHARS','on':'spoken trigger word','style':'white'|'accent'} using ONLY real documented numbers; optional 'punch' = one spoken word to zoom.",
    "callout": "callout: text; 'label' = 2-4 word on-screen takeaway; 'sub' = <=34 chars; 'label_on' = spoken trigger word.",
    "count":   "count: text (one distinct point); 'num' = item number (1,2,3); 'label' = that point in <=22 UPPERCASE chars; 'label_on' = spoken trigger word.",
    "myth":    "myth: text (states a COMMON BELIEF people wrongly hold); 'label' = that myth in <=28 chars.",
    "truth":   "truth: text (the CORRECTION / real documented fact busting the myth); 'label' = the real fact in <=28 chars.",
    "reveal":  "reveal: text (the surprising TWIST); 'reveal_top' = the twist in MAX 6 punchy UPPERCASE words.",
    "map":     "map: text (says accurately WHERE it happened / was found).",
    "archive": "archive: text; 'archive_query' = precise Wikimedia Commons search for a REAL archival image (famous site/artifact/building/document - NEVER victims or private people); 'archive_label' = caption <=26 chars.",
    "cta":     "cta: text (a short 'follow' line).",
}
_FMT_HINT = {
    "COUNTDOWN": "- Shape: a 3-point countdown; the three 'count' scenes are three DISTINCT facts, num=1,2,3.\n",
    "MYTH":      "- Shape: myth-buster; 'myth' states the common false belief, 'truth' the documented correction.\n",
    "REVEAL":    "- Shape: build tension across the 'fact' scenes, then 'reveal' drops the surprising twist.\n",
    "LOCATED":   "- Shape: place-anchored micro-doc; 'map' says WHERE, 'archive' shows the real thing.\n",
    "DEEP":      "- Shape: ONE subject explored in depth; 'archive' shows the real thing.\n",
}
_ALLOWED_ROLES = {"hook", "fact", "callout", "cta", "count", "myth", "truth", "reveal", "map", "archive"}
_EXTRA_RULES = ""


def own_channel_performance(top=5, bottom=5):
    """WINNERS/LOSERS z vlastneho kanala cez verejny RSS feed (ziadny kluc). Best-effort."""
    try:
        import urllib.request
        import datetime
        xml = urllib.request.urlopen("https://www.youtube.com/feeds/videos.xml?channel_id="
                                     + CHANNEL_ID, timeout=20).read().decode("utf-8", "replace")
        rows = []
        for e in re.findall(r"<entry>.*?</entry>", xml, re.S):
            t = re.search(r"<media:title>([^<]*)</media:title>", e)
            v = re.search(r'views="(\d+)"', e)
            p = re.search(r"<published>(\d{4}-\d{2}-\d{2})", e)
            if t and v:
                rows.append((int(v.group(1)), t.group(1), p.group(1) if p else ""))
        cut = (datetime.date.today() - datetime.timedelta(days=2)).isoformat()
        mature = [r for r in rows if r[2] and r[2] <= cut] or rows
        if len(mature) < 4:
            return ""
        mature.sort(key=lambda r: -r[0])
        win = " | ".join(t for _, t, _ in mature[:top])
        lose = " | ".join(t for _, t, _ in mature[-bottom:])
        return ("\nOUR CHANNEL'S LIVE RESULTS (make topics with the winners' subject-style and energy; "
                "avoid the losers' style):\nWINNERS: " + win + "\nLOSERS: " + lose + "\n")
    except Exception:
        return ""


def build_prompt_fmt(fmt, n, existing_titles, trending=None, perf=""):
    seq = FORMATS[fmt]
    spec_lines = "\n".join("- " + _ROLE_SPEC[r] for r in dict.fromkeys(seq))
    trend_block = ""
    if trending:
        joined = chr(10).join("- " + t for t in trending)
        trend_block = (" REAL headlines people watch this week (let some topics be inspired by a "
                       "specific item; never copy verbatim, never mention Reddit/YouTube): " + joined + " ")
    return (
        f"Generate {n} NEW faceless short-form video topics for a MIND-BLOWING FACTS brand (mystery-tinged science, body oddities, everyday-thing secrets), ALL in the '{fmt}' format.\n"
        f"Each topic MUST have EXACTLY these scenes, in THIS order: {' -> '.join(seq)}.\n"
        "Return ONLY a JSON array. Each item = {'title':..., 'thumb':..., 'scenes':[...], "
        "'description':..., 'hashtags':[...]}.\n"
        "Scene field rules:\n" + spec_lines + "\n"
        "- EVERY scene needs 'query' = stock search naming the CONCRETE subject of that exact line "
        "(NEVER abstract) and 'query2' = fallback. The viewer must SEE what the line talks about.\n"
        + _FMT_HINT.get(fmt, "") + _EXTRA_RULES +
        "- hook MUST contain a concrete number, name or place; NEVER start with 'Imagine', "
        "'What if', 'Did you know' or 'Have you ever'.\n"
        "- 'thumb' = 2-3 punchy UPPERCASE words for the thumbnail (most clickable phrase, NOT a sentence).\n"
        "- ACCURACY IS SACRED: only widely-documented facts and real numbers; never invent figures.\n"
        "- description: 1-2 engaging sentences + a short follow line; hashtags: 6-9 incl #shorts #fyp.\n"
        "- VARY titles (bold claim / question / curiosity gap); max 1 in 5 starts with a number.\n"
        f"- Do NOT reuse or rephrase any of these existing titles: {existing_titles}\n"
        + PERFORMANCE + perf + trend_block +
        "Return ONLY the JSON array."
    )


def build_prompt(n, existing_titles, trending=None):
    trend_block = ""
    if trending:
        joined = chr(10).join("- " + t for t in trending)
        trend_block = (
            " WHAT REAL PEOPLE DISCUSS AND WATCH THIS WEEK (live headlines from Reddit communities and "
            "top YouTube videos in this niche): " + joined +
            " Let at least HALF of the new topics be directly inspired by a SPECIFIC item above, turned "
            "into a strong hook that STILL follows the rules. Do NOT copy any headline word-for-word, "
            "and NEVER mention Reddit or YouTube. "
        )
    return (
        f"Generate {n} NEW faceless short-form video topics for a brand about mind-blowing TRUE facts across science, space, psychology, the human body, animals and history. "
        "Each video is a punchy MICRO-DOC of ONE idea (TikTok / Reels / Shorts).\n"
        "Return ONLY a JSON array (no markdown). Each item EXACTLY this schema:\n"
        f"{json.dumps(EXAMPLE, ensure_ascii=False, indent=2)}\n\n"
        "Rules (PRO editing pipeline depends on these):\n"
        "- EXACTLY 5 scenes in this order: hook, fact, fact, callout, cta. Each scene 'text' = 1-2 "
        "short spoken sentences (energetic but natural voiceover).\n"
        "- hook: the single most surprising TRUE thing, under 14 words, opens a curiosity gap. "
        "'hook_top' = the same idea compressed to MAX 6 punchy words (big kinetic text on screen). "
        "Never start with 'Did you know'.\n"
        "- fact scenes: ONE concrete supporting fact each. 'chips' = 1-2 short TRUE fact-chips: "
        "{'t': 'MAX 22 CHARS', 'on': 'the spoken word that triggers it', 'style': 'white'|'accent'}. "
        "ONLY widely-documented numbers; if no reliable number exists, use a word chip.\n"
        "- callout scene: 'label' = 2-4 word on-screen label of the KEY takeaway, 'sub' = short "
        "sub-line (max 34 chars), 'label_on' = spoken trigger word.\n"
        "- 'punch' (optional): ONE spoken word where the shot subtly zooms.\n"
        "- EVERY scene needs 'query' = Pexels stock search naming the CONCRETE subject of that exact "
        "line (line about octopuses -> 'octopus underwater'; NEVER abstract) and 'query2' = visual "
        "fallback. The viewer must SEE what the line talks about.\n"
        "- every fact must pass the 'I have to tell someone this' test - genuinely surprising, not common knowledge.\n"
        "- the video must work with sound OFF (hook text + chips tell the story) AND with eyes closed "
        "(voice explains everything).\n"
        "- description: 1-2 engaging sentences, then 'Follow for daily facts!'\n"
        "- hashtags: 6-9 relevant tags including #shorts #fyp.\n"
        "- VARY THE TITLE FORMAT: mix a bold claim, a question and a curiosity gap; do NOT start more "
        "than one in five titles with a number.\n"
        f"- Do NOT reuse any of these existing titles: {existing_titles}\n"
        "- Do NOT repeat the same SUBJECT or fact as any existing title above, even reworded. Every "
        "topic must be a genuinely DIFFERENT idea.\n"
        + trend_block +
        "Return ONLY the JSON array."
    )


def call_model(user_text, _tries=4):
    # retry+backoff: vsetky fabriky trafia GitHub Models -> 429; 5xx = docasne
    last = "Models API: neznama chyba"
    for _i in range(_tries):
        r = requests.post(
            BASE.rstrip("/") + "/chat/completions",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"model": MODEL, "temperature": 0.95,
                  "messages": [{"role": "system", "content": SYSTEM},
                               {"role": "user", "content": user_text}]},
            timeout=180,
        )
        if r.status_code < 400:
            return r.json()["choices"][0]["message"]["content"]
        last = f"Models API {r.status_code}: {r.text[:300]}"
        if r.status_code == 429 or r.status_code >= 500:
            try:
                _w = float(r.headers.get("retry-after") or 0)
            except Exception:
                _w = 0
            time.sleep(min(max(_w, 10 * (_i + 1)), 70))
            continue
        break
    raise RuntimeError(last)


def extract_json(s):
    s = s.strip()
    s = re.sub(r"^```(?:json)?", "", s).strip()
    s = re.sub(r"```$", "", s).strip()
    a, b = s.find("["), s.rfind("]")
    if a != -1 and b != -1:
        s = s[a:b + 1]
    return json.loads(s)


def valid(t):
    """Overi + doopravi NOVY format temy (scenes). Stare/nevalidne temy odmietne."""
    if not isinstance(t, dict) or not t.get("title"):
        return False
    scenes = t.get("scenes")
    if not isinstance(scenes, list) or not (4 <= len(scenes) <= 7):
        return False
    for sc in scenes:
        # model casto vracia {'hook':'<text>'} namiesto {'role':'hook','text':'<text>'} -> zosuladit
        if isinstance(sc, dict) and not sc.get("text"):
            for _role in ("hook", "map", "fact", "archive", "callout", "cta", "count", "myth", "truth", "reveal"):
                if isinstance(sc.get(_role), str) and sc.get(_role).strip():
                    sc["role"] = _role
                    sc["text"] = sc.pop(_role)
                    break
        if not isinstance(sc, dict) or not sc.get("text"):
            return False
        sc.setdefault("role", "fact")
        if sc["role"] not in _ALLOWED_ROLES:
            sc["role"] = "fact"
    scenes[0]["role"] = "hook"
    scenes[-1]["role"] = "cta"
    cnt = 0
    for sc in scenes:
        if sc["role"] == "hook":
            top = re.sub(r"[^A-Za-z0-9' ]", "", str(sc.get("hook_top") or sc["text"]))
            sc["hook_top"] = " ".join(top.split()[:6]).upper()
        if not sc.get("query"):
            sc["query"] = str(t["title"])
        if not sc.get("query2"):
            sc["query2"] = "cinematic nature landscape"
        if sc["role"] == "fact":
            chips = [c for c in (sc.get("chips") or []) if isinstance(c, dict) and c.get("t")]
            for c in chips:
                c["t"] = str(c["t"])[:24]
            sc["chips"] = chips[:2]
        elif sc["role"] == "count":
            cnt += 1
            try:
                sc["num"] = int(sc.get("num") or cnt)
            except Exception:
                sc["num"] = cnt
            sc["label"] = str(sc.get("label") or sc.get("text", ""))[:22]
        elif sc["role"] in ("myth", "truth"):
            sc["label"] = str(sc.get("label") or sc.get("text", ""))[:28]
        elif sc["role"] == "reveal":
            rt = re.sub(r"[^A-Za-z0-9' ]", "", str(sc.get("reveal_top") or sc["text"]))
            sc["reveal_top"] = " ".join(rt.split()[:6]).upper()
    t.setdefault("place", "")
    t.setdefault("country", "")
    t.setdefault("description", t["title"] + " Follow for daily facts!")
    t["thumb"] = " ".join(str(t.get("thumb") or "").split()[:4]).upper()
    t.setdefault("hashtags", ["#facts", "#didyouknow", "#octopus", "#ocean"])
    return True


_STOP = {"why", "your", "the", "is", "a", "of", "you", "that", "are", "and", "to", "in",
         "on", "how", "this", "for", "with", "it", "its", "can", "cant", "not", "be", "do",
         "than", "them", "their", "own", "what", "when", "was", "were", "has", "have", "from",
         "more", "most", "just", "every", "an", "as", "or", "but", "so", "hidden", "secret",
         "surprising", "truth", "facts", "fact", "these", "there", "they"}


def _sig(title):
    return set(w for w in re.findall(r"[a-z]+", str(title).lower()) if len(w) > 2 and w not in _STOP)


def _too_similar(sig, existing_sigs):
    if not sig:
        return False
    for es in existing_sigs:
        if not es:
            continue
        inter = len(sig & es)
        if inter >= 3:
            return True
        if inter >= 2 and inter / (len(sig | es) or 1) >= 0.5:
            return True
    return False



# --- ANTI-OPAKOVANIE (dedup): po behu odstrani z banky NEPOUZITE temy podobne inej teme.
_DD_STOP = set("""a an the this that these those and or but so of to in on for with at by from as is are was
were be been being it its you your they them their our we he she his her my me i do does did not no can cant
will just every most more than then there here what when why how who which while into over out up down off only
also very much many some any all if thing things way ways get make made youre follow daily wisdom mindset day
today need needs about like want wants nobody tells tell told never ever still story people world reveal
revealed discover""".split())


def _dd_sig(t):
    first = ""
    if t.get("scenes"):
        first = t["scenes"][0].get("text", "")
    elif t.get("segments"):
        first = t["segments"][0].get("text", "")
    txt = (str(t.get("title", "")) + " " + str(t.get("description", "")) + " " + str(first))
    low = txt.lower()
    toks = set(w for w in re.findall(r"[a-z]+", low) if len(w) > 2 and w not in _DD_STOP)
    toks |= set("#" + n for n in re.findall(r"\d{2,}", low))
    return toks


def _dd_years(s):
    return set(w for w in s if len(w) == 5 and w[0] == "#" and w[1] in "12")


def _dd_dup(si, sj):
    common = si & sj
    if len(common) < 3:
        return False
    yi, yj = _dd_years(si), _dd_years(sj)
    yc = yi & yj
    if yi and yj and not yc:
        return False
    jac = len(common) / (len(si | sj) or 1)
    if yc and len(common) >= 3:
        return True
    if not (yi or yj) and len(common) >= 4 and jac >= 0.5:
        return True
    return False


def _clean_bank():
    """Odstrani NEPOUZITE temy prilis podobne inej teme. Publikovane sa nikdy nemazu."""
    from collections import Counter
    bank = json.load(open(BANK, encoding="utf-8"))
    used = set(json.load(open(STATE, encoding="utf-8"))) if os.path.exists(STATE) else set()
    raws = [_dd_sig(t) for t in bank]
    df = Counter()
    for s in raws:
        for w in s:
            df[w] += 1
    cutoff = max(2, int(len(bank) * 0.25))
    sigs = [set(w for w in s if df[w] <= cutoff) for s in raws]
    ks = [s for t, s in zip(bank, sigs) if t.get("title") in used]
    kept, removed_items = [], []
    unused_kept = 0
    for t, s in zip(bank, sigs):
        if t.get("title") in used:
            kept.append(t)
            continue
        if s and any(_dd_dup(s, k) for k in ks):
            removed_items.append((t, s))
            continue
        kept.append(t)
        ks.append(s)
        unused_kept += 1
    # FLOOR proti hladovaniu: radsej ponechaj par podobnych nez nechat den bez videi
    _floor = max(6, TARGET // 2)
    while unused_kept < _floor and removed_items:
        t, s = removed_items.pop(0)
        kept.append(t); ks.append(s); unused_kept += 1
    removed = len(removed_items)
    if removed:
        json.dump(kept, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("Dedup: odstranenych %d podobnych nepouzitych tem." % removed)
    else:
        print("Dedup: ziadne podobne nepouzite temy.")



def main():
    if not TOKEN:
        print("CHYBA: chyba MODELS_TOKEN/GITHUB_TOKEN"); sys.exit(1)
    bank = json.load(open(BANK, encoding="utf-8"))
    used = json.load(open(STATE, encoding="utf-8")) if os.path.exists(STATE) else []
    # MIGRACIA: stare temy vyrad az ked su aspon 3 nove PRO temy (den nikdy neostane bez videi)
    old = [t for t in bank if not t.get("scenes") and t["title"] not in used]
    new_unused = [t for t in bank if t.get("scenes") and t["title"] not in used]
    if old and len(new_unused) >= 3:
        bank = [t for t in bank if t.get("scenes") or t["title"] in used]
        print(f"Migracia: vyradenych {len(old)} nepouzitych tem stareho formatu.")
    titles = {t["title"] for t in bank}
    unused = [t for t in bank if t["title"] not in used]
    need = TARGET - len(unused)
    if need <= 0:
        json.dump(bank, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print(f"Banka OK: {len(unused)} nepouzitych tem."); return
    print(f"Generujem ~{need} novych tem cez {MODEL}...")
    trending = []
    if trends is not None:
        try:
            trending, meta = trends.gather(TREND_SUBREDDITS, TREND_YT_QUERIES, top=18, return_meta=True)
            if trending:
                print(f"Trendy: {len(trending)} titulkov (Reddit={meta['reddit']}, YouTube={meta['youtube']}).")
        except Exception as e:
            print("Trendy preskocene:", str(e)[:120])
    perf = own_channel_performance()
    if perf:
        print("Live kanal-data: WINNERS/LOSERS zapracovane do promptu.")
    from collections import Counter as _Ctr
    plan = _Ctr(FORMAT_MIX[i % len(FORMAT_MIX)] for i in range(need + 2))
    items = []
    for _fmt, _cnt in plan.items():
        try:
            got = extract_json(call_model(build_prompt_fmt(_fmt, _cnt, sorted(titles), trending, perf)))
            items += got
            print(f"  format {_fmt}: {len(got)} tem")
        except Exception as e:
            print(f"  format {_fmt} preskoceny: {str(e)[:100]}")
    added = 0
    existing_sigs = [_sig(x) for x in titles]
    for t in items:
        if not valid(t) or t["title"] in titles:
            continue
        _s = _sig(t["title"])
        if _too_similar(_s, existing_sigs):
            print("  preskocene (podobna tema):", t["title"]); continue
        if t.get("scenes"):
            t["scenes"][-1]["text"] = random.choice(CTAS)  # CTAS_ROTATE
        bank.append(t); titles.add(t["title"]); existing_sigs.append(_s); added += 1
    # ANTI-STARVATION: ak je nepouzitych kriticky malo, prijmi aj "podobne" (VALID, novy
    # titul) temy - novy skript je lepsi nez 0 videi (den nikdy neostane prazdny).
    _floor = max(6, TARGET // 2)
    if len([t for t in bank if t["title"] not in used]) < _floor:
        _before = added
        for _t in items:
            if len([x for x in bank if x["title"] not in used]) >= _floor:
                break
            if not valid(_t) or _t["title"] in titles:
                continue
            if _t.get("scenes"):
                _t["scenes"][-1]["text"] = random.choice(CTAS)
            bank.append(_t); titles.add(_t["title"]); added += 1
        if added > _before:
            print(f"[anti-starvation] uvolneny dedup: +{added - _before} tem (banka bola skoro prazdna).")
    json.dump(bank, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Pridanych {added} tem. Banka ma {len(bank)} tem.")


if __name__ == "__main__":
    main()
    try:
        _clean_bank()
    except Exception as _e:
        print("Dedup preskoceny:", str(_e)[:150])
