// AUTO z compose.py: Earthquake At Home  (env room, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY", scene: "couch" });
document.getElementById("rm_gauges").style.display = "none";
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "bun", "hair": "#2b1a12", "suit": "#e2674a", "suitDark": "#b84f37", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#e3ae82", "skinDark": "#c68b5e", "blush": "#e98f86", "glasses": true});
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

PF.M.qkroom((s0("hook") + 0.0), null, T.b1, {});
PF.M.qkroom((s0("hook") + 0.0), "quake", T.b1, {"amp": 26});
PF.M.qkhero(at("hook", "floor"), "brace", T.b1, {});
PF.M.qkroom(at("hook", "shaking"), "fall", T.b1, {});
PF.M.choice(at("hook", "doorway"), "A", T.b1, {"text": "DOORWAY"});
PF.M.choice(at("hook", "table"), "B", T.b1, {"text": "TABLE"});
PF.O("#hook", 1, 0, at("hook", "doorway") - 0.22, 0.18);

// ===== : To reach the doorway, you cross the room while it shakes.
F("body", T.b1 + 0.1);
F(PF.M.choice((s0("b1") + 0.0), "small", s0("b2"), {}), (s0("b1") + 0.0));
F(PF.M.qkroom((s0("b1") + 0.0), "quake", s0("b2"), {"amp": 13}), (s0("b1") + 0.0));
F(PF.M.pick(at("b1", "doorway"), "A", s0("b2"), {}), at("b1", "doorway"));
F(PF.M.qkhero(at("b1", "cross"), "walk", s0("b2"), {"dur": 1.7}), at("b1", "cross"));
F(PF.M.qkroom(at("b1", "shakes"), "jolt", s0("b2"), {}), at("b1", "shakes"));

// ===== : A bookshelf comes down right where you were walking.
F("body", T.b2 + 0.1);
F(PF.M.qkroom((s0("b2") + 0.0), "cam", s0("b3"), {}), (s0("b2") + 0.0));
F(PF.M.qkroom((s0("b2") + 0.0), "quake", s0("b3"), {"amp": 12}), (s0("b2") + 0.0));
F(PF.M.qkhero(at("b2", "bookshelf"), "look", s0("b3"), {}), at("b2", "bookshelf"));
F(PF.M.qkroom(at("b2", "down"), "shelf", s0("b3"), {}), at("b2", "down"));
F(PF.M.qkroom(at("b2", "walking"), "spot", s0("b3"), {}), at("b2", "walking"));

// ===== : Most injuries come from moving during the shaking, or from falling things.
F("body", T.b3 + 0.1);
F(PF.M.qkroom((s0("b3") + 0.0), "quake", s0("b4"), {"amp": 9}), (s0("b3") + 0.0));
F(PF.M.qkcard(at("b3", "most"), "inj", s0("b4"), {}), at("b3", "most"));
F(PF.M.qkcard(at("b3", "moving"), "move", s0("b4"), {}), at("b3", "moving"));
F(PF.M.qkcard(at("b3", "falling"), "fall", s0("b4"), {}), at("b3", "falling"));

// ===== : And in a modern home, a doorway is no stronger than the rest.
F("body", T.b4 + 0.1);
F(PF.M.clear(at("b4", "and"), "qkcard,qkring", s0("b5"), {}), at("b4", "and"));
F(PF.M.qkroom(at("b4", "modern"), "xray", s0("b5"), {}), at("b4", "modern"));
F(PF.M.qkroom(at("b4", "doorway"), "same", s0("b5"), {}), at("b4", "doorway"));
F(PF.M.pick(at("b4", "stronger"), "A", s0("b5"), {"mark": "x"}), at("b4", "stronger"));
F(PF.M.stamp(at("b4", "stronger"), "MYTH", s0("b5"), {"y": 560, "size": 120, "hold": 1.2}), at("b4", "stronger"));

// ===== : The table wins. Drop, cover, hold on.
F("body", T.b5 + 0.1);
F(PF.M.qkroom(at("b5", "the"), "reset", s0("b6"), {}), at("b5", "the"));
F(PF.M.pick(at("b5", "table"), "B", s0("b6"), {"mark": "ok"}), at("b5", "table"));
F(PF.M.qkface(at("b5", "wins"), "smile", s0("b6"), {}), at("b5", "wins"));
F(PF.M.qkcard(at("b5", "drop"), "dch", s0("b6"), {}), at("b5", "drop"));
F(PF.M.qkcard(at("b5", "cover"), "c2", s0("b6"), {}), at("b5", "cover"));
F(PF.M.qkcard(at("b5", "hold"), "c3", s0("b6"), {}), at("b5", "hold"));

// ===== : One. Drop onto your hands and knees.
F("body", T.b6 + 0.1);
F(PF.M.clear((s0("b6") + 0.0), "qkcard", s0("b7"), {}), (s0("b6") + 0.0));
F(PF.M.choice((s0("b6") + 0.0), "off", s0("b7"), {}), (s0("b6") + 0.0));
F(PF.M.step(at("b6", "one"), 1, s0("b7"), {"text": "DROP", "y": 112}), at("b6", "one"));
F(PF.M.qkroom(at("b6", "one"), "quake", s0("b7"), {"amp": 14}), at("b6", "one"));
F(PF.M.qkhero(at("b6", "drop"), "drop", s0("b7"), {}), at("b6", "drop"));

// ===== : Two. Get under a sturdy table and cover your head and neck.
F("body", T.b7 + 0.1);
F(PF.M.qkroom((s0("b7") + 0.0), "quake", s0("b8"), {"amp": 12}), (s0("b7") + 0.0));
F(PF.M.step(at("b7", "two"), 2, s0("b8"), {"text": "COVER", "y": 112}), at("b7", "two"));
F(PF.M.qkhero(at("b7", "under"), "under", s0("b8"), {}), at("b7", "under"));
F(PF.M.qkroom(at("b7", "table"), "zoom", s0("b8"), {}), at("b7", "table"));
F(PF.M.qkhero(at("b7", "cover"), "cover", s0("b8"), {}), at("b7", "cover"));
F(PF.M.qkroom(at("b7", "head"), "vase", s0("b8"), {}), at("b7", "head"));

// ===== : Three. Hold on until the shaking stops.
F("body", T.b8 + 0.1);
F(PF.M.qkroom((s0("b8") + 0.0), "zoom", s0("end"), {"dur": 0.01}), (s0("b8") + 0.0));
F(PF.M.qkroom((s0("b8") + 0.0), "quake", s0("end"), {"amp": 12, "dur": 2.3}), (s0("b8") + 0.0));
F(PF.M.step(at("b8", "three"), 3, s0("end"), {"text": "HOLD ON", "y": 112}), at("b8", "three"));
F(PF.M.qkhero(at("b8", "hold"), "hold", s0("end"), {}), at("b8", "hold"));
F(PF.M.qkroom(at("b8", "until"), "slide", s0("end"), {}), at("b8", "until"));
F(PF.M.qkroom(at("b8", "stops"), "still", s0("end"), {}), at("b8", "stops"));

// ===== KONIEC: Next shake, you're under the table, not in the doorway.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "next"), "step,face", T.tot, {}), at("end", "next"));
F(PF.M.qkroom(at("end", "next"), "zoom", T.tot, {"s": 1.0, "x": 600, "y": 960, "dur": 0.35}), at("end", "next"));
F(PF.M.qkroom(at("end", "shake"), "jolt", T.tot, {}), at("end", "shake"));
F(PF.M.qkroom(at("end", "doorway"), "doorx", T.tot, {}), at("end", "doorway"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
env.metric("–", tc + 0.15);
