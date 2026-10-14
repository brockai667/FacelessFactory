import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Brand, Props, asset, headingFont, bodyFont } from "./brand";
import { Bg, LogoCard, Phone, Desktop, shorten } from "./scenes";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type L = "sk" | "en";

const LABELS: Record<string, [string, string]> = {
  logo: ["Animované logo", "Logo animation"],
  kinetic: ["Kinetická typografia", "Kinetic typography"],
  hero: ["Produkt v pohybe", "Product in motion"],
  products: ["Produkty a ceny", "Products & prices"],
  captions: ["Titulky na beat", "Animated captions"],
  lower: ["Meno v zábere", "Lower third"],
  phone: ["Váš web v mobile", "Your site on mobile"],
  desktop: ["Váš web na počítači", "Your site on desktop"],
  social: ["Výzva na sledovanie", "Social call-to-action"],
};
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
            <textPath href="#circ">{label.repeat(Math.max(1, Math.ceil(110 / label.length)))}</textPath>
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

/** 5) Titulky ako na TikToku: slová po skupinách, aktuálne zvýraznené. */
const Captions: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame(); const c = brand.colors;
  const words = shorten(brand.tagline || brand.headline, 80).split(/\s+/).filter(Boolean);
  const { durationInFrames } = useVideoConfig();
  const per = Math.max(7, Math.min(14, Math.floor((durationInFrames - 15) / words.length))); const idx = Math.min(words.length - 1, Math.floor(f / per));
  const g0 = Math.floor(idx / 3) * 3; const group = words.slice(g0, g0 + 3);
  const pop = interpolate(f % per, [0, 3], [1.18, 1], clamp);
  const bgImg = brand.hero || brand.shots.mobile.file;
  return (
    <AbsoluteFill style={{ background: c.surface, overflow: "hidden" }}>
      <Img src={asset(brand, bgImg)} style={{ position: "absolute", width: "140%", left: "-20%", top: brand.hero ? 300 : 0,
        transform: `scale(${1.05 + f * 0.002})`, filter: "blur(2px) brightness(.85)", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,.55))" }} />
      <div style={{ position: "absolute", bottom: 420, width: "100%", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 18, padding: "0 60px" }}>
        {group.map((w, i) => {
          const on = g0 + i === idx;
          return <span key={g0 + i} style={{ fontFamily: bodyFont(brand), fontWeight: 900, fontSize: 92, textTransform: "uppercase",
            color: on ? c.onSurface : "#fff", background: on ? c.surface : "transparent", padding: "4px 18px", borderRadius: 16,
            WebkitTextStroke: on ? "0" : "3px #000", transform: `scale(${on ? pop : 1})`, display: "inline-block" }}>{w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

/** 6) Lower third: lišta s menom cez „video“. */
const LowerThird: React.FC<{ brand: Brand; lang: L }> = ({ brand, lang }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const bar = spring({ frame: f - 8, fps, config: { damping: 16, stiffness: 140 } });
  const txt = interpolate(f, [16, 28], [0, 1], clamp);
  // pozadie ako „záber z videa“: horná časť mobilného webu, pomalý zoom
  return (
    <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
      <Img src={asset(brand, brand.shots.mobile.file)} style={{ position: "absolute", width: 1080, left: 0, top: -f * 1.5,
        filter: "brightness(.75) blur(1px)", transform: `scale(${1.15 + f * 0.0015})`, transformOrigin: "50% 20%" }} />
      <div style={{ position: "absolute", left: 60, bottom: 360, display: "flex", alignItems: "stretch", transform: `translateX(${(1 - bar) * -1000}px)` }}>
        <div style={{ width: 18, background: c.surface2 || c.surface, borderRadius: 9 }} />
        <div style={{ marginLeft: 18, background: c.accent, padding: "26px 44px", borderRadius: 20 }}>
          <div style={{ fontFamily: headingFont(brand), fontWeight: 800, fontSize: 72, color: c.onAccent, opacity: txt }}>{brand.name}</div>
          <div style={{ fontFamily: bodyFont(brand), fontWeight: 600, fontSize: 40, color: c.onAccent, opacity: txt * 0.85, marginTop: 6 }}>
            {T(lang, "Zakladateľ · ", "Founder · ")}{brand.domain}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 9) Výzva: kurzor klikne na tlačidlo, vyletia srdiečka. */
const Social: React.FC<{ brand: Brand; lang: L }> = ({ brand, lang }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const c = brand.colors;
  const btn = spring({ frame: f - 2, fps, config: { damping: 10, stiffness: 150 } });
  const cx = interpolate(f, [10, 34], [900, 600], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [10, 34], [1500, 1010], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const press = f >= 36 && f < 42 ? 0.92 : 1; const done = f >= 40;
  const label = brand.instagram
    ? (done ? T(lang, "Sleduješ ✓", "Following ✓") : T(lang, `Sleduj @${brand.instagram}`, `Follow @${brand.instagram}`))
    : (done ? T(lang, "Otvorené ✓", "Opened ✓") : T(lang, `Navštív ${brand.domain}`, `Visit ${brand.domain}`));
  return (
    <Bg brand={brand} mode="brand">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ transform: `scale(${btn * press})`, background: done ? c.surface : c.accent, color: done ? c.onSurface : c.onAccent,
          fontFamily: bodyFont(brand), fontWeight: 800, fontSize: 64, padding: "34px 64px", borderRadius: 999, boxShadow: "0 25px 60px rgba(0,0,0,.25)" }}>{label}</div>
        {Array.from({ length: 10 }, (_, i) => {
          const t = interpolate(f - 40 - i * 2, [0, 30], [0, 1], clamp);
          return <div key={i} style={{ position: "absolute", left: 470 + ((i * 97) % 260), top: 900 - t * (500 + (i % 4) * 90),
            fontSize: 70 + (i % 3) * 20, opacity: t > 0 ? 1 - t : 0, transform: `rotate(${(i % 2 ? 1 : -1) * t * 30}deg)`, color: i % 2 ? c.accent : "#ff3b5c" }}>♥</div>;
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

type Scene = { key: string; len: number; el: React.ReactNode; chip?: boolean };
const scenesFor = (brand: Brand, lang: L): Scene[] => {
  const s: Scene[] = [
    { key: "logo", len: 75, el: <LogoReveal brand={brand} /> },
    { key: "kinetic", len: 100, el: <Kinetic brand={brand} /> },
  ];
  if (brand.hero) s.push({ key: "hero", len: 90, el: <HeroMotion brand={brand} /> });
  if (brand.products?.length) s.push({ key: "products", len: 110, el: <Products brand={brand} /> });
  s.push({ key: "captions", len: 105, el: <Captions brand={brand} /> });
  s.push({ key: "lower", len: 85, el: <LowerThird brand={brand} lang={lang} /> });
  s.push({ key: "phone", len: 125, el: <Phone brand={brand} mode="brand" dur={125} /> });
  s.push({ key: "desktop", len: 105, el: <Desktop brand={brand} mode="brand" dur={105} /> });
  s.push({ key: "social", len: 90, el: <Social brand={brand} lang={lang} /> });
  s.push({ key: "outro", len: 105, el: <Outro brand={brand} lang={lang} />, chip: false });
  return s;
};
export const showreelLen = (b: Brand, lang: L = "sk") => scenesFor(b, lang).reduce((a, x) => a + x.len, 0);

export const Showreel: React.FC<Props> = ({ brand, lang = "sk" }) => {
  const scenes = scenesFor(brand, lang);
  let t = 0; let n = 0;
  return (
    <AbsoluteFill>
      {scenes.map((sc, i) => {
        const from = t; t += sc.len; const num = sc.chip === false ? 0 : ++n;
        return (
          <React.Fragment key={sc.key}>
            <Sequence from={from} durationInFrames={sc.len}>
              {sc.el}
              {num > 0 && LABELS[sc.key] && <Chip brand={brand} n={num} text={LABELS[sc.key][lang === "en" ? 1 : 0]} />}
            </Sequence>
            {i > 0 && <Sequence from={from - 8} durationInFrames={20}><Wipe brand={brand} /></Sequence>}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
