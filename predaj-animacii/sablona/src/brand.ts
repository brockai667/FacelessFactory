import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export type Brand = {
  url: string; domain: string; slug: string; name: string; headline: string; tagline: string;
  fonts: { heading: string; body: string; headingWeight: string };
  fontFaces?: { family: string; weight: string; file: string; unicodeRange?: string }[];
  fontFiles: { url: string; file: string }[];
  colors: { bg: string; text: string; heading: string; surface: string; surface2: string | null; accent: string;
    button: string | null; bgIsDark: boolean; onSurface: string; onAccent: string };
  logo: string | null;
  shots: { mobile: { file: string; width: number; height: number }; desktop: { file: string; width: number; height: number } };
  words: string[]; cta: string;
};
export type BgMode = "brand" | "green" | "black";
export type Props = { brand: Brand; bg: BgMode };

export const asset = (b: Brand, f: string) => staticFile(`brands/${b.slug}/${f}`);
export const headingFont = (b: Brand) => `"${b.fonts.heading}", "${b.fonts.body}", Inter, system-ui, sans-serif`;
export const bodyFont = (b: Brand) => `"${b.fonts.body}", Inter, system-ui, sans-serif`;

/** Slová do pop animácie: vlastné z brand.json, inak headline rozsekaný po 2 slovách. */
export const popWords = (b: Brand): string[] => {
  if (b.words?.length) return b.words;
  const w = (b.headline || b.name).split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < w.length; i += 2) out.push(w.slice(i, i + 2).join(" "));
  // krátky zvyšok (napr. „be.“) prilep k predchádzajúcemu štítku
  if (out.length > 1 && out[out.length - 1].length <= 4) out.splice(-2, 2, out[out.length - 2] + " " + out[out.length - 1]);
  return out.slice(0, 6);
};

let loading: Promise<unknown> | null = null;
async function loadFonts(b: Brand) {
  // 1) lokálne stiahnuté Google Fonts (extract.mjs)
  const faces = (b.fontFaces || []).map(async (f) => {
    const ff = new FontFace(f.family, `url(${asset(b, f.file)})`, { weight: f.weight, unicodeRange: f.unicodeRange });
    await ff.load(); document.fonts.add(ff);
  });
  // 2) písma zo stránky (ne-Google), ak názov súboru obsahuje meno rodiny
  const have = new Set((b.fontFaces || []).map((f) => f.family));
  for (const family of [b.fonts.heading, b.fonts.body]) {
    if (!family || have.has(family)) continue;
    const key = family.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const f of b.fontFiles || []) {
      if (f.file.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key))
        faces.push(new FontFace(family, `url(${asset(b, f.file)})`).load().then((ff) => { document.fonts.add(ff); }));
    }
  }
  await Promise.allSettled(faces);
}

export const useBrandFonts = (b: Brand) => {
  const [handle] = useState(() => delayRender("fonty značky", { timeoutInMilliseconds: 25000 }));
  useEffect(() => {
    (loading ||= loadFonts(b)).finally(() => continueRender(handle));
  }, [b, handle]);
};
