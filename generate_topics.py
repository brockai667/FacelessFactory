#!/usr/bin/env python3
"""
Doplni banku tem (topics_bank.json) cez GitHub Models (zadarmo) ak je malo nepouzitych.
Spusta sa v GitHub Actions (token z GITHUB_TOKEN, permission models: read).
Lokalne: nastav MODELS_TOKEN na GitHub PAT s pravom 'models'.
"""
import json
import os
import re
import sys

import requests


try:
    import trends
except Exception:
    trends = None

TREND_SUBREDDITS = ['todayilearned', 'Damnthatsinteresting', 'interestingasfuck', 'explainlikeimfive']
TREND_YT_QUERIES = ['amazing facts', 'mind blowing facts', 'did you know facts']


def _gather_trends():
    if trends is None:
        return []
    try:
        hl, meta = trends.gather(TREND_SUBREDDITS, TREND_YT_QUERIES, top=18, return_meta=True)
        if hl:
            print("Trendy: %d titulkov (Reddit=%d, YouTube=%d) -> temy z realneho dopytu." % (len(hl), meta["reddit"], meta["youtube"]))
        else:
            print("Trendy: zdroj nedostupny (Reddit=%d, YouTube=%d) -> klasicky." % (meta["reddit"], meta["youtube"]))
        return hl
    except Exception as e:
        print("Trendy preskocene:", str(e)[:120])
        return []


def _trend_block(trending):
    if not trending:
        return ""
    joined = "\n".join("- " + t for t in trending)
    return (
        "\nWHAT PEOPLE ARE CURIOUS ABOUT / WATCHING RIGHT NOW (live trending headlines from "
        "Reddit communities and top YouTube videos in this niche - what people actually click "
        "on this week):\n" + joined + "\n"
        "IMPORTANT: at least HALF of the generated topics MUST be directly inspired by a "
        "specific, high-curiosity item above - take the most surprising/intriguing ones and "
        "turn them into original, scroll-stopping hooks. Do NOT copy a headline word-for-word, "
        "and do NOT mention Reddit or YouTube.\n"
    )


ROOT = os.path.dirname(os.path.abspath(__file__))
BANK = os.path.join(ROOT, "topics_bank.json")
STATE = os.path.join(ROOT, "used_topics.json")

TARGET = int(os.environ.get("TOPICS_TARGET", "15"))   # min. pocet nepouzitych tem
MODEL = os.environ.get("MODELS_MODEL", "openai/gpt-4o-mini")
BASE = os.environ.get("MODELS_BASE_URL", "https://models.github.ai/inference")
TOKEN = os.environ.get("MODELS_TOKEN") or os.environ.get("GITHUB_TOKEN")

SYSTEM = ("You are a viral short-form video scriptwriter. You ONLY use well-known, "
          "verifiable facts (no invented numbers). You output strict JSON, nothing else. THE HOOK (the very first line / segment 1) is the single most important thing in the whole video: it MUST stop the scroll within 2 seconds. Make it concrete and specific (a number, a name, a vivid image, or a sharp contradiction) and open a curiosity gap that can ONLY be closed by watching to the end. Lead with the most shocking part FIRST, never a slow setup. Forbidden hook openers: 'Did you know', 'Have you ever', 'Imagine', 'Here are', 'In this video', 'Let me tell you'.")

EXAMPLE = {
    "title": "3 Facts About Octopuses",
    "segments": [
        {"text": "An octopus has three hearts, nine brains, and blue blood.", "keywords": "octopus underwater"},
        {"text": "And it only gets weirder from here.", "keywords": "octopus swimming"},
        {"text": "Two of those hearts stop beating whenever it swims.", "keywords": "octopus ocean"},
        {"text": "Their blood is blue because it uses copper instead of iron.", "keywords": "octopus blue ocean"},
        {"text": "Each of their arms can basically think for itself.", "keywords": "octopus tentacles"},
        {"text": "Follow for more facts that sound fake but are real.", "keywords": "octopus ocean"},
    ],
    "description": "An octopus has 3 hearts and blue blood. Nature is wild. Follow for daily facts!",
    "hashtags": ["#octopus", "#facts", "#didyouknow", "#ocean", "#science", "#shorts", "#fyp", "#nature"],
}


def build_prompt(n, existing_titles, trending=None):
    trend_block = _trend_block(trending)
    return (
        f"Generate {n} NEW faceless short-form 'facts' video topics for TikTok / Reels / YouTube Shorts.\n"
        "Niche: surprising but TRUE facts across science, psychology, space, nature, history, the human body, animals.\n"
        "Return ONLY a JSON array (no markdown, no commentary). Each item EXACTLY this schema:\n"
        f"{json.dumps(EXAMPLE, ensure_ascii=False, indent=2)}\n\n"
        "Rules (make it feel PRO and VIRAL):\n"
        "- title: catchy, like '3 Facts About X' or '3 X Facts That Sound Fake'.\n"
        "- exactly 6 segments. Segment 1 is THE HOOK: the single most surprising, counterintuitive fact, "
        "under 12 words, that makes a viewer think 'wait, what?!'. Never start with 'Did you know'.\n"
        "- segment 2 is a short open-loop tease that keeps people watching (e.g. 'And it gets weirder.', "
        "'But that's not even the strange part.').\n"
        "- the SECOND-TO-LAST segment should loop back to the opening hook (circle back to the fact you "
        "opened with) so a rewatch feels seamless.\n"
        "- the LAST segment text MUST be exactly: 'Follow for more facts that sound fake but are real.'\n"
        "- write for a SPOKEN voiceover: short, punchy sentences, simple words, no long clauses, easy to say out loud.\n"
        "- every fact must pass the 'I have to tell someone this' test — genuinely surprising, not common knowledge.\n"
        "- prefer high-curiosity angles: psychology and human behavior, mind-blowing science, space, the human body, animals, history.\n"
        "- each segment 'keywords': 1-3 ENGLISH words for real Pexels footage that VISUALLY MATCHES the "
        "specific thing named in that line, so viewers picture it (e.g. line about octopuses -> 'octopus "
        "underwater', about a galaxy -> 'galaxy space', about sleep -> 'person sleeping'). Concrete and "
        "topic-locked, never abstract.\n"
        "- facts must be accurate and widely verifiable. Do NOT invent statistics.\n"
        "- description: one engaging sentence ending with 'Follow for daily facts!'.\n"
        "- About half the time, add ONE fitting emoji at the very END of the description (e.g. 🤯, 🌌, 💡, 🔥). "
        "Emoji ONLY in the description text, NEVER inside any segment 'text' (spoken captions).\n"
        "- hashtags: 6-8 relevant tags including #facts #shorts #fyp.\n"
        f"- Do NOT reuse any of these existing titles: {existing_titles}\n"
        "- HOOK RULE (critical for retention): segment 1 must be the single most shocking, "
        "curiosity-gap opener that makes the viewer unable to scroll. Under 10 words, no "
        "setup, lead with the most surprising fact or claim.\n"
        + trend_block +
        "Return ONLY the JSON array."
    )


def call_model(user_text):
    r = requests.post(
        BASE.rstrip("/") + "/chat/completions",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            "temperature": 0.95,
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": user_text},
            ],
        },
        timeout=180,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"Models API {r.status_code}: {r.text[:500]}")
    return r.json()["choices"][0]["message"]["content"]


def extract_json(s):
    s = s.strip()
    s = re.sub(r"^```(?:json)?", "", s).strip()
    s = re.sub(r"```$", "", s).strip()
    a, b = s.find("["), s.rfind("]")
    if a != -1 and b != -1:
        s = s[a:b + 1]
    return json.loads(s)


def valid(t):
    if not isinstance(t, dict):
        return False
    if "title" not in t or "segments" not in t:
        return False
    if not isinstance(t["segments"], list) or len(t["segments"]) < 4:
        return False
    for seg in t["segments"]:
        if "text" not in seg or "keywords" not in seg:
            return False
    t.setdefault("description", t["title"] + " Follow for daily facts!")
    t.setdefault("hashtags", ["#facts", "#didyouknow", "#shorts", "#fyp"])
    return True


def main():
    if not TOKEN:
        print("CHYBA: chyba MODELS_TOKEN/GITHUB_TOKEN")
        sys.exit(1)
    bank = json.load(open(BANK, encoding="utf-8"))
    used = json.load(open(STATE, encoding="utf-8")) if os.path.exists(STATE) else []
    titles = {t["title"] for t in bank}
    unused = [t for t in bank if t["title"] not in used]
    need = TARGET - len(unused)
    if need <= 0:
        print(f"Banka OK: {len(unused)} nepouzitych tem (>= {TARGET}), netreba dopnat.")
        return
    print(f"Nepouzitych {len(unused)} < {TARGET} -> generujem ~{need} novych tem cez {MODEL}...")
    trending = _gather_trends()
    raw = call_model(build_prompt(need + 3, sorted(titles), trending))
    items = extract_json(raw)
    added = 0
    for t in items:
        if not valid(t) or t["title"] in titles:
            continue
        bank.append(t)
        titles.add(t["title"])
        added += 1
    json.dump(bank, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Pridanych {added} novych tem. Banka ma teraz {len(bank)} tem.")


if __name__ == "__main__":
    main()
