# -*- coding: utf-8 -*-
"""
motion.py - AI MOTION-GRAPHICS engine pre faceless reels (ziadne stock videa).

Kazdy segment videa = vlastna scena vygenerovana presne k tomu, co narator hovori:
  hook      - velky text + subjekt + prilietajuca "hrozba"/energia + flash (prve 2s zastavia scroll)
  kenburns  - AI obrazok (Pollinations/Flux, zadarmo) + hladky sub-pixel zoom/pan + volitelny popisok
  counter   - obrovske ziarive cislo sa vyrata 0 -> N (+ tiky)
  compare   - dva objekty vedla seba (maly vs velky) + vyrazny udaj = ukazat, nie napisat
  callouts  - subjekt + popisky s vodiacimi ciarami (pulzujuce kotvy)
  lineup    - objekty v rade s menovkami, kamera panuje (storyboard)
  arrow     - zelena sipka co sa sama kresli medzi objektmi (storyboard)
  cta       - subjekt + kruh v brand farbe + FOLLOW chip (rovnaky styl ako zvysok)

Principy (vyladene s userom, 9 iteracii):
  - vizual MUSI sediet s hovorenou vetou; nic neprezradza dopredu
  - vsetok pohyb sub-pixel (AFFINE BICUBIC) -> hladke, nie sekave
  - pozadie zije: blikajuce hviezdy / gradient + plavajuci prach
  - filmovy look robi ffmpeg -vf (bloom lighten + vignette + jemne zrno)
  - AI obrazky: cache + retry; ak zlyhaju, vola sa stary Pexels fallback (video VZDY vyjde)
Personalizacia per factory: akcent = caption_highlight_hex (brand), pozadie motion_bg,
styl obrazkov motion_style, hlas/hudba/titulky ostavaju z existujuceho pipeline.
"""
import hashlib
import json
import math
import os
import re
import subprocess
import urllib.parse
import wave

import numpy as np
import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(ROOT, "assets", "fonts")
GREEN = (60, 230, 110)

# filmovy look (2026): bloom cez lighten (POZOR: screen blend kazi farby), vignette, jemne zrno
CINEMA_VF = ("format=gbrp,eq=contrast=1.08:saturation=1.08,"
             "split=2[b][g];[g]gblur=sigma=18[g2];[b][g2]blend=all_mode=lighten:all_opacity=0.5,"
             "vignette=angle=PI/5,noise=alls=3:allf=t,format=yuv420p")


# ----------------------------------------------------------------------------- pomocne
def _hex_bgr_to_rgb(h, default=(0, 200, 255)):
    try:
        h = str(h).strip().lstrip("&H").lstrip("0x").upper().zfill(6)
        b, g, r = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return (r, g, b)
    except Exception:
        return default


def _font(size, big=False):
    cands = ["Anton-Regular.ttf"] if big else []
    cands += ["Poppins-SemiBold.ttf", "Poppins-Bold.ttf", "DMSerifDisplay-Regular.ttf"]
    for c in cands:
        p = os.path.join(FONT_DIR, c)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease(t, tempo):
    if tempo == "punch":                     # svizne dobehne, potom drzi (hook/pointa)
        return smooth(min(1.0, t / 0.45))
    return smooth(t)                         # calm - plynulo cez cely cas


def sample(canvas, out_w, out_h, cx, cy, win_w, win_h):
    """Sub-pixel vyrez okna centrovaneho na (cx,cy) -> hladky pohyb bez sekania."""
    a = win_w / out_w
    e = win_h / out_h
    return canvas.transform((out_w, out_h), Image.AFFINE,
                            (a, 0, cx - win_w / 2.0, 0, e, cy - win_h / 2.0),
                            resample=Image.BICUBIC)


# ----------------------------------------------------------------------------- AI obrazky (zadarmo)
def ai_image(prompt, w, h, seed, cache_dir, timeout=240):
    """Pollinations/Flux - free, bez kluca. Cache + 3 pokusy. Vrati cestu alebo None."""
    os.makedirs(cache_dir, exist_ok=True)
    key = hashlib.md5(f"{prompt}|{w}x{h}|{seed}".encode()).hexdigest()[:20]
    p = os.path.join(cache_dir, f"ai_{key}.jpg")
    if os.path.exists(p) and os.path.getsize(p) > 8000:
        return p
    url = (f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt[:900])}"
           f"?width={w}&height={h}&model=flux&nologo=true&seed={seed}")
    for att in range(3):
        try:
            r = requests.get(url, timeout=timeout)
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("image"):
                with open(p, "wb") as f:
                    f.write(r.content)
                return p
            print(f"   [ai_image] HTTP {r.status_code} (pokus {att + 1}/3)")
        except Exception as e:
            print(f"   [ai_image] {str(e)[:70]} (pokus {att + 1}/3)")
        import time as _t
        _t.sleep(4 + 5 * att)
    return None


def load_img(path, size=None, crop_bottom=0.07):
    """Nacitaj AI obrazok (odrez spodok - obcasny vodoznak) ako RGB numpy."""
    im = Image.open(path).convert("RGB")
    if crop_bottom:
        im = im.crop((0, 0, im.size[0], int(im.size[1] * (1 - crop_bottom))))
    if size:
        im = im.resize(size, Image.LANCZOS)
    return np.asarray(im).astype(np.uint8)


def paste_lighten(bg, obj, cx, cy):
    """Objekt na tmavom pozadi -> lighten blend (cierna zmizne)."""
    oh, ow = obj.shape[:2]
    x0, y0 = int(cx - ow / 2), int(cy - oh / 2)
    bx0, by0 = max(0, x0), max(0, y0)
    bx1, by1 = min(bg.shape[1], x0 + ow), min(bg.shape[0], y0 + oh)
    if bx0 >= bx1 or by0 >= by1:
        return
    sub = obj[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0]
    bg[by0:by1, bx0:bx1] = np.maximum(bg[by0:by1, bx0:bx1], sub)


# ----------------------------------------------------------------------------- kontext (per video)
class Ctx:
    def __init__(self, cfg, spec):
        self.W = int(cfg.get("width", 1080))
        self.H = int(cfg.get("height", 1920))
        self.FPS = int(cfg.get("fps", 30))
        self.accent = _hex_bgr_to_rgb(cfg.get("motion_accent") or cfg.get("caption_highlight_hex"))
        self.style = cfg.get("motion_style",
                             "cinematic photograph, dark clean background, dramatic soft light, "
                             "ultra detailed, no text, no watermark")
        self.bgmode = cfg.get("motion_bg", "stars")
        self.brand0 = str(cfg.get("brand_primary", "0x0a0d14")).replace("0x", "#")
        self.title = re.sub(r"#\S+", "", str(spec.get("title", ""))).strip()
        self.seed = int(hashlib.md5(self.title.encode()).hexdigest()[:6], 16) % 99991
        self.cache = os.path.join(ROOT, "assets", "ai_cache")
        self.events = []                      # (typ, globalny_cas) pre SFX
        self.cursor = 0.0                     # globalny cas (plni make_video)
        self._bg = None
        self._twk = None
        self._dust = None

    # ---- zive pozadie ----
    def bg_canvas(self, w, h, seed_off=0):
        rng = np.random.default_rng(self.seed + seed_off)
        if self.bgmode == "stars":
            img = np.zeros((h, w, 3), dtype=np.float32)
            img[:, :, 0] += 6; img[:, :, 1] += 8; img[:, :, 2] += 14
            pil = Image.fromarray(img.astype(np.uint8))
            d = ImageDraw.Draw(pil)
            for _ in range(int(w * h / 14000)):
                x, y = rng.integers(0, w), rng.integers(0, h)
                s = int(rng.choice([0, 0, 0, 1, 1, 2])); b = float(rng.uniform(60, 255))
                d.ellipse([x - s, y - s, x + s, y + s], fill=(int(b), int(b * 0.97), int(b * 0.9)))
            glow = pil.filter(ImageFilter.GaussianBlur(1.2))
            return np.maximum(np.asarray(pil), np.asarray(glow) // 2)
        # gradient: brand_primary hore -> takmer cierna dole + jemny akcentovy nadych
        try:
            c0 = tuple(int(self.brand0.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
        except Exception:
            c0 = (10, 13, 20)
        yy = np.linspace(0, 1, h)[:, None, None]
        base = (np.array(c0) * (1 - yy * 0.75)).astype(np.float32)
        img = np.repeat(base, w, axis=1)
        ac = np.array(self.accent, dtype=np.float32)
        gx, gy = w * 0.5, h * 0.30
        xs, ys = np.meshgrid(np.arange(w), np.arange(h))
        blob = np.exp(-(((xs - gx) / (w * 0.55)) ** 2 + ((ys - gy) / (h * 0.4)) ** 2))
        img += blob[..., None] * ac * 0.10
        return np.clip(img, 0, 255).astype(np.uint8)

    def stars_v(self):
        if self._bg is None:
            self._bg = self.bg_canvas(self.W, self.H)
        return self._bg

    def twinkle(self, im_rgba, t):
        if self.bgmode != "stars":
            return
        if self._twk is None:
            rng = np.random.default_rng(self.seed + 5)
            n = 70
            self._twk = (rng.uniform(0, self.W, n), rng.uniform(0, self.H, n),
                         rng.uniform(0, 6.28, n), rng.uniform(0.5, 1.7, n), rng.uniform(1.0, 2.7, n))
        x, y, ph, sp, sz = self._twk
        lay = Image.new("RGBA", im_rgba.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for i in range(len(x)):
            b = int(160 * (0.45 + 0.55 * math.sin(t * sp[i] + ph[i])) ** 2)
            d.ellipse([x[i] - sz[i], y[i] - sz[i], x[i] + sz[i], y[i] + sz[i]],
                      fill=(220, 230, 255, max(0, b)))
        im_rgba.alpha_composite(lay.filter(ImageFilter.GaussianBlur(0.6)))

    def dust(self, im_rgba, t):
        if self._dust is None:
            rng = np.random.default_rng(self.seed + 9)
            n = 40
            self._dust = (rng.uniform(0, self.W, n), rng.uniform(0, self.H, n),
                          rng.uniform(1.4, 4.4, n), rng.uniform(5, 18, n),
                          rng.uniform(-5, 5, n), rng.uniform(26, 85, n))
        x, y, sz, sp, dx, br = self._dust
        lay = Image.new("RGBA", im_rgba.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for i in range(len(x)):
            px = (x[i] + dx[i] * t) % self.W
            py = (y[i] - sp[i] * t) % self.H
            s = sz[i] * (0.8 + 0.2 * math.sin(t * 2 + i))
            d.ellipse([px - s, py - s, px + s, py + s], fill=(190, 208, 235, int(br[i])))
        im_rgba.alpha_composite(lay.filter(ImageFilter.GaussianBlur(1.6)))


# ----------------------------------------------------------------------------- vektorova grafika
def _overlay(ctx):
    return Image.new("RGBA", (ctx.W * 2, ctx.H * 2), (0, 0, 0, 0))


def draw_callout(ctx, ov, label, anchor, box_xy, t):
    """Popisok s vodiacou ciarou (kresli sa) + pulzujuca kotva + box so slide/fade."""
    if t <= 0:
        return
    t = min(1.0, t)
    d = ImageDraw.Draw(ov)
    ax, ay = anchor[0] * 2, anchor[1] * 2
    bx, by = box_xy[0] * 2, box_xy[1] * 2
    lt = smooth(min(1.0, t / 0.4))
    d.line([ax, ay, ax + (bx - ax) * lt, ay + (by - ay) * lt], fill=(255, 255, 255, 230), width=5)
    pr = 12 + 5 * math.sin(t * 12)
    d.ellipse([ax - pr, ay - pr, ax + pr, ay + pr], outline=(255, 255, 255, 240), width=5)
    d.ellipse([ax - 6, ay - 6, ax + 6, ay + 6], fill=ctx.accent + (255,))
    if t > 0.35:
        bt = smooth((t - 0.35) / 0.65)
        f = _font(84, big=True)
        tw = d.textlength(label, font=f)
        pad = 32
        al = int(235 * bt)
        sl = int(24 * (1 - bt))
        d.rounded_rectangle([bx - pad, by - 78 + sl, bx + tw + pad, by + 78 + sl],
                            radius=20, fill=(8, 12, 22, al), outline=ctx.accent + (al,), width=5)
        d.text((bx, by + sl), label, font=f, fill=(255, 255, 255, al), anchor="lm")


def glow_big_text(ctx, ov, lines, y_frac, size, color=None, t=1.0):
    """Velky ziarivy text (scale-in)."""
    color = color or (255, 255, 255)
    sc = 0.72 + 0.28 * smooth(min(1.0, t / 0.22))
    f = _font(int(size * sc) * 2, big=True)
    d = ImageDraw.Draw(ov)
    for li, line in enumerate(lines):
        yy = int(ov.size[1] * y_frac) + li * int(size * sc * 2.15)
        d.text((ov.size[0] // 2, yy), line, font=f, fill=color + (255,),
               anchor="mm", stroke_width=9, stroke_fill=(6, 10, 18))


def glow_number(ctx, ov, text, y_frac, size=290):
    """Ohnive ziarive cislo (pocitadlo)."""
    f = _font(size * 2, big=True)
    tmp = Image.new("L", ov.size, 0)
    d = ImageDraw.Draw(tmp)
    bb = d.textbbox((0, 0), text, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((ov.size[0] - tw) // 2 - bb[0], int(ov.size[1] * y_frac) - th // 2 - bb[1]),
           text, font=f, fill=255)
    mask = np.asarray(tmp).astype(np.float32) / 255.0
    yy = np.linspace(0, 1, ov.size[1])[:, None]
    r = 255 * (0.85 + 0.15 * (1 - yy)); g = 90 + 110 * (1 - yy); b = 30 * (1 - yy)
    lay = Image.fromarray(np.stack([r * mask, g * mask, b * mask, 255 * mask], -1).astype(np.uint8), "RGBA")
    glow = lay.filter(ImageFilter.GaussianBlur(26))
    ov.alpha_composite(glow); ov.alpha_composite(glow); ov.alpha_composite(lay)


def _wrap_big(text, max_chars=14, max_lines=3):
    words = re.sub(r"\s+", " ", text.upper()).strip().split()
    lines, cur = [], ""
    for w in words:
        if len(cur) + len(w) + 1 <= max_chars or not cur:
            cur = (cur + " " + w).strip()
        else:
            lines.append(cur); cur = w
        if len(lines) == max_lines:
            break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    return lines


# ----------------------------------------------------------------------------- SCENY
def scene_kenburns(ctx, dur, img_path, tempo="calm", label=None, idx=0):
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    CW, CH = int(W * 1.5), int(H * 1.5)
    if img_path:
        big = Image.fromarray(load_img(img_path)).resize((CW, CH), Image.LANCZOS)
    else:
        big = Image.fromarray(ctx.bg_canvas(CW, CH, seed_off=idx))
    moves = [(1.00, 1.14, 0.5, -0.4), (1.14, 1.02, -0.5, 0.35), (1.02, 1.15, 0.35, 0.5),
             (1.12, 1.00, -0.4, -0.45)]
    z0, z1, px, py = moves[idx % len(moves)]
    n = max(2, int(dur * FPS))
    for fi in range(n):
        t = fi / max(1, n - 1)
        e = ease(t, tempo)
        z = z0 + (z1 - z0) * e
        cx = CW / 2.0 + px * CW * 0.06 * (2 * e - 1)
        cy = CH / 2.0 + py * CH * 0.05 * (2 * e - 1)
        bg = sample(big, W, H, cx, cy, CW / z / 1.5, CH / z / 1.5).convert("RGBA")
        ov = None
        if label:
            ov = _overlay(ctx)
            draw_callout(ctx, ov, label, (W * 0.5, H * 0.40), (W * 0.10, H * 0.14), (t - 0.25) / 0.30)
        yield bg, ov


def scene_hook(ctx, dur, img_path, big_text, threat=True, tempo="punch", idx=0):
    """Hook: subjekt centrovany + velka otazka/titulok + prilietajuca energia + flash."""
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    CW, CH = int(W * 1.5), int(H * 1.5)
    canvas = ctx.bg_canvas(CW, CH, seed_off=1)
    if img_path:
        es = int(min(CW, CH) * 0.62)
        obj = load_img(img_path, (es, es))
        paste_lighten(canvas, obj, CW // 2, int(CH * 0.44))
    big = Image.fromarray(canvas)
    ecx, ecy, er = W / 2.0, H * 0.44, min(CW, CH) * 0.62 / 3.0
    lines = _wrap_big(big_text, max_chars=15, max_lines=2)
    n = max(2, int(dur * FPS))
    for fi in range(n):
        t = fi / max(1, n - 1)
        z = 1.0 + 0.10 * smooth(t)
        shake = 10 * math.sin(t * 55) * max(0.0, 1 - t / 0.16)
        bg = sample(big, W, H, CW / 2.0 + shake, CH * 0.46, CW / z / 1.5, CH / z / 1.5).convert("RGBA")
        ov = _overlay(ctx)
        d = ImageDraw.Draw(ov)
        if threat:
            prog = smooth(min(1.0, t / 0.9))
            p0 = (W * 1.06, -H * 0.03)
            p1 = (ecx + er * 0.9, ecy - er * 0.9)
            hx = p0[0] + (p1[0] - p0[0]) * prog
            hy = p0[1] + (p1[1] - p0[1]) * prog
            for k in range(22):
                tp = prog - k * 0.02
                if tp < 0:
                    break
                tx = p0[0] + (p1[0] - p0[0]) * tp
                ty = p0[1] + (p1[1] - p0[1]) * tp
                rr = max(1.0, 11 - k * 0.45) * 2
                aa = int(210 * (1 - k / 22))
                d.ellipse([tx * 2 - rr, ty * 2 - rr, tx * 2 + rr, ty * 2 + rr], fill=(255, 170, 80, aa))
            for rr, aa in ((34, 90), (20, 170), (10, 255)):
                d.ellipse([hx * 2 - rr, hy * 2 - rr, hx * 2 + rr, hy * 2 + rr], fill=(255, 225, 160, aa))
        glow_big_text(ctx, ov, lines, 0.13, 158, t=t)
        if t < 0.07:
            d.rectangle([0, 0, ov.size[0], ov.size[1]],
                        fill=(255, 255, 255, int(120 * (1 - t / 0.07))))
        yield bg, ov


def scene_counter(ctx, dur, target, suffix, sub_label, tempo="punch", idx=0):
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    base = (ctx.stars_v().astype(np.float32) * 0.55).astype(np.uint8)
    n = max(2, int(dur * FPS))
    step = max(1, int(target / 140))
    for fi in range(n):
        t = fi / max(1, n - 1)
        im = Image.fromarray(base).convert("RGBA")
        ov = _overlay(ctx)
        d = ImageDraw.Draw(ov)
        # padajuce iskry/meteory za cislom
        lay = Image.new("RGBA", ov.size, (0, 0, 0, 0))
        dd = ImageDraw.Draw(lay)
        for k in range(8):
            ph = (t * 0.55 + (k * 0.313) % 1.0) % 1.0
            x = (0.07 + 0.86 * ((k * 0.41) % 1.0)) * ov.size[0]
            y = ph * (ov.size[1] + 300) - 150
            a = int(140 * (1 - abs(ph - 0.5) * 2))
            dd.line([x, y, x - 60, y - 130], fill=(255, 205, 150, max(0, a)), width=6)
        ov.alpha_composite(lay.filter(ImageFilter.GaussianBlur(2)))
        val = int(round(ease(t, "punch") * target))
        val = min(target, (val // step) * step if val < target else target)
        glow_number(ctx, ov, f"{val}{suffix}", 0.40)
        if sub_label:
            f = _font(66)
            d.text((W, int(H * 0.40) * 2 + 330), sub_label.upper(), font=f,
                   fill=(255, 255, 255, 235), anchor="mm")
        yield im, ov


def scene_compare(ctx, dur, img_small, img_big, lab_small, lab_big, stat, tempo="calm", idx=0):
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    base = ctx.stars_v().copy()
    if img_small:
        paste_lighten(base, load_img(img_small, (int(W * 0.09), int(W * 0.09))), int(W * 0.16), int(H * 0.40))
    if img_big:
        paste_lighten(base, load_img(img_big, (int(W * 0.46), int(W * 0.46))), int(W * 0.74), int(H * 0.40))
    frame = Image.fromarray(base)
    n = max(2, int(dur * FPS))
    for fi in range(n):
        t = fi / max(1, n - 1)
        im = frame.convert("RGBA")
        ov = _overlay(ctx)
        d = ImageDraw.Draw(ov)
        fl = _font(44)
        d.text((int(W * 0.16) * 2, (int(H * 0.40) + 90) * 2), lab_small.upper(), font=fl,
               fill=(255, 255, 255, 235), anchor="mm")
        d.text((int(W * 0.74) * 2, (int(H * 0.40) + 150) * 2), lab_big.upper(), font=fl,
               fill=(255, 255, 255, 235), anchor="mm")
        sc = 0.8 + 0.2 * smooth(min(1.0, t / 0.3))
        fb = _font(int(150 * sc), big=True)
        d.text((int(W * 0.43) * 2, int(H * 0.38) * 2), stat, font=fb,
               fill=ctx.accent + (255,), anchor="mm", stroke_width=9, stroke_fill=(6, 10, 18))
        yield im, ov


def scene_callouts(ctx, dur, img_path, labels, tempo="calm", idx=0):
    """Subjekt (zoom-in) + 1-2 popisky s ciarami."""
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    CW, CH = int(W * 1.7), int(H * 1.7)
    canvas = ctx.bg_canvas(CW, CH, seed_off=idx + 3)
    if img_path:
        jsz = int(CW * 0.9)
        paste_lighten(canvas, load_img(img_path, (jsz, jsz)), CW // 2, int(CH * 0.44))
    big = Image.fromarray(canvas)
    spots = [((W * 0.44, H * 0.32), (W * 0.08, H * 0.11)),
             ((W * 0.60, H * 0.50), (W * 0.50, H * 0.20))]
    n = max(2, int(dur * FPS))
    for fi in range(n):
        t = fi / max(1, n - 1)
        z = 1.02 + 0.20 * smooth(t)
        drift = (t - 0.5) * (CW * 0.03)
        bg = sample(big, W, H, CW / 2.0 + drift, CH * 0.47, CW / z / 1.7, CH / z / 1.7).convert("RGBA")
        ov = _overlay(ctx)
        for li, lab in enumerate(labels[:2]):
            anchor, box = spots[li]
            draw_callout(ctx, ov, lab.upper(), anchor, box, (t - 0.12 - 0.38 * li) / 0.28)
        yield bg, ov


def scene_cta(ctx, dur, img_path, brand, tempo="calm", idx=0):
    """Outro V STYLE zvysku: subjekt + akcentovy kruh + FOLLOW chip."""
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    base = ctx.stars_v().copy()
    es = int(W * 0.58)
    if img_path:
        paste_lighten(base, load_img(img_path, (es, es)), W // 2, int(H * 0.34))
    frame = Image.fromarray(base)
    n = max(2, int(dur * FPS))
    cy = int(H * 0.34)
    for fi in range(n):
        t = fi / max(1, n - 1)
        im = frame.convert("RGBA")
        ov = _overlay(ctx)
        d = ImageDraw.Draw(ov)
        R = es * 0.62
        sweep = smooth(min(1.0, t / 0.55))
        d.arc([(W // 2 - R) * 2, (cy - R) * 2, (W // 2 + R) * 2, (cy + R) * 2],
              start=-90, end=-90 + 360 * sweep, fill=ctx.accent + (235,), width=12)
        if sweep < 1.0:
            ang = math.radians(-90 + 360 * sweep)
            hx = (W // 2 + R * math.cos(ang)) * 2
            hy = (cy + R * math.sin(ang)) * 2
            d.ellipse([hx - 15, hy - 15, hx + 15, hy + 15], fill=(255, 255, 255, 255))
        if t > 0.45:
            bt = smooth((t - 0.45) / 0.55)
            f = _font(96, big=True)
            label = "FOLLOW " + ("@" + brand if brand else "FOR MORE")
            label = label[:26]
            tw = d.textlength(label, font=f)
            pad = 44
            yy = int(H * 0.85) * 2 + int(28 * (1 - bt))
            al = int(240 * bt)
            d.rounded_rectangle([W - tw / 2 - pad, yy - 95, W + tw / 2 + pad, yy + 95],
                                radius=26, fill=(8, 12, 22, al), outline=ctx.accent + (al,), width=6)
            d.text((W, yy), label, font=f, fill=(255, 255, 255, al), anchor="mm")
        yield im, ov


def scene_lineup(ctx, dur, items, tempo="calm", idx=0):
    """Objekty v rade + menovky, kamera panuje. items=[{name,img}...]"""
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    CW = int(W * 2.6)
    canvas = ctx.bg_canvas(CW, H, seed_off=idx + 7)
    m = max(1, len(items))
    xs = [int(CW * (0.5 + i) / m) for i in range(m)]
    cy = int(H * 0.36)
    sizes = []
    for it, x in zip(items, xs):
        sz = int(W * (0.24 + 0.14 * ((hash(it.get("name", "")) % 3))))
        sizes.append(sz)
        if it.get("img"):
            paste_lighten(canvas, load_img(it["img"], (sz, sz)), x, cy)
    wide = Image.fromarray(canvas)
    maxpan = CW - W
    n = max(2, int(dur * FPS))
    for fi in range(n):
        t = fi / max(1, n - 1)
        camx = maxpan * (0.10 + 0.75 * ease(t, tempo))
        im = sample(wide, W, H, camx + W / 2.0, H / 2.0, W, H).convert("RGBA")
        ov = _overlay(ctx)
        d = ImageDraw.Draw(ov)
        f = _font(62, big=True)
        for (it, x, sz) in zip(items, xs, sizes):
            sx = x - camx
            if not (-260 < sx < W + 260):
                continue
            pop = max(0.0, min(1.0, 1.0 - (sx - W * 0.6) / 260)) if sx > W * 0.6 else 1.0
            name = str(it.get("name", "")).upper()
            lw = d.textlength(name, font=f)
            ly = (cy + sz / 2 + 44) * 2 + int((1 - pop) * 30)
            d.rounded_rectangle([sx * 2 - lw / 2 - 28, ly, sx * 2 + lw / 2 + 28, ly + 108],
                                radius=16, fill=(8, 12, 22, int(200 * pop)),
                                outline=(255, 255, 255, int(90 * pop)), width=3)
            d.text((sx * 2, ly + 54), name, font=f, fill=(255, 255, 255, int(235 * pop)), anchor="mm")
        yield im, ov


def scene_arrow(ctx, dur, img_from, img_to, label, tempo="calm", idx=0):
    """Zelena sipka sa kresli od objektu A k objektu B + popisok."""
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    base = ctx.stars_v().copy()
    if img_from:
        paste_lighten(base, load_img(img_from, (int(W * 0.28), int(W * 0.28))), int(W * 0.28), int(H * 0.84))
    if img_to:
        paste_lighten(base, load_img(img_to, (int(W * 0.48), int(W * 0.48))), int(W * 0.86), int(H * 0.55))
    frame = Image.fromarray(base)
    p0, p1, p2 = (W * 0.15, H * 0.10), (W * 0.45, H * 0.45), (W * 0.90, H * 0.60)
    n = max(2, int(dur * FPS))

    def bez(s):
        x = (1 - s) ** 2 * p0[0] + 2 * (1 - s) * s * p1[0] + s ** 2 * p2[0]
        y = (1 - s) ** 2 * p0[1] + 2 * (1 - s) * s * p1[1] + s ** 2 * p2[1]
        return x, y

    for fi in range(n):
        t = fi / max(1, n - 1)
        im = frame.convert("RGBA")
        ov = _overlay(ctx)
        at = smooth(max(0.0, min(1.0, (t - 0.12) / 0.55)))
        if at > 0:
            lay = Image.new("RGBA", ov.size, (0, 0, 0, 0))
            d = ImageDraw.Draw(lay)
            pts = [bez(s * at) for s in np.linspace(0, 1, 60)]
            pts2 = [(x * 2, y * 2) for x, y in pts]
            d.line(pts2, fill=GREEN + (255,), width=28, joint="curve")
            (x1, y1), (x2, y2) = pts2[-2], pts2[-1]
            ang = math.atan2(y2 - y1, x2 - x1)
            L = 70
            d.polygon([(x2 + L * math.cos(ang), y2 + L * math.sin(ang)),
                       (x2 + L * 0.55 * math.cos(ang + 2.5), y2 + L * 0.55 * math.sin(ang + 2.5)),
                       (x2 + L * 0.55 * math.cos(ang - 2.5), y2 + L * 0.55 * math.sin(ang - 2.5))],
                      fill=GREEN + (255,))
            ov.alpha_composite(lay.filter(ImageFilter.GaussianBlur(14)))
            ov.alpha_composite(lay)
            if 0 < at < 1:
                x, y = bez(at)
                d2 = ImageDraw.Draw(ov)
                for rr, aa in ((26, 90), (16, 160), (9, 255)):
                    d2.ellipse([x * 2 - rr, y * 2 - rr, x * 2 + rr, y * 2 + rr], fill=(255, 210, 140, aa))
        if label and t > 0.5:
            draw_callout(ctx, ov, label.upper(), (W * 0.58, H * 0.47), (W * 0.12, H * 0.28), (t - 0.5) / 0.3)
        yield im, ov


# ----------------------------------------------------------------------------- STORYBOARD (auto plan)
_NUMWORDS = {"hundred": 100, "thousand": 1000, "million": 1000000, "billion": 1000000000}


def _find_number(text):
    m = re.search(r"\b(\d[\d,]*)\b", text)
    if m:
        try:
            v = int(m.group(1).replace(",", ""))
            if v >= 10:
                return v
        except Exception:
            pass
    for w, v in _NUMWORDS.items():
        if re.search(r"\b" + w + r"\b", text, re.IGNORECASE):
            return v
    return None


def _vis_prompt(seg):
    """DOSLOVNY vizualny motiv: primarne 'keywords' (LLM ich pisal ako popis ZABERU pre tuto vetu),
    nie cela veta (abstraktne vety -> divne surrealne obrazky)."""
    kw = re.sub(r"\b(animation|illustration|footage|video|clip)\b", "", str(seg.get("keywords", "")),
                flags=re.IGNORECASE).strip(" ,")
    tx = str(seg.get("text", "")).strip()
    base = kw if len(kw) >= 6 else tx
    return f"clear, instantly recognizable photo of {base}, single main subject, centered"


def plan_visual(seg, i, n_total, title):
    """Vrati scene-spec pre segment: explicitny storyboard (seg['visual']) alebo auto-odvodeny."""
    v = seg.get("visual")
    if isinstance(v, dict) and v.get("type"):
        return dict(v)
    text = str(seg.get("text", ""))
    kw = str(seg.get("keywords", "")).strip()
    if i == 0:
        return {"type": "hook", "prompt": _vis_prompt(seg), "big": title}
    if i == n_total - 1:
        return {"type": "cta", "prompt": _vis_prompt(seg)}
    num = _find_number(text)
    if num and num >= 10:
        sfx = "x" if re.search(r"\btimes\b", text, re.IGNORECASE) else ""
        return {"type": "counter", "target": min(num, 999999), "suffix": sfx,
                "label": kw[:30]}
    if (i % 3) == 2 and kw:
        return {"type": "callouts", "prompt": _vis_prompt(seg),
                "labels": [" ".join(kw.split()[:2])]}
    return {"type": "kenburns", "prompt": _vis_prompt(seg)}


# ----------------------------------------------------------------------------- RENDER segmentu
def render_motion_segment(i, seg, scene, audio_path, duration, cfg, tmp, ctx):
    """Vyrenderuje segment ako motion scenu -> seg_{i:03d}.mp4 (video+audio, format ako render_segment)."""
    W, H, FPS = ctx.W, ctx.H, ctx.FPS
    ff = cfg["ffmpeg"]
    out = os.path.join(tmp, f"seg_{i:03d}.mp4")
    styp = scene.get("type", "kenburns")
    tempo = "punch" if styp in ("hook", "counter") else "calm"

    def img_of(prompt, w=768, h=1344, soff=0):
        if not prompt:
            return None
        return ai_image(f"{prompt}. {ctx.style}", w, h, ctx.seed + soff, ctx.cache)

    if styp == "hook":
        gen = scene_hook(ctx, duration, img_of(scene.get("prompt"), 896, 896, 1),
                         scene.get("big") or ctx.title, threat=scene.get("threat", True), idx=i)
        ctx.events.append(("boom", ctx.cursor + 0.10))
    elif styp == "counter":
        tgt = int(scene.get("target", 100))
        gen = scene_counter(ctx, duration, tgt, scene.get("suffix", ""), scene.get("label", ""), idx=i)
        for j in range(10):
            ctx.events.append(("tick", ctx.cursor + 0.12 + j * min(0.16, duration / 14)))
        ctx.events.append(("boom", ctx.cursor + min(duration * 0.55, 1.8)))
    elif styp == "compare":
        gen = scene_compare(ctx, duration,
                            img_of(scene.get("small_prompt"), 512, 512, 2),
                            img_of(scene.get("big_prompt"), 768, 768, 3),
                            scene.get("small_label", ""), scene.get("big_label", ""),
                            scene.get("stat", ""), idx=i)
    elif styp == "callouts":
        gen = scene_callouts(ctx, duration, img_of(scene.get("prompt"), 896, 896, 4 + i),
                             scene.get("labels") or [], idx=i)
    elif styp == "lineup":
        items = []
        for k, it in enumerate((scene.get("items") or [])[:6]):
            items.append({"name": it.get("name", ""),
                          "img": img_of(it.get("prompt"), 640, 640, 10 + k)})
        gen = scene_lineup(ctx, duration, items, idx=i)
    elif styp == "arrow":
        gen = scene_arrow(ctx, duration, img_of(scene.get("from_prompt"), 512, 512, 20),
                          img_of(scene.get("to_prompt"), 640, 640, 21),
                          scene.get("label", ""), idx=i)
    elif styp == "cta":
        gen = scene_cta(ctx, duration, img_of(scene.get("prompt"), 768, 768, 30),
                        cfg.get("brand_handle", "").lstrip("@") or cfg.get("brand_name", ""), idx=i)
    else:
        lab = (scene.get("labels") or [None])[0]
        gen = scene_kenburns(ctx, duration, img_of(scene.get("prompt"), 768, 1344, 40 + i),
                             tempo=tempo, label=lab, idx=i)

    # (whoosh na strihoch uz robi add_sfx v make_video -> tu len boom/tick udalosti scen)
    proc = subprocess.Popen(
        [ff, "-y", "-loglevel", "error",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-i", audio_path, "-t", f"{duration:.3f}", "-vf", CINEMA_VF,
         "-map", "0:v", "-map", "1:a",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
         "-r", str(FPS), "-c:a", "aac", "-ar", "44100", "-b:a", "160k", out],
        stdin=subprocess.PIPE)
    seg_start = ctx.cursor
    try:
        for im, ov in gen:
            if ov is not None:
                ovr = ov.resize((W, H), Image.LANCZOS)
                im.alpha_composite(ovr.filter(ImageFilter.GaussianBlur(7)))   # glow za grafikou
                im.alpha_composite(ovr)
            ctx.twinkle(im, ctx.cursor)
            ctx.dust(im, ctx.cursor)
            rgb = im.convert("RGB")
            local = ctx.cursor - seg_start
            if local < 0.34:                                                  # punch-in na strihu
                z = 1.0 + 0.04 * (1 - smooth(local / 0.34))
                rgb = sample(rgb, W, H, W / 2.0, H / 2.0, W / z, H / z)
            proc.stdin.write(np.asarray(rgb, dtype=np.uint8).tobytes())
            ctx.cursor += 1.0 / FPS
    finally:
        proc.stdin.close()
        rc = proc.wait()
    if rc != 0 or not os.path.exists(out) or os.path.getsize(out) < 20000:
        raise RuntimeError(f"motion render zlyhal (rc={rc})")
    ctx.cursor = seg_start + duration                                        # presne zarovnanie
    return out


# ----------------------------------------------------------------------------- presny sync titulkov
_WHISPER = None


def align_words(wav_or_mp3, fallback):
    """Presne casovanie slov cez faster-whisper (ak je nainstalovany) -> titulky sedia s hlasom.
    Pri akomkolvek probleme vrati povodny (proporcny) odhad."""
    global _WHISPER
    try:
        from faster_whisper import WhisperModel
        if _WHISPER is None:
            _WHISPER = WhisperModel("tiny", device="cpu", compute_type="int8")
        segs, _ = _WHISPER.transcribe(wav_or_mp3, language="en", word_timestamps=True)
        out = []
        for s in segs:
            for w in (s.words or []):
                tx = w.word.strip()
                if tx:
                    out.append((float(w.start), max(0.05, float(w.end) - float(w.start)), tx))
        return out if len(out) >= max(3, len(fallback) // 2) else fallback
    except Exception as e:
        print("   [whisper sync fallback]", str(e)[:60])
        return fallback


# ----------------------------------------------------------------------------- SFX (syntet., zadarmo)
def _norm(x, peak):
    return (x / (np.max(np.abs(x)) + 1e-9) * peak).astype(np.float32)


def _sfx_bank(sr=44100):
    n1 = int(sr * 0.42)
    t1 = np.linspace(0, 0.42, n1)
    noise = np.random.default_rng(1).normal(0, 1, n1)
    env = np.exp(-((t1 - 0.19) / 0.13) ** 2)
    whoosh = _norm(np.convolve(noise * env, np.ones(170) / 170, mode="same"), 0.26)
    n2 = int(sr * 0.75)
    t2 = np.linspace(0, 0.75, n2)
    f = np.linspace(95, 45, n2)
    boom = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t2 / 0.24)
    click = np.random.default_rng(2).normal(0, 1, n2) * np.exp(-t2 / 0.015) * 0.5
    boom = _norm(boom * 0.9 + click, 0.5)
    n3 = int(sr * 0.05)
    t3 = np.linspace(0, 0.05, n3)
    tick = _norm(np.sin(2 * np.pi * 2000 * t3) * np.exp(-t3 / 0.006), 0.22)
    return {"whoosh": whoosh, "boom": boom, "tick": tick}


def build_sfx(events, total, wav_path, sr=44100):
    bank = _sfx_bank(sr)
    buf = np.zeros(int(total * sr) + sr, dtype=np.float32)
    for typ, at in events:
        clip = bank.get(typ)
        if clip is None or at < 0:
            continue
        s = int(at * sr)
        e = min(len(buf), s + len(clip))
        if s < len(buf):
            buf[s:e] += clip[:e - s]
    with wave.open(wav_path, "wb") as wv:
        wv.setnchannels(1)
        wv.setsampwidth(2)
        wv.setframerate(sr)
        wv.writeframes((np.clip(buf, -1, 1) * 32767).astype(np.int16).tobytes())
    return wav_path


def mix_sfx(video, sfx_wav, cfg, tmp):
    """Primiesa SFX stopu do videa (hlas/hudba uz su v nom)."""
    ff = cfg["ffmpeg"]
    out = os.path.join(tmp, "with_motion_sfx.mp4")   # NIE with_sfx.mp4 (to uz pouziva add_sfx)
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", video, "-i", sfx_wav,
                    "-filter_complex",
                    "[1:a]volume=0.9[s];[0:a][s]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", out],
                   check=True)
    return out
