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

## Mapa súborov

```
FacelessFactory\
  make_video.py        # render engine (1 scenár -> 1 MP4)
  generate_batch.py    # dávkový generátor z banky tém
  topics_bank.json     # banka tém (sem pridávaš nové)
  used_topics.json     # pamäť použitých tém (negeneruje duplicity)
  config.json          # všetky nastavenia
  scripts\             # jednotlivé scenáre (auto_*.json od generátora)
  assets\music\        # sem vlož .mp3 hudbu
  assets\broll\        # cache stiahnutých záberov (auto)
  output\              # HOTOVÉ videá .mp4 + .txt popisy
  bin\                 # ffmpeg.exe, ffprobe.exe
  temp\                # pracovné súbory (auto-čistené)
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
```
