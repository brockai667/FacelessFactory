# predaj-animacii

> **Začni tu: [MOVEO-STAV.md](MOVEO-STAV.md)** – čo predávame, ako to vyrábame, čo sme spravili a čo vylepšiť.

Predaj animácií do videí: titulky, texty na beat, mockup webu, launch videá, explainery.
Vychádza z toho, čo sme spravili pre Doughnanu (17 overlayov z webu klienta) a z papierového enginu
vo FacelessFactory (`paper/`).

> Dočasne žije ako priečinok vo FacelessFactory, lebo integrácia nemala právo vytvoriť nové repo.
> Presun: vytvor na GitHube prázdne súkromné repo `predaj-animacii` a spusti
> `git subtree split -P predaj-animacii -b predaj && git push <nove-repo> predaj:main`.

| Súbor | Čo v ňom je |
|---|---|
| [PRIESKUM.md](PRIESKUM.md) | Je o to záujem? Reálne inzeráty za 30 dní, kto platí a koľko, kde je konkurencia |
| [KLIENTI.md](KLIENTI.md) | Kde brať klientov, segment po segmente, a ako sa k nim dostať |
| [PONUKA.md](PONUKA.md) | Balíky, ceny, postup „pošli web → dostaneš video“, šablóny správ |
| [sablona/](sablona/README.md) | **Univerzálna šablóna:** URL webu → animácie v štýle značky (Remotion), `node scripts/make.mjs <url>` |
| `leads/scan_reddit.py` | Skener: nájde čerstvé príspevky, kde niekto hľadá animáciu/launch video |

## Skener leadov
```
python leads/scan_reddit.py            # posledný mesiac
python leads/scan_reddit.py --t day    # denná kontrola (odpovedať do pár hodín)
```
Výstup ide do `leads/out/leads-DÁTUM.csv` (dátum, subreddit, kategória, rozpočet, názov, autor, odkaz).
`leads/out/` je v `.gitignore`, keďže sú tam mená používateľov a repo je verejné.
Reddit pri veľa dotazoch vracia 429. Skript čaká a niektoré dotazy preskočí, nové spustenie ich doplní.
