// Nálepky (stickery) na priehľadnom pozadí: klient ich vloží nad svoj záber v CapCute.
// Renderujú sa cez scripts/render-alpha.mjs do MOV (ProRes 4444 s alfou), WebM a GIF.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { asset, bodyFont, Brand, headingFont } from "./brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type P = { brand: Brand };
/** čas v snímkach pri 30 fps aj keď sa renderuje v 60 fps (plynulejší pohyb, rovnaké načasovanie) */
const useF = () => { const fr = useCurrentFrame(); const { fps } = useVideoConfig(); return (fr * 30) / fps; };

/** biely obrys ako pri vystrihnutej nálepke + mäkký tieň */
const stickerEdge = (w = 7) =>
  [[w, 0], [-w, 0], [0, w], [0, -w], [w * 0.7, w * 0.7], [-w * 0.7, w * 0.7], [w * 0.7, -w * 0.7], [-w * 0.7, -w * 0.7]]
    .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 #fff)`).join(" ") + " drop-shadow(0 22px 26px rgba(0,0,0,.35))";

const Sparkles: React.FC<{ at: number; x: number; y: number; color: string; n?: number }> = ({ at, x, y, color, n = 8 }) => {
  const f = useF() - at;
  if (f < 0 || f > 24) return null;
  return <>{Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, d = interpolate(f, [0, 18], [20, 150], clamp), o = interpolate(f, [8, 24], [1, 0], clamp);
    return <div key={i} style={{ position: "absolute", left: x + Math.cos(a) * d - 9, top: y + Math.sin(a) * d - 9, width: 18, height: 18,
      borderRadius: i % 2 ? 4 : 9, background: color, opacity: o, transform: `rotate(${a + f / 4}rad) scale(${1 - f / 30})` }} />;
  })}</>;
};

/** Pôvodné logo (presne ako na webe). Okrúhly prvok loga (donut) sa pomaly dokotúľa sprava na svoje miesto
 *  a za ním sa odkrýva nápis, ako keby ho rozvaľkal. Otáčanie zodpovedá prejdenej dráhe (kotúľa sa, nekĺže). */
export const LogoDraw: React.FC<P> = ({ brand }) => {
  const f = useF(); const fps = 30;
  const L = brand.logoAnim!;
  const W = 860, s = W / L.w, H = L.h * s, pad = 60;
  const card = spring({ frame: f, fps, config: { damping: 15, stiffness: 120 } });
  const d = L.round;
  const url = asset(brand, brand.logo!);
  const cardBg = "#fffaf0";
  if (!d) return <AbsoluteFill />;
  const r = d.r * s, home = pad + d.cx * s, start = pad + W + pad + r + 10;
  const p = interpolate(f, [6, 62], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const x = start + (home - start) * p;                    // stred donutu
  const angle = ((x - start) / r) * (180 / Math.PI);      // valí sa doľava = proti smeru hodín
  const landed = f >= 62;
  const bump = Math.sin(interpolate(f, [60, 70], [0, Math.PI], clamp)) * 0.12;
  const lead = interpolate(f, [52, 64], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) }); // na konci sa odkryje aj začiatok nápisu
  const reveal = ((x - pad) / W) * 100 * (1 - lead) - 6 * lead;  // nápis je vidieť napravo od donutu
  const { fps: vfps } = useVideoConfig();
  const shine = interpolate(f, [72, 92], [-20, 130], clamp);
  const cy = pad + d.cy * s;
  // omrvinky, ktoré odpadávajú pri kotúľaní (len ak to značka chce, napr. pečivo)
  const crumbs = L.crumbs ? Array.from({ length: 14 }, (_, i) => {
    const born = 10 + i * 3.4, age = f - born;
    if (age < 0 || age > 22) return null;
    const bx = start + (home - start) * (1 - Math.pow(1 - interpolate(born, [6, 62], [0, 1], clamp), 3)) + r * 0.6;
    const vx = 1.5 + random(`cx${i}`) * 3, vy = -3 - random(`cy${i}`) * 4, sz = 6 + random(`cs${i}`) * 8;
    return <div key={i} style={{ position: "absolute", left: bx + vx * age, top: cy + r * 0.7 + vy * age + 0.45 * age * age, width: sz, height: sz * 0.8,
      borderRadius: 3, background: L.crumbs, opacity: interpolate(age, [14, 22], [1, 0], clamp), transform: `rotate(${age * 20}deg)` }} />;
  }) : null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: W + 2 * pad, height: H + 2 * pad, borderRadius: 48, background: cardBg, overflow: "hidden",
        boxShadow: "0 30px 60px rgba(0,0,0,.28)", transform: `scale(${card})` }}>
        <div style={{ position: "absolute", left: pad, top: pad, width: W, height: H,
          WebkitMaskImage: landed ? "none" : `linear-gradient(90deg, transparent ${reveal - 2}%, #000 ${reveal + 3}%)`,
          maskImage: landed ? "none" : `linear-gradient(90deg, transparent ${reveal - 2}%, #000 ${reveal + 3}%)` }}>
          <Img src={url} style={{ width: W, height: H, display: "block" }} />
          {!landed && <div style={{ position: "absolute", left: (d.cx - d.r - 3) * s, top: (d.cy - d.r - 3) * s,
            width: (d.r * 2 + 6) * s, height: (d.r * 2 + 6) * s, borderRadius: "50%", background: cardBg }} />}
        </div>
        <div style={{ position: "absolute", left: x - r * 0.85, top: cy + r * 0.82, width: r * 1.7, height: r * 0.32, borderRadius: "50%",
          background: "rgba(60,30,10,.28)", filter: "blur(5px)", opacity: landed ? interpolate(f, [62, 72], [1, 0], clamp) : 1 }} />
        {crumbs}
        {!landed && <div style={{ position: "absolute", left: x - r, top: pad + d.cy * s - r, width: 2 * r, height: 2 * r, borderRadius: "50%",
          backgroundImage: `url(${url})`, backgroundSize: `${W}px ${H}px`, backgroundPosition: `${-(d.cx - d.r) * s}px ${-(d.cy - d.r) * s}px`,
          transform: `rotate(${angle}deg)` }} />}
        {landed && bump > 0 && <div style={{ position: "absolute", left: x - r, top: pad + d.cy * s - r, width: 2 * r, height: 2 * r, borderRadius: "50%",
          backgroundImage: `url(${url})`, backgroundSize: `${W}px ${H}px`, backgroundPosition: `${-(d.cx - d.r) * s}px ${-(d.cy - d.r) * s}px`,
          background: undefined, transform: `scale(${1 + bump}, ${1 - bump})`, transformOrigin: "50% 100%" }} />}
        <Sparkles at={62} x={home} y={pad + d.cy * s} color={brand.colors.surface2 || brand.colors.surface} />
        {/* lesk, ktorý po dopade prebehne po nápise (len po tvare loga) */}
        <div style={{ position: "absolute", left: pad, top: pad, width: W, height: H, pointerEvents: "none",
          WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`, WebkitMaskSize: `${W}px ${H}px`, maskSize: `${W}px ${H}px`,
          background: `linear-gradient(105deg, transparent ${shine - 12}%, rgba(255,255,255,.75) ${shine}%, transparent ${shine + 12}%)` }} />
      </div>
      <Sequence from={Math.round((6 * vfps) / 30)}><Audio src={staticFile("audio/roll.wav")} volume={0.9} />{/* drevené koliesko: ťukanie spomaľuje s donutom, na konci „tuk“ */}</Sequence>
    </AbsoluteFill>
  );
};

/** Vystrihnutý produkt ako nálepka: vyskočí, zakýve sa a jemne pláva. */
export const ProductSticker: React.FC<P> = ({ brand }) => {
  const f = useF(); const fps = 30;
  const pop = spring({ frame: f, fps, config: { damping: 8, stiffness: 120 } });
  const rot = interpolate(pop, [0, 1], [-35, -8]) + Math.sin(f / 14) * 3;
  return (
    <AbsoluteFill>
      <Img src={asset(brand, brand.sticker || brand.hero!)} style={{ position: "absolute", width: 640, left: 360, top: 330,
        transform: `translateY(${Math.sin(f / 18) * 14}px) rotate(${rot}deg) scale(${pop})`,
        filter: brand.sticker ? "drop-shadow(0 22px 26px rgba(0,0,0,.35))" : stickerEdge() }} />
      <Sparkles at={8} x={680} y={560} color={brand.colors.surface2 || brand.colors.surface} n={10} />
    </AbsoluteFill>
  );
};

/** Visačka s cenou na šnúrke, cena sa napočíta, visačka sa dohojdá. */
export const PriceTag: React.FC<P> = ({ brand }) => {
  const f = useF(); const fps = 30;
  const p = brand.products?.[0];
  const m = (p?.price || "€0").match(/^(\D*)([\d.,]+)(\D*)$/) || ["", "", "0", ""];
  const num = parseFloat(m[2].replace(",", "."));
  const shown = (num * interpolate(f, [10, 34], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) })).toFixed(m[2].includes(".") || m[2].includes(",") ? 2 : 0);
  const drop = spring({ frame: f, fps, config: { damping: 12, stiffness: 110 } });
  const swing = 22 * Math.exp(-f / 22) * Math.cos(f / 4.2);
  const c = brand.colors;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 640, top: interpolate(drop, [0, 1], [-700, 700]), transformOrigin: "50% -120px",
        transform: `rotate(${swing}deg)` }}>
        <div style={{ position: "absolute", left: 158, top: -260, width: 4, height: 262, background: c.heading, opacity: 0.85 }} />
        <svg width={320} height={200} style={{ position: "absolute", top: 0, left: 0, overflow: "visible", filter: "drop-shadow(0 18px 22px rgba(0,0,0,.3))" }}>
          <path d="M 40 0 H 300 Q 320 0 320 20 V 180 Q 320 200 300 200 H 40 L 0 100 Z" fill={c.surface} stroke="#fff" strokeWidth={8} />
          <circle cx={42} cy={100} r={13} fill="#fff" />
        </svg>
        <div style={{ position: "absolute", left: 60, top: 0, width: 250, height: 200, display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center", color: c.onSurface }}>
          <div style={{ fontFamily: bodyFont(brand), fontSize: 26, fontWeight: 600, opacity: 0.8 }}>{p?.name}</div>
          <div style={{ fontFamily: headingFont(brand), fontSize: 74, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {m[1]}{m[2].includes(",") ? shown.replace(".", ",") : shown}{m[3]}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Hviezdicový odznak „NEW“, ktorý vyskočí a pomaly sa točí. */
export const NewBadge: React.FC<P & { text?: string }> = ({ brand, text = "NEW" }) => {
  const f = useF(); const fps = 30;
  const pop = spring({ frame: f, fps, config: { damping: 7, stiffness: 140 } });
  const pts = Array.from({ length: 32 }, (_, i) => { const r = i % 2 ? 150 : 190, a = (i / 32) * Math.PI * 2; return `${200 + r * Math.cos(a)},${200 + r * Math.sin(a)}`; }).join(" ");
  const c = brand.colors;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 260, width: 400, height: 400, transform: `scale(${pop * (1 + 0.03 * Math.sin(f / 5))}) rotate(${-14 + (1 - pop) * -90}deg)` }}>
        <svg width={400} height={400} style={{ position: "absolute", transform: `rotate(${f * 0.6}deg)`, filter: "drop-shadow(0 16px 22px rgba(0,0,0,.3))" }}>
          <polygon points={pts} fill={c.accent} stroke="#fff" strokeWidth={10} strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: headingFont(brand), fontWeight: 800, fontSize: 104, color: c.onAccent, letterSpacing: 2 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Ručne kreslená šípka a štítok „link in bio“. */
export const ArrowBio: React.FC<P & { text?: string }> = ({ brand, text = "link in bio" }) => {
  const f = useF(); const fps = 30;
  const draw = interpolate(f, [0, 22], [1, 0], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
  const head = interpolate(f, [20, 26], [1, 0], clamp);
  const pill = spring({ frame: f - 22, fps, config: { damping: 9, stiffness: 130 } });
  const c = brand.colors;
  const body = "M 300 120 C 520 160 600 360 470 520 C 400 600 330 640 300 760";
  const tip = "M 230 700 L 300 770 L 370 715";
  const stroke = (w: number, col: string, d: string, off: number) => (
    <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={off} />);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", top: 820, left: 120, overflow: "visible" }}>
        {stroke(34, "#fff", body, draw)}{stroke(34, "#fff", tip, head)}
        {stroke(18, c.heading, body, draw)}{stroke(18, c.heading, tip, head)}
      </svg>
      <div style={{ position: "absolute", left: 200, top: 640, transform: `scale(${pill}) rotate(-5deg)`, background: c.surface,
        color: c.onSurface, fontFamily: bodyFont(brand), fontWeight: 800, fontSize: 64, padding: "18px 40px", borderRadius: 999,
        border: "7px solid #fff", boxShadow: "0 16px 24px rgba(0,0,0,.28)" }}>{text}</div>
    </AbsoluteFill>
  );
};

/** Ručne nakreslený krúžok na zvýraznenie čohokoľvek vo videu. */
export const Scribble: React.FC<P> = ({ brand }) => {
  const f = useF();
  const draw = interpolate(f, [0, 20], [1, 0], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
  const d = "M 760 760 C 980 800 1000 1080 720 1150 C 420 1220 140 1120 150 960 C 160 800 430 720 640 740 C 800 755 900 820 905 860";
  const col = brand.colors.surface2 || brand.colors.surface;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={d} fill="none" stroke="#fff" strokeWidth={40} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
        <path d={d} fill="none" stroke={col} strokeWidth={24} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
      </svg>
    </AbsoluteFill>
  );
};

/** Ukážka nálepiek nad „záberom“ (statická fotka produktu s jemným pohybom kamery). Len na prezentáciu. */
export const StickerDemo: React.FC<P> = ({ brand }) => {
  const f = useF(); const { fps } = useVideoConfig();
  const at = (from: number, len: number, el: React.ReactNode) =>
    <Sequence from={Math.round((from * fps) / 30)} durationInFrames={Math.round((len * fps) / 30)}>{el}</Sequence>;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #f3e3cc 0%, #c9b296 60%, #8f7a63 100%)" }}>
      <Img src={asset(brand, brand.hero!)} style={{ position: "absolute", width: 980, left: 50, top: 760,
        transform: `translate(${Math.sin(f / 50) * 10}px, ${Math.sin(f / 37) * 8}px) scale(${1 + f / 3000})` }} />
      {at(0, 90, <LogoDraw brand={brand} />)}
      {at(90, 95, <AbsoluteFill style={{ transform: "translate(120px,-170px) scale(.72)" }}><ProductSticker brand={brand} /></AbsoluteFill>)}
      {at(100, 85, <NewBadge brand={brand} />)}
      {at(186, 84, <PriceTag brand={brand} />)}
      {at(270, 60, <Scribble brand={brand} />)}
      {at(330, 90, <ArrowBio brand={brand} />)}
    </AbsoluteFill>
  );
};
