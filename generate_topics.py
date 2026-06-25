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

ROOT = os.path.dirname(os.path.abspath(__file__))
BANK = os.path.join(ROOT, "topics_bank.json")
STATE = os.path.join(ROOT, "used_topics.json")

TARGET = int(os.environ.get("TOPICS_TARGET", "15"))   # min. pocet nepouzitych tem
MODEL = os.environ.get("MODELS_MODEL", "openai/gpt-4o-mini")
BASE = os.environ.get("MODELS_BASE_URL", "https://models.github.ai/inference")
TOKEN = os.environ.get("MODELS_TOKEN") or os.environ.get("GITHUB_TOKEN")

SYSTEM = ("You are a viral short-form video scriptwriter. You ONLY use well-known, "
          "verifiable facts (no invented numbers). You output strict JSON, nothing else.")

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


def build_prompt(n, existing_titles):
    return (
        f"Generate {n} NEW faceless short-form 'facts' video topics for TikTok / Reels / YouTube Shorts.\n"
        "Niche: surprising but TRUE facts across science, psychology, space, nature, history, the human body, animals.\n"
        "Return ONLY a JSON array (no markdown, no commentary). Each item EXACTLY this schema:\n"
        f"{json.dumps(EXAMPLE, ensure_ascii=False, indent=2)}\n\n"
        "Rules:\n"
        "- title: catchy, like '3 Facts About X' or '3 X Facts That Sound Fake'.\n"
        "- exactly 6 segments. Segment 1 is a strong HOOK (most shocking true fact first, never start with 'Did you know').\n"
        "- the LAST segment text MUST be exactly: 'Follow for more facts that sound fake but are real.'\n"
        "- each segment 'keywords': 1-3 ENGLISH words, concrete and topic-locked so real stock footage exists on Pexels.\n"
        "- facts must be accurate and widely verifiable. Do NOT invent statistics.\n"
        "- description: one engaging sentence ending with 'Follow for daily facts!'.\n"
        "- hashtags: 6-8 relevant tags including #facts #shorts #fyp.\n"
        f"- Do NOT reuse any of these existing titles: {existing_titles}\n"
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
    raw = call_model(build_prompt(need + 3, sorted(titles)))
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
