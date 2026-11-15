// pack_rip.js - momenty pre video 037 Rip Current (more ako celoplosne pozadie, plavanie, mapa prudu zhora, energia, plavcik)
// sea       "" = more postavene od snimku 0 (obloha, plaz vlavo na horizonte, vlny, voda pred postavou po hrud); "shrink" = plaz sa vzdiali;
//           "flow" = sipky prudu pod hladinou do strany; "under" = cervena sipka DOLE pod postavou sa preskrtne
// swim      "" = krauel (ruky strieda nad hlavou, cakanie); "tired" = spomaluje; "drift" = prud ho unasa doprava; "float" = na chrbte;
//           "wave" = pluta a mava; "lean" = kratko sa zakloni; "freeze" = zarazi sa; "up" = spat vzpriamene v strede
// ripmap    pohlad zhora (celoplosny panel): "" = kanal prudu so sipkami, hrdina unasany; "speed" = stitok UP TO 8 FT/SEC; "race" = olympionik vs prud;
//           "side" = plave bokom von z kanala; "free" = je vonku, voda sa upokoji; "off" = panel prec
// energy    vodorovny pruh ENERGY hore nad hlavou (arg 0-1; o.blink = prazdny blika, o.flash = zelena: setri)
// lifeguard "" = plavcicka veza na plazi; "blow" = pistalka
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake, uid = H.uid;
  var HOR = 480, WL = 985;                  // horizont a hladina (svetove suradnice)
  function TOT() { return PF.VO.total || 30; }
  function loopX(sel, dx, per) {            // nekonecny posun od 0 do konca videa; perioda deli dlzku -> slucka bez skoku
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, { x: 0 }, { x: dx, duration: p, ease: "none", repeat: n - 1, immediateRender: false }, 0);
  }
  function yoyoY(sel, a, b, per) {          // kmitanie hore-dole cele video, konci v pociatocnom stave
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, { y: a }, { y: b, duration: p / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * n - 1, immediateRender: false }, 0);
  }
  function wave(y, a, s, x0, x1) { var d = "M" + x0 + " " + y; for (var x = x0; x < x1; x += 2 * s) d += " q" + s / 2 + " " + (-a) + " " + s + " 0 q" + s / 2 + " " + a + " " + s + " 0"; return d; }
  function umb(x, y, c, k) { k = k || 1; return '<path d="M' + x + ' ' + y + ' V' + (y - 62 * k) + '" stroke="#7a5a3c" stroke-width="' + (5 * k) + '"/>' +
    '<path d="M' + (x - 44 * k) + ' ' + (y - 58 * k) + ' Q' + x + ' ' + (y - 112 * k) + ' ' + (x + 44 * k) + ' ' + (y - 58 * k) + ' Z" fill="' + c + '" stroke="#ffffff" stroke-width="' + (4 * k) + '"/>' +
    '<path d="M' + x + ' ' + (y - 85 * k) + ' L' + (x - 15 * k) + ' ' + (y - 58 * k) + ' M' + x + ' ' + (y - 85 * k) + ' L' + (x + 15 * k) + ' ' + (y - 58 * k) + '" stroke="#ffffff" stroke-width="' + (4 * k) + '"/>'; }
  function palm(x, y) { return '<path d="M' + x + ' ' + y + ' C ' + (x + 6) + ' ' + (y - 60) + ' ' + (x - 4) + ' ' + (y - 110) + ' ' + (x + 14) + ' ' + (y - 150) + '" fill="none" stroke="#8a5a3c" stroke-width="12" stroke-linecap="round"/>' +
    [[-70, 10], [-50, -24], [60, -20], [74, 14], [0, -40]].map(function (q) { return '<path d="M' + (x + 14) + ' ' + (y - 150) + ' Q' + (x + 14 + q[0] * 0.5) + ' ' + (y - 182 + q[1] * 0.3) + ' ' + (x + 14 + q[0]) + ' ' + (y - 140 + q[1]) + '" fill="none" stroke="#3f9a57" stroke-width="16" stroke-linecap="round"/>'; }).join(""); }

  // ---------- more (stavia sa raz; je tam od snimku 0 az po posledny -> slucka bez dirty)
  function build() {
    if (st.sea) return st.sea;
    var Hh = C().hero, p = Hh.p, m = "", i;
    ["fd_B", "fd_M", "fd_F"].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.display = "none"; });   // prostredie luky skryte cele video
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_rpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8f0"/><stop offset="1" stop-color="#def3fb"/></linearGradient>' +
      '<linearGradient id="mo_rpSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5cbfe6"/><stop offset="0.45" stop-color="#2f8fcf"/><stop offset="1" stop-color="#1a5f9c"/></linearGradient>');
    m += '<rect x="-600" y="-700" width="2280" height="' + (HOR + 710) + '" fill="url(#mo_rpSky)"/>';
    m += '<circle cx="870" cy="250" r="150" fill="url(#gSun)" opacity="0.9"/><g filter="url(#cut)"><circle cx="870" cy="250" r="70" fill="#ffe07a"/></g>';
    m += '<g fill="#ffffff" opacity="0.95"><path d="M560 200 c-20 -40 30 -60 60 -40 c20 -40 90 -30 90 10 c40 0 50 40 20 50 h-160 c-30 0 -30 -20 -10 -20 z"/><path d="M-60 330 c-20 -40 30 -60 60 -40 c20 -40 90 -30 90 10 c40 0 50 40 20 50 h-160 c-30 0 -30 -20 -10 -20 z"/></g>';
    m += '<rect x="-600" y="' + HOR + '" width="2280" height="2400" fill="url(#mo_rpSea)"/>';
    for (i = 0; i < 7; i++) { var y = HOR + 30 + i * i * 22 + i * 40, s = 30 + i * 14, a = 5 + i * 3;
      m += '<g opacity="' + (0.35 + i * 0.07).toFixed(2) + '"><g id="mo_rpW' + i + '"><path d="' + wave(y, a, s, -600, 1800) + '" fill="none" stroke="#e6f6ff" stroke-width="' + (3 + i * 1.6).toFixed(1) + '" stroke-linecap="round"/></g></g>'; }
    // plaz na horizonte vlavo (pivot vlavo na horizonte -> zmensi sa do dialky)
    var b = '<path d="M-600 ' + (HOR + 8) + ' L-600 ' + (HOR - 46) + ' C -200 ' + (HOR - 60) + ' 200 ' + (HOR - 50) + ' 420 ' + (HOR - 22) + ' C 470 ' + (HOR - 14) + ' 500 ' + (HOR) + ' 520 ' + (HOR + 8) + ' Z" fill="#f2d59c" stroke="#ffffff" stroke-width="6"/>' +
      palm(-30, HOR - 40) + palm(40, HOR - 44) + umb(130, HOR - 30, "#e2475b") + umb(250, HOR - 26, "#f6c343") + umb(360, HOR - 18, "#3fa35b", 0.85) +
      '<path d="' + wave(HOR + 12, 4, 22, -600, 560) + '" fill="none" stroke="#ffffff" stroke-width="5"/>';
    m += '<g id="mo_rpBch" filter="url(#cut)">' + b + '</g><g id="mo_rpTwO"></g>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_rpSea">' + m + '</g>');
    // voda pred postavou (po hrud): kmita hore-dole, vlny bezia
    var f = '<g id="mo_rpFb"><g id="mo_rpFs"><path d="' + wave(WL, 14, 60, -600, 1800) + ' V 2600 H -600 Z" fill="#3a9ad8" fill-opacity="0.68"/>' +
      '<path d="' + wave(WL, 14, 60, -600, 1800) + '" fill="none" stroke="#e8f7ff" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="' + wave(WL + 130, 8, 50, -600, 1800) + '" fill="none" stroke="#bfe6fb" stroke-width="5" opacity="0.6"/></g>' +
      '<g id="mo_rpFl" opacity="0"><g id="mo_rpFlM">';
    for (i = 0; i < 9; i++) { var ax = -480 + i * 240, ay = WL + 170 + (i % 2) * 110;
      f += '<path d="M' + ax + ' ' + ay + ' h120 M' + (ax + 92) + ' ' + (ay - 34) + ' L' + (ax + 132) + ' ' + ay + ' L' + (ax + 92) + ' ' + (ay + 34) + '" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>'; }
    f += '</g></g></g><g id="mo_rpSp"></g>';
    document.getElementById(p + "float").insertAdjacentHTML("afterend", '<g id="mo_rpFront">' + f + '</g>');
    for (i = 0; i < 7; i++) loopX("#mo_rpW" + i, (i % 2 ? 2 : -2) * (30 + i * 14), 3.4 - i * 0.25);
    loopX("#mo_rpFs", -120, 1.6);
    yoyoY("#mo_rpFb", -8, 8, 2.6);
    PF.P("mo_rpBch", -80, HOR);
    Hh.shadow(false, 0);
    st.sea = { flow: 0 };
    return st.sea;
  }
  M.sea = function (t, mode, t1, o) {
    o = o || {}; build();
    var Hh = C().hero, p = Hh.p;
    if (mode === "shrink") {
      PF.X("mo_rpBch", { s: o.s || 0.55, tx: o.tx === undefined ? -40 : o.tx }, t, o.dur || 1.6, "power2.inOut");
      R.dirty("beach", function (tt, d) { PF.X("mo_rpBch", { s: 1, tx: 0 }, tt, d || 0); });
      return null;
    }
    if (mode === "flow") {                  // sipky prudu pod hladinou (samy zmiznu)
      var te = Math.max(t + 0.8, Math.min(t + (o.hold || 1.8), (t1 || 1e9) - 0.15)), per = 0.5, n = Math.max(1, Math.ceil((te - t + 0.3) / per));
      PF.O("#mo_rpFl", 0, 1, t, 0.15);
      tl.fromTo("#mo_rpFlM", { x: 0 }, { x: 240, duration: per, ease: "none", repeat: n - 1, immediateRender: false }, t);
      PF.O("#mo_rpFl", 1, 0, te, 0.25);
      return null;
    }
    if (mode === "under") {                 // "nie dole": cervena sipka dole pod postavou, preskrtne sa
      var s = PF.st[p + "float"], x = 540 + s.tx - (o.dx || 0), id = uid("mo_rpU"), tx = t + (o.xdelay || 0.24);   // o.dx = sipka ide s postavou (drift v tom istom case uz zapisal ciel do st -> zaciname od -dx); o.xdelay = kedy buchne X
      PF.add("M", '<g id="' + id + '" opacity="0"><g id="' + id + 'a"><path d="M' + x + ' ' + (WL + 70) + ' V' + (WL + 330) + ' M' + (x - 60) + ' ' + (WL + 270) + ' L' + x + ' ' + (WL + 340) + ' L' + (x + 60) + ' ' + (WL + 270) +
        '" fill="none" stroke="#d9483b" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="40 26"/></g>' +
        '<g id="' + id + 'x" opacity="0"><path d="M' + (x - 120) + ' ' + (WL + 90) + ' L' + (x + 120) + ' ' + (WL + 330) + ' M' + (x + 120) + ' ' + (WL + 90) + ' L' + (x - 120) + ' ' + (WL + 330) + '" stroke="#fbf5ea" stroke-width="64" stroke-linecap="round"/>' +
        '<path d="M' + (x - 120) + ' ' + (WL + 90) + ' L' + (x + 120) + ' ' + (WL + 330) + ' M' + (x + 120) + ' ' + (WL + 90) + ' L' + (x - 120) + ' ' + (WL + 330) + '" stroke="#d9483b" stroke-width="38" stroke-linecap="round"/></g></g>');
      PF.O("#" + id, 0, 1, t, 0.08);
      if (o.dx) tl.fromTo("#" + id, { x: 0 }, { x: o.dx, duration: o.ddur || 1.3, ease: "power1.inOut", immediateRender: false }, t);
      tl.fromTo("#" + id + "a", { y: -60 }, { y: 0, duration: 0.2, ease: "power2.in", immediateRender: false }, t);
      PF.O("#" + id + "x", 0, 1, tx, 0.04);
      tl.fromTo("#" + id + "x", { scale: 2.2, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.14, ease: "power3.in", immediateRender: false }, tx);
      PF.punch(tx + 0.14, 1.03); shake(tx + 0.14, 0.2, 8);
      PF.O("#" + id, 1, 0, Math.max(t + (o.hold || 1.0), (t1 || t + 2) - 0.2), 0.18);
      return null;
    }
    return null;                            // "" = len postavit (od snimku 0)
  };

  // ---------- plavanie (poza hrdinu; vsetko trvale pod klucom "swim")
  function splash(x, t) {
    var id = uid("mo_rpS"), g = document.getElementById("mo_rpSp"), h = "";
    [[-34, -40, 11], [0, -62, 14], [34, -42, 10]].forEach(function (q, i) { h += '<circle id="' + id + 'd' + i + '" cx="' + x + '" cy="' + WL + '" r="' + q[2] + '" fill="#ffffff"/>'; });
    g.insertAdjacentHTML("beforeend", '<g id="' + id + '" opacity="0"><ellipse id="' + id + 'r" cx="' + x + '" cy="' + (WL + 6) + '" rx="40" ry="10" fill="none" stroke="#ffffff" stroke-width="6"/>' + h + '</g>');
    PF.O("#" + id, 0, 1, t, 0.03);
    [[-34, -40], [0, -62], [34, -42]].forEach(function (q, i) {
      tl.fromTo("#" + id + "d" + i, { x: 0, y: 0 }, { x: q[0], y: q[1], duration: 0.3, ease: "power2.out", immediateRender: false }, t); });
    tl.fromTo("#" + id + "r", { attr: { rx: 30, ry: 8 } }, { attr: { rx: 80, ry: 18 }, duration: 0.4, ease: "power1.out", immediateRender: false }, t);
    PF.O("#" + id, 1, 0, t + 0.25, 0.18);
  }
  function pose(Hh) {                       // navrat: vzpriamene, v strede, ruky a nohy v pokoji
    var p = Hh.p, a0 = C().arms0;
    R.dirty("swim", function (tt, d) { Hh.move(0, 0, 0, tt, d || 0); Hh.arm("L", a0[0], tt, d || 0.01); Hh.arm("R", a0[1], tt, d || 0.01);
      Hh.leg("L", 0, tt, d || 0.01); Hh.leg("R", 0, tt, d || 0.01); });
  }
  M.swim = function (t, mode, t1, o) {
    o = o || {}; build();
    var Hh = C().hero, p = Hh.p, a0 = C().arms0, end = (t1 || t + 3) - 0.15;
    if (!mode || mode === "tired") {
      var per = o.per || (mode === "tired" ? 0.8 : 0.52), te = Math.min(end, t + (o.dur || 99)), k = 0, tt = t;
      if (mode === "tired") R.face(t, "tired");
      while (tt + per <= te + 0.02) {
        var sd = k % 2 ? "L" : "R", up = sd === "R" ? -158 : 158, rest = sd === "R" ? a0[1] : a0[0];
        Hh.arm(sd, up, tt, per * 0.48, "power1.out");
        Hh.arm(sd, rest, tt + per * 0.5, per * 0.42, "power2.in");
        splash(540 + PF.st[p + "float"].tx + (sd === "R" ? 175 : -175), tt + per * 0.9);
        PF.XY(p + "up", { r: sd === "R" ? -4 : 4 }, tt, per * 0.26, "sine.inOut", 1);
        PF.XY(p + "head", { r: sd === "R" ? 6 : -6 }, tt, per * 0.26, "sine.inOut", 1);
        tt += per * 0.56; k++;
        if (mode === "tired") per *= 1.14;
      }
      return "body";
    }
    if (mode === "drift") {                 // prud ho unasa do strany (von na more)
      Hh.move(o.dx || 140, o.dy || 0, o.r || 7, t, o.dur || 1.3, "power1.inOut");
      Hh.arm("L", 60, t, 0.4); Hh.arm("R", -60, t, 0.4);
      R.face(t, "worried"); pose(Hh);
      return null;
    }
    if (mode === "float") {                 // na chrbte: telo vodorovne na hladine (hlava vpravo), ruky a nohy roztiahnute
      var tx = o.tx === undefined ? -250 : o.tx, ty = o.ty === undefined ? -105 : o.ty;
      Hh.move(tx, ty, 72, t, 0.7, "power2.inOut");
      Hh.arm("L", 8, t, 0.6); Hh.arm("R", -55, t, 0.6); Hh.leg("L", 10, t, 0.5); Hh.leg("R", -10, t, 0.5);
      R.face(t + 0.35, "smile");
      if (o.drift) Hh.move(tx + o.drift, ty, 72, t + 0.75, Math.max(0.6, end - t - 0.8), "sine.inOut");
      PF.XY(p + "head", { r: -5 }, t + 0.8, 0.9, "sine.inOut", 1);
      pose(Hh);
      return "body";
    }
    if (mode === "wave") {                  // pluta, mierne zaklonena, prava ruka mava nad hlavou
      var n = o.n || 3;
      Hh.move(o.tx === undefined ? 40 : o.tx, o.ty === undefined ? -30 : o.ty, o.r === undefined ? -22 : o.r, t, 0.45, "power2.out");   // hlava k brehu, prava ruka mava hore-vpravo (nekrizi tvar)
      Hh.arm("L", 50, t, 0.4); Hh.arm("R", -138, t, 0.25, "power2.out");
      PF.XY(p + "armR", { r: -108 }, t + 0.27, 0.2, "sine.inOut", 2 * n - 1);
      R.face(t + 0.1, "excited");
      pose(Hh);
      return "body";
    }
    if (mode === "lean") {                  // kratke zaklonenie ("najprv pluta")
      Hh.move(0, -30, 16, t, 0.4, "power2.out"); Hh.arm("L", 75, t, 0.4); Hh.arm("R", -75, t, 0.4);
      R.face(t + 0.1, "smile"); pose(Hh);
      return "body";
    }
    if (mode === "freeze") {                // zarazi sa ("stoj!")
      Hh.arm("L", 40, t, 0.12); Hh.arm("R", -40, t, 0.12);
      R.face(t, "shocked"); PF.punch(t, 1.03); shake(t, 0.2, 7); pose(Hh);
      return "face";
    }
    if (mode === "up") { R.clean("swim", t, o.dur || 0.4); return "body"; }
    return null;
  };

  // ---------- pohlad zhora: kanal prudu (celoplosny panel v suradniciach obrazovky)
  function map() {
    if (st.rip) return st.rip;
    var s = PF.panel("mo_ripMap", 4, true), hero = C().hero, m = "", i, hc = "#4a3226";
    m += '<defs><linearGradient id="mo_rmSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#63c6ea"/><stop offset="1" stop-color="#2471b2"/></linearGradient></defs>';
    m += '<rect x="-20" y="300" width="1120" height="1640" fill="url(#mo_rmSea)"/>';
    m += '<g id="mo_rmWv">';
    [600, 740, 880, 1040].forEach(function (y, j) {
      m += '<path d="' + wave(y, 10, 34, -40, 420 - j * 14) + '" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="' + (0.85 - j * 0.15) + '"/>' +
        '<path d="' + wave(y + 8, 10, 34, 660 + j * 14, 1120) + '" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="' + (0.85 - j * 0.15) + '"/>'; });
    m += '</g>';
    m += '<path d="M450 420 C 440 700 432 960 420 1150 C 300 1220 310 1380 540 1400 C 770 1380 780 1220 660 1150 C 648 960 640 700 630 420 Z" fill="#164f86" opacity="0.78" filter="url(#soft6)"/>';
    m += '<g id="mo_rmCh"><g id="mo_rmChM">';
    for (i = 0; i < 7; i++) m += '<path d="M480 ' + (330 + i * 160) + ' L540 ' + (380 + i * 160) + ' L600 ' + (330 + i * 160) + '" fill="none" stroke="#d8f1ff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="' + (i < 1 ? 0 : Math.max(0.25, 0.95 - (i - 1) * 0.1)).toFixed(2) + '"/>';
    m += '</g></g>';
    m += '<g id="mo_rmCalm" opacity="0"><circle cx="880" cy="900" r="150" fill="#a8e6ff" opacity="0.55"/><circle cx="880" cy="900" r="95" fill="#c9f1ff" opacity="0.6"/></g>';
    // plaz zhora
    m += '<path d="M-20 -20 H1100 V400 C 960 450 820 390 680 425 C 600 445 480 445 400 425 C 260 390 120 450 -20 410 Z" fill="#f2d59c"/>' +
      '<path d="M-20 410 C 120 450 260 390 400 425 C 480 445 600 445 680 425 C 820 390 960 450 1100 400" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>';
    [[140, 250, "#e2475b"], [330, 330, "#f6c343"], [780, 300, "#3fa35b"], [950, 220, "#e2475b"]].forEach(function (u) {
      var seg = ""; for (var j = 0; j < 8; j++) { var a1 = j * Math.PI / 4, a2 = a1 + Math.PI / 4;
        seg += '<path d="M' + u[0] + ' ' + u[1] + ' L' + (u[0] + 52 * Math.cos(a1)).toFixed(1) + ' ' + (u[1] + 52 * Math.sin(a1)).toFixed(1) + ' A52 52 0 0 1 ' + (u[0] + 52 * Math.cos(a2)).toFixed(1) + ' ' + (u[1] + 52 * Math.sin(a2)).toFixed(1) + ' Z" fill="' + (j % 2 ? "#ffffff" : u[2]) + '"/>'; }
      m += '<rect x="' + (u[0] - 70) + '" y="' + (u[1] + 20) + '" width="56" height="100" rx="8" fill="#7cc8f0" transform="rotate(-12 ' + u[0] + ' ' + u[1] + ')"/><g filter="url(#cut)">' + seg + '</g>'; });
    // hrdina zhora (hlava = vlasy s drdolom, ramena v tricku, ruky)
    m += '<g transform="translate(0 0)"><g id="mo_rmHero"><g filter="url(#cut)">' +
      '<g id="mo_rmAL"><rect x="-62" y="-78" width="26" height="92" rx="13" fill="#7f5033" stroke="#653d24" stroke-width="4"/></g>' +
      '<g id="mo_rmAR"><rect x="36" y="-78" width="26" height="92" rx="13" fill="#7f5033" stroke="#653d24" stroke-width="4"/></g>' +
      '<ellipse cx="0" cy="34" rx="50" ry="44" fill="#e2475b" stroke="#b8344a" stroke-width="5"/>' +
      '<circle cx="-38" cy="-8" r="10" fill="#7f5033"/><circle cx="38" cy="-8" r="10" fill="#7f5033"/>' +
      '<circle cx="0" cy="-10" r="40" fill="' + hc + '"/><circle cx="0" cy="-30" r="17" fill="#3a271d"/></g></g></g>';
    m += '<path id="mo_rmPath" d="M610 790 Q 760 800 850 870" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-dasharray="26 22" opacity="0"/>' +
      '<path id="mo_rmPathH" d="M820 830 L862 878 L800 888" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>';
    m += '<g id="mo_rmOk" opacity="0"><circle cx="980" cy="760" r="54" fill="#3fa35b" stroke="#ffffff" stroke-width="8"/><path d="M952 762 L972 784 L1008 742" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g>';
    // stitok rychlosti
    m += '<g transform="translate(850 930) rotate(-6)"><g id="mo_rmTag" opacity="0"><rect x="-175" y="-110" width="350" height="215" rx="18" fill="#fbf5ea" stroke="#d9483b" stroke-width="10"/>' +
      '<text x="0" y="-48" style="font-family:Hand;font-weight:700;font-size:40px;letter-spacing:3px;text-anchor:middle;fill:#d9483b">UP TO</text>' +
      '<text x="0" y="72" style="font-family:Pop;font-weight:600;font-size:70px;text-anchor:middle;fill:#d9483b">8 FT/SEC</text></g></g>';
    // zavod: prud vs olympionik
    m += '<g id="mo_rmRace" opacity="0"><g id="mo_rmRaceIn"><rect x="50" y="1040" width="980" height="400" rx="26" fill="#fbf5ea"/><rect x="50" y="1040" width="980" height="400" rx="26" fill="none" stroke="#2b2320" stroke-width="6" opacity="0.15"/>' +
      '<path d="M80 1240 H1000" stroke="#9fd6f2" stroke-width="8" stroke-dasharray="24 16"/><path d="M960 1060 V1420" stroke="#2b2320" stroke-width="10" stroke-dasharray="20 20"/>' +
      '<g id="mo_rmRA"><path d="M100 1110 H300 V1078 L380 1140 L300 1202 V1170 H100 Z" fill="#164f86" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/>' +
      '<text x="210" y="1155" style="font-family:Pop;font-weight:600;font-size:44px;text-anchor:middle;fill:#ffffff">RIP</text></g>' +
      '<g id="mo_rmRS"><path d="M110 1340 Q 190 1318 270 1340" fill="none" stroke="#7cc8f0" stroke-width="10" stroke-linecap="round"/>' +
      '<rect x="120" y="1316" width="160" height="40" rx="20" fill="#2f6fbf"/><path d="M230 1330 Q 250 1250 310 1290" fill="none" stroke="#e3ae82" stroke-width="22" stroke-linecap="round"/>' +
      '<circle cx="300" cy="1330" r="34" fill="#e3ae82"/><path d="M268 1322 A34 34 0 0 1 334 1322 Z" fill="#d9483b"/><rect x="296" y="1322" width="34" height="12" rx="6" fill="#2b2320"/>' +
      '<path d="M170 1316 L190 1360 L210 1316" fill="none" stroke="#d9483b" stroke-width="6"/><circle cx="190" cy="1372" r="20" fill="#f6c343" stroke="#c9961f" stroke-width="5"/>' +
      '<text x="200" y="1410" style="font-family:Hand;font-weight:700;font-size:34px;letter-spacing:2px;text-anchor:middle;fill:#2b2320">OLYMPIAN</text>' +
      '<g id="mo_rmRSw" opacity="0"><path d="M344 1282 q8 -14 0 -26 q-8 12 0 26 z M362 1300 q8 -14 0 -26 q-8 12 0 26 z" fill="#7cc8f0"/></g></g></g></g>';
    s.insertAdjacentHTML("beforeend", m);
    PF.P("mo_rmHero", 0, 0, { tx: 540, ty: 720, s: 1.25 });
    PF.P("mo_rmAL", -49, 10); PF.P("mo_rmAR", 49, 10);
    if (PF.VO.total > 0) { var cp = PF.loopPeriod(0.42), cn = Math.round(TOT() / cp);
      tl.fromTo("#mo_rmChM", { y: 0 }, { y: 160, duration: cp, ease: "none", repeat: cn - 1, immediateRender: false }, 0); }
    yoyoY("#mo_rmWv", -12, 6, 2.2);
    st.rip = { on: false };
    return st.rip;
  }
  function strokes(t0, t1, per) {           // ruky postavicky zhora (krauel)
    var n = Math.max(1, Math.floor((t1 - t0) / per)) * 2 - 1;
    PF.XY("mo_rmAL", { r: -70 }, t0, per / 2, "sine.inOut", n); PF.XY("mo_rmAR", { r: 70 }, t0 + per / 4, per / 2, "sine.inOut", n);
  }
  M.ripmap = function (t, mode, t1, o) {
    o = o || {}; var S = map(), end = (t1 || t + 3);
    if (mode === "off") { R.clean("ripmap", t, 0.3); return null; }
    if (!mode) {
      var y0 = o.y0 || 720, y1 = o.y1 === undefined ? 980 : o.y1;
      PF.X("mo_rmHero", { tx: 540, ty: y0, r: 0 }, t, 0);
      PF.S("#mo_ripMap", { opacity: 1, clipPath: "circle(0% at 50% 45%)" }, t - 0.2);
      tl.fromTo("#mo_ripMap", { clipPath: "circle(0% at 50% 45%)" }, { clipPath: "circle(80% at 50% 45%)", duration: 0.4, ease: "power2.in", immediateRender: false }, t - 0.2);
      PF.S("#mo_ripMap", { clipPath: "none" }, t + 0.22);
      if (y1 !== y0) PF.X("mo_rmHero", { ty: y1 }, t + 0.1, Math.max(0.5, (o.carry || end - t) - 0.1), "power1.in");
      strokes(t + 0.1, t + (o.str || Math.min(3, end - t)), 0.36);
      S.on = true;
      R.dirty("ripmap", function (tt, d) {
        PF.O("#mo_ripMap", 1, 0, tt, d ? 0.25 : 0.01);
        PF.S("#mo_rmTag,#mo_rmRace,#mo_rmPath,#mo_rmPathH,#mo_rmCalm,#mo_rmOk,#mo_rmRSw", { opacity: 0 }, tt + (d ? 0.27 : 0.02)); S.on = false; });
      return null;
    }
    if (mode === "speed") {
      PF.O("#mo_rmTag", 0, 1, t, 0.04);
      tl.fromTo("#mo_rmTag", { scale: 2.4, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.15, ease: "power3.in", immediateRender: false }, t);
      PF.punch(t + 0.15, 1.035); shake(t + 0.15, 0.22, 9);
      return null;
    }
    if (mode === "race") {
      var d = Math.max(1.0, end - t - 0.35);
      PF.O("#mo_rmRace", 0, 1, t, 0.06);
      tl.fromTo("#mo_rmRaceIn", { scale: 0.5, rotation: -6, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.fromTo("#mo_rmRA", { x: 0 }, { x: 560, duration: d, ease: "power2.in", immediateRender: false }, t + 0.3);
      tl.fromTo("#mo_rmRS", { x: 0 }, { x: 250, duration: d, ease: "power1.out", immediateRender: false }, t + 0.3);
      tl.fromTo("#mo_rmRS", { y: 0 }, { y: -8, duration: 0.15, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, Math.floor(d / 0.15)) | 1, immediateRender: false }, t + 0.3);
      PF.O("#mo_rmRSw", 0, 1, t + 0.3 + d * 0.6, 0.1);
      return null;
    }
    if (mode === "side") {                  // plave bokom (rovnobezne s brehom), prud ho trochu taha dole
      var dd = o.dur || 2.4;
      PF.O("#mo_rmPath", 0, 1, t, 0.15); PF.O("#mo_rmPathH", 0, 1, t + 0.1, 0.15);
      PF.X("mo_rmHero", { r: 90 }, t, 0.3, "power2.out");
      PF.X("mo_rmHero", { tx: 880, ty: 880 }, t + 0.2, dd, "sine.inOut");
      strokes(t + 0.2, t + 0.2 + dd, 0.4);
      return null;
    }
    if (mode === "free") {                  // vonku z kanala: voda sa upokoji, fajka, otoci sa k brehu
      PF.O("#mo_rmCalm", 0, 1, t, 0.3);
      tl.fromTo("#mo_rmCalm", { scale: 0.3, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.6, ease: "power2.out", immediateRender: false }, t);
      PF.O("#mo_rmPath,#mo_rmPathH", 1, 0, t, 0.2);
      PF.X("mo_rmHero", { r: 0 }, t + 0.1, 0.35, "power2.inOut");
      PF.O("#mo_rmOk", 0, 1, t + 0.15, 0.05);
      tl.fromTo("#mo_rmOk", { scale: 0.3, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t + 0.15);
      return null;
    }
    return null;
  };

  // ---------- energia: vodorovny pruh hore nad hlavou
  M.energy = function (t, val, t1, o) {
    o = o || {}; var u = UI(), v = Math.max(0, Math.min(1, +val)), W = 520;
    var col = function (q) { return q > 0.5 ? "#3fa35b" : q > 0.25 ? "#f2b632" : "#d9483b"; };
    if (!st.en) {
      u.insertAdjacentHTML("beforeend", '<div class="mo" id="mo_rpEn" style="top:' + (o.y || 318) + 'px"><div class="mo-paper" id="mo_rpEnIn" style="padding:14px 26px 14px 22px;display:flex;align-items:center;gap:16px">' +
        '<svg viewBox="0 0 40 60" style="position:static;width:40px;height:60px;display:block"><path d="M24 2 L4 34 H20 L14 58 L36 24 H20 Z" fill="#f6c343" stroke="#2b2320" stroke-width="4" stroke-linejoin="round"/></svg>' +
        '<span class="mo-lbl" style="font-size:36px">ENERGY</span>' +
        '<svg viewBox="0 0 540 70" style="position:static;width:540px;height:70px;display:block;overflow:visible"><defs><clipPath id="mo_rpEnC"><rect x="10" y="12" width="520" height="46" rx="23"/></clipPath></defs>' +
        '<rect x="4" y="6" width="532" height="58" rx="29" fill="#ffffff"/><g clip-path="url(#mo_rpEnC)"><rect id="mo_rpEnB" x="10" y="12" width="' + W + '" height="46" fill="#3fa35b"/></g>' +
        '<rect id="mo_rpEnF" x="4" y="6" width="532" height="58" rx="29" fill="none" stroke="#2b2320" stroke-width="7"/>' +
        '<g id="mo_rpEnS" opacity="0"><rect x="380" y="-58" width="150" height="50" rx="12" fill="#3fa35b"/><text x="455" y="-21" style="font-family:Pop;font-weight:600;font-size:30px;text-anchor:middle;fill:#ffffff">SAVED</text></g></svg></div></div>');
      st.en = { v: 1, on: false };
    }
    if (!st.en.on) {
      PF.S("#mo_rpEnB", { attr: { width: (W * v).toFixed(1) }, fill: col(v) }, t - 0.01);
      PF.O("#mo_rpEn", 0, 1, t, 0.08);
      tl.fromTo("#mo_rpEnIn", { scale: 0.4, rotation: -6 }, { scale: 1, rotation: -1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      st.en.on = true; st.en.v = v;
      R.dirty("energy", function (tt, d) { PF.O("#mo_rpEn", 1, 0, tt, d ? 0.2 : 0.01); PF.S("#mo_rpEnS", { opacity: 0 }, tt + 0.22); st.en.on = false; });
      return null;
    }
    var dur = o.dur || 1.2, a = st.en.v;
    tl.fromTo("#mo_rpEnB", { attr: { width: (W * a).toFixed(1) }, fill: col(a) }, { attr: { width: (W * v).toFixed(1) }, fill: col(v), duration: dur, ease: o.ease || "power1.inOut", immediateRender: false }, t);
    if (v < 0.26 && !o.flash) { for (var i = 0; i < 3; i++) { var ts = t + dur * 0.5 + i * 0.45;
      tl.fromTo("#mo_rpEnIn", { x: -7 }, { x: 7, duration: 0.05, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, ts); PF.S("#mo_rpEnIn", { x: 0 }, ts + 0.31); } }
    if (o.blink) {
      tl.fromTo("#mo_rpEnF", { stroke: "#2b2320" }, { stroke: "#d9483b", duration: 0.12, ease: "none", yoyo: true, repeat: 7, immediateRender: false }, t + dur);
      PF.VIG(t + dur, 0.6);
    }
    if (o.flash) {
      PF.O("#mo_rpEnS", 0, 1, t, 0.06);
      tl.fromTo("#mo_rpEnIn", { scale: 1.14 }, { scale: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, t);
    }
    st.en.v = v;
    return null;
  };

  // ---------- plavcik: veza na plazi vlavo na horizonte; "blow" = pistalka
  M.lifeguard = function (t, mode, t1, o) {
    o = o || {}; build();
    if (!st.tw) {
      var x = o.x || 80, y = HOR - 20;
      document.getElementById("mo_rpTwO").insertAdjacentHTML("beforeend", '<g id="mo_rpTw" opacity="0"><g id="mo_rpTwIn" filter="url(#cut)">' +
        '<path d="M' + (x - 60) + ' ' + y + ' L' + (x - 34) + ' ' + (y - 150) + ' M' + (x + 60) + ' ' + y + ' L' + (x + 34) + ' ' + (y - 150) + ' M' + (x - 50) + ' ' + (y - 60) + ' L' + (x + 50) + ' ' + (y - 60) + '" stroke="#f3efe6" stroke-width="14" stroke-linecap="round"/>' +
        '<rect x="' + (x - 78) + '" y="' + (y - 170) + '" width="156" height="24" rx="6" fill="#d9483b"/>' +
        '<g id="mo_rpLg"><rect x="' + (x - 24) + '" y="' + (y - 232) + '" width="48" height="66" rx="18" fill="#d9483b"/><circle cx="' + x + '" cy="' + (y - 254) + '" r="26" fill="#c68b5e"/>' +
        '<path d="M' + (x - 26) + ' ' + (y - 262) + ' A26 26 0 0 1 ' + (x + 26) + ' ' + (y - 262) + ' Z" fill="#f6c343"/>' +
        '<g id="mo_rpLgA"><rect x="' + (x + 14) + '" y="' + (y - 226) + '" width="16" height="54" rx="8" fill="#c68b5e"/></g></g>' +
        '<path d="M' + (x - 70) + ' ' + (y - 170) + ' V' + (y - 300) + '" stroke="#7a5a3c" stroke-width="7"/><path d="M' + (x - 70) + ' ' + (y - 300) + ' L' + (x - 10) + ' ' + (y - 284) + ' L' + (x - 70) + ' ' + (y - 266) + ' Z" fill="#d9483b"/></g>' +
        '<g id="mo_rpWh" opacity="0" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"><path d="M' + (x + 46) + ' ' + (y - 290) + ' q16 14 0 30 M' + (x + 66) + ' ' + (y - 302) + ' q26 26 0 54 M' + (x + 86) + ' ' + (y - 314) + ' q36 38 0 78"/></g>' +
        '<g id="mo_rpEx" opacity="0"><circle cx="' + (x + 40) + '" cy="' + (y - 318) + '" r="32" fill="#fbf5ea" stroke="#d9483b" stroke-width="6"/><text x="' + (x + 40) + '" y="' + (y - 300) + '" style="font-family:Pop;font-weight:600;font-size:50px;text-anchor:middle;fill:#d9483b">!</text></g></g>');
      PF.P("mo_rpLgA", x + 22, y - 222);
      st.tw = { x: x, y: y, on: false };
    }
    if (mode === "blow") {
      PF.X("mo_rpLgA", { r: 160 }, t - 0.1, 0.15, "power2.out");
      tl.fromTo("#mo_rpWh", { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t);
      PF.O("#mo_rpEx", 0, 1, t, 0.05);
      tl.fromTo("#mo_rpEx", { scale: 0.2, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.3, ease: "back.out(2.6)", immediateRender: false }, t);
      return null;
    }
    R.clean("beach", t - 0.3, 0.35);         // veza stoji na plazi: plaz sa vrati blizsie
    PF.O("#mo_rpTw", 0, 1, t, 0.06);
    tl.fromTo("#mo_rpTwIn", { scale: 0.2, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.35, ease: "back.out(2)", immediateRender: false }, t);
    st.tw.on = true;
    R.dirty("tower", function (tt, d) { PF.O("#mo_rpTw", 1, 0, tt, d ? 0.2 : 0.01); PF.S("#mo_rpWh,#mo_rpEx", { opacity: 0 }, tt + 0.22); PF.X("mo_rpLgA", { r: 0 }, tt, 0); st.tw.on = false; });
    return null;
  };
})();
