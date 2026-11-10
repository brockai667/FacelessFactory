# Kde brať klientov a ako sa k nim dostať

Pravidlo: oslovujeme ľudí, ktorí **práve teraz** riešia video (zverejnili inzerát, chystajú launch,
pýtajú sa na fóre), a vždy s **ukážkou z ich vlastnej značky**. Hromadné maily ani spam nie.

## Segmenty podľa priority

### 1. Indie SaaS / appky pred launchom (globálne, EN)
- **Čo im predáme:** launch video 30–45 s s ich skutočným webom/appkou v mockupe, texty na beat, záver s URL.
- **Kde sú:**
  - r/SaaS, r/indiehackers, r/startups: otázky typu „how do you make a launch video“. Odpovedať
    užitočne, ukážku dať až keď sa pýtajú (pravidlá subov zakazujú reklamu).
  - **Product Hunt „Coming soon“ / upcoming launches:** founder s dátumom launchu a webom.
    Kontakt cez X/LinkedIn uvedený na profile.
  - X (Twitter): hľadať „launching on Product Hunt“, „building in public“, „launch video“.
  - r/HireAnEditor, r/forhire: inzeráty „[Hiring] SaaS video“. Skener ich nájde, odpovedať do pár hodín.
- **Prístup:** z ich URL vyrenderovať 5-sekundový mockup a poslať: „spravil som ukážku z vášho webu“.

### 2. Faceless YouTube / TikTok kanály (globálne, EN), opakovaný príjem
- **Čo im predáme:** animované shorty (papierový štýl z `paper/`), motion graphics do dlhých videí, balíky po 10–30 kusov mesačne.
- **Kde sú:** r/HireAnEditor, r/VideoEditingRequests, r/forhire (inzeráty $50–150/short),
  r/NewTubers, r/PartneredYoutube, Discordy faceless komunít, YouTube kanály s 1k–50k odberateľmi,
  ktorým klesá kvalita (kontakt v záložke „About“).
- **Prístup:** zadarmo 1 testovací short z ich témy. Pri úspechu mesačný balík.

### 3. Slovenské a české firmy, e-shopy a značky (SK/CZ)
- **Čo im predáme:** reels s ich webom/produktom, animované logo, launch nového produktu, overlay sady do CapCutu.
- **Kde sú:** Instagram (lokálne značky jedla, kozmetiky, oblečenia, kaviarne, fitness), e-shopy
  na Shoptete/Shopify, FB skupiny podnikateľov („Podnikatelia Slovensko“, e-commerce skupiny),
  Startitup, nové prevádzky (otvorenia v meste).
- **Výhoda:** slovenčina, osobné stretnutie, takmer žiadna konkurencia s takýmto výstupom.
- **Prístup:** DM s 3-sekundovým titulkom v ich farbách (ako `01-vznik-doughnany`).

### 4. Mladí zakladatelia, súťaže, crowdfunding (SK)
Podrobne v `../ponuka/PLAN-PREDAJ-ANIMACII.md`: JA Slovensko (študentské firmy vznikajú teraz,
finále na jar), Startup Awards SK (finále v novembri), Future Founders (video v prihláške),
StartLab/HitHit kampane.

### 5. Editori a agentúry (B2B, white-label)
- **Čo im predáme:** overlaye/motion vrstvy, ktoré editor vloží do videa svojho klienta. Editori
  strih vedia, animácie často nie.
- **Kde sú:** r/HireAnEditor (stovky editorov sa tam ponúkajú), malé SK agentúry na sociálne siete, freelanceri na Instagrame.
- **Prístup:** „Robíš strih, my ti dodáme motion graphics vrstvu pod tvojím menom za fixnú cenu.“
  Jeden editor môže priniesť viac zákaziek mesačne.

### 6. Inbound (nech nás nájdu)
- Raz týždenne vlastný `[For Hire]` príspevok na r/forhire (pravidlá to dovoľujú) s reelom.
- Gig na Fiverri / profil na Contre: „Launch video from your website in 48h“.
- Vlastné reels a TikToky „before/after: screen recording → launch video“. Na to máme Buffer pipeline.

## Denná rutina (30 min)
1. `python leads/scan_reddit.py --t day` → 3–5 najvhodnejších leadov.
2. Pri každom: otvoriť ich web/kanál → vyrenderovať 3–5 s ukážku → poslať odpoveď alebo DM.
3. 5 DM slovenským značkám (segment 3), každá s vlastnou ukážkou.
4. Zapísať do tabuľky: kto, kedy, kanál, odpoveď, cena. Po 2 týždňoch vyhodnotiť, ktorý kanál zarába.

## Na čo si dať pozor
- Reddit: väčšina subov zakazuje promo mimo vyhradených vlákien. Reagovať len na `[Hiring]` alebo pri priamej otázke.
- Klient „zadarmo za expozíciu“ alebo „$250 za 30 videí“: nebrať.
- Platba vopred (aspoň 50 %) cez PayPal/Wise/faktúru. Pri neplnoletých súhlas rodiča.
- Hudba len licencovaná. Na obsah klienta (logo, web) chcieť súhlas s použitím v portfóliu.
