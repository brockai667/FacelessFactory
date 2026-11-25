// pack_carsink.js - momenty pre video 043 Car Sinking In Water
// cscar  "" = nocna rieka od snimku 0: auto z boku na vode, hrdina za volantom, dieta vzadu, voda vlni; bez dirty
//        "sink" = bubliny + auto sa zhupne; "fill" = dvere priesvitne, voda vnutri stupa od podlahy (dirty csfill)
//        "push" = hrdina tlaci na dvere, nepohnu sa (cspose); "press" = sipky vody tlacia na dvere (cspress); "lock" = zamok
//        "deep" = auto klesa: breh a mesiac odidu hore, voda nad strechu, tma, bubliny, metr (csdeep)
//        "fillall" = vnutri voda az pod strechu; "breath" = bublina 1 BREATH, hlava hore
//        "reset" = blesk, vsetko spat na hladinu; "glow" = okno zeleno blika (csglow); "rise" = hladina pomaly stupa k oknu (cslvl, o.to, o.dur)
//        "belt" = pas sa odopne a zroluje (csbelt); "down" = sklo zide dole (csglass); "power" = palubovka svieti
//        "arrow" = sipka von oknom (csarrow); "kid" = dieta vylezie na strechu (cskid); "out" = hrdina vylezie (cspose)
//        "spent" = voda zaleje okno (cslvl); "cam" = kamera na ramec auta; "outro" = upratanie pred navratom na hook
// csface  vyraz tvare bez pohybu kamery
// cscard  "" = karta Severna Amerika, auticka; "count" = ABOUT 400 (dirty cscard)
// csclock "" = karta ABOUT A MINUTE s pruhom, "go" = pruh ubuda (o.to, o.dur), "zero" = pruh na nulu, cerveny (csclock)
// csphone "" = telefon; "x" = preskrtnuty (csphone)
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake, uid = H.uid;
  var INK = "#2b2320", RED = "#d9483b", GREEN = "#3fa35b";
  var CP = { tx: 0, ty: 40, s: 0.6, r: 0 };            // hrdina za volantom (snimok 0 = posledny)
  var W0 = 1180;                                        // hladina vonku na snimku 0
  var IW0 = 1345;                                       // hladina vnutri (pod podlahou = nevidno)
  function TOT() { return PF.VO.total || 30; }
  function loopTo(sel, from, to, per) {
    if (!(PF.VO.total > 0)) return;
    var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, from, Object.assign({}, to, { duration: p, ease: "none", repeat: n - 1, immediateRender: false }), 0);
  }
  function yoyo(sel, from, to, per) {
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, from, Object.assign({}, to, { duration: p / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * n - 1, immediateRender: false }), 0);
  }
  function flash(t, a) { tl.fromTo("#mo_flash", { opacity: a || 0.7 }, { opacity: 0, duration: 0.25, ease: "power1.out", immediateRender: false }, t); }
  function cdur(t, t1, d) { return Math.max(0.15, Math.min(d, (t1 || t + d + 1) - t - 0.15)); }

  // ---------- kresby
  var WIN_F = "M338 1075 L396 822 L636 818 L636 1075 Z";
  var WIN_R = "M672 1075 L672 818 L866 822 L934 1075 Z";
  function wave(y, amp, col, w) {                      // periodicka vlna (perioda 200 px)
    var d = "M-400 " + y, x;
    for (x = -400; x < 1600; x += 200) d += " q50 " + (-amp) + " 100 0 t100 0";
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }
  function kid(id) {
    return '<g id="' + id + '"><rect x="738" y="1010" width="94" height="120" rx="34" fill="#4f8fd9" stroke="#3a6fae" stroke-width="5"/>' +
      '<circle cx="785" cy="958" r="50" fill="#e3ae82" stroke="#c68b5e" stroke-width="4"/>' +
      '<path d="M735 952 Q740 900 785 902 Q832 900 836 950 Q812 930 790 934 Q760 930 735 952 Z" fill="#6b3f22"/>' +
      '<circle cx="767" cy="966" r="7" fill="' + INK + '"/><circle cx="803" cy="966" r="7" fill="' + INK + '"/>' +
      '<ellipse cx="785" cy="992" rx="9" ry="7" fill="' + INK + '"/>' +
      '<g id="' + id + 'A"><path d="M748 1030 L716 1110" stroke="#4f8fd9" stroke-width="22" stroke-linecap="round"/><path d="M822 1030 L852 1110" stroke="#4f8fd9" stroke-width="22" stroke-linecap="round"/></g></g>';
  }
  function build() {
    if (st.cs) return st.cs;
    var Hh = C().hero, p = Hh.p, bg = "", i, stars = "", trees = "";
    ["fd_B", "fd_M", "fd_F"].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.display = "none"; });
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_csSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a33"/><stop offset="0.6" stop-color="#25335a"/><stop offset="1" stop-color="#3b4a72"/></linearGradient>' +
      '<linearGradient id="mo_csRiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3a52"/><stop offset="1" stop-color="#10283c"/></linearGradient>' +
      '<linearGradient id="mo_csWat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f86a8"/><stop offset="0.35" stop-color="#1d5f80"/><stop offset="1" stop-color="#0d2f45"/></linearGradient>' +
      '<clipPath id="mo_csCab"><path d="M338 1075 L396 816 L866 816 L934 1075 L940 1330 L332 1330 Z"/></clipPath>' +
      '<clipPath id="mo_csWinC"><path d="' + WIN_F + '"/></clipPath>');
    // pozadie: obloha, hviezdy, mesiac, breh so stromami a zabradlim, rieka
    var rs = PF.rnd(43);
    for (i = 0; i < 26; i++) stars += '<circle cx="' + (rs() * 1080).toFixed(0) + '" cy="' + (60 + rs() * 560).toFixed(0) + '" r="' + (2 + rs() * 3).toFixed(1) + '" fill="#f4efd9" opacity="' + (0.4 + rs() * 0.5).toFixed(2) + '"/>';
    for (i = 0; i < 16; i++) { var tx = -60 + i * 78; trees += '<path d="M' + tx + ' 690 L' + (tx + 40) + ' ' + (560 + (i % 3) * 30) + ' L' + (tx + 80) + ' 690 Z" fill="#141d2c"/>'; }
    bg += '<rect x="-600" y="-900" width="2280" height="1700" fill="url(#mo_csSky)"/>' + stars;
    bg += '<circle cx="850" cy="330" r="74" fill="#f6eecb"/><circle cx="822" cy="312" r="14" fill="#e3d9ae"/><circle cx="872" cy="352" r="10" fill="#e3d9ae"/>';
    bg += trees + '<rect x="-600" y="684" width="2280" height="40" fill="#1a2433"/>';
    bg += '<g stroke="#8a94a6" stroke-width="7"><path d="M-40 650 H330"/><path d="M330 650 L410 690"/>' + [0, 1, 2, 3, 4].map(function (k) { return '<path d="M' + (k * 80) + ' 650 V690"/>'; }).join("") + '</g>';
    bg += '<rect x="-600" y="722" width="2280" height="3600" fill="url(#mo_csRiv)"/>';
    var back = '<g id="mo_csBg">' + bg + '</g>' +
      '<g clip-path="url(#mo_csCab)"><rect x="300" y="790" width="680" height="560" fill="#262c3a"/>' +
      '<rect x="452" y="905" width="190" height="330" rx="48" fill="#4a4048"/><rect x="700" y="925" width="200" height="300" rx="44" fill="#4a4048"/>' +
      '<rect x="340" y="1010" width="88" height="40" rx="10" fill="#1b2029"/><g id="mo_csPw" opacity="0.25"><circle cx="384" cy="1030" r="14" fill="#ffd34d"/><path d="M386 1016 L376 1032 L388 1032 L380 1046" fill="none" stroke="#1b2029" stroke-width="4"/></g></g>' +
      // ramec (strecha a stlpiky) - ZA hrdinom, aby mohol vyliezt von
      '<g id="mo_csFr"><path d="M330 1078 L392 812 Q396 798 418 798 L846 798 Q868 800 876 816 L942 1078" fill="none" stroke="#c9503f" stroke-width="30" stroke-linejoin="round"/>' +
      '<path d="M330 1078 L392 812 Q396 798 418 798 L846 798 Q868 800 876 816 L942 1078" fill="none" stroke="#9c3b2f" stroke-width="5" stroke-linejoin="round"/>' +
      '<rect x="638" y="806" width="32" height="272" fill="#c9503f" stroke="#9c3b2f" stroke-width="5"/></g>' +
      '<g id="mo_csKidW">' + kid("mo_csKid") + '</g>';
    var water = "", tuft = "";
    var front = '<g id="mo_csCush"><rect x="430" y="1185" width="240" height="70" rx="26" fill="#4a4048"/></g>' +
      // vnutorna voda
      '<g clip-path="url(#mo_csCab)"><g id="mo_csIw"><rect x="300" y="0" width="700" height="700" fill="#2f86a8" opacity="0.62"/>' +
      '<g id="mo_csIwV">' + wave(0, 10, "#9fd8ef", 8) + '</g></g></g>' +
      // pas (od snimku 0)
      '<g id="mo_csBelt"><path id="mo_csBeltP" d="M656 962 L452 1066" stroke="#3a3f48" stroke-width="22" stroke-linecap="round"/>' +
      '<g id="mo_csBk"><rect x="430" y="1050" width="40" height="30" rx="6" fill="#c9ccd2" stroke="' + INK + '" stroke-width="4"/></g></g>' +
      // sklo predneho okna (od snimku 0)
      '<g clip-path="url(#mo_csWinC)"><g id="mo_csGl"><path d="' + WIN_F + '" fill="#cfe7f5" opacity="0.22"/>' +
      '<path d="M430 1060 L520 830 L560 830 L470 1060 Z M500 1060 L590 830 L606 830 L516 1060 Z" fill="#ffffff" opacity="0.28"/>' +
      '<path d="M338 1072 H636" stroke="#e8f4fb" stroke-width="6" opacity="0.6"/></g></g>' +
      '<path d="' + WIN_R + '" fill="#cfe7f5" opacity="0.16"/>' +
      '<g id="mo_csWg" opacity="0"><path d="' + WIN_F + '" fill="#5fd08a" fill-opacity="0.14" stroke="#5fd08a" stroke-width="12" stroke-dasharray="30 16" stroke-linejoin="round"/></g>' +
      // spodok auta (kapota, dvere, kufor)
      '<g id="mo_csDoor"><path d="M92 1104 Q92 1066 142 1062 L332 1058 L332 1075 L942 1075 L942 1060 L984 1064 Q1012 1070 1012 1112 L1012 1298 Q1012 1338 972 1338 L132 1338 Q92 1338 92 1298 Z" fill="#c9503f" stroke="#9c3b2f" stroke-width="8"/>' +
      '<path d="M100 1215 H1004" stroke="#9c3b2f" stroke-width="6"/><path d="M654 1080 V1330 M338 1080 Q330 1200 352 1330" stroke="#9c3b2f" stroke-width="6" fill="none"/>' +
      '<rect x="560" y="1110" width="62" height="16" rx="8" fill="#7f2e25"/><rect x="866" y="1110" width="62" height="16" rx="8" fill="#7f2e25"/>' +
      '<rect x="92" y="1110" width="30" height="46" rx="10" fill="#ffd98a"/><rect x="986" y="1110" width="26" height="46" rx="8" fill="#ff8a7a"/></g>' +
      '<g id="mo_csDoorX" opacity="0"><path d="M338 1078 L942 1078 L942 1330 L338 1330 Z" fill="none" stroke="#ffd34d" stroke-width="8" stroke-dasharray="24 14"/></g>' +
      '<circle cx="232" cy="1345" r="72" fill="' + INK + '"/><circle cx="232" cy="1345" r="34" fill="#8f979f"/><circle cx="862" cy="1345" r="72" fill="' + INK + '"/><circle cx="862" cy="1345" r="34" fill="#8f979f"/>' +
      '<g id="mo_csKidF" opacity="0">' + kid("mo_csKid2") + '</g>' +
      '<g id="mo_csLk" opacity="0"><g id="mo_csLkIn"><path d="M572 1150 V1126 Q572 1094 600 1094 Q628 1094 628 1126 V1150" fill="none" stroke="#fbf5ea" stroke-width="12"/>' +
      '<rect x="556" y="1146" width="88" height="70" rx="12" fill="' + RED + '" stroke="#fbf5ea" stroke-width="6"/><circle cx="600" cy="1176" r="9" fill="#fbf5ea"/></g></g>';
    // vonkajsia voda (hladina = ty skupiny)
    water = '<g id="mo_csW"><rect x="-600" y="0" width="2280" height="2600" fill="url(#mo_csWat)" opacity="0.6"/>' +
      '<g id="mo_csWv">' + wave(0, 14, "#bfe8f7", 9) + '</g><g id="mo_csWv2" opacity="0.6">' + wave(34, 8, "#7cc3df", 6) + '</g></g>';
    // sipky tlaku
    var A = [[318, 1200, 0], [520, 1300, -90], [780, 1300, -90], [420, 1275, -40], [880, 1275, -140]];
    var arrows = A.map(function (a, k) { return '<g transform="translate(' + a[0] + ' ' + a[1] + ') rotate(' + a[2] + ')"><g id="mo_csA' + k + '"><path d="M-190 -28 L-80 -28 L-80 -64 L0 0 L-80 64 L-80 28 L-190 28 Z" fill="#5fb6e0" stroke="#fbf5ea" stroke-width="7" stroke-linejoin="round"/></g></g>'; }).join("");
    var fx = '<g id="mo_csPr" opacity="0">' + arrows + '</g>' +
      '<rect id="mo_csDk" x="-600" y="-900" width="2280" height="3600" fill="#06121f" opacity="0"/>' +
      '<g id="mo_csRu" opacity="0"><rect x="14" y="300" width="58" height="1180" rx="10" fill="#0d2233" opacity="0.7" stroke="#bfe8f7" stroke-width="4"/>' +
      '<clipPath id="mo_csRuC"><rect x="14" y="300" width="58" height="1180"/></clipPath><g clip-path="url(#mo_csRuC)"><g id="mo_csRuT">' +
      (function () { var s = ""; for (var k = 0; k < 30; k++) s += '<path d="M14 ' + (300 + k * 80) + ' h' + (k % 2 ? 26 : 46) + '" stroke="#bfe8f7" stroke-width="6"/>'; return s; })() + '</g></g>' +
      '<path d="M43 220 V280 M22 258 L43 284 L64 258" fill="none" stroke="#bfe8f7" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<g id="mo_csAir" opacity="0"><g id="mo_csAirIn"><path d="M640 640 Q640 560 760 560 Q900 560 900 640 Q900 712 772 712 L736 760 L734 712 Q640 712 640 640 Z" fill="#fbf5ea" stroke="#2f86a8" stroke-width="7" stroke-dasharray="20 10"/>' +
      '<text x="770" y="658" style="font-family:Pop;font-weight:600;font-size:52px;text-anchor:middle;fill:#1d5f80">1 BREATH</text></g></g>' +
      '<g id="mo_csAr" opacity="0"><path id="mo_csArP" d="M500 1000 Q470 820 520 640" fill="none" stroke="#5fd08a" stroke-width="18" stroke-dasharray="34 20" stroke-linecap="round"/>' +
      '<path d="M484 676 L522 616 L560 678" fill="none" stroke="#5fd08a" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<g id="mo_csBub"></g>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_csBack">' + back + '</g>');
    document.getElementById(p + "float").insertAdjacentHTML("afterend", '<g id="mo_csFront">' + front + water + fx + '</g>');
    loopTo("#mo_csWv", { x: 0 }, { x: -200 }, 1.6);
    loopTo("#mo_csWv2", { x: -200 }, { x: 0 }, 2.4);
    loopTo("#mo_csIwV", { x: 0 }, { x: -200 }, 1.3);
    PF.P("mo_csW", 540, 0, { ty: W0 });
    PF.P("mo_csIw", 540, 0, { ty: IW0 });
    PF.P("mo_csBg", 540, 700, {});
    PF.P("mo_csGl", 490, 950, {});
    PF.P("mo_csKidW", 785, 1060, {});
    PF.P("mo_csKidF", 785, 1060, {});
    PF.X(p + "float", CP, 0, 0);
    PF.S("#" + p + "legs", { opacity: 0 }, 0);
    Hh.shadow(false, 0);
    st.cs = { w: W0, iw: IW0 };
    return st.cs;
  }
  function setW(t, y, d, ease) {
    var S = build(); PF.X("mo_csW", { ty: y }, t, d, ease || "power1.inOut"); S.w = y;
    R.dirty("cslvl", function (tt, dd) { PF.X("mo_csW", { ty: W0 }, tt, dd ? 0.3 : 0); S.w = W0; });
  }
  function setIW(t, y, d) {
    var S = build(); PF.X("mo_csIw", { ty: y }, t, d, "power1.inOut"); S.iw = y;
    R.dirty("csfill", function (tt, dd) { PF.X("mo_csIw", { ty: IW0 }, tt, dd ? 0.3 : 0); S.iw = IW0; PF.O("#mo_csDoor", 0.3, 1, tt, dd ? 0.2 : 0.01); PF.O("#mo_csDoorX", 1, 0, tt, dd ? 0.2 : 0.01); });
  }
  function poseReg() {
    var Hh = C().hero, p = Hh.p, a0 = C().arms0;
    R.dirty("cspose", function (tt, d) {
      PF.X(p + "float", CP, tt, d ? 0.3 : 0); Hh.arm("L", a0[0], tt, d ? 0.3 : 0.01); Hh.arm("R", a0[1], tt, d ? 0.3 : 0.01);
      PF.X(p + "head", { r: 0 }, tt, d ? 0.3 : 0); Hh.look(0, 0, tt, d ? 0.2 : 0); Hh.eyes("eyesN", tt);
    });
  }
  function bubbles(t, n, x0, x1, y0, rise, dur, seed) {
    var g = document.getElementById("mo_csBub"), rr = PF.rnd(seed || 7), k;
    for (k = 0; k < n; k++) {
      var id = uid("mo_csBb"), x = x0 + rr() * (x1 - x0), r = 8 + rr() * 16, dt = rr() * 0.5;
      g.insertAdjacentHTML("beforeend", '<circle id="' + id + '" cx="' + x.toFixed(0) + '" cy="' + (y0 + rr() * 60).toFixed(0) + '" r="' + r.toFixed(0) + '" fill="#bfe8f7" fill-opacity="0.25" stroke="#e8f7fd" stroke-width="4" opacity="0"/>');
      tl.fromTo("#" + id, { y: 0, opacity: 0.95 }, { y: -rise * (0.7 + rr() * 0.5), opacity: 0, duration: dur, ease: "power1.in", immediateRender: false }, t + dt);
    }
  }

  M.cscar = function (t, mode, t1, o) {
    o = o || {}; var S = build(), Hh = C().hero, p = Hh.p, a0 = C().arms0;
    if (mode === "sink") {
      bubbles(t, 12, 200, 960, 1170, 520, 1.1, 11);
      PF.XY("mo_csW", { ty: W0 - 36 }, t, 0.35, "sine.inOut", 1);
      shake(t, 0.35, 7); R.setFace(t, "shocked");
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? 0.2 : 0); });
      return null;
    }
    if (mode === "fill") {
      PF.O("#mo_csDoor", 1, 0.3, t, 0.3); PF.O("#mo_csDoorX", 0, 1, t, 0.3);
      setIW(t + 0.1, o.to || 1130, cdur(t, t1, o.dur || 1.4));
      bubbles(t + 0.1, 8, 380, 900, 1290, 200, 0.9, 5);
      return null;
    }
    if (mode === "push") {                                 // tlaci na dvere, nic
      Hh.arm("R", -95, t, 0.18, "power2.out");
      PF.XY(p + "up", { tx: 10 }, t + 0.2, 0.08, "sine.inOut", 5);
      R.setFace(t + 0.1, "angry"); Hh.arm("R", -70, t + 0.75, 0.15);
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? 0.2 : 0); });
      poseReg();
      return null;
    }
    if (mode === "press") {
      PF.O("#mo_csPr", 0, 1, t, 0.08);
      [0, 1, 2, 3, 4].forEach(function (k) {
        tl.fromTo("#mo_csA" + k, { x: -220 }, { x: 0, duration: 0.32, ease: "power3.in", immediateRender: false }, t + k * 0.05);
        tl.fromTo("#mo_csA" + k, { x: 0 }, { x: -18, duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, Math.floor(((t1 || t + 3) - t - 0.8) / 0.22)) | 1, immediateRender: false }, t + 0.45 + k * 0.05);
      });
      PF.punch(t + 0.32, 1.03); shake(t + 0.32, 0.25, 8);
      Hh.arm("R", -95, t + 0.4, 0.15); PF.XY(p + "up", { tx: 12 }, t + 0.5, 0.07, "sine.inOut", 7);
      poseReg();
      R.dirty("cspress", function (tt, d) { PF.O("#mo_csPr", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_csLk", 1, 0, tt, d ? 0.15 : 0.01); });
      return null;
    }
    if (mode === "lock") {
      PF.O("#mo_csLk", 0, 1, t, 0.05);
      tl.fromTo("#mo_csLkIn", { scale: 2.4, svgOrigin: "600 1160" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, t);
      PF.punch(t + 0.16, 1.03);
      R.setFace(t + 0.1, "worried"); Hh.arm("R", a0[1], t + 0.2, 0.3);
      return null;
    }
    if (mode === "deep") {                                 // auto klesa
      var d = cdur(t, t1, o.dur || 1.6);
      PF.X("mo_csBg", { ty: -1000 }, t, d, "power1.in");
      setW(t, -400, d, "power1.in");
      PF.O("#mo_csDk", 0, 0.28, t, d);
      PF.O("#mo_csRu", 0, 1, t, 0.2);
      tl.fromTo("#mo_csRuT", { y: 0 }, { y: -640, duration: Math.max(1, (t1 || t + 3) - t - 0.2), ease: "power1.out", immediateRender: false }, t);
      var n = Math.max(1, Math.floor(((t1 || t + 3) - t) / 0.9));
      for (var k = 0; k < n; k++) bubbles(t + 0.3 + k * 0.9, 6, 120, 980, 1250, 900, 1.3, 20 + k);
      R.dirty("csdeep", function (tt, dd) {
        PF.X("mo_csBg", { ty: 0 }, tt, dd ? 0.3 : 0); PF.O("#mo_csDk", 0.28, 0, tt, dd ? 0.2 : 0.01); PF.O("#mo_csRu", 1, 0, tt, dd ? 0.2 : 0.01);
        PF.O("#mo_csAir", 1, 0, tt, dd ? 0.2 : 0.01);
      });
      return null;
    }
    if (mode === "fillall") {
      PF.O("#mo_csDoor", 1, 0.3, t, 0.25); PF.O("#mo_csDoorX", 0, 1, t, 0.25);
      setIW(t, o.to || 1000, cdur(t, t1, o.dur || 1.0));
      return null;
    }
    if (mode === "breath") {
      PF.O("#mo_csAir", 0, 1, t, 0.06);
      tl.fromTo("#mo_csAirIn", { scale: 0.3, svgOrigin: "736 740" }, { scale: 1, duration: 0.3, ease: "back.out(2.2)", immediateRender: false }, t);
      PF.X(p + "head", { r: -10 }, t, 0.3); Hh.look(0, -12, t, 0.2); R.setFace(t, "worried");
      Hh.mouth("none", t + 0.1);
      R.dirty("face", function (tt, dd) { R.setFace(tt, C().face0, dd ? 0.2 : 0); });
      poseReg();
      return null;
    }
    if (mode === "reset") {                                // spat na hladinu
      flash(t - 0.02, 0.85);
      ["csdeep", "csfill", "cspress", "cspose", "cslvl", "face"].forEach(function (k) { R.clean(k, t, 0); }); R.clean("cscard", t, 0.15);
      return null;
    }
    if (mode === "glow") {
      PF.O("#mo_csWg", 0, 1, t, 0.1);
      tl.fromTo("#mo_csWg", { opacity: 1 }, { opacity: 0.45, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.15);
      PF.S("#mo_csWg", { opacity: 1 }, t + 1.66);
      R.dirty("csglow", function (tt, d) { PF.O("#mo_csWg", 1, 0, tt, d ? 0.15 : 0.01); });
      return null;
    }
    if (mode === "rise") { setW(t, o.to || 1100, o.dur || 6, "none"); return null; }
    if (mode === "belt") {                                 // odopnut: pracka odskoci, pas sa zroluje k stlpiku
      Hh.arm("L", 40, t - 0.25, 0.2); Hh.arm("L", a0[0], t + 0.35, 0.25);
      tl.fromTo("#mo_csBk", { y: 0, rotation: 0, svgOrigin: "450 1065" }, { y: -24, rotation: -30, duration: 0.18, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo("#mo_csBeltP", { attr: { d: "M656 962 L452 1066" } }, { attr: { d: "M656 962 L652 966" }, duration: 0.35, ease: "power2.in", immediateRender: false }, t + 0.1);
      PF.O("#mo_csBk", 1, 0, t + 0.3, 0.12);
      PF.punch(t + 0.1, 1.02);
      R.dirty("csbelt", function (tt, d) { PF.S("#mo_csBeltP", { attr: { d: "M656 962 L452 1066" } }, tt); PF.S("#mo_csBk", { y: 0, rotation: 0, opacity: 1 }, tt); });
      return null;
    }
    if (mode === "down") {                                 // prst na spinac, sklo dole
      Hh.arm("R", -60, t - 0.2, 0.15); Hh.arm("R", a0[1], t + 0.6, 0.25);
      PF.X("mo_csGl", { ty: 270 }, t, 0.7, "power1.inOut");
      R.clean("csglow", t + 0.7, 0.2);
      R.dirty("csglass", function (tt, d) { PF.X("mo_csGl", { ty: 0 }, tt, d ? 0.3 : 0); });
      return null;
    }
    if (mode === "power") {
      tl.fromTo("#mo_csPw", { opacity: 0.25 }, { opacity: 1, duration: 0.12, ease: "none", yoyo: true, repeat: 7, immediateRender: false }, t);
      tl.fromTo("#mo_csPw", { scale: 1, svgOrigin: "384 1030" }, { scale: 1.6, duration: 0.24, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t);
      return null;
    }
    if (mode === "arrow") {
      PF.O("#mo_csAr", 0, 1, t, 0.05); PF.draw("mo_csArP", t, 0.35);
      R.dirty("csarrow", function (tt, d) { PF.O("#mo_csAr", 1, 0, tt, d ? 0.15 : 0.01); });
      return null;
    }
    if (mode === "kid") {                                  // dieta vylezie oknom na strechu (predna kopia)
      PF.S("#mo_csKidW", { opacity: 0 }, t); PF.S("#mo_csKidF", { opacity: 1 }, t);
      PF.X("mo_csKidF", { ty: -250, tx: 45 }, t, 0.55, "back.out(1.3)");
      tl.fromTo("#mo_csKid2A", { rotation: 0, svgOrigin: "785 1030" }, { rotation: 180, duration: 0.3, ease: "power2.out", immediateRender: false }, t);
      R.dirty("cskid", function (tt, d) { PF.X("mo_csKidF", { ty: 0, tx: 0 }, tt, 0); PF.S("#mo_csKid2A", { rotation: 0 }, tt); PF.S("#mo_csKidF", { opacity: 0 }, tt); PF.S("#mo_csKidW", { opacity: 1 }, tt); });
      return null;
    }
    if (mode === "out") {                                  // hrdina vylezie oknom
      R.clean("csarrow", t, 0.15);
      PF.X(p + "float", { tx: 15, ty: -230, s: 0.6, r: -4 }, t, 0.55, "back.out(1.2)");
      Hh.arm("L", 140, t, 0.3); Hh.arm("R", -165, t, 0.3); R.setFace(t + 0.2, "excited");
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? 0.2 : 0); });
      poseReg();
      return null;
    }
    if (mode === "spent") {                                // voda zaleje okno, auto ide pod
      setW(t, o.to || 800, cdur(t, t1, o.dur || 0.9), "power1.in");
      bubbles(t + 0.15, 12, 200, 960, 1000, 200, 0.7, 31);
      R.setFace(t, "shocked"); R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? 0.2 : 0); });
      return null;
    }
    if (mode === "zoom") {                                 // najazd kamery na detail (dalsi beat sa vrati na celok sam)
      var zd = cdur(t, t1, o.dur || 0.5);
      R.camTo(t + zd * 0.7, o.s || 1.4, o.x || 540, o.y || 1000, zd, o.ease || "power2.inOut");
      return null;
    }
    if (mode === "cam") { (o.clear || "").split(",").forEach(function (k) { if (k) R.clean(k, t, 0.15); }); R.camSet("body", t); PF.CAM(1.06, 528, 980 + CP.ty, t, o.dur === undefined ? 0.25 : o.dur, "power2.inOut"); return null; }
    if (mode === "outro") {
      var to = Math.max(t, TOT() - 0.8);
      ["cslvl", "csclock", "face"].forEach(function (k) { R.clean(k, to, 0.25); });
      return null;
    }
    return null;                                           // "" = postavit (od snimku 0)
  };

  M.csface = function (t, name, t1, o) {
    R.setFace(t, name || "worried");
    R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? 0.2 : 0); });
    return null;
  };

  // ================= KARTA: Severna Amerika, okolo 400 rocne
  var NA0 = [[40, 92], [96, 56], [150, 70], [196, 46], [262, 34], [330, 46], [384, 30], [444, 52], [486, 96], [462, 126], [420, 134], [432, 172], [404, 204], [384, 234],
    [344, 254], [326, 284], [302, 306], [272, 336], [252, 366], [236, 356], [242, 322], [212, 302], [182, 272], [160, 232], [150, 192], [130, 154], [100, 134], [70, 144], [48, 124]];
  var NA = [[20, 120], [60, 80], [110, 70], [150, 86], [175, 60], [230, 52], [290, 40], [340, 50], [360, 80], [330, 110], [350, 140], [372, 112], [392, 76], [430, 70], [470, 96], [480, 130], [452, 150], [430, 176],
    [412, 208], [396, 236], [378, 260], [384, 300], [370, 304], [352, 268], [320, 270], [290, 292], [272, 326], [262, 356], [240, 352], [226, 320], [204, 296], [188, 262], [170, 228], [150, 196], [126, 160], [92, 150], [70, 140], [46, 150], [24, 146]];
  function inPoly(x, y) { var c = false, i, j; for (i = 0, j = NA.length - 1; i < NA.length; j = i++) { var a = NA[i], b = NA[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  M.cscard = function (t, mode, t1, o) {
    o = o || {}; var u = UI();
    if (!st.csc) {
      var pts = [], x, y, cars = "", rr = PF.rnd(400);
      for (y = 70; y < 320; y += 34) for (x = 70; x < 470; x += 40) { var jx = x + (rr() - 0.5) * 16, jy = y + (rr() - 0.5) * 12; if (inPoly(jx, jy)) pts.push([jx, jy]); }
      pts = pts.slice(0, 40);
      pts.forEach(function (q, i) { cars += '<g id="mo_csNc' + i + '" opacity="0"><path d="M' + (q[0] - 14).toFixed(0) + ' ' + (q[1] + 6).toFixed(0) + ' v-8 l6 -6 h14 l6 6 h2 v8 Z" fill="' + RED + '"/></g>'; });
      st.csc = { n: pts.length };
      u.insertAdjacentHTML("beforeend", '<div class="mo" id="mo_csNa" style="top:' + (o.y || 400) + 'px"><div class="mo-paper" id="mo_csNaIn" style="padding:18px 30px 16px;width:640px">' +
        '<svg viewBox="0 0 520 380" style="position:static;display:block;width:600px;height:438px;margin:0 auto">' +
        '<path d="M' + NA.map(function (q) { return q[0] + " " + q[1]; }).join(" L") + ' Z" fill="#efe3c6" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="M470 20 Q500 14 506 36 Q496 60 474 50 Z" fill="#efe3c6" stroke="' + INK + '" stroke-width="5"/>' + cars + '</svg>' +
        '<div style="font-family:Hand;font-weight:700;font-size:40px;letter-spacing:3px;line-height:1.3;color:' + INK + ';margin-top:6px">ABOUT</div>' +
        '<div id="mo_csNaV" style="font-family:Pop;font-weight:600;font-size:120px;line-height:1.25;color:' + RED + ';text-align:center">0</div>' +
        '<div style="font-family:Hand;font-weight:700;font-size:36px;letter-spacing:3px;line-height:1.3;color:' + INK + ';margin-top:4px">DIE EACH YEAR</div></div></div>');
    }
    if (mode === "count") {
      var dur = o.dur || 1.6, fps = 30, nst = Math.round(dur * fps), k;
      for (k = 0; k <= nst; k++) { var f = k / nst, v = Math.round(400 * (1 - Math.pow(1 - f, 3))); tl.set("#mo_csNaV", { innerHTML: String(v) }, t + k / fps); }
      for (k = 0; k < st.csc.n; k++) { var tk = t + (k / st.csc.n) * dur; PF.O("#mo_csNc" + k, 0, 1, tk, 0.05); }
      PF.punch(t + dur, 1.03); shake(t + dur, 0.2, 6);
      return null;
    }
    PF.S("#mo_csNaV", { innerHTML: "0" }, t); PF.O("#mo_csAir", 1, 0, t, 0.12);
    PF.O("#mo_csNa", 0, 1, t, 0.06);
    tl.fromTo("#mo_csNaIn", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.32, ease: "back.out(2)", immediateRender: false }, t);
    R.dirty("cscard", function (tt, d) { PF.O("#mo_csNa", 1, 0, tt, d ? 0.15 : 0.01); for (var j = 0; j < st.csc.n; j++) PF.S("#mo_csNc" + j, { opacity: 0 }, tt + (d ? 0.16 : 0.02)); });
    return null;
  };

  // ================= KARTA: ABOUT A MINUTE (pruh, ziadne presne sekundy)
  M.csclock = function (t, mode, t1, o) {
    o = o || {}; var u = UI();
    if (!st.csk) {
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-left" id="mo_csCk" style="top:' + (o.y || 440) + 'px"><div class="mo-paper" id="mo_csCkIn" style="padding:14px 22px 16px;width:400px">' +
        '<div style="font-family:Hand;font-weight:700;font-size:38px;letter-spacing:3px;line-height:1.2;color:' + INK + ';margin-bottom:8px">ABOUT A MINUTE</div>' +
        '<svg viewBox="0 0 380 90" style="position:static;display:block;width:380px;height:90px;margin:0 auto">' +
        '<circle cx="44" cy="46" r="34" fill="#fbf5ea" stroke="' + INK + '" stroke-width="6"/><rect x="36" y="2" width="16" height="10" rx="3" fill="' + INK + '"/>' +
        '<g id="mo_csCkH"><path d="M44 46 L44 22" stroke="' + RED + '" stroke-width="6" stroke-linecap="round"/></g>' +
        '<rect x="92" y="26" width="276" height="40" rx="20" fill="#e7dccb" stroke="' + INK + '" stroke-width="5"/>' +
        '<rect id="mo_csCkB" x="98" y="32" width="264" height="28" rx="14" fill="#3fa3c9"/></svg></div></div>');
      st.csk = { v: 1 };
    }
    var K = st.csk;
    if (mode === "go" || mode === "zero") {
      var to = mode === "zero" ? 0.001 : (o.to === undefined ? 0.2 : o.to), d = o.dur || (mode === "zero" ? 0.5 : 6);
      tl.fromTo("#mo_csCkB", { scaleX: K.v, svgOrigin: "98 46" }, { scaleX: to, duration: d, ease: mode === "zero" ? "power2.in" : "none", immediateRender: false }, t);
      tl.fromTo("#mo_csCkH", { rotation: 0, svgOrigin: "44 46" }, { rotation: 360, duration: Math.min(d, 1.2), ease: "none", repeat: Math.max(0, Math.floor(d / 1.2) - 1), immediateRender: false }, t);
      if (mode === "zero") { PF.F("#mo_csCkB", "#3fa3c9", RED, t, 0.3); tl.fromTo("#mo_csCkIn", { x: 0 }, { x: 10, duration: 0.06, ease: "none", yoyo: true, repeat: 7, immediateRender: false }, t + d); }
      K.v = to;
      return null;
    }
    PF.S("#mo_csCkB", { scaleX: 1, svgOrigin: "98 46", fill: "#3fa3c9" }, t); K.v = 1;
    PF.O("#mo_csCk", 0, 1, t, 0.06);
    tl.fromTo("#mo_csCkIn", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    R.dirty("csclock", function (tt, d) { PF.O("#mo_csCk", 1, 0, tt, d ? 0.2 : 0.01); });
    return null;
  };

  // ================= TELEFON: nevolat
  M.csphone = function (t, mode, t1, o) {
    o = o || {}; var u = UI();
    if (!st.csp) {
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right" id="mo_csPh" style="top:' + (o.y || 1120) + 'px"><div class="mo-paper" id="mo_csPhIn" style="padding:12px 14px 8px;width:230px">' +
        '<svg viewBox="0 0 220 230" style="position:static;display:block;width:210px;height:220px;margin:0 auto">' +
        '<rect x="62" y="12" width="96" height="190" rx="18" fill="#3a3f48" stroke="' + INK + '" stroke-width="6"/><rect x="72" y="32" width="76" height="140" rx="6" fill="#9fd8ef"/>' +
        '<path d="M92 92 q0 -14 10 -14 l10 14 l-6 6 q6 14 18 20 l6 -6 l14 10 q0 10 -14 10 q-38 -6 -38 -40 Z" fill="' + GREEN + '"/>' +
        '<g id="mo_csPhX" opacity="0"><path d="M30 30 L190 200 M190 30 L30 200" stroke="#fbf5ea" stroke-width="34" stroke-linecap="round"/><path d="M30 30 L190 200 M190 30 L30 200" stroke="' + RED + '" stroke-width="20" stroke-linecap="round"/></g></svg></div></div>');
      st.csp = 1;
    }
    if (mode === "x") {
      PF.O("#mo_csPhX", 0, 1, t, 0.04);
      tl.fromTo("#mo_csPhX", { scale: 2.2, svgOrigin: "110 115" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, t);
      PF.punch(t + 0.16, 1.03); shake(t + 0.16, 0.2, 7);
      return null;
    }
    PF.S("#mo_csPhX", { opacity: 0 }, t);
    PF.O("#mo_csPh", 0, 1, t, 0.06);
    tl.fromTo("#mo_csPhIn", { scale: 0.4, rotation: 10 }, { scale: 1, rotation: 3, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    tl.fromTo("#mo_csPhIn", { y: 0 }, { y: -8, duration: 0.07, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t + 0.32);
    R.dirty("csphone", function (tt, d) { PF.O("#mo_csPh", 1, 0, tt, d ? 0.15 : 0.01); });
    return null;
  };
})();
