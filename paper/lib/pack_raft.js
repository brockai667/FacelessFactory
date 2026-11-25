// pack_raft.js - momenty pre video 049 Alone In A Life Raft (more + oranzovy clun od snimku 0, pocitadlo dni, destilacia, ryba,
// voda v tele, plachta, mapa zhora so sea anchor, majak a zrkadlo)
// rfsea    "" = more, obloha, clun s hrdinom (od snimku 0, bez dirty); "sink" = plachetnica na horizonte sa potopi; "rock" = vlna rozkyve clun
// rfdays   "guess" = karta "? DAYS" s kalendarom (dirty "days"); cislo = napocita dni a buchne
// rfraft   "tape" = meter pod clunom "6 FT" (dirty "tape"); "still" = priehladna kupola na destilaciu; "drip" = kvapky stecu do pohara (dirty "still");
//          "fish" = ryba vyskoci a hrdina ju chyti (dirty "fish"); "canopy" = plachta nad clunom, tien, luce sa odrazia (dirty "canopy")
// rfbody   "show" = voda v trupe (rontgen); "drop" = kvapka potu na sluche; "save" = kvapka spat do tela, hladina stupne (dirty "body");
//          "clock" = karta s hodinami +TIME (dirty "bclock"); "rest" = oddych, privrete oci (dirty "rest"); "sweat" = tri kvapky -> jedna (dirty "sweat")
// rfmap    pohlad zhora (celoplosny panel): "" = clun sa rozbehne prec od X; "anchor" = kotva na lane; "slow" = clun zostane, duch bez kotvy ujde;
//          "x" = kruh okolo X; "off" = panel prec (dirty "map")
// rfsignal "beacon" = majak na clune zasvieti a blika (dirty "beacon"); "rings" = vlny k satelitu; "mirror" = zrkadlo, luc sa prejde po horizonte;
//          "ship" = luc na lodi, zablesk (dirty "mirror")
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake, uid = H.uid;
  var HOR = 470, CX = 540, CY = 1180, RX = 440, RY = 100, TW = 84, WL = 1272;
  var ORG = "#f07a1e", ORGD = "#c95e12", INK = "#2b2320", RED = "#d9483b";
  function TOT() { return PF.VO.total || 30; }
  function Hr() { return C().hero; }
  function loopX(sel, dx, per) {
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, { x: 0 }, { x: dx, duration: p, ease: "none", repeat: n - 1, immediateRender: false }, 0);
  }
  function yoyo(sel, a, b, per) {           // kmitanie cele video, konci v pociatocnom stave
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    var A = {}, B = {}, k; for (k in a) A[k] = a[k]; for (k in b) B[k] = b[k];
    B.duration = p / 2; B.ease = "sine.inOut"; B.yoyo = true; B.repeat = 2 * n - 1; B.immediateRender = false;
    tl.fromTo(sel, A, B, 0);
  }
  function wave(y, a, s, x0, x1) { var d = "M" + x0 + " " + y; for (var x = x0; x < x1; x += 2 * s) d += " q" + s / 2 + " " + (-a) + " " + s + " 0 q" + s / 2 + " " + a + " " + s + " 0"; return d; }
  function ey(x, side) { var q = (x - CX) / RX; return CY + side * RY * Math.sqrt(Math.max(0, 1 - q * q)); }
  var BX = 90;
  function left(t, t1) { return (t1 || t + 3) - t - 0.12; }

  // ================= MORE + CLUN (od snimku 0)
  function build() {
    if (st.rf) return st.rf;
    var h = Hr(), p = h.p, m = "", i, rb = "", rf = "", wf = "";
    ["fd_B", "fd_M", "fd_F"].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.display = "none"; });
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_rfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6dbbe8"/><stop offset="1" stop-color="#d9eff8"/></linearGradient>' +
      '<linearGradient id="mo_rfSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4aa9d8"/><stop offset="0.5" stop-color="#2a7fbf"/><stop offset="1" stop-color="#174f87"/></linearGradient>' +
      '<clipPath id="mo_rfBoC"><rect x="-600" y="-700" width="2280" height="1960"/></clipPath>' +
      '<clipPath id="mo_rfTc"><path d="M382 965 Q382 905 442 905 H638 Q698 905 698 965 V1292 H382 Z"/></clipPath>' +
      '<clipPath id="mo_rfCupC"><path d="M118 1122 H182 L176 1184 H124 Z"/></clipPath>');
    // obloha, slnko, mraky, more s vlnami
    m += '<rect x="-600" y="-700" width="2280" height="' + (HOR + 710) + '" fill="url(#mo_rfSky)"/>';
    m += '<circle cx="870" cy="250" r="150" fill="url(#gSun)" opacity="0.9"/><g filter="url(#cut)"><circle cx="870" cy="250" r="70" fill="#ffe07a"/></g>';
    m += '<g id="mo_rfCl"><g fill="#ffffff" opacity="0.95"><path d="M120 190 c-20 -40 30 -60 60 -40 c20 -40 90 -30 90 10 c40 0 50 40 20 50 h-160 c-30 0 -30 -20 -10 -20 z"/><path d="M-160 360 c-20 -40 30 -60 60 -40 c20 -40 90 -30 90 10 c40 0 50 40 20 50 h-160 c-30 0 -30 -20 -10 -20 z"/></g></g>';
    m += '<rect x="-600" y="' + HOR + '" width="2280" height="2400" fill="url(#mo_rfSea)"/>';
    for (i = 0; i < 7; i++) { var y = HOR + 26 + i * i * 22 + i * 40, s = 30 + i * 14, a = 5 + i * 3;
      m += '<g opacity="' + (0.32 + i * 0.07).toFixed(2) + '"><g id="mo_rfW' + i + '"><path d="' + wave(y, a, s, -600, 1800) + '" fill="none" stroke="#e6f6ff" stroke-width="' + (3 + i * 1.6).toFixed(1) + '" stroke-linecap="round"/></g></g>'; }
    // plachetnica na horizonte (potopi sa) + lod v dialke (ciel zrkadla)
    // velka plachetnica hned vedla clunu (od snimku 0, potopi sa v hacku; na konci sa vynori spat)
    m += '<g clip-path="url(#mo_rfBoC)"><g id="mo_rfBo"><g id="mo_rfBoI">' +
      '<path d="M-300 1010 H370 Q350 1080 300 1130 H-220 Q-280 1080 -300 1010 Z" fill="#fbf5ea" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round"/>' +
      '<path d="M-292 1040 H362" stroke="' + RED + '" stroke-width="16"/>' +
      '<g fill="#7fb3d5" stroke="' + INK + '" stroke-width="5"><circle cx="-160" cy="1078" r="15"/><circle cx="-80" cy="1078" r="15"/><circle cx="0" cy="1078" r="15"/></g>' +
      '<rect x="-40" y="960" width="200" height="54" rx="10" fill="#e8e3da" stroke="' + INK + '" stroke-width="7"/>' +
      '<path d="M110 1010 V250" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M122 270 Q300 560 330 950 H122 Z" fill="#ffffff" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round"/>' +
      '<path d="M98 300 Q-60 600 -150 950 H98 Z" fill="' + RED + '" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round"/>' +
      '<path d="M110 250 L170 270 L110 290 Z" fill="#f6c343" stroke="' + INK + '" stroke-width="5"/></g></g>' +
      '<g id="mo_rfBb" opacity="0" fill="#ffffff"><circle cx="20" cy="1225" r="18"/><circle cx="90" cy="1215" r="26"/><circle cx="170" cy="1228" r="15"/><circle cx="240" cy="1220" r="20"/></g></g>';
    m += '<g id="mo_rfSh" opacity="0"><g id="mo_rfShI" transform="translate(720 ' + HOR + ') scale(1.6) translate(-720 ' + (-HOR) + ')"><path d="M672 ' + (HOR - 2) + ' H770 L758 ' + (HOR + 14) + ' H682 Z" fill="#3b4652"/><rect x="698" y="' + (HOR - 22) + '" width="40" height="20" fill="#3b4652"/>' +
      '<rect x="724" y="' + (HOR - 38) + '" width="10" height="18" fill="#3b4652"/></g>' +
      '<g id="mo_rfSg" opacity="0"><g id="mo_rfSgI"><path d="M720 ' + (HOR - 76) + ' L732 ' + (HOR - 34) + ' L774 ' + (HOR - 22) + ' L732 ' + (HOR - 10) + ' L720 ' + (HOR + 32) + ' L708 ' + (HOR - 10) + ' L666 ' + (HOR - 22) + ' L708 ' + (HOR - 34) + ' Z" fill="#ffffff"/>' +
      '<circle cx="720" cy="' + (HOR - 22) + '" r="16" fill="#fff6c2"/></g></g></g>';
    m += '<g id="mo_rfBm" opacity="0"></g>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_rfBack">' + m + '</g>');
    // plachta (za hrdinom) + zadna cast clunu a dno
    rb += '<g id="mo_rfCan" opacity="0"><g id="mo_rfCanI">' +
      '<path d="M128 1160 C 118 660 300 440 540 440 C 780 440 962 660 952 1160 Z" fill="#e8662a" stroke="' + INK + '" stroke-width="6" stroke-opacity="0.25"/>' +
      '<path d="M200 1160 C 196 720 340 528 540 528 C 740 528 884 720 880 1160 Z" fill="#6e3418"/>' +
      '<path d="M128 1160 C 118 660 300 440 540 440 C 780 440 962 660 952 1160" fill="none" stroke="#f6a13a" stroke-width="26" stroke-linecap="round"/>' +
      '<g fill="#e8f2f5"><rect x="526" y="446" width="28" height="34" rx="4"/><rect x="214" y="640" width="28" height="34" rx="4" transform="rotate(-38 228 657)"/><rect x="838" y="640" width="28" height="34" rx="4" transform="rotate(38 852 657)"/></g></g></g>';
    rb += '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + RX + '" ry="' + RY + '" fill="#8f4513" stroke="' + ORG + '" stroke-width="' + TW + '"/>';
    rb += '<ellipse cx="' + CX + '" cy="' + (CY + 8) + '" rx="' + (RX - 50) + '" ry="' + (RY - 34) + '" fill="#7a3a10"/>';
    rb += '<path d="M' + (CX - RX + 18) + ' ' + (CY - 22) + ' A' + (RX - 14) + ' ' + (RY - 6) + ' 0 0 1 ' + (CX + RX - 18) + ' ' + (CY - 22) + '" fill="none" stroke="#ffb066" stroke-width="10" stroke-linecap="round" opacity="0.8"/>';
    // predna cast clunu (pred hrdinom): tuba, lano, reflexne pasky; skupina pre veci, co sa hybu s clunom
    rf += '<path d="M' + (CX - RX) + ' ' + CY + ' A' + RX + ' ' + RY + ' 0 0 0 ' + (CX + RX) + ' ' + CY + '" fill="none" stroke="' + ORG + '" stroke-width="' + TW + '" stroke-linecap="round"/>';
    rf += '<path d="M' + (CX - RX + 6) + ' ' + (CY - 24) + ' A' + (RX - 6) + ' ' + RY + ' 0 0 0 ' + (CX + RX - 6) + ' ' + (CY - 24) + '" fill="none" stroke="#ffb066" stroke-width="10" stroke-linecap="round" opacity="0.85"/>';
    rf += '<path d="M' + (CX - RX + 30) + ' ' + (CY + 22) + ' A' + (RX - 30) + ' ' + (RY - 4) + ' 0 0 0 ' + (CX + RX - 30) + ' ' + (CY + 22) + '" fill="none" stroke="#f4efe6" stroke-width="6" stroke-dasharray="60 22"/>';
    [-300, -110, 110, 300].forEach(function (dx) { var x = CX + dx, yy = ey(x, 1); rf += '<rect x="' + (x - 16) + '" y="' + (yy - 30) + '" width="32" height="44" rx="4" fill="#e8f2f5" opacity="0.9"/>'; });
    rf += '<g id="mo_rfRfx"></g>';
    var fl = document.getElementById(p + "float");
    fl.insertAdjacentHTML("beforebegin", '<g id="mo_rfRock"><g id="mo_rfBob"><g id="mo_rfRb">' + rb + '</g></g></g>');
    var bob = document.getElementById("mo_rfBob");
    bob.appendChild(fl);
    bob.insertAdjacentHTML("beforeend", '<g id="mo_rfRf">' + rf + '</g>');
    // voda pred clunom (zakryva nohy a spodok tuby)
    wf += '<g id="mo_rfWf"><g id="mo_rfWs"><path d="' + wave(WL, 12, 60, -600, 1800) + ' V 2600 H -600 Z" fill="#2f86c4" fill-opacity="0.95"/>' +
      '<path d="' + wave(WL, 12, 60, -600, 1800) + '" fill="none" stroke="#e8f7ff" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="' + wave(WL + 120, 7, 50, -600, 1800) + '" fill="none" stroke="#bfe6fb" stroke-width="5" opacity="0.55"/>' +
      '<path d="' + wave(WL + 260, 7, 70, -600, 1800) + '" fill="none" stroke="#bfe6fb" stroke-width="5" opacity="0.4"/></g></g>';
    document.getElementById("mo_rfRock").insertAdjacentHTML("afterend", wf + '<g id="mo_rfFx"></g>');
    for (i = 0; i < 7; i++) loopX("#mo_rfW" + i, (i % 2 ? 2 : -2) * (30 + i * 14), 3.4 - i * 0.25);
    loopX("#mo_rfWs", -120, 1.8);
    loopX("#mo_rfCl", 0, 9);
    yoyo("#mo_rfWf", { y: -6 }, { y: 7 }, 2.6);
    yoyo("#mo_rfBob", { y: -5 }, { y: 9 }, 2.2);
    yoyo("#mo_rfBob", { rotation: -1.3, svgOrigin: "540 1240" }, { rotation: 1.3, svgOrigin: "540 1240" }, 3.4);
    h.shadow(false, 0);
    PF.P("mo_rfBoI", 60, 1100, { tx: BX });
    st.rf = {};
    return st.rf;
  }
  function fxSplash(x, y, t, k) {
    var id = uid("mo_rfSp"), g = document.getElementById("mo_rfFx"), dd = "";
    k = k || 1;
    [[-40, -54, 12], [0, -80, 15], [40, -56, 11], [-70, -26, 9], [70, -28, 9]].forEach(function (q, i) { dd += '<circle id="' + id + 'd' + i + '" cx="' + x + '" cy="' + y + '" r="' + q[2] * k + '" fill="#ffffff"/>'; });
    g.insertAdjacentHTML("beforeend", '<g id="' + id + '" opacity="0"><ellipse id="' + id + 'r" cx="' + x + '" cy="' + (y + 6) + '" rx="40" ry="10" fill="none" stroke="#ffffff" stroke-width="7"/>' + dd + '</g>');
    PF.O("#" + id, 0, 1, t, 0.03);
    [[-40, -54], [0, -80], [40, -56], [-70, -26], [70, -28]].forEach(function (q, i) {
      tl.fromTo("#" + id + "d" + i, { x: 0, y: 0 }, { x: q[0] * k, y: q[1] * k, duration: 0.32, ease: "power2.out", immediateRender: false }, t); });
    tl.fromTo("#" + id + "r", { attr: { rx: 30, ry: 8 } }, { attr: { rx: 90 * k, ry: 20 * k }, duration: 0.4, ease: "power1.out", immediateRender: false }, t);
    PF.O("#" + id, 1, 0, t + 0.28, 0.18);
  }
  M.rfsea = function (t, mode, t1, o) {
    o = o || {}; build();
    if (mode === "sink") {                  // velka lod sa nakloni a potopi hned vedla clunu
      var d = o.dur || 2.2, tp = t + 0.55;
      PF.X("mo_rfBoI", { tx: BX, ty: 0, r: 0 }, t, 0); PF.X("mo_rfBoI", { tx: BX, ty: 30, r: -9 }, t, 0.5, "sine.inOut");
      PF.X("mo_rfBoI", { tx: BX - 80, ty: 900, r: -38 }, tp, d - 0.55, "power2.in");
      PF.S("#mo_rfBo", { opacity: 0 }, t + d + 0.05);
      fxSplash(120, WL - 30, t + 0.1, 1.6); fxSplash(300, WL - 20, tp + 0.4, 1.8); fxSplash(40, WL - 30, tp + 1.0, 1.6);
      PF.O("#mo_rfBb", 0, 1, t + d - 0.4, 0.1);
      tl.fromTo("#mo_rfBb", { y: 0 }, { y: -30, duration: 0.6, ease: "power1.out", immediateRender: false }, t + d - 0.4);
      PF.O("#mo_rfBb", 1, 0, t + d + 0.1, 0.2);
      shake(t + 0.1, 0.35, 10); shake(tp + 0.4, 0.5, 15); PF.punch(tp + 0.4, 1.05);
      if (!st.rfdb) {                       // trosky plavu popred clun
        st.rfdb = 1;
        document.getElementById("mo_rfFx").insertAdjacentHTML("beforeend", '<g id="mo_rfDb" opacity="0">' +
          '<g id="mo_rfDb0"><rect x="160" y="1330" width="190" height="34" rx="8" fill="#b07a4a" stroke="' + INK + '" stroke-width="6" transform="rotate(-8 255 1347)"/></g>' +
          '<g id="mo_rfDb1"><rect x="40" y="1370" width="90" height="80" rx="8" fill="#d9a066" stroke="' + INK + '" stroke-width="6" transform="rotate(12 85 1410)"/><path d="M48 1395 L122 1425" stroke="' + INK + '" stroke-width="5" transform="rotate(12 85 1410)"/></g>' +
          '<g id="mo_rfDb2"><circle cx="280" cy="1420" r="40" fill="none" stroke="#ffffff" stroke-width="22"/><circle cx="280" cy="1420" r="40" fill="none" stroke="' + RED + '" stroke-width="22" stroke-dasharray="31 31"/></g></g>');
      }
      PF.O("#mo_rfDb", 0, 1, tp + 0.3, 0.2);
      [[0, 900], [1, 760], [2, 820]].forEach(function (q) {
        tl.fromTo("#mo_rfDb" + q[0], { x: 0, y: 0 }, { x: q[1], y: -10, duration: 2.6, ease: "none", immediateRender: false }, tp + 0.3);
      });
      PF.O("#mo_rfDb", 1, 0, tp + 2.6, 0.2);
      var hh = Hr(), b0 = C().arms0; R.setFace(tp + 0.35, "shocked");
      hh.arm("L", b0[0] - 12, tp + 0.3, 0.15, "power2.out"); hh.arm("R", b0[1] + 12, tp + 0.3, 0.15, "power2.out");
      hh.arm("L", b0[0], tp + 1.6, 0.3); hh.arm("R", b0[1], tp + 1.6, 0.3);
      return null;
    }
    if (mode === "back") {                  // koniec: lod sa vynori spat do pociatocneho stavu (= snimka 0)
      var db = o.dur || 1.1;
      PF.S("#mo_rfBo", { opacity: 1 }, t);
      PF.X("mo_rfBoI", { tx: BX - 80, ty: 900, r: -38 }, t, 0); PF.X("mo_rfBoI", { tx: BX, ty: 0, r: 0 }, t, db, "power2.out");
      fxSplash(120, WL - 30, t + 0.35, 1.6);
      shake(t + 0.35, 0.3, 8);
      return null;
    }
    if (mode === "rock") {
      tl.fromTo("#mo_rfRock", { rotation: 0, svgOrigin: "540 1260" }, { rotation: 5, svgOrigin: "540 1260", duration: 0.22, ease: "sine.out", yoyo: true, repeat: 1, immediateRender: false }, t);
      tl.fromTo("#mo_rfRock", { rotation: 0, svgOrigin: "540 1260" }, { rotation: -3.5, svgOrigin: "540 1260", duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t + 0.45);
      PF.S("#mo_rfRock", { rotation: 0, svgOrigin: "540 1260" }, t + 0.92);
      fxSplash(150, WL - 10, t + 0.05); fxSplash(930, WL - 10, t + 0.45);
      shake(t + 0.05, 0.3, 7);
      return null;
    }
    return null;                             // "" = postavit (od snimku 0)
  };

  // ================= SIROKY ZABER: maly clun v obrovskom prazdnom mori, den a noc (panel)
  function buildWide() {
    if (st.rfwd) return;
    var sv = PF.panel("mo_rfWd", 4, true), m = "", i, j;
    m += '<defs><linearGradient id="mo_rfWsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6dbbe8"/><stop offset="1" stop-color="#d9eff8"/></linearGradient>' +
      '<linearGradient id="mo_rfWse" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9fd6"/><stop offset="1" stop-color="#174f87"/></linearGradient></defs>';
    m += '<rect x="-20" y="-20" width="1120" height="1960" fill="url(#mo_rfWsk)"/>';
    m += '<g id="mo_rfWsun"><circle cx="540" cy="420" r="70" fill="#ffe07a" stroke="#f6c343" stroke-width="10"/>' +
      '<g transform="rotate(180 540 1100)"><circle cx="540" cy="420" r="56" fill="#f4efe6"/></g></g>';
    m += '<g id="mo_rfWz"><rect x="-4000" y="700" width="9080" height="6000" fill="url(#mo_rfWse)"/>';
    for (i = 0; i < 9; i++) for (j = 0; j < 7; j++) { var wx = -60 + j * 190 + (i % 2) * 95, wy = 760 + i * i * 14 + i * 40;
      m += '<path d="M' + wx + ' ' + wy + ' q' + (14 + i * 3) + ' -' + (6 + i) + ' ' + (28 + i * 6) + ' 0" fill="none" stroke="#d8f1ff" stroke-width="' + (3 + i * 0.6).toFixed(1) + '" stroke-linecap="round" opacity="0.6"/>'; }
    m += '<g id="mo_rfWr"><ellipse cx="540" cy="1150" rx="46" ry="12" fill="#8f4513" stroke="' + ORG + '" stroke-width="9"/>' +
      '<rect x="531" y="1120" width="18" height="26" rx="8" fill="#2f4e7a"/><circle cx="540" cy="1112" r="10" fill="#d9a77a"/><path d="M529 1108 a11 11 0 0 1 22 0 z" fill="#f4efe6"/>' +
      '<path d="M470 1166 q14 -6 28 0 M582 1166 q14 -6 28 0" fill="none" stroke="#ffffff" stroke-width="3"/></g></g>';
    m += '<g id="mo_rfWn" opacity="0"><rect x="-20" y="-20" width="1120" height="1960" fill="#0d1838" opacity="0.62"/>';
    [[120, 160], [300, 90], [460, 240], [700, 130], [880, 260], [980, 80], [200, 420], [820, 470], [620, 330]].forEach(function (q) { m += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="5" fill="#fff6c2"/>'; });
    m += '</g>';
    sv.insertAdjacentHTML("beforeend", m);
    PF.P("mo_rfWz", 540, 1150, { s: 9 }); PF.X("mo_rfWz", {}, 0, 0);
    PF.P("mo_rfWsun", 540, 1100, { r: -62 }); PF.X("mo_rfWsun", {}, 0, 0);
    yoyo("#mo_rfWr", { y: -3 }, { y: 4 }, 1.6);
    st.rfwd = 1;
  }
  M.rfwide = function (t, mode, t1, o) {
    o = o || {}; buildWide(); var L = left(t, t1);
    if (mode === "days") {                  // slnko prejde oblohou, noc, rano (cas plynie)
      var d = Math.max(0.8, L);
      PF.X("mo_rfWsun", { r: 298 }, t, d, "none");
      PF.O("#mo_rfWn", 0, 1, t + d * 0.28, d * 0.18); PF.O("#mo_rfWn", 1, 0, t + d * 0.62, d * 0.2);
      PF.X("mo_rfWsun", { r: -62 }, t + d + 0.3, 0);
      return null;
    }
    if (mode === "off") {
      PF.O("#mo_rfWd", 1, 0, t, 0.22);
      PF.X("mo_rfWz", { s: 9 }, t + 0.25, 0);
      R.setFace(t, C().face0); Hr().look(0, 0, t, 0.1);
      return null;
    }
    PF.S("#mo_rfWd", { opacity: 1, clipPath: "circle(0% at 50% 60%)" }, t - 0.15);
    tl.fromTo("#mo_rfWd", { clipPath: "circle(0% at 50% 60%)" }, { clipPath: "circle(80% at 50% 60%)", duration: 0.3, ease: "power2.in", immediateRender: false }, t - 0.15);
    PF.S("#mo_rfWd", { clipPath: "none" }, t + 0.17);
    PF.X("mo_rfWz", { s: 1 }, t, Math.max(0.8, Math.min(o.dur || 1.5, L)), "power3.out");
    return null;
  };

  // ================= POCITADLO DNI (karta hore)
  function buildDays(o) {
    if (st.rfd) return; st.rfd = { on: false };
    var pg = '<rect x="18" y="38" width="94" height="92" rx="8" fill="#ffffff" stroke="' + INK + '" stroke-width="5"/><path d="M34 68 H96 M34 88 H96 M34 108 H80" stroke="#c9c2b6" stroke-width="5"/>';
    UI().insertAdjacentHTML("beforeend", '<div class="mo" id="mo_rfDy" style="top:' + (o.y || 112) + 'px"><div class="mo-paper" id="mo_rfDyIn" style="padding:12px 40px 8px;width:720px;box-sizing:border-box;line-height:1">' +
      '<div id="mo_rfDyL" style="font-family:Hand;font-weight:700;font-size:42px;line-height:1.2;letter-spacing:.14em;color:' + RED + ';margin-bottom:4px">HOW MANY DAYS?</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;height:180px">' +
      '<svg viewBox="0 0 130 140" style="position:static;display:block;flex:none;width:130px;height:140px;margin-right:22px">' +
      '<rect x="10" y="20" width="110" height="114" rx="12" fill="#fbf5ea" stroke="' + INK + '" stroke-width="6"/><rect x="10" y="20" width="110" height="30" rx="10" fill="' + RED + '"/>' +
      '<g id="mo_rfDyP">' + pg + '</g><g id="mo_rfDyP2">' + pg + '</g>' +
      '<g fill="' + INK + '"><rect x="36" y="8" width="10" height="26" rx="5"/><rect x="84" y="8" width="10" height="26" rx="5"/></g></svg>' +
      '<span id="mo_rfDyD" style="font-family:Pop;font-weight:600;font-size:150px;line-height:180px;height:180px;display:inline-block;overflow:hidden;color:' + INK + ';min-width:250px;text-align:center">?</span>' +
      '<span id="mo_rfDyU" style="font-family:Pop;font-weight:600;font-size:72px;line-height:1;display:inline-block;color:' + RED + ';margin-left:14px">DAYS</span></div></div></div>');
  }
  function daysOn(t) {
    if (st.rfd.on) return; st.rfd.on = true;
    PF.O("#mo_rfDy", 0, 1, t, 0.06);
    tl.fromTo("#mo_rfDyIn", { scale: 0.4, rotation: -6 }, { scale: 1, rotation: -1.5, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    R.dirty("days", function (tt, d) {
      PF.O("#mo_rfDy", 1, 0, tt, d ? 0.15 : 0.01); tl.set("#mo_rfDyIn", { scale: 1, rotation: -1.5 }, tt + 0.2);
      tl.set("#mo_rfDyD", { innerHTML: "?" }, tt + 0.2); tl.set("#mo_rfDyL", { innerHTML: "HOW MANY DAYS?" }, tt + 0.2); st.rfd.on = false;
    });
  }
  function flips(t, d, per) {                // listy kalendara sa pretacaju
    var n = Math.max(1, Math.floor(d / per));
    tl.fromTo("#mo_rfDyP2", { scaleY: 1, svgOrigin: "65 40" }, { scaleY: 0, svgOrigin: "65 40", duration: per, ease: "power1.in", repeat: n - 1, immediateRender: false }, t);
    tl.set("#mo_rfDyP2", { scaleY: 1, svgOrigin: "65 40" }, t + n * per + 0.01);
  }
  M.rfdays = function (t, arg, t1, o) {
    o = o || {}; buildDays(o);
    var L = left(t, t1);
    if (arg === "guess") {
      daysOn(t);
      tl.set("#mo_rfDyD", { innerHTML: "?" }, t); tl.set("#mo_rfDyL", { innerHTML: o.label || "HOW MANY DAYS?" }, t);
      tl.fromTo("#mo_rfDyD", { opacity: 1 }, { opacity: 0.25, duration: 0.16, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t + 0.1);
      flips(t + 0.1, Math.max(0.4, L - 0.1), 0.28);
      PF.punch(t, 1.02);
      return "body";
    }
    var n = +arg; if (!(n > 0)) return null;
    daysOn(t);
    var d = Math.max(0.4, Math.min(o.dur || 1.0, L - 0.3)), i;
    tl.set("#mo_rfDyL", { innerHTML: o.label || "HE LASTED" }, t);
    for (i = 1; i <= n; i++) tl.set("#mo_rfDyD", { innerHTML: String(i) }, t + d * (1 - Math.sqrt(1 - i / n)));
    flips(t, d, 0.1);
    tl.fromTo("#mo_rfDyD", { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + d);
    tl.fromTo("#mo_rfDyU", { scale: 1.6, rotation: -10 }, { scale: 1, rotation: 0, duration: 0.25, ease: "power3.in", immediateRender: false }, t + d);
    tl.fromTo("#mo_rfDyIn", { scale: 1, rotation: -1.5 }, { scale: 1.22, rotation: 2, duration: 0.12, ease: "power3.out", immediateRender: false }, t + d - 0.04);
    tl.fromTo("#mo_rfDyIn", { scale: 1.22, rotation: 2 }, { scale: 1.12, rotation: -1, duration: 0.35, ease: "back.out(2.5)", immediateRender: false }, t + d + 0.1);
    UI(); tl.fromTo("#mo_flash", { opacity: 0.45 }, { opacity: 0, duration: 0.3, ease: "power1.out", immediateRender: false }, t + d);
    PF.punch(t + d, 1.07); shake(t + d, 0.4, 14);
    M.rfsea(t + d, "rock");
    var hr = Hr(), a0 = C().arms0;
    hr.arm("L", a0[0] + 40, t + d, 0.12, "power2.out"); hr.arm("R", a0[1] - 40, t + d, 0.12, "power2.out");
    hr.arm("L", a0[0], t + d + 0.7, 0.3); hr.arm("R", a0[1], t + d + 0.7, 0.3);
    PF.X(hr.p + "head", { s: 1.12 }, t + d, 0.08, "power2.out"); PF.X(hr.p + "head", { s: 1 }, t + d + 0.1, 0.3, "back.out(2)");
    R.face(t + d, "shocked");
    return "body";
  };

  // ================= CLUN: meter, destilacia, ryba, plachta
  function raftFx() { return document.getElementById("mo_rfRfx"); }
  function buildTape() {
    if (st.rft) return; st.rft = 1;
    var ty = 1352, x0 = 100, x1 = 980, tk = "", x;
    for (x = x0 + 22; x < x1; x += 22) tk += 'M' + x + ' ' + (ty - 28) + ' v' + ((x - x0) % 110 === 0 ? 24 : 12) + ' ';
    document.getElementById("mo_rfFx").insertAdjacentHTML("beforeend", '<g id="mo_rfTp" opacity="0"><g id="mo_rfTpI">' +
      '<rect x="' + x0 + '" y="' + (ty - 28) + '" width="' + (x1 - x0) + '" height="56" rx="6" fill="#f6c343" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="' + tk + '" stroke="' + INK + '" stroke-width="4"/>' +
      '<rect x="' + (x0 - 14) + '" y="' + (ty - 40) + '" width="18" height="80" rx="4" fill="' + INK + '"/><rect x="' + (x1 - 4) + '" y="' + (ty - 40) + '" width="18" height="80" rx="4" fill="' + INK + '"/></g>' +
      '<g id="mo_rfTl" opacity="0"><g id="mo_rfTlI"><rect x="430" y="' + (ty - 46) + '" width="220" height="92" rx="16" fill="' + INK + '"/>' +
      '<text x="540" y="' + (ty + 24) + '" style="font-family:Pop;font-weight:600;font-size:66px;text-anchor:middle;fill:#ffffff">6 FT</text></g></g></g>');
  }
  function buildStill() {
    if (st.rfs) return; st.rfs = 1;
    var dr = "", i;
    [[262, 1002], [236, 1006], [284, 1012], [250, 996]].forEach(function (q, j) { dr += '<circle id="mo_rfSd' + j + '" cx="' + q[0] + '" cy="' + q[1] + '" r="9" fill="#bfe9ff" stroke="#ffffff" stroke-width="3" opacity="0"/>'; });
    raftFx().insertAdjacentHTML("beforeend", '<g id="mo_rfSt" opacity="0"><g id="mo_rfStI"><g transform="translate(250 1110) scale(1.35) translate(-250 -1110)">' +
      '<ellipse cx="250" cy="1072" rx="96" ry="20" fill="#2f6f96" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M156 1070 A94 92 0 0 1 344 1070 Z" fill="#dff4ff" fill-opacity="0.5" stroke="#ffffff" stroke-width="7"/>' +
      '<path d="M190 1040 A70 70 0 0 1 240 994" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>' +
      '<g id="mo_rfSc" opacity="0" fill="#ffffff">' + [[230, 1000], [262, 994], [292, 1004], [214, 1016], [310, 1022], [250, 1012]].map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="5"/>'; }).join("") + '</g>' +
      dr +
      '<path d="M160 1068 Q150 1092 152 1118" fill="none" stroke="#dff4ff" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M118 1122 H182 L176 1184 H124 Z" fill="#ffffff" fill-opacity="0.85"/>' +
      '<g clip-path="url(#mo_rfCupC)"><rect id="mo_rfCw" x="110" y="1184" width="80" height="70" fill="#3fa9f5"/></g>' +
      '<path d="M118 1122 H182 L176 1184 H124 Z" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<g id="mo_rfCk" opacity="0"><path d="M150 1088 l-8 -14 l-14 -4 l14 -4 l8 -14 l8 14 l14 4 l-14 4 z" fill="#fff6a8"/></g></g></g></g>');
  }
  function buildFish() {
    if (st.rff) return; st.rff = 1;
    raftFx().insertAdjacentHTML("beforeend", '<g id="mo_rfFs" opacity="0"><g transform="translate(900 1300)"><g id="mo_rfFsI"><g transform="scale(1.7)"><g id="mo_rfFsW">' +
      '<path d="M-70 0 C -40 -40 30 -40 56 0 C 30 40 -40 40 -70 0 Z" fill="#7fb3d5" stroke="' + INK + '" stroke-width="6"/>' +
      '<path d="M50 0 L96 -32 L88 0 L96 32 Z" fill="#5f93b8" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M-20 -28 Q0 -50 24 -30" fill="#5f93b8" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M-10 -10 Q0 0 -10 12" fill="none" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="-42" cy="-6" r="9" fill="#ffffff" stroke="' + INK + '" stroke-width="3"/><circle cx="-44" cy="-6" r="4" fill="' + INK + '"/>' +
      '</g></g></g></g></g>');
  }
  function buildCanopyRays() {
    if (st.rfr) return; st.rfr = 1;
    var r = "";
    [[700, 452, 960, 300], [800, 500, 1080, 440], [884, 610, 1110, 600]].forEach(function (q, j) {
      r += '<path id="mo_rfRy' + j + '" d="M' + (870 - 40 * (j - 1)) + ' 300 L' + q[0] + ' ' + q[1] + ' L' + q[2] + ' ' + q[3] + '" fill="none" stroke="#ffd34d" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>'; });
    document.getElementById("mo_rfFx").insertAdjacentHTML("beforeend", '<g id="mo_rfRy">' + r + '</g>');
  }
  M.rfraft = function (t, mode, t1, o) {
    o = o || {}; build();
    var h = Hr(), p = h.p, a0 = C().arms0, L = left(t, t1);
    if (mode === "tape") {
      buildTape();
      PF.S("#mo_rfTp", { opacity: 1 }, t);
      tl.fromTo("#mo_rfTpI", { scaleX: 0.02, svgOrigin: "100 1352" }, { scaleX: 1, svgOrigin: "100 1352", duration: 0.6, ease: "power2.out", immediateRender: false }, t);
      PF.S("#mo_rfTl", { opacity: 1 }, t + 0.55);
      tl.fromTo("#mo_rfTlI", { scale: 0.3, svgOrigin: "540 1352" }, { scale: 1, svgOrigin: "540 1352", duration: 0.3, ease: "back.out(2.6)", immediateRender: false }, t + 0.55);
      PF.punch(t + 0.6, 1.02);
      R.dirty("tape", function (tt, d) { PF.O("#mo_rfTp", 1, 0, tt, d ? 0.15 : 0.01); PF.S("#mo_rfTl", { opacity: 0 }, tt + 0.2); });
      return "body";
    }
    if (mode === "still") {
      buildStill();
      PF.S("#mo_rfSt", { opacity: 1 }, t);
      tl.fromTo("#mo_rfStI", { scale: 0.2, svgOrigin: "250 1072" }, { scale: 1, svgOrigin: "250 1072", duration: 0.35, ease: "back.out(2.2)", immediateRender: false }, t);
      PF.O("#mo_rfSc", 0, 1, t + 0.35, 0.5);
      R.dirty("still", function (tt, d) {
        PF.O("#mo_rfSt", 1, 0, tt, d ? 0.15 : 0.01);
        PF.S("#mo_rfSc,#mo_rfCk", { opacity: 0 }, tt + 0.2); PF.S("#mo_rfCw", { attr: { y: 1184 } }, tt + 0.2);
      });
      h.look(-12, 6, t, 0.2);
      return "body";
    }
    if (mode === "drip") {
      buildStill();
      var n = 4, gap = Math.max(0.18, Math.min(0.32, (L - 0.6) / n)), i, lv = 1184;
      for (i = 0; i < n; i++) {
        var ti = t + i * gap, sel = "#mo_rfSd" + i, cxy = [[262, 1002], [236, 1006], [284, 1012], [250, 996]][i];
        PF.S(sel, { opacity: 1 }, ti);
        tl.fromTo(sel, { x: 0, y: 0 }, { x: 166 - cxy[0], y: 1060 - cxy[1], duration: 0.28, ease: "power1.in", immediateRender: false }, ti);
        tl.fromTo(sel, { x: 166 - cxy[0], y: 1060 - cxy[1] }, { x: 152 - cxy[0], y: 1132 - cxy[1], duration: 0.16, ease: "power2.in", immediateRender: false }, ti + 0.28);
        PF.S(sel, { opacity: 0 }, ti + 0.45);
        PF.S(sel, { x: 0, y: 0 }, ti + 0.47);
        PF.AT("#mo_rfCw", { y: lv }, { y: lv - 11 }, ti + 0.42, 0.15, "power1.out"); lv -= 11;
      }
      PF.S("#mo_rfCk", { opacity: 1 }, t + n * gap + 0.35);
      tl.fromTo("#mo_rfCk", { scale: 0.2, rotation: 0, svgOrigin: "150 1074" }, { scale: 1.3, rotation: 45, svgOrigin: "150 1074", duration: 0.35, ease: "back.out(2)", immediateRender: false }, t + n * gap + 0.35);
      return "body";
    }
    if (mode === "fish") {
      buildFish();
      var land = 0.62;
      fxSplash(900, WL - 6, t, 1.2);
      PF.S("#mo_rfFs", { opacity: 1 }, t);
      tl.fromTo("#mo_rfFsI", { x: 0, y: 0, rotation: -50, svgOrigin: "0 0" }, { x: -200, y: -380, rotation: -10, svgOrigin: "0 0", duration: land * 0.5, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo("#mo_rfFsI", { x: -200, y: -380, rotation: -10, svgOrigin: "0 0" }, { x: -360, y: -230, rotation: 12, svgOrigin: "0 0", duration: land * 0.5, ease: "power2.in", immediateRender: false }, t + land * 0.5);
      tl.fromTo("#mo_rfFsW", { rotation: -10, svgOrigin: "0 0" }, { rotation: 10, svgOrigin: "0 0", duration: 0.09, ease: "sine.inOut", yoyo: true, repeat: Math.max(3, Math.round((L - land) / 0.09)) | 1, immediateRender: false }, t);
      h.arm("L", -22, t + land - 0.25, 0.25, "power2.out"); h.arm("R", 22, t + land - 0.25, 0.25, "power2.out");
      h.look(12, -10, t, 0.2); h.look(0, 10, t + land, 0.2);
      R.face(t + land, "excited");
      PF.punch(t + land, 1.03);
      R.dirty("fish", function (tt, d) {
        PF.O("#mo_rfFs", 1, 0, tt, d ? 0.15 : 0.01);
        h.arm("L", a0[0], tt, d ? 0.25 : 0.01); h.arm("R", a0[1], tt, d ? 0.25 : 0.01); h.look(0, 0, tt, 0.15);
      });
      return "body";
    }
    if (mode === "canopy") {
      PF.S("#mo_rfCan", { opacity: 1 }, t);
      tl.fromTo("#mo_rfCanI", { scaleY: 0.05, scaleX: 0.9, svgOrigin: "540 1160" }, { scaleY: 1, scaleX: 1, svgOrigin: "540 1160", duration: 0.45, ease: "back.out(1.6)", immediateRender: false }, t);
      h.tint("#2e2a4a", 0, 0.24, t + 0.2, 0.4);
      shake(t + 0.4, 0.2, 5);
      R.setFace(t + 0.4, "smile");
      R.dirty("canopy", function (tt, d) {
        PF.O("#mo_rfCan", 1, 0, tt, d ? 0.2 : 0.01); h.tint("#2e2a4a", 0.24, 0, tt, d ? 0.2 : 0.01);
      });
      return "body";
    }
    return null;
  };

  // ================= TELO: voda v tele, kvapka, hodiny, oddych, pot
  function buildBody() {
    if (st.rfb) return; st.rfb = { lv: 0 };
    var h = Hr(), p = h.p;
    document.getElementById(p + "head").insertAdjacentHTML("beforebegin", '<g id="mo_rfBw" opacity="0"><g clip-path="url(#mo_rfTc)">' +
      '<rect x="370" y="895" width="340" height="420" fill="#1d3557" opacity="0.45"/>' +
      '<g id="mo_rfBl"><g id="mo_rfBlw"><path d="' + wave(1060, 12, 40, 240, 900) + ' V1400 H240 Z" fill="#3fa9f5" opacity="0.92"/>' +
      '<path d="' + wave(1060, 12, 40, 240, 900) + '" fill="none" stroke="#d6f0ff" stroke-width="7"/></g></g></g>' +
      '<path d="M386 965 Q386 909 442 909 H638 Q694 909 694 965 V1288 H386 Z" fill="none" stroke="#bfe3ff" stroke-width="6" stroke-dasharray="18 12"/></g>');
    document.getElementById(p + "armR").insertAdjacentHTML("afterend", '<g id="mo_rfBw2" opacity="0"><g id="mo_rfBt"><rect x="400" y="1146" width="280" height="64" rx="16" fill="#fbf5ea"/>' +
      '<text x="540" y="1193" style="font-family:Pop;font-weight:600;font-size:40px;text-anchor:middle;fill:#1b5f9e">BODY WATER</text></g></g>' +
      '<g id="mo_rfDp" opacity="0"><g id="mo_rfDpI"><path d="M658 742 C 674 766 682 778 682 790 A24 24 0 0 1 634 790 C 634 778 642 766 658 742 Z" fill="#7fd0ff" stroke="#ffffff" stroke-width="5"/></g>' +
      '<circle id="mo_rfDpR" cx="658" cy="784" r="40" fill="none" stroke="#7dffa6" stroke-width="7" opacity="0"/></g>');
    PF.P("mo_rfBl", 540, 1060);
    loopX("#mo_rfBlw", -80, 1.2);
  }
  function bodyReg() {
    R.dirty("body", function (tt, d) {
      PF.O("#mo_rfBw,#mo_rfBw2", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_rfDp", 1, 0, tt, 0.01);
      PF.X("mo_rfBl", { ty: 0 }, tt + 0.2, 0); PF.S("#mo_rfDpR", { opacity: 0 }, tt + 0.2);
      PF.S("#mo_rfDpI", { x: 0, y: 0, scale: 1, svgOrigin: "658 784" }, tt + 0.2);
    });
  }
  function buildClock(o) {
    if (st.rfc) return; st.rfc = 1;
    UI().insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="mo_rfCk2" style="top:' + (o.y || 560) + 'px"><div class="mo-paper" id="mo_rfCk2In" style="padding:14px 22px 12px">' +
      '<span class="mo-lbl" style="font-size:36px;color:#3fa35b">+ TIME</span>' +
      '<svg viewBox="0 0 200 200" style="position:static;display:block;width:200px;height:200px;margin-top:6px"><circle cx="100" cy="100" r="86" fill="#ffffff" stroke="' + INK + '" stroke-width="10"/>' +
      '<g stroke="' + INK + '" stroke-width="8" stroke-linecap="round"><path d="M100 26 v16 M100 158 v16 M26 100 h16 M158 100 h16"/></g>' +
      '<path id="mo_rfCkA" d="M100 100 L100 30 A70 70 0 0 1 100 30 Z" fill="#7dffa6" opacity="0.9"/>' +
      '<g id="mo_rfCkH"><path d="M100 100 L100 36" stroke="' + RED + '" stroke-width="9" stroke-linecap="round"/></g><path d="M100 100 L140 100" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="100" cy="100" r="10" fill="' + INK + '"/></svg></div></div>');
  }
  function arcD(deg) { var a = (deg - 90) * Math.PI / 180, x = 100 + 70 * Math.cos(a), y = 100 + 70 * Math.sin(a);
    return "M100 100 L100 30 A70 70 0 " + (deg > 180 ? 1 : 0) + " 1 " + x.toFixed(1) + " " + y.toFixed(1) + " Z"; }
  M.rfbody = function (t, mode, t1, o) {
    o = o || {}; build();
    var h = Hr(), p = h.p, a0 = C().arms0, L = left(t, t1), i;
    if (mode === "show") {
      buildBody(); bodyReg();
      PF.O("#mo_rfBw,#mo_rfBw2", 0, 1, t, 0.2);
      tl.fromTo("#mo_rfBt", { scale: 0.3, svgOrigin: "540 1180" }, { scale: 1, svgOrigin: "540 1180", duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t + 0.1);
      PF.punch(t, 1.02);
      return "body";
    }
    if (mode === "drop") {
      buildBody(); bodyReg();
      PF.S("#mo_rfDp", { opacity: 1 }, t);
      tl.fromTo("#mo_rfDpI", { scale: 0.1, svgOrigin: "658 784" }, { scale: 1, svgOrigin: "658 784", duration: 0.3, ease: "back.out(2.6)", immediateRender: false }, t);
      PF.S("#mo_rfDpR", { opacity: 1 }, t + 0.15);
      tl.fromTo("#mo_rfDpR", { scale: 0.5, svgOrigin: "658 784" }, { scale: 1.1, svgOrigin: "658 784", duration: 0.25, ease: "back.out(2)", immediateRender: false }, t + 0.15);
      return "body";
    }
    if (mode === "save") {
      buildBody(); bodyReg();
      PF.O("#mo_rfDpR", 1, 0, t, 0.1);
      tl.fromTo("#mo_rfDpI", { x: 0, y: 0, scale: 1, svgOrigin: "658 784" }, { x: -118, y: 290, scale: 0.7, svgOrigin: "658 784", duration: 0.4, ease: "power2.in", immediateRender: false }, t);
      PF.O("#mo_rfDp", 1, 0, t + 0.38, 0.06);
      PF.X("mo_rfBl", { ty: -80 }, t + 0.4, 0.5, "back.out(1.8)");
      tl.fromTo("#mo_rfBt", { scale: 1.2, svgOrigin: "540 1180" }, { scale: 1, svgOrigin: "540 1180", duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.45);
      PF.punch(t + 0.45, 1.025);
      return "body";
    }
    if (mode === "clock") {
      buildClock(o);
      PF.O("#mo_rfCk2", 0, 1, t, 0.06);
      tl.fromTo("#mo_rfCk2In", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      var steps = 3, sd = Math.max(0.25, Math.min(0.38, (L - 0.4) / steps));
      for (i = 1; i <= steps; i++) {
        var ti = t + 0.3 + (i - 1) * sd;
        tl.fromTo("#mo_rfCkH", { rotation: (i - 1) * 75, svgOrigin: "100 100" }, { rotation: i * 75, svgOrigin: "100 100", duration: 0.2, ease: "back.out(2.5)", immediateRender: false }, ti);
        tl.set("#mo_rfCkA", { attr: { d: arcD(i * 75) } }, ti + 0.1);
      }
      R.dirty("bclock", function (tt, d) {
        PF.O("#mo_rfCk2", 1, 0, tt, d ? 0.15 : 0.01);
        PF.S("#mo_rfCkH", { rotation: 0, svgOrigin: "100 100" }, tt + 0.2); tl.set("#mo_rfCkA", { attr: { d: "M100 100 L100 30 A70 70 0 0 1 100 30 Z" } }, tt + 0.2);
      });
      return "body";
    }
    if (mode === "rest") {
      R.setFace(t, "smile");
      h.lids(0.5, t + 0.15, 0.3);
      PF.X(p + "head", { r: -6 }, t, 0.5, "sine.inOut"); PF.X(p + "up", { r: -3 }, t, 0.5, "sine.inOut");
      h.arm("L", a0[0] + 10, t, 0.4); h.arm("R", a0[1] - 10, t, 0.4);
      R.dirty("rest", function (tt, d) {
        PF.X(p + "head", { r: 0 }, tt, d ? 0.25 : 0); PF.X(p + "up", { r: 0 }, tt, d ? 0.25 : 0);
        h.arm("L", a0[0], tt, d ? 0.25 : 0.01); h.arm("R", a0[1], tt, d ? 0.25 : 0.01);
        R.setFace(tt, C().face0); h.lids(0, tt, d ? 0.15 : 0.01);
      });
      return "body";
    }
    if (mode === "sweat") {
      if (!st.rfw) {
        st.rfw = 1; var s = "";
        [[430, 512], [540, 478], [650, 512]].forEach(function (q, j) {
          s += '<g id="mo_rfSw' + j + '"><path d="M' + q[0] + ' ' + (q[1] - 34) + ' C ' + (q[0] + 16) + ' ' + (q[1] - 12) + ' ' + (q[0] + 22) + ' ' + (q[1] - 2) + ' ' + (q[0] + 22) + ' ' + (q[1] + 8) +
            ' A22 22 0 0 1 ' + (q[0] - 22) + ' ' + (q[1] + 8) + ' C ' + (q[0] - 22) + ' ' + (q[1] - 2) + ' ' + (q[0] - 16) + ' ' + (q[1] - 12) + ' ' + q[0] + ' ' + (q[1] - 34) + ' Z" fill="#8fd6ff" stroke="' + INK + '" stroke-width="5"/></g>'; });
        raftFx().insertAdjacentHTML("beforeend", '<g id="mo_rfSw" opacity="0">' + s + '</g>');
      }
      PF.S("#mo_rfSw", { opacity: 1 }, t);
      [[430, 512], [540, 478], [650, 512]].forEach(function (q, j) {
        var tj = t + j * 0.08, og = q[0] + " " + (q[1] + 8);
        tl.fromTo("#mo_rfSw" + j, { scale: 0.1, svgOrigin: og }, { scale: 1, svgOrigin: og, duration: 0.25, ease: "back.out(2.5)", immediateRender: false }, tj);
        if (j !== 1) tl.fromTo("#mo_rfSw" + j, { scale: 1, svgOrigin: og }, { scale: 0, svgOrigin: og, duration: 0.25, ease: "power2.in", immediateRender: false }, t + 0.6 + j * 0.06);
        else tl.fromTo("#mo_rfSw" + j, { scale: 1, svgOrigin: og }, { scale: 0.75, svgOrigin: og, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.75);
      });
      R.dirty("sweat", function (tt, d) { PF.O("#mo_rfSw", 1, 0, tt, d ? 0.15 : 0.01); });
      return "body";
    }
    return null;
  };

  // ================= MAPA ZHORA (sea anchor)
  var XX = 380, XY = 1180, P1 = [560, 980], P2 = [590, 948], AN = [452, 1102];
  function raftTop(id, ghost) {
    return '<g id="' + id + '"' + (ghost ? ' opacity="0"' : '') + '><g filter="url(#cut)"><circle cx="0" cy="0" r="74" fill="#8f4513" stroke="' + ORG + '" stroke-width="30"/>' +
      '<circle cx="0" cy="0" r="48" fill="#e8662a" stroke="#f6a13a" stroke-width="8"/><circle cx="34" cy="-48" r="9" fill="#f6c343"/></g></g>';
  }
  function buildMap() {
    if (st.rfm) return st.rfm;
    var s = PF.panel("mo_rfMap", 4, true), m = "", i, j;
    m += '<defs><linearGradient id="mo_rfMs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9fd6"/><stop offset="1" stop-color="#1b5a98"/></linearGradient></defs>';
    m += '<rect x="-20" y="-20" width="1120" height="1960" fill="url(#mo_rfMs)"/>';
    m += '<g id="mo_rfMw" opacity="0.5">';
    for (i = 0; i < 9; i++) for (j = 0; j < 5; j++) { var wx = 60 + j * 230 + (i % 2) * 110, wy = 320 + i * 150;
      m += '<path d="M' + wx + ' ' + wy + ' q22 -16 44 0 q22 16 44 0" fill="none" stroke="#d8f1ff" stroke-width="7" stroke-linecap="round"/>'; }
    m += '</g>';
    m += '<g transform="rotate(-42 540 960)"><g opacity="0.55"><g id="mo_rfMaM">';
    for (i = 0; i < 5; i++) for (j = -1; j < 6; j++) { var ax = -200 + j * 260 + (i % 2) * 130, ay = 500 + i * 220;
      m += '<path d="M' + (ax - 50) + ' ' + ay + ' H' + (ax + 40) + ' M' + (ax + 14) + ' ' + (ay - 26) + ' L' + (ax + 44) + ' ' + ay + ' L' + (ax + 14) + ' ' + (ay + 26) + '" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'; }
    m += '</g></g></g>';
    m += '<circle id="mo_rfMr" cx="470" cy="1060" r="230" fill="#7dffa6" fill-opacity="0.12" stroke="#7dffa6" stroke-width="10" stroke-dasharray="26 18" opacity="0"/>';
    m += '<g id="mo_rfMt"></g><g id="mo_rfMg"></g>';
    m += '<g id="mo_rfMx"><path d="M' + (XX - 46) + ' ' + (XY - 46) + ' L' + (XX + 46) + ' ' + (XY + 46) + ' M' + (XX + 46) + ' ' + (XY - 46) + ' L' + (XX - 46) + ' ' + (XY + 46) + '" stroke="#fbf5ea" stroke-width="42" stroke-linecap="round"/>' +
      '<path d="M' + (XX - 46) + ' ' + (XY - 46) + ' L' + (XX + 46) + ' ' + (XY + 46) + ' M' + (XX + 46) + ' ' + (XY - 46) + ' L' + (XX - 46) + ' ' + (XY + 46) + '" stroke="' + RED + '" stroke-width="24" stroke-linecap="round"/></g>';
    m += '<g transform="translate(' + XX + ' ' + (XY + 128) + ') rotate(-3)"><rect x="-230" y="-46" width="460" height="86" rx="16" fill="#fbf5ea" stroke="' + RED + '" stroke-width="7"/>' +
      '<text x="0" y="16" style="font-family:Pop;font-weight:600;font-size:46px;text-anchor:middle;fill:' + RED + '">LAST POSITION</text></g>';
    m += '<line id="mo_rfMrope" x1="' + P1[0] + '" y1="' + P1[1] + '" x2="' + AN[0] + '" y2="' + AN[1] + '" stroke="#f4efe6" stroke-width="7" stroke-dasharray="14 8" opacity="0"/>';
    m += '<g id="mo_rfMan" opacity="0"><g id="mo_rfManI"><path d="M-30 -34 L30 -34 L0 40 Z" fill="#f6c343" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<ellipse cx="0" cy="-34" rx="30" ry="10" fill="#d9a21f" stroke="' + INK + '" stroke-width="5"/></g>' +
      '<ellipse id="mo_rfManS" cx="' + AN[0] + '" cy="' + AN[1] + '" rx="40" ry="40" fill="none" stroke="#ffffff" stroke-width="7" opacity="0"/></g>';
    m += raftTop("mo_rfMG", true) + raftTop("mo_rfMR", false);
    s.insertAdjacentHTML("beforeend", m);
    PF.P("mo_rfMR", 0, 0, { tx: XX, ty: XY }); PF.P("mo_rfMG", 0, 0, { tx: P1[0], ty: P1[1] });
    PF.P("mo_rfManI", 0, 0, { tx: AN[0], ty: AN[1] });
    PF.X("mo_rfMR", {}, 0, 0); PF.X("mo_rfMG", {}, 0, 0); PF.X("mo_rfManI", {}, 0, 0);
    if (PF.VO.total > 0) { var cp = PF.loopPeriod(0.7), cn = Math.max(1, Math.round(TOT() / cp));
      tl.fromTo("#mo_rfMaM", { x: 0 }, { x: 260, duration: cp, ease: "none", repeat: cn - 1, immediateRender: false }, 0); }
    yoyo("#mo_rfMw", { y: -10 }, { y: 8 }, 2.2);
    st.rfm = { n: 0 };
    return st.rfm;
  }
  function dot(g, x, y, t, col) {
    var id = uid("mo_rfMd");
    document.getElementById(g).insertAdjacentHTML("beforeend", '<circle id="' + id + '" class="mo_rfMdot" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="10" fill="' + (col || "#ffffff") + '" opacity="0"/>');
    PF.S("#" + id, { opacity: 1 }, t);
  }
  M.rfmap = function (t, mode, t1, o) {
    o = o || {}; var S = buildMap(), L = left(t, t1), i, k;
    if (mode === "off") { R.clean("map", t, 0.3); return null; }
    if (!mode) {
      var d = o.dur || 1.2;
      PF.S("#mo_rfMap", { opacity: 1, clipPath: "circle(0% at 50% 55%)" }, t - 0.2);
      tl.fromTo("#mo_rfMap", { clipPath: "circle(0% at 50% 55%)" }, { clipPath: "circle(80% at 50% 55%)", duration: 0.4, ease: "power2.in", immediateRender: false }, t - 0.2);
      PF.S("#mo_rfMap", { clipPath: "none" }, t + 0.22);
      PF.X("mo_rfMR", { tx: P1[0], ty: P1[1], r: 25 }, t + 0.2, d, "power1.in");
      for (i = 1; i <= 9; i++) { k = i / 10; dot("mo_rfMt", XX + (P1[0] - XX) * k, XY + (P1[1] - XY) * k, t + 0.2 + d * Math.sqrt(k)); }
      R.dirty("map", function (tt, dd) {
        PF.O("#mo_rfMap", 1, 0, tt, dd ? 0.3 : 0.01);
        PF.S(".mo_rfMdot,#mo_rfMrope,#mo_rfMan,#mo_rfManS,#mo_rfMr,#mo_rfMG", { opacity: 0 }, tt + (dd ? 0.32 : 0.02));
        PF.X("mo_rfMR", { tx: XX, ty: XY, r: 0 }, tt + (dd ? 0.32 : 0.02), 0);
      });
      return null;
    }
    if (mode === "anchor") {
      PF.S("#mo_rfMrope", { opacity: 1 }, t);
      PF.AT("#mo_rfMrope", { x2: P1[0], y2: P1[1] }, { x2: AN[0], y2: AN[1] }, t, 0.35, "power2.out");
      PF.S("#mo_rfMan", { opacity: 1 }, t);
      PF.X("mo_rfManI", { tx: P1[0], ty: P1[1], r: -60, s: 0.6 }, t, 0); PF.X("mo_rfManI", { tx: AN[0], ty: AN[1], r: 0, s: 1 }, t + 0.01, 0.34, "power2.out");
      PF.S("#mo_rfManS", { opacity: 1 }, t + 0.35);
      tl.fromTo("#mo_rfManS", { attr: { rx: 30, ry: 30 }, opacity: 1 }, { attr: { rx: 110, ry: 110 }, opacity: 0, duration: 0.6, ease: "power1.out", immediateRender: false }, t + 0.35);
      PF.punch(t + 0.38, 1.03); shake(t + 0.38, 0.2, 7);
      return null;
    }
    if (mode === "slow") {                  // skutocny clun ostane pri X, duch bez kotvy ujde
      var dd2 = Math.max(0.8, Math.min(1.8, L));
      PF.X("mo_rfMR", { tx: P2[0], ty: P2[1], r: 60 }, t, dd2, "sine.out");
      PF.AT("#mo_rfMrope", { x1: P1[0], y1: P1[1] }, { x1: P2[0], y1: P2[1] }, t, dd2, "sine.out");
      PF.S("#mo_rfMG", { opacity: 0.4 }, t);
      PF.X("mo_rfMG", { tx: 1180, ty: 200, r: 90 }, t, 1.4, "power1.in");
      for (i = 1; i <= 8; i++) { k = i / 9; dot("mo_rfMg", P1[0] + (1180 - P1[0]) * k, P1[1] + (200 - P1[1]) * k, t + 1.4 * Math.sqrt(k), "#a9c9e6"); }
      return null;
    }
    if (mode === "x") {
      PF.S("#mo_rfMr", { opacity: 1 }, t);
      tl.fromTo("#mo_rfMr", { scale: 0.3, svgOrigin: "470 1060" }, { scale: 1, svgOrigin: "470 1060", duration: 0.4, ease: "back.out(1.8)", immediateRender: false }, t);
      tl.fromTo("#mo_rfMx", { scale: 1, svgOrigin: XX + " " + XY }, { scale: 1.3, svgOrigin: XX + " " + XY, duration: 0.16, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t);
      return null;
    }
    return null;
  };

  // ================= SIGNALY: majak (EPIRB), zrkadlo
  function buildBeacon() {
    if (st.rfe) return; st.rfe = 1;
    raftFx().insertAdjacentHTML("beforeend", '<g id="mo_rfBc" opacity="0"><g id="mo_rfBcI"><g transform="translate(872 1086) scale(1.45) translate(-872 -1086)">' +
      '<path d="M872 1000 V900" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="842" y="1000" width="60" height="86" rx="12" fill="#f6c343" stroke="' + INK + '" stroke-width="6"/>' +
      '<rect x="852" y="1040" width="40" height="14" rx="4" fill="' + INK + '" opacity="0.6"/>' +
      '<circle id="mo_rfBg" cx="872" cy="990" r="46" fill="#ff6b5a" opacity="0"/>' +
      '<path d="M850 1000 A22 22 0 0 1 894 1000 Z" fill="#7a1d14" stroke="' + INK + '" stroke-width="5"/>' +
      '<path id="mo_rfBn" d="M850 1000 A22 22 0 0 1 894 1000 Z" fill="#ff3b30" opacity="0"/></g></g></g>');
    var r = "";
    for (var i = 0; i < 3; i++) r += '<g transform="translate(872 800)"><g id="mo_rfRg' + i + '" opacity="0"><path d="M-80 0 Q0 -50 80 0" fill="none" stroke="#ffd34d" stroke-width="15" stroke-linecap="round"/></g></g>';
    document.getElementById("mo_rfFx").insertAdjacentHTML("beforeend", '<g id="mo_rfRgs">' + r + '</g>' +
      '<g id="mo_rfSat" opacity="0"><g id="mo_rfSatI"><g transform="translate(895 400) scale(1.6) translate(-895 -400)"><rect x="786" y="380" width="70" height="40" rx="6" fill="#3b6fb6" stroke="' + INK + '" stroke-width="5"/>' +
      '<rect x="934" y="380" width="70" height="40" rx="6" fill="#3b6fb6" stroke="' + INK + '" stroke-width="5"/><path d="M856 400 H934" stroke="' + INK + '" stroke-width="6"/>' +
      '<rect x="866" y="374" width="58" height="52" rx="10" fill="#e8e3da" stroke="' + INK + '" stroke-width="5"/><path d="M895 426 V446 M880 452 Q895 436 910 452" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/></g></g></g>');
  }
  function buildMirror() {
    if (st.rfmi) return; st.rfmi = 1;
    var h = Hr(), p = h.p;
    document.getElementById(p + "armR").insertAdjacentHTML("beforeend", '<g id="mo_rfMi" opacity="0"><rect x="622" y="1176" width="62" height="54" rx="8" fill="#cfe3ee" stroke="' + INK + '" stroke-width="6"/>' +
      '<path d="M632 1220 L668 1186" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/></g>');
  }
  M.rfsignal = function (t, mode, t1, o) {
    o = o || {}; build();
    var h = Hr(), p = h.p, a0 = C().arms0, L = left(t, t1), i;
    if (mode === "beacon") {
      buildBeacon();
      PF.S("#mo_rfBc", { opacity: 1 }, t);
      tl.fromTo("#mo_rfBcI", { scale: 0.2, svgOrigin: "872 1086" }, { scale: 1, svgOrigin: "872 1086", duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t);
      var per = 0.36, n = Math.max(1, Math.round((TOT() - t - 0.3) / per));
      tl.fromTo("#mo_rfBn,#mo_rfBg", { opacity: 0 }, { opacity: 1, duration: per / 2, ease: "none", yoyo: true, repeat: 2 * n - 1, immediateRender: false }, t + 0.3);
      h.look(12, 8, t, 0.2);
      R.dirty("beacon", function (tt, d) {
        PF.O("#mo_rfBc", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_rfSat", 1, 0, tt, 0.01); h.look(0, 0, tt, 0.15);
      });
      return "body";
    }
    if (mode === "rings") {
      buildBeacon();
      var te = (t1 || t + 3) - 0.15, rp = 0.9;
      PF.O("#mo_rfSat", 0, 1, t, 0.15);
      tl.fromTo("#mo_rfSatI", { scale: 0.3, svgOrigin: "895 400" }, { scale: 1, svgOrigin: "895 400", duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t);
      tl.fromTo("#mo_rfSatI", { rotation: -4, svgOrigin: "895 400" }, { rotation: 4, svgOrigin: "895 400", duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, Math.floor((te - t - 0.3) / 0.5)) | 1, immediateRender: false }, t + 0.3);
      for (i = 0; i < 3; i++) {
        var ts = t + i * rp / 3, nr = Math.max(1, Math.floor((te - ts) / rp));
        tl.fromTo("#mo_rfRg" + i, { y: 0, scale: 0.6, opacity: 1, svgOrigin: "0 0" }, { y: -330, scale: 1.6, opacity: 0, svgOrigin: "0 0", duration: rp, ease: "none", repeat: nr - 1, immediateRender: false }, ts);
      }
      PF.O("#mo_rfSat", 1, 0, te, 0.12);
      h.look(10, -12, t, 0.2);
      return "body";
    }
    if (mode === "mirror") {
      buildMirror();
      h.arm("R", -130, t, 0.3, "power2.out");
      PF.S("#mo_rfMi", { opacity: 1 }, t);
      var hp = H.handPt("R", 652, 1203), hx = hp[0], hy = hp[1];
      var bm = document.getElementById("mo_rfBm"), SX = 720, SY = HOR - 12;
      function ang(x, y) { return Math.atan2(y - hy, x - hx) * 180 / Math.PI; }
      var BL = Math.sqrt((SX - hx) * (SX - hx) + (SY - hy) * (SY - hy)) + 20;
      bm.innerHTML = '<g id="mo_rfBmR"><path d="M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ' L' + (hx + BL).toFixed(1) + ' ' + (hy - 34).toFixed(1) + ' L' + (hx + BL).toFixed(1) + ' ' + (hy + 34).toFixed(1) + ' Z" fill="#ffffff" opacity="0.5"/>' +
        '<path d="M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ' L' + (hx + BL).toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="#fffbe0" stroke-width="12" stroke-linecap="round"/></g>';
      PF.P("mo_rfBmR", hx, hy, { r: ang(1080, HOR + 10) });
      PF.X("mo_rfBmR", {}, t + 0.2, 0);
      st.rfmi = { hx: hx, hy: hy, rs: ang(SX, SY) };
      PF.O("#mo_rfBm", 0, 1, t + 0.25, 0.1);
      var sw = Math.max(0.5, L - 0.35), d1 = sw * 0.55, d2 = sw - d1 - 0.02;
      PF.X("mo_rfBmR", { r: ang(650, HOR) }, t + 0.3, d1, "sine.inOut");
      PF.X("mo_rfBmR", { r: ang(960, HOR) }, t + 0.3 + d1, d2, "sine.inOut");
      PF.O("#mo_rfSh", 0, 1, t, 0.3);
      h.look(12, -6, t, 0.2);
      R.face(t + 0.2, "excited");
      R.dirty("mirror", function (tt, d) {
        PF.O("#mo_rfBm", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_rfSh", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_rfMi", 1, 0, tt, 0.01);
        PF.S("#mo_rfSg", { opacity: 0 }, tt + 0.2);
        h.arm("R", a0[1], tt, d ? 0.3 : 0.01); h.look(0, 0, tt, 0.15);
      });
      return "body";
    }
    if (mode === "ship") {
      PF.X("mo_rfBmR", { r: st.rfmi.rs }, t, 0.25, "power2.out");
      PF.S("#mo_rfSg", { opacity: 1 }, t + 0.2);
      tl.fromTo("#mo_rfSgI", { scale: 0.1, rotation: 0, svgOrigin: "720 " + (HOR - 22) }, { scale: 1.4, rotation: 45, svgOrigin: "720 " + (HOR - 22), duration: 0.35, ease: "back.out(2)", immediateRender: false }, t + 0.2);
      tl.fromTo("#mo_rfSgI", { scale: 1.4, svgOrigin: "720 " + (HOR - 22) }, { scale: 0.9, svgOrigin: "720 " + (HOR - 22), duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.55);
      UI(); tl.fromTo("#mo_flash", { opacity: 0.35 }, { opacity: 0, duration: 0.25, ease: "power1.out", immediateRender: false }, t + 0.2);
      PF.punch(t + 0.2, 1.03);
      return "body";
    }
    return null;
  };
})();
