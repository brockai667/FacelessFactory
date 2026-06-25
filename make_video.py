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
async def _tts(text, voice, out_mp3):
    import edge_tts
    words = []
    comm = edge_tts.Communicate(text, voice, boundary="WordBoundary")
    with open(out_mp3, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset/duration su v jednotkach 100ns (ticks)
                words.append((chunk["offset"] / 1e7, chunk["duration"] / 1e7, chunk["text"]))
    return words


def tts(text, voice, out_mp3):
    return asyncio.run(_tts(text, voice, out_mp3))


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
    if broll_path:
        vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
              f"crop={W}:{H},setsar=1,fps={FPS}")
        if grade:
            vf += "," + grade
        vf += ",format=yuv420p"
        cmd = [ff, "-y", "-stream_loop", "-1", "-i", broll_path, "-i", audio_path,
               "-t", f"{duration:.3f}", "-vf", vf, "-map", "0:v", "-map", "1:a", *common_out]
    else:
        color = PALETTE[i % len(PALETTE)]
        vf = (grade + "," if grade else "") + "format=yuv420p"
        cmd = [ff, "-y", "-f", "lavfi", "-i", f"color=c={color}:s={W}x{H}:r={FPS}",
               "-i", audio_path, "-t", f"{duration:.3f}", "-vf", vf,
               "-map", "0:v", "-map", "1:a", *common_out]
    run(cmd)
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
    header = (
        "[Script Info]\n"
        "ScriptType: v4.00+\n"
        f"PlayResX: {W}\nPlayResY: {H}\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Default,Arial,{fs},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,"
        f"-1,0,0,0,100,100,0,0,1,7,3,2,{mh},{mh},{mv},1\n\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    hl = cfg.get("caption_highlight_hex", "00F2FF")   # ASS BGR (zlta)
    pop = cfg.get("caption_pop_scale", 116)
    # rozdel slova na frazy po `per`; v ramci frazy sa zvyrazni prave hovorene slovo
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
                if k == wi:
                    parts.append(f"{{\\c&H{hl}&\\fscx{pop}\\fscy{pop}}}{word}{{\\r}}")
                else:
                    parts.append(word)
            text = " ".join(parts)
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
    used_ids = set()   # ID klipov uz pouzitych v tomto videu -> ziadne opakovanie
    for i, seg in enumerate(segments):
        text = seg["text"].strip()
        print(f"  [{i+1}/{len(segments)}] TTS: {text[:55]}...")
        audio = os.path.join(tmp, f"seg_{i:03d}.mp3")
        words = tts(text, voice, audio)
        dur = probe_duration(cfg["ffprobe"], audio)
        broll, vid = get_broll(seg.get("keywords", ""), cfg, broll_dir, used_ids)
        if vid is not None:
            used_ids.add(vid)
        if not broll and seg.get("keywords"):
            print(f"       (bez B-roll -> fallback pozadie)")
        render_segment(i, audio, dur, broll, cfg, tmp)
        for (o, d, txt) in words:
            all_words.append((cursor + o, d, txt))
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

    # metadata subor
    meta_path = os.path.join(out_dir, slug + ".txt")
    with open(meta_path, "w", encoding="utf-8") as f:
        f.write((spec.get("title", "") + "\n\n"))
        f.write((spec.get("description", "") + "\n\n"))
        f.write(" ".join(spec.get("hashtags", [])) + "\n")
        credit = cfg.get("music_credit", "")
        if musics and credit:
            f.write("\n" + credit + "\n")

    print(f"\nHOTOVO: {final}")
    print(f"Popis/hashtagy: {meta_path}")

    if args.open:
        os.startfile(final)


if __name__ == "__main__":
    main()
