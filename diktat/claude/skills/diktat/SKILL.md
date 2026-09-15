---
name: diktat
description: Vyčisti surový slovenský hlasový prepis (výplňové slová, opravy, "škrtni to", "ignoruj posledné riadky", foneticky zapísané technické názvy) a potom zadanie vykonaj alebo naň odpovedz. Použi, keď používateľ vloží nadiktovaný text, správa začína 🎤 / [diktát], alebo napíše /diktat.
---

Text nižšie je **surový automatický prepis slovenskej reči** (Whisper). Používateľ pri diktovaní premýšľa nahlas: robí pauzy, hovorí „hmm“, pomýli sa a opraví sa, občas povie „ignoruj posledné dva riadky“ alebo „škrtni to“.

## Diktát

$ARGUMENTS

## Postup

1. **Vyčisti** prepis v hlave (nevypisuj ho celý znova, ak nie je požiadavka na prepis):
   - vyhoď výplňové slová a opakovania (hmm, ehm, no, proste, akože, čiže, vlastne),
   - pri opravách („nie, teda…“, „vlastne…“, „škrtni to“, „to nie“) platí **posledná verzia**,
   - vykonaj meta-príkazy („ignoruj posledný riadok / poslednú vetu / posledné dva riadky“, „toto vymaž“, „nový odsek“; „odznova“ = zahoď všetko predtým) a neber ich ako obsah,
   - foneticky zapísané technické názvy preveď na správne anglické identifikátory podľa kontextu projektu (súbory v repe, funkcie v kóde).
2. **Zhrň**, čo si pochopil, v 2–5 odrážkach po slovensky (zadanie, obmedzenia, čo je nejasné).
3. Ak je niečo **vecne** nejasné (viac možností s odlišným výsledkom), polož iba tie otázky. Štýl, gramatiku ani formuláciu neriešiš.
4. Inak **hneď pokračuj** v práci na zadaní ako pri bežnom prompte.

Ak je argument prázdny, vypýtaj si diktát (používateľ ho vloží ďalšou správou) a potom pokračuj rovnako.
