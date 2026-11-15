// AUTO z compose.py: Tornado On The Highway  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "road" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "hoodie", "hairStyle": "short", "hair": "#2a1d17", "suit": "#3f9a6b", "suitDark": "#2f7a53", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#b97a4d", "skinDark": "#9a603a", "blush": "#d9737a"});
R.init({"face0": "worried", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
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
R.setFace(0, "worried", 0); hero.look(0, 0, 0, 0);

PF.M.highway((s0("hook") + 0.0), null, T.b1, {});
PF.M.highway(at("hook", "tornado"), "look", T.b1, {});
PF.M.highway(at("hook", "coming"), "flash", T.b1, {});
PF.M.tnface(at("hook", "highway"), "shocked", T.b1, {});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : An overpass ahead looks like the perfect roof.
F("body", T.b1 + 0.1);
F(PF.M.highway(at("b1", "overpass"), "bridge", s0("b2"), {}), at("b1", "overpass"));
F(R.look(at("b1", "ahead"), "right"), at("b1", "ahead"));
F(PF.M.tnface(at("b1", "perfect"), "smile", s0("b2"), {}), at("b1", "perfect"));
F(PF.M.highway(at("b1", "roof"), "glow", s0("b2"), {}), at("b1", "roof"));

// ===== : But wind under a bridge is usually faster.
F("body", T.b2 + 0.1);
F(PF.M.clear(at("b2", "but"), "ovp,look,face", s0("b3"), {}), at("b2", "but"));
F(PF.M.underpass(at("b2", "but"), null, s0("b3"), {}), at("b2", "but"));
F(PF.M.underpass(at("b2", "wind"), "wind", s0("b3"), {}), at("b2", "wind"));
F(PF.M.underpass(at("b2", "faster"), "fast", s0("b3"), {}), at("b2", "faster"));

// ===== : And you're a sitting target for flying debris.
F("body", T.b3 + 0.1);
F(PF.M.underpass(at("b3", "sitting"), "crouch", s0("b4"), {}), at("b3", "sitting"));
F(PF.M.underpass(at("b3", "target"), "target", s0("b4"), {}), at("b3", "target"));
F(PF.M.underpass(at("b3", "flying"), "debris", s0("b4"), {}), at("b3", "flying"));

// ===== : Oklahoma, nineteen ninety nine. Winds of about three hundred miles an hour.
F("body", T.b4 + 0.1);
F(PF.M.clear(at("b4", "oklahoma"), "under,pose,face,look", s0("b5"), {}), at("b4", "oklahoma"));
F(PF.M.highway(at("b4", "oklahoma"), "flash", s0("b5"), {}), at("b4", "oklahoma"));
F(PF.M.radar(at("b4", "oklahoma"), null, s0("b5"), {}), at("b4", "oklahoma"));
F(R.look(at("b4", "winds"), "right"), at("b4", "winds"));
F(PF.M.tnface(at("b4", "three"), "shocked", s0("b5"), {}), at("b4", "three"));
F(PF.M.radar(at("b4", "three"), "hit", s0("b5"), {}), at("b4", "three"));

// ===== : Three people died under or near overpasses.
F("body", T.b5 + 0.1);
F(PF.M.ovmap(at("b5", "three"), null, s0("b6"), {}), at("b5", "three"));
F(PF.M.ovmap(at("b5", "people"), "mark", s0("b6"), {"step": 0.35}), at("b5", "people"));
F(PF.M.tnface(at("b5", "died"), "worried", s0("b6"), {}), at("b5", "died"));
F(R.look(at("b5", "near"), "down"), at("b5", "near"));
hero.blink(T.b5 + 1.2); if (s0("b6") - T.b5 > 3.2) hero.blink(T.b5 + 2.9);

// ===== : Let's drive that road again.
F("body", T.b6 + 0.1);
F(PF.M.clear(at("b6", "lets"), "ovmap,look,face", s0("b7"), {}), at("b6", "lets"));
F(PF.M.rewind(at("b6", "drive"), null, s0("b7"), {}), at("b6", "drive"));
F(PF.M.highway(at("b6", "drive"), "rewind", s0("b7"), {}), at("b6", "drive"));
F(PF.M.tnface(at("b6", "again"), "smile", s0("b7"), {}), at("b6", "again"));

// ===== : One. Best is a basement or an inner room, not a car.
F("body", T.b7 + 0.1);
F(PF.M.step(at("b7", "one"), 1, s0("b8"), {"text": "BASEMENT / INNER ROOM", "y": 130, "size": 52}), at("b7", "one"));
F(PF.M.shelter(at("b7", "one"), null, s0("b8"), {}), at("b7", "one"));
F(PF.M.shelter(at("b7", "basement"), "base", s0("b8"), {}), at("b7", "basement"));
F(PF.M.shelter(at("b7", "inner"), "inner", s0("b8"), {}), at("b7", "inner"));
F(PF.M.shelter(at("b7", "car"), "nocar", s0("b8"), {}), at("b7", "car"));

// ===== : Two. Stuck in the car? Stay buckled, head below the windows.
F("body", T.b8 + 0.1);
F(PF.M.clear(at("b8", "two"), "house,pose,look,face", s0("b9"), {}), at("b8", "two"));
F(PF.M.step(at("b8", "two"), 2, s0("b9"), {"text": "BUCKLED, HEAD DOWN", "y": 130, "size": 52}), at("b8", "two"));
F(PF.M.buckle(at("b8", "stay"), "xray", s0("b9"), {}), at("b8", "stay"));
F(PF.M.buckle(at("b8", "buckled"), "click", s0("b9"), {}), at("b8", "buckled"));
F(PF.M.buckle(at("b8", "below"), "duck", s0("b9"), {}), at("b8", "below"));
F(PF.M.buckle(at("b8", "windows"), "shards", s0("b9"), {}), at("b8", "windows"));

// ===== : Three. Or lie somewhere clearly lower than the road, covering your head.
F("body", T.b9 + 0.1);
F(PF.M.clear(at("b9", "three"), "belt,face", s0("end"), {}), at("b9", "three"));
F(PF.M.step(at("b9", "three"), 3, s0("end"), {"text": "LIE LOW, COVER HEAD", "y": 130, "size": 52}), at("b9", "three"));
F(PF.M.ditch(at("b9", "three"), null, s0("end"), {}), at("b9", "three"));
F(PF.M.ditch(at("b9", "lie"), "lie", s0("end"), {}), at("b9", "lie"));
F(PF.M.ditch(at("b9", "lower"), "line", s0("end"), {}), at("b9", "lower"));
F(PF.M.ditch(at("b9", "covering"), "cover", s0("end"), {}), at("b9", "covering"));

// ===== KONIEC: Rewatch it. That overpass won't look like a roof again.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "rewatch"), "ditch,step,far,face,look", T.tot, {}), at("end", "rewatch"));
F(PF.M.highway(at("end", "rewatch"), "cam", T.tot, {}), at("end", "rewatch"));
F(PF.M.card(at("end", "rewatch"), "SAVE THIS", T.tot, {"text": ["1 BASEMENT / INNER ROOM", "2 BUCKLED, HEAD DOWN", "3 LIE LOW, COVER HEAD"], "size": 50, "y": 140}), at("end", "rewatch"));
F(PF.M.highway(at("end", "overpass"), "bridge", T.tot, {}), at("end", "overpass"));
F(PF.M.stamp(at("end", "roof"), "TRAP", T.tot, {"y": 1370, "size": 80, "hold": 0.8}), at("end", "roof"));
F(PF.M.highway(at("end", "again"), "outro", T.tot, {}), at("end", "again"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
