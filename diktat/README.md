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
 1. Whisper (faster-whisper large-v3-turbo, jazyk sk, lokálne, offline, zadarmo) – beží UŽ POČAS
                rozprávania: audio sa v pauzách reže na kúsky (~15 s) a prepisuje v pozadí, po stope
                sa dorobí len posledný kúsok (aj pri polhodinovom diktáte čakáš pár sekúnd)
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

Dva spôsoby behu:

```powershell
.\run_diktat.bat                       # v konzole (vidíš, čo sa deje) – na ladenie
.\.venv\Scripts\python.exe install.py --autostart   # skrytý beh s ikonou v lište + autoštart po prihlásení
```

Po `--autostart` vznikne `diktat_tray.vbs` v priečinku diktat (dvojklik = spusti hneď teraz, bez okna)
a jeho kópia v priečinku „Po spustení“ Windows, takže po každom prihlásení už diktat beží. Pri hodinách
je ikona: **sivá** = pripravený, **červená** = nahráva, **žltá** = prepisuje, fialová = chyba.
Navrchu obrazovky sa pri každej akcii objaví prúžok: „štartujem“, „🔴 NAHRÁVAM 0:12“, „📝 prepisujem… časť 2“,
„✅ vložené 239 znakov“ (neberie fokus, vypnúť: `overlay.enabled: false`).
Pravý klik na ikonu → „Otvoriť log“ / „Aktualizovať a reštartovať“ (git pull + závislosti + nový štart, bez PowerShellu)
/ „Ukončiť diktat“. To isté spraví dvojklik na `update_diktat.bat`. Výpis ide do `logs/diktat.log`.
Zrušenie autoštartu: `install.py --no-autostart`.

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
| *pošli to* / *odošli* / *poslať* / *enter* (na konci, aj s „prosím“) | po vložení stlačí Enter |

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

## Hlas naspäť: Claude ti povie, čo spravil („Diktat hlas“)

Opačný smer diktovania. Stránka **Diktat hlas** (https://claude.ai/artifact/JMFcBx818yHi1kpJcNaA7h) číta nahlas krátke zhrnutia,
ktoré každá Claude Code session zapíše na konci odpovede do zdieľanej schránky stránky (`ArtifactData`,
kolekcia `hlas`). Pravidlo pre sessions je v bloku `Hlasové zhrnutie` v `~/.claude/CLAUDE.md` (nainštaluje
`install.py`, obnovuje `update_diktat.bat`). Hlas dostane len výsledok („A hotové, B malo problém, mám dve
riešenia“), plný text ostáva v Claude na čítanie; na požiadanie („prečítaj mi to“) session pošle viac.

**Hlas z počítača (odporúčané).** Kvalitné slovenské hlasy sú tie z FacelessFactory pipeline – Microsoft
neurónové hlasy cez `edge-tts` (Lukáš, Viktória, plus viacjazyčné, ktoré po slovensky tiež hovoria), zadarmo,
bez inštalácie Edge. Stránka ich používa cez lokálny MCP server `hlas/mcp_server.py` (nástroj `speak`),
ktorý `update_diktat.bat` zaregistruje do Claude desktop (`install.py --mcp`; potom **reštartuj Claude**).
Funguje, keď je stránka otvorená **v aplikácii Claude** (v prehliadači Claude k lokálnym MCP serverom
nemá prístup – tam číta hlas prehliadača). Pri prvom čítaní sa Claude spýta, či stránka smie použiť
„diktat“ – povoľ.

**Výber hlasu:** dvojklik `hlas_ukazky.bat` – spýta sa, ktoré hlasy chceš (1 Microsoft, 2 Cartesia, 3 ElevenLabs,
4 Google), pri službách s kľúčom si ho prvýkrát vypýta (vložíš Ctrl+V), každý hlas sa predstaví, napíšeš číslo a
uloží sa do `config.json` (sekcia `hlas`). Rýchlosť: `hlas.rate` (napr. `+10%`). Zadarmo bez kľúča (Microsoft
edge-tts) sú pre slovenčinu len Lukáš a Viktória; prirodzenejšie slovenské hlasy majú tieto služby:

| Engine | Ako | Cena | Karta? |
|---|---|---|---|
| `edge` | predvolené, bez kľúča a účtu | zadarmo, bez limitu | nie |
| `cartesia` | voľba 2, kľúč z play.cartesia.ai (registrácia e-mailom → API Keys) | 20 000 znakov/mesiac zadarmo, potom od 5 $/mes | nie |
| `elevenlabs` | voľba 3, kľúč z elevenlabs.io (registrácia e-mailom → profil → API Keys) | 10 000 znakov/mesiac zadarmo, potom od 5 $/mes | nie |
| `google` | voľba 4, kľúč podľa návodu nižšie | 1 mil. znakov/mesiac zadarmo, potom 30 $/mil. | **áno** (aj pre bezplatný limit) |

**Záložný hlas:** keď hlavný engine zlyhá (minutý mesačný limit, výpadok služby, zlý kľúč), zhrnutie prečíta
`hlas.fallback_engine` (predvolene `edge`, teda Microsoft; hlas `hlas.fallback_voice`, prázdne = `hlas.voice`).
Nič sa nestratí, len to chvíľu hovorí iný hlas; `logs/hlas.log` napíše prečo. `""` = bez zálohy.

**Hlas bez karty (Cartesia alebo ElevenLabs), krok za krokom:**

1. Cartesia: otvor [play.cartesia.ai](https://play.cartesia.ai) → **Sign up** (Google účet alebo e-mail a heslo).
   ElevenLabs: [elevenlabs.io](https://elevenlabs.io) → **Sign up** rovnako. Kartu nepýtajú, bezplatný plán je trvalý.
2. Cartesia: v ľavom menu **API Keys** → **Create API Key** (názov `diktat`) → skopíruj kľúč (začína `sk_car_`).
   ElevenLabs: vľavo dole klikni na svoje meno/profil → **API Keys** → **Create API Key** → skopíruj (začína `sk_`).
   Kľúč sa ukáže len raz; ak ho stratíš, vytvor nový.
3. Na PC dvojklik `hlas_ukazky.bat` → voľba **2** (Cartesia) alebo **3** (ElevenLabs) → vlož kľúč (Ctrl+V) → Enter.
   Hlasy sa predstavia (rodné slovenské prvé, ostatné hovoria po slovensky s prízvukom), napíš číslo. Kľúč ostane
   v `config.json` (nejde do gitu).

Mesačný limit: jedno zhrnutie má ~200 znakov, Cartesia = ~100 zhrnutí/mesiac, ElevenLabs = ~50. Keď sa minie,
číta záložný Microsoft hlas a od nového mesiaca zas ten vybraný. Bezplatné plány sú len na osobné použitie.

Kľúč sa ukladá do `config.json` (je v `.gitignore`), alebo do env `ELEVENLABS_API_KEY` / `GOOGLE_TTS_API_KEY`.

**Google kľúč krok za krokom** (raz, asi 10 minút; Google chce aj pri bezplatnom limite priradenú platobnú
kartu, krátke zhrnutia sa do limitu 1 mil. znakov mesačne zmestia mnohonásobne):

1. Otvor [console.cloud.google.com](https://console.cloud.google.com) a prihlás sa Google účtom. Prvýkrát odsúhlas
   podmienky (Terms of Service → **Agree and continue**).
2. Ak sa ponúkne bezplatná skúška (**Start free** / **Activate**, 300 $ kreditu), zober ju: vyplní sa krajina,
   typ účtu (Individual) a karta. Kartu Google overí, ale neúčtuje, kým sám nezapneš platený účet. Ak sa neponúkne,
   účtovanie zapneš cez ☰ menu → **Billing** → **Link a billing account** / **Create billing account**.
3. Projekt: hore vľavo vedľa loga je výber projektu; ak tam nič nie je, klikni naň → **New project** → názov
   napr. `diktat` → **Create** a vyber ho.
4. Zapni API: otvor [console.cloud.google.com/apis/library/texttospeech.googleapis.com](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com)
   (alebo ☰ → **APIs & Services** → **Library**, hľadaj „Cloud Text-to-Speech API“) → **Enable**. Ak pýta
   účtovanie, dokonči krok 2.
5. Kľúč: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   (☰ → **APIs & Services** → **Credentials**) → **+ Create credentials** → **API key**. Zobrazí sa kľúč
   začínajúci `AIza…` → **Copy**.
6. Odporúčané obmedzenie (aby kľúč nešiel použiť na nič iné): v zozname klikni na nový kľúč → **API restrictions**
   → **Restrict key** → zaškrtni **Cloud Text-to-Speech API** → **Save**.
7. Na PC dvojklik `hlas_ukazky.bat` → voľba **2** → vlož kľúč (Ctrl+V) → Enter. Predstavia sa Achird a Achernar,
   napíš číslo. Kľúč ostane v `config.json` (nejde do gitu), už ho nebudeš zadávať.

Ak niečo zlyhá, sampler vypíše, čo chýba (kľúč nesedí / API nezapnuté / účtovanie). Nové API po zapnutí
niekedy nabehne až o minútu.

**Slovenské hlasy, ktoré sme našli (stav 09/2026):**

- **Google Chirp 3 HD** – najnovšia generácia Google hlasov, slovenčina `sk-SK` má mužský *Achird* a ženský
  *Achernar* (názvy `sk-SK-Chirp3-HD-Achird`, `sk-SK-Chirp3-HD-Achernar`); `hlas_ukazky.bat --engine google`
  ich ponúka ako prvé. Prvý milión znakov mesačne zadarmo (krátke zhrnutia sa doň zmestia), potom 30 $/mil.
- **Cartesia Sonic 3** – slovenčina podporovaná (kód `sk`), každý hlas z katalógu vie hovoriť po slovensky; bezplatný
  plán 20 000 znakov/mesiac bez karty. Zabudované (`cartesia`).
- **ElevenLabs** (model v3 / `eleven_multilingual_v2`) – slovenčina podporovaná, najprirodzenejšie; bezplatný plán
  10 000 znakov/mesiac bez karty, ďalej platené. Zabudované (`elevenlabs`).
- **Microsoft edge-tts** – po slovensky bez prízvuku len Lukáš a Viktória; viacjazyčné hlasy (Vivienne, Ava,
  Andrew, Brian…) znejú prirodzene, ale s cudzím prízvukom.
- **Higgs Audio V3 TTS** (github.com/boson-ai, open weights, 102 jazykov vrátane slovenčiny) – jediný lokálny
  kandidát s peknou slovenčinou; potrebuje ~10 GB VRAM (prakticky 16 GB) a licencia je len na nekomerčné
  použitie. Zatiaľ nie je v diktate zabudovaný.
- **RHVoice** – slovenčina zadarmo, ale staršia technológia (robotickejší ako Lukáš). **Gemini TTS** (Google AI
  Studio, bez karty) slovenčinu v zozname 24 jazykov nemá.

**Bez MCP** číta stránka hlasom prehliadača: v Edge sú neurónové slovenské hlasy zadarmo, v Chrome/Opere
a v okne Claude je len základný „Microsoft Filip“ z Windows. Klikni **Zapnúť hlas** (prehliadač bez
kliknutia nehovorí). Na stránke je história posledných správ, „Prehrať“ a „Prečítať celé“ (dlhšia verzia,
ak ju session poslala), rýchlosť a hlasitosť; drží posledných 40 správ.

## Panel: ktoré sessions bežia a čo robia

V pravom hornom rohu okna Claude (pod krížikom a zmenšením) je malý panel so zoznamom Claude Code
sessions na tomto počítači:

```
Claude session
● curio engine · pýta sa ťa
● redesign · hotovo
● epizodar · pracuje
```

Bodka pri „pracuje“ a „pýta sa ťa“ jemne dýcha (oranžová rýchlejšie), hotové svietia stálou zelenou.
Text sa prekresľuje len pri skutočnej zmene, takže panel nebliká. Čas v stave sa nezobrazuje;
zapneš ho `panel.show_time: true`.

- 🔵 **pracuje** – session dostala prompt a pracuje;
- 🟠 **pýta sa ťa** – čaká na povolenie nástroja alebo na tvoju odpoveď;
- 🟢 **hotovo** – dohovorila, čaká na teba (zmizne po `panel.done_keep_minutes`, predvolene 30 min).

Zoradené je to podľa toho, čo potrebuje teba: najprv „pýta sa ťa“, potom „hotovo“, potom „pracuje“.
Názov riadku je **prvá ľudská správa session** – teda to, ako sa chat volá v zozname chatov. Systémové
správy (`<task-notification>`, `<system-reminder>`, hlásenia o prerušení) sa za názov nepovažujú; keď
session taký prompt dostane ako prvý, názov sa dočíta z jej prepisu (`transcript_path`). Až keď sa nedá
zistiť nič, je tam názov priečinka. Dve session s rovnakým názvom dostanú číslo: „Dokumenty (2)“.

**Panel je plávajúci:** chyť ho myšou a presuň, kam chceš – poloha sa uloží do `config.json`
(`panel.x`, `panel.y`) a panel tam ostane aj po reštarte. **Dvojklik naň** ho vráti pod tlačidlá okna
Claude. Kým je „zavesený“ na okne Claude, schová sa, keď Claude nie je vidieť; presunutý panel je vidno
vždy. Zapnúť/vypnúť sa dá v ikone v lište („Panel session“).

**Ako to vie.** Každá session hlási stav cez hooky Claude Code (`SessionStart`, `UserPromptSubmit`,
`Notification`, `Stop`, `SessionEnd`), ktoré registruje `install.py`. Hook zapíše jeden malý JSON súbor do
`~/.claude/diktat/sessions/` a skončí; panel ten priečinok číta raz za sekundu. Žiadny server, žiadne
čítanie histórie konverzácií. Po inštalácii **reštartuj Claude**, nové sessions hooky načítajú samy.

Vidno len sessions z tohto počítača (CLI, desktop app, VS Code). Sessions bežiace v cloude
(claude.ai/code) hooky nespúšťajú, takže v paneli nie sú.

**Dvojklik `panel_ukazka.bat`** ponúkne tri možnosti: `1` zapne ukážkové session (nech vidíš, ako panel
vyzerá), `2` ich zmaže, `3` spustí kontrolu panela – vypíše, či diktat beží, či sú hooky zaregistrované a
čo sessions práve hlásia, plus vetu, čo s tým. Ukážkové riadky sa volajú „ukážka · …“ a samy zmiznú do
15 minút.

Keď nič nehlási stav, panel ukáže sivý riadok „žiadna session nehlási stav“ – je to dôkaz, že beží.
Úplne ho schováš cez `panel.hide_when_empty: true`.

**Poznám tie názvy?** Riadok ukazuje prvý prompt danej session. Sessions bežiace v cloude
(claude.ai/code) hooky nespúšťajú, takže chat, ktorý máš otvorený vo webe, v paneli nebude – aj keď sa
podobne volá ako niektorý lokálny priečinok.

**Nesedia stavy alebo chýbajú sessions?** Spusti `diagnostika.bat` – vypíše, čo je v priečinku so stavmi
(vrátane toho, čo je ukážka) a či sú hooky zaregistrované v `settings.json` (riadok `hooky:`). Ak je pri
udalosti `NIE`, spusti `update_diktat.bat`. Ak sú všetky `áno` a session tam aj tak nie je, tá session
vznikla ešte pred inštaláciou hookov – stačí ju reštartovať (v Claude ju zavri a otvor znova).

**Pred reštartom Claude** sa hodí vedieť, či niečo nebeží: v ikone v lište je položka **„Môžem reštartovať
Claude?“** – odpovie oznámením („Počkaj, pracuje: epizodar“ / „Môžeš reštartovať…“). To isté z príkazu:
`app.py --restart-check` (návratový kód 0 = môžeš, 1 = ešte sa pracuje). Reštart aplikácie sessions
nezmaže, po zapnutí sa obnovia aj s históriou; preruší len ťah, ktorý práve beží.

## Beží len s Claude (hranie, výkon)

Diktat sa drží sledovaných programov (`follow.processes`, predvolene `claude.exe`, `opera.exe`, `chrome.exe`):

- keď nemá žiadny z nich **otvorené okno** (Chrome na pozadí či Claude schovaný v lište sa nerátajú), diktat sa
  po `follow.exit_after_seconds` (60 s) sám vypne a uvoľní pamäť – prúžok ukáže „💤 diktat sa vypína“;
- žiadny proces nečaká na pozadí: úloha Plánovača úloh Windows **`diktat-watch`** raz za minútu spustí
  `diktat_watch.vbs` (kontrola okien cez PowerShell, ~1 s, skončí). Ak má niektorý zo sledovaných programov
  otvorené okno a diktat nebeží, spustí ho. Zapneš Claude → najneskôr do minúty štartuje diktat (pol minúty načítava model).
  Ten istý mechanizmus vráti diktat aj po aktualizácii.

Prázdny zoznam = diktat sa spúšťa priamo pri prihlásení a beží stále. Nastavuje `install.py --autostart`
(volá ho aj `update_diktat.bat`); okamžitý štart ručne: dvojklik na odkaz **Diktat** na ploche (vytvorí ho
inštalácia) alebo na `diktat_tray.vbs` v priečinku `diktat`. Úlohu vidíš v Plánovači
úloh (taskschd.msc), zrušenie: `install.py --no-autostart`.

## Len môj hlas (kolegovia, hudba v pozadí)

Mikrofón zachytí aj ľudí 2–3 m ďaleko. Hlasitostná brána to rieši: bloky tichšie ako prah sa ešte pred
prepisom nahradia tichom, takže vzdialené hlasy a hudba sa do textu nedostanú a ostane len to, čo je
dosť hlasné – ty z pracovnej vzdialenosti. Prah nehádaj, odmeraj ho:

- ikona pri hodinách → **„Kalibrovať mikrofón (len môj hlas)“**, alebo v konzole `python app.py --calibrate`
- 1/2: 5 s **hovor normálne** z miesta, kde pracuješ (prúžok odpočítava)
- 2/2: 5 s **mlč** – nech medzitým hovoria ostatní alebo hrá hudba tak, ako to býva

Výsledok (reč vs. ruch, navrhnutý prah) sa uloží do `config.json` ako `audio.gate_rms` a platí hneď.
Ak boli reč a pozadie blízko seba, kalibrácia to povie, ale hodnotu uloží – vyskúšaj v praxi a dolaď z menu
ikony → **Brána**: prísnejšia (+25 %), miernejšia (−20 %), vypnúť. Počas nahrávania prúžok ukazuje hlasitosť
(`▮▮▮▯▯ ✓` = nad bránou, ide do prepisu; `·` = pod bránou, vymaže sa). Ak mikrofón vo Windows má zapnuté
automatické zosilnenie (AGC), vzdialené zvuky zosilňuje a brána stráca účinnosť – vypína sa vo vlastnostiach
mikrofónu (Zvuk → Nahrávanie → Mikrofón → Vlastnosti). Rovnako hlasné zdroje brána oddeliť nevie. Brána púšťa len zvuk hlasný aspoň 0,2 s v kuse (osamotené
špičky – úder, výkrik z diaľky – vymaže) a úseky, pri ktorých si Whisper nie je istý, sa zahodia.

## Konfigurácia (`config.json`)

| Kľúč | Default | Poznámka |
|---|---|---|
| `hotkey` | `numpad_decimal` | numpad kláves „,/Del“ pri pravom Enteri (funguje s NumLock aj bez, stlačenie sa pohltí, nič nenapíše). Iné: `vk:NNN` (surový VK kód) alebo pynput reťazec `<f9>`, `<ctrl>+<shift>+<f9>`. Pozor: Ctrl+Alt+písmeno je na SK klávesnici AltGr a píše znak. `mode: "hold"` = drž kláves, `toggle` = stlač/stlač |
| `language` | `sk` | jazyk pre Whisper |
| `stt.model` | `large-v3-turbo` | najlepšia kvalita SK: `large-v3` (pomalšie, ideálne GPU); rýchle: `medium` |
| `stt.device` / `compute_type` | `auto` | `auto` vyberie GPU, ak je NVIDIA karta; keď chýbajú CUDA knižnice, sám sa prepne na CPU/int8. Natvrdo: `cpu` alebo `cuda` + `float16` |
| `stt.backend` | `faster-whisper` | `openai` = Whisper API ako záloha pre slabý počítač (`OPENAI_API_KEY`) |
| `stt.initial_prompt` | tech slovník | slová, ktoré má Whisper „očakávať“ – dopĺňaj názvy projektov, knižníc |
| `stt.chunk_seconds` | `15` | priebežný prepis: po ~15 s hľadá pauzu a odreže kúsok na prepis v pozadí; `0` = prepis až po stope |
| `stt.chunk_max_seconds` | `30` | ak pauza nepríde, odreže natvrdo |
| `panel.enabled` | `true` | panel so stavom sessions v pravom hornom rohu okna Claude |
| `panel.offset_y` / `margin_right` | `44` / `12` | posun pod tlačidlami okna; ak ti prekáža, zväčši `offset_y` |
| `panel.follow_window` | `true` | `false` = panel drží pravý horný roh obrazovky aj bez okna Claude |
| `panel.x` / `panel.y` | `null` | kam si panel presunul myšou; dvojklik naň ich zmaže (späť k oknu Claude) |
| `panel.max_rows` | `8` | koľko sessions naraz |
| `panel.hide_when_empty` | `false` | `true` = keď nič nehlási stav, panel nie je vidno vôbec |
| `panel.font_size` | `11` | veľkosť písma panela |
| `panel.show_time` | `false` | `true` = aj ako dlho je session v tomto stave |
| `panel.animate_ms` | `160` | ako často dýchne bodka (vyššie = pokojnejšie a menej CPU, minimum 60) |
| `panel.rect_seconds` | `1.0` | ako často sa panel pozrie, kde je okno Claude |
| `panel.done_keep_minutes` | `30` | ako dlho ostane dokončená session v zozname |
| `tray.notify` | `true` | oznámenia Windows v režime s ikonou |
| `tray.notify_start_stop` | `true` | oznámenie aj pri štarte („Nahrávam“) a konci („prepisujem“), nie len po vložení |
| `audio.silence_auto_stop_seconds` | `0` | napr. `4` = po 4 s ticha zastaví samo (pri premýšľaní nahlas nechaj 0) |
| `audio.gate_rms` | `0` | hlasitostná brána (nastaví kalibrácia); tichšie bloky sa vymažú, `0` = vypnuté |
| `audio.gate_hangover_seconds` | `0.4` | dozvuk po hlasnom bloku, aby sa neodrezali konce slov |
| `stt.min_avg_logprob` | `-1.0` | úseky, kde si Whisper nie je istý (útržky pozadia → nezmysly), sa zahodia; vyššie = prísnejšie |
| `stt.max_no_speech_prob` | `0.7` | úseky, kde Whisper tipuje „nebola reč“, sa zahodia |
| `stt.use_context` | `false` | `true` = modelu sa pošle predchádzajúca veta (lepšia nadväznosť, ale v tichu ju rád zopakuje) |
| `stt.drop_hallucinations` | `true` | zahodí vety vymyslené z titulkov („Ďakujem za pozornosť“, „Titulky vytvoril…“) a doslovné opakovania |
| `stt.hallucination_silence_seconds` | `0` | `2` = Whisper sám preskočí text vymyslený v dlhšom tichu (presnejšie, ale pomalšie) |
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

faster-whisper na GPU potrebuje CUDA 12 + cuDNN 9. Netreba inštalovať CUDA Toolkit, stačia pip balíky,
ktoré inštaluje `update_diktat.bat` (jednorazovo ~700 MB); ručne:

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
- **Daemon „zamrzol“, po stlačení skratky nič** – ak si klikol do okna konzoly, Windows zaplo režim označovania
  textu (v titulku okna je „Select“) a výpis stojí; stlač Esc alebo Enter v tom okne. diktat tento režim pri
  štarte vypína, ale iné terminály (ConEmu, staré cmd) ho môžu mať vlastný.
- **Skratka nereaguje** – iná aplikácia ju má obsadenú alebo klávesnica nemá numpad; zmeň `hotkey` (napr. `<f9>`).
  Ak beží Claude Code s `/voice`, vypni ho (`/voice off`), nech si nekonkurujú.
- **Panel so sessions nič neukazuje** – hooky sa načítajú až v novej session, reštartuj Claude. Skontroluj
  `python install.py --dry-run` a priečinok `~/.claude/diktat/sessions` (má pribudnúť súbor na session).
  Panel sa tiež schová, keď okno Claude nie je viditeľné (`panel.follow_window`).
- **Píše vety, ktoré som nepovedal** – Whisper si v tichu vymýšľa text naučený z titulkov („Ďakujem za
  pozornosť“, „Titulky vytvoril…“) alebo zopakuje predchádzajúcu vetu. diktat takéto úseky zahadzuje
  (`stt.drop_hallucinations`) a modelu už neposiela predchádzajúci text (`stt.use_context: false`).
  V logu je riadok `zahodený vymyslený úsek`. Ak to pretrváva, skús `stt.hallucination_silence_seconds: 2`
  a zapni hlasitostnú bránu (`diagnostika.bat` → Kalibrovať), nech do prepisu nejde šum z tichých pasáží.
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
├── install.py             globálna inštalácia do ~/.claude (CLAUDE.md, skill, hook, settings.json), autoštart
├── diktat_watch.vbs       generuje install.py: kontrola „beží Claude?“ pre úlohu Plánovača
├── config.example.json    → skopíruj na config.json (ten je v .gitignore)
├── diktat_core/
│   ├── cleanup.py         pravidlá + Claude (Anthropic SDK), detekcia „pošli to“ a značky 🎤
│   ├── stt.py             faster-whisper (lokálne) / OpenAI Whisper API (záloha)
│   ├── audio.py           nahrávanie (sounddevice), rezanie v pauzách pre priebežný prepis, pípanie
│   ├── inject.py          schránka + Ctrl+V / písanie po znakoch / výpis
│   ├── procs.py           bežiace procesy (follow), kontrola mutexu diktatu
│   └── config.py          config.json + defaulty
├── hook/diktat_hook.py    UserPromptSubmit hook (additionalContext pre prompty so značkou)
├── claude/
│   ├── CLAUDE.diktat.md   blok do ~/.claude/CLAUDE.md
│   └── skills/diktat/     globálny skill /diktat
├── diktat_core/tray.py    ikona v lište (pystray), stavy + oznámenia
├── diktat_core/overlay.py prúžok so stavom navrchu obrazovky (tkinter, bez fokusu)
├── hlas/                  Diktat hlas: stránka (diktat-hlas.html), tts.py (edge-tts), ukazky.py, mcp_server.py
├── hlas_ukazky.bat        výber hlasu (každý sa predstaví)
├── setup_windows.bat · run_diktat.bat · diktat_tray.vbs (vytvorí install.py --autostart)
├── requirements.txt
└── requirements-gpu.txt   voliteľné CUDA knižnice pre NVIDIA GPU
```

## Čo ďalej (nápady, zatiaľ nerobené)

- Overlay okno s priebežným prepisom (text sa objavuje počas rozprávania).
- Vlastný slovník názvov z aktuálneho repa (názvy súborov/funkcií) automaticky do `initial_prompt`.
- Diktovanie z mobilu (hlasová poznámka → `app.py --file`), prípadne cez Claude Code Remote.
