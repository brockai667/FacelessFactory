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

- **Hlas naspäť** (`diktat/hlas/`): stránka „Diktat hlas“ + MCP server `hlas/mcp_server.py`, enginy
  `edge` (zadarmo), `cartesia`, `elevenlabs`, `google`, záložný hlas pri minutom limite. Používateľ zatiaľ
  hlasy odložil („necháme tak“) – nevracaj sa k tomu, kým to sám nespomenie.
- **Panel so stavom sessions** (`diktat/diktat_core/panel.py` + `sessions.py` + `hook/diktat_session.py`):
  plávajúce okienko v rohu okna Claude, riadky „názov · pracuje / pýta sa ťa / hotovo“, dá sa ťahať myšou
  (poloha v `config.json` → `panel.x`, `panel.y`, dvojklik = späť k oknu Claude).
  Stav hlásia hooky Claude Code (`SessionStart`, `UserPromptSubmit`, `Notification`, `Stop`, `SessionEnd`)
  do `~/.claude/diktat/sessions/<session_id>.json`; panel ten priečinok číta raz za sekundu.

## Otvorená úloha (toto rieš)

**Panel ukazuje iné názvy, než aké má používateľ v bočnom zozname chatov v aplikácii Claude.**
V zozname má napr. „Odisielanie emailov“, „HD Mark marketing pre Helen Doron“, „Rozvrh sync workflow“,
„Curio engine“, „Diktovací systém s podporou…“. Panel ukazuje prvú ľudskú správu session, napr.
„viem si prepojit firemny gma…“. Používateľ chce **presne tie názvy zo zoznamu**.

Čo už vieme:

- Názov chatu si generuje Claude sám; v prepise session (`~/.claude/projects/<slug>/<uuid>.jsonl`) býva
  ako riadok `{"type":"summary","summary":"…"}`, ale **nie vždy** – vtedy padáme na prvú ľudskú správu.
- `sessions.title_from_transcript()` už hľadá súhrn na začiatku aj na konci prepisu a systémové obálky
  (`<task-notification>`, `<system-reminder>`, „Caveat:“) ignoruje (`is_system_text`).
- **Nezistené:** kde presne má názvy uložené aplikácia Claude. Na to je pripravený hľadač:
  `najdi_nazvy.bat "Odisielanie emailov"` (alebo `python app.py --find-title "…"`). Prehľadá
  `~/.claude`, `%APPDATA%\Claude`, `%LOCALAPPDATA%\Claude`, `%LOCALAPPDATA%\AnthropicClaude`
  a vypíše súbory, v ktorých sa text nachádza. Bez parametra vypíše, aké dátové priečinky Claude má.

Postup, ktorý sa ponúka:

1. Spusti hľadač na 2–3 názvy zo zoznamu (rôzne projekty).
2. Podľa nálezu doplň nový zdroj názvov do `diktat_core/sessions.py` (napr. čítanie JSON/LevelDB/SQLite),
   s pamäťou (`_TITLE_CACHE`) a vždy s bezpečným pádom späť na súhrn → prvú správu → názov priečinka.
   Formát je vnútorná vec Claude, takže všetko v `try/except` a bez tvrdých predpokladov.
3. Testy pridaj do `tests/test_diktat_sessions.py` (beží `pytest tests/test_diktat_*.py`).
4. Over naživo: `panel_ukazka.bat` → voľba 3 (kontrola panela), `diagnostika.bat`.

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
