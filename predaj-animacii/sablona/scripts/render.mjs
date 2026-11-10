// Vyrenderuje animácie pre značku z brands/<slug>/brand.json.
// Použitie: node scripts/render.mjs <slug> [--comps Preview,Launch,Title,Pops,Phone,Desktop,End] [--bg brand,green,black]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

/** Hlasitosť na -14 LUFS (štandard IG/TikTok/YouTube), video sa nekóduje znova. */
export function loudnorm(file) {
  const has = execFileSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file], { encoding: "utf8" }).trim();
  if (!has) return;
  const tmp = file.replace(/\.mp4$/, ".tmp.mp4");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", file, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", tmp]);
  fs.renameSync(tmp, file);
}
import path from "node:path";

// v cloude Playwright headless shell, inak si Remotion stiahne vlastný (undefined)
const CLOUD = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const BROWSER = process.env.REMOTION_BROWSER || (fs.existsSync(CLOUD) ? CLOUD : undefined);
const slug = process.argv[2];
if (process.argv[2] === "--loudnorm") { loudnorm(process.argv[3]); process.exit(0); }
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1].split(",") : d; };
const comps = arg("--comps", ["Preview"]);
const bgs = arg("--bg", ["brand"]);
const lang = arg("--lang", ["sk"])[0];
const brandDir = path.resolve("brands", slug);
const brand = JSON.parse(fs.readFileSync(path.join(brandDir, "brand.json"), "utf8"));

fs.mkdirSync("public/brands", { recursive: true });
fs.cpSync(brandDir, path.resolve("public/brands", slug), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const outDir = path.resolve("out", slug);
fs.mkdirSync(outDir, { recursive: true });
for (const id of comps) for (const bg of bgs) {
  if (["Preview", "Showreel", "Reel"].includes(id) && bg !== "brand") continue; // ukážky pre klienta sú vždy vo farbách značky
  const inputProps = { brand, bg, lang };
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable: BROWSER });
  const outputLocation = path.join(outDir, `${id}${bg === "brand" ? "" : "_" + bg.toUpperCase()}${id === "Showreel" && lang !== "sk" ? "_" + lang.toUpperCase() : ""}.mp4`);
  const t0 = Date.now();
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation, inputProps, browserExecutable: BROWSER,
    crf: 18, concurrency: 4, chromiumOptions: { gl: "swangle" } });
  loudnorm(outputLocation);
  console.log(`✓ ${path.relative(process.cwd(), outputLocation)}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
