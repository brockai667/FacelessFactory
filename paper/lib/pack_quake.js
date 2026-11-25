// pack_quake.js - momenty pre video 046 Earthquake At Home
// qkroom "" = obyvacka od snimku 0 (stena, strop, dvere vlavo, knihovna v strede za hrdinom, stol vpravo, lampa, polica s vazou); bez dirty
//        "quake" = otrasy izby (o.amp, o.dur): izba sa trasie, kamera, lampa a obraz sa hojdaju, prach zo stropu, hrdina sa kyva
//        "jolt" = silny naraz (izba sa nakloni, punch); "fall" = 3 knihy spadnu z knihovne (qkfall)
//        "cam" = zamok kamery na celok izby (o.clear = kluce); "zoom" = kamera na stol (o.s, o.x, o.y, o.dur)
//        "shelf" = knihovna sa zruti dopredu na miesto, kde hrdina stal, knihy letia, prach (qkshelf)
//        "spot" = cerveny ciarkovany kruh na mieste + stopy k dveram (qkring)
//        "xray" = rontgen steny: rovnake tenke stlpiky v stene aj v zarubni (qkxr); "same" = zarubna = stlpik steny
//        "reset" = blesk, izba a hrdina spat do stavu snimku 0
//        "vase" = vaza spadne z police na dosku stola a rozbije sa (qkvase); "slide" = stol sa posunie, hrdina s nim (qkslide)
//        "still" = otrasy prestanu, lampa dohojda, ulava; "doorx" = cerveny X cez prazdne dvere (qkdx)
// qkhero "brace" = ruky do stran, kolena sa trasu; "walk" = tackavo prejde k dverom; "look" = obzrie sa ku knihovni
//        "drop" = na ruky a kolena; "under" = prelezie pod stol; "cover" = ruky na hlavu a krk; "hold" = chyti nohu stola (qkpose)
// qkface vyraz tvare bez pohybu kamery
// qkcard "inj" = karta MOST INJURIES (vpravo); "move" = riadok MOVING + hrdina zakopne; "fall" = riadok FALLING THINGS + lampa spadne
//        "dch" = karta s 3 ikonami, prva DROP; "c2" = COVER; "c3" = HOLD ON (qkcard)
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st, shake = H.shake, uid = H.uid;
  var INK = "#2b2320", RED = "#d9483b", GREEN = "#3fa35b";
  var CP = { tx: 0, ty: 75, s: 0.75, r: 0 };          // hrdina v strede pred knihovnou (snimok 0 = posledny)
  var DOOR = { tx: -320, ty: 75, s: 0.75, r: 0 };     // v dverach
  var DROP = { tx: 0, ty: 205, s: 0.75, r: 0 };       // na kolenach
  var UNDER = { tx: 330, ty: 118, s: 0.58, r: 0 };     // pod stolom (hlbsie v izbe = mensi)
  var FLOOR = 1180;                                    // stena / podlaha
  function TOT() { return PF.VO.total || 30; }
  function flash(t, a) { tl.fromTo("#mo_flash", { opacity: a || 0.7 }, { opacity: 0, duration: 0.25, ease: "power1.out", immediateRender: false }, t); }
  function cdur(t, t1, d) { return Math.max(0.15, Math.min(d, (t1 || t + d + 1) - t - 0.12)); }

  // ---------- kresby
  function books(x0, x1, y, seed) {                    // rad knih na polici (spodok y)
    var rr = PF.rnd(seed), s = "", x = x0, cols = ["#c9503f", "#3f7fbf", "#e0b040", "#3fa35b", "#8a52c4", "#e2674a", "#2f6f73"];
    while (x < x1 - 14) {
      var w = 18 + Math.round(rr() * 16), h = 70 + Math.round(rr() * 36); if (x + w > x1) break;
      var c = cols[Math.floor(rr() * cols.length)];
      s += '<rect x="' + x + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '" rx="3" fill="' + c + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<path d="M' + (x + 4) + ' ' + (y - h + 14) + ' h' + (w - 8) + '" stroke="#fbf5ea" stroke-width="3" opacity="0.6"/>';
      x += w + 2;
    }
    return s;
  }
  function book(id, x, y, w, h, c, rot) {
    return '<g id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + c + '" stroke="' + INK + '" stroke-width="4"' +
      (rot ? ' transform="rotate(' + rot + ' ' + (x + w / 2) + ' ' + (y + h / 2) + ')"' : '') + '/></g>';
  }
  function build() {
    if (st.qk) return st.qk;
    var Hh = C().hero, p = Hh.p, i, b = "", f = "";
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_qkWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ead9b6"/><stop offset="1" stop-color="#dcc59c"/></linearGradient>' +
      '<linearGradient id="mo_qkFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8744a"/><stop offset="1" stop-color="#7d5233"/></linearGradient>');
    // stena, strop, podlaha
    b += '<rect x="-700" y="-900" width="2480" height="3800" fill="url(#mo_qkWall)"/>';
    for (i = -6; i < 16; i++) b += '<rect x="' + (i * 120) + '" y="360" width="44" height="' + (FLOOR - 360) + '" fill="#e2cda6" opacity="0.7"/>';
    b += '<rect x="-700" y="-900" width="2480" height="1260" fill="#f1e7d3"/><rect x="-700" y="338" width="2480" height="30" fill="#fbf5ea" stroke="#d9c7a6" stroke-width="4"/>';
    b += '<rect x="-700" y="' + FLOOR + '" width="2480" height="1800" fill="url(#mo_qkFloor)"/>';
    [1236, 1306, 1394, 1504, 1640, 1810].forEach(function (y) { b += '<path d="M-700 ' + y + ' H1780" stroke="#6f4729" stroke-width="5" opacity="0.6"/>'; });
    for (i = -8; i <= 8; i++) b += '<path d="M' + (540 + i * 70) + ' ' + FLOOR + ' L' + (540 + i * 260) + ' 2100" stroke="#6f4729" stroke-width="4" opacity="0.35"/>';
    b += '<rect x="-700" y="' + (FLOOR - 22) + '" width="2480" height="26" fill="#fbf5ea" stroke="#d9c7a6" stroke-width="4"/>';
    // dvere vlavo (otvor do chodby)
    b += '<rect x="40" y="560" width="210" height="' + (FLOOR - 560) + '" fill="#43372e"/><rect x="70" y="600" width="150" height="' + (FLOOR - 600) + '" fill="#54463a"/>' +
      '<path d="M40 ' + FLOOR + ' V560 H250 V' + FLOOR + '" fill="none" stroke="#fbf5ea" stroke-width="22" stroke-linejoin="round"/>' +
      '<path d="M40 ' + FLOOR + ' V560 H250 V' + FLOOR + '" fill="none" stroke="#d9c7a6" stroke-width="4"/>';
    // obraz medzi dverami a knihovnou
    b += '<g id="mo_qkPicIn"><path d="M300 640 L327 600 L354 640" fill="none" stroke="#8a7d68" stroke-width="3"/>' +
      '<rect x="282" y="640" width="96" height="120" fill="#fbf5ea" stroke="#8a5a3c" stroke-width="10"/><circle cx="330" cy="684" r="16" fill="#f6c343"/>' +
      '<path d="M292 750 L318 712 L336 734 L352 716 L370 750 Z" fill="#5f9e58"/></g>';
    // knihovna (pivot spodok) - predna strana s knihami, zadna doska (po prevrateni)
    var sh = '<rect x="410" y="520" width="260" height="' + (FLOOR - 520) + '" fill="#8a5a3c" stroke="#5f3c25" stroke-width="8"/>' +
      '<rect x="424" y="534" width="232" height="' + (FLOOR - 548) + '" fill="#6d4630"/>';
    [650, 790, 930, 1060].forEach(function (y) { sh += '<rect x="420" y="' + y + '" width="240" height="14" fill="#9c6a48"/>'; });
    sh += books(428, 652, 650, 3) + books(428, 652, 790, 5) + books(428, 652, 930, 8) + books(428, 652, 1060, 11) + books(428, 652, 1172, 13);
    sh += '<path d="M600 520 Q600 470 640 452 Q620 490 626 520 Z M600 520 Q580 470 548 466 Q575 492 584 520 Z" fill="#5f9e58"/><rect x="574" y="498" width="44" height="24" rx="4" fill="#c8664a"/>';
    var shB = '<rect x="410" y="520" width="260" height="' + (FLOOR - 520) + '" fill="#6d4630" stroke="#4a2e1c" stroke-width="8"/>' +
      [700, 880, 1060].map(function (y) { return '<path d="M418 ' + y + ' H662" stroke="#4a2e1c" stroke-width="5"/>'; }).join("");
    b += '<g id="mo_qkSh"><g id="mo_qkShF">' + sh + '</g><g id="mo_qkShB" opacity="0">' + shB + '</g></g>';
    // knihy, ktore spadnu v hooku (z hornej police)
    b += book("mo_qkBk0", 432, 560, 26, 90, "#3f7fbf") + book("mo_qkBk1", 618, 566, 28, 84, "#e0b040") + book("mo_qkBk2", 590, 570, 24, 80, "#c9503f");
    // rozhadzane knihy + prach po zruteni
    var sc = "", C6 = ["#c9503f", "#3f7fbf", "#e0b040", "#3fa35b", "#8a52c4", "#e2674a"];
    for (i = 0; i < 6; i++) sc += book("mo_qkSc" + i, 520, 1360, 70, 26, C6[i]);
    b += '<g id="mo_qkScG" opacity="0">' + sc + '</g>';
    b += '<g id="mo_qkDu" opacity="0">' + [[-180, 0, 120], [-60, -30, 150], [80, -20, 140], [200, 10, 110], [0, 20, 170]].map(function (q, k) {
      return '<ellipse id="mo_qkDu' + k + '" cx="' + (540 + q[0]) + '" cy="' + (1420 + q[1]) + '" rx="' + q[2] + '" ry="' + Math.round(q[2] * 0.5) + '" fill="#d8ccb8" opacity="0.85"/>'; }).join("") + '</g>';
    // stopy a kruh (miesto, kde stal)
    var fp = ""; for (i = 0; i < 5; i++) fp += '<ellipse cx="' + (470 - i * 62) + '" cy="' + (1440 + (i % 2 ? 22 : -12)) + '" rx="18" ry="9" fill="' + RED + '" opacity="0.8"/>';
    b += '<g id="mo_qkRing" opacity="0"><ellipse id="mo_qkRingE" cx="560" cy="1420" rx="230" ry="70" fill="none" stroke="' + RED + '" stroke-width="12" stroke-dasharray="34 18"/>' +
      '<g id="mo_qkFp">' + fp + '</g></g>';
    // zadne nohy stola (za hrdinom)
    b += '<rect x="728" y="930" width="24" height="300" fill="#6d4630"/><rect x="980" y="930" width="24" height="300" fill="#6d4630"/>';
    // rontgen steny
    var xr = '<rect x="-700" y="-900" width="2480" height="' + (900 + FLOOR) + '" fill="#10304d" opacity="0.9"/>', studs = "";
    for (i = -6; i <= 12; i++) { var sx = i * 110 + 30; if (sx > 40 && sx < 250) continue; studs += '<rect x="' + (sx - 9) + '" y="372" width="18" height="' + (FLOOR - 372) + '" fill="#9fd8ef" opacity="0.85"/>'; }
    studs += '<rect x="-700" y="372" width="2480" height="16" fill="#9fd8ef" opacity="0.85"/><rect x="-700" y="' + (FLOOR - 20) + '" width="2480" height="16" fill="#9fd8ef" opacity="0.85"/>';
    studs += '<rect x="22" y="532" width="246" height="22" fill="#9fd8ef" opacity="0.85"/>';     // preklad nad dverami
    studs += '<g id="mo_qkJb"><rect x="22" y="554" width="18" height="' + (FLOOR - 574) + '" fill="#9fd8ef"/><rect x="250" y="554" width="18" height="' + (FLOOR - 574) + '" fill="#9fd8ef"/></g>';
    xr += '<g id="mo_qkXrS">' + studs + '</g>' +
      '<g id="mo_qkSame" opacity="0"><rect x="246" y="554" width="26" height="' + (FLOOR - 574) + '" fill="#ffb347"/><rect x="796" y="372" width="26" height="' + (FLOOR - 372) + '" fill="#ffb347"/>' +
      '<rect x="330" y="420" width="480" height="104" rx="18" fill="#10304d" stroke="#ffb347" stroke-width="6"/>' +
      '<text x="570" y="494" style="font-family:Pop;font-weight:600;font-size:60px;text-anchor:middle;fill:#ffb347">DOOR = WALL</text></g>' +
      '<rect id="mo_qkScan" x="-700" y="360" width="2480" height="18" fill="#e8f7fd" opacity="0"/>';
    b += '<g id="mo_qkXr" opacity="0">' + xr + '</g>';
    // ---------- predna vrstva: stol, polica s vazou, lampa, X na dverach
    f += '<g id="mo_qkTab"><path d="M715 870 L1015 870 L1040 902 L690 902 Z" fill="#b98258" stroke="#6d4630" stroke-width="6" stroke-linejoin="round"/>' +
      '<rect x="690" y="900" width="350" height="46" rx="6" fill="#8a5a3c" stroke="#5f3c25" stroke-width="6"/>' +
      '<rect x="700" y="944" width="36" height="386" fill="#8a5a3c" stroke="#5f3c25" stroke-width="5"/><rect x="994" y="944" width="36" height="386" fill="#8a5a3c" stroke="#5f3c25" stroke-width="5"/>' +
      '<g id="mo_qkShd" opacity="0"></g></g>';
    f += '<rect x="930" y="720" width="140" height="16" fill="#9c6a48" stroke="#5f3c25" stroke-width="4"/><path d="M950 736 L966 760 M1050 736 L1034 760" stroke="#5f3c25" stroke-width="6"/>';
    f += '<g id="mo_qkVa"><path d="M984 720 Q968 690 984 664 L988 648 L1012 648 L1016 664 Q1032 690 1016 720 Z" fill="#3f8fbf" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M990 690 Q1000 700 1010 690" stroke="#fbf5ea" stroke-width="4" fill="none"/><path d="M996 648 Q992 610 980 596 M1004 648 Q1010 616 1024 604" stroke="#3f8a3a" stroke-width="5" fill="none"/>' +
      '<circle cx="980" cy="594" r="12" fill="#e2674a"/><circle cx="1026" cy="602" r="11" fill="#f6c343"/></g>';
    f += '<g id="mo_qkVs" opacity="0">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<path id="mo_qkVs' + k + '" d="M1000 866 l' + (14 + k * 2) + ' -8 l-6 18 Z" fill="' + (k % 2 ? "#3f8fbf" : "#9fd0ea") + '" stroke="' + INK + '" stroke-width="3"/>'; }).join("") + '</g>';
    f += '<g id="mo_qkLampIn"><rect x="852" y="352" width="26" height="14" rx="4" fill="#5f3c25"/><path d="M865 366 V560" stroke="' + INK + '" stroke-width="5"/>' +
      '<g id="mo_qkLampF"><path d="M820 640 L845 556 L885 556 L910 640 Z" fill="#f6c343" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<ellipse cx="865" cy="646" rx="22" ry="12" fill="#fff6c8"/></g></g>';
    f += '<g id="mo_qkLs" opacity="0">' + [0, 1, 2, 3, 4].map(function (k) { return '<path id="mo_qkLs' + k + '" d="M865 1290 l' + (22 + k * 4) + ' -10 l-10 24 Z" fill="#f6c343" stroke="' + INK + '" stroke-width="3"/>'; }).join("") + '</g>';
    f += '<g id="mo_qkDp"></g>';
    f += '<g id="mo_qkPf" opacity="0">' + [[-120, 0, 70], [0, 14, 90], [120, 0, 70]].map(function (q, k) { return '<ellipse id="mo_qkPf' + k + '" cx="' + (540 + q[0]) + '" cy="' + (1450 + q[1]) + '" rx="' + q[2] + '" ry="' + Math.round(q[2] * 0.45) + '" fill="#e6dccb" opacity="0.9"/>'; }).join('') + '</g>';
    f += '<g id="mo_qkDX" opacity="0"><g id="mo_qkDXIn"><path d="M60 600 L230 1140 M230 600 L60 1140" stroke="#fbf5ea" stroke-width="44" stroke-linecap="round"/>' +
      '<path d="M60 600 L230 1140 M230 600 L60 1140" stroke="' + RED + '" stroke-width="26" stroke-linecap="round"/></g></g>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_qkBJ">' + b + '</g>');
    document.getElementById(p + "float").insertAdjacentHTML("afterend", '<g id="mo_qkFJ">' + f + '</g>');
    PF.P("mo_qkSh", 540, FLOOR, {});
    PF.P("mo_qkTab", 865, 1330, {});
    PF.P("mo_qkVa", 1000, 720, {});
    PF.P("mo_qkLampF", 865, 600, {});
    PF.X(p + "float", CP, 0, 0);
    st.qk = { dp: 0 };
    return st.qk;
  }

  // ---------- pohyb
  function jitter(sel, t, dur, amp, seed, rot, org) {   // nahodne trasenie od 0 do 0 (x, y, rotacia)
    var rr = PF.rnd(seed), step = 0.06, n = Math.max(2, Math.floor(dur / step)), px = 0, py = 0, pr = 0, k;
    for (k = 0; k < n; k++) {
      var last = k === n - 1, sg = k % 2 ? 1 : -1, f = 1 - 0.35 * (k / n);
      var x = last ? 0 : sg * amp * f * (0.55 + 0.45 * rr()), y = last ? 0 : (rr() - 0.5) * amp * 0.7 * f, r = last || !rot ? 0 : -sg * rot * f * (0.5 + 0.5 * rr());
      var a = { x: px, y: py }, z = { x: x, y: y, duration: step, ease: "sine.inOut", immediateRender: false };
      if (rot) { a.rotation = pr; a.svgOrigin = org; z.rotation = r; z.svgOrigin = org; }
      tl.fromTo(sel, a, z, t + k * step); px = x; py = y; pr = r;
    }
  }
  function swing(sel, org, t, dur, A, per) {           // hojdanie od 0 do 0 s tlmenim
    var n = Math.max(2, Math.round(dur / (per / 2))), prev = 0, k;
    for (k = 0; k < n; k++) {
      var v = k === n - 1 ? 0 : (k % 2 ? -1 : 1) * A * (1 - 0.5 * k / n);
      tl.fromTo(sel, { rotation: prev, svgOrigin: org }, { rotation: v, svgOrigin: org, duration: per / 2, ease: "sine.inOut", immediateRender: false }, t + k * per / 2);
      prev = v;
    }
  }
  function dust(t, dur, n, seed) {                     // prach a omietka zo stropu
    var g = document.getElementById("mo_qkDp"), rr = PF.rnd(seed), k;
    for (k = 0; k < n; k++) {
      var id = uid("mo_qkD"), x = -20 + rr() * 1100, r = 4 + rr() * 7, tt = t + rr() * Math.max(0.1, dur - 0.9);
      g.insertAdjacentHTML("beforeend", '<circle id="' + id + '" cx="' + x.toFixed(0) + '" cy="372" r="' + r.toFixed(1) + '" fill="#cbbfa8" stroke="#a89a82" stroke-width="2" opacity="0"/>');
      tl.fromTo("#" + id, { y: 0, opacity: 1 }, { y: 760 + rr() * 300, opacity: 0.2, duration: 0.85, ease: "power2.in", immediateRender: false }, tt);
      PF.S("#" + id, { opacity: 0 }, tt + 0.86);
    }
  }
  function quake(t, dur, amp, seed) {
    var Hh = C().hero, p = Hh.p;
    jitter("#mo_qkBJ,#mo_qkFJ", t, dur, amp, seed, 0.6, "540 1180");
    jitter("#camRot", t, dur, amp * 0.45, seed + 7);
    swing("#mo_qkLampIn", "865 360", t, dur, 9, 0.7);
    swing("#mo_qkPicIn", "327 600", t, dur, 10, 0.5);
    jitter("#mo_qkShF", t, dur, 3, seed + 3);
    var reps = Math.max(1, Math.floor(dur / 0.24)) | 1;
    PF.XY(p + "up", { r: 2.5 }, t, 0.12, "sine.inOut", reps);
    dust(t, dur, Math.round(dur * 4), seed + 11);
  }
  function poseReg() {
    var Hh = C().hero, p = Hh.p, a0 = C().arms0;
    R.dirty("qkpose", function (tt, d) {
      var q = d ? 0.3 : 0;
      PF.X(p + "float", CP, tt, q); Hh.arm("L", a0[0], tt, q || 0.01); Hh.arm("R", a0[1], tt, q || 0.01);
      Hh.leg("L", 0, tt, q || 0.01); Hh.leg("R", 0, tt, q || 0.01); PF.X(p + "legs", { sy: 1 }, tt, q);
      PF.X(p + "head", { ty: 0, r: 0 }, tt, q); Hh.eyes("eyesN", tt); Hh.look(0, 0, tt, q || 0.01);
    });
  }
  function face(t, name) { R.setFace(t, name); R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? 0.2 : 0); }); }

  M.qkroom = function (t, mode, t1, o) {
    o = o || {}; var S = build(), Hh = C().hero, p = Hh.p;
    if (mode === "quake") { quake(t, cdur(t, t1, o.dur || 30), o.amp || 12, Math.round(t * 10) + 1); return null; }
    if (mode === "jolt") {
      var jd = cdur(t, t1, o.dur || 0.6);
      jitter("#mo_qkBJ,#mo_qkFJ", t, jd, o.amp || 30, 77, 2.2, "540 1180");
      jitter("#camRot", t, jd, 16, 78);
      PF.punch(t, 1.05); PF.VIG(t, 0.35);
      dust(t, jd + 0.6, 10, 79);
      return null;
    }
    if (mode === "fall") {                                 // 3 knihy z hornej police
      [["#mo_qkBk0", -150, 640, -200], ["#mo_qkBk1", 160, 600, 230], ["#mo_qkBk2", 120, 640, -150]].forEach(function (q, k) {
        tl.fromTo(q[0], { x: 0, y: 0, rotation: 0, transformOrigin: "50% 50%" }, { x: q[1], y: q[2], rotation: q[3], duration: 0.6, ease: "power2.in", immediateRender: false }, t + k * 0.22);
        tl.fromTo(q[0], { y: q[2] }, { y: q[2] - 26, duration: 0.12, ease: "power1.out", yoyo: true, repeat: 1, immediateRender: false }, t + k * 0.22 + 0.6);
      });
      PF.punch(t + 0.6, 1.025);
      R.dirty("qkfall", function (tt) { PF.S("#mo_qkBk0,#mo_qkBk1,#mo_qkBk2", { x: 0, y: 0, rotation: 0 }, tt); });
      return null;
    }
    if (mode === "cam") {
      (o.clear || "").split(",").forEach(function (k) { if (k) R.clean(k, t, 0.15); });
      R.camSet("body", t); PF.CAM(1.06, o.x || 528, 1055, t, o.dur || 0, "power2.inOut");
      return null;
    }
    if (mode === "zoom") { var zd = o.dur || 0.45; R.camTo(t, o.s || 1.32, o.x || 865, o.y || 1110, zd, "power2.inOut"); return null; }
    if (mode === "shelf") {                                // zrutenie dopredu (scaleY cez nulu)
      PF.X("mo_qkSh", { r: 92, tx: -360, ty: 150 }, t - 0.34, 0.34, "power2.in");
      PF.X("mo_qkSh", { r: 86, tx: -360, ty: 140 }, t, 0.1, "power2.out");
      PF.X("mo_qkSh", { r: 90, tx: -360, ty: 150 }, t + 0.1, 0.14, "power2.in");
      PF.S("#mo_qkScG", { opacity: 1 }, t);
      var L = [[-260, 30, -40], [-140, 70, 25], [-30, 90, -12], [90, 80, 30], [210, 50, -28], [300, 20, 18]];
      L.forEach(function (q, k) {
        tl.fromTo("#mo_qkSc" + k, { x: 0, y: -40, rotation: 0, transformOrigin: "50% 50%" }, { x: q[0], y: q[1], rotation: q[2] + (k % 2 ? 180 : -180), duration: 0.45, ease: "power2.out", immediateRender: false }, t);
      });
      PF.S("#mo_qkDu", { opacity: 1 }, t);
      [0, 1, 2, 3, 4].forEach(function (k) { tl.fromTo("#mo_qkDu" + k, { scale: 0.3, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 1.4, opacity: 0, duration: 1.3, ease: "power2.out", immediateRender: false }, t + k * 0.04); });
      PF.punch(t, 1.06); shake(t, 0.4, 18); PF.VIG(t, 0.5);
      R.dirty("qkshelf", function (tt, d) {
        PF.X("mo_qkSh", { r: 0, tx: 0, ty: 0 }, tt, 0); PF.S("#mo_qkScG,#mo_qkDu", { opacity: 0 }, tt);
      });
      return null;
    }
    if (mode === "spot") {
      PF.O("#mo_qkRing", 0, 1, t, 0.1);
      tl.fromTo("#mo_qkRingE", { scale: 1.5, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.fromTo("#mo_qkFp", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none", immediateRender: false }, t + 0.25);
      R.dirty("qkring", function (tt, d) { PF.O("#mo_qkRing", 1, 0, tt, d ? 0.15 : 0.01); });
      return null;
    }
    if (mode === "xray") {
      PF.O("#mo_qkXr", 0, 1, t, 0.3);
      tl.fromTo("#mo_qkScan", { y: 0, opacity: 0.9 }, { y: FLOOR - 370, opacity: 0.9, duration: 0.6, ease: "power1.inOut", immediateRender: false }, t);
      PF.S("#mo_qkScan", { opacity: 0 }, t + 0.62);
      tl.fromTo("#mo_qkXrS", { opacity: 0.2 }, { opacity: 1, duration: 0.6, ease: "none", immediateRender: false }, t);
      R.dirty("qkxr", function (tt, d) { PF.O("#mo_qkXr", 1, 0, tt, d ? 0.2 : 0.01); PF.S("#mo_qkSame", { opacity: 0 }, tt + (d ? 0.2 : 0.01)); });
      return null;
    }
    if (mode === "same") {
      PF.O("#mo_qkSame", 0, 1, t, 0.12);
      tl.fromTo("#mo_qkSame", { opacity: 1 }, { opacity: 0.6, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.15);
      PF.S("#mo_qkSame", { opacity: 1 }, t + 1.36);
      return null;
    }
    if (mode === "reset") {                                // vsetko spat (blesk)
      flash(t - 0.02, 0.85);
      ["qkshelf", "qkfall", "qklamp", "qkxr", "qkring", "qkpose", "face"].forEach(function (k) { R.clean(k, t, 0); });
      R.clean("qkcard", t, 0.12);
      return null;
    }
    if (mode === "vase") {                                 // vaza z police na dosku stola
      tl.fromTo("#mo_qkVa", { x: 0, y: 0, rotation: 0, svgOrigin: "1000 720" }, { x: -20, y: 150, rotation: -70, svgOrigin: "1000 720", duration: 0.3, ease: "power2.in", immediateRender: false }, t);
      PF.S("#mo_qkVa", { opacity: 0 }, t + 0.3);
      PF.S("#mo_qkVs", { opacity: 1 }, t + 0.3);
      [[-170, -60, -300], [-90, -110, 200], [-30, -70, -160], [60, -120, 260], [120, -50, -220], [170, -90, 180]].forEach(function (q, k) {
        tl.fromTo("#mo_qkVs" + k, { x: 0, y: 0, rotation: 0, transformOrigin: "50% 50%" }, { x: q[0], y: q[1], rotation: q[2], duration: 0.22, ease: "power2.out", immediateRender: false }, t + 0.3);
        tl.fromTo("#mo_qkVs" + k, { y: q[1] }, { y: 10 + (k % 3) * 6, duration: 0.26, ease: "power2.in", immediateRender: false }, t + 0.52);
      });
      PF.punch(t + 0.3, 1.04); shake(t + 0.3, 0.25, 10);
      R.dirty("qkvase", function (tt) { PF.S("#mo_qkVa", { x: 0, y: 0, rotation: 0, opacity: 1 }, tt); PF.S("#mo_qkVs", { opacity: 0 }, tt); });
      return null;
    }
    if (mode === "slide") {                                // stol sa posunie, hrdina s nim (drzi nohu)
      var b1 = UNDER.tx;
      [[45, 0.3], [10, 0.35], [38, 0.3], [18, 0.3]].forEach(function (q, k) {
        var tt = t + [0, 0.32, 0.7, 1.02][k];
        PF.X("mo_qkTab", { tx: q[0] }, tt, q[1], "power2.out");
        PF.X(p + "float", { tx: b1 + q[0] }, tt, q[1], "power2.out");
      });
      R.dirty("qkslide", function (tt, d) { PF.X("mo_qkTab", { tx: 0 }, tt, d ? 0.3 : 0); });
      poseReg();
      return null;
    }
    if (mode === "still") {
      face(t, "smile"); Hh.eyes("eyesN", t); Hh.arm("L", 120, t + 0.1, 0.3);
      PF.punch(t, 1.02);
      return null;
    }
    if (mode === "doorx") {
      PF.O("#mo_qkDX", 0, 1, t, 0.05);
      tl.fromTo("#mo_qkDXIn", { scale: 2.2, svgOrigin: "145 870" }, { scale: 1, svgOrigin: "145 870", duration: 0.16, ease: "power3.in", immediateRender: false }, t);
      PF.punch(t + 0.16, 1.035); shake(t + 0.16, 0.22, 9);
      R.dirty("qkdx", function (tt, d) { PF.O("#mo_qkDX", 1, 0, tt, d ? 0.2 : 0.01); });
      return null;
    }
    return null;                                           // "" = postavit (od snimku 0)
  };

  function lampFall(t) {                                   // lampa sa odtrhne a rozbije o zem
    PF.X("mo_qkLampF", { ty: 640, r: 40 }, t, 0.42, "power2.in");
    PF.S("#mo_qkLampF", { opacity: 0 }, t + 0.42);
    PF.S("#mo_qkLs", { opacity: 1 }, t + 0.42);
    [[-160, -90, -260], [-70, -130, 200], [20, -100, -180], [110, -140, 240], [190, -60, -200]].forEach(function (q, k) {
      tl.fromTo("#mo_qkLs" + k, { x: 0, y: 0, rotation: 0, transformOrigin: "50% 50%" }, { x: q[0], y: q[1], rotation: q[2], duration: 0.22, ease: "power2.out", immediateRender: false }, t + 0.42);
      tl.fromTo("#mo_qkLs" + k, { y: q[1] }, { y: 20 + (k % 2) * 14, duration: 0.24, ease: "power2.in", immediateRender: false }, t + 0.64);
    });
    PF.punch(t + 0.42, 1.04); shake(t + 0.42, 0.25, 12);
    R.dirty("qklamp", function (tt) { PF.X("mo_qkLampF", { ty: 0, r: 0 }, tt, 0); PF.S("#mo_qkLampF", { opacity: 1 }, tt); PF.S("#mo_qkLs", { opacity: 0 }, tt); });
  }

  M.qkhero = function (t, mode, t1, o) {
    o = o || {}; build(); var Hh = C().hero, p = Hh.p, a0 = C().arms0;
    if (mode === "brace") {
      Hh.arm("L", 62, t, 0.2, "power2.out"); Hh.arm("R", -62, t, 0.2, "power2.out");
      Hh.armWave("L", 72, t + 0.25, 0.18, 3); Hh.armWave("R", -72, t + 0.35, 0.18, 3);
      Hh.kneeShake(t, Math.min(t1 || t + 2, t + 2.2) - 0.1, 6);
      face(t, "shocked");
      poseReg();
      return null;
    }
    if (mode === "walk") {                                 // tackavo k dverom
      var d = cdur(t, t1, o.dur || 1.6), n = Math.max(2, Math.floor(d / 0.22)), k;
      PF.X(p + "float", DOOR, t, d, "power1.inOut");
      Hh.arm("L", 70, t, 0.2); Hh.arm("R", -70, t, 0.2);
      for (k = 0; k < n; k++) { var tt = t + k * 0.22, sg = k % 2 ? 1 : -1; Hh.leg("L", 14 * sg, tt, 0.2); Hh.leg("R", 14 * sg, tt, 0.2); }
      Hh.leg("L", 0, t + n * 0.22, 0.15); Hh.leg("R", 0, t + n * 0.22, 0.15);
      Hh.arm("L", a0[0], t + d, 0.3); Hh.arm("R", a0[1], t + d, 0.3);
      PF.XY(p + "head", { r: 6 }, t, 0.2, "sine.inOut", 5);
      face(t, "shocked");
      poseReg();
      return null;
    }
    if (mode === "look") {
      Hh.look(12, 0, t, 0.15); PF.X(p + "head", { r: 8 }, t, 0.2);
      PF.X(p + "head", { r: 0 }, t + 1.3, 0.25);
      face(t + 0.3, "shocked");
      poseReg();
      return null;
    }
    if (mode === "trip") {                                 // zakopne pri pohybe
      PF.XY(p + "up", { r: -14 }, t, 0.16, "power2.out", 1);
      Hh.arm("L", 120, t, 0.12); Hh.arm("R", -40, t, 0.12); Hh.arm("L", a0[0], t + 0.45, 0.2); Hh.arm("R", a0[1], t + 0.45, 0.2);
      Hh.leg("L", 22, t, 0.12); Hh.leg("L", 0, t + 0.35, 0.15);
      face(t, "pain");
      return null;
    }
    if (mode === "drop") {                                 // na ruky a kolena
      PF.X(p + "float", { tx: 0, ty: DROP.ty + 30, s: 0.75, r: 0 }, t, 0.2, "power3.in");
      PF.X(p + "float", DROP, t + 0.2, 0.18, "power2.out");
      PF.X(p + "legs", { sy: 0.32 }, t, 0.2, "power3.in");
      PF.X(p + "head", { ty: 74, r: 0 }, t, 0.2, "power3.in");
      Hh.arm("L", 14, t, 0.2, "power3.in"); Hh.arm("R", -14, t, 0.2, "power3.in");
      Hh.leg("L", 28, t, 0.2); Hh.leg("R", -28, t, 0.2);
      PF.S("#mo_qkPf", { opacity: 1 }, t + 0.2);
      [0, 1, 2].forEach(function (k) { tl.fromTo("#mo_qkPf" + k, { scale: 0.3, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 1.5, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, t + 0.2 + k * 0.03); });
      PF.punch(t + 0.2, 1.05); shake(t + 0.2, 0.22, 10);
      face(t, "worried");
      poseReg();
      return null;
    }
    if (mode === "under") {                                // prelezie pod stol
      var ud = cdur(t, t1, o.dur || 0.9), m = Math.max(2, Math.floor(ud / 0.2)), j;
      PF.X(p + "float", UNDER, t, ud, "power1.inOut");
      for (j = 0; j < m; j++) { var tj = t + j * 0.2, s2 = j % 2; Hh.arm("L", s2 ? 8 : 34, tj, 0.18); Hh.arm("R", s2 ? -34 : -8, tj, 0.18); }
      Hh.arm("L", 14, t + m * 0.2, 0.15); Hh.arm("R", -14, t + m * 0.2, 0.15);
      poseReg();
      return null;
    }
    if (mode === "cover") {                                // ruky na hlavu a krk
      Hh.arm("L", 158, t, 0.25, "power2.out"); Hh.arm("R", -158, t, 0.25, "power2.out");
      Hh.eyes("eyesCl", t + 0.15);
      PF.XY(p + "head", { ty: 82 }, t + 0.3, 0.12, "sine.inOut", 3);
      poseReg();
      return null;
    }
    if (mode === "hold") {                                 // jedna ruka drzi nohu stola
      Hh.arm("R", -84, t, 0.22, "power2.out"); Hh.eyes("eyesN", t + 0.1);
      face(t + 0.1, "worried");
      PF.punch(t + 0.22, 1.02);
      poseReg();
      return null;
    }
    return null;
  };

  M.qkface = function (t, name, t1, o) { build(); face(t, name || "worried"); return null; };

  // ================= KARTY
  function icon(kind) {
    var s = '<svg viewBox="0 0 200 150" style="position:static;display:block;width:200px;height:150px;margin:0 auto">';
    if (kind === "move") s += '<circle cx="96" cy="26" r="16" fill="' + INK + '"/><path d="M92 46 L80 92 L52 132 M80 92 L114 126 M92 54 L62 74 M92 54 L126 66" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M150 70 l8 18 l20 -4 l-12 16 l12 16 l-20 -4 l-8 18 l-6 -18 l-20 2 l14 -14 l-14 -14 l20 2 Z" fill="' + RED + '"/>';
    if (kind === "fall") s += '<path d="M90 4 V44" stroke="' + INK + '" stroke-width="5" stroke-dasharray="8 6"/><path d="M62 92 L76 52 L104 52 L118 92 Z" fill="#f6c343" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M90 104 V132 M78 120 L90 134 L102 120" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M150 70 l8 18 l20 -4 l-12 16 l12 16 l-20 -4 l-8 18 l-6 -18 l-20 2 l14 -14 l-14 -14 l20 2 Z" fill="' + RED + '"/>';
    if (kind === "drop") s += '<path d="M10 138 H190" stroke="#8a7d68" stroke-width="6"/><circle cx="150" cy="70" r="18" fill="' + INK + '"/>' +
      '<path d="M132 82 L66 82 M66 82 L60 134 M80 84 L94 134 M128 86 L136 134" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>';
    if (kind === "cover") s += '<path d="M10 140 H190" stroke="#8a7d68" stroke-width="6"/><rect x="18" y="30" width="164" height="16" rx="4" fill="#8a5a3c"/><rect x="28" y="46" width="12" height="94" fill="#8a5a3c"/><rect x="160" y="46" width="12" height="94" fill="#8a5a3c"/>' +
      '<circle cx="128" cy="92" r="16" fill="' + INK + '"/><path d="M112 102 L64 102 L58 136 M74 104 L84 136" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M110 100 Q120 66 142 80" fill="none" stroke="' + RED + '" stroke-width="10" stroke-linecap="round"/>';
    if (kind === "hold") s += '<rect x="20" y="16" width="160" height="16" rx="4" fill="#8a5a3c"/><rect x="88" y="32" width="24" height="112" fill="#8a5a3c" stroke="#5f3c25" stroke-width="4"/>' +
      '<path d="M30 92 Q60 80 84 84" fill="none" stroke="#e3ae82" stroke-width="22" stroke-linecap="round"/>' +
      '<path d="M80 70 Q122 64 120 80 M80 84 Q124 80 120 96 M80 98 Q120 96 116 110" fill="none" stroke="#c68b5e" stroke-width="12" stroke-linecap="round"/>';
    return s + '</svg>';
  }
  M.qkcard = function (t, mode, t1, o) {
    o = o || {}; build(); var u = UI();
    if (!st.qkc) {
      var row = function (id, kind, txt) { return '<div id="' + id + '" style="display:flex;align-items:center;gap:16px;margin-top:10px;opacity:0">' + icon(kind) +
        '<span style="font-family:Pop;font-weight:600;font-size:46px;line-height:1.1;color:' + INK + ';text-align:left">' + txt + '</span></div>'; };
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right" id="mo_qkIj" style="top:' + (o.y || 420) + 'px"><div class="mo-paper" id="mo_qkIjIn" style="padding:16px 26px 18px;width:560px">' +
        '<div style="font-family:Hand;font-weight:700;font-size:42px;letter-spacing:4px;line-height:1.2;color:' + RED + '">MOST INJURIES</div>' +
        row("mo_qkIj1", "move", "MOVING") + row("mo_qkIj2", "fall", "FALLING THINGS") + '</div></div>');
      var col = function (id, kind, txt) { return '<div id="' + id + '" style="width:250px;opacity:0">' + icon(kind) +
        '<div style="font-family:Pop;font-weight:600;font-size:46px;line-height:1.2;color:' + INK + ';margin-top:6px">' + txt + '</div></div>'; };
      u.insertAdjacentHTML("beforeend", '<div class="mo" id="mo_qkDc" style="top:' + (o.y || 300) + 'px"><div class="mo-paper" id="mo_qkDcIn" style="padding:16px 18px 14px;width:820px;display:flex;justify-content:space-between">' +
        col("mo_qkDc1", "drop", "DROP") + col("mo_qkDc2", "cover", "COVER") + col("mo_qkDc3", "hold", "HOLD ON") + '</div></div>');
      st.qkc = 1;
    }
    var pop = function (id, tt) { PF.O("#" + id, 0, 1, tt, 0.06); tl.fromTo("#" + id, { scale: 0.3 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, tt); PF.punch(tt + 0.1, 1.02); };
    var reg = function () { R.dirty("qkcard", function (tt, d) {
      PF.O("#mo_qkIj,#mo_qkDc", 1, 0, tt, d ? 0.15 : 0.01);
      PF.S("#mo_qkIj1,#mo_qkIj2,#mo_qkDc1,#mo_qkDc2,#mo_qkDc3", { opacity: 0 }, tt + (d ? 0.16 : 0.02));
    }); };
    if (mode === "inj") {
      PF.O("#mo_qkIj", 0, 1, t, 0.06);
      tl.fromTo("#mo_qkIjIn", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.32, ease: "back.out(2)", immediateRender: false }, t);
      reg(); return null;
    }
    if (mode === "move") { pop("mo_qkIj1", t); M.qkhero(t, "trip", t1, {}); return null; }
    if (mode === "fall") { pop("mo_qkIj2", t); lampFall(t); return null; }
    if (mode === "dch") {
      PF.O("#mo_qkDc", 0, 1, t, 0.06);
      tl.fromTo("#mo_qkDcIn", { scale: 0.4, rotation: -6 }, { scale: 1, rotation: -1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      pop("mo_qkDc1", t + 0.05); reg(); return null;
    }
    if (mode === "c2") { pop("mo_qkDc2", t); return null; }
    if (mode === "c3") { pop("mo_qkDc3", t); return null; }
    return null;
  };
})();
