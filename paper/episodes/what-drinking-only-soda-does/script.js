// AUTO z compose.py: What drinking only soda does  (env room, kit tape/circle/full/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "CAN", scene: "desk" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#4a3226", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "excited", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.stat3 = PF.panelStat(3, {"big": "10 TSP", "small": "SUGAR PER CAN", "icon": "bolt", "bg": "#e9e3f3", "accent": "#2a74b3"});
P.blood = PF.panelBlood(4);
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b1_1 = at("b1", "about") - 0.3;
T.b2 = s0("b2");
T.b2_1 = at("b2", "sugar") - 0.3;
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "excited", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 1 CAN: One can of cola packs about ten teaspoons of sugar.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("1 CAN", T.b1);
env.metric("1", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "can"), "happy"), at("b1", "can"));
PF.panelIn(P.stat3.id, T.b1_1 - 0.27, 540, 900); PF.WORLD(false, T.b1_1 + 0.2);
R.camSet("body", T.b1_1 + 0.35);
P.stat3.show(T.b1_1 + 0.1, s0("b2"));

// ===== 2 CANS: Two cans spike your blood sugar, and your body pumps out insulin.
PF.DAY("2 CANS", T.b2);
env.metricLabel("CANS", T.b2 + 0.02);
env.metric("2", T.b2 + 0.02);
PF.WORLD(true, T.b2 - 0.3); PF.panelOut(P.stat3.id, T.b2 - 0.27, -1);
F("body", T.b2 + 0.1);
F(R.face(at("b2", "spike"), "excited"), at("b2", "spike"));
PF.panelIn(P.blood.id, T.b2_1 - 0.27, 430, 1050); PF.WORLD(false, T.b2_1 + 0.2);
R.camSet("body", T.b2_1 + 0.35);
P.blood.cells('cellsA', 11, 1.5, T.b2_1, s0("b3"), 11, false);

// ===== 3 CANS: Three cans bathe your teeth in sugar and acid, wearing down enamel.
PF.DAY("3 CANS", T.b3);
env.metric("3", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.blood.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.face(at("b3", "teeth"), "pain"), at("b3", "teeth"));
F(R.face(at("b3", "enamel"), "worried"), at("b3", "enamel"));

// ===== 4 CANS: Four cans add over five hundred calories, and weight can creep up.
PF.DAY("4 CANS", T.b4);
env.metric("4", T.b4 + 0.02);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "calories"), "shocked"), at("b4", "calories"));
F(R.bigger(at("b4", "weight")), at("b4", "weight"));

// ===== 6 CANS: Six cans by bedtime, and the caffeine can keep you wide awake.
PF.DAY("6 CANS", T.b5);
env.scene("bed", T.b5 + 0.05);
env.metric("6", T.b5 + 0.02);
F("body", T.b5 + 0.1);
F(R.mood(at("b5", "bedtime"), "night", s0("end")), at("b5", "bedtime"));
F(R.face(at("b5", "caffeine"), "tired"), at("b5", "caffeine"));
F(R.face(at("b5", "awake"), "shocked"), at("b5", "awake"));

// ===== KONIEC: How many cans do you drink a week?
F("body", T.end + 0.1);
F(R.recover(at("end", "cans")), at("end", "cans"));
F(R.wave(at("end", "week")), at("end", "week"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "week", 0, "e") + 0.1, at("end", "cans") + 0.35, at("end", "week") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("desk", tc + 0.35);
env.metric("–", tc + 0.15);
env.metricLabel("CAN", tc + 0.15);
