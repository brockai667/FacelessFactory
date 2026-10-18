# diktat — diktovanie do Claude Code (inštalácia)

Hovoríš do mikrofónu, text sa prepíše a vloží do Claude Code. Po slovensky, lokálne na tvojom počítači
(Whisper `large-v3-turbo`), **bez API kľúča a bez posielania zvuku kamkoľvek**. K tomu malý panel v rohu,
ktorý ukazuje, ktoré Claude sessions práve pracujú, ktoré sa ťa na niečo pýtajú a ktoré sú hotové.

---

## Inštalácia — nechaj to spraviť Clauda

1. Rozbaľ priečinok **`diktat`** kamkoľvek, kde ho necháš (napr. `C:\Users\<ty>\diktat`).
   Neskôr sa nedá len tak presunúť — inštalácia si jeho cestu zapamätá.
2. Otvor v tom priečinku **Claude Code**.
3. Vlož mu túto správu. **Do riadku „Skratka" napíš kláves, ktorým chceš diktovanie spúšťať:**

```
Nainštaluj mi diktat z tohto priečinka podľa INSTALACIA.md, sekcia „Postup pre Clauda".

Skratka na diktovanie: numpad decimal
Som na Windows. Po každom kroku mi povedz, či prešiel.
```

Claude si poradí aj keď nemáš Python — doinštaluje ho.

### Akú skratku si môžem vybrať

Napíš ju po svojom, Claude si ju preloží. Čokoľvek z tohto funguje:

| Napíšeš | Čo to je |
|---|---|
| `numpad decimal` | kláves **,/Del** na numerickej klávesnici (vedľa pravého Enteru) — **odporúčané** |
| `numpad enter` | Enter na numerickej klávesnici |
| `F9`, `F8`, `F12` | funkčný kláves |
| `pravý Ctrl`, `pravý Shift`, `alt gr` | kláves vpravo od medzerníka a okolo |
| `Ctrl+Alt+D`, `Shift+F5`, `Win+Shift+S` | kombinácia |
| `scroll lock`, `pause`, `insert` | klávesy, ktoré aj tak nepoužívaš |

Obyčajné písmeno samé o sebe nejde — spúšťalo by sa to pri každom písaní. Inštalátor také zadanie odmietne
a povie ti to.

Dobrá skratka je taká, ktorú inde nepoužívaš: diktat si ju **pohltí**, takže pôvodnú funkciu klávesu už
mať nebudeš. Pri `numpad decimal` to je bodka/Delete na numerike.

---

## Čo potrebuješ

- **Windows 10/11.** (Na macOS a Linuxe kód beží tiež, ale automatické spúšťanie a vkladanie textu je
  odladené len pre Windows.)
- **Python 3.10 alebo novší.** Keď ho nemáš, Claude ho nainštaluje — krok 1 nižšie.
- **Mikrofón** a **~2 GB miesta** (model sa stiahne pri prvom spustení).
- **Claude Code** (desktopová aplikácia alebo CLI).
- NVIDIA GPU **nie je nutná**. S ňou trvá prepis minúty reči 2–4 sekundy, bez nej 15–40 sekúnd.

---

## Postup pre Clauda

Rob tieto kroky po poradí a po každom povedz používateľovi výsledok. Neprechádzaj ďalej, keď krok zlyhal —
napíš, čo presne zlyhalo, a navrhni, čo s tým.

### 1. Python

Over: `python --version` musí dať 3.10 alebo viac. Keď príkaz neexistuje, skús `py --version`.

Keď Python nie je ani jeden, nainštaluj ho:

```
winget install -e --id Python.Python.3.12
```

Keby `winget` na tom počítači nebol (staršie Windows 10 bez App Installera), **nesťahuj nič sám** — povedz
používateľovi, nech si stiahne Python z [python.org/downloads](https://www.python.org/downloads/) a pri
inštalácii **zaškrtne „Add Python to PATH"**. Keď ťa výslovne požiada, aby si to stiahol ty, až potom to urob.

Po inštalácii Pythonu **otvor nový terminál** — do toho pôvodného sa nová `PATH` nedostane a `python`
v ňom stále nebude existovať.

### 2. Inštalácia

Z priečinka `diktat`:

```
setup_windows.bat
```

Spraví virtuálne prostredie, stiahne závislosti (pár minút), pri NVIDIA karte aj CUDA knižnice pre rýchly
prepis, vyrobí `config.json` a spustí `install.py`. Keby `.bat` nešiel, to isté ručne:

```
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
copy config.example.json config.json
.venv\Scripts\python.exe install.py
```

### 3. Skratka

Vezmi to, čo používateľ napísal do riadku „Skratka na diktovanie", a daj to inštalátoru tak, ako to
napísal — rozumie aj „pravý Ctrl" či „F9":

```
.venv\Scripts\python.exe install.py --hotkey "numpad decimal"
```

Keď skratke nerozumie, vypíše to a skončí chybou. Vtedy sa spýtaj používateľa na inú a neinštaluj ďalej
s nefunkčným klávesom.

### 4. Automatické spúšťanie

```
.venv\Scripts\python.exe install.py --autostart
```

### 5. Kontrola

```
.venv\Scripts\python.exe app.py --diag
```

V rozsiahlom výpise musia byť tieto riadky v poriadku:

- `hooky: UserPromptSubmit=áno, SessionStart=áno, Notification=áno, Stop=áno, SessionEnd=áno`
- `úloha diktat-watch` existuje
- `config: … hotkey=…` — sedí s tým, čo si nastavil
- `grafika:` — keď je tam názov karty, prepis pôjde po GPU; keď „nvidia-smi nenájdené", ide po procesore

### 6. Spustenie

Dvojklik na odkaz **Diktat** na ploche (inštalácia ho vytvorí), alebo `run_diktat.bat`. Prvý štart trvá
dlhšie — sťahuje sa model (~1,5 GB).

### 7. Reštart Claude Code

Povedz používateľovi, že má **zavrieť a znova otvoriť Claude Code** — inak nové hooky nenačíta.

### 8. Skúška

Nech klikne do okna Claude Code, stlačí svoju skratku, povie vetu a stlačí ju znova. Text sa vloží
do promptu.

---

## Ako sa to používa

- **Skratka** — začni hovoriť. Tá istá skratka = stop. Text sa vloží do okna Claude Code.
  Nahráva sa **dovtedy, kým skratku nestlačíš znova** — žiadny časový limit.
- Hovor normálne: rob pauzy, pomýľ sa, oprav sa („nie, teda…", „škrtni to", „ignoruj poslednú vetu").
  Claude tomu rozumie — postará sa o to blok pravidiel v `CLAUDE.md`.
- **Prúžok dole v strede** ukazuje, čo sa deje: modrá = načítavam model, červená = nahrávam (s časom
  a hlasitosťou), oranžová = prepisujem, zelená = vložené. Tichý pípanec na začiatku a na konci.
- **Panel v rohu okna Claude** ukazuje tvoje sessions a čo robia. Názvy sú tie z bočného zoznamu chatov.
  Klik na riadok otvorí ten chat, krížik riadok zavrie.
- **Ikona v lište** — kalibrácia mikrofónu, diagnostika, zapnutie/vypnutie panela, ukončenie.
- Diktat sa **sám vypne**, keď zavrieš Claude aj prehliadač, a sám sa zapne, keď ich otvoríš.

### Zmena skratky neskôr

```
.venv\Scripts\python.exe install.py --hotkey "F9"
```

Potom diktat reštartuj (ikona v lište → Ukončiť, dvojklik na odkaz **Diktat**).

---

## Čo to zmení na počítači

Aby to nebolo prekvapenie — inštalátor siaha len sem a všetko sa dá vrátiť:

| Kde | Čo |
|---|---|
| `~/.claude/CLAUDE.md` | pridá blok pravidiel pre diktovaný vstup (medzi značkami `diktat:begin/end`) |
| `~/.claude/skills/diktat/` | skill `/diktat` |
| `~/.claude/hooks/diktat/` | hook, ktorý čistí diktovaný text a hlási stav sessions |
| `~/.claude/settings.json` | zaregistruje tie hooky (predtým spraví zálohu) |
| Plánovač úloh | úloha `diktat-watch` — raz za minútu skontroluje, či beží Claude |
| Priečinok Po spustení | záložný spúšťač, keby úloha v Plánovači vypadla |
| Pracovná plocha | odkaz **Diktat** |

**Aktualizácia:** `update_diktat.bat` skúsi najprv `git pull`. Keď si diktat dostal ako priečinok
(nie cez git), ten krok len zapíše chybu do `logs\update.log` a pokračuje ďalej — preinštaluje
závislosti a reštartuje diktat. Na novú verziu si vypýtaj nový balík.

**Odinštalovanie:** `.venv\Scripts\python.exe install.py --uninstall --no-autostart`, potom zmaž priečinok.

---

## Keď niečo nejde

Najprv dvojklik na **`diagnostika.bat`** — skopíruje stav do schránky, vlož ho Claudovi (Ctrl+V) a nechaj
ho, nech to prečíta. Najčastejšie:

- **Skratka nereaguje** → beží diktat? (ikona v lište) Keď nie, dvojklik na odkaz **Diktat** na ploche.
  Keď beží, skús inú skratku — tú tvoju možno zožiera iný program.
- **Text sa neobjaví, hoci prepis prebehol** → je v schránke, stlač Ctrl+V. Keď okno Claude beží „ako
  správca", spusti tak aj diktat.
- **Panel nič neukazuje** → session hlási stav až po reštarte Claude Code; zavri a otvor ho.
- **Prepis je pomalý** → ide po CPU. `--diag` v riadku `grafika:` povie, či sa našla NVIDIA; pre GPU je
  postup v `README.md`.
- **Prvý diktát po dlhšej pauze trvá ~10 s navyše** → model sa po pol hodine nečinnosti uvoľní z pamäte
  a načítava sa znova. Keď ti to prekáža, daj `"unload_after_seconds": 0` v `config.json`.

Podrobnosti ku všetkému sú v [`README.md`](README.md) — je po slovensky.
