// AUTO z compose.py: Pulling Nine G  (env room, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY", scene: "couch" });
document.getElementById("rm_gauges").style.display = "none";
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "suit", "hairStyle": "short", "hair": "#5a3b28", "suit": "#6b7a3f", "suitDark": "#525e2e", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 10, "armR": -6, "skin": "#f1c9a5", "skinDark": "#dca87f", "blush": "#f2a0a0"});
R.init({"face0": "smile", "arms0": [10, -6], "look0": [0, 0], "level0": 60, "accent": "#2a74b3", hero: hero, env: env });
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
T.b10 = s0("b10");

// ===== HOOK (prvy snimok = posledny)
PF.M.handheld();
R.camSet("wide", 0); R.camHold(0.3);
PF.tl.fromTo("#hookIn", { scale: 1.55 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, 0);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

PF.M.ngjet((s0("hook") + 0.0), null, T.b1, {});
PF.M.ngjet(at("hook", "pull"), "bank", T.b1, {});
PF.M.ngstrain(at("hook", "hard"), "grip", T.b1, {});
PF.M.ngmeter(at("hook", "turn"), 9.0, T.b1, {"dur": 1.45, "free": true});
PF.M.shake(at("hook", "fighter"), 8, T.b1, {});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : At nine G, your head weighs nine times as much.
F("body", T.b1 + 0.1);
F(PF.M.ngmeter(at("b1", "nine"), 9, s0("b2"), {"dur": 0.4}), at("b1", "nine"));
F(PF.M.ngjet(at("b1", "nine", 1), "heavy", s0("b2"), {}), at("b1", "nine", 1));
F(PF.M.shake(at("b1", "weighs"), 10, s0("b2"), {}), at("b1", "weighs"));

// ===== : The blood drains out of your head. Guess how long you'll be out.
F("body", T.b2 + 0.1);
F(PF.M.clear(at("b2", "the"), "heavy,strain,face", s0("b3"), {}), at("b2", "the"));
F(PF.M.ngblood(at("b2", "blood"), "show", s0("b3"), {}), at("b2", "blood"));
F(PF.M.ngblood(at("b2", "drains"), "drain", s0("b3"), {}), at("b2", "drains"));
F(PF.M.ngclock(at("b2", "guess"), "guess", s0("b3"), {}), at("b2", "guess"));
hero.blink(T.b2 + 1.2); if (s0("b3") - T.b2 > 3.2) hero.blink(T.b2 + 2.9);

// ===== : First the colors fade and the edges go gray.
F("body", T.b3 + 0.1);
F(PF.M.clear(at("b3", "first"), "blood,clock", s0("b4"), {}), at("b3", "first"));
F(PF.M.ngsight(at("b3", "colors"), "fade", s0("b4"), {}), at("b3", "colors"));
F(PF.M.ngsight(at("b3", "edges"), "edges", s0("b4"), {}), at("b3", "edges"));
F(R.look(at("b3", "gray"), "left"), at("b3", "gray"));

// ===== : Then everything goes black, but you're still awake.
F("body", T.b4 + 0.1);
F(PF.M.ngsight(at("b4", "everything"), "tunnel", s0("b5"), {}), at("b4", "everything"));
F(PF.M.ngsight(at("b4", "black"), "black", s0("b5"), {}), at("b4", "black"));
F(PF.M.ngsight(at("b4", "awake"), "awake", s0("b5"), {}), at("b4", "awake"));

// ===== : Then the lights go out. Lock in your guess.
F("body", T.b5 + 0.1);
F(PF.M.ngsight(at("b5", "out"), "out", s0("b6"), {}), at("b5", "out"));
F(PF.M.ngclock(at("b5", "lock"), "guess", s0("b6"), {"label": "LOCK IN YOUR GUESS"}), at("b5", "lock"));

// ===== : About twelve seconds out cold. Then roughly fifteen more, confused.
F("body", T.b6 + 0.1);
F(PF.M.ngclock(at("b6", "about"), 12, s0("b7"), {"dur": 0.55}), at("b6", "about"));
F(PF.M.stamp(at("b6", "out"), "OUT COLD", s0("b7"), {"y": 250}), at("b6", "out"));
F(PF.M.ngsight(at("b6", "fifteen"), "confused", s0("b7"), {}), at("b6", "fifteen"));
F(PF.M.ngclock(at("b6", "fifteen"), "confused", s0("b7"), {}), at("b6", "fifteen"));

// ===== : Back to the start of the turn. Pilots fight back.
F("body", T.b7 + 0.1);
F(PF.M.clear(at("b7", "back"), "clock,vision,look,face", s0("b8"), {}), at("b7", "back"));
F(PF.M.rewind(at("b7", "back"), null, s0("b8"), {"y": 290}), at("b7", "back"));
F(PF.M.ngmeter(at("b7", "back"), "reset", s0("b8"), {}), at("b7", "back"));
F(PF.M.ngjet(at("b7", "back"), "level", s0("b8"), {}), at("b7", "back"));
F(PF.M.ngjet(at("b7", "turn"), "bank", s0("b8"), {}), at("b7", "turn"));
F(PF.M.ngstrain(at("b7", "fight"), "grip", s0("b8"), {}), at("b7", "fight"));

// ===== : One. Squeeze your legs and stomach hard.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "one"), 1, s0("b9"), {"text": "SQUEEZE HARD", "y": 130, "size": 56}), at("b8", "one"));
F(PF.M.ngmeter(at("b8", "one"), 9, s0("b9"), {"dur": 0.6}), at("b8", "one"));
F(PF.M.ngblood(at("b8", "squeeze"), "show", s0("b9"), {"level": 1000}), at("b8", "squeeze"));
F(PF.M.ngstrain(at("b8", "squeeze"), "squeeze", s0("b9"), {}), at("b8", "squeeze"));
F(PF.M.ngblood(at("b8", "hard"), "nudge", s0("b9"), {"level": 820}), at("b8", "hard"));

// ===== : Two. Breathe in short, forced bursts.
F("body", T.b9 + 0.1);
F(PF.M.step(at("b9", "two"), 2, s0("b10"), {"text": "SHORT BREATHS", "y": 130, "size": 56}), at("b9", "two"));
F(PF.M.ngstrain(at("b9", "short"), "breathe", s0("b10"), {}), at("b9", "short"));
F(PF.M.ngblood(at("b9", "bursts"), "nudge", s0("b10"), {"level": 700}), at("b9", "bursts"));

// ===== : Three. Your G suit squeezes your legs tight.
F("body", T.b10 + 0.1);
F(PF.M.step(at("b10", "three"), 3, s0("end"), {"text": "G SUIT", "y": 130, "size": 56}), at("b10", "three"));
F(PF.M.ngstrain(at("b10", "squeezes"), "suit", s0("end"), {}), at("b10", "squeezes"));
F(PF.M.ngblood(at("b10", "tight"), "full", s0("end"), {}), at("b10", "tight"));

// ===== KONIEC: Pull the turn again, and this time keep the lights on.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "pull"), "step,blood,strain,face,look", T.tot, {}), at("end", "pull"));
F(PF.M.ngmeter(at("end", "pull"), "reset", T.tot, {}), at("end", "pull"));
F(PF.M.ngjet(at("end", "pull"), "level", T.tot, {}), at("end", "pull"));
F(PF.M.ngjet(at("end", "turn"), "bank", T.tot, {}), at("end", "turn"));
F(PF.M.ngmeter(at("end", "again"), 9, T.tot, {"dur": 0.6}), at("end", "again"));
F(R.wave(at("end", "and")), at("end", "and"));
F(PF.M.ngsight(at("end", "lights"), "pop", T.tot, {}), at("end", "lights"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
env.metric("–", tc + 0.15);
