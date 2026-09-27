// AUTO z compose.py: What too little sleep does  (env room, kit sticky/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "NIGHT", scene: "bed" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "pajamas", "hairStyle": "spiky", "hair": "#6b6b6b", "suit": "#f2a93b", "suitDark": "#d48a22", "patch": "#f28b82", "pants": "#4a3a5a", "pantsDark": "#362a44", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a", "glasses": false, "lashes": false, "capColor": "#c7851f"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#c7851f", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
P.stat3 = PF.panelStat(3, {"big": "HUNGRY", "small": "HUNGER HORMONE UP", "icon": "apple", "bg": "#f7ecd6", "accent": "#c7851f"});
P.stat4 = PF.panelStat(4, {"big": "WEAKER", "small": "IMMUNE SYSTEM", "icon": "down", "bg": "#f7ecd6", "accent": "#c7851f"});
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b2_1 = at("b2", "hunger") - 0.3;
T.b3 = s0("b3");
T.b3_1 = at("b3", "immune") - 0.3;
T.b4 = s0("b4");

// ===== HOOK (prvy snimok = posledny)
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== 1 NIGHT: After one night of just four hours, your focus and reaction time drop.
PF.O("#day", 0, 1, T.b1, 0.05);
PF.DAY("1 NIGHT", T.b1);
env.metric("1", T.b1 + 0.02);
F("body", T.b1 + 0.1);
F(R.mood(at("b1", "after"), "night", s0("b2")), at("b1", "after"));
F(R.yawn(at("b1", "hours")), at("b1", "hours"));
F(R.face(at("b1", "drop"), "tired"), at("b1", "drop"));

// ===== 3 NIGHTS: By the third short night, hunger hormones rise, and cravings grow stronger.
PF.DAY("3 NIGHTS", T.b2);
env.metricLabel("NIGHTS", T.b2 + 0.02);
env.metric("3", T.b2 + 0.02);
F("body", T.b2 + 0.1);
F(R.face(at("b2", "night"), "tired"), at("b2", "night"));
PF.panelIn(P.stat3.id, T.b2_1 - 0.27, 540, 900); PF.WORLD(false, T.b2_1 + 0.2);
R.camSet("body", T.b2_1 + 0.35);
P.stat3.show(T.b2_1 + 0.1, s0("b3"));

// ===== 1 WEEK: After a week like this, your immune system weakens too.
PF.DAY("1 WEEK", T.b3);
env.scene("couch", T.b3 + 0.05);
env.metricLabel("WEEK", T.b3 + 0.02);
env.metric("1", T.b3 + 0.02);
PF.WORLD(true, T.b3 - 0.3); PF.panelOut(P.stat3.id, T.b3 - 0.27, -1);
F("body", T.b3 + 0.1);
F(R.mood(at("b3", "after"), "normal", T.b3_1), at("b3", "after"));
F(R.face(at("b3", "week"), "worried"), at("b3", "week"));
PF.panelIn(P.stat4.id, T.b3_1 - 0.27, 540, 900); PF.WORLD(false, T.b3_1 + 0.2);
R.camSet("body", T.b3_1 + 0.35);
P.stat4.show(T.b3_1 + 0.1, s0("b4"));

// ===== 2 WEEKS: After two full weeks, mood drops, and small things feel much harder.
PF.DAY("2 WEEKS", T.b4);
env.metricLabel("WEEKS", T.b4 + 0.02);
env.metric("2", T.b4 + 0.02);
PF.WORLD(true, T.b4 - 0.3); PF.panelOut(P.stat4.id, T.b4 - 0.27, -1);
F("body", T.b4 + 0.1);
F(R.face(at("b4", "mood"), "tired"), at("b4", "mood"));
F(R.slump(at("b4", "harder")), at("b4", "harder"));

// ===== KONIEC: How many hours did you sleep last night?
F("body", T.end + 0.1);
F(R.recover(at("end", "sleep")), at("end", "sleep"));
F(R.wave(at("end", "night")), at("end", "night"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = Math.min(Math.max(at("end", "night", 0, "e") + 0.1, at("end", "sleep") + 0.35, at("end", "night") + 1.30), T.tot - 1.2);
PF.WORLD(true, tc); R.settle(tc, T.tot);
env.scene("bed", tc + 0.35);
env.metric("–", tc + 0.15);
env.metricLabel("NIGHT", tc + 0.15);
