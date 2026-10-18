# MOVEO – odovzdanie práce novej session (stav 18. 10. 2026)

> **Pre novú session:** prečítaj celý tento súbor, potom `MOVEO-STAV.md`. Pokračuj od časti
> „Kde sme prestali“. Používateľ je Damián Dodok, píše po slovensky (často hlasom, prepis má preklepy),
> tykaj mu. Značka projektu je **MOVEO**.

## Repo a vetva
- GitHub: `brockai667/FacelessFactory` (verejné repo), vetva **`claude/doughnana-video-production-ww974n`**.
- Všetko k MOVEO je v priečinku `predaj-animacii/`.
- **Nie je v gite** (gitignore): `sablona/brands/`, `sablona/out/` (rendery), `sablona/public/brands/`,
  `leads/out/` (kontakty, zoznamy leadov), videá webu. Nová cloud session ich **nebude mať**.
  - Doughnana brand (s ručnými úpravami) je zálohovaný v `sablona/brands-ulozene/doughnana-com/` –
    pred prvým renderom skopírovať: `cp -r sablona/brands-ulozene/doughnana-com sablona/brands/` a potom
    `node scripts/extract.mjs https://doughnana.com` **nespúšťať** (prepísal by ručné úpravy), len doplniť
    chýbajúce obrázky: spustiť extract do inej zložky a skopírovať `hero.png`, `product-*.png`, `fonts/`,
    `mobile.png`, `desktop.png`, alebo extract spustiť a potom obnoviť `brand.json` zo zálohy.
  - Kontakty z oslovovania (45 firiem/štúdií) sú len v starom kontajneri a v Gmaile (Odoslané, 14. 10.).

## Čo predávame (dohodnuté s používateľom)
**Animované prvky značky („stickery“) do videí, ktoré si klient natočí sám** – vloží si ich v CapCute.
Tak to fungovalo pre Luka (Doughnana, skutočný klient so súhlasom). Nie „pošli web, dostaneš video“.
Vedľajšie služby: reels na mieru (ako pre Helen Doron, iná session), animovaný web (zatiaľ nerobené).
Cenník 01–09 (15–30 €/prvok, 3 za 49 €, 9 za 99 €), partneri 20 % provízia. Detaily: `MOVEO-STAV.md`.

## Kde sme prestali (posledná práca: nová generácia nálepiek pre Doughnanu)
Hotové a odsúhlasené používateľom („mega dobré“):
- **Logo nálepka** (`S-Logo`): pôvodné logo Doughnany (súbor z webu, nič neprekresľovať – používateľ
  na tom trvá), karta vyskočí, **donut z loga sa pomaly dokotúľa sprava** a za ním sa odkrýva nápis,
  dosadne na miesto „o“, odkryje sa „d“, tieň pod donutom, omrvinky, lesk po nápise.
  **Zvuk: varianta B „drevené koliesko“** (ťukanie spomaľuje s donutom, na konci „tuk“) –
  `sablona/public/audio/roll.wav`. Používateľ odmietol prvý (hučiaci) zvuk; A (kreslený) a C (whoosh)
  nevybral.
- Ďalšie nálepky (60 fps, priehľadné pozadie): `S-Produkt` (vyrezaný donut s bielym obrysom ako
  skutočná nálepka), `S-Cena` (visačka na šnúrke, cena sa napočíta), `S-New` (odznak), `S-Bio`
  (šípka + „link in bio“), `S-Kruzok` (ručne kreslené zvýraznenie). Hviezdičky s hodnotením zámerne nie
  (vymyslený údaj).
- Ukážka všetkých nálepiek: kompozícia `StickerDemo` (60 fps, 14 s).

Spätná väzba používateľa, ktorú treba dodržať:
1. **Logo klienta nikdy nemeniť** (žiadne prekresľovanie/vektorizácia), len animovať.
2. **Ostrosť** – vždy originálne obrázky v plnom rozlíšení (extract už berie originály z
   `/_next/image?url=`, Shopify `?width=` atď.), render v 1080p, nie zmenšovať a zväčšovať.
3. **Plynulosť** – nálepky v 60 fps, pohyb robiť v Remotione (nie ffmpeg overlay/zoom, ten trhá).
4. Zvuky: pred nasadením dať používateľovi vybrať z 2–3 variant.

## Ako to spustiť
```bash
cd predaj-animacii/sablona && npm ci
node scripts/render-alpha.mjs doughnana-com                 # všetky nálepky → out/<slug>/nalepky/ (MOV s alfou + WebM + GIF)
node scripts/render-alpha.mjs doughnana-com --comps S-Logo   # len jedna
node scripts/render.mjs doughnana-com --comps StickerDemo    # ukážka (MP4 1080p60 so zvukom)
node scripts/still.mjs doughnana-com S-Logo 60,120           # kontrolné snímky (čísla snímok pri 60 fps)
node scripts/render.mjs --loudnorm <subor.mp4>               # hlasitosť na -14 LUFS
```
- Kód nálepiek: `sablona/src/stickers.tsx`, registrácia v `src/Root.tsx` (`S-*` kompozície, 60 fps).
  Čas v nálepkách je v „30 fps jednotkách“ (`useF()`), renderuje sa v 60 fps.
- Polia v `brand.json` pre nálepky: `logo` (pôvodný súbor), `logoAnim` {w,h,round{cx,cy,r},crumbs},
  `sticker` (produkt s bielym obrysom: `python3 scripts/make-sticker.py brands/<slug>/hero.png brands/<slug>/sticker.png`).
- Cloud: Remotion používa Chromium `/opt/pw-browsers/chromium_headless_shell-1194/...` (nastavené v skriptoch).

## Otvorené úlohy (podľa priority)
1. **GIF produktu je 8 MB** – zmenšiť pre GIPHY (napr. 480 px, menej farieb).
2. Overiť, či **CapCut na mobile** načíta MOV s alfou; ak nie, dodávať zelenú verziu ako zálohu.
3. **Ďalšie vylepšenia z návrhu** (používateľ ich chcel, zatiaľ nerobené): 2–3 rôzne štýly prvkov
   (aby každá značka nevyzerala rovnako), šablóna do CapCutu, viac formátov (1:1, 4:5, 16:9),
   GIPHY kanál pre značku.
4. Ostatné prvky 01–09 (showreel) zatiaľ v starom štýle – postupne prerobiť na nový štandard
   (pôvodné logo, 60 fps, ostré originály).
5. **Mia** (webdizajnérka, Shoptet; partnerka) – 17. 10. jej odišla odpoveď s cenníkom, províziou a
   2 videami. Čaká sa na odpoveď. Ponúkli sme jej ukážku z jej e-shopu kakawco.sk.
6. **42 konceptov druhého mailu** v Gmaile (brock.ia667) – neodoslané. Odporúčanie: zahodiť alebo poslať
   ako nové maily bez citácie starej ponuky, appky z Hacker News vynechať. Bez súhlasu neposielať.
7. Web (`web/site/index.html`, súkromný artifact) – prerobiť na novú ponuku, keď budú lepšie ukážky;
   ideálne so skutočným Lukovým videom pred/po (používateľ ho má na PC).
8. Reddit u/GrabSMS – povoliť správy (realitný klient nám nevedel poslať podklady).

## Pravidlá spolupráce
- Gmail konektor musí byť **brock.ia667@gmail.com**, nikdy damianmarekdodok. Pred prácou s mailom overiť.
- Maily a správy **neposielať bez výslovného „pošli“** od používateľa; pripravovať ako koncepty.
- **Nevymýšľať referencie** – ukážka z verejného webu nie je klient (Helen Doron reels sú iná služba,
  Kakaw Co+ je len ukážka). Kakaw Co+ nedávať na web.
- Kontakty a zoznamy leadov nedávať do repa (je verejné).
- Neupravovať nastavenia oprávnení Claude.
- Do commitov nedávať identifikátor modelu.
- Používateľ nechce stretnutia s partnermi, uprednostňuje e-mail; YouTube na ukážky nie, videá posielať
  ako prílohy (do ~25 MB).
