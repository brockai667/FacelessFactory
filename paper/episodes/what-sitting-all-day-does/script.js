// AUTO z compose.py: What sitting all day does  (env room, kit tape/tear/card/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "TOP", scene: "desk" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "suit", "hairStyle": "cap", "hair": "#6b6b6b", "suit": "#e0674f", "suitDark": "#bf4f3a", "patch": "#f28b82", "pants": "#3a4a5a", "pantsDark": "#2a3642", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0", "glasses": false, "lashes": false, "capColor": "#d9483b"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#d9483b", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.blood = PF.panelBlood(3);
P.heart = PF.panelHeart(4);
P.stat5 = PF.panelStat(5, {"big": "6.5 HRS", "small": "SITTING EACH DAY", "icon": "clock", "bg": "#f7e3d9", "accent": "#d9483b"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== #5: Sitting for hours makes your muscles stiff and your back ache.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("#5", T.b1);
env.metric("5", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "stiff"), "tired"), at("b1", "stiff"));
F(R.slump(at("b1", "ache")), at("b1", "ache"));

// ===== #4: The longer you sit, the slower blood flows through your legs.
PF.DAY("#4", T.b2);
env.metric("4", T.b2 + 0.02);
PF.panelIn(P.blood.id, T.b2 - 0.27, 430, 1050); PF.WORLD(false, T.b2 + 0.2);
F("body", T.b2 + 0.7);
P.blood.cells('cellsA', 11, 1.5, T.b2, s0("b3"), 11, false);

// ===== #3: Your hip muscles can tighten and shorten from sitting too long.
PF.DAY("#3", T.b3);
env.metric("3", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.blood.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.face(at("b3", "tighten"), "pain"), at("b3", "tighten"));
F(R.shiver(at("b3", "shorten"), 1.0), at("b3", "shorten"));

// ===== #2: Sitting most of the day is linked to a higher risk of heart disease.
PF.DAY("#2", T.b4);
env.metric("2", T.b4 + 0.02);
PF.panelIn(P.heart.id, T.b4 - 0.27, 590, 950); PF.WORLD(false, T.b4 + 0.2);
F("body", T.b4 + 0.7);
var hb2 = R.beats(T.b4 + 0.1, s0("b5"), 1.15); P.heart.rays(T.b4, s0("b5") - T.b4); P.heart.beats(hb2); P.heart.ecg(T.b4, s0("b5"), hb2);

// ===== #1: On average, adults spend about six and a half hours a day sitting.
PF.DAY("#1", T.b5);
env.metric("1", T.b5 + 0.02);
PF.panelSwap(P.heart.id, P.stat5.id, T.b5 - 0.4);
F("body", T.b5 + 0.7);
P.stat5.show(T.b5 + 0.1, s0("end"));

// ===== KONIEC: So, how many hours did you sit today?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.stat5.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.recover(at("end", "sit")), at("end", "sit"));
F(R.wave(at("end", "today")), at("end", "today"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "today", 0, "e") + 0.1, at("end", "sit") + 0.35, at("end", "today") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.metric("–", tc + 0.15);
