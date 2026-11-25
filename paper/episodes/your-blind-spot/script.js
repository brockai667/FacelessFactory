// AUTO z compose.py: The Hole In Your Vision  (env room, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY", scene: "bed" });
document.getElementById("rm_gauges").style.display = "none";
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "pajamas", "hairStyle": "curly", "hair": "#b4532a", "suit": "#8a52c4", "suitDark": "#6a3b9c", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "smile", "arms0": [18, -18], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
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
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

PF.M.bshole(at("hook", "hole"), "peek", T.b1, {});
hero.blink(0.2 + 1.2); if (T.b1 - 0.2 > 3.2) hero.blink(0.2 + 2.9);
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : Let's find it, so close your left eye.
F("body", T.b1 + 0.1);
F(PF.M.bseye(at("b1", "close"), "close", s0("b2"), {}), at("b1", "close"));
F(PF.M.bseye(at("b1", "left"), "card", s0("b2"), {}), at("b1", "left"));

// ===== : With your right eye, stare at the cross on the left.
F("body", T.b2 + 0.1);
F(PF.M.bstest((s0("b2") + 0.0), "show", s0("b3"), {}), (s0("b2") + 0.0));
F(PF.M.bstest(at("b2", "stare"), "stare", s0("b3"), {}), at("b2", "stare"));
F(PF.M.bstest(at("b2", "cross"), "cross", s0("b3"), {}), at("b2", "cross"));
hero.blink(T.b2 + 1.2); if (s0("b3") - T.b2 > 3.2) hero.blink(T.b2 + 2.9);

// ===== : Now slowly bring your phone closer, then back.
F("body", T.b3 + 0.1);
F(PF.M.bstest(at("b3", "slowly"), "phone", s0("b4"), {"until": "b5"}), at("b3", "slowly"));
hero.blink(T.b3 + 1.2); if (s0("b4") - T.b3 > 3.2) hero.blink(T.b3 + 2.9);

// ===== : At one spot, the red dot on the right simply vanishes.
F("body", T.b4 + 0.1);
F(PF.M.bstest(at("b4", "vanishes"), "gone", s0("b5"), {}), at("b4", "vanishes"));
hero.blink(T.b4 + 1.2); if (s0("b5") - T.b4 > 3.2) hero.blink(T.b4 + 2.9);

// ===== : That's your blind spot, where your optic nerve leaves the eye.
F("body", T.b5 + 0.1);
F(PF.M.bsball((s0("b5") + 0.0), "show", s0("b6"), {}), (s0("b5") + 0.0));
F(PF.M.bsball(at("b5", "blind"), "blind", s0("b6"), {}), at("b5", "blind"));
F(PF.M.bsball(at("b5", "nerve"), "nerve", s0("b6"), {}), at("b5", "nerve"));
hero.blink(T.b5 + 1.2); if (s0("b6") - T.b5 > 3.2) hero.blink(T.b5 + 2.9);

// ===== : About one point two million nerve fibers exit there, with zero light sensors.
F("body", T.b6 + 0.1);
F(PF.M.bsball((s0("b6") + 0.0), "zoom", s0("b7"), {}), (s0("b6") + 0.0));
F(PF.M.bsball(at("b6", "one"), "count", s0("b7"), {"dur": 1.0}), at("b6", "one"));
F(PF.M.bsball(at("b6", "zero"), "zero", s0("b7"), {}), at("b6", "zero"));
hero.blink(T.b6 + 1.2); if (s0("b7") - T.b6 > 3.2) hero.blink(T.b6 + 2.9);

// ===== : The gap could hide more than ten full moons.
F("body", T.b7 + 0.1);
F(PF.M.bssky((s0("b7") + 0.0), "show", s0("b8"), {}), (s0("b7") + 0.0));
F(PF.M.bssky(at("b7", "hide"), "moons", s0("b8"), {}), at("b7", "hide"));
F(PF.M.bssky(at("b7", "ten"), "card", s0("b8"), {}), at("b7", "ten"));
hero.blink(T.b7 + 1.2); if (s0("b8") - T.b7 > 3.2) hero.blink(T.b7 + 2.9);

// ===== : You never notice because your brain paints over it with whatever is around.
F("body", T.b8 + 0.1);
F(PF.M.bssky((s0("b8") + 0.0), "hole", s0("end"), {}), (s0("b8") + 0.0));
F(PF.M.bssky(at("b8", "brain"), "brain", s0("end"), {}), at("b8", "brain"));
F(PF.M.bssky(at("b8", "paints"), "paint", s0("end"), {"dur": 1.6}), at("b8", "paints"));
F(PF.M.bssky(at("b8", "around"), "done", s0("end"), {}), at("b8", "around"));
hero.blink(T.b8 + 1.2); if (s0("end") - T.b8 > 3.2) hero.blink(T.b8 + 2.9);

// ===== KONIEC: There's a hole in your vision right now, and your brain hides it.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "theres"), "bssky,bsball,bstest,bseye,face,look", T.tot, {}), at("end", "theres"));
F(PF.M.bshole(at("end", "hole"), "show", T.tot, {}), at("end", "hole"));
F(PF.M.bshole(at("end", "brain"), "brain", T.tot, {}), at("end", "brain"));
F(PF.M.bshole(at("end", "hides"), "hide", T.tot, {}), at("end", "hides"));
hero.blink(T.end + 1.2); if (T.tot - T.end > 3.2) hero.blink(T.end + 2.9);

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
env.metric("–", tc + 0.15);
