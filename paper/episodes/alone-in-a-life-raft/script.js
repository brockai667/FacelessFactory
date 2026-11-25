// AUTO z compose.py: Alone In A Life Raft  (env field, kit stamp/circle/full/dynamic)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; }, TT = PF.VO.total, R = PF.R, F = R.focus;
var env = PF.envField({ scene: "meadow" });
env.show(true, 0);
var hero = PF.charBiped({"id": "hero", "look": "clothed", "outfit": "suit", "hairStyle": "cap", "hair": "#4a3226", "suit": "#2f4e7a", "suitDark": "#233b5e", "patch": "#f6c343", "pants": "#34466a", "pantsDark": "#26344f", "boots": "#3a3f4a", "armL": 18, "armR": -18, "skin": "#e3ae82", "skinDark": "#c68b5e", "blush": "#e98f86", "capColor": "#f4efe6"});
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
R.camSet("wide", 0); R.camHold(0.3);
PF.tl.fromTo("#hookIn", { scale: 1.55 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, 0);
R.setFace(0, "worried", 0); hero.look(0, 0, 0, 0);

PF.M.rfsea((s0("hook") + 0.0), null, T.b1, {});
R.look((s0("hook") + 0.0), "left");
PF.M.rfsea((s0("hook") + 0.2), "sink", T.b1, {"dur": 2.2});
PF.M.rfsea(at("hook", "gone"), "rock", T.b1, {});
PF.M.rfsea(at("hook", "raft"), "rock", T.b1, {});
PF.O("#hook", 1, 0, T.b1 - 0.25, 0.22);

// ===== : One sailor lived through exactly this, so guess how many days he lasted.
F("body", T.b1 + 0.1);
F(PF.M.rfwide(at("b1", "one"), null, s0("b2"), {"dur": 1.4}), at("b1", "one"));
F(PF.M.rfwide(at("b1", "exactly"), "days", s0("b2"), {}), at("b1", "exactly"));
F(PF.M.rfwide(at("b1", "so"), "off", s0("b2"), {}), at("b1", "so"));
F(R.look(at("b1", "so"), "cam"), at("b1", "so"));
F(PF.M.rfdays(at("b1", "guess"), "guess", s0("b2"), {}), at("b1", "guess"));

// ===== : Seventy six days, in a raft about six feet long.
F("body", T.b2 + 0.1);
F(PF.M.rfdays(at("b2", "seventy"), 76, s0("b3"), {}), at("b2", "seventy"));
F(PF.M.rfraft(at("b2", "six", 1), "tape", s0("b3"), {}), at("b2", "six", 1));
hero.blink(T.b2 + 1.2); if (s0("b3") - T.b2 > 3.2) hero.blink(T.b2 + 2.9);

// ===== : He distilled drinking water and caught fish.
F("body", T.b3 + 0.1);
F(PF.M.clear(at("b3", "he"), "days,tape,look,face", s0("b4"), {}), at("b3", "he"));
F(PF.M.rfraft(at("b3", "distilled"), "still", s0("b4"), {}), at("b3", "distilled"));
F(PF.M.rfraft(at("b3", "water"), "drip", s0("b4"), {}), at("b3", "water"));
F(PF.M.rfraft(at("b3", "fish"), "fish", s0("b4"), {}), at("b3", "fish"));
hero.blink(T.b3 + 1.2); if (s0("b4") - T.b3 > 3.2) hero.blink(T.b3 + 2.9);

// ===== : Survival trainers say every drop of body water you save buys you time.
F("body", T.b4 + 0.1);
F(PF.M.clear(at("b4", "survival"), "still,fish,face", s0("b5"), {}), at("b4", "survival"));
F(PF.M.rfbody(at("b4", "trainers"), "show", s0("b5"), {}), at("b4", "trainers"));
F(PF.M.rfbody(at("b4", "drop"), "drop", s0("b5"), {}), at("b4", "drop"));
F(PF.M.rfbody(at("b4", "save"), "save", s0("b5"), {}), at("b4", "save"));
F(PF.M.rfbody(at("b4", "time"), "clock", s0("b5"), {}), at("b4", "time"));

// ===== : So put up the canopy, save your energy, and ration your sweat.
F("body", T.b5 + 0.1);
F(PF.M.clear(at("b5", "so"), "body,bclock", s0("b6"), {}), at("b5", "so"));
F(PF.M.step(at("b5", "put"), 1, s0("b6"), {"text": "PUT UP THE CANOPY", "y": 130, "size": 56}), at("b5", "put"));
F(PF.M.rfraft(at("b5", "canopy"), "canopy", s0("b6"), {}), at("b5", "canopy"));
F(PF.M.rfbody(at("b5", "energy"), "rest", s0("b6"), {}), at("b5", "energy"));
F(PF.M.rfbody(at("b5", "sweat"), "sweat", s0("b6"), {}), at("b5", "sweat"));

// ===== : Stream the sea anchor to stay near your last reported position.
F("body", T.b6 + 0.1);
F(PF.M.step(at("b6", "stream"), 2, s0("b7"), {"text": "STREAM THE SEA ANCHOR", "y": 130, "size": 56}), at("b6", "stream"));
F(PF.M.rfmap(at("b6", "stream"), null, s0("b7"), {"dur": 0.6}), at("b6", "stream"));
F(PF.M.clear(at("b6", "sea"), "canopy,rest,sweat", s0("b7"), {}), at("b6", "sea"));
F(PF.M.rfmap(at("b6", "anchor"), "anchor", s0("b7"), {}), at("b6", "anchor"));
F(PF.M.rfmap(at("b6", "stay"), "slow", s0("b7"), {}), at("b6", "stay"));
F(PF.M.rfmap(at("b6", "position"), "x", s0("b7"), {}), at("b6", "position"));

// ===== : Switch on your emergency beacon and leave it on.
F("body", T.b7 + 0.1);
F(PF.M.rfmap(at("b7", "switch"), "off", s0("b8"), {}), at("b7", "switch"));
F(PF.M.step(at("b7", "switch"), 3, s0("b8"), {"text": "TURN ON THE BEACON", "y": 130, "size": 56}), at("b7", "switch"));
F(PF.M.rfsignal(at("b7", "beacon"), "beacon", s0("b8"), {}), at("b7", "beacon"));
F(PF.M.rfsignal(at("b7", "leave"), "rings", s0("b8"), {}), at("b7", "leave"));

// ===== : Keep flashing a mirror at the horizon.
F("body", T.b8 + 0.1);
F(PF.M.step(at("b8", "keep"), 4, s0("end"), {"text": "SWEEP THE HORIZON", "y": 130, "size": 56}), at("b8", "keep"));
F(PF.M.rfsignal(at("b8", "flashing"), "mirror", s0("end"), {}), at("b8", "flashing"));
F(PF.M.rfsignal(at("b8", "horizon"), "ship", s0("end"), {}), at("b8", "horizon"));
hero.blink(T.b8 + 1.2); if (s0("end") - T.b8 > 3.2) hero.blink(T.b8 + 2.9);

// ===== KONIEC: Seventy six days, and it started just like this, alone in a raft.
F("body", T.end + 0.1);
F(PF.M.clear(at("end", "seventy"), "step,beacon,mirror,look,face", T.tot, {}), at("end", "seventy"));
F(PF.M.stamp(at("end", "seventy"), "76 DAYS", T.tot, {"y": 200}), at("end", "seventy"));
F(PF.M.rfsea(at("end", "started"), "back", T.tot, {}), at("end", "started"));
F(R.look(at("end", "alone"), "left"), at("end", "alone"));
F(PF.M.rfsea(at("end", "raft"), "rock", T.tot, {}), at("end", "raft"));

// ===== SLUCKA (plynuly navrat, ziadne zakrytie)
var tc = T.tot - 0.62;
PF.WORLD(true, tc); R.settle(tc, T.tot, { fast: true, day: false });
