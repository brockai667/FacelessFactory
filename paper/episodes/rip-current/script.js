// AUTO z compose.py: Caught In A Rip Current  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "meadow" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "bun", "hair": "#4a3226", "suit": "#e2475b", "suitDark": "#b8344a", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a"});
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

PF.M.sea((s0("hook") + 0.0), null, T.b1, {});
PF.M.sea(at("hook", "pulling"), "flow", T.b1, {"hold": 1.6});
PF.M.swim(at("hook", "first"), null, T.b1, {"dur": 0.6});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : The beach shrinks, even though you're swimming hard toward it.
F("body", T.b1 + 0.1);
F(PF.M.swim((s0("b1") + 0.0), null, s0("b2"), {}), (s0("b1") + 0.0));
F(R.look(at("b1", "beach"), "left"), at("b1", "beach"));
F(PF.M.sea(at("b1", "shrinks"), "shrink", s0("b2"), {}), at("b1", "shrinks"));
F(R.sweat(at("b1", "hard")), at("b1", "hard"));

// ===== : A rip current flows out at up to eight feet per second.
F("body", T.b2 + 0.1);
F(PF.M.ripmap((s0("b2") + 0.0), null, s0("b3"), {"y0": 720, "y1": 960}), (s0("b2") + 0.0));
F(PF.M.ripmap(at("b2", "eight"), "speed", s0("b3"), {}), at("b2", "eight"));
hero.blink(T.b2 + 1.2); if (s0("b3") - T.b2 > 3.2) hero.blink(T.b2 + 2.9);

// ===== : That's faster than an Olympic swimmer.
F("body", T.b3 + 0.1);
F(PF.M.ripmap(at("b3", "thats"), "race", s0("b4"), {}), at("b3", "thats"));
hero.blink(T.b3 + 1.2); if (s0("b4") - T.b3 > 3.2) hero.blink(T.b3 + 2.9);

// ===== : Fighting it wears out even strong swimmers. That's how people drown.
F("body", T.b4 + 0.1);
F(PF.M.ripmap((s0("b4") + 0.0), "off", s0("b5"), {}), (s0("b4") + 0.0));
F(PF.M.energy((s0("b4") + 0.15), 1, s0("b5"), {}), (s0("b4") + 0.15));
F(PF.M.swim(at("b4", "fighting"), "tired", s0("b5"), {}), at("b4", "fighting"));
F(PF.M.energy(at("b4", "wears"), 0.2, s0("b5"), {"dur": 1.4}), at("b4", "wears"));
F(PF.M.energy(at("b4", "drown"), 0, s0("b5"), {"dur": 0.5, "blink": true}), at("b4", "drown"));
F(R.face(at("b4", "drown"), "worried"), at("b4", "drown"));

// ===== : Here's the twist. It pulls you out, not under.
F("body", T.b5 + 0.1);
F(PF.M.clear((s0("b5") + 0.0), "energy,look", s0("b6"), {}), (s0("b5") + 0.0));
F(PF.M.sea(at("b5", "twist"), "flow", s0("b6"), {"hold": 2.2}), at("b5", "twist"));
F(PF.M.swim(at("b5", "pulls"), "drift", s0("b6"), {}), at("b5", "pulls"));
F(PF.M.sea(at("b5", "pulls"), "under", s0("b6"), {"dx": 140, "xdelay": 0.88, "hold": 1.9}), at("b5", "pulls"));
F(PF.M.stamp(at("b5", "under"), "OUT,|NOT UNDER", s0("b6"), {"y": 170, "size": 80, "rot": -5}), at("b5", "under"));

// ===== : One. Float. Let it carry you and save your energy.
F("body", T.b6 + 0.1);
F(PF.M.step(at("b6", "one"), 1, s0("b7"), {"text": "FLOAT", "y": 130}), at("b6", "one"));
F(PF.M.swim(at("b6", "float"), "float", s0("b7"), {"drift": 40}), at("b6", "float"));
F(PF.M.energy(at("b6", "carry"), 0.12, s0("b7"), {"dur": 0.4}), at("b6", "carry"));
F(PF.M.energy(at("b6", "save"), 0.5, s0("b7"), {"dur": 0.9, "flash": true}), at("b6", "save"));

// ===== : Two. Swim sideways, along the beach, until it lets go.
F("body", T.b7 + 0.1);
F(PF.M.clear((s0("b7") + 0.0), "energy", s0("b8"), {}), (s0("b7") + 0.0));
F(PF.M.ripmap((s0("b7") + 0.0), null, s0("b8"), {"y0": 800, "y1": 800}), (s0("b7") + 0.0));
F(PF.M.step(at("b7", "two"), 2, s0("b8"), {"text": "SWIM SIDEWAYS", "y": 130}), at("b7", "two"));
F(PF.M.ripmap(at("b7", "swim"), "side", s0("b8"), {"dur": 2.4}), at("b7", "swim"));
F(PF.M.ripmap(at("b7", "lets"), "free", s0("b8"), {}), at("b7", "lets"));
hero.blink(T.b7 + 1.2); if (s0("b8") - T.b7 > 3.2) hero.blink(T.b7 + 2.9);

// ===== : Three. Still stuck? Float and wave so a lifeguard sees you.
F("body", T.b8 + 0.1);
F(PF.M.ripmap((s0("b8") + 0.0), "off", s0("end"), {}), (s0("b8") + 0.0));
F(PF.M.step(at("b8", "three"), 3, s0("end"), {"text": "FLOAT + WAVE", "y": 130}), at("b8", "three"));
F(R.look(at("b8", "stuck"), "left"), at("b8", "stuck"));
F(PF.M.lifeguard(at("b8", "float"), null, s0("end"), {}), at("b8", "float"));
F(PF.M.swim(at("b8", "wave"), "wave", s0("end"), {}), at("b8", "wave"));
F(PF.M.lifeguard(at("b8", "sees"), "blow", s0("end"), {}), at("b8", "sees"));

// ===== KONIEC: Still swimming straight back? Float first, then save this.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "still"), "tower,step,swim", T.tot, {}), at("end", "still"));
F(PF.M.swim(at("end", "swimming"), null, T.tot, {"dur": 0.6}), at("end", "swimming"));
F(PF.M.swim(at("end", "back"), "freeze", T.tot, {}), at("end", "back"));
F(PF.M.swim(at("end", "float"), "lean", T.tot, {}), at("end", "float"));
F(PF.M.card(at("end", "save"), "SAVE THIS", T.tot, {"text": ["1 FLOAT", "2 SWIM SIDEWAYS", "3 FLOAT & WAVE"], "size": 76, "y": 1080}), at("end", "save"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
