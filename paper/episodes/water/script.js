// EPIZODA: What happens if you stop drinking water?  (sklenena postavicka v izbe, DAY 1-6, koniec = zaciatok)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; };
var T = { d1: s0("d1"), d2: s0("d2"), d2b: s0("d2b"), d3: s0("d3"), d4: s0("d4"), d4b: s0("d4b"), d5: s0("d5"), d6: s0("d6"), end: s0("end"), total: PF.VO.total };
var pd = at("d1", "pounding"), THROB = [pd - 0.02, pd + 0.28, pd + 0.58], BEATS = [];
for (var n = 0; n < 20; n++) { var b = T.d2b + 0.08 + n * 0.5; if (b < PF.seg("d2b")[1] - 0.2) BEATS.push(b); }
var room = PF.envRoom({});
var hero = PF.charBiped({ id: "hero", look: "glass", props: ["cup", "fan"], armL: 150, level: 60 });
PF.fx.dust(26, 314); PF.fx.leaves();
var kid = PF.panelKidneys(2), blood = PF.panelBlood(3), heart = PF.panelHeart(4), brainP = PF.panelBrain(5);
// rekvizity len pre tuto epizodu: fata morgana, iskry, ruka s dzbanom, odznak 60 %
PF.add("M",
  '<g transform="translate(0 -60)"><g id="mirage" opacity="0"><g id="mirBob"><circle cx="870" cy="760" r="175" fill="url(#gMir)"/>' +
  '<path d="M800 640 L940 640 L926 880 L814 880 Z" fill="#e8f7fd" fill-opacity="0.75" stroke="#ffffff" stroke-width="7"/>' +
  '<path d="M806 712 L934 712 L926 880 L814 880 Z" fill="url(#gWater)" fill-opacity="0.85"/><path d="M806 712 q16 -8 32 0 t32 0 t32 0 t32 0" fill="none" stroke="#bfe8fb" stroke-width="5"/>' +
  '<path d="M822 660 L818 860" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.9"/>' +
  '<g fill="#ffffff"><path d="M760 640 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 z"/><path d="M970 700 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5 z"/><path d="M950 880 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5 z"/></g></g></g>' +
  '<g id="burst" opacity="0" fill="#ffffff" stroke="#8fd3f5" stroke-width="3"><path d="M870 600 l7 18 l18 7 l-18 7 l-7 18 l-7 -18 l-18 -7 l18 -7 z"/><path d="M1000 690 l6 15 l15 6 l-15 6 l-6 15 l-6 -15 l-15 -6 l15 -6 z"/>' +
  '<path d="M1010 840 l7 18 l18 7 l-18 7 l-7 18 l-7 -18 l-18 -7 l18 -7 z"/><path d="M880 930 l6 15 l15 6 l-15 6 l-6 15 l-6 -15 l-15 -6 l15 -6 z"/>' +
  '<path d="M740 860 l7 18 l18 7 l-18 7 l-7 18 l-7 -18 l-18 -7 l18 -7 z"/><path d="M730 690 l6 15 l15 6 l-15 6 l-6 15 l-6 -15 l-15 -6 l15 -6 z"/>' +
  '<circle cx="930" cy="640" r="9"/><circle cx="800" cy="930" r="8"/><circle cx="1030" cy="770" r="7"/></g>' +
  '<path id="stream" d="M583 924 Q 562 990 548 1056" fill="none" stroke="#4aa6e0" stroke-width="16" stroke-linecap="round" opacity="0"/>' +
  '<g id="splash" opacity="0" fill="#8fd3f5" stroke="#ffffff" stroke-width="3"><circle cx="522" cy="1046" r="7"/><circle cx="574" cy="1040" r="6"/><circle cx="536" cy="1030" r="5"/><circle cx="562" cy="1026" r="5"/></g>' +
  '<g id="helper"><rect x="760" y="886" width="520" height="92" rx="42" fill="#6fa8d6" stroke="#ffffff" stroke-width="5"/><rect x="752" y="880" width="62" height="104" rx="22" fill="#f3efe6"/>' +
  '<g id="jug"><path d="M640 870 L720 870 C 736 900 742 960 730 1000 L630 1000 C 618 960 624 900 640 870 Z" fill="#e3edf2" stroke="#7f9aab" stroke-width="5"/>' +
  '<path d="M646 884 C 638 920 638 960 644 988" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.8"/>' +
  '<path d="M640 870 L612 856 L646 884 Z" fill="#e3edf2" stroke="#7f9aab" stroke-width="4" stroke-linejoin="round"/>' +
  '<path d="M628 930 L734 930 L732 962 L626 962 Z" fill="#5ab3e6" opacity="0.85"/>' +
  '<path d="M728 900 q34 6 30 44 q-4 32 -30 34" fill="none" stroke="#7f9aab" stroke-width="16" stroke-linecap="round"/><path d="M728 900 q34 6 30 44 q-4 32 -30 34" fill="none" stroke="#e3edf2" stroke-width="9" stroke-linecap="round"/></g>' +
  '<ellipse cx="748" cy="930" rx="38" ry="46" fill="#f1c9a5" stroke="#ffffff" stroke-width="5"/></g></g>' +
  '<g id="badge" opacity="0" filter="url(#cut)"><circle cx="180" cy="960" r="95" fill="#fbf5ea" stroke="#3d97d3" stroke-width="8"/>' +
  '<text x="180" y="962" style="font-family:Pop;font-weight:600;font-size:66px;fill:#2f7fc1;text-anchor:middle">60%</text>' +
  '<text x="180" y="1018" style="font-family:Hand;font-weight:700;font-size:30px;fill:#2b2320;text-anchor:middle;letter-spacing:3px">WATER</text></g>');
PF.P("mirage", 870, 760, { s: 0.4 }); PF.P("mirBob", 870, 760); PF.P("burst", 870, 760, { s: 0.3 });
PF.P("helper", 748, 930, { tx: 640 }); PF.P("jug", 690, 930); PF.P("splash", 548, 1040, { s: 0.4 }); PF.P("badge", 180, 960, { s: 0.3 });

// ================= HOOK (prvy snimok = posledny snimok)
hero.look(-10, -8, 0, 0);
PF.CAM(1.0, 540, 960, 0, 0); PF.CAM(1.06, 560, 900, 0, T.d1 - 0.05, "sine.inOut");
hero.arm("L", 158, 0.15, 0.8, "sine.inOut"); hero.cupDrop(1.05);
hero.blink(0.6);
hero.look(0, 0, at("hook", "water") - 0.05, 0.2); hero.brows(-12, 12, -4, at("hook", "water"), 0.2); hero.mouth("mWob", at("hook", "water") + 0.1);
hero.blink(1.95);
PF.O("#hook", 1, 0, T.d1 - 0.25, 0.22);

// ================= DAY 1
PF.O("#day", 0, 1, T.d1, 0.05); PF.DAY("DAY 1", T.d1); room.flip("1", T.d1 + 0.02, true);
hero.arm("L", 22, T.d1 - 0.05, 0.55); hero.look(0, 6, T.d1 + 0.1, 0.25); hero.level(54, T.d1 + 0.2, 0.9);
room.plant(1, T.d1 + 0.3, 1.2);
PF.CAM(1.55, 540, 790, at("d1", "mouth") - 0.12, 0.55);
hero.mouth("mDry", at("d1", "dries")); hero.brows(-18, 18, -2, at("d1", "dries"), 0.2); hero.puff(at("d1", "dries"));
hero.look(0, 0, at("d1", "head") - 0.1, 0.2); hero.lids(0.38, at("d1", "head"), 0.12); hero.brows(14, -14, 4, at("d1", "head"), 0.15);
hero.throb(THROB); THROB.forEach(function (b) { PF.VIG(b - 0.02, 0.6); PF.punch(b - 0.02); });
hero.painOff(T.d2 - 0.1);

// ================= DAY 2 - oblicky setria vodu
PF.REVEAL("cuKid", 540, 1420, T.d2 - 0.27); PF.WORLD(false, T.d2 + 0.02);
PF.DAY("DAY 2", T.d2); room.flip("2", T.d2 + 0.2, false);
PF.CAM(1.0, 540, 960, T.d2 + 0.3, 0); hero.lids(0, T.d2 + 0.3, 0.01); hero.brows(0, 0, 0, T.d2 + 0.3, 0); hero.mouth("mWob", T.d2 + 0.3);
kid.breathe(T.d2); kid.flow(T.d2 + 0.05, at("d2", "slow") + 0.1, 0.22); kid.dropAt(0, at("d2", "slow") + 0.45); kid.dropAt(1, at("d2", "slow") + 0.95);
kid.bladder(1330, T.d2 + 0.3, 1.8); kid.valve(180, at("d2", "slow")); kid.face("determined", at("d2", "slow"));
kid.lastDrop(at("d2", "every"), at("d2", "drop") + 0.05); kid.face("ok", at("d2", "drop") + 0.35);
hero.level(48, T.d2b + 0.3, 0);

// ================= DAY 2b - hustejsia krv, rychlejsie srdce
PF.SLIDE("cuBlood", T.d2b - 0.4); PF.HIDE("cuKid", T.d2b + 0.05);
blood.cells("cellsA", 11, 1.5, T.d2b - 0.4, at("d2b", "heart"), 11, false);
blood.cells("cellsB", 30, 4.2, at("d2b", "thicker") - 0.4, at("d2b", "heart"), 12, false);
blood.plasma("#c9564c", at("d2b", "thicker") - 0.05); blood.thick(at("d2b", "thicker"));
blood.pulse(BEATS.filter(function (b) { return b < at("d2b", "heart") - 0.3; }));
PF.REVEAL("cuHeart", 540, 960, at("d2b", "heart") - 0.27); PF.HIDE("cuBlood", at("d2b", "heart") + 0.05);
heart.rays(at("d2b", "heart") - 0.27, 2.3);
var hb = BEATS.filter(function (b) { return b > at("d2b", "heart") - 0.3; });
heart.beats(hb); hb.forEach(function (b) { PF.VIG(b - 0.02, 0.45); });
heart.ecg(at("d2b", "heart") - 0.2, T.d3, BEATS); heart.sweatDrop(at("d2b", "faster"));
PF.CAM(1.0, 540, 960, T.d3 - 0.5, 0); PF.WORLD(true, T.d3 - 0.3); PF.WIPE("cuHeart", T.d3 - 0.27, -1);

// ================= DAY 3 - prehrievanie
PF.DAY("DAY 3", T.d3); room.flip("3", T.d3 + 0.02, true);
PF.CAM(1.08, 580, 880, T.d3 + 0.1, 4.0, "sine.inOut");
room.sun(true, T.d3 + 0.1); room.sky("#ffc07a", T.d3 + 0.2); room.sunGlow(0, 1, T.d3 + 0.5); room.sunPulse(T.d3 + 1.4, 5);
room.floorLight("#ffcf8f", 0.45, T.d3 + 0.3); room.haze(T.d3 + 0.3, T.d4 - 0.15); room.heatWaves(T.d3 + 0.6, T.d4 - 0.2);
hero.level(42, T.d3 + 0.3, 1.0); hero.mouth("mPant", T.d3 + 0.4); hero.brows(-16, 16, 0, T.d3 + 0.4, 0.2);
hero.arm("R", -150, T.d3 + 0.25, 0.45, "back.out(1.4)"); hero.fan(true, T.d3 + 0.35); hero.armWave("R", -130, T.d3 + 0.72, 0.18, 17);
room.plant(2, T.d3 + 0.8, 1.2);
hero.sweat(T.d3 + 0.8, at("d3", "sweating")); hero.blink(at("d3", "sweating") + 0.6);
hero.heat(true, at("d3", "body") - 0.1); room.thermo(1, at("d3", "overheat") - 0.08); room.bulb("#ff2d1f", at("d3", "overheat"));
hero.steam(at("d3", "overheat") + 0.1);

// ================= DAY 4 - mozog sa zmrstuje
PF.REVEAL("cuBrain", 500, 785, T.d4 - 0.27); PF.WORLD(false, T.d4 + 0.02);
PF.DAY("DAY 4", T.d4); room.flip("4", T.d4 + 0.2, false);
hero.fan(false, T.d4 + 0.2); hero.arm("R", -18, T.d4 + 0.2, 0);
brainP.wobble(T.d4 + 0.1); brainP.pulse(at("d4", "brain")); brainP.shrink(at("d4", "shrink"));
hero.level(38, T.d4b - 0.4, 0); PF.CAM(1.12, 680, 820, T.d4b - 0.4, 0);
PF.WORLD(true, T.d4b - 0.3); PF.WIPE("cuBrain", T.d4b - 0.27, 1);

// ================= DAY 4b - halucinacie
PF.O("#mirage", 0, 1, T.d4b + 0.05, 0.2); PF.X("mirage", { s: 1 }, T.d4b + 0.05, 0.5, "back.out(1.8)");
PF.XY("mirBob", { ty: -18, r: 3 }, T.d4b + 0.3, 0.42, "sine.inOut", 3);
hero.eyes("eyesSp", T.d4b + 0.15); hero.spin(T.d4b + 0.15, 1.7);
PF.fx.hallucinate(T.d4b + 0.1, 1.2);
PF.CAM(1.18, 700, 800, T.d4b + 0.05, 1.6, "sine.inOut");
hero.mouth("mO", T.d4b + 0.2); hero.arm("R", -112, at("d4b", "see") - 0.3, 0.55, "power2.out");
var th = at("d4b", "there");
PF.O("#burst", 0, 1, th - 0.02, 0.04); PF.X("burst", { s: 1.7 }, th - 0.02, 0.45, "power2.out"); PF.O("#burst", 1, 0, th + 0.2, 0.25);
PF.X("mirage", { s: 1.3 }, th - 0.02, 0.2, "power2.out"); PF.O("#mirage", 1, 0, th, 0.15);
hero.eyes("eyesN", th + 0.12); hero.look(10, -6, th + 0.12, 0); hero.brows(-6, 20, -6, th + 0.12, 0.15);
hero.arm("R", -18, th + 0.2, 0.4, "power2.in"); hero.mouth("mWob", th + 0.15);

// ================= DAY 5 - oblicky zlyhavaju, toxiny v krvi
kid.bladder(1440, T.d5 - 0.4, 0); kid.face("ok", T.d5 - 0.4); kid.valveRust(T.d5 - 0.4);
PF.REVEAL("cuKid", 350, 1300, T.d5 - 0.27); PF.WORLD(false, T.d5 + 0.02);
PF.DAY("DAY 5", T.d5); room.flip("5", T.d5 + 0.2, false);
PF.CAM(1.0, 540, 960, T.d5 + 0.2, 0);
kid.shake(at("d5", "kidneys")); kid.fail(at("d5", "fail")); kid.face("sick", at("d5", "fail"));
var tox = at("d5", "toxins");
blood.plasma("#b85a44", tox - 0.6, 0.01); blood.onlyThick(tox - 0.6); blood.cells("cellsB", 26, 4.6, tox - 0.6, T.d6, 55, true);
PF.SLIDE("cuBlood", tox - 0.45); PF.HIDE("cuKid", tox + 0.05);
blood.toxins(tox, T.d6, 22, 77); blood.plasma("#7f7040", at("d5", "blood") - 0.2);
hero.level(30, T.d6 - 0.4, 0);
PF.WORLD(true, T.d6 - 0.3); PF.WIPE("cuBlood", T.d6 - 0.27, -1);

// ================= DAY 6 - organy vypinaju (drzi prazdny pohar -> slucka)
PF.DAY("DAY 6", T.d6); room.flip("6", T.d6 + 0.02, true);
PF.fx.night(0, 0.5, T.d6 + 0.05); room.sky("#2d3b6b", T.d6 + 0.05, 0.9); room.sun(false, T.d6 + 0.05, 1.0); room.sunGlow(1, 0, T.d6 + 0.05, 0.6);
room.floorLight("#ffcf8f", 0, T.d6 + 0.05, 0.8); hero.heat(false, T.d6 + 0.2);
hero.level(22, T.d6 + 0.3, 1.0); hero.slump(-13, T.d6 + 0.35, 1.1);
hero.arm("L", 6, T.d6 + 0.4, 0.9); hero.arm("R", -6, T.d6 + 0.4, 0.9);
hero.lids(0.55, T.d6 + 0.5, 0.4); hero.look(0, 8, T.d6 + 0.5, 0.4); hero.brows(-14, 14, 2, T.d6 + 0.5, 0.3);
room.plant(3, T.d6 + 0.5, 1.4); room.plantColor(true, T.d6 + 0.5);
hero.organOff("heart", at("d6", "organs") + 0.3); hero.organOff("brain", at("d6", "shutting")); hero.organOff("kid", at("d6", "down"));
PF.CAM(1.15, 520, 940, at("d6", "most") - 0.2, 2.0, "sine.inOut"); hero.blink(at("d6", "most") + 0.5);
room.circle(at("d6", "far") - 0.1);

// ================= KONIEC - naleje mu vodu, vypije, telo sa naplni -> znova drzi prazdny pohar (slucka)
var E = T.end;
PF.O("#day", 1, 0, E - 0.1, 0.25);
PF.CAM(1.3, 560, 960, E - 0.05, 0.8);
PF.X("helper", { tx: 0 }, E - 0.15, 0.55, "power3.out"); hero.slump(0, E - 0.05, 0.6);
hero.lids(0, E + 0.05, 0.2); hero.look(12, 2, E + 0.05, 0.2); hero.brows(0, 0, -6, E + 0.05, 0.2); hero.mouth("mO", E + 0.1);
hero.arm("L", -35, E + 0.05, 0.5); hero.glassTilt(35, E + 0.05, 0.5);
PF.X("jug", { r: -40 }, E + 0.5, 0.25, "power2.out");
PF.S("#stream", { opacity: 1 }, E + 0.62); PF.draw("stream", E + 0.62, 0.12, "none"); PF.O("#stream", 1, 0, E + 1.12, 0.08);
PF.O("#splash", 0, 1, E + 0.72, 0.05); PF.X("splash", { s: 1.3, ty: -8 }, E + 0.72, 0.35, "power2.out"); PF.O("#splash", 1, 0, E + 1.0, 0.15);
PF.CAM(1.0, 540, 960, E + 1.25, 0.9);
hero.glassFill(90, E + 0.66, 0.5, "power1.inOut");
PF.X("jug", { r: 0 }, E + 1.15, 0.25); PF.X("helper", { tx: 640 }, E + 1.35, 0.5, "power2.in");
hero.arm("L", -95, E + 1.15, 0.4); hero.look(0, 0, E + 1.15, 0.2); hero.lids(0.4, E + 1.3, 0.15);
hero.glassFill(0, E + 1.4, 0.75, "power1.in");
hero.level(60, E + 1.3, 0.9, "power1.inOut"); hero.bubbles(E + 1.35, 16, 91);
PF.O("#badge", 0, 1, at("end", "sixty"), 0.1); PF.X("badge", { s: 1 }, at("end", "sixty"), 0.4, "back.out(2)");
PF.fx.night(0.5, 0, E + 0.55, 1.2); room.sky("#bfe3f0", E + 0.7, 1.0); room.floorLight("#fff4dc", 0.26, E + 1.5, 0.8);
room.thermo(0, E + 1.6, 0.8, "power2.inOut"); room.bulb("#d9483b", E + 1.6, 0.5);
hero.organOn("heart", E + 1.45); hero.organOn("brain", E + 1.65); hero.organOn("kid", E + 1.85);
room.plant(0, E + 1.6, 0.9, "back.out(1.6)"); room.plantColor(false, E + 1.6, 0.9);
room.circleOff(E + 1.0);
var ew = at("end", "water");
hero.arm("L", 22, ew - 0.05, 0.4); hero.glassTilt(0, ew - 0.05, 0.4); hero.lids(0, ew - 0.05, 0.1);
hero.eyes("eyesHap", ew); hero.mouth("mBig", ew);
hero.arm("R", -160, ew + 0.05, 0.45, "back.out(1.6)"); hero.thumb(true, ew + 0.2);
PF.O("#badge", 1, 0, at("end", "so") - 0.15, 0.2);
var so = at("end", "so");
room.flip("–", so + 0.05, true);
hero.arm("R", -18, so + 0.15, 0.4); hero.thumb(false, so + 0.3);
hero.arm("L", 150, so + 0.25, 0.85);
hero.eyes("eyesN", so + 0.55); hero.look(-10, -8, so + 0.55, 0.3); hero.brows(0, 0, 0, so + 0.55, 0.3); hero.mouth("mO", so + 0.6);
hero.blink(so + 1.3);
PF.O("#hook", 0, 1, T.total - 0.7, 0.4);
