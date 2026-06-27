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
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))

# tmave farby pre fallback pozadie (ked nie je B-roll)
PALETTE = ["0x0f172a", "0x1e1b4b", "0x172554", "0x3b0764", "0x064e3b", "0x431407"]


# ----------------------------------------------------------------------------- helpers
def load_config():
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
    p = run([ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path])
    return float(p.stdout.strip())


def slugify(text):
    s = re.sub(r"[^a-zA-Z0-9]+", "_", text).strip("_").lower()
    return (s or "video")[:50]


# ----------------------------------------------------------------------------- TTS
async def _tts(text, voice, out_mp3, rate="+0%", pitch="+0Hz"):
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
    return asyncio.run(_tts(text, voice, out_mp3, rate, pitch))


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
def get_broll(keywords, cfg, broll_dir, used_ids):
    """Vrati (cesta, clip_id) k B-roll klipu, ktory este nebol pouzity v tomto videu.
    Dedup podla ID klipu zabranuje opakovaniu rovnakeho zaberu. Inak (None, None)."""
    key = cfg.get("pexels_api_key", "").strip()
    if not key or not keywords:
        return None, None
    try:
        import requests
        r = requests.get(
            "https://api.pexels.com/videos/search",
            params={"query": keywords, "per_page": 25, "size": "medium"},
            headers={"Authorization": key}, timeout=30,
        )
        r.raise_for_status()
        # prejdi vysledky v poradi relevancie, vyber prvy NEPOUZITY klip
        for v in r.json().get("videos", []):
            vid = v.get("id")
            if vid in used_ids:
                continue
            files = [f for f in v.get("video_files", []) if (f.get("height") or 0) >= 600]
            if not files:
                continue
            files.sort(key=lambda f: abs((f.get("height") or 0) - 1080))
            cache = os.path.join(broll_dir, f"{vid}.mp4")
            if not os.path.exists(cache):
                data = requests.get(files[0]["link"], timeout=120).content
                with open(cache, "wb") as f:
                    f.write(data)
            return cache, vid
        return None, None
    except Exception as e:
        sys.stderr.write(f"[upozornenie] Pexels zlyhal pre '{keywords}': {e}\n")
        return None, None


# ----------------------------------------------------------------------------- render segment
def render_segment(i, audio_path, duration, broll_path, cfg, tmp):
    ff = cfg["ffmpeg"]
    W, H, FPS = cfg["width"], cfg["height"], cfg["fps"]
    grade = cfg.get("color_grade", "").strip()   # jednotny vzhlad pre vsetky klipy
    out = os.path.join(tmp, f"seg_{i:03d}.mp4")
    common_out = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
                  "-pix_fmt", "yuv420p", "-r", str(FPS),
                  "-c:a", "aac", "-ar", "44100", "-b:a", "160k", out]
    motion = cfg.get("motion", True)

    def broll_cmd(use_motion):
        if use_motion:
            # Ken Burns: pomaly zoom-in -> dynamika, drzi pozornost (retencia)
            o_w, o_h = int(W * 1.5), int(H * 1.5)
            vf = (f"scale={o_w}:{o_h}:force_original_aspect_ratio=increase,"
                  f"crop={o_w}:{o_h},setsar=1,"
                  f"zoompan=z='min(zoom+0.0012,1.18)':d=1:"
                  f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}")
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


# ----------------------------------------------------------------------------- captions (ASS)
def secs_to_ass(t):
    if t < 0:
        t = 0
    h = int(t // 3600); t -= h * 3600
    m = int(t // 60); t -= m * 60
    s = int(t)
    cs = int(round((t - s) * 100))
    if cs >= 100:
        cs = 0; s += 1
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def build_ass(all_words, cfg, path):
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
        f"{back_col},-1,0,0,0,100,100,0,0,{border_style},{outline},{shadow},2,{mh},{mh},{mv},1\n\n"
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

    chunks = [all_words[j:j + per] for j in range(0, len(all_words), per)]
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
                word = w[2].upper().replace("\n", " ").replace("{", "(").replace("}", ")")
                if not word.strip():
                    continue                                  # preskoc prazdne tokeny (inak prazdny box)
                state = "active" if k == wi else ("past" if k < wi else "future")
                parts.append(styled(word, state))
            # v box-mode medzery NESMU mat box (inak prazdny box medzi slovami)
            sep = "{\\1a&HFF&\\3a&HFF&\\4a&HFF&\\fscx100\\fscy100} {\\r}" if style == "box" else " "
            text = sep.join(parts)
            lines.append(f"Dialogue: 0,{secs_to_ass(ev_start)},{secs_to_ass(ev_end)},Default,,0,0,0,,{text}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(lines) + "\n")


# ----------------------------------------------------------------------------- assembly
def concat_segments(seg_files, cfg, tmp):
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
    ff = cfg["ffmpeg"]
    vol = cfg.get("music_volume", 0.12)
    out = os.path.join(tmp, "with_music.mp4")
    run([ff, "-y", "-i", video, "-stream_loop", "-1", "-i", music,
         "-filter_complex",
         f"[1:a]volume={vol}[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]",
         "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest", out])
    return out


def burn_captions(video, ass_path, out_path, cfg, tmp):
    ff = cfg["ffmpeg"]
    # subtitles filter ma problem s ':' vo Windows ceste -> spustime s cwd=tmp a relativnym menom
    ass_rel = os.path.basename(ass_path)
    vid_rel = os.path.relpath(video, tmp).replace(os.sep, "/")
    run_in([ff, "-y", "-i", vid_rel, "-vf", f"subtitles={ass_rel}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
            "-pix_fmt", "yuv420p", "-c:a", "copy", out_path], cwd=tmp)


def run_in(cmd, cwd):
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", cwd=cwd)
    if p.returncode != 0:
        sys.stderr.write("\n[CHYBA]\n" + (p.stderr or "")[-3000:] + "\n")
        raise RuntimeError("prikaz zlyhal")
    return p


# ----------------------------------------------------------------------------- main
def main():
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
    used_ids = set()    # ID klipov uz pouzitych v tomto videu -> ziadne opakovanie
    loop_end = cfg.get("loop_bookend", True)
    last_i = len(segments) - 1
    for i, seg in enumerate(segments):
        text = seg["text"].strip()
        print(f"  [{i+1}/{len(segments)}] TTS: {text[:55]}...")
        raw_audio = os.path.join(tmp, f"seg_{i:03d}_raw.mp3")
        audio = os.path.join(tmp, f"seg_{i:03d}.mp3")
        words = tts(text, voice, raw_audio,
                    cfg.get("tts_rate", "+0%"), cfg.get("tts_pitch", "+0Hz"))
        trim_trailing_silence(cfg["ffmpeg"], raw_audio, audio, cfg.get("segment_gap", 0.12))
        dur = probe_duration(cfg["ffprobe"], audio)
        if loop_end and i == last_i and first_broll:
            broll, vid = first_broll, None      # bookend: koniec = zaciatok
        else:
            broll, vid = get_broll(seg.get("keywords", ""), cfg, broll_dir, used_ids)
        if i == 0:
            first_broll = broll
        if vid is not None:
            used_ids.add(vid)
        if not broll and seg.get("keywords"):
            print(f"       (bez B-roll -> fallback pozadie)")
        render_segment(i, audio, dur, broll, cfg, tmp)
        for (o, d, txt) in words:
            all_words.append((cursor + o, d, txt))
        if i > 0:
            cuts.append(cursor)                 # strih na zaciatku tohto segmentu
        cursor += dur
        seg_files.append(os.path.join(tmp, f"seg_{i:03d}.mp4"))

    print(f"  Skladam {len(seg_files)} segmentov (dlzka ~{cursor:.1f}s)...")
    video = concat_segments(seg_files, cfg, tmp)

    # hudba (ak je nejaka v assets/music)
    music_dir = os.path.join(ROOT, "assets", "music")
    musics = [os.path.join(music_dir, m) for m in os.listdir(music_dir)
              if m.lower().endswith((".mp3", ".m4a", ".wav"))] if os.path.isdir(music_dir) else []
    if musics:
        print(f"  Pridavam hudbu: {os.path.basename(musics[0])}")
        video = add_music(video, musics[0], cfg, tmp)

    if cfg.get("sfx", True):
        print("  Pridavam jemne zvukove efekty na strihy...")
        video = add_sfx(cfg["ffmpeg"], video, cuts, tmp)

    slug = slugify(spec.get("title", "video"))
    final = os.path.join(out_dir, slug + ".mp4")

    if args.no_captions:
        run([ff, "-y", "-i", video, "-c", "copy", final])
    else:
        print("  Vypaľujem titulky...")
        ass_path = os.path.join(tmp, "subs.ass")
        build_ass(all_words, cfg, ass_path)
        # presun finalny vstup do tmp aby cwd trik fungoval
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
