// AUTO z compose.py: What too much coffee does  (env room, kit tape/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "CUPS" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "hoodie", "hairStyle": "spiky", "hair": "#4a3226", "suit": "#f2a93b", "suitDark": "#d48a22", "patch": "#f28b82", "pants": "#4a3a5a", "pantsDark": "#362a44", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0", "glasses": true, "lashes": true, "capColor": "#c7851f"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#c7851f", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.brain = PF.panelBrain(3);
P.stat4 = PF.panelStat(4, {"big": "400 MG", "small": "DAILY LIMIT", "icon": "cup", "bg": "#f7ecd6", "accent": "#c7851f"});
P.heart = PF.panelHeart(5);
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b1_1 = at("b1", "chemical") - 0.3;
T.b2 = s0("b2");
T.b3 = s0("b3");
T.b3_1 = at("b3", "hands") - 0.3;
T.b4 = s0("b4");
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 1 CUP: One cup. Caffeine blocks the chemical that makes you sleepy.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("1 CUP", T.b1);
env.metric("1", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "caffeine"), "excited"), at("b1", "caffeine"));
PF.panelIn(P.brain.id, T.b1_1 - 0.27, 540, 650); PF.WORLD(false, T.b1_1 + 0.2);
R.camSet("body", T.b1_1 + 0.35);
P.brain.pulse(at("b1", "sleepy"));

// ===== 4 CUPS: Four cups is about the most experts call safe in a day.
PF.DAY("4 CUPS", T.b2);
env.metric("4", T.b2 + 0.02);
PF.panelSwap(P.brain.id, P.stat4.id, T.b2 - 0.4);
R.camSet("body", T.b2 + 0.35);
P.stat4.show(T.b2 + 0.1, s0("b3"));

// ===== 6 CUPS: Six cups. Your heart speeds up, and your hands start to shake.
PF.DAY("6 CUPS", T.b3);
env.metric("6", T.b3 + 0.02);
PF.panelSwap(P.stat4.id, P.heart.id, T.b3 - 0.4);
R.camSet("body", T.b3 + 0.35);
var hb3 = R.beats(T.b3 + 0.1, T.b3_1, 0.42); P.heart.rays(T.b3, T.b3_1 - T.b3); P.heart.beats(hb3); P.heart.ecg(T.b3, T.b3_1, hb3); hb3.forEach(function (b) { PF.VIG(b - 0.02, 0.4); }); P.heart.sweatDrop(at("b3", "heart"));
PF.WORLD(true, T.b3_1 - 0.3); PF.panelOut(P.heart.id, T.b3_1 - 0.27, -1);
F("body", T.b3_1 + 0.1);
F(R.face(at("b3", "hands"), "worried"), at("b3", "hands"));
F(R.shiver(at("b3", "shake"), 1.4), at("b3", "shake"));

// ===== 8 CUPS: Eight cups. Your stomach burns, and you start to feel anxious.
PF.DAY("8 CUPS", T.b4);
env.metric("8", T.b4 + 0.02);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "burns"), "pain"), at("b4", "burns"));
F(R.face(at("b4", "anxious"), "worried"), at("b4", "anxious"));
F(R.heartbeat(at("b4", "anxious"), 4), at("b4", "anxious"));

// ===== 10 CUPS: Ten cups. Even when you're exhausted, you can't fall asleep.
PF.DAY("10 CUPS", T.b5);
env.metric("10", T.b5 + 0.02);
F("body", T.b5 + 0.1);
F(R.mood(at("b5", "ten"), "night", s0("end")), at("b5", "ten"));
F(R.face(at("b5", "exhausted"), "tired"), at("b5", "exhausted"));
F(R.face(at("b5", "asleep"), "shocked"), at("b5", "asleep"));

// ===== KONIEC: How many cups did you have today?
F("body", T.end + 0.1);
F(R.recover(at("end", "cups")), at("end", "cups"));
F(R.wave(at("end", "today")), at("end", "today"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "today", 0, "e") + 0.1, at("end", "cups") + 0.35, at("end", "today") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.metric("–", tc + 0.15);
