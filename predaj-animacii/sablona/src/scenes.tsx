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
const shorten = (t: string, max: number) => {
  if (t.length <= max) return t;
  const sent = t.match(/^.{20,}?[.!?](?=\s|$)/)?.[0];
  if (sent && sent.length <= max) return sent;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
};

const exitOut = (frame: number, dur: number, len = 8) =>
  interpolate(frame, [dur - len, dur], [1, 0], clamp);

/** Logo v karte (logo má často pozadie hlavičky, karta ho schová). */
const LogoCard: React.FC<{ brand: Brand; height: number; style?: React.CSSProperties }> = ({ brand, height, style }) =>
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
export const Phone: React.FC<{ brand: Brand; mode: BgMode; dur: number }> = ({ brand, mode, dur }) => {
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
      <DomainPill brand={brand} frame={frame} top={70} />
    </Bg>
  );
};

/** 4) Počítač: laptop, vnútri scrolluje desktopový web. */
export const Desktop: React.FC<{ brand: Brand; mode: BgMode; dur: number }> = ({ brand, mode, dur }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 90 } });
  const out = exitOut(frame, dur);
  const W = 1000, H = 625;
  const d = brand.shots.desktop;
  return (
    <Bg brand={brand} mode={mode}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 2600, opacity: out }}>
        <div style={{ transform: `scale(${0.6 + enter * 0.4}) rotateY(${14 - frame * 0.04}deg) rotateX(10deg)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ padding: 22, background: "#151515", borderRadius: "34px 34px 10px 10px", boxShadow: "inset 0 0 0 3px #333" }}>
            <div style={{ borderRadius: 8, overflow: "hidden" }}>
              <Scroller src={asset(brand, d.file)} imgW={d.width} imgH={d.height} w={W} h={H} dur={dur} start={20} />
            </div>
          </div>
          <div style={{ width: W + 180, height: 44, background: "linear-gradient(#d9d9de,#9a9aa2)", borderRadius: "0 0 40px 40px",
            boxShadow: "0 50px 90px rgba(0,0,0,.35)" }} />
        </div>
      </AbsoluteFill>
      <DomainPill brand={brand} frame={frame} top={420} />
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
