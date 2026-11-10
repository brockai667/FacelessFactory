"""Pripraví balíky e-mailov na ručné odoslanie: leads/out/emaily/<slug>/{email.txt, <slug>-preview.mp4, showreel.mp4}.
Vstup: JSON so zoznamom {slug, to, name, hook[, lang]} ; videá zo sablona/out/<slug>/Preview.mp4.
python -I leads/balik_emailov.py leads/out/emaily-en-2026-10-14.json "Meno"
"""
import json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SAB = ROOT.parent / "sablona" / "out"
OUT = ROOT / "out" / "emaily"

EN = """Subject: Made a quick video from {name}'s website

Hi,

I came across {name}: {hook}.

So I made you a 10-second preview from your actual website (attached: {slug}-preview.mp4). It's your real site in motion, in your own colors and fonts, no AI-generated fake UI.

The second attachment is a short showreel of everything we can animate for a brand. Every piece has a number (01-09): logo animation, kinetic text, product shots, prices, captions, your site on a phone or laptop, a call-to-action. Just reply with the numbers you'd like (e.g. 01 + 07 + 08) and I'll send you a price. Single pieces start at $19, all nine are $119. If you have your own idea, I'm happy to do a quick free call.

The preview is yours to keep either way.

{sig}

P.S. If this isn't useful, just reply "no" and I won't write again.
"""

SK = """Predmet: Spravili sme krátke video z webu {name}

Dobrý deň,

narazili sme na {name}: {hook}.

Tak sme z vášho webu spravili 10-sekundovú ukážku (v prílohe {slug}-preview.mp4). Je to váš skutočný web v pohybe, vo vašich farbách a písme.

Druhá príloha je krátky showreel všetkého, čo vieme pre značku rozhýbať. Každá animácia má číslo (01-09): animované logo, kinetický text, produkt v pohybe, produkty s cenami, titulky, web v mobile či na počítači, výzva na sledovanie. Stačí odpísať čísla, ktoré by sa vám hodili (napr. 01 + 04 + 07), a pošleme cenu. Jednotlivé animácie sú od 15 €, všetkých deväť za 99 €. Ak máte vlastnú predstavu, radi si dáme krátku konzultáciu zadarmo.

Ukážka je vaša, nech sa rozhodnete akokoľvek.

{sig}

P.S. Ak to pre vás nie je, stačí odpísať „nie“ a viac sa neozveme.
"""


def main():
    rows = json.load(open(sys.argv[1], encoding="utf-8"))
    sig = sys.argv[2] if len(sys.argv) > 2 else "[PODPIS]"
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for r in rows:
        prev = SAB / r["slug"] / "Preview.mp4"
        if not prev.exists():
            print("chýba ukážka:", r["slug"]); continue
        lang = r.get("lang", "en")
        d = OUT / r["slug"]; d.mkdir(exist_ok=True)
        shutil.copy(prev, d / f"{r['slug']}-preview.mp4")
        reel = SAB / "doughnana-com" / ("Showreel_EN_email.mp4" if lang == "en" else "Showreel_email.mp4")
        shutil.copy(reel, d / "showreel.mp4")
        text = (EN if lang == "en" else SK).format(sig=sig, **r)
        (d / "email.txt").write_text(f"To: {r['to']}\n" + text, encoding="utf-8")
        index.append(f"| {r['name']} | {r['to']} | emaily/{r['slug']}/ |")
    (OUT / "PREHLAD.md").write_text("| Komu | E-mail | Priečinok |\n|---|---|---|\n" + "\n".join(index) + "\n", encoding="utf-8")
    print(f"{len(index)} balíkov → {OUT}")


if __name__ == "__main__":
    main()
