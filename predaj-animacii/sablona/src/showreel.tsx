import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Brand, Props, asset, headingFont, bodyFont } from "./brand";
import { Bg, LogoCard, Phone, Desktop, End, shorten } from "./scenes";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type L = "sk" | "en";

const LABELS: Record<string, [string, string]> = {
  logo: ["Animované logo", "Logo animation"],
  kinetic: ["Kinetická typografia", "Kinetic typography"],
  hero: ["Produkt v pohybe", "Product in motion"],
  products: ["Produkty a ceny", "Products & prices"],
  captions: ["Titulky na beat", "Animated captions"],
  lower: ["Meno v zábere", "Lower third"],
  phone: ["Tvoj web v mobile", "Your site on mobile"],
  desktop: ["Tvoj web na počítači", "Your site on desktop"],
  social: ["Výzva na sledovanie", "Social call-to-action"],
};
/** Pevné čísla služieb: rovnaké vo videu, v menu aj v cenníku (PONUKA.md). */
export const NUM: Record<string, number> = { logo: 1, kinetic: 2, hero: 3, products: 4, captions: 5, lower: 6, phone: 7, desktop: 8, social: 9 };
const T = (l: L, sk: string, en: string) => (l === "en" ? en : sk);

/** Štítok v rohu: čo práve ukazujeme. */
const Chip: React.FC<{ brand: Brand; n: number; text: string }> = ({ brand, n, text }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: f - 4, fps, config: { damping: 14, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", bottom: 110, left: 60, display: "flex", alignItems: "center", gap: 18,
      transform: `translateX(${(1 - s) * -700}px)`, zIndex: 50 }}>
      <div style={{ background: brand.colors.accent, color: brand.colors.onAccent, fontFamily: bodyFont(brand), fontWeight: 800,
        fontSize: 34, width: 74, height: 74, borderRadius: 37, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {String(n).padStart(2, "0")}</div>
      <div style={{ background: "rgba(255,255,255,.92)", color: "#111", fontFamily: bodyFont(brand), fontWeight: 700, fontSize: 40,
        padding: "14px 30px", borderRadius: 40, boxShadow: "0 10px 30px rgba(0,0,0,.15)" }}>{text}</div>
    </div>
  );
};

/** Prechod: dva šikmé pruhy vo farbách značky prejdú cez obraz. */
const Wipe: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame();
  const bar = (delay: number, color: string) => {
    const x = interpolate(f - delay, [0, 16], [-160, 160], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return <div style={{ position: "absolute", top: -400, bottom: -400, left: `${x - 60}%`, width: "120%", background: color, transform: "skewX(-14deg)" }} />;
  };
  return <AbsoluteFill style={{ zIndex: 100, overflow: "hidden" }}>{bar(0, brand.colors.surface)}{bar(3, brand.colors.accent)}</AbsoluteFill>;
};

/** 1) Logo: kruhové odhalenie, lesk, výbuch bodiek. */
const LogoReveal: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const s = spring({ frame: f - 6, fps, config: { damping: 10, stiffness: 120 } });
  const clip = interpolate(f, [6, 26], [0, 120], clamp);
  const shine = interpolate(f, [30, 55], [-120, 220], clamp);
  const ring = interpolate(f, [8, 40], [0, 1], clamp);
  const dots = Array.from({ length: 16 }, (_, i) => i);
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", width: 300 + ring * 900, height: 300 + ring * 900, borderRadius: "50%",
          border: `${10 * (1 - ring) + 2}px solid ${c.accent}`, opacity: 1 - ring }} />
        {dots.map((i) => {
          const a = (i / dots.length) * Math.PI * 2; const d = interpolate(f, [10, 40], [0, 430 + (i % 3) * 60], { ...clamp, easing: Easing.out(Easing.cubic) });
          return <div key={i} style={{ position: "absolute", width: 26 - (i % 3) * 6, height: 26 - (i % 3) * 6, borderRadius: "50%",
            background: i % 2 ? c.accent : c.surface2 || c.surface, transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`,
            opacity: interpolate(f, [30, 48], [1, 0], clamp) }} />;
        })}
        <div style={{ transform: `scale(${0.6 + s * 0.9})`, clipPath: `circle(${clip}% at 50% 50%)`, position: "relative", overflow: "hidden", borderRadius: 60 }}>
          <LogoCard brand={brand} height={130} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shine}%`, width: "35%", transform: "skewX(-20deg)",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent)" }} />
        </div>
      </AbsoluteFill>
    </Bg>
  );
};

/** 2) Kinetická typografia: slová headline-u padajú po jednom, kľúčové slovo zvýraznené. */
const Kinetic: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const words = (brand.headline || brand.tagline || brand.name).split(/\s+/).filter(Boolean).slice(0, 9);
  const key = words.reduce((best, w, i) => (w.replace(/\W/g, "").length > words[best].replace(/\W/g, "").length ? i : best), 0);
  const size = words.join(" ").length > 40 ? 112 : 136;
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 80px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 30px", fontFamily: headingFont(brand), fontWeight: 800, fontSize: size, lineHeight: 1.05 }}>
          {words.map((w, i) => {
            const s = spring({ frame: f - 5 - i * 5, fps, config: { damping: 11, stiffness: 170 } });
            const hl = interpolate(f, [12 + key * 5, 24 + key * 5], [0, 1], clamp);
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", color: c.heading, opacity: Math.min(1, s * 2),
                transform: `translateY(${(1 - s) * 120}px) rotate(${(1 - s) * 8}deg)` }}>
                {i === key && <span style={{ position: "absolute", left: -14, right: -14, top: "12%", bottom: "4%", background: c.surface2 || c.surface,
                  transform: `scaleX(${hl}) rotate(-2deg)`, transformOrigin: "left", zIndex: -1, borderRadius: 12 }} />}
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </Bg>
  );
};

/** 3) Produkt v pohybe: obrázok dopadne, vznáša sa, okolo sa točí nápis. */
const HeroMotion: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const drop = spring({ frame: f - 4, fps, config: { damping: 9, stiffness: 90 } });
  const circle = spring({ frame: f, fps, config: { damping: 16, stiffness: 120 } });
  const float = Math.sin(f / 9) * 18;
  const label = `${brand.domain} • ${brand.name} • `.toUpperCase();
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", width: 860, height: 860, borderRadius: "50%", background: c.surface, transform: `scale(${circle})` }} />
        <svg width={1000} height={1000} viewBox="0 0 1000 1000" style={{ position: "absolute", transform: `rotate(${f * 1.2}deg)`, opacity: circle }}>
          <defs><path id="circ" d="M500,500 m-470,0 a470,470 0 1,1 940,0 a470,470 0 1,1 -940,0" /></defs>
          <text style={{ fontFamily: bodyFont(brand), fontWeight: 800, fontSize: 40, letterSpacing: 8, fill: c.accent }}>
            <textPath href="#circ" textLength={2940} lengthAdjust="spacing">{label.repeat(Math.max(1, Math.round(88 / label.length)))}</textPath>
          </text>
        </svg>
        <div style={{ position: "absolute", top: 1330, width: 420 * (1 - float / 120), height: 50, borderRadius: "50%", background: "rgba(0,0,0,.18)", filter: "blur(14px)", opacity: drop }} />
        <Img src={asset(brand, brand.hero!)} style={{ width: 820, maxHeight: 820, objectFit: "contain",
          transform: `translateY(${(1 - drop) * -1300 + float}px) rotate(${(1 - drop) * -25 + Math.sin(f / 14) * 3}deg)`,
          filter: "drop-shadow(0 30px 40px rgba(0,0,0,.25))" }} />
      </AbsoluteFill>
    </Bg>
  );
};

/** číslo v cene „€22.90“ počíta od nuly */
const countPrice = (price: string, t: number) => {
  const m = price.match(/^(\D*)([\d.,]+)(.*)$/); if (!m) return price;
  const dec = /[.,]\d{2}$/.test(m[2]); const sep = dec ? m[2].slice(-3, -2) : "";
  const v = parseFloat(m[2].replace(",", ".")) * t;
  return m[1] + (dec ? v.toFixed(2).replace(".", sep) : Math.round(v).toString()) + m[3];
};

/** 4) Produkty: karty priletia, ceny sa napočítajú. */
const Products: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const items = (brand.products || []).slice(0, 3);
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 50, paddingTop: 80 }}>
        {items.map((p, i) => {
          const s = spring({ frame: f - 6 - i * 10, fps, config: { damping: 13, stiffness: 120 } });
          const t = interpolate(f, [16 + i * 10, 50 + i * 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          return (
            <div key={i} style={{ width: 900, height: items.length > 2 ? 400 : 480, background: c.bg, borderRadius: 48, display: "flex", alignItems: "center",
              boxShadow: "0 30px 70px rgba(0,0,0,.18)", overflow: "hidden",
              transform: `translateX(${(1 - s) * (i % 2 ? 1200 : -1200)}px) rotate(${(1 - s) * (i % 2 ? 10 : -10)}deg)` }}>
              <div style={{ width: 430, height: "100%", background: c.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Img src={asset(brand, p.image)} style={{ width: 400, maxHeight: "90%", objectFit: "contain", transform: `scale(${0.8 + s * 0.2}) rotate(${(1 - t) * -8}deg)` }} />
              </div>
              <div style={{ flex: 1, padding: "0 40px", display: "flex", flexDirection: "column", gap: 26 }}>
                <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: 58, lineHeight: 1.05, color: c.heading }}>{p.name}</div>
                <div style={{ alignSelf: "flex-start", background: c.accent, color: c.onAccent, fontFamily: bodyFont(brand), fontWeight: 800,
                  fontSize: 54, padding: "12px 30px", borderRadius: 999, transform: `scale(${1 + Math.max(0, Math.sin(t * Math.PI)) * 0.08})` }}>{countPrice(p.price, t)}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Bg>
  );
};

/** Ostrý „záber“: hlavný obrázok celý v strede, inak výrez desktopového webu v karte. */
const Shot: React.FC<{ brand: Brand; scale: number; top?: number }> = ({ brand, scale, top = 240 }) => {
  const d = brand.shots.desktop;
  return brand.hero
    ? <Img src={asset(brand, brand.hero)} style={{ position: "absolute", top, left: 50, width: 980, height: 980, objectFit: "contain",
        transform: `scale(${scale})`, filter: "drop-shadow(0 30px 40px rgba(0,0,0,.25))" }} />
    : <div style={{ position: "absolute", top: top + 120, left: 60, width: 960, height: 600, borderRadius: 28, overflow: "hidden",
        transform: `scale(${scale})`, boxShadow: "0 30px 70px rgba(0,0,0,.3)" }}>
        <Img src={asset(brand, d.file)} style={{ width: 960 }} />
      </div>;
};

/** 5) Titulky ako na TikToku: slová po skupinách, aktuálne zvýraznené, záber „punchne“ na každé slovo. */
const Captions: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame(); const c = brand.colors;
  const words = shorten(brand.tagline || brand.headline, 80).split(/\s+/).filter(Boolean);
  const { durationInFrames } = useVideoConfig();
  const per = Math.max(7, Math.min(14, Math.floor((durationInFrames - 15) / words.length))); const idx = Math.min(words.length - 1, Math.floor(f / per));
  const g0 = Math.floor(idx / 3) * 3; const group = words.slice(g0, g0 + 3);
  const local = f - idx * per;
  const pop = interpolate(local, [0, 3], [1.18, 1], clamp);
  const punch = 0.035 * Math.exp(-local / 4);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${c.bg} 0%, ${c.surface} 70%)`, overflow: "hidden" }}>
      <Shot brand={brand} scale={1 + f * 0.0012 + punch} />
      <AbsoluteFill style={{ background: "linear-gradient(transparent 62%, rgba(0,0,0,.35))" }} />
      <div style={{ position: "absolute", bottom: 330, width: "100%", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 18, padding: "0 60px" }}>
        {group.map((w, i) => {
          const on = g0 + i === idx;
          return <span key={g0 + i} style={{ fontFamily: bodyFont(brand), fontWeight: 900, fontSize: 92, textTransform: "uppercase",
            color: on ? c.onAccent : "#fff", background: on ? c.accent : "transparent", padding: "4px 18px", borderRadius: 16,
            textShadow: on ? "none" : "0 4px 0 #000, 0 -2px 0 #000, 3px 0 0 #000, -3px 0 0 #000",
            transform: `scale(${on ? pop : 1}) rotate(${on ? -2 : 0}deg)`, display: "inline-block" }}>{w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

/** 6) Lower third: ostrý záber, lišta sa vysunie, meno vyjde zdola, podtitul sa vypíše. */
const LowerThird: React.FC<{ brand: Brand; lang: L }> = ({ brand, lang }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const line = spring({ frame: f - 6, fps, config: { damping: 14, stiffness: 160 } });
  const panel = interpolate(f, [10, 24], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const name = spring({ frame: f - 18, fps, config: { damping: 14, stiffness: 150 } });
  const sub = `${brand.lowerSub || T(lang, "Zakladateľ", "Founder")} · ${brand.domain}`;
  const typed = Math.floor(interpolate(f, [26, 26 + sub.length * 1.2], [0, sub.length], clamp));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${c.bg} 0%, ${c.surface} 75%)`, overflow: "hidden" }}>
      <Shot brand={brand} scale={1.05 + f * 0.0015} top={160} />
      <div style={{ position: "absolute", left: 60, bottom: 400, display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 16, background: c.surface2 || c.surface, borderRadius: 8, transform: `scaleY(${line})`, transformOrigin: "bottom",
          boxShadow: "0 10px 30px rgba(0,0,0,.2)" }} />
        <div style={{ marginLeft: 18, background: c.accent, padding: "26px 44px", borderRadius: 20, clipPath: `inset(0 ${100 - panel}% 0 0 round 20px)`,
          boxShadow: "0 20px 50px rgba(0,0,0,.25)", overflow: "hidden" }}>
          <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: 72, color: c.onAccent, transform: `translateY(${(1 - name) * 90}px)` }}>{brand.name}</div>
          <div style={{ fontFamily: bodyFont(brand), fontWeight: 600, fontSize: 40, color: c.onAccent, opacity: 0.88, marginTop: 6, minHeight: 50 }}>
            {sub.slice(0, typed)}<span style={{ opacity: f % 16 < 8 && typed < sub.length ? 1 : 0 }}>|</span></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 9) Výzva: kurzor klikne na tlačidlo zo stránky, krúžky a konfety; text sa nemení. */
const Social: React.FC<{ brand: Brand; lang: L }> = ({ brand, lang }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const btn = spring({ frame: f - 2, fps, config: { damping: 10, stiffness: 150 } });
  const cx = interpolate(f, [10, 34], [900, 600], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [10, 34], [1500, 1000], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const CLICK = 36;
  const press = f >= CLICK && f < CLICK + 5 ? 0.9 : 1;
  const after = spring({ frame: f - CLICK - 4, fps, config: { damping: 8, stiffness: 200 } });
  const label = brand.instagram ? T(lang, `Sleduj @${brand.instagram}`, `Follow @${brand.instagram}`)
    : brand.ctaText || T(lang, `Navštív ${brand.domain}`, `Visit ${brand.domain}`);
  const colors = [c.accent, c.surface, c.surface2 || c.surface, "#ff3b5c", c.heading];
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {[0, 6, 12].map((d) => { const t = interpolate(f - CLICK - d, [0, 24], [0, 1], clamp);
          return <div key={d} style={{ position: "absolute", width: 200 + t * 900, height: 200 + t * 900, borderRadius: "50%",
            border: `6px solid ${c.accent}`, opacity: t > 0 ? (1 - t) * 0.6 : 0 }} />; })}
        <div style={{ transform: `scale(${btn * press * (1 + Math.sin(Math.min(after, 1) * Math.PI) * 0.08)})`, background: c.accent, color: c.onAccent,
          fontFamily: bodyFont(brand), fontWeight: 800, fontSize: 64, padding: "34px 64px", borderRadius: 999, boxShadow: "0 25px 60px rgba(0,0,0,.25)" }}>{label}</div>
        {Array.from({ length: 28 }, (_, i) => {
          const t = interpolate(f - CLICK, [0, 40], [0, 1], clamp);
          const a = (i / 28) * Math.PI * 2 + (i % 3); const v = 380 + (i % 5) * 90;
          const x = Math.cos(a) * v * t; const y = Math.sin(a) * v * t + 500 * t * t;
          return <div key={i} style={{ position: "absolute", width: i % 3 ? 22 : 30, height: i % 3 ? 34 : 18, borderRadius: i % 4 ? 4 : 15,
            background: colors[i % colors.length], transform: `translate(${x}px, ${y}px) rotate(${t * 720 * (i % 2 ? 1 : -1)}deg)`,
            opacity: t > 0 ? 1 - t * 0.8 : 0 }} />;
        })}
        <svg width={90} height={110} viewBox="0 0 24 30" style={{ position: "absolute", left: cx, top: cy, transform: `scale(${press})`,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,.35))" }}>
          <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </AbsoluteFill>
    </Bg>
  );
};

/** 10) Záver: logo, doména a pointa „toto všetko z vášho webu“. */
const Outro: React.FC<{ brand: Brand; lang: L }> = ({ brand, lang }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const logo = spring({ frame: f, fps, config: { damping: 11, stiffness: 140 } });
  const a = interpolate(f, [14, 28], [0, 1], clamp); const b = interpolate(f, [30, 44], [0, 1], clamp);
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 44 }}>
        <div style={{ transform: `scale(${logo})` }}><LogoCard brand={brand} height={120} /></div>
        <div style={{ width: 520 * a, height: 8, borderRadius: 4, background: c.accent }} />
        <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: 84, color: c.heading, opacity: a }}>{brand.domain}</div>
        <div style={{ marginTop: 60, fontFamily: bodyFont(brand), fontWeight: 700, fontSize: 46, color: c.text, opacity: b, textAlign: "center",
          transform: `translateY(${(1 - b) * 30}px)`, maxWidth: 900, lineHeight: 1.3 }}>
          {T(lang, `Všetko toto sme vyrobili len z ${brand.domain}`, `All of this was made from ${brand.domain} alone`)}</div>
      </AbsoluteFill>
    </Bg>
  );
};

/** 11) Menu: všetky čísla na jednom mieste + výzva a konzultácia. */
const Menu: React.FC<{ brand: Brand; lang: L }> = ({ brand, lang }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const head = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });
  const keys = Object.keys(NUM);
  const cta = (d: number) => spring({ frame: f - d, fps, config: { damping: 13, stiffness: 130 } });
  const box = (d: number, bg: string, fg: string, big: string, small: string) => {
    const s = cta(d);
    return (
      <div style={{ background: bg, color: fg, borderRadius: 36, padding: "30px 44px", transform: `scale(${s})`, opacity: s,
        boxShadow: "0 20px 50px rgba(0,0,0,.18)" }}>
        <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: 52, lineHeight: 1.1 }}>{big}</div>
        <div style={{ fontFamily: bodyFont(brand), fontWeight: 600, fontSize: 36, marginTop: 10, opacity: 0.9 }}>{small}</div>
      </div>
    );
  };
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ padding: "150px 70px 0", flexDirection: "column" }}>
        <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: 78, lineHeight: 1.05, color: c.heading,
          transform: `translateY(${(1 - head) * -200}px)`, opacity: head }}>
          {T(lang, "Čo chceš pre svoju značku?", "What do you want for your brand?")}</div>
        <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 16 }}>
          {keys.map((k, i) => {
            const s = spring({ frame: f - 8 - i * 4, fps, config: { damping: 15, stiffness: 170 } });
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 26, transform: `translateX(${(1 - s) * -900}px)` }}>
                <div style={{ background: c.accent, color: c.onAccent, fontFamily: bodyFont(brand), fontWeight: 800, fontSize: 36,
                  width: 76, height: 76, borderRadius: 38, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {String(NUM[k]).padStart(2, "0")}</div>
                <div style={{ fontFamily: bodyFont(brand), fontWeight: 700, fontSize: 44, color: c.text }}>{LABELS[k][lang === "en" ? 1 : 0]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 70, right: 70, bottom: 120, display: "flex", flexDirection: "column", gap: 26 }}>
          {box(50, c.accent, c.onAccent, T(lang, "Napíš nám čísla, ktoré chceš", "Reply with the numbers you want"),
            T(lang, "napr. 01 + 04 + 07 → pošleme cenu", "e.g. 01 + 04 + 07 → we send you a price"))}
          {box(62, c.surface, c.onSurface, T(lang, "Máš vlastnú predstavu?", "Have your own idea?"),
            T(lang, "Osobná konzultácia zadarmo", "Free personal consultation"))}
        </div>
      </AbsoluteFill>
    </Bg>
  );
};

/** Hudba: „Hyperfun“ (Kevin MacLeod, CC BY 4.0), ~99,4 BPM, prvý beat v 0,255 s. Strihy padajú na beaty. */
const MUSIC = { file: "audio/hyperfun.mp3", bpm: 99.4, offset: 0.255, credit: 'Music: "Hyperfun" – Kevin MacLeod (incompetech.com), CC BY 4.0' };
const FPS = 30;
const beatFrame = (b: number) => Math.round(FPS * (MUSIC.offset + (b * 60) / MUSIC.bpm));

type Sfx = [file: string, frame: number, volume: number];
type Scene = { key: string; beats: number; el: React.ReactNode; chip?: boolean; sfx?: Sfx[] };
const scenesFor = (brand: Brand, lang: L, client = false): Scene[] => {
  const words = (brand.headline || brand.tagline || brand.name).split(/\s+/).filter(Boolean).slice(0, 9);
  const nProd = Math.min(3, brand.products?.length || 0);
  const s: Scene[] = [
    { key: "logo", beats: 4, el: <LogoReveal brand={brand} />, sfx: [["sub_hit.wav", 6, 0.5], ["pop.wav", 8, 0.35], ["sparkle.wav", 30, 0.45]] },
    { key: "kinetic", beats: 6, el: <Kinetic brand={brand} />, sfx: words.map((_, i) => ["tick.wav", 5 + i * 5, 0.9] as Sfx) },
  ];
  if (brand.hero) s.push({ key: "hero", beats: 5, el: <HeroMotion brand={brand} />, sfx: [["thud.wav", 16, 0.5], ["sparkle.wav", 22, 0.25]] });
  if (nProd) s.push({ key: "products", beats: 6, el: <Products brand={brand} />,
    sfx: [...Array.from({ length: nProd }, (_, i) => ["pop.wav", 8 + i * 10, 0.4] as Sfx), ["sparkle.wav", 48 + nProd * 10, 0.3]] });
  s.push({ key: "captions", beats: 6, el: <Captions brand={brand} />,
    sfx: shorten(brand.tagline || brand.headline, 80).split(/\s+/).filter(Boolean).map((_, i, a) =>
      ["tick.wav", i * Math.max(7, Math.min(14, Math.floor((beatFrame(6) - beatFrame(0) - 15) / a.length))), 0.8] as Sfx) });
  s.push({ key: "lower", beats: 5, el: <LowerThird brand={brand} lang={lang} />, sfx: [["whoosh.wav", 6, 0.3], ["tick.wav", 18, 0.8]] });
  s.push({ key: "phone", beats: 7, sfx: [["whoosh.wav", 2, 0.25], ["pop.wav", 28, 0.35], ["pop.wav", 42, 0.35]], el: <Phone brand={brand} mode="brand" dur={beatFrame(7) - beatFrame(0)} extras /> });
  s.push({ key: "desktop", beats: 6, el: <Desktop brand={brand} mode="brand" dur={beatFrame(6) - beatFrame(0)} />, sfx: [["whoosh.wav", 2, 0.25]] });
  s.push({ key: "social", beats: 5, el: <Social brand={brand} lang={lang} />, sfx: [["pop.wav", 4, 0.35], ["tick.wav", 37, 1], ["pop.wav", 38, 0.5], ["sparkle.wav", 40, 0.45]] });
  if (client) { s.push({ key: "outro", beats: 6, el: <End brand={brand} mode="brand" dur={beatFrame(6) - beatFrame(0)} />, chip: false, sfx: [["sub_hit.wav", 0, 0.45], ["sparkle.wav", 14, 0.35]] }); return s; }
  s.push({ key: "outro", beats: 5, el: <Outro brand={brand} lang={lang} />, chip: false, sfx: [["sub_hit.wav", 0, 0.45], ["sparkle.wav", 14, 0.35]] });
  s.push({ key: "menu", beats: 11, el: <Menu brand={brand} lang={lang} />, chip: false,
    sfx: [...Object.keys(NUM).map((_, i) => ["tick.wav", 8 + i * 4, 0.7] as Sfx), ["pop.wav", 50, 0.4], ["pop.wav", 62, 0.4]] });
  return s;
};
/** začiatky scén v snímkach (na beatoch); posledný prvok = dĺžka videa */
const timeline = (sc: Scene[]) => { const t = [0]; let b = 0; for (const x of sc) { b += x.beats; t.push(beatFrame(b)); } return t; };
export const showreelLen = (b: Brand, lang: L = "sk", client = false) => { const t = timeline(scenesFor(b, lang, client)); return t[t.length - 1] + 20; };

export const Showreel: React.FC<Props> = ({ brand, lang = "sk", client = false }) => {
  const scenes = scenesFor(brand, lang, client);
  const t = timeline(scenes); const total = t[t.length - 1] + 20;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(MUSIC.file)} volume={(f) => 0.55 * interpolate(f, [0, 8, total - 50, total], [0, 1, 1, 0], clamp)} />
      {scenes.map((sc, i) => {
        const from = t[i]; const len = (i === scenes.length - 1 ? total : t[i + 1]) - from;
        const num = client || sc.chip === false ? 0 : NUM[sc.key] || 0;
        return (
          <React.Fragment key={sc.key}>
            <Sequence from={from} durationInFrames={len}>
              {sc.el}
              {num > 0 && LABELS[sc.key] && <Chip brand={brand} n={num} text={LABELS[sc.key][lang === "en" ? 1 : 0]} />}
              {num > 0 && <Sequence from={6}><Audio src={staticFile("audio/pop.wav")} volume={0.25} /></Sequence>}
              {(sc.sfx || []).map(([file, fr, vol], j) => (
                <Sequence key={j} from={fr}><Audio src={staticFile(`audio/${file}`)} volume={vol} /></Sequence>
              ))}
            </Sequence>
            {i > 0 && <Sequence from={from - 8} durationInFrames={20}>
              <Wipe brand={brand} />
              <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
            </Sequence>}
          </React.Fragment>
        );
      })}
      <Sequence from={t[scenes.length - 1]}>
        <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center", fontFamily: bodyFont(brand), fontSize: 22,
          color: brand.colors.text, opacity: 0.6 }}>{MUSIC.credit}</div>
      </Sequence>
    </AbsoluteFill>
  );
};
