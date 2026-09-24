# diktat — diktovanie do Claude Code (inštalácia)

Hovoríš do mikrofónu, text sa prepíše a vloží do Claude Code. Po slovensky, lokálne na tvojom počítači
(Whisper `large-v3-turbo`), **bez API kľúča a bez posielania zvuku kamkoľvek**. K tomu malý panel v rohu,
ktorý ukazuje, ktoré Claude sessions práve pracujú, ktoré sa ťa na niečo pýtajú a ktoré sú hotové.

---

## Čo potrebuješ

- **Windows 10/11.** (Na macOS a Linuxe kód beží tiež, ale automatické spúšťanie a vkladanie textu je
  odladené len pre Windows.)
- **Python 3.10 alebo novší**, dostupný v `PATH`. Overíš v termináli: `python --version`.
  Keby nebol: [python.org/downloads](https://www.python.org/downloads/) — pri inštalácii **zaškrtni
  „Add Python to PATH"**.
- **Mikrofón** a **~2 GB miesta** (model sa stiahne pri prvom spustení).
- **Claude Code** (desktopová aplikácia alebo CLI).
- NVIDIA GPU **nie je nutná**. S ňou trvá prepis minúty reči 2–4 sekundy, bez nej 15–40 sekúnd.

---

## Inštalácia — nechaj to spraviť Clauda

1. Rozbaľ priečinok **`diktat`** kamkoľvek, kde ho necháš (napr. `C:\Users\<ty>\diktat`).
   Neskôr sa nedá len tak presunúť — inštalácia si jeho cestu zapamätá.
2. Otvor v tom priečinku **Claude Code**.
3. Vlož mu túto správu:

```
Nainštaluj mi diktat z tohto priečinka podľa INSTALACIA.md, sekcia „Postup pre Clauda".
Som na Windows. Po každom kroku mi povedz, či prešiel.
```

Keby si to chcel spraviť ručne, celý postup je nižšie — sú to dva príkazy.

---

## Postup pre Clauda

Rob tieto kroky po poradí a po každom povedz používateľovi výsledok. Neprechádzaj ďalej, keď krok zlyhal —
napíš, čo presne zlyhalo, a navrhni, čo s tým.

1. **Over Python:** `python --version` musí dať 3.10 alebo viac. Keď príkaz neexistuje, skús `py --version`.
   Keď nie je ani to, povedz používateľovi, nech si nainštaluje Python zo stránky python.org a zaškrtne
   „Add Python to PATH" — ďalej nepokračuj.

2. **Spusti inštaláciu** z priečinka `diktat`:

   ```
   setup_windows.bat
   ```

   Spraví virtuálne prostredie, stiahne závislosti (pár minút), vyrobí `config.json` z `config.example.json`
   a spustí `install.py`. Keby `.bat` nešiel, to isté ručne:

   ```
   python -m venv .venv
   .venv\Scripts\python.exe -m pip install -r requirements.txt
   copy config.example.json config.json
   .venv\Scripts\python.exe install.py
   ```

3. **Zapni automatické spúšťanie:**

   ```
   .venv\Scripts\python.exe install.py --autostart
   ```

4. **Over, že je všetko na mieste:**

   ```
   .venv\Scripts\python.exe app.py --diag
   ```

   V rozsiahlom výpise musia byť tieto riadky v poriadku:
   - `hooky: UserPromptSubmit=áno, SessionStart=áno, Notification=áno, Stop=áno, SessionEnd=áno`
   - `úloha diktat-watch` existuje
   - `grafika:` — keď tam je NVIDIA, prepis pôjde na GPU

5. **Spusti diktat:** dvojklik na odkaz **Diktat** na ploche (inštalácia ho vytvorí), alebo
   `run_diktat.bat`. Prvý štart trvá dlhšie — sťahuje sa model (~1,5 GB).

6. **Povedz používateľovi, že má reštartovať Claude Code**, inak nové hooky nenačíta.

7. **Skúška:** nech klikne do okna Claude Code, stlačí na numerickej klávesnici **`,` / `Del`**
   (pri pravom Enteri), povie vetu a stlačí skratku znova. Text sa vloží do promptu.

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

## Ako sa to používa

- **numpad `,` / `Del`** — začni hovoriť. Tá istá skratka = stop. Text sa vloží do okna Claude Code.
- Hovor normálne: rob pauzy, pomýľ sa, oprav sa („nie, teda…", „škrtni to", „ignoruj poslednú vetu").
  Claude tomu rozumie — postará sa o to blok pravidiel v `CLAUDE.md`.
- **Prúžok dole v strede** ukazuje, čo sa deje: modrá = načítavam model, červená = nahrávam (s časom
  a hlasitosťou), oranžová = prepisujem, zelená = vložené.
- **Panel v rohu okna Claude** ukazuje tvoje sessions a čo robia. Názvy sú tie z bočného zoznamu chatov.
  Klik na riadok otvorí ten chat, krížik riadok zavrie.
- **Ikona v lište** — kalibrácia mikrofónu, diagnostika, zapnutie/vypnutie panela, ukončenie.
- Diktat sa **sám vypne**, keď zavrieš Claude aj prehliadač, a sám sa zapne, keď ich otvoríš.

---

## Keď niečo nejde

Najprv dvojklik na **`diagnostika.bat`** — skopíruje stav do schránky, vlož ho Claudovi (Ctrl+V) a nechaj
ho, nech to prečíta. Najčastejšie:

- **Skratka nereaguje** → beží diktat? (ikona v lište) Keď nie, dvojklik na odkaz **Diktat** na ploche.
- **Text sa neobjaví, hoci prepis prebehol** → je v schránke, stlač Ctrl+V. Keď okno Claude beží „ako
  správca", spusti tak aj diktat.
- **Panel nič neukazuje** → session hlási stav až po reštarte Claude Code; zavri a otvor ho.
- **Prepis je pomalý** → ide po CPU. `--diag` v riadku `grafika:` povie, či sa našla NVIDIA; pre GPU je
  postup v `README.md`.

Podrobnosti ku všetkému sú v [`README.md`](README.md) — je po slovensky.
