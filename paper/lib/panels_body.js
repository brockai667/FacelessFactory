// Close-up panely tela: obličky, krv (žila s krvinkami), srdce + EKG, mozog. Každý panel = celoobrazovkový papierový
// záber (PF.panel), ktorý epizóda odhalí cez PF.REVEAL / PF.SLIDE a skryje cez PF.WIPE / PF.HIDE.
PF.panelKidneys = function (z) {
  var s = PF.panel("cuKid", z || 2);
  s.insertAdjacentHTML("beforeend",
    '<defs><filter id="kcut" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="3" flood-color="#5a2a1a" flood-opacity="0.25"/></filter>' +
    '<clipPath id="bladClip"><path d="M430 1235 C 396 1240 378 1300 398 1360 C 420 1432 660 1432 682 1360 C 702 1300 684 1240 650 1235 Z"/></clipPath>' +
    '<radialGradient id="gKid" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#d9675d"/><stop offset="1" stop-color="#a83f39"/></radialGradient></defs>' +
    '<rect width="1080" height="1920" fill="#f4dccb"/><circle cx="540" cy="860" r="540" fill="#efcdb6"/>' +
    '<g fill="#fbe7da" opacity="0.7"><circle cx="160" cy="300" r="40"/><circle cx="930" cy="420" r="26"/><circle cx="120" cy="1500" r="30"/><circle cx="960" cy="1350" r="44"/></g>' +
    '<g filter="url(#kcut)"><path d="M440 870 C 450 1000 505 1110 520 1235" stroke="#e59c7f" stroke-width="44" fill="none" stroke-linecap="round"/>' +
    '<path d="M640 870 C 630 1000 575 1110 560 1235" stroke="#e59c7f" stroke-width="44" fill="none" stroke-linecap="round"/>' +
    '<path d="M430 1235 C 396 1240 378 1300 398 1360 C 420 1432 660 1432 682 1360 C 702 1300 684 1240 650 1235 Z" fill="#f2c0a4"/></g>' +
    '<g clip-path="url(#bladClip)"><rect id="bladW" x="380" y="1400" width="320" height="200" fill="url(#gWater)" fill-opacity="0.85"/></g><g id="drops"></g>' +
    '<g id="valve" filter="url(#kcut)"><circle id="valveC" cx="478" cy="1040" r="46" fill="#a9bccb" stroke="#5f7486" stroke-width="7"/>' +
    '<path d="M478 998 V1082 M436 1040 H520" stroke="#5f7486" stroke-width="8" stroke-linecap="round"/><circle cx="478" cy="1040" r="10" fill="#5f7486"/></g>' +
    [["kL", "translate(380 700)"], ["kR", "translate(700 700) scale(-1 1)"]].map(function (k) {
      return '<g transform="' + k[1] + '"><g id="' + k[0] + '"><g filter="url(#kcut)">' +
        '<path class="kb" d="M30 -170 C 150 -160 175 -40 105 10 C 70 36 78 96 108 124 C 128 176 20 200 -60 160 C -150 110 -160 -110 -70 -160 C -40 -176 0 -176 30 -170 Z" fill="url(#gKid)" stroke="#fbe0d8" stroke-width="6"/>' +
        '<path class="ki" d="M20 -110 C 100 -104 118 -30 70 6 C 46 24 52 64 72 84 C 86 118 14 134 -40 108 C -100 74 -106 -72 -46 -106 C -26 -116 0 -116 20 -110 Z" fill="#d46c62" opacity="0.8"/></g>' +
        '<path d="M-110 -80 q10 -40 50 -60" fill="none" stroke="#f0a198" stroke-width="10" stroke-linecap="round"/>' +
        '<g class="kfOk"><circle cx="-62" cy="-40" r="20" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/><circle cx="-8" cy="-40" r="20" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/>' +
        '<circle cx="-58" cy="-38" r="9" fill="#2b2320"/><circle cx="-4" cy="-38" r="9" fill="#2b2320"/>' +
        '<path class="kSm" d="M-54 10 Q -35 26 -16 10" fill="none" stroke="#2b2320" stroke-width="6" stroke-linecap="round"/>' +
        '<g class="kBrow" opacity="0"><path d="M-82 -70 L-44 -60 M-26 -60 L12 -70" stroke="#2b2320" stroke-width="7" stroke-linecap="round"/></g></g>' +
        '<g class="kfSick" opacity="0"><path d="M-82 -40 q20 12 40 0 M-28 -40 q20 12 40 0" fill="none" stroke="#2b2320" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M-58 16 q8 -8 14 0 t14 0 t14 0" fill="none" stroke="#2b2320" stroke-width="6" stroke-linecap="round"/>' +
        '<ellipse cx="-70" cy="-4" rx="14" ry="8" fill="#9fb35a" opacity="0.8"/><ellipse cx="4" cy="-4" rx="14" ry="8" fill="#9fb35a" opacity="0.8"/></g></g></g>';
    }).join("") +
    '<g id="cracks" fill="none" stroke="#4a2424" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path id="ck0" d="M300 560 l30 40 l-18 30 l34 44 l-10 36"/><path id="ck1" d="M430 760 l-30 26 l14 34 l-26 30"/>' +
    '<path id="ck2" d="M780 560 l-30 40 l18 30 l-34 44 l10 36"/><path id="ck3" d="M650 760 l30 26 l-14 34 l26 30"/></g>' +
    '<g id="warn" opacity="0" filter="url(#kcut)"><path d="M540 360 L620 500 L460 500 Z" fill="#f6c343" stroke="#fbf5ea" stroke-width="8" stroke-linejoin="round"/>' +
    '<rect x="532" y="400" width="16" height="56" rx="8" fill="#2b2320"/><circle cx="540" cy="476" r="9" fill="#2b2320"/></g>');
  ["ck0", "ck1", "ck2", "ck3"].forEach(function (c) { var e = document.getElementById(c), L = Math.ceil(e.getTotalLength());
    e.setAttribute("stroke-dasharray", L + " " + L); e.setAttribute("stroke-dashoffset", L); });
  PF.P("valve", 478, 1040); PF.P("kL", 0, 0); PF.P("kR", 0, 0);
  var dropsG = document.getElementById("drops"), dn = 0, bl = 1400;
  function drop(side, t, stop) {
    var x0 = side ? 635 : 445, x1 = side ? 562 : 518;
    var d = PF.el("path", { d: "M0 -18 C 10 -4 12 6 0 14 C -12 6 -10 -4 0 -18 Z", fill: "#3d97d3", stroke: "#ffffff", "stroke-width": 3, opacity: 0 }, dropsG);
    d.id = "kd" + (dn++); d.setAttribute("transform", "translate(" + x0 + " 905)"); PF.S("#" + d.id, { opacity: 1 }, t);
    if (!stop) {
      PF.tl.fromTo("#" + d.id, { attr: { transform: "translate(" + x0 + " 905)" } }, { attr: { transform: "translate(" + x1 + " 1225)" }, duration: 0.55, ease: "power1.in", immediateRender: false }, t);
      PF.S("#" + d.id, { opacity: 0 }, t + 0.56);
    }
    return d.id;
  }
  return {
    id: "cuKid",
    flow: function (t0, t1, every) { var t = t0, i = 0; while (t < t1) { drop(i % 2, t); i++; t += every; } },
    dropAt: function (side, t) { drop(side, t); },
    bladder: function (y, t, dur) { if (!dur) PF.S("#bladW", { attr: { y: y } }, t); else PF.AT("#bladW", { y: bl }, { y: y }, t, dur); bl = y; },
    valve: function (r, t, dur) { PF.X("valve", { r: r }, t, dur || 0.6); },
    valveRust: function (t) { PF.F("#valveC", "#a9bccb", "#b98a6a", t, 0.01); },
    face: function (kind, t) {              // ok | determined | sick
      PF.S("#cuKid .kBrow", { opacity: kind === "determined" ? 1 : 0 }, t);
      PF.S("#cuKid .kSm", { attr: { d: kind === "determined" ? "M-54 14 L -16 14" : "M-54 10 Q -35 26 -16 10" } }, t);
      PF.S("#cuKid .kfOk", { opacity: kind === "sick" ? 0 : 1 }, t); PF.S("#cuKid .kfSick", { opacity: kind === "sick" ? 1 : 0 }, t);
    },
    breathe: function (t) { PF.XY("kL", { s: 1.03 }, t, 0.5, "sine.inOut", 1); PF.XY("kR", { s: 1.03 }, t + 0.25, 0.5, "sine.inOut", 1); },
    lastDrop: function (tDown, tBack) {     // kvapka sa zastavi v polke, zaváha a vráti sa do obličky
      var id = drop(0, tDown - 0.05, true);
      PF.tl.fromTo("#" + id, { attr: { transform: "translate(445 905)" } }, { attr: { transform: "translate(496 1128)" }, duration: 0.3, ease: "power1.in", immediateRender: false }, tDown);
      PF.tl.fromTo("#" + id, { attr: { transform: "translate(496 1128)" } }, { attr: { transform: "translate(490 1128)" }, duration: 0.06, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, tDown + 0.3);
      PF.tl.fromTo("#" + id, { attr: { transform: "translate(496 1128)" } }, { attr: { transform: "translate(445 905)" }, duration: 0.3, ease: "power2.out", immediateRender: false }, tBack);
      PF.S("#" + id, { opacity: 0 }, tBack + 0.31);
      PF.X("kL", { s: 1.08 }, tBack + 0.25, 0.1, "power2.out"); PF.X("kL", { s: 1 }, tBack + 0.35, 0.3, "power2.in");
    },
    shake: function (t) { PF.XY("kL", { tx: -7 }, t, 0.05, "sine.inOut", 5); PF.XY("kR", { tx: -7 }, t, 0.05, "sine.inOut", 5); },
    fail: function (t) {                    // zošednú, prasknú, výstražný trojuholník
      PF.F("#cuKid .kb", "#c0504a", "#8f7482", t - 0.05, 0.7); PF.F("#cuKid .ki", "#d46c62", "#a58b97", t - 0.05, 0.7);
      ["ck0", "ck1", "ck2", "ck3"].forEach(function (c, i) { var L = +document.getElementById(c).getAttribute("stroke-dashoffset");
        PF.AT("#" + c, { "stroke-dashoffset": L }, { "stroke-dashoffset": 0 }, t + 0.05 + i * 0.1, 0.35, "power2.out"); });
      [0, 0.3, 0.6].forEach(function (d) { PF.O("#warn", 0, 1, t + 0.15 + d, 0.02); PF.O("#warn", 1, 0, t + 0.3 + d, 0.02); });
    }
  };
};

PF.panelBlood = function (z) {
  var s = PF.panel("cuBlood", z || 3);
  s.insertAdjacentHTML("beforeend",
    '<defs><filter id="bcut" x="-15%" y="-30%" width="130%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="3" flood-color="#5a2a1a" flood-opacity="0.25"/></filter>' +
    '<filter id="bblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>' +
    '<clipPath id="lumen"><rect x="-20" y="786" width="1120" height="348"/></clipPath>' +
    '<linearGradient id="gWallV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2847b"/><stop offset="1" stop-color="#c55f58"/></linearGradient></defs>' +
    '<rect width="1080" height="1920" fill="#f2cfc6"/><g filter="url(#bblur)" fill="#e6a79d" opacity="0.8"><circle cx="160" cy="380" r="120"/><circle cx="930" cy="1520" r="150"/><circle cx="900" cy="330" r="70"/><circle cx="200" cy="1500" r="90"/></g>' +
    '<g id="vessel"><rect id="plasma" x="-20" y="780" width="1120" height="360" fill="#f7dcd2"/>' +
    '<g clip-path="url(#lumen)"><g id="cellsA"></g><g id="cellsB" opacity="0"></g><g id="toxins"></g></g>' +
    '<g filter="url(#bcut)" fill="url(#gWallV)"><rect x="-40" y="690" width="1160" height="100" rx="44"/><rect x="-40" y="1130" width="1160" height="100" rx="44"/></g>' +
    '<g stroke="#f0aaa2" stroke-width="8" stroke-linecap="round"><path d="M80 718 H400 M560 718 H760 M180 1168 H480 M640 1168 H980"/></g></g>');
  PF.P("vessel", 540, 960);
  var plasma = "#f7dcd2";
  var api = {
    id: "cuBlood",
    cells: function (gid, n, dur, w0, w1, seed, dark) {   // krvinky pretekajú zľava doprava (konečný počet opakovaní)
      var g = document.getElementById(gid), rr = PF.rnd(seed);
      for (var i = 0; i < n; i++) {
        var y = 820 + rr() * 280, rot = Math.round(rr() * 60 - 30);
        var c = PF.el("g", {}, g); c.id = gid + "_" + seed + "_" + i;
        var inner = PF.el("g", { transform: "rotate(" + rot + ")" }, c);
        PF.el("ellipse", { cx: 0, cy: 0, rx: 48, ry: 40, fill: dark ? "#a93430" : "url(#gCell)", stroke: dark ? "#e0968d" : "#f5b3a8", "stroke-width": 4 }, inner);
        PF.el("ellipse", { cx: 0, cy: 0, rx: 24, ry: 18, fill: dark ? "#c24c44" : "#e05a50" }, inner);
        PF.el("ellipse", { cx: -16, cy: -14, rx: 10, ry: 6, fill: "#ffb3a8", opacity: 0.7 }, inner);
        var start = w0 - (i / n) * dur - rr() * 0.2, reps = Math.max(0, Math.floor((w1 - start) / dur));
        c.setAttribute("transform", "translate(-150 " + y.toFixed(1) + ")");
        if (dark) { PF.S("#" + c.id, { opacity: 0 }, 0.01); PF.S("#" + c.id, { opacity: 1 }, w0); }
        PF.tl.fromTo("#" + c.id, { attr: { transform: "translate(-150 " + y.toFixed(1) + ")" } }, { attr: { transform: "translate(1230 " + y.toFixed(1) + ")" },
          duration: dur, ease: "none", repeat: reps, immediateRender: false }, start);
      }
    },
    plasma: function (col, t, dur) { PF.F("#plasma", plasma, col, t, dur || 0.7); plasma = col; },
    thick: function (t) { PF.O("#cellsB", 0, 1, t - 0.1, 0.4); PF.O("#cellsA", 1, 0, t, 0.5); },
    onlyThick: function (t) { PF.O("#cellsA", 0, 0, t, 0); PF.O("#cellsB", 1, 1, t, 0); },
    pulse: function (times) { times.forEach(function (b) { PF.X("vessel", { s: 1.035 }, b - 0.02, 0.06, "power2.out"); PF.X("vessel", { s: 1 }, b + 0.04, 0.24, "power2.in"); }); },
    toxins: function (t0, t1, n, seed) {   // pichľavé zeleno-fialové guľky pribúdajú a unášajú sa
      var g = document.getElementById("toxins"), rr = PF.rnd(seed || 77);
      for (var i = 0; i < n; i++) {
        var x = 60 + rr() * 900, y = 830 + rr() * 260, r1 = 26 + rr() * 8, pts = "";
        for (var j = 0; j < 20; j++) { var a = j / 20 * Math.PI * 2, rad = j % 2 ? r1 * 0.6 : r1; pts += (x + Math.cos(a) * rad).toFixed(1) + "," + (y + Math.sin(a) * rad).toFixed(1) + " "; }
        var drift = PF.el("g", {}, g); drift.id = "tx" + i; var pop = PF.el("g", {}, drift); pop.id = "tp" + i;
        PF.el("polygon", { points: pts, fill: i % 3 ? "#8aa637" : "#7d5f9e", stroke: "#4f6320", "stroke-width": 3 }, pop);
        PF.el("circle", { cx: x, cy: y, r: 8, fill: "#4f6320" }, pop);
        PF.P("tp" + i, x, y, { s: 0 }); PF.P("tx" + i, x, y);
        var at = t0 + i * 0.07;
        PF.X("tp" + i, { s: 1 }, at, 0.25, "back.out(2.5)"); PF.X("tx" + i, { tx: 90 + rr() * 60, r: Math.round(rr() * 120 - 60) }, at, t1 - at, "none");
      }
    }
  };
  return api;
};

PF.panelHeart = function (z) {
  var s = PF.panel("cuHeart", z || 4);
  var rays = ""; [[520, -200, 560, -200], [1500, 400, 1520, 440], [1500, 1300, 1480, 1340], [560, 2000, 520, 2000], [-420, 1360, -440, 1320], [-420, 440, -400, 400],
    [1150, -200, 1190, -180], [-110, -200, -70, -220], [1180, 1980, 1140, 2000], [-100, 1980, -140, 1960]].forEach(function (r) { rays += '<path d="M540 880 L' + r[0] + ' ' + r[1] + ' L' + r[2] + ' ' + r[3] + ' Z"/>'; });
  s.insertAdjacentHTML("beforeend",
    '<defs><filter id="hcut" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="3" flood-color="#5a2a1a" flood-opacity="0.25"/></filter></defs>' +
    '<rect width="1080" height="1920" fill="#f7dac8"/><g id="rays" fill="#f3c9b0">' + rays + '</g><g id="pulses" fill="none" stroke="#e8776d" stroke-width="10"></g>' +
    '<g id="hLines" opacity="0" fill="none" stroke="#b8322c" stroke-width="9" stroke-linecap="round"><path d="M214 760 q-40 60 0 120"/><path d="M172 730 q-56 90 0 180"/><path d="M866 760 q40 60 0 120"/><path d="M908 730 q56 90 0 180"/></g>' +
    '<g id="bigHeart"><g filter="url(#hcut)"><path d="M500 690 C 486 620 500 580 532 560" stroke="#e9776c" stroke-width="40" fill="none" stroke-linecap="round"/>' +
    '<path d="M590 690 C 606 612 646 590 700 600" stroke="#e9776c" stroke-width="40" fill="none" stroke-linecap="round"/>' +
    '<path d="M540 1130 C 400 1030 250 930 262 800 C 272 690 360 640 440 660 C 490 672 524 710 540 740 C 556 710 590 672 640 660 C 720 640 808 690 818 800 C 830 930 680 1030 540 1130 Z" fill="url(#gHeart)" stroke="#fde3dc" stroke-width="10"/></g>' +
    '<path d="M320 800 C 328 736 372 702 420 706" fill="none" stroke="#f79289" stroke-width="18" stroke-linecap="round"/>' +
    '<circle cx="470" cy="862" r="36" fill="#fffdf8" stroke="#2b2320" stroke-width="5"/><circle cx="610" cy="862" r="36" fill="#fffdf8" stroke="#2b2320" stroke-width="5"/>' +
    '<circle cx="474" cy="868" r="16" fill="#2b2320"/><circle cx="606" cy="868" r="16" fill="#2b2320"/>' +
    '<path d="M430 830 L500 810 M580 810 L650 830" stroke="#2b2320" stroke-width="9" stroke-linecap="round"/><path d="M500 960 q40 -28 80 0" fill="none" stroke="#2b2320" stroke-width="9" stroke-linecap="round"/>' +
    '<path id="hSweat" d="M716 770 C 730 794 734 810 716 818 C 698 810 702 794 716 770 Z" fill="#8fd3f5" stroke="#ffffff" stroke-width="4"/></g>' +
    '<g filter="url(#hcut)"><rect x="70" y="1300" width="940" height="210" rx="18" fill="#fbf5ea"/></g>' +
    '<g stroke="#f1d8cb" stroke-width="3"><path d="M110 1320 V1490 M190 1320 V1490 M270 1320 V1490 M350 1320 V1490 M430 1320 V1490 M510 1320 V1490 M590 1320 V1490 M670 1320 V1490 M750 1320 V1490 M830 1320 V1490 M910 1320 V1490 M990 1320 V1490 M90 1360 H990 M90 1405 H990 M90 1450 H990"/></g>' +
    '<path id="ecg" d="M100 1405 H980" fill="none" stroke="#d9483b" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>');
  PF.P("bigHeart", 540, 880); PF.P("rays", 540, 880); PF.P("hSweat", 716, 794);
  var pg = document.getElementById("pulses"), pn = 0;
  return {
    id: "cuHeart",
    rays: function (t, dur) { PF.X("rays", { r: 28 }, t, dur, "none"); },
    beats: function (times) {
      times.forEach(function (b) {
        PF.X("bigHeart", { s: 1.13 }, b - 0.03, 0.07, "power2.out"); PF.X("bigHeart", { s: 1 }, b + 0.04, 0.26, "power2.in");
        PF.O("#hLines", 0, 1, b - 0.02, 0.04); PF.O("#hLines", 1, 0, b + 0.12, 0.16);
        var ring = PF.el("circle", { cx: 540, cy: 880, r: 300, opacity: 0 }, pg); ring.id = "pr" + (pn++);
        PF.O("#" + ring.id, 0, 0.7, b, 0.03); PF.AT("#" + ring.id, { r: 300 }, { r: 560 }, b, 0.5, "power2.out"); PF.O("#" + ring.id, 0.7, 0, b + 0.05, 0.45);
      });
    },
    ecg: function (t0, t1, beats) {          // EKG sa kreslí, špičky presne na tlkotoch
      var x0 = 100, x1 = 980, yb = 1405, d = "M" + x0 + " " + yb;
      beats.forEach(function (b) { if (b < t0 || b > t1) return; var x = x0 + (b - t0) / (t1 - t0) * (x1 - x0);
        d += " L" + (x - 34).toFixed(1) + " " + yb + " q8 -14 16 0 L" + (x - 8).toFixed(1) + " " + yb + " L" + x.toFixed(1) + " 1318 L" + (x + 10).toFixed(1) + " 1462 L" + (x + 18).toFixed(1) + " " + yb + " q14 -22 28 0"; });
      d += " L" + x1 + " " + yb; document.getElementById("ecg").setAttribute("d", d); PF.draw("ecg", t0, t1 - t0, "none");
    },
    sweatDrop: function (t) { PF.X("hSweat", { ty: 260 }, t, 0.6, "power2.in"); PF.O("#hSweat", 1, 0, t + 0.45, 0.15); }
  };
};

PF.panelBrain = function (z) {
  var s = PF.panel("cuBrain", z || 5);
  var brain = '<path d="M440 718 C 424 690 440 652 476 648 C 488 628 520 624 540 636 C 560 622 596 626 606 646 C 640 648 656 680 644 706 C 660 730 640 760 612 758 C 596 776 560 778 540 766 C 520 778 486 776 470 760 C 444 762 428 740 440 718 Z"';
  s.insertAdjacentHTML("beforeend",
    '<defs><filter id="mcut" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="3" flood-color="#4a2a4a" flood-opacity="0.25"/></filter></defs>' +
    '<rect width="1080" height="1920" fill="#eee1ee"/><circle cx="540" cy="900" r="470" fill="url(#gBody)" fill-opacity="0.9" stroke="#ffffff" stroke-width="14" filter="url(#mcut)"/>' +
    '<path d="M170 780 C 190 620 280 520 400 470" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" opacity="0.7"/>' +
    '<circle cx="400" cy="1200" r="62" fill="#fffdf8" stroke="#2b2320" stroke-width="6"/><circle cx="680" cy="1200" r="62" fill="#fffdf8" stroke="#2b2320" stroke-width="6"/>' +
    '<circle cx="404" cy="1184" r="26" fill="#2b2320"/><circle cx="676" cy="1184" r="26" fill="#2b2320"/>' +
    '<g id="brainGhost" opacity="0"><g transform="translate(540 800) scale(2.6) translate(-540 -700)">' + brain + ' fill="none" stroke="#9a6b8e" stroke-width="2.4" stroke-dasharray="7 6"/></g></g>' +
    '<g id="bigBrain"><g transform="translate(540 800) scale(2.6) translate(-540 -700)"><g filter="url(#mcut)">' + brain + ' fill="#f3a5b5" stroke="#fde4ea" stroke-width="2.4"/></g>' +
    '<g fill="none" stroke="#d9788e" stroke-width="3" stroke-linecap="round"><path d="M466 700 q20 -24 44 -6 q18 14 40 -6"/><path d="M494 742 q22 -14 40 2 q20 14 46 -4"/>' +
    '<path d="M540 642 q-6 28 6 52"/><path d="M598 676 q16 10 26 32"/><path d="M462 736 q-10 -12 -8 -30"/><path d="M620 730 q-14 6 -30 -2"/></g>' +
    '<path d="M478 666 q18 -16 40 -12" fill="none" stroke="#ffe3ea" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="516" cy="708" r="8" fill="#fffdf8" stroke="#2b2320" stroke-width="1.6"/><circle cx="564" cy="708" r="8" fill="#fffdf8" stroke="#2b2320" stroke-width="1.6"/>' +
    '<circle cx="517" cy="710" r="3.6" fill="#2b2320"/><circle cx="563" cy="710" r="3.6" fill="#2b2320"/><path d="M507 704 h18 M555 704 h18" stroke="#e98fa3" stroke-width="5"/>' +
    '<path id="bMouth" d="M532 730 q8 5 16 0" fill="none" stroke="#2b2320" stroke-width="2.4" stroke-linecap="round"/><ellipse id="bMouthO" cx="540" cy="731" rx="4.5" ry="5.5" fill="#5a2a2a" opacity="0"/></g></g>' +
    '<g id="zaps" opacity="0" fill="none" stroke="#f6c343" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M250 560 l30 -20 l4 28 l30 -24"/><path d="M800 520 l30 20 l-6 26 l34 16"/><path d="M880 960 l24 26 l-26 8 l20 30"/></g>' +
    '<g id="arrows" opacity="0" fill="#7a5fa0" stroke="#fbf5ea" stroke-width="5" stroke-linejoin="round"><path d="M540 360 l40 0 l0 50 l30 0 l-70 70 l-70 -70 l30 0 l0 -50 z"/>' +
    '<path d="M1000 800 l0 40 l-50 0 l0 30 l-70 -70 l70 -70 l0 30 l50 0 z"/><path d="M80 800 l0 40 l50 0 l0 30 l70 -70 l-70 -70 l0 30 l-50 0 z"/></g>');
  PF.P("bigBrain", 540, 800); PF.P("arrows", 540, 800, { s: 1.15 });
  return {
    id: "cuBrain",
    wobble: function (t) { PF.XY("bigBrain", { r: 2 }, t, 0.5, "sine.inOut", 1); },
    pulse: function (t) { PF.X("bigBrain", { s: 1.05 }, t - 0.04, 0.1, "power2.out"); PF.X("bigBrain", { s: 1 }, t + 0.08, 0.3, "power2.in"); },
    shrink: function (t) {
      PF.O("#brainGhost", 0, 1, t - 0.1, 0.15); PF.X("bigBrain", { s: 0.78 }, t, 0.85, "power2.inOut");
      PF.S("#bMouth", { opacity: 0 }, t); PF.S("#bMouthO", { opacity: 1 }, t);
      PF.O("#arrows", 0, 1, t + 0.2, 0.1); PF.X("arrows", { s: 1 }, t + 0.2, 0.4, "back.out(2)");
      [0, 0.25, 0.5].forEach(function (d) { PF.O("#zaps", 0, 1, t + 0.1 + d, 0.03); PF.O("#zaps", 1, 0, t + 0.2 + d, 0.05); });
    }
  };
};
