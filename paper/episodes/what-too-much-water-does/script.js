// AUTO z compose.py: What too much water does  (env field, kit tape/circle/full/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "meadow" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#4a3226", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
env.metricLabel("TOP", 0);
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.kidneys = PF.panelKidneys(3);
P.stat4 = PF.panelStat(4, {"big": "SODIUM", "small": "WATERED DOWN", "icon": "down", "bg": "#e9e3f3", "accent": "#2a74b3"});
P.brain = PF.panelBrain(5);
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b1_1 = at("b1", "about") - 0.3;
T.b2 = s0("b2");
T.b2_1 = at("b2", "sodium") - 0.3;
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b4_1 = at("b4", "headaches") - 0.3;
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== #5: Your kidneys can only clear about a liter of water an hour.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("#5", T.b1);
env.metric("5", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "only"), "worried"), at("b1", "only"));
PF.panelIn(P.kidneys.id, T.b1_1 - 0.27, 540, 1120); PF.WORLD(false, T.b1_1 + 0.2);
R.camSet("body", T.b1_1 + 0.35);
P.kidneys.breathe(T.b1_1); P.kidneys.flow(T.b1_1 + 0.05, s0("b2") - 0.2, 0.22);

// ===== #4: Drink faster than that, and the sodium in your blood gets diluted.
PF.DAY("#4", T.b2);
env.metric("4", T.b2 + 0.02);
PF.WORLD(true, T.b2 - 0.3); PF.panelOut(P.kidneys.id, T.b2 - 0.27, -1);
F("body", T.b2 + 0.1);
F(R.face(at("b2", "faster"), "shocked"), at("b2", "faster"));
PF.panelIn(P.stat4.id, T.b2_1 - 0.27, 540, 900); PF.WORLD(false, T.b2_1 + 0.2);
R.camSet("body", T.b2_1 + 0.35);
P.stat4.show(T.b2_1 + 0.1, s0("b3"));

// ===== #3: Water then moves into your cells, and they start to swell.
PF.DAY("#3", T.b3);
env.metric("3", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.stat4.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.face(at("b3", "cells"), "worried"), at("b3", "cells"));
F(R.puffy(at("b3", "swell")), at("b3", "swell"));

// ===== #2: In the brain, that swelling can cause headaches and confusion.
PF.DAY("#2", T.b4);
env.metric("2", T.b4 + 0.02);
PF.panelIn(P.brain.id, T.b4 - 0.27, 540, 650); PF.WORLD(false, T.b4 + 0.2);
R.camSet("body", T.b4 + 0.35);
P.brain.pulse(at("b4", "swelling"));
PF.WORLD(true, T.b4_1 - 0.3); PF.panelOut(P.brain.id, T.b4_1 - 0.27, -1);
F("body", T.b4_1 + 0.1);
F(R.pain(at("b4", "headaches")), at("b4", "headaches"));
F(R.face(at("b4", "confusion"), "dizzy"), at("b4", "confusion"));

// ===== #1: Long-distance runners who drink too much are especially at risk.
PF.DAY("#1", T.b5);
env.scene("road", T.b5 + 0.05);
env.metric("1", T.b5 + 0.02);
F("body", T.b5 + 0.1);
F(R.jog(at("b5", "runners"), Math.max(0.8, Math.min(2.5, s0("end") - (at("b5", "runners")) - 0.3))), at("b5", "runners"));
F(R.face(at("b5", "risk"), "worried"), at("b5", "risk"));

// ===== KONIEC: How much water do you drink a day?
F("body", T.end + 0.1);
F(R.recover(at("end", "water")), at("end", "water"));
F(R.wave(at("end", "day")), at("end", "day"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "day", 0, "e") + 0.1, at("end", "water") + 0.35, at("end", "day") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("meadow", tc + 0.35);
