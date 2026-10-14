# Univerzálna šablóna: web klienta → animácie

Zadáš URL, šablóna z webu vytiahne meno, texty, písma (Google Fonts sa stiahnu lokálne), farby,
logo a screenshoty (mobil + desktop) a vyrenderuje animácie v štýle značky. Vznikla zovšeobecnením
Doughnana overlayov.

## Rýchlo
```
npm install
node scripts/make.mjs https://klient.sk                 # ukážka pre klienta (Preview, 10 s)
node scripts/make.mjs https://klient.sk --comps Launch  # celé launch video (~20 s)
```
Výstup: `out/<slug>/*.mp4` (1080×1920, 30 fps, H.264).

## Kroky zvlášť
```
node scripts/extract.mjs https://klient.sk     # → brands/<slug>/brand.json + mobile.png, desktop.png, logo.png, fonts/
# (voliteľne uprav brand.json: name, tagline, words, cta, farby)
node scripts/render.mjs <slug> --comps Title,Pops,Phone,Desktop,End --bg green,black
npm run studio                                 # Remotion Studio na ladenie
```

## Kompozície
| ID | Dĺžka | Čo |
|---|---|---|
| `Preview` | 10 s | titulok → telefón so skutočným webom → záver. **Ukážka na oslovenie.** |
| `Launch` | ~20 s | titulok, slová na beat, telefón, počítač, záver |
| `Title` | 3 s | farebný pás udrie, meno, logo dopadne, podtitulok |
| `Pops` | 0,8 s/slovo | štítky so slovami (`words` v brand.json, inak headline po 2 slovách) |
| `Phone` / `Desktop` | 6 / 5 s | naklonené zariadenie, web scrolluje |
| `End` | 2,5 s | logo, čiara, doména/CTA |

`--bg brand` = vo farbách značky (hotové video), `green` = chroma key, `black` = blend Screen
(overlaye do CapCutu, návod ako pri Doughnane).

## Úpravy pre klienta v brand.json
- `name`, `tagline`, `cta`: texty v titulku a závere
- `words`: slová na beat, napr. `["Bez cukru", "Pečené v Bratislave", "Weekly drop"]`
- `colors.surface` (pás, štítky), `colors.accent` (tlačidlá, čiara), `colors.bg`
- `fonts.heading` / `fonts.body`: po zmene spusti extract znova alebo doplň `fontFaces`

## Prostredie
- Cloud: používa Chromium z `/opt/pw-browsers`.
- Windows/Mac: extrakcia použije nainštalovaný Chrome, Remotion si pri prvom renderi stiahne vlastný
  prehliadač. Iný prehliadač: `CHROME_PATH=...` (extrakcia), `REMOTION_BROWSER=...` (render).
- `brands/` a `out/` sú v .gitignore (screenshoty cudzích webov nepatria do verejného repa).

## Overené
doughnana.com, plausible.io, cal.com (Framer), umami.is: farby, písma, logo, mobil aj desktop. Ukážka sa renderuje ~85 s.
