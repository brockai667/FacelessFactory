# -*- coding: utf-8 -*-
"""Hlas (edge-tts, zadarmo) + casy slov (WordBoundary) s cache. Samostatna kopia potrebnej casti styles/stylekit.py,
aby fabrika bezala aj v GitHub Actions bez ostatnych priecinkov."""
import asyncio
import json
import os
import re
import subprocess


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    return float(out or 0)


class VO:
    def __init__(self, lines, recs, start, gap):
        self.lines, self.recs = lines, recs
        self.start, self.end = {}, {}
        t = start
        for k in lines:
            g = gap[k] if isinstance(gap, dict) and k in gap else (gap if not isinstance(gap, dict) else 0.22)
            self.start[k] = round(t, 3)
            self.end[k] = round(t + recs[k]["words"][-1]["e"], 3)
            t = self.end[k] + g
        self.last = max(self.end.values())

    def words(self, key):
        return self.recs[key]["words"]

    def at(self, key, word, which="s", nth=0):
        w = re.sub(r"[^a-z0-9]", "", word.lower())
        hits = [x for x in self.recs[key]["words"] if re.sub(r"[^a-z0-9]", "", x["w"].lower()) == w]
        if not hits:
            raise KeyError(f"slovo '{word}' nie je vo vete {key}")
        return round(self.start[key] + hits[nth][which], 3)


class Kit:
    def __init__(self, root_file, voice="en-US-AndrewNeural", rate="+0%", pitch="+0Hz"):
        self.root = os.path.dirname(os.path.abspath(root_file))
        self.voice, self.rate, self.pitch = voice, rate, pitch
        os.makedirs(os.path.join(self.root, "assets", "vo"), exist_ok=True)

    async def _tts(self, text, mp3):
        import edge_tts
        comm = edge_tts.Communicate(text, self.voice, rate=self.rate, pitch=self.pitch, boundary="WordBoundary")
        words = []
        with open(mp3, "wb") as f:
            async for ch in comm.stream():
                if ch["type"] == "audio":
                    f.write(ch["data"])
                elif ch["type"] == "WordBoundary":
                    s = ch["offset"] / 1e7
                    words.append({"w": ch["text"], "s": round(s, 3), "e": round(s + ch["duration"] / 1e7, 3)})
        return words

    def narrate(self, lines, gap=0.22, start=0.1):
        cache_f = os.path.join(self.root, "vo_cache.json")
        cache = json.load(open(cache_f, encoding="utf-8")) if os.path.exists(cache_f) else {}
        recs = {}
        for k, text in lines.items():
            mp3 = os.path.join(self.root, "assets", "vo", f"{k}.mp3")
            ck = f"{self.voice}|{self.rate}|{self.pitch}|{text}"
            if ck in cache and os.path.exists(mp3) and cache[ck].get("file") == k:
                rec = cache[ck]
            else:
                ws = []
                for att in range(4):                 # edge-tts obcas vrati prazdno -> skus znova
                    ws = asyncio.run(self._tts(text, mp3))
                    if ws:
                        break
                if not ws:
                    raise RuntimeError(f"edge-tts nevratil casy slov pre: {text}")
                rec = {"file": k, "dur": round(probe(mp3), 3), "words": ws}
                cache[ck] = rec
            toks = text.split()
            for i, w in enumerate(rec["words"]):
                w["disp"] = toks[i] if len(toks) == len(rec["words"]) else w["w"]
            recs[k] = rec
        json.dump(cache, open(cache_f, "w", encoding="utf-8"), indent=1)
        return VO(lines, recs, start, gap)
