// AUTO z compose.py: Falling Without A Parachute  (env room, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY", scene: "couch" });
document.getElementById("rm_gauges").style.display = "none";
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "suit", "hairStyle": "bun", "hair": "#1c1714", "suit": "#e2622b", "suitDark": "#b84a1d", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 118, "armR": -118, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a"});
R.init({"face0": "shocked", "arms0": [118, -118], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314);
hero.shadow(true, 0);
var P = {};
var T = {};
T.tot = TT; T.b1 = s0("b1"); T.end = s0("end");
T.b1 = s0("b1");
T.b2 = s0("b2");
T.b3 = s0("b3");
T.b4 = s0("b4");
T.b5 = s0("b5");
T.b6 = s0("b6");
T.b7 = s0("b7");
T.b8 = s0("b8");
T.b9 = s0("b9");

// ===== HOOK (prvy snimok = posledny)
PF.M.handheld();
R.camSet("wide", 0); R.camHold(0.3);
PF.tl.fromTo("#hookIn", { scale: 1.55 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, 0);
R.setFace(0, "shocked", 0); hero.look(0, 0, 0, 0);

PF.M.ffsky((s0("hook") + 0.0), null, T.b1, {});
PF.M.ffpose(at("hook", "fall"), "tumble", T.b1, {});
PF.M.ffsky(at("hook", "plane"), "plane", T.b1, {});
PF.M.ffsky(at("hook", "parachute"), "nochute", T.b1, {});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : You fall faster every second. Guess your top speed.
F("body", T.b1 + 0.1);
F(PF.M.ffspeed(at("b1", "faster"), "climb", s0("b2"), {}), at("b1", "faster"));
F(PF.M.ffsky(at("b1", "faster"), "fast", s0("b2"), {}), at("b1", "faster"));
F(PF.M.ffpose(at("b1", "every"), "shock", s0("b2"), {}), at("b1", "every"));
F(PF.M.ffspeed(at("b1", "guess"), "guess", s0("b2"), {}), at("b1", "guess"));

// ===== : About ten seconds in, the air pushing up matches gravity.
F("body", T.b2 + 0.1);
F(PF.M.ffspeed(at("b2", "about"), "small", s0("b3"), {}), at("b2", "about"));
F(PF.M.timer(at("b2", "ten"), 0.1667, s0("b3"), {"dur": 0.6}), at("b2", "ten"));
F(PF.M.ffforce(at("b2", "air"), "show", s0("b3"), {}), at("b2", "air"));
F(PF.M.ffforce(at("b2", "matches"), "match", s0("b3"), {}), at("b2", "matches"));
F(PF.M.ffspeed(at("b2", "matches"), "freeze", s0("b3"), {}), at("b2", "matches"));

// ===== : Belly down, that's about one hundred twenty miles an hour.
F("body", T.b3 + 0.1);
F(PF.M.clear(at("b3", "belly"), "timer,force", s0("b4"), {}), at("b3", "belly"));
F(PF.M.ffspeed(at("b3", "belly"), "big", s0("b4"), {}), at("b3", "belly"));
F(PF.M.ffpose(at("b3", "down"), "arch", s0("b4"), {}), at("b3", "down"));
F(PF.M.ffspeed(at("b3", "hundred"), 120, s0("b4"), {}), at("b3", "hundred"));
F(PF.M.stamp(at("b3", "twenty"), "TERMINAL SPEED", s0("b4"), {"y": 1250, "size": 72}), at("b3", "twenty"));

// ===== : Honest truth. Nobody has ever tested how to survive this.
F("body", T.b4 + 0.1);
F(PF.M.clear(at("b4", "honest"), "speed,wind", s0("b5"), {}), at("b4", "honest"));
F(PF.M.ffpose(at("b4", "truth"), "search", s0("b5"), {}), at("b4", "truth"));
F(PF.M.ffcase(at("b4", "nobody"), "zero", s0("b5"), {}), at("b4", "nobody"));
F(PF.M.ffpose(at("b4", "tested"), "worry", s0("b5"), {}), at("b4", "tested"));

// ===== : Survivor cases point to three things. None is a guarantee.
F("body", T.b5 + 0.1);
F(PF.M.ffcase(at("b5", "three"), "folders", s0("b6"), {}), at("b5", "three"));
F(PF.M.ffcase(at("b5", "guarantee"), "stamp", s0("b6"), {}), at("b5", "guarantee"));

// ===== : One. Land feet first.
F("body", T.b6 + 0.1);
F(PF.M.clear(at("b6", "one"), "case", s0("b7"), {}), at("b6", "one"));
F(PF.M.ffstep(at("b6", "one"), 1, s0("b7"), {}), at("b6", "one"));
F(PF.M.ffground(at("b6", "land"), "concrete", s0("b7"), {}), at("b6", "land"));
F(PF.M.ffpose(at("b6", "feet"), "feet", s0("b7"), {}), at("b6", "feet"));

// ===== : Two. Something soft, like snow or trees.
F("body", T.b7 + 0.1);
F(PF.M.ffstep(at("b7", "two"), 2, s0("b8"), {}), at("b7", "two"));
F(PF.M.ffground(at("b7", "snow"), "snow", s0("b8"), {}), at("b7", "snow"));
F(PF.M.ffground(at("b7", "trees"), "trees", s0("b8"), {}), at("b7", "trees"));

// ===== : Three. A slope, so the stop takes longer.
F("body", T.b8 + 0.1);
F(PF.M.ffstep(at("b8", "three"), 3, s0("b9"), {}), at("b8", "three"));
F(PF.M.ffground(at("b8", "slope"), "slope", s0("b9"), {}), at("b8", "slope"));
F(PF.M.ffground(at("b8", "stop"), "stop", s0("b9"), {}), at("b8", "stop"));

// ===== : Vesna Vulović fell thirty three thousand feet, pinned inside a plane's tail.
F("body", T.b9 + 0.1);
F(PF.M.clear(at("b9", "vesna"), "ground,stop,ffpose", s0("end"), {}), at("b9", "vesna"));
F(PF.M.fftail(at("b9", "vesna"), "in", s0("end"), {}), at("b9", "vesna"));
F(PF.M.count(at("b9", "thirty"), 33000, s0("end"), {"y": 330, "label": "FELL", "sub": "FEET", "dur": 1.4, "size": 110}), at("b9", "thirty"));
F(PF.M.fftail(at("b9", "pinned"), "inside", s0("end"), {}), at("b9", "pinned"));

// ===== KONIEC: The tail hit a snowy slope. She lived. Two out of three.
F("body", T.end + 0.1);
F(PF.M.fftail(at("end", "hit"), "land", T.tot, {}), at("end", "hit"));
F(PF.M.stamp(at("end", "lived"), "SHE LIVED", T.tot, {"y": 420}), at("end", "lived"));
F(PF.M.ffstep(at("end", "two"), "check", T.tot, {}), at("end", "two"));
F(PF.M.clear(at("end", "two"), "tail", T.tot, {}), at("end", "two"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
env.metric("–", tc + 0.15);
