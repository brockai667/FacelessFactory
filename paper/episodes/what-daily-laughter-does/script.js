// AUTO z compose.py: What daily laughter does  (env room, kit tape/circle/full/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "TOP", scene: "couch" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#4a3226", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "excited", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.heart = PF.panelHeart(3);
P.brain = PF.panelBrain(4);
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b1_1 = at("b1", "heart") - 0.3;
T.b2 = s0("b2");
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "excited", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== #5: A big, hearty laugh gets your heart and lungs working harder.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("#5", T.b1);
env.metric("5", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "hearty"), "happy"), at("b1", "hearty"));
F(R.shiver(at("b1", "laugh"), 1.2), at("b1", "laugh"));
PF.panelIn(P.heart.id, T.b1_1 - 0.27, 590, 950); PF.WORLD(false, T.b1_1 + 0.2);
R.camSet("body", T.b1_1 + 0.35);
var hb1 = R.beats(T.b1_1 + 0.1, s0("b2"), 0.75); P.heart.rays(T.b1_1, s0("b2") - T.b1_1); P.heart.beats(hb1); P.heart.ecg(T.b1_1, s0("b2"), hb1);

// ===== #4: Afterward, your heart rate settles, and your muscles relax.
PF.DAY("#4", T.b2);
env.metric("4", T.b2 + 0.02);
PF.WORLD(true, T.b2 - 0.3); PF.panelOut(P.heart.id, T.b2 - 0.27, -1);
F("body", T.b2 + 0.1);
F(R.puff(at("b2", "settles")), at("b2", "settles"));
F(R.face(at("b2", "relax"), "smile"), at("b2", "relax"));

// ===== #3: Your brain releases endorphins, your body's feel-good chemicals.
PF.DAY("#3", T.b3);
env.metric("3", T.b3 + 0.02);
PF.panelIn(P.brain.id, T.b3 - 0.27, 540, 650); PF.WORLD(false, T.b3 + 0.2);
R.camSet("body", T.b3 + 0.35);
P.brain.pulse(at("b3", "endorphins"));

// ===== #2: Over time, laughing often can ease stress and lift your mood.
PF.DAY("#2", T.b4);
env.metric("2", T.b4 + 0.02);
PF.WORLD(true, T.b4 - 0.3); PF.panelOut(P.brain.id, T.b4 - 0.27, -1);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "ease"), "happy"), at("b4", "ease"));
F(R.thumbs_up(at("b4", "lift")), at("b4", "lift"));

// ===== #1: Laughing with friends can even help you handle pain better.
PF.DAY("#1", T.b5);
env.metric("1", T.b5 + 0.02);
F("body", T.b5 + 0.1);
F(R.shiver(at("b5", "laughing"), 1.0), at("b5", "laughing"));
F(R.face(at("b5", "friends"), "happy"), at("b5", "friends"));
F(R.pain(at("b5", "pain")), at("b5", "pain"));

// ===== KONIEC: Who makes you laugh the most?
F("body", T.end + 0.1);
F(R.recover(at("end", "makes")), at("end", "makes"));
F(R.wave(at("end", "most")), at("end", "most"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "most", 0, "e") + 0.1, at("end", "makes") + 0.35, at("end", "most") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.metric("–", tc + 0.15);
