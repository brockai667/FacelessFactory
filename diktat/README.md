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
 1. Whisper (faster-whisper large-v3-turbo, jazyk sk, lokálne, offline, zadarmo)
 2. light     : vyhodí len „hmm/ehm“, opakované slová, opraví interpunkciu, slovník náhrad
                (pajton → Python). Opravy typu „škrtni to“, „to je blbosť“, „odznova“ NECHÁ v texte.
 3. „pošli to“ na konci → po vložení stlačí Enter
     │
     ▼
 vloží „🎤 <text>“ do AKTÍVNEHO okna (schránka + Ctrl+V)  →  ty skontroluješ, Enter
     │
     ▼
 Claude Code session si diktát vyhodnotí SAMA podľa globálnych pravidiel (CLAUDE.md + hook):
 „aha, toto škrtol, toto je posledná verzia, odznova = zahoď všetko predtým“.
```

**Celé je to zadarmo** – Whisper beží lokálne a interpretáciu robí session, ktorú už máš v predplatnom.
Nič sa nevolá cez Claude API. (Kto chce, môže zapnúť `cleanup.mode: "rules"` – offline vykonávanie
príkazov – alebo `"llm"` – predčistenie cez API; predvolene sú vypnuté.)

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

Žiadny API kľúč netreba. (Voliteľný režim `cleanup.mode: "llm"` by potreboval `ant auth login`
alebo `ANTHROPIC_API_KEY`; bez nich sa sám vráti k pravidlám.)

macOS/Linux: rovnaké kroky (`run`: `python app.py`). Na macOS treba terminálu povoliť Mikrofón a
Accessibility (pynput). Na Linuxe pynput vyžaduje X11/XWayland.

## Použitie

```bat
run_diktat.bat           :: alebo: python app.py
```

1. Klikni do okna Claude Code (kurzor v prompte).
2. **numpad „,/Del“** (pri pravom Enteri) → 🔴 nahráva. Hovor normálne, rob pauzy, premýšľaj nahlas.
3. **numpad „,/Del“** znova → stop. O pár sekúnd sa v prompte objaví `🎤 vyčistený text`.
4. Skontroluj, uprav, **Enter**. (Alebo na konci diktátu povedz *„pošli to“* – Enter sa stlačí sám.)

Ako diktovať: premýšľaj nahlas, pomýľ sa, oprav sa. Session tomu rozumie vďaka pravidlám v
`~/.claude/CLAUDE.md` (nainštaluje `install.py`). Príkazy, ktoré chápe Claude (a v režime `rules`
aj offline pravidlá):

| Povieš | Stane sa |
|---|---|
| *škrtni to* / *zruš to* / *zabudni na to* / *to nie* | vymaže predchádzajúcu vetu |
| *ignoruj posledný riadok* / *poslednú vetu* / *posledné dva riadky* / *posledné 3 vety* | vymaže N viet |
| *odznova* / *ešte raz od začiatku* | zahodí všetko predtým, platí len to, čo nasleduje |
| *to je blbosť* / *toto vymaž* / *nie, teda…* / *vlastne…* | rozumie Claude podľa kontextu (posledná verzia platí) |
| *nový odsek* / *nový riadok* | zalomenie |
| *pošli to* / *odošli* (na konci) | po vložení stlačí Enter |

Predvolený režim `light` tieto príkazy nevykonáva (aby sa omylom nič nezmazalo) – nechá ich v texte
a vyhodnotí ich session. Režim `rules` ich vykonáva offline po vetách podľa interpunkcie z Whisperu.

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
| `hotkey` | `numpad_decimal` | numpad kláves „,/Del“ pri pravom Enteri (funguje s NumLock aj bez, stlačenie sa pohltí, nič nenapíše). Iné: `vk:NNN` (surový VK kód) alebo pynput reťazec `<f9>`, `<ctrl>+<shift>+<f9>`. Pozor: Ctrl+Alt+písmeno je na SK klávesnici AltGr a píše znak. `mode: "hold"` = drž kláves, `toggle` = stlač/stlač |
| `language` | `sk` | jazyk pre Whisper |
| `stt.model` | `large-v3-turbo` | najlepšia kvalita SK: `large-v3` (pomalšie, ideálne GPU); rýchle: `medium` |
| `stt.device` / `compute_type` | `auto` | `auto` vyberie GPU, ak je NVIDIA karta; keď chýbajú CUDA knižnice, sám sa prepne na CPU/int8. Natvrdo: `cpu` alebo `cuda` + `float16` |
| `stt.backend` | `faster-whisper` | `openai` = Whisper API ako záloha pre slabý počítač (`OPENAI_API_KEY`) |
| `stt.initial_prompt` | tech slovník | slová, ktoré má Whisper „očakávať“ – dopĺňaj názvy projektov, knižníc |
| `audio.silence_auto_stop_seconds` | `0` | napr. `4` = po 4 s ticha zastaví samo (pri premýšľaní nahlas nechaj 0) |
| `cleanup.mode` | `light` | `light` (zadarmo: výplne + interpunkcia, opravy nechá session) · `rules` (offline vykoná príkazy) · `llm` (Claude API, platené) · `none` (surový text) · `auto` (llm ak je kľúč, inak rules) |
| `cleanup.model` | `claude-opus-5` | len pre režim `llm`; `effort: low`; alternatívy `claude-sonnet-5`, `claude-haiku-4-5` |
| `cleanup.replacements` | slovník | fonetické → správne (`"pajton": "Python"`), rozširuj podľa logov |
| `output.marker` | `🎤 ` | prefix, podľa ktorého Claude (CLAUDE.md + hook) spozná diktát |
| `output.auto_enter` | `false` | `true` = odošle vždy hneď (odporúčam nechať `false` a používať „pošli to“) |
| `output.paste_shortcut` | `ctrl+v` | terminály, kde vkladá Ctrl+Shift+V, nastav `ctrl+shift+v` |
| `hook.llm` | `false` | `true` = hook čistí aj cez Claude (pomalšie; hook má limit 30 s) |

(Len pre režim `llm`: volanie má zapnutý server-side fallback `fallbacks: "default"`; pri chybe API
sa vždy použijú pravidlá, diktovanie nikdy nespadne.)

## GPU (NVIDIA) – voliteľné, ale 5–10× rýchlejší prepis

faster-whisper na GPU potrebuje CUDA 12 + cuDNN 9. Netreba inštalovať CUDA Toolkit, stačia pip balíky:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-gpu.txt
```

diktat si ich DLL priečinky (`site-packages\nvidia\cublas\bin`, `...\cudnn\bin`) sám pridá na PATH.
Bez nich sa pri prvom prepise objaví `Library cublas64_12.dll is not found` – daemon to zachytí,
prepne sa na CPU/int8 a pokračuje (v konzole uvidíš varovanie). Ak GPU nechceš riešiť, nastav v
`config.json` `"stt": {"device": "cpu"}` a varovanie zmizne.

## Riešenie problémov

- **„odoslané ctrl+v“, ale v okne nič** – text ostal v schránke, stlač Ctrl+V ručne. V konzole je riadok
  `vkladám (ctrl+v) do okna '…' (app.exe)` – skontroluj, že je to naozaj okno Claude Code a že kurzor bol
  v textovom poli. Ak cieľová aplikácia beží „ako správca“, Windows simulované klávesy z bežného programu
  zahodí – spusti aj diktat ako správca (PowerShell → Spustiť ako správca). Niektoré terminály vkladajú
  cez `ctrl+shift+v` alebo `shift+insert` (viď `output.paste_shortcut`).
- **Skratka nereaguje** – iná aplikácia ju má obsadenú alebo klávesnica nemá numpad; zmeň `hotkey` (napr. `<f9>`).
  Ak beží Claude Code s `/voice`, vypni ho (`/voice off`), nech si nekonkurujú.
- **Zlá kvalita prepisu** – hovor bližšie k mikrofónu, skús `stt.model: "large-v3"`, doplň
  `initial_prompt` o slová, ktoré Whisper komolí, a pridaj náhrady do `cleanup.replacements`.
- **Pomalé** – CPU + turbo je hranica; zapni GPU (sekcia vyššie) alebo `stt.backend: "openai"`.
- **`cublas64_12.dll` / `cudnn64_9.dll` not found** – chýbajú CUDA knižnice; viď sekcia GPU. Diktovanie medzitým beží na CPU.
- **Claude Code hook „timed out“** – nechaj `hook.llm: false` (čistenie robí daemon).
- **Kontrola, že globálne nastavenie sedí** – `python install.py --dry-run`; v Claude Code `/hooks`
  ukáže zaregistrovaný `UserPromptSubmit`, `/diktat` musí byť v zozname skillov.

## Testy

Bez mikrofónu, bez API, stdlib `unittest` (rovnako ako zvyšok repa):

```bash
python -m unittest tests.test_diktat_cleanup tests.test_diktat_hook tests.test_diktat_install
```

Čo bolo overené kde:

| Časť | Overené |
|---|---|
| čistenie (`light`/`rules`), „pošli to“, značka 🎤, „odznova“ | unit testy + ukážky na 3 diktátoch (cloud session) |
| hook `UserPromptSubmit` (samostatný proces, JSON ako od Claude Code) | unit testy (cloud session) |
| inštalátor (CLAUDE.md, skill, hook, settings.json, uninstall, dry-run) | unit testy v dočasnom adresári (cloud session) |
| Whisper prepis slovenčiny, mikrofón, hotkey, vloženie Ctrl+V | **zatiaľ nie** – cloud session nemá mikrofón a huggingface.co (model) blokuje sieťová politika → otestuj na Windows podľa postupu nižšie |

Prvý test na Windows (5 minút):

1. `setup_windows.bat` (bez `install.py` – ten spusti až keď si spokojný; setup ho volá, môžeš ho pri otázke prerušiť alebo potom `python install.py --uninstall`).
2. `python app.py --text "hmm chcem aby si ehm pridal testy, škrtni to, pridaj testy na slug, pošli to"` → musí vypísať vyčistený text s `Enter=True`.
3. `run_diktat.bat`, otvor **Poznámkový blok**, klikni doň, Ctrl+Alt+D, povedz pár viet po slovensky s pauzami, Ctrl+Alt+D → text sa má objaviť v Poznámkovom bloku. Tým máš overený mikrofón + Whisper + vkladanie.
4. To isté do okna Claude Code. Až potom `python install.py`, aby session rozumela značke 🎤.

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
├── requirements.txt
└── requirements-gpu.txt   voliteľné CUDA knižnice pre NVIDIA GPU
```

## Čo ďalej (nápady, zatiaľ nerobené)

- Overlay okno s priebežným prepisom namiesto konzoly.
- Vlastný slovník názvov z aktuálneho repa (názvy súborov/funkcií) automaticky do `initial_prompt`.
- Diktovanie z mobilu (hlasová poznámka → `app.py --file`), prípadne cez Claude Code Remote.
