// pack_blindspot.js - momenty pre video 048 Your Blind Spot
// bshole  "peek" = tmava diera s carkovanym kruhom vpravo od hlavy, hrdina na nu pozrie, sama zmizne (hak)
//         "show" = to iste, ostane; "brain" = maly mozog vyskoci nad dierou a zmurkne; "hide" = diera sa zatiahne, mozog zmizne (koniec) (dirty "bshole")
// bseye   "close" = dlan na lave oko (vlavo na obrazovke, zrkadlovo k divakovi), oko zavrete; "card" = karta CLOSE LEFT EYE hore (dirty "bseye")
// bstest  "show" = celoplosna testovacia obrazovka: krizik vlavo (160,820), cervena bodka vpravo (900,860), nic sa pri bodke nehybe;
//         "stare" = karta STARE AT THE + hore; "cross" = sipka na krizik + pulz; "phone" = karta s telefonom, ktory sa pomaly priblizuje a vzdaluje (o.until = kluc vety, do ktorej pulzuje);
//         "gone" = napis GONE? nad krizikom (dirty "bstest")
// bsball  "show" = rez okom zhora na tmavom pozadi, luce svetla, fotony; "blind" = cierna skvrna + BLIND SPOT; "nerve" = zlty kabel ziari + OPTIC NERVE;
//         "zoom" = priblizenie do vystupu nervu -> terc so senzormi a vlaknami; "count" = pocitadlo 1,200,000 (o.dur); "zero" = 0 LIGHT SENSORS (dirty "bsball")
// bssky   "show" = nocna obloha, ovalna slepa skvrna; "moons" = 11 mesiacov vklzne do ovalu; "card" = karta 10+ FULL MOONS;
//         "hole" = mesiace prec, oval cierny; "brain" = mozog s valcekom pride; "paint" = prevalcuje oval hviezdami (o.dur); "done" = obrys zmizne (dirty "bssky")
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake;
  var INK = "#2b2320", RED = "#d9483b", PAPER = "#fbf5ea", GOLD = "#ffd34d";
  function Hr() { return C().hero; }
  function left(t, t1) { return (t1 || t + 3) - t - 0.12; }
  function pop(sel, t, org, s0) {
    tl.fromTo(sel, { scale: s0 || 0.3, svgOrigin: org }, { svgOrigin: org, scale: 1, duration: 0.32, ease: "back.out(2.2)", immediateRender: false }, t);
  }
  function popH(sel, t) {                    // HTML karta: pop + mierne natocenie
    tl.fromTo(sel, { scale: 0.4, rotation: -7 }, { scale: 1, rotation: -1.5, duration: 0.32, ease: "back.out(2)", immediateRender: false }, t);
  }
  function screen(id, bg, inner) {
    UI().insertAdjacentHTML("beforeend", '<div id="' + id + '" style="position:absolute;left:0;top:0;width:1080px;height:1920px;opacity:0;background:' + bg + '">' + inner + '</div>');
  }
  function card(id, top, html, extra) {
    return '<div class="mo" id="' + id + '" style="top:' + top + 'px"><div class="mo-paper" id="' + id + 'In" style="padding:18px 44px 14px;white-space:nowrap;line-height:1.05;' + (extra || "") + '">' + html + '</div></div>';
  }
  var BRAIN = 'M440 718 C 424 690 440 652 476 648 C 488 628 520 624 540 636 C 560 622 596 626 606 646 C 640 648 656 680 644 706 C 660 730 640 760 612 758 C 596 776 560 778 540 766 C 520 778 486 776 470 760 C 444 762 428 740 440 718 Z';
  function brainSvg(id) {                    // mozog s ocami, stred (540, 705)
    return '<path d="' + BRAIN + '" fill="#f3a5b5" stroke="' + INK + '" stroke-width="7"/>' +
      '<g fill="none" stroke="#d9788e" stroke-width="6" stroke-linecap="round"><path d="M466 696 q20 -24 44 -6 q18 14 40 -6"/><path d="M540 642 q-6 22 6 40"/><path d="M598 676 q16 10 22 28"/></g>' +
      '<g id="' + id + 'E"><circle cx="512" cy="724" r="15" fill="#ffffff" stroke="' + INK + '" stroke-width="4"/><circle cx="570" cy="724" r="15" fill="#ffffff" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="515" cy="726" r="7" fill="' + INK + '"/><circle cx="573" cy="726" r="7" fill="' + INK + '"/></g>' +
      '<path d="M522 746 q19 14 38 0" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
  }

  // ================= DIERA PRI HLAVE (hak + koniec), svet vrstva M
  var HX = 830, HY = 600;
  function buildHole() {
    if (st.bsh) return; st.bsh = { on: false };
    PF.add("M", '<g id="mo_bsH" opacity="0"><g id="mo_bsHi"><circle cx="' + HX + '" cy="' + HY + '" r="86" fill="#16131c" opacity="0.88"/>' +
      '<circle cx="' + HX + '" cy="' + HY + '" r="60" fill="#000000" opacity="0.5"/>' +
      '<g id="mo_bsHr"><circle cx="' + HX + '" cy="' + HY + '" r="104" fill="none" stroke="' + PAPER + '" stroke-width="9" stroke-dasharray="22 16"/></g></g></g>' +
      '<g id="mo_bsHb" opacity="0"><g id="mo_bsHbi"><g transform="translate(' + (HX - 540 * 0.62) + ' ' + (HY - 205 - 705 * 0.62) + ') scale(0.62)">' + brainSvg("mo_bsHb") + '</g></g></g>');
  }
  function holeReg() {
    var h = Hr();
    R.dirty("bshole", function (tt, d) {
      tl.to("#mo_bsH,#mo_bsHb", { opacity: 0, duration: d ? 0.15 : 0.01, ease: "none" }, tt);
      h.look(0, 0, tt, d ? 0.2 : 0); st.bsh.on = false;
    });
  }
  function holeIn(t, t1) {
    PF.S("#mo_bsH", { opacity: 1 }, t);
    pop("#mo_bsHi", t, HX + " " + HY, 0.15);
    tl.fromTo("#mo_bsHr", { rotation: 0, svgOrigin: HX + " " + HY }, { svgOrigin: HX + " " + HY, rotation: 140, duration: Math.max(0.6, Math.min(3.0, left(t, t1))), ease: "none", immediateRender: false }, t);
  }
  M.bshole = function (t, mode, t1, o) {
    o = o || {}; buildHole(); holeReg();
    var h = Hr(), lt = left(t, t1);
    if (mode === "brain") {
      PF.S("#mo_bsHb", { opacity: 1 }, t);
      pop("#mo_bsHbi", t, HX + " " + (HY - 205), 0.2);
      tl.fromTo("#mo_bsHbE", { scaleY: 1, svgOrigin: "540 724" }, { svgOrigin: "540 724", scaleY: 0.1, duration: 0.08, ease: "power1.in", yoyo: true, repeat: 1, immediateRender: false }, t + 0.45);
      return null;
    }
    if (mode === "hide") {                   // diera sa zatiahne (mozog ju zamaluje), mozog zmizne este pred navratom slucky
      var te = Math.max(t + 0.05, Math.min(t + 0.3, (t1 || t + 2) - 1.0));
      tl.fromTo("#mo_bsHi", { scale: 1, svgOrigin: HX + " " + HY }, { svgOrigin: HX + " " + HY, scale: 0, duration: 0.3, ease: "back.in(2)", immediateRender: false }, te);
      PF.O("#mo_bsH", 1, 0, te + 0.28, 0.05);
      PF.O("#mo_bsHb", 1, 0, te + 0.25, 0.15);
      h.look(0, 0, te + 0.1, 0.2);
      return null;
    }
    holeIn(t, t1);
    h.look(12, -4, t + 0.15, 0.25);
    if (mode === "peek") {
      var tf = Math.max(t + 0.6, Math.min(t + 1.4, (t1 || t + 2) - 0.35));
      PF.O("#mo_bsH", 1, 0, tf, 0.2);
      h.look(0, 0, tf, 0.2);
    }
    return null;
  };

  // ================= DLAN NA OKU (veta 1)
  function buildEye() {
    if (st.bse) return; st.bse = true;
    var p = Hr().p, ear = document.querySelector("#" + p + "head circle[r='30']"), lid = document.getElementById(p + "lidL");
    var SK = ear ? ear.getAttribute("fill") : "#f1c9a5", SKD = lid ? lid.getAttribute("fill") : "#dca87f";
    document.getElementById(p + "head").insertAdjacentHTML("beforeend",
      '<g id="mo_bsPm" opacity="0"><g fill="' + SK + '" stroke="' + SKD + '" stroke-width="6">' +
      '<rect x="430" y="752" width="24" height="70" rx="12" transform="rotate(-14 442 790)"/><rect x="458" y="742" width="24" height="76" rx="12" transform="rotate(-5 470 780)"/>' +
      '<rect x="486" y="744" width="24" height="74" rx="12" transform="rotate(4 498 780)"/><rect x="512" y="754" width="22" height="66" rx="11" transform="rotate(12 523 790)"/>' +
      '<ellipse cx="482" cy="842" rx="62" ry="54"/></g>' +
      '<path d="M450 830 q30 10 62 0" fill="none" stroke="' + SKD + '" stroke-width="5" stroke-linecap="round" opacity="0.8"/></g>');
    UI().insertAdjacentHTML("beforeend", card("mo_bsEc", 190,
      '<span style="display:flex;align-items:center;gap:22px;font-size:66px">' +
      '<svg viewBox="0 0 120 80" style="position:static;display:block;width:120px;height:80px"><path d="M10 40 Q60 -6 110 40 Q60 86 10 40 Z" fill="#fffdf8" stroke="' + INK + '" stroke-width="7"/>' +
      '<path d="M14 40 Q60 74 106 40" fill="none" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/><path d="M10 40 Q60 -6 110 40 Z" fill="' + SKD + '"/></svg>CLOSE LEFT EYE</span>'));
  }
  M.bseye = function (t, mode, t1, o) {
    o = o || {}; buildEye();
    var h = Hr(), p = h.p, a0 = C().arms0;
    R.dirty("bseye", function (tt, d) {
      PF.X(p + "armL", { r: a0[0], sy: 1 }, tt, d ? 0.3 : 0);
      PF.O("#mo_bsPm", 1, 0, tt, d ? 0.1 : 0.01);
      tl.set("#" + p + "lidL", { attr: { height: 0 } }, tt + (d ? 0.1 : 0));
      PF.O("#mo_bsEc", 1, 0, tt, d ? 0.15 : 0.01);
    });
    if (mode === "card") {
      PF.O("#mo_bsEc", 0, 1, t, 0.06); popH("#mo_bsEcIn", t);
      return null;
    }
    // close: ruka (lava na obrazovke) ide k oku, dlan ho zakryje, oko sa zavrie
    PF.X(p + "armL", { r: -155, sy: 0.62 }, t, 0.32, "power2.out");
    PF.AT("#" + p + "lidL", { height: 0 }, { height: 80 }, t + 0.12, 0.12);
    PF.O("#mo_bsPm", 0, 1, t + 0.22, 0.08);
    tl.fromTo("#mo_bsPm", { scale: 0.85, svgOrigin: "482 830" }, { svgOrigin: "482 830", scale: 1, duration: 0.2, ease: "back.out(2)", immediateRender: false }, t + 0.22);
    R.setFace(t + 0.2, "happy");
    h.eyes("eyesN", t + 0.21);
    PF.punch(t + 0.3, 1.02);
    return "face";
  };

  // ================= TESTOVACIA OBRAZOVKA (vety 2-4): nic sa nehybe pri bodke
  var CX = 160, CY = 820, DX = 900, DY = 860;
  function buildTest() {
    if (st.bst) return; st.bst = { ph: false };
    var phone = '<svg viewBox="0 0 150 210" style="position:static;display:block;width:150px;height:210px;overflow:visible"><g id="mo_bsTph">' +
      '<rect x="27" y="10" width="96" height="176" rx="18" fill="' + INK + '"/><rect x="36" y="28" width="78" height="140" rx="6" fill="#f7f2e8"/>' +
      '<path d="M46 98 h22 M57 87 v22" stroke="' + INK + '" stroke-width="6"/><circle cx="102" cy="100" r="7" fill="#e0302a"/></g></svg>';
    screen("mo_bsT", "#f7f2e8",
      '<svg viewBox="0 0 1080 1920"><g id="mo_bsTx"><rect x="' + (CX - 50) + '" y="' + (CY - 10) + '" width="100" height="20" fill="#111111"/><rect x="' + (CX - 10) + '" y="' + (CY - 50) + '" width="20" height="100" fill="#111111"/></g>' +
      '<circle cx="' + DX + '" cy="' + DY + '" r="34" fill="#e0302a"/>' +
      '<g id="mo_bsTa" opacity="0"><g id="mo_bsTai"><path d="M560 ' + CY + ' H262" stroke="' + RED + '" stroke-width="16" stroke-linecap="round"/><path d="M300 ' + (CY - 40) + ' L252 ' + CY + ' L300 ' + (CY + 40) + '" fill="none" stroke="' + RED + '" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></g></g>' +
      '<text id="mo_bsTg" x="' + CX + '" y="' + (CY - 92) + '" opacity="0" style="font-family:Pop;font-weight:600;font-size:66px;text-anchor:middle;fill:' + RED + '">GONE?</text></svg>' +
      card("mo_bsTs", 230, '<span style="font-size:66px">STARE AT THE +</span>') +
      card("mo_bsTp", 190, '<span style="display:flex;align-items:center;gap:26px;font-size:58px">' + phone + '<span style="text-align:left;line-height:1.12">CLOSER,<br>THEN BACK</span></span>'));
  }
  M.bstest = function (t, mode, t1, o) {
    o = o || {}; buildTest();
    var lt = left(t, t1);
    R.dirty("bstest", function (tt, d) {
      PF.O("#mo_bsT", 1, 0, tt, d ? 0.3 : 0.01);
      PF.S("#mo_bsTa,#mo_bsTg,#mo_bsTs,#mo_bsTp", { opacity: 0 }, tt + (d ? 0.32 : 0.02));
    });
    if (mode === "stare") {
      PF.O("#mo_bsTs", 0, 1, t, 0.06); popH("#mo_bsTsIn", t);
      return null;
    }
    if (mode === "cross") {
      PF.S("#mo_bsTa", { opacity: 1 }, t);
      tl.fromTo("#mo_bsTai", { x: 120 }, { x: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo("#mo_bsTai", { x: 0 }, { x: 22, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t + 0.35);
      PF.O("#mo_bsTa", 1, 0, Math.max(t + 1.1, Math.min(t + 1.4, t + lt - 0.2)), 0.25);
      tl.fromTo("#mo_bsTx", { scale: 1, svgOrigin: CX + " " + CY }, { svgOrigin: CX + " " + CY, scale: 1.35, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, t + 0.05);
      return null;
    }
    if (mode === "phone") {                  // karta s telefonom: pomaly blizsie a dalej, kym test bezi
      PF.O("#mo_bsTs", 1, 0, t, 0.12);
      PF.O("#mo_bsTp", 0, 1, t + 0.05, 0.06); popH("#mo_bsTpIn", t + 0.05);
      var until = (o.until && PF.VO.total > 0 && PF.seg(o.until)) ? PF.seg(o.until)[0] - 0.4 : t + lt;
      var per = 0.75, n = Math.max(1, Math.floor((until - t - 0.4) / (2 * per)));
      tl.fromTo("#mo_bsTph", { scale: 1, svgOrigin: "75 100" }, { svgOrigin: "75 100", scale: 1.32, duration: per, ease: "sine.inOut", yoyo: true, repeat: 2 * n - 1, immediateRender: false }, t + 0.4);
      return null;
    }
    if (mode === "gone") {
      PF.S("#mo_bsTg", { opacity: 1 }, t);
      pop("#mo_bsTg", t, CX + " " + (CY - 110), 0.3);
      return null;
    }
    // show: obrazovka testu naraz (bez pohybu pri bodke)
    PF.O("#mo_bsT", 0, 1, t, 0.2);
    R.clean("bseye", t + 0.25, 0);
    return null;
  };

  // ================= REZ OKOM (vety 5-6)
  var EX = 540, EY = 900, ER = 330, NX, NY, A0 = 65;
  function polar(r, a) { var q = a * Math.PI / 180; return [EX + r * Math.cos(q), EY + r * Math.sin(q)]; }
  function arc(r, a, b) { var p0 = polar(r, a), p1 = polar(r, b); return "M" + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + " A" + r + " " + r + " 0 " + (b - a > 180 ? 1 : 0) + " 1 " + p1[0].toFixed(1) + " " + p1[1].toFixed(1); }
  function buildBall() {
    if (st.bsb) return; st.bsb = true;
    var e = polar(306, A0), i, sn = "", rays = "", ph = "", s = "", fb = "";
    NX = Math.round(e[0]); NY = Math.round(e[1]);
    for (i = 22; i <= 158; i += 7) { if (Math.abs(i - A0) < 9) continue; var q = polar(286, i); sn += '<circle cx="' + q[0].toFixed(0) + '" cy="' + q[1].toFixed(0) + '" r="7"/>'; }
    var T = [[polar(306, 112), 380], [polar(306, 90), 540], [[NX, NY], 700]];
    T.forEach(function (r, j) {
      rays += '<path id="mo_bsR' + j + '" d="M' + r[1] + ' 140 L540 650 L' + r[0][0].toFixed(0) + ' ' + r[0][1].toFixed(0) + '" fill="none" stroke="#ffe27a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>';
      ph += '<circle id="mo_bsP' + j + '" cx="' + r[1] + '" cy="140" r="15" fill="#fff6c8" opacity="0"/>';
    });
    // terc (priblizenie): senzory okolo, vlakna v strede
    var rn = PF.rnd(48), DR = 290, DXc = 540, DYc = 900;
    for (var y = 470; y <= 1400; y += 58) {
      for (var x = 20 + ((y / 58) % 2) * 29; x <= 1070; x += 58) {
        var dd = Math.sqrt((x - DXc) * (x - DXc) + (y - DYc) * (y - DYc)); if (dd < DR + 34) continue;
        var rr = (rn() - 0.5) * 30;
        s += (rn() < 0.6) ? '<rect x="' + (x - 8) + '" y="' + (y - 22) + '" width="16" height="44" rx="8" fill="#8fb6e8" transform="rotate(' + rr.toFixed(0) + ' ' + x + ' ' + y + ')"/>' :
          '<path d="M' + x + ' ' + (y - 20) + ' L' + (x + 15) + ' ' + (y + 16) + ' H' + (x - 15) + ' Z" fill="#f2a65a" transform="rotate(' + rr.toFixed(0) + ' ' + x + ' ' + y + ')"/>';
      }
    }
    for (i = 0; i < 16; i++) {
      var a = i * 22.5 + (i % 2) * 7, p0 = [DXc + 282 * Math.cos(a * Math.PI / 180), DYc + 282 * Math.sin(a * Math.PI / 180)];
      var c1 = [DXc + 150 * Math.cos((a + 40) * Math.PI / 180), DYc + 150 * Math.sin((a + 40) * Math.PI / 180)];
      fb += '<path class="mo_bsF" d="M' + p0[0].toFixed(0) + ' ' + p0[1].toFixed(0) + ' Q' + c1[0].toFixed(0) + ' ' + c1[1].toFixed(0) + ' ' + DXc + ' ' + DYc + '" fill="none" stroke="#fff4c4" stroke-width="10" stroke-linecap="round" stroke-dasharray="34 22"/>';
    }
    screen("mo_bsE", "#1b2440",
      '<svg viewBox="0 0 1080 1920"><g id="mo_bsEg"><g id="mo_bsEgi">' +
      '<circle cx="' + EX + '" cy="' + EY + '" r="' + ER + '" fill="#fffdf8" stroke="' + INK + '" stroke-width="10"/>' +
      '<circle cx="' + EX + '" cy="' + EY + '" r="300" fill="#e7f2f8"/>' +
      '<path d="' + arc(306, 20, A0 - 8) + '" fill="none" stroke="#e8796f" stroke-width="26" stroke-linecap="round"/>' +
      '<path d="' + arc(306, A0 + 8, 160) + '" fill="none" stroke="#e8796f" stroke-width="26" stroke-linecap="round"/>' +
      '<g id="mo_bsSn" fill="#c2453c">' + sn + '</g>' +
      '<ellipse cx="540" cy="575" rx="150" ry="62" fill="#cfeaf7" stroke="' + INK + '" stroke-width="7"/>' +
      '<g fill="#4f8fc0" stroke="' + INK + '" stroke-width="5"><rect x="398" y="606" width="86" height="22" rx="8"/><rect x="596" y="606" width="86" height="22" rx="8"/></g>' +
      '<ellipse cx="540" cy="652" rx="96" ry="40" fill="#bfe3f5" stroke="' + INK + '" stroke-width="6"/>' +
      '<path d="M' + NX + ' ' + NY + ' C ' + (NX + 20) + ' ' + (NY + 60) + ' ' + (NX + 70) + ' ' + (NY + 100) + ' 820 ' + (NY + 106) + ' L1160 ' + (NY + 106) + '" fill="none" stroke="' + INK + '" stroke-width="88" stroke-linecap="round"/>' +
      '<path d="M' + NX + ' ' + NY + ' C ' + (NX + 20) + ' ' + (NY + 60) + ' ' + (NX + 70) + ' ' + (NY + 100) + ' 820 ' + (NY + 106) + ' L1160 ' + (NY + 106) + '" fill="none" stroke="#f2c230" stroke-width="70" stroke-linecap="round"/>' +
      '<path id="mo_bsNg" d="M' + NX + ' ' + NY + ' C ' + (NX + 20) + ' ' + (NY + 60) + ' ' + (NX + 70) + ' ' + (NY + 100) + ' 820 ' + (NY + 106) + ' L1160 ' + (NY + 106) + '" fill="none" stroke="#fff8d8" stroke-width="18" stroke-linecap="round" stroke-dasharray="40 50" opacity="0"/>' +
      rays + ph +
      '<g id="mo_bsSp" opacity="0"><circle cx="' + NX + '" cy="' + NY + '" r="38" fill="#08080c"/><g id="mo_bsSr"><circle cx="' + NX + '" cy="' + NY + '" r="66" fill="none" stroke="' + GOLD + '" stroke-width="8" stroke-dasharray="16 11"/></g></g>' +
      '<g id="mo_bsSl" opacity="0"><path id="mo_bsSlL" d="M' + (NX - 62) + ' ' + (NY + 30) + ' L430 1290" stroke="' + GOLD + '" stroke-width="6" stroke-linecap="round"/>' +
      '<text x="330" y="1360" style="font-family:Pop;font-weight:600;font-size:66px;text-anchor:middle;fill:' + GOLD + '">BLIND SPOT</text></g>' +
      '<text id="mo_bsNl" x="1050" y="' + (NY + 230) + '" opacity="0" style="font-family:Pop;font-weight:600;font-size:56px;text-anchor:end;fill:#f2c230">OPTIC NERVE</text>' +
      '</g></g>' +
      '<g id="mo_bsD" opacity="0"><g id="mo_bsDi"><g id="mo_bsDs">' + s + '</g>' +
      '<circle cx="' + DXc + '" cy="' + DYc + '" r="' + DR + '" fill="#f0c977" stroke="#c98a3a" stroke-width="12"/>' +
      '<circle cx="' + DXc + '" cy="' + DYc + '" r="70" fill="#e0a54f" opacity="0.7"/>' +
      '<g id="mo_bsDf">' + fb + '</g>' +
      '<circle id="mo_bsDr" cx="' + DXc + '" cy="' + DYc + '" r="' + (DR + 14) + '" fill="none" stroke="' + RED + '" stroke-width="10" stroke-dasharray="22 14" opacity="0"/>' +
      '<g id="mo_bsZ" opacity="0"><circle cx="' + DXc + '" cy="' + DYc + '" r="128" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="8"/>' +
      '<text x="' + DXc + '" y="' + (DYc + 66) + '" style="font-family:Pop;font-weight:600;font-size:190px;text-anchor:middle;fill:' + PAPER + '">0</text></g></g></g></svg>' +
      card("mo_bsCt", 200, '<span class="mo-lbl" style="color:' + RED + '">ABOUT</span><span id="mo_bsCd" style="display:block;font-size:128px;line-height:1.08">0</span><span class="mo-lbl">NERVE FIBERS</span>') +
      card("mo_bsZl", 1230, '<span style="font-size:60px">LIGHT SENSORS</span>'));
  }
  function fmtN(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  M.bsball = function (t, mode, t1, o) {
    o = o || {}; buildBall();
    var lt = left(t, t1), j, k;
    R.dirty("bsball", function (tt, d) {
      PF.O("#mo_bsE", 1, 0, tt, d ? 0.3 : 0.01);
      var z = tt + (d ? 0.32 : 0.02);
      PF.S("#mo_bsSp,#mo_bsSl,#mo_bsNl,#mo_bsNg,#mo_bsD,#mo_bsZ,#mo_bsDr,#mo_bsCt,#mo_bsZl", { opacity: 0 }, z);
      tl.set("#mo_bsEg", { scale: 1, x: 0, y: 0, opacity: 1 }, z);
      tl.set("#mo_bsCd", { innerHTML: "0" }, z); tl.set("#mo_bsDf", { opacity: 1 }, z);
    });
    if (mode === "blind") {
      PF.S("#mo_bsSp", { opacity: 1 }, t);
      pop("#mo_bsSp", t, NX + " " + NY, 0.2);
      tl.fromTo("#mo_bsSr", { rotation: 0, svgOrigin: NX + " " + NY }, { svgOrigin: NX + " " + NY, rotation: 240, duration: Math.max(1, lt + 1.5), ease: "none", immediateRender: false }, t);
      PF.S("#mo_bsSl", { opacity: 1 }, t + 0.2);
      PF.draw("mo_bsSlL", t + 0.2, 0.25);
      pop("#mo_bsSl", t + 0.2, "330 1340", 0.5);
      shake(t + 0.05, 0.25, 7);
      return null;
    }
    if (mode === "nerve") {
      PF.S("#mo_bsNg", { opacity: 0.85 }, t);
      var pn = 0.5, nn = Math.max(2, Math.ceil((lt + 1.5) / pn));
      tl.fromTo("#mo_bsNg", { attr: { "stroke-dashoffset": 0 } }, { attr: { "stroke-dashoffset": -90 }, duration: pn, ease: "none", repeat: nn - 1, immediateRender: false }, t);
      PF.S("#mo_bsNl", { opacity: 1 }, t + 0.1);
      pop("#mo_bsNl", t + 0.1, "870 " + (NY + 210), 0.4);
      return null;
    }
    if (mode === "zoom") {                   // let do vystupu nervu, potom terc
      tl.to("#mo_bsSl,#mo_bsNl", { opacity: 0, duration: 0.15, ease: "none" }, t);
      tl.fromTo("#mo_bsEg", { scale: 1, x: 0, y: 0, svgOrigin: NX + " " + NY }, { svgOrigin: NX + " " + NY, scale: 3.2, x: 540 - NX, y: 900 - NY, duration: 0.5, ease: "power2.in", immediateRender: false }, t);
      tl.fromTo("#mo_bsEg", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "none", immediateRender: false }, t + 0.4);
      PF.S("#mo_bsD", { opacity: 1 }, t + 0.38);
      tl.fromTo("#mo_bsDi", { scale: 0.45, svgOrigin: "540 900" }, { svgOrigin: "540 900", scale: 1, duration: 0.4, ease: "power2.out", immediateRender: false }, t + 0.38);
      var pf = 0.45, nf = Math.max(2, Math.ceil((lt + 0.5) / pf));
      tl.fromTo(".mo_bsF", { attr: { "stroke-dashoffset": 0 } }, { attr: { "stroke-dashoffset": 56 }, duration: pf, ease: "none", repeat: nf - 1, immediateRender: false }, t + 0.38);
      tl.fromTo("#mo_bsDs", { opacity: 1 }, { opacity: 0.6, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: (Math.max(1, Math.round(lt / 0.4)) | 1), immediateRender: false }, t + 0.5);
      return null;
    }
    if (mode === "count") {
      var d = Math.max(0.4, Math.min(o.dur || 1.0, lt - 0.3)), N = Math.max(2, Math.round(d * 30)), tgt = o.n || 1200000;
      PF.O("#mo_bsCt", 0, 1, t, 0.06); popH("#mo_bsCtIn", t);
      for (k = 1; k <= N; k++) { var f = k / N, ee = 1 - Math.pow(1 - f, 3); tl.set("#mo_bsCd", { innerHTML: fmtN(k === N ? tgt : Math.round(tgt * ee / 1000) * 1000) }, t + d * f); }
      tl.fromTo("#mo_bsCd", { scale: 1.25 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + d);
      PF.punch(t + d, 1.03);
      return null;
    }
    if (mode === "zero") {
      tl.fromTo("#mo_bsDf", { opacity: 1 }, { opacity: 0.3, duration: 0.2, ease: "none", immediateRender: false }, t);
      PF.S("#mo_bsZ", { opacity: 1 }, t);
      pop("#mo_bsZ", t, "540 900", 0.2);
      PF.S("#mo_bsDr", { opacity: 1 }, t + 0.1);
      tl.fromTo("#mo_bsDr", { scale: 1.12, svgOrigin: "540 900" }, { svgOrigin: "540 900", scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.1);
      tl.fromTo("#mo_bsDr", { rotation: 0, svgOrigin: "540 900" }, { svgOrigin: "540 900", rotation: 40, duration: Math.max(0.8, lt + 0.5), ease: "none", immediateRender: false }, t + 0.1);
      PF.O("#mo_bsZl", 0, 1, t + 0.25, 0.06); popH("#mo_bsZlIn", t + 0.25);
      shake(t + 0.05, 0.25, 8);
      return null;
    }
    // show: rez okom, luce, fotony
    PF.O("#mo_bsE", 0, 1, t, 0.25);
    tl.fromTo("#mo_bsEgi", { scale: 0.7, svgOrigin: "540 900" }, { svgOrigin: "540 900", scale: 1, duration: 0.45, ease: "back.out(1.8)", immediateRender: false }, t);
    for (j = 0; j < 3; j++) PF.draw("mo_bsR" + j, t + 0.2 + j * 0.12, 0.45);
    var T = [[polar(306, 112), 380], [polar(306, 90), 540], [[NX, NY], 700]], cyc = 0.9, tend = t + lt + 3.0;
    T.forEach(function (r, jj) {
      for (var c = 0; ; c++) {
        var ts = t + 0.75 + jj * 0.3 + c * cyc; if (ts + cyc > tend) break;
        var sel = "#mo_bsP" + jj;
        PF.S(sel, { opacity: 1 }, ts);
        tl.fromTo(sel, { attr: { cx: r[1], cy: 140 } }, { attr: { cx: 540, cy: 650 }, duration: cyc * 0.5, ease: "none", immediateRender: false }, ts);
        tl.fromTo(sel, { attr: { cx: 540, cy: 650 } }, { attr: { cx: r[0][0], cy: r[0][1] }, duration: cyc * 0.45, ease: "none", immediateRender: false }, ts + cyc * 0.5);
        PF.S(sel, { opacity: 0 }, ts + cyc * 0.95);
      }
    });
    tl.fromTo("#mo_bsSn", { opacity: 1 }, { opacity: 0.55, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: (Math.max(1, Math.round((lt + 2) / 0.3)) | 1), immediateRender: false }, t + 0.8);
    R.clean("bstest", t + 0.3, 0);
    return null;
  };

  // ================= NOCNA OBLOHA, MESIACE, MOZOG S VALCEKOM (vety 7-8)
  var OX = 540, OY = 900, ORX = 470, ORY = 210, MR = 38;
  function stars(seed) {
    var rn = PF.rnd(seed), a = "", b = "", i;
    for (i = 0; i < 90; i++) {
      var x = Math.round(rn() * 1080), y = Math.round(380 + rn() * 1100), r = (1.8 + rn() * 3.6).toFixed(1);
      var s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
      if (i % 2) a += s; else b += s;
    }
    return [a, b];
  }
  function buildSky() {
    if (st.bss) return; st.bss = true;
    var S = stars(77), i, mo = "";
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<clipPath id="mo_bsOc"><ellipse cx="' + OX + '" cy="' + OY + '" rx="' + (ORX + 3) + '" ry="' + (ORY + 3) + '"/></clipPath>' +
      '<clipPath id="mo_bsPc"><rect id="mo_bsPr" x="' + (OX - ORX - 10) + '" y="' + (OY - ORY - 10) + '" width="0" height="' + (2 * ORY + 20) + '"/></clipPath>');
    var sky = '<rect x="0" y="0" width="1080" height="1920" fill="#141c3a"/>';
    var st1 = '<g fill="#fdf6d8">' + S[0] + '</g>', st2 = '<g fill="#fdf6d8">' + S[1] + '</g>';
    for (i = 0; i < 11; i++) {
      var x = OX - 448 + MR + i * 82;
      mo += '<g id="mo_bsM' + i + '" opacity="0"><g id="mo_bsMi' + i + '"><circle cx="' + x + '" cy="' + OY + '" r="' + MR + '" fill="#f6ecc4" stroke="#d8c690" stroke-width="3"/>' +
        '<circle cx="' + (x - 12) + '" cy="' + (OY - 10) + '" r="9" fill="#e4d39e"/><circle cx="' + (x + 13) + '" cy="' + (OY + 12) + '" r="6" fill="#e4d39e"/><circle cx="' + (x + 8) + '" cy="' + (OY - 18) + '" r="4" fill="#e4d39e"/></g></g>';
    }
    var roller = '<g id="mo_bsB" opacity="0"><g id="mo_bsBi">' +
      '<g transform="translate(' + (0 - 540) + ' ' + (470 - 705) + ')">' + brainSvg("mo_bsBb") + '</g>' +
      '<path d="M0 548 V' + (OY - ORY - 34) + '" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/>' +
      '<rect x="-36" y="' + (OY - ORY - 34) + '" width="72" height="' + (2 * ORY + 68) + '" rx="28" fill="#f2c230" stroke="' + INK + '" stroke-width="8"/>' +
      '<g id="mo_bsBs" stroke="#c9961d" stroke-width="8"><path d="M-30 ' + (OY - 200) + ' h60 M-30 ' + (OY - 120) + ' h60 M-30 ' + (OY - 40) + ' h60 M-30 ' + (OY + 40) + ' h60 M-30 ' + (OY + 120) + ' h60 M-30 ' + (OY + 200) + ' h60"/></g>' +
      '</g></g>';
    screen("mo_bsS", "#141c3a",
      '<svg viewBox="0 0 1080 1920">' + sky + '<g id="mo_bsS1">' + st1 + '</g><g id="mo_bsS2">' + st2 + '</g>' +
      '<ellipse id="mo_bsOh" cx="' + OX + '" cy="' + OY + '" rx="' + ORX + '" ry="' + ORY + '" fill="#020308" opacity="0"/>' +
      '<g clip-path="url(#mo_bsPc)"><g clip-path="url(#mo_bsOc)">' + sky + st1 + st2 + '</g></g>' +
      mo +
      '<ellipse id="mo_bsO" cx="' + OX + '" cy="' + OY + '" rx="' + ORX + '" ry="' + ORY + '" fill="none" stroke="' + GOLD + '" stroke-width="8" stroke-dasharray="26 16" opacity="0"/>' +
      '<text id="mo_bsOl" x="' + OX + '" y="' + (OY - ORY - 46) + '" opacity="0" style="font-family:Hand;font-weight:700;font-size:56px;letter-spacing:4px;text-anchor:middle;fill:' + GOLD + '">YOUR BLIND SPOT</text>' +
      roller + '</svg>' +
      card("mo_bsMc", 230, '<span style="font-size:76px">10+ FULL MOONS</span>'));
  }
  M.bssky = function (t, mode, t1, o) {
    o = o || {}; buildSky();
    var lt = left(t, t1), i;
    R.dirty("bssky", function (tt, d) {
      PF.O("#mo_bsS", 1, 0, tt, d ? 0.3 : 0.01);
      var z = tt + (d ? 0.32 : 0.02);
      PF.S("#mo_bsOh,#mo_bsO,#mo_bsOl,#mo_bsB,#mo_bsMc", { opacity: 0 }, z);
      for (var q = 0; q < 11; q++) PF.S("#mo_bsM" + q, { opacity: 0 }, z);
      tl.set("#mo_bsPr", { attr: { width: 0 } }, z);
    });
    if (mode === "moons") {                  // 11 mesiacov vklzne do ovalu jeden po druhom
      var gap = Math.max(0.08, Math.min(0.13, (lt - 0.5) / 11));
      for (i = 0; i < 11; i++) {
        var ti = t + i * gap;
        PF.S("#mo_bsM" + i, { opacity: 1 }, ti);
        tl.fromTo("#mo_bsMi" + i, { x: 1180 - (OX - 448 + MR + i * 82), y: -60 }, { x: 0, y: 0, duration: 0.34, ease: "back.out(1.6)", immediateRender: false }, ti);
      }
      tl.fromTo("#mo_bsO", { attr: { "stroke-width": 8 } }, { attr: { "stroke-width": 14 }, duration: 0.15, ease: "none", yoyo: true, repeat: 1, immediateRender: false }, t + 11 * gap + 0.2);
      return null;
    }
    if (mode === "card") {
      PF.O("#mo_bsMc", 0, 1, t, 0.06); popH("#mo_bsMcIn", t);
      PF.punch(t + 0.1, 1.02);
      return null;
    }
    if (mode === "hole") {                   // mesiace prec, oval je cierna diera
      for (i = 0; i < 11; i++) PF.O("#mo_bsM" + i, 1, 0, t + i * 0.025, 0.18);
      PF.O("#mo_bsMc", 1, 0, t, 0.15);
      PF.O("#mo_bsOh", 0, 1, t + 0.1, 0.3);
      return null;
    }
    if (mode === "brain") {                  // mozog s valcekom pride zlava k ovalu
      PF.O("#mo_bsOl", 1, 0, t, 0.15);
      PF.S("#mo_bsB", { opacity: 1 }, t);
      tl.fromTo("#mo_bsBi", { x: -260 }, { x: OX - ORX + 4, duration: 0.45, ease: "back.out(1.4)", immediateRender: false }, t);
      tl.fromTo("#mo_bsBbE", { scaleY: 1, svgOrigin: "540 724" }, { svgOrigin: "540 724", scaleY: 0.1, duration: 0.07, ease: "none", yoyo: true, repeat: 1, immediateRender: false }, t + 0.55);
      return null;
    }
    if (mode === "paint") {                  // valcek prejde ovalom a za nim su hviezdy
      var d = Math.max(0.6, Math.min(o.dur || 1.6, lt - 0.1)), x0 = OX - ORX + 4, x1 = OX + ORX + 6;
      tl.fromTo("#mo_bsBi", { x: x0 }, { x: x1, duration: d, ease: "sine.inOut", immediateRender: false }, t);
      PF.AT("#mo_bsPr", { width: 0 }, { width: x1 - (OX - ORX - 10) }, t, d, "sine.inOut");
      tl.fromTo("#mo_bsBs", { y: 0 }, { y: 80, duration: 0.25, ease: "none", repeat: Math.max(1, Math.round(d / 0.25)) - 1, immediateRender: false }, t);
      tl.fromTo("#mo_bsBi", { rotation: 0, svgOrigin: "0 900" }, { svgOrigin: "0 900", rotation: 3, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: (Math.max(1, Math.round(d / 0.2)) | 1), immediateRender: false }, t);
      return null;
    }
    if (mode === "done") {                   // obrys zmizne, mozog odide
      PF.O("#mo_bsO", 1, 0, t, 0.3);
      var te = Math.max(t + 0.05, Math.min(t + 0.25, t + lt - 0.5));
      tl.fromTo("#mo_bsBi", { y: 0 }, { y: -40, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, t);
      PF.O("#mo_bsB", 1, 0, te + 0.2, 0.2);
      return null;
    }
    // show: obloha a oval
    PF.O("#mo_bsS", 0, 1, t, 0.25);
    PF.S("#mo_bsO", { opacity: 1 }, t + 0.2);
    PF.draw("mo_bsO", t + 0.2, 0.5);
    tl.set("#mo_bsO", { attr: { "stroke-dasharray": "26 16", "stroke-dashoffset": 0 } }, t + 0.72);
    PF.O("#mo_bsOl", 0, 1, t + 0.45, 0.2);
    if (PF.VO.total > 0) {
      var tw = 0.6, nt = Math.max(1, Math.round((lt + 7) / tw));
      tl.fromTo("#mo_bsS1", { opacity: 1 }, { opacity: 0.35, duration: tw, ease: "sine.inOut", yoyo: true, repeat: (nt | 1), immediateRender: false }, t);
      tl.fromTo("#mo_bsS2", { opacity: 0.4 }, { opacity: 1, duration: tw * 1.3, ease: "sine.inOut", yoyo: true, repeat: (Math.round(nt / 1.3) | 1), immediateRender: false }, t);
    }
    R.clean("bsball", t + 0.3, 0);
    return null;
  };
})();
