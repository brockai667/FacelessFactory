// AUTO z compose.py: What no sleep does to you  (env room, kit sticky/page/card/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "HOURS" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "pajamas", "hairStyle": "long", "hair": "#5a3a28", "suit": "#8e7cc3", "suitDark": "#6d5ca6", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#e3ae82", "skinDark": "#c68b5e", "blush": "#e98f86", "lashes": true});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#7a5fa0", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.heart = PF.panelHeart(3);
P.stat4 = PF.panelStat(4, {"big": "11 DAYS", "small": "WORLD RECORD", "icon": "calendar", "bg": "#f3e3c6", "accent": "#7a5fa0"});
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

// ===== 24 HOURS: After twenty-four hours, your brain works like you're legally drunk.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("24 HOURS", T.b1);
env.metric("24", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "brain"), "tired"), at("b1", "brain"));
F(R.stars(at("b1", "drunk"), 1.4), at("b1", "drunk"));

// ===== 36 HOURS: After thirty-six hours, your brain starts shutting off for seconds at a time.
PF.DAY("36 HOURS", T.b2);
env.metric("36", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.nod(at("b2", "shutting")), at("b2", "shutting"));
F(R.nod(at("b2", "time")), at("b2", "time"));

// ===== 48 HOURS: After forty-eight hours, stress hormones rise, and your heart beats faster.
PF.DAY("48 HOURS", T.b3);
env.metric("48", T.b3 + 0.02);
PF.panelIn(P.heart.id, T.b3 - 0.27, 590, 950); PF.WORLD(false, T.b3 + 0.2);
F("body", T.b3 + 0.7);
var hb1 = R.beats(T.b3 + 0.1, s0("b4"), 0.42); P.heart.rays(T.b3, s0("b4") - T.b3); P.heart.beats(hb1); P.heart.ecg(T.b3, s0("b4"), hb1); hb1.forEach(function (b) { PF.VIG(b - 0.02, 0.4); }); P.heart.sweatDrop(at("b3", "heart"));

// ===== 72 HOURS: After seventy-two hours, you may start seeing things that aren't there.
PF.DAY("72 HOURS", T.b4);
env.metric("72", T.b4 + 0.02);
PF.WORLD(true, T.b4 - 0.3); PF.panelOut(P.heart.id, T.b4 - 0.27, -1);
F("body", T.b4 + 0.1);
F(R.mood(at("b4", "seventytwo"), "night", s0("b5")), at("b4", "seventytwo"));
F(R.hallucinate(at("b4", "seeing")), at("b4", "seeing"));

// ===== RECORD: The record without sleep is about eleven days.
PF.DAY("RECORD", T.b5);
PF.panelIn(P.stat4.id, T.b5 - 0.27, 540, 900); PF.WORLD(false, T.b5 + 0.2);
F("body", T.b5 + 0.7);
P.stat4.show(T.b5 + 0.1, s0("end"));

// ===== KONIEC: So, how much did you sleep last night?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.stat4.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.yawn(at("end", "sleep")), at("end", "sleep"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "night", 0, "e") + 0.1, at("end", "sleep") + 1.55), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.metric("–", tc + 0.15);
