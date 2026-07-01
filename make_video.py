#!/usr/bin/env python3
"""
FacelessFactory - automaticka tvorba vertikalnych (9:16) faceless videi.

Pipeline:
  1) edge-tts  -> anglicky hlas (MP3) + casovanie slov pre titulky
  2) Pexels    -> stiahne B-roll klipy podla klucovych slov (volitelne)
  3) FFmpeg    -> poskladne video 1080x1920, prida titulky a hudbu
  4) vystup    -> hotove MP4 + textovy subor s popisom/hashtagmi

Pouzitie:
  python make_video.py scripts/sample.json
  python make_video.py scripts/sample.json --open
"""

import argparse
import asyncio
import json
import os
import random
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

# tmave farby pre fallback pozadie (ked nie je B-roll)
PALETTE = ["0x0f172a", "0x1e1b4b", "0x172554", "0x3b0764", "0x064e3b", "0x431407"]


# ----------------------------------------------------------------------------- helpers
def load_config():
    """Nacita config.json (+ ENV prekrytie tajomstiev pre cloud beh) cez appconfig."""
    import appconfig
    return appconfig.load()


def run(cmd):
    """Spusti prikaz, vyhodi chybu s vystupom ak zlyha."""
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        sys.stderr.write("\n[CHYBA] prikaz zlyhal:\n" + " ".join(str(c) for c in cmd) + "\n")
        sys.stderr.write((p.stderr or "")[-3000:] + "\n")
        raise RuntimeError("prikaz zlyhal")
    return p


def probe_duration(ffprobe, path):
    """Zisti dlzku audio/video suboru v sekundach cez ffprobe."""
    p = run([ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path])
    return float(p.stdout.strip())


def slugify(text):
    """Prevedie text na bezpecny nazov suboru: lowercase, nealfanum. znaky -> '_', max 50 znakov."""
    s = re.sub(r"[^a-zA-Z0-9]+", "_", text).strip("_").lower()
    return (s or "video")[:50]


# ----------------------------------------------------------------------------- TTS
async def _tts(text, voice, out_mp3, rate="+0%", pitch="+0Hz"):
    """Vygeneruje MP3 hlas cez edge-tts a vrati presne casovanie kazdeho slova
    [(offset_s, duration_s, slovo), ...] pre synchronizaciu titulkov."""
    import edge_tts
    words = []
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    with open(out_mp3, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset/duration su v jednotkach 100ns (ticks)
                words.append((chunk["offset"] / 1e7, chunk["duration"] / 1e7, chunk["text"]))
    return words


def tts(text, voice, out_mp3, rate="+0%", pitch="+0Hz"):
    """Synchronny wrapper okolo _tts() (edge-tts je async)."""
    return asyncio.run(_tts(text, voice, out_mp3, rate, pitch))


_KOKORO = None


def _kokoro_model_dir(cfg):
    """Najde adresar s Kokoro modelom (config -> lokalny ROOT/kokoro -> znamy lokalny fallback)."""
    cands = [cfg.get("kokoro_model_dir"), os.path.join(ROOT, "kokoro"), r"C:\Users\damia\kokoro"]
    for c in cands:
        if c and os.path.exists(os.path.join(c, "kokoro-v1.0.onnx")):
            return c
    return os.path.join(ROOT, "kokoro")


def _ensure_kokoro_model(md):
    """Stiahne Kokoro model ak chyba (cloud: prvy beh). Lokalne uz je."""
    import ssl as _ssl
    import urllib.request as _u
    os.makedirs(md, exist_ok=True)
    base = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
    ctx = _ssl._create_unverified_context()
    for fn in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        p = os.path.join(md, fn)
        if not os.path.exists(p) or os.path.getsize(p) < 1000000:
            sys.stderr.write(f"[kokoro] stahujem {fn}...\n")
            with _u.urlopen(base + "/" + fn, context=ctx, timeout=600) as r, open(p, "wb") as f:
                f.write(r.read())


def kokoro_tts(text, out_mp3, cfg):
    """Ludsky hlas cez Kokoro (kokoro-onnx). Casovanie slov odhadom (proporcne dlzkou slov)."""
    global _KOKORO
    import soundfile as sf
    if _KOKORO is None:
        from kokoro_onnx import Kokoro
        md = _kokoro_model_dir(cfg)
        _ensure_kokoro_model(md)
        _KOKORO = Kokoro(os.path.join(md, "kokoro-v1.0.onnx"), os.path.join(md, "voices-v1.0.bin"))
    voice = cfg.get("kokoro_voice", "am_adam")
    samples, sr = _KOKORO.create(text, voice=voice, speed=float(cfg.get("kokoro_speed", 1.0)), lang="en-us")
    wav = out_mp3 + ".tmp.wav"
    sf.write(wav, samples, sr)
    run([cfg["ffmpeg"], "-y", "-i", wav, "-b:a", "160k", out_mp3])
    try:
        os.remove(wav)
    except OSError:
        pass
    dur = len(samples) / sr
    toks = text.split() or [text]
    wts = [len(w) + 1 for w in toks]
    tot = sum(wts) or 1
    out, t = [], 0.0
    for w, wt in zip(toks, wts):
        d = dur * wt / tot
        out.append((t, d, w))
        t += d
    return out


def trim_trailing_silence(ff, src, dst, gap=0.12):
    """Odreze dlhe ticho na konci segmentu a necha jednotnu pauzu (gap s)
    -> oddeli vety/fakty ako odseky. Trailing-only (cez areverse),
    takze casovanie slov pre titulky ostava platne."""
    af = ("areverse,silenceremove=start_periods=1:start_duration=0.02:"
          f"start_threshold=-50dB,areverse,apad=pad_dur={gap}")
    try:
        run([ff, "-y", "-i", src, "-af", af, dst])
        return dst
    except Exception:
        import shutil
        shutil.copyfile(src, dst)   # fallback: ak orez zlyha, pouzi povodne audio
        return dst


# ----------------------------------------------------------------------------- B-roll (Pexels)
def keyword_tokens(keywords):
    """Rozlozi 'keywords' na anglicke tokeny dlzky > 2 znaky (pre relevance scoring)."""
    return [w for w in re.findall(r"[a-z]+", (keywords or "").lower()) if len(w) > 2]


def slug_words(video):
    """Vytiahne slova z URL-slugu Pexels klipu (napr. .../video/ocean-waves-123 -> {ocean, waves})."""
    seg = (video.get("url") or "").rstrip("/").split("/video/")[-1]
    return set(w for w in re.findall(r"[a-z]+", seg.lower()) if len(w) > 2)


def relevance(video, kw_tokens):
    """Kolko keywordov sa nachadza v popisnom slugu klipu (vyssie = lepsia zhoda s temou)."""
    return sum(1 for k in kw_tokens if k in slug_words(video))


def res_rank(f):
    """Zoradi video_files: preferuj najvyssie rozlisenie <=2160p, extremne vysoke (>2160p) az posledne."""
    h = f.get("height") or 0
    return (0, -h) if h <= 2160 else (1, h)


def build_query_ladder(keywords):
    """Query ladder: cely dotaz -> prve 2 slova -> posledne 2 slova -> jednotlive slova (>3 znaky).
    Graceful degradacia ked je dotaz uzky/specificky a Pexels nema dost vysledkov. Cap na 2 dotazy
    (menej Pexels API volani -> menej rate-limitu)."""
    words = (keywords or "").split()
    ladder = [keywords]
    if len(words) >= 3:
        ladder.append(" ".join(words[:2]))
        ladder.append(" ".join(words[-2:]))
    for w in words:
        if len(w) > 3 and w not in ladder:
            ladder.append(w)
    return ladder[:2]


def select_best_candidate(pool):
    """Z poolu {vid: (relevance, files, height)} vyber najlepsi: najvyssia zhoda s temou,
    potom najvyssie rozlisenie (orezane na 2160p). Vrati vid alebo None ak je pool prazdny."""
    if not pool:
        return None
    return max(pool, key=lambda k: (pool[k][0], min(pool[k][2], 2160)))


def _download_with_retry(url, timeout=120, attempts=3, backoff=2.0):
    """GET s binarnym obsahom, s niekolkymi pokusmi (siet je nespolahliva). Vyhodi poslednu chybu."""
    import time
    import requests
    last_err = None
    for attempt in range(attempts):
        try:
            r = requests.get(url, timeout=timeout)
            r.raise_for_status()
            return r.content
        except Exception as e:
            last_err = e
            if attempt < attempts - 1:
                time.sleep(backoff * (attempt + 1))
    raise last_err


def get_broll(keywords, cfg, broll_dir, used_ids):
    """Vrati (cesta, clip_id) k B-roll klipu, ktory NAJLEPSIE sedi na keywords a este nebol pouzity.
    Vyber: Pexels search -> preusporiadanie podla zhody URL-slugu s keywords (aby zaber sedel s textom,
    nie len prvy "relevantny" vysledok) + query ladder ked je dotaz uzky. Dedup podla ID. Inak (None, None)."""
    key = cfg.get("pexels_api_key", "").strip()
    if not key or not keywords:
        return None, None
    try:
        import requests

        orient = "portrait" if int(cfg.get("height", 1920)) >= int(cfg.get("width", 1080)) else "landscape"
        kw_tokens = keyword_tokens(keywords)

        import time, os as _os
        pix = (cfg.get("pixabay_api_key") or _os.environ.get("PIXABAY_API_KEY", "")).strip()
        def _get(params):
            for attempt in range(2):
                try:
                    r = requests.get("https://api.pexels.com/videos/search", params=params,
                                     headers={"Authorization": key}, timeout=30)
                    if r.status_code == 429:          # rate limit -> kratky backoff a skus raz
                        time.sleep(3); continue
                    r.raise_for_status()
                    return r.json().get("videos", [])
                except Exception:
                    return []
            return []
        def _pixabay(q):                              # 2. FREE zdroj -> vacsia kniznica (normalizovane do Pexels tvaru)
            if not pix:
                return []
            try:
                r = requests.get("https://pixabay.com/api/videos/",
                                 params={"key": pix, "q": q, "per_page": 30, "safesearch": "true"}, timeout=30)
                if r.status_code >= 400:
                    return []
                out = []
                for h in r.json().get("hits", []):
                    slug = "/video/" + re.sub(r"[^a-z0-9]+", "-", (h.get("tags", "") or "").lower())
                    files = [{"height": (v.get("height") or 0), "link": v.get("url")}
                             for v in (h.get("videos") or {}).values() if v.get("url")]
                    if files:
                        out.append({"id": "pb%s" % h.get("id"), "url": slug, "video_files": files})
                return out
            except Exception:
                return []
        def search(q):
            vids = _get({"query": q, "per_page": 40, "orientation": orient})
            if not vids:  # fallback: akakolvek orientacia
                vids = _get({"query": q, "per_page": 40})
            return vids + _pixabay(q)                 # Pexels + Pixabay dohromady

        # nazbieraj kandidatov zo VSETKYCH dotazov (dedup), vyber NAJlepsi (zhoda s temou, potom rozlisenie)
        pool = {}  # vid -> (relevance, files, height)
        for q in build_query_ladder(keywords):
            for v in search(q):
                vid = v.get("id")
                if vid in used_ids or vid in pool:
                    continue
                files = [f for f in v.get("video_files", []) if (f.get("height") or 0) >= 720]
                if not files:
                    continue
                files.sort(key=res_rank)
                pool[vid] = (relevance(v, kw_tokens), files, files[0].get("height") or 0)
        vid = select_best_candidate(pool)
        if vid is None:
            return None, None
        files = pool[vid][1]
        cache = os.path.join(broll_dir, f"{vid}.mp4")
        if not os.path.exists(cache):
            data = _download_with_retry(files[0]["link"])
            with open(cache, "wb") as f:
                f.write(data)
        return cache, vid
    except Exception as e:
        sys.stderr.write(f"[upozornenie] Pexels zlyhal pre '{keywords}': {e}\n")
        return None, None


# ----------------------------------------------------------------------------- render segment
def render_segment(i, audio_path, duration, broll_path, cfg, tmp):
    """Vyrenderuje jeden segment (seg_NNN.mp4): B-roll s Ken Burns pohybom (alebo znackovy
    gradient ak broll_path chyba) + priradene audio, orezane na 'duration' sekund."""
    ff = cfg["ffmpeg"]
    W, H, FPS = cfg["width"], cfg["height"], cfg["fps"]
    grade = cfg.get("color_grade", "").strip()   # jednotny vzhlad pre vsetky klipy
    out = os.path.join(tmp, f"seg_{i:03d}.mp4")
    common_out = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                  "-pix_fmt", "yuv420p", "-r", str(FPS),
                  "-c:a", "aac", "-ar", "44100", "-b:a", "160k", out]
    motion = cfg.get("motion", True)
    nf = max(1, int(round(duration * FPS)))         # poc. framov -> plynuly pan cez cely zaber

    def broll_cmd(use_motion):
        if use_motion:
            # Ken Burns so STRIEDANIM pohybu -> kazdy zaber posobi inak (dynamickejsi strih)
            o_w, o_h = int(W * 1.5), int(H * 1.5)
            xc, yc = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
            if i == 0:
                z, x, y = "min(zoom+0.0022,1.22)", xc, yc                     # HOOK: rychly punch-in
            else:
                v = (i - 1) % 3
                if v == 0:
                    z, x, y = "min(zoom+0.0012,1.18)", xc, yc                 # zoom-in do stredu
                elif v == 1:
                    z, x, y = "min(zoom+0.0011,1.16)", f"(iw-iw/zoom)*on/{nf}", yc   # pan zlava->prava
                else:
                    z, x, y = "min(zoom+0.0011,1.16)", xc, f"(ih-ih/zoom)*on/{nf}"   # pan hore->dole
            vf = (f"scale={o_w}:{o_h}:force_original_aspect_ratio=increase,"
                  f"crop={o_w}:{o_h},setsar=1,"
                  f"zoompan=z='{z}':d=1:x='{x}':y='{y}':s={W}x{H}:fps={FPS}")
        else:
            vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
                  f"crop={W}:{H},setsar=1,fps={FPS}")
        if grade:
            vf += "," + grade
        vf += ",format=yuv420p"
        return [ff, "-y", "-stream_loop", "-1", "-i", broll_path, "-i", audio_path,
                "-t", f"{duration:.3f}", "-vf", vf, "-map", "0:v", "-map", "1:a", *common_out]

    if broll_path:
        try:
            run(broll_cmd(motion))
        except Exception:
            if not motion:
                raise
            run(broll_cmd(False))   # fallback bez pohybu, nech sa video vzdy vyrenderuje
    else:
        # znackove pozadie (jemny gradient brand_primary -> brand_accent) namiesto nahodnej farby
        c0 = cfg.get("brand_primary", PALETTE[i % len(PALETTE)])
        c1 = cfg.get("brand_accent", PALETTE[(i + 3) % len(PALETTE)])
        try:
            vf = (grade + "," if grade else "") + "format=yuv420p"
            run([ff, "-y", "-f", "lavfi",
                 "-i", f"gradients=s={W}x{H}:c0={c0}:c1={c1}:x0=0:y0=0:x1={W}:y1={H}:r={FPS}",
                 "-i", audio_path, "-t", f"{duration:.3f}", "-vf", vf,
                 "-map", "0:v", "-map", "1:a", *common_out])
        except Exception:
            vf = (grade + "," if grade else "") + "format=yuv420p"
            run([ff, "-y", "-f", "lavfi", "-i", f"color=c={c0}:s={W}x{H}:r={FPS}",
                 "-i", audio_path, "-t", f"{duration:.3f}", "-vf", vf,
                 "-map", "0:v", "-map", "1:a", *common_out])
    return out


def render_asset_segment(i, audio_path, duration, asset_path, cfg, tmp):
    """Segment z LOKALNEHO obrazka (napr. screenshot stranky) — FIT na rozmazane pozadie
    (vidno celu stranku, neoreze sa) + jemny zoom. Pre how-to scenu 'ukaz tu obrazovku'."""
    ff = cfg["ffmpeg"]
    W, H, FPS = cfg["width"], cfg["height"], cfg["fps"]
    grade = cfg.get("color_grade", "").strip()
    out = os.path.join(tmp, f"seg_{i:03d}.mp4")
    ext = os.path.splitext(asset_path)[1].lower()
    if ext in (".mp4", ".mov", ".webm", ".mkv"):
        # VIDEO asset (napr. micro-zostrih) -> cover na cely frame + audio (loop/trim na dlzku)
        vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS}"
              + (("," + grade) if grade else "") + ",format=yuv420p")
        run([ff, "-y", "-stream_loop", "-1", "-i", asset_path, "-i", audio_path, "-t", f"{duration:.3f}",
             "-vf", vf, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
             "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-ar", "44100", "-b:a", "160k", out])
        return out
    fw = int(W * 0.92)
    zr, zc = ("0.0013", "1.16") if i == 0 else ("0.0005", "1.07")   # HOOK = punchier zoom
    fc = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:1,eq=brightness=-0.22[bg];"
          f"[0:v]scale={fw}:-1[fg];"
          f"[bg][fg]overlay=(W-w)/2:(H-h)/2,"
          f"zoompan=z='min(zoom+{zr},{zc})':d=1:fps={FPS}:s={W}x{H}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
          + (("," + grade) if grade else "") + ",format=yuv420p[v]")
    run([ff, "-y", "-loop", "1", "-i", asset_path, "-i", audio_path, "-filter_complex", fc,
         "-map", "[v]", "-map", "1:a", "-t", f"{duration:.3f}",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
         "-c:a", "aac", "-ar", "44100", "-b:a", "160k", out])
    return out


# ----------------------------------------------------------------------------- captions (ASS)
def secs_to_ass(t):
    """Formatuje sekundy na ASS casovy format 'H:MM:SS.cc' (zaporne casy oreze na 0)."""
    if t < 0:
        t = 0
    h = int(t // 3600); t -= h * 3600
    m = int(t // 60); t -= m * 60
    s = int(t)
    cs = int(round((t - s) * 100))
    if cs >= 100:
        cs = 0; s += 1
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def apply_case(text, case):
    """Aplikuje pismenkovy styl na text titulku: 'upper' | 'lower' | inak (sentence/asis) nezmeneny."""
    if case == "upper":
        return text.upper()
    if case == "lower":
        return text.lower()
    return text


def apply_lead(words, lead):
    """Posunie casovanie kazdeho slova o 'lead' sekund dopredu (nikdy pod 0), aby titulky
    nepôsobili oneskorene voci hlasu. words: [(start, duration, text), ...]."""
    if not lead:
        return words
    return [(max(0.0, s - lead), d, t) for (s, d, t) in words]


def chunk_words(words, per):
    """Rozdeli zoznam (start, duration, text) do skupin po 'per' slovach (riadky titulkov)."""
    per = max(1, per)
    return [words[j:j + per] for j in range(0, len(words), per)]


def build_ass(all_words, cfg, path):
    """Vygeneruje .ass subor s klasickymi word-by-word titulkami (box alebo color styl,
    zvyraznenie aktivneho slova) a ulozi ho na 'path'."""
    W, H = cfg["width"], cfg["height"]
    fs = cfg.get("caption_fontsize", 82)
    per = max(1, cfg.get("caption_words_per_line", 3))
    mv = cfg.get("caption_margin_v", 880)
    mh = cfg.get("caption_margin_h", 150)
    font = cfg.get("caption_font", "Arial")
    style = cfg.get("caption_style", "box")               # "box" (profi) alebo "color"
    box_hex = cfg.get("caption_box_hex", "FF901E")        # ASS BGR -> #1E90FF znackova modra
    text_hex = cfg.get("caption_text_hex", "FFFFFF")      # biely text
    hl = cfg.get("caption_highlight_hex", "00F2FF")       # zlta (color-mod)
    pop = cfg.get("caption_pop_scale", 116)
    align = int(cfg.get("caption_alignment", 2))          # 2=dole, 8=hore, 5=stred (ASS numpad)
    case = cfg.get("caption_case", "upper")               # upper | lower | sentence/asis (bez zmeny)
    fade_ms = int(cfg.get("caption_fade_ms", 0))          # jemny fade-in slova (Style C elegancia)

    if style == "box":
        # BorderStyle=3 = nepriehladny BOX za textom; box zapneme len na aktivnom slove
        # cez \3a (alpha okraja/boxu). Ostatne slova biele s tienom (Shadow) pre citatelnost.
        border_style, outline, shadow = 3, 16, 5
        outline_col = f"&H00{box_hex}"                    # farba boxu (Style: bez koncoveho &)
        back_col = "&HA0000000"                           # tmavy tien pod textom
    else:
        # CISTY color-styl (bez boxu): tenky tmavy obrys + jemny tien -> citatelne a moderne
        border_style, outline, shadow = 1, 5, 2
        outline_col = "&H00202020"
        back_col = "&H80000000"

    header = (
        "[Script Info]\n"
        "ScriptType: v4.00+\n"
        f"PlayResX: {W}\nPlayResY: {H}\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Default,{font},{fs},&H00{text_hex},&H000000FF,{outline_col},"
        f"{back_col},-1,0,0,0,100,100,0,0,{border_style},{outline},{shadow},{align},{mh},{mh},{mv},1\n\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )

    def styled(word, state):
        # state: "active" | "past" | "future"
        if style == "box":
            if state == "active":   # biely text v znackovom BOXE + jemny pop + tien boxu
                return f"{{\\3a&H00&\\4a&H40&\\1c&H{text_hex}&\\fscx{pop}\\fscy{pop}}}{word}{{\\r}}"
            if state == "past":     # biele slovo bez boxu (jemny tien pre citatelnost)
                return f"{{\\3a&HFF&\\4a&H80&}}{word}{{\\r}}"
            # buduce -> uplne skryte na vsetkych vrstvach (drzi sirku, ziadny box/tien)
            return f"{{\\1a&HFF&\\3a&HFF&\\4a&HFF&}}{word}{{\\r}}"
        # color mod (povodny)
        if state == "active":
            return f"{{\\c&H{hl}&\\fscx{pop}\\fscy{pop}}}{word}{{\\r}}"
        if state == "past":
            return word
        return f"{{\\alpha&HFF&}}{word}{{\\r}}"

    lead = float(cfg.get("caption_lead", 0.0))            # mierny predstih -> titulky nepôsobia oneskorene
    all_words = apply_lead(all_words, lead)
    chunks = chunk_words(all_words, per)
    lines = []
    for ci, chunk in enumerate(chunks):
        next_start = chunks[ci + 1][0][0] if ci + 1 < len(chunks) else chunk[-1][0] + chunk[-1][1]
        for wi, (st, du, _t) in enumerate(chunk):
            ev_start = st
            ev_end = chunk[wi + 1][0] if wi + 1 < len(chunk) else next_start
            if ev_end <= ev_start:
                ev_end = ev_start + 0.15
            parts = []
            for k, w in enumerate(chunk):
                word = apply_case(w[2], case).replace("\n", " ").replace("{", "(").replace("}", ")")
                if not word.strip():
                    continue                                  # preskoc prazdne tokeny (inak prazdny box)
                state = "active" if k == wi else ("past" if k < wi else "future")
                parts.append(styled(word, state))
            # v box-mode medzery NESMU mat box (inak prazdny box medzi slovami)
            sep = "{\\1a&HFF&\\3a&HFF&\\4a&HFF&\\fscx100\\fscy100} {\\r}" if style == "box" else " "
            rows = int(cfg.get("caption_words_per_row", 0))   # >0 -> po N slovach zalom na 2. riadok (\\N)
            if rows > 0 and len(parts) > rows:
                buf = []
                for k2, pt in enumerate(parts):
                    if k2 > 0:
                        buf.append("\\N" if (k2 % rows == 0) else sep)
                    buf.append(pt)
                text = "".join(buf)
            else:
                text = sep.join(parts)
            if fade_ms:
                text = ("{\\fad(%d,%d)}" % (fade_ms, min(fade_ms, 100))) + text
            lines.append(f"Dialogue: 0,{secs_to_ass(ev_start)},{secs_to_ass(ev_end)},Default,,0,0,0,,{text}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(lines) + "\n")


def advance_cursor(cursor, i, duration):
    """Posunie casovu os o dalsi segment. Vrati (novy_cursor, cas_strihu_alebo_None).
    Strih (pre SFX) sa pocita na ZACIATKU kazdeho segmentu okrem prveho (i==0 nema predchadzajuci strih)."""
    cut = cursor if i > 0 else None
    return cursor + duration, cut


# ----------------------------------------------------------------------------- assembly
def concat_segments(seg_files, cfg, tmp):
    """Spoji vsetky segmenty (seg_NNN.mp4) do jedneho videa cez ffmpeg concat demuxer (bez rekodovania)."""
    ff = cfg["ffmpeg"]
    listfile = os.path.join(tmp, "concat.txt")
    with open(listfile, "w", encoding="utf-8") as f:
        for s in seg_files:
            f.write(f"file '{s.replace(os.sep, '/')}'\n")
    out = os.path.join(tmp, "concat.mp4")
    run([ff, "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", out])
    return out


def add_sfx(ff, video, cut_times, tmp):
    """Pridá jemny 'whoosh' na kazdy strih. Plne chranene -> pri chybe vrati povodne video."""
    if not cut_times:
        return video
    try:
        whoosh = os.path.join(tmp, "_whoosh.wav")
        run([ff, "-y", "-f", "lavfi", "-i", "anoisesrc=d=0.3:c=pink:a=0.08",
             "-af", "highpass=f=350,lowpass=f=4500,afade=t=in:d=0.05,"
                    "afade=t=out:st=0.12:d=0.18,volume=0.45", whoosh])
        inputs = ["-i", video]
        fc, labels = [], ["[0:a]"]
        for n, t in enumerate(cut_times):
            inputs += ["-i", whoosh]
            ms = int(t * 1000)
            fc.append(f"[{n+1}:a]adelay={ms}|{ms}[s{n}]")
            labels.append(f"[s{n}]")
        fc.append("".join(labels) + f"amix=inputs={len(labels)}:duration=first:normalize=0[a]")
        out = os.path.join(tmp, "with_sfx.mp4")
        run([ff, "-y", *inputs, "-filter_complex", ";".join(fc),
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", out])
        return out
    except Exception:
        return video   # ak SFX zlyha, video ostane bez nich (nic sa nerozbije)


def add_music(video, music, cfg, tmp):
    """Podloz hudbu pod hlas: hudba sa UHYBA pod hlasom (sidechain duck) + fade in/out.
    Plne chranene -> pri chybe spadne na jednoduchy mix (povodne spravanie)."""
    ff = cfg["ffmpeg"]
    vol = cfg.get("music_volume", 0.12)
    out = os.path.join(tmp, "with_music.mp4")
    try:
        dur = probe_duration(cfg["ffprobe"], video)
        fade = float(cfg.get("music_fade", 1.6))
        fin = min(fade, 0.8)
        fout = max(0.1, dur - fade)
        # 1) hudba: hlasitost + fade in/out
        # 2) sidechain duck: hudba sa stisi vzdy ked hovori hlas ([0:a] = kluc) -> hlas je vzdy citelny
        # 3) zmiesaj hlas + uhnutu hudbu (normalize=0 aby amix neznizoval hlasitost)
        fc = (f"[1:a]volume={vol},afade=t=in:st=0:d={fin:.2f},"
              f"afade=t=out:st={fout:.2f}:d={fade:.2f}[m];"
              f"[m][0:a]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=260[mduck];"
              f"[0:a][mduck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]")
        run([ff, "-y", "-i", video, "-stream_loop", "-1", "-i", music,
             "-filter_complex", fc,
             "-map", "0:v", "-map", "[a]", "-c:v", "copy",
             "-c:a", "aac", "-ar", "44100", "-b:a", "160k", "-shortest", out])
        return out
    except Exception:
        run([ff, "-y", "-i", video, "-stream_loop", "-1", "-i", music,
             "-filter_complex",
             f"[1:a]volume={vol}[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]",
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest", out])
        return out


def _ensure_cinematic_music(music_dir, cfg):
    """Stiahne par CINEMATIC gradujucich trackov (Mixkit, volna licencia, bez attribution) ak chybaju.
    Plne chranene -> pri chybe nechaj co je (napr. bg.mp3)."""
    try:
        os.makedirs(music_dir, exist_ok=True)
        if sum(1 for m in os.listdir(music_dir) if m.startswith("cine_")) >= 2:
            return
        import ssl as _ssl, urllib.request as _u
        ctx = _ssl._create_unverified_context()
        ua = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        for tid in cfg.get("cinematic_music_ids", [616, 720, 834, 607]):
            p = os.path.join(music_dir, f"cine_{tid}.mp3")
            if os.path.exists(p) and os.path.getsize(p) > 100000:
                continue
            import time
            for attempt in range(3):
                try:
                    data = _u.urlopen(_u.Request(f"https://assets.mixkit.co/music/{tid}/{tid}.mp3", headers=ua),
                                      context=ctx, timeout=120).read()
                    with open(p, "wb") as f:
                        f.write(data)
                    break
                except Exception:
                    if attempt < 2:
                        time.sleep(2 * (attempt + 1))
    except Exception:
        pass


def is_emphasized(word_upper, emph_set):
    """True ak slovo (uz v UPPERCASE) ma byt zvyraznene zltou: obsahuje cislicu, je v emph_set,
    alebo obsahuje '$' (peniaze). Pouzite pre POP titulky (kluc. slova pre virality)."""
    return bool(re.search(r"\d", word_upper)) or word_upper in emph_set or "$" in word_upper


def build_ass_pop(all_words, cfg, path):
    """PRO animovane titulky: jedno velke slovo, pop-scale animacia, kluc. slova zltou.
    Pouziva existujuce casovanie slov (all_words) - ziadny novy dependency. Reel-pro styl."""
    W, H = cfg["width"], cfg["height"]
    font = cfg.get("caption_font", "Poppins")
    fs = int(cfg.get("caption_pop_fontsize", 116))
    mv = int(cfg.get("caption_pop_margin_v", 540))       # od spodu (Alignment 2)
    align = int(cfg.get("caption_pop_alignment", 2))
    hl = cfg.get("caption_pop_highlight_hex", "00C2F2")  # ASS BGR -> #F2C200 zlta na klucove slova
    txt = cfg.get("caption_text_hex", "FFFFFF")
    lead = float(cfg.get("caption_lead", 0.0))
    emph_set = set(w.upper() for w in cfg.get("caption_emphasis",
                   ["FREE", "NOW", "NEW", "FIRST", "EVER", "NEVER", "MILLION", "BILLION",
                    "ZERO", "SECRET", "HUGE", "BEST", "INSANE", "FOLLOW", "STOP"]))

    def ts(t):
        t = max(0.0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
        return f"{h}:{m:02d}:{s:05.2f}"

    header = (
        "[Script Info]\nScriptType: v4.00+\n"
        f"PlayResX: {W}\nPlayResY: {H}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, "
        "Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: P,{font},{fs},&H00{txt},&H00{txt},&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,9,3,{align},80,80,{mv},1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")

    words = apply_lead(all_words, lead)
    ev = []
    for i, (st, du, word) in enumerate(words):
        w = (word or "").strip().replace("{", "(").replace("}", ")").replace("\n", " ")
        if not w:
            continue
        up = w.upper()
        end = words[i + 1][0] if i + 1 < len(words) else st + du
        if end <= st:
            end = st + 0.2
        emph = is_emphasized(up, emph_set)
        col = hl if emph else txt
        tag = ("{\\fad(24,24)\\fscx52\\fscy52\\t(0,90,\\fscx112\\fscy112)"
               "\\t(90,150,\\fscx100\\fscy100)\\1c&H" + col + "&}")
        ev.append(f"Dialogue: 0,{ts(st)},{ts(end)},P,,0,0,0,,{tag}{up}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(ev) + "\n")


def burn_captions(video, ass_path, out_path, cfg, tmp):
    """'Vypali' .ass titulky natvrdo do videa (libass subtitles filter) + loudness normalizacia zvuku."""
    ff = cfg["ffmpeg"]
    # subtitles filter ma problem s ':' vo Windows ceste -> spustime s cwd=tmp a relativnym menom
    ass_rel = os.path.basename(ass_path)
    vid_rel = os.path.relpath(video, tmp).replace(os.sep, "/")
    # finalna loudness normalizacia (-14 LUFS = cielova hlasitost YT/TikTok) -> jednotny zvuk vsetkych videi
    laf = cfg.get("loudnorm_filter", "loudnorm=I=-14:TP=-1.5:LRA=11")
    # fontsdir -> pribalene fonty v assets/fonts (Poppins, DM Serif...). Ak chyba, libass pouzije default.
    subf = f"subtitles={ass_rel}:fontsdir=../assets/fonts"
    run_in([ff, "-y", "-i", vid_rel, "-vf", subf,
            "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-maxrate", "6M", "-bufsize", "12M",
            "-pix_fmt", "yuv420p", "-af", laf, "-c:a", "aac", "-ar", "44100", "-b:a", "160k",
            "-movflags", "+faststart", out_path], cwd=tmp)


def run_in(cmd, cwd):
    """Ako run(), ale spusti prikaz v danom pracovnom adresari (cwd) - potrebne pre ffmpeg subtitles
    filter, ktory ma problem s ':' vo Windows absolutnych cestach."""
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", cwd=cwd)
    if p.returncode != 0:
        sys.stderr.write("\n[CHYBA]\n" + (p.stderr or "")[-3000:] + "\n")
        raise RuntimeError("prikaz zlyhal")
    return p


def _bgr_to_rgb(h):
    """Prevedie ASS farebny hex (BGR poradie bajtov, napr. '&HF66D2D' alebo '#F66D2D') na RGB tuple.
    Pri neplatnom vstupe vrati bezpecny fallback (znackova modra)."""
    h = (h or "").strip().lstrip("&H").lstrip("#")
    try:
        return (int(h[4:6], 16), int(h[2:4], 16), int(h[0:2], 16))   # ASS hex je BGR
    except Exception:
        return (45, 109, 246)


def pil_caption_overlay(video, all_words, out_path, cfg, tmp):
    """CISTY titulkovy overlay (PIL): zaobleny farebny box LEN na aktivnom slove, 2 riadky,
    ostatne slova ciste biele s mäkkym tienom, fade + predstih. Vrati True ak OK, inak False."""
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    ff = cfg["ffmpeg"]
    W, H, FPS = int(cfg["width"]), int(cfg["height"]), int(cfg["fps"])
    fontp = os.path.join(ROOT, "assets", "fonts", cfg.get("caption_font_file", "Poppins-SemiBold.ttf"))
    if not os.path.exists(fontp) or not all_words:
        return False
    fs = int(cfg.get("caption_fontsize", 64))
    block = max(2, int(cfg.get("caption_words_per_line", 4)))
    lead = float(cfg.get("caption_lead", 0.12))
    box = _bgr_to_rgb(cfg.get("caption_box_hex", "F66D2D")) + (255,)
    ypos = float(cfg.get("caption_ypos", 0.30))
    total = probe_duration(cfg["ffprobe"], video)
    words = [(max(0.0, s - lead), d, t) for (s, d, t) in all_words]
    font = ImageFont.truetype(fontp, fs)
    asc, desc = font.getmetrics(); lh = asc + desc; lineH = int(lh * 1.12)
    sp = font.getlength(" "); maxw = W * 0.64
    blocks = [words[i:i + block] for i in range(0, len(words), block)]
    times = [(b[0][0], b[-1][0] + b[-1][1] + 0.35, b) for b in blocks]
    capdir = os.path.join(tmp, "caps")
    os.makedirs(capdir, exist_ok=True)
    cache = {}

    def layout(bw):
        toks = [w[2] for w in bw]; widths = [font.getlength(t) for t in toks]
        rws = [[]]; lw = 0.0
        for idx, wd in enumerate(widths):
            add = wd if not rws[-1] else sp + wd
            if rws[-1] and lw + add > maxw and len(rws) < 2:
                rws.append([idx]); lw = wd
            else:
                rws[-1].append(idx); lw += add
        y0 = int(H * ypos) - (len(rws) * lineH) // 2
        pos = {}
        for li, idxs in enumerate(rws):
            linew = sum(widths[k] for k in idxs) + sp * (len(idxs) - 1)
            x = (W - linew) / 2.0; y = y0 + li * lineH
            for k in idxs:
                pos[k] = (x, y, widths[k]); x += widths[k] + sp
        return toks, pos

    def base_img(bi, ai):
        if (bi, ai) in cache:
            return cache[(bi, ai)]
        toks, pos = layout(times[bi][2])
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
        for k, t in enumerate(toks):
            x, y, _w = pos[k]; ds.text((x, y), t, font=font, fill=(0, 0, 0, 180))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(6)))
        d = ImageDraw.Draw(img)
        if ai in pos:
            x, y, wd = pos[ai]
            d.rounded_rectangle([x - 16, y - 6, x + wd + 16, y + lh + 4], radius=16, fill=box)
        for k, t in enumerate(toks):
            x, y, _w = pos[k]; d.text((x, y), t, font=font, fill=(255, 255, 255, 255))
        cache[(bi, ai)] = img
        return img

    nfr = int(total * FPS); empty = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for fnum in range(nfr):
        t = fnum / FPS; cur = None
        for bi, (s, e, bw) in enumerate(times):
            if s <= t <= e:
                cur = (bi, s, e, bw); break
        if cur is None:
            empty.save(os.path.join(capdir, "c%05d.png" % fnum)); continue
        bi, s, e, bw = cur; ai = 0
        for k, w in enumerate(bw):
            if w[0] <= t:
                ai = k
        fade = max(0.0, min(1.0, (t - s) / 0.10, (e - t) / 0.22))
        bimg = base_img(bi, ai)
        if fade < 0.999:
            r, g, b, a = bimg.split(); a = a.point(lambda v: int(v * fade)); bimg = Image.merge("RGBA", (r, g, b, a))
        bimg.save(os.path.join(capdir, "c%05d.png" % fnum))
    laf = cfg.get("loudnorm_filter", "loudnorm=I=-14:TP=-1.5:LRA=11")
    run_in([ff, "-y", "-i", os.path.relpath(video, tmp).replace(os.sep, "/"),
            "-framerate", str(FPS), "-i", "caps/c%05d.png",
            "-filter_complex", "[0:v][1:v]overlay=0:0:format=auto[v]",
            "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-maxrate", "6M", "-bufsize", "12M", "-pix_fmt", "yuv420p",
            "-af", laf, "-c:a", "aac", "-ar", "44100", "-b:a", "160k",
            "-movflags", "+faststart", out_path], cwd=tmp)
    return True


# ----------------------------------------------------------------------------- main
def main():
    """CLI vstupny bod: nacita JSON scenar, vyrenderuje kazdy segment (TTS + B-roll/asset),
    poskladá ich, prida hudbu a SFX na strihy, vypali titulky a zapise popis + hashtagy."""
    ap = argparse.ArgumentParser()
    ap.add_argument("script", help="cesta k JSON scenaru")
    ap.add_argument("--open", action="store_true", help="otvor hotove video")
    ap.add_argument("--no-captions", action="store_true")
    args = ap.parse_args()

    cfg = load_config()
    ff = cfg["ffmpeg"]
    with open(args.script, "r", encoding="utf-8") as f:
        spec = json.load(f)

    voice = spec.get("voice") or cfg["voice"]
    segments = spec["segments"]
    tmp = os.path.join(ROOT, "temp")
    broll_dir = os.path.join(ROOT, "assets", "broll")
    out_dir = os.path.join(ROOT, "output")
    for d in (tmp, broll_dir, out_dir):
        os.makedirs(d, exist_ok=True)
    # vycisti temp
    for fn in os.listdir(tmp):
        try:
            os.remove(os.path.join(tmp, fn))
        except OSError:
            pass

    print(f"== Generujem video: {spec.get('title','(bez nazvu)')} ==")
    print(f"   hlas: {voice} | segmentov: {len(segments)}")

    all_words = []
    seg_files = []
    cursor = 0.0
    cuts = []           # casy strihov -> jemne zvukove efekty
    first_broll = None  # loop-bookend: posledny zaber = prvy -> plynuly loop
    last_broll = None   # never-glow: posledny uspesny zaber
    used_ids = set()    # ID klipov uz pouzitych v tomto videu -> ziadne opakovanie
    loop_end = cfg.get("loop_bookend", True)
    last_i = len(segments) - 1
    for i, seg in enumerate(segments):
        text = seg["text"].strip()
        print(f"  [{i+1}/{len(segments)}] TTS: {text[:55]}...")
        raw_audio = os.path.join(tmp, f"seg_{i:03d}_raw.mp3")
        audio = os.path.join(tmp, f"seg_{i:03d}.mp3")
        if cfg.get("tts_engine") == "kokoro":
            words = kokoro_tts(text, raw_audio, cfg)
        else:
            words = tts(text, voice, raw_audio,
                        cfg.get("tts_rate", "+0%"), cfg.get("tts_pitch", "+0Hz"))
        trim_trailing_silence(cfg["ffmpeg"], raw_audio, audio, cfg.get("segment_gap", 0.12))
        dur = probe_duration(cfg["ffprobe"], audio)
        asset = seg.get("asset")
        if asset and os.path.exists(asset):
            print(f"       (asset: {os.path.basename(asset)} -> fit na pozadie)")
            render_asset_segment(i, audio, dur, asset, cfg, tmp)
        else:
            if loop_end and i == last_i and first_broll:
                broll, vid = first_broll, None      # bookend: koniec = zaciatok
            else:
                broll, vid = get_broll(seg.get("keywords", ""), cfg, broll_dir, used_ids)
            if not broll:
                broll = last_broll or first_broll
                if not broll:                     # este niet ziadneho zaberu -> vseobecny fallback dotaz (NIKDY neon)
                    fq = cfg.get("broll_fallback_query", "abstract background motion")
                    broll, fvid = get_broll(fq, cfg, broll_dir, used_ids)
                    if fvid is not None:
                        used_ids.add(fvid)
                if broll:
                    print("       (bez zhody -> nahradny zaber, nie glow)")
            if i == 0 and broll:
                first_broll = broll
            if broll:
                last_broll = broll
            if vid is not None:
                used_ids.add(vid)
            render_segment(i, audio, dur, broll, cfg, tmp)
        for (o, d, txt) in words:
            all_words.append((cursor + o, d, txt))
        cursor, cut = advance_cursor(cursor, i, dur)
        if cut is not None:
            cuts.append(cut)
        seg_files.append(os.path.join(tmp, f"seg_{i:03d}.mp4"))

    print(f"  Skladam {len(seg_files)} segmentov (dlzka ~{cursor:.1f}s)...")
    video = concat_segments(seg_files, cfg, tmp)

    # hudba (ak je nejaka v assets/music)
    music_dir = os.path.join(ROOT, "assets", "music")
    _ensure_cinematic_music(music_dir, cfg)          # cinematic gradujuce tracky (Mixkit) ak chybaju
    musics = [os.path.join(music_dir, m) for m in os.listdir(music_dir)
              if m.lower().endswith((".mp3", ".m4a", ".wav"))] if os.path.isdir(music_dir) else []
    if musics:
        cine = [m for m in musics if os.path.basename(m).startswith("cine_")]
        track = random.choice(cine if cine else musics)   # preferuj cinematic; kazde video ina hudba
        print(f"  Pridavam hudbu: {os.path.basename(track)}")
        video = add_music(video, track, cfg, tmp)

    if cfg.get("sfx", True):
        print("  Pridavam jemne zvukove efekty na strihy...")
        video = add_sfx(cfg["ffmpeg"], video, cuts, tmp)

    slug = slugify(spec.get("title", "video"))
    final = os.path.join(out_dir, slug + ".mp4")

    if args.no_captions:
        laf = cfg.get("loudnorm_filter", "loudnorm=I=-14:TP=-1.5:LRA=11")
        run([ff, "-y", "-i", video, "-c:v", "copy", "-af", laf,
             "-c:a", "aac", "-ar", "44100", "-b:a", "160k", "-movflags", "+faststart", final])
    else:
        print("  Vypaľujem titulky...")
        mode = cfg.get("caption_renderer", "pil")
        done = False
        if mode == "pop":                                  # PRO animovane pop titulky (nova zakladna)
            try:
                ass_path = os.path.join(tmp, "subs.ass")
                build_ass_pop(all_words, cfg, ass_path)
                burn_captions(video, ass_path, final, cfg, tmp)
                done = True
            except Exception as e:
                sys.stderr.write(f"[pozn.] POP titulky zlyhali ({str(e)[:80]}) -> fallback\n")
                done = False
        if not done and mode != "ass":
            try:
                done = pil_caption_overlay(video, all_words, final, cfg, tmp)   # CISTE boxy len na akt. slove
            except Exception as e:
                sys.stderr.write(f"[pozn.] PIL titulky zlyhali ({str(e)[:80]}) -> fallback ASS\n")
                done = False
        if not done:
            ass_path = os.path.join(tmp, "subs.ass")
            build_ass(all_words, cfg, ass_path)
            burn_captions(video, ass_path, final, cfg, tmp)

    # metadata subor (popis + hashtagy zladene so znackou MindBlownDaily)
    meta_path = os.path.join(out_dir, slug + ".txt")
    desc = (spec.get("description", "") or "").strip()
    cta = cfg.get("brand_cta", "").strip()
    if cta and cta.lower() not in desc.lower():
        desc = (desc + "\n" + cta).strip()
    # zluc hashtagy z temy + znackove, bez duplicit, max 12
    seen, tags = set(), []
    for t in list(spec.get("hashtags", [])) + cfg.get("brand_hashtags", []):
        t = t.strip()
        t = t if t.startswith("#") else "#" + t
        if len(t) > 1 and t.lower() not in seen:
            seen.add(t.lower())
            tags.append(t)
    with open(meta_path, "w", encoding="utf-8") as f:
        f.write(spec.get("title", "") + "\n\n")
        f.write(desc + "\n\n")
        f.write(" ".join(tags[:12]) + "\n")
        credit = cfg.get("music_credit", "")
        if musics and credit:
            f.write("\n" + credit + "\n")

    print(f"\nHOTOVO: {final}")
    print(f"Popis/hashtagy: {meta_path}")

    if args.open:
        os.startfile(final)


if __name__ == "__main__":
    main()
