// AUTO z compose.py: What climbing Everest does  (env field, kit stamp/zoom/card/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "mountain" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "hoodie", "hairStyle": "bun", "hair": "#4a3226", "suit": "#3fa37c", "suitDark": "#2f7f60", "patch": "#f6c343", "pants": "#2f3e46", "pantsDark": "#222d33", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#e3ae82", "skinDark": "#c68b5e", "blush": "#e98f86", "glasses": false, "lashes": true, "capColor": "#2f8f6a"});
R.init({"face0": "excited", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2f8f6a", hero: hero, env: env });
env.metricLabel("M", 0);
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.heart = PF.panelHeart(3);
P.stat4 = PF.panelStat(4, {"big": "1/3", "small": "OF THE OXYGEN", "icon": "lungs", "bg": "#e1f1e8", "accent": "#2f8f6a"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b5 = s0("b5");
T.b5_1 = at("b5", "third") - 0.3;

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "excited", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 0 M: At sea level, every breath is full of oxygen.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("0 M", T.b1);
env.metric("0", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "breath"), "excited"), at("b1", "breath"));

// ===== 3000 M: By three thousand meters, the air thins, and you breathe faster.
PF.DAY("3000 M", T.b2);
env.metric("3000", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.puff(at("b2", "breathe")), at("b2", "breathe"));
F(R.face(at("b2", "faster"), "pant"), at("b2", "faster"));

// ===== 5000 M: At five thousand meters, your heart pounds to find more oxygen.
PF.DAY("5000 M", T.b3);
env.metric("5000", T.b3 + 0.02);
PF.panelIn(P.heart.id, T.b3 - 0.27, 590, 950); PF.WORLD(false, T.b3 + 0.2);
F("body", T.b3 + 0.7);
var hb1 = R.beats(T.b3 + 0.1, s0("b4"), 0.42); P.heart.rays(T.b3, s0("b4") - T.b3); P.heart.beats(hb1); P.heart.ecg(T.b3, s0("b4"), hb1); hb1.forEach(function (b) { PF.VIG(b - 0.02, 0.4); }); P.heart.sweatDrop(at("b3", "heart"));

// ===== 7000 M: By seven thousand meters, thin air can bring on a pounding headache.
PF.DAY("7000 M", T.b4);
env.metric("7000", T.b4 + 0.02);
PF.WORLD(true, T.b4 - 0.3); PF.panelOut(P.heart.id, T.b4 - 0.27, -1);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "thin"), "pain"), at("b4", "thin"));
F(R.pain(at("b4", "headache")), at("b4", "headache"));

// ===== 8849 M: At the summit, each breath has only a third of the oxygen.
PF.DAY("8849 M", T.b5);
env.scene("summit", T.b5 + 0.05);
env.metric("8849", T.b5 + 0.02);
F("body", T.b5 + 0.1);
F(R.face(at("b5", "summit"), "dizzy"), at("b5", "summit"));
PF.panelIn(P.stat4.id, T.b5_1 - 0.27, 540, 900); PF.WORLD(false, T.b5_1 + 0.2);
F("body", T.b5_1 + 0.7);
P.stat4.show(T.b5_1 + 0.1, s0("end"));

// ===== KONIEC: So, could you handle that thin summit air?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.stat4.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.recover(at("end", "handle")), at("end", "handle"));
F(R.wave(at("end", "air")), at("end", "air"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "air", 0, "e") + 0.1, at("end", "handle") + 0.35, at("end", "air") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("mountain", tc + 0.35);
