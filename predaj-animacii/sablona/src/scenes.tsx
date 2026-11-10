import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Brand, BgMode, asset, headingFont, bodyFont, popWords } from "./brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Pozadie: farby značky, zelená (chroma key) alebo čierna (blend Screen). */
export const Bg: React.FC<{ brand: Brand; mode: BgMode; children?: React.ReactNode }> = ({ brand, mode, children }) => {
  const frame = useCurrentFrame();
  if (mode !== "brand") return <AbsoluteFill style={{ background: mode === "green" ? "#00ff00" : "#000" }}>{children}</AbsoluteFill>;
  const c = brand.colors;
  const drift = Math.sin(frame / 40) * 40;
  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1300, height: 1300, borderRadius: "50%", background: c.surface, opacity: 0.55,
        left: -520 + drift, top: -380, filter: "blur(10px)" }} />
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: c.surface2 || c.surface, opacity: 0.35,
        right: -420 - drift, bottom: -300 }} />
      {children}
    </AbsoluteFill>
  );
};

/** Skráti text na celé vety, inak na celé slová. */
export const shorten = (t: string, max: number) => {
  if (t.length <= max) return t;
  const sent = t.match(/^.{20,}?[.!?](?=\s|$)/)?.[0];
  if (sent && sent.length <= max) return sent;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
};

const exitOut = (frame: number, dur: number, len = 8) =>
  interpolate(frame, [dur - len, dur], [1, 0], clamp);

/** Logo v karte (logo má často pozadie hlavičky, karta ho schová). */
export const LogoCard: React.FC<{ brand: Brand; height: number; style?: React.CSSProperties }> = ({ brand, height, style }) =>
  brand.logo ? (
    <div style={{ background: brand.colors.bg, borderRadius: height * 0.35, padding: `${height * 0.28}px ${height * 0.45}px`,
      boxShadow: "0 18px 50px rgba(0,0,0,.18)", display: "inline-flex", ...style }}>
      <Img src={asset(brand, brand.logo)} style={{ height, display: "block" }} />
    </div>
  ) : (
    <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: height * 1.1, color: brand.colors.heading, ...style }}>{brand.name}</div>
  );

/** 1) Titulok: farebný pás udrie, meno značky, logo dopadne zhora, podtitulok. */
export const Title: React.FC<{ brand: Brand; mode: BgMode; dur: number }> = ({ brand, mode, dur }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const band = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const text = spring({ frame: frame - 6, fps, config: { damping: 9, stiffness: 160 } });
  const logo = spring({ frame: frame - 16, fps, config: { damping: 8, stiffness: 120 } });
  const sub = interpolate(frame, [26, 40], [0, 1], clamp);
  const out = exitOut(frame, dur);
  // dlhé meno skráť po slovách („Plausible Analytics“ → „Plausible“)
  let name = brand.name;
  if (name.length > 14) { const w = name.split(/\s+/); name = w[0]; for (const x of w.slice(1)) { if ((name + " " + x).length > 14) break; name += " " + x; } }
  const size = Math.min(230, 1500 / Math.max(4, name.length));
  return (
    <Bg brand={brand} mode={mode}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out, transform: `scale(${1 + (1 - out) * 0.15})` }}>
        <div style={{ position: "absolute", top: 760, left: -100, width: 1280, height: 400, background: c.surface,
          transform: `translateX(${(1 - band) * -1400}px) rotate(-4deg)`, boxShadow: "0 30px 80px rgba(0,0,0,.18)" }} />
        <div style={{ position: "absolute", top: 820, width: "100%", textAlign: "center", fontFamily: headingFont(brand),
          fontWeight: 800, fontSize: size, lineHeight: 1, color: c.onSurface, letterSpacing: -2,
          transform: `scale(${0.4 + text * 0.6}) rotate(-4deg)`, opacity: Math.min(1, text * 1.5) }}>{name}</div>
        {brand.logo && <div style={{ position: "absolute", top: interpolate(logo, [0, 1], [-300, 540]), width: "100%", display: "flex", justifyContent: "center",
          transform: `rotate(${(1 - logo) * -20}deg)` }}>
          <LogoCard brand={brand} height={90} />
        </div>}
        <div style={{ position: "absolute", top: 1230, width: 900, left: 90, textAlign: "center", fontFamily: bodyFont(brand),
          fontSize: 46, fontWeight: 600, lineHeight: 1.25, color: mode === "brand" ? c.text : "#fff", opacity: sub,
          transform: `translateY(${(1 - sub) * 30}px)` }}>{shorten(brand.tagline, 90)}</div>
      </AbsoluteFill>
    </Bg>
  );
};

/** 2) Slová na beat: každé slovo vyskočí v štítku (24 snímok). */
export const POP_LEN = 24;
export const Pops: React.FC<{ brand: Brand; mode: BgMode }> = ({ brand, mode }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const words = popWords(brand);
  const i = Math.min(words.length - 1, Math.floor(frame / POP_LEN));
  const f = frame - i * POP_LEN;
  const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 220 } });
  const out = interpolate(f, [POP_LEN - 4, POP_LEN], [1, 0], clamp);
  const alt = i % 2 === 0;
  return (
    <Bg brand={brand} mode={mode}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ background: alt ? c.surface : c.accent, color: alt ? c.onSurface : c.onAccent, fontFamily: headingFont(brand),
          fontWeight: 800, fontSize: 120, padding: "30px 60px", borderRadius: 36, maxWidth: 960, textAlign: "center", lineHeight: 1.05,
          transform: `scale(${s * out}) rotate(${(alt ? -3 : 3) * s}deg)`, boxShadow: "0 25px 70px rgba(0,0,0,.22)" }}>{words[i]}</div>
      </AbsoluteFill>
    </Bg>
  );
};
export const popsDuration = (b: Brand) => popWords(b).length * POP_LEN;

/** Skrolovanie screenshotu v obrazovke zariadenia. */
const Scroller: React.FC<{ src: string; imgW: number; imgH: number; w: number; h: number; dur: number; start: number }> = ({ src, imgW, imgH, w, h, dur, start }) => {
  const frame = useCurrentFrame();
  const scaledH = (imgH / imgW) * w;
  const maxY = Math.max(0, Math.min(scaledH - h, h * 2.6)); // nie celá stránka, max ~3,5 obrazovky
  const y = interpolate(frame, [start, dur - 12], [0, maxY], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ width: w, height: h, overflow: "hidden", position: "relative", background: "#fff" }}>
      <Img src={src} style={{ width: w, position: "absolute", top: -y, left: 0 }} />
    </div>
  );
};

const DomainPill: React.FC<{ brand: Brand; frame: number; top: number }> = ({ brand, frame, top }) => {
  const a = interpolate(frame, [10, 22], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: a, transform: `translateY(${(1 - a) * -30}px)` }}>
      <div style={{ background: brand.colors.accent, color: brand.colors.onAccent, fontFamily: bodyFont(brand), fontWeight: 700, fontSize: 48,
        padding: "16px 40px", borderRadius: 999, boxShadow: "0 15px 40px rgba(0,0,0,.2)" }}>{brand.domain}</div>
    </div>
  );
};

/** 3) Telefón: naklonený iPhone, vnútri scrolluje mobilný web. */
/** Produkt v bubline s cenou, ktorý sa vznáša vedľa zariadenia. */
const FloatProduct: React.FC<{ brand: Brand; i: number; x: number; y: number; delay: number }> = ({ brand, i, x, y, delay }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const p = brand.products![i]; const s = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 140 } });
  const fl = Math.sin((frame + i * 20) / 12) * 14;
  return (
    <div style={{ position: "absolute", left: x, top: y + fl, transform: `scale(${s}) rotate(${(i ? 6 : -6) + Math.sin(frame / 18) * 3}deg)`, zIndex: 5 }}>
      <div style={{ width: 270, height: 270, borderRadius: "50%", background: c.bg, boxShadow: "0 25px 60px rgba(0,0,0,.25)",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `8px solid ${c.surface}` }}>
        <Img src={asset(brand, p.image)} style={{ width: 250, objectFit: "contain" }} />
      </div>
      <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", background: c.accent, color: c.onAccent,
        fontFamily: bodyFont(brand), fontWeight: 800, fontSize: 40, padding: "8px 24px", borderRadius: 999, whiteSpace: "nowrap" }}>{p.price}</div>
    </div>
  );
};

export const Phone: React.FC<{ brand: Brand; mode: BgMode; dur: number; extras?: boolean }> = ({ brand, mode, dur, extras }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 90 } });
  const out = exitOut(frame, dur);
  const W = 700, H = 1440, bez = 26;
  const m = brand.shots.mobile;
  return (
    <Bg brand={brand} mode={mode}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 2400, opacity: out }}>
        <div style={{ transform: `translateY(${(1 - enter) * 1500 + 90}px) rotateY(${-16 + frame * 0.05}deg) rotateX(7deg) rotateZ(${-3 + enter * 1}deg)`,
          padding: bez, background: "#111", borderRadius: 110, boxShadow: "40px 60px 120px rgba(0,0,0,.35), inset 0 0 0 4px #333" }}>
          <div style={{ borderRadius: 86, overflow: "hidden", position: "relative" }}>
            <Scroller src={asset(brand, m.file)} imgW={m.width} imgH={m.height} w={W} h={H} dur={dur} start={20} />
            <div style={{ position: "absolute", top: 18, left: W / 2 - 110, width: 220, height: 62, borderRadius: 40, background: "#000" }} />
          </div>
        </div>
      </AbsoluteFill>
      {extras && (brand.products || []).slice(0, 2).map((_, i) =>
        <FloatProduct key={i} brand={brand} i={i} x={i ? 770 : 20} y={i ? 1180 : 420} delay={28 + i * 14} />)}
      <DomainPill brand={brand} frame={frame} top={70} />
    </Bg>
  );
};

/** 4) Počítač: notebook (veko s kamerou, pánt, klávesnica, touchpad), web scrolluje, kurzor sa hýbe. */
export const Desktop: React.FC<{ brand: Brand; mode: BgMode; dur: number }> = ({ brand, mode, dur }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 90 } });
  const out = exitOut(frame, dur);
  const W = 940, H = 588; // obrazovka 16:10
  const d = brand.shots.desktop;
  const cx = interpolate(frame, [10, 45, 80, dur], [620, 380, 560, 470], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const cy = interpolate(frame, [10, 45, 80, dur], [430, 260, 330, 300], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const keys = Array.from({ length: 5 }, (_, r) => Array.from({ length: r === 4 ? 9 : 13 }, (_, k) => k));
  return (
    <Bg brand={brand} mode={mode}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 2600, opacity: out }}>
        <div style={{ position: "absolute", top: 1480, width: 1050, height: 110, borderRadius: "50%", background: "rgba(0,0,0,.25)", filter: "blur(34px)", opacity: enter }} />
        <div style={{ transformStyle: "preserve-3d", transform: `translateY(${(1 - enter) * 900 + 230}px) scale(${0.82 + enter * 0.13}) rotateX(${30 - enter * 8}deg) rotateY(${-16 + frame * 0.07}deg)`,
          display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* veko */}
          <div style={{ padding: "30px 22px 34px", background: "#0d0d0f", borderRadius: "36px 36px 14px 14px",
            boxShadow: "0 0 0 4px #b9b9be, 0 0 0 6px #8e8e93, inset 0 0 0 2px #222", position: "relative" }}>
            <div style={{ position: "absolute", top: 11, left: "50%", width: 10, height: 10, marginLeft: -5, borderRadius: 5, background: "#2b2b30", boxShadow: "inset 0 0 0 2px #1a1a1d" }} />
            <div style={{ borderRadius: 6, overflow: "hidden", position: "relative" }}>
              <Scroller src={asset(brand, d.file)} imgW={d.width} imgH={d.height} w={W} h={H} dur={dur} start={20} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.14) 0%, transparent 35%)" }} />
              <svg width={34} height={44} viewBox="0 0 24 30" style={{ position: "absolute", left: cx, top: cy, filter: "drop-shadow(0 3px 4px rgba(0,0,0,.4))" }}>
                <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {/* pánt */}
          <div style={{ width: W + 30, height: 14, background: "linear-gradient(#2a2a2e, #6d6d72)", borderRadius: "0 0 8px 8px" }} />
          {/* spodná časť s klávesnicou, sklopená k divákovi */}
          <div style={{ width: W + 150, height: 520, marginTop: -2, transformOrigin: "top center", transform: "rotateX(64deg)",
            background: "linear-gradient(#dcdce0, #c4c4c9)", borderRadius: "10px 10px 46px 46px", boxShadow: "inset 0 -10px 0 #a7a7ad",
            display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 34, gap: 8 }}>
            {keys.map((row, r) => (
              <div key={r} style={{ display: "flex", gap: 8 }}>
                {row.map((k) => <div key={k} style={{ width: r === 4 && k === 4 ? 300 : 58, height: 52, background: "#1f1f22", borderRadius: 9 }} />)}
              </div>
            ))}
            <div style={{ marginTop: 22, width: 420, height: 150, borderRadius: 18, background: "linear-gradient(#cfcfd4, #bdbdc3)", boxShadow: "inset 0 0 0 2px #b0b0b6" }} />
          </div>
        </div>
      </AbsoluteFill>
      <DomainPill brand={brand} frame={frame} top={250} />
    </Bg>
  );
};

/** 5) Záver: logo, doména, čiara. */
export const End: React.FC<{ brand: Brand; mode: BgMode; dur: number }> = ({ brand, mode, dur }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const logo = spring({ frame, fps, config: { damping: 11, stiffness: 140 } });
  const line = interpolate(frame, [12, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const url = interpolate(frame, [18, 32], [0, 1], clamp);
  return (
    <Bg brand={brand} mode={mode}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 50 }}>
        <div style={{ transform: `scale(${logo})` }}><LogoCard brand={brand} height={120} /></div>
        <div style={{ width: 520 * line, height: 8, borderRadius: 4, background: c.accent }} />
        <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: 92, color: mode === "brand" ? c.heading : "#fff",
          opacity: url, transform: `translateY(${(1 - url) * 30}px)` }}>{brand.cta}</div>
      </AbsoluteFill>
    </Bg>
  );
};
