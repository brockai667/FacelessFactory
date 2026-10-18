# -*- coding: utf-8 -*-
"""Samoucenie fabriky: tyzdenny experiment nad scenarmi ("co rastie, skopiruj; co nerastie, skus nieco ine").
  python engine/learn.py record   [--file videos.json] -> denne: zhoda zverejnenych videi (dashboard videos.json) so spismi,
                                                       do perf.json zapise pozretia vo veku ~48 h (v48) a posledne pozretia
  python engine/learn.py weekly   [--today YYYY-MM-DD] [--no-llm] -> ak experiment bezi >= 7 dni: vyhodnot (kept/reverted)
                                                       a spusti dalsi (najprv "skopiruj vitaza", inak dalsia packa zo zoznamu)
  python engine/learn.py daily    -> record + weekly (weekly nic nerobi, kym neprejde 7 dni) - toto vola denny workflow
  python engine/learn.py status   -> vypis stavu
Stav: <fabrika>/experiments.json {current, rules, history}, <fabrika>/perf.json, verejne zhrnutie <fabrika>/experiment_status.json.
Pisanie: writer_brief() (pravidla + aktualny pokyn) ide do Groq promptu, kazdy novy spis dostane "exp": meno experimentu;
vyber z fronty (order_queue) dava prednost spisom aktualneho experimentu, ale kontrola faktov (priorita) ostava nadradena.
Porovnanie je vzdy vekovo normalizovane (pozretia vo veku 2-4 dni), po platformach, potom median pomerov.
Rovnaky subor je v MindBlownDaily (paper/factory) aj ColdCaseDaily (paper/case); profil sa zvoli podla priecinka."""
import datetime
import glob
import json
import math
import os
import re
import statistics
import sys
import unicodedata

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
sys.path.insert(0, HERE)
VIDEOS_URL = os.environ.get("LEARN_VIDEOS_URL", "https://raw.githubusercontent.com/brockai667/faceless-dashboard/main/videos.json")

PLATFORMS = ("youtube", "tiktok", "instagram")
MIN_AGE, MAX_AGE48 = 2.0, 4.0          # v48 = prve pozorovanie vo veku 2-4 dni (vek od polnoci dna zverejnenia, UTC)
EXP_DAYS, MAX_EXP_DAYS = 7, 14         # vyhodnotenie po 7 dnoch; ak este nie su 3 otagovane videa s v48, cakaj max do 14 dni
BASE_DAYS = 14                         # baseline = ostatne videa z poslednych 14 dni pred startom (+ neotagovane pocas experimentu)
KEEP_RATIO, MIN_TAGGED = 1.15, 3       # >= +15 % a >= 3 otagovane videa -> kept
WINNER_X, NEAR_DAYS = 2.0, 3           # vitaz = >= 2x median susedov (+-3 dni, ta ista platforma), geometricky priemer platforiem
NO_REPEAT_DAYS = 42                    # reverted experiment sa 6 tyzdnov neopakuje
MAX_RULES, MAX_WINNER_RULES = 6, 2
BRIEF_CHARS = 700                      # Groq free: 8k TPM vratane max_tokens -> pokyn do promptu kratky

COMMON_LEVERS = {   # (slot, pokyn pre scenaristu, hypoteza); slot: novy kept pokyn v tom istom slote nahradi stary
    "title_short": ("title", "Title: max 4 words, a punchy noun phrase; no digits, no $ sign, no question.",
                    "Short titles (<=6 words) got ~1.25x views on 9/9 of our channels; numbers and $ hurt."),
    "hook_bold_claim": ("hook", "Override the hook style: the hook is ONE bold, surprising, TRUE statement (max 9 words), not a question.",
                        "A confident claim stops the scroll better than a question."),
    "hook_question": ("hook", "The hook is a direct question to the viewer (max 9 words) that makes them want the answer.",
                      "A direct question creates a curiosity gap."),
    "hook_you_pov": ("hook", "Write the hook and first line in second person, putting the viewer inside the moment ('You are...').",
                     "A 'you' POV makes the viewer feel it is about them."),
    "first_line_short": ("first_line", "The first spoken line after the hook is under 8 words and states the single most striking fact.",
                         "A fast first line keeps viewers past the first seconds."),
    "end_part2": ("ending", "End line: a short cliffhanger question, then 'Follow for part two.'",
                  "A part-two tease earns follows and rewatches."),
}
PROFILES = {
    "MindBlownDaily": {
        "state": "factory",
        "levers": ["title_short", "hook_bold_claim", "hook_you_pov", "first_line_short",
                   ("countdown", "format", "Use the countdown format (#5 to #1), saving the most surprising effect for #1.",
                    "Countdowns hold attention to the end."),
                   ("myth_bust", "angle", "Frame the video as busting a common belief: name the belief in the hook, then show the true effects.",
                    "Correcting a popular belief invites comments and shares."),
                   ("topic_extreme", "topic", "Prefer extreme-environment angles (space, deep sea, desert, polar, altitude) over everyday habits.",
                    "Extreme settings look more striking in the first frame.", ["space", "sea", "ocean", "desert", "polar", "altitude", "mountain", "cold", "heat", "moon"]),
                   "end_part2"],
    },
    "ColdCaseDaily": {
        "state": "case",
        "levers": [("title_short", "title", "Title: max 4 words, just the case name; no digits, no $, drop filler like 'The ... Mystery/Incident'.",
                    "Short titles (<=6 words) got ~1.25x views on 9/9 of our channels; numbers and $ hurt."),
                   "hook_question", "hook_bold_claim", "hook_you_pov", "first_line_short",
                   ("topic_sea", "topic", "Prefer sea mysteries (ghost ships, vanished crews, lighthouses, ocean sounds).",
                    "Ocean mysteries performed best on this channel so far.", ["ship", "sea", "ocean", "island", "lighthouse", "triangle", "crew", "bloop"]),
                   ("topic_sky", "topic", "Prefer sky mysteries (lights in the sky, signals, UFO reports, meteors).",
                    "Sky lights got the top YouTube and Instagram views.", ["light", "lights", "signal", "ufo", "sky", "meteor", "radar"]),
                   "end_part2"],
    },
}

CFG = {}
LLM = None   # testy podstrcia atrapu: LLM(system, prompt) -> dict


# ---------- konfiguracia a subory

def configure(root=None, factory_name=None):
    """root = paper/ (alebo docasny priecinok v testoch); profil podla priecinka factory/ (MindBlown) alebo case/ (ColdCase)"""
    root = root or FACTORY
    if not factory_name:
        factory_name = "ColdCaseDaily" if os.path.isdir(os.path.join(root, "case")) and not os.path.isdir(os.path.join(root, "factory")) \
            else "MindBlownDaily"
    P = PROFILES[factory_name]
    sd = os.path.join(root, P["state"])
    CFG.clear()
    CFG.update(name=factory_name, root=root, state_dir=sd, exp=os.path.join(sd, "experiments.json"), perf=os.path.join(sd, "perf.json"),
               status=os.path.join(sd, "experiment_status.json"), done=os.path.join(sd, "done"), levers=[_lever(x) for x in P["levers"]])
    return CFG


def _lever(x):
    if isinstance(x, str):
        slot, ins, hyp = COMMON_LEVERS[x]
        return {"name": x, "slot": slot, "instruction": ins, "hypothesis": hyp, "keywords": []}
    return {"name": x[0], "slot": x[1], "instruction": x[2], "hypothesis": x[3], "keywords": list(x[4]) if len(x) > 4 else []}


def _cfg():
    if not CFG:
        configure()
    return CFG


def _load(path, default):
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:
        return default


def _save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    json.dump(data, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def load_state():
    st = _load(_cfg()["exp"], {})
    st.setdefault("current", None)
    st.setdefault("rules", [])
    st.setdefault("history", [])
    return st


def load_perf():
    p = _load(_cfg()["perf"], {})
    p.setdefault("specs", {})
    return p


def _d(s):
    return datetime.date.fromisoformat(str(s)[:10])


def _today():
    return datetime.datetime.now(datetime.timezone.utc).date()


# ---------- pre pisanie a vyber z fronty (volaju writer / refill / factory)

def current_name():
    try:
        cur = load_state().get("current")
        return cur.get("name") if cur else None
    except Exception:
        return None


def writer_brief():
    """kratky dodatok do Groq promptu: trvale pravidla (kept) + pokyn aktualneho experimentu; max BRIEF_CHARS znakov"""
    st = load_state()
    cur = st.get("current")
    exp = f"THIS WEEK'S EXPERIMENT (apply it clearly): {cur['instruction']}" if cur and cur.get("instruction") else ""
    rules = [r["instruction"] for r in st.get("rules", []) if r.get("instruction")]
    while rules:
        txt = "CHANNEL RULES (proven by our view data, follow them):\n- " + "\n- ".join(rules)
        if len(txt) + len(exp) + 1 <= BRIEF_CHARS:
            break
        rules = rules[1:]                    # najstarsie pravidlo vypadne ako prve
    out = "\n".join(x for x in (("CHANNEL RULES (proven by our view data, follow them):\n- " + "\n- ".join(rules)) if rules else "", exp) if x)
    return out[:BRIEF_CHARS]


def order_queue(items):
    """items [(priority, name, S)] -> poradie renderu. Priorita kontroly faktov (0 overene/Claude, 1 neoverene groq, 2 zamietnute)
    ostava nadradena; v ramci rovnakej priority ide najprv spis aktualneho experimentu, potom abecedne."""
    cur = current_name()
    return sorted(items, key=lambda x: (x[0], 0 if cur and (x[2] or {}).get("exp") == cur else 1, x[1]))


def order_topics(topics):
    """temy z banky: ak ma experiment klucove slova (temova rodina), tie idu prve (stabilne poradie)"""
    st = load_state()
    kws = [k.lower() for k in ((st.get("current") or {}).get("keywords") or [])]
    if not kws:
        return list(topics)
    hit = lambda t: any(re.search(r"\b" + re.escape(k), str(t).lower()) for k in kws)  # noqa: E731
    return [t for t in topics if hit(t)] + [t for t in topics if not hit(t)]


# ---------- record: videos.json -> perf.json

def norm(t):
    t = re.sub("['`‘’ʼ]", "", str(t or ""))               # body's == body’s (Groq pise typograficke znaky)
    t = re.sub("[‐-―−]", "-", t)
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode("ascii").lower()
    t = re.sub(r"#\w*", " ", t)
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def published_specs():
    out = {}
    for f in sorted(glob.glob(os.path.join(_cfg()["done"], "*.json"))):
        S = _load(f, None)
        if isinstance(S, dict):
            out[os.path.basename(f)[:-5]] = S
    return out


def match(v, specs):
    """spis k zverejnenemu videu: YouTube = nazov, TikTok/IG = popis (oba mozu byt orezane)"""
    t = norm(v.get("title"))
    if not t:
        return None
    for sid, S in specs.items():
        if t == norm(S.get("title")):
            return sid
    for sid, S in specs.items():
        d = norm(S.get("description"))
        n = min(len(t), len(d), 60)
        if n >= 20 and t[:n] == d[:n]:
            return sid
    return None


def fetch_videos(path=None):
    if path:
        return json.load(open(path, encoding="utf-8"))
    import urllib.request
    with urllib.request.urlopen(VIDEOS_URL, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def record(videos, now=None):
    """zapise pozorovania do perf.json; vracia pocet (zhodnych, nezhodnych) videi"""
    C = _cfg()
    if now is None and videos.get("gen_at"):           # vek sa rata k casu stiahnutia dat, nie k casu behu
        now = datetime.datetime.fromisoformat(str(videos["gen_at"]).replace("Z", "+00:00"))
    now = now or datetime.datetime.now(datetime.timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=datetime.timezone.utc)
    specs = published_specs()
    perf = load_perf()
    P = perf["specs"]
    hit = miss = 0
    for v in (videos.get("factories", {}).get(C["name"]) or []):
        plat = v.get("platform")
        if plat not in PLATFORMS or not v.get("published"):
            continue
        pub = datetime.datetime.combine(_d(v["published"]), datetime.time(0), tzinfo=datetime.timezone.utc)
        age = (now - pub).total_seconds() / 86400
        if age < 0:
            continue
        sid = match(v, specs)
        if sid:
            hit += 1
        else:
            miss += 1
            sid = f"pub-{v['published']}"
            if (P.get(sid, {}).get("platforms", {}).get(plat, {}).get("id") or v.get("id")) != v.get("id"):
                sid = f"pub-{v['published']}-{v.get('id')}"
        e = P.setdefault(sid, {"published": v["published"], "platforms": {}})
        S = specs.get(sid) or {}
        e["title"] = S.get("title") or e.get("title") or (v.get("title") if plat == "youtube" else None)
        e["exp"] = S.get("exp") or e.get("exp")
        e["published"] = min(e.get("published") or v["published"], v["published"])
        sl = e["platforms"].setdefault(plat, {"id": v.get("id")})
        views = int(v.get("views") or 0)
        if sl.get("first") is None:
            sl["first"] = [round(age, 2), views]
        if age >= MIN_AGE and sl.get("v48") is None and not sl.get("late"):
            if age <= MAX_AGE48:
                sl["v48"], sl["age48"] = views, round(age, 2)
            else:
                sl["late"] = True             # prve pozorovanie az po 4 dnoch -> nie je vekovo porovnatelne
        sl["latest"] = [round(age, 2), views]
        sl["likes"], sl["comments"] = v.get("likes"), v.get("comments")
    for k in [k for k, e in P.items() if (now.date() - _d(e["published"])).days > 180]:
        del P[k]                                       # perf.json nerastie donekonecna (experimenty pozeraju max 4 tyzdne dozadu)
    perf["updated"] = now.isoformat()[:19] + "Z"
    _save(C["perf"], perf)
    st = load_state()
    if st.get("current"):
        st["current"]["tagged"] = sorted(k for k, e in P.items() if e.get("exp") == st["current"]["name"])
        _save(C["exp"], st)
    return hit, miss


# ---------- metriky

def value(sl, approx=False):
    """v48; approx=True -> ak v48 chyba, posledne pozretia vo veku >= 2 dni (len bootstrap / vitaz). 0 = nedorucene -> None"""
    if not sl:
        return None
    x = sl.get("v48")
    if x is None and approx and sl.get("latest") and sl["latest"][0] >= MIN_AGE:
        x = sl["latest"][1]
    return x if x else None


def _median(xs):
    xs = [x for x in xs if x is not None]
    return statistics.median(xs) if xs else None


def platform_values(perf, d0, d1, exclude_exp=None, only_exp=None, approx=False):
    out = {p: [] for p in PLATFORMS}
    for sid, e in perf["specs"].items():
        if not (d0 <= _d(e["published"]) <= d1):
            continue
        if only_exp is not None and e.get("exp") != only_exp:
            continue
        if exclude_exp is not None and e.get("exp") == exclude_exp:
            continue
        for p in PLATFORMS:
            x = value(e["platforms"].get(p), approx)
            if x is not None:
                out[p].append(x)
    return out


def baseline(perf, today, exclude_exp=None):
    """median v48 po platformach z poslednych 14 dni; ak je v48 menej ako 3, priblizne (posledne pozretia), oznacene approx"""
    d0 = today - datetime.timedelta(days=BASE_DAYS)
    exact = platform_values(perf, d0, today, exclude_exp=exclude_exp)
    rough = platform_values(perf, d0, today, exclude_exp=exclude_exp, approx=True)
    med, approx = {}, []
    for p in PLATFORMS:
        if len(exact[p]) >= 3:
            med[p] = _median(exact[p])
        elif rough[p]:
            med[p] = _median(rough[p]); approx.append(p)
    return med, approx


def evaluate(st, perf, today):
    """vysledok aktualneho experimentu: dict s pomermi a statusom running|waiting|kept|reverted"""
    cur = st["current"]
    started = _d(cur["started"])
    days = (today - started).days
    tagged = platform_values(perf, started, today, only_exp=cur["name"])
    base = platform_values(perf, started - datetime.timedelta(days=BASE_DAYS), today, exclude_exp=cur["name"])
    n_tagged = sum(1 for e in perf["specs"].values()
                   if e.get("exp") == cur["name"] and any(value(e["platforms"].get(p)) is not None for p in PLATFORMS))
    per, now_med, base_med = {}, {}, {}
    for p in PLATFORMS:
        bm = _median(base[p]) if len(base[p]) >= 3 else (cur.get("baseline_median") or {}).get(p)
        tm = _median(tagged[p])
        if tm is not None:
            now_med[p] = tm
        if bm:
            base_med[p] = bm
        if tm is not None and bm:
            per[p] = round(tm / bm, 3)
    ratio = round(_median(list(per.values())), 3) if per else None
    res = {"days": days, "n_tagged": n_tagged, "per_platform": per, "ratio": ratio, "metric_now": now_med, "metric_base": base_med}
    if days < EXP_DAYS:
        res["status"] = "running"
    elif n_tagged < MIN_TAGGED and days < MAX_EXP_DAYS:
        res["status"] = "waiting"
    else:
        res["status"] = "kept" if (n_tagged >= MIN_TAGGED and ratio is not None and ratio >= KEEP_RATIO) else "reverted"
    return res


def find_winner(perf, today, skip=()):
    """najvacsi outlier z poslednych 14 dni: pre kazdu platformu pomer k medianu susedov (+-3 dni, aspon 2), spolu geometricky
    priemer (aspon 2 platformy). Vracia (spec_id, score, per_platform) alebo None, ak nikto nema >= WINNER_X."""
    d0, d1 = today - datetime.timedelta(days=BASE_DAYS), today - datetime.timedelta(days=int(MIN_AGE))
    pts = {p: [] for p in PLATFORMS}
    for sid, e in perf["specs"].items():
        dd = _d(e["published"])
        if d0 - datetime.timedelta(days=NEAR_DAYS) <= dd <= d1:
            for p in PLATFORMS:
                x = value(e["platforms"].get(p), approx=True)
                if x is not None:
                    pts[p].append((sid, dd, x))
    best = None
    for sid, e in perf["specs"].items():
        dd = _d(e["published"])
        if sid.startswith("pub-") or sid in skip or not (d0 <= dd <= d1):
            continue
        per = {}
        for p in PLATFORMS:
            mine = [x for s, _, x in pts[p] if s == sid]
            near = [x for s, d2, x in pts[p] if s != sid and abs((d2 - dd).days) <= NEAR_DAYS]
            if mine and len(near) >= 2 and _median(near):
                per[p] = round(mine[0] / _median(near), 2)
        if len(per) < 2:
            continue
        score = round(math.exp(sum(math.log(max(r, 1e-3)) for r in per.values()) / len(per)), 2)
        if best is None or score > best[1]:
            best = (sid, score, per)
    return best if best and best[1] >= WINNER_X else None


# ---------- vyber dalsieho experimentu

def _llm(system, prompt):
    if LLM:
        return LLM(system, prompt)
    from llm import llm_json
    return llm_json(system, prompt, temperature=0.4, max_tokens=1500, effort="low")


def _spec_text(S):
    lines = [b.get("line", "") for b in (S.get("beats") or [])][:3]
    end = S.get("end") if isinstance(S.get("end"), dict) else {"line": S.get("end")}
    return (f"title: {S.get('title')}\nhook: {S.get('hook')}\nfirst lines: {' / '.join(lines)}\nend: {(end or {}).get('line')}\n"
            f"format: {S.get('format') or S.get('site') or ''}")[:700]


def copy_winner(win, perf, today):
    """Groq zisti, co urobilo vitaza uspesnym, a zmeni to na jednu prenositelnu instrukciu pre scenaristu"""
    sid, score, per = win
    specs = published_specs()
    S = specs.get(sid)
    if not S:
        return None
    d0 = today - datetime.timedelta(days=BASE_DAYS)
    typical = [specs[k] for k, e in sorted(perf["specs"].items()) if k in specs and k != sid and _d(e["published"]) >= d0][-3:]
    system = (f"You analyse short-video performance for the faceless channel {_cfg()['name']}. Find what a script writer can REPEAT "
              "on a different topic. Return ONLY JSON.")
    prompt = (f"WINNER ({score}x the views of neighbouring videos; per platform {json.dumps(per)}):\n{_spec_text(S)}\n\n"
              "TYPICAL VIDEOS (for contrast):\n" + "\n---\n".join(_spec_text(x) for x in typical) +
              "\n\nWhat made the winner work (topic angle, hook pattern, title pattern, framing)? Return JSON "
              '{"pattern": "2-4 word label", "instruction": "ONE imperative sentence for the script writer, max 30 words, '
              'transferable to other topics, no specific case or topic names", "hypothesis": "one sentence", '
              '"keywords": ["0-4 lowercase topic words to prefer when choosing the next topics"]}')
    out = _llm(system, prompt)
    ins = re.sub(r"\s+", " ", re.sub("[‐-―]", "-", str((out or {}).get("instruction") or ""))).strip()
    if not (10 <= len(ins) <= 260):
        raise ValueError("vitaz: neplatna instrukcia od LLM")
    kws = [re.sub(r"[^a-z0-9 ]", "", str(k).lower()).strip() for k in ((out or {}).get("keywords") or [])][:4]
    return {"name": f"copy-{sid}"[:60], "slot": "winner", "instruction": ins,
            "hypothesis": str(out.get("hypothesis") or f"Repeating what made '{S.get('title')}' a {score}x outlier lifts views.")[:300],
            "keywords": [k for k in kws if k], "source": "winner", "winner": {"spec": sid, "title": S.get("title"), "score": score, "per_platform": per}}


def next_lever(st, today):
    """prva este netestovana packa; ak su vsetky otestovane, najstarsia reverted (starsia ako 6 tyzdnov); kept nikdy"""
    hist = st.get("history", [])
    kept = {r.get("name") for r in st.get("rules", [])} | {h["name"] for h in hist if h.get("status") == "kept"}
    tested = {h["name"] for h in hist}
    for L in _cfg()["levers"]:
        if L["name"] not in tested and L["name"] not in kept:
            return dict(L, source="lever")
    old = []
    for L in _cfg()["levers"]:
        if L["name"] in kept:
            continue
        last = max((_d(h.get("ended") or h["started"]) for h in hist if h["name"] == L["name"]), default=None)
        if last is None or (today - last).days >= NO_REPEAT_DAYS:
            old.append((last or datetime.date.min, L))
    return dict(sorted(old, key=lambda x: x[0])[0][1], source="lever") if old else None


def choose_next(st, perf, today, use_llm=True):
    hist_names = {h["name"] for h in st.get("history", [])} | {r.get("name") for r in st.get("rules", [])}
    copied = {n[5:] for n in hist_names if n and n.startswith("copy-")}
    win = find_winner(perf, today, skip=copied)
    if win and use_llm:
        try:
            exp = copy_winner(win, perf, today)
            if exp and exp["name"] not in hist_names:
                return exp
        except Exception as e:
            print(f"   [learn] kopia vitaza zlyhala ({type(e).__name__}: {str(e)[:120]}) -> packa zo zoznamu")
    elif win:
        print(f"   [learn] vitaz {win[0]} ({win[1]}x), ale bez LLM -> packa zo zoznamu")
    return next_lever(st, today)


def start(st, exp, perf, today):
    med, approx = baseline(perf, today)
    st["current"] = {k: exp.get(k) for k in ("name", "slot", "instruction", "hypothesis", "keywords", "source", "winner") if exp.get(k) is not None}
    st["current"].update(started=today.isoformat(), baseline_median=med, baseline_approx=approx, tagged=[])
    return st["current"]


def add_rule(st, cur, ratio, today):
    rules = [r for r in st["rules"] if cur.get("slot") == "winner" or r.get("slot") != cur.get("slot")]   # novy pokyn nahradi slot
    rules.append({"name": cur["name"], "slot": cur.get("slot"), "instruction": cur["instruction"], "kept_on": today.isoformat(), "ratio": ratio})
    win = [r for r in rules if r.get("slot") == "winner"]
    for r in win[:-MAX_WINNER_RULES]:
        rules.remove(r)
    st["rules"] = rules[-MAX_RULES:]


def weekly(today=None, use_llm=True, force=False):
    """vyhodnoti aktualny experiment (ak je cas) a spusti dalsi; vzdy prepise experiment_status.json"""
    today = today or _today()
    st, perf = load_state(), load_perf()
    res = None
    if st.get("current"):
        res = evaluate(st, perf, today)
        if res["status"] in ("running", "waiting") and not force:
            write_status(st, res, today)
            _save(_cfg()["exp"], st)
            print(f"[learn] {st['current']['name']}: {res['status']} (den {res['days']}, otagovane {res['n_tagged']}, pomer {res['ratio']})")
            return st
        if force and res["status"] in ("running", "waiting"):
            res["status"] = "kept" if (res["n_tagged"] >= MIN_TAGGED and (res["ratio"] or 0) >= KEEP_RATIO) else "reverted"
        cur = st["current"]
        st["history"].append({"name": cur["name"], "slot": cur.get("slot"), "instruction": cur.get("instruction"), "started": cur["started"],
                              "ended": today.isoformat(), "ratio": res["ratio"], "per_platform": res["per_platform"],
                              "n_tagged": res["n_tagged"], "status": res["status"]})
        if res["status"] == "kept":
            add_rule(st, cur, res["ratio"], today)
        print(f"[learn] {cur['name']} -> {res['status'].upper()} (pomer {res['ratio']}, otagovane {res['n_tagged']})")
        st["current"] = None
    nxt = choose_next(st, perf, today, use_llm)
    if nxt:
        cur = start(st, nxt, perf, today)
        print(f"[learn] novy experiment: {cur['name']} | {cur['instruction']}")
    else:
        print("[learn] ziadna dalsia packa (vsetky kept alebo cerstvo reverted) -> len pravidla")
    _save(_cfg()["exp"], st)
    write_status(st, evaluate(st, perf, today) if st.get("current") else None, today, last=st["history"][-1] if st["history"] else None)
    return st


def write_status(st, res, today, last=None):
    """male verejne zhrnutie pre dashboard (raw.githubusercontent)"""
    cur = st.get("current") or {}
    last = last or (st["history"][-1] if st.get("history") else None)
    _save(_cfg()["status"], {
        "factory": _cfg()["name"], "updated": today.isoformat(), "name": cur.get("name"), "started": cur.get("started"),
        "hypothesis": cur.get("hypothesis"), "instruction": cur.get("instruction"),
        "metric": "median views at ~48 h per platform",
        "metric_before": cur.get("baseline_median"), "metric_now": (res or {}).get("metric_now"),
        "ratio_now": (res or {}).get("ratio"), "n_tagged": (res or {}).get("n_tagged", 0),
        "status": (res or {}).get("status", "idle") if cur else "idle", "rules": len(st.get("rules", [])),
        "last": {k: last.get(k) for k in ("name", "status", "ratio", "ended")} if last else None})


def status():
    st = load_state()
    print(json.dumps({"current": st.get("current"), "rules": st.get("rules"), "history": st.get("history")[-5:]}, ensure_ascii=False, indent=1))


def main(argv):
    configure()
    cmd = argv[0] if argv else "status"
    today = _d(argv[argv.index("--today") + 1]) if "--today" in argv else None
    use_llm = "--no-llm" not in argv
    if cmd in ("record", "daily"):
        try:
            vids = fetch_videos(argv[argv.index("--file") + 1] if "--file" in argv else None)
            hit, miss = record(vids)
            print(f"[learn] record: {hit} videi zhodnych so spismi, {miss} bez spisu ({_cfg()['name']})")
        except Exception as e:
            print(f"[learn] record zlyhal: {type(e).__name__}: {str(e)[:160]}")
            if cmd == "record":
                return 0
    if cmd in ("weekly", "daily"):
        weekly(today, use_llm, force="--force" in argv)
    if cmd == "status":
        status()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
