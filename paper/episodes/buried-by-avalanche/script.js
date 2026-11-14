// AUTO z compose.py: Buried By An Avalanche  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "mountain" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "hoodie", "hairStyle": "cap", "hair": "#4a3226", "suit": "#e98a2b", "suitDark": "#c76f1c", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0", "capColor": "#d9483b"});
R.init({"face0": "shocked", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
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

R.look((s0("hook") + 0.0), "up");
PF.M.bury((s0("hook") + 0.12), "snow", T.b1, {"dur": 0.9});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : The snow stops, and it sets around you like concrete.
F("body", T.b1 + 0.1);
F(R.look((s0("b1") + 0.15), "left"), (s0("b1") + 0.15));
F(R.look(at("b1", "stops"), "right"), at("b1", "stops"));
F(PF.M.squeeze(at("b1", "sets"), null, s0("b2"), {}), at("b1", "sets"));
F(PF.M.struggle(at("b1", "around"), null, s0("b2"), {"dur": 0.9}), at("b1", "around"));
F(PF.M.stamp(at("b1", "concrete"), "LIKE|CONCRETE", s0("b2"), {}), at("b1", "concrete"));

// ===== : You can't move. You can't even tell which way is up.
F("body", T.b2 + 0.1);
F(PF.M.struggle(at("b2", "move"), null, s0("b3"), {"dur": 0.6}), at("b2", "move"));
F(PF.M.spin(at("b2", "even"), null, s0("b3"), {"dur": 2.0}), at("b2", "even"));

// ===== : Your warm breath melts the snow at your face, then it freezes into a mask of ice.
F("body", T.b3 + 0.1);
F(PF.M.closeup((s0("b3") + 0.1), null, s0("b4"), {"zoom": 1.55}), (s0("b3") + 0.1));
F(R.puff(at("b3", "breath")), at("b3", "breath"));
F(R.puff(at("b3", "melts")), at("b3", "melts"));
F(R.shiver(at("b3", "face"), 1.4), at("b3", "face"));
F(PF.M.mask(at("b3", "freezes"), null, s0("b4"), {"dur": 1.2}), at("b3", "freezes"));
F(R.face(at("b3", "ice"), "tired"), at("b3", "ice"));

// ===== : Dug out within fifteen minutes, nine in ten people survive.
F("body", T.b4 + 0.1);
F(PF.M.timer(at("b4", "within"), 15, s0("b5"), {"label": "BURIED FOR", "dur": 0.9}), at("b4", "within"));
F(PF.M.people(at("b4", "nine"), 9, s0("b5"), {}), at("b4", "nine"));
F(R.shiver(at("b4", "people"), 1.4), at("b4", "people"));
hero.blink(T.b4 + 1.2); if (s0("b5") - T.b4 > 3.2) hero.blink(T.b4 + 2.9);

// ===== : After thirty five minutes, it's only about three.
F("body", T.b5 + 0.1);
F(PF.M.timer(at("b5", "after"), 35, s0("b6"), {"dur": 1.0, "color": "#d9483b"}), at("b5", "after"));
F(PF.M.people(at("b5", "only"), 3, s0("b6"), {}), at("b5", "only"));
F(R.face(at("b5", "three"), "sleepy"), at("b5", "three"));

// ===== : So rewind. Before the snow sets, remember three things.
F("body", T.b6 + 0.1);
F(PF.M.rewind(at("b6", "rewind"), null, s0("b7"), {"dur": 0.9}), at("b6", "rewind"));
F(PF.M.struggle(at("b6", "before"), null, s0("b7"), {"dur": 0.7}), at("b6", "before"));
F(PF.M.stamp(at("b6", "three"), "REMEMBER|3 THINGS", s0("b7"), {"y": 150}), at("b6", "three"));

// ===== : One. Get your hands in front of your mouth. That's your air pocket.
F("body", T.b7 + 0.1);
F(PF.M.step(at("b7", "one"), 1, s0("b8"), {"text": "AIR POCKET"}), at("b7", "one"));
F(PF.M.airpocket(at("b7", "get"), null, s0("b8"), {}), at("b7", "get"));
F(R.puff(at("b7", "thats")), at("b7", "thats"));
F(R.puff(at("b7", "pocket")), at("b7", "pocket"));

// ===== : Two. Don't spit to find which way is up. It's a myth. You can't dig out anyway.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "two"), 2, s0("b9"), {"text": "DON'T SPIT"}), at("b8", "two"));
F(PF.M.spit(at("b8", "spit"), null, s0("b9"), {}), at("b8", "spit"));
F(PF.M.stamp(at("b8", "myth"), "MYTH", s0("b9"), {"y": 296, "size": 150, "hold": 1.4}), at("b8", "myth"));
F(PF.M.struggle(at("b8", "dig"), null, s0("b9"), {"dur": 0.8}), at("b8", "dig"));

// ===== : Three. Punch a hand up, so they can find you.
F("body", T.b9 + 0.1);
F(PF.M.step(at("b9", "three"), 3, s0("end"), {"text": "HAND UP"}), at("b9", "three"));
F(PF.M.armup(at("b9", "punch"), null, s0("end"), {}), at("b9", "punch"));
F(PF.M.reach(at("b9", "up"), null, s0("end"), {}), at("b9", "up"));
F(PF.M.release(at("b9", "find"), null, s0("end"), {}), at("b9", "find"));
F(PF.M.buddy(at("b9", "you"), null, s0("end"), {}), at("b9", "you"));

// ===== KONIEC: Save this. You won't have time to look it up.
F("body", T.end + 0.1);
F(PF.M.card(at("end", "save"), "SAVE THIS", T.tot, {"text": ["1 AIR POCKET", "2 DON'T SPIT", "3 HAND UP"], "size": 80, "y": 1080}), at("end", "save"));
F(R.thumbs_up(at("end", "wont")), at("end", "wont"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
