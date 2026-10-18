// AUTO z compose.py: What freezing cold does  (env field, kit sticky/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "meadow" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "bald", "hair": "#c98b3a", "suit": "#8e7cc3", "suitDark": "#6d5ca6", "patch": "#f6c343", "pants": "#3b3552", "pantsDark": "#2a2640", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a", "glasses": true, "lashes": true, "capColor": "#7a5fa0"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#7a5fa0", hero: hero, env: env });
env.metricLabel("°C", 0);
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.stat3 = PF.panelStat(3, {"big": "35°C", "small": "HYPOTHERMIA", "icon": "snow", "bg": "#ece6f6", "accent": "#7a5fa0"});
P.brain = PF.panelBrain(4);
P.heart = PF.panelHeart(5);
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

// ===== 37°C: In freezing air, your body starts shivering to make heat.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("37°C", T.b1);
env.metric("37", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.mood(at("b1", "freezing"), "cold", s0("b2")), at("b1", "freezing"));
F(R.shiver(at("b1", "shivering"), 1.4), at("b1", "shivering"));
hero.blink(T.b1 + 1.2); if (s0("b2") - T.b1 > 3.2) hero.blink(T.b1 + 2.9);

// ===== 36°C: Blood vessels in your skin narrow, so your fingers go numb.
PF.DAY("36°C", T.b2);
env.metric("36", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.face(at("b2", "narrow"), "worried"), at("b2", "narrow"));
F(R.face(at("b2", "numb"), "pain"), at("b2", "numb"));

// ===== 35°C: Below thirty-five degrees, doctors call it hypothermia.
PF.DAY("35°C", T.b3);
env.metric("35", T.b3 + 0.02);
PF.panelIn(P.stat3.id, T.b3 - 0.27, 540, 900); PF.WORLD(false, T.b3 + 0.2);
R.camSet("body", T.b3 + 0.35);
P.stat3.show(T.b3 + 0.1, s0("b4"));

// ===== 33°C: Around thirty-three degrees, you get clumsy and confused.
PF.DAY("33°C", T.b4);
env.metric("33", T.b4 + 0.02);
PF.panelSwap(P.stat3.id, P.brain.id, T.b4 - 0.4);
R.camSet("body", T.b4 + 0.35);
P.brain.wobble(at("b4", "confused"));

// ===== 32°C: Near thirty-two degrees, shivering can stop, and your heart slows down.
PF.DAY("32°C", T.b5);
env.metric("32", T.b5 + 0.02);
PF.panelSwap(P.brain.id, P.heart.id, T.b5 - 0.4);
R.camSet("body", T.b5 + 0.35);
var hb3 = R.beats(T.b5 + 0.1, s0("end"), 1.15); P.heart.rays(T.b5, s0("end") - T.b5); P.heart.beats(hb3); P.heart.ecg(T.b5, s0("end"), hb3);

// ===== KONIEC: So, how do you stay warm when it's freezing?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.heart.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.recover(at("end", "warm")), at("end", "warm"));
F(R.wave(at("end", "freezing")), at("end", "freezing"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "freezing", 0, "e") + 0.1, at("end", "warm") + 0.35, at("end", "freezing") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
