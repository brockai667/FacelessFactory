// AUTO z compose.py: Your Car Is Sinking  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "road" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "long", "hair": "#1f1611", "suit": "#d4a017", "suitDark": "#a87d0f", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a", "lashes": true});
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

PF.M.cscar((s0("hook") + 0.0), null, T.b1, {});
PF.M.cscar(at("hook", "sinking"), "sink", T.b1, {});
PF.M.choice(at("hook", "window"), "A", T.b1, {"text": "WINDOW"});
PF.M.choice(at("hook", "wait"), "B", T.b1, {"text": "WAIT"});
PF.O("#hook", 1, 0, at("hook", "open") - 0.22, 0.18);

// ===== : Wait means letting it fill, then pushing the door open.
F("body", T.b1 + 0.1);
F(PF.M.choice((s0("b1") + 0.0), "small", s0("b2"), {}), (s0("b1") + 0.0));
F(PF.M.pick(at("b1", "wait"), "B", s0("b2"), {}), at("b1", "wait"));
F(PF.M.cscar(at("b1", "fill"), "fill", s0("b2"), {}), at("b1", "fill"));
F(PF.M.cscar(at("b1", "door"), "push", s0("b2"), {}), at("b1", "door"));

// ===== : But water outside holds the door shut.
F("body", T.b2 + 0.1);
F(PF.M.cscar(at("b2", "water"), "press", s0("b3"), {}), at("b2", "water"));
F(PF.M.csface(at("b2", "holds"), "shocked", s0("b3"), {}), at("b2", "holds"));
F(PF.M.cscar(at("b2", "shut"), "lock", s0("b3"), {}), at("b2", "shut"));
F(PF.M.stamp(at("b2", "shut"), "SHUT", s0("b3"), {"y": 520, "size": 110, "hold": 1.0}), at("b2", "shut"));

// ===== : By the time it fills, the car is deep and you have one breath.
F("body", T.b3 + 0.1);
F(PF.M.clear(at("b3", "by"), "cspress", s0("b4"), {}), at("b3", "by"));
F(PF.M.cscar(at("b3", "time"), "deep", s0("b4"), {}), at("b3", "time"));
F(PF.M.cscar(at("b3", "fills"), "fillall", s0("b4"), {}), at("b3", "fills"));
F(PF.M.csface(at("b3", "deep"), "worried", s0("b4"), {}), at("b3", "deep"));
F(PF.M.cscar(at("b3", "breath"), "breath", s0("b4"), {}), at("b3", "breath"));
F(PF.M.pick(at("b3", "breath"), "B", s0("b4"), {"mark": "x"}), at("b3", "breath"));

// ===== : About four hundred people die in sinking cars in North America each year.
F("body", T.b4 + 0.1);
F(PF.M.cscard(at("b4", "about"), null, s0("b5"), {}), at("b4", "about"));
F(PF.M.cscard(at("b4", "four"), "count", s0("b5"), {"dur": 1.6}), at("b4", "four"));
F(PF.M.csface(at("b4", "die"), "shocked", s0("b5"), {}), at("b4", "die"));
hero.blink(T.b4 + 1.2); if (s0("b5") - T.b4 > 3.2) hero.blink(T.b4 + 2.9);

// ===== : It's the window. You get about a minute before water reaches it.
F("body", T.b5 + 0.1);
F(PF.M.cscar(at("b5", "its"), "reset", s0("b6"), {}), at("b5", "its"));
F(PF.M.pick(at("b5", "window"), "A", s0("b6"), {"mark": "ok"}), at("b5", "window"));
F(PF.M.cscar(at("b5", "window"), "glow", s0("b6"), {}), at("b5", "window"));
F(PF.M.csclock(at("b5", "minute"), null, s0("b6"), {}), at("b5", "minute"));
F(PF.M.csclock(at("b5", "minute"), "go", s0("b6"), {"to": 0.3, "dur": 10.2}), at("b5", "minute"));
F(PF.M.cscar(at("b5", "minute"), "rise", s0("b6"), {"to": 1090, "dur": 10.2}), at("b5", "minute"));

// ===== : One. Seatbelt off.
F("body", T.b6 + 0.1);
F(PF.M.choice((s0("b6") + 0.0), "off", s0("b7"), {}), (s0("b6") + 0.0));
F(PF.M.step(at("b6", "one"), 1, s0("b7"), {"text": "SEATBELT OFF", "y": 112}), at("b6", "one"));
F(PF.M.cscar(at("b6", "one"), "zoom", s0("b7"), {"s": 1.5, "x": 540, "y": 1000, "dur": 0.4}), at("b6", "one"));
F(PF.M.cscar(at("b6", "off"), "belt", s0("b7"), {}), at("b6", "off"));

// ===== : Two. Window down, while the power still works.
F("body", T.b7 + 0.1);
F(PF.M.step(at("b7", "two"), 2, s0("b8"), {"text": "WINDOW DOWN", "y": 112}), at("b7", "two"));
F(PF.M.cscar(at("b7", "window"), "zoom", s0("b8"), {"s": 1.4, "x": 520, "y": 980, "dur": 0.45}), at("b7", "window"));
F(PF.M.cscar(at("b7", "down"), "down", s0("b8"), {}), at("b7", "down"));
F(PF.M.cscar(at("b7", "power"), "power", s0("b8"), {}), at("b7", "power"));

// ===== : Three. Out through it, children first. Don't stop to call.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "three"), 3, s0("end"), {"text": "OUT, KIDS FIRST", "y": 112}), at("b8", "three"));
F(PF.M.cscar(at("b8", "out"), "arrow", s0("end"), {}), at("b8", "out"));
F(PF.M.cscar(at("b8", "children"), "kid", s0("end"), {}), at("b8", "children"));
F(PF.M.cscar(at("b8", "first"), "out", s0("end"), {}), at("b8", "first"));
F(PF.M.csphone(at("b8", "dont"), null, s0("end"), {}), at("b8", "dont"));
F(PF.M.csphone(at("b8", "call"), "x", s0("end"), {}), at("b8", "call"));

// ===== KONIEC: If you picked wait, you just spent your minute.
F("body", T.end + 0.1);
F(PF.M.cscar(at("end", "if"), "cam", T.tot, {"clear": "csbelt,csglass,cskid,cspose,csarrow,csphone,step,csglow,face"}), at("end", "if"));
F(PF.M.choice(at("end", "if"), "big", T.tot, {}), at("end", "if"));
F(PF.M.pick(at("end", "wait"), "B", T.tot, {}), at("end", "wait"));
F(PF.M.csclock(at("end", "spent"), "zero", T.tot, {"dur": 0.4}), at("end", "spent"));
F(PF.M.cscar(at("end", "spent"), "spent", T.tot, {"to": 740, "dur": 0.7}), at("end", "spent"));
F(PF.M.cscar(at("end", "minute"), "outro", T.tot, {}), at("end", "minute"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
