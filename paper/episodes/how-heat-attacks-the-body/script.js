// AUTO z compose.py: How heat attacks the body  (env field, kit bubble/zoom/card/calm)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({});
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#2b1d16", "suit": "#3fa37c", "suitDark": "#2f7f60", "patch": "#ffffff", "pants": "#2f3e46", "pantsDark": "#222d33", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a", "glasses": false, "lashes": false, "capColor": "#2f8f6a"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2f8f6a", hero: hero, env: env });
env.metricLabel("HOUR", 0);
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.heart = PF.panelHeart(3);
P.stat4 = PF.panelStat(4, {"big": "40°C", "small": "CORE TEMPERATURE", "icon": "flame", "bg": "#e1f1e8", "accent": "#2f8f6a"});
P.brain = PF.panelBrain(5);
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b4_1 = at("b4", "brain") - 0.3;
T.b5 = s0("b5");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 1 HOUR: After an hour, you sweat buckets to cool your body down.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("1 HOUR", T.b1);
env.metric("1", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.mood(at("b1", "hour"), "hot", s0("b2")), at("b1", "hour"));
F(R.face(at("b1", "sweat"), "pant"), at("b1", "sweat"));
F(R.sweat(at("b1", "buckets")), at("b1", "buckets"));

// ===== 3 HOURS: After three hours, your heart pumps harder to push heat out through your skin.
PF.DAY("3 HOURS", T.b2);
env.metric("3", T.b2 + 0.02);
PF.panelIn(P.heart.id, T.b2 - 0.27, 590, 950); PF.WORLD(false, T.b2 + 0.2);
F("body", T.b2 + 0.7);
var hb1 = R.beats(T.b2 + 0.1, s0("b3"), 0.42); P.heart.rays(T.b2, s0("b3") - T.b2); P.heart.beats(hb1); P.heart.ecg(T.b2, s0("b3"), hb1); hb1.forEach(function (b) { PF.VIG(b - 0.02, 0.4); }); P.heart.sweatDrop(at("b2", "heart"));

// ===== 5 HOURS: After five hours, you feel dizzy and sick. That's heat exhaustion.
PF.DAY("5 HOURS", T.b3);
env.metric("5", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.heart.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.face(at("b3", "dizzy"), "dizzy"), at("b3", "dizzy"));
F(R.stars(at("b3", "dizzy"), 1.4), at("b3", "dizzy"));
F(R.face(at("b3", "sick"), "sick"), at("b3", "sick"));

// ===== 6 HOURS: By hour six, your core can hit forty degrees, and your brain gets confused.
PF.DAY("6 HOURS", T.b4);
env.metric("6", T.b4 + 0.02);
PF.panelIn(P.stat4.id, T.b4 - 0.27, 540, 900); PF.WORLD(false, T.b4 + 0.2);
F("body", T.b4 + 0.7);
P.stat4.show(T.b4 + 0.1, T.b4_1);
PF.panelSwap(P.stat4.id, P.brain.id, T.b4_1 - 0.4);
F("body", T.b4_1 + 0.7);
P.brain.wobble(at("b4", "confused"));

// ===== 7 HOURS: After seven hours, heat stroke can strike, and you may stop sweating.
PF.DAY("7 HOURS", T.b5);
env.metric("7", T.b5 + 0.02);
PF.WORLD(true, T.b5 - 0.3); PF.panelOut(P.brain.id, T.b5 - 0.27, -1);
F("body", T.b5 + 0.1);
F(R.slump(at("b5", "strike")), at("b5", "strike"));
F(R.steam(at("b5", "sweating")), at("b5", "sweating"));

// ===== KONIEC: Stay cool out there. Where's the hottest place you've been?
F("body", T.end + 0.1);
F(R.recover(at("end", "cool")), at("end", "cool"));
F(R.wave(at("end", "hottest")), at("end", "hottest"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "been", 0, "e") + 0.1, at("end", "cool") + 0.35, at("end", "hottest") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
