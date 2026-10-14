"""Skener dopytu: hľadá na Reddite čerstvé príspevky, kde niekto SHÁŇA animácie / overlaye / intro / explainer.

Používa verejné RSS (bez API kľúča). Výstup: leads/out/leads-YYYY-MM-DD.csv + súhrn na stdout.
Spustenie:  python leads/scan_reddit.py            (posledný mesiac)
            python leads/scan_reddit.py --t week
"""
import argparse
import csv
import datetime as dt
import html
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

UA = "Mozilla/5.0 (predaj-animacii lead scanner)"
ATOM = "{http://www.w3.org/2005/Atom}"

# subreddit -> dotazy (Reddit search, restrict_sr)
SOURCES = {
    "forhire": ["hiring animation", "hiring motion graphics", "hiring explainer", "hiring intro", "hiring video editor"],
    "HireAnEditor": ["animation", "motion graphics", "overlay", "intro", "text animation", "captions"],
    "VideoEditingRequests": ["animation", "intro", "logo"],
    "slavelabour": ["animation", "intro", "explainer", "motion"],
    "hiring": ["motion graphics", "animation"],
    "jobbit": ["motion graphics", "animation"],
    "Twitch": ["overlay commission", "animated overlay", "looking for overlay"],
    "NewTubers": ["looking for animator", "need intro", "hire editor"],
    "SaaS": ["launch video", "demo video", "explainer video"],
    "startups": ["explainer video", "launch video"],
    "Entrepreneur": ["explainer video", "promo video"],
    "smallbusiness": ["promo video", "animated video"],
    "shopify": ["product video", "promo video"],
    "SideProject": ["launch video", "demo video", "promo video"],
    "indiehackers": ["launch video", "demo video", "explainer"],
    "ecommerce": ["product video", "video ads", "reels"],
    "socialmedia": ["reels editor", "animated reels", "motion graphics"],
    "marketing": ["motion graphics", "animated video", "explainer video"],
    "Etsy": ["product video"],
    "AppBusiness": ["app preview video", "promo video"],
    "iOSProgramming": ["app preview video", "app store video"],
}

# Hacker News (Algolia API): komentáre a príspevky, kde niekto hľadá video
HN_QUERIES = ["launch video", "demo video", "explainer video", "promo video", "product hunt video", "app preview video"]


def fetch_hn(days):
    since = int(time.time()) - days * 86400
    out = []
    for q in HN_QUERIES:
        url = "https://hn.algolia.com/api/v1/search_by_date?" + urllib.parse.urlencode(
            {"query": q, "tags": "(story,comment)", "numericFilters": f"created_at_i>{since}", "hitsPerPage": "50"})
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=25) as r:
                hits = __import__("json").load(r)["hits"]
        except Exception as e:
            print(f"  ! HN '{q}': {e}"); continue
        for h in hits:
            text = re.sub(r"<[^>]+>", " ", html.unescape(h.get("comment_text") or h.get("story_text") or ""))
            out.append({"sub": "HN", "date": (h.get("created_at") or "")[:10], "title": h.get("title") or h.get("story_title") or "",
                        "author": h.get("author", ""), "url": f"https://news.ycombinator.com/item?id={h['objectID']}",
                        "text": re.sub(r"\s+", " ", text).strip()[:400]})
        time.sleep(1)
    return out

# signál, že ide o dopyt (nie ponuku)
HIRING = re.compile(r"\[\s*hiring\s*\]|\bhiring\b|looking for|need (an?|some)|searching for|who can (make|do)|paid|budget|commission|\$\s?\d", re.I)
FOR_HIRE = re.compile(r"for\s*hire|\[\s*offer\s*\]|\bi will\b|\bi'?ll\b|\bi make\b|my portfolio|available|looking for (new )?(clients|projects|work)|"
                      r"editor here|need a .*editor\?|anyone need|editing services|services|i want to earn|i need to work|"
                      r"editor looking|editor \| |\bhere'?s my\b|starting at", re.I)
# čo vieme dodať
FIT = re.compile(r"animat|motion|overlay|intro|outro|explainer|kinetic|text effect|lower third|title|logo reveal|caption|promo|launch video|demo video|mockup|reel", re.I)

CATS = [
    ("stream overlay", re.compile(r"overlay|twitch|stream|alert|vtuber", re.I)),
    ("explainer / SaaS", re.compile(r"explainer|saas|app|demo|launch|product video|startup", re.I)),
    ("intro / logo", re.compile(r"intro|outro|logo", re.I)),
    ("titulky / text", re.compile(r"caption|subtitle|kinetic|text|lower third|title", re.I)),
    ("reels / social", re.compile(r"reel|tiktok|short|instagram|social", re.I)),
]


def fetch(sub, q, t):
    url = f"https://www.reddit.com/r/{sub}/search.rss?" + urllib.parse.urlencode(
        {"q": q, "restrict_sr": "1", "sort": "new", "t": t, "limit": "100"})
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.read()
        except Exception as e:  # 429 / sieť
            time.sleep(4 * (attempt + 1))
            err = e
    print(f"  ! {sub} '{q}': {err}")
    return b""


def parse(raw, sub):
    if not raw:
        return []
    out = []
    root = ET.fromstring(raw)
    for e in root.findall(f"{ATOM}entry"):
        title = (e.findtext(f"{ATOM}title") or "").strip()
        body = re.sub(r"<[^>]+>", " ", html.unescape(e.findtext(f"{ATOM}content") or ""))
        body = re.sub(r"\s+", " ", body).strip()
        link = e.find(f"{ATOM}link").get("href")
        author = (e.findtext(f"{ATOM}author/{ATOM}name") or "").replace("/u/", "")
        out.append({"sub": sub, "date": (e.findtext(f"{ATOM}updated") or "")[:10], "title": title,
                    "author": author, "url": link, "text": body[:400]})
    return out


def classify(p):
    blob = p["title"] + " " + p["text"]
    if FOR_HIRE.search(p["title"]) or not FIT.search(blob):
        return None
    if not HIRING.search(blob):
        return None
    cat = next((name for name, rx in CATS if rx.search(blob)), "iné")
    budget = re.search(r"\$\s?\d[\d,.]*(\s?-\s?\$?\s?\d[\d,.]*)?(\s?(/|per)\s?(hr|hour|video|min))?", blob, re.I)
    return {**p, "category": cat, "budget": budget.group(0) if budget else ""}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--t", default="month", choices=["day", "week", "month", "year"])
    args = ap.parse_args()
    seen, leads = set(), []
    for sub, queries in SOURCES.items():
        for q in queries:
            for p in parse(fetch(sub, q, args.t), sub):
                if p["url"] in seen:
                    continue
                seen.add(p["url"])
                c = classify(p)
                if c:
                    leads.append(c)
            time.sleep(4)
    days = {"day": 1, "week": 7, "month": 30, "year": 365}[args.t]
    for p in fetch_hn(days):
        if p["url"] in seen:
            continue
        seen.add(p["url"])
        c = classify({**p, "title": p["title"] + " " + p["text"][:120]})
        if c:
            leads.append({**c, "title": p["title"]})
    leads.sort(key=lambda x: x["date"], reverse=True)
    outdir = os.path.join(os.path.dirname(__file__), "out")
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, f"leads-{dt.date.today()}.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["date", "sub", "category", "budget", "title", "author", "url", "text"])
        w.writeheader()
        w.writerows(leads)
    print(f"preskenované príspevky: {len(seen)}, dopyt ktorý vieme dodať: {len(leads)} -> {path}")
    by = {}
    for l in leads:
        by.setdefault(l["sub"], 0)
        by[l["sub"]] += 1
    for k, v in sorted(by.items(), key=lambda x: -x[1]):
        print(f"  r/{k}: {v}")
    cats = {}
    for l in leads:
        cats[l["category"]] = cats.get(l["category"], 0) + 1
    print("  kategórie:", cats)
    print("  s rozpočtom:", sum(1 for l in leads if l["budget"]))


if __name__ == "__main__":
    main()
