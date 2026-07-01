#!/usr/bin/env python3
"""
Trend scanner — ZADARMO. Zistí, čo ľudia v danej nike PRÁVE TERAZ riešia / čo
zbiera views, aby generate_topics.py generoval témy z reálneho dopytu, nie z hlavy.

Zdroje:
  - Reddit  (verejné .json, bez kľúča) = o čom ľudia rozmýšľajú / čo upvotujú
  - YouTube (Data API v3, kľúč v env YT_API_KEY) = aké videá teraz zbierajú views

ROBUSTNÉ: každý zdroj je v try/except. Keď čokoľvek zlyhá (blok IP, kvóta, timeout),
vráti čo sa dá (aj prázdny zoznam) a generátor pokračuje ako predtým. Nikdy nezhodí
denný beh.
"""
import datetime
import html
import json
import os
import re
import ssl
import time
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 trend-scan/1.0")
_CTX = ssl._create_unverified_context()


def _get(url, headers=None, timeout=20, attempts=2):
    """HTTP GET s textovou odpovedou. Kratky retry (siete Reddit/YouTube casto zapichnu na 1 pokus);
    volajuci si aj tak vsetko chrani vlastnym try/except (best-effort zdroj)."""
    req = urllib.request.Request(url, headers=headers or {"User-Agent": UA})
    last_err = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            last_err = e
            if attempt < attempts - 1:
                time.sleep(1.5)
    raise last_err


def _clean(title):
    t = html.unescape(title or "")
    t = re.sub(r"#\w+", " ", t)                  # preč hashtagy (#shorts, #fyp…)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^\[[^\]]{1,18}\]\s*", "", t)    # zhodí prefix typu [OC], [Discussion]
    return t.strip(" -|·")


def _latinish(t):
    """True ak je titulok prevažne v latinke (vyhodí hindčinu/tamilčinu/gudžarátčinu…)."""
    letters = [c for c in t if c.isalpha()]
    if not letters:
        return False
    lat = sum(1 for c in letters if ord(c) < 0x250)
    return lat / len(letters) >= 0.7


def reddit_trends(subreddits, period="week"):
    """Top príspevky za obdobie z daných subredditov cez Atom RSS (verejné, bez kľúča).
    .json endpoint Reddit dnes blokuje (403) — RSS prechádza. Best-effort."""
    out = []
    for sub in subreddits:
        try:
            url = f"https://www.reddit.com/r/{sub}/top/.rss?t={period}&limit=15"
            body = _get(url, headers={"User-Agent": UA})
            titles = re.findall(r"<title[^>]*>(.*?)</title>", body, re.S)
            for rank, raw in enumerate(titles[1:]):   # [0] = názov feedu, preskoč
                title = _clean(raw)
                if title:
                    out.append({"title": title, "score": 1000 - rank, "src": f"r/{sub}"})
        except Exception:
            continue
    out.sort(key=lambda x: x["score"], reverse=True)
    return out


def youtube_trends(queries, key, limit=8, days=30):
    """Najsledovanejšie videá za posledných `days` dní pre dané dopyty. Best-effort."""
    if not key:
        return []
    after = (datetime.datetime.utcnow() - datetime.timedelta(days=days)
             ).strftime("%Y-%m-%dT%H:%M:%SZ")
    out = []
    for q in queries:
        try:
            params = urllib.parse.urlencode({
                "part": "snippet", "q": q, "type": "video", "order": "viewCount",
                "maxResults": limit, "publishedAfter": after,
                "relevanceLanguage": "en", "regionCode": "US", "key": key,
            })
            data = json.loads(_get("https://www.googleapis.com/youtube/v3/search?" + params))
            for it in data.get("items", []):
                title = _clean(it.get("snippet", {}).get("title"))
                if title and _latinish(title):
                    out.append({"title": title, "score": 0, "src": f"yt:{q}"})
        except Exception:
            continue
    return out


def gather(subreddits=None, youtube_queries=None, top=20, return_meta=False):
    """Zlúči Reddit + YouTube, odstráni duplikáty, vráti zoznam titulkov (str).
    return_meta=True -> (headlines, {"reddit": n, "youtube": n})."""
    yt_key = os.environ.get("YT_API_KEY") or os.environ.get("YOUTUBE_API_KEY", "")
    red = reddit_trends(subreddits) if subreddits else []
    yt = youtube_trends(youtube_queries, yt_key) if youtube_queries else []
    items = red + yt

    seen, headlines = set(), []
    for it in items:
        t = it["title"]
        if 8 <= len(t) <= 120:
            k = re.sub(r"[^a-z0-9 ]", "", t.lower()).strip()
            if k and k not in seen:
                seen.add(k)
                headlines.append(t)
    headlines = headlines[:top]   # Reddit (so score) je hore, YouTube dopĺňa
    if return_meta:
        return headlines, {"reddit": len(red), "youtube": len(yt)}
    return headlines


if __name__ == "__main__":
    import sys
    subs = sys.argv[1].split(",") if len(sys.argv) > 1 else ["personalfinance", "Frugal"]
    qs = sys.argv[2].split(",") if len(sys.argv) > 2 else ["money habits", "wealth mindset"]
    print("Reddit subs:", subs)
    print("YT queries:", qs)
    hl = gather(subs, qs)
    print(f"\n=== {len(hl)} trending headlines ===")
    for h in hl:
        print(" -", h)
