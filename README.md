# FacelessFactory

Automatická „továreň" na vertikálne faceless videá (anglické fakty/edukačné shorts) pre **TikTok, Instagram Reels a YouTube Shorts**.

Z témy → hotové MP4 9:16 s hlasom, reálnymi zábermi, word-by-word titulkami, hudbou a popisom — plne automaticky.

---

## Rýchly štart

Otvor **PowerShell** v priečinku `C:\Users\damia\FacelessFactory` a spusti:

```powershell
# vyrob dávku 12 videí z banky tém
python generate_batch.py 12
```

Hotové videá nájdeš v `output\` (každé `.mp4` má vedľa `.txt` s popisom + hashtagmi).

---

## Ako na to (how-to)

### Vyrobiť dávku videí
```powershell
python generate_batch.py 12     # 12 videí (alebo zadaj iné číslo)
```
Generátor vyberie z `topics_bank.json` témy, ktoré **ešte neboli použité** (pamätá si ich v `used_topics.json`), takže sa téma nikdy nezopakuje. Keď banka dôjde, napíše to a treba pridať nové témy.

### Vyrobiť jedno konkrétne video
```powershell
python make_video.py scripts/space.json
```
Akýkoľvek scenár v zložke `scripts\` (formát nižšie).

### Pridať nové témy do banky
Otvor `topics_bank.json` a pridaj objekt do zoznamu. Štruktúra:
```json
{
  "title": "3 Facts About Sleep",
  "segments": [
    { "text": "Prvá veta je HOOK - najsilnejší fakt.", "keywords": "sleep night" },
    { "text": "Ďalší fakt.", "keywords": "person sleeping" },
    { "text": "Follow for more facts that sound fake but are real.", "keywords": "night sky" }
  ],
  "description": "Krátky popis pre platformy.",
  "hashtags": ["#sleep", "#facts", "#shorts", "#fyp"]
}
```
Pravidlá pre dobré video:
- **1. segment = hook** (najprekvapivejší fakt hneď, žiadne „Did you know").
- `keywords` = 1-3 anglické slová, **zamknuté na tému** (kvôli relevantnému footage). Vyberá sa reálny záber z Pexels podľa nich.
- 6-8 segmentov ≈ 25-35 s. Posledný segment = výzva (CTA).

---

## Nastavenia (config.json)

Veci, ktoré budeš chcieť ladiť najčastejšie:

| Kľúč | Čo robí | Aktuálne |
|------|---------|----------|
| `voice` | Hlas (edge-tts). Iné napr. `en-US-BrianNeural`, `en-US-GuyNeural`, `en-US-AriaNeural` | `en-US-AndrewNeural` |
| `caption_fontsize` | Veľkosť titulkov | `80` |
| `caption_words_per_line` | Koľko slov naraz na obrazovke | `3` |
| `caption_highlight_hex` | Farba zvýrazneného slova (ASS formát BGR). Žltá `00F2FF`, zelená `00FF00` | žltá |
| `caption_margin_v` | Výška titulkov (väčšie = vyššie/k stredu) | `880` |
| `caption_margin_h` | Bočný odstup (väčší = ďalej od pravých tlačidiel) | `185` |
| `music_volume` | Hlasitosť hudby pod hlasom (0-1) | `0.12` |
| `color_grade` | Jednotný vzhľad všetkých klipov (FFmpeg filter) | kontrast/sýtosť + vinetácia |
| `pexels_api_key` | Kľúč na sťahovanie záberov | nastavený |

### Hudba
Vlož ľubovoľné `.mp3` do `assets\music\` → automaticky sa pridá pod hlas. Ak má skladba licenčnú podmienku (napr. CO.AG/Myuu), kredit nastav v `config.json` → `music_credit` (pridá sa do `.txt` popisu).

---

## Nahrávanie na profily (workflow)

1. Spusti generátor → videá v `output\`.
2. Nahraj do plánovača **Buffer** (alebo nahraj ručne z desktopu/mobilu).
3. Postuj **3 rôzne videá denne** na každú platformu (TikTok + IG Reels + YT Shorts).
   - Nikdy to isté video 2× za deň na jednom účte.
   - Popis + hashtagy skopíruj z `.txt` súboru vedľa videa.
4. Keď banka tém dôjde, doplň nové do `topics_bank.json` a generuj ďalej.

> IG musí byť **Creator/Business** účet, inak plánovač nevie auto-publikovať Reels.

---

## Ako pipeline beží (architektúra + automatizácia)

Denne o **01:00 UTC** (~03:00 Bratislava) spustí GitHub Actions (`.github/workflows/daily.yml`)
tento reťazec krokov (každý ďalší kryje zlyhanie predchádzajúceho, aby jeden pád nezastavil celý beh):

1. **`generate_topics.py`** — ak je v `topics_bank.json` menej nepoužitých tém než `TOPICS_TARGET`
   (default 15), dogeneruje nové cez GitHub Models (zadarmo). Voliteľne si vypýta aktuálne
   trendy cez `trends.py` (Reddit `.rss` + YouTube Data API, best-effort — nikdy nezhodí beh)
   a aspoň polovicu nových tém z nich inšpiruje.
2. **`generate_batch.py N`** — vezme prvých N nepoužitých tém z banky, pre každú zapíše
   `scripts/auto_<slug>.json` a zavolá `make_video.py`. Téma sa v `used_topics.json` označí
   ako použitá **len ak render uspel** (zlyhané sa skúsia znova nabudúce).
3. **`make_video.py`** (pre každý scenár) — pipeline na 1 video:
   - `tts()` / `kokoro_tts()` → hlas (MP3) + presné časovanie každého slova,
   - `get_broll()` → Pexels vyhľadá a vyberie klip, ktorý sa (podľa URL-slugu) najlepšie
     zhoduje s `keywords` segmentu (nie prvý "relevantný" výsledok); klipy sa cachujú
     v `assets/broll/` a nikdy sa v jednom videu neopakujú,
   - `render_segment()` / `render_asset_segment()` → Ken Burns pohyb + audio → 1 MP4 segment,
   - `concat_segments()` → spojí segmenty, `add_music()` → hudba s duckingom pod hlasom,
     `add_sfx()` → jemný "whoosh" na každý strih,
   - `build_ass_pop()` / `pil_caption_overlay()` / `build_ass()` → animované word-by-word
     titulky (v tomto poradí ako fallback, ak vyšší renderer zlyhá),
   - výsledok: `output/<slug>.mp4` + `output/<slug>.txt` (popis + hashtagy).
4. **`push_to_buffer.py N`** — nahrá nové videá z `output/` na Cloudinary (verejná URL, s retry)
   a naplánuje ich cez Buffer GraphQL API na najbližšie voľné sloty **08:00/15:00/20:00**
   (Europe/Bratislava) na všetky nakonfigurované kanály (IG/YouTube/TikTok). Stav (čo už bolo
   poslané na ktoré platformy) sa drží v `pushed.json`, takže sa nič nepošle 2×.
5. **`retry_failed.py`** — nájde Buffer posty so statusom `error` a skúsi ich znova zaradiť.
6. **`cleanup_cloudinary.py`** — zmaže z Cloudinary videá staršie než `CLOUDINARY_KEEP_DAYS`
   (default 14 dní), aby free tier ostal vždy voľný.
7. Commit + push stavových súborov (`used_topics.json`, `pushed.json`, `topics_bank.json`, `scripts/`).

Sieťové volania (Pexels, Buffer GraphQL, Cloudinary upload, GitHub Models, Reddit/YouTube trendy)
majú vstavaný retry s krátkym odstupom na prechodné výpadky (timeout/connection error); trvalé
aplikačné chyby (napr. zlý token) sa neopakujú, lebo by len znova zlyhali rovnako. Zlyhanie
uploadu jedného videa nezhodí celú dávku — pipeline pokračuje ďalším videom.

### Lokálne spustenie krokov manuálne
```powershell
python generate_topics.py            # dopni banku tém (potrebuje MODELS_TOKEN/GITHUB_TOKEN)
python generate_batch.py 3           # vyrob 3 videá
python push_to_buffer.py --dry-run   # over token + kanály, nič neodošle
python push_to_buffer.py 3           # naozaj odošle 3 videá do Bufferu
python retry_failed.py               # znova zaradí chybné posty
python cleanup_cloudinary.py         # upratovanie starých videí na Cloudinary
```

---

## Testovanie

Unit testy pokrývajú čisté funkcie pipeline (výber B-rollu, generovanie titulkov, timing/strih,
topic generation, retry logika) — bežia cez štandardný `unittest`, žiadna extra závislosť netreba:

```powershell
python -m unittest discover -s tests -t .
```

---

## Mapa súborov

```
FacelessFactory\
  make_video.py          # render engine (1 scenár -> 1 MP4): TTS, B-roll, titulky, hudba, SFX
  generate_batch.py      # dávkový generátor z banky tém -> volá make_video.py
  generate_topics.py     # dopĺňa topics_bank.json cez GitHub Models (+ trendy)
  trends.py              # best-effort trend scanner (Reddit + YouTube) pre generate_topics.py
  push_to_buffer.py      # output/*.mp4 -> Cloudinary -> naplánuje do Bufferu (IG/YT/TikTok)
  retry_failed.py        # znova zaradí chybné Buffer posty
  cleanup_cloudinary.py  # zmaže staré videá z Cloudinary (free tier hygiena)
  cloud_upload.py        # manuálny CLI: nahraj 1 video na Cloudinary a vypíš URL
  appconfig.py           # zdieľané načítanie config.json + ENV prekrytie tajomstiev
  topics_bank.json       # banka tém (sem pridávaš nové)
  used_topics.json       # pamäť použitých tém (negeneruje duplicity)
  pushed.json            # pamäť odoslaných videí (per platforma, negeneruje duplicity)
  config.json            # všetky nastavenia (lokálne; v cloude nahradené ENV secrets)
  scripts\               # jednotlivé scenáre (auto_*.json od generátora)
  assets\music\          # sem vlož .mp3 hudbu
  assets\broll\          # cache stiahnutých záberov (auto)
  output\                # HOTOVÉ videá .mp4 + .txt popisy
  bin\                   # ffmpeg.exe, ffprobe.exe
  temp\                  # pracovné súbory (auto-čistené)
  tests\                 # unit testy (python -m unittest discover -s tests -t .)
  .github\workflows\     # daily.yml - denná automatizácia (cron)
```

---

## Riešenie problémov

| Problém | Riešenie |
|---------|----------|
| „Vsetky temy su uz pouzite" | Pridaj nové témy do `topics_bank.json` |
| Zábery nesedia s témou | Sprav `keywords` konkrétnejšie a v angličtine (napr. `great pyramid egypt` namiesto `egypt`) |
| Titulky pretekajú / sú pod tlačidlami | Zníž `caption_fontsize` alebo zvýš `caption_margin_h` v `config.json` |
| Chcem iný hlas | Zmeň `voice` v `config.json` (zoznam: `python -m edge_tts --list-voices`) |
| Bez hudby | `assets\music\` je prázdny — vlož `.mp3` |
