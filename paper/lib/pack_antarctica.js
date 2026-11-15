// pack_antarctica.js - momenty pre video 038 Night In Antarctica (napoj v mraze: zohreje ta, alebo schladi?)
// polar  = polarna noc ako pozadie od prveho snimku (obloha, hviezdy, mesiac, polarna ziara, hory, sneh, stan, vlajka);
//          "wind" = naraz vetra (pruhy, postava sa zaprie), "wall" = snehova stena vyrastie vpravo a vietor ju obteka
// flask  = ploskacka v pravej ruke od prveho snimku; "show" = ukaze ju, "sip" = napije sa, "away" = odhodi ju
// warmth = pocit tepla: "on" = teplo sa rozleje od hrudnika, "skin" = vlny k pokozke, "leak" = teplo unika z tela, postava zmodrie
// vessel = kruhovy rez kozou vpravo: "show", "open" (cieva pod kozou sa roztiahne), "flow" (krv k pokozke, teplo von), "off"
// core   = teplomer vlavo "CORE TEMP": "show" (bez cisla), cislo 0-1 = hladina, "86" = klesne na znacku 86°F / 30°C
// chill  = triaska: "on", "weak" (slabsia), "heater" (plamienok v hrudi = tvoje kurenie), "stop" (triaska prestane, namraza)
// camp   = rady: "pad" (karimatka), "block" (karta: zem nechladi), "wrap" (ciapka + saal), "dry", "soup", "eat", "kcal"
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, OV = H.OV, st = H.st, uid = H.uid, scr = H.scr, upPt = H.upPt, headPt = H.headPt;
  var INK = "#2b2320", RED = "#d9483b", COLD = "#8fb8f0", WARM = "#ff9a4a";
  function S0() { if (!st.an) st.an = { tint: 0, glow: 0 }; return st.an; }
  function tint(v, t, d) {                  // spolocny modry nadych tvare (warmth leak + chill stop)
    var s = S0(); if (Math.abs(s.tint - v) < 0.001) return;
    C().hero.tint(COLD, s.tint, v, t, d || 0.01); s.tint = v;
  }
  function faceBack() { R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); }); }
  function sway(sel, from, to, per) {      // nekonecne kmitanie tam a spat, perioda deli dlzku videa -> slucka bez skoku
    var T = PF.VO.total; if (!(T > 0)) return;
    var P = PF.loopPeriod(per), m = Math.max(1, Math.round(T / P));
    tl.fromTo(sel, from, Object.assign({ duration: P / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * m - 1, immediateRender: false }, to), 0);
  }

  // ================= POLAR (pozadie polarnej noci)
  function band(y, amp, h) {                // zvlneny pas polarnej ziary
    var d = "M-340 " + y, k, x;
    for (k = 0; k < 6; k++) { x = -340 + (k + 1) * 320; d += " Q " + (x - 160) + " " + (y + (k % 2 ? -amp : amp)) + " " + x + " " + y; }
    d += " L1580 " + (y - h);
    for (k = 5; k >= 0; k--) { x = -340 + k * 320; d += " Q " + (x + 160) + " " + (y - h + (k % 2 ? amp : -amp) * 0.6) + " " + x + " " + (y - h); }
    return d + " Z";
  }
  function cap(x, y, s) { s = s || 1;
    return '<path d="M' + x + ' ' + y + ' l' + (-40 * s) + ' ' + (60 * s) + ' l' + (26 * s) + ' ' + (-12 * s) + ' l' + (14 * s) + ' ' + (22 * s) + ' l' + (16 * s) + ' ' + (-24 * s) + ' l' + (28 * s) + ' ' + (16 * s) + ' Z" fill="#c9d7f0"/>'; }
  function buildPolar() {
    if (st.anp) return; st.anp = {};
    var p = C().hero.p, rr = PF.rnd(3801), i, m = "", stars = "", tw = ["", "", ""];
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_anGs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060d26"/><stop offset="0.55" stop-color="#14265a"/><stop offset="1" stop-color="#344f8a"/></linearGradient>' +
      '<radialGradient id="mo_anGm"><stop offset="0" stop-color="#fff6d2" stop-opacity="0.7"/><stop offset="1" stop-color="#fff6d2" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mo_anGa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6dffc0" stop-opacity="0"/><stop offset="0.65" stop-color="#4fe8a6" stop-opacity="0.5"/><stop offset="1" stop-color="#b8ffd9" stop-opacity="0.08"/></linearGradient>' +
      '<linearGradient id="mo_anGb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58cff" stop-opacity="0"/><stop offset="0.7" stop-color="#9f7bff" stop-opacity="0.32"/><stop offset="1" stop-color="#d8c4ff" stop-opacity="0.05"/></linearGradient>' +
      '<linearGradient id="mo_anGn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7bbe0"/><stop offset="0.35" stop-color="#c3d2ec"/><stop offset="1" stop-color="#e6eefa"/></linearGradient>' +
      '<radialGradient id="mo_anGd"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.8"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mo_anGw"><stop offset="0" stop-color="#ffcf8a" stop-opacity="0.95"/><stop offset="0.6" stop-color="#ff9a4a" stop-opacity="0.45"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>');
    m += '<rect x="-300" y="-300" width="1680" height="1700" fill="url(#mo_anGs)"/>';
    for (i = 0; i < 56; i++) {
      var c = '<circle cx="' + (-250 + rr() * 1580).toFixed(0) + '" cy="' + (-250 + rr() * 1250).toFixed(0) + '" r="' + (1.6 + rr() * 3).toFixed(1) + '"/>';
      if (i % 4 === 0) tw[(i / 4) % 3] += c; else stars += c;
    }
    [[150, 300, 0], [700, 180, 1], [420, 560, 2], [980, 330, 0], [60, 760, 1]].forEach(function (q) {   // vacsie iskriace hviezdy
      tw[q[2]] += '<path d="M' + q[0] + ' ' + (q[1] - 13) + ' L' + (q[0] + 3) + ' ' + (q[1] - 3) + ' L' + (q[0] + 13) + ' ' + q[1] + ' L' + (q[0] + 3) + ' ' + (q[1] + 3) + ' L' + q[0] + ' ' + (q[1] + 13) +
        ' L' + (q[0] - 3) + ' ' + (q[1] + 3) + ' L' + (q[0] - 13) + ' ' + q[1] + ' L' + (q[0] - 3) + ' ' + (q[1] - 3) + ' Z"/>'; });
    m += '<g fill="#ffffff" opacity="0.85">' + stars + '</g>';
    for (i = 0; i < 3; i++) m += '<g id="mo_anTw' + i + '" fill="#ffffff">' + tw[i] + '</g>';
    m += '<g id="mo_anAu1"><path d="' + band(600, 60, 330) + '" fill="url(#mo_anGa)"/></g>';
    m += '<g id="mo_anAu2"><path d="' + band(730, 46, 230) + '" fill="url(#mo_anGb)"/></g>';
    m += '<g id="mo_anAu3"><path d="' + band(470, 40, 200) + '" fill="url(#mo_anGa)" opacity="0.7"/></g>';
    m += '<circle cx="850" cy="470" r="170" fill="url(#mo_anGm)"/><circle cx="850" cy="470" r="62" fill="#f6f1dc"/>' +
      '<circle cx="830" cy="452" r="13" fill="#e4dcc0"/><circle cx="868" cy="490" r="9" fill="#e4dcc0"/><circle cx="872" cy="448" r="6" fill="#e4dcc0"/>';
    m += '<path d="M-320 1180 L -120 900 L 40 1010 L 220 820 L 400 1000 L 600 770 L 760 960 L 920 850 L 1100 1000 L 1400 900 V1420 H-320 Z" fill="#5670ab"/>' +
      cap(220, 820) + cap(600, 770, 1.1) + cap(920, 850, 0.9) + cap(-120, 900, 0.8);
    m += '<path d="M-320 1260 C -60 1150 220 1190 420 1232 C 640 1160 900 1180 1400 1240 V1420 H-320 Z" fill="#2c467e"/>';
    m += '<path d="M-320 1292 C 100 1262 900 1262 1400 1292 V2300 H-320 Z" fill="url(#mo_anGn)"/>';
    m += '<g fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.55">' +
      '<path d="M-40 1340 q60 -10 120 0"/><path d="M260 1330 q50 -8 100 0"/><path d="M760 1336 q70 -10 140 0"/><path d="M60 1560 q80 -12 160 0"/><path d="M820 1580 q70 -10 140 0"/><path d="M420 1640 q60 -8 120 0"/></g>' +
      '<g fill="none" stroke="#8fa6cf" stroke-width="4" stroke-linecap="round" opacity="0.5"><path d="M120 1400 q50 8 100 0"/><path d="M700 1410 q60 8 120 0"/><path d="M300 1520 q50 8 100 0"/></g>';
    // stan v lavej volnej zone (dvere svietia)
    m += '<ellipse id="mo_anTl" cx="180" cy="1452" rx="170" ry="38" fill="url(#mo_anGd)"/>' +
      '<g filter="url(#cut)"><path d="M48 1444 Q 66 1252 180 1238 Q 294 1252 312 1444 Z" fill="#e8742c"/><path d="M180 1238 Q 294 1252 312 1444 L 244 1444 Q 238 1300 180 1238 Z" fill="#c45a1c"/>' +
      '<path d="M140 1444 Q 150 1344 180 1326 Q 210 1344 220 1444 Z" fill="#ffd98c"/><path d="M180 1238 V1326" stroke="#a84a16" stroke-width="5"/></g>' +
      '<path d="M66 1380 L 18 1452 M294 1380 L 344 1452" stroke="#dfe7f3" stroke-width="3"/><ellipse cx="180" cy="1446" rx="150" ry="10" fill="#ffffff" opacity="0.5"/>';
    // vlajocka vpravo (vlaje dolava, vietor fuka sprava)
    m += '<rect x="1004" y="1176" width="9" height="276" rx="4" fill="#cfd8e6"/><g id="mo_anFl"><path d="M1006 1184 L 912 1206 L 1006 1236 Z" fill="' + RED + '"/></g>' +
      '<ellipse cx="1008" cy="1452" rx="40" ry="10" fill="#ffffff" opacity="0.6"/>';
    var T = PF.VO.total, sn = "", fl = [];
    for (i = 0; i < 34; i++) {               // vlocky za postavou (nie pred tvarou)
      var fx0 = -100 + rr() * 1280, dr = (rr() - 0.5) * 180, f0 = rr();
      fl.push([fx0, dr, f0, PF.loopPeriod(4 + rr() * 3)]);
      sn += '<circle id="mo_anSn' + i + '" cx="0" cy="0" r="' + (3 + rr() * 5).toFixed(1) + '" opacity="' + (0.55 + rr() * 0.4).toFixed(2) + '"/>';
    }
    m += '<g fill="#ffffff">' + sn + '</g>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_anBg">' + m + '</g>');
    fl.forEach(function (q, j) {             // tri useky: zo startu dole, cele kola, zhora do startu -> posledny snimok = prvy
      var sel = "#mo_anSn" + j, P = q[3], k = Math.max(0, Math.round(T / P) - 1), pos = function (y) { return "translate(" + (q[0] + q[1] * (y + 60) / 2050).toFixed(1) + " " + y.toFixed(1) + ")"; },
        y0 = -60 + q[2] * 2050, a = P * (1 - q[2]);
      tl.set(sel, { attr: { transform: pos(y0) } }, 0);
      if (!(T > 0)) return;
      tl.fromTo(sel, { attr: { transform: pos(y0) } }, { attr: { transform: pos(1990) }, duration: Math.max(0.01, a), ease: "none", immediateRender: false }, 0);
      if (k > 0) tl.fromTo(sel, { attr: { transform: pos(-60) } }, { attr: { transform: pos(1990) }, duration: P, ease: "none", repeat: k - 1, immediateRender: false }, a);
      tl.fromTo(sel, { attr: { transform: pos(-60) } }, { attr: { transform: pos(y0) }, duration: Math.max(0.01, P * q[2]), ease: "none", immediateRender: false }, a + k * P);
    });
    // predne zavej v rohoch (rozmazane, ako rohy prostredia)
    PF.add("F", '<g id="mo_anF" filter="url(#dof)" opacity="0.95"><path d="M-60 2000 C -40 1830 40 1740 150 1710 C 130 1810 80 1900 -60 2000 Z" fill="#dfe8f6"/>' +
      '<path d="M1150 1990 C 1100 1860 1030 1800 940 1790 C 970 1880 1040 1950 1150 1990 Z" fill="#cfdcf1"/></g>');
    PF.S("#fd_sc_mountain_F", { opacity: 0 }, 0);    // skaly v rohoch hornej sceny by v noci svietili - preč od prveho snimku
    // pohyb pozadia: vsetko kmita tam a spat s periodou, ktora deli dlzku videa
    [[0, 2.6, 0.2], [1, 3.4, 0.25], [2, 4.2, 0.15]].forEach(function (q) { sway("#mo_anTw" + q[0], { opacity: 1 }, { opacity: q[2] }, q[1]); });
    sway("#mo_anAu1", { attr: { transform: "translate(-46 0)" } }, { attr: { transform: "translate(46 0)" } }, 9);
    sway("#mo_anAu2", { attr: { transform: "translate(38 0)" } }, { attr: { transform: "translate(-38 0)" } }, 7);
    sway("#mo_anAu3", { attr: { transform: "translate(-30 0)" } }, { attr: { transform: "translate(30 0)" } }, 11);
    sway("#mo_anAu1 path, #mo_anAu3 path", { opacity: 1 }, { opacity: 0.55 }, 5);
    sway("#mo_anTl", { opacity: 1 }, { opacity: 0.6 }, 1.6);
    sway("#mo_anFl", { attr: { transform: "rotate(-5 1006 1210)" } }, { attr: { transform: "rotate(7 1006 1210)" } }, 1.2);
  }
  M.polar = function (t, mode, t1, o) {
    o = o || {}; buildPolar(); var Hr = C().hero, p = Hr.p, i, g;
    if (mode === "wind") {                   // naraz vetra sprava: biele pruhy cez obraz, postava sa oprie do vetra, saal vlaje
      var id = uid("mo_anWd"), dur = o.dur || 1.0, n = Math.max(10, Math.round(dur * 13)), rr = PF.rnd(4100 + Math.round(t * 10));
      g = OV();
      for (i = 0; i < n; i++) {
        var sid = id + "s" + i, y = 560 + rr() * 820, len = 240 + rr() * 300, tt = t + i * (dur - 0.42) / n;
        PF.el("path", { id: sid, d: "M0 0 h" + len.toFixed(0) + " q40 0 60 -18", stroke: "#ffffff", "stroke-width": (9 + rr() * 7).toFixed(1), "stroke-linecap": "round", fill: "none", opacity: 0 }, g);
        PF.S("#" + sid, { opacity: 0.95 }, tt);
        tl.fromTo("#" + sid, { x: 1180, y: y }, { x: -460, y: y + 30, duration: 0.42, ease: "none", immediateRender: false }, tt);
        PF.S("#" + sid, { opacity: 0 }, tt + 0.42);
      }
      PF.XY(p + "float", { r: 6 }, t + 0.05, Math.max(0.15, (dur - 0.1) / 4), "sine.inOut", 3);
      if (st.anwr) PF.XY("mo_anScT", { r: 38 }, t, 0.1, "sine.inOut", Math.max(3, Math.round(dur / 0.1)) | 1);
      Hr.lids(0.4, t, 0.1); Hr.lids(0, t + dur, 0.15);
      return "body";
    }
    if (mode === "wall") {                   // snehova stena vyrastie vpravo od postavy, vietor ju obteka hore
      if (!st.anwl) {
        var b = "", r, k;
        for (r = 0; r < 4; r++) for (k = 0; k < 4; k++) {   // 1.5x: bloky 78 px, stena x 676..982, vyska 312
          var bx = 676 + k * 81 - (r % 2 ? 40 : 0), w = 78;
          if (bx < 676) { w -= 676 - bx; bx = 676; } if (bx + w > 982) w = 982 - bx;
          if (w > 10) b += '<rect x="' + bx + '" y="' + (1388 - r * 78) + '" width="' + w + '" height="76" rx="14" fill="#eef3fb" stroke="#b7c6df" stroke-width="6"/>';
        }
        Hr = C().hero;
        document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_anWl"><ellipse cx="829" cy="1466" rx="190" ry="18" fill="#5a6f99" opacity="0.4"/><g filter="url(#cut)">' + b + '</g></g>');
        PF.P("mo_anWl", 829, 1466, { sy: 0 });
        st.anwl = true;
      }
      PF.X("mo_anWl", { sy: 1 }, t, 0.42, "back.out(1.6)"); H.shake(t + 0.4, 0.15, 5);
      g = OV(); var wid = uid("mo_anWf");
      for (i = 0; i < 4; i++) {              // pruhy narazia do steny a ohnu sa nahor
        var y0 = 1180 + i * 60, x1 = 1080, pid = wid + "p" + i, tt2 = t + 0.4 + i * 0.16;
        PF.el("path", { id: pid, d: "M1180 " + y0 + " L" + x1 + " " + y0 + " Q 1040 " + y0 + " 1035 " + (y0 - 160) + " Q 1030 " + (y0 - 300) + " 820 " + (y0 - 380),
          stroke: "#ffffff", "stroke-width": 10, "stroke-linecap": "round", fill: "none", opacity: 0, pathLength: 100, "stroke-dasharray": "34 120", "stroke-dashoffset": 34 }, g);
        PF.S("#" + pid, { opacity: 0.85 }, tt2);
        tl.fromTo("#" + pid, { attr: { "stroke-dashoffset": 34 } }, { attr: { "stroke-dashoffset": -100 }, duration: 0.55, ease: "none", immediateRender: false }, tt2);
        PF.S("#" + pid, { opacity: 0 }, tt2 + 0.55);
      }
      R.setFace(t + 0.45, "smile"); faceBack();
      R.dirty("anwall", function (tt, d) { PF.X("mo_anWl", { sy: 0 }, tt, d ? 0.25 : 0); });
      return "body";
    }
    return null;
  };

  // ================= FLASK (ploskacka)
  function buildFlask() {
    if (st.anf) return;
    var p = C().hero.p, a0 = C().arms0[1];
    document.getElementById(p + "handR").insertAdjacentHTML("beforebegin", '<g id="mo_anFk"><g filter="url(#cut)">' +
      '<rect x="636" y="1062" width="32" height="14" rx="4" fill="#59636f"/><rect x="641" y="1072" width="22" height="18" rx="3" fill="#7d8996"/>' +
      '<rect x="620" y="1086" width="64" height="114" rx="16" fill="#c3ccd6" stroke="#7d8996" stroke-width="5"/>' +
      '<rect x="620" y="1112" width="64" height="40" fill="#8c5a3a"/><rect x="620" y="1112" width="64" height="40" fill="none" stroke="#6b4129" stroke-width="4"/>' +
      '<rect x="629" y="1094" width="10" height="94" rx="5" fill="#ffffff" opacity="0.55"/></g></g>');
    PF.P("mo_anFk", 652, 1160, { r: -a0 });  // v pokoji stoji zvislo (ruka je natocena o a0)
    st.anf = { on: true };
  }
  M.flask = function (t, mode, t1, o) {
    o = o || {}; buildFlask(); var Hr = C().hero, p = Hr.p, a0 = C().arms0[1], lk = C().look0;
    if (mode === "show") {                   // zdvihne ploskacku a zatrasie nou
      var hold = o.hold || 0.8, te = t + 0.38 + hold;
      Hr.arm("R", -104, t, 0.34, "back.out(1.5)"); PF.X("mo_anFk", { r: 104 }, t, 0.34, "back.out(1.5)");
      PF.XY("mo_anFk", { r: 90 }, t + 0.38, 0.12, "sine.inOut", 3);
      Hr.look(12, -3, t, 0.2);
      Hr.arm("R", a0, te, 0.35); PF.X("mo_anFk", { r: -a0 }, te, 0.35); Hr.look(lk[0], lk[1], te, 0.25);
      return "body";
    }
    if (mode === "sip") {                    // napije sa: ploskacka k ustam, dva hlty, uspokojeny vydych
      var n = o.gulps || 2, i;
      Hr.arm("R", 112, t, 0.34, "power2.out"); PF.X("mo_anFk", { r: 0 }, t, 0.34, "power2.out");
      PF.X(p + "head", { r: -7 }, t + 0.12, 0.24, "power2.out");
      Hr.eyes("eyesCl", t + 0.2); Hr.mouth("mO", t + 0.2); Hr.lids(0, t + 0.2, 0.01); Hr.brows(-4, 4, -6, t + 0.2, 0.15);
      for (i = 0; i < n; i++) PF.XY(p + "head", { ty: 6 }, t + 0.44 + i * 0.3, 0.1, "sine.inOut", 1);
      var te2 = t + 0.44 + n * 0.3 + 0.08;
      Hr.arm("R", a0, te2, 0.36); PF.X("mo_anFk", { r: -a0 }, te2, 0.36); PF.X(p + "head", { r: 0 }, te2, 0.26);
      R.setFace(te2 + 0.05, "happy"); Hr.puff(te2 + 0.12); Hr.look(lk[0], lk[1], te2, 0.2);
      faceBack();
      return "body";
    }
    if (mode === "away") {                   // odhodi ploskacku doprava hore (zmizne)
      if (!st.anf.on) return null;
      Hr.arm("R", -120, t, 0.2, "power2.in"); Hr.arm("R", a0, t + 0.55, 0.35);
      PF.X("mo_anFk", { tx: 60, ty: 520, r: 520 }, t + 0.18, 0.5, "power1.out");
      PF.O("#mo_anFk", 1, 0, t + 0.38, 0.2);
      st.anf.on = false;
      R.dirty("anflask", function (tt, d) {
        PF.X("mo_anFk", { tx: 0, ty: 0, r: -a0 }, tt, 0); PF.O("#mo_anFk", 0, 1, tt + 0.01, d ? 0.2 : 0.01); st.anf.on = true; });
      return "body";
    }
    return null;
  };

  // ================= WARMTH (pocit tepla od hrudnika, unik tepla)
  function buildWarm() {
    if (st.anwm) return;
    var p = C().hero.p;
    document.getElementById(p + "head").insertAdjacentHTML("beforebegin",
      '<g id="mo_anCh" opacity="0"><circle cx="540" cy="1090" r="130" fill="url(#mo_anGw)"/></g>' +
      '<circle id="mo_anRg" cx="540" cy="1090" r="60" fill="none" stroke="' + WARM + '" stroke-width="14" opacity="0"/>' +
      '<circle id="mo_anRg2" cx="540" cy="1090" r="60" fill="none" stroke="#ffd27a" stroke-width="10" opacity="0"/>');
    PF.P("mo_anCh", 540, 1090, { s: 0.2 });
    st.anwm = { ch: 0 };
  }
  M.warmth = function (t, mode, t1, o) {
    o = o || {}; buildPolar(); buildWarm(); var Hr = C().hero, p = Hr.p, s = S0(), w = st.anwm, i;
    R.dirty("anglow", function (tt, d) {
      if (s.glow) { Hr.heat(false, tt, d ? 0.3 : 0.01); s.glow = 0; }
      if (w.ch) { PF.O("#mo_anCh", w.ch, 0, tt, d ? 0.3 : 0.01); w.ch = 0; }
      tint(0, tt, d ? 0.3 : 0.01);
    });
    if (mode === "on") {                     // teplo sa rozleje od hrudnika po celom tele
      tint(0, t, 0.4);
      PF.X("mo_anCh", { s: 0.2 }, t, 0); PF.O("#mo_anCh", w.ch, 1, t, 0.15); w.ch = 1;
      PF.X("mo_anCh", { s: 1.7 }, t + 0.02, 0.9, "power2.out");
      if (!s.glow) { Hr.heat(true, t + 0.15, 0.8); s.glow = 1; }
      tl.fromTo("#mo_anRg", { scale: 0.4, opacity: 0.9, svgOrigin: "540 1090" }, { scale: 3.2, opacity: 0, duration: 0.8, ease: "power2.out", immediateRender: false }, t);
      PF.XY(p + "up", { sy: 1.03 }, t + 0.1, 0.25, "sine.inOut", 1);
      R.setFace(t + 0.1, "happy"); faceBack();
      return "body";
    }
    if (mode === "skin") {                   // dve vlny tepla od hrudnika az k okraju tela (krv ide k pokozke)
      for (i = 0; i < 2; i++) {
        tl.fromTo("#mo_anRg", { scale: 0.5, opacity: 0.95, svgOrigin: "540 1090" }, { scale: 3.6, opacity: 0, duration: 0.7, ease: "power1.out", immediateRender: false }, t + i * 0.45);
        tl.fromTo("#mo_anRg2", { scale: 0.4, opacity: 0.8, svgOrigin: "540 1090" }, { scale: 3.0, opacity: 0, duration: 0.7, ease: "power1.out", immediateRender: false }, t + 0.12 + i * 0.45);
      }
      return "body";
    }
    if (mode === "leak") {                   // teplo unika: vlnky stupaju z tela, ziara zhasne, tvar zmodrie
      var g = PF.svg("M"), id = uid("mo_anLk"), tEnd = Math.min(t + (o.hold || 2.0), (t1 || 1e9) - 0.12), rr = PF.rnd(5200 + Math.round(t * 10));
      var pts = [headPt(392, 700), headPt(688, 700), upPt([400, 990]), upPt([680, 990]), upPt([430, 1180]), upPt([650, 1180])], D = Math.max(0.45, Math.min(0.75, (tEnd - t) / 1.3));
      for (i = 0; i < 12; i++) {
        var q = pts[i % pts.length], wid = id + "w" + i, tw = t + 0.05 + (i * 0.17) % Math.max(0.2, tEnd - t - D - 0.05);
        if (tw + D > tEnd + 0.01) continue;
        var x0 = q[0] + (rr() - 0.5) * 30, y0 = q[1];
        PF.el("path", { id: wid, d: "M0 0 q-12 -18 0 -34 q12 -16 0 -32 q-12 -16 0 -32", stroke: i % 3 ? WARM : "#ffd27a", "stroke-width": 8, "stroke-linecap": "round", fill: "none", opacity: 0,
          transform: "translate(" + x0.toFixed(0) + " " + y0.toFixed(0) + ")" }, g);
        tl.fromTo("#" + wid, { attr: { transform: "translate(" + x0.toFixed(0) + " " + y0.toFixed(0) + ")" } },
          { attr: { transform: "translate(" + (x0 + (rr() - 0.5) * 40).toFixed(0) + " " + (y0 - 110).toFixed(0) + ")" }, duration: D, ease: "power1.out", immediateRender: false }, tw);
        tl.fromTo("#" + wid, { opacity: 0 }, { opacity: 0.95, duration: 0.2, ease: "none", immediateRender: false }, tw);
        PF.O("#" + wid, 0.95, 0, tw + D * 0.6, D * 0.4);
      }
      if (s.glow) { Hr.heat(false, t + 0.3, 1.0); s.glow = 0; }
      if (w.ch) { PF.O("#mo_anCh", w.ch, 0, t + 0.2, 0.8); w.ch = 0; }
      tint(0.28, t + 0.5, 0.8);
      R.setFace(t + 0.35, "worried"); faceBack();
      return "body";
    }
    return null;
  };

  // ================= VESSEL (rez kozou)
  M.vessel = function (t, mode, t1, o) {
    o = o || {}; var u = UI(), i, Hr = C().hero, SZ = 460;
    if (!st.anvs) {
      var fl = "", dots = "", waves = "", rr = PF.rnd(6100);
      for (i = 0; i < 5; i++) { var fx = 30 + i * 56 + rr() * 10, fy = 16 + rr() * 14;
        fl += '<path d="M' + fx.toFixed(0) + ' ' + (fy - 6).toFixed(0) + ' v12 M' + (fx - 5).toFixed(0) + ' ' + (fy - 3).toFixed(0) + ' l10 6 M' + (fx + 5).toFixed(0) + ' ' + (fy - 3).toFixed(0) + ' l-10 6"/>'; }
      for (i = 0; i < 7; i++) dots += '<circle id="mo_anVd' + i + '" cx="0" cy="0" r="6" fill="#ffd0c4" opacity="0"/>';
      // vlnky tepla: zacinaju v kozi (y 150) a stupaju do studeneho vzduchu
      for (i = 0; i < 5; i++) waves += '<path id="mo_anVh' + i + '" d="M' + (44 + i * 48) + ' 156 q-8 -12 0 -24 q8 -12 0 -24 q-8 -12 0 -24" fill="none" stroke="#f0601e" stroke-width="10" stroke-linecap="round" opacity="0"/>';
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right" id="mo_anVs" style="top:' + (o.y || 600) + 'px;padding-right:24px"><div id="mo_anVsIn" style="position:relative;width:' + SZ + 'px;height:' + SZ + 'px;border-radius:50%;overflow:hidden;' +
        'border:14px solid var(--paper);box-shadow:0 10px 0 rgba(90,42,26,.25);background:#cfe3f7"><svg viewBox="0 0 280 280" style="position:static;display:block;width:' + SZ + 'px;height:' + SZ + 'px">' +
        '<rect width="280" height="110" fill="#cfe3f7"/><g stroke="#ffffff" stroke-width="3" stroke-linecap="round">' + fl + '</g>' +
        '<text x="140" y="74" style="font-family:Hand;font-weight:700;font-size:27px;letter-spacing:2px;text-anchor:middle;fill:#2f5f98;stroke:#cfe3f7;stroke-width:6px;paint-order:stroke">COLD AIR</text>' +
        '<path d="M0 108 Q 35 100 70 108 T 140 108 T 210 108 T 280 108 V 146 H0 Z" fill="#eeb08c"/><rect y="144" width="280" height="136" fill="#f8d6c0"/>' +
        '<text x="140" y="138" style="font-family:Hand;font-weight:700;font-size:22px;letter-spacing:3px;text-anchor:middle;fill:#7a2f18">SKIN</text>' +
        '<rect x="78" y="190" width="14" height="50" fill="#c43a30"/><rect x="188" y="190" width="14" height="50" fill="#c43a30"/>' +
        '<rect x="-10" y="232" width="300" height="26" rx="13" fill="#b8342a"/>' +
        '<rect id="mo_anVg" x="-10" y="150" width="300" height="70" fill="url(#mo_anGw)" opacity="0"/>' +
        '<rect id="mo_anVv" x="-10" y="186" width="300" height="8" rx="4" fill="' + RED + '" stroke="#a8261c" stroke-width="3"/>' +
        dots + waves + '</svg></div></div>');
      st.anvs = { on: false, open: false, sh: false, busy: 0 };
      R.dirty("anvessel", function (tt, d) {
        var v = st.anvs; tt = Math.max(tt, v.busy || 0);   // undo az po dobehnuti vlastnych tweenov
        if (v.on) PF.O("#mo_anVs", 1, 0, tt, d ? 0.2 : 0.01); v.on = false;
        if (v.sh) { C().hero.move(0, 0, 0, tt, d ? 0.35 : 0, "power2.inOut"); v.sh = false; }
      });
    }
    var v = st.anvs;
    if (mode === "show") {
      if (!v.on) { PF.O("#mo_anVs", 0, 1, t, 0.08); v.on = true; }
      if (!v.sh) { Hr.move(-265, 0, 0, t, 0.4, "power2.inOut"); v.sh = true; }   // postava ustupi dolava, vyrez vpravo nezakryje tvar
      tl.fromTo("#mo_anVsIn", { scale: 0.3, rotation: 10 }, { scale: 1, rotation: 2, duration: 0.34, ease: "back.out(2)", immediateRender: false }, t);
      v.busy = Math.max(v.busy, t + 0.42);
      return null;
    }
    if (mode === "open") {                   // cieva pod kozou sa vyrazne roztiahne a rozziari
      tl.fromTo("#mo_anVv", { attr: { y: 186, height: 8 } }, { attr: { y: 160, height: 58 }, duration: 0.5, ease: "back.out(1.6)", immediateRender: false }, t);
      PF.O("#mo_anVg", 0, 0.9, t + 0.1, 0.4);
      tl.fromTo("#mo_anVsIn", { scale: 1.08 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.1);
      v.open = true; v.busy = Math.max(v.busy, t + 0.55);
      return null;
    }
    if (mode === "flow") {                   // krv tecie cievou, teplo prechadza kozou do studeneho vzduchu
      var dur = Math.max(0.8, Math.min(o.dur || 1.6, (t1 || 1e9) - t - 0.1)), cy = 189;
      for (i = 0; i < 7; i++) {
        var td = t + i * 0.12, rep = Math.max(0, Math.floor((dur - i * 0.12) / 0.7) - 1);
        PF.S("#mo_anVd" + i, { opacity: 1 }, td);
        tl.fromTo("#mo_anVd" + i, { x: -20, y: cy + (i % 3 - 1) * 12 }, { x: 300, y: cy + (i % 3 - 1) * 12, duration: 0.7, ease: "none", repeat: rep, immediateRender: false }, td);
        PF.S("#mo_anVd" + i, { opacity: 0 }, td + 0.7 * (rep + 1));
        v.busy = Math.max(v.busy, td + 0.7 * (rep + 1));
      }
      for (i = 0; i < 5; i++) {
        var th = t + 0.1 + i * 0.16, r2 = Math.max(0, Math.floor((dur - 0.1 - i * 0.16) / 0.75) - 1);
        tl.fromTo("#mo_anVh" + i, { y: 0, opacity: 1 }, { y: -110, opacity: 0, duration: 0.75, ease: "power1.out", repeat: r2, immediateRender: false }, th);
        v.busy = Math.max(v.busy, th + 0.75 * (r2 + 1));
      }
      return null;
    }
    if (mode === "off") {
      var tf = Math.max(t, v.busy);
      if (v.on) { PF.O("#mo_anVs", 1, 0, tf, 0.15); v.on = false; }
      if (v.sh) { Hr.move(0, 0, 0, tf, 0.4, "power2.inOut"); v.sh = false; }
      return null;
    }
    return null;
  };

  // ================= CORE (teplomer vnutornej teploty)
  M.core = function (t, mode, t1, o) {
    o = o || {}; var u = UI(), Y = function (q) { return (12 + 340 * (1 - q)).toFixed(1); }, i;
    if (!st.anco) {
      var v0 = 0.82, ym = Y(0.22);
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-left mo-meter" id="mo_anCo" style="top:' + (o.y || 600) + 'px"><div class="mo-paper" id="mo_anCoIn"><span class="mo-lbl">CORE<br>TEMP</span>' +
        '<svg viewBox="0 0 236 430" style="width:236px"><defs><clipPath id="mo_anCoC"><rect x="44" y="12" width="36" height="340" rx="18"/></clipPath></defs>' +
        '<rect x="44" y="12" width="36" height="340" rx="18" fill="#ffffff"/><g clip-path="url(#mo_anCoC)"><rect id="mo_anCoW" x="44" y="' + Y(v0) + '" width="36" height="430" fill="' + RED + '"/></g>' +
        '<circle id="mo_anCoB" cx="62" cy="382" r="40" fill="' + RED + '" stroke="' + INK + '" stroke-width="7"/>' +
        '<rect x="44" y="12" width="36" height="340" rx="18" fill="none" stroke="' + INK + '" stroke-width="7"/>' +
        '<path d="M88 70 h14 M88 140 h14 M88 210 h14 M88 280 h14" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
        '<path id="mo_anCoM" d="M28 ' + ym + ' h74" stroke="#2f629a" stroke-width="6" stroke-dasharray="10 7" opacity="0"/>' +
        '<text id="mo_anCoT1" x="106" y="' + (+ym - 8) + '" style="font-family:Pop;font-weight:600;font-size:46px;fill:#2f629a;stroke:#fbf5ea;stroke-width:12px;paint-order:stroke" opacity="0">86°F</text>' +
        '<text id="mo_anCoT2" x="106" y="' + (+ym + 44) + '" style="font-family:Pop;font-weight:600;font-size:46px;fill:#2f629a;stroke:#fbf5ea;stroke-width:12px;paint-order:stroke" opacity="0">30°C</text>' +
        '<g id="mo_anCoF" opacity="0" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"><path d="M50 30 l10 14 l-6 16 M74 52 l-8 12 M48 120 l12 10 M76 160 l-10 12 l6 12"/></g></svg></div></div>');
      st.anco = { v: v0, blue: false, on: false };
      R.dirty("ancore", function (tt, d) { if (st.anco.on) PF.O("#mo_anCo", 1, 0, tt, d ? 0.2 : 0.01); st.anco.on = false; });
    }
    var c = st.anco;
    var level = function (v, tt, dur) {
      tl.fromTo("#mo_anCoW", { attr: { y: Y(c.v) } }, { attr: { y: Y(v) }, duration: dur, ease: "power1.inOut", immediateRender: false }, tt);
      var blue = v < 0.5;
      if (blue !== c.blue) {
        tl.fromTo("#mo_anCoW, #mo_anCoB", { fill: blue ? RED : "#4f86d0" }, { fill: blue ? "#4f86d0" : RED, duration: 0.4, ease: "none", immediateRender: false }, tt + dur * 0.4); c.blue = blue; }
      c.v = v;
      for (var k = 0; k < 2; k++) { var ts = tt + dur * 0.6 + k * 0.45;
        tl.fromTo("#mo_anCoIn", { x: -6 }, { x: 6, duration: 0.05, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, ts); PF.S("#mo_anCoIn", { x: 0 }, ts + 0.31); }
    };
    if (mode === "show") {
      if (!c.on) { PF.O("#mo_anCo", 0, 1, t, 0.08); c.on = true; }
      tl.fromTo("#mo_anCoIn", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.32, ease: "back.out(2)", immediateRender: false }, t);
      return null;
    }
    if (String(mode) === "86") {             // klesne na znacku: 86°F a 30°C (v strede vety "about eighty six degrees")
      level(0.22, t, 0.9);
      PF.O("#mo_anCoM", 0, 1, t, 0.15);
      PF.O("#mo_anCoT1", 0, 1, t + 0.45, 0.06); tl.fromTo("#mo_anCoT1", { scale: 0.3, svgOrigin: "106 " + Y(0.22) }, { scale: 1, svgOrigin: "106 " + Y(0.22), duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t + 0.45);
      PF.O("#mo_anCoT2", 0, 1, t + 0.8, 0.06); tl.fromTo("#mo_anCoT2", { scale: 0.3, svgOrigin: "106 " + (+Y(0.22) + 30) }, { scale: 1, svgOrigin: "106 " + (+Y(0.22) + 30), duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t + 0.8);
      PF.O("#mo_anCoF", 0, 1, t + 1.1, 0.5);
      return null;
    }
    var nv = +mode;
    if (!isNaN(nv)) level(Math.max(0.05, Math.min(1, nv)), t, o.dur || 0.8);
    return null;
  };

  // ================= CHILL (triaska a vnutorne kurenie)
  function buildChill() {
    if (st.anch) return;
    var p = C().hero.p;
    document.getElementById(p + "up").insertAdjacentHTML("beforeend",
      '<g id="mo_anSv" opacity="0" fill="none" stroke="#eef5ff" stroke-width="9" stroke-linecap="round"><path d="M350 900 q-22 40 0 80 M318 876 q-32 64 0 128"/>' +
      '<path d="M730 900 q22 40 0 80 M762 876 q32 64 0 128"/><path d="M372 1110 q-16 30 0 60 M708 1110 q16 30 0 60"/></g>');
    document.getElementById(p + "head").insertAdjacentHTML("beforebegin",
      '<g id="mo_anHt" opacity="0"><circle cx="540" cy="1080" r="74" fill="url(#mo_anGw)"/>' +
      '<g id="mo_anHtF"><path d="M540 1010 C 566 1044 584 1066 584 1092 A44 44 0 0 1 496 1092 C 496 1070 512 1058 522 1036 C 528 1056 536 1060 544 1062 C 548 1046 546 1028 540 1010 Z" fill="#ff7a2c" stroke="#ffffff" stroke-width="5"/>' +
      '<path d="M540 1060 C 556 1076 562 1088 562 1100 A22 22 0 0 1 518 1100 C 518 1086 528 1076 540 1060 Z" fill="#ffd34d"/></g>' +
      '<circle id="mo_anHr" cx="540" cy="1080" r="96" fill="none" stroke="#ffd34d" stroke-width="8" stroke-dasharray="20 14" opacity="0"/>' +
      '<text id="mo_anHl" x="540" y="1250" style="font-family:Pop;font-weight:600;font-size:54px;text-anchor:middle;fill:#a8261c;stroke:#fbf5ea;stroke-width:14px;paint-order:stroke" opacity="0">YOUR HEATER</text>' +
      '<g id="mo_anSm" opacity="0" fill="none" stroke="#b9c2cf" stroke-width="9" stroke-linecap="round"><path d="M540 1000 q-14 -22 0 -42 q14 -20 0 -40"/><path d="M566 1010 q-12 -18 0 -34 q12 -16 0 -32"/></g></g>');
    PF.P("mo_anSv", 540, 1000); PF.P("mo_anHtF", 540, 1130, { s: 0.2 }); PF.P("mo_anSm", 550, 980);
    st.anch = { ht: 0, frost: false, stop: false };
  }
  function shiver(t, dur, amp, per, s) {    // trasenie trupu + ciary okolo tela (len v okne t .. t+dur)
    var Hr = C().hero, p = Hr.p, n = Math.max(3, Math.round(dur / (2 * per))) * 2 - 1;
    PF.X("mo_anSv", { s: s }, t, 0);
    PF.O("#mo_anSv", 0, s > 0.9 ? 1 : 0.7, t, 0.1); PF.O("#mo_anSv", s > 0.9 ? 1 : 0.7, 0, t + dur - 0.1, 0.1);
    PF.XY(p + "up", { tx: amp }, t, per, "none", n);
  }
  M.chill = function (t, mode, t1, o) {
    o = o || {}; buildChill(); var Hr = C().hero, p = Hr.p, c = st.anch, room = Math.max(0.5, (t1 || 1e9) - t - 0.12);
    R.dirty("anchill", function (tt, d) {
      // undo az po dobehnuti nabehu (inak pri postupnom prehravani prepise koniec nabehu zhasnutie)
      var q = d ? 0.3 : 0.01; tt = Math.max(tt, c.busy || 0);
      if (c.ht) { PF.O("#mo_anHt", 1, 0, tt, q); c.ht = 0; }
      if (c.frost) { PF.fx.frost(false, tt, q); c.frost = false; }
      if (c.stop) { PF.X(p + "head", { r: 0 }, tt, d ? 0.3 : 0); c.stop = false; }
      tint(0, tt, q);
    });
    if (mode === "on" || mode === "weak") {
      var weak = mode === "weak", dur = Math.min(o.dur || 2.4, room);
      shiver(t, dur, weak ? 3 : 6, weak ? 0.055 : 0.03, weak ? 0.75 : 1);
      if (!weak) { Hr.puff(t + 0.3); R.setFace(t, "worried"); }
      if (weak && c.ht) {                    // kurenie slabne: plamienok sa zmensi a blika
        PF.X("mo_anHtF", { s: 0.55 }, t + 0.1, 0.5, "power2.inOut");
        PF.XY("mo_anHtF", { sy: 0.45 }, t + 0.6, 0.12, "sine.inOut", Math.max(1, Math.round((dur - 0.7) / 0.24)) * 2 - 1);
      }
      return "body";
    }
    if (mode === "heater") {                 // plamienok v hrudi: triaska = tvoje kurenie
      var hold = Math.min(o.hold || 1.3, room + (o.over || 0));
      if (!c.ht) { PF.O("#mo_anHt", 0, 1, t, 0.1); c.ht = 1; }
      PF.X("mo_anHtF", { s: 1 }, t, 0.35, "back.out(2.2)");
      PF.XY("mo_anHtF", { sy: 0.88 }, t + 0.35, 0.1, "sine.inOut", Math.max(1, Math.round((hold - 0.4) / 0.2)) * 2 - 1);
      PF.O("#mo_anHr", 0, 1, t + 0.1, 0.1);
      tl.fromTo("#mo_anHr", { rotation: 0, svgOrigin: "540 1080" }, { rotation: 90, svgOrigin: "540 1080", duration: hold, ease: "none", immediateRender: false }, t + 0.1);
      PF.O("#mo_anHr", 1, 0, t + hold, 0.15);
      PF.O("#mo_anHl", 0, 1, t + 0.15, 0.06);
      tl.fromTo("#mo_anHl", { scale: 0.3, svgOrigin: "540 1236" }, { scale: 1, svgOrigin: "540 1236", duration: 0.3, ease: "back.out(2.2)", immediateRender: false }, t + 0.15);
      PF.O("#mo_anHl", 1, 0, t + hold, 0.15);
      return "body";
    }
    if (mode === "stop") {                   // triaska prestane: plamienok zhasne, namraza, modra tvar, hlava klesne
      if (c.ht) {
        PF.X("mo_anHtF", { s: 0.05 }, t, 0.35, "power2.in"); PF.O("#mo_anHt", 1, 0, t + 0.3, 0.1); c.ht = 0;
        PF.O("#mo_anSm", 0, 1, t + 0.25, 0.1); PF.X("mo_anSm", { ty: -70 }, t + 0.25, 0.9, "power1.out"); PF.O("#mo_anSm", 1, 0, t + 0.75, 0.4); PF.X("mo_anSm", { ty: 0 }, t + 1.2, 0);
      }
      var fd = Math.max(0.3, Math.min(0.8, room - 0.1));
      PF.fx.frost(true, t + 0.1, fd); c.frost = true;
      tint(0.42, t + 0.1, Math.min(0.6, fd));
      c.busy = t + Math.max(0.95, 0.1 + fd);
      PF.X(p + "head", { r: -6 }, t + 0.2, 0.7, "power2.inOut"); c.stop = true;
      R.setFace(t + 0.15, "tired"); faceBack();
      PF.punch(t + 0.05, 1.02);
      return "body";
    }
    return null;
  };

  // ================= CAMP (rady: karimatka, ciapka a saal, sucho, teple jedlo)
  M.camp = function (t, mode, t1, o) {
    o = o || {}; var Hr = C().hero, p = Hr.p, a0 = C().arms0, room = Math.max(0.5, (t1 || 1e9) - t - 0.12), i, g, id;
    if (mode === "pad") {                    // karimatka sa vysunie zlava, postava na nu vyskoci
      if (!st.anpd) {
        var rib = ""; for (i = 0; i < 8; i++) rib += "M" + (404 + i * 40) + " 1432 v30 ";
        document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_anPd" opacity="0"><ellipse cx="540" cy="1470" rx="190" ry="12" fill="#3a4f7a" opacity="0.45"/>' +
          '<g filter="url(#cut)"><rect x="372" y="1426" width="336" height="42" rx="14" fill="#3f7fbf"/><path d="' + rib + '" stroke="#2f629a" stroke-width="6" stroke-linecap="round"/>' +
          '<rect x="372" y="1426" width="336" height="12" rx="6" fill="#6aa4dd"/></g></g>');
        PF.P("mo_anPd", 540, 1446, { tx: -760 });
        st.anpd = true;
      }
      PF.O("#mo_anPd", 0, 1, t, 0.04); PF.X("mo_anPd", { tx: 0 }, t + 0.02, 0.4, "power3.out");
      Hr.shadow(false, t + 0.12); Hr.move(0, -116, 0, t + 0.12, 0.22, "power2.out"); Hr.move(0, -40, 0, t + 0.36, 0.16, "power2.in"); H.shake(t + 0.52, 0.15, 6);
      PF.XY(p + "up", { sy: 0.96 }, t + 0.52, 0.08, "sine.inOut", 1);
      R.dirty("anpad", function (tt, d) { var q = d ? 0.25 : 0;
        Hr.move(0, 0, 0, tt, q); PF.O("#mo_anPd", 1, 0, tt, q || 0.01); PF.X("mo_anPd", { tx: -760 }, tt + q + 0.02, 0); Hr.shadow(true, tt + q); });
      return "body";
    }
    if (mode === "block") {                  // karta vpravo: chlad zo zeme narazi do karimatky, nohy ostanu v teple
      var u = UI(); id = uid("mo_anBk"); var te = Math.min(t + (o.hold || 2.2), (t1 || 1e9) - 0.15 + (o.over || 0)), ar = "";
      for (i = 0; i < 3; i++) ar += '<g id="' + id + 'a' + i + '" opacity="0"><path d="M' + (60 + i * 50) + ' 214 v-50 M' + (42 + i * 50) + ' 182 l18 -18 l18 18" fill="none" stroke="#2f6fc0" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>';
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="' + id + '" style="top:' + (o.y || 620) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "COLD GROUND") + '</span>' +
        '<svg viewBox="0 0 220 270"><defs><clipPath id="' + id + 'C"><rect x="4" y="4" width="212" height="262" rx="18"/></clipPath></defs><g clip-path="url(#' + id + 'C)">' +
        '<rect width="220" height="270" fill="#1b2d5c"/><rect y="156" width="220" height="114" fill="#dbe6f6"/><path d="M0 158 q55 -8 110 0 t110 0" fill="#ffffff"/>' +
        '<ellipse id="' + id + 'w" cx="110" cy="100" rx="90" ry="56" fill="url(#mo_anGw)" opacity="0"/>' +
        '<rect x="56" y="20" width="38" height="98" rx="14" fill="#3b4f86"/><rect x="126" y="20" width="38" height="98" rx="14" fill="#3b4f86"/>' +
        '<rect x="38" y="108" width="62" height="30" rx="14" fill="#f4efe2"/><rect x="120" y="108" width="62" height="30" rx="14" fill="#f4efe2"/>' +
        '<rect x="20" y="136" width="180" height="22" rx="8" fill="#3f7fbf" stroke="#2f629a" stroke-width="4"/>' + ar +
        '<circle id="' + id + 'k" cx="110" cy="162" r="18" fill="#ffffff" opacity="0"/></g>' +
        '<rect x="4" y="4" width="212" height="262" rx="18" fill="none" stroke="#2b2320" stroke-width="7"/></svg></div></div>');
      PF.O("#" + id, 0, 1, t, 0.08);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      for (i = 0; i < 3; i++) {             // sipky chladu stupaju zo snehu, narazia do karimatky a odrazia sa
        var ta = t + 0.35 + i * 0.25, aid = "#" + id + "a" + i;
        PF.O(aid, 0, 1, ta, 0.05);
        tl.fromTo(aid, { y: 70 }, { y: 0, duration: 0.25, ease: "power1.in", immediateRender: false }, ta);
        tl.fromTo(aid, { y: 0 }, { y: 40, duration: 0.3, ease: "power1.out", immediateRender: false }, ta + 0.25);
        PF.O(aid, 1, 0, ta + 0.3, 0.25);
        tl.fromTo("#" + id + "k", { opacity: 0.9, scale: 0.4, svgOrigin: (60 + i * 50) + " 162" }, { opacity: 0, scale: 1.6, svgOrigin: (60 + i * 50) + " 162", duration: 0.25, ease: "power1.out", immediateRender: false }, ta + 0.25);
      }
      PF.O("#" + id + "w", 0, 0.9, t + 1.1, 0.4);
      PF.O("#" + id, 1, 0, te, 0.15);
      PF.XY(p + "up", { sy: 1.03 }, t + 1.1, 0.2, "sine.inOut", 1);
      R.setFace(t + 1.1, "smile"); faceBack();
      return null;
    }
    if (mode === "wrap") {                   // ciapka dopadne na hlavu, saal sa ovinie okolo krku
      if (!st.anwr) {
        document.getElementById(p + "head").insertAdjacentHTML("beforeend", '<g id="mo_anHat" opacity="0"><g filter="url(#cut)">' +
          '<path d="M374 744 C 374 610 452 566 540 566 C 628 566 706 610 706 744 Z" fill="' + RED + '"/>' +
          '<path d="M420 640 q16 -40 30 -60 M480 600 v-30 M600 600 v-30 M660 640 q-16 -40 -30 -60" stroke="#b8342a" stroke-width="6" stroke-linecap="round" fill="none"/>' +
          '<rect x="362" y="690" width="356" height="62" rx="26" fill="#b8342a"/><path d="M398 700 v42 M438 700 v42 M478 700 v42 M518 700 v42 M558 700 v42 M598 700 v42 M638 700 v42 M678 700 v42" stroke="#9c2a22" stroke-width="6" stroke-linecap="round"/>' +
          '<circle cx="540" cy="556" r="36" fill="#fbf5ea"/></g></g>');
        document.getElementById(p + "head").insertAdjacentHTML("beforebegin", '<g id="mo_anSc" opacity="0"><g filter="url(#cut)">' +
          '<g id="mo_anScT"><path d="M600 960 L 650 1150 L 600 1158 L 566 966 Z" fill="#2f8f8a"/><path d="M604 1120 l42 -6 M610 1140 l40 -6" stroke="#f6d36b" stroke-width="6"/></g>' +
          '<rect x="420" y="930" width="240" height="64" rx="30" fill="#3aa39d"/><path d="M450 940 v44 M490 938 v48 M530 938 v48 M570 938 v48 M610 938 v48" stroke="#2f8f8a" stroke-width="6" stroke-linecap="round"/></g></g>');
        PF.P("mo_anHat", 540, 690, { ty: -700, r: -24 }); PF.P("mo_anSc", 540, 962, { sx: 0.05 }); PF.P("mo_anScT", 584, 962, { sy: 0 });
        st.anwr = true;
      }
      PF.O("#mo_anHat", 0, 1, t, 0.05); PF.X("mo_anHat", { ty: 0, r: 0 }, t, 0.42, "bounce.out");
      PF.XY(p + "head", { ty: 9 }, t + 0.18, 0.07, "sine.inOut", 1);
      var ts = t + (o.neck || 0.85);
      PF.O("#mo_anSc", 0, 1, ts, 0.05); PF.X("mo_anSc", { sx: 1 }, ts, 0.3, "back.out(1.8)"); PF.X("mo_anScT", { sy: 1 }, ts + 0.22, 0.3, "back.out(2)");
      R.setFace(ts + 0.3, "smile"); faceBack();
      R.dirty("anwrap", function (tt, d) { var q = d ? 0.2 : 0;
        PF.O("#mo_anHat", 1, 0, tt, q || 0.01); PF.X("mo_anHat", { ty: -700, r: -24 }, tt + q + 0.02, 0);
        PF.O("#mo_anSc", 1, 0, tt, q || 0.01); PF.X("mo_anSc", { sx: 0.05 }, tt + q + 0.02, 0); PF.X("mo_anScT", { sy: 0 }, tt + q + 0.02, 0); });
      return "body";
    }
    if (mode === "dry") {                    // mokre fliaky na mikine: otrasie sa, kvapky odletia, fliaky zmiznu, iskricky
      g = PF.svg("M"); id = uid("mo_anDr"); var td = t + (o.dry || 0.5), rr = PF.rnd(7300);
      document.getElementById(p + "head").insertAdjacentHTML("beforebegin", '<g id="' + id + '" opacity="0" fill="#2f4a7a">' +
        '<ellipse cx="480" cy="1060" rx="34" ry="26" opacity="0.35"/><ellipse cx="596" cy="1130" rx="40" ry="30" opacity="0.35"/><ellipse cx="520" cy="1210" rx="30" ry="22" opacity="0.35"/>' +
        '<path d="M470 1240 c6 10 8 15 0 20 c-8 -5 -6 -10 0 -20 Z M610 1250 c6 10 8 15 0 20 c-8 -5 -6 -10 0 -20 Z" fill="#7cc4f2"/></g>');
      PF.O("#" + id, 0, 1, t, 0.1);
      PF.XY(p + "up", { r: 3 }, td - 0.05, 0.06, "sine.inOut", 5);
      PF.O("#" + id, 1, 0, td + 0.1, 0.3);
      var c0 = upPt([540, 1120]);
      for (i = 0; i < 8; i++) {              // kvapky odstrknu do stran
        var did = id + "d" + i, a = (i / 8) * Math.PI * 2, x1 = c0[0] + Math.cos(a) * 230, y1 = c0[1] + Math.sin(a) * 200;
        PF.el("path", { id: did, d: "M0 -12 C 7 -2 10 3 10 7 A10 10 0 0 1 -10 7 C -10 3 -7 -2 0 -12 Z", fill: "#7cc4f2", stroke: "#ffffff", "stroke-width": 3, opacity: 0 }, g);
        PF.S("#" + did, { opacity: 1 }, td);
        tl.fromTo("#" + did, { x: c0[0], y: c0[1] }, { x: x1, y: y1 + 40, duration: 0.45, ease: "power2.out", immediateRender: false }, td);
        PF.S("#" + did, { opacity: 0 }, td + 0.45);
      }
      for (i = 0; i < 5; i++) {              // iskricky = suche
        var kid = id + "k" + i, q = upPt([440 + rr() * 200, 1020 + rr() * 220]), tk = td + 0.3 + i * 0.07;
        PF.el("path", { id: kid, d: "M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z", fill: "#ffffff", opacity: 0 }, g);
        tl.fromTo("#" + kid, { x: q[0], y: q[1], scale: 0.3, opacity: 1 }, { x: q[0], y: q[1], scale: 1.3, opacity: 0, duration: 0.45, ease: "power1.out", immediateRender: false }, tk);
      }
      R.setFace(td + 0.35, "smile"); faceBack();
      return "body";
    }
    if (mode === "soup") {                   // misa teplej polievky v oboch rukach, para stupa
      if (!st.ansp) {
        var cut = document.getElementById(p + "armL");
        cut.insertAdjacentHTML("beforebegin", '<g id="mo_anBw" opacity="0"><g id="mo_anStm" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.85">' +
          '<path id="mo_anSt0" d="M500 1080 q-12 -18 0 -36 q12 -18 0 -36"/><path id="mo_anSt1" d="M540 1070 q-12 -18 0 -36 q12 -18 0 -36"/><path id="mo_anSt2" d="M580 1080 q-12 -18 0 -36 q12 -18 0 -36"/></g>' +
          '<g filter="url(#cut)"><ellipse cx="540" cy="1102" rx="98" ry="22" fill="#e07a2c"/><path d="M442 1102 Q 446 1180 540 1182 Q 634 1180 638 1102 Z" fill="#f4efe2"/>' +
          '<path d="M448 1126 Q 540 1146 632 1126" stroke="#3f7fbf" stroke-width="8" fill="none"/><ellipse cx="540" cy="1102" rx="98" ry="22" fill="none" stroke="#f4efe2" stroke-width="7"/></g></g>');
        PF.P("mo_anBw", 540, 1140, { s: 0.3 });
        st.ansp = true;
      }
      var hs = Math.min(o.hold || 2.6, room + (o.over || 0));
      PF.O("#mo_anBw", 0, 1, t, 0.06); PF.X("mo_anBw", { s: 1 }, t, 0.35, "back.out(2)");
      Hr.arm("L", -16, t, 0.3, "back.out(1.4)"); Hr.arm("R", 16, t, 0.3, "back.out(1.4)");
      for (i = 0; i < 3; i++) tl.fromTo("#mo_anSt" + i, { y: 0, opacity: 0.9 }, { y: -40, opacity: 0, duration: 0.8, ease: "power1.out", repeat: Math.max(0, Math.floor((hs - i * 0.25) / 0.8) - 1), immediateRender: false }, t + 0.2 + i * 0.25);
      R.dirty("ansoup", function (tt, d) { var q = d ? 0.25 : 0;
        PF.O("#mo_anBw", 1, 0, tt, q || 0.01); PF.X("mo_anBw", { s: 0.3 }, tt + q + 0.02, 0);
        Hr.arm("L", a0[0], tt, q || 0.01); Hr.arm("R", a0[1], tt, q || 0.01); });
      return "body";
    }
    if (mode === "eat") {                    // hlava sa sklopi k mise dvakrat (hlt), stastna tvar, vydych
      R.setFace(t, "happy"); Hr.eyes("eyesCl", t);
      PF.XY(p + "head", { ty: 16, r: -4 }, t, 0.16, "sine.inOut", 3);
      Hr.eyes("eyesHap", t + 0.7); Hr.puff(t + 0.75);
      faceBack();
      return "body";
    }
    if (mode === "kcal") {                   // plamienky z misy vojdu do tela: kalorie = palivo pre kurenie
      g = C().hero; id = uid("mo_anKc"); var tk2 = Math.min(t + 1.2, (t1 || 1e9) + 0.25), m = "";
      for (i = 0; i < 3; i++) m += '<path id="' + id + 'f' + i + '" d="M0 -26 C 13 -9 20 0 20 9 A20 20 0 0 1 -20 9 C -20 0 -13 -9 0 -26 Z" fill="#ff8a2c" stroke="#ffd34d" stroke-width="4" opacity="0" transform="translate(' + (500 + i * 40) + ' 1090)"/>';
      document.getElementById(p + "head").insertAdjacentHTML("beforebegin", '<g id="' + id + '">' + m +
        '<text id="' + id + 't" x="540" y="1270" style="font-family:Pop;font-weight:600;font-size:54px;text-anchor:middle;fill:#a8261c;stroke:#fbf5ea;stroke-width:14px;paint-order:stroke" opacity="0">CALORIES</text></g>');
      for (i = 0; i < 3; i++) { var tf = t + i * 0.18, fs = "#" + id + "f" + i;
        PF.O(fs, 0, 1, tf, 0.08);
        tl.fromTo(fs, { attr: { transform: "translate(" + (500 + i * 40) + " 1090)" } }, { attr: { transform: "translate(540 1010)" }, duration: 0.5, ease: "power1.in", immediateRender: false }, tf);
        PF.O(fs, 1, 0, tf + 0.42, 0.1); }
      buildWarm();
      PF.X("mo_anCh", { s: 0.6 }, t + 0.5, 0); PF.O("#mo_anCh", 0, 0.9, t + 0.5, 0.15); PF.X("mo_anCh", { s: 1.3 }, t + 0.5, 0.5, "power2.out"); PF.O("#mo_anCh", 0.9, 0, tk2 - 0.2, 0.25);
      PF.O("#" + id + "t", 0, 1, t + 0.1, 0.06);
      tl.fromTo("#" + id + "t", { scale: 0.3, svgOrigin: "540 1256" }, { scale: 1, svgOrigin: "540 1256", duration: 0.3, ease: "back.out(2.2)", immediateRender: false }, t + 0.1);
      PF.O("#" + id + "t", 1, 0, tk2, 0.15);
      return "body";
    }
    return null;
  };
})();
