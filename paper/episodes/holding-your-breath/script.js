// AUTO z compose.py: Holding Your Breath  (env room, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY", scene: "couch" });
document.getElementById("rm_gauges").style.display = "none";
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "tshirt", "hairStyle": "spiky", "hair": "#4a3226", "suit": "#2f9e8f", "suitDark": "#237a6e", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#e3ae82", "skinDark": "#c68b5e", "blush": "#e98f86"});
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
T.b9 = s0("b9");

// ===== HOOK (prvy snimok = posledny)
PF.M.handheld();
R.camSet("wide", 0); PF.CAM(1.05, 560, 920, 0, T.b1 - 0.05, "sine.inOut"); R.camHold(T.b1 - 0.05);
R.setFace(0, "smile", 0); hero.look(0, 0, 0, 0);

PF.M.breath(at("hook", "holding"), "hold", T.b1, {"ring": false});
PF.M.burn(at("hook", "burn"), null, T.b1, {"face": false});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : Sitting on dry land? Hold your breath with me. Ten seconds.
F("body", T.b1 + 0.1);
F(PF.M.breath((s0("b1") + 0.0), "out", s0("b2"), {}), (s0("b1") + 0.0));
F(PF.M.breath(at("b1", "hold"), "hold", s0("b2"), {}), at("b1", "hold"));

// ===== : Feel the pressure in your chest?
F("body", T.b2 + 0.1);
F(PF.M.gauge(at("b2", "pressure"), null, s0("b3"), {}), at("b2", "pressure"));

// ===== : Feels like you're out of oxygen, right?
F("body", T.b3 + 0.1);
F(PF.M.o2(at("b3", "feels"), "doubt", s0("b4"), {}), at("b3", "feels"));
hero.blink(T.b3 + 1.2); if (s0("b4") - T.b3 > 3.2) hero.blink(T.b3 + 2.9);

// ===== : You're not. Carbon dioxide is piling up and setting off the alarm.
F("body", T.b4 + 0.1);
F(PF.M.o2(at("b4", "not"), "full", s0("b5"), {}), at("b4", "not"));
F(PF.M.co2(at("b4", "carbon"), "pile", s0("b5"), {}), at("b4", "carbon"));
F(PF.M.alarm(at("b4", "setting"), "ring", s0("b5"), {}), at("b4", "setting"));

// ===== : Ten. Breathe.
F("body", T.b5 + 0.1);
F(PF.M.breath(at("b5", "ten"), "zero", s0("b6"), {}), at("b5", "ten"));
F(PF.M.breath(at("b5", "breathe"), "out", s0("b6"), {}), at("b5", "breathe"));

// ===== : In one study, untrained people quit after about a minute, still near ninety two percent oxygen.
F("body", T.b6 + 0.1);
F(PF.M.timer(at("b6", "untrained"), 1, s0("b7"), {"label": "MOST QUIT AT", "dur": 1.7}), at("b6", "untrained"));
F(R.look(at("b6", "still"), "left"), at("b6", "still"));
F(PF.M.o2(at("b6", "ninety"), "pct", s0("b7"), {}), at("b6", "ninety"));
hero.blink(T.b6 + 1.2); if (s0("b7") - T.b6 > 3.2) hero.blink(T.b6 + 2.9);

// ===== : One. Keep it short. Ten seconds is plenty.
F("body", T.b7 + 0.1);
F(PF.M.clear((s0("b7") + 0.0), "timer,o2,look", s0("b8"), {}), (s0("b7") + 0.0));
F(PF.M.step(at("b7", "one"), 1, s0("b8"), {"text": "KEEP IT SHORT", "y": 112}), at("b7", "one"));
F(PF.M.breath(at("b7", "keep"), "badge", s0("b8"), {}), at("b7", "keep"));

// ===== : Two. Never breathe fast and deep first. It hides the alarm.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "two"), 2, s0("b9"), {"text": "NO FAST BREATHING", "y": 112, "size": 64}), at("b8", "two"));
F(PF.M.pant(at("b8", "never"), null, s0("b9"), {"hold": 1.9}), at("b8", "never"));
F(PF.M.alarm(at("b8", "hides"), "sock", s0("b9"), {}), at("b8", "hides"));

// ===== : Three. Never do it in water. Blackouts there come without warning.
F("body", T.b9 + 0.1);
F(PF.M.clear((s0("b9") + 0.0), "alarm,face", s0("end"), {}), (s0("b9") + 0.0));
F(PF.M.step(at("b9", "three"), 3, s0("end"), {"text": "NOT IN WATER", "y": 112}), at("b9", "three"));
F(PF.M.water(at("b9", "never"), null, s0("end"), {}), at("b9", "never"));
F(PF.M.water(at("b9", "water"), "x", s0("end"), {}), at("b9", "water"));
F(PF.M.water(at("b9", "blackouts"), "dark", s0("end"), {}), at("b9", "blackouts"));

// ===== KONIEC: So that burn you felt? Carbon dioxide, not missing oxygen.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "so"), "water,step", T.tot, {}), at("end", "so"));
F(PF.M.burn(at("end", "burn"), null, T.tot, {}), at("end", "burn"));
F(PF.M.co2(at("end", "carbon"), "glow", T.tot, {}), at("end", "carbon"));
F(PF.M.o2(at("end", "not"), "full", T.tot, {}), at("end", "not"));
F(PF.M.o2(at("end", "oxygen"), "check", T.tot, {}), at("end", "oxygen"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
env.metric("–", tc + 0.15);
