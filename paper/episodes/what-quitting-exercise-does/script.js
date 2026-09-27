// AUTO z compose.py: What quitting exercise does  (env field, kit tape/circle/full/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "road" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#4a3226", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
env.metricLabel("WEEKS", 0);
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.heart = PF.panelHeart(3);
P.stat4 = PF.panelStat(4, {"big": "HIGHER", "small": "BLOOD PRESSURE", "icon": "up", "bg": "#e9e3f3", "accent": "#2a74b3"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b2_1 = at("b2", "heart") - 0.3;
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 2 WEEKS: After two weeks off, your stamina can already start to slip.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("2 WEEKS", T.b1);
env.metric("2", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.jog(at("b1", "after"), Math.max(0.8, Math.min(3.0, s0("b2") - (at("b1", "after")) - 0.3))), at("b1", "after"));
F(R.face(at("b1", "stamina"), "pant"), at("b1", "stamina"));
F(R.face(at("b1", "slip"), "tired"), at("b1", "slip"));

// ===== 3 WEEKS: By week three, your heart beats faster for the same workout.
PF.DAY("3 WEEKS", T.b2);
env.metric("3", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.jog(at("b2", "by"), Math.max(0.8, Math.min(2.0, T.b2_1 - (at("b2", "by")) - 0.3))), at("b2", "by"));
F(R.face(at("b2", "week"), "pant"), at("b2", "week"));
PF.panelIn(P.heart.id, T.b2_1 - 0.27, 590, 950); PF.WORLD(false, T.b2_1 + 0.2);
R.camSet("body", T.b2_1 + 0.35);
var hb1 = R.beats(T.b2_1 + 0.1, s0("b3"), 0.42); P.heart.rays(T.b2_1, s0("b3") - T.b2_1); P.heart.beats(hb1); P.heart.ecg(T.b2_1, s0("b3"), hb1); hb1.forEach(function (b) { PF.VIG(b - 0.02, 0.4); }); P.heart.sweatDrop(at("b2", "faster"));

// ===== 1 MONTH: After a month, the muscle you built can start to shrink.
PF.DAY("1 MONTH", T.b3);
env.metricLabel("MONTH", T.b3 + 0.02);
env.metric("1", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.heart.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.face(at("b3", "built"), "worried"), at("b3", "built"));
F(R.thin_arms(at("b3", "shrink")), at("b3", "shrink"));

// ===== 2 MONTHS: By two months, your blood pressure can creep back up.
PF.DAY("2 MONTHS", T.b4);
env.metricLabel("MONTHS", T.b4 + 0.02);
env.metric("2", T.b4 + 0.02);
PF.panelIn(P.stat4.id, T.b4 - 0.27, 540, 900); PF.WORLD(false, T.b4 + 0.2);
R.camSet("body", T.b4 + 0.35);
P.stat4.show(T.b4 + 0.1, s0("b5"));

// ===== 3 MONTHS: Three months in, much of your hard-won fitness can be gone.
PF.DAY("3 MONTHS", T.b5);
env.metric("3", T.b5 + 0.02);
PF.WORLD(true, T.b5 - 0.3); PF.panelOut(P.stat4.id, T.b5 - 0.27, -1);
F("body", T.b5 + 0.1);
F(R.face(at("b5", "fitness"), "tired"), at("b5", "fitness"));
F(R.slump(at("b5", "gone")), at("b5", "gone"));

// ===== KONIEC: So, when did you last break a sweat?
F("body", T.end + 0.1);
F(R.recover(at("end", "last")), at("end", "last"));
F(R.wave(at("end", "sweat")), at("end", "sweat"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "sweat", 0, "e") + 0.1, at("end", "last") + 0.35, at("end", "sweat") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
