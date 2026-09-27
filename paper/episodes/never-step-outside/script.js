// AUTO z compose.py: Never Step Outside  (env room, kit bubble/zoom/card/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "pajamas", "hairStyle": "bald", "hair": "#5a3a28", "suit": "#3f73b8", "suitDark": "#2f5a93", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#b97a4d", "skinDark": "#9a603a", "blush": "#d9737a", "glasses": false, "lashes": false, "capColor": "#2a74b3"});
R.init({"face0": "neutral", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.bone = PF.panelBone(3, { badge: ["−1%", "PER MONTH"] });
P.eye = PF.panelEye(4);
P.stat5 = PF.panelStat(5, {"big": "30 DAYS", "small": "IMMUNE SHRINK", "icon": "drop", "bg": "#dfeaf5", "accent": "#2a74b3"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b5 = s0("b5");
T.b5_1 = at("b5", "your") - 0.3;

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "neutral", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 1 DAY: Your skin turns pale, missing the sun's warm, golden daily hue.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("1 DAY", T.b1);
env.metric("1", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.face(at("b1", "pale"), "sick"), at("b1", "pale"));

// ===== 3 DAYS: Your internal clock drifts, making you feel sleepy at midnight every night.
PF.DAY("3 DAYS", T.b2);
env.metric("3", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.yawn(at("b2", "sleepy")), at("b2", "sleepy"));
F(R.mood(at("b2", "midnight"), "night", s0("b3")), at("b2", "midnight"));

// ===== 7 DAYS: Vitamin D plummets, so bone cells begin to soften and weaken.
PF.DAY("7 DAYS", T.b3);
env.metric("7", T.b3 + 0.02);
PF.panelIn(P.bone.id, T.b3 - 0.27, 494, 1330); PF.WORLD(false, T.b3 + 0.2);
F("body", T.b3 + 0.7);
P.bone.pulse(at("b3", "weaken") - 0.4); P.bone.weaken(at("b3", "weaken"), 3); P.bone.calcium(at("b3", "weaken") + 0.6, s0("b4")); P.bone.badge(at("b3", "weaken") + 1.0);

// ===== 14 DAYS: Serotonin drops, and your mood flattens, feeling as flat as a pancake.
PF.DAY("14 DAYS", T.b4);
env.metric("14", T.b4 + 0.02);
PF.panelSwap(P.bone.id, P.eye.id, T.b4 - 0.4);
F("body", T.b4 + 0.7);
P.eye.hint(at("b4", "flattens") - 0.5); P.eye.flatten(at("b4", "flattens"), 0.7);

// ===== 30 DAYS: Your immune cells shrink noticeably, leaving you vulnerable to everyday colds.
PF.DAY("30 DAYS", T.b5);
env.metric("30", T.b5 + 0.02);
PF.WORLD(true, T.b5 - 0.3); PF.panelOut(P.eye.id, T.b5 - 0.27, -1);
F("body", T.b5 + 0.1);
F(R.slump(at("b5", "vulnerable")), at("b5", "vulnerable"));
PF.panelIn(P.stat5.id, T.b5_1 - 0.27, 540, 900); PF.WORLD(false, T.b5_1 + 0.2);
F("body", T.b5_1 + 0.7);
P.stat5.show(T.b5_1 + 0.1, s0("end"));

// ===== KONIEC: So, would you ever stay indoors forever?
PF.WORLD(true, T.end - 0.3); PF.panelOut(P.stat5.id, T.end - 0.27, -1);
F("body", T.end + 0.1);
F(R.wave(at("end", "indoors")), at("end", "indoors"));
F(R.thumbs_up(at("end", "forever")), at("end", "forever"));
hero.blink(T.end + 1.2); if (T.tot - T.end > 3.2) hero.blink(T.end + 2.9);

// ===== SLUCKA
var tc = Math.min(at("end", "forever", 0, "e") + 0.1, T.tot - 1.15);
var cov = PF.panel("cover", 8, true); cov.insertAdjacentHTML("beforeend", '<rect width="1080" height="1920" fill="#fbf5ea"/>');
PF.panelIn("cover", tc, 540, 960); var tcov = tc + 0.4; PF.panelOut("cover", tcov + 0.12, 1);
PF.O("#day", 1, 0, tcov - 0.1, 0.1);
R.reset(tcov); R.camSet("wide", tcov); PF.WORLD(true, tcov);
R.setFace(tcov, "neutral", 0); hero.look(0, 0, tcov, 0);
env.metricReset("–", tcov);
PF.O("#hook", 0, 1, T.tot - 0.7, 0.4);
