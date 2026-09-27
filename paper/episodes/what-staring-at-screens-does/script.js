// AUTO z compose.py: What staring at screens does  (env room, kit bubble/page/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "HOUR", scene: "desk" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "long", "hair": "#c98b3a", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#b97a4d", "skinDark": "#9a603a", "blush": "#d9737a", "glasses": true, "lashes": true, "capColor": "#2a74b3"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.eye = PF.panelEye(3);
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

// ===== 1 HOUR: After an hour of screens, you blink far less than normal.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("1 HOUR", T.b1);
env.metric("1", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "blink"), "dry"), at("b1", "blink"));

// ===== 4 HOURS: By four hours, your eyes feel dry, and your vision can blur.
PF.DAY("4 HOURS", T.b2);
env.metricLabel("HOURS", T.b2 + 0.02);
env.metric("4", T.b2 + 0.02);
PF.panelIn(P.eye.id, T.b2 - 0.27, 484, 772); PF.WORLD(false, T.b2 + 0.2);
R.camSet("body", T.b2 + 0.35);
P.eye.blurry(at("b2", "blur"), 0.9);

// ===== 6 HOURS: After six hours, eye strain can bring on a headache.
PF.DAY("6 HOURS", T.b3);
env.metric("6", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.eye.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.face(at("b3", "strain"), "pain"), at("b3", "strain"));
F(R.pain(at("b3", "headache")), at("b3", "headache"));

// ===== 8 HOURS: By eight hours, your neck and shoulders start to ache.
PF.DAY("8 HOURS", T.b4);
env.metric("8", T.b4 + 0.02);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "neck"), "tired"), at("b4", "neck"));
F(R.slump(at("b4", "ache")), at("b4", "ache"));

// ===== 12 HOURS: By evening, screen light can delay your sleep.
PF.DAY("12 HOURS", T.b5);
env.scene("bed", T.b5 + 0.05);
env.metric("12", T.b5 + 0.02);
F("body", T.b5 + 0.1);
F(R.mood(at("b5", "evening"), "night", s0("end")), at("b5", "evening"));
F(R.yawn(at("b5", "sleep")), at("b5", "sleep"));

// ===== KONIEC: So, when did you last look away from a screen?
F("body", T.end + 0.1);
F(R.recover(at("end", "look")), at("end", "look"));
F(R.wave(at("end", "screen")), at("end", "screen"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "screen", 0, "e") + 0.1, at("end", "look") + 0.35, at("end", "screen") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("desk", tc + 0.35);
env.metric("–", tc + 0.15);
env.metricLabel("HOUR", tc + 0.15);
