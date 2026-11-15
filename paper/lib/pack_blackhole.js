// pack_blackhole.js - momenty pre video 039 Into A Black Hole
// abyss   ""      = vesmir s ciernou dierou ako celoplosne pozadie (od snimku 0, bez dirty): hviezdy, ziara, akrecny disk sa toci, ciary padaju dnu
//         "fall"  = hrdina pada: ruky a nohy mlatia, telo sa kyva; "edge" = kruh svetla prejde cez obraz (prekrocil okraj);
//         "pulse" = diera pulzne; "light" = luce svetla sa vratia a zmiznu v kruhu; "dark" = hviezdy zhasnu
// noodle  "feet"  = sipky tahu (pri nohach velke, pri hlave male), nohy sa natiahnu; "stretch" = cele telo vyssie a tenke; "more" = pomaly dalej;
//         "tear"  = tenky ako rezanec, kmita; "spaghetti" = rezanec sa vtoci do diery, hrdina zmizne
// doom    ""      = karta so stopkami "??.?" (tip); "reveal" = nabehne na 12.8; "down" = odpocet na 00.0; "run" = od 00.0 v realnom case; "off"
// farview pohlad z dialky (celoplosny panel): "" = odjazd kamery; "friend" = kamarat v lodi s dalekohladom; "watch" = luc pohladu;
//         "sees" = kamarat sa zarazi; "approach" = hrdina sa blizi a spomaluje; "edge" = okraj zasvieti; "slow" = mavanie spomaluje; "red"; "fade"
// holes   porovnanie (celoplosny panel): "" = mala vs obrovska diera, mali hrdina pada; "rips" = roztrhne ho daleko vonku; "km" = sipka + HUNDREDS OF KM;
//         "big" = druhy hrdina prejde okrajom obrovskej diery; "later" = sipka od vonkajsieho kruhu k vnutornemu; "stretch" = natiahne ho az vnutri
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake;
  var HX = 540, HY = 1080, HR = 300, INK = "#2b2320", RED = "#d9483b", PAPER = "#fbf5ea";
  function TOT() { return PF.VO.total || 30; }
  function loopDash(sel, a, b, per) {       // posun ciarkovania cez cele video (perioda deli dlzku -> slucka bez skoku)
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, { attr: { "stroke-dashoffset": a } }, { attr: { "stroke-dashoffset": b }, duration: p, ease: "none", repeat: n - 1, immediateRender: false }, 0);
  }
  function yoyoO(sel, a, b, per) {
    if (!(PF.VO.total > 0)) return; var p = PF.loopPeriod(per), n = Math.max(1, Math.round(TOT() / p));
    tl.fromTo(sel, { opacity: a }, { opacity: b, duration: p / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * n - 1, immediateRender: false }, 0);
  }
  function stars(seed, n, skip) {           // nahodne (deterministicke) hviezdy; skip(x,y) = vynechat
    var rr = PF.rnd(seed), s = "", tw = "", i, k = 0;
    for (i = 0; i < n; i++) {
      var x = -220 + rr() * 1520, y = -220 + rr() * 1900, r = 1.4 + rr() * 2.8;
      if (skip && skip(x, y)) continue;
      if (k < 10 && r > 3.2) { tw += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (r + 1).toFixed(1) + '" fill="#fff6d8"/>'; k++; }
      else s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + r.toFixed(1) + '" fill="#ffffff" opacity="' + (0.45 + rr() * 0.55).toFixed(2) + '"/>';
    }
    return [s, tw];
  }
  // cierna diera (spolocne kreslenie): ziara, zadna polovica disku, cierny kotuc, fotonovy kruh, predna polovica disku
  function hole(id, cx, cy, r, k) {
    var rx = r * (k || 2.1), ry = r * 0.42, w = Math.max(10, r * 0.21), s = "";
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 1.75).toFixed(0) + '" fill="url(#mo_bhGlow)"/>';
    var back = "M" + (cx - rx) + " " + cy + " A" + rx + " " + ry + " 0 0 1 " + (cx + rx) + " " + cy;
    var front = "M" + (cx + rx) + " " + cy + " A" + rx + " " + ry + " 0 0 1 " + (cx - rx) + " " + cy;
    var dash = (r * 0.17).toFixed(0) + " " + (r * 0.23).toFixed(0);
    s += '<g opacity="0.8"><path d="' + back + '" fill="none" stroke="#e86a24" stroke-width="' + w.toFixed(0) + '"/><path d="' + back + '" fill="none" stroke="#ffc46b" stroke-width="' + (w * 0.4).toFixed(0) + '"/>' +
      '<path id="' + id + 'Db" d="' + back + '" fill="none" stroke="#fff1c2" stroke-width="' + (w * 0.18).toFixed(1) + '" stroke-dasharray="' + dash + '" stroke-linecap="round"/></g>';
    s += '<circle id="' + id + 'Ring" cx="' + cx + '" cy="' + cy + '" r="' + (r * 1.04).toFixed(0) + '" fill="none" stroke="#ffd98f" stroke-width="' + Math.max(4, r * 0.05).toFixed(0) + '"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#040307"/>';
    s += '<path d="' + front + '" fill="none" stroke="#ff8a34" stroke-width="' + w.toFixed(0) + '"/><path d="' + front + '" fill="none" stroke="#ffd27a" stroke-width="' + (w * 0.4).toFixed(0) + '"/>' +
      '<path id="' + id + 'Df" d="' + front + '" fill="none" stroke="#fff6da" stroke-width="' + (w * 0.18).toFixed(1) + '" stroke-dasharray="' + dash + '" stroke-linecap="round"/>';
    return s;
  }
  function spinHole(id, r) { var L = (r * 0.4) * 2; loopDash("#" + id + "Db", 0, -L, 1.6); loopDash("#" + id + "Df", 0, -L, 1.6); }
  function defs() {
    if (st.bhDefs) return; st.bhDefs = 1;
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<radialGradient id="mo_bhSky" cx="0.5" cy="0.56" r="0.75"><stop offset="0" stop-color="#2b1a44"/><stop offset="0.55" stop-color="#130d26"/><stop offset="1" stop-color="#06050e"/></radialGradient>' +
      '<radialGradient id="mo_bhGlow"><stop offset="0.5" stop-color="#ffb04a" stop-opacity="0.95"/><stop offset="0.66" stop-color="#ff7a2a" stop-opacity="0.45"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>');
  }

  // ================= ABYSS (pozadie od snimku 0)
  function build() {
    if (st.bh) return st.bh;
    defs();
    var Hh = C().hero, p = Hh.p, m = "", i;
    UI();
    ["sp_B", "sp_M", "sp_F"].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.display = "none"; });
    var fl = document.getElementById(p + "float"), w = document.createElementNS("http://www.w3.org/2000/svg", "g");
    w.setAttribute("id", "mo_bhW"); fl.parentNode.insertBefore(w, fl); w.appendChild(fl);   // obal postavy (kyvanie bez kolizie s PF.st)
    m += '<rect x="-400" y="-500" width="1880" height="2900" fill="url(#mo_bhSky)"/>';
    var sv = stars(3901, 150, function (x, y) { return Math.hypot(x - HX, y - HY) < HR + 30; });
    m += '<g id="mo_bhSt">' + sv[0] + '<g id="mo_bhTw">' + sv[1] + '</g></g>';
    // ciary padajuce do diery
    var sk = "";
    for (i = 0; i < 16; i++) {
      var a = (i / 16) * Math.PI * 2 + 0.2, x0 = HX + Math.cos(a) * 1250, y0 = HY + Math.sin(a) * 1250, x1 = HX + Math.cos(a) * (HR + 40), y1 = HY + Math.sin(a) * (HR + 40);
      sk += '<path id="mo_bhK' + i + '" d="M' + x0.toFixed(0) + ' ' + y0.toFixed(0) + ' L' + x1.toFixed(0) + ' ' + y1.toFixed(0) + '" stroke="#cfe0ff" stroke-width="' + (3 + (i % 3) * 2) + '" stroke-linecap="round" stroke-dasharray="110 1200" stroke-dashoffset="110" opacity="0.55"/>';
    }
    m += '<g>' + sk + '</g>';
    m += '<g id="mo_bhLt" opacity="0" fill="none" stroke-linecap="round">' +
      '<path id="mo_bhL1" pathLength="1000" d="M690 1010 C 760 760 960 600 990 760 C 1015 900 860 1000 800 1050" stroke="#fff2a8" stroke-width="20" stroke-dasharray="1000 1000" stroke-dashoffset="1000"/>' +
      '<path id="mo_bhL2" pathLength="1000" d="M390 1010 C 320 760 120 600 90 760 C 65 900 220 1000 280 1050" stroke="#fff2a8" stroke-width="20" stroke-dasharray="1000 1000" stroke-dashoffset="1000"/></g>';
    m += '<g id="mo_bhHo">' + hole("mo_bhA", HX, HY, HR) + '</g>';
    m += '<circle id="mo_bhEr" cx="' + HX + '" cy="' + HY + '" r="312" fill="none" stroke="#ffe3a6" stroke-width="40" opacity="0"/>';
    w.insertAdjacentHTML("beforebegin", '<g id="mo_bhBg">' + m + '</g>');
    // predna vrstva: sipky tahu, rezanec
    var f = '<g id="mo_bhAr" opacity="0">' + arrow("mo_bhAh1", 300, 650, 60, 10) + arrow("mo_bhAh2", 780, 650, 60, 10) +
      arrow("mo_bhAf1", 300, 1230, 190, 28) + arrow("mo_bhAf2", 780, 1230, 190, 28) + '</g>';
    var sp = "M" + (HX + 560) + " " + HY, q;
    for (q = 1; q <= 60; q++) { var ang = q / 60 * Math.PI * 5, rad = 560 * (1 - q / 62); sp += " L" + (HX + Math.cos(ang) * rad).toFixed(0) + " " + (HY + Math.sin(ang) * rad * 0.8).toFixed(0); }
    f += '<g id="mo_bhNd" opacity="0"><g id="mo_bhNdIn" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path id="mo_bhNd1" pathLength="1000" d="' + sp + '" stroke="#c98d2a" stroke-width="40" stroke-dasharray="1000 1000" stroke-dashoffset="1000"/>' +
      '<path id="mo_bhNd2" pathLength="1000" d="' + sp + '" stroke="#f6c343" stroke-width="26" stroke-dasharray="1000 1000" stroke-dashoffset="1000"/></g></g>';
    w.insertAdjacentHTML("afterend", '<g id="mo_bhFr">' + f + '</g>');
    spinHole("mo_bhA", HR);
    for (i = 0; i < 16; i++) loopDash("#mo_bhK" + i, 110, -1000, 0.9 + (i % 5) * 0.23);
    yoyoO("#mo_bhTw", 1, 0.25, 1.3);
    Hh.shadow(false, 0);
    st.bh = { fall: false };
    return st.bh;
  }
  function arrow(id, x, y, len, w) {        // sipka dole (tah smerom do diery)
    return '<g id="' + id + '"><path d="M' + x + ' ' + y + ' V' + (y + len) + '" stroke="#ff9a3c" stroke-width="' + w + '" stroke-linecap="round"/>' +
      '<path d="M' + (x - w * 1.5 - 8) + ' ' + (y + len - w - 6) + ' L' + x + ' ' + (y + len + w * 0.9 + 6) + ' L' + (x + w * 1.5 + 8) + ' ' + (y + len - w - 6) + '" fill="none" stroke="#ff9a3c" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }
  M.abyss = function (t, mode, t1, o) {
    o = o || {}; build();
    var Hh = C().hero, p = Hh.p, a0 = C().arms0;
    if (mode === "fall") {                  // pad: ruky a nohy mlatia, telo sa kyva (obal mo_bhW)
      var te = Math.max(t + 0.8, Math.min((t1 || t + 3) - 0.1, t + (o.dur || 2.2))), per = 0.34;
      var n = Math.max(1, Math.floor((te - t - 0.3) / per)) * 2 - 1;
      Hh.arm("L", 135, t, 0.22, "back.out(2)"); Hh.arm("R", -135, t, 0.22, "back.out(2)");
      PF.XY(p + "armL", { r: 105 }, t + 0.22, per / 2, "sine.inOut", n); PF.XY(p + "armR", { r: -105 }, t + 0.3, per / 2, "sine.inOut", n);
      PF.XY(p + "legL", { r: 16 }, t + 0.1, per / 2, "sine.inOut", n); PF.XY(p + "legR", { r: -16 }, t + 0.25, per / 2, "sine.inOut", n);
      var tw = (te - t) / 2;
      tl.fromTo("#mo_bhW", { rotation: 0, svgOrigin: "540 1100" }, { rotation: o.rot || -8, duration: tw, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t);
      Hh.arm("L", a0[0], te, 0.35); Hh.arm("R", a0[1], te, 0.35);
      if (o.face !== false) R.face(t, o.face || "shocked");
      R.dirty("fall", function (tt, d) { Hh.arm("L", a0[0], tt, d || 0.01); Hh.arm("R", a0[1], tt, d || 0.01); Hh.leg("L", 0, tt, d || 0.01); Hh.leg("R", 0, tt, d || 0.01); tl.set("#mo_bhW", { rotation: 0, svgOrigin: "540 1100" }, tt); });
      return "body";
    }
    if (mode === "edge") {                  // okraj prejde cez obraz: kruh svetla sa rozbehne von
      PF.S("#mo_bhEr", { opacity: 1 }, t);
      PF.AT("#mo_bhEr", { r: 312, "stroke-width": 44 }, { r: 1500, "stroke-width": 6 }, t, 0.75, "power2.out");
      PF.O("#mo_bhEr", 1, 0, t + 0.35, 0.4);
      tl.fromTo("#mo_flash", { opacity: 0.5 }, { opacity: 0, duration: 0.3, ease: "power1.out", immediateRender: false }, t);
      PF.punch(t, 1.04); shake(t, 0.3, 10);
      return null;
    }
    if (mode === "pulse") {                 // diera "dychne"
      tl.fromTo("#mo_bhARing", { attr: { "stroke-width": 15 } }, { attr: { "stroke-width": 34 }, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t);
      PF.punch(t, 1.025);
      return null;
    }
    if (mode === "light") {                 // svetlo sa chce dostat von, zatoci sa spat a zmizne v kruhu
      PF.S("#mo_bhLt", { opacity: 1 }, t - 0.01);
      ["#mo_bhL1", "#mo_bhL2"].forEach(function (s, j) {
        tl.fromTo(s, { attr: { "stroke-dashoffset": 1000 } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.6, ease: "power1.out", immediateRender: false }, t + j * 0.06);
        tl.fromTo(s, { attr: { "stroke-dashoffset": 0 } }, { attr: { "stroke-dashoffset": -1000 }, duration: 0.45, ease: "power2.in", immediateRender: false }, t + 0.7 + j * 0.06);
      });
      PF.S("#mo_bhLt", { opacity: 0 }, t + 1.3);
      tl.fromTo("#mo_bhARing", { attr: { "stroke-width": 15 } }, { attr: { "stroke-width": 36 }, duration: 0.14, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t + 1.1);
      Hh.look(o.lx === undefined ? 12 : o.lx, -8, t, 0.2);
      R.dirty("look", function (tt, d) { Hh.look(0, 0, tt, d ? 0.2 : 0); });
      return null;
    }
    if (mode === "dark") {                  // hviezdy zhasnu
      PF.O("#mo_bhSt", 1, 0.06, t, 0.45);
      R.face(t, o.face || "worried");
      R.dirty("stars", function (tt, d) { PF.O("#mo_bhSt", 0.06, 1, tt, d ? 0.3 : 0.01); });
      return null;
    }
    return null;                            // "" = len postavit (od snimku 0)
  };

  // ================= NOODLE (natahovanie hrdinu)
  function noodleReg() {
    var Hh = C().hero, p = Hh.p, a0 = C().arms0;
    R.dirty("noodle", function (tt, d) {
      var q = d ? 0.2 : 0;
      PF.X(p + "float", { tx: 0, ty: 0, r: 0, sx: 1, sy: 1 }, tt, q); PF.X(p + "up", { sy: 1, sx: 1 }, tt, q); PF.X(p + "legs", { sy: 1, sx: 1 }, tt, q);
      Hh.arm("L", a0[0], tt, d || 0.01); Hh.arm("R", a0[1], tt, d || 0.01);
      PF.O("#mo_bhAr", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_bhNd", 1, 0, tt, d ? 0.15 : 0.01);
      tl.set("#mo_bhNd1,#mo_bhNd2", { attr: { "stroke-dashoffset": 1000 } }, tt + 0.2);
      tl.set("#mo_bhNdIn", { rotation: 0, scale: 1, svgOrigin: HX + " " + HY }, tt + 0.2);
    });
  }
  M.noodle = function (t, mode, t1, o) {
    o = o || {}; build(); noodleReg();
    var Hh = C().hero, p = Hh.p, end = (t1 || t + 3);
    if (mode === "feet") {                  // sipky: pri nohach velke, pri hlave male; nohy sa natiahnu
      PF.O("#mo_bhAr", 0, 1, t, 0.1);
      ["#mo_bhAh1", "#mo_bhAh2"].forEach(function (s) { tl.fromTo(s, { scaleY: 0, svgOrigin: "0 650" }, { scaleY: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + (o.hd || 0.5)); });
      ["#mo_bhAf1", "#mo_bhAf2"].forEach(function (s) { tl.fromTo(s, { scaleY: 0, svgOrigin: "0 1230" }, { scaleY: 1, duration: 0.35, ease: "back.out(2)", immediateRender: false }, t); });
      var k = Math.max(1, Math.floor((end - t - 0.6) / 0.5)) * 2 - 1;
      tl.fromTo("#mo_bhAf1,#mo_bhAf2", { y: 0 }, { y: 22, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: k, immediateRender: false }, t + 0.4);
      tl.fromTo("#mo_bhAh1,#mo_bhAh2", { y: 0 }, { y: 6, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: k, immediateRender: false }, t + (o.hd || 0.5) + 0.3);
      PF.X(p + "legs", { sy: 1.16 }, t + 0.1, 0.5, "power2.out"); PF.X(p + "float", { ty: -25 }, t + 0.1, 0.5, "power2.out");
      Hh.look(0, 12, t, 0.2); R.face(t, "worried");
      return null;
    }
    if (mode === "stretch") {               // cele telo vyssie a tenke (vyska obmedzena: karta hore, titulky dole)
      PF.X(p + "float", { ty: -40, sx: 0.72 }, t, 0.9, "power2.inOut");
      PF.X(p + "up", { sy: 1.08 }, t, 0.9, "power2.inOut"); PF.X(p + "legs", { sy: 1.25 }, t, 0.9, "power2.inOut");
      Hh.arm("L", 150, t, 0.5, "power2.out"); Hh.arm("R", -150, t, 0.5, "power2.out");
      R.face(t + 0.1, "pain"); shake(t + 0.2, 0.3, 6);
      return "body";
    }
    if (mode === "more") {                  // pomaly sa natahuje dalej, ruky sa trasu
      var d = Math.max(0.6, Math.min(o.dur || 99, end - t - 0.1));
      PF.X(p + "float", { sx: 0.62 }, t, d, "sine.inOut"); PF.X(p + "legs", { sy: 1.3 }, t, d, "sine.inOut");
      PF.XY(p + "armL", { r: 140 }, t, 0.12, "sine.inOut", Math.max(1, Math.floor(d / 0.24)) * 2 - 1);
      PF.XY(p + "armR", { r: -140 }, t + 0.06, 0.12, "sine.inOut", Math.max(1, Math.floor(d / 0.24)) * 2 - 1);
      return null;
    }
    if (mode === "tear") {                  // tenky ako rezanec, kmita
      PF.X(p + "float", { sx: 0.34, ty: -40 }, t, 0.35, "power2.in");
      PF.X(p + "legs", { sy: 1.34 }, t, 0.35);
      Hh.arm("L", 165, t, 0.3); Hh.arm("R", -165, t, 0.3);
      var kk = Math.max(1, Math.floor((Math.min(end, t + (o.dur || 1.1)) - t - 0.35) / 0.16)) * 2 - 1;
      PF.XY(p + "float", { r: 7 }, t + 0.35, 0.08, "sine.inOut", kk);
      R.face(t, "shocked"); shake(t, 0.25, 8);
      return null;
    }
    if (mode === "spaghetti") {             // rezanec sa vtoci do diery
      R.face(t - 0.05, "dizzy");
      PF.X(p + "float", { sx: 0.05, sy: 0.12, r: 540, ty: -20 }, t + 0.05, 0.6, "power2.in");
      PF.S("#mo_bhNd", { opacity: 1 }, t);
      tl.fromTo("#mo_bhNd1,#mo_bhNd2", { attr: { "stroke-dashoffset": 1000 } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.45, ease: "power1.out", immediateRender: false }, t);
      tl.fromTo("#mo_bhNdIn", { rotation: 0, scale: 1, svgOrigin: HX + " " + HY }, { rotation: 260, scale: 0.08, duration: 0.85, ease: "power2.in", immediateRender: false }, t + 0.25);
      PF.O("#mo_bhNd", 1, 0, t + 1.0, 0.1);
      tl.fromTo("#mo_bhARing", { attr: { "stroke-width": 15 } }, { attr: { "stroke-width": 40 }, duration: 0.15, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t + 1.0);
      PF.punch(t + 1.0, 1.04); shake(t + 1.0, 0.25, 9);
      return null;
    }
    return null;
  };

  // ================= DOOM (stopky: kolko sekund ostava)
  function fmt1(v) {
    var s = (Math.round(v * 10) / 10).toFixed(1); if (v < 9.95) s = "0" + s;
    return s.split("").map(function (c) { return c === "." ? '<i style="width:.28em">.</i>' : "<i>" + c + "</i>"; }).join("");
  }
  var QQ = '<i>?</i><i>?</i><i style="width:.28em">.</i><i>?</i>';
  function doomCount(a, b, t, d, ease) {
    var N = Math.max(2, Math.round(d * 30)), i;
    for (i = 1; i <= N; i++) { var k = i / N, e = ease === "lin" ? k : (k * k * (3 - 2 * k)); tl.set("#mo_bhCkD", { innerHTML: fmt1(a + (b - a) * e) }, t + d * k); }
  }
  function doomShow(t, o) {
    var u = UI();
    if (!st.dk) {
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-timer" id="mo_bhCk" style="top:' + (o.y || 118) + 'px"><div class="mo-paper" id="mo_bhCkIn" style="padding:14px 40px 8px 28px;display:flex;align-items:center;gap:20px">' +
        '<svg viewBox="0 0 120 140" style="position:static;display:block;flex:none;width:120px;height:140px"><rect x="48" y="4" width="24" height="18" rx="5" fill="' + INK + '"/>' +
        '<circle cx="60" cy="80" r="52" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="9"/><g stroke="' + INK + '" stroke-width="5" stroke-linecap="round"><path d="M60 36 v10 M60 114 v10 M16 80 h10 M94 80 h10"/></g>' +
        '<g id="mo_bhCkH"><path d="M60 80 L60 40" stroke="' + RED + '" stroke-width="8" stroke-linecap="round"/></g><circle cx="60" cy="80" r="8" fill="' + INK + '"/></svg>' +
        '<div style="text-align:center"><span class="mo-lbl" id="mo_bhCkL" style="font-size:34px">SECONDS LEFT</span><span class="mo-dig" id="mo_bhCkD" style="font-size:136px">' + QQ + '</span></div></div></div>');
      st.dk = { on: false, v: 0 };
    }
    if (st.dk.on) return;
    PF.O("#mo_bhCk", 0, 1, t, 0.06);
    tl.fromTo("#mo_bhCkIn", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    st.dk.on = true;
    R.dirty("doom", function (tt, d) {
      PF.O("#mo_bhCk", 1, 0, tt, d ? 0.2 : 0.01);
      var te = tt + (d ? 0.22 : 0.02);
      tl.set("#mo_bhCkH", { rotation: 0, svgOrigin: "60 80" }, te); tl.set("#mo_bhCkD", { innerHTML: QQ, color: INK, opacity: 1 }, te); tl.set("#mo_bhCkL", { innerHTML: "SECONDS LEFT" }, te);
      st.dk.on = false;
    });
  }
  M.doom = function (t, mode, t1, o) {
    o = o || {};
    if (mode === "off") { R.clean("doom", t, 0.2); return null; }
    doomShow(t, o);
    if (!mode) {                            // tip: "??.?" blika, rucicka sa splasene toci
      tl.set("#mo_bhCkD", { innerHTML: QQ, color: INK }, t);
      tl.fromTo("#mo_bhCkD", { opacity: 1 }, { opacity: 0.25, duration: 0.14, ease: "none", yoyo: true, repeat: 9, immediateRender: false }, t + 0.3);
      tl.fromTo("#mo_bhCkH", { rotation: 0, svgOrigin: "60 80" }, { rotation: 1080, duration: 1.4, ease: "power1.inOut", immediateRender: false }, t + 0.1);
      var Hh = C().hero; Hh.look(0, -12, t + 0.2, 0.2);
      R.dirty("look", function (tt, d) { Hh.look(0, 0, tt, d ? 0.2 : 0); });
      return null;
    }
    if (mode === "reveal") {                // nabehne 00.0 -> 12.8 a buchne
      var d = o.dur || 0.75, v = o.v === undefined ? 12.8 : o.v;
      tl.set("#mo_bhCkD", { opacity: 1, color: INK }, t);
      tl.set("#mo_bhCkL", { innerHTML: "SECONDS" }, t);
      doomCount(0, v, t, d);
      tl.fromTo("#mo_bhCkH", { rotation: 0, svgOrigin: "60 80" }, { rotation: v / 60 * 360 * 5, duration: d, ease: "power2.out", immediateRender: false }, t);
      tl.set("#mo_bhCkD", { color: "#a8261c" }, t + d);
      tl.fromTo("#mo_bhCkIn", { scale: 1.32 }, { scale: 1, duration: 0.2, ease: "power3.in", immediateRender: false }, t + d);
      tl.fromTo("#mo_flash", { opacity: 0.35 }, { opacity: 0, duration: 0.25, immediateRender: false }, t + d + 0.18);
      PF.punch(t + d + 0.2, 1.04); shake(t + d + 0.2, 0.22, 9);
      st.dk.v = v;
      return null;
    }
    if (mode === "down") {                  // odpocet na 00.0 (zrychlene), na konci sa karta trasie
      var dd = o.dur || 1.8;
      tl.set("#mo_bhCkL", { innerHTML: "SECONDS LEFT" }, t);
      doomCount(st.dk.v, 0, t, dd, "lin");
      tl.fromTo("#mo_bhCkH", { rotation: st.dk.v / 60 * 360 * 5, svgOrigin: "60 80" }, { rotation: 0, duration: dd, ease: "none", immediateRender: false }, t);
      tl.fromTo("#mo_bhCkIn", { x: -8 }, { x: 8, duration: 0.05, ease: "none", yoyo: true, repeat: 7, immediateRender: false }, t + dd);
      PF.S("#mo_bhCkIn", { x: 0 }, t + dd + 0.42);
      st.dk.v = 0;
      return null;
    }
    if (mode === "run") {                   // od 00.0 v realnom case (slucka: vidiet znova a pocitat)
      var te = (t1 || TOT()), dr = Math.max(0.3, te - t);
      tl.set("#mo_bhCkD", { innerHTML: fmt1(0), color: INK, opacity: 1 }, t);
      tl.set("#mo_bhCkL", { innerHTML: "SECONDS" }, t);
      var N = Math.floor(dr / 0.1), i;
      for (i = 1; i <= N; i++) tl.set("#mo_bhCkD", { innerHTML: fmt1(i * 0.1) }, t + i * 0.1);
      tl.fromTo("#mo_bhCkH", { rotation: 0, svgOrigin: "60 80" }, { rotation: dr * 30, duration: dr, ease: "none", immediateRender: false }, t);
      tl.fromTo("#mo_bhCkIn", { scale: 1.14 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t);
      return null;
    }
    return null;
  };

  // ================= maly astronaut (ikona pre panely), kresleny okolo (0,0), vyska ~120
  function astro(id, k) {
    return '<g id="' + id + '"><g id="' + id + 'B" filter="url(#cut)">' +
      '<g id="' + id + 'Al"><rect x="-44" y="-14" width="16" height="44" rx="8" fill="#eef2f6" stroke="#aeb9c6" stroke-width="4"/></g>' +
      '<g id="' + id + 'Ar"><rect x="28" y="-14" width="16" height="44" rx="8" fill="#eef2f6" stroke="#aeb9c6" stroke-width="4"/></g>' +
      '<rect x="-14" y="30" width="12" height="40" rx="6" fill="#eef2f6" stroke="#aeb9c6" stroke-width="4"/><rect x="2" y="30" width="12" height="40" rx="6" fill="#eef2f6" stroke="#aeb9c6" stroke-width="4"/>' +
      '<rect x="-28" y="-18" width="56" height="58" rx="18" fill="#eef2f6" stroke="#aeb9c6" stroke-width="4"/><circle cx="12" cy="6" r="7" fill="#f39c42"/>' +
      '<circle cx="0" cy="-40" r="26" fill="#eef2f6" stroke="#aeb9c6" stroke-width="4"/><path d="M-16 -44 Q0 -58 16 -44 V-34 Q0 -26 -16 -34 Z" fill="#3a6ea8"/></g>' +
      '<g id="' + id + 'Rd" opacity="0"><rect x="-28" y="-18" width="56" height="58" rx="18" fill="#ff3b2a" opacity="0.85"/><circle cx="0" cy="-40" r="27" fill="#ff3b2a" opacity="0.85"/>' +
      '<rect x="-14" y="30" width="28" height="40" rx="6" fill="#ff3b2a" opacity="0.85"/><rect x="-44" y="-14" width="88" height="44" rx="8" fill="#ff3b2a" opacity="0.6"/></g></g>';
  }

  // ================= FARVIEW (pohlad z dialky): velka diera hore, kamarat v lodi vlavo dole, okruhly priezor dalekohladu vpravo dole
  var FX = 720, FY = 640, FR = 170, FE = 184;
  var A0 = [250, 430], A1 = [440, 495];                 // drift astronauta: start -> koniec (stale mimo okraja)
  var STEPS = [0.38, 0.62, 0.78, 0.88, 0.94, 0.98, 1.0]; // kroky sa zmensuju = spomaluje
  var LX0 = 760, LY0 = 1180, LR = 220;                  // priezor (lens)
  var TIP = [387, 1040];                                // spicka dalekohladu
  function apos(f) { return [A0[0] + (A1[0] - A0[0]) * f, A0[1] + (A1[1] - A0[1]) * f]; }
  function farBuild() {
    if (st.bf) return st.bf;
    defs();
    var s = PF.panel("mo_bhFar", 4, true), m = "", i;
    m += '<g id="mo_bhFarIn"><rect x="-200" y="-200" width="1480" height="2320" fill="url(#mo_bhSky)"/>';
    var sv = stars(7713, 130, function (x, y) { return Math.hypot(x - FX, y - FY) < FR + 14 || Math.hypot(x - LX0, y - LY0) < LR + 14; });
    m += sv[0] + '<g id="mo_bhFTw">' + sv[1] + '</g>';
    m += hole("mo_bhF", FX, FY, FR, 1.7);
    m += '<circle id="mo_bhFE" cx="' + FX + '" cy="' + FY + '" r="' + FE + '" fill="none" stroke="#ffffff" stroke-width="9" stroke-dasharray="20 16" opacity="0"/>';
    // stopa (duchovia + bodky) - zhusťuje sa smerom k okraju
    m += '<g id="mo_bhFGh">';
    var prev = 0;
    for (i = 0; i < STEPS.length - 1; i++) {
      var p = apos(i === 0 ? 0 : STEPS[i - 1]);
      m += '<g id="mo_bhFg' + i + '" opacity="0"><g transform="translate(' + p[0].toFixed(0) + ' ' + p[1].toFixed(0) + ') rotate(' + (20 + 16 * (i === 0 ? 0 : STEPS[i - 1])).toFixed(0) + ') scale(1.5)">' +
        '<circle cx="0" cy="-40" r="26" fill="#cfe3ff"/><rect x="-28" y="-18" width="56" height="58" rx="18" fill="#cfe3ff"/><rect x="-14" y="30" width="28" height="40" rx="6" fill="#cfe3ff"/></g>' +
        '<circle cx="' + p[0].toFixed(0) + '" cy="' + (p[1] + 140).toFixed(0) + '" r="7" fill="#9fe0ff"/></g>';
    }
    m += '</g>';
    // luc pohladu (od dalekohladu k hrdinovi)
    m += '<path id="mo_bhFL" d="M' + TIP[0] + ' ' + TIP[1] + ' L' + A0[0] + ' ' + (A0[1] + 70) + '" fill="none" stroke="#9fe0ff" stroke-width="8" stroke-dasharray="22 18" opacity="0"/>';
    m += '<g id="mo_bhFHm"></g>';
    // lod s kamaratom (vlavo dole)
    m += '<g id="mo_bhFS" opacity="0"><g id="mo_bhFSi" filter="url(#cut)">' +
      '<path d="M70 1290 Q60 1180 170 1160 L360 1160 Q450 1170 470 1240 Q450 1310 360 1320 L170 1320 Q70 1310 70 1290 Z" fill="#f39c42" stroke="#c76f1c" stroke-width="8"/>' +
      '<path d="M120 1320 L80 1390 L180 1320 Z M300 1320 L360 1390 L380 1320 Z" fill="#d9483b"/>' +
      '<g id="mo_bhFT"><rect x="330" y="1150" width="160" height="34" rx="10" fill="#5a6676" stroke="#2b2320" stroke-width="5" transform="rotate(-78 360 1167)"/></g>' +
      '<circle cx="250" cy="1235" r="62" fill="#bfe6fb" stroke="#ffffff" stroke-width="10"/>' +
      '<g id="mo_bhFFc"><circle cx="250" cy="1240" r="40" fill="#c68b5e"/><path d="M212 1226 Q250 1180 288 1226 Z" fill="#2b2320"/>' +
      '<g id="mo_bhFEy"><circle cx="236" cy="1240" r="6" fill="#2b2320"/><circle cx="264" cy="1240" r="6" fill="#2b2320"/></g>' +
      '<path id="mo_bhFBr" d="M226 1224 L244 1230 M274 1224 L256 1230" stroke="#2b2320" stroke-width="5" stroke-linecap="round" opacity="0"/>' +
      '<path id="mo_bhFMs" d="M238 1258 Q250 1266 262 1258" fill="none" stroke="#2b2320" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse id="mo_bhFMo" cx="250" cy="1262" rx="7" ry="9" fill="#2b2320" opacity="0"/>' +
      '<path id="mo_bhFMw" d="M236 1264 Q243 1256 250 1264 Q257 1272 264 1264" fill="none" stroke="#2b2320" stroke-width="5" stroke-linecap="round" opacity="0"/></g>' +
      '</g><g id="mo_bhFG" opacity="0"><circle cx="' + TIP[0] + '" cy="' + TIP[1] + '" r="16" fill="#ffffff"/><path d="M' + TIP[0] + ' ' + (TIP[1] - 34) + ' V' + (TIP[1] + 34) + ' M' + (TIP[0] - 34) + ' ' + TIP[1] + ' H' + (TIP[0] + 34) + '" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/></g></g>';
    // priezor dalekohladu: kuzel od spicky + kruh s detailom hrdinu
    m += '<g id="mo_bhFZ" opacity="0"><g id="mo_bhFZi">' +
      '<path d="M' + TIP[0] + ' ' + TIP[1] + ' L' + (LX0 - 150) + ' ' + (LY0 - 160) + ' L' + (LX0 - 200) + ' ' + (LY0 + 90) + ' Z" fill="#9fe0ff" opacity="0.16"/>' +
      '<path d="M' + TIP[0] + ' ' + TIP[1] + ' L' + (LX0 - 150) + ' ' + (LY0 - 160) + ' M' + TIP[0] + ' ' + TIP[1] + ' L' + (LX0 - 200) + ' ' + (LY0 + 90) + '" stroke="#9fe0ff" stroke-width="4" stroke-dasharray="10 10" opacity="0.7"/>' +
      '<clipPath id="mo_bhFZc"><circle cx="' + LX0 + '" cy="' + LY0 + '" r="' + LR + '"/></clipPath>' +
      '<g clip-path="url(#mo_bhFZc)"><rect x="' + (LX0 - LR) + '" y="' + (LY0 - LR) + '" width="' + 2 * LR + '" height="' + 2 * LR + '" fill="#0d0a1c"/>' +
      '<circle cx="' + (LX0 + 250) + '" cy="' + (LY0 - 120) + '" r="260" fill="url(#mo_bhGlow)"/><circle cx="' + (LX0 + 270) + '" cy="' + (LY0 - 110) + '" r="150" fill="#040307"/>' +
      '<circle cx="' + (LX0 - 120) + '" cy="' + (LY0 - 120) + '" r="3" fill="#fff"/><circle cx="' + (LX0 - 160) + '" cy="' + (LY0 + 60) + '" r="2.5" fill="#fff"/><circle cx="' + (LX0 + 40) + '" cy="' + (LY0 + 170) + '" r="3" fill="#fff"/>' +
      '<g id="mo_bhFZh"></g>' +
      '<circle id="mo_bhFZr" cx="' + LX0 + '" cy="' + LY0 + '" r="' + LR + '" fill="#ff2a1a" opacity="0"/>' +
      '<path d="M' + (LX0 - LR) + ' ' + LY0 + ' H' + (LX0 + LR) + ' M' + LX0 + ' ' + (LY0 - LR) + ' V' + (LY0 + LR) + '" stroke="#9fe0ff" stroke-width="3" opacity="0.35"/></g>' +
      '<circle cx="' + LX0 + '" cy="' + LY0 + '" r="' + (LR + 8) + '" fill="none" stroke="#5a6676" stroke-width="22"/>' +
      '<circle cx="' + LX0 + '" cy="' + LY0 + '" r="' + (LR + 8) + '" fill="none" stroke="#2b2320" stroke-width="5"/>' +
      '<path d="M' + (LX0 - 150) + ' ' + (LY0 - 120) + ' A190 190 0 0 1 ' + (LX0 - 40) + ' ' + (LY0 - 186) + '" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.4"/>' +
      '</g></g>';
    m += '</g>';
    s.insertAdjacentHTML("beforeend", m);
    document.getElementById("mo_bhFHm").insertAdjacentHTML("beforeend", astro("mo_bhFh"));
    document.getElementById("mo_bhFZh").insertAdjacentHTML("beforeend", astro("mo_bhFz"));
    document.getElementById("mo_bhFzB").insertAdjacentHTML("beforeend", '<g id="mo_bhFzE"><circle cx="-8" cy="-39" r="4" fill="#ffffff"/><circle cx="8" cy="-39" r="4" fill="#ffffff"/></g>');
    PF.P("mo_bhFh", 0, 0, { tx: A0[0], ty: A0[1], s: 1.5, r: 20 });
    PF.P("mo_bhFhAr", 36, -10); PF.P("mo_bhFhAl", -36, -10);
    PF.P("mo_bhFz", 0, 0, { tx: LX0 - 10, ty: LY0 + 10, s: 2.3, r: 10 });
    PF.P("mo_bhFzAr", 36, -10); PF.P("mo_bhFzAl", -36, -10);
    PF.P("mo_bhFSi", 270, 1240);
    spinHole("mo_bhF", FR);
    yoyoO("#mo_bhFTw", 1, 0.3, 1.1);
    st.bf = { on: false };
    return st.bf;
  }
  function farWave(t, dur, per) {           // obaja (ikona aj detail) mavaju; per = polperioda
    var n = Math.max(1, Math.floor(dur / (per * 2))) * 2 - 1;
    PF.XY("mo_bhFhAr", { r: -75 }, t, per, "sine.inOut", n);
    PF.XY("mo_bhFzAr", { r: -75 }, t, per, "sine.inOut", n);
  }
  function friendFace(t, mode) {            // s = usmev, o = prekvapene, w = ustarostene
    PF.S("#mo_bhFMs", { opacity: mode === "s" ? 1 : 0 }, t);
    PF.S("#mo_bhFMo", { opacity: mode === "o" ? 1 : 0 }, t);
    PF.S("#mo_bhFMw", { opacity: mode === "w" ? 1 : 0 }, t);
    PF.S("#mo_bhFBr", { opacity: mode === "w" ? 1 : 0 }, t);
  }
  M.farview = function (t, mode, t1, o) {
    o = o || {}; var S = farBuild(), end = (t1 || t + 3);
    if (!mode) {                            // odjazd kamery: z detailu pri diere na celok
      PF.S("#mo_bhFar", { opacity: 1 }, t - 0.02);
      tl.fromTo("#mo_bhFarIn", { scale: 3.2, svgOrigin: "560 560" }, { scale: 1, duration: 0.6, ease: "power3.out", immediateRender: false }, t - 0.02);
      PF.X("mo_bhFh", { tx: A0[0], ty: A0[1], s: 1.5, r: 20 }, t, 0);
      PF.XY("mo_bhFh", { ty: A0[1] - 14 }, t + 0.2, 0.4, "sine.inOut", 1);
      farWave(t + 0.3, 0.6, 0.15);
      S.on = true;
      R.dirty("far", function (tt, d) {
        PF.O("#mo_bhFar", 1, 0, tt, d ? 0.25 : 0.01); var te = tt + (d ? 0.27 : 0.02);
        PF.S("#mo_bhFS,#mo_bhFL,#mo_bhFG,#mo_bhFE,#mo_bhFhRd,#mo_bhFzRd,#mo_bhFZ,#mo_bhFZr,#mo_bhFGh > g", { opacity: 0 }, te);
        PF.S("#mo_bhFh,#mo_bhFz", { opacity: 1 }, te); friendFace(te, "s");
        PF.X("mo_bhFh", { tx: A0[0], ty: A0[1], r: 20, sx: 1.5, sy: 1.5 }, te, 0);
        PF.X("mo_bhFz", { tx: LX0 - 10, ty: LY0 + 10, r: 10, sx: 2.3, sy: 2.3 }, te, 0);
        PF.X("mo_bhFSi", { r: 0, tx: 0, ty: 0 }, te, 0); S.on = false;
      });
      return null;
    }
    if (mode === "friend") {                // lod pricestuje zlava, kamarat zdvihne dalekohlad
      PF.O("#mo_bhFS", 0, 1, t, 0.05);
      PF.X("mo_bhFSi", { tx: -460 }, t, 0); PF.X("mo_bhFSi", { tx: 0 }, t, 0.5, "back.out(1.6)");
      tl.fromTo("#mo_bhFT", { rotation: 30, svgOrigin: "360 1167" }, { rotation: 0, duration: 0.35, ease: "back.out(2)", immediateRender: false }, t + 0.45);
      return null;
    }
    if (mode === "watch") {                 // luc pohladu, priezor sa otvori, hrdina mava a krokuje k okraju (kroky sa skracuju)
      var D = o.dur || 5.3, wv = o.wave || 4.3, k;
      PF.S("#mo_bhFL", { opacity: 1 }, t);
      tl.fromTo("#mo_bhFL", { attr: { "stroke-dashoffset": 200 } }, { attr: { "stroke-dashoffset": -200 }, duration: 1.0, ease: "none", repeat: Math.ceil((D + 1.5) / 1.0), immediateRender: false }, t);
      tl.fromTo("#mo_bhFL", { attr: { "stroke-width": 8 } }, { attr: { "stroke-width": 14 }, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: Math.ceil((D + 1.5) / 0.4) | 1, immediateRender: false }, t);
      PF.O("#mo_bhFG", 0, 1, t + 0.05, 0.05);
      tl.fromTo("#mo_bhFG", { rotation: 0, scale: 0.3, svgOrigin: TIP[0] + " " + TIP[1] }, { rotation: 90, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.05);
      PF.O("#mo_bhFG", 1, 0, t + 0.45, 0.15);
      PF.O("#mo_bhFZ", 0, 1, t + 0.15, 0.08);
      tl.fromTo("#mo_bhFZi", { scale: 0.2, svgOrigin: TIP[0] + " " + TIP[1] }, { scale: 1, duration: 0.45, ease: "back.out(1.4)", immediateRender: false }, t + 0.15);
      PF.X("mo_bhFSi", { r: -5, tx: 10 }, t + 0.1, 0.4, "power2.out");   // nakloni sa k dalekohladu
      farWave(t + 0.3, wv, 0.16);
      PF.XY("mo_bhFz", { ty: LY0 - 2 }, t + 0.3, 0.8, "sine.inOut", Math.max(1, Math.floor((D + 1.2) / 0.8)) | 1);
      var step = D / STEPS.length, f0 = 0;
      for (k = 0; k < STEPS.length; k++) {
        var tk = t + 0.3 + k * step, p = apos(STEPS[k]);
        if (k < STEPS.length - 1) PF.O("#mo_bhFg" + k, 0, 0.28, tk, 0.15);
        PF.X("mo_bhFh", { tx: p[0], ty: p[1], r: 20 + 16 * STEPS[k] }, tk, Math.min(0.55, step * 0.8), "expo.out");
        PF.AT("#mo_bhFL", { d: "M" + TIP[0] + " " + TIP[1] + " L" + apos(f0)[0].toFixed(0) + " " + (apos(f0)[1] + 70).toFixed(0) },
          { d: "M" + TIP[0] + " " + TIP[1] + " L" + p[0].toFixed(0) + " " + (p[1] + 70).toFixed(0) }, tk, Math.min(0.55, step * 0.8), "expo.out");
        f0 = STEPS[k];
      }
      return null;
    }
    if (mode === "sees") {                  // kamarat sa zarazi (usta "o", oci vacsie)
      friendFace(t, "o");
      tl.fromTo("#mo_bhFEy", { scale: 1, svgOrigin: "250 1240" }, { scale: 1.35, duration: 0.15, ease: "back.out(3)", immediateRender: false }, t);
      tl.fromTo("#mo_bhFT", { rotation: 0, svgOrigin: "360 1167" }, { rotation: -4, duration: 0.1, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t);
      return null;
    }
    if (mode === "approach") {              // detail sa priblizi, kamarat ustarostene
      friendFace(t + 0.1, "w");
      tl.fromTo("#mo_bhFEy", { scale: 1.35, svgOrigin: "250 1240" }, { scale: 1, duration: 0.2, ease: "power2.out", immediateRender: false }, t + 0.1);
      tl.fromTo("#mo_bhFZi", { scale: 1, svgOrigin: LX0 + " " + LY0 }, { scale: 1.05, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t);
      return null;
    }
    if (mode === "edge") {                  // okraj (horizont) zasvieti bodkovane a ostane
      PF.O("#mo_bhFE", 0, 1, t, 0.1);
      tl.fromTo("#mo_bhFE", { attr: { "stroke-dashoffset": 0 } }, { attr: { "stroke-dashoffset": -72 }, duration: 0.6, ease: "none", repeat: 6, immediateRender: false }, t);
      tl.fromTo("#mo_bhFE", { attr: { "stroke-width": 9 } }, { attr: { "stroke-width": 18 }, duration: 0.15, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t);
      return null;
    }
    if (mode === "slow") {                  // mavanie spomaluje + postupne cervenie (nabehne do "red")
      var tt = t, per = 0.2, j;
      for (j = 0; j < 5; j++) { PF.XY("mo_bhFhAr", { r: -75 }, tt, per, "sine.inOut", 1); PF.XY("mo_bhFzAr", { r: -75 }, tt, per, "sine.inOut", 1); tt += per * 2; per *= 1.5; if (tt > t + 2.6) break; }
      var rd = o.red || 1.3;
      PF.O("#mo_bhFhRd,#mo_bhFzRd", 0, 0.75, t + 0.1, rd);
      PF.O("#mo_bhFZr", 0, 0.22, t + 0.1, rd);
      return null;
    }
    if (mode === "red") {                   // plne cerveny
      PF.O("#mo_bhFhRd,#mo_bhFzRd", 0.75, 1, t, 0.2);
      PF.O("#mo_bhFZr", 0.22, 0.38, t, 0.2);
      friendFace(t, "w");
      return null;
    }
    if (mode === "fade") {                  // vybledne (zostane pri okraji)
      var fd = o.dur || 0.45, fs = o.after || 0.22;
      PF.O("#mo_bhFh,#mo_bhFz", 1, 0.05, t + fs, fd);
      PF.O("#mo_bhFZr", 0.38, 0.55, t + fs, fd);
      return null;
    }
    return null;
  };

  // ================= HOLES (mala vs obrovska diera)
  var LX = 270, RX = 810, CY = 860, SR = 46, GR = 200, DZs = 205, DZg = 110;
  function cmpBuild() {
    if (st.bc) return st.bc;
    defs();
    var s = PF.panel("mo_bhCmp", 4, true), m = "";
    m += '<g id="mo_bhCmpIn"><rect x="-20" y="-20" width="1120" height="1960" fill="url(#mo_bhSky)"/><g transform="translate(540 900) scale(1.12) translate(-540 -900)">';
    m += stars(5521, 110, function (x, y) { return Math.hypot(x - RX, y - CY) < GR + 10 || Math.hypot(x - LX, y - CY) < SR + 8; })[0];
    m += '<path d="M540 470 V1400" stroke="#ffffff" stroke-width="4" stroke-dasharray="14 18" opacity="0.35"/>';
    m += hole("mo_bhCs", LX, CY, SR) + hole("mo_bhCg", RX, CY, GR, 1.38);
    m += '<circle id="mo_bhCzs" cx="' + LX + '" cy="' + CY + '" r="' + DZs + '" fill="' + RED + '" fill-opacity="0.12" stroke="' + RED + '" stroke-width="8" stroke-dasharray="22 16"/>';
    m += '<circle id="mo_bhCzg" cx="' + RX + '" cy="' + CY + '" r="' + DZg + '" fill="' + RED + '" fill-opacity="0.18" stroke="#ff6a5a" stroke-width="8" stroke-dasharray="22 16"/>';
    m += '<text x="' + LX + '" y="1150" style="font-family:Pop;font-weight:600;font-size:70px;text-anchor:middle;fill:' + PAPER + '">SMALL</text>';
    m += '<text x="' + RX + '" y="1150" style="font-family:Pop;font-weight:600;font-size:70px;text-anchor:middle;fill:' + PAPER + '">GIANT</text>';
    m += '<text x="' + RX + '" y="1212" style="font-family:Hand;font-weight:700;font-size:32px;letter-spacing:2px;text-anchor:middle;fill:#ffd98f">SAGITTARIUS A*</text>';
    // sipka vzdialenosti + stitok
    m += '<g id="mo_bhCk1" opacity="0"><path id="mo_bhCk1p" d="M' + (LX - DZs + 10) + ' ' + CY + ' H' + (LX - SR - 14) + '" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M' + (LX - DZs + 28) + ' ' + (CY - 16) + ' L' + (LX - DZs + 10) + ' ' + CY + ' L' + (LX - DZs + 28) + ' ' + (CY + 16) + ' M' + (LX - SR - 32) + ' ' + (CY - 16) + ' L' + (LX - SR - 14) + ' ' + CY + ' L' + (LX - SR - 32) + ' ' + (CY + 16) + '" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M' + (LX - 120) + ' ' + (CY + 14) + ' L' + (LX - 120) + ' 1250" stroke="#ffffff" stroke-width="4" stroke-dasharray="8 8"/></g>';
    m += '<g id="mo_bhCt" opacity="0"><g id="mo_bhCtIn"><rect x="40" y="1250" width="440" height="140" rx="16" fill="' + PAPER + '" stroke="' + RED + '" stroke-width="7"/>' +
      '<text x="260" y="1312" style="font-family:Pop;font-weight:600;font-size:52px;text-anchor:middle;fill:' + RED + '">HUNDREDS</text>' +
      '<text x="260" y="1368" style="font-family:Hand;font-weight:700;font-size:38px;letter-spacing:3px;text-anchor:middle;fill:' + INK + '">OF KM OUT</text></g></g>';
    // sipka "neskor"
    m += '<path id="mo_bhCa" pathLength="1000" d="M' + (LX + 120) + ' ' + (CY - 180) + ' C 470 470, 690 470, ' + (RX - 40) + ' ' + (CY - DZg - 18) + '" fill="none" stroke="#ffd34d" stroke-width="10" stroke-linecap="round" stroke-dasharray="1000 1000" stroke-dashoffset="1000"/>' +
      '<g id="mo_bhCah" opacity="0"><path d="M' + (RX - 74) + ' ' + (CY - DZg - 40) + ' L' + (RX - 40) + ' ' + (CY - DZg - 18) + ' L' + (RX - 78) + ' ' + (CY - DZg - 4) + '" fill="none" stroke="#ffd34d" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>';
    m += '<g id="mo_bhCHa"></g><g id="mo_bhCHb"></g>';
    m += '<g id="mo_bhCbang" opacity="0" stroke="#ffd34d" stroke-width="7" stroke-linecap="round">';
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; m += '<path d="M' + (LX + Math.cos(a) * 60).toFixed(0) + ' ' + (CY - DZs + Math.sin(a) * 60).toFixed(0) + ' L' + (LX + Math.cos(a) * 100).toFixed(0) + ' ' + (CY - DZs + Math.sin(a) * 100).toFixed(0) + '"/>'; }
    m += '</g></g></g>';
    s.insertAdjacentHTML("beforeend", m);
    document.getElementById("mo_bhCHa").insertAdjacentHTML("beforeend", astro("mo_bhCa1"));
    document.getElementById("mo_bhCHb").insertAdjacentHTML("beforeend", astro("mo_bhCb1"));
    PF.P("mo_bhCa1", 0, 0, { tx: LX, ty: 470, s: 0.9 });
    PF.P("mo_bhCb1", 0, 0, { tx: RX, ty: 470, s: 0.9 });
    ["mo_bhCa1", "mo_bhCb1"].forEach(function (q) { PF.P(q + "Ar", 36, -10); PF.P(q + "Al", -36, -10); });
    spinHole("mo_bhCs", SR); spinHole("mo_bhCg", GR);
    st.bc = { on: false };
    return st.bc;
  }
  M.holes = function (t, mode, t1, o) {
    o = o || {}; var S = cmpBuild();
    if (!mode) {                            // otvorenie (kruhovy prestrih), mali hrdina pada k vonkajsiemu kruhu
      PF.S("#mo_bhCmp", { opacity: 1, clipPath: "circle(0% at 50% 45%)" }, t - 0.2);
      tl.fromTo("#mo_bhCmp", { clipPath: "circle(0% at 50% 45%)" }, { clipPath: "circle(80% at 50% 45%)", duration: 0.4, ease: "power2.in", immediateRender: false }, t - 0.2);
      PF.S("#mo_bhCmp", { clipPath: "none" }, t + 0.22);
      PF.X("mo_bhCa1", { tx: LX, ty: CY - DZs - 50 }, t + 0.1, o.fall || 1.1, "power1.in");
      PF.XY("mo_bhCa1Ar", { r: -60 }, t + 0.1, 0.18, "sine.inOut", 5); PF.XY("mo_bhCa1Al", { r: 60 }, t + 0.1, 0.18, "sine.inOut", 5);
      PF.XY("mo_bhCb1", { ty: 455 }, t + 0.1, 0.7, "sine.inOut", 3);
      S.on = true;
      R.dirty("cmp", function (tt, d) {
        if (d) {                              // kruhovy prestrih (zatvori sa), ziadne prelinanie
          tl.fromTo("#mo_bhCmp", { clipPath: "circle(80% at 50% 45%)" }, { clipPath: "circle(0% at 50% 45%)", duration: 0.3, ease: "power2.in", immediateRender: false }, tt);
          PF.S("#mo_bhCmp", { opacity: 0, clipPath: "none" }, tt + 0.31);
        } else PF.O("#mo_bhCmp", 1, 0, tt, 0.01);
        var te = tt + (d ? 0.33 : 0.02);
        PF.S("#mo_bhCk1,#mo_bhCt,#mo_bhCah,#mo_bhCbang", { opacity: 0 }, te);
        tl.set("#mo_bhCa", { attr: { "stroke-dashoffset": 1000 } }, te);
        PF.X("mo_bhCa1", { tx: LX, ty: 470, sx: 0.9, sy: 0.9, r: 0 }, te, 0); PF.X("mo_bhCb1", { tx: RX, ty: 470, sx: 0.9, sy: 0.9, r: 0 }, te, 0);
        S.on = false;
      });
      return null;
    }
    if (mode === "rips") {                  // roztrhne ho daleko pred okrajom: rezanec + hviezdicka
      PF.X("mo_bhCa1", { sx: 0.24, sy: 2.1, ty: CY - DZs + 10 }, t, 0.3, "power2.out");
      PF.XY("mo_bhCa1", { r: 10 }, t + 0.3, 0.09, "sine.inOut", 9);
      PF.O("#mo_bhCbang", 0, 1, t, 0.04);
      tl.fromTo("#mo_bhCbang", { scale: 0.4, svgOrigin: LX + " " + (CY - DZs) }, { scale: 1.3, duration: 0.35, ease: "power2.out", immediateRender: false }, t);
      PF.O("#mo_bhCbang", 1, 0, t + 0.35, 0.15);
      tl.fromTo("#mo_bhCzs", { attr: { "fill-opacity": 0.12 } }, { attr: { "fill-opacity": 0.4 }, duration: 0.15, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, t);
      PF.punch(t, 1.03); shake(t, 0.25, 9);
      return null;
    }
    if (mode === "km") {                    // sipka od kruhu k okraju + stitok
      PF.O("#mo_bhCk1", 0, 1, t, 0.1);
      tl.fromTo("#mo_bhCk1p", { scaleX: 0, svgOrigin: (LX - SR - 14) + " " + CY }, { scaleX: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t);
      PF.O("#mo_bhCt", 0, 1, t + 0.15, 0.06);
      tl.fromTo("#mo_bhCtIn", { scale: 0.4, rotation: -6, svgOrigin: "260 1320" }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.15);
      return null;
    }
    if (mode === "big") {                   // druhy hrdina prejde okrajom obrovskej diery v pohode
      var d = o.dur || 1.3;
      PF.X("mo_bhCb1", { ty: CY - DZg - 50 }, t, d, "power1.in");
      PF.XY("mo_bhCb1Ar", { r: -60 }, t, 0.2, "sine.inOut", 5);
      tl.fromTo("#mo_bhCgRing", { attr: { "stroke-width": 10 } }, { attr: { "stroke-width": 26 }, duration: 0.15, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t + d * 0.55);
      return null;
    }
    if (mode === "later") {                 // sipka od vonkajsieho kruhu k vnutornemu
      tl.fromTo("#mo_bhCa", { attr: { "stroke-dashoffset": 1000 } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.4, ease: "power1.inOut", immediateRender: false }, t);
      PF.O("#mo_bhCah", 0, 1, t + 0.38, 0.05);
      tl.fromTo("#mo_bhCzg", { attr: { "fill-opacity": 0.18 } }, { attr: { "fill-opacity": 0.5 }, duration: 0.15, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, t + 0.35);
      return null;
    }
    if (mode === "stretch") {               // az vnutri sa natiahne
      PF.X("mo_bhCb1", { sx: 0.26, sy: 1.9, ty: CY - DZg - 10 }, t, 0.3, "power2.out");
      PF.XY("mo_bhCb1", { r: -9 }, t + 0.3, 0.09, "sine.inOut", 7);
      shake(t, 0.2, 7);
      return null;
    }
    return null;
  };
})();
