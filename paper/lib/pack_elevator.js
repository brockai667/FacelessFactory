// pack_elevator.js - momenty pre video 036 Falling Elevator
// lift  = kabina vytahu zvnutra (sklenena zadna stena do sachty), pad, naraz, zmrazenie
// jump  = skok hrdinu (crouch / up / hop / land) + stitok rychlosti skoku + stopky "kedy?"
// ruler = karta vlavo: vyska 165 FT, kabinka pada dole
// dial  = tachometer vpravo: rychlost, tip s odpoctom, rozdiel
// rig   = pohlad zvonka: sachta, lana, kabina okolo hrdinu, brzdy na vodiacich listach
// tower = cez celu obrazovku: Empire State Building, lietadlo, pocet poschodi, dno sachty (vzduch + lana ako pruzina)
// memo  = karty na konci: preskrtnuty skok, Betty
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, OV = H.OV, st = H.st;
  var INK = "#2b2320", RED = "#d9483b";

  // ================= LIFT (kabina zvnutra)
  function buildLift() {
    if (st.lf) return;
    var p = C().hero.p, i, m = "", w = "";
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<clipPath id="mo_lfClip"><rect x="210" y="300" width="660" height="1040" rx="22"/></clipPath>' +
      '<linearGradient id="mo_lfGw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9cfd5"/><stop offset="0.5" stop-color="#e2e6ea"/><stop offset="1" stop-color="#c9cfd5"/></linearGradient>' +
      '<linearGradient id="mo_lfGs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f2c33"/><stop offset="1" stop-color="#4a454d"/></linearGradient>');
    m += '<rect x="-300" y="-300" width="1680" height="1760" fill="url(#mo_lfGw)"/>';
    m += '<path d="M-300 -300 L130 150 L130 1400 L-300 1760 Z" fill="#aab2ba"/><path d="M1380 -300 L950 150 L950 1400 L1380 1760 Z" fill="#aab2ba"/>';
    m += '<path d="M-300 -300 L1380 -300 L950 150 L130 150 Z" fill="#eef0f2"/>';
    m += '<path id="mo_lfLt" d="M340 70 L740 70 L705 135 L375 135 Z" fill="#fffbe6"/>';
    m += '<g stroke="#b3bac2" stroke-width="5"><path d="M175 150 V1400 M905 150 V1400"/></g>';
    m += '<path d="M130 1400 L950 1400 L1380 1760 L1380 2300 L-300 2300 L-300 1760 Z" fill="#5b616b"/>';
    m += '<g stroke="#6c727c" stroke-width="6"><path d="M-300 1820 H1380 M-300 1990 H1380 M300 1400 L120 2300 M540 1400 V2300 M780 1400 L960 2300"/></g>';
    m += '<rect x="130" y="1392" width="820" height="16" fill="#8b929a"/>';
    // okno do sachty
    w += '<rect x="200" y="290" width="680" height="1060" fill="url(#mo_lfGs)"/><g id="mo_lfS" transform="translate(0 0)">';
    for (i = 0; i < 5; i++) {
      var y0 = 300 + i * 420;
      w += '<rect x="200" y="' + y0 + '" width="680" height="46" fill="#857e78"/><rect x="200" y="' + (y0 + 46) + '" width="680" height="8" fill="#5f5953"/>' +
        '<rect x="380" y="' + (y0 + 100) + '" width="320" height="280" rx="6" fill="#433f47" stroke="#5c5761" stroke-width="10"/>' +
        '<rect x="420" y="' + (y0 + 150) + '" width="34" height="60" rx="4" fill="#ffd27a" opacity="0.55"/>';
    }
    w += '</g><rect x="232" y="290" width="22" height="1060" fill="#8e969e"/><rect x="826" y="290" width="22" height="1060" fill="#8e969e"/>';
    w += '<g id="mo_lfV" opacity="0" stroke="#fff6dd" stroke-linecap="round">';
    [[280, 9], [330, 5], [760, 7], [810, 9], [300, 4], [790, 4]].forEach(function (q, j) { w += '<path d="M' + q[0] + ' ' + (330 + j * 90) + ' v' + (380 + j * 40) + '" stroke-width="' + q[1] + '" opacity="0.7"/>'; });
    w += '</g><path id="mo_lfCb" d="M300 -900 q 26 60 0 120 q -26 60 0 120 q 26 60 0 120 q -26 60 0 120 q 26 60 0 120 q -26 60 0 120" fill="none" stroke="#c7ccd1" stroke-width="16" stroke-linecap="round" opacity="0"/>';
    w += '<g id="mo_lfK" opacity="0" fill="none" stroke="#f4f8fb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M790 420 L720 470 L690 560 L610 600 M720 470 L800 540 M690 560 L740 650 M720 470 L660 400"/>' +
      '<path d="M260 980 L330 1040 L320 1130 L390 1190 M330 1040 L250 1100 M320 1130 L270 1220"/></g>';
    m += '<g clip-path="url(#mo_lfClip)">' + w + '</g>';
    m += '<rect x="210" y="300" width="660" height="1040" rx="22" fill="none" stroke="#7d868f" stroke-width="20"/>';
    m += '<path d="M260 330 L380 330 L250 520 Z" fill="#ffffff" opacity="0.16"/>';
    m += '<g fill="#9aa2aa"><rect x="145" y="1040" width="62" height="20" rx="10"/><rect x="873" y="1040" width="62" height="20" rx="10"/></g>';
    // ukazovatel poschodia
    m += '<rect x="440" y="186" width="200" height="98" rx="14" fill="' + INK + '" stroke="#7d868f" stroke-width="8"/>' +
      '<path d="M462 218 L498 218 L480 248 Z" fill="#ff5a3c"/><text id="mo_lfN" x="572" y="263" style="font-family:Pop;font-weight:600;font-size:66px;text-anchor:middle;fill:#ff5a3c">52</text>';
    // panel tlacidiel
    m += '<path d="M985 700 L1045 690 L1045 1010 L985 1000 Z" fill="#c7cdd3" stroke="#8b929a" stroke-width="5"/>';
    for (i = 0; i < 5; i++) m += '<circle cx="1015" cy="' + (740 + i * 56) + '" r="15" fill="' + (i === 1 ? "#ffcf6b" : "#eef1f3") + '" stroke="#8b929a" stroke-width="4"/>';
    m += '<g id="mo_lfSp" opacity="0" stroke="#ffd34d" stroke-width="7" stroke-linecap="round">';
    for (i = 0; i < 12; i++) { var a = Math.PI * (0.05 + 0.9 * i / 11), r1 = 30 + (i % 3) * 18; m += '<path d="M' + (540 + Math.cos(a) * r1).toFixed(0) + ' ' + (300 + Math.sin(a) * r1).toFixed(0) + ' L' + (540 + Math.cos(a) * (r1 + 70)).toFixed(0) + ' ' + (300 + Math.sin(a) * (r1 + 70)).toFixed(0) + '"/>'; }
    m += '</g><rect id="mo_lfRed" x="-300" y="-300" width="1680" height="2600" fill="#ff3b30" opacity="0"/><rect id="mo_lfDim" x="-300" y="-300" width="1680" height="2600" fill="#1d1a22" opacity="0"/>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_lf"><g id="mo_lfR" transform="translate(0 0)">' + m + '</g></g>');
    OV().insertAdjacentHTML("beforeend", '<g id="mo_lfFz" opacity="0"><rect x="0" y="0" width="1080" height="1920" fill="#7f9bb8" opacity="0.3"/>' +
      '<g fill="none" stroke="#fbf5ea" stroke-width="12" stroke-linecap="round"><path d="M50 200 V120 H130 M950 120 H1030 V200 M50 1360 V1440 H130 M950 1440 H1030 V1360"/></g>' +
      '<g fill="#fbf5ea"><rect x="88" y="150" width="22" height="64" rx="5"/><rect x="124" y="150" width="22" height="64" rx="5"/></g>' +
      '<text x="168" y="206" style="font-family:Hand;font-weight:700;font-size:52px;letter-spacing:4px;fill:#fbf5ea">FREEZE</text></g>');
    st.lf = { fall: null, floor: 52, red: false, dim: false, frz: false };
  }
  function liftRest(t, d) {
    var a0 = C().arms0, Hr = C().hero;
    Hr.arm("L", a0[0], t, d || 0.3); Hr.arm("R", a0[1], t, d || 0.3);
  }
  function stopFall(t) {
    var f = st.lf.fall; if (f === null) return; st.lf.fall = null;
    var d = Math.max(0.06, t - f), k = Math.max(1, Math.round(d / 0.2)), per = d / k, j, rr = (Math.round(d / 0.07) | 1);
    tl.fromTo("#mo_lfS", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(0 -420)" }, duration: per, ease: "none", repeat: k - 1, immediateRender: false }, f);
    tl.set("#mo_lfS", { attr: { transform: "translate(0 0)" } }, f + d + 0.001);
    tl.fromTo("#mo_lfR", { attr: { transform: "translate(-3 0)" } }, { attr: { transform: "translate(3 2)" }, duration: d / (rr + 1), ease: "none", yoyo: true, repeat: rr, immediateRender: false }, f);
    tl.set("#mo_lfR", { attr: { transform: "translate(0 0)" } }, f + d + 0.002);
    for (j = 1; f + j * 0.22 < f + d; j++) { st.lf.floor = Math.max(1, st.lf.floor - 1); tl.set("#mo_lfN", { innerHTML: String(st.lf.floor) }, f + j * 0.22); }
    PF.O("#mo_lfV", 0.6, 0, f + d, 0.08);
  }
  function calm(t, d) {                     // odstran naraz (tma, prasknute sklo, cervene svetlo)
    if (st.lf.dim) { PF.O("#mo_lfDim", 0.24, 0, t, d || 0.01); PF.O("#mo_lfK", 1, 0, t, d || 0.01); st.lf.dim = false; }
    if (st.lf.red) { PF.O("#mo_lfRed", 0.14, 0, t, d || 0.01); st.lf.red = false; }
  }
  function startFall(t) {
    calm(t, 0.12);
    st.lf.fall = t; PF.O("#mo_lfV", 0, 0.6, t, 0.12);
    PF.O("#mo_lfRed", 0, 0.14, t, 0.2); st.lf.red = true;
    var Hr = C().hero; Hr.arm("L", 112, t, 0.25, "back.out(2)"); Hr.arm("R", -112, t, 0.25, "back.out(2)");
  }
  function freezeOff(t, d) { if (st.lf.frz) { PF.O("#mo_lfFz", 1, 0, t, d || 0.01); st.lf.frz = false; } }
  M.lift = function (t, mode, t1, o) {
    o = o || {}; buildLift();
    R.dirty("lift", function (tt, d) {
      stopFall(tt); calm(tt, d ? 0.2 : 0); freezeOff(tt, d ? 0.15 : 0);
      st.lf.floor = 52; tl.set("#mo_lfN", { innerHTML: "52" }, tt + 0.01); liftRest(tt, d ? 0.3 : 0.01);
    });
    if (mode === "snap") {                   // lano praskne: iskry, lano preleti oknom, svetlo blika, trhnutie -> pad
      stopFall(t); freezeOff(t, 0.1);
      tl.fromTo("#mo_lfSp", { opacity: 1, scale: 0.3, svgOrigin: "540 300" }, { opacity: 0, scale: 1.5, duration: 0.42, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo("#mo_lfCb", { y: 0, opacity: 1 }, { y: 2300, opacity: 1, duration: 0.6, ease: "power2.in", immediateRender: false }, t + 0.05);
      PF.S("#mo_lfCb", { opacity: 0 }, t + 0.66);
      tl.fromTo("#mo_lfLt", { opacity: 1 }, { opacity: 0.25, duration: 0.07, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t);
      tl.fromTo("#mo_flash", { opacity: 0.6 }, { opacity: 0, duration: 0.25, ease: "power1.out", immediateRender: false }, t);
      H.shake(t, 0.4, 14); PF.punch(t, 1.05);
      st.lf.floor = 52; tl.set("#mo_lfN", { innerHTML: "52" }, t);
      R.face(t + 0.05, "shocked");
      startFall(t + 0.12);
      return null;
    }
    if (mode === "fall") { freezeOff(t, 0.1); if (st.lf.fall === null) startFall(t); R.face(t, "shocked"); return null; }
    if (mode === "go") { freezeOff(t, 0.1); if (st.lf.fall === null) startFall(t); return null; }
    if (mode === "freeze") {                 // zastaveny obraz uprostred skoku
      stopFall(t); PF.O("#mo_lfFz", 0, 1, t, 0.08); st.lf.frz = true;
      tl.fromTo("#mo_flash", { opacity: 0.45 }, { opacity: 0, duration: 0.2, immediateRender: false }, t);
      return null;
    }
    if (mode === "hit") {                    // naraz na dno: zablesk, otras, prasknute sklo, tma
      stopFall(t); freezeOff(t, 0.05);
      tl.fromTo("#mo_flash", { opacity: 0.85 }, { opacity: 0, duration: 0.35, ease: "power1.out", immediateRender: false }, t);
      H.shake(t, 0.5, 18); PF.punch(t, 1.06); PF.VIG(t, 0.6);
      if (st.lf.red) { PF.O("#mo_lfRed", 0.14, 0, t, 0.1); st.lf.red = false; }
      PF.O("#mo_lfDim", 0, 0.24, t, 0.1); PF.O("#mo_lfK", 0, 1, t, 0.05); st.lf.dim = true;
      if (st.jp && st.jp.air) land(t); else liftRest(t, 0.12);
      R.face(t + 0.05, "pain");
      return null;
    }
    if (mode === "calm") { calm(t, 0.2); return null; }
    return null;                             // bez arg: kabina je na obraze od 1. snimku (pozadie videa)
  };

  // ================= JUMP
  function jumpReg() {
    var Hr = C().hero, p = Hr.p;
    if (!st.jp) st.jp = { air: false };
    R.dirty("jump", function (tt, d) {
      PF.X(p + "float", { ty: 0 }, tt, d ? 0.2 : 0); PF.X(p + "legs", { sy: 1 }, tt, d ? 0.2 : 0);
      Hr.leg("L", 0, tt, d ? 0.2 : 0.01); Hr.leg("R", 0, tt, d ? 0.2 : 0.01); liftRest(tt, d ? 0.2 : 0.01);
      if (st.jp.air) { Hr.shadow(true, tt, d ? 0.2 : 0); st.jp.air = false; }
    });
  }
  function crouch(t) {
    var Hr = C().hero, p = Hr.p;
    PF.X(p + "float", { ty: 38 }, t, 0.2, "power2.out"); PF.X(p + "legs", { sy: 0.82 }, t, 0.2, "power2.out");
    Hr.arm("L", 42, t, 0.2); Hr.arm("R", -42, t, 0.2);
  }
  function up(t, h) {
    var Hr = C().hero, p = Hr.p;
    PF.X(p + "float", { ty: -(h || 115) }, t, 0.26, "power2.out"); PF.X(p + "legs", { sy: 1 }, t, 0.12);
    Hr.leg("L", 10, t, 0.2); Hr.leg("R", -10, t, 0.2);
    Hr.arm("L", 150, t, 0.22, "back.out(2)"); Hr.arm("R", -150, t, 0.22, "back.out(2)");
    if (!st.jp.air) { Hr.shadow(false, t, 0.15); st.jp.air = true; }
  }
  function land(t) {
    var Hr = C().hero, p = Hr.p, a = (st.lf && st.lf.fall !== null) ? [112, -112] : C().arms0;
    PF.X(p + "float", { ty: 0 }, t, 0.14, "power2.in"); Hr.leg("L", 0, t, 0.12); Hr.leg("R", 0, t, 0.12);
    PF.X(p + "legs", { sy: 0.86 }, t + 0.14, 0.07); PF.X(p + "legs", { sy: 1 }, t + 0.22, 0.2, "back.out(2)");
    Hr.arm("L", a[0], t + 0.08, 0.25); Hr.arm("R", a[1], t + 0.08, 0.25);
    if (st.jp.air) { Hr.shadow(true, t + 0.12, 0.08); st.jp.air = false; }
    H.shake(t + 0.14, 0.22, 8);
  }
  M.jump = function (t, mode, t1, o) {
    o = o || {}; var u, id;
    if (mode === "tag") {                    // stitok "7 MPH" vedla hlavy
      u = UI(); id = H.uid("mo_elTg");
      u.insertAdjacentHTML("beforeend", '<div class="mo" id="' + id + '" style="top:' + (o.y || 330) + 'px;justify-content:flex-end;padding-right:' + (o.right || 50) + 'px;box-sizing:border-box">' +
        '<div class="mo-paper" id="' + id + 'In" style="padding:16px 30px 14px;line-height:1"><div style="font-family:Hand;font-weight:700;font-size:30px;letter-spacing:3px;color:' + RED + ';text-align:center;margin-bottom:12px">' + (o.label || "YOUR BEST JUMP") + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:center;font-size:76px"><svg viewBox="0 0 40 50" style="position:static;display:block;flex:none;width:46px;height:58px;margin-right:14px"><path d="M20 2 L38 24 H27 V48 H13 V24 H2 Z" fill="#3fa35b"/></svg>' + (o.text || "7 MPH") + '</div></div></div>');
      PF.O("#" + id, 0, 1, t, 0.06);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: 3, duration: 0.3, ease: "back.out(2.2)", immediateRender: false }, t);
      PF.O("#" + id, 1, 0, Math.max(t + 0.6, Math.min(t + (o.hold || 2.2), (t1 || 1e9) - 0.15)), 0.12);
      return null;
    }
    if (mode === "when") {                   // stopky, ktorych rucicka sa splasene toci: kedy skocit?
      u = UI(); id = H.uid("mo_elWh");
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-left mo-side" id="' + id + '" style="top:' + (o.y || 620) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "JUMP WHEN?") + '</span>' +
        '<svg viewBox="0 0 220 270"><rect x="94" y="22" width="32" height="22" rx="5" fill="' + INK + '"/><circle cx="110" cy="150" r="96" fill="#fbf5ea" stroke="' + INK + '" stroke-width="12"/>' +
        '<g stroke="' + INK + '" stroke-width="6" stroke-linecap="round"><path d="M110 66 v16 M110 218 v16 M26 150 h16 M178 150 h16"/></g>' +
        '<g id="' + id + 'H"><path d="M110 150 L110 74" stroke="' + RED + '" stroke-width="10" stroke-linecap="round"/></g><circle cx="110" cy="150" r="11" fill="' + INK + '"/>' +
        '<text id="' + id + 'Q" x="186" y="76" opacity="0" style="font-family:Pop;font-weight:600;font-size:64px;text-anchor:middle;fill:' + RED + '">?</text></svg></div></div>');
      PF.O("#" + id, 0, 1, t, 0.06);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.fromTo("#" + id + "H", { rotation: 0, svgOrigin: "110 150" }, { rotation: 1500, duration: 1.0, ease: "power1.inOut", immediateRender: false }, t + 0.1);
      tl.fromTo("#" + id + "Q", { opacity: 0, scale: 0.3, svgOrigin: "186 60" }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: false }, t + 0.3);
      PF.O("#" + id, 1, 0, Math.max(t + 0.5, Math.min(t + (o.hold || 1.6), (t1 || 1e9) - 0.18 + (o.over || 0))), 0.15);
      if (o.eyes !== false) {                // oci krúžia za ručičkou, potom závrat
        var Hr = C().hero, L0 = C().look0 || [0, 0], k; R.face(t, "worried");
        for (k = 0; k <= 8; k++) { var a = -Math.PI / 2 + k * Math.PI / 4; Hr.look(-6 + Math.cos(a) * 6, Math.sin(a) * 9, t + 0.05 + k * 0.055, 0.05); }
        R.dirty("look", function (tt, d) { Hr.look(L0[0], L0[1], tt, d ? 0.25 : 0); });
        R.face(t + 0.5, "dizzy");
      }
      return null;
    }
    jumpReg();
    if (mode === "crouch") { crouch(t); R.face(t, "angry"); return null; }
    if (mode === "up") { up(t, o.h); R.face(t, "excited"); return null; }
    if (mode === "hop") { crouch(t); up(t + 0.2, o.h || 80); land(t + 0.5); return null; }
    if (mode === "land") { land(t); return null; }
    if (mode === "shrug") {                  // pokrcenie plecami a sklamane prepadnutie
      var Hs = C().hero, ps = Hs.p, a0 = C().arms0, hd = o.hold || 0.75;
      Hs.arm("L", 62, t, 0.18, "back.out(2)"); Hs.arm("R", -62, t, 0.18, "back.out(2)");
      PF.X(ps + "float", { ty: -14 }, t, 0.15, "power2.out"); PF.X(ps + "float", { ty: 16 }, t + 0.3, 0.3, "power2.in");
      Hs.arm("L", a0[0], t + hd, 0.3); Hs.arm("R", a0[1], t + hd, 0.3);
      PF.X(ps + "float", { ty: 0 }, t + hd + 0.1, 0.3);
      R.face(t, "tired");
      return null;
    }
    return null;
  };

  // ================= RULER (vyska padu)
  M.ruler = function (t, x, t1, o) {
    o = o || {}; var u = UI(), id = H.uid("mo_elRu"), d = o.dur || 2.0, i, tk = "";
    for (i = 0; i <= 10; i++) tk += '<path d="M44 ' + (30 + i * 37) + ' h' + (i % 5 ? 18 : 32) + '" />';
    u.insertAdjacentHTML("beforeend", '<div class="mo mo-left mo-meter" id="' + id + '" style="top:' + (o.y || 560) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "165 FT") + '</span>' +
      '<svg viewBox="0 0 124 430"><rect x="30" y="20" width="14" height="390" rx="5" fill="#9aa4af"/><g stroke="' + INK + '" stroke-width="5" stroke-linecap="round">' + tk + '</g>' +
      '<g id="' + id + 'C"><rect x="62" y="0" width="42" height="48" rx="6" fill="#f2c230" stroke="' + INK + '" stroke-width="5"/><path d="M83 0 V-40" stroke="' + INK + '" stroke-width="4" stroke-dasharray="6 6"/></g>' +
      '<g id="' + id + 'B" opacity="0"><path d="M83 380 l14 28 l30 -8 l-16 26 l22 20 l-30 2 l-4 30 l-16 -24 l-16 24 l-4 -30 l-30 -2 l22 -20 l-16 -26 l30 8 z" fill="' + RED + '" stroke="#fbf5ea" stroke-width="5"/></g></svg></div></div>');
    PF.O("#" + id, 0, 1, t, 0.06);
    tl.fromTo("#" + id + "In", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    tl.fromTo("#" + id + "C", { y: 20 }, { y: 352, duration: d, ease: "power2.in", immediateRender: false }, t + 0.1);
    PF.S("#" + id + "B", { opacity: 1 }, t + 0.1 + d);
    tl.fromTo("#" + id + "B", { scale: 0.3, svgOrigin: "83 410" }, { scale: 1, duration: 0.2, ease: "back.out(3)", immediateRender: false }, t + 0.1 + d);
    PF.O("#" + id, 1, 0, Math.max(t + d + 0.5, (t1 || 1e9) - 0.15), 0.12);
    return null;
  };

  // ================= DIAL (tachometer)
  function ang(v) { return -90 + Math.max(0, Math.min(80, v)) / 80 * 180; }
  function arcPt(v, r) { var a = Math.PI - v / 80 * Math.PI; return [110 + r * Math.cos(a), 150 - r * Math.sin(a)]; }
  function arc(v0, v1, r) { var a = arcPt(v0, r), b = arcPt(v1, r); return "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " A" + r + " " + r + " 0 0 1 " + b[0].toFixed(1) + " " + b[1].toFixed(1); }
  function dialCount(t, a, b, d) {
    var N = Math.max(2, Math.round(d * 30)), i;
    for (i = 1; i <= N; i++) { var k = i / N, e = k * k * (3 - 2 * k); tl.set("#mo_dlD", { innerHTML: String(Math.round(a + (b - a) * e)) }, t + d * k); }
  }
  M.dial = function (t, arg, t1, o) {
    o = o || {}; var u = UI(), i, tk = "";
    if (!st.dl) {
      for (i = 0; i <= 8; i++) { var q0 = arcPt(i * 10, 92), q1 = arcPt(i * 10, i % 2 ? 80 : 72); tk += '<path d="M' + q0[0].toFixed(1) + ' ' + q0[1].toFixed(1) + ' L' + q1[0].toFixed(1) + ' ' + q1[1].toFixed(1) + '"/>'; }
      var g = arcPt(72, 98), g2 = arcPt(72, 62);
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="mo_dl" style="top:' + (o.y || 560) + 'px"><div class="mo-paper" id="mo_dlIn"><span class="mo-lbl">' + (o.label || "IMPACT SPEED") + '</span>' +
        '<svg viewBox="0 0 220 270"><path d="' + arc(0, 80, 92) + '" fill="none" stroke="#e7dccb" stroke-width="30"/><path d="' + arc(60, 80, 92) + '" fill="none" stroke="#f0a99f" stroke-width="30"/>' +
        '<g stroke="' + INK + '" stroke-width="5" stroke-linecap="round">' + tk + '</g>' +
        '<text x="22" y="176" style="font-family:Hand;font-weight:700;font-size:26px;text-anchor:middle;fill:' + INK + '">0</text><text x="198" y="176" style="font-family:Hand;font-weight:700;font-size:26px;text-anchor:middle;fill:' + INK + '">80</text>' +
        '<path id="mo_dlB" d="' + arc(65, 72, 92) + '" fill="none" stroke="#f2c230" stroke-width="34" opacity="0"/>' +
        '<path id="mo_dlG" d="M' + g2[0].toFixed(1) + ' ' + g2[1].toFixed(1) + ' L' + g[0].toFixed(1) + ' ' + g[1].toFixed(1) + '" stroke="#9aa4af" stroke-width="9" stroke-linecap="round" opacity="0"/>' +
        '<g id="mo_dlN"><path d="M104 150 L110 66 L116 150 Z" fill="' + RED + '"/></g><circle cx="110" cy="150" r="13" fill="' + INK + '"/>' +
        '<text id="mo_dlD" x="110" y="232" style="font-family:Pop;font-weight:600;font-size:66px;text-anchor:middle;fill:' + INK + '">0</text>' +
        '<text id="mo_dlU" x="110" y="264" style="font-family:Hand;font-weight:700;font-size:28px;letter-spacing:2px;text-anchor:middle;fill:' + INK + '">MPH</text>' +
        '<g id="mo_dlC" opacity="0"><circle cx="188" cy="34" r="34" fill="' + RED + '" stroke="#fbf5ea" stroke-width="6"/><text id="mo_dlCt" x="188" y="50" style="font-family:Pop;font-weight:600;font-size:46px;text-anchor:middle;fill:#fbf5ea">3</text></g></svg></div></div>');
      tl.set("#mo_dlN", { rotation: -90, svgOrigin: "110 150" }, 0);
      PF.O("#mo_dl", 0, 1, t, 0.06);
      tl.fromTo("#mo_dlIn", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      st.dl = { v: 0 };
      R.dirty("dial", function (tt, d) { PF.O("#mo_dl", 1, 0, tt, d ? 0.15 : 0.01); });
    }
    if (arg === "guess") {                   // tip: otazniky, rucicka bludi, odpocet 3-2-1
      var s = o.step || 0.36;
      tl.set("#mo_dlD", { innerHTML: "?" }, t);
      tl.fromTo("#mo_dlD", { opacity: 1 }, { opacity: 0.25, duration: 0.13, ease: "none", yoyo: true, repeat: 7, immediateRender: false }, t);
      tl.fromTo("#mo_dlN", { rotation: ang(st.dl.v) }, { rotation: ang(40), duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t);
      PF.O("#mo_dlC", 0, 1, t, 0.05);
      ["3", "2", "1"].forEach(function (c, j) {
        tl.set("#mo_dlCt", { innerHTML: c }, t + j * s);
        tl.fromTo("#mo_dlC", { scale: 1.4, svgOrigin: "188 34" }, { scale: 1, duration: 0.18, ease: "back.out(3)", immediateRender: false }, t + j * s);
      });
      PF.O("#mo_dlC", 1, 0, t + 3 * s - 0.04, 0.06);
      tl.fromTo("#mo_dlIn", { scale: 1.08 }, { scale: 1, duration: 0.25, ease: "power2.out", immediateRender: false }, t);
      st.dl.q = true;
      return null;
    }
    if (arg === "barely") {                  // len o kusok menej: zlty usek medzi 65 a 72
      PF.O("#mo_dlB", 0, 0.9, t, 0.1);
      tl.fromTo("#mo_dlB", { attr: { "stroke-width": 20 } }, { attr: { "stroke-width": 40 }, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t);
      tl.set("#mo_dlU", { innerHTML: o.text || "ONLY −7", fill: RED }, t);
      tl.fromTo("#mo_dlIn", { rotation: 2 }, { rotation: -3, duration: 0.1, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t);
      return null;
    }
    var v = +arg, d = o.dur || 0.6, from = st.dl.q ? (o.from || st.dl.v) : st.dl.v;
    if (o.ghost) PF.O("#mo_dlG", 0, 1, t, 0.1);
    if (st.dl.q) { tl.set("#mo_dlD", { opacity: 1 }, t); st.dl.q = false; }
    tl.fromTo("#mo_dlN", { rotation: ang(st.dl.v) }, { rotation: ang(v), duration: d, ease: d > 1 ? "power1.in" : "back.out(1.6)", immediateRender: false }, t);
    dialCount(t, from, v, d);
    tl.fromTo("#mo_dlIn", { scale: 1.14 }, { scale: 1, duration: 0.28, ease: "power2.out", immediateRender: false }, t + d);
    st.dl.v = v;
    return null;
  };

  // ================= RIG (sachta zvonka, hrdina v kabine)
  function buildRig() {
    if (st.rg) return;
    var p = C().hero.p, i, m = "", s = "", ro = "", rb = "";
    m += '<rect x="-300" y="-300" width="1680" height="2700" fill="#38363d"/><rect x="-300" y="-300" width="300" height="2700" fill="#2c2a30"/><rect x="1080" y="-300" width="300" height="2700" fill="#2c2a30"/>';
    for (i = 0; i < 9; i++) { var y = -300 + i * 560; s += '<rect x="-300" y="' + y + '" width="1680" height="54" fill="#58535b"/><rect x="-300" y="' + (y + 54) + '" width="1680" height="10" fill="#2a282e"/>' +
      '<text x="90" y="' + (y + 160) + '" style="font-family:Pop;font-weight:600;font-size:60px;fill:#4d4952">' + (40 - i) + '</text>'; }
    for (i = 0; i < 18; i++) { var yb = -300 + i * 280; s += '<rect x="214" y="' + yb + '" width="70" height="22" fill="#55606a"/><rect x="796" y="' + yb + '" width="70" height="22" fill="#55606a"/>'; }
    m += '<g id="mo_rgS" transform="translate(0 0)">' + s + '</g>';
    m += '<rect x="236" y="-300" width="26" height="2700" fill="#a6aeb6"/><rect x="236" y="-300" width="8" height="2700" fill="#d0d6db"/>';
    m += '<rect x="818" y="-300" width="26" height="2700" fill="#a6aeb6"/><rect x="818" y="-300" width="8" height="2700" fill="#d0d6db"/>';
    // kladka
    m += '<g id="mo_rgW"><circle cx="540" cy="120" r="124" fill="#6f777f" stroke="#4d545b" stroke-width="14"/><circle cx="540" cy="120" r="36" fill="#4d545b"/>' +
      '<g stroke="#4d545b" stroke-width="16"><path d="M540 10 V230 M430 120 H650 M462 42 L618 198 M618 42 L462 198"/></g></g>';
    for (i = 0; i < 6; i++) {
      var xr = 503 + i * 15;
      ro += '<path id="mo_rgT' + i + '" d="M' + xr + ' 120 V300" stroke="#d3d9de" stroke-width="10" stroke-linecap="round"/>';
      rb += '<path id="mo_rgB' + i + '" d="M' + xr + ' 300 V412" stroke="#d3d9de" stroke-width="10" stroke-linecap="round"/>';
    }
    m += '<g id="mo_rgTs" opacity="0">' + ro + '</g>';
    // kabina (spolu s hrdinom)
    var c = '<rect x="300" y="460" width="480" height="1006" fill="#e8dfcd"/><rect x="300" y="460" width="480" height="60" fill="#d9cfbb"/>' +
      '<rect x="270" y="1466" width="540" height="46" rx="6" fill="#6b727a"/><rect x="286" y="420" width="28" height="1060" fill="#7d858d"/><rect x="766" y="420" width="28" height="1060" fill="#7d858d"/>' +
      '<rect x="270" y="404" width="540" height="52" rx="8" fill="#8f979f"/><rect x="490" y="390" width="100" height="22" rx="5" fill="#5d646b"/>' +
      '<g id="mo_rgBs" opacity="0">' + rb + '</g>' +
      '<rect x="200" y="1478" width="680" height="24" fill="#5d646b"/>' +
      '<g id="mo_rgJ1"><path d="M200 1180 h28 v86 h-28 z" fill="#f2b632" stroke="' + INK + '" stroke-width="5"/></g><g id="mo_rgJ2"><path d="M270 1180 h28 v86 h-28 z" fill="#f2b632" stroke="' + INK + '" stroke-width="5"/></g>' +
      '<g id="mo_rgJ3"><path d="M782 1180 h28 v86 h-28 z" fill="#f2b632" stroke="' + INK + '" stroke-width="5"/></g><g id="mo_rgJ4"><path d="M852 1180 h28 v86 h-28 z" fill="#f2b632" stroke="' + INK + '" stroke-width="5"/></g>';
    var sp = function (id, x) { var h = '<g id="' + id + '" opacity="0" stroke="#ffd34d" stroke-width="6" stroke-linecap="round">', k;
      for (k = 0; k < 9; k++) { var a = -Math.PI * (0.1 + 0.8 * k / 8); h += '<path d="M' + (x + Math.cos(a) * 20).toFixed(0) + ' ' + (1223 + Math.sin(a) * 20).toFixed(0) + ' L' + (x + Math.cos(a) * (70 + (k % 3) * 22)).toFixed(0) + ' ' + (1223 + Math.sin(a) * (70 + (k % 3) * 22)).toFixed(0) + '"/>'; }
      return h + '</g>'; };
    c += sp("mo_rgK1", 249) + sp("mo_rgK2", 831);
    m += '<g id="mo_rgC" opacity="0">' + c + '</g>';
    m += '<g id="mo_rgL1" opacity="0"><text x="840" y="235" style="font-family:Hand;font-weight:700;font-size:46px;letter-spacing:2px;text-anchor:middle;fill:#fbf5ea">STEEL</text>' +
      '<text x="840" y="285" style="font-family:Hand;font-weight:700;font-size:46px;letter-spacing:2px;text-anchor:middle;fill:#fbf5ea">ROPES</text><path d="M720 260 L620 280" stroke="#fbf5ea" stroke-width="7" stroke-linecap="round"/><path d="M640 262 L616 281 L645 292" fill="none" stroke="#fbf5ea" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>';
    m += '<g id="mo_rgL2" opacity="0"><text x="935" y="650" style="font-family:Hand;font-weight:700;font-size:44px;letter-spacing:2px;text-anchor:middle;fill:#ffd34d">SAFETY</text>' +
      '<text x="935" y="698" style="font-family:Hand;font-weight:700;font-size:44px;letter-spacing:2px;text-anchor:middle;fill:#ffd34d">BRAKES</text>' +
      '<path d="M935 725 V1150" stroke="#ffd34d" stroke-width="7" stroke-dasharray="16 14" stroke-linecap="round"/><path d="M915 1130 L935 1165 L955 1130" fill="none" stroke="#ffd34d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_rg" opacity="0"><g id="mo_rgIn">' + m.replace(/<g id="mo_rgC"[\s\S]*$/, "") + '</g>' + m.slice(m.indexOf('<g id="mo_rgC"')) + '</g>');
    PF.P("mo_rgC", 540, 1100);
    st.rg = { cut: null, brk: null, y: 0, on: false };
  }
  M.rig = function (t, mode, t1, o) {
    o = o || {}; buildRig(); var Hr = C().hero, p = Hr.p, i;
    if (!mode) {                             // kamera vyleti hore sachtou: interier odide dole, zhora pride sachta
      st.rg.on = true;
      PF.O("#mo_rg", 0, 1, t, 0.04);
      tl.fromTo("#mo_rgIn", { y: -1920 }, { y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, t);
      if (st.lf) tl.fromTo("#mo_lf", { y: 0 }, { y: 1920, duration: 0.5, ease: "power3.out", immediateRender: false }, t);
      PF.O("#mo_rgC", 0, 1, t + 0.3, 0.2);
      R.face(t + 0.2, "worried");
      R.dirty("rig", function (tt, d) {
        PF.O("#mo_rg", 1, 0, tt, d ? 0.2 : 0.01); var te = tt + (d ? 0.22 : 0.02);
        if (st.lf) tl.set("#mo_lf", { y: 0 }, tt);
        PF.S("#mo_rgC,#mo_rgTs,#mo_rgBs,#mo_rgL1,#mo_rgL2", { opacity: 0 }, te);
        tl.set("#mo_rgS", { attr: { transform: "translate(0 0)" } }, te);
        for (var k = 0; k < 6; k++) tl.set("#mo_rgT" + k + ",#mo_rgB" + k, { y: 0, rotation: 0, scaleY: 1, opacity: 1 }, te);
        tl.set("#mo_rgJ1,#mo_rgJ2,#mo_rgJ3,#mo_rgJ4", { x: 0 }, te);
        PF.X("mo_rgC", { ty: 0, r: 0 }, te, 0); Hr.move(0, 0, 0, tt, d ? 0.2 : 0); liftRest(tt, d ? 0.2 : 0.01);
        st.rg.on = false;
      });
      return null;
    }
    if (mode === "sway") {                   // kabina visi a jemne sa hojda
      PF.XY("mo_rgC", { r: 1.6 }, t, 0.4, "sine.inOut", 3); PF.XY(p + "float", { r: 1.6 }, t, 0.4, "sine.inOut", 3);
      return null;
    }
    if (mode === "ropes") {                  // lana sa natiahnu jedno po druhom
      PF.S("#mo_rgTs,#mo_rgBs", { opacity: 1 }, t);
      for (i = 0; i < 6; i++) {
        tl.fromTo("#mo_rgT" + i, { scaleY: 0, svgOrigin: (503 + i * 15) + " 120" }, { scaleY: 1, duration: 0.14, ease: "power2.out", immediateRender: false }, t + i * 0.1);
        tl.fromTo("#mo_rgB" + i, { scaleY: 0, svgOrigin: (503 + i * 15) + " 300" }, { scaleY: 1, duration: 0.1, ease: "power2.out", immediateRender: false }, t + i * 0.1 + 0.12);
      }
      PF.O("#mo_rgL1", 0, 1, t + 0.55, 0.15);
      tl.fromTo("#mo_rgL1", { x: 40 }, { x: 0, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.55);
      PF.XY("mo_rgC", { ty: -10 }, t + 0.6, 0.15, "power2.out", 1); PF.XY(p + "float", { ty: -10 }, t + 0.6, 0.15, "power2.out", 1);
      R.face(t + 0.6, "smile");
      return null;
    }
    if (mode === "cut") {                    // lana prasknu, kabina zacne padat (stena sachty utieka hore)
      st.rg.cut = t;
      for (i = 0; i < 6; i++) {
        tl.fromTo("#mo_rgT" + i, { y: 0, opacity: 1 }, { y: -360 - i * 20, opacity: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, t + i * 0.02);
        tl.fromTo("#mo_rgB" + i, { rotation: 0, opacity: 1, svgOrigin: (503 + i * 15) + " 412" }, { rotation: (i < 3 ? -1 : 1) * (30 + i * 5), opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, t + 0.03);
      }
      PF.O("#mo_rgL1", 1, 0, t, 0.1);
      PF.X("mo_rgC", { ty: 60 }, t, 0.3, "power2.in"); Hr.move(0, 60, 0, t, 0.3, "power2.in");
      Hr.arm("L", 140, t, 0.2, "back.out(2)"); Hr.arm("R", -140, t, 0.2, "back.out(2)");
      H.shake(t, 0.3, 10); R.face(t, "shocked");
      return null;
    }
    if (mode === "brake") {                  // celuste chytia listy, iskry, spomaluje
      var c0 = st.rg.cut === null ? t - 0.6 : st.rg.cut;
      tl.fromTo("#mo_rgS", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(0 -760)" }, duration: Math.max(0.2, t - c0), ease: "power2.in", immediateRender: false }, c0);
      st.rg.y = -760; st.rg.brk = t;
      tl.fromTo("#mo_rgJ1,#mo_rgJ3", { x: 0 }, { x: 10, duration: 0.07, ease: "power3.in", immediateRender: false }, t);
      tl.fromTo("#mo_rgJ2,#mo_rgJ4", { x: 0 }, { x: -10, duration: 0.07, ease: "power3.in", immediateRender: false }, t);
      tl.fromTo("#mo_rgK1", { opacity: 1, scale: 0.4, svgOrigin: "249 1223" }, { opacity: 0, scale: 1.4, duration: 0.2, ease: "power1.out", repeat: 3, immediateRender: false }, t + 0.05);
      tl.fromTo("#mo_rgK2", { opacity: 1, scale: 0.4, svgOrigin: "831 1223" }, { opacity: 0, scale: 1.4, duration: 0.2, ease: "power1.out", repeat: 3, immediateRender: false }, t + 0.1);
      PF.O("#mo_rgL2", 0, 1, t + 0.08, 0.12);
      tl.fromTo("#mo_rgL2", { y: -30 }, { y: 0, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.08);
      H.shake(t, 0.5, 7); R.face(t, "worried");
      return null;
    }
    if (mode === "stop") {                   // zastavi na mieste: trhnutie, ulava
      var b0 = st.rg.brk === null ? t - 0.5 : st.rg.brk;
      tl.fromTo("#mo_rgS", { attr: { transform: "translate(0 " + st.rg.y + ")" } }, { attr: { transform: "translate(0 " + (st.rg.y - 520) + ")" }, duration: Math.max(0.15, t - b0), ease: "power3.out", immediateRender: false }, b0);
      st.rg.y -= 520;
      PF.XY("mo_rgC", { ty: 74 }, t, 0.08, "power2.out", 1); PF.XY(p + "float", { ty: 74 }, t, 0.08, "power2.out", 1);
      H.shake(t, 0.3, 12); PF.punch(t, 1.04);
      liftRest(t + 0.25, 0.45); R.face(t + 0.3, "smile");
      return null;
    }
    return null;
  };

  // ================= TOWER (Empire State Building + dno sachty)
  function buildTower() {
    if (st.tw) return;
    var u = UI(), i, m = "", win = "", rr = PF.rnd(4502);
    m += '<defs><linearGradient id="mo_twSk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ea3ba"/><stop offset="1" stop-color="#dfe5ec"/></linearGradient></defs>';
    m += '<g id="mo_twT"><rect x="0" y="0" width="1080" height="1920" fill="url(#mo_twSk)"/>';
    m += '<g id="mo_twFg" fill="#ffffff" opacity="0.45"><ellipse cx="200" cy="640" rx="420" ry="60"/><ellipse cx="900" cy="820" rx="380" ry="56"/><ellipse cx="420" cy="1020" rx="460" ry="70"/></g>';
    m += '<path d="M0 1500 V1260 H90 V1200 H170 V1290 H240 V1230 H300 V1500 Z M780 1500 V1210 H850 V1150 H930 V1250 H1000 V1190 H1080 V1500 Z" fill="#8e9db0"/>';
    // budova (stupnovite ustupy), svetla strana vlavo
    m += '<path d="M540 40 V160" stroke="#8a8170" stroke-width="10"/><rect x="514" y="150" width="52" height="110" fill="#d6cab2"/>' +
      '<rect x="480" y="255" width="120" height="80" fill="#d6cab2"/><rect x="450" y="330" width="180" height="95" fill="#d6cab2"/>' +
      '<rect x="420" y="420" width="240" height="540" fill="#d6cab2"/><rect x="360" y="950" width="360" height="210" fill="#d6cab2"/><rect x="300" y="1150" width="480" height="350" fill="#d6cab2"/>';
    m += '<g fill="#b4a68c"><rect x="540" y="150" width="26" height="110"/><rect x="560" y="255" width="40" height="80"/><rect x="580" y="330" width="50" height="95"/>' +
      '<rect x="600" y="420" width="60" height="540"/><rect x="640" y="950" width="80" height="210"/><rect x="680" y="1150" width="100" height="350"/></g>';
    for (i = 0; i < 44; i++) { var yy = 436 + i * 24.5; if (yy > 1480) break;
      var x0 = yy < 950 ? 432 : (yy < 1150 ? 374 : 314), x1 = yy < 950 ? 648 : (yy < 1150 ? 706 : 766);
      for (var xx = x0; xx < x1; xx += 24) win += '<rect x="' + xx + '" y="' + yy.toFixed(0) + '" width="12" height="13" fill="' + (rr() < 0.2 ? "#f6dc8f" : "#7d7a73") + '" opacity="0.8"/>'; }
    m += '<g>' + win + '</g><rect x="0" y="1500" width="1080" height="420" fill="#5d6878"/>';
    m += '<path id="mo_twL" d="M540 520 V1488" stroke="#f2c230" stroke-width="8" stroke-dasharray="14 12" opacity="0"/>';
    m += '<g id="mo_twM" opacity="0"><rect x="526" y="505" width="28" height="32" rx="4" fill="#f2c230" stroke="' + INK + '" stroke-width="5"/></g>';
    m += '<g id="mo_twDu" opacity="0" fill="#cfc6b4"><circle cx="500" cy="1480" r="40"/><circle cx="580" cy="1484" r="46"/><circle cx="540" cy="1460" r="34"/></g>';
    // lietadlo (bombarder s dvoma chvostami, z boku)
    m += '<g id="mo_twPl" transform="translate(-260 430)"><g fill="#3c4148"><ellipse cx="0" cy="0" rx="84" ry="14"/><path d="M84 0 L100 -4 L100 4 Z"/>' +
      '<rect x="-20" y="-4" width="64" height="9" rx="3"/><ellipse cx="18" cy="9" rx="26" ry="9"/><path d="M-80 -2 L-96 -34 L-84 -34 L-66 -6 Z"/><path d="M-72 -2 L-86 -28 L-76 -28 L-60 -6 Z" opacity="0.7"/>' +
      '<rect x="-98" y="-4" width="36" height="6"/></g></g>';
    m += '<g id="mo_twX" opacity="0"><circle cx="440" cy="520" r="70" fill="#ff9a3c"/><circle cx="470" cy="500" r="50" fill="#ffd34d"/><circle cx="410" cy="540" r="44" fill="#e8562f"/></g>';
    m += '<g id="mo_twSm" opacity="0" fill="#5b5f66"><circle cx="420" cy="470" r="46"/><circle cx="470" cy="430" r="58"/><circle cx="430" cy="380" r="64"/><circle cx="490" cy="330" r="72"/></g>';
    m += '<g id="mo_twN"><rect x="40" y="110" width="470" height="150" rx="16" fill="#fbf5ea"/><text x="275" y="178" style="font-family:Pop;font-weight:600;font-size:46px;text-anchor:middle;fill:' + INK + '">BETTY LOU OLIVER</text>' +
      '<text x="275" y="226" style="font-family:Hand;font-weight:700;font-size:30px;letter-spacing:2px;text-anchor:middle;fill:' + RED + '">ELEVATOR OPERATOR · 1945</text></g>';
    m += '<g id="mo_twF" opacity="0"><rect x="30" y="640" width="300" height="300" rx="16" fill="#fbf5ea"/><text x="180" y="702" style="font-family:Hand;font-weight:700;font-size:32px;letter-spacing:3px;text-anchor:middle;fill:' + INK + '">FLOORS</text>' +
      '<text x="180" y="740" style="font-family:Hand;font-weight:700;font-size:32px;letter-spacing:3px;text-anchor:middle;fill:' + INK + '">FALLEN</text>' +
      '<text id="mo_twD" x="180" y="890" style="font-family:Pop;font-weight:600;font-size:140px;text-anchor:middle;fill:#a8261c">0</text></g></g>';
    // dno sachty
    var coil = "", air = "", dust = '<g id="mo_twDs" opacity="0" fill="#a59d92">';
    [[330, 1300, 7], [400, 1250, 5], [470, 1320, 6], [610, 1260, 6], [690, 1310, 7], [760, 1270, 5], [360, 1200, 4], [720, 1210, 4], [540, 1330, 5], [300, 1350, 6]].forEach(function (q, j) { dust += '<circle id="mo_twDs' + j + '" cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '"/>'; });
    dust += '</g>';
    for (i = 0; i < 7; i++) coil += '<ellipse cx="540" cy="' + (1370 - i * 20) + '" rx="' + (230 - (i % 2) * 14) + '" ry="34" fill="none" stroke="' + (i % 2 ? "#8a939b" : "#b8c0c7") + '" stroke-width="14"/>';
    [[420, 0, 70], [540, -10, 84], [660, 0, 70], [480, 30, 56], [600, 30, 56]].forEach(function (q, j) { air += '<circle id="mo_twA' + j + '" cx="' + q[0] + '" cy="' + (1180 + q[1]) + '" r="' + q[2] + '" fill="#f4f8fb" opacity="0.92"/>'; });
    m += '<g id="mo_twP" opacity="0"><rect x="0" y="0" width="1080" height="1920" fill="#2f2d33"/><g transform="translate(540 940) scale(1.8) translate(-540 -1165)"><rect x="0" y="0" width="250" height="1920" fill="#57535b"/><rect x="830" y="0" width="250" height="1920" fill="#57535b"/>' +
      '<g stroke="#46424a" stroke-width="8"><path d="M0 300 H250 M0 760 H250 M830 520 H1080 M830 980 H1080 M0 1220 H250"/></g>' +
      '<rect x="250" y="0" width="22" height="1400" fill="#8e969e"/><rect x="808" y="0" width="22" height="1400" fill="#8e969e"/>' +
      '<rect x="0" y="1390" width="1080" height="530" fill="#454149"/><rect x="0" y="1390" width="1080" height="16" fill="#6a656e"/>' +
      '<text x="540" y="1450" style="font-family:Hand;font-weight:700;font-size:30px;letter-spacing:2px;text-anchor:middle;fill:#b8b2bb">BOTTOM</text>' +
      '<g id="mo_twK">' + coil + '</g><g id="mo_twAir">' + air + '</g>' + dust +
      '<g id="mo_twC"><rect x="350" y="0" width="380" height="330" rx="8" fill="#e9dcc4" stroke="#7d858d" stroke-width="16"/><rect x="350" y="-26" width="380" height="30" rx="6" fill="#8f979f"/>' +
      '<g transform="translate(540 300) scale(1.3) translate(-540 -300)"><g id="mo_twB"><path d="M510 300 V240 M570 300 V240" stroke="#2b2320" stroke-width="16" stroke-linecap="round"/><path d="M490 250 L506 150 Q540 132 574 150 L590 250 Z" fill="#7a2f3a"/>' +
      '<circle cx="540" cy="112" r="38" fill="#f1c9a5"/><path d="M500 104 Q504 66 540 66 Q576 66 580 104 Q570 86 540 86 Q510 86 500 104 Z" fill="#5a3420"/><circle cx="504" cy="98" r="15" fill="#5a3420"/><circle cx="576" cy="98" r="15" fill="#5a3420"/>' +
      '<g id="mo_twEn"><circle cx="528" cy="112" r="4" fill="#2b2320"/><circle cx="552" cy="112" r="4" fill="#2b2320"/></g>' +
      '<g id="mo_twEp" opacity="0" stroke="#2b2320" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M522 108 L531 113 L522 118 M558 108 L549 113 L558 118 M520 99 L533 104 M560 99 L547 104"/></g>' +
      '<ellipse id="mo_twMo" cx="540" cy="131" rx="5" ry="6.5" fill="#7a1f1f"/>' +
      '<path id="mo_twMs" opacity="0" d="M529 126 Q540 138 551 126" stroke="#c0392b" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path id="mo_twMp" opacity="0" d="M528 132 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" stroke="#7a1f1f" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<g id="mo_twAL"><path d="M500 160 L484 230" stroke="#7a2f3a" stroke-width="13" stroke-linecap="round"/><circle cx="484" cy="232" r="8" fill="#f1c9a5"/></g>' +
      '<g id="mo_twAR"><path d="M580 160 L596 230" stroke="#7a2f3a" stroke-width="13" stroke-linecap="round"/><circle cx="596" cy="232" r="8" fill="#f1c9a5"/></g>' +
      '<path id="mo_twCr" d="M560 160 L576 180 L558 196 L578 214 L562 232" fill="none" stroke="#e11d1d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></g></g></g></g></g>';
    u.insertAdjacentHTML("beforeend", '<div id="mo_tw" style="position:absolute;left:0;top:0;width:1080px;height:1920px;opacity:0"><svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px">' + m + '</svg></div>');
    tl.set("#mo_twC", { y: -460 }, 0);
    [0, 1, 2, 3, 4].forEach(function (j) { tl.set("#mo_twA" + j, { scale: 0, svgOrigin: "540 1180" }, 0); });
    st.tw = {};
  }
  M.tower = function (t, mode, t1, o) {
    o = o || {}; buildTower(); var i;
    R.dirty("tower", function (tt, d) { PF.O("#mo_tw", 1, 0, tt, d ? 0.2 : 0.01); });
    if (!mode) {                             // obloha s hmlou, mrakodrap, meno; lietadlo narazi (o.hit s)
      var th = t + (o.hit || 0.9);
      PF.O("#mo_tw", 0, 1, t, 0.14);
      tl.fromTo("#mo_twT", { scale: 1.25, svgOrigin: "540 960" }, { scale: 1, duration: 0.6, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo("#mo_twFg", { x: -60 }, { x: 140, duration: 4.5, ease: "none", immediateRender: false }, t);
      tl.fromTo("#mo_twN", { scale: 0.4, rotation: -8, svgOrigin: "275 185" }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.1);
      tl.fromTo("#mo_twPl", { attr: { transform: "translate(-260 440)" } }, { attr: { transform: "translate(350 515)" }, duration: th - t, ease: "none", immediateRender: false }, t);
      PF.S("#mo_twPl", { opacity: 0 }, th);
      tl.fromTo("#mo_twX", { opacity: 1, scale: 0.2, svgOrigin: "440 520" }, { opacity: 0, scale: 1.8, duration: 0.6, ease: "power2.out", immediateRender: false }, th);
      PF.O("#mo_twSm", 0, 0.85, th + 0.1, 0.3);
      tl.fromTo("#mo_twSm", { y: 0 }, { y: -120, duration: 3, ease: "power1.out", immediateRender: false }, th + 0.1);
      PF.O("#mo_twM", 0, 1, th + 0.05, 0.1);
      tl.fromTo("#mo_flash", { opacity: 0.55 }, { opacity: 0, duration: 0.3, immediateRender: false }, th);
      H.shake(th, 0.4, 12);
      return null;
    }
    if (mode === "floors") {                 // pocitadlo 0 -> 75, kabinka pada vezou
      var d = o.dur || 2.0, n = o.to || 75, N = Math.round(d * 30);
      PF.O("#mo_twF", 0, 1, t, 0.08);
      tl.fromTo("#mo_twF", { scale: 0.4, rotation: 8, svgOrigin: "180 790" }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      PF.O("#mo_twL", 0, 0.85, t, 0.15);
      tl.fromTo("#mo_twM", { y: 0 }, { y: 950, duration: d, ease: "power2.in", immediateRender: false }, t + 0.1);
      for (i = 1; i <= N; i++) { var k = i / N; tl.set("#mo_twD", { innerHTML: String(Math.round(n * k * k)) }, t + 0.1 + d * k); }
      tl.fromTo("#mo_twF", { scale: 1.15 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.1 + d);
      tl.fromTo("#mo_twDu", { opacity: 0.9, scale: 0.3, svgOrigin: "540 1480" }, { opacity: 0, scale: 1.6, duration: 0.6, ease: "power2.out", immediateRender: false }, t + 0.1 + d);
      H.shake(t + 0.1 + d, 0.3, 10);
      return null;
    }
    if (mode === "pit") {                    // priblizenie na dno sachty, kabina s Betty pada
      tl.fromTo("#mo_twT", { scale: 1, opacity: 1, svgOrigin: "540 1470" }, { scale: 2.8, opacity: 0, duration: 0.4, ease: "power2.in", immediateRender: false }, t);
      PF.O("#mo_twP", 0, 1, t + 0.15, 0.25);
      tl.fromTo("#mo_twC", { y: -460 }, { y: 520, duration: 0.6, ease: "power2.in", immediateRender: false }, t + 0.1);
      return null;
    }
    if (mode === "air") {                    // vzduch pod kabinou sa stlaci a brzdi
      for (i = 0; i < 5; i++) tl.fromTo("#mo_twA" + i, { scale: 0 }, { scale: 1, duration: 0.45, ease: "back.out(1.6)", immediateRender: false }, t + i * 0.07);
      tl.fromTo("#mo_twC", { y: 520 }, { y: 760, duration: 0.85, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo("#mo_twAir", { scaleY: 1, svgOrigin: "540 1240" }, { scaleY: 0.8, duration: 0.85, ease: "power1.in", immediateRender: false }, t);
      return null;
    }
    if (mode === "coil") {                   // stocene lana pruzia ako pruzina
      tl.fromTo("#mo_twC", { y: 760 }, { y: 975, duration: 0.2, ease: "power2.in", immediateRender: false }, t);
      tl.fromTo("#mo_twC", { y: 975 }, { y: 935, duration: 0.22, ease: "power2.out", immediateRender: false }, t + 0.2);
      tl.fromTo("#mo_twC", { y: 935 }, { y: 952, duration: 0.2, ease: "power2.inOut", immediateRender: false }, t + 0.42);
      tl.fromTo("#mo_twK", { scaleY: 1, svgOrigin: "540 1390" }, { scaleY: 0.6, duration: 0.2, ease: "power2.in", immediateRender: false }, t);
      tl.fromTo("#mo_twK", { scaleY: 0.6 }, { scaleY: 0.82, duration: 0.22, ease: "power2.out", immediateRender: false }, t + 0.2);
      tl.fromTo("#mo_twK", { scaleY: 0.82 }, { scaleY: 0.7, duration: 0.2, ease: "power2.inOut", immediateRender: false }, t + 0.42);
      tl.fromTo("#mo_twAir", { scaleY: 0.8, scaleX: 1, opacity: 1 }, { scaleY: 0.3, scaleX: 1.6, opacity: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, t + 0.05);
      H.shake(t + 0.2, 0.3, 10);
      var w = o.wob || 3.3, nw = (Math.round(w / 0.3) | 1);
      tl.fromTo("#mo_twK", { scaleY: 0.7 }, { scaleY: 0.75, duration: w / (nw + 1), ease: "sine.inOut", yoyo: true, repeat: nw, immediateRender: false }, t + 0.62);
      tl.fromTo("#mo_twC", { rotation: -0.9, svgOrigin: "540 330" }, { rotation: 0.9, duration: w / 8, ease: "sine.inOut", yoyo: true, repeat: 7, immediateRender: false }, t + 0.62);
      PF.O("#mo_twDs", 0, 1, t + 0.25, 0.15);
      for (i = 0; i < 10; i++) tl.fromTo("#mo_twDs" + i, { y: -40 - (i % 3) * 30, opacity: 0.9 }, { y: 50 + (i % 4) * 15, opacity: 0, duration: 1.6 + (i % 3) * 0.5, ease: "power1.out", immediateRender: false }, t + 0.25 + i * 0.17);
      return null;
    }
    if (mode === "lived") {               // prezila: ulava, usmev, mavnutie
      PF.O("#mo_twCr", 1, 0, t, 0.25);
      tl.fromTo("#mo_twB", { rotation: 9 }, { rotation: 3, duration: 0.35, ease: "power2.out", immediateRender: false }, t);
      PF.S("#mo_twEp,#mo_twMp,#mo_twMo", { opacity: 0 }, t); PF.S("#mo_twEn,#mo_twMs", { opacity: 1 }, t);
      tl.fromTo("#mo_twAR", { rotation: 0, svgOrigin: "580 160" }, { rotation: -150, duration: 0.25, ease: "back.out(2)", immediateRender: false }, t + 0.05);
      tl.fromTo("#mo_twAR", { rotation: -150 }, { rotation: -120, duration: 0.16, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.3);
      return null;
    }
    if (mode === "back") {                   // zlomeny chrbat: naklon, cervena prasklina
      tl.fromTo("#mo_twB", { rotation: 0, svgOrigin: "540 300" }, { rotation: 9, duration: 0.25, ease: "back.out(2)", immediateRender: false }, t);
      PF.O("#mo_twCr", 0, 1, t, 0.08);
      PF.S("#mo_twEn,#mo_twMo,#mo_twMs", { opacity: 0 }, t); PF.S("#mo_twEp,#mo_twMp", { opacity: 1 }, t);
      tl.fromTo("#mo_twCr", { opacity: 1 }, { opacity: 0.35, duration: 0.15, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t + 0.1);
      H.shake(t, 0.25, 8);
      return null;
    }
    return null;
  };

  // ================= MEMO (karty na konci)
  M.memo = function (t, mode, t1, o) {
    o = o || {}; var u = UI(), id = H.uid("mo_elMm"), h;
    if (mode === "nojump") {
      h = '<div class="mo mo-left mo-side" id="' + id + '" style="top:' + (o.y || 150) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "THE JUMP") + '</span>' +
        '<svg viewBox="0 0 220 270"><g fill="' + INK + '"><circle cx="110" cy="62" r="30"/><path d="M84 100 Q110 88 136 100 L130 170 L90 170 Z"/>' +
        '<path d="M88 104 L48 56" stroke="' + INK + '" stroke-width="20" stroke-linecap="round"/><path d="M132 104 L172 56" stroke="' + INK + '" stroke-width="20" stroke-linecap="round"/>' +
        '<path d="M96 166 L74 206 L92 238" fill="none" stroke="' + INK + '" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 166 L146 206 L128 238" fill="none" stroke="' + INK + '" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/></g>' +
        '<g id="' + id + 'X" opacity="0"><path d="M30 40 L190 240 M190 40 L30 240" stroke="#fbf5ea" stroke-width="44" stroke-linecap="round"/><path d="M30 40 L190 240 M190 40 L30 240" stroke="' + RED + '" stroke-width="26" stroke-linecap="round"/></g></svg></div></div>';
      u.insertAdjacentHTML("beforeend", h);
      PF.O("#" + id, 0, 1, t, 0.06);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -3, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      PF.S("#" + id + "X", { opacity: 1 }, t + 0.35);
      tl.fromTo("#" + id + "X", { scale: 2.4, svgOrigin: "110 140" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, t + 0.35);
      H.shake(t + 0.5, 0.2, 8);
    } else {
      h = '<div class="mo mo-right mo-side" id="' + id + '" style="top:' + (o.y || 150) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "BETTY") + '</span>' +
        '<svg viewBox="0 0 220 270"><ellipse cx="110" cy="112" rx="88" ry="100" fill="#e9dcc4" stroke="#b9a37f" stroke-width="8"/>' +
        '<path d="M44 196 Q110 150 176 196 L176 212 L44 212 Z" fill="#2f3e66"/><path d="M96 168 L110 186 L124 168" fill="#fbf5ea"/>' +
        '<circle cx="110" cy="112" r="44" fill="#f1c9a5"/><path d="M62 106 Q64 54 110 54 Q156 54 158 106 Q146 80 110 80 Q74 80 62 106 Z" fill="#5a3420"/><circle cx="68" cy="98" r="20" fill="#5a3420"/><circle cx="152" cy="98" r="20" fill="#5a3420"/>' +
        '<circle cx="95" cy="112" r="5" fill="' + INK + '"/><circle cx="125" cy="112" r="5" fill="' + INK + '"/><path d="M98 134 Q110 144 122 134" stroke="#c0392b" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<g id="' + id + 'R"><path d="M8 214 H212 L200 236 L212 258 H8 L20 236 Z" fill="' + RED + '"/><text x="110" y="246" style="font-family:Pop;font-weight:600;font-size:30px;text-anchor:middle;fill:#fbf5ea">' + (o.text || "SURVIVED") + '</text></g></svg></div></div>';
      u.insertAdjacentHTML("beforeend", h);
      PF.O("#" + id, 0, 1, t, 0.06);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 3, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.fromTo("#" + id + "R", { scaleX: 0, svgOrigin: "110 236" }, { scaleX: 1, duration: 0.25, ease: "back.out(2)", immediateRender: false }, t + 0.2);
    }
    var prev = st.mm || [];
    prev.push(id); st.mm = prev;
    R.dirty("memo", function (tt, d) { st.mm.forEach(function (k) { PF.O("#" + k, 1, 0, tt, d ? 0.15 : 0.01); }); st.mm = []; });
    return null;
  };
})();
