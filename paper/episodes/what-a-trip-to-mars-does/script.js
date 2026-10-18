// AUTO z compose.py: What a trip to Mars does  (env space, kit tape/tear/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envSpace({ scene: "station" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "suit", "hairStyle": "curly", "hair": "#8a5a2b", "suit": "#8e7cc3", "suitDark": "#6d5ca6", "patch": "#f28b82", "pants": "#3b3552", "pantsDark": "#2a2640", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0", "glasses": true, "lashes": false, "capColor": "#7a5fa0"});
R.init({"face0": "excited", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#7a5fa0", hero: hero, env: env });
env.metricLabel("TOP", 0);
PF.fx.dust(20, 314, "#ffffff");
hero.shadow(false, 0);
var P = {};
P.stat3 = PF.panelStat(3, {"big": "HIGH", "small": "RADIATION", "icon": "bolt", "bg": "#ece6f6", "accent": "#7a5fa0"});
P.bone = PF.panelBone(4, { badge: ["−1%", "PER MONTH"] });
P.stat5 = PF.panelStat(5, {"big": "38%", "small": "MARS GRAVITY", "icon": "down", "bg": "#ece6f6", "accent": "#7a5fa0"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b2_1 = at("b2", "radiation") - 0.3;
T.b3 = s0("b3");
T.b3_1 = at("b3", "bones") - 0.3;
T.b4 = s0("b4");
T.b4_1 = at("b4", "percent") - 0.3;
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "excited", 0); hero.look(0, 0, 0, 0);
hero.bob(0, T.b1 - 0.2);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== #5: The trip to Mars alone can take seven to nine months.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("#5", T.b1);
env.metric("5", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "trip"), "excited"), at("b1", "trip"));
F(R.face(at("b1", "months"), "shocked"), at("b1", "months"));

// ===== #4: Deep space radiation levels are far higher than on Earth.
PF.DAY("#4", T.b2);
env.metric("4", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.face(at("b2", "space"), "worried"), at("b2", "space"));
PF.panelIn(P.stat3.id, T.b2_1 - 0.27, 540, 900); PF.WORLD(false, T.b2_1 + 0.2);
R.camSet("body", T.b2_1 + 0.35);
P.stat3.show(T.b2_1 + 0.1, s0("b3"));

// ===== #3: In microgravity, your muscles and bones can quickly weaken.
PF.DAY("#3", T.b3);
env.metric("3", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.stat3.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.thin_arms(at("b3", "muscles")), at("b3", "muscles"));
hero.blink(T.b3 + 1.2); if (T.b3_1 - T.b3 > 3.2) hero.blink(T.b3 + 2.9);
PF.panelIn(P.bone.id, T.b3_1 - 0.27, 494, 1330); PF.WORLD(false, T.b3_1 + 0.2);
R.camSet("body", T.b3_1 + 0.35);
P.bone.pulse(at("b3", "weaken") - 0.4); P.bone.weaken(at("b3", "weaken"), 3); P.bone.calcium(at("b3", "weaken") + 0.6, s0("b4")); P.bone.badge(at("b3", "weaken") + 1.0);

// ===== #2: On Mars, gravity is only about thirty-eight percent of Earth's.
PF.DAY("#2", T.b4);
env.scene("mars", T.b4 + 0.05);
hero.shadow(true, T.b4 + 0.05);
env.metric("2", T.b4 + 0.02);
PF.WORLD(true, T.b4 - 0.3); PF.panelOut(P.bone.id, T.b4 - 0.27, -1);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "gravity"), "excited"), at("b4", "gravity"));
PF.panelIn(P.stat5.id, T.b4_1 - 0.27, 540, 900); PF.WORLD(false, T.b4_1 + 0.2);
R.camSet("body", T.b4_1 + 0.35);
P.stat5.show(T.b4_1 + 0.1, s0("b5"));

// ===== #1: Its thin air is mostly carbon dioxide, and you can't breathe it.
PF.DAY("#1", T.b5);
env.metric("1", T.b5 + 0.02);
PF.WORLD(true, T.b5 - 0.3); PF.panelOut(P.stat5.id, T.b5 - 0.27, -1);
F("body", T.b5 + 0.1);
F(R.puff(at("b5", "air")), at("b5", "air"));
F(R.face(at("b5", "breathe"), "shocked"), at("b5", "breathe"));

// ===== KONIEC: Would you want to go to Mars?
F("body", T.end + 0.1);
F(R.recover(at("end", "go")), at("end", "go"));
F(R.wave(at("end", "mars")), at("end", "mars"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "mars", 0, "e") + 0.1, at("end", "go") + 0.35, at("end", "mars") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("station", tc + 0.35);
hero.shadow(false, tc + 0.35);
env.metric("0", tc + 0.15);
PF.XY("hero_float", { ty: -22, r: 3 }, T.tot - 1.4, 0.7, "sine.inOut", 1);
