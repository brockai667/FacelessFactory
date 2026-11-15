// AUTO z compose.py: Falling Elevator  (env room, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envRoom({ calLabel: "DAY", scene: "couch" });
document.getElementById("rm_gauges").style.display = "none";
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "suit", "hairStyle": "short", "hair": "#4a3226", "suit": "#3b4a6b", "suitDark": "#2c3852", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#7f5033", "skinDark": "#653d24", "blush": "#c0626a", "glasses": true});
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

// ===== HOOK (prvy snimok = posledny)
PF.M.handheld();
R.camSet("wide", 0); R.camHold(0.3);
PF.tl.fromTo("#hookIn", { scale: 1.55 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, 0);
R.setFace(0, "shocked", 0); hero.look(0, 0, 0, 0);

PF.M.lift((s0("hook") + 0.0), null, T.b1, {});
R.look(at("hook", "cable"), "up");
PF.M.lift(at("hook", "snapped"), "snap", T.b1, {});
R.look(at("hook", "dropping"), "down");
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : You plan to jump. But your best jump is about seven miles an hour.
F("body", T.b1 + 0.1);
F(PF.M.jump(at("b1", "jump"), "crouch", s0("b2"), {}), at("b1", "jump"));
F(R.look(at("b1", "but"), "cam"), at("b1", "but"));
F(PF.M.jump(at("b1", "best"), "hop", s0("b2"), {}), at("b1", "best"));
F(PF.M.jump(at("b1", "seven"), "tag", s0("b2"), {"text": "7 MPH"}), at("b1", "seven"));

// ===== : From one hundred sixty five feet, you hit at seventy two miles an hour.
F("body", T.b2 + 0.1);
F(PF.M.ruler(at("b2", "from"), null, s0("b3"), {"dur": 2.0}), at("b2", "from"));
F(PF.M.dial(at("b2", "sixty"), 72, s0("b3"), {"dur": 1.8}), at("b2", "sixty"));
F(PF.M.lift(at("b2", "hit"), "hit", s0("b3"), {}), at("b2", "hit"));

// ===== : Jump perfectly. Guess your new speed.
F("body", T.b3 + 0.1);
F(PF.M.lift((s0("b3") + 0.0), "fall", s0("b4"), {}), (s0("b3") + 0.0));
F(PF.M.jump(at("b3", "jump"), "up", s0("b4"), {}), at("b3", "jump"));
F(PF.M.lift(at("b3", "perfectly"), "freeze", s0("b4"), {}), at("b3", "perfectly"));
F(PF.M.dial(at("b3", "guess"), "guess", s0("b4"), {}), at("b3", "guess"));

// ===== : Sixty five. Barely better, and you can't time it.
F("body", T.b4 + 0.1);
F(PF.M.lift(at("b4", "sixty"), "go", s0("b5"), {}), at("b4", "sixty"));
F(PF.M.dial(at("b4", "sixty"), 65, s0("b5"), {"ghost": true, "dur": 0.4}), at("b4", "sixty"));
F(PF.M.lift(at("b4", "five"), "hit", s0("b5"), {}), at("b4", "five"));
F(PF.M.dial(at("b4", "barely"), "barely", s0("b5"), {}), at("b4", "barely"));
F(PF.M.jump(at("b4", "barely"), "shrug", s0("b5"), {}), at("b4", "barely"));
F(PF.M.jump(at("b4", "you"), "when", s0("b5"), {"hold": 1.1}), at("b4", "you"));

// ===== : Back up the shaft. Elevators hang on several steel ropes.
F("body", T.b5 + 0.1);
F(PF.M.clear((s0("b5") + 0.0), "dial,jump,lift,look", s0("b6"), {}), (s0("b5") + 0.0));
F(PF.M.rig(at("b5", "back"), null, s0("b6"), {}), at("b5", "back"));
F(PF.M.rig(at("b5", "elevators"), "sway", s0("b6"), {}), at("b5", "elevators"));
F(PF.M.rig(at("b5", "hang"), "ropes", s0("b6"), {}), at("b5", "hang"));

// ===== : Plus automatic brakes built to stop a fall.
F("body", T.b6 + 0.1);
F(PF.M.rig(at("b6", "plus"), "cut", s0("b7"), {}), at("b6", "plus"));
F(PF.M.rig(at("b6", "brakes"), "brake", s0("b7"), {}), at("b6", "brakes"));
F(PF.M.rig(at("b6", "stop"), "stop", s0("b7"), {}), at("b6", "stop"));

// ===== : Betty Lou Oliver fell seventy five floors in the Empire State Building.
F("body", T.b7 + 0.1);
F(PF.M.tower(at("b7", "betty"), null, s0("b8"), {}), at("b7", "betty"));
F(PF.M.clear(at("b7", "lou"), "rig", s0("b8"), {}), at("b7", "lou"));
F(PF.M.tower(at("b7", "seventy"), "floors", s0("b8"), {"dur": 2.0}), at("b7", "seventy"));

// ===== : Trapped air and coiled cables cushioned her. She broke her back, but lived.
F("body", T.b8 + 0.1);
F(PF.M.tower((s0("b8") + 0.05), "pit", s0("end"), {}), (s0("b8") + 0.05));
F(PF.M.tower(at("b8", "air"), "air", s0("end"), {}), at("b8", "air"));
F(PF.M.tower(at("b8", "cables"), "coil", s0("end"), {}), at("b8", "cables"));
F(PF.M.tower(at("b8", "broke"), "back", s0("end"), {}), at("b8", "broke"));
F(PF.M.tower(at("b8", "lived"), "lived", s0("end"), {}), at("b8", "lived"));
F(PF.M.stamp(at("b8", "lived"), "SURVIVED", s0("end"), {"y": 200}), at("b8", "lived"));

// ===== KONIEC: When the cable snaps, forget the jump. Remember Betty.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "when"), "tower,face", T.tot, {}), at("end", "when"));
F(PF.M.lift(at("end", "snaps"), "snap", T.tot, {}), at("end", "snaps"));
F(PF.M.memo(at("end", "forget"), "nojump", T.tot, {}), at("end", "forget"));
F(PF.M.memo(at("end", "remember"), "betty", T.tot, {}), at("end", "remember"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
env.metric("–", tc + 0.15);
