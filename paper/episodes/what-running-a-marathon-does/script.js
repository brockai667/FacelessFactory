// AUTO z compose.py: What running a marathon does  (env field, kit tape/tear/card/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "road" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#6b6b6b", "suit": "#e0674f", "suitDark": "#bf4f3a", "patch": "#f6c343", "pants": "#3a4a5a", "pantsDark": "#2a3642", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0", "glasses": false, "lashes": false, "capColor": "#d9483b"});
R.init({"face0": "excited", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#d9483b", hero: hero, env: env });
env.metricLabel("MI", 0);
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.heart = PF.panelHeart(3);
P.stat4 = PF.panelStat(4, {"big": "MILE 20", "small": "HITTING THE WALL", "icon": "down", "bg": "#f7e3d9", "accent": "#d9483b"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b2_1 = at("b2", "heart") - 0.3;
T.b3 = s0("b3");
T.b3_1 = at("b3", "hit") - 0.3;
T.b4 = s0("b4");
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "excited", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 5 MI: Five miles in, your heart rate climbs and breathing quickens.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("5 MI", T.b1);
env.metric("5", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.jog(at("b1", "five"), Math.max(0.8, Math.min(3.0, s0("b2") - (at("b1", "five")) - 0.3))), at("b1", "five"));
F(R.face(at("b1", "miles"), "excited"), at("b1", "miles"));
F(R.sweat(at("b1", "breathing")), at("b1", "breathing"));

// ===== 13 MI: By mile thirteen, your heart pumps harder to hold pace.
PF.DAY("13 MI", T.b2);
env.metric("13", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.jog(at("b2", "by"), Math.max(0.8, Math.min(2.5, T.b2_1 - (at("b2", "by")) - 0.3))), at("b2", "by"));
F(R.face(at("b2", "mile"), "tired"), at("b2", "mile"));
PF.panelIn(P.heart.id, T.b2_1 - 0.27, 590, 950); PF.WORLD(false, T.b2_1 + 0.2);
F("body", T.b2_1 + 0.7);
var hb1 = R.beats(T.b2_1 + 0.1, s0("b3"), 0.42); P.heart.rays(T.b2_1, s0("b3") - T.b2_1); P.heart.beats(hb1); P.heart.ecg(T.b2_1, s0("b3"), hb1); hb1.forEach(function (b) { PF.VIG(b - 0.02, 0.4); }); P.heart.sweatDrop(at("b2", "heart"));

// ===== 20 MI: Around mile twenty, stored glycogen runs low, and you hit the wall.
PF.DAY("20 MI", T.b3);
env.metric("20", T.b3 + 0.02);
PF.panelSwap(P.heart.id, P.stat4.id, T.b3 - 0.4);
F("body", T.b3 + 0.7);
P.stat4.show(T.b3 + 0.1, T.b3_1);
PF.WORLD(true, T.b3_1 - 0.3); PF.panelOut(P.stat4.id, T.b3_1 - 0.27, -1);
F("body", T.b3_1 + 0.1);
F(R.face(at("b3", "hit"), "pain"), at("b3", "hit"));
F(R.slump(at("b3", "wall")), at("b3", "wall"));

// ===== 24 MI: By mile twenty-four, heavy sweat can leave you dehydrated.
PF.DAY("24 MI", T.b4);
env.metric("24", T.b4 + 0.02);
F("body", T.b4 + 0.1);
F(R.jog(at("b4", "by"), Math.max(0.8, Math.min(2.5, s0("b5") - (at("b4", "by")) - 0.3))), at("b4", "by"));
F(R.sweat(at("b4", "sweat")), at("b4", "sweat"));
F(R.face(at("b4", "dehydrated"), "tired"), at("b4", "dehydrated"));

// ===== 26 MI: At the finish, sore muscles remind you of every mile.
PF.DAY("26 MI", T.b5);
env.metric("26", T.b5 + 0.02);
F("body", T.b5 + 0.1);
F(R.face(at("b5", "sore"), "pain"), at("b5", "sore"));
F(R.pain(at("b5", "muscles")), at("b5", "muscles"));

// ===== KONIEC: Would you ever run a full marathon?
F("body", T.end + 0.1);
F(R.recover(at("end", "run")), at("end", "run"));
F(R.wave(at("end", "marathon")), at("end", "marathon"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "marathon", 0, "e") + 0.1, at("end", "run") + 0.35, at("end", "marathon") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
