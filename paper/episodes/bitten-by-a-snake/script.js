// AUTO z compose.py: Bitten By A Snake  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "meadow" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "curly", "hair": "#4a3226", "suit": "#7a5cc0", "suitDark": "#5d439c", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#b97a4d", "skinDark": "#9a603a", "blush": "#d9737a"});
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

PF.M.snake((s0("hook") + 0.0), null, T.b1, {});
R.look((s0("hook") + 0.05), "left");
PF.M.snake(at("hook", "bit"), "strike", T.b1, {});
PF.M.choice(at("hook", "suck"), "A", T.b1, {"text": "SUCK IT"});
PF.M.choice(at("hook", "keep"), "B", T.b1, {"text": "KEEP STILL"});
PF.O("#hook", 1, 0, at("hook", "suck") - 0.22, 0.18);

// ===== : Your fingers start to swell.
F("body", T.b1 + 0.1);
F(PF.M.choice((s0("b1") + 0.0), "small", s0("b2"), {}), (s0("b1") + 0.0));
F(PF.M.hand((s0("b1") + 0.15), "show", s0("b2"), {}), (s0("b1") + 0.15));
F(PF.M.hand(at("b1", "start"), "swell", s0("b2"), {}), at("b1", "start"));
hero.blink(T.b1 + 1.2); if (s0("b2") - T.b1 > 3.2) hero.blink(T.b1 + 2.9);

// ===== : In the movies, someone always sucks the venom out.
F("body", T.b2 + 0.1);
F(PF.M.hand((s0("b2") + 0.0), "off", s0("b3"), {}), (s0("b2") + 0.0));
F(PF.M.movie(at("b2", "movies"), null, s0("b3"), {}), at("b2", "movies"));
F(PF.M.pick(at("b2", "someone"), "A", s0("b3"), {}), at("b2", "someone"));
F(PF.M.suck(at("b2", "sucks"), null, s0("b3"), {}), at("b2", "sucks"));

// ===== : In a lab test, suction got out less than one percent.
F("body", T.b3 + 0.1);
F(R.look((s0("b3") + 0.0), "right"), (s0("b3") + 0.0));
F(PF.M.vial(at("b3", "lab"), "show", s0("b4"), {}), at("b3", "lab"));
F(PF.M.vial(at("b3", "less"), "pct", s0("b4"), {}), at("b3", "less"));
F(PF.M.pick(at("b3", "percent"), "A", s0("b4"), {"mark": "x"}), at("b3", "percent"));
hero.blink(T.b3 + 1.2); if (s0("b4") - T.b3 > 3.2) hero.blink(T.b3 + 2.9);

// ===== : Snakebites kill up to one hundred thirty eight thousand people a year.
F("body", T.b4 + 0.1);
F(R.look((s0("b4") + 0.0), "cam"), (s0("b4") + 0.0));
F(PF.M.count(at("b4", "snakebites"), 138000, s0("b5"), {"sub": "DEATHS A YEAR", "size": 116, "y": 262}), at("b4", "snakebites"));
F(R.face(at("b4", "thousand"), "shocked"), at("b4", "thousand"));

// ===== : Keep still wins. Moving pushes venom through your lymph.
F("body", T.b5 + 0.1);
F(PF.M.pick(at("b5", "keep"), "B", s0("b6"), {"mark": "ok"}), at("b5", "keep"));
F(PF.M.venom(at("b5", "moving"), "move", s0("b6"), {}), at("b5", "moving"));

// ===== : One. Take off rings and watches before the swelling traps them.
F("body", T.b6 + 0.1);
F(PF.M.choice((s0("b6") + 0.0), "off", s0("b7"), {}), (s0("b6") + 0.0));
F(PF.M.step(at("b6", "one"), 1, s0("b7"), {"text": "RINGS OFF", "y": 112}), at("b6", "one"));
F(PF.M.hand(at("b6", "take"), "show", s0("b7"), {}), at("b6", "take"));
F(PF.M.hand(at("b6", "rings"), "ring", s0("b7"), {}), at("b6", "rings"));
F(PF.M.hand(at("b6", "watches"), "watch", s0("b7"), {}), at("b6", "watches"));
F(PF.M.hand(at("b6", "swelling"), "show", s0("b7"), {}), at("b6", "swelling"));
hero.blink(T.b6 + 1.2); if (s0("b7") - T.b6 > 3.2) hero.blink(T.b6 + 2.9);

// ===== : Two. Rest the arm in a comfy position and keep it still.
F("body", T.b7 + 0.1);
F(PF.M.hand((s0("b7") + 0.0), "off", s0("b8"), {}), (s0("b7") + 0.0));
F(PF.M.step(at("b7", "two"), 2, s0("b8"), {"text": "KEEP STILL", "y": 112}), at("b7", "two"));
F(PF.M.sling(at("b7", "rest"), null, s0("b8"), {}), at("b7", "rest"));
F(R.face(at("b7", "comfy"), "smile"), at("b7", "comfy"));
F(PF.M.venom(at("b7", "keep"), "still", s0("b8"), {}), at("b7", "keep"));

// ===== : Three. Let someone drive you to a hospital for antivenom.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "three"), 3, s0("end"), {"text": "GET ANTIVENOM", "y": 112}), at("b8", "three"));
F(PF.M.ride(at("b8", "someone"), null, s0("end"), {}), at("b8", "someone"));
F(PF.M.ride(at("b8", "hospital"), "sign", s0("end"), {}), at("b8", "hospital"));
F(PF.M.antivenom(at("b8", "antivenom"), null, s0("end"), {}), at("b8", "antivenom"));

// ===== KONIEC: Picked suck it out? Replay it and keep still this time.
F("body", T.end + 0.1);
F(PF.M.choice(at("end", "picked"), "big", T.tot, {}), at("end", "picked"));
F(PF.M.rewind(at("end", "replay"), null, T.tot, {"text": "REPLAY"}), at("end", "replay"));
F(PF.M.snake(at("end", "keep"), "back", T.tot, {}), at("end", "keep"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
