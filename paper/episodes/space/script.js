// EPIZODA: What happens if you live in space?  (astronaut na stanici, DAY 1 -> MONTH 6 -> pristatie na Zemi -> start raketou = zaciatok)
var at = PF.at, s0 = function (k) { return PF.seg(k)[0]; };
var T = { d1: s0("d1"), d2: s0("d2"), w2: s0("w2"), m1: s0("m1"), m3: s0("m3"), m6: s0("m6"), end: s0("end"), total: PF.VO.total };
var sta = PF.envSpace({}), field = PF.envField({});
// Zem: pristavacia kapsula (zrezany kuzel, ohoreny spodok, tepelny stit) + pruhovany padak za nou + dym (vlavo, mimo ruk postavy)
PF.add("fd_props",
  '<g id="chute" filter="url(#cut)"><path d="M-40 1364 C -30 1296 60 1262 156 1282 C 128 1316 106 1344 100 1364 Z" fill="#f39c42"/>' +
  '<path d="M14 1286 C 24 1318 30 1344 28 1364 M78 1270 C 74 1306 70 1338 68 1364" stroke="#ffffff" stroke-width="16" fill="none"/>' +
  '<path d="M156 1282 L 196 1196 M128 1316 L 196 1196 M106 1344 L 196 1196" stroke="#8a7a66" stroke-width="3" fill="none"/></g>' +
  '<g id="capsule" filter="url(#cut)"><path d="M160 1196 H232 Q 244 1196 248 1208 L 300 1344 Q 304 1358 290 1358 H102 Q 88 1358 92 1344 L 144 1208 Q 148 1196 160 1196 Z" fill="#e9e4da" stroke="#b9ad98" stroke-width="5"/>' +
  '<path d="M112 1300 H282 L 300 1344 Q 304 1358 290 1358 H102 Q 88 1358 92 1344 Z" fill="#7a6552" opacity="0.55"/>' +
  '<path d="M150 1300 l6 -26 M200 1300 l-4 -34 M246 1300 l8 -22" stroke="#7a6552" stroke-width="6" stroke-linecap="round" opacity="0.45"/>' +
  '<rect x="84" y="1352" width="224" height="16" rx="6" fill="#4a3f36"/><rect x="170" y="1184" width="52" height="14" rx="5" fill="#9aa7b6"/>' +
  '<path d="M134 1240 H258" stroke="#cfc6b6" stroke-width="3"/><circle cx="196" cy="1266" r="17" fill="#2f3945" stroke="#cfd8e2" stroke-width="5"/>' +
  '<path d="M188 1258 q6 -4 12 -2" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/></g>' +
  '<g id="smoke" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" opacity="0.7"><path d="M176 1160 q-16 -26 0 -50 q16 -24 0 -48"/><path d="M218 1150 q-14 -22 0 -42 q14 -20 0 -40"/></g>');
PF.P("smoke", 196, 1110);
var hero = PF.charBiped({ id: "hero", look: "clothed", suit: "#3569b3", suitDark: "#27518e", patch: "#f6c343", armL: 40, armR: -40 });
// obal na prevratenie: pivot v strede tela (540 960) -> hlava ani nohy nevyletia k oknu/obrazovke
var fe = document.getElementById("hero_float"), tg = document.createElementNS(PF.NS, "g"); tg.id = "tumble";
fe.parentNode.insertBefore(tg, fe); tg.appendChild(fe); PF.P("tumble", 540, 960);
// rekvizity postavy: vlasy vo beztiazi, opuchnute lica, bezecky postroj
document.getElementById("hero_sick").insertAdjacentHTML("beforebegin",
  '<g id="tufts" fill="#4a3226"><path id="tf0" d="M470 612 C 462 572 474 546 490 522 C 494 556 500 580 498 610 Z"/><path id="tf1" d="M528 600 C 524 556 536 522 552 492 C 558 530 562 566 560 600 Z"/>' +
  '<path id="tf2" d="M584 610 C 584 574 598 548 616 528 C 616 562 616 586 610 614 Z"/></g>' +
  '<g id="jowls" opacity="0"><circle cx="412" cy="860" r="58" fill="#f1c9a5"/><circle cx="668" cy="860" r="58" fill="#f1c9a5"/>' +
  '<ellipse cx="420" cy="890" rx="26" ry="14" fill="#f2a0a0" opacity="0.6"/><ellipse cx="660" cy="890" rx="26" ry="14" fill="#f2a0a0" opacity="0.6"/></g>');
PF.add("hero_up", '<rect id="harness" x="380" y="1192" width="320" height="32" rx="14" fill="#2f3945" stroke="#f39c42" stroke-width="5" opacity="0"/>');
PF.P("tf0", 484, 610); PF.P("tf1", 544, 600); PF.P("tf2", 600, 612); PF.P("jowls", 540, 860, { s: 0.6 });
var tp = PF.loopPeriod(1.6), tn = Math.round(T.total / tp) * 2 - 1;
[["tf0", -9], ["tf1", 7], ["tf2", 10]].forEach(function (q, i) { PF.XY(q[0], { r: q[1] }, 0, tp / 2, "sine.inOut", tn); });
// tekutiny stupaju nahor (sipky-chevrony) a beziaci pas
document.getElementById("defs").insertAdjacentHTML("beforeend", '<clipPath id="beltClip"><rect x="350" y="1459" width="380" height="20" rx="10"/></clipPath>');
var chev = "", stripes = "";
for (var k = 0; k < 12; k++) chev += '<g id="ch' + k + '" opacity="0"><g transform="translate(' + [494, 540, 586][k % 3] + ' 1400)"><path d="M-34 20 L0 -14 L34 20" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M-34 20 L0 -14 L34 20" fill="none" stroke="#5cc8ff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g></g>';
for (var sx = 350; sx < 1180; sx += 40) stripes += '<rect x="' + sx + '" y="1459" width="16" height="20" fill="#4d5968"/>';
PF.add("M", '<g id="fluid">' + chev + '</g>' +
  '<g id="tread" opacity="0"><path d="M376 1470 L 440 1172" stroke="#f39c42" stroke-width="8" stroke-linecap="round"/><path d="M704 1470 L 640 1172" stroke="#f39c42" stroke-width="8" stroke-linecap="round"/>' +
  '<g filter="url(#cut)"><rect x="330" y="1466" width="420" height="94" rx="22" fill="#5d6b7c"/><rect x="344" y="1456" width="392" height="26" rx="13" fill="#2f3945"/></g>' +
  '<g clip-path="url(#beltClip)"><g id="belt">' + stripes + '</g></g><circle cx="376" cy="1470" r="10" fill="#f6c343"/><circle cx="704" cy="1470" r="10" fill="#f6c343"/></g>');
PF.P("tread", 540, 1500, { ty: 140 });
PF.fx.dust(22, 271, "#ffffff");
var ear = PF.panelEar(3), spine = PF.panelSpine(4), bone = PF.panelBone(5), eye = PF.panelEye(4);

// ================= HOOK (prvy snimok = posledny snimok): vznasa sa, pozera na Zem
PF.CAM(1.0, 540, 960, 0, 0); PF.CAM(1.05, 560, 920, 0, T.d1 - 0.05, "sine.inOut");
hero.shadow(false, 0); hero.mouth("mSmile", 0); hero.look(-10, -4, 0, 0);
hero.bob(0, T.d2 - 0.1);
hero.blink(0.55); hero.look(0, 0, at("hook", "live") - 0.1, 0.2);
var sp = at("hook", "space");
hero.arm("L", 62, sp - 0.05, 0.4, "back.out(1.6)"); hero.arm("R", -62, sp - 0.05, 0.4, "back.out(1.6)"); hero.eyes("eyesHap", sp); hero.mouth("mBig", sp);
hero.arm("L", 40, T.d1 - 0.1, 0.5); hero.arm("R", -40, T.d1 - 0.1, 0.5); hero.eyes("eyesN", T.d1 - 0.05); hero.mouth("mSmile", T.d1 - 0.05);
PF.O("#hook", 1, 0, T.d1 - 0.25, 0.22);

// ================= DAY 1 - tekutiny idu do hlavy: opuchnuta tvar, tenke nohy
PF.O("#day", 0, 1, T.d1, 0.05); PF.DAY("DAY 1", T.d1); sta.screen("1", T.d1 + 0.1);
var fl = at("d1", "fluids");
PF.CAM(1.0, 540, 1010, fl - 0.25, 0.5);
hero.look(0, 12, fl - 0.1, 0.25); hero.mouth("mO", fl);
for (var c = 0; c < 12; c++) {                 // dve vlny chevronov: z noh az po tvar
  var col = c % 3, x0 = [494, 540, 586][col], x1 = [506, 540, 574][col], t = fl + 0.05 + Math.floor(c / 3) * 0.32 + col * 0.06;
  PF.P("ch" + c, x0, 1400); PF.O("#ch" + c, 0, 1, t, 0.12); PF.X("ch" + c, { tx: x1 - x0, ty: -600 }, t, 1.05, "power1.inOut"); PF.O("#ch" + c, 1, 0, t + 0.8, 0.25);
}
hero.look(0, -12, at("d1", "up") - 0.1, 0.6);
var pf = at("d1", "puffs");
PF.CAM(1.5, 540, 770, at("d1", "face") - 0.2, 0.45);
hero.headScale(1.1, pf, 0.35, "back.out(2)"); PF.O("#jowls", 0, 1, pf, 0.08); PF.X("jowls", { s: 1 }, pf, 0.35, "back.out(2)");
hero.look(0, 0, pf, 0.15); hero.lids(0.3, pf + 0.05, 0.15); hero.mouth("mWob", pf + 0.05); hero.brows(-10, 10, -2, pf, 0.2);
PF.CAM(1.08, 540, 1010, at("d1", "legs") - 0.2, 0.5);      // cely postava: velka hlava + tenke nohy naraz
hero.legsThin(0.5, at("d1", "skinny") - 0.05, 0.4); hero.look(0, 12, at("d1", "legs"), 0.2);

// ================= DAY 2 - vnutorne ucho nevie, kde je dole -> (pod panelom sa prevrati) hlavou dole, je mu zle
var tE = T.d2 - 0.27;
PF.panelIn("cuEar", tE, 715, 668); PF.WORLD(false, T.d2 + 0.02);
PF.DAY("DAY 2", T.d2); sta.screen("2", T.d2 + 0.1);
PF.CAM(1.0, 540, 960, T.d2 + 0.05, 0);
hero.lids(0, T.d2 + 0.05, 0.01); hero.look(0, 0, T.d2 + 0.05, 0); hero.mouth("mO", T.d2 + 0.05); hero.brows(-8, 8, -6, T.d2 + 0.05, 0);
PF.X("tumble", { r: 180 }, T.d2 + 0.05, 0);
ear.zoom(at("d2", "inner") - 0.05);
ear.drift(at("d2", "cant"), at("d2", "so") + 0.2, 5); ear.spin(at("d2", "which") - 0.15, at("d2", "so") + 0.2, 9);
ear.arrows([at("d2", "way"), at("d2", "down")]); ear.qmarks([at("d2", "tell"), at("d2", "is"), at("d2", "down") + 0.22]);
var tS = at("d2", "so") - 0.3;
PF.WORLD(true, tS - 0.02); PF.panelOut("cuEar", tS, -1);
PF.X("tumble", { r: 196 }, tS, T.w2 - tS, "sine.inOut");
hero.eyes("eyesSp", tS + 0.1); hero.spin(tS + 0.1, 1.3); hero.sick(0, 0.55, at("d2", "feel") - 0.1, 0.4); hero.mouth("mSick", at("d2", "sick") - 0.05);
PF.F("#jowls circle", "#f1c9a5", "#bfb470", at("d2", "feel") - 0.1, 0.4);
PF.fx.hallucinate(tS + 0.15, 0.8);

// ================= WEEK 2 - chrbtica sa natiahne, +5 cm
var tW = T.w2 - 0.27;
PF.panelIn("cuSpine", tW, 540, 1000); PF.WORLD(false, T.w2 + 0.02);
PF.DAY("WEEK 2", T.w2); sta.screen("14", T.w2 + 0.2);
PF.X("tumble", { r: 0 }, T.w2 + 0.3, 0); hero.sick(0.55, 0, T.w2 + 0.3, 0.01); hero.eyes("eyesN", T.w2 + 0.3); hero.mouth("mSmile", T.w2 + 0.3);
hero.brows(0, 0, 0, T.w2 + 0.3, 0); hero.headScale(1.05, T.w2 + 0.3, 0); hero.legsThin(0.75, T.w2 + 0.3, 0.01);
PF.F("#jowls circle", "#bfb470", "#f1c9a5", T.w2 + 0.3, 0.01); PF.X("jowls", { s: 0.85 }, T.w2 + 0.3, 0);
spine.wiggle(at("w2", "spine")); spine.stretch(at("w2", "stretches") - 0.05, 0.9); spine.badge(at("w2", "two", 1));

// ================= MONTH 1 - kosti slabnu, ~1 % mesacne
PF.panelSwap("cuSpine", "cuBone", T.m1 - 0.4);
PF.DAY("MONTH 1", T.m1); sta.screen("30", T.m1 + 0.2);
bone.pulse(at("m1", "bones")); bone.weaken(at("m1", "weaker") - 0.05, 3); bone.calcium(at("m1", "losing") - 0.1, T.m3); bone.badge(at("m1", "percent") - 0.1);

// ================= MONTH 3 - svaly sa zmensuju -> 2 hodiny cvicenia denne (beziaci pas s postrojom)
PF.WORLD(true, T.m3 - 0.3); PF.panelOut("cuBone", T.m3 - 0.27, -1);
PF.DAY("MONTH 3", T.m3); sta.screen("90", T.m3 + 0.05);
hero.bob(T.m3 - 0.3, at("m3", "so") - 0.15);
PF.CAM(1.35, 560, 1000, at("m3", "muscles") - 0.25, 0.5);
hero.look(-12, 8, at("m3", "muscles") - 0.1, 0.2);
hero.armThin(0.6, at("m3", "shrink"), 0.5); PF.X("hero_up", { sx: 0.93 }, at("m3", "shrink"), 0.5); hero.mouth("mWob", at("m3", "shrink")); hero.brows(-12, 12, -2, at("m3", "shrink"), 0.2);
var tr = at("m3", "so");
PF.CAM(1.0, 540, 1000, tr - 0.15, 0.5);
PF.O("#tread", 0, 1, tr - 0.1, 0.1); PF.X("tread", { ty: 0 }, tr - 0.1, 0.4, "back.out(1.5)"); PF.O("#harness", 0, 1, tr + 0.2, 0.15);
hero.look(0, 0, tr, 0.2); hero.brows(0, 0, 0, tr, 0.2); hero.mouth("mPant", at("m3", "work"));
var runEnd = hero.run(at("m3", "work") - 0.05, T.m6 + 0.3, 0.5, 30, -30);
var bp = 0.25, bn = Math.ceil((T.m6 + 0.3 - at("m3", "work")) / bp);
PF.tl.fromTo("#belt", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(-40 0)" }, duration: bp, ease: "none", repeat: bn, immediateRender: false }, at("m3", "work") - 0.05);
sta.screen("2 HRS", at("m3", "two") - 0.05, "WORKOUT", 60); hero.sweat(at("m3", "two"), at("m3", "day") + 0.1);

// ================= MONTH 6 - zadna stena oka sa splosti, videnie sa rozmaze
PF.panelIn("cuEye", T.m6 - 0.27, 500, 780); PF.WORLD(false, T.m6 + 0.02);
PF.DAY("MONTH 6", T.m6); sta.screen("180", T.m6 + 0.2);
PF.O("#tread", 1, 0, runEnd + 0.05, 0); PF.O("#harness", 1, 0, runEnd + 0.05, 0);
eye.hint(at("m6", "back") - 0.05); eye.flatten(at("m6", "flatten") - 0.05, 0.7); eye.blurry(at("m6", "blurry") - 0.3, 0.9);

// ================= KONIEC - pristatie na Zemi (oblaky), sotva stoji; "Would you still go?" -> palec hore -> start rakety (oblaky) -> stanica
var tL = PF.fx.cloudWipe(T.end - 0.5, 1) + 0.02;
PF.HIDE("cuEye", tL); PF.WORLD(true, tL); sta.show(false, tL); field.show(true, tL); PF.CAM(1.0, 540, 980, tL, 0);
hero.shadow(true, tL); PF.S("#tufts", { opacity: 0 }, tL); PF.O("#jowls", 1, 0, tL, 0); hero.headScale(1, tL, 0); hero.legsThin(0.85, tL, 0.01);
hero.arm("L", 70, tL, 0); hero.arm("R", -70, tL, 0); hero.mouth("mWob", tL); hero.brows(-14, 14, 0, tL, 0); hero.look(0, 6, tL, 0); hero.lids(0.2, tL, 0);
PF.DAY("BACK HOME", T.end + 0.05);
PF.XY("smoke", { ty: -26 }, tL, 0.6, "sine.inOut", 5); PF.O("#smoke", 0.7, 0.35, tL, 0.9);
hero.kneeShake(tL + 0.15, at("end", "would") - 0.1, 5);
hero.armWave("L", 100, tL + 0.2, 0.25, 5); hero.armWave("R", -100, tL + 0.2, 0.25, 5);
PF.XY("hero_float", { r: 5 }, tL + 0.2, 0.3, "sine.inOut", 3);
var bs = at("end", "barely");
PF.X("hero_float", { r: -9, tx: -14 }, bs + 0.05, 0.25, "power2.out"); PF.X("hero_float", { r: 5, tx: 6 }, bs + 0.33, 0.25, "power2.inOut"); PF.X("hero_float", { r: 0, tx: 0 }, bs + 0.6, 0.35, "power2.inOut");
hero.mouth("mO", bs); hero.sweat(bs - 0.3, at("end", "stand") + 0.4);
var wy = at("end", "would"), go = at("end", "go");
hero.lids(0, wy - 0.1, 0.1); hero.look(0, 0, wy - 0.1, 0.2); hero.brows(-6, 6, -10, wy, 0.2); hero.mouth("mSmile", wy);
hero.eyes("eyesHap", go); hero.mouth("mBig", go); hero.arm("R", -160, go - 0.05, 0.4, "back.out(1.6)"); hero.thumb(true, go + 0.12);
// start rakety -> spat na stanicu v uplne rovnakom stave ako prvy snimok
var tB = PF.fx.cloudWipe(go + 0.35, -1) + 0.02;
PF.O("#day", 1, 0, tB - 0.2, 0.15);
field.show(false, tB); sta.show(true, tB); PF.CAM(1.0, 540, 960, tB, 0); sta.screen("0", tB);
hero.shadow(false, tB); PF.S("#tufts", { opacity: 1 }, tB); hero.legsThin(1, tB, 0.01); hero.armThin(1, tB, 0.01); PF.X("hero_up", { sx: 1 }, tB, 0);
hero.thumb(false, tB); hero.arm("R", -40, tB, 0); hero.arm("L", 40, tB, 0); hero.eyes("eyesN", tB); hero.mouth("mSmile", tB);
hero.look(-10, -4, tB, 0); hero.brows(0, 0, 0, tB, 0); hero.lids(0, tB, 0);
PF.XY("hero_float", { ty: -22, r: 3 }, T.total - 1.4, 0.7, "sine.inOut", 1);
PF.O("#hook", 0, 1, T.total - 0.7, 0.4);
