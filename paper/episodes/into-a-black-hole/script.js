// AUTO z compose.py: Into A Black Hole  (env space, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envSpace({ scene: "station" });
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "suit", "hairStyle": "curly", "hair": "#b5502a", "suit": "#eef2f6", "suitDark": "#aeb9c6", "patch": "#f39c42", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "shocked", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
PF.fx.dust(20, 314, "#ffffff");
hero.shadow(false, 0);
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

// ===== HOOK (prvy snimok = posledny)
PF.M.handheld();
R.camSet("wide", 0); R.camHold(0.3);
PF.tl.fromTo("#hookIn", { scale: 1.55 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, 0);
R.setFace(0, "shocked", 0); hero.look(0, 0, 0, 0);
hero.bob(0, T.b1 - 0.2);

PF.M.abyss((s0("hook") + 0.0), null, T.b1, {});
PF.M.abyss((s0("hook") + 0.1), "fall", T.b1, {"dur": 2.6});
R.look(at("hook", "fell"), "down");
PF.M.abyss(at("hook", "edge"), "edge", T.b1, {});
PF.M.abyss(at("hook", "black"), "pulse", T.b1, {});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : Not even light can get back out now.
F("body", T.b1 + 0.1);
F(PF.M.abyss(at("b1", "light"), "light", s0("b2"), {}), at("b1", "light"));
F(PF.M.abyss(at("b1", "out"), "dark", s0("b2"), {}), at("b1", "out"));

// ===== : Your feet get pulled harder than your head, and you start to stretch.
F("body", T.b2 + 0.1);
F(PF.M.noodle(at("b2", "feet"), "feet", s0("b3"), {"hd": 1.45}), at("b2", "feet"));
F(PF.M.noodle(at("b2", "start"), "stretch", s0("b3"), {}), at("b2", "start"));

// ===== : Guess how many seconds you have left.
F("body", T.b3 + 0.1);
F(PF.M.noodle((s0("b3") + 0.0), "more", s0("b4"), {}), (s0("b3") + 0.0));
F(PF.M.doom(at("b3", "guess"), null, s0("b4"), {}), at("b3", "guess"));

// ===== : Twelve point eight. Then the stretch tears you apart like spaghetti.
F("body", T.b4 + 0.1);
F(PF.M.doom(at("b4", "twelve"), "reveal", s0("b5"), {"dur": 0.75}), at("b4", "twelve"));
F(PF.M.doom(at("b4", "then"), "down", s0("b5"), {"dur": 1.83}), at("b4", "then"));
F(PF.M.noodle(at("b4", "tears"), "tear", s0("b5"), {}), at("b4", "tears"));
F(PF.M.noodle(at("b4", "spaghetti"), "spaghetti", s0("b5"), {}), at("b4", "spaghetti"));

// ===== : Back up. Your friend, watching from far away, sees something else.
F("body", T.b5 + 0.1);
F(PF.M.clear((s0("b5") + 0.8), "noodle,doom,stars,fall,look,face", s0("b6"), {}), (s0("b5") + 0.8));
F(PF.M.farview(at("b5", "back"), null, s0("b6"), {}), at("b5", "back"));
F(PF.M.farview(at("b5", "friend"), "friend", s0("b6"), {}), at("b5", "friend"));
F(PF.M.farview(at("b5", "watching"), "watch", s0("b6"), {}), at("b5", "watching"));
F(PF.M.farview(at("b5", "sees"), "sees", s0("b6"), {}), at("b5", "sees"));

// ===== : You never quite reach the edge. You slow down, turn red and fade.
F("body", T.b6 + 0.1);
F(PF.M.farview(at("b6", "never"), "approach", s0("b7"), {}), at("b6", "never"));
F(PF.M.farview(at("b6", "edge"), "edge", s0("b7"), {}), at("b6", "edge"));
F(PF.M.farview(at("b6", "slow"), "slow", s0("b7"), {}), at("b6", "slow"));
F(PF.M.farview(at("b6", "red"), "red", s0("b7"), {}), at("b6", "red"));
F(PF.M.farview(at("b6", "fade"), "fade", s0("b7"), {}), at("b6", "fade"));

// ===== : A small black hole rips you apart hundreds of kilometers before its edge.
F("body", T.b7 + 0.1);
F(PF.M.holes((s0("b7") + 0.3), null, s0("b8"), {"fall": 1.2}), (s0("b7") + 0.3));
F(PF.M.clear((s0("b7") + 0.6), "far", s0("b8"), {}), (s0("b7") + 0.6));
F(PF.M.holes(at("b7", "rips"), "rips", s0("b8"), {}), at("b7", "rips"));
F(PF.M.holes(at("b7", "hundreds"), "km", s0("b8"), {}), at("b7", "hundreds"));

// ===== : The bigger the black hole, the later the stretch.
F("body", T.b8 + 0.1);
F(PF.M.holes(at("b8", "bigger"), "big", s0("end"), {"dur": 1.3}), at("b8", "bigger"));
F(PF.M.holes(at("b8", "later"), "later", s0("end"), {}), at("b8", "later"));
F(PF.M.holes(at("b8", "stretch"), "stretch", s0("end"), {}), at("b8", "stretch"));

// ===== KONIEC: Watch again and count all twelve point eight seconds.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "watch"), "cmp", T.tot, {}), at("end", "watch"));
F(PF.M.doom(at("end", "again"), "run", T.tot, {}), at("end", "again"));
F(R.wave(at("end", "count")), at("end", "count"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
env.metric("0", tc + 0.15);
PF.XY("hero_float", { ty: -22, r: 3 }, T.tot - 1.4, 0.7, "sine.inOut", 1);
