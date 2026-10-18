// Nálepky (stickery) na priehľadnom pozadí: klient ich vloží nad svoj záber v CapCute.
// Renderujú sa cez scripts/render-alpha.mjs do MOV (ProRes 4444 s alfou), WebM a GIF.
import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
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

/** Pôvodné logo (presne ako na webe): odkryje sa zľava, donut z loga sa dokotúľa na svoje miesto. */
export const LogoDraw: React.FC<P> = ({ brand }) => {
  const f = useF(); const fps = 30;
  const L = brand.logoAnim!; // rozmery loga a poloha okrúhleho prvku (napr. donut) v pixeloch pôvodného súboru
  const W = 860, s = W / L.w, H = L.h * s;
  const card = spring({ frame: f, fps, config: { damping: 15, stiffness: 120 } });
  const wipe = interpolate(f, [8, 34], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const settle = interpolate(f, [8, 40], [1.06, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const d = L.round;
  const roll = spring({ frame: f - 22, fps, config: { damping: 13, stiffness: 70, mass: 0.9 } });
  const landed = f >= 22 && roll > 0.98;
  const squash = d ? 1 - 0.14 * Math.max(0, Math.sin(interpolate(roll, [0.85, 1], [0, Math.PI], clamp))) : 1;
  const url = asset(brand, brand.logo!);
  const cardBg = "#fffaf0";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: W + 120, height: H + 120, borderRadius: 48, background: cardBg, overflow: "hidden",
        boxShadow: "0 30px 60px rgba(0,0,0,.28)", transform: `scale(${card})` }}>
        <div style={{ position: "absolute", left: 60, top: 60, width: W, height: H, transform: `scale(${settle})`,
          WebkitMaskImage: `linear-gradient(90deg, #000 ${wipe * 120 - 20}%, transparent ${wipe * 120}%)`,
          maskImage: `linear-gradient(90deg, #000 ${wipe * 120 - 20}%, transparent ${wipe * 120}%)` }}>
          <Img src={url} style={{ width: W, height: H, display: "block" }} />
          {d && !landed && <div style={{ position: "absolute", left: (d.cx - d.r - 3) * s, top: (d.cy - d.r - 3) * s,
            width: (d.r * 2 + 6) * s, height: (d.r * 2 + 6) * s, borderRadius: "50%", background: cardBg }} />}
        </div>
        {d && f >= 22 && !landed && <div style={{ position: "absolute", left: 60 + (d.cx - d.r) * s + (1 - roll) * (W + 200), top: 60 + (d.cy - d.r) * s,
          width: d.r * 2 * s, height: d.r * 2 * s, borderRadius: "50%", backgroundImage: `url(${url})`,
          backgroundSize: `${W}px ${H}px`, backgroundPosition: `${-(d.cx - d.r) * s}px ${-(d.cy - d.r) * s}px`,
          transform: `rotate(${(1 - roll) * -720}deg) scale(${1 / squash}, ${squash})` }} />}
        {d && <Sparkles at={36} x={60 + d.cx * s} y={60 + d.cy * s} color={brand.colors.surface2 || brand.colors.surface} />}
      </div>
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
