// Nálepky s priehľadným pozadím: MOV (ProRes 4444, do CapCutu/Premiere), WebM (VP9 s alfou) a GIF (GIPHY).
// Použitie: node scripts/render-alpha.mjs <slug> [--comps S-Logo,S-Produkt,S-Cena,S-New,S-Bio,S-Kruzok]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CLOUD = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const BROWSER = process.env.REMOTION_BROWSER || (fs.existsSync(CLOUD) ? CLOUD : undefined);
const slug = process.argv[2];
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1].split(",") : d; };
const comps = arg("--comps", ["S-Logo", "S-Produkt", "S-Cena", "S-New", "S-Bio", "S-Kruzok"]);
const brandDir = path.resolve("brands", slug);
const brand = JSON.parse(fs.readFileSync(path.join(brandDir, "brand.json"), "utf8"));
fs.mkdirSync("public/brands", { recursive: true });
fs.cpSync(brandDir, path.resolve("public/brands", slug), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const outDir = path.resolve("out", slug, "nalepky");
fs.mkdirSync(outDir, { recursive: true });
const ff = (...a) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...a]);

for (const id of comps) {
  const inputProps = { brand, bg: "brand" };
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable: BROWSER });
  const name = id.replace(/^S-/, "");
  const mov = path.join(outDir, `${name}.mov`);
  await renderMedia({ composition, serveUrl, codec: "prores", proResProfile: "4444", imageFormat: "png", pixelFormat: "yuva444p10le",
    outputLocation: mov, inputProps, browserExecutable: BROWSER, concurrency: 4, chromiumOptions: { gl: "swangle" } });
  ff("-i", mov, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "32", "-an", path.join(outDir, `${name}.webm`));
  // GIF orezaný na obsah (GIPHY nálepka): bbox z alfy všetkých snímok
  const tmp = fs.mkdtempSync(path.join(outDir, ".gif-"));
  ff("-i", mov, "-vf", "fps=25,scale=720:-1", path.join(tmp, "%03d.png"));
  const bb = execFileSync("python3", ["-c", `import sys,glob
from PIL import Image
b=None
for f in sorted(glob.glob(sys.argv[1]+'/*.png')):
  x=Image.open(f).getchannel('A').point(lambda v:255 if v>10 else 0).getbbox()
  if x: b=x if b is None else (min(b[0],x[0]),min(b[1],x[1]),max(b[2],x[2]),max(b[3],x[3]))
print(*(b or (0,0,720,1280)))`, tmp], { encoding: "utf8" }).trim().split(" ").map(Number);
  const [x0, y0, x1, y1] = [Math.max(0, bb[0] - 6), Math.max(0, bb[1] - 6), bb[2] + 6, bb[3] + 6];
  ff("-framerate", "25", "-i", path.join(tmp, "%03d.png"), "-vf",
    `crop=${Math.min(720, x1) - x0}:${y1 - y0}:${x0}:${y0},split[a][b];[a]palettegen=reserve_transparent=1:transparency_color=ffffff[p];[b][p]paletteuse=alpha_threshold=128`,
    "-gifflags", "-offsetting", path.join(outDir, `${name}.gif`));
  fs.rmSync(tmp, { recursive: true });
  console.log(`✓ ${name}`);
}
