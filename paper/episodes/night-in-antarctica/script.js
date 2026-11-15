// AUTO z compose.py: Night In Antarctica  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "mountain" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "hoodie", "hairStyle": "long", "hair": "#3b2a22", "suit": "#e0a32b", "suitDark": "#b98419", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0", "lashes": true});
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

PF.M.polar((s0("hook") + 0.0), null, T.b1, {});
PF.M.flask((s0("hook") + 0.0), null, T.b1, {});
PF.M.chill(at("hook", "freezing"), "on", T.b1, {"dur": 0.95});
PF.M.flask(at("hook", "drink"), "show", T.b1, {"hold": 0.7});
PF.M.choice(at("hook", "warm"), "A", T.b1, {"text": "<span style=\"font-size:62px\">WARMS YOU</span>"});
PF.M.choice(at("hook", "cool"), "B", T.b1, {"text": "<span style=\"font-size:62px\">COOLS YOU</span>"});
PF.O("#hook", 1, 0, at("hook", "warm") - 0.22, 0.18);

// ===== : One sip, and a warm glow spreads through you.
F("body", T.b1 + 0.1);
F(PF.M.choice((s0("b1") + 0.0), "small", s0("b2"), {}), (s0("b1") + 0.0));
F(PF.M.flask(at("b1", "sip"), "sip", s0("b2"), {}), at("b1", "sip"));
F(PF.M.warmth(at("b1", "glow"), "on", s0("b2"), {}), at("b1", "glow"));

// ===== : That glow is blood rushing out to your skin.
F("body", T.b2 + 0.1);
F(PF.M.vessel(at("b2", "that"), "show", s0("b3"), {}), at("b2", "that"));
F(PF.M.warmth(at("b2", "glow"), "skin", s0("b3"), {}), at("b2", "glow"));
F(R.look(at("b2", "blood"), "right"), at("b2", "blood"));
F(PF.M.vessel(at("b2", "blood"), "open", s0("b3"), {}), at("b2", "blood"));
F(PF.M.vessel(at("b2", "rushing"), "flow", s0("b3"), {}), at("b2", "rushing"));

// ===== : So it's card B. It feels warm while you lose heat.
F("body", T.b3 + 0.1);
F(R.look(at("b3", "so"), "cam"), at("b3", "so"));
F(PF.M.pick(at("b3", "b"), "B", s0("b4"), {"mark": "ok"}), at("b3", "b"));
F(PF.M.vessel(at("b3", "it"), "off", s0("b4"), {}), at("b3", "it"));
F(PF.M.warmth(at("b3", "feels"), "leak", s0("b4"), {"hold": 1.6}), at("b3", "feels"));
F(PF.M.core(at("b3", "warm"), "show", s0("b4"), {}), at("b3", "warm"));
F(PF.M.core(at("b3", "lose"), 0.6, s0("b4"), {}), at("b3", "lose"));

// ===== : A lot of alcohol can also weaken shivering, your heater.
F("body", T.b4 + 0.1);
F(PF.M.chill(at("b4", "a"), "on", s0("b5"), {"dur": 1.6}), at("b4", "a"));
F(PF.M.flask(at("b4", "alcohol"), "show", s0("b5"), {"hold": 0.6}), at("b4", "alcohol"));
F(PF.M.core(at("b4", "weaken"), 0.45, s0("b5"), {}), at("b4", "weaken"));
F(PF.M.chill(at("b4", "shivering"), "heater", s0("b5"), {"hold": 1.2}), at("b4", "shivering"));
F(PF.M.chill(at("b4", "heater"), "weak", s0("b5"), {}), at("b4", "heater"));

// ===== : Below about eighty six degrees inside your body, shivering stops.
F("body", T.b5 + 0.1);
F(PF.M.chill((s0("b5") + 0.0), "weak", s0("b6"), {"dur": 3.4}), (s0("b5") + 0.0));
F(PF.M.core(at("b5", "eighty"), "86", s0("b6"), {}), at("b5", "eighty"));
F(PF.M.chill(at("b5", "stops"), "stop", s0("b6"), {}), at("b5", "stops"));

// ===== : One. Put something between you and the frozen ground.
F("body", T.b6 + 0.1);
F(PF.M.clear((s0("b6") + 0.0), "ancore,anchill,anglow,anvessel,face", s0("b7"), {}), (s0("b6") + 0.0));
F(PF.M.choice((s0("b6") + 0.0), "off", s0("b7"), {}), (s0("b6") + 0.0));
F(PF.M.flask((s0("b6") + 0.1), "away", s0("b7"), {}), (s0("b6") + 0.1));
F(PF.M.step(at("b6", "one"), 1, s0("b7"), {"text": "INSULATE", "y": 112}), at("b6", "one"));
F(PF.M.camp(at("b6", "put"), "pad", s0("b7"), {}), at("b6", "put"));
F(PF.M.camp(at("b6", "between"), "block", s0("b7"), {}), at("b6", "between"));

// ===== : Two. Cover your head and neck, and get out of the wind.
F("body", T.b7 + 0.1);
F(PF.M.step(at("b7", "two"), 2, s0("b8"), {"text": "COVER UP", "y": 112}), at("b7", "two"));
F(PF.M.camp(at("b7", "cover"), "wrap", s0("b8"), {}), at("b7", "cover"));
F(PF.M.polar(at("b7", "neck"), "wind", s0("b8"), {"dur": 1.2}), at("b7", "neck"));
F(PF.M.polar(at("b7", "wind"), "wall", s0("b8"), {}), at("b7", "wind"));

// ===== : Three. Stay dry, and eat something warm and full of calories.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "three"), 3, s0("end"), {"text": "STAY DRY, EAT", "y": 112}), at("b8", "three"));
F(PF.M.camp(at("b8", "stay"), "dry", s0("end"), {}), at("b8", "stay"));
F(PF.M.camp(at("b8", "eat"), "soup", s0("end"), {}), at("b8", "eat"));
F(PF.M.camp(at("b8", "warm"), "eat", s0("end"), {}), at("b8", "warm"));
F(PF.M.camp(at("b8", "calories"), "kcal", s0("end"), {}), at("b8", "calories"));

// ===== KONIEC: Picked warms you? That warm feeling is your heat leaving.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "picked"), "anpad,anwrap,anwall,ansoup,anflask", T.tot, {}), at("end", "picked"));
F(PF.M.choice(at("end", "picked"), "big", T.tot, {}), at("end", "picked"));
F(PF.M.pick(at("end", "warms"), "A", T.tot, {}), at("end", "warms"));
F(PF.M.warmth(at("end", "warm"), "on", T.tot, {}), at("end", "warm"));
F(PF.M.warmth(at("end", "heat"), "leak", T.tot, {"hold": 0.75}), at("end", "heat"));
F(PF.M.pick(at("end", "leaving"), "A", T.tot, {"mark": "x"}), at("end", "leaving"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
