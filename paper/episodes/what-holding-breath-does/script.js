// AUTO z compose.py: What holding breath does  (env room, kit stamp/zoom/card/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "SECONDS" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "cap", "hair": "#6b6b6b", "suit": "#3fa37c", "suitDark": "#2f7f60", "patch": "#ffffff", "pants": "#2f3e46", "pantsDark": "#222d33", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#b97a4d", "skinDark": "#9a603a", "blush": "#d9737a", "glasses": false, "lashes": true, "capColor": "#2f8f6a"});
R.init({"face0": "neutral", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2f8f6a", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.brain = PF.panelBrain(3);
P.stat4 = PF.panelStat(4, {"big": "30-90", "small": "SECONDS TYPICAL", "icon": "clock", "bg": "#e1f1e8", "accent": "#2f8f6a"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b2_1 = at("b2", "carbon") - 0.3;
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b4_1 = at("b4", "urge") - 0.3;

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "neutral", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 10 SECONDS: For the first ten seconds or so, holding your breath feels easy.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("10 SECONDS", T.b1);
env.metric("10", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "easy"), "smile"), at("b1", "easy"));

// ===== 30 SECONDS: By thirty seconds, rising carbon dioxide creates a strong urge to breathe.
PF.DAY("30 SECONDS", T.b2);
env.metric("30", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.face(at("b2", "seconds"), "worried"), at("b2", "seconds"));
PF.panelIn(P.brain.id, T.b2_1 - 0.27, 540, 650); PF.WORLD(false, T.b2_1 + 0.2);
F("body", T.b2_1 + 0.7);
P.brain.pulse(at("b2", "urge"));

// ===== 60 SECONDS: After sixty seconds, your diaphragm can start to spasm and jerk.
PF.DAY("60 SECONDS", T.b3);
env.metric("60", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.brain.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.pain(at("b3", "spasm")), at("b3", "spasm"));
F(R.face(at("b3", "jerk"), "pain"), at("b3", "jerk"));

// ===== 90 SECONDS: By about ninety seconds, most people already feel a strong urge to gasp.
PF.DAY("90 SECONDS", T.b4);
env.metric("90", T.b4 + 0.02);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "seconds"), "tired"), at("b4", "seconds"));
PF.panelIn(P.stat4.id, T.b4_1 - 0.27, 540, 900); PF.WORLD(false, T.b4_1 + 0.2);
F("body", T.b4_1 + 0.7);
P.stat4.show(T.b4_1 + 0.1, s0("end"));

// ===== KONIEC: Did you hold your breath while watching this?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.stat4.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.recover(at("end", "hold")), at("end", "hold"));
F(R.wave(at("end", "watching")), at("end", "watching"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "this", 0, "e") + 0.1, at("end", "hold") + 0.35, at("end", "watching") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.metric("–", tc + 0.15);
