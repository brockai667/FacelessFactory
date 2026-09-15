# diktat – slovenské hlasové diktovanie do Claude Code

Nástroj, ktorým **diktuješ po slovensky** a text pristane v Claude Code (terminál, desktop app,
VS Code – hocijaké okno) už **vyčistený**: bez „hmm“, bez pomýlených viet, s vykonanými príkazmi
typu *„škrtni to“* alebo *„ignoruj posledné dva riadky“*. Funguje **globálne pre všetky sessions**.

## Prečo nie natívny `/voice` v Claude Code

Claude Code má vstavané diktovanie (`/voice`, hold/tap na medzerník), ale k septembru 2026 podporuje
20 jazykov a **slovenčina medzi nimi nie je** (čeština áno). Pri `language: "sk"` sa ticho prepne na
angličtinu. Navyše nerieši „premýšľanie nahlas“ – prepis ide 1:1 do promptu. Preto vlastný nástroj.

## Ako to funguje

```
 Ctrl+Alt+D          Ctrl+Alt+D
 ─────────►  🔴 nahrávanie (pauzy, hmm, opravy – všetko OK)  ─────────►
                                                                       │
     ┌─────────────────────────────────────────────────────────────────┘
     ▼
 1. Whisper (faster-whisper large-v3-turbo, jazyk sk, lokálne, offline)
 2. pravidlá  : výplňové zvuky, „škrtni to“, „ignoruj posledné N riadkov/viet“,
                „nový odsek“, opakované slová, slovník náhrad (pajton → Python)
 3. Claude    : voľné opravy („nie, teda…“, „vlastne…“), interpunkcia, technické názvy
                (voliteľné – bez kľúča beží len krok 2)
 4. „pošli to“ na konci → po vložení stlačí Enter
     │
     ▼
 vloží „🎤 <text>“ do AKTÍVNEHO okna (schránka + Ctrl+V)  →  ty skontroluješ, Enter
```

Do Claude Code sa navyše nainštaluje **globálna vrstva** (`install.py`), aby Claude rozumel diktátu
aj keď čistenie niečo prehliadne, alebo keď text nadiktuješ inak (mobil, iný nástroj):

| Čo | Kde | Načo |
|---|---|---|
| pravidlá „Diktovaný vstup“ | `~/.claude/CLAUDE.md` | Claude ignoruje výplne, rešpektuje opravy, opraví fonetické názvy, pri dlhom diktáte zhrnie čo pochopil a pokračuje |
| skill `/diktat` | `~/.claude/skills/diktat/` | vlož surový prepis odkiaľkoľvek: `/diktat <text>` |
| hook `UserPromptSubmit` | `~/.claude/hooks/diktat/` + `settings.json` | pri prompte začínajúcom `🎤`/`[d]` pridá Claudovi kontext + verziu vyčistenú pravidlami. Iné prompty nechá bez zmeny (0 ms, 0 tokenov). |

Hook v Claude Code **nemôže prepísať prompt** (dokumentácia: *„can't replace the prompt; it only injects
additionalContext“*) – preto sa čistí ešte pred vložením do okna a hook je len bezpečnostná sieť.

## Inštalácia (Windows)

Požiadavky: Python 3.10+, mikrofón, ~2 GB miesta na Whisper model (stiahne sa pri prvom spustení).
NVIDIA GPU nie je nutná; na CPU trvá prepis minúty reči cca 15–40 s (turbo model, int8).

```bat
cd diktat
setup_windows.bat        :: venv + závislosti + config.json + globálne nastavenie Claude Code
```

Ručne to isté:

```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy config.example.json config.json
python install.py              # ~/.claude: CLAUDE.md blok + skill + hook  (--dry-run ukáže, --uninstall vráti)
```

Čistenie cez Claude potrebuje prihlásenie k API – jedno z:
`ant auth login` (uloží profil, SDK ho nájde sám) alebo premenná prostredia `ANTHROPIC_API_KEY`.
Bez toho všetko beží, len s pravidlami (`cleanup.mode` sa v tom prípade správa ako `rules`).

macOS/Linux: rovnaké kroky (`run`: `python app.py`). Na macOS treba terminálu povoliť Mikrofón a
Accessibility (pynput). Na Linuxe pynput vyžaduje X11/XWayland.

## Použitie

```bat
run_diktat.bat           :: alebo: python app.py
```

1. Klikni do okna Claude Code (kurzor v prompte).
2. **Ctrl+Alt+D** → 🔴 nahráva. Hovor normálne, rob pauzy, premýšľaj nahlas.
3. **Ctrl+Alt+D** → stop. O pár sekúnd sa v prompte objaví `🎤 vyčistený text`.
4. Skontroluj, uprav, **Enter**. (Alebo na konci diktátu povedz *„pošli to“* – Enter sa stlačí sám.)

Meta-príkazy, ktorým rozumejú pravidlá (Claude navyše chápe voľné opravy typu *„nie, teda…“*):

| Povieš | Stane sa |
|---|---|
| *škrtni to* / *zruš to* / *zabudni na to* / *to nie* | vymaže predchádzajúcu vetu |
| *ignoruj posledný riadok* / *poslednú vetu* / *posledné dva riadky* / *posledné 3 vety* | vymaže N viet |
| *nový odsek* / *nový riadok* | zalomenie |
| *pošli to* / *odošli* (na konci) | po vložení stlačí Enter |

Pravidlá pracujú po **vetách** podľa interpunkcie, ktorú dodá Whisper. Ak prepis interpunkciu nemá,
*„škrtni to“* zmaže všetko od poslednej bodky – vrstva Claude to rieši presnejšie (rozumie, čo sa opravuje).

Test bez mikrofónu:

```bash
python app.py --text "hmm chcem aby si ehm pridal testy na slug škrtni to na funkciu slug pošli to"
python app.py --file nahravka.m4a --no-paste
python app.py --list-devices
```

Každý diktát sa loguje do `logs/RRRR-MM-DD.jsonl` (surový aj vyčistený text) – hodí sa na ladenie
slovníka náhrad.

## Konfigurácia (`config.json`)

| Kľúč | Default | Poznámka |
|---|---|---|
| `hotkey` | `<ctrl>+<alt>+d` | formát pynput; `mode: "hold"` = drž kláves, `toggle` = stlač/stlač |
| `language` | `sk` | jazyk pre Whisper |
| `stt.model` | `large-v3-turbo` | najlepšia kvalita SK: `large-v3` (pomalšie, ideálne GPU); rýchle: `medium` |
| `stt.device` / `compute_type` | `auto` | GPU: `cuda` + `float16` (potrebuje CUDA 12 + cuDNN 9) |
| `stt.backend` | `faster-whisper` | `openai` = Whisper API ako záloha pre slabý počítač (`OPENAI_API_KEY`) |
| `stt.initial_prompt` | tech slovník | slová, ktoré má Whisper „očakávať“ – dopĺňaj názvy projektov, knižníc |
| `audio.silence_auto_stop_seconds` | `0` | napr. `4` = po 4 s ticha zastaví samo (pri premýšľaní nahlas nechaj 0) |
| `cleanup.mode` | `auto` | `auto` (Claude ak je kľúč, inak pravidlá) · `llm` · `rules` · `none` |
| `cleanup.model` | `claude-opus-5` | `effort: low` – rýchle a lacné (≈ 1–2 centy / diktát); alternatívy `claude-sonnet-5`, `claude-haiku-4-5` |
| `cleanup.replacements` | slovník | fonetické → správne (`"pajton": "Python"`), rozširuj podľa logov |
| `output.marker` | `🎤 ` | prefix, podľa ktorého Claude (CLAUDE.md + hook) spozná diktát |
| `output.auto_enter` | `false` | `true` = odošle vždy hneď (odporúčam nechať `false` a používať „pošli to“) |
| `output.paste_shortcut` | `ctrl+v` | terminály, kde vkladá Ctrl+Shift+V, nastav `ctrl+shift+v` |
| `hook.llm` | `false` | `true` = hook čistí aj cez Claude (pomalšie; hook má limit 30 s) |

Pri volaní Claude je zapnutý server-side fallback (`fallbacks: "default"`) – ak model požiadavku
výnimočne odmietne, API ju samo zopakuje na náhradnom modeli; keď zlyhá aj to, použijú sa pravidlá.

## Riešenie problémov

- **Nič sa nevloží** – text je vždy aj v schránke, stlač Ctrl+V ručne. Skontroluj, či bol kurzor
  v okne Claude Code; niektoré terminály chcú `ctrl+shift+v` (viď `output.paste_shortcut`).
- **Skratka nereaguje** – iná aplikácia ju má obsadenú; zmeň `hotkey` (napr. `<ctrl>+<alt>+m`).
  Ak beží Claude Code s `/voice`, vypni ho (`/voice off`), nech si nekonkurujú.
- **Zlá kvalita prepisu** – hovor bližšie k mikrofónu, skús `stt.model: "large-v3"`, doplň
  `initial_prompt` o slová, ktoré Whisper komolí, a pridaj náhrady do `cleanup.replacements`.
- **Pomalé** – CPU + turbo je hranica; zapni GPU alebo `stt.backend: "openai"`.
- **Claude Code hook „timed out“** – nechaj `hook.llm: false` (čistenie robí daemon).
- **Kontrola, že globálne nastavenie sedí** – `python install.py --dry-run`; v Claude Code `/hooks`
  ukáže zaregistrovaný `UserPromptSubmit`, `/diktat` musí byť v zozname skillov.

## Testy

Bez mikrofónu, bez API, stdlib `unittest` (rovnako ako zvyšok repa):

```bash
python -m unittest tests.test_diktat_cleanup tests.test_diktat_hook tests.test_diktat_install
```

## Štruktúra

```
diktat/
├── app.py                 daemon: hotkey → nahrávanie → STT → čistenie → vloženie
├── install.py             globálna inštalácia do ~/.claude (CLAUDE.md, skill, hook, settings.json)
├── config.example.json    → skopíruj na config.json (ten je v .gitignore)
├── diktat_core/
│   ├── cleanup.py         pravidlá + Claude (Anthropic SDK), detekcia „pošli to“ a značky 🎤
│   ├── stt.py             faster-whisper (lokálne) / OpenAI Whisper API (záloha)
│   ├── audio.py           nahrávanie (sounddevice), auto-stop pri tichu, pípanie
│   ├── inject.py          schránka + Ctrl+V / písanie po znakoch / výpis
│   └── config.py          config.json + defaulty
├── hook/diktat_hook.py    UserPromptSubmit hook (additionalContext pre prompty so značkou)
├── claude/
│   ├── CLAUDE.diktat.md   blok do ~/.claude/CLAUDE.md
│   └── skills/diktat/     globálny skill /diktat
├── setup_windows.bat · run_diktat.bat
└── requirements.txt
```

## Čo ďalej (nápady, zatiaľ nerobené)

- Overlay okno s priebežným prepisom namiesto konzoly.
- Vlastný slovník názvov z aktuálneho repa (názvy súborov/funkcií) automaticky do `initial_prompt`.
- Diktovanie z mobilu (hlasová poznámka → `app.py --file`), prípadne cez Claude Code Remote.
