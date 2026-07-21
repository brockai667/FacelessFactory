#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PRO engine pre MindBlownDaily reels (facts dizajn: subjektovo-presny stock, chipy so sync-om, bez mapy) (overeny na Plitvice demu, schvaleny 2026-07-04).

Co robi inak nez stary make_video.py:
- PRESNY stock: kazda scena ma query s menom miesta; overuje sa relevancia (slug musi
  obsahovat token miesta), fallback: query2 -> Wikimedia FOTO miesta s plynulym Ken Burns
  (radsej presna fotka miesta ako genericke video)
- MAPA "kde to je": satelitna equirect mapa sveta (Wikimedia), lat/lon cez Nominatim
  (ziadne vymyslene suradnice), plynuly per-frame zoom (ziadny zoompan jitter),
  pulzujuci pin + label chip so spring-inom + dokreslovana sipka
- JEDEN suvisly hlas (kokoro af_sarah; 150ms pauzy medzi vetami, ziadne sekanie)
- moderne chipy: pill + gradient + soft shadow, spring pop-in PRESNE na slove (whisper sync)
- kineticky HOOK (slova pop-uju, akcent oranzovy, underline swipe) + punch-cut
- word punch-in (jemny 4.5% zoom zaberu na klucovom slove)
- SFX: whoosh/tick/riser (synteticke, ~-20dB) + music ducking + leveler hlasu
- karaoke captions (brand orange aktivne slovo) z ORIGINALNEHO textu (whisper len casuje)
- .txt sidecar pre Buffer: titulok + popis (kde to je + hook kecy + hashtagy)

Pouzitie: python pro_engine.py scripts/auto_<slug>.json
Vyzaduje topic NOVEHO formatu (kluc "scenes"); stare temy renderuje dalej make_video.py.
"""
import json, math, os, re, shutil, subprocess, sys, tempfile

import numpy as np
import requests
import soundfile as sf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
import appconfig

CFG = appconfig.load()
W, H = int(CFG.get("width", 1080)), int(CFG.get("height", 1920))
FPS = int(CFG.get("fps", 30))
SR = 24000
SIL = 0.15
ACCENT = (255, 229, 0)
ACCENT2 = (214, 190, 0)
FONT_POP = os.path.join(ROOT, "assets", "fonts", "Poppins-SemiBold.ttf")
FONT_ANT = os.path.join(ROOT, "assets", "fonts", "Anton-Regular.ttf")
UA = {"User-Agent": "MindBlownDaily/1.0 (educational channel)"}
REQUIRE_PLACE_MATCH = False   # fakty nemaju miesto; presnost drzi subjektova query
FF = CFG.get("ffmpeg", "ffmpeg")
OUT_DIR = os.path.join(ROOT, "output")

WORDS = []           # whisper word-timingy celeho hlasu
SPEC = {}            # aktualny spec (per-topic hlas atd.)
MUSIC_CREDIT = ""
SCENES = []          # naplni sa zo specu


def run(args, cwd, timeout=900):
    r = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg fail: " + (r.stderr or "")[-500:])


# ---------------------------------------------------------------- easing
def ease_out_back(t, s=1.70158):
    t = min(max(t, 0.0), 1.0) - 1.0
    return t * t * ((s + 1) * t + s) + 1


def ease_io_cubic(t):
    t = min(max(t, 0.0), 1.0)
    return 4 * t * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 3) / 2


def ease_out_cubic(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3


# ---------------------------------------------------------------- kokoro TTS
def _kokoro_dir():
    for c in (CFG.get("kokoro_model_dir"), os.path.join(ROOT, "kokoro"), r"C:\Users\damia\kokoro"):
        if c and os.path.exists(os.path.join(c, "kokoro-v1.0.onnx")):
            return c
    return os.path.join(ROOT, "kokoro")


def _ensure_kokoro(md):
    os.makedirs(md, exist_ok=True)
    base = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
    for fn in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        p = os.path.join(md, fn)
        if not os.path.exists(p):
            sys.stderr.write(f"[kokoro] stahujem {fn}...\n")
            open(p, "wb").write(requests.get(base + fn, timeout=600).content)


def _kokoro_chunks(s, limit=280):
    """Deli text na kusky < limit (kokoro pada na >510 fonemach)."""
    sents = re.split(r"(?<=[.!?])\s+", str(s).strip())
    out, cur = [], ""
    for sent in sents:
        while len(sent) > limit:
            cut = sent.rfind(" ", 0, limit)
            cut = cut if cut > 40 else limit
            out.append((cur + " " + sent[:cut]).strip()); cur = ""
            sent = sent[cut:].strip()
        if len(cur) + len(sent) + 1 > limit:
            out.append(cur.strip()); cur = sent
        else:
            cur = (cur + " " + sent).strip()
    if cur:
        out.append(cur)
    return [c for c in out if c]


def tts_and_align(work):
    """Jeden suvisly hlas + whisper word-timingy + casy scen."""
    from kokoro_onnx import Kokoro
    md = _kokoro_dir(); _ensure_kokoro(md)
    k = Kokoro(os.path.join(md, "kokoro-v1.0.onnx"), os.path.join(md, "voices-v1.0.bin"))
    sv = SPEC.get("kokoro_voice") or (SCENES[0].get("kokoro_voice") if SCENES else "")
    voice = sv or CFG.get("kokoro_voice", "af_sarah")
    speed = float(CFG.get("kokoro_speed", 0.95))
    parts, cur = [], 0.0
    for sc in SCENES:
        start = cur
        for ch in _kokoro_chunks(sc["text"]):
            samples, sr = k.create(ch, voice=voice, speed=speed)
            parts.append(samples); cur += len(samples) / sr
        parts.append(np.zeros(int(SIL * SR), dtype=parts[-1].dtype)); cur += SIL
        sc["t0"], sc["t1"] = start, cur
        sc["dur"] = cur - start
    sf.write(os.path.join(work, "voice.wav"), np.concatenate(parts), SR)
    print(f"  hlas: {cur:.1f}s")
    from faster_whisper import WhisperModel
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(os.path.join(work, "voice.wav"), word_timestamps=True, language="en")
    WORDS[:] = [{"w": w.word.strip(), "s": max(0.0, w.start), "e": w.end}
                for seg in segs for w in (seg.words or [])]
    print(f"  align: {len(WORDS)} slov")


def scene_words(sc):
    return [w for w in WORDS if sc["t0"] - 0.05 <= w["s"] < sc["t1"]]


def word_time(sc, needle, default_rel=0.8):
    if needle:
        for w in scene_words(sc):
            if str(needle).lower().strip(".,") in w["w"].lower():
                return w["s"] - sc["t0"]
    return default_rel


# ---------------------------------------------------------------- stock (presne miesto)
def _place_tokens(spec):
    toks = set(re.findall(r"[a-z]+", (spec.get("place", "") + " " + spec.get("country", "")).lower()))
    return {t for t in toks if len(t) > 3 and t not in {"lake", "lakes", "national", "park", "island", "city", "the"}}


def pexels_find(query, place_toks, min_dur=0.0):
    """Najde portrait video; preferuje vysledky, ktorych slug obsahuje token miesta."""
    try:
        r = requests.get("https://api.pexels.com/videos/search",
                         headers={"Authorization": CFG["pexels_api_key"]},
                         params={"query": query, "per_page": 12, "orientation": "portrait"},
                         timeout=30).json()
    except Exception:
        return None, False
    vids = r.get("videos", [])
    if min_dur:
        long_enough = [v for v in vids if v.get("duration", 0) >= min_dur + 0.5]
        vids = long_enough + [v for v in vids if v not in long_enough]   # dlhsie klipy prve
    exact = [v for v in vids if place_toks & set(re.findall(r"[a-z]+", (v.get("url") or "").lower()))]
    pick_from = exact or vids
    for v in pick_from:
        files = [f for f in v.get("video_files", []) if f.get("height", 0) >= 1080
                 and f.get("width", 0) < f.get("height", 0)]
        files.sort(key=lambda f: abs(f.get("height", 0) - 1920))
        if files:
            return files[0]["link"], bool(exact)
    return None, False


# NIKDY nezobraz realnu osobu/obet (zla tvar pri cold-case = strata doveryhodnosti; napr. fotka
# nezvestneho dietata k inemu pribehu). Commons person-fotky su takmer vzdy v tychto kategoriach:
_PERSON_CATS = (" births", " deaths", "missing people", "missing person", "portrait photographs",
                "mugshot", "wanted posters", "murder victims", "crime victims", "disappearances",
                "people of ", "schoolgirls", "schoolboys", "children of", "murderers", "criminals")
_PERSON_TITLE = ("missing", "mugshot", "portrait", "headshot", "selfie", "yearbook", "wanted poster")
_STOPQ = {"the", "a", "an", "of", "and", "in", "on", "at", "to", "for", "from", "with", "was",
          "were", "is", "case", "mystery", "story", "man", "woman", "murder", "death"}


def wiki_photo(query, work, name):
    """Fotka MIESTA/OBJEKTU/DOKUMENTU z Wikimedia Commons. NIKDY realna osoba/obet
    (kategorie births/deaths/missing -> odmietni). + relevancia: obrazok musi zdielat slovo s query
    (inak nahodna zla zhoda subjektu). Ak nic vhodne -> None (scena degraduje na atmosfericky b-roll)."""
    try:
        r = requests.get("https://commons.wikimedia.org/w/api.php", headers=UA, timeout=30,
            params={"action": "query", "generator": "search", "gsrsearch": query,
                    "gsrnamespace": "6", "gsrlimit": "12", "prop": "imageinfo|categories",
                    "cllimit": "50", "iiprop": "url|size", "iiurlwidth": "2000", "format": "json"})
        pages = sorted(r.json().get("query", {}).get("pages", {}).values(),
                       key=lambda p: p.get("index", 99))
        qwords = {w for w in re.findall(r"[a-z0-9]{4,}", str(query).lower()) if w not in _STOPQ}
        for p in pages:
            ii = p.get("imageinfo")
            title = (p.get("title", "") or "").lower()
            if not ii:
                continue
            cand = ii[0].get("thumburl") or ii[0].get("url") or ""
            if not cand.lower().split("?")[0].endswith((".jpg", ".jpeg", ".png")):
                continue
            if any(b in title for b in ("icon", "logo", "flag", "seal", "coat of arms", "map")):
                continue
            cats = " || ".join(c.get("title", "").lower() for c in (p.get("categories") or []))
            if any(pc in cats for pc in _PERSON_CATS) or any(pt in title for pt in _PERSON_TITLE):
                sys.stderr.write(f"[wiki foto] preskocena osoba/obet pre '{query}'\n")
                continue
            twords = set(re.findall(r"[a-z0-9]{4,}", title))
            if qwords and not (qwords & twords):
                sys.stderr.write(f"[wiki foto] slaba zhoda subjektu pre '{query}' -> preskok\n")
                continue
            data = requests.get(cand, headers=UA, timeout=90).content
            if len(data) < 20000:
                continue
            path = os.path.join(work, name)
            open(path, "wb").write(data)
            return path
    except Exception as e:
        sys.stderr.write(f"[wiki foto] {query}: {str(e)[:80]}\n")
    return None


_USED_PHOTOS = set()


def wikipedia_pageimage(subject, work, name):
    """Hlavna fotka WIKIPEDIA clanku o subjekte - primarny vyznam riesi dvojznacnosti
    ('octopus' = zviera, nie jachta menom Octopus). Fallback na Commons je zvlast."""
    try:
        r = requests.get("https://en.wikipedia.org/w/api.php", headers=UA, timeout=30,
            params={"action": "query", "titles": subject, "prop": "pageimages",
                    "piprop": "original", "redirects": "1", "format": "json"}).json()
        pages = list(r.get("query", {}).get("pages", {}).values())
        for p in pages:
            url = (p.get("original") or {}).get("source", "")
            if not url or url in _USED_PHOTOS:
                continue
            if not url.lower().split("?")[0].endswith((".jpg", ".jpeg", ".png")):
                continue
            data = requests.get(url, headers=UA, timeout=90).content
            if len(data) < 20000:
                continue
            path = os.path.join(work, name)
            open(path, "wb").write(data)
            _USED_PHOTOS.add(url)
            return path
    except Exception as e:
        sys.stderr.write("[wikipedia foto] %s: %s\n" % (subject, str(e)[:80]))
    return None


def pexels_best(query, min_dur, min_score=2):
    """Najlepsi klip podla ZHODY query<->slug (min 2 spolocne slova = subjekt + kontext).
    Chrani pred pascami typu jachta menom 'Octopus' aj pred uplne nesuvisiacim stockom."""
    try:
        r = requests.get("https://api.pexels.com/videos/search",
                         headers={"Authorization": CFG["pexels_api_key"]},
                         params={"query": query, "per_page": 12, "orientation": "portrait"},
                         timeout=30).json()
    except Exception:
        return None
    qtoks = set(w for w in re.findall(r"[a-z]+", str(query).lower()) if len(w) > 3)
    best, best_key = None, (0, 0)
    for v in r.get("videos", []):
        slug = set(re.findall(r"[a-z]+", (v.get("url") or "").lower()))
        score = len(qtoks & slug)
        if score < min_score:
            continue
        dur_ok = 1 if v.get("duration", 0) >= min_dur + 0.5 else 0
        if (score, dur_ok) > best_key:
            files = [f for f in v.get("video_files", []) if f.get("height", 0) >= 1080
                     and f.get("width", 0) < f.get("height", 0)]
            files.sort(key=lambda f: abs(f.get("height", 0) - 1920))
            if files:
                best, best_key = files[0]["link"], (score, dur_ok)
    return best


def get_scene_visual(sc, spec, work, idx):
    """Poradie: Pexels so zhodou query<->slug (>=2 slova) -> Wikimedia FOTO subjektu
    (divak MUSI vidiet subjekt vety) -> Pexels top vysledok (posledna zachrana)."""
    for q in [sc.get("query"), sc.get("query2")]:
        if not q:
            continue
        url = pexels_best(q, sc.get("dur", 0))
        if url:
            p = os.path.join(work, f"stock_{idx}.mp4")
            open(p, "wb").write(requests.get(url, timeout=180).content)
            return "video", p
    subj = sc.get("photo_hint") or " ".join(re.findall(r"[a-z]+", str(sc.get("query", "")).lower())[:1])
    ph = wikipedia_pageimage(subj.strip(), work, f"photo_{idx}.jpg")
    if not ph:
        ph = wiki_photo(str(sc.get("query", subj)).strip(), work, f"photo_{idx}.jpg")
    if ph:
        return "photo", ph
    for q in [sc.get("query"), sc.get("query2")]:
        if not q:
            continue
        url, _ = pexels_find(q, set(), sc.get("dur", 0))
        if url:
            p = os.path.join(work, f"stock_{idx}.mp4")
            open(p, "wb").write(requests.get(url, timeout=180).content)
            return "video", p
    raise RuntimeError(f"scena {idx}: ziadny vizual pre '{sc.get('query')}'")


def clip_duration(path, cwd):
    """Dlzka klipu bez ffprobe: parsuje 'Duration: HH:MM:SS.xx' z ffmpeg -i stderr."""
    import subprocess as _sp, re as _re
    r = _sp.run([FF, "-i", os.path.basename(path)], cwd=cwd, capture_output=True, text=True)
    m = _re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", (r.stderr or ""))
    if not m:
        return 0.0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def seamless_base(path, need_dur, idx, work):
    """Ak je klip kratsi nez scena, sprav ping-pong (tam-spat) verziu = bezsvikovy loop
    (ziadne sekave skoky na svu loopu). Vrati cestu k pouzitelnemu zdroju."""
    d = clip_duration(path, work)
    if d <= 0.1 or d >= need_dur + 0.25:
        return path
    pp = os.path.join(work, f"pp_{idx}.mp4")
    run([FF, "-y", "-i", os.path.basename(path), "-filter_complex",
         "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]",
         "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
         "-pix_fmt", "yuv420p", os.path.basename(pp)], cwd=work)
    return pp


# ---------------------------------------------------------------- geokod (ziadne vymyslene suradnice)
# nezemepisne / prazdne hodnoty -> ziadna mapa (inak pin skonci naslepo v oceane, napr. 'OUTER SPACE'/'N/A')
_GEO_JUNK = {
    "", "n/a", "na", "n.a.", "none", "null", "nil", "unknown", "unknown location",
    "outer space", "space", "deep space", "the universe", "universe", "cosmos",
    "earth", "the earth", "world", "the world", "worldwide", "global", "everywhere",
    "various", "multiple", "multiple locations", "internet", "online", "cyberspace",
    "classified", "undisclosed", "redacted", "tbd", "unspecified", "not applicable",
}


def _geo_clean(s):
    return re.sub(r"\s+", " ", str(s or "").strip()).lower()


def geocode(spec):
    place = _geo_clean(spec.get("place"))
    country = _geo_clean(spec.get("country"))
    # ak miesto aj krajina su nezemepisne/prazdne -> mapa nedava zmysel
    if place in _GEO_JUNK and country in _GEO_JUNK:
        return None
    if place in _GEO_JUNK and len(country) < 3:
        return None
    q = f"{spec.get('place', '')}, {spec.get('country', '')}".strip(", ")
    try:
        r = requests.get("https://nominatim.openstreetmap.org/search", headers=UA,
                         params={"q": q, "format": "json", "limit": 1}, timeout=30).json()
        if r:
            top = r[0]
            imp = float(top.get("importance") or 0.0)
            cls = str(top.get("class") or "")
            # realne miesta (mesto/hranica) alebo dost silna zhoda; inak radsej ziadna mapa
            if imp >= 0.30 or cls in ("place", "boundary"):
                return float(top["lat"]), float(top["lon"])
            sys.stderr.write(f"[geocode] slaba zhoda (imp={imp:.2f}, {cls}) pre '{q}' -> bez mapy\n")
    except Exception as e:
        sys.stderr.write(f"[geocode] {str(e)[:80]}\n")
    ll = spec.get("latlon")
    if isinstance(ll, (list, tuple)) and len(ll) == 2:
        try:
            la, lo = float(ll[0]), float(ll[1])
            if -90 <= la <= 90 and -180 <= lo <= 180 and not (abs(la) < 0.01 and abs(lo) < 0.01):
                return la, lo
        except Exception:
            pass
    return None


# ---------------------------------------------------------------- kreslenie (chipy, tiene)
def _shadowed(base, blur=18, dy=10, alpha=110):
    sh = Image.new("RGBA", (base.width + 80, base.height + 80), (0, 0, 0, 0))
    a = base.split()[3].point(lambda v: min(v, alpha))
    tmp = Image.new("RGBA", base.size, (0, 0, 0, 255)); tmp.putalpha(a)
    sh.alpha_composite(tmp, (40, 40 + dy))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    sh.alpha_composite(base, (40, 40))
    return sh


def chip_png(text, size=58, kind="orange", font=FONT_ANT, tracking=2):
    f = ImageFont.truetype(font, size)
    tmp = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
    tw = int(tmp.textlength(text, font=f)) + tracking * max(0, len(text) - 1)
    padx, pady = int(size * 0.62), int(size * 0.42)
    w, h = tw + 2 * padx, size + 2 * pady
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = h // 2
    if kind == "accent":
        grad = Image.new("RGBA", (1, h))
        for y in range(h):
            t = y / max(1, h - 1)
            c = tuple(int(ACCENT[i] * (1 - t) + ACCENT2[i] * t) for i in range(3)) + (255,)
            grad.putpixel((0, y), c)
        grad = grad.resize((w, h))
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
        im.paste(grad, (0, 0), mask)
        fg = (16, 14, 10, 255)
    elif kind == "red":
        grad = Image.new("RGBA", (1, h))
        for y in range(h):
            tt = y / max(1, h - 1)
            c = tuple(int((214, 48, 49)[i] * (1 - tt) + (150, 24, 28)[i] * tt) for i in range(3)) + (255,)
            grad.putpixel((0, y), c)
        grad = grad.resize((w, h))
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
        im.paste(grad, (0, 0), mask)
        fg = (255, 255, 255, 255)
    elif kind == "glass":
        d.rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=(12, 14, 18, 205))
        d.rounded_rectangle((0, 0, w - 1, h - 1), radius=r, outline=(255, 255, 255, 70), width=2)
        fg = (255, 255, 255, 255)
    else:
        d.rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=(250, 250, 250, 242))
        fg = (14, 14, 14, 255)
    x = padx
    for ch in text:
        d.text((x, pady - size * 0.06), ch, font=f, fill=fg)
        x += tmp.textlength(ch, font=f) + tracking
    return _shadowed(im)


def paste_scaled(canvas, im, cx, cy, scale, alpha=1.0):
    if scale <= 0.01 or alpha <= 0.01:
        return
    w, h = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    im2 = im.resize((w, h), Image.LANCZOS)
    if alpha < 1.0:
        a = im2.split()[3].point(lambda v: int(v * alpha))
        im2.putalpha(a)
    canvas.alpha_composite(im2, (int(cx - w / 2), int(cy - h / 2)))


# ---------------------------------------------------------------- overlay sekvencie
def render_overlay_seq(sc, idx, work):
    n = int(round(sc["dur"] * FPS))
    d = os.path.join(work, f"ovr_{idx}")
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    role = sc["role"]
    chips, hook_words = {}, []
    if role == "hook":
        raw = (sc.get("hook_top") or sc["text"]).upper()
        raw = re.sub(r"[^A-Z0-9' ]", "", raw)
        ws = raw.split()[:6]
        hook_words = [(w, "o" if i == len(ws) - 1 else "w") for i, w in enumerate(ws)]
    elif role in ("fact",):
        for ci, c in enumerate((sc.get("chips") or [])[:2]):
            chips[ci] = {"img": chip_png(str(c.get("t", ""))[:24].upper(), 62 if ci else 64,
                                         c.get("style", "accent" if ci else "white")),
                         "at": word_time(sc, c.get("on"), 0.5 + 1.5 * ci)}
    elif role == "callout":
        chips[0] = {"img": chip_png(str(sc.get("label", ""))[:24].upper(), 60, "accent"),
                    "at": word_time(sc, sc.get("label_on") or sc.get("punch"), 1.2)}
        if sc.get("sub"):
            chips[1] = {"img": chip_png(str(sc["sub"])[:34], 42, "glass", FONT_POP),
                        "at": chips[0]["at"] + 0.25}
    elif role == "cta":
        chips[0] = {"img": chip_png("@MindBlownDaily", 58, "accent"), "at": 0.35}
        chips[1] = {"img": chip_png("FOLLOW FOR MORE", 44, "glass", FONT_POP), "at": 0.6}
    for fi in range(n):
        t = fi / FPS
        cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        if role == "hook":
            y = 430
            dtmp = ImageDraw.Draw(cv)
            f120 = ImageFont.truetype(FONT_ANT, 120)
            lines, line, lw = [], [], 0
            for i, (wtxt, col) in enumerate(hook_words):
                wwd = dtmp.textlength(wtxt, font=f120)
                if lw + wwd > W - 260 and line:
                    lines.append(line); line, lw = [], 0
                line.append((wtxt, col, wwd)); lw += wwd + 30
            if line:
                lines.append(line)
            wi_glob = 0
            for li, ln in enumerate(lines):
                total = sum(wd for _, _, wd in ln) + 30 * (len(ln) - 1)
                x = (W - total) / 2
                for (wtxt, col, wwd) in ln:
                    t0 = 0.25 + wi_glob * 0.14
                    p = ease_out_back((t - t0) / 0.30)
                    if t >= t0:
                        wim = Image.new("RGBA", (int(wwd) + 40, 170), (0, 0, 0, 0))
                        dw = ImageDraw.Draw(wim)
                        fill = ACCENT + (255,) if col == "o" else (255, 255, 255, 255)
                        dw.text((20, 10), wtxt, font=f120, fill=fill,
                                stroke_width=6, stroke_fill=(10, 10, 12, 230))
                        paste_scaled(cv, _shadowed(wim, blur=14, dy=8), x + wwd / 2,
                                     y + li * 150, 0.7 + 0.3 * p, min(1.0, p * 1.4))
                    x += wwd + 30
                    wi_glob += 1
            tu = 0.25 + len(hook_words) * 0.14 + 0.1
            if t >= tu and lines:
                p = ease_out_cubic((t - tu) / 0.35)
                last_y = y + (len(lines) - 1) * 150 + 90
                uw = int(min(330, lines[-1][-1][2]) * p)
                ImageDraw.Draw(cv).rounded_rectangle(
                    (W / 2 - uw / 2, last_y, W / 2 + uw / 2, last_y + 18),
                    radius=9, fill=ACCENT + (255,))
        elif role == "count":
            num = str(sc.get("num") or 1)
            fN = ImageFont.truetype(FONT_ANT, 300)
            tmpd = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
            nw = int(tmpd.textlength(num, font=fN))
            p = ease_out_back((t - 0.12) / 0.34)
            if t >= 0.12:
                nim = Image.new("RGBA", (nw + 80, 380), (0, 0, 0, 0))
                ImageDraw.Draw(nim).text((40, 10), num, font=fN, fill=ACCENT + (255,),
                                         stroke_width=9, stroke_fill=(10, 10, 12, 235))
                paste_scaled(cv, _shadowed(nim, blur=16, dy=10), W / 2, 470,
                             0.6 + 0.4 * min(1, p), min(1, p * 1.4))
            lab = str(sc.get("label", "")).upper()[:24]
            if lab and t >= 0.5:
                p2 = ease_out_back((t - 0.5) / 0.34)
                paste_scaled(cv, chip_png(lab, 60, "accent"), W / 2, 770,
                             min(1, p2), min(1, p2 * 1.5))
        elif role in ("myth", "truth"):
            band_txt = "MYTH" if role == "myth" else "ACTUALLY"
            band_kind = "red" if role == "myth" else "accent"
            p = ease_out_back((t - 0.12) / 0.34)
            if t >= 0.12:
                paste_scaled(cv, chip_png(band_txt, 66, band_kind), W / 2, 430,
                             min(1, p), min(1, p * 1.5))
            claim = str(sc.get("label") or "")[:30]
            if claim and t >= 0.5:
                p2 = ease_out_cubic((t - 0.5) / 0.4)
                paste_scaled(cv, chip_png(claim, 46, "glass", FONT_POP), W / 2, 600,
                             min(1, p2), min(1, p2 * 1.5))
        elif role == "reveal":
            fl = max(0.0, 1 - abs(t - 0.30) / 0.18)
            if fl > 0.02:
                cv.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(170 * fl))))
            raw = re.sub(r"[^A-Za-z0-9' ]", "", (sc.get("reveal_top") or sc.get("text", "")).upper())
            words = raw.split()[:6]
            fR = ImageFont.truetype(FONT_ANT, 92)
            dtmp = ImageDraw.Draw(cv)
            lines, line, lw = [], [], 0
            for wtxt in words:
                wwd = dtmp.textlength(wtxt, font=fR)
                if lw + wwd > W - 200 and line:
                    lines.append(line); line, lw = [], 0
                line.append((wtxt, wwd)); lw += wwd + 26
            if line:
                lines.append(line)
            p = ease_out_back((t - 0.30) / 0.36)
            if t >= 0.30:
                for li, ln in enumerate(lines):
                    total = sum(wd for _, wd in ln) + 26 * (len(ln) - 1)
                    x = (W - total) / 2
                    for (wtxt, wwd) in ln:
                        wim = Image.new("RGBA", (int(wwd) + 40, 150), (0, 0, 0, 0))
                        ImageDraw.Draw(wim).text((20, 8), wtxt, font=fR, fill=(255, 255, 255, 255),
                                                 stroke_width=6, stroke_fill=(10, 10, 12, 235))
                        paste_scaled(cv, _shadowed(wim, blur=12, dy=6), x + wwd / 2,
                                     520 + li * 130, 0.7 + 0.3 * min(1, p), min(1, p * 1.4))
                        x += wwd + 26
        else:
            ypos = [360, 505 if role == "callout" else 520]
            for ci in sorted(chips):
                c = chips[ci]
                p = ease_out_back((t - c["at"]) / 0.35)
                breath = 1 + (0.015 * math.sin(2 * math.pi * t / 1.6) if role == "cta" else 0)
                if t >= c["at"]:
                    paste_scaled(cv, c["img"], W / 2, ypos[min(ci, 1)], p * breath, min(1, p * 1.5))
            if role == "callout" and chips:
                ta = chips[0]["at"]
                p3 = ease_io_cubic((t - ta - 0.45) / 0.4)
                if t >= ta + 0.45 and p3 > 0.02:
                    ln = int(240 * p3)
                    da = ImageDraw.Draw(cv)
                    x0, y0 = W // 2, 600
                    da.line((x0, y0, x0, y0 + ln), fill=(255, 255, 255, 235), width=10)
                    if p3 > 0.85:
                        da.polygon([(x0 - 24, y0 + ln - 8), (x0 + 24, y0 + ln - 8),
                                    (x0, y0 + ln + 34)], fill=(255, 255, 255, 235))
        cv.save(os.path.join(d, f"{fi:04d}.png"))
    return d


# ---------------------------------------------------------------- mapa (satelit, lat/lon)
WORLD_MAPS = ["Equirectangular projection SW.jpg", "Equirectangular-projection.jpg",
              "Whole world - land and oceans.jpg"]


def render_map_frames(sc, spec, idx, work):
    n = int(round(sc["dur"] * FPS))
    d = os.path.join(work, f"map_{idx}")
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    src_png = os.path.join(work, "world.jpg")
    if not os.path.exists(src_png):
        for fn in WORLD_MAPS:
            try:
                u = ("https://commons.wikimedia.org/wiki/Special:FilePath/"
                     + requests.utils.quote(fn) + "?width=4000")
                data = requests.get(u, headers=UA, timeout=120).content
                if len(data) > 100000:
                    open(src_png, "wb").write(data); break
            except Exception:
                continue
    src = Image.open(src_png).convert("RGB")
    sw, sh = src.size
    lat, lon = sc["latlon"]
    fx, fy = (lon + 180.0) / 360.0 * sw, (90.0 - lat) / 180.0 * sh    # equirect -> px
    label = chip_png(str(spec.get("place", ""))[:22].upper(), 62, "accent")
    sub = chip_png(str(spec.get("country", ""))[:22].upper(), 42, "glass", FONT_POP)
    map_h_frac = 0.62
    vw0 = sw                                            # zoom: cely svet -> region (~26 stupnov)
    vw1 = max(sw * 26.0 / 360.0, sw * 0.06)
    for fi in range(n):
        t = fi / FPS
        z = ease_io_cubic(t / max(0.9, sc["dur"] * 0.80))
        cw = vw0 + (vw1 - vw0) * z
        ch = cw * (H * map_h_frac) / W
        cx = sw / 2 + (fx - sw / 2) * z
        cy = sh / 2 + (fy - sh / 2) * z
        cx = min(max(cx, cw / 2), sw - cw / 2)
        cy = min(max(cy, ch / 2), sh - ch / 2)
        Hm = int(H * map_h_frac)
        left = cx - cw / 2.0
        top_ = cy - ch / 2.0
        # sub-pixelovy zoom cez affinnu transformaciu -> ziadne int() skoky crop-boxu = plynule
        crop = src.transform((W, Hm), Image.AFFINE, (cw / W, 0, left, 0, ch / Hm, top_),
                             resample=Image.BICUBIC)
        crop = Image.eval(crop, lambda v: int(v * 0.92))
        cv = Image.new("RGBA", (W, H), (8, 11, 16, 255))
        y0 = int((H - Hm) / 2)
        cv.paste(crop, (0, y0))
        gr = Image.new("L", (1, 120), 0)
        for y in range(120):
            gr.putpixel((0, y), int(255 * (1 - y / 119)))
        grad = gr.resize((W, 120))
        dark = Image.new("RGBA", (W, 120), (8, 11, 16, 255)); dark.putalpha(grad)
        cv.alpha_composite(dark, (0, y0))
        cv.alpha_composite(dark.transpose(Image.FLIP_TOP_BOTTOM), (0, y0 + crop.height - 120))
        pxc = (fx - left) / cw * W
        pyc = y0 + (fy - top_) / ch * Hm
        dd = ImageDraw.Draw(cv)
        ph = (t % 1.6) / 1.6
        rr = 18 + 34 * ph
        dd.ellipse((pxc - rr, pyc - rr, pxc + rr, pyc + rr),
                   outline=ACCENT + (int(200 * (1 - ph)),), width=6)
        dd.ellipse((pxc - 13, pyc - 13, pxc + 13, pyc + 13), fill=(255, 255, 255, 255),
                   outline=ACCENT + (255,), width=5)
        pl = ease_out_back((t - 0.7) / 0.4)
        if t >= 0.7:
            paste_scaled(cv, label, pxc, pyc - 300, pl, min(1, pl * 1.5))
            pa = ease_io_cubic((t - 1.0) / 0.35)
            if t >= 1.0 and pa > 0.02:
                ln = int(170 * pa)
                dd.line((pxc, pyc - 205, pxc, pyc - 205 + ln), fill=(255, 255, 255, 240), width=9)
                if pa > 0.85:
                    dd.polygon([(pxc - 20, pyc - 205 + ln - 6), (pxc + 20, pyc - 205 + ln - 6),
                                (pxc, pyc - 205 + ln + 28)], fill=(255, 255, 255, 240))
        ps = ease_out_back((t - 1.3) / 0.4)
        if t >= 1.3:
            paste_scaled(cv, sub, pxc, pyc + 110, ps, min(1, ps * 1.5))
        cv.convert("RGB").save(os.path.join(d, f"{fi:04d}.png"))
    return d


# ---------------------------------------------------------------- foto Ken Burns (fallback)
def render_photo_frames(photo, sc, idx, work):
    n = int(round(sc["dur"] * FPS))
    d = os.path.join(work, f"kb_{idx}")
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    src = Image.open(photo).convert("RGB")
    sw, sh = src.size
    tgt_ratio = W / H
    base_w = min(sw, int(sh * tgt_ratio))
    base_h = int(base_w / tgt_ratio)
    for fi in range(n):
        t = fi / FPS
        z = 1.0 + 0.14 * ease_io_cubic(t / max(0.9, sc["dur"]))
        cw, ch = int(base_w / z), int(base_h / z)
        cx = sw / 2 + (sw * 0.04) * math.sin(t / max(1, sc["dur"]) * math.pi)
        cy = sh / 2
        box = (int(max(0, min(cx - cw / 2, sw - cw))), int(max(0, min(cy - ch / 2, sh - ch))))
        crop = src.crop((box[0], box[1], box[0] + cw, box[1] + ch)).resize((W, H), Image.LANCZOS)
        crop.save(os.path.join(d, f"{fi:04d}.png"))
    return d


# ---------------------------------------------------------------- SFX + audio mix
def _env_hann(n, peak=0.45):
    e = np.hanning(int(2 * n * peak))[:int(n * peak)]
    out = np.ones(n); out[:len(e)] = e
    r = np.hanning(int(2 * (n - len(e))))[int(n - len(e)):]
    out[len(out) - len(r):] = r
    return out


def sfx_whoosh(dur=0.32, vol=0.10):
    n = int(dur * SR)
    noise = np.random.randn(n); out = np.zeros(n); lp = 0.0
    for i in range(n):
        f = 500 + 2700 * (i / n)
        a = math.exp(-2 * math.pi * f / SR)
        lp = a * lp + (1 - a) * noise[i]; out[i] = lp
    out *= _env_hann(n)
    return vol * out / (np.max(np.abs(out)) + 1e-9)


def sfx_tick(vol=0.09):
    n = int(0.05 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.012)
    s[:24] += 0.6 * np.random.randn(24) * np.linspace(1, 0, 24)
    return vol * s / (np.max(np.abs(s)) + 1e-9)


def sfx_riser(dur=1.1, vol=0.07):
    n = int(dur * SR)
    noise = np.random.randn(n); out = np.zeros(n); px, py = 0.0, 0.0
    for i in range(n):
        f = 300 + 2200 * (i / n) ** 1.5
        a = math.exp(-2 * math.pi * f / SR)
        py = a * (py + noise[i] - px); px = noise[i]; out[i] = py
    out *= np.linspace(0, 1, n) ** 2
    out[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return vol * out / (np.max(np.abs(out)) + 1e-9)


def highpass(x, fc=82.0):
    try:
        from scipy.signal import butter, sosfilt
        sos = butter(2, fc / (SR / 2), btype="high", output="sos")
        return sosfilt(sos, x)
    except Exception:
        a = math.exp(-2 * math.pi * fc / SR)
        y = np.zeros_like(x); px, py = 0.0, 0.0
        for i in range(len(x)):
            py = a * (py + x[i] - px); px = x[i]; y[i] = py
        return y


def rms_leveler(x, target_db=-19.0, win=4096, hop=1024):
    tgt = 10 ** (target_db / 20)
    n = len(x); gains, idx = [], []; g_s = 1.0
    for i in range(0, n - win, hop):
        r = float(np.sqrt(np.mean(x[i:i + win] ** 2))) + 1e-9
        g = min(1.9, max(0.6, tgt / r)); g_s = 0.9 * g_s + 0.1 * g
        gains.append(g_s); idx.append(i + win // 2)
    if not gains:
        return x
    return x * np.interp(np.arange(n), idx, gains)


def speech_envelope(x, atk=0.06, rel=0.30, hop=480):
    n = len(x); pts = []
    for i in range(0, n, hop):
        pts.append(float(np.sqrt(np.mean(x[i:i + hop] ** 2))))
    pts = np.array(pts)
    norm = np.percentile(pts[pts > 0.001], 80) if np.any(pts > 0.001) else 1.0
    pts = np.clip(pts / (norm + 1e-9), 0, 1)
    out = np.zeros_like(pts); e = 0.0
    a_a = math.exp(-hop / (atk * SR)); a_r = math.exp(-hop / (rel * SR))
    for i, v in enumerate(pts):
        aa = a_a if v > e else a_r
        e = aa * e + (1 - aa) * v; out[i] = e
    return np.interp(np.arange(n), np.arange(len(out)) * hop, out)


def build_audio(work, sfx_times):
    voice, _ = sf.read(os.path.join(work, "voice.wav"))
    voice = rms_leveler(highpass(voice.astype(np.float64)))
    n = len(voice)
    _mdir = os.path.join(ROOT, "assets", "music")
    _cands = sorted(f for f in os.listdir(_mdir) if f.endswith(".mp3"))
    _niche = [f for f in _cands if f != "bg.mp3"] or _cands or ["bg.mp3"]
    import random as _rnd
    _pick = _rnd.choice(_niche)
    music_src = os.path.join(_mdir, _pick)
    global MUSIC_CREDIT
    if _pick != "bg.mp3":
        MUSIC_CREDIT = ("\nMusic: " + os.path.splitext(_pick)[0]
                        + " - Kevin MacLeod (incompetech.com), CC BY 4.0")
    print("  hudba: " + _pick)
    run([FF, "-y", "-i", music_src, "-t", str(int(n / SR) + 3), "-ar", str(SR), "-ac", "1",
         "music24.wav"], cwd=work)
    music, _ = sf.read(os.path.join(work, "music24.wav"))
    music = music.astype(np.float64)[:n] if len(music) >= n else np.pad(music, (0, n - len(music)))
    music = music / (np.sqrt(np.mean(music ** 2)) + 1e-9) * 0.2   # konzist. hlasitost trackov
    fi = int(1.2 * SR); music[:fi] *= np.linspace(0, 1, fi)
    fo = int(1.5 * SR); music[-fo:] *= np.linspace(1, 0, fo)
    music *= 0.16 * (1.0 - 0.62 * speech_envelope(voice))
    sfx = np.zeros(n)
    for kind, t, kw in sfx_times:
        s = {"whoosh": sfx_whoosh, "tick": sfx_tick}.get(kind, sfx_whoosh)(**kw) \
            if kind != "riser" else sfx_riser(**kw)
        i = int(t * SR)
        if 0 <= i < n - len(s):
            sfx[i:i + len(s)] += s
    mix = voice + music + sfx
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.87
    sf.write(os.path.join(work, "mixed.wav"), mix, SR)


# ---------------------------------------------------------------- captions
def ass_time(t):
    return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"


def build_ass(work):
    hl_bgr = "00E5FF"
    lines = ["[Script Info]", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 2", "",
             "[V4+ Styles]",
             "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, BorderStyle",
             "Style: Cap,Poppins SemiBold,64,&H00FFFFFF,&H00000000,&H96000000,-1,3,1,2,90,90,540,1",
             "", "[Events]", "Format: Layer, Start, End, Style, Text"]
    for sc in SCENES:
        if sc["role"] == "hook":
            continue
        orig = re.findall(r"[A-Za-z0-9'+\-]+", sc["text"])
        wh = scene_words(sc)
        if not (orig and wh):
            continue
        mapped = []
        for j, ow in enumerate(orig):
            k = round(j * (len(wh) - 1) / max(1, len(orig) - 1)) if len(orig) > 1 else 0
            mapped.append({"w": ow, "s": wh[k]["s"], "e": wh[k]["e"]})
        for j in range(1, len(mapped)):
            if mapped[j]["s"] <= mapped[j - 1]["s"]:
                mapped[j]["s"] = mapped[j - 1]["s"] + 0.10
                mapped[j]["e"] = max(mapped[j]["e"], mapped[j]["s"] + 0.10)
        for c0 in range(0, len(mapped), 4):
            chunk = mapped[c0:c0 + 4]
            for wi, w in enumerate(chunk):
                parts = [("{\\c&H" + hl_bgr + "&}" + x["w"].upper() + "{\\c&HFFFFFF&}")
                         if xj == wi else x["w"].upper() for xj, x in enumerate(chunk)]
                start = w["s"]
                end = chunk[wi + 1]["s"] if wi + 1 < len(chunk) else w["e"]
                if end <= start:
                    end = start + 0.12
                lines.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Cap,{' '.join(parts)}")
    open(os.path.join(work, "captions.ass"), "w", encoding="utf-8-sig").write("\n".join(lines))


# ---------------------------------------------------------------- render scen
GRADE = "eq=contrast=1.07:saturation=1.13:brightness=0.01,vignette=angle=PI/5,noise=alls=4:allf=t"


def punch_expr(T, amt=0.045, d=0.34):
    st = f"min(max((t-{T})/{d},0),1)"
    p = f"(1+{amt}*({st}*{st}*(3-2*{st})))"
    return (f"crop=w='floor(iw/{p}/2)*2':h='floor(ih/{p}/2)*2':x='(iw-ow)/2':y='(ih-oh)/2',"
            f"scale={W}:{H}")


def render_scene(sc, spec, idx, work):
    out = f"scene_{idx}.mp4"
    n = int(round(sc["dur"] * FPS))
    dur = n / FPS
    role = sc["role"]
    vf_base = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
               f"{GRADE},fps={FPS},setpts=PTS-STARTPTS")
    if role == "map":
        mdir = render_map_frames(sc, spec, idx, work)
        run([FF, "-y", "-framerate", str(FPS), "-i", f"{os.path.basename(mdir)}/%04d.png",
             "-frames:v", str(n), "-vf", "vignette=angle=PI/5.5",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", out],
            cwd=work)
        return
    kind, path = get_scene_visual(sc, spec, work, idx)
    if kind == "video":
        path = seamless_base(path, dur, idx, work)   # kratky klip -> ping-pong (ziadne sekanie)
    odir = render_overlay_seq(sc, idx, work)
    punch = ""
    if sc.get("punch"):
        punch = "," + punch_expr(word_time(sc, sc["punch"], dur * 0.45))
    if kind == "photo":
        kdir = render_photo_frames(path, sc, idx, work)
        run([FF, "-y", "-framerate", str(FPS), "-i", f"{os.path.basename(kdir)}/%04d.png",
             "-frames:v", str(n), "-vf", GRADE + punch, "-c:v", "libx264",
             "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", f"base_{idx}.mp4"],
            cwd=work)
        base = f"base_{idx}.mp4"
    elif role == "hook":
        d1 = dur * 0.55; d2 = dur - d1
        run([FF, "-y", "-stream_loop", "-1", "-i", os.path.basename(path), "-t", f"{d1:.3f}",
             "-vf", vf_base, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
             "-pix_fmt", "yuv420p", "h1.mp4"], cwd=work)
        run([FF, "-y", "-stream_loop", "-1", "-i", os.path.basename(path),
             "-ss", "2", "-t", f"{d2:.3f}",
             "-vf", f"scale={int(W*1.16)}:{int(H*1.16)}:force_original_aspect_ratio=increase,"
                    f"crop={W}:{H},{GRADE},fps={FPS},setpts=PTS-STARTPTS",
             "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
             "-pix_fmt", "yuv420p", "h2.mp4"], cwd=work)
        open(os.path.join(work, "hl.txt"), "w").write("file 'h1.mp4'\nfile 'h2.mp4'\n")
        run([FF, "-y", "-f", "concat", "-safe", "0", "-i", "hl.txt", "-c", "copy",
             f"base_{idx}.mp4"], cwd=work)
        base = f"base_{idx}.mp4"
    else:
        run([FF, "-y", "-stream_loop", "-1", "-i", os.path.basename(path), "-t", f"{dur:.3f}",
             "-vf", vf_base + punch, "-an", "-c:v", "libx264", "-preset", "veryfast",
             "-crf", "18", "-pix_fmt", "yuv420p", f"base_{idx}.mp4"], cwd=work)
        base = f"base_{idx}.mp4"
    run([FF, "-y", "-i", base, "-framerate", str(FPS), "-i", f"{os.path.basename(odir)}/%04d.png",
         "-filter_complex", "[0:v][1:v]overlay=0:0:shortest=0[v]", "-map", "[v]",
         "-frames:v", str(n), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
         "-pix_fmt", "yuv420p", out], cwd=work)


# ---------------------------------------------------------------- main
def slugify(t):
    return re.sub(r"[^a-z0-9]+", "_", str(t).lower()).strip("_")[:50] or "video"


def make_thumbnail(spec, work, out_path):
    """Putavy YouTube thumbnail: cisty b-roll frame (pred hook textom) + velky hook titulok
    + accent keyword + brand handle. Best-effort - nikdy nezhodi render."""
    try:
        cand = []
        # kandidati: cisty hook opening (video.mp4 pred textom) + CISTE b-roll scen (base_i.mp4 pred overlaymi)
        srcs = [("video.mp4", "0.12")]
        for i in range(1, 7):
            if os.path.exists(os.path.join(work, f"base_{i}.mp4")):
                srcs.append((f"base_{i}.mp4", "1.0"))
        for src, ts in srcs:
            fp = "th_" + src.replace(".mp4", "") + ".png"
            run([FF, "-y", "-ss", ts, "-i", src, "-frames:v", "1", fp], cwd=work)
            p = os.path.join(work, fp)
            if os.path.exists(p):
                px = list(Image.open(p).convert("L").resize((32, 32)).getdata())
                mean = sum(px) / len(px)
                var = sum((v - mean) ** 2 for v in px) / len(px)
                score = min(mean, 200) + var ** 0.5   # jas (nie cierne) + kontrast (nie ploche/mriezka)
                cand.append((score, p))   # jas -> obide cierne/prechodove framy
        if not cand:
            return None
        cand.sort(reverse=True)
        bg = Image.open(cand[0][1]).convert("RGB")
        r = max(W / bg.width, H / bg.height)
        bg = bg.resize((int(bg.width * r), int(bg.height * r)), Image.LANCZOS)
        ox, oy = (bg.width - W) // 2, (bg.height - H) // 2
        bg = bg.crop((ox, oy, ox + W, oy + H)).convert("RGBA")
        bg.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, 42)))     # lahke stmavenie -> subjekt vidno
        grad = Image.new("L", (1, H), 0)
        for y in range(H):
            grad.putpixel((0, y), int(245 * (min(1, max(0, (y - H * 0.5) / (H * 0.5))) ** 1.15)))
        gg = Image.new("RGBA", (W, H), (5, 7, 10, 255)); gg.putalpha(grad.resize((W, H)))
        bg.alpha_composite(gg)
        d = ImageDraw.Draw(bg)
        # 2026 best-practice: <=3 slova, ziadny clutter (handle netreba - grid ukazuje nazov kanala)
        raw = spec.get("thumb") or spec["scenes"][0].get("hook_top") or spec.get("title", "")
        words = [w for w in re.sub(r"[^A-Za-z0-9'? ]", "", str(raw).upper()).split() if w]
        if not spec.get("thumb"):
            while words and words[0] in ("THE", "A", "AN"):
                words.pop(0)
            words = words[:3]
        words = words[:4] or ["?"]
        n = len(words); acc_i = n - 1
        size = 196 if n <= 2 else (172 if n == 3 else 150)
        fT = ImageFont.truetype(FONT_ANT, size)
        lines, line, lw = [], [], 0
        for i, w in enumerate(words):
            wwd = d.textlength(w, font=fT)
            if lw + wwd > W - 110 and line:
                lines.append(line); line, lw = [], 0
            line.append((w, i, wwd)); lw += wwd + 28
        if line:
            lines.append(line)
        lh = int(size * 1.06); y0 = H - 215 - len(lines) * lh
        for li, ln in enumerate(lines):
            tot = sum(x for _, _, x in ln) + 28 * (len(ln) - 1); x = (W - tot) / 2
            for w, i, wwd in ln:
                fill = ACCENT if i == acc_i else (255, 255, 255)
                d.text((x, y0 + li * lh), w, font=fT, fill=fill + (255,),
                       stroke_width=12, stroke_fill=(4, 4, 6, 255))
                x += wwd + 28
        bg.convert("RGB").save(out_path, quality=94)
        print(f"  thumbnail OK: {os.path.basename(out_path)}")
        return out_path
    except Exception as e:
        sys.stderr.write(f"[thumb] {str(e)[:120]}\n")
        return None


def prepend_cover(final_path, jpg_path, work):
    """Predsadi ~0.6s dizajnovy cover (thumbnail) na zaciatok videa: pekny 'grid' thumbnail na
    VSETKYCH kanaloch (bez telefon-verifikacie) + posilneny hook. Best-effort - pri chybe necha original."""
    try:
        if not os.path.exists(jpg_path):
            return
        run([FF, "-y", "-loop", "1", "-i", jpg_path, "-f", "lavfi",
             "-i", "anullsrc=r=44100:cl=stereo", "-t", "0.6",
             "-vf", f"scale={W}:{H},format=yuv420p", "-r", str(FPS),
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
             "-c:a", "aac", "-b:a", "160k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
             "cover.mp4"], cwd=work)
        run([FF, "-y", "-i", "cover.mp4", "-i", final_path,
             "-filter_complex", "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]",
             "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
             "-maxrate", "9M", "-bufsize", "14M", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "with_cover.mp4"], cwd=work)
        shutil.copy(os.path.join(work, "with_cover.mp4"), final_path)
        print("  cover predsadeny (0.6s) -> grid thumbnail + silny hook")
    except Exception as e:
        sys.stderr.write(f"[cover] {str(e)[:120]}\n")


def main():
    if len(sys.argv) < 2:
        print("Pouzitie: python pro_engine.py scripts/spec.json"); sys.exit(1)
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    SPEC.clear(); SPEC.update(spec)
    global SCENES
    SCENES = list(spec.get("scenes") or [])
    if not SCENES:
        print("CHYBA: spec nema 'scenes' (stary format? pouzi make_video.py)"); sys.exit(2)
    for sc in SCENES:
        sc.setdefault("role", "fact")
    if SCENES[0]["role"] != "hook":
        SCENES[0]["role"] = "hook"
    if SCENES[-1]["role"] != "cta":
        SCENES[-1]["role"] = "cta"
    work = tempfile.mkdtemp(prefix="pro_")
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"PRO engine: {spec.get('title', '?')}  ({len(SCENES)} scen)")
    # mapa potrebuje suradnice (Nominatim; ak zlyha, latlon zo specu; inak mapu vynechaj)
    ll = geocode(spec)
    for sc in SCENES:
        if sc["role"] == "map":
            if ll:
                sc["latlon"] = ll
            else:
                sc["role"] = "fact"
                print("  [mapa] suradnice sa nenasli -> scena bude fact (bez mapy)")
    tts_and_align(work)
    # SFX casovanie
    sfx = []
    hook = SCENES[0]
    sfx.append(("riser", hook["t0"] + hook["dur"] * 0.55 - 1.1, {"dur": 1.1}))
    for sc in SCENES[1:]:
        if sc["role"] == "map":
            sfx.append(("whoosh", sc["t0"] + 0.7, {}))
            sfx.append(("tick", sc["t0"] + 1.35, {}))
        elif sc["role"] == "fact":
            for ci, c in enumerate((sc.get("chips") or [])[:2]):
                sfx.append(("whoosh", sc["t0"] + word_time(sc, c.get("on"), 0.5 + 1.5 * ci),
                            {"vol": 0.11 if ci else 0.10}))
        elif sc["role"] == "callout":
            sfx.append(("whoosh", sc["t0"] + word_time(sc, sc.get("label_on") or sc.get("punch"), 1.2), {}))
        elif sc["role"] == "cta":
            sfx.append(("whoosh", sc["t0"] + 0.35, {}))
        elif sc["role"] in ("count", "myth", "truth", "reveal"):
            sfx.append(("whoosh", sc["t0"] + (0.30 if sc["role"] == "reveal" else 0.14),
                        {"vol": 0.12 if sc["role"] == "reveal" else 0.10}))
            if sc["role"] == "count":
                sfx.append(("tick", sc["t0"] + 0.5, {}))
    print("  audio mix...")
    build_audio(work, sfx)
    for i, sc in enumerate(SCENES):
        render_scene(sc, spec, i, work)
        print(f"  scena {i} ({sc['role']}) OK {sc['dur']:.2f}s")
    build_ass(work)
    open(os.path.join(work, "list.txt"), "w").write(
        "\n".join(f"file 'scene_{i}.mp4'" for i in range(len(SCENES))))
    run([FF, "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "video.mp4"], cwd=work)
    fdir = os.path.join(work, "fonts"); os.makedirs(fdir, exist_ok=True)
    for f in (FONT_POP, FONT_ANT):
        shutil.copy(f, fdir)
    name = slugify(spec.get("title", "video"))
    final = os.path.join(OUT_DIR, name + ".mp4")
    run([FF, "-y", "-i", "video.mp4", "-i", "mixed.wav",
         "-filter_complex", "[0:v]subtitles=captions.ass:fontsdir=fonts[v]",
         "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-maxrate", "9M", "-bufsize", "14M",   # cap: Cloudinary free = 100MB/subor (grain zral 142MB)
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
         os.path.abspath(final)], cwd=work)
    # .txt sidecar pre Buffer: titulok + popis (kde + kecy + hashtagy)
    desc = str(spec.get("description", "")).strip()
    tags = " ".join(spec.get("hashtags", [])[:12])
    place_line = ", ".join(x for x in (spec.get("place"), spec.get("country")) if x)
    body = desc if place_line.lower() in desc.lower() else f"{place_line} - {desc}".strip(" -")
    open(os.path.join(OUT_DIR, name + ".txt"), "w", encoding="utf-8").write(
        f"{spec.get('title', name)}\n{body}{MUSIC_CREDIT}\n\n{tags}\n")
    jpg = os.path.join(OUT_DIR, name + ".jpg")
    make_thumbnail(spec, work, jpg)                     # 2026 thumbnail (<slug>.jpg)
    prepend_cover(os.path.abspath(final), jpg, work)    # predsadi ho ako ~0.6s cover
    shutil.rmtree(work, ignore_errors=True)
    print(f"OK: {final}")


if __name__ == "__main__":
    main()
