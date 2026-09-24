# Hlasové zhrnutia – VYPNUTÉ 24. 9. 2026

Tento blok bol v `~/.claude/CLAUDE.md` a kázal Claudovi po každej odpovedi zapísať hovorené
zhrnutie na stránku „Diktat hlas“. Používateľ hlas vypol (nedal sa nastaviť tak, ako chcel;
verzia 1 ide bez neho). Keby sa k tomu niekedy vrátil, stačí text nižšie vložiť späť do
`~/.claude/CLAUDE.md`.

---

## Hlasové zhrnutie (stránka „Diktat hlas“)

Používateľ má otvorenú stránku, ktorá nahlas číta krátke zhrnutia; často sa na obrazovku nepozerá. Na **konci každej finálnej odpovede** (nie počas práce, nie po každom nástroji) zapíš hovorené zhrnutie nástrojom `ArtifactData`:

- `action`: `set`, `url`: `https://claude.ai/artifact/JMFcBx818yHi1kpJcNaA7h`, `collection`: `hlas`, `doc_id`: `<YYYYMMDDTHHMMSSZ>-<4 náhodné písmená>` (UTC),
- `data`: `{"ts": "<UTC ISO 8601, napr. 2026-09-16T16:36:00Z>", "text": "<1–3 vety>", "session": "<názov projektu alebo témy>"}`; voliteľne `"detail": "<dlhšia verzia>"`, keď má význam.

Ako písať `text`: hovorová slovenčina, ako keby si to hovoril kolegovi cez rameno. Bez markdownu, bez kódu, bez ciest k súborom, bez čísel verzií a bez zoznamov. Len výsledok: čo je hotové, čo má problém a koľko riešení máš, na čo čakáš. Vzor: „A je hotové. B malo problém, mám dve riešenia, sú v texte.“ Podrobnosti sú v písanej odpovedi, do hlasu nepatria. Ak si sa niečo pýtal, otázku povedz aj hlasom (krátko). Ak používateľ výslovne požiada „prečítaj mi to“, „povedz mi podrobnosti“ alebo „čo bol ten problém“, daj do `text` dlhšiu verziu (do minúty hovorenia). Ak zápis zlyhá, odpoveď tým nezdržuj, len pokračuj.
<!-- diktat:end -->

<!-- setriaci-rezim:start -->
