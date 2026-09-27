# Písanie scenárov do fronty (MindBlownDaily, papierová fabrika)

Fabrika berie hotové scenáre z `factory/queue/*.json` (abecedne, `001-…`, `002-…`). Každý deň:
`python engine/factory.py` → vizuálna réžia (chrome, prechod, karta, kamera, postava, paleta, slučka, hudba — bez opakovania
voči `factory/history.json`) → `compose.py` → render → `out/<slug>.mp4` + `_qc.jpg` + `.txt` (popis + kredit hudby) → scenár ide do `factory/done/`.

Scenáre píše Claude v dávkach (napr. 10–20 naraz, „zásoba dopredu“). Bezplatný Groq (`--groq`) je len záloha:
v teste 26.9. písal kostrbato a s chybnými faktami („bone cells soften after 7 days“, „immune cells shrink“).

## Formát jedného scenára
```json
{
 "topic": "What happens if ...?",
 "title": "max 6 slov, bez čísel, pomlčiek a slova you",
 "hook": "hovorená otázka, max 9 slov",
 "banner": ["RIADOK 1 max 16 znakov", "RIADOK 2 max 12"],
 "format": "timeline | countdown | gauge",
 "env": "room | space | field",  "scene": "úvodná scéna (nepovinné)",
 "outfit": "tshirt | hoodie | pajamas | labcoat | suit",
 "mood_music": "tense | playful | wonder | calm",
 "face0": "smile | neutral | excited",
 "beats": [{"label": "24 HOURS", "line": "After twenty-four hours, ...", "shots": [ ... ]}],
 "end": {"line": "krátka otázka divákovi (komentáre)", "do": [{"r": "recover", "at": "slovo"}, {"r": "wave", "at": "slovo"}]},
 "description": "1 veta", "tags": ["#..."],
 "facts": [{"claim": "...", "source": "NIH / NASA / CDC / FDA / Mayo Clinic ..."}]
}
```
- 4–6 beatov, vety 6–14 slov, spolu ~60–90 slov (video 25–35 s). Nadpisy: timeline `24 HOURS`, `3 DAYS`, `1 WEEK`,
  `6 MONTHS` (rastú); countdown `#5` … `#1`; gauge `1 CUP`, `4 CUPS`, `40°C`, `10 KM` (max 7 znakov).
- Čas sa hovorí PRIRODZENE (user 26.9.: „nie hour 24, ale after 24 hours“): „After twenty-four hours, …“, „By day three, …“,
  „After a week, …“, „Six months in, …“. Nikdy robotické „Hour twenty-four.“ / „Day three.“ na začiatku vety.
- Fakty: len dobre doložené, konzervatívne formulácie („can“, „about“), žiadne rady lekára, zdroj do `facts`.
- Koniec: otázka divákovi; vizuál napr. `recover` / `wave`. Slučku rieši automat: po dobehnutí pohybov sa všetko plynulo
  vráti do prvého snímku (žiadne zatmenie ani prázdna karta — user 26.9.: „každé má divný koniec“).

## Prostredie a scény (user: „keď je to o nejakom prostredí, tak si v tom prostredí“)
Prostredie a scénu vyber **podľa témy**, nie automaticky obývačku. Scéna sa môže **meniť s dejom**: beat dostane
`"scene": "..."` a platí od neho ďalej (prechod a zvuk rieši automat, slučka sa vráti do úvodnej scény). Max 2–3 zmeny na video.
- room: `couch` (obývačka, gauč), `desk` (pracovný stôl so zapnutým počítačom – obrazovky, sedenie, práca z domu),
  `bed` (spálňa s posteľou – spánok, noc; kombinuj s `mood night`).
- field: `meadow` (lúka, strom), `mountain` (hory, skaly, štíty so snehom), `summit` (vrchol – oblaky pod tebou, vlajky),
  `road` (cesta s cieľovou bránou a mestom v pozadí – beh, chôdza, doprava).
- space: `station` (stanica s obrazovkou misie), `mars` (povrch Marsu – červené skaly, kupola, rover).
Príklady: Everest = `mountain` → posledný beat `summit`; Mars = `station` → beat „on Mars“ `mars`; obrazovky = `desk` celé;
málo spánku = `bed` + `mood night`, potom `couch`.

## Slovník vizuálov
Svet (`{"type": "world", "do": [{"r": ..., "arg"?: ..., "at": "slovo z vety"}]}`):
`face` (neutral smile happy worried shocked tired sleepy angry pain pant dry sick dizzy excited), `puffy`, `skinny_legs`,
`thin_arms`, `bigger`, `taller`, `slump`, `yawn`, `nod`, `sweat`, `steam`, `puff`, `shiver` (arg s), `zzz`, `stars`, `pain`,
`heartbeat` (arg počet), `hallucinate`, `thumbs_up`, `wave`, `recover`, `jog` / `walk` (beh / chôdza na mieste, arg s), `mood` (night hot cold normal), `badge` (len room).
Panely (`{"type": "panel", "panel": ..., "do": [{"a": ..., "at": ...}]}`, každý max raz, okrem stat):
heart `beat|fast|slow` · brain `pulse|wobble|shrink` · blood `flow|thick|toxins` · kidneys `flow|save|fail` · ear `confused` ·
spine `stretch` (+`badge`: [hore, veľké, dole]) · bone `weaken` (+`badge`: [veľké, malé]) · eye `flatten|blur` ·
stat (`big` ≤9 znakov, `small` ≤18, `icon`: clock calendar drop heart brain bolt flame snow moon bone cup bed sun phone rocket
lungs muscle apple up down eye).
Pravidlá: beat 1 = svet; nikdy 3 panely za sebou; druhý záber v beate potrebuje `"from": "slovo"`; `at`/`from` = presné slovo z vety.

## Kontrola pred zaradením
`python engine/compose.py specs/<slug>.json --snap 1,4,8,12,16,20` (alebo `factory.py --snap`) a pozrieť kontaktný hárok:
nič sa neprekrýva, vizuál sedí na slová, slučka (prvý = posledný snímok).
Nové recepty/panely/prostredia pridávať do `lib/` + do slovníka v `engine/compose.py` a tu.
