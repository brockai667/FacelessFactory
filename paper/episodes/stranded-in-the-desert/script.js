// AUTO z compose.py: Stranded In The Desert  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "desert" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "short", "hair": "#4a3226", "suit": "#3f7fbf", "suitDark": "#2f629a", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
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

// ===== HOOK (prvy snimok = posledny)
PF.M.handheld();
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "worried", 0); hero.look(0, 0, 0, 0);

PF.M.bottle((s0("hook") + 0.0), null, T.b1, {});
R.look(at("hook", "car"), "right");
PF.M.cardie(at("hook", "died"), null, T.b1, {});
R.look(at("hook", "you"), "cam");
PF.M.bottle(at("hook", "one"), "show", T.b1, {"hold": 1.0});
hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : Do you save it, or drink it?
F("body", T.b1 + 0.1);
F(PF.M.choice(at("b1", "save"), "A", s0("b2"), {"text": "SAVE IT"}), at("b1", "save"));
F(PF.M.choice(at("b1", "drink"), "B", s0("b2"), {"text": "DRINK IT"}), at("b1", "drink"));
hero.blink(T.b1 + 1.2); if (s0("b2") - T.b1 > 3.2) hero.blink(T.b1 + 2.9);

// ===== : In this heat, you can sweat out a liter every hour.
F("body", T.b2 + 0.1);
F(PF.M.choice((s0("b2") + 0.0), "small", s0("b3"), {}), (s0("b2") + 0.0));
F(R.mood((s0("b2") + 0.3), "hot", s0("b3")), (s0("b2") + 0.3));
F(PF.M.meter(at("b2", "heat"), 1, s0("b3"), {}), at("b2", "heat"));
F(PF.M.jug(at("b2", "you"), null, s0("b3"), {"dur": 1.2, "hold": 2.7, "over": 0.9}), at("b2", "you"));
F(PF.M.meter(at("b2", "sweat"), 0.62, s0("b3"), {"dur": 1.3}), at("b2", "sweat"));

// ===== : Instinct says save it. But ration it, and the heat can take you down with water still in the bottle.
F("body", T.b3 + 0.1);
F(PF.M.pick(at("b3", "save"), "A", s0("b4"), {}), at("b3", "save"));
F(PF.M.meter(at("b3", "but"), 0.3, s0("b4"), {"dur": 1.6}), at("b3", "but"));
F(R.face(at("b3", "heat"), "dizzy"), at("b3", "heat"));
F(R.slump(at("b3", "take")), at("b3", "take"));
F(PF.M.spot(at("b3", "still"), "bottle", s0("b4"), {"text": "STILL FULL", "dx": 110}), at("b3", "still"));
F(PF.M.pick(at("b3", "bottle"), "A", s0("b4"), {"mark": "x"}), at("b3", "bottle"));

// ===== : So sip it, early and often. Water works in your body, not in the bottle.
F("body", T.b4 + 0.1);
F(PF.M.pick(at("b4", "so"), "B", s0("b5"), {"mark": "ok"}), at("b4", "so"));
F(PF.M.drink(at("b4", "sip"), 0.45, s0("b5"), {}), at("b4", "sip"));
F(PF.M.meter(at("b4", "works"), 0.8, s0("b5"), {"dur": 0.9, "flash": true}), at("b4", "works"));
F(PF.M.bottle(at("b4", "not"), "show", s0("b5"), {"hold": 0.4}), at("b4", "not"));

// ===== : Don't ration your water. Ration your sweat.
F("body", T.b5 + 0.1);
F(PF.M.choice((s0("b5") + 0.0), "off", s0("b6"), {}), (s0("b5") + 0.0));
F(R.look(at("b5", "dont"), "right"), at("b5", "dont"));
F(PF.M.spot(at("b5", "ration"), "bottle", s0("b6"), {"text": "DON'T RATION", "dx": 115, "size": 56, "hold": 1.15}), at("b5", "ration"));
F(R.sweat(at("b5", "ration", 1)), at("b5", "ration", 1));
F(PF.M.stamp(at("b5", "ration", 1), "RATION|YOUR SWEAT", s0("b6"), {"y": 240, "over": 0.4}), at("b5", "ration", 1));
hero.blink(T.b5 + 1.2); if (s0("b6") - T.b5 > 3.2) hero.blink(T.b5 + 2.9);

// ===== : One. Cover up. Clothes block the sun and make your sweat last.
F("body", T.b6 + 0.1);
F(PF.M.step(at("b6", "one"), 1, s0("b7"), {"text": "COVER UP", "y": 112}), at("b6", "one"));
F(PF.M.cover(at("b6", "cover"), null, s0("b7"), {"color": "#3f7fbf", "stroke": "#2f629a", "rays": 6}), at("b6", "cover"));
F(PF.M.meter(at("b6", "last"), 0.8, s0("b7"), {"flash": true}), at("b6", "last"));
hero.blink(T.b6 + 1.2); if (s0("b7") - T.b6 > 3.2) hero.blink(T.b6 + 2.9);

// ===== : Two. Find shade, and get off the ground. The sand is far hotter than the air.
F("body", T.b7 + 0.1);
F(PF.M.step(at("b7", "two"), 2, s0("b8"), {"text": "FIND SHADE", "y": 112}), at("b7", "two"));
F(PF.M.shade(at("b7", "find"), null, s0("b8"), {}), at("b7", "find"));
F(PF.M.perch(at("b7", "get"), null, s0("b8"), {}), at("b7", "get"));
F(PF.M.thermo(at("b7", "sand"), null, s0("b8"), {}), at("b7", "sand"));
F(PF.M.meter(at("b7", "air"), 0.8, s0("b8"), {"flash": true}), at("b7", "air"));
hero.blink(T.b7 + 1.2); if (s0("b8") - T.b7 > 3.2) hero.blink(T.b7 + 2.9);

// ===== : Three. Stay with the car. It's much easier to spot than you.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "three"), 3, s0("end"), {"text": "STAY PUT", "y": 112}), at("b8", "three"));
F(R.look(at("b8", "stay"), "right"), at("b8", "stay"));
F(PF.M.aerial(at("b8", "car"), null, s0("end"), {"q": 1.95, "hold": 3.0, "over": 0.9}), at("b8", "car"));
hero.blink(T.b8 + 1.2); if (s0("end") - T.b8 > 3.2) hero.blink(T.b8 + 2.9);

// ===== KONIEC: So, save it or drink it? Tell me which one you picked.
F("body", T.end + 0.1);
F(PF.M.choice(at("end", "save"), "big", T.tot, {}), at("end", "save"));
F(PF.M.hail(at("end", "tell"), null, T.tot, {"face": "excited"}), at("end", "tell"));
hero.blink(T.end + 1.2); if (T.tot - T.end > 3.2) hero.blink(T.end + 2.9);

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
