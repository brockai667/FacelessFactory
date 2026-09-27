// AUTO z compose.py: What daily walking does  (env field, kit bubble/page/card/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "meadow" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "hoodie", "hairStyle": "bald", "hair": "#6b6b6b", "suit": "#e0674f", "suitDark": "#bf4f3a", "patch": "#f28b82", "pants": "#3a4a5a", "pantsDark": "#2a3642", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a", "glasses": false, "lashes": false, "capColor": "#d9483b"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#d9483b", hero: hero, env: env });
env.metricLabel("K", 0);
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.heart = PF.panelHeart(3);
P.stat4 = PF.panelStat(4, {"big": "7-10K", "small": "BENEFITS LEVEL OFF", "icon": "flame", "bg": "#f7e3d9", "accent": "#d9483b"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b2_1 = at("b2", "heart") - 0.3;
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b4_1 = at("b4", "benefits") - 0.3;

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 2K: Just two thousand steps outside can already lift your mood a little.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("2K", T.b1);
env.metric("2", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.walk(at("b1", "just"), Math.max(0.8, Math.min(3.0, s0("b2") - (at("b1", "just")) - 0.3))), at("b1", "just"));
F(R.face(at("b1", "mood"), "happy"), at("b1", "mood"));

// ===== 5K: By five thousand steps, your heart gets a light workout.
PF.DAY("5K", T.b2);
env.metric("5", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.walk(at("b2", "by"), Math.max(0.8, Math.min(2.5, T.b2_1 - (at("b2", "by")) - 0.3))), at("b2", "by"));
F(R.face(at("b2", "steps"), "happy"), at("b2", "steps"));
PF.panelIn(P.heart.id, T.b2_1 - 0.27, 590, 950); PF.WORLD(false, T.b2_1 + 0.2);
F("body", T.b2_1 + 0.7);
var hb1 = R.beats(T.b2_1 + 0.1, s0("b3"), 0.75); P.heart.rays(T.b2_1, s0("b3") - T.b2_1); P.heart.beats(hb1); P.heart.ecg(T.b2_1, s0("b3"), hb1);

// ===== 7K: Around seven thousand steps in, sleep quality often starts to improve too.
PF.DAY("7K", T.b3);
env.scene("road", T.b3 + 0.05);
env.metric("7", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.heart.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.zzz(at("b3", "sleep"), 1.4), at("b3", "sleep"));
F(R.face(at("b3", "improve"), "smile"), at("b3", "improve"));

// ===== 10K: Ten thousand steps can burn solid calories, though benefits can level off.
PF.DAY("10K", T.b4);
env.metric("10", T.b4 + 0.02);
F("body", T.b4 + 0.1);
F(R.walk(at("b4", "ten"), Math.max(0.8, Math.min(2.5, T.b4_1 - (at("b4", "ten")) - 0.3))), at("b4", "ten"));
F(R.face(at("b4", "calories"), "happy"), at("b4", "calories"));
PF.panelIn(P.stat4.id, T.b4_1 - 0.27, 540, 900); PF.WORLD(false, T.b4_1 + 0.2);
F("body", T.b4_1 + 0.7);
P.stat4.show(T.b4_1 + 0.1, s0("end"));

// ===== KONIEC: How many steps did you take today?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.stat4.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.recover(at("end", "steps")), at("end", "steps"));
F(R.wave(at("end", "today")), at("end", "today"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "today", 0, "e") + 0.1, at("end", "steps") + 0.35, at("end", "today") + 1.30), T.tot - 1.2);
PF.CTA("SAVE THIS ONE", T.end + 0.6, tc - 0.05);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("meadow", tc + 0.35);
