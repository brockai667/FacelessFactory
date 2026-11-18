// Jeden príkaz: URL → brand.json → ukážka pre klienta (Preview.mp4).
// Použitie: node scripts/make.mjs https://klient.sk [--comps Preview,Launch] [--bg brand,green,black]
import { execFileSync } from "node:child_process";
const [url, ...rest] = process.argv.slice(2);
if (!url) { console.error("použitie: node scripts/make.mjs <url> [--comps ...] [--bg ...]"); process.exit(1); }
const out = execFileSync(process.execPath, ["scripts/extract.mjs", url], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const slug = JSON.parse(out.slice(out.indexOf("{"))).slug;
console.log(`značka: ${slug} → brands/${slug}/brand.json (texty, slová a farby sa dajú upraviť)`);
execFileSync(process.execPath, ["scripts/render.mjs", slug, ...rest], { stdio: "inherit" });
