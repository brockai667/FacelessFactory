# -*- coding: utf-8 -*-
"""Rezisér-kompilator: spec (JSON od rezisera) -> episodes/<slug>/episode.json + script.js.
  python engine/compose.py specs/<slug>.json            -> len epizoda
  python engine/compose.py specs/<slug>.json --snap 1,5  -> + build + snimky
  python engine/compose.py specs/<slug>.json --render    -> + build + render (out/<slug>.mp4)
Spec: slug, title, hook, banner[2], format, env, hero{}, kit{}, music|mood_music, face0, beats[{label, line, shots[
  {type: world, from?, do: [{r, arg?, at?}]} | {type: panel, from?, panel, big?, small?, icon?, badge?, do: [{a, at?}]}]}],
  end{line, do[]}, loop (blink|clouds|kit), description, tags[]. Neznáme veci validator opraví alebo zahodí (nič nespadne)."""
import json
import os
import re
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")   # Windows: presmerovany vystup je cp1250
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)

MUSIC = {  # kluc -> (subor, zaciatok s, kredit)
    "lightless": ("Lightless Dawn.mp3", 8.0, "Lightless Dawn"),
    "echoes": ("Echoes of Time.mp3", 4.0, "Echoes of Time"),
    "spacejazz": ("Space Jazz.mp3", 0.0, "Space Jazz"),
    "arcadia": ("Arcadia.mp3", 1.5, "Arcadia"),
    "inspired": ("Inspired.mp3", 0.0, "Inspired"),
    "hyperfun": ("Hyperfun.mp3", 0.0, "Hyperfun"),
    "pamgaea": ("Pamgaea.mp3", 0.0, "Pamgaea"),
    "cutandrun": ("Cut and Run.mp3", 0.0, "Cut and Run"),
}
MOOD_MUSIC = {"tense": ["cutandrun", "lightless", "echoes"], "playful": ["hyperfun", "pamgaea", "spacejazz"], "wonder": ["inspired", "arcadia", "hyperfun"], "calm": ["inspired", "echoes", "pamgaea"]}
SKIN = {"light": ("#f1c9a5", "#dca87f", "#f2a0a0"), "tan": ("#e3ae82", "#c68b5e", "#e98f86"),
        "brown": ("#b97a4d", "#9a603a", "#d9737a"), "dark": ("#7f5033", "#653d24", "#c0626a")}
ENVS = {
    "room": {"libs": ["env_room.js"], "make": "PF.envRoom({{ calLabel: {lbl}, scene: {scene} }})", "metric0": "–", "stand": True,
             "scenes": {"couch": {}, "desk": {}, "bed": {}}},
    "space": {"libs": ["env_space.js"], "make": "PF.envSpace({{ scene: {scene} }})", "metric0": "0", "float": True,
              "scenes": {"station": {}, "mars": {"stand": True}}},
    "field": {"libs": ["env_field.js"], "make": "PF.envField({{ scene: {scene} }})", "metric0": "", "stand": True, "show": True,
              "scenes": {"meadow": {}, "mountain": {}, "summit": {}, "road": {}, "desert": {}}},
}
ENVS["mountain"] = dict(ENVS["field"], scene0="mountain")   # alias: env "mountain" = lúka so scénou hory (staršie specs)
# scena: "scene" v spec = uvodna scena; "scene" v beate = prepnutie od tohto beatu (prechod robi prostredie, slucka sa vrati)

# panel -> (kniznica, konstruktor, odkial sa "rozbali" na tele (x, y))
PANELS = {
    "kidneys": ("panels_body.js", "PF.panelKidneys({z})", (540, 1120)), "blood": ("panels_body.js", "PF.panelBlood({z})", (430, 1050)),
    "heart": ("panels_body.js", "PF.panelHeart({z})", (590, 950)), "brain": ("panels_body.js", "PF.panelBrain({z})", (540, 650)),
    "ear": ("panels_space.js", "PF.panelEar({z})", (702, 740)), "spine": ("panels_space.js", "PF.panelSpine({z}, {{ badge: {badge} }})", (540, 1050)),
    "bone": ("panels_space.js", "PF.panelBone({z}, {{ badge: {badge} }})", (494, 1330)), "eye": ("panels_space.js", "PF.panelEye({z})", (484, 772)),
    "stat": ("panels_stat.js", "PF.panelStat({z}, {opts})", (540, 900)),
}
# akcie panelov: {t} = cas slova, {t0}/{t1} = zaciatok/koniec zaberu, {p} = premenna panelu
PACT = {
    "kidneys": {"flow": "{p}.breathe({t0}); {p}.flow({t0} + 0.05, {t1} - 0.2, 0.22);",
                "save": "{p}.bladder(1330, {t0} + 0.3, 1.8); {p}.valve(180, {t}); {p}.face('determined', {t}); {p}.lastDrop({t} + 0.35, {t} + 1.0);",
                "fail": "{p}.valveRust({t0}); {p}.bladder(1440, {t0}, 0); {p}.shake({t} - 0.2); {p}.fail({t} + 0.1); {p}.face('sick', {t} + 0.1);"},
    "blood": {"flow": "{p}.cells('cellsA', 11, 1.5, {t0}, {t1}, 11, false);",
              "thick": "{p}.cells('cellsA', 11, 1.5, {t0}, {t}, 21, false); {p}.cells('cellsB', 30, 4.2, {t} - 0.4, {t1}, 12, false); {p}.plasma('#c9564c', {t} - 0.05); {p}.thick({t});",
              "toxins": "{p}.cells('cellsA', 11, 1.8, {t0}, {t1}, 13, false); {p}.toxins({t}, {t1}, 22, 77); {p}.plasma('#7f7040', {t} + 0.3);"},
    "heart": {"beat": "var hb{n} = R.beats({t0} + 0.1, {t1}, 0.75); {p}.rays({t0}, {t1} - {t0}); {p}.beats(hb{n}); {p}.ecg({t0}, {t1}, hb{n});",
              "fast": "var hb{n} = R.beats({t0} + 0.1, {t1}, 0.42); {p}.rays({t0}, {t1} - {t0}); {p}.beats(hb{n}); {p}.ecg({t0}, {t1}, hb{n}); hb{n}.forEach(function (b) {{ PF.VIG(b - 0.02, 0.4); }}); {p}.sweatDrop({t});",
              "slow": "var hb{n} = R.beats({t0} + 0.1, {t1}, 1.15); {p}.rays({t0}, {t1} - {t0}); {p}.beats(hb{n}); {p}.ecg({t0}, {t1}, hb{n});"},
    "brain": {"wobble": "{p}.wobble({t});", "pulse": "{p}.pulse({t});", "shrink": "{p}.shrink({t});"},
    "ear": {"confused": "{p}.zoom({t0} + 0.3); {p}.drift({t}, {t1}, 5); {p}.spin({t} - 0.1, {t1}, 9); {p}.arrows([{t} + 0.2, {t} + 0.6]); {p}.qmarks([{t}, {t} + 0.35, {t} + 0.8]);"},
    "spine": {"stretch": "{p}.wiggle({t} - 0.4); {p}.stretch({t}, 0.9); {p}.badge({t} + 1.0);"},
    "bone": {"weaken": "{p}.pulse({t} - 0.4); {p}.weaken({t}, 3); {p}.calcium({t} + 0.6, {t1}); {p}.badge({t} + 1.0);"},
    "eye": {"flatten": "{p}.hint({t} - 0.5); {p}.flatten({t}, 0.7);", "blur": "{p}.blurry({t}, 0.9);"},
    "stat": {"show": "{p}.show({t0} + 0.1, {t1});"},
}
PDEF = {"kidneys": "flow", "blood": "flow", "heart": "beat", "brain": "pulse", "ear": "confused", "spine": "stretch", "bone": "weaken", "eye": "flatten", "stat": "show"}
RECIPES = {"face", "look", "puffy", "skinny_legs", "thin_arms", "bigger", "taller", "slump", "sweat", "steam", "puff", "pain", "heartbeat", "shiver",
           "zzz", "stars", "yawn", "nod", "thumbs_up", "wave", "hallucinate", "mood", "badge", "level", "organ_off", "recover", "jog", "walk"}
RDUR = {"wave": 1.25, "yawn": 1.5, "thumbs_up": 1.7, "recover": 0.3, "hallucinate": 2.0, "nod": 0.75, "pain": 1.3, "heartbeat": 1.9,
        "mood": 1.0, "sweat": 1.2, "steam": 1.0, "puffy": 0.4, "skinny_legs": 0.45, "thin_arms": 0.5, "bigger": 0.6, "taller": 0.7, "slump": 0.9}
# v2 momenty (lib/moments.js): velke deje a zapojenie divaka; volanie PF.M.<meno>(t, arg, t1, o)
MOMENTS = {"bury", "struggle", "spin", "mask", "reach", "release", "timer", "people", "stamp", "card", "closeup", "shake", "squeeze", "buddy", "rewind", "step", "airpocket", "spit", "wayup", "armup",
           "bottle", "drink", "meter", "jug", "spot", "choice", "pick", "cardie", "cover", "shade", "perch", "thermo", "aerial", "hail",
           "snake", "hand", "movie", "suck", "vial", "count", "venom", "sling", "ride", "antivenom",
           "breath", "gauge", "o2", "co2", "alarm", "burn", "pant", "water", "clear"}
RECIPES |= MOMENTS
RDUR.update({"rewind": 0.9, "step": 0.4, "airpocket": 1.2, "spit": 0.8, "wayup": 0.8, "armup": 1.0, "squeeze": 0.7, "buddy": 0.8, "release": 0.6, "card": 0.6, "stamp": 0.4, "reach": 0.7, "bury": 1.3, "spin": 2.2, "struggle": 1.0, "timer": 1.0, "people": 0.9, "mask": 1.0})
RDUR.update({"drink": 1.9, "jug": 2.2, "cover": 1.5, "shade": 1.0, "perch": 0.7, "thermo": 1.3, "aerial": 2.0, "hail": 1.3, "choice": 0.4, "pick": 0.5, "spot": 0.5, "meter": 0.8, "bottle": 1.4, "cardie": 1.0})
RDUR.update({"snake": 1.0, "hand": 0.6, "movie": 0.6, "suck": 1.6, "vial": 1.1, "count": 2.5, "venom": 1.6, "sling": 0.7, "ride": 0.7, "antivenom": 1.0})
RDUR.update({"breath": 0.6, "gauge": 1.2, "o2": 0.7, "co2": 1.5, "alarm": 1.0, "burn": 1.4, "pant": 2.0, "water": 0.8, "clear": 0.1})
ADUR = {"shiver": 1.4, "zzz": 1.4, "stars": 1.4, "jog": 2.5, "walk": 2.5}
CTAS = ["COMMENT BELOW", "FOLLOW FOR MORE", "SAVE THIS ONE", "SHARE WITH A FRIEND"]   # vyzva na konci; spec "cta": text | false   # recepty s trvanim v arg (s) + predvolene trvanie
FACES = {"neutral", "smile", "happy", "worried", "shocked", "tired", "sleepy", "angry", "pain", "pant", "dry", "sick", "dizzy", "excited"}
SFX_R = {"puffy": [("pop.wav", 0, 0.7)], "skinny_legs": [("pop.wav", 0, 0.7)], "thin_arms": [("pop.wav", 0, 0.6)], "bigger": [("pop.wav", 0, 0.7)],
         "taller": [("swell.wav", -0.1, 0.3)], "pain": [("heartbeat.wav", -0.02, 0.45), ("heartbeat.wav", 0.28, 0.45), ("heartbeat.wav", 0.58, 0.45)],
         "heartbeat": [("heartbeat.wav", 0, 0.5), ("heartbeat.wav", 0.45, 0.5), ("heartbeat.wav", 0.9, 0.5), ("heartbeat.wav", 1.35, 0.5)],
         "shiver": [("wobble.wav", 0, 0.4)], "stars": [("sparkle.wav", 0, 0.4)], "hallucinate": [("swell.wav", 0, 0.35), ("sparkle.wav", 0.4, 0.45)],
         "nod": [("thud.wav", 0.35, 0.35)], "thumbs_up": [("sparkle.wav", 0.1, 0.5)], "recover": [("sparkle.wav", 0.1, 0.5)], "badge": [("pop.wav", 0, 0.7)], "mood": [("swell.wav", 0, 0.3)],
         "face": {"dizzy": [("wobble.wav", 0, 0.5)], "sick": [("wobble.wav", 0, 0.5)], "shocked": [("pop.wav", 0, 0.4)]}}
SFX_R.update({"cardie": [("thud.wav", 0, 0.7), ("wobble.wav", 0.05, 0.5)], "bottle": {"show": [("pop.wav", 0, 0.6)]},
              "drink": [("pour.wav", 0.3, 0.6), ("pop.wav", 1.5, 0.5), ("sparkle.wav", 1.5, 0.4)], "meter": [("tick.wav", 0, 0.6)],
              "jug": [("tick.wav", 0.3, 0.7), ("tick.wav", 0.7, 0.7), ("tick.wav", 1.1, 0.7), ("tick.wav", 1.5, 0.7), ("fill.wav", 0.3, 0.45), ("beep.wav", 2.0, 0.4)],
              "spot": [("pop.wav", 0, 0.6)], "pick": [("pop.wav", 0, 0.6), ("thud.wav", 0.24, 0.5)],
              "choice": {"A": [("pop.wav", 0, 0.7), ("paper.wav", 0, 0.5)], "B": [("pop.wav", 0, 0.7), ("paper.wav", 0, 0.5)], "small": [("whoosh.wav", 0, 0.3)], "big": [("paper.wav", 0, 0.7), ("pop.wav", 0.2, 0.5)]},
              "cover": [("whoosh.wav", 0, 0.5), ("thud.wav", 0.3, 0.6), ("sparkle.wav", 0.95, 0.4)], "shade": [("whoosh.wav", 0, 0.5), ("paper.wav", 0.32, 0.7), ("thud.wav", 0.62, 0.5)],
              "perch": [("whoosh.wav", 0, 0.5), ("thud.wav", 0.52, 0.8)], "thermo": [("pop.wav", 0, 0.6), ("swell.wav", 0.25, 0.35)],
              "aerial": [("pop.wav", 0, 0.6), ("beep.wav", 0.9, 0.4), ("beep.wav", 1.5, 0.4)]})
SFX_R.update({"snake": {None: [("wobble.wav", 0.05, 0.3)], "back": [("whoosh.wav", 0.1, 0.4)],
                        "strike": [("whoosh.wav", -0.12, 0.6), ("thud.wav", 0, 0.8), ("sub_hit.wav", 0, 0.6), ("heartbeat.wav", 0.3, 0.5), ("heartbeat.wav", 0.75, 0.5)]},
              "hand": {"show": [("pop.wav", 0, 0.6)], "swell": [("swell.wav", 0, 0.35), ("heartbeat.wav", 0.1, 0.5), ("heartbeat.wav", 0.55, 0.5)],
                       "ring": [("tick.wav", 0, 0.6), ("tick.wav", 0.15, 0.6), ("pop.wav", 0.4, 0.6), ("sparkle.wav", 0.5, 0.35)], "watch": [("tick.wav", 0, 0.6), ("pop.wav", 0.28, 0.6)]},
              "movie": [("paper.wav", 0, 0.6), ("thud.wav", 0.34, 0.6)], "suck": [("wobble.wav", 0.3, 0.4)],
              "vial": {"show": [("pop.wav", 0, 0.6), ("fill.wav", 0.45, 0.4)], "pct": [("pop.wav", 0, 0.5), ("thud.wav", 0.16, 0.7)]},
              "count": [("tick.wav", 0.25, 0.6), ("tick.wav", 0.6, 0.6), ("tick.wav", 0.95, 0.6), ("tick.wav", 1.3, 0.6), ("tick.wav", 1.65, 0.6), ("tick.wav", 2.0, 0.6), ("thud.wav", 2.45, 0.7)],   # sedi na predvolene dur 2.3
              "venom": {"move": [("swell.wav", 0.2, 0.3), ("heartbeat.wav", 0.2, 0.5), ("heartbeat.wav", 0.6, 0.5), ("heartbeat.wav", 1.0, 0.5), ("heartbeat.wav", 1.4, 0.5)],
                        "still": [("beep.wav", 0, 0.4)], "back": [("sparkle.wav", 0, 0.4)]},
              "sling": [("whoosh.wav", 0, 0.4), ("paper.wav", 0.3, 0.6)], "ride": {None: [("whoosh.wav", 0, 0.6), ("thud.wav", 0.5, 0.4)], "sign": [("pop.wav", 0, 0.6), ("beep.wav", 0.05, 0.35)]},
              "antivenom": [("pop.wav", 0, 0.6), ("sparkle.wav", 0.5, 0.5)]})
SFX_R.update({"breath": {"hold": [("swell.wav", -0.1, 0.35), ("pop.wav", 0.1, 0.6)],
                         "zero": [("tick.wav", -9, 0.5), ("tick.wav", -8, 0.5), ("tick.wav", -7, 0.5), ("tick.wav", -6, 0.5), ("tick.wav", -5, 0.5), ("tick.wav", -4, 0.55),
                                  ("tick.wav", -3, 0.65), ("tick.wav", -2, 0.7), ("tick.wav", -1, 0.75), ("beep.wav", 0, 0.5)],   # kazdy tik = 1 s odpoctu
                         "out": [("whoosh.wav", 0, 0.6), ("sparkle.wav", 0.3, 0.4)], "badge": [("pop.wav", 0, 0.6), ("sparkle.wav", 1.0, 0.45)]},
              "gauge": {None: [("swell.wav", 0.1, 0.35), ("heartbeat.wav", 0.3, 0.5), ("heartbeat.wav", 0.74, 0.5), ("heartbeat.wav", 1.18, 0.5)], "drop": [("whoosh.wav", 0, 0.3)]},
              "o2": {"doubt": [("pop.wav", 0, 0.6), ("beep.wav", 0.32, 0.3), ("beep.wav", 0.76, 0.3), ("beep.wav", 1.2, 0.3)], "full": [("fill.wav", 0.05, 0.45), ("sparkle.wav", 0.6, 0.45)],
                     "pct": [("pop.wav", 0, 0.5), ("thud.wav", 0.16, 0.7)], "check": [("pop.wav", 0, 0.6), ("sparkle.wav", 0.16, 0.5)]},
              "co2": {"pile": [("pop.wav", 0, 0.45), ("pop.wav", 0.19, 0.45), ("pop.wav", 0.38, 0.45), ("pop.wav", 0.56, 0.45), ("pop.wav", 0.75, 0.45), ("pop.wav", 0.94, 0.45), ("pop.wav", 1.12, 0.45), ("pop.wav", 1.31, 0.45), ("pop.wav", 1.5, 0.45)],
                      "glow": [("swell.wav", 0, 0.3), ("pop.wav", 0.05, 0.5)]},
              "alarm": {"ring": [("beep.wav", 0.1, 0.5), ("beep.wav", 0.26, 0.5), ("beep.wav", 0.42, 0.5), ("beep.wav", 0.58, 0.5), ("beep.wav", 0.74, 0.5)],
                        "sock": [("beep.wav", -0.45, 0.5), ("beep.wav", -0.29, 0.5), ("beep.wav", -0.13, 0.5), ("paper.wav", -0.04, 0.6), ("thud.wav", 0.12, 0.6)]},
              "burn": [("swell.wav", 0, 0.35), ("heartbeat.wav", 0.3, 0.45)],
              "pant": [("whoosh.wav", 0.17, 0.35), ("whoosh.wav", 0.51, 0.35), ("whoosh.wav", 0.85, 0.35), ("whoosh.wav", 1.19, 0.35), ("whoosh.wav", 1.53, 0.35), ("wobble.wav", 1.9, 0.35)],
              "water": {None: [("pour.wav", 0, 0.5)], "x": [("thud.wav", 0.16, 0.7), ("sub_hit.wav", 0.16, 0.5)], "dark": [("sub_hit.wav", 0.2, 0.6), ("air_low.wav", 0.3, 0.4)], "off": [("whoosh.wav", 0, 0.3)]}})
SFX_R.update({"rewind": [("whoosh.wav", 0, 0.6), ("wobble.wav", 0.05, 0.5), ("tick.wav", 0.3, 0.6), ("tick.wav", 0.5, 0.6)], "step": [("pop.wav", 0, 0.75), ("tick.wav", 0.08, 0.6)],
              "airpocket": [("paper.wav", 0, 0.5), ("swell.wav", 0.3, 0.3)], "spit": [("pop.wav", 0, 0.6), ("tick.wav", 0.55, 0.8)],
              "wayup": [("sparkle.wav", 0, 0.5), ("pop.wav", 0.02, 0.6)], "armup": [("whoosh.wav", 0, 0.55), ("thud.wav", 0.2, 0.6), ("beep.wav", 0.55, 0.3)],
              "squeeze": [("rumble.wav", 0, 0.5), ("thud.wav", 0.42, 0.8)], "buddy": [("pop.wav", 0.22, 0.5), ("sparkle.wav", 0.4, 0.25)],
              "bury": [("rumble.wav", -0.1, 0.95), ("whoosh.wav", 0.35, 0.5), ("sub_hit.wav", 0.8, 0.75)],
              "stamp": [("thud.wav", 0.1, 0.85), ("sub_hit.wav", 0.1, 0.4)], "struggle": [("wobble.wav", 0, 0.35)],
              "spin": [("wobble.wav", 0, 0.45), ("swell.wav", 0.2, 0.3)], "mask": [("swell.wav", 0, 0.3), ("tick.wav", 0.5, 0.7), ("tick.wav", 0.8, 0.7)],
              "timer": [("tick.wav", 0, 0.8), ("tick.wav", 0.2, 0.8), ("tick.wav", 0.4, 0.8), ("tick.wav", 0.6, 0.8), ("tick.wav", 0.8, 0.8), ("beep.wav", 1.0, 0.45)],
              "people": [("pop.wav", 0, 0.6), ("pop.wav", 0.15, 0.5), ("thud.wav", 0.55, 0.4)], "card": [("paper.wav", 0, 0.75), ("pop.wav", 0.3, 0.5)],
              "reach": [("swell.wav", 0, 0.35), ("sparkle.wav", 0.3, 0.4)], "release": [("whoosh.wav", -0.05, 0.55), ("sparkle.wav", 0.1, 0.4)]})
SFX_P = {"heart": [], "stat": [("pop.wav", 0.1, 0.7), ("sparkle.wav", 0.5, 0.4)], "spine": [("swell.wav", 0, 0.3), ("pop.wav", 1.0, 0.7)],
         "bone": [("paper.wav", 0, 0.55), ("pop.wav", 1.0, 0.7)], "ear": [("wobble.wav", 0, 0.5)], "eye": [("swell.wav", 0, 0.3)],
         "kidneys": [("sub_hit.wav", 0.1, 0.3)], "brain": [("sub_hit.wav", 0, 0.25)], "blood": []}
CHROME_SFX = {"tape": ("paper.wav", 0.55), "sticky": ("paper.wav", 0.6), "stamp": ("thud.wav", 0.45), "bubble": ("pop.wav", 0.6)}
TRANS_SFX = {"circle": [("whoosh.wav", 0, 0.35)], "page": [("paper.wav", 0, 0.55), ("whoosh.wav", 0.05, 0.25)],
             "tear": [("paper.wav", 0, 0.7)], "zoom": [("whoosh.wav", 0, 0.4)]}


def norm(w):
    return re.sub(r"[^a-z0-9]", "", str(w).lower())


def words(line):
    return [norm(w) for w in line.split() if norm(w)]


def js(v):
    return json.dumps(v, ensure_ascii=False)


class Composer:
    def __init__(self, spec):
        self.S = spec
        self.warn = []
        self.sfx = []
        self.js = []
        self.n = 0
        self.day_on = False

    # ---------- validacia a doplnenie spec
    def anchor(self, key, line, w):
        """JS vyraz pre cas slova (alebo None, ak slovo vo vete nie je)"""
        if not w:
            return None
        w, nth = (str(w).split("#") + ["0"])[:2]
        ws = words(line)
        if norm(w) not in ws:
            # skus prefix (LLM napise "puff" pre "puffs")
            cand = [x for x in ws if x.startswith(norm(w)) or norm(w).startswith(x) and len(x) > 3]
            if not cand:
                self.warn.append(f"{key}: slovo '{w}' nie je vo vete")
                return None
            w = cand[0]
        k = ws.count(norm(w))
        nth = min(int(nth or 0), k - 1)
        return f'at("{key}", "{norm(w)}"' + (f", {nth})" if nth else ")"), f"{key}:{norm(w)}" + (f"#{nth}" if nth else "")

    def validate(self):
        S = self.S
        S.setdefault("env", "room")
        if S["env"] not in ENVS:
            self.warn.append(f"nezname prostredie {S['env']} -> room")
            S["env"] = "room"
        env = ENVS[S["env"]]
        S["scene"] = S.get("scene") or env.get("scene0") or list(env["scenes"])[0]
        if S["scene"] not in env["scenes"]:
            self.warn.append(f"nezname scena {S['scene']} -> {list(env['scenes'])[0]}")
            S["scene"] = list(env["scenes"])[0]
        used = set()
        for bi, b in enumerate(S["beats"]):
            b["key"] = f"b{bi + 1}"
            if b.get("scene") and b["scene"] not in env["scenes"]:
                self.warn.append(f"{b['key']}: nezname scena {b['scene']} -> bez zmeny")
                b.pop("scene")
            shots, extra = [], []
            for sh in b.get("shots") or [{"type": "world", "do": []}]:
                if sh.get("type") == "panel" or sh.get("panel"):
                    sh["type"] = "panel"
                    p = sh.get("panel")
                    if p == "stat":                   # LLM niekedy da big/small/icon do "do" zoznamu
                        for a in sh.get("do", []):
                            for key in ("big", "small", "icon"):
                                if key in a and key not in sh:
                                    sh[key] = a[key]
                                if a.get("a") == key and a.get("at") and key not in sh:
                                    sh[key] = a["at"]
                        sh.setdefault("big", "?")
                        if sh.get("icon") not in ("clock", "calendar", "drop", "heart", "brain", "bolt", "flame", "snow", "moon", "bone", "cup", "bed",
                                                  "sun", "phone", "rocket", "lungs", "muscle", "apple", "up", "down", "eye"):
                            sh["icon"] = "clock"
                        sh["do"] = [a for a in sh.get("do", []) if a.get("a") == "show"] or [{"a": "show"}]
                    if p not in PANELS:
                        self.warn.append(f"{b['key']}: nezname panel {p} -> preskakujem")
                        continue
                    if p != "stat" and p in used:
                        self.warn.append(f"{b['key']}: panel {p} uz bol -> preskakujem")
                        continue
                    used.add(p)
                    acts = [a for a in sh.get("do", []) if a.get("a") in PACT[p]] or [{"a": PDEF[p]}]
                    sh["do"] = acts[:2]
                else:
                    sh["type"] = "world"
                    acts = []
                    for a in sh.get("do", []):
                        r = a.get("r")
                        if r not in RECIPES:                  # typicke chyby LLM: {"r": "you", "arg": "shiver"} / {"r": "worried"}
                            if a.get("arg") in RECIPES:
                                r, a["arg"] = a["arg"], None
                            elif a.get("arg") in FACES:
                                r = "face"
                            elif r in FACES:
                                r, a["arg"] = "face", r
                            a["r"] = r
                        if r not in RECIPES:
                            self.warn.append(f"{b['key']}: nezname r={r} -> preskakujem")
                            continue
                        if r == "face" and a.get("arg") not in FACES:
                            a["arg"] = "worried"
                        if r == "badge" and not ENVS[S["env"]].get("stand") or r == "badge" and S["env"] != "room":
                            # odznak len v izbe; inde z neho bude panel s udajom
                            extra.append({"type": "panel", "panel": "stat", "big": str(a.get("arg", "?")), "small": str(a.get("small", "")),
                                          "icon": a.get("icon", "clock"), "from": a.get("at"), "do": [{"a": "show"}]})
                            continue
                        acts.append(a)
                    sh["do"] = acts[:(6 if S.get("v") == 2 else 3)]
                shots.append(sh)
                shots += extra; extra = []
            b["shots"] = shots or [{"type": "world", "do": [{"r": "face", "arg": "worried"}]}]
        S.setdefault("end", {"line": "What do you think?", "do": []})
        S.setdefault("loop", "blink")
        S.setdefault("face0", "smile")

    # ---------- vystup
    def emit(self, s):
        self.js.append(s)

    def fx(self, f, anchor, off, vol):
        self.sfx.append([f, anchor, round(off, 2), vol])

    def compose(self):
        S = self.S
        self.validate()
        env = ENVS[S["env"]]
        kit = dict({"chrome": "tape", "trans": "circle", "pres": "full", "cam": "calm"}, **S.get("kit", {}))
        H = dict(S.get("hero", {}))
        sk = SKIN.get(H.pop("skin", "light"), SKIN["light"])
        hero = dict({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#4a3226", "suit": "#3f73b8", "suitDark": "#2f5a93",
                     "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18,
                     "skin": sk[0], "skinDark": sk[1], "blush": sk[2]}, **H)
        accent = S.get("accent", "#2a74b3")
        beats, end = S["beats"], S["end"]
        keys = [b["key"] for b in beats] + ["end"]
        lines = {"hook": S["hook"]}
        for b in beats:
            lines[b["key"]] = b["line"]
        lines["end"] = end["line"]
        # metrika (napr. "HOUR 24" -> nadpis HOUR, cislo 24)
        lbl0 = ""
        for b in beats:
            mc = re.match(r"^\s*#\s*([0-9]+)\s*$", b["label"])   # odpocet "#3" -> pocitadlo TOP 3
            if mc:
                b["metric"] = b.get("metric") or mc.group(1); b["unit"] = "TOP"
                lbl0 = lbl0 or "TOP"
                continue
            m = re.match(r"^\s*([A-Za-z#°]+)\s+([0-9][0-9,.]*)\s*$", b["label"]) or re.match(r"^\s*([0-9][0-9,.]*)\s*([A-Za-z°%]+)\s*$", b["label"])
            b["metric"] = b.get("metric") or (m.group(2) if m and m.group(1)[0].isalpha() else (m.group(1) if m else ""))
            if m:                                     # nadpis pocitadla per zaber: "HOUR" z "HOUR 24", "WEEKS" z "2 WEEKS" (jednotka sa meni)
                b["unit"] = (m.group(1) if m.group(1)[0].isalpha() else m.group(2)).upper().lstrip("#")
                lbl0 = lbl0 or b["unit"]
        libs = ["core.js", "fx.js"] + env["libs"] + ["char_biped.js"]
        for b in beats:
            for sh in b["shots"]:
                if sh["type"] == "panel" and PANELS[sh["panel"]][0] not in libs:
                    libs.append(PANELS[sh["panel"]][0])
        libs.append("recipes.js")
        if S.get("v") == 2:
            libs.append("moments.js")

        E = self.emit
        E(f"// AUTO z compose.py: {S['title']}  (env {S['env']}, kit {kit['chrome']}/{kit['trans']}/{kit['pres']}/{kit['cam']})")
        E('var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;')
        scene0 = S["scene"]
        stands = lambda sc: bool(env["scenes"][sc].get("stand", env.get("stand", False)))   # postava stoji (tien) alebo sa vznasa
        E("var env = " + env["make"].format(lbl=js(lbl0 or "DAY"), scene=js(scene0)) + ";")
        if S.get("v") == 2 and S["env"] == "room":           # v2 nema pocitadlo dni: kalendar a teplomer na stene by len rusili
            E('document.getElementById("rm_gauges").style.display = "none";')
        if env.get("show"):
            E("env.show(true, 0);")
        E("var hero = PF.charBiped(" + js(hero) + ");")
        E("R.init(" + js({"face0": S["face0"], "arms0": [hero["armL"], hero["armR"]], "look0": [0, 0], "level0": 60, "accent": accent})[:-1] + ", hero: hero, env: env });")
        if lbl0 and S["env"] != "room":               # napr. obrazovka stanice: "HOURS" / "TOP" namiesto "MISSION DAY"
            E(f"env.metricLabel({js(lbl0)}, 0);")
        E("PF.fx.dust(20, 314" + (', "#ffffff"' if S["env"] == "space" else "") + ");")
        if env.get("stand"):
            E("hero.shadow(true, 0);")
        else:
            E("hero.shadow(false, 0);")
        # panely: z podla poradia prveho pouzitia; kazdy stat panel zvlast
        E("var P = {};")
        z, pvar = 3, {}
        for b in beats:
            for i, sh in enumerate(b["shots"]):
                p = sh["panel"] if sh["type"] == "panel" else None
                if not p:
                    continue
                v = f'P.{p}' if p != "stat" else f'P.stat{z}'
                sh["var"] = v
                if p == "stat":
                    opts = {"big": str(sh.get("big", "?"))[:12], "small": str(sh.get("small", ""))[:22], "icon": sh.get("icon", "clock"),
                            "bg": sh.get("bg", "#e9e3f3"), "accent": accent}
                    E(f"{v} = " + PANELS[p][1].format(z=z, opts=js(opts)) + ";")
                elif v not in pvar:
                    badge = sh.get("badge") or (["UP TO", "+2 in", "TALLER"] if p == "spine" else ["−1%", "PER MONTH"])
                    E(f"{v} = " + PANELS[p][1].format(z=z, badge=js(badge)) + ";")
                pvar[v] = z
                z += 1

        # ---------- casy zaberov
        E("var T = {};")
        E('T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");')
        for bi, b in enumerate(beats):
            nxt = beats[bi + 1]["key"] if bi + 1 < len(beats) else "end"
            E(f'T.{b["key"]} = s0("{b["key"]}");')
            for i, sh in enumerate(b["shots"]):
                if i == 0:
                    sh["t0"] = f'T.{b["key"]}'
                else:
                    a = self.anchor(b["key"], b["line"], sh.get("from"))
                    sh["t0"] = f"T.{b['key']}_{i}"
                    E(f"{sh['t0']} = " + (f"{a[0]} - 0.3" if a else f'T.{b["key"]} + (s0("{nxt}") - T.{b["key"]}) * {i / len(b["shots"]):.2f}') + ";")
            for i, sh in enumerate(b["shots"]):
                sh["t1"] = b["shots"][i + 1]["t0"] if i + 1 < len(b["shots"]) else f's0("{nxt}")'

        # ---------- HOOK
        E("\n// ===== HOOK (prvy snimok = posledny)")
        op = S.get("open") or {}
        v2 = S.get("v") == 2
        if v2:
            E("PF.M.handheld();")
        if S.get("hook_mode") == "B":   # hak B (v2): video zacina priamo dejom -> celok, nadpis buchne, dej riesi hook_do s casom "@s"
            E('R.camSet("wide", 0); R.camHold(0.3);')
            E('PF.tl.fromTo("#hookIn", { scale: 1.55 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, 0);')
            self.fx("sub_hit.wav", "hook", -0.1, 0.5)
        elif op:   # otvorenie v napati (27.10.): prve 0,3 s rozhoduju -> zaber na tvar s odjazdom, nalada temy od 0, banner buchne, naraz zvuku
            E('R.camSet("face", 0); PF.CAM(1.08, 560, 900, 0.1, 0.5, "power3.out"); PF.CAM(1.0, 540, 960, 0.62, Math.max(0.3, T.b1 - 0.7), "sine.inOut"); R.camHold(T.b1 - 0.05);')
            E('PF.tl.fromTo("#hookIn", { scale: 1.3 }, { scale: 1, duration: 0.35, ease: "back.out(2)", immediateRender: false }, 0);')
            if op.get("mood"):                        # nalada hned od 1. snimku: jej uvodne prelinanie (t = 0) skratene na 0,02 s
                E(f'(function () {{ var b = PF.tl.getChildren(false, true, true); R.mood(0, {js(op["mood"])}, T.b1); '
                  'PF.tl.getChildren(false, true, true).forEach(function (c) { if (b.indexOf(c) < 0 && c.startTime() < 0.05 && c.duration() > 0.02) c.duration(0.02); }); })();')
            self.fx("sub_hit.wav", "hook", -0.08, 0.6)
            self.fx("whoosh.wav", "hook", -0.05, 0.4)
        else:
            E('R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);')
        E(f'R.setFace(0, "{S["face0"]}", 0); hero.look(0, 0, 0, 0);')
        if env.get("float"):
            E("hero.bob(0, T.b1 - 0.2);")
        self.world_actions("hook", S["hook"], S.get("hook_do", []), "0.2", "T.b1", in_hook=True)
        hh = self.anchor("hook", S["hook"], S["hook_hide"]) if S.get("hook_hide") else None   # v2: nadpis zmizne skor (napr. ked v haku vyskocia karty volby)
        E(f'PF.O("#hook", 1, 0, {hh[0]} - 0.22, 0.18);' if hh else 'PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);')
        ch = CHROME_SFX.get(kit["chrome"], CHROME_SFX["tape"])

        # ---------- BEATY
        prev, cur_lbl, cur_scene = None, lbl0, scene0   # predosly zaber (world | var panelu), aktualny nadpis metriky, aktualna scena
        for bi, b in enumerate(beats):
            k = b["key"]
            E(f"\n// ===== {b['label']}: {b['line']}")
            if b["label"]:
                self.fx("tick.wav", k, 0.02, 0.9)
                self.fx("sub_hit.wav", k, 0, 0.45)
                self.fx(ch[0], k, 0.03, ch[1])
                if not self.day_on:
                    E(f'PF.O("#day", 0, 1, T.{k}, 0.05);')
                    self.day_on = True
                E(f'PF.DAY({js(b["label"])}, T.{k});')
            if b.get("scene") and b["scene"] != cur_scene:   # zmena sceny (napr. hory -> vrchol); prechod + zvuk
                E(f'env.scene({js(b["scene"])}, T.{k} + 0.05);')
                self.fx("paper.wav" if S["env"] == "room" else "whoosh.wav", k, -0.25 if S["env"] == "room" else -0.45, 0.55)
                if stands(b["scene"]) != stands(cur_scene):
                    E(f'hero.shadow({js(stands(b["scene"]))}, T.{k} + 0.05);')
                cur_scene = b["scene"]
            if b.get("unit") and b["unit"] != cur_lbl:   # zmena jednotky: DAY 1 -> WEEK 1 -> WEEKS 2 (kalendar / obrazovka)
                cur_lbl = b["unit"]
                E(f'env.metricLabel({js(cur_lbl)}, T.{k} + 0.02);')
            if b.get("metric"):
                E(f'env.metric({js(b["metric"])}, T.{k} + 0.02);')
            for i, sh in enumerate(b["shots"]):
                prev = self.shot(b, i, sh, prev, kit)
        # ---------- KONIEC
        E(f"\n// ===== KONIEC: {end['line']}")
        endsh = {"type": "world", "t0": "T.end", "t1": "T.tot", "do": end.get("do", [])}
        prev = self.shot({"key": "end", "line": end["line"], "label": ""}, 0, endsh, prev, kit, is_end=True)
        # ---------- SLUCKA bez zakrytia: po dobehnuti pohybov konca sa vsetko plynulo vrati do prveho snimku + zjavi sa hook
        wl = words(end["line"]); last = wl[-1]; lastn = wl.count(last) - 1
        E("\n// ===== SLUCKA (plynuly navrat, ziadne zakrytie)")
        ends = [f'at("end", "{last}", {lastn}, "e") + 0.1']
        for a in end.get("do", []):
            anc = self.anchor("end", end["line"], a.get("at"))
            dur = float(a.get("arg") or ADUR[a["r"]]) if a["r"] in ADUR else RDUR.get(a["r"], 0.6)
            if anc:
                ends.append(f"{anc[0]} + {dur + 0.05:.2f}")
        if v2:                                        # v2: pointa doznie, kratky nadych, rychly navrat (ziadne ticho na konci)
            E("var tc = T.tot - 0.62;")
        else:
            E(f'var tc = Math.min(Math.max({", ".join(ends)}), T.tot - 1.2);')
        cta = S.get("cta", S.get("direction", {}).get("cta"))
        if cta is None:
            cta = False if v2 else CTAS[sum(map(ord, S["slug"])) % len(CTAS)]
        if cta:
            E(f'PF.CTA({js(str(cta).upper())}, T.end + 0.6, tc - 0.05);')
            self.fx("pop.wav", "end", 0.6, 0.5)
        E("PF.WORLD(true, tc); R.settle(tc, T.tot" + (", { fast: true, day: " + js(self.day_on) + " }" if v2 else "") + ");")
        if cur_scene != scene0:                       # slucka: spat do uvodnej sceny
            E(f'env.scene({js(scene0)}, tc + 0.35);')
            if stands(scene0) != stands(cur_scene):
                E(f'hero.shadow({js(stands(scene0))}, tc + 0.35);')
        if env["metric0"]:
            E(f'env.metric({js(env["metric0"])}, tc + 0.15);')
            if cur_lbl != lbl0:
                E(f'env.metricLabel({js(lbl0)}, tc + 0.15);')
        if env.get("float"):
            E('PF.XY("hero_float", { ty: -22, r: 3 }, T.tot - 1.4, 0.7, "sine.inOut", 1);')

        # ---------- episode.json
        mood = S.get("mood_music", "calm")
        mkey = S.get("music") if S.get("music") in MUSIC else MOOD_MUSIC.get(mood, MOOD_MUSIC["calm"])[S.get("music_i", 0) % len(MOOD_MUSIC.get(mood, MOOD_MUSIC["calm"]))]
        mf, mat, mname = MUSIC[mkey]
        mf = os.path.join(FACTORY, "assets", "music", mf)
        E_json = {
            "title": S["title"], "hook": S["banner"], "voice": S.get("voice", "en-US-AndrewNeural"), "rate": S.get("rate", "+0%"),
            "gap": S.get("gap", 0.14 if v2 else 0.5),   # v2: len nadych medzi vetami (0,5 s x 6 viet boli 3 s ticha)
            "tail": S.get("tail", 0.85) if v2 else round(1.4 + max([0] + [RDUR.get(a["r"], 0.6) - 0.5 for a in end.get("do", [])]), 2),
            "bg": S.get("bg", "#e8a18c" if S["env"] == "room" else "#dfe6ee"), "accent": accent, "kit": kit, "libs": libs,
            "description": (S.get("description", "") + "\n" + (S.get("tags") if isinstance(S.get("tags"), str) else " ".join(S.get("tags") or [])) + "\nNot medical advice.").strip(),
            "music": {"file": mf, "at": mat, "vol": music_vol(mf, mat),
                      "credit": music_credit(mname)},
            "lines": lines, "sfx": self.sfx}
        return E_json, "\n".join(self.js) + "\n"

    # ---------- jeden zaber
    def shot(self, b, i, sh, prev, kit, is_end=False):
        E, k = self.emit, b["key"]
        t0, t1 = sh["t0"], sh["t1"]
        tr_anchor = (k if i == 0 else None)
        if sh["type"] == "panel":
            v = sh["var"]
            focus = PANELS[sh["panel"]][2]
            if prev == "world" or prev is None:
                E(f"PF.panelIn({v}.id, {t0} - 0.27, {focus[0]}, {focus[1]}); PF.WORLD(false, {t0} + 0.2);")
            else:
                E(f"PF.panelSwap({prev}.id, {v}.id, {t0} - 0.4);")
            if tr_anchor:
                for f, off, vol in TRANS_SFX[kit["trans"]]:
                    self.fx(f, tr_anchor, -0.3 + off, vol)
            E(f'F("body", {t0} + 0.7);' if kit["pres"] == "card" else f'R.camSet("body", {t0} + 0.35);')
            for a in sh["do"]:
                anc = self.anchor(k, b["line"], a.get("at"))
                t = anc[0] if anc else f"({t0} + 0.5)"
                self.n += 1
                E(PACT[sh["panel"]][a["a"]].format(p=v, t=t, t0=t0, t1=t1, n=self.n))
                for f, off, vol in SFX_P.get(sh["panel"], []):
                    if anc:
                        self.fx(f, anc[1], off, vol)
            return v
        # svet
        if prev not in ("world", None):
            E(f"PF.WORLD(true, {t0} - 0.3); PF.panelOut({prev}.id, {t0} - 0.27, -1);")
            if tr_anchor:
                for f, off, vol in TRANS_SFX[kit["trans"]]:
                    self.fx(f, tr_anchor, -0.3 + off, vol)
        self.world_actions(k, b["line"], sh["do"], t0, t1)
        return "world"

    def world_actions(self, k, line, acts, t0, t1, in_hook=False):
        E = self.emit
        E(f'F("body", {t0} + 0.1);' if not in_hook else "")
        ws = words(line)
        # chronologicke poradie (stavove API a kamera ratajú s poradim volani)
        def order(a):                                 # "@1.2" = cas v sekundach od zaciatku vety (deje mimo slov), inak poradie slova
            at = str(a.get("at", ""))
            if at.startswith("@"):
                return -1 + float(at[1:]) / 1000
            w = norm(at.split("#")[0])
            return ws.index(w) if w in ws else 99
        acts = sorted(acts, key=order)
        times = []
        for j, a in enumerate(acts):
            at = str(a.get("at", ""))
            if at.startswith("@"):
                anc = (f'(s0("{k}") + {float(at[1:])})', k)
                sfx_off = float(at[1:])
            else:
                anc = self.anchor(k, line, a.get("at"))
                sfx_off = 0
            t = anc[0] if anc else f"({t0} + {0.45 + j * 0.9:.2f})"
            r, arg = a["r"], a.get("arg")
            if r in MOMENTS:
                call = f'PF.M.{r}({t}, {js(arg)}, {t1}, {js(a.get("o") or {})})'
            elif r == "mood":
                call = f'R.mood({t}, {js(arg or "normal")}, {t1})'
            elif r == "badge":
                call = f'R.badge({t}, {js(str(arg))}, {js(str(a.get("small", "")))}, {t1})'
            elif r in ("heartbeat",):
                call = f"R.heartbeat({t}, {int(arg or 4)})"
            elif r in ADUR:
                d = float(arg or ADUR[r])
                if r in ("jog", "walk"):              # beh/chodza musi dobehnut pred koncom zaberu
                    call = f"R.{r}({t}, Math.max(0.8, Math.min({d}, {t1} - ({t}) - 0.3)))"
                else:
                    call = f"R.{r}({t}, {d})"
            elif r in ("face", "look", "level", "organ_off"):
                call = f"R.{r}({t}, {js(arg)})"
            else:
                call = f"R.{r}({t})"
            E(f"F({call}, {t});" if not in_hook else f"{call};")
            times.append(t)
            sx = SFX_R.get(r)
            if isinstance(sx, dict):
                sx = sx.get(arg, [])
            for f, off, vol in (sx or []):
                if anc:
                    self.fx(f, anc[1], off + sfx_off, vol)
        # zmurknutia v tichu (len ak ziadny recept nemeni viecka -> stav viecok ostava konzistentny)
        if not any(a["r"] in ("face", "slump", "yawn", "nod", "recover", "hallucinate", "thumbs_up", "bury", "struggle", "spin", "reach", "release", "rewind", "airpocket", "spit", "wayup", "armup", "drink", "jug", "snake", "suck", "venom", "ride", "antivenom", "breath", "pant", "water", "burn", "gauge", "co2", "alarm") for a in acts):
            E(f"hero.blink({t0} + 1.2); if ({t1} - {t0} > 3.2) hero.blink({t0} + 2.9);")


_VOL = {}


# Kredit hudby v popise videa LEN ked ho licencia vyzaduje. Kevin MacLeod (incompetech.com) = CC BY 4.0 -> autor sa uvadzat MUSI.
# Skladba bez tejto povinnosti (CC0 / public domain / vlastna): jej nazov (3. polozka v MUSIC) pridat do NO_CREDIT
# -> riadok "Music: ..." sa do popisu neda.
NO_CREDIT = set()


def music_credit(mname):
    return "" if mname in NO_CREDIT else f'Music: "{mname}" - Kevin MacLeod (incompetech.com), licensed under CC BY 4.0'


def music_vol(f, at, target=-22.0):
    """hlasitost hudby tak, aby priemer vysiel ~target dB (skladby maju rozne urovne)"""
    if f in _VOL:
        return _VOL[f]
    try:
        import numpy as np
        raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", str(at), "-i", f, "-t", "45", "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                             capture_output=True).stdout
        x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        db = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
        _VOL[f] = round(float(10 ** ((target - db) / 20)), 2)
    except Exception:
        _VOL[f] = 0.6
    return _VOL[f]


def main():
    spec_path = os.path.abspath(sys.argv[1])
    S = json.load(open(spec_path, encoding="utf-8"))
    C = Composer(S)
    ep, script = C.compose()
    d = os.path.join(FACTORY, "episodes", S["slug"])
    os.makedirs(d, exist_ok=True)
    json.dump(ep, open(os.path.join(d, "episode.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(d, "script.js"), "w", encoding="utf-8").write(script)
    print("compose ok:", S["slug"], "|", len(S["beats"]), "beatov |", len(ep["sfx"]), "sfx |", "varovania:", C.warn or "ziadne")
    if "--snap" in sys.argv:
        times = sys.argv[sys.argv.index("--snap") + 1]
        subprocess.run([sys.executable, os.path.join(HERE, "snap.py"), d, times])
    elif "--render" in sys.argv:
        subprocess.run([sys.executable, os.path.join(HERE, "build.py"), d, "--render"])
    return d


if __name__ == "__main__":
    main()
