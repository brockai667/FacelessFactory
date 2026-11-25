// pack_freefall.js - momenty pre video 042 Falling Without A Parachute
// ffsky    "" = obloha od snimku 0: mraky letia hore (slucka), vietor, hrdina lezi na bruchu (zakladna poza, bez dirty)
//          "plane" = lietadlo hore odleti a zmensi sa; "nochute" = preskrtnuty padak; "fast" = silny vietor (dirty "wind")
// ffpose   "tumble" = pretocenie vo vzduchu; "shock" = mava rukami a nohami; "arch" = prehne sa na bruchu; "worry" = ustarany
//          "feet" = otoci sa nohami dole (dirty "ffpose")
// ffspeed  "climb" = velky tachometer, rucicka stupa, "?"; "guess" = TIP + blikajuci "?"; "freeze" = rucicka zamrzne na 120;
//          "small"/"big" = zmensi do rohu / spat; cislo = ukaze rychlost (dirty "speed")
// ffforce  "show" = sipka GRAVITY zhora + mala sipka AIR zdola; "match" = AIR narastie na rovnaku dlzku (dirty "force")
// ffcase   "zero" = klipboard TESTED METHODS 0; "folders" = tri zlozky pripadov; "stamp" = peciatky NO GUARANTEE (dirty "case")
// ffstep   1/2/3 = karta kroku v rade hore; "check" = 2 a 3 dostanu fajku, 1 zosedne (dirty "steps")
// ffground "concrete" = betonova zem pride zdola; "snow"; "trees"; "slope" = zem sa naklopi; "stop" = karta STOP TIME (dirty "ground", "stop")
// fftail   "in" = hrdina zmizne, pada chvost lietadla s postavou vnutri; "inside" = kruh SHE WAS INSIDE; "land" = dopad na snehovy svah a sklz (dirty "tail")
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake, uid = H.uid;
  var INK = "#2b2320", RED = "#d9483b", BLUE = "#2f7fd6", NS = "http://www.w3.org/2000/svg";
  var BASE = { tx: 0, ty: -40, r: 80, s: 0.8 }, LEGS = [24, -24];
  function Hr() { return C().hero; }
  function left(t, t1) { return (t1 || 1e9) - t - 0.12; }
  function flash(t, a) { UI(); tl.fromTo("#mo_flash", { opacity: a || 0.5 }, { opacity: 0, duration: 0.25, ease: "power1.out", immediateRender: false }, t); }
  function loop(sel, from, to, per, total) {   // nekonecny pohyb, ktory sa zavrie do slucky
    var n = Math.max(1, Math.round(total / per));
    tl.fromTo(sel, from, Object.assign({ duration: total / n, ease: "none", repeat: n - 1, immediateRender: false }, to), 0);
  }
  function cloud(x, y, q, op) {
    return '<g opacity="' + op + '"><ellipse cx="' + x + '" cy="' + y + '" rx="' + (170 * q).toFixed(0) + '" ry="' + (52 * q).toFixed(0) + '" fill="#ffffff"/>' +
      '<ellipse cx="' + (x - 70 * q).toFixed(0) + '" cy="' + (y - 30 * q).toFixed(0) + '" rx="' + (80 * q).toFixed(0) + '" ry="' + (48 * q).toFixed(0) + '" fill="#ffffff"/>' +
      '<ellipse cx="' + (x + 50 * q).toFixed(0) + '" cy="' + (y - 44 * q).toFixed(0) + '" rx="' + (100 * q).toFixed(0) + '" ry="' + (60 * q).toFixed(0) + '" fill="#ffffff"/></g>';
  }

  // ================= OBLOHA + ZAKLADNA POZA (od snimku 0)
  function buildSky() {
    if (st.ff) return;
    var h = Hr(), p = h.p, f = document.getElementById(p + "float"), i, k, rr = PF.rnd(4207);
    var w = document.createElementNS(NS, "g"); w.setAttribute("id", "mo_ffWob"); f.parentNode.insertBefore(w, f); w.appendChild(f);
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_ffSkyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6fc0"/><stop offset="0.55" stop-color="#78b4e8"/><stop offset="1" stop-color="#cfe7f7"/></linearGradient>');
    var far = "", near = "", TH = 2400;
    for (k = -1; k <= 2; k++) {
      [[160, 300, 0.7], [820, 620, 0.6], [420, 1020, 0.8], [940, 1350, 0.55], [120, 1700, 0.75], [640, 2050, 0.6]].forEach(function (c) { far += cloud(c[0], c[1] + k * TH, c[2], 0.55); });
      [[120, 500, 1.5], [960, 1150, 1.7], [300, 1800, 1.4], [880, 2300, 1.3]].forEach(function (c) { near += cloud(c[0], c[1] + k * TH, c[2], 0.95); });
    }
    var b = '<rect x="-600" y="-600" width="2280" height="3200" fill="url(#mo_ffSkyG)"/>' +
      '<g id="mo_ffClF">' + far + '</g><g id="mo_ffClN">' + near + '</g>' +
      '<g id="mo_ffPl" opacity="0"><g id="mo_ffPlI"><path d="M380 470 Q540 430 700 470 Q540 500 380 470 Z" fill="#e9edf1" stroke="' + INK + '" stroke-width="7"/>' +
      '<path d="M500 462 L420 380 L470 380 L580 462 Z M520 478 L450 560 L500 560 L590 478 Z" fill="#cfd6dd" stroke="' + INK + '" stroke-width="6"/>' +
      '<path d="M660 466 L700 410 L715 410 L700 470 Z" fill="' + RED + '" stroke="' + INK + '" stroke-width="5"/></g></g>';
    w.insertAdjacentHTML("beforebegin", '<g id="mo_ffBk">' + b + '</g><g id="mo_ffGdS"></g>');
    // vietor pred hrdinom (slucka) + silny vietor
    var s1 = "", s2 = "";
    for (k = -1; k <= 1; k++) for (i = 0; i < 9; i++) {
      var x = 60 + i * 120 + Math.round(rr() * 50), y = Math.round(rr() * 2000) + k * 2000, L = 160 + Math.round(rr() * 220);
      s1 += '<path d="M' + x + ' ' + y + ' v' + L + '" stroke="#ffffff" stroke-width="' + (4 + (i % 3) * 2) + '" stroke-linecap="round" opacity="0.6"/>';
      s2 += '<path d="M' + (x + 50) + ' ' + (y + 600) + ' v' + (L + 160) + '" stroke="#ffffff" stroke-width="' + (6 + (i % 2) * 3) + '" stroke-linecap="round" opacity="0.8"/>';
    }
    w.insertAdjacentHTML("afterend", '<g id="mo_ffWd" opacity="0.4"><g id="mo_ffWdI">' + s1 + '</g></g><g id="mo_ffWs" opacity="0"><g id="mo_ffWsI">' + s2 + '</g></g><g id="mo_ffFx"></g><g id="mo_ffTlS"></g>');
    // zakladna poza: na bruchu, ruky a nohy roztiahnute
    PF.X(p + "float", BASE, 0, 0); PF.X(p + "legL", { r: LEGS[0] }, 0, 0); PF.X(p + "legR", { r: LEGS[1] }, 0, 0);
    h.shadow(false, 0);
    if (PF.VO.total > 0) {
      var T = PF.VO.total;
      loop("#mo_ffClF", { y: 0 }, { y: -TH }, 7, T);
      loop("#mo_ffClN", { y: 0 }, { y: -TH }, 2.6, T);
      loop("#mo_ffWdI", { y: 0 }, { y: -2000 }, 1.1, T);
      loop("#mo_ffWsI", { y: 0 }, { y: -2000 }, 0.8, T);
      var n = Math.max(1, Math.round(T / 1.7));   // jemne hojdanie (yoyo, neparne opakovania -> konci v starte)
      tl.fromTo("#mo_ffWob", { y: -12 }, { y: 12, duration: T / n / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * n - 1, immediateRender: false }, 0);
    }
    st.ff = { ang: -90, spOn: false, small: false, gd: false, tl: false };
  }

  M.ffsky = function (t, mode, t1, o) {
    o = o || {}; buildSky();
    if (mode === "plane") {                  // lietadlo nad tebou odleti
      PF.S("#mo_ffPl", { opacity: 1 }, t);
      tl.fromTo("#mo_ffPlI", { x: 0, y: 0, scale: 1, svgOrigin: "540 470" }, { x: 260, y: -330, scale: 0.15, svgOrigin: "540 470", duration: 1.3, ease: "power2.in", immediateRender: false }, t);
      PF.O("#mo_ffPl", 1, 0, t + 1.15, 0.15);
      return null;
    }
    if (mode === "nochute") {                // preskrtnuty padak
      var u = UI(), id = uid("mo_ffNc");
      u.insertAdjacentHTML("beforeend", '<div class="mo" id="' + id + '" style="top:' + (o.y || 420) + 'px;justify-content:flex-start;padding-left:70px;box-sizing:border-box">' +
        '<div class="mo-paper" id="' + id + 'In" style="padding:14px 18px 10px;line-height:1"><svg viewBox="0 0 240 240" style="position:static;display:block;width:240px;height:240px">' +
        '<path d="M30 110 Q120 0 210 110 Q180 92 150 110 Q120 92 90 110 Q60 92 30 110 Z" fill="#f2a33a" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round"/>' +
        '<path d="M34 112 L120 196 M90 110 L120 196 M150 110 L120 196 M206 112 L120 196" stroke="' + INK + '" stroke-width="5"/><circle cx="120" cy="204" r="14" fill="' + INK + '"/>' +
        '<circle cx="120" cy="120" r="104" fill="none" stroke="' + RED + '" stroke-width="18"/><path d="M48 48 L192 192" stroke="' + RED + '" stroke-width="18" stroke-linecap="round"/></svg></div></div>');
      PF.O("#" + id, 0, 1, t, 0.06);
      tl.fromTo("#" + id + "In", { scale: 0.3, rotation: -14 }, { scale: 1, rotation: -4, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t);
      PF.O("#" + id, 1, 0, Math.max(t + 0.6, Math.min(t + (o.hold || 1.4), (t1 || 1e9) - 0.2)), 0.15);
      return null;
    }
    if (mode === "fast") {                   // silny vietor
      PF.O("#mo_ffWs", 0, 1, t, 0.25);
      shake(t, 0.4, 8); PF.punch(t, 1.03);
      R.dirty("wind", function (tt, d) { PF.O("#mo_ffWs", 1, 0, tt, d ? 0.25 : 0.01); });
      return null;
    }
    return null;                             // bez arg: obloha od 1. snimku
  };

  // ================= POZY HRDINU
  function poseReg() {
    var h = Hr(), p = h.p;
    R.dirty("ffpose", function (tt, d) {
      var q = d ? 0.45 : 0;
      PF.X(p + "float", BASE, tt, q, "power2.inOut");
      PF.X(p + "legL", { r: LEGS[0] }, tt, q); PF.X(p + "legR", { r: LEGS[1] }, tt, q);
      h.arm("L", C().arms0[0], tt, d ? 0.3 : 0.01); h.arm("R", C().arms0[1], tt, d ? 0.3 : 0.01);
      R.setFace(tt, C().face0);
    });
  }
  M.ffpose = function (t, mode, t1, o) {
    o = o || {}; buildSky();
    var h = Hr(), p = h.p, a0 = C().arms0;
    if (mode === "tumble") {                 // pretocenie vo vzduchu
      PF.XY(p + "float", { r: BASE.r + 16 }, t, 0.22, "sine.inOut", 3);
      h.arm("L", a0[0] + 30, t, 0.15); h.arm("L", a0[0], t + 0.5, 0.25);
      h.arm("R", a0[1] - 30, t + 0.08, 0.15); h.arm("R", a0[1], t + 0.55, 0.25);
      return null;
    }
    if (mode === "shock") {                  // mava rukami a kope nohami
      var i; for (i = 0; i < 3; i++) {
        var ti = t + i * 0.24, s = i % 2 ? -1 : 1;
        h.arm("L", a0[0] + 26 * s, ti, 0.12); h.arm("R", a0[1] + 26 * s, ti, 0.12);
        PF.X(p + "legL", { r: LEGS[0] - 14 * s }, ti, 0.12); PF.X(p + "legR", { r: LEGS[1] - 14 * s }, ti, 0.12);
      }
      h.arm("L", a0[0], t + 0.72, 0.2); h.arm("R", a0[1], t + 0.72, 0.2);
      PF.X(p + "legL", { r: LEGS[0] }, t + 0.72, 0.2); PF.X(p + "legR", { r: LEGS[1] }, t + 0.72, 0.2);
      R.setFace(t, "shocked");
      return null;
    }
    if (mode === "arch") {                   // prehne sa na bruchu, stabilne
      PF.XY(p + "float", { r: BASE.r - 6, ty: BASE.ty + 14 }, t, 0.3, "sine.inOut", 1);
      h.arm("L", a0[0] + 12, t, 0.3); h.arm("R", a0[1] - 12, t, 0.3);
      h.arm("L", a0[0], t + 0.7, 0.3); h.arm("R", a0[1], t + 0.7, 0.3);
      R.setFace(t, "worried");
      return null;
    }
    if (mode === "worry") {                  // pozrie na kartu, pokrci rukami, zmurka, pomaly sa hojda (vrati sa do BASE)
      R.setFace(t, "worried"); h.look(-12, 0, t, 0.25); h.look(0, 0, t + 2.7, 0.3);
      h.armWave("L", a0[0] - 32, t, 0.22, 3); h.armWave("R", a0[1] + 32, t, 0.22, 3);
      h.armWave("L", a0[0] - 24, t + 1.6, 0.22, 3); h.armWave("R", a0[1] + 24, t + 1.6, 0.22, 3);
      h.blink(t + 1.2); h.blink(t + 2.4);
      PF.XY(p + "float", { ty: BASE.ty - 22, r: BASE.r - 6 }, t + 0.15, 0.55, "sine.inOut", 5);
      return null;
    }
    if (mode === "search") {                 // rozhliadne sa (vlavo, vpravo), natiahne ruky
      h.look(12, 0, t, 0.15); h.look(-12, 0, t + 0.3, 0.15); h.look(0, 0, t + 0.62, 0.15);
      h.armWave("L", a0[0] + 22, t, 0.18, 3); h.armWave("R", a0[1] - 22, t + 0.06, 0.18, 3);
      PF.XY(p + "float", { r: BASE.r + 8 }, t, 0.35, "sine.inOut", 1);
      h.blink(t + 0.5);
      return null;
    }
    if (mode === "feet") {                   // otoci sa nohami dole
      poseReg();
      PF.X(p + "float", { tx: 0, ty: -175, r: 0, s: 0.78 }, t, 0.6, "back.out(1.3)");
      PF.X(p + "legL", { r: 4 }, t, 0.4); PF.X(p + "legR", { r: -4 }, t, 0.4);
      h.arm("L", 135, t, 0.4); h.arm("R", -135, t, 0.4);
      R.setFace(t + 0.2, "worried");
      return null;
    }
    return null;
  };

  // ================= TACHOMETER
  var CX = 230, CY = 228, RA = 200;
  function rot(v) { return Math.max(0, Math.min(160, v)) / 160 * 180 - 90; }
  function apt(v, r) { var a = Math.PI - v / 160 * Math.PI; return [CX + r * Math.cos(a), CY - r * Math.sin(a)]; }
  function needle(t, b, d, ease) {
    tl.fromTo("#mo_ffSpN", { rotation: st.ff.ang, svgOrigin: CX + " " + CY }, { rotation: b, svgOrigin: CX + " " + CY, duration: d, ease: ease || "power2.out", immediateRender: false }, t);
    st.ff.ang = b;
  }
  function jitter(t, amp, per, until) {
    var rep = Math.round((until - t) / per); if (rep < 2) return; rep = rep % 2 ? rep : rep - 1;
    tl.fromTo("#mo_ffSpN", { rotation: st.ff.ang, svgOrigin: CX + " " + CY }, { rotation: st.ff.ang + amp, svgOrigin: CX + " " + CY, duration: per, ease: "sine.inOut", yoyo: true, repeat: rep, immediateRender: false }, t);
  }
  function buildSpeed(o) {
    if (st.ff.sp) return; st.ff.sp = true;
    var i, tk = "";
    for (i = 0; i <= 8; i++) { var q0 = apt(i * 20, RA - 6), q1 = apt(i * 20, i % 2 ? RA - 34 : RA - 50); tk += '<path d="M' + q0[0].toFixed(1) + ' ' + q0[1].toFixed(1) + ' L' + q1[0].toFixed(1) + ' ' + q1[1].toFixed(1) + '"/>'; }
    var a0 = apt(0, RA), a1 = apt(160, RA), r0 = apt(100, RA), mk = apt(120, RA + 6), mk2 = apt(120, RA - 56);
    UI().insertAdjacentHTML("beforeend", '<div class="mo" id="mo_ffSp" style="top:' + (o.y || 300) + 'px"><div class="mo-paper" id="mo_ffSpIn" style="padding:14px 30px 10px;width:560px;box-sizing:border-box;line-height:1">' +
      '<div id="mo_ffSpL" style="font-family:Hand;font-weight:700;font-size:38px;line-height:1.2;letter-spacing:.1em;color:' + RED + ';white-space:nowrap">YOUR SPEED</div>' +
      '<svg viewBox="0 0 460 250" style="position:static;display:block;width:460px;height:250px;margin:4px auto 0">' +
      '<path d="M' + a0[0] + ' ' + a0[1] + ' A' + RA + ' ' + RA + ' 0 0 1 ' + a1[0] + ' ' + a1[1] + '" fill="none" stroke="#e7dccb" stroke-width="34"/>' +
      '<path d="M' + r0[0].toFixed(1) + ' ' + r0[1].toFixed(1) + ' A' + RA + ' ' + RA + ' 0 0 1 ' + a1[0] + ' ' + a1[1] + '" fill="none" stroke="#f0a99f" stroke-width="34"/>' +
      '<g stroke="' + INK + '" stroke-width="6" stroke-linecap="round">' + tk + '</g>' +
      '<path id="mo_ffSpMk" d="M' + mk[0].toFixed(1) + ' ' + mk[1].toFixed(1) + ' L' + mk2[0].toFixed(1) + ' ' + mk2[1].toFixed(1) + '" stroke="#f2c230" stroke-width="16" stroke-linecap="round" opacity="0"/>' +
      '<g id="mo_ffSpN"><path d="M' + (CX - 9) + ' ' + CY + ' L' + CX + ' ' + (CY - RA + 24) + ' L' + (CX + 9) + ' ' + CY + ' Z" fill="' + RED + '"/></g><circle cx="' + CX + '" cy="' + CY + '" r="18" fill="' + INK + '"/></svg>' +
      '<div style="display:flex;align-items:baseline;justify-content:center;height:118px;margin-top:2px"><span id="mo_ffSpD" style="font-family:Pop;font-weight:600;font-size:110px;line-height:118px;color:' + INK + ';min-width:200px;text-align:center">?</span>' +
      '<span style="font-family:Pop;font-weight:600;font-size:52px;line-height:1;color:' + INK + ';margin-left:14px">MPH</span></div></div></div>');
    tl.set("#mo_ffSpN", { rotation: -90, svgOrigin: CX + " " + CY }, 0);
  }
  function speedOn(t) {
    if (st.ff.spOn) return; st.ff.spOn = true;
    PF.O("#mo_ffSp", 0, 1, t, 0.06);
    tl.fromTo("#mo_ffSpIn", { scale: 0.4, rotation: -6 }, { scale: 1, rotation: -1.5, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    R.dirty("speed", function (tt, d) {
      PF.O("#mo_ffSp", 1, 0, tt, d ? 0.15 : 0.01); var te = tt + (d ? 0.2 : 0.02);
      tl.set("#mo_ffSpD", { innerHTML: "?", opacity: 1 }, te); tl.set("#mo_ffSpL", { innerHTML: "YOUR SPEED" }, te);
      tl.set("#mo_ffSpN", { rotation: -90, svgOrigin: CX + " " + CY }, te); PF.S("#mo_ffSpMk", { opacity: 0 }, te);
      if (st.ff.small) { tl.set("#mo_ffSpIn", { x: 0, y: 0, scale: 1 }, te); st.ff.small = false; }
      st.ff.ang = -90; st.ff.spOn = false;
    });
  }
  M.ffspeed = function (t, arg, t1, o) {
    o = o || {}; buildSky(); buildSpeed(o); speedOn(t);
    var lf = left(t, t1);
    if (arg === "climb") {                   // rucicka stupa, cislo nevidno
      needle(t, rot(o.to || 100), Math.max(0.4, Math.min(1.2, lf - 0.3)), "power2.out");
      jitter(t + Math.min(1.2, lf - 0.3), 4, 0.08, t + lf);
      return null;
    }
    if (arg === "guess") {                   // tip
      tl.set("#mo_ffSpL", { innerHTML: o.label || "GUESS YOUR TOP SPEED" }, t);
      tl.fromTo("#mo_ffSpD", { opacity: 1 }, { opacity: 0.2, duration: 0.15, ease: "none", yoyo: true, repeat: 7, immediateRender: false }, t + 0.05);
      tl.fromTo("#mo_ffSpIn", { scale: 1.1 }, { scale: 1, duration: 0.3, ease: "back.out(2.5)", immediateRender: false }, t);
      var a = st.ff.ang, rep = Math.max(1, Math.round(Math.min(1.6, lf) / 0.2)); rep = rep % 2 ? rep : rep - 1;
      tl.fromTo("#mo_ffSpN", { rotation: a, svgOrigin: CX + " " + CY }, { rotation: rot(135), svgOrigin: CX + " " + CY, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: rep, immediateRender: false }, t);
      PF.punch(t, 1.02);
      return null;
    }
    if (arg === "freeze") {                  // rucicka sa zastavi na hornej rychlosti
      needle(t, rot(120), 0.35, "back.out(2)");
      tl.fromTo("#mo_ffSpIn", { rotation: -1.5 }, { rotation: -4, duration: 0.08, ease: "none", yoyo: true, repeat: 3, immediateRender: false }, t + 0.35);
      shake(t + 0.35, 0.2, 6);
      return null;
    }
    if (arg === "small" || arg === "big") {
      var sm = arg === "small";
      if (sm === st.ff.small) return null;
      tl.fromTo("#mo_ffSpIn", sm ? { x: 0, y: 0, scale: 1 } : { x: 250, y: 40, scale: 0.52 }, sm ? { x: 250, y: 40, scale: 0.52, duration: 0.35, ease: "power2.inOut", immediateRender: false } : { x: 0, y: 0, scale: 1, duration: 0.35, ease: "power2.inOut", immediateRender: false }, t);
      st.ff.small = sm;
      return null;
    }
    var v = +arg; if (!(v > 0)) return null;
    if (Math.abs(st.ff.ang - rot(v)) > 0.5) needle(t, rot(v), 0.3, "back.out(2)");
    tl.set("#mo_ffSpD", { innerHTML: String(v), opacity: 1, color: RED }, t);
    tl.set("#mo_ffSpL", { innerHTML: o.label || "TOP SPEED" }, t);
    tl.fromTo("#mo_ffSpD", { scale: 1.6 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t);
    PF.S("#mo_ffSpMk", { opacity: 1 }, t);
    tl.fromTo("#mo_ffSpMk", { attr: { "stroke-width": 30 } }, { attr: { "stroke-width": 16 }, duration: 0.3, ease: "power2.out", immediateRender: false }, t);
    PF.punch(t, 1.04); shake(t, 0.22, 8);
    return null;
  };

  // ================= SILY (gravitacia vs vzduch)
  function buildForce() {
    if (st.ff.fo) return; st.ff.fo = true;
    var X0 = 470, lab = 'font-family:Pop;font-weight:600;font-size:56px;text-anchor:end;stroke:' + INK + ';stroke-width:10px;paint-order:stroke;fill:#ffffff';
    document.getElementById("mo_ffFx").insertAdjacentHTML("beforeend", '<g id="mo_ffFo" opacity="0">' +
      '<g id="mo_ffFoG"><path d="M' + (X0 - 26) + ' 560 H' + (X0 + 26) + ' V820 H' + (X0 + 62) + ' L' + X0 + ' 905 L' + (X0 - 62) + ' 820 H' + (X0 - 26) + ' Z" fill="' + RED + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round"/></g>' +
      '<text x="' + X0 + '" y="530" style="' + lab + ';text-anchor:middle">GRAVITY</text>' +
      '<g id="mo_ffFoA"><path d="M' + (X0 - 26) + ' 1460 H' + (X0 + 26) + ' V1300 H' + (X0 + 62) + ' L' + X0 + ' 1215 L' + (X0 - 62) + ' 1300 H' + (X0 - 26) + ' Z" fill="' + BLUE + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round"/></g>' +
      '<text x="' + (X0 - 80) + '" y="1400" style="' + lab + '">AIR</text></g>');
  }
  M.ffforce = function (t, mode, t1, o) {
    o = o || {}; buildSky(); buildForce();
    if (mode === "match") {                  // vzduch narastie na rovnaku silu
      tl.fromTo("#mo_ffFoA", { scaleY: 0.4, svgOrigin: "470 1460" }, { scaleY: 1, svgOrigin: "470 1460", duration: 0.5, ease: "back.out(1.6)", immediateRender: false }, t);
      tl.fromTo("#mo_ffFoG,#mo_ffFoA", { opacity: 1 }, { opacity: 0.55, duration: 0.12, ease: "none", yoyo: true, repeat: 3, immediateRender: false }, t + 0.5);
      PF.punch(t + 0.5, 1.03);
      return null;
    }
    // show
    PF.O("#mo_ffFo", 0, 1, t, 0.08);
    tl.fromTo("#mo_ffFoG", { scaleY: 0.2, svgOrigin: "470 560" }, { scaleY: 1, svgOrigin: "470 560", duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    tl.fromTo("#mo_ffFoA", { scaleY: 0, svgOrigin: "470 1460" }, { scaleY: 0.4, svgOrigin: "470 1460", duration: 0.35, ease: "back.out(2)", immediateRender: false }, t + 0.15);
    R.dirty("force", function (tt, d) {
      PF.O("#mo_ffFo", 1, 0, tt, d ? 0.15 : 0.01);
      tl.set("#mo_ffFoA", { scaleY: 0.4, svgOrigin: "470 1460" }, tt + 0.2);
    });
    return null;
  };

  // ================= PRIPADY (klipboard, zlozky)
  M.ffcase = function (t, mode, t1, o) {
    o = o || {}; buildSky();
    var u = UI(), i;
    if (!st.ff.cs) {
      st.ff.cs = true;
      var fold = "";
      for (i = 0; i < 3; i++) {
        fold += '<div id="mo_ffCf' + i + '" style="position:relative;width:300px;height:330px;margin:0 8px;opacity:0">' +
          '<div id="mo_ffCf' + i + 'In" style="position:absolute;left:0;top:0;width:300px;height:330px">' +
          '<div style="position:absolute;left:18px;top:0;width:150px;height:58px;background:#d9b25e;border-radius:14px 14px 0 0;font-family:Hand;font-weight:700;font-size:34px;line-height:58px;color:' + INK + ';text-align:center">CASE ' + (i + 1) + '</div>' +
          '<div style="position:absolute;left:0;top:48px;width:300px;height:282px;background:#e8c87a;border-radius:10px;box-shadow:8px 8px 0 rgba(43,35,32,.35)"></div>' +
          '<svg viewBox="0 0 300 282" style="position:absolute;left:0;top:48px;width:300px;height:282px"><g stroke="#b8954a" stroke-width="7" stroke-linecap="round"><path d="M40 60 H260 M40 236 H200"/></g></svg>' +
          '<div id="mo_ffCs' + i + '" style="position:absolute;left:0;top:118px;width:300px;opacity:0;text-align:center">' +
          '<div id="mo_ffCs' + i + 'In" style="display:inline-block;border:6px solid ' + RED + ';border-radius:10px;padding:6px 10px 4px;font-family:Pop;font-weight:600;font-size:38px;line-height:1.15;color:' + RED + ';background:rgba(251,245,234,.6)">NO<br>GUARANTEE</div></div></div></div>';
      }
      u.insertAdjacentHTML("beforeend",
        '<div class="mo" id="mo_ffCb" style="top:' + (o.y || 320) + 'px"><div class="mo-paper" id="mo_ffCbIn" style="position:relative;width:520px;padding:70px 30px 18px;box-sizing:border-box;line-height:1">' +
        '<svg viewBox="0 0 200 70" style="position:absolute;left:160px;top:-26px;width:200px;height:70px"><rect x="20" y="10" width="160" height="56" rx="12" fill="#8a8f96" stroke="' + INK + '" stroke-width="6"/><circle cx="100" cy="30" r="10" fill="' + INK + '"/></svg>' +
        '<div style="font-family:Hand;font-weight:700;font-size:44px;letter-spacing:.1em;color:' + INK + ';white-space:nowrap">TESTED METHODS</div>' +
        '<div id="mo_ffCbZ" style="font-family:Pop;font-weight:600;font-size:230px;line-height:250px;height:250px;color:' + RED + '">0</div>' +
        '<svg id="mo_ffMg" viewBox="0 0 170 170" style="position:absolute;left:0;top:150px;width:170px;height:170px;opacity:0"><circle cx="66" cy="66" r="48" fill="rgba(200,230,255,.35)" stroke="' + INK + '" stroke-width="12"/><path d="M102 102 L150 150" stroke="' + INK + '" stroke-width="22" stroke-linecap="round"/></svg></div></div>' +
        '<div class="mo" id="mo_ffCF" style="top:' + (o.fy || 330) + 'px">' + fold + '</div>');
      R.dirty("case", function (tt, d) {
        PF.O("#mo_ffCb", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_ffCF", 1, 0, tt, d ? 0.15 : 0.01);
      });
    }
    if (mode === "zero") {
      PF.O("#mo_ffCb", 0, 1, t, 0.06);
      tl.fromTo("#mo_ffCbIn", { y: -500, rotation: 8 }, { y: 0, rotation: -2, duration: 0.4, ease: "back.out(1.5)", immediateRender: false }, t);
      tl.fromTo("#mo_ffCbZ", { scale: 2.4 }, { scale: 1, duration: 0.18, ease: "power3.in", immediateRender: false }, t + 0.35);
      PF.punch(t + 0.53, 1.04); shake(t + 0.53, 0.22, 9);
      // potom: karta sa hojda, lupa hlada a nic nenajde, 0 pulzuje (bezi aj cez dalsiu vetu, karta zmizne pri "folders")
      tl.fromTo("#mo_ffCbIn", { rotation: -2 }, { rotation: 2.5, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.45);
      PF.O("#mo_ffMg", 0, 1, t + 0.7, 0.15);
      tl.fromTo("#mo_ffMg", { x: -160, y: 30, rotation: -14 }, { x: 520, y: 30, rotation: 14, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 6, immediateRender: false }, t + 0.7);
      [1.6, 2.8, 4.0].forEach(function (k) {
        tl.fromTo("#mo_ffCbZ", { scale: 1.14 }, { scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + k);
        shake(t + k, 0.15, 4);
      });
      return null;
    }
    if (mode === "folders") {
      PF.O("#mo_ffCb", 1, 0, t, 0.12);
      PF.S("#mo_ffCF", { opacity: 1 }, t);
      for (i = 0; i < 3; i++) {
        PF.O("#mo_ffCf" + i, 0, 1, t + i * 0.14, 0.06);
        tl.fromTo("#mo_ffCf" + i + "In", { y: 380, rotation: 10 - i * 8 }, { y: 0, rotation: -3 + i * 3, duration: 0.4, ease: "back.out(1.6)", immediateRender: false }, t + i * 0.14);
      }
      return null;
    }
    if (mode === "stamp") {
      for (i = 0; i < 3; i++) {
        var ti = t + i * 0.16;
        PF.S("#mo_ffCs" + i, { opacity: 1 }, ti);
        tl.fromTo("#mo_ffCs" + i + "In", { scale: 2.6, rotation: -20 }, { scale: 1, rotation: -11, duration: 0.14, ease: "power3.in", immediateRender: false }, ti);
        shake(ti + 0.14, 0.18, 7);
      }
      PF.punch(t + 0.46, 1.035);
      return null;
    }
    return null;
  };

  // ================= KROKY (rad troch kariet hore)
  var STEPS = ["FEET FIRST", "SOFT", "SLOPE"];
  M.ffstep = function (t, arg, t1, o) {
    o = o || {}; buildSky();
    var u = UI(), i;
    if (!st.ff.stp) {
      st.ff.stp = { on: false };
      var c = "";
      for (i = 0; i < 3; i++) {
        c += '<div id="mo_ffSt' + i + '" style="position:relative;opacity:0;margin:0 7px"><div class="mo-paper" id="mo_ffSt' + i + 'In" style="position:relative;display:flex;align-items:center;width:320px;height:120px;padding:0 16px;box-sizing:border-box;line-height:1">' +
          '<span style="flex:none;width:78px;height:78px;border-radius:50%;background:' + RED + ';color:#fbf5ea;font-family:Pop;font-weight:600;font-size:54px;line-height:78px;text-align:center">' + (i + 1) + '</span>' +
          '<span style="flex:1;font-family:Pop;font-weight:600;font-size:' + (i === 0 ? 40 : 50) + 'px;line-height:1;white-space:nowrap;color:' + INK + ';text-align:center">' + ((o.texts && o.texts[i]) || STEPS[i]) + '</span>' +
          '<svg id="mo_ffSk' + i + '" viewBox="0 0 90 90" style="position:absolute;left:250px;right:auto;top:-28px;width:90px;height:90px;opacity:0"><circle cx="45" cy="45" r="40" fill="#3fa35b" stroke="#fbf5ea" stroke-width="6"/><path d="M24 46 L39 61 L66 30" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>';
      }
      u.insertAdjacentHTML("beforeend", '<div class="mo" id="mo_ffSR" style="top:' + (o.y || 110) + 'px">' + c + '</div>');
    }
    if (!st.ff.stp.on) {
      st.ff.stp.on = true; PF.S("#mo_ffSR", { opacity: 1 }, t);
      R.dirty("steps", function (tt, d) {
        PF.O("#mo_ffSR", 1, 0, tt, d ? 0.2 : 0.01); var te = tt + (d ? 0.25 : 0.02);
        for (var k = 0; k < 3; k++) tl.set("#mo_ffSt" + k, { opacity: 0, filter: "none" }, te);
        PF.S("#mo_ffSk1,#mo_ffSk2", { opacity: 0 }, te);
        st.ff.stp.on = false;
      });
    }
    if (arg === "check") {
      tl.to("#mo_ffSt0", { opacity: 0.5, filter: "grayscale(1)", duration: 0.25, ease: "none" }, t);
      [1, 2].forEach(function (k, j) {
        var tk = t + 0.15 + j * 0.2;
        PF.S("#mo_ffSk" + k, { opacity: 1 }, tk);
        tl.fromTo("#mo_ffSk" + k, { scale: 0.2 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, tk);
        tl.fromTo("#mo_ffSt" + k + "In", { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, tk);
      });
      return null;
    }
    var n = (+arg) - 1; if (!(n >= 0 && n < 3)) return null;
    PF.O("#mo_ffSt" + n, 0, 1, t, 0.06);
    tl.fromTo("#mo_ffSt" + n + "In", { scale: 0.3, rotation: -10 }, { scale: 1, rotation: -1.5, duration: 0.32, ease: "back.out(2.2)", immediateRender: false }, t);
    PF.punch(t + 0.1, 1.02);
    return null;
  };

  // ================= ZEM POD TEBOU
  function buildGround() {
    if (st.ff.gdB) return; st.ff.gdB = true;
    var g = "", i, tr = "";
    g += '<g id="mo_ffGc"><rect x="-1000" y="1330" width="3080" height="1400" fill="#8d9095"/><rect x="-1000" y="1330" width="3080" height="22" fill="#6c6f74"/>' +
      '<g stroke="#77797e" stroke-width="8"><path d="M-1000 1440 H2080 M-1000 1600 H2080 M120 1352 V1440 M420 1352 V1440 M720 1352 V1440 M980 1352 V1440 M260 1440 V1600 M560 1440 V1600 M860 1440 V1600"/></g>' +
      '<path d="M300 1352 l40 50 l-20 40 M700 1352 l-30 60 l30 30" stroke="#5e6065" stroke-width="6" fill="none"/></g>';
    g += '<g id="mo_ffGs" opacity="0"><path d="M-1000 1340 Q-800 1290 -600 1335 Q-380 1280 -160 1332 Q60 1282 280 1330 Q500 1278 720 1330 Q940 1284 1160 1332 Q1380 1286 1600 1334 Q1840 1290 2080 1336 V2730 H-1000 Z" fill="#f7fbff" stroke="#b9d3ea" stroke-width="10"/>' +
      '<g fill="#dceaf6"><ellipse cx="160" cy="1420" rx="120" ry="18"/><ellipse cx="760" cy="1450" rx="150" ry="20"/><ellipse cx="420" cy="1490" rx="110" ry="14"/></g></g>';
    [[90, 1.0], [250, 0.8], [860, 0.95], [1010, 0.85], [-80, 0.9], [1160, 0.9]].forEach(function (q, j) {
      var x = q[0], s = q[1], id = "mo_ffTr" + j;
      tr += '<g id="' + id + '"><rect x="' + (x - 12) + '" y="' + (1335 - 40 * s) + '" width="24" height="' + (44 * s) + '" fill="#6b4a2f"/>' +
        '<path d="M' + x + ' ' + (1335 - 300 * s) + ' L' + (x + 90 * s) + ' ' + (1335 - 40 * s) + ' L' + (x - 90 * s) + ' ' + (1335 - 40 * s) + ' Z" fill="#2f7a4a" stroke="#1f5233" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="M' + x + ' ' + (1335 - 300 * s) + ' L' + (x + 60 * s) + ' ' + (1335 - 140 * s) + ' L' + (x - 60 * s) + ' ' + (1335 - 140 * s) + ' Z" fill="#ffffff" opacity="0.85"/></g>';
    });
    g += '<g id="mo_ffGt">' + tr + '</g>';
    document.getElementById("mo_ffGdS").insertAdjacentHTML("beforeend", '<g id="mo_ffGd" opacity="0"><g id="mo_ffGdY"><g id="mo_ffGdR">' + g + '</g></g></g>');
    PF.P("mo_ffGdR", 540, 1380);
    [90, 250, 860, 1010, -80, 1160].forEach(function (x, k) { tl.set("#mo_ffTr" + k, { scaleY: 0, svgOrigin: x + " 1335" }, 0); });
  }
  M.ffground = function (t, mode, t1, o) {
    o = o || {}; buildSky(); buildGround();
    var lf = left(t, t1), i;
    if (!st.ff.gd) {
      st.ff.gd = true;
      PF.O("#mo_ffGd", 0, 1, t, 0.1);
      tl.fromTo("#mo_ffGdY", { y: 700 }, { y: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, t);
      R.dirty("ground", function (tt, d) {
        PF.O("#mo_ffGd", 1, 0, tt, d ? 0.2 : 0.01); var te = tt + (d ? 0.25 : 0.02);
        PF.S("#mo_ffGs", { opacity: 0 }, te); PF.X("mo_ffGdR", { r: 0 }, te, 0);
        [90, 250, 860, 1010, -80, 1160].forEach(function (x, k) { tl.set("#mo_ffTr" + k, { scaleY: 0, svgOrigin: x + " 1335" }, te); });
        st.ff.gd = false;
      });
    }
    if (mode === "snow") {
      PF.O("#mo_ffGs", 0, 1, t, 0.25);
      tl.fromTo("#mo_ffGs", { y: -40 }, { y: 0, duration: 0.35, ease: "bounce.out", immediateRender: false }, t);
      return null;
    }
    if (mode === "trees") {
      for (i = 0; i < 6; i++) {
        var x = [90, 250, 860, 1010, -80, 1160][i];
        tl.fromTo("#mo_ffTr" + i, { scaleY: 0, svgOrigin: x + " 1335" }, { scaleY: 1, svgOrigin: x + " 1335", duration: 0.3, ease: "back.out(2.5)", immediateRender: false }, t + i * 0.07);
      }
      return null;
    }
    if (mode === "slope") {
      PF.X("mo_ffGdR", { r: o.r || 15 }, t, Math.max(0.3, Math.min(0.7, lf)), "power2.inOut");
      shake(t + 0.3, 0.25, 6);
      return null;
    }
    if (mode === "stop") {                   // cas zastavenia sa natiahne
      var u = UI();
      if (!st.ff.so) {
        st.ff.so = true;
        u.insertAdjacentHTML("beforeend", '<div class="mo" id="mo_ffSo" style="top:' + (o.y || 320) + 'px"><div class="mo-paper" id="mo_ffSoIn" style="width:640px;padding:16px 30px 20px;box-sizing:border-box;line-height:1">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;height:52px"><span style="font-family:Hand;font-weight:700;font-size:40px;letter-spacing:.1em;color:' + INK + '">STOP TIME</span>' +
          '<span id="mo_ffSoT" style="font-family:Pop;font-weight:600;font-size:40px;color:' + RED + '">SHORT</span></div>' +
          '<div style="position:relative;height:56px;margin-top:10px;background:#e7dccb;border-radius:28px;overflow:hidden"><div id="mo_ffSoB" style="position:absolute;left:0;top:0;height:56px;width:70px;background:#3fa35b;border-radius:28px"></div></div></div></div>');
      }
      PF.O("#mo_ffSo", 0, 1, t, 0.06);
      tl.fromTo("#mo_ffSoIn", { scale: 0.4, rotation: 6 }, { scale: 1, rotation: 1.5, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.set("#mo_ffSoB", { width: 70 }, t); tl.set("#mo_ffSoT", { innerHTML: "SHORT", color: RED }, t);
      var d = Math.max(0.4, Math.min(1.0, lf - 0.4));
      tl.fromTo("#mo_ffSoB", { width: 70 }, { width: 580, duration: d, ease: "power1.inOut", immediateRender: false }, t + 0.3);
      tl.set("#mo_ffSoT", { innerHTML: "LONGER", color: "#3fa35b" }, t + 0.3 + d * 0.6);
      R.dirty("stop", function (tt, dd) { PF.O("#mo_ffSo", 1, 0, tt, dd ? 0.15 : 0.01); });
      return null;
    }
    // concrete: zem sa objavi (vyssie)
    return null;
  };

  // ================= CHVOST LIETADLA (Vesna Vulovic)
  function buildTail() {
    if (st.ff.tlB) return; st.ff.tlB = true;
    var a = "";
    a += '<g id="mo_ffTk" opacity="0"><path d="M-300 1170 L1400 1630 L1400 2700 L-300 2700 Z" fill="#f7fbff" stroke="#b9d3ea" stroke-width="12"/>' +
      '<g fill="#dceaf6"><ellipse cx="200" cy="1330" rx="130" ry="16" transform="rotate(15 200 1330)"/><ellipse cx="760" cy="1520" rx="150" ry="18" transform="rotate(15 760 1520)"/></g>' +
      '<g fill="#2f7a4a"><path d="M120 1060 L180 1270 L60 1270 Z"/><path d="M230 1110 L280 1300 L180 1300 Z"/></g></g>';
    // chvost: trup s ulomenym predkom, smerovka, vyskovka, okno s postavou
    var tail = '<path d="M330 900 L380 940 L340 975 L392 1010 L346 1050 L390 1090 L350 1120 L700 1120 Q800 1110 860 1040 L900 940 Q880 905 820 900 Z" fill="#eef0f2" stroke="' + INK + '" stroke-width="9" stroke-linejoin="round"/>' +
      '<path d="M350 1000 L870 1000" stroke="' + RED + '" stroke-width="18"/>' +
      '<path d="M680 905 L800 640 L880 640 L860 905 Z" fill="#e3e7ea" stroke="' + INK + '" stroke-width="9" stroke-linejoin="round"/><path d="M760 760 L860 760" stroke="' + RED + '" stroke-width="18"/>' +
      '<path d="M720 960 L940 930 L950 960 L740 990 Z" fill="#d3d9de" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round"/>' +
      '<path d="M330 900 L380 940 L340 975 L392 1010 L346 1050 L390 1090 L350 1120" fill="none" stroke="#5a5560" stroke-width="22" stroke-linejoin="round"/>' +
      '<circle cx="490" cy="1010" r="62" fill="#3a3f47" stroke="' + INK + '" stroke-width="8"/>' +
      '<g><circle cx="490" cy="988" r="17" fill="#c68b5e"/><path d="M470 1000 Q458 980 476 972 Q490 962 506 972 Q522 982 510 1000" fill="#3b2a20"/><path d="M466 1056 Q466 1012 490 1010 Q514 1012 514 1056 Z" fill="#4a7fc1"/></g>';
    a += '<g id="mo_ffTp"><g id="mo_ffTpI">' + tail + '</g></g>';
    a += '<g id="mo_ffTq" opacity="0"><circle cx="490" cy="1010" r="92" fill="none" stroke="' + RED + '" stroke-width="10" stroke-dasharray="22 14"/>' +
      '<text x="490" y="1225" style="font-family:Hand;font-weight:700;font-size:58px;letter-spacing:4px;text-anchor:middle;stroke:' + INK + ';stroke-width:10px;paint-order:stroke;fill:#ffffff">SHE WAS INSIDE</text></g>';
    a += '<g id="mo_ffTs" opacity="0" fill="#ffffff"><circle cx="0" cy="0" r="40"/><circle cx="50" cy="-20" r="30"/><circle cx="-46" cy="-14" r="28"/><circle cx="20" cy="-46" r="26"/></g>';
    document.getElementById("mo_ffTlS").insertAdjacentHTML("beforeend", '<g id="mo_ffTl" opacity="0">' + a + '</g>');
    PF.P("mo_ffTp", 615, 1010); PF.P("mo_ffTpI", 615, 1010);
  }
  M.fftail = function (t, mode, t1, o) {
    o = o || {}; buildSky(); buildTail();
    var lf = left(t, t1);
    if (mode === "inside") {
      PF.O("#mo_ffTq", 0, 1, t, 0.08);
      tl.fromTo("#mo_ffTq", { scale: 0.4, svgOrigin: "490 1010" }, { scale: 1, svgOrigin: "490 1010", duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t);
      PF.punch(t, 1.03);
      return null;
    }
    if (mode === "land") {                   // dopad na snehovy svah, sklz, zastavi
      PF.O("#mo_ffTq", 1, 0, t - 0.3, 0.12);
      PF.S("#mo_ffTk", { opacity: 1 }, t - 0.35);
      tl.fromTo("#mo_ffTk", { y: 900 }, { y: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, t - 0.35);
      PF.X("mo_ffTp", { tx: -40, ty: 250, r: 15 }, t - 0.05, 0.12, "power2.in");
      var sl = Math.max(0.5, Math.min(1.3, lf - 0.2));
      PF.X("mo_ffTp", { tx: 110, ty: 290, r: 15 }, t + 0.12, sl, "power2.out");
      PF.S("#mo_ffTs", { opacity: 1 }, t + 0.07);
      tl.fromTo("#mo_ffTs", { x: 330, y: 1240, scale: 0.4 }, { x: 260, y: 1180, scale: 2.2, duration: 0.5, ease: "power2.out", immediateRender: false }, t + 0.07);
      PF.O("#mo_ffTs", 1, 0, t + 0.35, 0.25);
      shake(t + 0.07, 0.4, 16); PF.punch(t + 0.07, 1.05); flash(t + 0.07, 0.45);
      return null;
    }
    // in: oblakovy prestrih (zakryje t-0.22 .. t+0.45), pod nim zmizne hrdina aj zem, potom pada chvost
    if (!st.ff.cw) {
      st.ff.cw = true;
      UI().insertAdjacentHTML("beforeend", '<div id="mo_ffCw" style="position:absolute;left:-60px;top:0;width:1200px;height:2700px;border-radius:600px/320px;background:#fbfdff;box-shadow:0 0 0 30px rgba(255,255,255,.55);z-index:5;opacity:0"></div>');
    }
    PF.S("#mo_ffCw", { opacity: 1 }, t - 0.22);
    tl.fromTo("#mo_ffCw", { y: 1990 }, { y: -390, duration: 0.22, ease: "power2.in", immediateRender: false }, t - 0.22);
    tl.fromTo("#mo_ffCw", { y: -390 }, { y: -2760, duration: 0.25, ease: "power2.out", immediateRender: false }, t + 0.45);
    PF.S("#mo_ffCw", { opacity: 0 }, t + 0.72);
    PF.S("#mo_ffWob", { opacity: 0 }, t + 0.05);
    PF.S("#mo_ffTl", { opacity: 1 }, t + 0.3);
    tl.fromTo("#mo_ffTl", { y: -900 }, { y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, t + 0.3);
    var rep = Math.max(1, Math.round(Math.min(4, lf - 0.3) / 0.5)); rep = rep % 2 ? rep : rep - 1;
    PF.XY("mo_ffTpI", { r: -6 }, t + 0.8, 0.5, "sine.inOut", rep);
    R.dirty("tail", function (tt, d) {
      PF.O("#mo_ffTl", 1, 0, tt, d ? 0.2 : 0.01); PF.O("#mo_ffWob", 0, 1, tt, d ? 0.2 : 0.01);
      var te = tt + (d ? 0.25 : 0.02);
      PF.X("mo_ffTp", { tx: 0, ty: 0, r: 0 }, te, 0); PF.S("#mo_ffTk,#mo_ffTq", { opacity: 0 }, te);
    });
    return null;
  };
})();
