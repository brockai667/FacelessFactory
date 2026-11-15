# -*- coding: utf-8 -*-
"""Tyzdenny audit videi v2 (MindBlownDaily). Cita factory/perf.json (plni ho learn.py v nocnom behu) a factory/done/*.json.
  python engine/audit.py                 -> vypise tabulku (markdown)
  python engine/audit.py --write         -> + zapise factory/audits/AUDIT-<datum>.md
Pravidla (Damian 10. 11. 2026): video sa hodnoti najskor 4 dni po vydani; hak A (pokojna otazka) vs B (uder) rozhoduje test,
nie nazor; zaver o skupine az od 3 videi v skupine. Zaklad = median starych videi (v1) za poslednych 28 dni.
Cislo videa = zhliadnutia (v48 = prve meranie po 48 h, inak posledne meranie) na platforme; pomer = cislo / zaklad platformy."""
import datetime
import glob
import json
import os
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
PLAT = ("youtube", "tiktok", "instagram")
MIN_AGE = 4          # dni od vydania, kym sa video hodnoti
MIN_GROUP = 3        # videi v skupine, kym sa o nej robi zaver


def median(xs):
    xs = sorted(xs)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2


def views(sl):
    if not sl:
        return None
    if sl.get("v48") is not None:
        return sl["v48"]
    if sl.get("latest"):
        return sl["latest"][1]
    return None


def run(today=None):
    today = today or datetime.date.today()
    perf = json.load(open(os.path.join(FACTORY, "factory", "perf.json"), encoding="utf-8"))
    P = perf.get("specs", {})
    done = {os.path.basename(f)[:-5]: json.load(open(f, encoding="utf-8")) for f in glob.glob(os.path.join(FACTORY, "factory", "done", "*.json"))}
    age = lambda e: (today - datetime.date.fromisoformat(e["published"])).days
    is_v2 = lambda k, e: bool(e.get("test")) or (done.get(k) or {}).get("v") == 2
    base = {}
    for p in PLAT:
        xs = [views(e["platforms"].get(p)) for k, e in P.items() if not is_v2(k, e) and MIN_AGE <= age(e) <= 28 + MIN_AGE]
        m = median([x for x in xs if x is not None])
        base[p] = round(m) if m is not None else None
    rows, young = [], []
    for k, e in sorted(P.items(), key=lambda kv: kv[1]["published"]):
        if not is_v2(k, e):
            continue
        t = e.get("test") or (done.get(k) or {}).get("test") or {}
        r = {"id": k, "title": e.get("title") or k, "published": e["published"], "age": age(e), "hook": t.get("hook", "?"), "engage": t.get("engage", "?")}
        ratios = []
        for p in PLAT:
            sl = e["platforms"].get(p) or {}
            v = views(sl)
            r[p] = v
            r[p + "_likes"], r[p + "_comments"] = sl.get("likes"), sl.get("comments")
            if v is not None and base[p]:
                ratios.append(v / base[p])
        r["ratio"] = round(sum(ratios) / len(ratios), 2) if ratios else None
        (rows if r["age"] >= MIN_AGE else young).append(r)
    out = [f"# Audit v2 – {today.isoformat()}", "",
           f"Dáta: perf.json z {perf.get('updated', '?')}. Základ (medián starých videí, posledných 28 dní): " +
           ", ".join(f"{p} {base[p] if base[p] is not None else '–'}" for p in PLAT) + ".", ""]
    if not rows:
        out += [f"Žiadne video v2 ešte nemá {MIN_AGE} dni od vydania → hodnotiť sa nedá, dávka sa píše podľa doterajších pravidiel.", ""]
    else:
        out += ["| video | vydané | hák | zapojenie | YT | TT | IG | lajky | komentáre | pomer k základu |", "|---|---|---|---|---|---|---|---|---|---|"]
        for r in rows:
            lk = sum(r[p + "_likes"] or 0 for p in PLAT)
            cm = sum(r[p + "_comments"] or 0 for p in PLAT)
            out.append(f"| {r['title']} | {r['published']} | {r['hook']} | {r['engage']} | {r['youtube'] if r['youtube'] is not None else '–'} | "
                       f"{r['tiktok'] if r['tiktok'] is not None else '–'} | {r['instagram'] if r['instagram'] is not None else '–'} | {lk} | {cm} | {r['ratio'] if r['ratio'] is not None else '–'} |")
        out.append("")
        for key, name in (("hook", "Hák"), ("engage", "Zapojenie")):
            out += [f"## {name}", "", "| skupina | videí | medián pomeru | zaver |", "|---|---|---|---|"]
            groups = {}
            for r in rows:
                if r["ratio"] is not None:
                    groups.setdefault(r[key], []).append(r["ratio"])
            for g, xs in sorted(groups.items()):
                out.append(f"| {g} | {len(xs)} | {round(median(xs), 2)} | {'možno porovnávať' if len(xs) >= MIN_GROUP else f'málo dát (treba {MIN_GROUP})'} |")
            out.append("")
    if young:
        out += ["Príliš mladé na hodnotenie: " + ", ".join(f"{r['title']} ({r['age']} d)" for r in young) + ".", ""]
    q = sorted(os.path.basename(f) for f in glob.glob(os.path.join(FACTORY, "factory", "queue", "*.json")))
    out += [f"Fronta: {len(q)} hotových videí ({', '.join(x[:-5] for x in q) or 'prázdna'}).", ""]
    return "\n".join(out)


if __name__ == "__main__":
    text = run()
    print(text)
    if "--write" in sys.argv:
        d = os.path.join(FACTORY, "factory", "audits")
        os.makedirs(d, exist_ok=True)
        f = os.path.join(d, f"AUDIT-{datetime.date.today().isoformat()}.md")
        open(f, "w", encoding="utf-8", newline="\n").write(text)
        print("zapisane:", f)
