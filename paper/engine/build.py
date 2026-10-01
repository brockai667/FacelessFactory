# -*- coding: utf-8 -*-
"""paper-factory engine: epizoda (episode.json + script.js) -> HyperFrames projekt -> MP4.
  python engine/build.py episodes/<nazov>            -> build/index.html (+ assety, zvuk mix.wav)
  python engine/build.py episodes/<nazov> --render   -> + check + render + mux + QC -> out/<nazov>.mp4
episode.json: title, hook [2 riadky], voice, rate, gap, bg, accent, music {file, at, vol, credit}, lines {kluc: veta},
              sfx [[subor, kotva, posun, hlasitost]]  kotva = "kluc" | "kluc:slovo" | "kluc:slovo#n" | "t:12.3"
              libs [kniznice z lib/, poradie = poradie nacitania; bez nej LIBS nizsie]
script.js:    telo epizody (volania kniznice PF.*), casy cez PF.at("kluc","slovo") a PF.seg("kluc")."""
import json
import os
import re
import shutil
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")   # Windows: presmerovany vystup je cp1250
    except Exception:
        pass

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from tts import Kit, probe  # noqa: E402
SFX_PACK = os.path.join(FACTORY, "assets", "sfx")
HF = os.environ.get("HF_CLI", "npx hyperframes")          # v CI: "npx -y hyperframes@0.8.78"

FONTS = [os.path.join(FACTORY, "assets", "fonts", f) for f in ("Poppins-SemiBold.ttf", "DMSerifDisplay-Regular.ttf", "ComicNeue-Bold.ttf")]
LIBS = ["core.js", "fx.js", "env_room.js", "char_biped.js", "panels_body.js"]


def paper_texture(path):
    if os.path.exists(path):
        return
    rng = np.random.default_rng(7)
    H, W = 1920, 1080
    small = rng.normal(0, 1, (H // 24 + 2, W // 24 + 2))
    blot = np.array(Image.fromarray(((small - small.min()) / np.ptp(small) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), dtype=np.float32) / 255 - 0.5
    img = 1.0 - 0.035 * blot - 0.03 * np.abs(rng.normal(0, 1, (H, W)).astype(np.float32))
    for _ in range(900):
        x, y = rng.integers(0, W), rng.integers(0, H)
        ang, ln = rng.uniform(0, np.pi), rng.integers(8, 34)
        for s in range(ln):
            xx, yy = int(x + s * np.cos(ang)), int(y + s * np.sin(ang))
            if 0 <= xx < W and 0 <= yy < H:
                img[yy, xx] -= 0.05
    yy, xx = np.mgrid[0:H, 0:W]
    img -= 0.06 * np.clip(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2 - 0.35, 0, 1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "L").save(path)


def music_vs_voice(vox_wav, mus_wav):
    """o kolko dB je hudba tichsia nez hlas pocas reci (okna 100 ms, kde hlas hra): (median, najhorsie okno)"""
    def db(p):
        raw = open(p, "rb").read()[44:]
        x = np.frombuffer(raw[:len(raw) // 2 * 2], np.int16).astype(np.float32) / 32768
        return np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + 1600] ** 2)) + 1e-9) for i in range(0, len(x) - 1600, 1600)])
    v, m = db(vox_wav), db(mus_wav)
    n = min(len(v), len(m))
    v, m = v[:n], m[:n]
    speech = v > (np.percentile(v, 95) - 12)            # zretelna rec (nie tiche medzery medzi slovami)
    if not speech.any() or m.max() < -80:
        return (-99.0, -99.0)
    d = m[speech] - v[speech]
    return (round(float(np.median(d)), 1), round(float(np.percentile(d, 98)), 1))


def audio_ok(path):
    """zvuk bez chybnych paketov (vsetky 1024 okrem prveho/posledneho) a bez nemonotonnych DTS"""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "packet=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.split()
    bad = [d for d in out[1:-1] if d.strip(",") != "1024"]
    warn = subprocess.run(["ffmpeg", "-nostdin", "-v", "warning", "-i", path, "-vn", "-ac", "1", "-ar", "16000", "-f", "null", "-"],
                          capture_output=True, text=True).stderr.count("non monotonically")
    return not bad and not warn, len(bad), warn


def main():
    ep_dir = os.path.abspath(sys.argv[1])
    name = os.path.basename(ep_dir.rstrip("\\/"))
    E = json.load(open(os.path.join(ep_dir, "episode.json"), encoding="utf-8"))
    libs_used = E.get("libs", LIBS)
    B = os.path.join(ep_dir, "build")
    os.makedirs(B, exist_ok=True)
    # ---------- hlas + casy slov (cache v build/)
    kit = Kit(os.path.join(B, "x"), voice=E.get("voice", "en-US-AndrewNeural"), rate=E.get("rate", "+0%"))
    lines = E["lines"]
    vo = kit.narrate(lines, gap=E.get("gap", 0.5), start=0.15)
    keys = list(lines)
    seg = {}
    for i, k in enumerate(keys):
        t0 = 0 if i == 0 else vo.start[k] - 0.15
        t1 = vo.start[keys[i + 1]] - 0.15 if i < len(keys) - 1 else vo.end[k] + E.get("tail", 0.9)
        seg[k] = [round(t0, 3), round(t1, 3)]
    total = seg[keys[-1]][1]
    VO = {"start": vo.start, "words": {k: [{"w": w["w"], "s": w["s"], "e": w["e"]} for w in vo.words(k)] for k in keys}, "seg": seg, "total": total}

    def anchor(a):
        if a.startswith("t:"):
            return float(a[2:])
        if ":" not in a:
            return seg[a][0]
        k, w = a.split(":", 1)
        n = 0
        if "#" in w:
            w, n = w.split("#")
            n = int(n)
        try:
            return vo.at(k, w, nth=n)
        except (KeyError, IndexError):             # tolerantne: spojene slova (seventy-two), predpona, inak zaciatok vety
            nw, ws = re.sub(r"[^a-z0-9]", "", w.lower()), vo.words(k)
            nn = [re.sub(r"[^a-z0-9]", "", x["w"].lower()) for x in ws]
            for i in range(len(ws) - 1):
                if nn[i] + nn[i + 1] == nw:
                    return round(vo.start[k] + ws[i]["s"], 3)
            for i, x in enumerate(ws):
                if len(nn[i]) > 2 and (nn[i].startswith(nw) or nw.startswith(nn[i])):
                    return round(vo.start[k] + x["s"], 3)
            print(f"  varovanie: sfx kotva {a} nenajdena")
            return seg[k][0] + 0.5

    # ---------- titulky (1-2 slova na papierovom pruzku)
    cap_html, cap_js, n = "", "", 0
    for k in keys:
        ws = vo.words(k)
        i = 0
        while i < len(ws):
            grp = [ws[i]]
            if i + 1 < len(ws) and len(ws[i]["disp"]) + len(ws[i + 1]["disp"]) <= 11 and not ws[i]["disp"].endswith((".", ",", "?", "!")):
                grp.append(ws[i + 1])
            a = vo.start[k] + grp[0]["s"]
            b = vo.start[k] + (ws[i + len(grp)]["s"] if i + len(grp) < len(ws) else grp[-1]["e"] + 0.25)
            b = min(b, seg[k][1] - 0.03)
            txt = " ".join(g["disp"].strip(".,?!") for g in grp).lower()
            cap_html += f'  <div class="cap {"l" if n % 2 else "r"}" id="c{n}"><span class="strip">{txt}</span></div>\n'
            cap_js += (f'tl.set("#c{n}",{{opacity:1}},{a:.3f});tl.fromTo("#c{n} .strip",{{scale:0.8}},{{scale:1,duration:0.14,'
                       f'ease:"back.out(3)",immediateRender:false}},{a:.3f});tl.set("#c{n}",{{opacity:0}},{b:.3f});\n')
            n += 1
            i += len(grp)
    # ---------- assety
    for sub in ("fonts", "img", "js/lib", "audio", "sfx"):
        os.makedirs(os.path.join(B, "assets", sub), exist_ok=True)
    for f in FONTS:
        shutil.copy(f, os.path.join(B, "assets", "fonts", os.path.basename(f)))
    paper_texture(os.path.join(B, "assets", "img", "paper.png"))
    for lib in libs_used:
        shutil.copy(os.path.join(FACTORY, "lib", lib), os.path.join(B, "assets", "js", "lib", lib))
    # ---------- zvuk: hlas + vzduch + hudba (sidechain) + sfx -> WAV s cistymi casovymi znackami
    sfx = [(f, anchor(a) + float(off), float(vol)) for f, a, off, vol in E.get("sfx", [])]
    for f in {s[0] for s in sfx} | {"air_low.wav"}:
        shutil.copy(os.path.join(SFX_PACK, f), os.path.join(B, "assets", "sfx", f))
    inputs, filt, voices, others, ni = [], [], [], [], 0
    for k in keys:
        inputs += ["-i", os.path.join(B, "assets", "vo", f"{k}.mp3")]
        filt.append(f"[{ni}:a]adelay={int(vo.start[k] * 1000)}:all=1[v{ni}]")
        voices.append(f"[v{ni}]")
        ni += 1
    filt.append(f"{''.join(voices)}amix=inputs={len(voices)}:normalize=0:duration=longest,asplit=3[vox][vsc0][voxq0]")
    filt.append(f"[vsc0]apad=whole_dur={total}[vsc]")          # ovladanie stisovania az do konca (inak hudba skonci s hlasom)
    filt.append(f"[voxq0]apad=whole_dur={total}[voxq]")        # kontrolna stopa hlasu (hudba vs hlas)
    inputs += ["-stream_loop", "-1", "-i", os.path.join(B, "assets", "sfx", "air_low.wav")]
    filt.append(f"[{ni}:a]volume=0.5,atrim=duration={total},asetpts=PTS-STARTPTS[air]")
    others.append("[air]")
    ni += 1
    mu = E.get("music")
    if mu:
        inputs += ["-ss", str(mu.get("at", 0)), "-i", mu["file"]]
        filt.append(f"[{ni}:a]atrim=duration={total},asetpts=PTS-STARTPTS,volume=__MUSVOL__,afade=t=in:d=0.4,"
                    f"afade=t=out:st={total - 0.5:.2f}:d=0.5[mus0]")
        # pod hlasom vyrazne stlmit (hudba nikdy nie hlasnejsia ako hlas), v pauzach sa vrati
        sc = os.environ.get("PF_SC", "threshold=0.02:ratio=5:attack=10:release=800:makeup=1")
        filt.append(f"[mus0][vsc]sidechaincompress={sc},asplit=2[mus][musq]")
        others.append("[mus]")
        ni += 1
    else:
        filt.append("[vsc]anullsink")
        filt.append(f"anullsrc=r=48000:cl=mono,atrim=duration={total}[musq]")
    for f, t, vol in sfx:
        if 0 <= t < total:
            inputs += ["-i", os.path.join(B, "assets", "sfx", f)]
            filt.append(f"[{ni}:a]volume={vol},adelay={int(t * 1000)}:all=1[x{ni}]")
            others.append(f"[x{ni}]")
            ni += 1
    filt.append(f"[vox]{''.join(others)}amix=inputs={1 + len(others)}:normalize=0:duration=longest,"
                f"atrim=duration={total},loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000,asetpts=N/SR/TB[a]")
    mixwav = os.path.join(B, "assets", "audio", "mix.wav")
    qv, qm = os.path.join(B, "qc_vox.wav"), os.path.join(B, "qc_mus.wav")
    mv = float(mu.get("vol", 1.0)) if mu else 1.0
    for attempt in range(3):                          # poistka: hudba nikdy blizsie ako 3 dB k hlasu -> inak stisit a zmixovat znova
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt).replace("__MUSVOL__", f"{mv:.4f}"),
                        "-map", "[a]", "-t", str(total), "-c:a", "pcm_s16le", "-ar", "48000", mixwav,
                        "-map", "[voxq]", "-t", str(total), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", qv,
                        "-map", "[musq]", "-t", str(total), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", qm], check=True)
        mb = music_vs_voice(qv, qm)
        print(f"hudba vs hlas pocas reci: median {mb[0]} dB, najhlasnejsie miesto {mb[1]} dB (hlasitost hudby {mv:.2f})")
        if not mu or mb[1] <= -3:
            break
        cut = mb[1] + 4.5
        mv *= 10 ** (-cut / 20)
        print(f"  hudba sa blizi hlasu -> stisujem o {cut:.1f} dB a mixujem znova")
    # ---------- HTML
    hook = E.get("hook") or [E["title"], ""]
    libs = "\n".join(f'<script src="assets/js/lib/{lib}"></script>' for lib in libs_used)
    script = open(os.path.join(ep_dir, "script.js"), encoding="utf-8").read()
    audio = (f'  <audio id="mix" src="assets/audio/mix.wav" data-start="0" data-duration="{total}" data-track-index="10" data-volume="1"></audio>\n')
    html = open(os.path.join(HERE, "base.html"), encoding="utf-8").read()
    kit = dict({"chrome": "tape", "trans": "circle", "pres": "full", "cam": "calm", "palette": 0}, **E.get("kit", {}))
    kit_cls = f'ck-{kit["chrome"]} pk-{kit["pres"]}'
    for a, b in (("__KITJSON__", json.dumps(kit)), ("__KIT__", kit_cls),
                 ("__TITLE__", E["title"]), ("__BG__", E.get("bg", "#e8a18c")), ("__ACCENT__", E.get("accent", "#2a74b3")),
                 ("__DUR__", f"{total}"), ("__HOOK1__", hook[0]), ("__HOOK2__", hook[1]), ("<!--__CAPS__-->", cap_html),
                 ("<!--__AUDIO__-->", audio), ("/*__VO__*/", "window.__VO = " + json.dumps(VO) + ";"), ("<!--__LIBS__-->", libs),
                 ("/*__EPISODE__*/", script), ("/*__CAPJS__*/", cap_js)):
        html = html.replace(a, b)
    open(os.path.join(B, "index.html"), "w", encoding="utf-8").write(html)
    open(os.path.join(B, "hyperframes.json"), "w", encoding="utf-8").write('{"paths":{"assets":"assets"},"media":{"autoProxy":false}}')
    print("build ok:", name, total, "s,", n, "titulkov,", len(sfx), "sfx")
    if "--remux" in sys.argv:                         # len novy zvuk k uz vyrenderovanemu obrazu (obraz sa nemeni)
        final = os.path.join(FACTORY, "out", f"{name}.mp4")
        tmp = final[:-4] + "_remux.mp4"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", final, "-i", mixwav, "-map", "0:v", "-map", "1:a", "-t", str(total),
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", tmp], check=True)
        os.replace(tmp, final)
        ok, nbad, nwarn = audio_ok(final)
        print("FINAL", final, round(probe(final), 2), "s | zvuk", "OK" if ok else f"CHYBA ({nbad} paketov, {nwarn} dts)", "| len zvuk")
        return
    if "--render" not in sys.argv:
        return
    chk = subprocess.run(f"{HF} check .", cwd=B, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    print("CHECK:", " | ".join(l.strip() for l in (chk.stdout or "").splitlines() if "error(s)" in l or "✗" in l)[-700:] or "ok")
    subprocess.run(f"{HF} render .", cwd=B, shell=True, check=True, capture_output=True)
    rdir = os.path.join(B, "renders")
    rend = sorted([os.path.join(rdir, f) for f in os.listdir(rdir) if f.endswith(".mp4")], key=os.path.getmtime)[-1]
    os.makedirs(os.path.join(FACTORY, "out"), exist_ok=True)
    final = os.path.join(FACTORY, "out", f"{name}.mp4")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", rend, "-i", mixwav, "-map", "0:v", "-map", "1:a", "-t", str(total),
                    "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-profile:v", "high", "-level", "4.1", "-maxrate", "8M",
                    "-bufsize", "12M", "-g", "60", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                    "-movflags", "+faststart", final], check=True)
    for f in os.listdir(rdir):
        if os.path.join(rdir, f) != rend:
            os.remove(os.path.join(rdir, f))
    ok, nbad, nwarn = audio_ok(final)
    sheet = os.path.join(FACTORY, "out", f"{name}_qc.jpg")
    dur = probe(final)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", final, "-vf", f"fps=24/{dur:.3f},scale=200:-1,tile=8x3",
                    "-frames:v", "1", "-q:v", "3", sheet], check=True)
    # nahlad (prvy snimok s hookom) -> <name>.jpg (publikator ho pouzije ako obrazok videa)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", "0.4", "-i", final, "-frames:v", "1", "-q:v", "3",
                    os.path.join(FACTORY, "out", f"{name}.jpg")], check=False)
    with open(os.path.join(FACTORY, "out", f"{name}.txt"), "w", encoding="utf-8") as f:
        credit = (mu.get("credit", "") if mu else "")
        f.write(E["title"] + "\n\n" + E.get("description", "") + ("\n" + credit if credit else "") + "\n")
    print("FINAL", final, round(dur, 2), "s | zvuk", "OK" if ok else f"CHYBA ({nbad} paketov, {nwarn} dts)", "| QC", sheet)


if __name__ == "__main__":
    main()
