# Odovzdanie práce lokálnej session (diktat + panel)

Tento súbor je pre **Claude Code session bežiacu priamo na počítači používateľa** (Windows,
`C:\Users\damia\FacelessFactory`). Doterajšiu prácu robila cloudová session, ktorá na tento počítač
nevidí – a práve preto sa zasekla posledná úloha. Prečítaj si to celé a pokračuj.

## Ako sa s používateľom rozprávať

- Odpovedá a diktuje **po slovensky**, odpovedaj po slovensky, bez technického žargónu.
- **Žiadny PowerShell** pri bežnom používaní: všetko má byť dvojklik na `.bat` alebo položka v ikone v lište.
- Nepýtaj sa zbytočne, rob a ukáž výsledok. Keď niečo nevieš overiť, povedz to rovno.
- Commity: vetva `claude/determined-brahmagupta-rqam8m`, správa v angličtine, na konci
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` a riadok `Claude-Session: <odkaz na session>`.
- Po každej finálnej odpovedi zapíš hlasové zhrnutie podľa bloku „Hlasové zhrnutie“ v `~/.claude/CLAUDE.md`.

## Čo je hotové a funguje

`diktat/` je nástroj na diktovanie do Claude Code (Whisper `large-v3-turbo` na GPU, skratka numpad `,/Del`,
prúžok so stavom, ikona v lište, automatický štart cez úlohu Plánovača `diktat-watch`, aktualizácia cez
`update_diktat.bat`). Ďalej:

- **Panel so stavom sessions** (`diktat/diktat_core/panel.py` + `sessions.py` + `hook/diktat_session.py`):
  plávajúce okienko v rohu okna Claude, riadky „názov · pracuje / pýta sa ťa / hotovo“, dá sa ťahať myšou
  (poloha v `config.json` → `panel.x`, `panel.y`, dvojklik = späť k oknu Claude).
  Stav hlásia hooky Claude Code (`SessionStart`, `UserPromptSubmit`, `Notification`, `Stop`, `SessionEnd`)
  do `~/.claude/diktat/sessions/<session_id>.json`; panel ten priečinok číta raz za sekundu.

## Vyriešené: panel ukazuje názvy z bočného zoznamu chatov

Aplikácia Claude si každý chat drží vo vlastnom súbore:

    %APPDATA%\Claude\claude-code-sessions\<id>\<id>\local_<id>.json

Zaujímajú nás z neho dve políčka: **`cliSessionId`** (to isté id, aké hlásia hooky) a **`title`**
(názov z bočného zoznamu – vrátane toho, ktorý si používateľ prepísal ručne; `titleSource` je
`auto` / `user` / `tool`). Pozor, `"title"` je v tom súbore aj v popisoch nástrojov MCP, takže sa
smie brať len ten **vrchný** – na to je `_top_level_fields()`, ktorý do vnorených objektov nelezie.

V `diktat_core/sessions.py` to robí `app_titles()` / `app_title()`:
číta len prvých 16 kB každého súboru (majú ~300 kB), prechádza cez `os.scandir` (9 ms, `rglob` bol
150 ms), hotový zoznam platí 4 s a nezmenené súbory preskakuje. Poradie názvov v `read_states()`:
**zoznam v aplikácii → uložený názov → súhrn z prepisu → prvá ľudská správa → názov priečinka.**
Všetko v `try/except`; keby si aplikácia formát prerobila, názov sa ticho doberie postaru.

Priečinok sa dá prepísať cez `DIKTAT_APP_SESSION_DIR` (používajú to testy).
Kontrola: `panel_ukazka.bat` → voľba 3 a `diagnostika.bat` majú riadok „názvy chatov: N z aplikácie“,
`najdi_nazvy.bat` bez parametra vypíše načítané dvojice id → názov.

Pri tom sa ešte zmenilo: názvy sa skracujú na 34 písmen namiesto 28 (`LABEL_CHARS`, panel sa šírkou
prispôsobí), a výpisy do konzoly už nespadnú na písmene, ktoré staré kódovanie nepozná
(`_printable_console()` v `app.py`).

## Ďalšie veci, ktoré používateľ spomenul

- Stav „pracuje“ sa okrem promptu odhaduje aj z toho, že prepis session rastie
  (`sessions.refresh_from_transcript`, okno 25 s). Ak to bude nepresné, dolaď.
- Hotové riadky miznú po 30 minútach (`panel.done_keep_minutes`) – používateľ nadhodil, že by mohli
  miznúť skôr.
- Sessions, ktoré vznikli pred inštaláciou hookov, stav nehlásia, kým ich raz nezavrie a neotvorí.
- Cloudové sessions (claude.ai/code) hooky nespúšťajú, v paneli nebudú – to je v poriadku, len to povedz.

## Rýchla orientácia v kóde

| Súbor | Čo v ňom je |
|---|---|
| `diktat/app.py` | daemon, CLI (`--panel-check`, `--panel-demo`, `--find-title`, `--restart-check`, `--diag`), diagnostika |
| `diktat/diktat_core/sessions.py` | stavy sessions, názvy, čítanie prepisov, triedenie pre panel |
| `diktat/diktat_core/panel.py` | samotné okienko (tkinter, ťahanie myšou, dýchanie bodky) |
| `diktat/diktat_core/procs.py` | hľadanie okna Claude (`WindowTracker`), zoznam procesov |
| `diktat/hook/diktat_session.py` | hook, ktorý zapisuje stav; `hook/diktat_hook.py` rieši diktovanie |
| `diktat/install.py` | inštalácia do `~/.claude` (CLAUDE.md, skill, hooky, úloha Plánovača, odkaz na ploche) |
| `tests/test_diktat_*.py` | testy (jeden test v `test_diktat_procs.py` zlyháva len v Linux kontajneri) |

Podrobnosti sú v `diktat/README.md` (po slovensky, sekcia „Panel: ktoré sessions bežia a čo robia“).
