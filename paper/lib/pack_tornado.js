// pack_tornado.js - momenty pre video 045 Tornado On The Highway
// highway  "" = dialnica z boku od snimku 0 (burkova obloha, tornado vlavo sa toci, auto s hrdinom, cesta bezi); bez dirty
//          "bridge" = nadjazd prisunie sprava (dirty "ovp"); "glow" = ciarkovany obrys SHELTER? pod nim; "off" = nadjazd prec;
//          "flash" = blesk; "rewind" = cesta bezi naspat, nadjazd odide doprava, tornado sa vzdiali (dirty "far"); "near" = tornado sa vrati
// underpass "" = celoplosny pohlad pod most (hrdina stoji); "wind" = pomaly vietor; "fast" = vietor zrychli cez medzeru;
//          "crouch" = hrdina sa skrci; "target" = cerveny zameriavac; "debris" = doska, znacka, kuzel letia medzerou
// radar    "" = karta OKLAHOMA 1999 s radarom a ukazovatelom; "hit" = ABOUT 300 MPH buchne (dirty "radar")
// ovmap    "" = mapa s 3 nadjazdmi; "mark" = tri tmave znacky jedna po druhej (dirty "ovmap")
// shelter  "" = rez domom, hrdina zide do pivnice; "base" = pivnica zelena; "inner" = vnutorna izba zelena; "nocar" = auto preskrtnute
// buckle   "xray" = dvere priesvitne; "click" = pas sa zapne; "duck" = hlava pod okna; "shards" = crepiny letia nad nim
// ditch    "" = jarok pod cestou (hrdina stoji); "lie" = lahne; "line" = ciarkovana uroven cesty + sipka; "cover" = ruky na hlavu
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake, uid = H.uid;
  var INK = "#2b2320", RED = "#d9483b";
  var CP = { tx: 90, ty: 120, s: 0.7, r: 0 };          // poza v aute (snimok 0 = posledny)
  function TOT() { return PF.VO.total || 30; }
  function loopTo(sel, from, to, per, t0, t1) {          // nekonecny cyklus (od t0 po t1, inak cele video)
    if (!(PF.VO.total > 0)) return;
    var a = t0 || 0, b = t1 || TOT(), p = t1 ? per : PF.loopPeriod(per), n = Math.max(1, Math.round((b - a) / p));
    var v = Object.assign({}, to, { duration: p, ease: "none", repeat: n - 1, immediateRender: false });
    tl.fromTo(sel, from, v, a);
  }
  function yoyo(sel, from, to, per) {
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, from, Object.assign({}, to, { duration: p / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * n - 1, immediateRender: false }), 0);
  }
  function flash(t, a) { tl.fromTo("#mo_flash", { opacity: a || 0.7 }, { opacity: 0, duration: 0.25, ease: "power1.out", immediateRender: false }, t); }
  function hide(id, t, d) { PF.O("#" + id, 1, 0, t, d || 0.01); }
  function show(id, t, d) { PF.O("#" + id, 0, 1, t, d || 0.01); }

  // ---------- spolocne kresby
  function sky(id, mid) {
    return '<rect x="-600" y="-700" width="2280" height="1900" fill="url(#mo_tnSky)"/>' + (mid || "") +
      '<g id="' + id + 'Cl" opacity="0.9"><g id="' + id + 'ClM">' + [0, 1].map(function (k) {
        var o = k * 1200, s = "";
        [[-200, 300, 1.3], [180, 380, 1.0], [520, 290, 1.4], [860, 400, 1.1]].forEach(function (c) {
          var x = c[0] + o, y = c[1], q = c[2];
          s += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (230 * q).toFixed(0) + '" ry="' + (70 * q).toFixed(0) + '" fill="#2e3440"/>' +
            '<ellipse cx="' + (x + 90) + '" cy="' + (y + 30) + '" rx="' + (160 * q).toFixed(0) + '" ry="' + (50 * q).toFixed(0) + '" fill="#3a414e"/>'; });
        return s; }).join("") + '</g></g>';
  }
  function funnel(id, cx, top, base, w1, lean) {          // tornado: zakriveny lievik (roh), tmavsi ako obloha, oblukove pruhy bezia do strany, prach + ulomky dole
    var w0 = w1 * 0.13, bx = cx + (lean || 0), h = base - top, i, s = "";
    var Lx = [cx - w1 / 2, cx - w0 * 0.7 + (lean || 0) * 0.3, bx - w0 / 2], Rx = [cx + w1 / 2, cx + w0 * 0.7 + (lean || 0) * 0.3, bx + w0 / 2], Yc = [top, top + h * 0.5, base];
    function q(P, t) { return (1 - t) * (1 - t) * P[0] + 2 * t * (1 - t) * P[1] + t * t * P[2]; }
    var d = "M" + Lx[0] + " " + top + " Q " + Lx[1] + " " + Yc[1] + " " + Lx[2] + " " + base + " L " + Rx[2] + " " + base + " Q " + Rx[1] + " " + Yc[1] + " " + Rx[0] + " " + top + " Z";
    document.getElementById("defs").insertAdjacentHTML("beforeend", '<clipPath id="' + id + 'C"><path d="' + d + '"/></clipPath>' +
      '<linearGradient id="' + id + 'G" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2f37"/><stop offset="0.45" stop-color="#4a505a"/><stop offset="1" stop-color="#2f343c"/></linearGradient>');
    var N = 14, dash = Math.round(w1 * 0.34), gap = Math.round(w1 * 0.2);
    for (i = 0; i < N; i++) { var t = (i + 0.4) / N, y = q(Yc, t), xl = q(Lx, t), xr = q(Rx, t), wy = xr - xl;
      s += '<path d="M' + (xl - 12).toFixed(0) + ' ' + y.toFixed(0) + ' Q ' + ((xl + xr) / 2).toFixed(0) + ' ' + (y + wy * 0.26 + 6).toFixed(0) + ' ' + (xr + 12).toFixed(0) + ' ' + y.toFixed(0) +
        '" fill="none" stroke="' + (i % 2 ? "#8a9099" : "#1f242b") + '" stroke-width="' + Math.max(6, h / N * 0.42).toFixed(0) + '" stroke-linecap="round" opacity="' + (i % 2 ? 0.75 : 0.6) + '"/>'; }
    var deb = "", du = "", rr = PF.rnd(cx + top);
    for (i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, rx = w1 * 0.36, xx = bx + Math.cos(a) * rx, yy = base - 40 + Math.sin(a) * rx;
      deb += '<rect x="' + (xx - 7).toFixed(0) + '" y="' + (yy - 5).toFixed(0) + '" width="' + (12 + rr() * 16).toFixed(0) + '" height="10" rx="2" fill="' + (i % 3 ? "#4a3c30" : "#7d6a55") + '"/>'; }
    [[-0.34, 0.16, 0.2], [0, 0.22, 0.24], [0.32, 0.17, 0.19], [-0.15, 0.1, 0.17], [0.16, 0.12, 0.17]].forEach(function (b, k) {
      du += '<ellipse cx="' + (bx + b[0] * w1).toFixed(0) + '" cy="' + (base - b[1] * w1 * 0.55).toFixed(0) + '" rx="' + (b[2] * w1).toFixed(0) + '" ry="' + (b[2] * w1 * 0.55).toFixed(0) + '" fill="' + (k % 2 ? "#7a6d5c" : "#665a4b") + '" opacity="0.85"/>'; });
    return '<g id="' + id + '"><g id="' + id + 'Sw">' +
      '<g clip-path="url(#' + id + 'C)"><rect x="' + (cx - w1) + '" y="' + (top - 20) + '" width="' + (2 * w1 + Math.abs(lean || 0)) + '" height="' + (h + 40) + '" fill="url(#' + id + 'G)"/>' +
      '<g id="' + id + 'St" style="stroke-dasharray:' + dash + ' ' + gap + ';stroke-dashoffset:0">' + s + '</g></g>' +
      '<path d="' + d + '" fill="none" stroke="#1d2128" stroke-width="6" opacity="0.55"/>' +
      '<g id="' + id + 'Du">' + du + '</g>' +
      '<g transform="translate(' + bx + ' ' + (base - 40) + ') scale(1 0.32) translate(' + (-bx) + ' ' + (-(base - 40)) + ')"><g id="' + id + 'Db">' + deb + '</g></g>' +
      '</g></g>';
  }
  function spin(id, w1, cx, base, lean) {                // rozpohybuj tornado (cele video, slucka)
    var L = Math.round(w1 * 0.34) + Math.round(w1 * 0.2);
    loopTo("#" + id + "St", { strokeDashoffset: 0 }, { strokeDashoffset: -2 * L }, 0.7);
    loopTo("#" + id + "Db", { rotation: 0, svgOrigin: (cx + (lean || 0)) + " " + (base - 40) }, { rotation: 360 }, 1.1);
    yoyo("#" + id + "Du", { scale: 0.92, svgOrigin: (cx + (lean || 0)) + " " + base }, { scale: 1.1 }, 0.9);
    yoyo("#" + id + "Sw", { x: -w1 * 0.08 }, { x: w1 * 0.08 }, 3.2);
  }

  // ================= HIGHWAY + AUTO (od snimku 0)
  function car() {
    var body = '<path d="M150 1180 Q150 1124 210 1120 L770 1120 L905 1150 Q1045 1168 1052 1235 L1052 1380 Q1052 1420 1012 1420 L190 1420 Q150 1420 150 1380 Z" fill="#3d6fb0" stroke="#2c5590" stroke-width="8"/>' +
      '<path d="M160 1300 H1042" stroke="#2c5590" stroke-width="6"/><rect x="560" y="1170" width="70" height="16" rx="8" fill="#2c5590"/>' +
      '<rect x="1018" y="1215" width="34" height="46" rx="10" fill="#ffd34d"/><rect x="150" y="1180" width="22" height="50" rx="8" fill="#e2475b"/>';
    var frame = '<path d="M196 1124 L300 826 L720 818 L905 1124" fill="none" stroke="#3d6fb0" stroke-width="34" stroke-linejoin="round"/>' +
      '<path d="M196 1124 L300 826 L720 818 L905 1124" fill="none" stroke="#2c5590" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M215 1110 L310 842 L712 834 L880 1110 Z" fill="#cfe7f5" opacity="0.14"/>' +
      '<rect x="900" y="1092" width="46" height="34" rx="8" fill="#2c5590"/>' +
      '<ellipse cx="808" cy="1060" rx="16" ry="58" fill="none" stroke="#2b2320" stroke-width="12" transform="rotate(-14 808 1060)"/>';
    var wheel = function (x) { return '<circle cx="' + x + '" cy="1420" r="70" fill="#2b2320"/><circle cx="' + x + '" cy="1420" r="36" fill="#9aa2aa"/>' +
      '<g id="mo_tnWh' + x + '"><path d="M' + x + ' 1390 V1450 M' + (x - 30) + ' 1420 H' + (x + 30) + '" stroke="#5d646b" stroke-width="9" stroke-linecap="round"/></g>'; };
    var xr = '<g id="mo_tnDoorX" opacity="0"><path d="M150 1180 Q150 1124 210 1120 L770 1120 L905 1150 Q1045 1168 1052 1235 L1052 1380 Q1052 1420 1012 1420 L190 1420 Q150 1420 150 1380 Z" fill="none" stroke="#2c5590" stroke-width="10" stroke-dasharray="26 14"/>' +
      '<path d="M200 1122 H900" stroke="' + RED + '" stroke-width="8" stroke-dasharray="22 14"/></g>';
    return { body: body, frame: frame, wheels: wheel(330) + wheel(870), xr: xr };
  }
  function buildHw() {
    if (st.hw) return st.hw;
    var Hh = C().hero, p = Hh.p, m = "", i, posts = "", trees = "", dash = "";
    ["fd_B", "fd_M", "fd_F"].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.display = "none"; });
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_tnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#343b48"/><stop offset="0.55" stop-color="#5d6776"/><stop offset="1" stop-color="#9aa39f"/></linearGradient>' +
      '<linearGradient id="mo_tnFld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f7d4c"/><stop offset="1" stop-color="#4a6a3c"/></linearGradient>');
    m += sky("mo_tnHw", funnel("mo_tnT", 230, 300, 1165, 400, 40));
    m += '<path id="mo_tnBolt" d="M760 420 L720 560 L760 560 L700 760 L800 520 L755 520 L800 420 Z" fill="#fff6c8" opacity="0"/>';
    m += '<rect x="-600" y="1160" width="2280" height="240" fill="url(#mo_tnFld)"/>';
    for (i = 0; i < 20; i++) { var tx = -300 + i * 120; trees += '<ellipse cx="' + tx + '" cy="1162" rx="' + (40 + (i % 3) * 14) + '" ry="' + (26 + (i % 2) * 10) + '" fill="#3e5a34"/>'; }
    for (i = 0; i < 20; i++) { var px = -300 + i * 150; posts += '<rect x="' + px + '" y="1300" width="14" height="80" fill="#7a5a3c"/>'; }
    for (i = 0; i < 14; i++) dash += '<rect x="' + (-400 + i * 240) + '" y="1700" width="130" height="16" fill="#e8e2c8"/>';
    m += '<g id="mo_tnScP"><g id="mo_tnTr">' + trees + '</g><g id="mo_tnPo">' + posts + '<path d="M-600 1318 H1700 M-600 1350 H1700" stroke="#8a6a4a" stroke-width="5"/></g></g>';
    m += '<rect x="-600" y="1395" width="2280" height="1300" fill="#4b4f57"/><rect x="-600" y="1395" width="2280" height="10" fill="#d8d4c4"/>';
    m += '<g id="mo_tnScQ"><g id="mo_tnDa">' + dash + '</g></g>';
    // nadjazd (prichadza sprava)
    var ov = '<rect x="430" y="650" width="60" height="760" fill="#9e998f"/><rect x="1000" y="650" width="60" height="760" fill="#9e998f"/>' +
      '<rect x="360" y="560" width="900" height="92" fill="#b9b4aa" stroke="#8a857c" stroke-width="6"/><rect x="360" y="626" width="900" height="26" fill="#8f8a80"/>';
    for (i = 0; i < 12; i++) ov += '<rect x="' + (372 + i * 76) + '" y="522" width="10" height="40" fill="#8a857c"/>';
    ov += '<rect x="360" y="518" width="900" height="10" fill="#8a857c"/>';
    ov += '<g id="mo_tnSh" opacity="0"><rect x="520" y="668" width="470" height="140" rx="20" fill="#ffd34d" fill-opacity="0.16" stroke="#ffd34d" stroke-width="8" stroke-dasharray="26 16"/>' +
      '<text x="755" y="757" style="font-family:Pop;font-weight:600;font-size:58px;text-anchor:middle;fill:#ffd34d">SHELTER?</text></g>';
    m += '<g id="mo_tnOv">' + ov + '</g>';
    m += '<rect x="-600" y="-700" width="2280" height="2800" fill="#1d2230" opacity="0" id="mo_tnDim"/>';
    var c = car();
    var back = '<g id="mo_tnCarB"><rect x="505" y="950" width="250" height="190" rx="40" fill="#3b3f47"/><rect x="575" y="850" width="110" height="100" rx="26" fill="#3b3f47"/></g>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_tnHw">' + m + '</g>' + back + '<g id="mo_tnScenes"></g>');
    document.getElementById(p + "float").insertAdjacentHTML("afterend", '<g id="mo_tnCarF"><g id="mo_tnCarBo">' + c.body + '</g>' + c.xr + c.frame + c.wheels + '</g><g id="mo_tnFront"></g>');
    spin("mo_tnT", 400, 230, 1165, 40);
    loopTo("#mo_tnHwClM", { x: 0 }, { x: -1200 }, TOT() > 0 ? TOT() : 30);
    loopTo("#mo_tnPo", { x: 0 }, { x: -150 }, 0.32);
    loopTo("#mo_tnTr", { x: 0 }, { x: -120 }, 1.2);
    loopTo("#mo_tnDa", { x: 0 }, { x: -240 }, 0.25);
    loopTo("#mo_tnWh330", { rotation: 0, svgOrigin: "330 1420" }, { rotation: -360 }, 0.4);
    loopTo("#mo_tnWh870", { rotation: 0, svgOrigin: "870 1420" }, { rotation: -360 }, 0.4);
    yoyo("#mo_tnCarF,#mo_tnCarB", { y: 0 }, { y: 4 }, 0.36);
    PF.P("mo_tnOv", 760, 600, { tx: 1250 });
    PF.P("mo_tnT", 230, 1165, {});
    PF.X(p + "float", CP, 0, 0);
    PF.S("#" + p + "legs", { opacity: 0 }, 0);
    Hh.shadow(false, 0);
    st.hw = { ov: false };
    return st.hw;
  }
  function poseReg(extra) {                               // navrat do auta (aj ruky, nohy, oci)
    var Hh = C().hero, p = Hh.p, a0 = C().arms0;
    R.dirty("pose", function (tt, d) {
      PF.X(p + "float", CP, tt, d ? 0.3 : 0); Hh.arm("L", a0[0], tt, d ? 0.3 : 0.01); Hh.arm("R", a0[1], tt, d ? 0.3 : 0.01);
      Hh.leg("L", 0, tt, d ? 0.3 : 0.01); Hh.leg("R", 0, tt, d ? 0.3 : 0.01); PF.X(p + "legs", { sy: 1 }, tt, d ? 0.3 : 0);
      Hh.eyes("eyesN", tt); if (extra) extra(tt, d);
    });
  }
  function pose(t, P, d, ease) { var p = C().hero.p; PF.X(p + "float", P, t, d || 0, ease); poseReg(); }

  M.highway = function (t, mode, t1, o) {
    o = o || {}; var S = buildHw(), Hh = C().hero;
    if (mode === "bridge") {
      PF.X("mo_tnOv", { tx: 0 }, t, o.dur || 1.1, "power2.out"); S.ov = true;
      R.dirty("ovp", function (tt, d) { PF.X("mo_tnOv", { tx: 1250 }, tt, d ? 0.3 : 0); PF.S("#mo_tnSh", { opacity: 0 }, tt + (d ? 0.3 : 0.01)); S.ov = false; });
      return null;
    }
    if (mode === "glow") {
      PF.O("#mo_tnSh", 0, 1, t, 0.1);
      tl.fromTo("#mo_tnSh", { scale: 0.6, svgOrigin: "755 738" }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t);
      tl.fromTo("#mo_tnSh", { opacity: 1 }, { opacity: 0.55, duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.35);
      return null;
    }
    if (mode === "off") { R.clean("ovp", t, o.d === undefined ? 0.01 : o.d); return null; }
    if (mode === "flash") {
      tl.fromTo("#mo_tnBolt", { opacity: 1 }, { opacity: 0, duration: 0.09, ease: "none", yoyo: true, repeat: 3, immediateRender: false }, t);
      PF.S("#mo_tnBolt", { opacity: 0 }, t + 0.4);
      flash(t, 0.45); shake(t, 0.3, 8);
      PF.XY("mo_tnT", { s: 1.08 }, t, 0.25, "sine.inOut", 1);
      return null;
    }
    if (mode === "rewind") {                               // auto cuva spod mosta, tornado sa vzdiali
      PF.X("mo_tnOv", { tx: 0 }, t - 0.05, 0);
      PF.X("mo_tnOv", { tx: 1250 }, t + 0.1, 0.9, "power2.in"); S.ov = false;
      tl.fromTo("#mo_tnScP", { x: 0 }, { x: 1200, duration: 1.0, ease: "power1.inOut", immediateRender: false }, t);
      tl.fromTo("#mo_tnScQ", { x: 0 }, { x: 1920, duration: 1.0, ease: "power1.inOut", immediateRender: false }, t);
      PF.S("#mo_tnScP,#mo_tnScQ", { x: 0 }, t + 1.01);
      PF.X("mo_tnT", { s: 0.55, tx: -40 }, t + 0.1, 0.9, "power2.inOut");
      R.dirty("far", function (tt, d) { PF.X("mo_tnT", { s: 1, tx: 0 }, tt, d ? 0.6 : 0); });
      return null;
    }
    if (mode === "cam") { R.clean("pose", t, 0); PF.S("#" + Hh.p + "legs", { opacity: 0 }, t); R.camSet("body", t); PF.CAM(1.06, 618, 1100, t, o.dur === undefined ? 0 : o.dur, "power2.inOut"); return null; }   // ramec auta, cisty strih
    if (mode === "outro") { var to = Math.max(t, TOT() - 0.78); R.clean("card", to, 0.25); R.clean("ovp", to, 0.25); return null; }   // karta + nadjazd prec pred navratom na hook   // ramec auta (po scenach s inou pozou)
    if (mode === "near") { R.clean("far", t, o.dur || 0.8); return null; }
    if (mode === "look") {                                 // hrdina sa otoci za tornadom (hlava + oci)
      var p = Hh.p; Hh.look(-12, -4, t, 0.15); PF.XY(p + "head", { r: -8 }, t, 0.3, "sine.inOut", 1);
      R.dirty("look", function (tt, d) { Hh.look(0, 0, tt, d ? 0.2 : 0); });
      return null;
    }
    return null;                                           // "" = postavit (od snimku 0)
  };

  // tnface: vyraz tvare bez pohybu kamery (hrdina je v aute zmenseny, zaber na tvar by orezal)
  M.tnface = function (t, name, t1, o) {
    R.setFace(t, name || "worried");
    R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? 0.2 : 0); });
    return null;
  };

  // ================= POD MOSTOM
  function buildUb() {
    if (st.ub) return;
    var m = "", f = "", i, sl = "", fs = "";
    m += sky("mo_tnUb", funnel("mo_tnU", 140, 420, 1180, 220, 20));
    m += '<rect x="-600" y="1175" width="2280" height="240" fill="url(#mo_tnFld)"/><rect x="-600" y="1405" width="2280" height="1300" fill="#4b4f57"/><rect x="-600" y="1405" width="2280" height="10" fill="#d8d4c4"/>';
    m += '<rect x="300" y="620" width="1000" height="800" fill="#141821" opacity="0.38"/>';
    m += '<rect x="290" y="300" width="1100" height="250" fill="#b9b4aa" stroke="#8a857c" stroke-width="8"/><rect x="290" y="490" width="1100" height="60" fill="#9e998f"/>';
    for (i = 0; i < 6; i++) m += '<rect x="' + (330 + i * 150) + '" y="550" width="70" height="80" fill="#6e6a64"/>';
    m += '<rect x="290" y="550" width="1100" height="22" fill="#6e6a64"/><path d="M960 572 L1090 572 L1090 1420 L960 1420 Z" fill="#a39e94" stroke="#8a857c" stroke-width="8"/>';
    var Y = [520, 680, 840, 1000, 1160, 1320, 1470], Yc = [720, 820, 920, 1020, 1120, 1220, 1320];
    for (i = 0; i < 7; i++) {
      var d = "M-120 " + Y[i] + " C 140 " + Y[i] + " 180 " + Yc[i] + " 330 " + Yc[i] + " L 1200 " + Yc[i];
      sl += '<path d="' + d + '" fill="none" stroke="#eef4fb" stroke-width="7" stroke-linecap="round" stroke-dasharray="70 90" opacity="0.6"/>';
      fs += '<path d="' + d + '" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-dasharray="190 70" opacity="0.85"/>';
    }
    f += '<g id="mo_tnWs" opacity="0"><g id="mo_tnWsM">' + sl + '</g></g><g id="mo_tnWf" opacity="0"><g id="mo_tnWfM">' + fs + '</g></g>';
    f += '<g id="mo_tnTg" opacity="0"><g id="mo_tnTgIn"><circle cx="410" cy="870" r="250" fill="none" stroke="' + RED + '" stroke-width="12" stroke-dasharray="40 22"/>' +
      '<circle cx="410" cy="870" r="150" fill="none" stroke="' + RED + '" stroke-width="8"/>' +
      '<path d="M410 580 V690 M410 1050 V1160 M120 870 H230 M590 870 H700" stroke="' + RED + '" stroke-width="12" stroke-linecap="round"/></g></g>';
    f += '<g id="mo_tnDb" opacity="0">' +
      '<g id="mo_tnD1"><rect x="-200" y="860" width="190" height="30" rx="5" fill="#a5774c" stroke="#7a5a3c" stroke-width="5"/></g>' +
      '<g id="mo_tnD2"><path d="M-130 780 L-80 830 L-130 880 L-180 830 Z" fill="#f2c230" stroke="#2b2320" stroke-width="6"/><rect x="-136" y="880" width="12" height="90" fill="#8f979f"/></g>' +
      '<g id="mo_tnD3"><path d="M-150 1150 L-110 1040 L-70 1150 Z" fill="#f08a2b" stroke="#c76f1c" stroke-width="5"/><rect x="-162" y="1146" width="104" height="16" rx="4" fill="#f08a2b"/><rect x="-128" y="1080" width="36" height="16" fill="#ffffff"/></g></g>';
    document.getElementById("mo_tnScenes").insertAdjacentHTML("beforeend", '<g id="mo_tnUb" opacity="0">' + m + '</g>');
    document.getElementById("mo_tnFront").insertAdjacentHTML("beforeend", '<g id="mo_tnUbF" opacity="0">' + f + '</g>');
    spin("mo_tnU", 220, 140, 1180, 20);
    loopTo("#mo_tnUbClM", { x: 0 }, { x: -1200 }, TOT() > 0 ? TOT() : 30);
    loopTo("#mo_tnWsM", { x: 0 }, { x: 160 }, 0.55);
    loopTo("#mo_tnWfM", { x: 0 }, { x: 260 }, 0.22);
    st.ub = 1;
  }
  M.underpass = function (t, mode, t1, o) {
    o = o || {}; buildHw(); buildUb(); var Hh = C().hero, p = Hh.p;
    if (!mode) {
      flash(t - 0.02, 0.8);
      PF.S("#mo_tnUb,#mo_tnUbF", { opacity: 1 }, t); PF.S("#" + p + "legs", { opacity: 1 }, t); hide("mo_tnCarF", t); hide("mo_tnCarB", t);
      pose(t, { tx: 110, ty: 70, s: 0.8, r: 0 }, 0);
      Hh.arm("L", 30, t, 0.3); Hh.arm("R", -30, t, 0.3);
      R.setFace(t, "worried");
      R.dirty("under", function (tt, d) {
        PF.S("#mo_tnUb,#mo_tnUbF", { opacity: 0 }, tt); PF.S("#" + p + "legs", { opacity: 0 }, tt); PF.S("#mo_tnWs,#mo_tnWf,#mo_tnTg,#mo_tnDb", { opacity: 0 }, tt);
        show("mo_tnCarF", tt); show("mo_tnCarB", tt);
      });
      return null;
    }
    if (mode === "wind") { PF.O("#mo_tnWs", 0, 1, t, 0.25); Hh.look(-12, 0, t, 0.15); return null; }
    if (mode === "fast") {
      PF.O("#mo_tnWf", 0, 1, t, 0.15); PF.O("#mo_tnWs", 1, 0.3, t, 0.2);
      PF.XY(p + "up", { r: 5 }, t, 0.12, "sine.inOut", 7); shake(t, 0.5, 6);
      R.setFace(t, "shocked");
      return null;
    }
    if (mode === "crouch") {
      PF.X(p + "float", { ty: 150, r: -4 }, t, 0.25, "power2.out"); PF.X(p + "legs", { sy: 0.7 }, t, 0.25);
      Hh.arm("L", 70, t, 0.25); Hh.arm("R", -70, t, 0.25); Hh.look(0, 0, t, 0.15);
      R.setFace(t, "worried");
      return null;
    }
    if (mode === "target") {
      PF.O("#mo_tnTg", 0, 1, t, 0.06);
      tl.fromTo("#mo_tnTgIn", { scale: 1.8, svgOrigin: "410 870" }, { scale: 1, duration: 0.22, ease: "power3.in", immediateRender: false }, t);
      tl.fromTo("#mo_tnTgIn", { rotation: 0, svgOrigin: "410 870" }, { rotation: 45, duration: 1.6, ease: "power1.inOut", immediateRender: false }, t + 0.22);
      PF.punch(t + 0.22, 1.03);
      return null;
    }
    if (mode === "debris") {                               // doska, znacka, kuzel letia medzerou rovno na neho
      PF.S("#mo_tnDb", { opacity: 1 }, t);
      [["#mo_tnD1", 0, 1400, 0, 540], ["#mo_tnD2", 0.28, 1400, -40, -420], ["#mo_tnD3", 0.55, 1400, -60, 300]].forEach(function (q) {
        tl.fromTo(q[0], { x: 0, y: 0, rotation: 0, transformOrigin: "50% 50%" }, { x: q[2], y: q[3], rotation: q[4], duration: 0.55, ease: "none", immediateRender: false }, t + q[1]); });
      PF.S("#mo_tnDb", { opacity: 0 }, t + 1.15);
      Hh.arm("L", 150, t + 0.15, 0.15); Hh.arm("R", -150, t + 0.15, 0.15);
      PF.X(p + "float", { r: 6 }, t + 0.2, 0.15); PF.X(p + "float", { r: -4 }, t + 0.5, 0.2);
      shake(t + 0.3, 0.4, 10); PF.VIG(t + 0.3, 0.5);
      R.setFace(t + 0.1, "shocked");
      return null;
    }
    return null;
  };

  // ================= RADAR (Oklahoma 1999, ABOUT 300 MPH) - samostatna karta, ziadny most
  M.radar = function (t, mode, t1, o) {
    o = o || {}; var u = UI();
    if (!st.rd) {
      var tk = "", i;
      for (i = 0; i <= 10; i++) { var a = Math.PI - i / 10 * Math.PI, r0 = 120, r1 = i % 5 ? 104 : 94;
        tk += '<path d="M' + (300 + r0 * Math.cos(a)).toFixed(1) + ' ' + (210 - r0 * Math.sin(a)).toFixed(1) + ' L' + (300 + r1 * Math.cos(a)).toFixed(1) + ' ' + (210 - r1 * Math.sin(a)).toFixed(1) + '"/>'; }
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right" id="mo_tnRd" style="top:' + (o.y || 150) + 'px"><div class="mo-paper" id="mo_tnRdIn" style="padding:18px 28px 16px;width:500px">' +
        '<div style="font-family:Hand;font-weight:700;font-size:42px;letter-spacing:4px;color:' + RED + ';line-height:1.1;margin-bottom:6px">OKLAHOMA 1999</div>' +
        '<svg viewBox="0 0 440 240" style="position:static;display:block;width:440px;height:240px;margin:0 auto">' +
        '<path d="M300 210 m-120 0 a120 120 0 0 1 240 0" fill="none" stroke="#e7dccb" stroke-width="30"/>' +
        '<path d="M' + (300 + 120 * Math.cos(Math.PI * 0.25)).toFixed(1) + ' ' + (210 - 120 * Math.sin(Math.PI * 0.25)).toFixed(1) + ' A120 120 0 0 1 420 210" fill="none" stroke="#f0a99f" stroke-width="30"/>' +
        '<g stroke="' + INK + '" stroke-width="5" stroke-linecap="round">' + tk + '</g>' +
        '<g id="mo_tnRdN"><path d="M294 210 L300 104 L306 210 Z" fill="' + RED + '"/></g><circle cx="300" cy="210" r="14" fill="' + INK + '"/>' +
        '<path d="M40 225 L95 225 L80 170 Z" fill="#8f979f"/><g transform="rotate(-30 80 150)"><path d="M30 150 A50 50 0 0 0 130 150 Z" fill="#dfe3e6" stroke="' + INK + '" stroke-width="6"/><path d="M80 150 L80 112" stroke="' + INK + '" stroke-width="6"/><circle cx="80" cy="110" r="8" fill="' + RED + '"/></g>' +
        '<g id="mo_tnRdW" fill="none" stroke="#3fa35b" stroke-width="7" stroke-linecap="round"><path id="mo_tnRdW0" d="M118 84 q16 14 0 30"/><path id="mo_tnRdW1" d="M134 70 q28 28 0 58"/><path id="mo_tnRdW2" d="M150 56 q40 42 0 86"/></g></svg>' +
        '<div id="mo_tnRdV" style="font-family:Pop;font-weight:600;font-size:84px;line-height:1;color:' + RED + ';opacity:0;margin-top:6px">ABOUT 300 MPH</div></div></div>');
      tl.set("#mo_tnRdN", { rotation: -88, svgOrigin: "300 210" }, 0);
      st.rd = 1;
    }
    if (mode === "hit") {                                  // rucicka do cervenej, cislo buchne
      tl.fromTo("#mo_tnRdN", { rotation: -60 }, { rotation: 70, duration: 0.35, ease: "power2.in", immediateRender: false }, t - 0.35);
      tl.fromTo("#mo_tnRdN", { rotation: 70 }, { rotation: 78, duration: 0.08, ease: "none", yoyo: true, repeat: 15, immediateRender: false }, t);
      PF.S("#mo_tnRdV", { opacity: 1 }, t);
      tl.fromTo("#mo_tnRdV", { scale: 2.2 }, { scale: 1, duration: 0.15, ease: "power3.in", immediateRender: false }, t);
      PF.punch(t + 0.15, 1.035); shake(t + 0.15, 0.25, 9);
      return null;
    }
    PF.O("#mo_tnRd", 0, 1, t, 0.06);
    tl.fromTo("#mo_tnRdIn", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    tl.fromTo("#mo_tnRdN", { rotation: -88 }, { rotation: -60, duration: 0.5, ease: "power1.inOut", immediateRender: false }, t + 0.2);
    [0, 1, 2].forEach(function (k) { tl.fromTo("#mo_tnRdW" + k, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "none", yoyo: true, repeat: 9, immediateRender: false }, t + 0.1 + k * 0.12); });
    R.dirty("radar", function (tt, d) { PF.O("#mo_tnRd", 1, 0, tt, d ? 0.15 : 0.01); });
    return null;
  };

  // ================= MAPA: 3 nadjazdy (stridmo, bez cisiel okrem 3)
  M.ovmap = function (t, mode, t1, o) {
    o = o || {}; var u = UI();
    var B = [[150, 150], [255, 200], [345, 132]];
    if (!st.om) {
      var br = "";
      B.forEach(function (b, i) { br += '<g id="mo_tnOm' + i + '" opacity="0"><rect x="' + (b[0] - 34) + '" y="' + (b[1] - 12) + '" width="68" height="16" rx="3" fill="#8f8a80"/>' +
        '<rect x="' + (b[0] - 28) + '" y="' + (b[1] + 4) + '" width="10" height="22" fill="#8f8a80"/><rect x="' + (b[0] + 18) + '" y="' + (b[1] + 4) + '" width="10" height="22" fill="#8f8a80"/></g>' +
        '<g id="mo_tnOk' + i + '" opacity="0"><circle cx="' + b[0] + '" cy="' + (b[1] - 42) + '" r="17" fill="#3a3f47" stroke="#fbf5ea" stroke-width="5"/><path d="M' + b[0] + ' ' + (b[1] - 25) + ' V' + (b[1] - 12) + '" stroke="#3a3f47" stroke-width="6"/></g>'; });
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right" id="mo_tnOmC" style="top:' + (o.y || 150) + 'px"><div class="mo-paper" id="mo_tnOmIn" style="padding:16px 26px 14px;width:500px">' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:8px"><span id="mo_tnOm3" style="font-family:Pop;font-weight:600;font-size:96px;line-height:1;color:#3a3f47;opacity:0">3</span>' +
        '<span style="font-family:Hand;font-weight:700;font-size:34px;letter-spacing:3px;line-height:1.25;color:#3a3f47;text-align:left">UNDER OR NEAR<br>OVERPASSES</span></div>' +
        '<svg viewBox="0 0 440 260" style="position:static;display:block;width:440px;height:260px;margin:0 auto">' +
        '<path d="M20 40 H170 V80 H420 V200 Q380 230 320 222 Q250 236 190 222 Q140 210 110 196 V80 H20 Z" fill="#efe3c6" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="M110 150 H420 M250 80 V230 M150 96 Q260 170 400 120" fill="none" stroke="#b9ad94" stroke-width="7"/>' + br + '</svg></div></div>');
      st.om = 1;
    }
    if (mode === "mark") {                                 // tri tmave znacky jedna po druhej (bez otrasov)
      [0, 1, 2].forEach(function (i) { var tt = t + i * (o.step || 0.35);
        PF.O("#mo_tnOk" + i, 0, 1, tt, 0.12);
        tl.fromTo("#mo_tnOk" + i, { y: -30 }, { y: 0, duration: 0.25, ease: "power2.out", immediateRender: false }, tt); });
      return null;
    }
    R.clean("radar", t - 0.12, 0.12);
    PF.O("#mo_tnOmC", 0, 1, t, 0.06);
    tl.fromTo("#mo_tnOmIn", { scale: 0.5, rotation: -6 }, { scale: 1, rotation: -1, duration: 0.3, ease: "back.out(1.6)", immediateRender: false }, t);
    [0, 1, 2].forEach(function (i) { PF.O("#mo_tnOm" + i, 0, 1, t + 0.25 + i * 0.12, 0.12); });
    PF.O("#mo_tnOm3", 0, 1, t + 0.1, 0.05);
    tl.fromTo("#mo_tnOm3", { scale: 1.8 }, { scale: 1, duration: 0.2, ease: "power3.in", immediateRender: false }, t + 0.1);
    R.dirty("ovmap", function (tt, d) { PF.O("#mo_tnOmC", 1, 0, tt, d ? 0.15 : 0.01); });
    return null;
  };

  // ================= KROK 1: rez domom, pivnica
  function buildHs() {
    if (st.hs) return;
    var m = "", i, rain = "";
    m += sky("mo_tnHs", funnel("mo_tnHT", 960, 250, 690, 160, 10));
    for (i = 0; i < 24; i++) rain += '<path d="M' + (-100 + i * 55) + ' ' + (60 + (i % 4) * 140) + ' l-18 60" stroke="#b9c6d6" stroke-width="4" stroke-linecap="round" opacity="0.6"/>';
    m += '<g id="mo_tnRn">' + rain + '<g transform="translate(0 560)">' + rain + '</g></g>';
    m += '<rect x="-600" y="700" width="2280" height="2000" fill="#7a5a44"/><rect x="-600" y="686" width="2280" height="20" fill="#5f8f4c"/>';
    m += '<path d="M80 440 L480 300 L880 440 Z" fill="#b5523b" stroke="#8f3f2c" stroke-width="8" stroke-linejoin="round"/>';
    m += '<rect x="110" y="436" width="740" height="268" fill="#efe6d6" stroke="#c9bca5" stroke-width="6"/>';
    m += '<rect x="170" y="500" width="110" height="100" fill="#5d6776" stroke="#8a7d68" stroke-width="8"/><path d="M225 500 V600 M170 550 H280" stroke="#8a7d68" stroke-width="6"/>';
    m += '<rect x="680" y="500" width="110" height="100" fill="#5d6776" stroke="#8a7d68" stroke-width="8"/><path d="M735 500 V600 M680 550 H790" stroke="#8a7d68" stroke-width="6"/>';
    m += '<rect id="mo_tnHsI" x="370" y="440" width="220" height="262" fill="#e3d6bf"/><path d="M370 440 V702 M590 440 V702" stroke="#c9bca5" stroke-width="10"/>' +
      '<rect x="440" y="560" width="80" height="142" rx="6" fill="#b48a5e"/><rect id="mo_tnHsIg" x="370" y="440" width="220" height="262" fill="#5fd08a" opacity="0"/>';
    m += '<rect x="90" y="700" width="790" height="42" fill="#8a8378"/>';
    m += '<rect x="96" y="742" width="778" height="740" fill="#d8cfbf" stroke="#8a8378" stroke-width="14"/>';
    var stp = ""; for (i = 0; i < 8; i++) stp += '<rect x="' + (110 + i * 26) + '" y="' + (760 + i * 90) + '" width="' + (220 - i * 26) + '" height="22" fill="#a39684"/>';
    m += stp + '<path d="M110 750 L330 1480" stroke="#8a7d68" stroke-width="10"/>';
    m += '<rect x="780" y="760" width="80" height="40" fill="#5d6776" stroke="#8a8378" stroke-width="6"/><path d="M700 742 V790" stroke="#5d646b" stroke-width="4"/><circle cx="700" cy="800" r="16" fill="#ffe07a"/>';
    m += '<rect id="mo_tnHsBg" x="103" y="749" width="764" height="726" fill="#5fd08a" opacity="0"/>';
    m += '<g id="mo_tnHsK1" opacity="0"><circle cx="790" cy="880" r="46" fill="#3fa35b" stroke="#ffffff" stroke-width="8"/><path d="M766 882 L784 902 L816 862" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></g>';
    m += '<g id="mo_tnHsK2" opacity="0"><circle cx="480" cy="500" r="40" fill="#3fa35b" stroke="#ffffff" stroke-width="7"/><path d="M459 502 L475 519 L503 484" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>';
    m += '<g id="mo_tnHsCar"><path d="M890 690 L890 650 Q890 640 905 640 L940 640 L960 615 L1010 615 L1030 640 Q1046 642 1046 660 L1046 690 Z" fill="#3d6fb0" stroke="#2c5590" stroke-width="5"/>' +
      '<circle cx="925" cy="692" r="14" fill="#2b2320"/><circle cx="1012" cy="692" r="14" fill="#2b2320"/></g>';
    m += '<g id="mo_tnHsX" opacity="0"><path d="M880 600 L1050 710 M1050 600 L880 710" stroke="#fbf5ea" stroke-width="30" stroke-linecap="round"/><path d="M880 600 L1050 710 M1050 600 L880 710" stroke="' + RED + '" stroke-width="16" stroke-linecap="round"/></g>';
    document.getElementById("mo_tnScenes").insertAdjacentHTML("beforeend", '<g id="mo_tnHs" opacity="0">' + m + '</g>');
    spin("mo_tnHT", 160, 960, 690, 10);
    loopTo("#mo_tnRn", { y: -560 }, { y: 0 }, 0.5);
    loopTo("#mo_tnHsClM", { x: 0 }, { x: -1200 }, TOT() > 0 ? TOT() : 30);
    st.hs = 1;
  }
  M.shelter = function (t, mode, t1, o) {
    o = o || {}; buildHw(); buildHs(); var Hh = C().hero, p = Hh.p;
    if (mode === "base") {
      tl.fromTo("#mo_tnHsBg", { opacity: 0 }, { opacity: 0.4, duration: 0.25, ease: "power1.out", immediateRender: false }, t);
      tl.fromTo("#mo_tnHsBg", { opacity: 0.4 }, { opacity: 0.25, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t + 0.25);
      PF.O("#mo_tnHsK1", 0, 1, t + 0.1, 0.05);
      tl.fromTo("#mo_tnHsK1", { scale: 0.3, svgOrigin: "790 880" }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t + 0.1);
      R.setFace(t, "smile"); PF.XY(p + "float", { ty: 70 }, t, 0.14, "power2.out", 1);
      return null;
    }
    if (mode === "inner") {
      tl.fromTo("#mo_tnHsIg", { opacity: 0 }, { opacity: 0.45, duration: 0.25, ease: "power1.out", immediateRender: false }, t);
      PF.O("#mo_tnHsK2", 0, 1, t + 0.1, 0.05);
      tl.fromTo("#mo_tnHsK2", { scale: 0.3, svgOrigin: "480 500" }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t + 0.1);
      Hh.look(0, -12, t, 0.15);
      return null;
    }
    if (mode === "nocar") {
      PF.O("#mo_tnHsX", 0, 1, t, 0.04);
      tl.fromTo("#mo_tnHsX", { scale: 2.2, svgOrigin: "965 655" }, { scale: 1, duration: 0.15, ease: "power3.in", immediateRender: false }, t);
      PF.punch(t + 0.15, 1.03); shake(t + 0.15, 0.2, 7);
      Hh.look(12, -6, t, 0.15);
      return null;
    }
    flash(t - 0.02, 0.8);
    PF.S("#mo_tnHs", { opacity: 1 }, t); PF.S("#" + p + "legs", { opacity: 1 }, t); hide("mo_tnCarF", t); hide("mo_tnCarB", t);
    pose(t, { tx: -240, ty: -90, s: 0.75, r: 0 }, 0);
    PF.X(p + "float", { tx: 60, ty: 95 }, t + 0.05, 0.6, "power1.inOut");   // zide po schodoch do pivnice
    Hh.leg("L", 14, t + 0.05, 0.15); Hh.leg("L", 0, t + 0.35, 0.15); Hh.leg("R", -14, t + 0.25, 0.15); Hh.leg("R", 0, t + 0.5, 0.15);
    R.setFace(t, "worried");
    R.dirty("house", function (tt, d) {
      PF.S("#mo_tnHs", { opacity: 0 }, tt); PF.S("#" + p + "legs", { opacity: 0 }, tt); PF.S("#mo_tnHsBg,#mo_tnHsIg,#mo_tnHsK1,#mo_tnHsK2,#mo_tnHsX", { opacity: 0 }, tt);
      show("mo_tnCarF", tt); show("mo_tnCarB", tt); Hh.look(0, 0, tt, 0);
    });
    return null;
  };

  // ================= KROK 2: v aute, zapnuty pas, hlava pod okna
  M.buckle = function (t, mode, t1, o) {
    o = o || {}; buildHw(); var Hh = C().hero, p = Hh.p;
    if (!st.bk) {
      document.getElementById(p + "armL").insertAdjacentHTML("beforebegin", '<g id="mo_tnBelt" opacity="0"><path id="mo_tnBeltP" d="M668 940 L412 1262" stroke="#4a4f57" stroke-width="30" stroke-linecap="round"/>' +
        '<rect x="392" y="1240" width="46" height="34" rx="6" fill="#c9ccd2" stroke="#2b2320" stroke-width="5"/></g>');
      document.getElementById("mo_tnFront").insertAdjacentHTML("beforeend", '<g id="mo_tnShd" opacity="0">' + [0, 1, 2, 3, 4, 5].map(function (i) {
        var x = -40 - i * 60, y = 880 + (i % 3) * 70; return '<path id="mo_tnSd' + i + '" d="M' + x + ' ' + y + ' l34 -16 l-8 34 Z" fill="#dff1fb" stroke="#ffffff" stroke-width="3"/>'; }).join("") + '</g>');
      st.bk = 1;
    }
    var undo = function () { R.dirty("belt", function (tt, d) {
      PF.O("#mo_tnBelt", 1, 0, tt, d ? 0.2 : 0.01); PF.O("#mo_tnCarBo", 0.3, 1, tt, d ? 0.2 : 0.01); PF.O("#mo_tnDoorX", 1, 0, tt, d ? 0.2 : 0.01); PF.S("#mo_tnShd", { opacity: 0 }, tt); }); };
    if (mode === "xray") { R.camSet("body", t); PF.CAM(1.06, 588, 1075, t, 0);   // zamok kamery na aktualnom ramci (dalsi F("body") nebude nasledovat pozu hlava dole)
      PF.O("#mo_tnCarBo", 1, 0.3, t, 0.3); PF.O("#mo_tnDoorX", 0, 1, t, 0.3); undo(); return null; }
    if (mode === "click") {
      PF.S("#mo_tnBelt", { opacity: 1 }, t);
      tl.fromTo("#mo_tnBeltP", { attr: { d: "M668 940 L668 960" } }, { attr: { d: "M668 940 L412 1262" }, duration: 0.3, ease: "power2.out", immediateRender: false }, t);
      Hh.arm("L", 40, t, 0.2); Hh.arm("L", C().arms0[0], t + 0.4, 0.25);
      PF.punch(t + 0.3, 1.025); undo();
      return null;
    }
    if (mode === "duck") {
      PF.X(p + "float", { tx: 110, ty: 250, s: 0.6, r: 22 }, t, 0.3, "power2.in");
      Hh.arm("L", 130, t, 0.3); Hh.arm("R", -130, t, 0.3);
      R.setFace(t + 0.1, "worried"); poseReg(); undo();
      return null;
    }
    if (mode === "shards") {
      PF.S("#mo_tnShd", { opacity: 1 }, t);
      [0, 1, 2, 3, 4, 5].forEach(function (i) { tl.fromTo("#mo_tnSd" + i, { x: 0, rotation: 0, transformOrigin: "50% 50%" }, { x: 1400, rotation: 540, duration: 0.7, ease: "none", immediateRender: false }, t + i * 0.06); });
      PF.S("#mo_tnShd", { opacity: 0 }, t + 1.1);
      shake(t, 0.35, 8);
      return null;
    }
    return null;
  };

  // ================= KROK 3: jarok nizsie ako cesta
  function buildDt() {
    if (st.dt) return;
    var m = "", f = "", i;
    m += sky("mo_tnDt", funnel("mo_tnDT", 650, 300, 835, 240, 25));
    m += '<rect x="-600" y="830" width="2280" height="40" fill="#5f7d4c"/><rect x="-600" y="860" width="2280" height="44" fill="#4b4f57"/><rect x="-600" y="858" width="2280" height="6" fill="#d8d4c4"/>';
    m += '<g transform="translate(70 800)"><path d="M0 60 L0 30 Q0 22 12 22 L40 22 L60 0 L120 0 L140 22 Q160 24 160 40 L160 60 Z" fill="#3d6fb0" stroke="#2c5590" stroke-width="5"/><circle cx="35" cy="62" r="14" fill="#2b2320"/><circle cx="125" cy="62" r="14" fill="#2b2320"/></g>';
    m += '<defs><linearGradient id="mo_tnSlope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9a57"/><stop offset="1" stop-color="#3f6034"/></linearGradient></defs>';
    m += '<rect x="-600" y="904" width="2280" height="500" fill="url(#mo_tnSlope)"/><rect x="-600" y="1390" width="2280" height="1300" fill="#3a4f2e"/>';
    m += '<g id="mo_tnLv" opacity="0"><path d="M-40 882 H1120" stroke="#ffd34d" stroke-width="12" stroke-dasharray="34 18"/>' +
      '<path d="M140 900 V1300" stroke="#ffd34d" stroke-width="12" stroke-dasharray="20 12"/><path d="M114 1266 L140 1312 L166 1266" fill="none" stroke="#ffd34d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="420" y="912" width="440" height="88" rx="16" fill="#1d2230" opacity="0.82"/>' +
      '<text x="640" y="976" style="font-family:Pop;font-weight:600;font-size:56px;letter-spacing:3px;text-anchor:middle;fill:#ffd34d">ROAD LEVEL</text></g>';
    for (i = 0; i < 6; i++) { var d = "M-120 " + (600 + i * 50) + " L1200 " + (610 + i * 50); f += '<path d="' + d + '" fill="none" stroke="#eef4fb" stroke-width="8" stroke-linecap="round" stroke-dasharray="120 90" opacity="0.6"/>'; }
    var tuft = ""; for (i = 0; i < 18; i++) { var x = -20 + i * 64; tuft += '<path d="M' + x + ' 1500 l10 -60 l10 60 l12 -44 l10 44" fill="#2f4a26"/>'; }
    document.getElementById("mo_tnScenes").insertAdjacentHTML("beforeend", '<g id="mo_tnDt" opacity="0">' + m + '<g id="mo_tnDw"><g id="mo_tnDwM">' + f + '</g></g></g>');
    document.getElementById("mo_tnFront").insertAdjacentHTML("beforeend", '<g id="mo_tnDtF" opacity="0">' + tuft + '</g>');
    spin("mo_tnDT", 240, 650, 835, 25);
    loopTo("#mo_tnDwM", { x: 0 }, { x: 210 }, 0.3);
    loopTo("#mo_tnDtClM", { x: 0 }, { x: -1200 }, TOT() > 0 ? TOT() : 30);
    st.dt = 1;
  }
  M.ditch = function (t, mode, t1, o) {
    o = o || {}; buildHw(); buildDt(); var Hh = C().hero, p = Hh.p;
    if (mode === "lie") {
      PF.X(p + "float", { tx: -20, ty: 250, r: 90 }, t, 0.4, "power2.inOut");
      Hh.arm("L", 20, t, 0.3); Hh.arm("R", -20, t, 0.3);
      return null;
    }
    if (mode === "line") {
      PF.O("#mo_tnLv", 0, 1, t, 0.1);
      tl.fromTo("#mo_tnLv", { y: -30 }, { y: 0, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      return null;
    }
    if (mode === "cover") {
      Hh.arm("L", 160, t, 0.25, "power2.out"); Hh.arm("R", -160, t, 0.25, "power2.out");
      Hh.eyes("eyesCl", t + 0.15);
      PF.XY(p + "float", { ty: 262 }, t + 0.3, 0.12, "sine.inOut", 3);
      return null;
    }
    flash(t - 0.02, 0.8);
    PF.S("#mo_tnBelt", { opacity: 0 }, t + 0.01); R.clean("pose", t, 0); Hh.arm("L", C().arms0[0], t, 0.01); Hh.arm("R", C().arms0[1], t, 0.01);   // okamzite (bez prelinania z polohy v aute)
    PF.S("#mo_tnDt,#mo_tnDtF", { opacity: 1 }, t); PF.S("#" + p + "legs", { opacity: 1 }, t); hide("mo_tnCarF", t); hide("mo_tnCarB", t);
    pose(t, { tx: 0, ty: 60, s: 0.8, r: 0 }, 0);
    R.camSet("body", t); PF.CAM(1.06, 528, 1040, t, 0);   // cisty strih na blesku + zamok kamery
    R.setFace(t, "worried");
    R.dirty("ditch", function (tt, d) {
      PF.S("#mo_tnDt,#mo_tnDtF,#mo_tnLv", { opacity: 0 }, tt); PF.S("#" + p + "legs", { opacity: 0 }, tt); show("mo_tnCarF", tt); show("mo_tnCarB", tt);
    });
    return null;
  };
})();
