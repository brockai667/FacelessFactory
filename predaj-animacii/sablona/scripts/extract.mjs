// Z webu klienta vytiahne značku: názov, texty, písma, farby, logo a screenshoty (mobil + desktop).
// Použitie: node scripts/extract.mjs https://example.com [--slug meno]
// Výstup: brands/<slug>/brand.json + mobile.png, desktop.png, logo.png, fonts/*
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

// Chromium: CHROME_PATH, inak cloudový Chromium, inak nainštalovaný Chrome (Windows/Mac)
const CLOUD = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOpts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH }
  : fs.existsSync(CLOUD) ? { executablePath: CLOUD } : { channel: "chrome" };
const url = process.argv[2];
if (!url) { console.error("použitie: node scripts/extract.mjs <url> [--slug meno]"); process.exit(1); }
const slugArg = process.argv.indexOf("--slug");
const domain = new URL(url).hostname.replace(/^www\./, "");
const slug = slugArg > 0 ? process.argv[slugArg + 1] : domain.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const dir = path.resolve("brands", slug);
fs.mkdirSync(path.join(dir, "fonts"), { recursive: true });

const MAX_DESKTOP = 6000, MAX_MOBILE = 5400; // mobil v 3× (max 16 384 px výšky screenshotu)

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  // cookie lišty: klikni na tlačidlo so súhlasom, ak existuje
  for (const re of [/accept all|allow all|accept|agree|got it|súhlas|prijať|povoliť|rozumiem|souhlas|přijmout|ok/i]) {
    const b = page.getByRole("button", { name: re }).first();
    if (await b.isVisible({ timeout: 800 }).catch(() => false)) await b.click({ timeout: 2000 }).catch(() => {});
  }
  // posun dole kvôli lazy-load obrázkom a späť hore
  await page.evaluate(async (max) => {
    for (let y = 0; y < Math.min(document.body.scrollHeight, max); y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  }, MAX_MOBILE);
  // lazy obrázky: načítať hneď a počkať (max 6 s), kým sú všetky stiahnuté
  await page.evaluate(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
    document.querySelectorAll("img[data-src]").forEach((i) => { if (!i.src || i.src.startsWith("data:")) i.src = i.dataset.src; });
    const t0 = Date.now();
    while (Date.now() - t0 < 6000 && [...document.images].some((i) => !i.complete)) await new Promise((r) => setTimeout(r, 200));
  }).catch(() => {});
  await page.waitForTimeout(800);
  // vložené iframy (video, mapy, widgety) sa pri snímaní často nenačítajú → skryť
  await page.keyboard.press("Escape").catch(() => {});
  await page.addStyleTag({ content: "iframe { display: none !important; } html, body { overflow: auto !important; }" }).catch(() => {});
  // cookie lišty: len plávajúce prvky (fixed/sticky) s textom o cookies, nikdy html/body
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      const s = getComputedStyle(el);
      if (s.position !== "fixed" && s.position !== "sticky") continue;
      const t = el.innerText || ""; const r = el.getBoundingClientRect();
      const isHeader = r.top < 10 && r.height < 160 && el.matches("header, nav, [class*=header i], [class*=nav i]");
      if (isHeader) continue;
      const popup = /cookie|súhlas|consent|gdpr|newsletter|prihlás|subscribe|zľav|discount|doprava zadarmo/i.test(t) || el.querySelector("input[type=email]");
      const backdrop = r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && t.trim().length < 3;
      const chat = r.width < 120 && r.height < 120 && r.bottom > innerHeight - 160; // chat bubliny v rohu
      if ((popup && t.length < 2000) || backdrop || chat) el.style.setProperty("display", "none", "important");
    }
  }).catch(() => {});
  await page.waitForTimeout(300);
}

async function shoot(page, file, maxH) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vw = page.viewportSize().width;
  await page.screenshot({ path: file, scale: vw > 1000 ? "css" : "device", clip: { x: 0, y: 0, width: vw, height: Math.min(h, maxH) }, fullPage: true });
  return Math.min(h, maxH);
}

const browser = await chromium.launch({ ...launchOpts, args: ["--no-sandbox"] });
const fontFiles = [];

// ---------- desktop: screenshot + analýza štýlu ----------
const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "sk-SK" });
const dpage = await dctx.newPage();
dpage.on("response", async (r) => {
  if (r.request().resourceType() !== "font") return;
  try {
    const u = r.url(); const name = decodeURIComponent(u.split("/").pop().split("?")[0]).slice(-80);
    const f = path.join(dir, "fonts", name.replace(/[^\w.-]/g, "_"));
    fs.writeFileSync(f, await r.body()); fontFiles.push({ url: u, file: "fonts/" + path.basename(f) });
  } catch {}
});
await dpage.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
await settle(dpage);

const info = await dpage.evaluate(() => {
  const meta = (n) => document.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content?.trim() || "";
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map(Number); return { r, g, b, a }; };
  const hex = ({ r, g, b }) => "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, "0")).join("");
  const sat = ({ r, g, b }) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
  const lum = ({ r, g, b }) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const fam = (el) => el ? getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim() : "";
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 4 && r.height > 4 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.1; };

  // pozadie stránky
  let bg = null;
  for (const el of [document.body, document.documentElement, document.querySelector("main"), document.querySelector("header")]) {
    const c = el && parse(getComputedStyle(el).backgroundColor); if (c && c.a > 0.5) { bg = c; break; }
  }
  bg = bg || { r: 255, g: 255, b: 255 };

  // farby váhované plochou (prvá obrazovka viac) + tlačidlá/odkazy
  const surf = new Map(), ink = new Map();
  const add = (m, c, w) => { if (!c || c.a < 0.5) return; const k = hex(c); m.set(k, (m.get(k) || 0) + w); };
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    const top = r.top + window.scrollY; const fold = top < 1200 ? 3 : 1;
    const isBtn = el.matches("button, a[class*=btn], a[class*=button], [role=button], .button, input[type=submit]");
    const bgc = parse(s.backgroundColor);
    if (bgc && bgc.a > 0.5 && sat(bgc) > 0.2) {
      if (isBtn) add(ink, bgc, 100 * fold); else if (r.width * r.height > 60000) add(surf, bgc, r.width * r.height * fold);
    }
    if (el.matches("a, h1, h2, h3, button")) { const tc = parse(s.color); if (tc && sat(tc) > 0.3) add(ink, tc, (isBtn ? 60 : 20) * fold); }
  }
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const surfaces = top(surf), inks = top(ink);
  const h1 = document.querySelector("h1") || document.querySelector("h2");
  const btn = [...document.querySelectorAll("button, a[class*=btn], a[class*=button], [role=button], .button")].find(visible);
  const textC = parse(getComputedStyle(document.body).color) || { r: 20, g: 20, b: 20 };
  const headC = h1 ? parse(getComputedStyle(h1).color) : textC;

  // logo
  const origin = location.origin;
  const isHome = (a) => { if (!a) return false; try { const u = new URL(a.href, origin); return u.origin === origin && (u.pathname === "/" || /^\/[a-z]{2}\/?$/.test(u.pathname)); } catch { return false; } };
  const cands = [...document.querySelectorAll("header img, header svg, nav img, nav svg, a img, a svg, [class*=logo i], [id*=logo i], img[alt*=logo i], img[src*=logo i], [data-framer-name*=logo i], a[href='/'] > *, a[href='./'] > *, a[aria-label*=home i] > *")]
    .filter(visible).map((el) => {
      const r = el.getBoundingClientRect(); const attrs = (el.className?.baseVal ?? el.className ?? "") + " " + el.id + " " + (el.getAttribute("alt") || "") + " " + (el.getAttribute("src") || "") + " " + (el.closest("a")?.getAttribute("aria-label") || "") + " " + (el.getAttribute("data-framer-name") || "");
      let sc = 0;
      if (/logo|brand/i.test(attrs)) sc += 3;
      if (isHome(el.closest("a"))) sc += 4;
      if (el.closest("header, nav")) sc += 2;
      if (r.top + window.scrollY < 160) sc += 2;
      if ((el.innerText || "").trim().length > 20) sc -= 6;
      if (r.width > 500 || r.height > 160 || r.width < 24) sc -= 5;
      return { el, sc };
    }).sort((a, b) => b.sc - a.sc);
  const logoEl = cands[0] && cands[0].sc >= 4 ? cands[0].el : null;
  if (logoEl) logoEl.setAttribute("data-brand-logo", "1");

  // hlavný obrázok: najväčší obrázok na prvej obrazovke
  const imgs = [...document.querySelectorAll("img")].filter(visible).map((el) => { const r = el.getBoundingClientRect(); return { el, r, area: r.width * r.height, top: r.top + window.scrollY }; });
  const hero = imgs.filter((x) => x.top < 1100 && x.area > 40000 && !x.el.closest("[data-brand-logo]")).sort((a, b) => b.area - a.area)[0];
  if (hero) hero.el.setAttribute("data-brand-hero", "1");

  // produkty: text s cenou → najbližší kontajner s 1 väčším obrázkom a nadpisom
  const PRICE = /(?:€|\$|£)\s?\d{1,4}(?:[.,]\d{2})?|\d{1,4}(?:[.,]\d{2})?\s?(?:€|eur|Kč|zł)/i;
  const products = []; const seenImg = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode() && products.length < 4) {
    const t = walker.currentNode.textContent.trim(); const m = t.match(PRICE);
    if (!m || t.length > 60) continue;
    let box = walker.currentNode.parentElement;
    for (let i = 0; i < 7 && box; i++, box = box.parentElement) {
      const im = [...box.querySelectorAll("img")].filter((x) => { const r = x.getBoundingClientRect(); return r.width >= 120 && r.height >= 90; });
      if (im.length >= 1 && im.length <= 2) {
        // nadpis s najväčším písmom, nie nálepky VERZÁLKAMI
        const head = [...box.querySelectorAll("h2, h3, h4, h5, [class*=title i], [class*=name i], strong")]
          .filter((h) => { const x = (h.innerText || "").trim(); return x && x !== x.toUpperCase(); })
          .sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
        const name = (head?.innerText || im[0].alt || "").replace(/\s+/g, " ").trim();
        const src = im[0].currentSrc || im[0].src;
        if (name && name.length < 60 && !seenImg.has(src)) {
          seenImg.add(src); im[0].setAttribute("data-brand-product", String(products.length));
          products.push({ name, price: m[0].replace(/\s+/g, " "), src });
        }
        break;
      }
    }
  }
  const ig = [...document.querySelectorAll("a[href*='instagram.com/']")].map((a) => a.href.match(/instagram\.com\/([A-Za-z0-9_.]+)/)?.[1]).find((h) => h && !["p", "reel", "explore"].includes(h));

  const title = document.title || "";
  const siteName = meta("og:site_name") || title.split(/[|–—\-:•·]/)[0].trim();
  return {
    name: siteName, title,
    headline: (h1?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 90),
    description: (meta("og:description") || meta("description")).slice(0, 160),
    ogImage: meta("og:image"),
    fonts: { heading: fam(h1), body: fam(document.querySelector("p") || document.body), headingWeight: h1 ? getComputedStyle(h1).fontWeight : "700" },
    colors: {
      bg: hex(bg), text: hex(textC), heading: hex(headC || textC),
      surface: surfaces[0] || null,      // veľká farebná plocha (napr. žltý hero)
      surface2: surfaces[1] || null,
      accent: inks[0] || (headC && sat(headC) > 0.3 ? hex(headC) : null), // tlačidlá / odkazy
      button: btn ? hex(parse(getComputedStyle(btn).backgroundColor) || bg) : null,
      bgIsDark: lum(bg) < 0.45,
    },
    hasLogo: !!logoEl,
    // hlavné tlačidlo: plné pozadie, krátky text, najväčšie na prvej obrazovke
    ctaText: ([...document.querySelectorAll("a, button")].filter(visible).map((el) => {
      const r = el.getBoundingClientRect(); const c = parse(getComputedStyle(el).backgroundColor); const t = (el.innerText || "").replace(/\s+/g, " ").trim();
      return { t, ok: c && c.a > 0.5 && hex(c) !== hex(bg) && t.length >= 3 && t.length <= 28 && r.top + window.scrollY < 1100, area: r.width * r.height };
    }).filter((x) => x.ok).sort((a, b) => b.area - a.area)[0]?.t) || "",
    hero: hero ? { src: hero.el.currentSrc || hero.el.src, w: Math.round(hero.r.width), h: Math.round(hero.r.height) } : null,
    products, instagram: ig || null,
  };
});

if (info.hasLogo) {
  await dpage.locator("[data-brand-logo]").first().screenshot({ path: path.join(dir, "logo.png"), omitBackground: true }).catch(() => (info.hasLogo = false));
}
async function grab(src, sel, file) {
  const p = path.join(dir, file);
  try {
    const r = await dctx.request.get(src, { timeout: 20000 });
    const ct = r.headers()["content-type"] || "";
    if (r.ok() && /png|jpe?g|webp|avif|gif/.test(ct)) {
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("avif") ? "avif" : ct.includes("gif") ? "gif" : "jpg";
      const f = file.replace(/\.png$/, "." + ext); fs.writeFileSync(path.join(dir, f), await r.body()); return f;
    }
  } catch {}
  try { await dpage.locator(sel).first().screenshot({ path: p }); return file; } catch { return null; }
}
const heroFile = info.hero ? await grab(info.hero.src, "[data-brand-hero]", "hero.png") : null;
const products = [];
for (const [i, pr] of info.products.entries()) {
  const f = await grab(pr.src, `[data-brand-product="${i}"]`, `product-${i}.png`);
  if (f) products.push({ name: pr.name, price: pr.price, image: f });
}
const desktopH = await shoot(dpage, path.join(dir, "desktop.png"), MAX_DESKTOP);

// ---------- mobil ----------
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "sk-SK",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
const mpage = await mctx.newPage();
await mpage.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
await settle(mpage);
const mobileH = await shoot(mpage, path.join(dir, "mobile.png"), MAX_MOBILE);
await browser.close();

// farba textu na akcente (kontrast)
const lumHex = (h) => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const c = info.colors;
c.accent = c.accent || c.button || c.heading;
// kontrast (WCAG): farby, ktoré splývajú s pozadím, nahradiť
const rl = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); };
const contrast = (a, b) => { const [x, y] = [rl(a), rl(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
if (contrast(c.heading, c.bg) < 3) c.heading = contrast(c.text, c.bg) >= 3 ? c.text : (c.bgIsDark ? "#ffffff" : "#111111");
if (contrast(c.accent, c.bg) < 1.6) c.accent = c.bgIsDark ? "#ffffff" : "#111111";
if (c.surface && contrast(c.surface, c.bg) < 1.3) c.surface = c.accent;
c.surface = c.surface || c.accent;
c.onSurface = lumHex(c.surface) > 0.6 ? c.heading : "#ffffff";
c.onAccent = lumHex(c.accent) > 0.6 ? "#111111" : "#ffffff";
// text na páse: farba nadpisu, ak je čitateľná, inak čierna/biela podľa kontrastu
c.onSurface = contrast(c.heading, c.surface) >= 3 ? c.heading : (contrast("#111111", c.surface) >= contrast("#ffffff", c.surface) ? "#111111" : "#ffffff");

// Google Fonts stiahni lokálne (render potom nepotrebuje internet)
const fontFaces = [];
for (const family of [...new Set([info.fonts.heading, info.fonts.body, "Inter"].filter(Boolean))]) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700;800;900&display=block`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36" } })).text();
    for (const block of css.split("/*").slice(1)) {
      const subset = block.split("*/")[0].trim();
      if (!["latin", "latin-ext"].includes(subset)) continue;
      const src = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1]; const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
      const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
      if (!src) continue;
      const file = `fonts/gf-${family.replace(/\W+/g, "")}-${weight}-${subset}.woff2`;
      fs.writeFileSync(path.join(dir, file), Buffer.from(await (await fetch(src)).arrayBuffer()));
      fontFaces.push({ family, weight, file, unicodeRange: range });
    }
  } catch (e) { console.error("font", family, e.message); }
}

const brand = {
  url, domain, slug,
  name: info.name || domain,
  headline: info.headline,
  tagline: info.description || info.headline,
  fonts: info.fonts,
  fontFaces,   // Google Fonts lokálne
  fontFiles,   // písma zachytené zo stránky (záloha pre ne-Google písma)
  colors: c,
  logo: info.hasLogo ? "logo.png" : null,
  hero: heroFile,
  products,
  instagram: info.instagram,
  ctaText: info.ctaText || null,
  shots: { mobile: { file: "mobile.png", width: 1170, height: mobileH * 3 }, desktop: { file: "desktop.png", width: 1440, height: desktopH } },
  // texty do animácií: uprav podľa klienta
  words: [],
  cta: domain,
};
fs.writeFileSync(path.join(dir, "brand.json"), JSON.stringify(brand, null, 2));
export { slug };
console.log(JSON.stringify({ slug, name: brand.name, fonts: brand.fonts, colors: brand.colors, logo: brand.logo, hero: heroFile, products, instagram: info.instagram, fontFaces: fontFaces.length, fontFiles: fontFiles.length, mobileH, desktopH }, null, 1));
