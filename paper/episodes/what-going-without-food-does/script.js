// AUTO z compose.py: What going without food does  (env room, kit tape/circle/full/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "HOURS", scene: "desk" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#4a3226", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "neutral", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.stat3 = PF.panelStat(3, {"big": "FAT", "small": "NEW MAIN FUEL", "icon": "flame", "bg": "#e9e3f3", "accent": "#2a74b3"});
P.brain = PF.panelBrain(4);
P.stat5 = PF.panelStat(5, {"big": "1/3", "small": "BRAIN ENERGY", "icon": "bolt", "bg": "#e9e3f3", "accent": "#2a74b3"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b2_1 = at("b2", "so") - 0.3;
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b4_1 = at("b4", "third") - 0.3;

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "neutral", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 12 HOURS: After twelve hours, your stomach can growl, and hunger comes in waves.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("12 HOURS", T.b1);
env.metric("12", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "growl"), "shocked"), at("b1", "growl"));
F(R.face(at("b1", "hunger"), "worried"), at("b1", "hunger"));

// ===== 24 HOURS: A day in, your stored sugar runs low, so your body burns fat.
PF.DAY("24 HOURS", T.b2);
env.metric("24", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.face(at("b2", "low"), "tired"), at("b2", "low"));
PF.panelIn(P.stat3.id, T.b2_1 - 0.27, 540, 900); PF.WORLD(false, T.b2_1 + 0.2);
R.camSet("body", T.b2_1 + 0.35);
P.stat3.show(T.b2_1 + 0.1, s0("b3"));

// ===== 2 DAYS: By day two, you may feel tired, cranky, and a little dizzy.
PF.DAY("2 DAYS", T.b3);
env.scene("couch", T.b3 + 0.05);
env.metricLabel("DAYS", T.b3 + 0.02);
env.metric("2", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.stat3.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.slump(at("b3", "tired")), at("b3", "tired"));
F(R.face(at("b3", "cranky"), "angry"), at("b3", "cranky"));
F(R.face(at("b3", "dizzy"), "dizzy"), at("b3", "dizzy"));

// ===== 3 DAYS: By day three, ketones supply about a third of your brain's energy.
PF.DAY("3 DAYS", T.b4);
env.metric("3", T.b4 + 0.02);
PF.panelIn(P.brain.id, T.b4 - 0.27, 540, 650); PF.WORLD(false, T.b4 + 0.2);
R.camSet("body", T.b4 + 0.35);
P.brain.pulse(at("b4", "ketones"));
PF.panelSwap(P.brain.id, P.stat5.id, T.b4_1 - 0.4);
R.camSet("body", T.b4_1 + 0.35);
P.stat5.show(T.b4_1 + 0.1, s0("end"));

// ===== KONIEC: What's the longest you've gone without food?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.stat5.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.recover(at("end", "longest")), at("end", "longest"));
F(R.wave(at("end", "food")), at("end", "food"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "food", 0, "e") + 0.1, at("end", "longest") + 0.35, at("end", "food") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("desk", tc + 0.35);
env.metric("–", tc + 0.15);
env.metricLabel("HOURS", tc + 0.15);
