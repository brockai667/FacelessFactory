// AUTO z compose.py: What staying inside does  (env room, kit stamp/page/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY", scene: "couch" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "pajamas", "hairStyle": "curly", "hair": "#4a3226", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#ffffff", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#b97a4d", "skinDark": "#9a603a", "blush": "#d9737a", "glasses": true, "lashes": false, "capColor": "#2a74b3"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.stat3 = PF.panelStat(3, {"big": "0", "small": "NEW VITAMIN D", "icon": "sun", "bg": "#dfeaf5", "accent": "#2a74b3"});
P.brain = PF.panelBrain(4);
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

// ===== 1 DAY: After a day indoors, you miss sunlight, the main signal for your body clock.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("1 DAY", T.b1);
env.metric("1", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "miss"), "worried"), at("b1", "miss"));
F(R.look(at("b1", "sunlight"), "left"), at("b1", "sunlight"));

// ===== 1 WEEK: After a week, your skin makes no new vitamin D without sunlight.
PF.DAY("1 WEEK", T.b2);
env.metricLabel("WEEK", T.b2 + 0.02);
env.metric("1", T.b2 + 0.02);
PF.panelIn(P.stat3.id, T.b2 - 0.27, 540, 900); PF.WORLD(false, T.b2 + 0.2);
R.camSet("body", T.b2 + 0.35);
P.stat3.show(T.b2 + 0.1, s0("b3"));

// ===== 2 WEEKS: By two weeks, your sleep can start drifting later and later.
PF.DAY("2 WEEKS", T.b3);
env.scene("bed", T.b3 + 0.05);
env.metricLabel("WEEKS", T.b3 + 0.02);
env.metric("2", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.stat3.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.mood(at("b3", "sleep"), "night", s0("b4")), at("b3", "sleep"));
F(R.yawn(at("b3", "later")), at("b3", "later"));

// ===== 1 MONTH: After a month, your vitamin D can drop, and you may feel tired.
PF.DAY("1 MONTH", T.b4);
env.scene("couch", T.b4 + 0.05);
env.metricLabel("MONTH", T.b4 + 0.02);
env.metric("1", T.b4 + 0.02);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "drop"), "tired"), at("b4", "drop"));
F(R.slump(at("b4", "tired")), at("b4", "tired"));

// ===== 2 MONTHS: After two months, less daylight can drag your mood down.
PF.DAY("2 MONTHS", T.b5);
env.metricLabel("MONTHS", T.b5 + 0.02);
env.metric("2", T.b5 + 0.02);
PF.panelIn(P.brain.id, T.b5 - 0.27, 540, 650); PF.WORLD(false, T.b5 + 0.2);
R.camSet("body", T.b5 + 0.35);
P.brain.pulse(at("b5", "mood"));

// ===== KONIEC: So, how much time outside did you get today?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.brain.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.recover(at("end", "time")), at("end", "time"));
F(R.wave(at("end", "today")), at("end", "today"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "today", 0, "e") + 0.1, at("end", "time") + 0.35, at("end", "today") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.metric("–", tc + 0.15);
env.metricLabel("DAY", tc + 0.15);
