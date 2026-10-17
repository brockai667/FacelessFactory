# MOVEO: čo robíme, ako to robíme, čo vylepšiť

Stav k 17. 10. 2026. Hlavný dokument, od ktorého sa začína. Detaily sú v súboroch, na ktoré odkazuje.
Repo je verejné: kontakty na ľudí a zoznamy leadov sú len v `leads/out/` (gitignore), sem nepatria.

---

## 1. Čo predávame

**Hlavný produkt: animované prvky značky do vlastných videí klienta.**
Klient si video natočí sám (mobilom, ako vždy). My mu dodáme krátke animácie v jeho farbách, písme a
štýle. Vloží si ich nad svoj záber v CapCute a zo „statického“ videa je značkové video.
Takto to fungovalo pre Luka (Doughnana): zo svojho obyčajného videa mal hneď „prvú Doughnanu“ s logom,
kartičkami a nápismi.

Prvky (čísla sú pevné, rovnaké v showreeli, na webe aj v cenníku):

| # | Prvok | Cena |
|---|---|---|
| 01 | Intro s logom | 25 € |
| 02 | Slogan na beat (kinetický text) | 15 € |
| 03 | Produkt v pohybe | 25 € |
| 04 | Produkty s cenou (kartičky) | 30 € |
| 05 | Titulky | 20 € |
| 06 | Meno v zábere (lower third) | 15 € |
| 07 | Web v mobile | 20 € |
| 08 | Web na notebooku | 20 € |
| 09 | Výzva na konci (tlačidlo, klik, konfety) | 15 € |

Balíky: ľubovoľné 3 = 49 €, všetkých 9 = 99 €, celé video na mieru = dohodou.
Dodanie do 48 h, 1 kolo úprav, formát MP4 na zelenom pozadí (+ verzia vo farbách značky).
Platba: polovica vopred, zvyšok po úpravách.

**Iné služby (nie hlavná ponuka):**
- *Reels na mieru* – celé animované videá od scenára (ako pre Helen Doron Ivanka/Senec, iná session
  „HD Marketing“). Väčšia zákazka, cena dohodou.
- *Animovaný web* – nápad (prvky webu ožijú, napr. banány sa zložia do donutu). Zatiaľ sme ho nerobili,
  neponúkať, kým nebude jedna ukážka.

**Komu:** ľuďom a malým značkám, ktoré už točia videá samy, ale vyzerajú obyčajne: kaviarne, e-shopy,
kozmetika, koučovia, študentské firmy, tvorcovia. Plus strihači, ktorí ich videá robia.
**Partneri:** webdizajnéri a štúdiá (najmä Shoptet), ktorí to ponúknu klientovi pri spustení e-shopu.
Provízia 20 % z každej zaplatenej objednávky klienta, 12 mesiacov, vyplatené do 14 dní. Alebo
white-label: 20 % zľava a cenu si určia sami.

Kto za tým stojí: Damián Dodok (podpis v mailoch „Damián Dodok, MOVEO“). MOVEO nie je firma, živnosť
zatiaľ nie je; riešiť pri prvej platenej zákazke (dá sa mať popri brigáde).

---

## 2. Ako to vyrábame (technika)

Všetko je v `sablona/` (Remotion 4, React). Postup pre nového klienta:

```bash
cd predaj-animacii/sablona
node scripts/extract.mjs https://klient.sk          # stiahne logo, farby, písma, produkty, screenshoty → brands/<slug>/brand.json
node scripts/render.mjs <slug> --comps Showreel      # showreel 01–09 s číslami (ukážka pre klienta)
node scripts/render.mjs <slug> --comps Reel          # to isté bez čísel, ako hotové video
node scripts/render.mjs <slug> --comps Title,Pops,End,Phone,Desktop --bg green   # prvky na zelenom = to, čo klient dostane
node scripts/still.mjs <slug> Reel 220               # jeden snímok na kontrolu
```

- `brand.json` sa dá ručne opraviť (napr. `name`, `tagline`, `words`, `ctaText`, `lowerSub`).
- Hudba: „Hyperfun“ (Kevin MacLeod, CC BY 4.0), strihy na beat, kredit je vo videu.
- Render trvá pár minút; Showreel ~5 min.
- Videá na mail zmenšiť: `ffmpeg -i in.mp4 -vf scale=720:-2 -crf 26 -c:a aac -b:a 96k out.mp4` (~3 MB).
- Ukážka „pred a po“: záber + prvok na zelenom, v ffmpeg `chromakey=0x00FF00:0.18:0.06` a `overlay`.

Opravené chyby šablóny (ak sa vrátia, tu je príčina):
- točiaci sa nápis okolo produktu sa prekrýval („DOUDOUGHNANA.COM“) → `textLength` na kruhu,
- rozmazané screenshoty → mobil 3× rozlíšenie, bez blur filtra,
- cookie/newsletter popupy a mapy na screenshotoch → skrývajú sa v `extract.mjs`,
- nečitateľné farby na tmavých weboch → kontrola kontrastu (WCAG).

---

## 3. Čo sme už spravili

**Ukážky:** Doughnana (klient, so súhlasom), Helen Doron, Kakaw Co+ a ~10 ďalších značiek (len ukážky
z verejného webu, nie zákazky; na webe a v mailoch ich tak treba aj označovať).

**Web:** prvá verzia ako súkromný artifact (claude.ai). Zdroj `web/site/index.html`, videá sú gitignore.
Obsah: pred/po v telefóne → ako to funguje v CapCute → 9 prvkov s cenami → kontakt.
Zatiaľ nie je na vlastnej doméne. moveo.sk je obsadená inou firmou (riziko zámeny), moveo.studio voľná.

**Oslovovanie (14. 10.):** 28 firiem (20 SK značiek, 8 appiek z Hacker News) + 17 webových štúdií,
5 komentárov na Reddite (u/GrabSMS).
Výsledok po 3 dňoch: 2 odpovede.
- webdizajnérka zo Shoptetu: záujem o partnerstvo → 17. 10. poslaná odpoveď s cenníkom, províziou a
  2 videami v prílohe (bez stretnutia). Čaká sa.
- jedno CZ štúdio: „v prípade potreby využijeme“ (teplý kontakt).
- 1 mail nedoručený, Reddit: realitný klient nám nevedel poslať správu (na účte sú vypnuté správy).
- 42 konceptov druhého mailu je v Gmaile, neodoslané.

Zoznamy, texty a záznamy: `leads/out/` (lokálne, gitignore), pravidlá mailov `OSLOVOVANIE.md`,
cenník a texty správ `PONUKA.md`, Fiverr `FIVERR.md`, segmenty `KLIENTI.md`, prieskum `PRIESKUM.md`.

---

## 4. Čo sme sa naučili (chyby, ktoré neopakovať)

1. **Najprv si ujasniť produkt, až potom robiť web a maily.** Prvé maily aj web ponúkali „pošli web,
   dostaneš video“. To nie je to, čo predávame. Druhá vlna mailov to musí opraviť.
2. **Nepísať referencie, ktoré nie sú pravda.** Ukážka z verejného webu nie je klient. Vždy označiť
   „ukážka“.
3. **Studené maily majú nízku odozvu (2/45).** Partneri (webdizajnéri) odpovedali lepšie ako značky.
4. **Videá posielať ako prílohu, nie cez YouTube.** Do 25 MB spolu, ideálne ~3 MB na video.
5. **Gmail konektor musí byť brock.ia667**, nie osobný účet. Pred posielaním overiť.
6. **Prílohy cez konektor neprejdú** (príliš veľké). Mail s videom pripraviť ako koncept a videá
   pridať ručne v Gmaile, alebo pracovať v session na PC s rozšírením Chrome.
7. **Reddit: nový účet bez karmy a so zakázanými správami nefunguje.** Povoliť správy, zbierať karmu,
   alebo použiť iný účet.
8. **Web: menej „šablónovitý“ dizajn**, viac skutočnej práce (videá, pred/po), menej textu.

---

## 5. Ako to vylepšiť (návrhy podľa priority)

**A. Ponuka a dôkaz**
1. **Skutočné „pred a po“ od Luka** – jeho video bez prvkov a s prvkami. Najsilnejší argument.
   Na webe je zatiaľ len simulácia z fotky.
2. **Hotová sada na zelenom pre Doughnanu** (všetkých 9 prvkov ako samostatné súbory + krátky
   návod do CapCutu, 1 strana). To je presne produkt, ktorý predávame; zatiaľ ho máme len ako showreel.
3. **Druhá skutočná zákazka** – aj za zľavu výmenou za referenciu a súhlas použiť ju na webe.
4. **Ukážka pre partnera vopred** (napr. sada z e-shopu, ktorý webdizajnérka spravila), aby bolo
   čo poslať hneď, keď odpíše.

**B. Predaj**
1. **Sústrediť sa na partnerov (webdizajnéri, Shoptet partneri)** – odpovedajú viac a privedú
   viac klientov naraz. Nájsť ďalších 30–50 (zoznam Shoptet partnerov, Webglobe partneri).
2. **Druhý mail ako nový mail, nie odpoveď** – aby pod ním nebol citovaný starý text so
   starou ponukou. Appky z Hacker News vynechať (nie sú cieľovka).
3. **Instagram namiesto mailu pre malé značky** – tam sú ich videá; komentár/DM s 5-sekundovou
   ukážkou ich vlastného loga.
4. **Fiverr gig** podľa `FIVERR.md` (prepísať na prvky do videí, nie „launch video“).
5. **Vlastný Instagram/TikTok MOVEO** – krátke pred/po videá; samo o sebe ukazuje, čo robíme.

**C. Výroba**
1. Render prvkov na zelenom jedným príkazom (`--comps` všetkých 9 → zip + návod).
2. Priehľadné pozadie (MOV/WebM s alfa) ako alternatíva k zelenej.
3. Viac štýlov (aby každá značka nevyzerala rovnako): 2–3 varianty intra a kartičiek.
4. Šablóna návodu do CapCutu (obrázky krok po kroku).

**D. Firma a web**
1. Doména (moveo.studio alebo iný názov bez kolízie s moveo.sk) a web na nej.
2. Vlastný e-mail na doméne (napr. ahoj@…) namiesto gmailu.
3. Živnosť pri prvej platenej zákazke; fakturácia.

---

## 6. Otvorené úlohy

- [ ] Čakať na odpoveď partnerky (webdizajnérka); pri „áno“ poslať ukážku z jej e-shopu.
- [ ] Rozhodnúť o druhej vlne mailov (42 konceptov) – prepísať na nové maily, appky vynechať.
- [ ] Lukove videá pred/po → web.
- [ ] Reddit: povoliť správy na u/GrabSMS.
- [ ] Doména a názov.
- [ ] Deň 7 (21. 10.): posledný mail tým, čo neodpísali (len po súhlase).
