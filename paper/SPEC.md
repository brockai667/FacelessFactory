# Papierová fabrika „What happens if…?“ — návrh (25.9.2026)

Cieľ: 1–3 **rôzne** videá denne (30–45 s, 9:16), jeden kanál / jedna téma, jednotný vizuálny jazyk
(papierová dioráma 2D s hĺbkou), ale každé video iná postava, iné prostredie, iný priebeh.
Náklady 0 €: edge-tts, Groq (free LLM), HyperFrames + Three.js lokálne alebo v GitHub Actions.
Vzor, ktorý user schválil: `styles/paper-water` (v2 = „presne takto to má vyzerať“) + 3D test DAY 6.

## Téma
„What happens if…?“ scenáre s časovou osou a stupňujúcimi sa následkami (vzorec Helix², 14 M videní) —
ale nie iba ľudské telo: zvieratá, predmety, planéty, príroda. Kanál = konfigurácia (banka tém, hlas, paleta).

## Ako vznikne rozmanitosť („milión riešení“)
Každé video = kombinácia z registra komponentov, vyberá ju LLM „režisér“ podľa témy + pravidlá proti opakovaniu:
| Rozmer | Príklady (štart → cieľ) |
|---|---|
| Postava | človek (vek, pleť, oblečenie, povolanie), zviera (mačka, pes, ryba, vták, korytnačka, medveď…), predmet (mobil, batéria, robot), rastlina, planéta; „sklenené telo“ s orgánmi ako röntgen | 4 → 40+ |
| Prostredie | obývačka, kuchyňa, spálňa, kancelária, trieda, nemocnica, púšť, džungľa, Arktída, hladina/hlbina oceánu, vesmírna stanica, Mesiac, mesto, hora… | 4 → 30+ |
| Časová os / metrika | DAY N, HOUR N, MINUTE N, YEAR N, LEVEL N, DEPTH N m, HEIGHT N m, TEMP N °C, SPEED… | 5 → 12 |
| Close-upy | orgány (srdce, mozog, obličky, krv, pľúca, žalúdok, kosti, koža, oko), mikroskop, prierez, ukazovateľ, mapa | 5 → 20 |
| Efekty | horúčava, mráz, dážď, sneh, noc, pod vodou, beztiaž, halucinácia, dym, oheň, tlak, trblietky | 8 → 25 |
| Paleta, kamera, hudba, hlas, oblúk príbehu | rotácia so záznamom posledných N videí | |

## Pipeline
1. **Témy** (Groq): banka tém + anti-repeat (vzor z fabrík `_clean_bank`).
2. **Scenár** (Groq): hook otázka, 6–9 beatov so stupňovaním, koniec, ktorý sa **zacyklí na začiatok**; kontrola faktov
   (druhé volanie + pravidlá; komentáre divákov trestajú zlé fakty).
3. **Režisér** (Groq → JSON spec): postava, prostredie, metrika, pre každý beat vizuálny zámer z uzavretého slovníka
   (`closeup:heart:beating_fast`, `fx:heat`, `state:gauge_down`, `event:collapse`, `3d:orbit_organs_off`…), kamera, paleta.
   Validátor proti registru komponentov + náhradné riešenia (nič nepadne na chýbajúcom komponente).
4. **Render**: spec → HTML kompozícia (komponenty SVG + GSAP, časovanie z WordBoundary edge-tts), 3D blok Three.js,
   zvuk mix do WAV (`asetpts`, pozri memory audio-encode-glitch) → HyperFrames render → mux.
5. **QC**: lint/check, pakety zvuku, dĺžka, kontaktný hárok snímok; zlyhanie = video sa nepublikuje.
6. **Publikovanie**: existujúci Buffer pipeline (GitHub Releases hosting), CC BY kredit hudby v popise, AI label.

## Architektúra komponentov (zovšeobecnenie paper-water)
- **Rig postavy** — spoločné API: oči/obočie/ústa (stavy), končatiny (pózy: pokoj, zdvihnúť, vejár, siahnuť, palec, držať),
  vnútorná „nádrž“ = metrika príbehu (voda, kyslík, energia, teplo, batéria), doplnky (čiapka, prilba, okuliare),
  druhové časti (uši, chvost, plutvy, krídla, zobák, chobot). 3 základné kostry: dvojnohá, štvornohá, plávajúca/lietajúca + predmet.
- **Súprava prostredia** — 3 vrstvy (stena/pozadie, stred, popredie) pre paralaxu, rekvizity, obloha a denná doba, počasie.
- **Panely** — close-upy s rovnakým prechodom (kruh s papierovým okrajom, zasunutie, strhnutie).
- **Efekty** — z v2: opar, noc, halucinácia, pulz, otras, prach; doplniť mráz, dážď, sneh, bubliny, dym, oheň, beztiaž.

## Postup
1. **Fáza 1 (teraz)**: paper-water prerobiť na engine „spec JSON → video“; ručne 2 nové epizódy v úplne iných svetoch
   (napr. človek v spálni „7 dní bez spánku“, zviera na pláži „ryba mimo vody“) — overí, že komponenty sa dajú kombinovať.
2. **Fáza 2**: LLM režisér + banka tém + validátor → video z jednej témy bez ručnej práce.
3. **Fáza 3**: publikovanie, rozvrh (1/deň → 3/deň), QC brána, spätná väzba z analytiky.
4. **Priebežne**: každý týždeň nové postavy, prostredia a 3D bloky.

## Rozhodnutia
- **Kanál: MindBlownDaily** (user 25.9.2026: „áno, môžeme to dať na MindBlown Daily“).
- **Štýl: 2D papier** (v2 schválená „presne takto“). 3D test (DAY 6 a prvé 3 dni v `styles/water-3d`) user zamietol 25.9.:
  „nebudeme využívať 3D štýl, ani ho ďalej neriešim, možno neskôr, stačí nám 2D“ → 3D bloky z plánu vyradené.

## Otvorené rozhodnutia (user)
- Kde beží render: GitHub Actions (verejné repo = zadarmo bez limitu minút) vs tento PC (musí byť zapnutý).

## Stav fázy 1 (26.9. večer)
- `lib/`: `core.js` (časová os, P/X/XY, kamera s paralaxou, DAY, REVEAL/SLIDE/WIPE), `fx.js` (prach, noc, halucinácia, blur,
  **cloudWipe** = prechod cez oblaky/dym), `char_biped.js` (sklo | oblečenie, **samostatné nohy** legL/legR → `run`, `kneeShake`, `leg`,
  **tieň** `shadow`), `env_room.js` (izba), **`env_space.js`** (stanica: okno so Zemou, obrazovka MISSION DAY `screen(text, t, nadpis)`,
  madlá, vznášajúce sa predmety), **`env_field.js`** (lúka: obloha, slnko, oblaky, kopce, strom, kvety, slot `fd_props`),
  `panels_body.js` (obličky, krv, srdce+EKG, mozog), **`panels_space.js`** (vnútorné ucho, chrbtica +2 in, kosť −1 %/mesiac + Ca, oko sploštenie + rozmazaná tabuľa).
- `engine/build.py`: `episode.json` môže mať `libs` (poradie načítania) a `tail` (dĺžka konca pre slučku).
- Epizódy: `episodes/water` (regresia = v2, zvuk OK), `episodes/space` („What happens if you live in space?“, 36 s, slučka
  cez štart rakety). Zvuky navyše v `ud-style/sfx-pack/sfx_space.py`: beep, rumble, pop, wobble, thud.
- Fakty space overené (NASA): +3 % výšky ≈ 2 in, kosti 1–1,5 %/mesiac, cvičenie ~2 h denne, „puffy face / bird legs“, SANS (sploštenie oka).
- Pravidlá rozloženia, ktoré sa osvedčili: prevrátenie postavy cez obal `tumble` s pivotom v strede tela (540 960) a pod panelom;
  predmety v prázdnych zónach; kontrola snímok na dotyky pred renderom.

## Fáza 2 — automat + rozmanitosť (od 26.9. večer)
User k space videu: „chcem trochu taký feeling, že je to podobné … ale nech to nie je jedna k jednej rovnaké“ → nestačí meniť
postavu a prostredie, musí sa meniť aj **stavba a vzhľad videa**. Každé video = téma + tieto nezávislé voľby (bez opakovania
voči posledným videám, `factory/history.json`):
| Rozmer | Varianty v1 |
|---|---|
| Formát príbehu | `timeline` (DAY/WEEK/MONTH), `countdown` (#5 → #1), `gauge` (stupnica: °C, m, km/h, hodiny) |
| Chrome (nadpis, hook, titulky) | `tape` (páska + krémový pásik), `sticky` (lepiaci papierik, písané písmo, zvýrazňovač), `stamp` (pečiatka + štítkovač), `bubble` (okrúhla nálepka + obrysové titulky) |
| Prechod svet ↔ detail | `circle` (kruh), `page` (otočenie strany), `tear` (roztrhnutý papier), `zoom` (priblíženie) |
| Podanie detailu | `full` (celá obrazovka), `card` (papierová karta nad stmaveným svetom) |
| Kamera | `calm` (pomalé nájazdy), `dynamic` (viac pohybu, náklon, švihy) |
| Paleta | 3 sady pastelových pozadí a papierov |
| Postava | vlasy (5), oblečenie (4), okuliare, pleť (4); „sklo“ len pre témy o tekutinách |
Pipeline: `engine/factory.py` → téma (banka, Groq) → scenár + kontrola faktov (Groq, JSON) → režisér (kód: voľby vyššie + mapovanie
beatov na **recepty** z registra) → `compose.py` (spec → `episode.json` + `script.js`) → build → QC (snímky, zvuk) → render → `out/`.
Recepty = ručne vyladené mini-choreografie (opuchnutá tvár, tenké nohy, prevrátenie pod panelom, beh na páse, horúčava, noc…),
LLM ich len vyberá a kotví na slová vety; nové recepty/prostredia pridáva Claude priebežne.

### Stav fázy 2 (26.9. noc)
- Hotové: štýlové súpravy (4 chrome × 4 prechody × 2 podania × 2 kamery), šatník postavy (5 oblečení, 7 účesov, okuliare,
  4 pleti), `lib/recipes.js` (25 receptov), `lib/panels_stat.js` (karta s číslom + 21 ikon), spoločné rozhranie prostredí
  (metric, mood night/hot/cold), `engine/compose.py` (spec → epizóda, validátor opravuje chyby LLM), `engine/writer.py`
  (Groq: scenár → redaktor → vizuálny rezisér + réžia bez opakovania), `engine/factory.py` (fronta → video), `engine/snap.py`.
- Videá: `out/no-sleep.mp4` (sticky/page/card, pyžamo, dlhé vlasy), coffee + heat z fronty (iné súpravy, prostredia, formáty).
- Zistenie: bezplatný Groq (gpt-oss-120b; iné modely na Groq už nie sú) píše kostrbato a mýli si fakty → scenáre do
  `factory/queue` píše Claude v dávkach (`factory/WRITING.md`), Groq len ako záloha (`--groq`, označí sa na kontrolu).
- Groq kľúč: číta sa z `FactoryAnim/.env` (GROQ_API_KEY), inak z `~/.config/watch/.env` (kľúč, ktorý user spravil pre /watch).
- 26.9. úpravy po spätnej väzbe: slučka bez zakrytia (`R.settle`), prirodzené časové frázy, nálepka „3 / HOURS“,
  palec hore sa sám spustí, obrazovka stanice preberá nadpis metriky.

## Fáza 3 — celá fabrika (príprava 26.9.)
- Fabrika je samostatná (vlastné fonty, hudba, zvuky, `engine/tts.py`), `HF_CLI` pre CI, `factory.py --out <dir>` odovzdá
  `paper-<slug>.mp4/.txt/.jpg` publikátoru FacelessFactory. Návrh workflowu `ci/paper.yml`, postup `ci/NASADENIE.md`.
- Fronta: 10 scenárov (003–012), fakty skontrolované; 008 maratón overený snímkami cez celý automat.
- Čaká na usera: obnova BUFFER_TOKEN (expiroval 23. 9.), súhlas s pushom do FacelessFactory, pomer papier vs starý obsah.
- Hudba (user: „chýba mi podmaz“): cieľ -22 dB, sidechain threshold 0.02 / ratio 5 / attack 10 / release 800 (env `PF_SC`), poistka hudba ≥ 3 dB pod hlasom (build.py meria qc_vox/qc_mus), riadiaci hlas doplnený tichom do konca
  (`apad`) — inak hudba skončila spolu s hlasom a posledné ~2 s bolo ticho. Skladby: Lightless Dawn, Echoes of Time, Space Jazz,
  Arcadia, Inspired, Hyperfun, Pamgaea, Cut and Run (všetko Kevin MacLeod, CC BY 4.0, kredit v popise). `build.py --remux`.

- 27.9. opravy po vizuálnej kontrole 10 videí: (1) jednotka metriky per beat (`b["unit"]`, `env.metricLabel` pri zmene:
  DAY 1 → WEEK 1 → WEEKS 2; kalendár mení nadpis až po odlete stránky), (2) obrazovka stanice si pamätá nadpis (`lbl`),
  (3) prostredie `mountain` (env_field variant: štíty so snehom, skaly, snehové fľaky) + sneh/sneženie pri nálade `cold` aj na lúke,
  (4) recepty `jog` / `walk` (`hero.run` s parametrom lift 0.3 / 0.15, perióda 0.42 / 0.7 s; automat oreže trvanie na koniec záberu).
  Poučenie: beh kontrolovať výrezom v plnom rozlíšení — v 320 px mozaike dvíhanie nôh (60 px) nevidno.

- 27.9. spätná väzba (user: „stále je to v jednej obývačke s gaučom… keď je to o obrazovkách, nech sedí pri zapnutom počítači;
  na Evereste na vrchole pozadie, že si hore; pozadia striedať, ale v rovnakom štýle“) → **systém scén**: prostredie má scény
  (room: couch/desk/bed · field: meadow/mountain/summit/road · space: station/mars), spec má `scene` (úvodná) a beat môže mať
  `scene` (prepnutie od beatu; prechod rieši prostredie – izba: papierová výmena rekvizít, vonku/vesmír: oblakový/prachový
  prestrih `fx.cloudWipe`; slučka sa vráti do úvodnej scény; tieň postavy podľa `stand` scény). `PF.sceneSet` v core.js,
  skupiny `<pre>_sc_<scéna>_<vrstva>`. Env `mountain` = alias field+scene mountain. Pravidlá v WRITING.md („Prostredie a scény“).

- 27.9. večer (autonómne, user preč): CTA nálepka na konci (`PF.CTA`, výber v réžii `cta`, spec `cta: false` vypne), brána FINISH
  presunutá za postavu (vrstva B, y 458–560, pod pás nadpisov), `engine/topics.py` (Groq dopĺňa banku tém, strop 3 témy na sloveso,
  `--sync` označí spracované), `llm.py` ukazuje telo HTTP chyby (Groq 400 = odseknutý JSON pri malom max_tokens), matica súprav × scén
  (`_mx_*` snímky), 5 nových scenárov vo fronte (013–017), zvieracie varianty postavy (`hero.species` cat/dog/bear) v práci.
  CI: vetva `paper` vo worktree C:/Users/damia/FacelessFactory-paper (paper/ + .github/workflows/paper.yml, hudba 128k), čaká na „áno, pushni“.

## Plán na 26.9. (fáza 1, user: „túto fabriku budeme robiť už zajtra“)
1. Knižnica `lib/` z `styles/paper-water/src/template.tpl`: core (P/X/XY/O/F/AT/S, CAM s paralaxou 3 vrstiev, DAY, REVEAL/SLIDE/WIPE/RING,
   VIG), `char_biped` (ID s prefixom, farby/materiál sklo|koža, oblečenie, doplnky, tekutina, orgány, pózy, tvár), `env_room`,
   panely tela (obličky, krv, srdce+EKG, mozog), efekty (opar, noc, halucinácia, prach, bubliny).
2. `engine/build.py spec.json` → TTS (edge-tts, hlas kanála en-US-AndrewNeural), časy slov, titulky, zvuk do WAV, HTML, render, mux, QC.
3. Regresia: vodné video cez engine ≈ paper-water v2.
4. Nová epizóda pre MindBlown v inom svete: **„What happens to your body in space?“** — kozmonaut (skafander, prilba),
   vesmírna stanica (okrúhle okno so Zemou, madlá, vznášajúce sa predmety), metrika MISSION DAY. Beaty (fakty NASA):
   deň 1 tekutiny idú do hlavy (opuchnutá tvár, tenké nohy) · deň 2 vesmírna nevoľnosť (vnútorné ucho) · týždeň 2 vyššia až o ~5 cm
   (chrbtica) · mesiac 1 kosti strácajú ~1 % hmoty mesačne · mesiac 3 svaly ochabujú · mesiac 6 sploštené oči, rozmazané videnie ·
   späť na Zemi ledva stojí → slučka („So would you still go to space?“).
