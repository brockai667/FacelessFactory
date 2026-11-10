# Je o animácie reálny záujem? (prieskum 14. 10. 2026)

## Krátka odpoveď
**Áno, záujem je každý týždeň.** Na lacnom konci je ale preplnený trh. Zarobíme tam, kde klient
chce hotovú vec podľa svojej značky/webu a nechce sa učiť nástroje, nie na „editujem videá za $5“.

## Ako som to meral
`leads/scan_reddit.py` prešiel 13 subredditov (forhire, HireAnEditor, VideoEditingRequests,
slavelabour, hiring, SaaS, startups, Twitch, NewTubers, Entrepreneur, smallbusiness, shopify, jobbit),
621 príspevkov za posledných 30 dní.

| | Počet |
|---|---|
| príspevky, ktoré sa týkajú videa/animácie a niekto v nich hľadá dodávateľa | 113 |
| z toho s uvedeným rozpočtom | 37 |
| ručne overené, presne to, čo vieme robiť (motion, animácia, launch/explainer, titulky) | ~35 |

Prakticky **jeden až dva vhodné dopyty denne len na Reddite**, a to je jeden kanál z mnohých.

## Čo ľudia reálne hľadajú (príklady z posledných 30 dní)
| Kto | Čo chce | Rozpočet |
|---|---|---|
| Faceless YouTube kanály | 2D animátor na shorty „Hoodie Guy“ / „Gumm Films“ štýl, 4–30 kusov mesačne | **$50–150 za short**, $2,4–4,8k/mes. |
| Kanál o osobných financiách | motion graphics editor, 1 video týždenne | $50–100 za video, opakovane |
| Direct-response reklamy | talking-head reklamy s „advanced motion graphics“ | $300–400 |
| SaaS (cez agentúru) | 30 krátkych SaaS animácií (10 hlavných + 20 výstrihov) | $250 spolu (príliš lacné) |
| SaaS founder | trial promo video s animovaným UI, titulkami, zoomami → dlhodobo | neuvedený |
| SaaS founderi (otázky v r/SaaS) | „ako spraviť launch video, keď mám len screen recording?“, „koľko stojí motion video cez Claude/Remotion?“, „launch video s malým rozpočtom“ | hľadajú riešenie, rozpočet malý |
| Začínajúca firma | promo video z loga a screenshotov | zadarmo (nebrať) |

## Čo z toho vyplýva
1. **Najlepšia zhoda s tým, čo už máme:** „pošli URL, dostaneš launch video so svojou skutočnou
   stránkou“. Presne to robí `03-web-telefon` / `03-web-pocitac` z Doughnany. Founderi píšu, že screen
   recording vyzerá lacno a AI video vyzerá falošne. My ukážeme ich skutočný produkt, ale pekne.
2. **Opakovaný príjem:** faceless kanály platia za každý short, každý týždeň. To je náš papierový
   engine (`paper/`). Jeden klient s 10 shortmi mesačne × $80 = **$800/mes.**
3. **Lacný koniec je obsadený:** dve tretiny príspevkov v r/HireAnEditor sú editori, ktorí sa
   PONÚKAJÚ (od $5 za video). Bežný strih nepredávať, cenou tam nevyhráme.
4. **Hrozba aj výhoda AI:** founderi už vedia, že sa to dá spraviť cez Claude + Remotion, a pýtajú sa,
   koľko to stojí. Väčšina to ale skúsiť nechce alebo nevie. Predávame **hotový výsledok za 48 h
   s ukážkou vopred**, nie nástroj.
5. **Twitch overlaye:** málo signálu (3 príspevky). Zatiaľ vynechať.
6. **Ceny trhu** (z cenníkov agentúr a freelancerov, sú to predajné blogy, berte orientačne):
   explainer od freelancera $1 000–3 500, štúdio $5 000+, 2D motion $50–120/h, medián na Upworku
   $25/h. Medzi Fiverrom ($50) a agentúrou ($1 500+) je voľné miesto pre **$150–400 za hotové
   launch video**.

## Čo prieskum nepokrýva
- Upwork, Fiverr, LinkedIn a FB skupiny som nemeral (nemajú verejný feed). Dopyt tam je, ale čísla nemám.
- Slovenský trh je malý, zato bez konkurencie v slovenčine. Overí sa až prvou vlnou oslovení (KLIENTI.md).
- Konverziu (koľko oslovených zaplatí) zistíme až z prvých 30–50 oslovení.

Zdroje cien: jobbers.io (motion graphics freelancing 2026), yansmedia.com (explainer video cost 2026),
yumyumvideos.com (explainer cost 2026), fueler.io (subreddity pre freelancerov 2026).
