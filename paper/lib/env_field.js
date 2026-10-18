// Prostredie: VONKU. Sceny sa postavia naraz (skupiny <g id="fd_sc_<meno>_<B|M|F>"> v #fd_B / #fd_M / #fd_F), prepina sa len viditelnost:
//   meadow   - luka: kopce, trava, strom, kvety
//   mountain - hory so snehom, skaly (napr. Everest)
//   summit   - vrchol: stojis na snehovej cepici, more oblakov pod tebou, nizsie stity v dialke, modlitebne vlajocky
//   road     - cesta v perspektive, mesto v pozadi, cielova brana FINISH v poprede (beh, chodza)
// Nalada "cold" = sneh: biele kopce/zem, cepicky na strome, snezenie, kvety zmiznu. Postava stoji na zemi (chodidla y 1454).
// Volne zony: vlavo x 40-330 / y 1200-1440, vpravo x 850-1040 / y 1070-1430. Ruky postavy ostavaju nad y 1000 -> nic sa nedotyka.
// PF.envField({ scene }) -> API (show, scene, mood + spolocne rozhranie). ID s prefixom fd_. Stare { variant: "mountain" } = scena mountain.
PF.envField = function (o) {
  o = Object.assign({ sun: "#ffe07a", hillFar: "#9ccf8e", hillNear: "#7fbe70", tree: "#4f9a57", treeDark: "#3f7f47", trunk: "#8a5a3c",
    flowers: ["#f6c343", "#f28b82", "#ffffff"] }, o || {});
  var SC = ["meadow", "mountain", "summit", "road"];
  if (o.variant === "mountain") o.scene = "mountain";
  if (!o.scene) o.scene = "meadow";
  if (SC.indexOf(o.scene) < 0) { console.warn("envField: neznama scena '" + o.scene + "' -> meadow"); o.scene = "meadow"; }
  var sc0 = o.scene;
  // obloha / zem per scena (o.sky, o.ground prepisu uvodnu scenu)
  var SKY = { meadow: ["#8fd0f5", "#d8f0fb"], mountain: ["#9cc9ea", "#e4f1fa"], summit: ["#5b8fd0", "#c9e2f7"], road: ["#a3d6f3", "#e4f3fb"] };
  var GRD = { meadow: ["#86c46d", "#6fae5c"], mountain: ["#b8b2a2", "#9f9886"], road: ["#86c46d", "#6fae5c"] };
  if (o.sky) SKY[sc0] = o.sky;
  if (o.ground && GRD[sc0]) GRD[sc0] = o.ground;
  var grad = function (id, c) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] +
    '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>'; };
  var defs = grad("fd_gSnow", ["#f6f9fc", "#dfe8f0"]) + grad("fd_gRoad", ["#a3a5ab", "#8d8f96"]);
  SC.forEach(function (s) { defs += grad("fd_gSky_" + s, SKY[s]) + (GRD[s] ? grad("fd_gGround_" + s, GRD[s]) : ""); });
  document.getElementById("defs").insertAdjacentHTML("beforeend", defs);

  // ---------- spolocne tvary
  var f0 = function (v) { return (+v).toFixed(0); };
  var sky = function (s) { return '<rect x="-200" y="-200" width="1480" height="1700" fill="url(#fd_gSky_' + s + ')"/>'; };
  var sun = function (x, y, r) { r = r || 72; return '<circle cx="' + x + '" cy="' + y + '" r="' + f0(r * 2.08) + '" fill="url(#gSun)" opacity="0.9"/>' +
    '<g filter="url(#cut)"><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + o.sun + '"/></g>'; };
  var cloud = function (x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-110 30 C -130 -10 -90 -40 -50 -26 C -40 -70 30 -76 50 -34 C 90 -50 130 -20 116 20 C 130 40 110 52 90 50 L -90 50 C -120 50 -126 38 -110 30 Z" fill="#ffffff"/></g>'; };
  var DRIFT = [];   // oblaky na oblohe: kazdy aj s kopiou o 1180 vedla -> posun o -1180 za celu dlzku videa = presne jedna perioda (slucka)
  var clouds = function (id, list) { var m = ""; list.forEach(function (c) { m += cloud(c[0], c[1], c[2]) + cloud(c[0] + 1180, c[1], c[2]); });
    DRIFT.push(id); return '<g id="' + id + '" opacity="0.95">' + m + '</g>'; };
  var cap = function (px, py, k) { k = k || 1; return '<path d="M' + px + ' ' + py + ' L' + (px - 42 * k) + ' ' + (py + 58 * k) + ' L' + (px - 18 * k) + ' ' + (py + 48 * k) +
    ' L' + px + ' ' + (py + 68 * k) + ' L' + (px + 18 * k) + ' ' + (py + 46 * k) + ' L' + (px + 42 * k) + ' ' + (py + 58 * k) + ' Z" fill="#ffffff"/>'; };
  var tuft = function (x, y, col, s) { s = s || 1; var a = (6 * s).toFixed(1), b = (26 * s).toFixed(1), c = (18 * s).toFixed(1);
    return '<path d="M' + f0(x) + ' ' + f0(y) + ' l' + a + ' -' + b + ' l' + a + ' ' + b + ' l' + a + ' -' + c + ' l' + a + ' ' + c + '" fill="none" stroke="' + col +
      '" stroke-width="' + (4 * s).toFixed(1) + '" stroke-linecap="round" stroke-linejoin="round"/>'; };
  var tufts = function (col) { var m = "", rr = PF.rnd(58);   // trsy travy pozdlz horizontu (luka aj hory, rovnake ako povodne)
    for (var i = 0; i < 26; i++) { var x = -40 + i * 45 + rr() * 20, y = 1350 + rr() * 30; m += tuft(x, y, col); } return m; };
  var corners = function (col) { return '<path d="M-60 2000 C -40 1830 40 1740 150 1710 C 130 1810 80 1900 -60 2000 Z" fill="' + col + '"/>' +
    '<path d="M1150 1990 C 1100 1860 1030 1800 940 1790 C 970 1880 1040 1950 1150 1990 Z" fill="' + col + '"/>'; };
  var LAY = { B: "", M: "", F: "" };
  var scene = function (name, parts) { ["B", "M", "F"].forEach(function (L) {
    if (parts[L]) LAY[L] += '<g id="fd_sc_' + name + '_' + L + '" opacity="' + (name === sc0 ? 1 : 0) + '">' + parts[L] + '</g>'; }); };

  // ---------- MEADOW (luka)
  var FAR = "M-200 1250 C 0 1140 200 1150 380 1220 C 560 1150 760 1120 1000 1210 C 1100 1180 1200 1190 1280 1220 V1500 H-200 Z";
  var NEAR = "M-200 1320 C 60 1240 300 1270 520 1300 C 760 1250 980 1260 1280 1310 V1500 H-200 Z";
  var GROUND = "M-200 1330 C 200 1310 800 1310 1280 1330 V2200 H-200 Z";
  var flowers = "";
  [[120, 1500], [250, 1540], [860, 1520], [990, 1490], [60, 1600], [1010, 1620]].forEach(function (f, i) { var c = o.flowers[i % 3];
    flowers += '<g transform="translate(' + f[0] + ' ' + f[1] + ')"><path d="M0 0 v34" stroke="' + o.treeDark + '" stroke-width="5"/>' +
      '<circle cx="-9" cy="0" r="9" fill="' + c + '"/><circle cx="9" cy="0" r="9" fill="' + c + '"/><circle cx="0" cy="-9" r="9" fill="' + c + '"/><circle cx="0" cy="9" r="9" fill="' + c + '"/><circle r="6" fill="#f39c42"/></g>'; });
  scene("meadow", {
    B: sky("meadow") + sun(870, 600) + clouds("fd_clouds", [[160, 390, 1], [620, 440, 0.75]]) +
      '<path d="' + FAR + '" fill="' + o.hillFar + '"/><path d="' + NEAR + '" fill="' + o.hillNear + '"/>' +
      '<g id="fd_snowB" opacity="0"><path d="' + FAR + '" fill="#e7eef5"/><path d="' + NEAR + '" fill="#f1f5f9"/></g>',
    M: '<path d="' + GROUND + '" fill="url(#fd_gGround_meadow)"/><g id="fd_snowM" opacity="0"><path d="' + GROUND + '" fill="url(#fd_gSnow)"/></g>' + tufts(GRD.meadow[1]) +
      '<g filter="url(#cut)"><rect x="928" y="1250" width="34" height="180" rx="12" fill="' + o.trunk + '"/>' +
      '<circle cx="905" cy="1190" r="62" fill="' + o.treeDark + '"/><circle cx="990" cy="1180" r="60" fill="' + o.treeDark + '"/><circle cx="948" cy="1140" r="72" fill="' + o.tree + '"/>' +
      '<circle cx="900" cy="1215" r="40" fill="' + o.tree + '"/><circle cx="1000" cy="1210" r="42" fill="' + o.tree + '"/></g>' +
      '<g id="fd_snowTree" opacity="0" fill="#ffffff"><ellipse cx="948" cy="1086" rx="56" ry="20"/><ellipse cx="896" cy="1142" rx="44" ry="16"/><ellipse cx="994" cy="1134" rx="42" ry="16"/></g>' +
      '<g id="fd_flowers">' + flowers + '</g>',
    F: '<g filter="url(#dof)" opacity="0.95">' + corners(o.treeDark) + '</g>'
  });

  // ---------- MOUNTAIN (hory so snehom; skaly namiesto stromu - nad hranicou lesa, snehove flaky na zemi)
  var MFOOT = "M-200 1330 C 100 1210 300 1250 520 1290 C 760 1225 980 1255 1280 1300 V1500 H-200 Z";
  scene("mountain", {
    B: sky("mountain") + sun(200, 470) + clouds("fd_clouds_mountain", [[160, 390, 1], [620, 440, 0.75]]) +
      '<path d="M-200 1200 L 20 830 L 140 930 L 300 700 L 470 900 L 640 660 L 800 880 L 960 740 L 1280 1020 V1500 H-200 Z" fill="#a9bbcd"/>' +
      cap(300, 700) + cap(640, 660) + cap(960, 740, 0.8) + cap(20, 830, 0.7) +
      '<path d="M600 1320 L 850 520 L 1100 1320 Z" fill="#8ea4ba"/><path d="M850 520 L 790 712 L 826 690 L 850 740 L 876 688 L 912 712 Z" fill="#ffffff"/>' +
      '<path d="M850 520 L 1100 1320 L 980 1320 Z" fill="#7d93a9" opacity="0.6"/><path d="' + MFOOT + '" fill="#b9c3cd"/>' +
      '<g id="fd_snowB_mountain" opacity="0"><path d="' + MFOOT + '" fill="#eef3f8"/></g>',
    M: '<path d="' + GROUND + '" fill="url(#fd_gGround_mountain)"/><g id="fd_snowM_mountain" opacity="0"><path d="' + GROUND + '" fill="url(#fd_gSnow)"/></g>' + tufts("#8d8674") +
      '<g filter="url(#cut)"><path d="M860 1420 L 890 1340 L 950 1310 L 1010 1350 L 1040 1420 Z" fill="#8d8674"/><path d="M890 1340 L 950 1310 L 930 1350 Z" fill="#ffffff"/>' +
      '<path d="M40 1440 L 70 1380 L 130 1370 L 170 1440 Z" fill="#99927f"/><path d="M200 1452 L 222 1420 L 262 1418 L 280 1452 Z" fill="#8d8674"/></g>' +
      '<g fill="#f4f8fb" opacity="0.9"><ellipse cx="160" cy="1560" rx="110" ry="22"/><ellipse cx="880" cy="1600" rx="130" ry="26"/><ellipse cx="540" cy="1720" rx="160" ry="30"/></g>',
    F: '<g filter="url(#dof)" opacity="0.95">' + corners("#8d8674") + '</g>'
  });

  // ---------- SUMMIT (vrchol: snehova cepica pod nohami, more oblakov okolo a pod tebou, v dialke nizsie stity)
  var peak = function (x, y, h, col, shade, k) {   // stit s hrotom (x, y) a vyskou h; sklon bokov sedi so snehovou cepickou cap()
    var w = h * 0.724;
    return '<path d="M' + f0(x - w) + ' ' + (y + h) + ' L' + x + ' ' + y + ' L' + f0(x + w) + ' ' + (y + h) + ' Z" fill="' + col + '"/>' +
      '<path d="M' + x + ' ' + y + ' L' + f0(x + w) + ' ' + (y + h) + ' L' + f0(x + w * 0.3) + ' ' + (y + h) + ' Z" fill="' + shade + '" opacity="0.6"/>' + cap(x, y, k);
  };
  var puffs = function (fy, r0, col, seed, step) {   // pas oblakov cez celu sirku: kruhy s vrcholom na krivke fy(x) + vypln pod nimi
    var rr = PF.rnd(seed), m = "", base = "M-300 2300";
    for (var x = -300; x <= 1380; x += step) { var r = r0 * (0.8 + rr() * 0.45), cy = fy(x) + r * (0.85 + rr() * 0.3);
      m += '<circle cx="' + f0(x) + '" cy="' + f0(cy) + '" r="' + f0(r) + '"/>'; base += " L" + f0(x) + " " + f0(cy); }
    return '<g fill="' + col + '" filter="url(#cut)"><path d="' + base + ' L1380 2300 Z"/>' + m + '</g>';
  };
  var U = function (x) { var d = (x - 540) / 255; return Math.exp(-d * d); };   // vrchol trci z oblakov stredom -> po bokoch su oblaky vyssie
  // hreben vrcholu (zadna hrana snehovej plosiny) s ramenom vlavo pre tycku; boky padaju strmo do spodnych rohov
  var RIDGE = " L112 1366 L176 1346 L230 1330 L300 1320 L382 1328 L462 1314 L540 1324 L622 1312 L702 1326 L782 1316 L850 1332 L906 1352 L962 1388 L1010 1440";
  var CAPEDGE = " L1000 1452 L968 1440 L944 1470 L910 1452 L880 1490 L842 1470 L800 1512 L752 1488 L700 1530 L648 1502 L600 1540 L548 1508 L494 1544" +
    " L440 1506 L388 1536 L336 1498 L284 1522 L236 1480 L190 1500 L150 1458 L110 1470 L84 1430 Z";   // zubaty spodny okraj snehovej cepice
  var streak = function (x, y, len) { return "M" + (x - 7) + " " + (y - 6) + " L" + (x + 7) + " " + (y - 6) + " L" + (x + 3) + " " + (y + len) + " Z"; };   // snehovy zlab na skale
  var bz = function (t, a, c, b) { var u = 1 - t; return u * u * a + 2 * u * t * c + t * t * b; };
  var FLAG = [], flags = "";   // modlitebne vlajocky na snure od tycky (x 130) dolu doprava; koniec snury sa skryje za postavu
  ["#4a7fc1", "#f4f1e8", "#d9483b", "#3fa37c", "#f2c14e", "#4a7fc1"].forEach(function (col, i) {
    var t = 0.12 + i * 0.152, x1 = bz(t - 0.05, 134, 240, 372), y1 = bz(t - 0.05, 846, 960, 972), x2 = bz(t + 0.05, 134, 240, 372), y2 = bz(t + 0.05, 846, 960, 972);
    var px = ((x1 + x2) / 2).toFixed(1), py = ((y1 + y2) / 2).toFixed(1), id = "fd_flag" + i;
    flags += '<g id="' + id + '" transform="rotate(-5 ' + px + ' ' + py + ')"><path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
      ' L' + x2.toFixed(1) + ' ' + (y2 + 40).toFixed(1) + ' L' + x1.toFixed(1) + ' ' + (y1 + 40).toFixed(1) + ' Z" fill="' + col + '"/></g>';
    FLAG.push([id, px, py, 1.2 + i * 0.17]);
  });
  scene("summit", {
    B: sky("summit") + sun(200, 470) +
      peak(300, 1120, 340, "#c3d1df", "#a9bbcd", 0.8) + peak(770, 1110, 350, "#c3d1df", "#a9bbcd", 0.8) +
      peak(110, 1040, 420, "#a9bbcd", "#7d93a9", 1) + peak(950, 1010, 450, "#a9bbcd", "#7d93a9", 1) +
      puffs(function () { return 1362; }, 56, "#e6edf4", 17, 84) + puffs(function () { return 1426; }, 60, "#f1f5f9", 19, 96),
    M: '<g filter="url(#cut)"><path d="M-300 2300 L-300 1980 L-150 1790 L-40 1610 L20 1500 L70 1398' + RIDGE + ' L1062 1520 L1130 1640 L1230 1800 L1380 1980 L1380 2300 Z" fill="#928c80"/>' +
      '<path d="M850 1332 L906 1352 L962 1388 L1010 1440 L1062 1520 L1130 1640 L1230 1800 L1380 1980 L1380 2300 L720 2300 L700 1560 Z" fill="#6f6b64" opacity="0.5"/></g>' +
      '<path d="' + streak(190, 1500, 80) + streak(388, 1536, 64) + streak(600, 1540, 60) + streak(800, 1512, 82) + streak(944, 1470, 76) + '" fill="#e4ebf2" opacity="0.75"/>' +
      '<g filter="url(#cut)"><path d="M70 1398' + RIDGE + CAPEDGE + '" fill="url(#fd_gSnow)"/>' +   // snehova cepica; pravy okraj v tieni (slnko vlavo)
      '<path d="M782 1316 L850 1332 L906 1352 L962 1388 L1010 1440 L1000 1452 L968 1440 L944 1470 L910 1452 L880 1490 L842 1470 L800 1512 L812 1420 Z" fill="#d2dde8" opacity="0.85"/></g>' +
      '<g fill="none" stroke="#dbe4ee" stroke-width="4" stroke-linecap="round"><path d="M270 1392 q60 -10 120 0"/><path d="M680 1410 q56 -9 112 2"/><path d="M190 1440 q40 -7 80 0"/></g>' +
      '<g filter="url(#cut)"><path d="M250 1470 L272 1436 L306 1440 L326 1474 Z" fill="#7f7a70"/><path d="M272 1436 L306 1440 L298 1448 L282 1446 Z" fill="#ffffff"/>' +
      '<path d="M770 1470 L794 1428 L832 1436 L852 1472 Z" fill="#7f7a70"/><path d="M794 1428 L832 1436 L820 1446 L802 1442 Z" fill="#ffffff"/></g>' +
      '<rect x="125" y="822" width="10" height="540" rx="4" fill="#6b5646"/><circle cx="130" cy="820" r="8" fill="#e0b54a"/>' +
      '<path d="M134 846 Q240 960 372 972 L470 1060" fill="none" stroke="#6b5646" stroke-width="3"/><g filter="url(#cut)">' + flags + '</g>' +
      '<g filter="url(#cut)"><ellipse cx="130" cy="1370" rx="48" ry="16" fill="#8d8674"/><ellipse cx="126" cy="1350" rx="36" ry="13" fill="#99927f"/><ellipse cx="132" cy="1332" rx="24" ry="10" fill="#8d8674"/></g>' +
      '<g id="fd_seaA" transform="translate(-14 0)">' + puffs(function (x) { return 1552 + 138 * U(x); }, 84, "#dde5ee", 23, 96) + '</g>' +
      '<g id="fd_seaB" transform="translate(12 0)">' + puffs(function (x) { return 1662 + 120 * U(x); }, 94, "#eef2f6", 31, 110) + '</g>' +
      '<g id="fd_seaC" transform="translate(-10 0)">' + puffs(function (x) { return 1790 + 100 * U(x); }, 108, "#ffffff", 47, 125) + '</g>',
    F: '<g filter="url(#dof)" opacity="0.95"><path d="M-140 2020 L-140 1720 L-60 1662 L20 1642 L100 1668 L168 1730 L196 1820 L210 2020 Z" fill="#8d8674"/>' +
      '<path d="M-140 1720 L-60 1662 L20 1642 L100 1668 L168 1730 L120 1722 L80 1744 L30 1708 L-30 1732 L-80 1714 Z" fill="#f4f8fb"/>' +
      '<g fill="#ffffff"><circle cx="1010" cy="1910" r="90"/><circle cx="1110" cy="1860" r="112"/><circle cx="1190" cy="1930" r="100"/></g></g>'
  });

  // ---------- ROAD (cesta v perspektive: sirka 880 pri y 1920 -> 144 na horizonte y 1255; mesto v pozadi; cielova brana v poprede)
  var HZ = 1255, YV = HZ - 144 * 665 / 736, KZ = 1920 - YV;   // horizont, ubiehajuci bod (sirka cesty 0), hlbka z = KZ / (y - YV)
  var rd = function (y, s, w) { return f0(540 + s * (72 + 0.5534 * (y - HZ) + (w || 0))); };   // okraj cesty (s -1 vlavo, 1 vpravo) + odsadenie w
  var curbW = function (y) { return 3 * (y - YV) / (HZ - YV); };
  var curb = function (s) { return "M" + rd(HZ, s) + " " + HZ + " L" + rd(HZ, s, curbW(HZ)) + " " + HZ + " L" + rd(2300, s, curbW(2300)) + " 2300 L" + rd(2300, s) + " 2300 Z"; };
  var dash = "";   // prerusovana stredova ciara: rovnake kroky v hlbke z -> k horizontu kratsie a uzsie
  for (var z = 0.74; z < 7; z += 0.5) { var ya = YV + KZ / (z + 0.24), yb = YV + KZ / z; if (ya < HZ + 6) break;
    var ha = 9 * (ya - YV) / KZ, hb = 9 * (yb - YV) / KZ;
    dash += "M" + (540 - hb).toFixed(1) + " " + yb.toFixed(1) + " L" + (540 - ha).toFixed(1) + " " + ya.toFixed(1) + " L" + (540 + ha).toFixed(1) + " " + ya.toFixed(1) +
      " L" + (540 + hb).toFixed(1) + " " + yb.toFixed(1) + " Z"; }
  var city = function (seed, t0, t1, cols, win) {   // rad budov cez celu sirku; v strede (za postavou) nizsie, pod hlavou
    var rr = PF.rnd(seed), x = -220, m = "", wp = "";
    while (x < 1300) { var w = 64 + rr() * 76, mid = x + w / 2, top = mid > 380 && mid < 700 ? t1 - rr() * 40 : t0 + rr() * (t1 - t0), c = cols[Math.floor(rr() * cols.length)];
      m += '<rect x="' + f0(x) + '" y="' + f0(top) + '" width="' + f0(w) + '" height="' + f0(1520 - top) + '" fill="' + c + '"/>';
      if (rr() < 0.35) m += '<rect x="' + f0(x + w * 0.3) + '" y="' + f0(top - 22) + '" width="' + f0(w * 0.4) + '" height="24" fill="' + c + '"/>';
      if (win) for (var wy = top + 18; wy < 1330; wy += 30) for (var wx = x + 12; wx + 22 < x + w; wx += 22) wp += "M" + f0(wx) + " " + f0(wy) + "h11v14h-11z";
      x += w + 4 + rr() * 12; }
    return m + (win ? '<path d="' + wp + '" fill="' + win + '" opacity="0.75"/>' : "");
  };
  var hedge = "", rh = PF.rnd(66), vt = "", rv = PF.rnd(12);
  for (var hx = -220; hx < 1320; hx += 46) { var hr = 24 + rh() * 16; hedge += '<circle cx="' + hx + '" cy="' + f0(1252 - hr * 0.4) + '" r="' + f0(hr) + '"/>'; }
  for (var i = 0; i < 40; i++) { var ty = 1272 + rv() * 250, tx = -40 + rv() * 1160;   // trava len na krajniciach (nie na ceste), k horizontu mensia
    if (Math.abs(tx + 12 - 540) < 72 + 0.5534 * (ty - HZ) + 36) continue;
    vt += tuft(tx, ty, GRD.road[1], 0.5 + 0.5 * (ty - HZ) / 270); }
  var GR = "M-200 " + HZ + " H1280 V2300 H-200 Z", chk = "";
  for (var ci = 0; ci < 72; ci++) chk += "M" + (108 + ci * 12) + " " + (458 + (ci % 2) * 12) + "h12v12h-12z";   // sachovnicovy pas nad transparentom
  var pole = function (x) { return '<rect x="' + x + '" y="444" width="42" height="900" rx="10" fill="#c2463c"/><rect x="' + (x + 9) + '" y="452" width="9" height="880" rx="4" fill="#e57a6f" opacity="0.55"/>'; };
  scene("road", {
    B: sky("road") + sun(230, 600, 60) + clouds("fd_clouds_road", [[180, 300, 0.85], [760, 262, 0.6]]) +
      city(5, 1010, 1110, ["#c5d2de", "#bccad8"], null) + city(9, 1070, 1180, ["#9fb2c6", "#93a8be", "#a9bacb"], "#dde6ef") +
      '<g fill="#6aa760">' + hedge + '<rect x="-240" y="1244" width="1560" height="300"/></g>' +
      '<g filter="url(#cut)">' + pole(89) + pole(949) + '</g>' +   // cielova brana v B (za postavou, malicka paralaxa): tyce po zem, transparent nad hlavou (y 458-560)
      '<g filter="url(#cut)"><rect x="108" y="458" width="864" height="24" fill="#fbf5ea"/><path d="' + chk + '" fill="#2b2320"/>' +
      '<rect x="108" y="482" width="864" height="80" fill="#d9483b"/><rect x="122" y="492" width="836" height="60" rx="4" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"/>' +
      '<text x="546" y="543" style="font-family:Pop;font-weight:700;font-size:58px;fill:#ffffff;text-anchor:middle;letter-spacing:12px">FINISH</text></g>',
    M: '<path d="' + GR + '" fill="url(#fd_gGround_road)"/><g id="fd_snowM_road" opacity="0"><path d="' + GR + '" fill="url(#fd_gSnow)"/></g>' +
      '<path d="M' + rd(HZ, -1) + ' ' + HZ + ' L' + rd(HZ, 1) + ' ' + HZ + ' L' + rd(2300, 1) + ' 2300 L' + rd(2300, -1) + ' 2300 Z" fill="url(#fd_gRoad)"/>' +
      '<path d="' + curb(-1) + ' ' + curb(1) + '" fill="#ebe7dd"/><path d="' + dash + '" fill="#ffffff" opacity="0.92"/>' + vt +
      '<g filter="url(#cut)"><rect x="197" y="1040" width="14" height="310" rx="5" fill="#7d7f86"/>' +   // smerovnik bez textu
      '<path d="M150 998 H262 L292 1030 L262 1062 H150 Z" fill="#3f8f5c"/><path d="M204 1014 L222 1030 L204 1046" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M258 1076 H168 L142 1102 L168 1128 H258 Z" fill="#e9b949"/><path d="M204 1088 L188 1102 L204 1116" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>',
    F: '<g filter="url(#dof)" opacity="0.95">' + corners(o.treeDark) + '</g>'
  });

  PF.add("B", '<g id="fd_B" opacity="0">' + LAY.B + '</g>');
  PF.add("M", '<g id="fd_M" opacity="0">' + LAY.M + '<g id="fd_props"></g></g>');
  PF.add("F", '<g id="fd_F" opacity="0">' + LAY.F + '<g id="fd_snowfall" opacity="0" fill="#ffffff"></g></g>');
  // snezenie (viditelne len pri nalade cold, spolocne pre vsetky sceny): vlocky padaju zhora nadol, periody delia dlzku videa
  var sf = document.getElementById("fd_snowfall"), rs = PF.rnd(91);
  for (var k = 0; k < 34; k++) {
    var fx0 = rs() * 1080, p = PF.loopPeriod(3.5 + rs() * 2.5), n = Math.max(0, Math.round(PF.VO.total / p) - 1), id = "fdsn" + k;
    var c = PF.el("circle", { cx: 0, cy: 0, r: (4 + rs() * 6).toFixed(1), opacity: (0.6 + rs() * 0.4).toFixed(2) }, sf); c.id = id;
    c.setAttribute("transform", "translate(" + fx0.toFixed(0) + " -60)");
    PF.tl.fromTo("#" + id, { attr: { transform: "translate(" + fx0.toFixed(0) + " -60)" } },
      { attr: { transform: "translate(" + (fx0 + (rs() - 0.5) * 160).toFixed(0) + " 1990)" }, duration: p, ease: "none", repeat: n, immediateRender: false }, 0);
    PF.tl.set("#" + id, { attr: { transform: "translate(" + fx0.toFixed(0) + " " + (-60 + rs() * 2000).toFixed(0) + ")" } }, 0);
  }
  // oblaky na oblohe: dve rovnake dvojice vedla seba (posun o 1180) -> za celu dlzku videa presne jedna perioda = slucka
  DRIFT.forEach(function (cid) {
    PF.tl.fromTo("#" + cid, { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(-1180 0)" }, duration: PF.VO.total, ease: "none", immediateRender: false }, 0); });
  // jemne kmitanie tam a spat (more oblakov, vlajocky): perioda deli dlzku videa, parny pocet poloperiod -> posledny snimok = prvy
  var sway = function (sel, a, b, per) { if (!(PF.VO.total > 0)) return;
    var P = PF.loopPeriod(per), m = Math.max(1, Math.round(PF.VO.total / P));
    PF.tl.fromTo(sel, { attr: { transform: a } }, { attr: { transform: b }, duration: P / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * m - 1, immediateRender: false }, 0); };
  sway("#fd_seaA", "translate(-14 0)", "translate(14 0)", 9);
  sway("#fd_seaB", "translate(12 0)", "translate(-12 0)", 7);
  sway("#fd_seaC", "translate(-10 0)", "translate(10 0)", 11);
  FLAG.forEach(function (f) { sway("#" + f[0], "rotate(-5 " + f[1] + " " + f[2] + ")", "rotate(6 " + f[1] + " " + f[2] + ")", f[3]); });

  var api = {
    show: function (on, t) { ["#fd_B", "#fd_M", "#fd_F"].forEach(function (s) { PF.S(s, { opacity: on ? 1 : 0 }, t); }); }
  };
  // ---------- spolocne rozhranie prostredi
  api.kind = "field"; api.badgeZone = null; api.scenes = SC.slice(); api.scene0 = sc0;
  api.metric = function () {}; api.metricLabel = function () {}; api.metricReset = function () {};
  var cur = sc0;
  api.scene = function (name, t) {           // prepnutie sceny: oblakovy prestrih zakryje obraz (cca t-0.1 .. t+0.05), vymena presne v case t
    if (name === cur) return;
    if (SC.indexOf(name) < 0) { console.warn("envField: neznama scena '" + name + "'"); return; }
    PF.fx.cloudWipe(t - 0.55, 1);
    PF.sceneSet("fd", cur, false, t, 0); PF.sceneSet("fd", name, true, t, 0);
    cur = name;
  };
  var SNOW = "#fd_snowB, #fd_snowM, #fd_snowTree, #fd_snowB_mountain, #fd_snowM_mountain, #fd_snowM_road, #fd_snowfall";
  api.mood = function (name, t) {
    if (name === "night") { PF.fx.night(0, 0.5, t); return function (tt, d) { PF.fx.night(0.5, 0, tt, d || 0.01); }; }
    if (name === "hot") { PF.fx.tone("#ffb070", 0, 0.35, t); return function (tt, d) { PF.fx.tone("#ffb070", 0.35, 0, tt, d || 0.01); }; }
    if (name === "cold") {
      PF.fx.tone("#9fc4ef", 0, 0.3, t); PF.fx.frost(true, t); PF.O(SNOW, 0, 1, t, 1.2, "power1.inOut"); PF.O("#fd_flowers", 1, 0, t, 0.8);
      return function (tt, d) { PF.fx.tone("#9fc4ef", 0.3, 0, tt, d || 0.01); PF.fx.frost(false, tt, d); PF.O(SNOW, 1, 0, tt, d || 0.01); PF.O("#fd_flowers", 0, 1, tt, d || 0.01); };
    }
    return function () {};
  };
  return api;
};
