// Rýchla kontrola: jeden snímok kompozície ako PNG. node scripts/still.mjs <slug> <Comp> <frame|-1> [--lang en]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs"; import path from "node:path";
const CLOUD = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const BROWSER = process.env.REMOTION_BROWSER || (fs.existsSync(CLOUD) ? CLOUD : undefined);
const [slug, id, fr] = process.argv.slice(2); const li = process.argv.indexOf("--lang"); const lang = li > 0 ? process.argv[li + 1] : "sk";
const brand = JSON.parse(fs.readFileSync(path.resolve("brands", slug, "brand.json"), "utf8"));
fs.cpSync(path.resolve("brands", slug), path.resolve("public/brands", slug), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const inputProps = { brand, bg: "brand", lang };
const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable: BROWSER });
const frame = +fr < 0 ? composition.durationInFrames + +fr : +fr;
const output = path.resolve("out", slug, `${id}-f${frame}.png`); fs.mkdirSync(path.dirname(output), { recursive: true });
await renderStill({ composition, serveUrl, output, frame, inputProps, browserExecutable: BROWSER });
console.log(output);
