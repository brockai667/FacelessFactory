<!-- diktat:begin -->
## Diktovaný vstup (hlas → text, slovenčina)

Používateľ často **diktuje** po slovensky cez nástroj `diktat` (Whisper). Správa začínajúca `🎤`, `[diktát]` alebo `[d]` je automatický prepis reči, nie napísaný text. Platí to v každom projekte a každej session.

- **Výplňové slová ignoruj**: hmm, ehm, no, proste, akože, čiže, vlastne, opakovania, zakoktania. Nie sú obsah.
- **Opravy**: „nie, teda…“, „vlastne…“, „pardon“, „škrtni to“, „zruš to“, „zabudni na to“, „to nie“ – platí **posledná verzia** myšlienky, predchádzajúcu neber do úvahy.
- **Meta-príkazy vykonaj, nekomentuj**: „ignoruj posledný riadok / poslednú vetu / posledné dva riadky“, „ignoruj to, čo som povedal o X“, „toto vymaž“, „to je blbosť“, „nový odsek“. **„Odznova“ / „ešte raz od začiatku“** = všetko pred tým zahoď, platí len to, čo nasleduje. Nikdy ich neber ako súčasť zadania.
- **Chyby prepisu**: zle rozpoznané slová, chýbajúca diakritika, anglické názvy súborov/funkcií/knižníc napísané foneticky („pajton“ = Python, „git komit“ = git commit, „džejsón“ = JSON, „klaud kód“ = Claude Code). Odvoď správny názov z kontextu projektu (názvy súborov v repe, funkcie v kóde). Ak existuje viac vecne odlišných možností, spýtaj sa – ale len na to.
- **Dlhé diktáty**: ak je zadanie dlhé alebo obsahuje viac krokov, najprv v 2–5 odrážkach zhrň, čo si pochopil (po slovensky), a hneď pokračuj v práci – nečakaj na potvrdenie, pokiaľ nejde o nezvratnú akciu.
- **Štýl neriešiť**: nepýtaj sa na formuláciu, gramatiku ani „či to bolo myslené vážne“. Pýtaj sa iba na vecné nejasnosti, ktoré by viedli k inému výsledku.
- Odpovedaj po slovensky, kód a technické identifikátory nechaj anglicky.

## Hlasové zhrnutie (stránka „Diktat hlas“)

Používateľ má otvorenú stránku, ktorá nahlas číta krátke zhrnutia; často sa na obrazovku nepozerá. Na **konci každej finálnej odpovede** (nie počas práce, nie po každom nástroji) zapíš hovorené zhrnutie nástrojom `ArtifactData`:

- `action`: `set`, `url`: `https://claude.ai/artifact/JMFcBx818yHi1kpJcNaA7h`, `collection`: `hlas`, `doc_id`: `<YYYYMMDDTHHMMSSZ>-<4 náhodné písmená>` (UTC),
- `data`: `{"ts": "<UTC ISO 8601, napr. 2026-09-16T16:36:00Z>", "text": "<1–3 vety>", "session": "<názov projektu alebo témy>"}`; voliteľne `"detail": "<dlhšia verzia>"`, keď má význam.

Ako písať `text`: hovorová slovenčina, ako keby si to hovoril kolegovi cez rameno. Bez markdownu, bez kódu, bez ciest k súborom, bez čísel verzií a bez zoznamov. Len výsledok: čo je hotové, čo má problém a koľko riešení máš, na čo čakáš. Vzor: „A je hotové. B malo problém, mám dve riešenia, sú v texte.“ Podrobnosti sú v písanej odpovedi, do hlasu nepatria. Ak si sa niečo pýtal, otázku povedz aj hlasom (krátko). Ak používateľ výslovne požiada „prečítaj mi to“, „povedz mi podrobnosti“ alebo „čo bol ten problém“, daj do `text` dlhšiu verziu (do minúty hovorenia). Ak zápis zlyhá, odpoveď tým nezdržuj, len pokračuj.
<!-- diktat:end -->
