// Detailove panely pre telo vo vesmire: vnutorne ucho (rovnovaha), chrbtica (rast), kost (hustota), oko (splostenie).
// Kazdy panel = PF.panel(id, z) nad svetom; rozlozenie bez prekryvania, nadpis DAY hore (y < 270), titulky dole (y > 1560).
function pfShadow(id, col) {
  return '<defs><filter id="' + id + '" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="3" flood-color="' + (col || "#3a2a4a") + '" flood-opacity="0.25"/></filter></defs>';
}
function pfArrow(x, y, dir, col, id) {    // sipka dlzky ~90 v smere dir (0 hore, 90 vpravo, 180 dole, 270 vlavo)
  return '<g id="' + id + '" opacity="0"><g transform="translate(' + x + ' ' + y + ') rotate(' + dir + ')"><path d="M-14 40 V-6 H-34 L0 -46 L34 -6 H14 V40 Z" fill="' + col + '" stroke="#fbf5ea" stroke-width="5" stroke-linejoin="round"/></g></g>';
}

// ---------------------------------------------------------------- VNUTORNE UCHO
PF.panelEar = function (z) {
  var s = PF.panel("cuEar", z || 3), skin = "#f1c9a5", skinD = "#dca87f", ink = "#7a5fa0";
  s.insertAdjacentHTML("beforeend", pfShadow("ecut") +
    '<rect width="1080" height="1920" fill="#ece6f6"/><g fill="none" stroke="#e2daf0" stroke-width="22"><circle cx="730" cy="880" r="370"/><circle cx="730" cy="880" r="470"/><circle cx="730" cy="880" r="570"/></g>' +
    '<g filter="url(#ecut)"><path d="M300 600 C 160 600 110 760 140 880 C 162 966 226 1000 236 1086 C 246 1160 300 1204 356 1180 C 400 1160 392 1104 370 1062 C 338 1000 386 960 414 900 C 456 816 446 600 300 600 Z" fill="' + skin + '" stroke="#ffffff" stroke-width="8"/></g>' +
    '<path d="M296 690 C 214 690 196 796 228 858 C 250 900 300 890 312 848" fill="none" stroke="' + skinD + '" stroke-width="20" stroke-linecap="round"/>' +
    '<ellipse cx="342" cy="930" rx="22" ry="30" fill="#b98a6a"/>' +
    '<path id="eLn1" d="M352 912 L 560 710" fill="none" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/><path id="eLn2" d="M352 948 L 560 1050" fill="none" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/>' +
    '<g id="eBub" opacity="0"><g filter="url(#ecut)"><circle cx="730" cy="880" r="240" fill="#fbf5ea" stroke="' + ink + '" stroke-width="10"/></g>' +
    '<circle cx="730" cy="880" r="145" fill="none" stroke="#f3a5b5" stroke-width="58"/><circle cx="730" cy="880" r="145" fill="none" stroke="#cfe9f7" stroke-width="32"/>' +
    '<path d="M622 778 A 145 145 0 0 1 730 735" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.8"/>' +
    '<g id="eNeedle"><rect x="721" y="800" width="18" height="120" rx="9" fill="' + ink + '"/><path d="M730 968 L698 918 L762 918 Z" fill="' + ink + '"/><circle cx="730" cy="880" r="16" fill="' + ink + '"/></g>' +
    '<g id="eBall"><circle cx="730" cy="1025" r="23" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/><circle cx="722" cy="1021" r="4" fill="#2b2320"/><circle cx="738" cy="1021" r="4" fill="#2b2320"/>' +
    '<path d="M723 1035 q7 5 14 0" fill="none" stroke="#2b2320" stroke-width="3" stroke-linecap="round"/></g></g>' +
    pfArrow(730, 565, 0, "#f39c42", "eA0") + pfArrow(730, 1195, 180, "#f39c42", "eA1") +
    '<g style="font-family:Pop;font-weight:600;font-size:88px" fill="' + ink + '"><text id="eQ0" x="540" y="610" opacity="0">?</text><text id="eQ1" x="960" y="640" opacity="0">?</text><text id="eQ2" x="930" y="1190" opacity="0">?</text></g>');
  PF.P("eBub", 730, 880, { s: 0.25 }); PF.P("eNeedle", 730, 880); PF.P("eBall", 730, 880);
  ["eA0", "eA1", "eQ0", "eQ1", "eQ2"].forEach(function (id) { var e = document.getElementById(id), b = e.getBBox(); PF.P(id, b.x + b.width / 2, b.y + b.height / 2, { s: 0.3 }); });
  var ln = function (t) { PF.draw("eLn1", t, 0.25); PF.draw("eLn2", t, 0.25); };
  return {
    id: "cuEar",
    zoom: function (t) { ln(t); PF.O("#eBub", 0, 1, t + 0.1, 0.08); PF.X("eBub", { s: 1 }, t + 0.1, 0.45, "back.out(1.6)"); },
    drift: function (t0, t1, seed) {         // gulicka (otolit) blud po kanali -> ucho nevie, kde je dole
      var rr = PF.rnd(seed || 5), t = t0, r = 0;
      while (t < t1 - 0.3) { r += (rr() < 0.5 ? -1 : 1) * (70 + rr() * 150); var d = 0.35 + rr() * 0.3; PF.X("eBall", { r: r }, t, d, "sine.inOut"); t += d + 0.05; }
    },
    spin: function (t0, t1, seed) {          // strelka "dole" sa zmatene toci
      var rr = PF.rnd(seed || 9), t = t0 + 0.55, r = 540;
      PF.X("eNeedle", { r: r }, t0, 0.55, "power2.inOut");
      while (t < t1 - 0.3) { r += (rr() < 0.5 ? -1 : 1) * (60 + rr() * 170); var d = 0.3 + rr() * 0.25; PF.X("eNeedle", { r: r }, t, d, "back.out(1.4)"); t += d + 0.04; }
    },
    arrows: function (times) { times.forEach(function (t, i) { PF.O("#eA" + i, 0, 1, t, 0.05); PF.X("eA" + i, { s: 1 }, t, 0.3, "back.out(2.2)"); }); },
    qmarks: function (times) { times.forEach(function (t, i) { PF.O("#eQ" + i, 0, 1, t, 0.05); PF.X("eQ" + i, { s: 1, r: i % 2 ? 12 : -12 }, t, 0.3, "back.out(2.5)"); }); }
  };
};

// ---------------------------------------------------------------- CHRBTICA
PF.panelSpine = function (z, o) {
  o = Object.assign({ badge: ["UP TO", "+5 cm", "TALLER"] }, o || {});   // rucne pisane epizody volaju bez opts
  var s = PF.panel("cuSpine", z || 4), bone = "#f5ecd9", boneS = "#d9c8a4", V = 84, GAP = 30, ADD = 14, BOT = 1400, n = 7;
  var vt = function (i) { return BOT - V - i * (V + GAP); };
  var verts = "", discs = "";
  for (var i = 0; i < n; i++) {
    var y = vt(i);
    verts += '<g id="sv' + i + '"><g filter="url(#scut)"><rect x="428" y="' + (y + 27) + '" width="224" height="30" rx="14" fill="' + bone + '" stroke="' + boneS + '" stroke-width="5"/>' +
      '<rect x="478" y="' + y + '" width="124" height="' + V + '" rx="26" fill="' + bone + '" stroke="' + boneS + '" stroke-width="6"/></g>' +
      '<path d="M500 ' + (y + 22) + ' h80" stroke="#efe2c6" stroke-width="7" stroke-linecap="round"/></g>';
    if (i < n - 1) discs += '<ellipse id="sd' + i + '" cx="540" cy="' + (y - GAP / 2) + '" rx="66" ry="12" fill="#8fc7e8" stroke="#ffffff" stroke-width="4"/>';
  }
  var top = vt(n - 1), ticks = "";
  for (var ty = 420; ty <= 1400; ty += 35) ticks += '<path d="M255 ' + ty + ' h' + (ty % 105 === 0 ? 34 : 20) + '" stroke="#b9a684" stroke-width="4"/>';
  s.insertAdjacentHTML("beforeend", pfShadow("scut", "#2a3a5a") +
    '<rect width="1080" height="1920" fill="#dde9f3"/>' +
    '<g opacity="0.55"><path d="M380 700 C 380 600 440 560 540 560 C 640 560 700 600 700 700 L 730 1420 C 700 1460 380 1460 350 1420 Z" fill="#c9dcea"/></g>' +
    '<g id="sSkull" opacity="0.55"><circle cx="540" cy="' + (top - 120) + '" r="95" fill="#c9dcea"/></g>' +
    '<g filter="url(#scut)"><rect x="250" y="400" width="54" height="1020" rx="10" fill="#fbf5ea" stroke="#d9c8a4" stroke-width="4"/></g>' + ticks +
    '<path id="sMark0" d="M312 ' + top + ' H470" stroke="#9aa9bb" stroke-width="5" stroke-dasharray="12 9"/>' +
    '<g id="sMark"><path d="M312 ' + top + ' H470" stroke="#e0483d" stroke-width="7" stroke-dasharray="14 9"/><path d="M300 ' + top + ' l-22 -14 v28 z" fill="#e0483d"/></g>' +
    '<g id="sSpine">' + discs + verts + '</g>' +
    pfArrow(740, 800, 0, "#3d97d3", "sUp") + pfArrow(740, 1290, 180, "#3d97d3", "sDn") +
    '<g id="sBadge" opacity="0"><g filter="url(#scut)"><circle cx="840" cy="560" r="112" fill="#fbf5ea" stroke="#3d97d3" stroke-width="8"/></g>' +
    '<text x="840" y="522" style="font-family:Hand;font-weight:700;font-size:28px;fill:#2b2320;text-anchor:middle;letter-spacing:3px">' + o.badge[0] + '</text>' +
    '<text x="840" y="590" style="font-family:Pop;font-weight:600;font-size:60px;fill:#2f7fc1;text-anchor:middle">' + o.badge[1] + '</text>' +
    '<text x="840" y="630" style="font-family:Hand;font-weight:700;font-size:26px;fill:#2b2320;text-anchor:middle;letter-spacing:3px">' + o.badge[2] + '</text></g>');
  for (var k = 0; k < n; k++) PF.P("sv" + k, 540, vt(k) + V / 2);
  for (var d = 0; d < n - 1; d++) PF.P("sd" + d, 540, vt(d) - GAP / 2);
  PF.P("sSpine", 540, 1400); PF.P("sSkull", 540, top - 120); PF.P("sMark", 540, top); PF.P("sBadge", 840, 560, { s: 0.3 });
  PF.P("sUp", 740, 800, { s: 0.3 }); PF.P("sDn", 740, 1290, { s: 0.3 });
  return {
    id: "cuSpine",
    wiggle: function (t) { PF.XY("sSpine", { r: 1.5 }, t, 0.18, "sine.inOut", 3); },
    stretch: function (t, dur) {             // platnicky sa roztiahnu -> kazdy stavec vyssie o i*ADD
      dur = dur || 0.9;
      for (var i = 1; i < n; i++) PF.X("sv" + i, { ty: -i * ADD }, t, dur, "power2.inOut");
      for (var j = 0; j < n - 1; j++) PF.X("sd" + j, { ty: -(j * ADD + ADD / 2), sy: 1.6 }, t, dur, "power2.inOut");
      PF.X("sSkull", { ty: -(n - 1) * ADD }, t, dur, "power2.inOut"); PF.X("sMark", { ty: -(n - 1) * ADD }, t, dur, "power2.inOut");
      ["sUp", "sDn"].forEach(function (id) { PF.O("#" + id, 0, 1, t, 0.06); PF.X(id, { s: 1 }, t, 0.3, "back.out(2.2)"); PF.O("#" + id, 1, 0, t + dur + 0.5, 0.2); });
    },
    badge: function (t) { PF.O("#sBadge", 0, 1, t, 0.08); PF.X("sBadge", { s: 1 }, t, 0.42, "back.out(2)"); }
  };
};

// ---------------------------------------------------------------- KOST (hustota)
PF.panelBone = function (z, o) {
  o = Object.assign({ badge: ["-1 %", "BONE / MONTH"] }, o || {});
  var s = PF.panel("cuBone", z || 5), fill = "#f7efdc", line = "#d9c8a4";
  var shapes = function (st) { return '<circle cx="470" cy="540" r="92"' + st + '/><circle cx="610" cy="540" r="92"' + st + '/><circle cx="470" cy="1320" r="92"' + st + '/>' +
    '<circle cx="610" cy="1320" r="92"' + st + '/><rect x="450" y="540" width="180" height="780"' + st + '/>'; };
  var dots = "", rr = PF.rnd(17), idx = 0;
  for (var r = 0; r < 12; r++) for (var c = 0; c < 4; c++) {
    var x = 494 + c * 31 + (r % 2 ? 15 : 0), y = 792 + r * 34 + rr() * 6;
    if (x > 596) continue;
    dots += '<circle id="bd' + idx + '" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="10" fill="#fffaf0" stroke="' + line + '" stroke-width="2"/>'; idx++;
  }
  var ca = ""; for (var q = 0; q < 6; q++) ca += '<g id="bca' + q + '" opacity="0"><circle cx="0" cy="0" r="44" fill="#ffffff" stroke="#c9b17a" stroke-width="5"/>' +
    '<text x="0" y="13" style="font-family:Pop;font-weight:600;font-size:38px;fill:#b0873e;text-anchor:middle">Ca</text></g>';
  s.insertAdjacentHTML("beforeend", pfShadow("bcut", "#5a4a2a") +
    '<rect width="1080" height="1920" fill="#f4ece0"/><circle cx="540" cy="930" r="520" fill="#efe3d0"/>' +
    '<g id="bBone"><g filter="url(#bcut)"><g fill="' + line + '" stroke="' + line + '" stroke-width="16">' + shapes("") + '</g></g><g fill="' + fill + '">' + shapes("") + '</g>' +
    '<path d="M470 470 q-40 10 -52 50" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.8"/>' +
    '<rect x="470" y="770" width="140" height="440" rx="30" fill="#ecd7b4" stroke="' + line + '" stroke-width="5"/>' + dots +
    '<path id="bCrack" d="M628 820 l-22 30 l18 24 l-18 30 l14 22" fill="none" stroke="#a88c5e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>' +
    '<g id="bFace"><circle cx="505" cy="660" r="21" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/><circle cx="575" cy="660" r="21" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/>' +
    '<circle id="bPL" cx="505" cy="664" r="9" fill="#2b2320"/><circle id="bPR" cx="575" cy="664" r="9" fill="#2b2320"/>' +
    '<path id="bBrowL" d="M482 628 q22 -10 44 -2" fill="none" stroke="#2b2320" stroke-width="6" stroke-linecap="round"/><path id="bBrowR" d="M554 626 q22 -8 44 2" fill="none" stroke="#2b2320" stroke-width="6" stroke-linecap="round"/>' +
    '<path id="bSmile" d="M522 712 q18 12 36 0" fill="none" stroke="#2b2320" stroke-width="6" stroke-linecap="round"/>' +
    '<path id="bWorry" d="M520 718 q20 -14 40 0" fill="none" stroke="#2b2320" stroke-width="6" stroke-linecap="round" opacity="0"/></g></g>' +
    ca +
    '<g id="bBadge" opacity="0"><g filter="url(#bcut)"><circle cx="860" cy="470" r="108" fill="#fbf5ea" stroke="#d9483b" stroke-width="8"/></g>' +
    '<text x="860" y="486" style="font-family:Pop;font-weight:600;font-size:70px;fill:#d9483b;text-anchor:middle">' + o.badge[0] + '</text>' +
    '<text x="860" y="528" style="font-family:Hand;font-weight:700;font-size:25px;fill:#2b2320;text-anchor:middle;letter-spacing:2px">' + o.badge[1] + '</text></g>');
  var ndots = idx;
  PF.P("bBone", 540, 930); PF.P("bBadge", 860, 470, { s: 0.3 }); PF.P("bBrowL", 504, 624); PF.P("bBrowR", 576, 624);
  for (var w = 0; w < 6; w++) PF.P("bca" + w, 0, 0, { tx: w % 2 ? 640 : 440, ty: 820 + w * 60, s: 0.4 });
  return {
    id: "cuBone",
    pulse: function (t) { PF.X("bBone", { s: 1.04 }, t - 0.04, 0.1, "power2.out"); PF.X("bBone", { s: 1 }, t + 0.08, 0.3, "power2.in"); },
    weaken: function (t, seed) {              // mineraly miznu (bodky -> diery), prasklina, ustarostena tvar
      var rr2 = PF.rnd(seed || 3), k = 0;
      for (var i = 0; i < ndots; i++) if (rr2() < 0.5) { PF.tl.fromTo("#bd" + i, { attr: { fill: "#fffaf0", r: 10 } }, { attr: { fill: "#e3c89c", r: 6 }, duration: 0.3, ease: "power1.in", immediateRender: false }, t + (k++) * 0.03); }
      PF.O("#bCrack", 0, 1, t + 0.1, 0.05); PF.draw("bCrack", t + 0.1, 0.3, "power1.out");
      PF.S("#bSmile", { opacity: 0 }, t); PF.S("#bWorry", { opacity: 1 }, t);
      PF.X("bBrowL", { r: -14, ty: -4 }, t, 0.2); PF.X("bBrowR", { r: 14, ty: -4 }, t, 0.2);
    },
    calcium: function (t0, t1) {             // vapnik (Ca) odplava z kosti do stran
      var dest = [[210, 880], [880, 960], [180, 1110], [900, 1180], [230, 1330], [860, 1390]];
      for (var i = 0; i < 6; i++) { var t = t0 + i * 0.22;
        PF.O("#bca" + i, 0, 1, t, 0.1); PF.X("bca" + i, { tx: dest[i][0], ty: dest[i][1], s: 1, r: i % 2 ? 20 : -20 }, t, 1.1, "power2.out");
        PF.XY("bca" + i, { ty: dest[i][1] - 18 }, t + 1.1, 0.5, "sine.inOut", Math.max(1, Math.floor((t1 - t - 1.1) / 0.5)) | 1); }
    },
    badge: function (t) { PF.O("#bBadge", 0, 1, t, 0.08); PF.X("bBadge", { s: 1 }, t, 0.42, "back.out(2)"); }
  };
};

// ---------------------------------------------------------------- OKO (splostenie zadnej steny, rozmazane videnie)
PF.panelEye = function (z) {
  var s = PF.panel("cuEye", z || 4);
  var P0 = "M270 820 C 270 659.8 399.8 530 560 530 C 720.2 530 850 659.8 850 820 C 850 980.2 720.2 1110 560 1110 C 399.8 1110 270 980.2 270 820 Z";
  var P1 = "M270 820 C 270 659.8 399.8 530 560 530 C 742 530 790 612 790 820 C 790 1028 742 1110 560 1110 C 399.8 1110 270 980.2 270 820 Z";
  var R0 = "M560 550 C 709.1 550 830 670.9 830 820 C 830 969.1 709.1 1090 560 1090";
  var R1 = "M560 550 C 722 550 770 628 770 820 C 770 1012 722 1090 560 1090";
  s.insertAdjacentHTML("beforeend", pfShadow("ycut", "#2a4a50") +
    '<defs><filter id="eyeBl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur id="eyeBlS" stdDeviation="0"/></filter></defs>' +
    '<rect width="1080" height="1920" fill="#e2eef1"/><circle cx="560" cy="820" r="420" fill="#d6e7eb"/>' +
    '<g id="yNerve"><path d="M800 786 C 900 786 980 760 1180 740 L 1180 900 C 980 880 900 856 800 856 Z" fill="#f3c4a8" stroke="#e5a98b" stroke-width="5"/>' +
    '<path d="M880 800 C 960 794 1040 780 1180 772" fill="none" stroke="#f8d9c6" stroke-width="8" stroke-linecap="round"/></g>' +
    '<g filter="url(#ycut)"><path id="yBall" d="' + P0 + '" fill="#fffdf8" stroke="#cfd8dc" stroke-width="8"/></g>' +
    '<path id="yRet" d="' + R0 + '" fill="none" stroke="#f08a6c" stroke-width="12" stroke-linecap="round" opacity="0.75"/>' +
    '<g fill="none" stroke="#f2a0a0" stroke-width="4" stroke-linecap="round"><path d="M600 590 q20 30 50 20 q30 -10 44 22"/><path d="M620 1050 q30 -20 58 -4 q24 14 50 -8"/><path d="M430 580 q10 24 36 30"/></g>' +
    '<ellipse cx="342" cy="820" rx="30" ry="88" fill="#e8f6fb" stroke="#cfe5ec" stroke-width="4"/>' +
    '<ellipse cx="294" cy="820" rx="22" ry="112" fill="#4a8fc4" stroke="#2f6c9c" stroke-width="4"/><ellipse cx="287" cy="820" rx="12" ry="52" fill="#2b2320"/>' +
    '<path d="M276 700 C 222 742 222 898 276 940" fill="#dff1fb" fill-opacity="0.7" stroke="#ffffff" stroke-width="5"/>' +
    '<g id="yArr" opacity="0">' + '<path d="M1030 610 h-60 v-20 l-46 40 l46 40 v-20 h60 z" fill="#7a5fa0" stroke="#fbf5ea" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M1030 990 h-60 v-20 l-46 40 l46 40 v-20 h60 z" fill="#7a5fa0" stroke="#fbf5ea" stroke-width="5" stroke-linejoin="round"/></g>' +
    '<g filter="url(#ycut)"><rect x="120" y="1190" width="280" height="310" rx="16" fill="#fbf5ea"/></g>' +
    '<g filter="url(#eyeBl)" style="font-family:Pop;font-weight:600;fill:#2b2320;text-anchor:middle"><text x="260" y="1300" style="font-size:96px">E</text>' +
    '<text x="260" y="1378" style="font-size:56px;letter-spacing:10px">F P</text><text x="260" y="1436" style="font-size:40px;letter-spacing:8px">T O Z</text>' +
    '<text x="260" y="1480" style="font-size:30px;letter-spacing:6px">L P E D</text></g>');
  PF.P("yNerve", 900, 820); PF.P("yArr", 980, 820);
  return {
    id: "cuEye",
    hint: function (t) { PF.tl.fromTo("#yRet", { opacity: 0.75, attr: { "stroke-width": 12 } }, { opacity: 1, attr: { "stroke-width": 22 }, duration: 0.2, ease: "power2.out", yoyo: true, repeat: 3, immediateRender: false }, t); },
    flatten: function (t, dur) {
      dur = dur || 0.7;
      PF.O("#yArr", 0, 1, t - 0.15, 0.1); PF.X("yArr", { tx: -30 }, t - 0.15, 0.25, "power2.out");
      PF.AT("#yBall", { d: P0 }, { d: P1 }, t, dur, "power2.inOut"); PF.AT("#yRet", { d: R0 }, { d: R1 }, t, dur, "power2.inOut");
      PF.X("yNerve", { tx: -60 }, t, dur, "power2.inOut"); PF.X("yArr", { tx: -90 }, t + 0.1, dur, "power2.inOut");
    },
    blurry: function (t, dur) { PF.AT("#eyeBlS", { stdDeviation: 0 }, { stdDeviation: 9 }, t, dur || 0.8, "power1.in"); }
  };
};
