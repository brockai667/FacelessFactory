# -*- coding: utf-8 -*-
"""Scenarista + rezisér: téma -> specs/<slug>.json (vstup pre compose.py).
  python engine/writer.py "What happens if you drink 10 coffees a day?"
  python engine/writer.py --next            -> dalsia nepouzita tema z factory/topics.json
Tri volania LLM (Groq, zadarmo): 1) scenár (príbeh + fakty), 2) redaktor (overí fakty, opraví jazyk), 3) vizuálny rezisér
(recepty a panely z uzavretého slovníka). Vzhľad videa (formát, chrome, prechod, podanie, kamera, postava, hudba, slučka)
vyberá kód tak, aby sa neopakoval voči posledným videám (factory/history.json)."""
import json
import os
import random
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from llm import llm_json  # noqa: E402

FDIR = os.path.join(FACTORY, "factory")
HIST = os.path.join(FDIR, "history.json")
TOPICS = os.path.join(FDIR, "topics.json")

CHOICES = {
    "format": ["timeline", "countdown", "gauge"],
    "chrome": ["tape", "sticky", "stamp", "bubble"],
    "trans": ["circle", "page", "tear", "zoom"],
    "pres": ["full", "card"],
    "cam": ["calm", "dynamic"],
    "hair": ["short", "long", "bun", "spiky", "curly", "bald", "cap"],
    "skin": ["light", "tan", "brown", "dark"],
    "palette": ["p0", "p1", "p2", "p3", "p4"],
    "cta": ["COMMENT BELOW", "FOLLOW FOR MORE", "SAVE THIS ONE", "SHARE WITH A FRIEND"],
    "species": ["human", "cat", "dog", "bear"],   # zvierata = ta ista postava s usami/nufakom/chvostom (char_biped species)
}
PALETTES = {  # accent, oblecenie (suit, suitDark), nohavice, pozadie stat panelu
    "p0": ("#2a74b3", ("#3f73b8", "#2f5a93"), ("#34466a", "#26344f"), "#dfeaf5"),
    "p1": ("#7a5fa0", ("#8e7cc3", "#6d5ca6"), ("#3b3552", "#2a2640"), "#ece6f6"),
    "p2": ("#d9483b", ("#e0674f", "#bf4f3a"), ("#3a4a5a", "#2a3642"), "#f7e3d9"),
    "p3": ("#2f8f6a", ("#3fa37c", "#2f7f60"), ("#2f3e46", "#222d33"), "#e1f1e8"),
    "p4": ("#c7851f", ("#f2a93b", "#d48a22"), ("#4a3a5a", "#362a44"), "#f7ecd6"),
}
HAIR_COL = ["#2b1d16", "#4a3226", "#5a3a28", "#8a5a2b", "#c98b3a", "#6b6b6b"]

GOLD = """GOLD-STANDARD LINES (copy this tone: short, concrete, visual, surprising, spoken, TRUE):
"After one day, your mouth dries out, and your head starts pounding."
"By day two, your kidneys slow down to save every last drop."
"Your blood gets thicker, so your heart has to beat faster."
"By day four, your brain starts to shrink."
"On day two, your inner ear can't tell which way is down, so you feel sick."
"After two weeks, your spine stretches out, and you grow up to two inches taller."
"After a month, your bones get weaker, losing about one percent every month."
"After twenty-four hours, your brain works like you're legally drunk."
Ending examples: "Back on Earth, you can barely stand. Would you still go?" / "So when did you last drink a glass?"
Never use filler like "noticeably", "slightly", "a bit", "quickly" at the end of a sentence; never stack adverbs."""

FORMAT_RULES = {
    "timeline": 'FORMAT timeline: labels are increasing amounts of time like "10 MINUTES", "24 HOURS", "3 DAYS", "1 WEEK", "6 MONTHS" '
                '(number + unit). Each line opens with a NATURAL time phrase, never a robotic label: "After twenty-four hours, ...", '
                '"By day three, ...", "After a week, ...", "Six months in, ..." (never "Hour twenty-four." or "Day three.").',
    "countdown": 'FORMAT countdown: labels "#5", "#4", ... "#1" (the most surprising effect last). Lines start with the effect itself.',
    "gauge": 'FORMAT gauge: labels are increasing values of ONE quantity with a short unit, like "1 CUP", "4 CUPS", "8 CUPS" or "30°C", "40°C" '
             'or "1 KM", "10 KM" (max 7 characters). Each line starts with that value ("At forty degrees,").',
}

SYS_WRITE = f"""You are the head writer of MindBlownDaily, a faceless channel of 25-35 second vertical shorts: cute 2D paper-craft
cartoons that answer "What happens if...?" with an escalating sequence of TRUE effects on the body (or the world).
Audience: curious teens and adults. Voice: a friendly science narrator. Every beat = ONE vivid physical effect that can be
SHOWN on a cartoon character or a close-up of an organ, getting more intense each beat. Pick the most striking,
well-known effects; skip weak or vague ones (like "mild upset"). Time labels must increase from beat to beat. Facts: only well-established science
(NIH, NASA, WHO, Mayo Clinic, textbooks); numbers only if widely documented; conservative wording ("can", "may", "about").
Never invent studies, records or numbers. No medical advice, no gore, nothing scary for kids.
{GOLD}
Output ONE JSON object only."""

SYS_EDIT = f"""You are a senior science editor and fact-checker for short educational videos.
For every line: (1) is it accurate for a healthy adult and well documented? If false, doubtful or exaggerated, replace it with a
TRUE, well-documented effect of the same topic (you may change the effect and its idea). (2) Is it natural, grammatical spoken
English in the gold-standard tone? If not, rewrite it. If an effect is vague or weak, swap it for a stronger TRUE one.
Time labels must stay in increasing order. Keep each line 6-14 words and keep the label at the start as in the
original ("Day three.", "At forty degrees,"). Keep the story escalating. Also fix the title if it breaks the rules
(max 6 words, no numbers, no dashes, avoid the word "you").
{GOLD}
Output ONE JSON object only."""

VOCAB = """VOCABULARY (use nothing else)
env: "room" (cozy living room: window, wall counter/calendar, thermometer, sofa, plant), "space" (space station; only for space
topics), "field" (outdoors).
scene (top-level = opening scene; per beat "scene" switches from that beat on; pick by topic, max 2-3 switches):
  room: couch (living room) | desk (desk with a glowing computer: screens, sitting, remote work) | bed (bedroom: sleep, night)
  field: meadow | mountain (snowy peaks) | summit (top of the peak, clouds below) | road (road with finish banner and city: running, walking)
  space: station | mars (Mars surface: red rocks, dome, rover)
World shot {"type":"world","do":[{"r":name,"arg"?:...,"at":word}]} - actions on the character:
  face (arg: neutral|smile|happy|worried|shocked|tired|sleepy|angry|pain|pant|dry|sick|dizzy|excited)
  puffy (face swells) | skinny_legs | thin_arms (muscles shrink) | bigger (gains weight) | taller (grows)
  slump (exhausted) | yawn | nod (microsleep) | sweat | steam (overheating) | puff (dry breath)
  shiver (cold or jitters; arg seconds 1-2) | zzz (sleepy) | stars (dizzy) | pain (headache) | heartbeat (pounding; arg 3-6)
  jog (running in place; arg seconds 2-4) | walk (walking in place; arg seconds 2-4)
hero (optional): {"species": "human|cat|dog|bear"} - pick an animal when the topic is about animals or for variety
  hallucinate | thumbs_up | wave | mood (arg: night|hot|cold|normal - changes the whole scene)
  badge (arg: big text like "60%", "small": 1-3 words; env room only)
Panel shot {"type":"panel","panel":name,"do":[{"a":action,"at":word}]} - a close-up; each panel name at most once per video:
  heart: beat|fast|slow  brain: pulse|wobble|shrink  blood: flow|thick|toxins  kidneys: flow|save|fail
  ear: confused  spine: stretch (+"badge":[top,big,bottom])  bone: weaken (+"badge":[big,small])  eye: flatten|blur
  stat: big-number card (can repeat): "big" (<=9 chars, e.g. "11 DAYS", "400 MG", "60%"), "small" (<=18 chars),
        "icon": clock|calendar|drop|heart|brain|bolt|flame|snow|moon|bone|cup|bed|sun|phone|rocket|lungs|muscle|apple|up|down|eye
RULES: beat 1 is a world shot; mix world and panel shots, never 3 panels in a row; 1-2 shots per beat (a second shot needs
"from": the word of the line where it starts); 1-3 actions per world shot; every "at"/"from" is ONE word copied exactly from
that beat's line; visuals must match the words; use a stat card for the most striking number."""

VIS_EXAMPLE_IN = {"env": "room", "beats": [
    {"label": "DAY 1", "line": "After one day, your mouth dries out, and your head starts pounding."},
    {"label": "DAY 2", "line": "By day two, your kidneys slow down to save every last drop."},
    {"label": "DAY 3", "line": "Day three. You stop sweating, and your body starts to overheat."},
    {"label": "DAY 4", "line": "By day four, your brain starts to shrink."},
    {"label": "DAY 5", "line": "Day five. You can barely move, and sixty percent of you is water."}],
    "end_line": "So when did you last drink a glass?"}
VIS_EXAMPLE_OUT = {"beats": [
    {"label": "DAY 1", "shots": [{"type": "world", "do": [{"r": "face", "arg": "dry", "at": "dries"}, {"r": "pain", "at": "pounding"}]}]},
    {"label": "DAY 2", "shots": [{"type": "panel", "panel": "kidneys", "do": [{"a": "save", "at": "drop"}]}]},
    {"label": "DAY 3", "shots": [{"type": "world", "do": [{"r": "mood", "arg": "hot", "at": "three"}, {"r": "sweat", "at": "sweating"}, {"r": "steam", "at": "overheat"}]}]},
    {"label": "DAY 4", "shots": [{"type": "panel", "panel": "brain", "do": [{"a": "shrink", "at": "shrink"}]}]},
    {"label": "DAY 5", "shots": [{"type": "world", "do": [{"r": "slump", "at": "barely"}]},
                                 {"type": "panel", "panel": "stat", "from": "sixty", "big": "60%", "small": "OF YOU IS WATER", "icon": "drop", "do": [{"a": "show"}]}]}],
    "end_do": [{"r": "thumbs_up", "at": "glass"}]}

SYS_VIS = f"""You are the visual director of a 2D paper-craft cartoon series. You turn finished narration into shots,
choosing ONLY from the vocabulary. Prefer the most literal, readable visual for each line. "r" is always a world action name,
"a" is always a panel action name; never invent names; never repeat a panel name except stat.
{VOCAB}
EXAMPLE INPUT: {json.dumps(VIS_EXAMPLE_IN)}
EXAMPLE OUTPUT: {json.dumps(VIS_EXAMPLE_OUT)}
Output ONE JSON object only."""

UNIT_MIN = {"SECOND": 1 / 60, "MINUTE": 1, "HOUR": 60, "DAY": 1440, "WEEK": 10080, "MONTH": 43200, "YEAR": 525600}


def label_order(label):
    """poradie casovych nadpisov (MINUTE 10 < HOUR 2 < DAY 1 ...); None ak to nie je casovy nadpis"""
    m = re.match(r"^\s*([A-Za-z]+?)S?\s+([0-9.]+)\s*$", label or "")
    if m and m.group(1).upper() in UNIT_MIN:
        return UNIT_MIN[m.group(1).upper()] * float(m.group(2))
    return None


def load(path, default):
    return json.load(open(path, encoding="utf-8")) if os.path.exists(path) else default


def pick(dim, hist, rng):
    """moznost, ktora sa v poslednych videach neobjavila"""
    opts = CHOICES[dim]
    last = [h.get(dim) for h in hist[::-1]]
    avoid = set(last[:max(1, len(opts) - 2)])
    return rng.choice([o for o in opts if o not in avoid] or opts)


def direct(hist, rng):
    return {k: pick(k, hist, rng) for k in CHOICES}


def llm_script(topic, fmt):
    prompt = (f"TOPIC: {topic}\nPreferred {FORMAT_RULES[fmt]}\nIf that format does not fit the topic naturally, use timeline.\n"
              "Write 4-6 beats plus an ending (whole script 60-90 words). Choose env (room|space|field) and scenes by topic, outfit for the character "
              "(tshirt|hoodie|pajamas|labcoat|suit), mood_music (tense|playful|wonder|calm), face0 (smile|neutral|excited).\n"
              'Return JSON: {"title","hook" (spoken question, max 9 words),"banner" (hook as 2 upper-case lines, max 16 and 12 chars),'
              '"format","env","scene","outfit","mood_music","face0","beats":[{"label","line","idea" (what we see),"scene"?}],"end_line" '
              '(short question to the viewer, max 10 words),"description" (1 sentence),"tags" (3-5 hashtags),'
              '"facts":[{"claim","source"}]}')
    return llm_json(SYS_WRITE, prompt, temperature=0.7, effort="high")


def llm_edit(S):
    data = {"title": S["title"], "beats": [{"label": b["label"], "line": b["line"]} for b in S["beats"]], "end_line": S["end_line"],
            "facts": S.get("facts", [])}
    prompt = ("Check and fix this script. Return JSON: "
              '{"title","beats":[{"label","line","changed":true|false,"why"}],"end_line"}\n' + json.dumps(data, ensure_ascii=False))
    return llm_json(SYS_EDIT, prompt, temperature=0.2, effort="high")


def llm_visual(S):
    data = {"env": S["env"], "beats": [{"label": b["label"], "line": b["line"], "idea": b.get("idea", "")} for b in S["beats"]],
            "end_line": S["end_line"]}
    prompt = ('Return JSON: {"beats":[{"label","shots":[...]}],"end_do":[world actions for the ending line]}\n' + json.dumps(data, ensure_ascii=False))
    return llm_json(SYS_VIS, prompt, temperature=0.4, effort="medium")


def slugify(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:40]


def build_spec(topic, seed=None):
    """scenar od LLM + rezia + ulozenie do specs/ (priama vyroba jedneho videa)"""
    hist = load(HIST, [])
    rng = random.Random(seed)
    d = direct(hist, rng)
    S = write_spec(topic, d["format"])
    return save(apply_direction(S, hist, rng, d))


def write_spec(topic, fmt=None):
    """len scenar od LLM (scenarista -> redaktor -> vizualny reziser), bez rezie a ulozenia (fronta si reziu doplni pri renderi)"""
    os.makedirs(FDIR, exist_ok=True)
    fmt = fmt or random.choice(CHOICES["format"])
    print(f"[scenarista] {topic} ({fmt})")
    S = llm_script(topic, fmt)
    ed = llm_edit(S)
    for nb in ed.get("beats", []):
        for b in S["beats"]:
            if b["label"] == nb.get("label") and nb.get("line") and nb["line"] != b["line"]:
                print(f"   [redaktor] {b['label']}: {b['line']}\n              -> {nb['line']}  ({str(nb.get('why', ''))[:80]})")
                b["line"] = nb["line"]
    if ed.get("end_line"):
        S["end_line"] = ed["end_line"]
    if ed.get("title"):
        S["title"] = ed["title"]
    orders = [label_order(b["label"]) for b in S["beats"]]
    if all(o is not None for o in orders) and orders != sorted(orders):
        print("   [rezisér] casove nadpisy mimo poradia -> zoradujem")
        S["beats"] = [b for _, b in sorted(zip(orders, S["beats"]), key=lambda x: x[0])]
    V = llm_visual(S)
    vis = {b.get("label"): b.get("shots") for b in V.get("beats", [])}
    for b in S["beats"]:
        b["shots"] = vis.get(b["label"]) or [{"type": "world", "do": [{"r": "face", "arg": "worried"}]}]
    S["end"] = {"line": S.pop("end_line"), "do": V.get("end_do", [])}
    S["source"] = "groq"                              # scenar od bezplatneho modelu -> pred zverejnenim skontrolovat
    S["topic"] = topic
    return S


def apply_direction(S, hist, rng, d=None):
    """vzhlad videa: chrome, prechod, podanie, kamera, postava, paleta, slucka, hudba - bez opakovania voci historii.
    Co uz spec urcuje (napr. kit, hero), ostava."""
    d = d or direct(hist, rng)
    d["format"] = S.get("format") or d["format"]
    acc, suit, pants, statbg = PALETTES[d["palette"]]
    outfit = S.get("outfit") if S.get("outfit") in ("tshirt", "hoodie", "pajamas", "labcoat", "suit") else rng.choice(["tshirt", "hoodie"])
    S.setdefault("slug", slugify(S.get("title") or S.get("topic", "video")))
    S.setdefault("accent", acc)
    S.setdefault("kit", {"chrome": d["chrome"], "trans": d["trans"], "pres": d["pres"], "cam": d["cam"]})
    S.setdefault("hero", {"outfit": outfit, "hairStyle": d["hair"], "hair": rng.choice(HAIR_COL), "skin": d["skin"], "suit": suit[0], "suitDark": suit[1],
                          "pants": pants[0], "pantsDark": pants[1], "patch": rng.choice(["#f6c343", "#ffffff", "#f28b82"]),
                          "glasses": rng.random() < 0.3, "lashes": d["hair"] in ("long", "bun") or rng.random() < 0.25, "capColor": acc})
    S["hero"].setdefault("species", d["species"] if rng.random() < 0.45 else "human")   # ~1/3 videi zviera, inak clovek
    d["species"] = S["hero"]["species"]
    S.setdefault("loop", "clouds" if S.get("env") in ("space", "field", "mountain") and rng.random() < 0.5 else rng.choice(["blink", "kit"]))
    S.setdefault("music_i", len(hist))
    S.setdefault("cta", d.get("cta", "COMMENT BELOW"))
    for k in ("chrome", "trans", "pres", "cam"):
        d[k] = S["kit"].get(k, d[k])
    d["hair"], d["skin"] = S["hero"].get("hairStyle", d["hair"]), S["hero"].get("skin", d["skin"])
    S["direction"] = d
    for b in S["beats"]:
        for sh in b.get("shots", []):
            if sh.get("panel") == "stat":
                sh.setdefault("bg", statbg)
    return S


def save(S):
    path = os.path.join(FACTORY, "specs", S["slug"] + ".json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(S, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"   spec: {path}  | volby: {S['direction']}")
    return path, S, S["direction"]


def from_queue(seed=None):
    """najstarsi overeny scenar z factory/queue (pise ho Claude v davkach) + vizualna rezia"""
    qdir = os.path.join(FDIR, "queue")
    files = sorted(f for f in os.listdir(qdir) if f.endswith(".json")) if os.path.isdir(qdir) else []
    if not files:
        return None
    S = json.load(open(os.path.join(qdir, files[0]), encoding="utf-8"))
    S["queue_file"] = files[0]
    print(f"[fronta] {files[0]} (zostava {len(files) - 1})")
    return save(apply_direction(S, load(HIST, []), random.Random(seed)))


def remember(S, d):
    hist = load(HIST, [])
    hist.append(dict(d, slug=S["slug"], topic=S.get("topic"), env=S.get("env")))
    json.dump(hist[-30:], open(HIST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def next_topic():
    bank = load(TOPICS, {"topics": [], "used": []})
    for t in bank["topics"]:
        if t not in bank["used"]:
            return t
    raise SystemExit("Banka tem je prazdna (factory/topics.json)")


if __name__ == "__main__":
    t = next_topic() if "--next" in sys.argv else sys.argv[1]
    build_spec(t)
