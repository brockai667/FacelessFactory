# PROGRESS — autonómny beh 2026-07-01

Úloha: napísať unit testy na hlavné čisté funkcie pipeline, nájsť a opraviť zjavné bugy/dead
code/chýbajúci error-handling, doplniť docstringy a README sekciu o behu pipeline. Pracoval som
autonómne, rozhodnutia nižšie.

## Voľba repozitára
V `C:\Users\damia\` je 13 samostatných git repo "faceless factory" projektov (rôzne niche kanály:
HistoryFactory, ScienceFactory, WealthFactory, ...) + `LongFormPilot` + `OpenMontage` (cudzí fork,
iný projekt) + `FacelessDashboard`. Vybral som **`FacelessFactory`** — je to zdrojový/template repo
s kompletnou pipeline (topics → make_video → push_to_buffer), README ho popisuje ako hlavnú
"továreň". Ostatné *Factory repá vyzerajú ako odvodené kópie pre jednotlivé niche kanály (rovnaký
posledný commit "feat: kriz. reklama..."). Zmeny som robil len tu — pipeline logika v ostatných
repách je pravdepodobne takmer identická, takže rovnaké opravy by šlo replikovať, ale to nebolo
súčasťou zadania.

## 1) Unit testy (tests/, stdlib unittest, 127 testov, všetky OK)
V repe nebol žiadny testovací setup ani `pytest` nainštalovaný a CI (`daily.yml`) ho neinštaluje —
zvolil som **stdlib `unittest`** namiesto pridávania novej závislosti. Spustenie:
```
python -m unittest discover -s tests -t .
```
Pokryté súbory a oblasti:
- `tests/test_make_video.py` — výber B-rollu (relevance/rozlíšenie/query ladder/dedup/retry pri
  stiahnutí), generovanie titulkov (ASS aj POP renderer: case, chunking, emphasis, BGR→RGB),
  timing/strih (`advance_cursor`), slugify, secs_to_ass.
- `tests/test_generate_topics.py` — `valid()`, `extract_json()`, retry v `call_model()` (retry na
  429/5xx/sieťové chyby, NIE na 4xx).
- `tests/test_generate_batch.py` — `slug()`.
- `tests/test_push_to_buffer.py` — `next_slots()` (injektovateľné `now` pre testovateľnosť),
  `build_mutation()`, `read_txt()`, migrácia `pushed.json` schémy, retry v `gql()` a
  `upload_cloudinary()`.
- `tests/test_retry_failed.py` — `build_mutation()`, `title_of()`.
- `tests/test_trends.py` — `_clean()`, `_latinish()`, retry v `_get()`.
- `tests/test_cleanup_cloudinary.py` — `parse()` (tz-aware timestamp parsing).

**Refaktor pre testovateľnosť** (bez zmeny správania): `get_broll()` v `make_video.py` mal celú
logiku výberu ako vnorené closures — vytiahol som `keyword_tokens`, `slug_words`, `relevance`,
`res_rank`, `build_query_ladder`, `select_best_candidate` na úroveň modulu. Podobne titulky
(`apply_case`, `apply_lead`, `chunk_words`, `is_emphasized`) a timing (`advance_cursor`).
`push_to_buffer.next_slots()` dostal voliteľný parameter `now` (default zachováva pôvodné
správanie) — inak by test časovania býval nedeterministický/závislý na reálnom čase behu.

## 2) Bugy / dead code / error-handling
- **Kritický bug**: `push_to_buffer.py` — zlyhaný upload jedného videa na Cloudinary (napr.
  timeout na veľký súbor) zhodil celý skript bez `try/except`, takže žiadne ďalšie video v dávke
  sa nespracovalo. Opravené: `upload_cloudinary()` má teraz retry (3×, backoff) a volanie v `main()`
  je obalené v `try/except` → pri zlyhaní sa pokračuje ďalším videom.
- **Retry pridaný na všetky sieťové volania** spomenuté v zadaní (Pexels, hudba, upload) a navyše
  na Buffer GraphQL (`gql()` v `push_to_buffer.py` aj `retry_failed.py`), GitHub Models
  (`generate_topics.call_model`) a Reddit/YouTube trend fetch (`trends._get`). Rozlišujem
  prechodné sieťové chyby (retry) od aplikačných/HTTP 4xx chýb (bez retry — opakovanie by len
  zbytočne predĺžilo beh rovnakým zlyhaním).
- **Dead code**: nepoužité importy `tempfile`, `hashlib` v `make_video.py`; duplicitné lokálne
  `import re` (re už bol importovaný na úrovni modulu); nepoužitý `import json` v `cloud_upload.py`.
- **Duplicitná implementácia**: `cloud_upload.py` mal vlastnú kópiu Cloudinary upload logiky bez
  retry — teraz volá zdieľanú (a robustnejšiu) `push_to_buffer.upload_cloudinary()`.
- **Resource leak**: viacero miest otváralo súbory cez `json.load(open(...))` /
  `open(...).read()` bez `with`, takže sa zatvárali len cez GC. Opravené v `push_to_buffer.py`
  (`read_txt`, `load_pushed`, `save_pushed`), `generate_topics.py` a `generate_batch.py`.
- **Deprecation bug**: `cleanup_cloudinary.py` používal `datetime.datetime.utcnow()` (deprecated
  od Python 3.12, časom bude odstránené). Nahradené tz-aware `datetime.now(timezone.utc)`;
  `parse()` teraz tiež vracia tz-aware datetime, aby porovnanie s cutoff ostalo konzistentné.
- **README bug**: osirotená uzatváracia ```` ``` ```` značka na konci súboru (bez zodpovedajúcej
  otváracej) — odstránená.

## 3) Docstringy
Doplnené pre všetky verejné/hlavné funkcie, ktoré ich nemali (make_video.py render/caption/timing
helpery a `main`, `appconfig.load`, `push_to_buffer.main/load_cfg/get_channels`,
`generate_topics._gather_trends/_trend_block`, `trends._clean`, `cloud_upload.main`,
`generate_batch.slug/main`, `retry_failed.build_mutation/title_of/main`,
`cleanup_cloudinary.parse/main`). Drobné vnorené closures (napr. `broll_cmd`, `styled`, `ts` v
titulkových funkciách) som nedokumentoval samostatne — sú implementačný detail už zdokumentovanej
rodičovskej funkcie.

## 4) README
Pridaná sekcia **"Ako pipeline beží (architektúra + automatizácia)"** — popisuje celý denný reťazec
krokov z `daily.yml` (generate_topics → generate_batch → make_video → push_to_buffer →
retry_failed → cleanup_cloudinary), retry správanie pri sieťových volaniach a príkazy na manuálne
spustenie jednotlivých krokov. Pridaná sekcia **"Testovanie"**. Aktualizovaná **"Mapa súborov"**
— predtým chýbala polovica pipeline (push_to_buffer, retry_failed, cleanup_cloudinary, trends,
cloud_upload, appconfig, tests/, .github/workflows).

## Čo som NEROBIL (vedome mimo scope)
- Nereplikoval som zmeny do ostatných 12 *Factory repozitárov (neboli súčasťou zadania; rovnaké
  opravy by tam pravdepodobne platili tiež, keďže vyzerajú byť odvodené z rovnakého kódu).
- Nepridával som novú závislosť `pytest` — `unittest` stačí a nezvyšuje instalačnú záťaž CI.
- Nemenil som samotné ffmpeg/TTS/Cloudinary volania okrem pridania retry — nemám prostredie na
  end-to-end otestovanie skutočného renderu videa (ffmpeg/edge-tts/Pexels kľúč by museli reálne
  bežať), takže som sa sústredil na testovateľnú čistú logiku a bezpečné, správanie-zachovávajúce
  refaktory.

## Stav testov
`python -m unittest discover -s tests -t .` → **127 testov, všetky OK**, žiadne ResourceWarning.

## Commity (v poradí)
1. `refactor: extract pure helpers z b-roll/titulkov/timingu + retry na sietove volania`
2. `test: unit testy na hlavne ciste funkcie pipeline (123 testov)`
3. `fix: cleanup_cloudinary pouziva deprecated datetime.utcnow()`
4. `docs: doplnene docstringy pre hlavne funkcie pipeline`
5. `docs: README sekcia 'Ako pipeline beží' + Testovanie + aktualizovana Mapa suborov`
6. `docs: PROGRESS.md so zaznamom rozhodnuti`
7. `merge: integrate upstream never-glow fallback + Pexels rate-limit fix` — pri `git push` prišiel
   nový commit `a12da92` (zrejme z iného bežiaceho procesu na tomto stroji), ktorý menil rovnaké
   miesto v `get_broll()` (cap query ladder z 5 na 2 kôli rate-limitu) a pridal "never-glow"
   fallback v `main()` (radšej zopakovať posledný úspešný záber než padnúť na farebný gradient).
   Zlúčené manuálne: zachovaná moja extrakcia čistých funkcií, prevzatá ich zmena správania
   (cap na 2) aj never-glow logika. Upravený 1 test na nový cap. Po zlúčení 127 testov OK, pushnuté.
