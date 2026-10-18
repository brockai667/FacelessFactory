// Prostredie: IZBA (stena s pruhmi, okno so slnkom, obrazok, kalendar, teplomer; podlaha, koberec) + SCENY s rekvizitami:
//   couch = obyvacka (gauc, rastlina), desk = pracovny stol so zapnutym pocitacom (stol v popredi F zakryva nohy -> postava "sedi"),
//   bed = spalna (postel vpravo, nocny stolik s lampou vlavo, papuce).
// Nic sa neprekryva: okno x 40-320, hlava postavy x 375-705, kalendar x 770-1000, teplomer x 956-996 nad gaucom (x 180-900),
// rastlina x 0-160. PF.envRoom(opts) -> API (obloha, slnko, opar, svetlo na podlahe, kalendar, teplomer, rastlina, sceny).
// Sceny = skupiny <g id="rm_sc_<meno>_<M|F>"> (M za postavou, F pred nou); spolocne prvky su mimo nich -> mood/metric funguju vsade.
PF.envRoom = function (o) {
  o = Object.assign({
    wall: ["#eda893", "#dc937c"], stripe: "#d88c76", floor: ["#a95c43", "#bd6d51", "#b0624a"], plank: "#9c5039",
    base: "#f3dcc2", rug: "#ebc79c", rugDash: "#d6a574", sofa: ["#f8eddb", "#e6d0ac"], sofaDark: ["#eedcbb", "#d8bd93"],
    sofaFront: "#e2caa4", sofaSeam: "#dcc39c", sky: "#bfe3f0", picture: "drop", leaves: ["#5f9e58", "#76b46a"], pot: ["#c8664a", "#d9785a"]
  }, o || {});
  var SC = ["couch", "desk", "bed"], cur = SC.indexOf(o.scene) >= 0 ? o.scene : "couch";
  if (o.scene && SC.indexOf(o.scene) < 0) console.warn("envRoom: neznama scena '" + o.scene + "' -> couch");
  var d = document.getElementById("defs");
  d.insertAdjacentHTML("beforeend",
    '<linearGradient id="rm_gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + o.wall[0] + '"/><stop offset="1" stop-color="' + o.wall[1] + '"/></linearGradient>' +
    '<linearGradient id="rm_gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + o.floor[0] + '"/><stop offset="0.35" stop-color="' + o.floor[1] + '"/><stop offset="1" stop-color="' + o.floor[2] + '"/></linearGradient>' +
    '<linearGradient id="rm_gSofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + o.sofa[0] + '"/><stop offset="1" stop-color="' + o.sofa[1] + '"/></linearGradient>' +
    '<linearGradient id="rm_gSofaD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + o.sofaDark[0] + '"/><stop offset="1" stop-color="' + o.sofaDark[1] + '"/></linearGradient>' +
    '<clipPath id="rm_winClip"><rect x="60" y="460" width="240" height="320" rx="6"/></clipPath>' +
    // sceny: stol, obrazovka, ziara obrazovky, perina
    '<linearGradient id="rm_gDeskTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfb189"/><stop offset="1" stop-color="#cf976f"/></linearGradient>' +
    '<linearGradient id="rm_gDesk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ad734f"/><stop offset="1" stop-color="#96603f"/></linearGradient>' +
    '<linearGradient id="rm_gScr" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#f4fbff"/><stop offset="1" stop-color="#c2e1f7"/></linearGradient>' +
    '<radialGradient id="rm_gGlow"><stop offset="0" stop-color="#e8f6ff" stop-opacity="0.95"/><stop offset="0.55" stop-color="#d6eeff" stop-opacity="0.45"/><stop offset="1" stop-color="#d6eeff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="rm_gDuvet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aabdd0"/><stop offset="1" stop-color="#8a9fb7"/></linearGradient>');
  var stripes = ""; for (var x = -70; x <= 1140; x += 110) stripes += '<rect x="' + x + '" y="-200" width="46" height="1800"/>';
  var pic = o.picture === "drop" ? '<path d="M540 432 C 560 460 568 476 540 494 C 512 476 520 460 540 432 Z" fill="#5ab3e6"/>' :
    '<circle cx="540" cy="462" r="30" fill="#f6c343"/><path d="M500 506 L528 470 L548 492 L566 474 L584 506 Z" fill="#76b46a"/>';
  PF.add("B",
    '<rect x="-200" y="-200" width="1480" height="1800" fill="url(#rm_gWall)"/>' +
    '<g fill="' + o.stripe + '" opacity="0.35">' + stripes + '</g>' +
    '<ellipse cx="540" cy="1190" rx="430" ry="180" fill="#8e4332" opacity="0.28" filter="url(#soft)"/>' +
    '<g id="rm_win"><g filter="url(#rough)"><rect x="40" y="440" width="280" height="360" rx="20" fill="#f7ecd9"/></g>' +
    '<rect id="rm_sky" x="60" y="460" width="240" height="320" rx="6" fill="' + o.sky + '"/>' +
    '<g clip-path="url(#rm_winClip)"><g fill="#fdfaf3" filter="url(#cut)">' +
    '<path d="M86 552 q10 -30 40 -24 q14 -26 46 -14 q30 -6 34 22 q24 4 18 26 h-132 q-16 -4 -6 -10 z"/>' +
    '<path d="M176 690 q8 -24 32 -20 q12 -20 38 -10 q24 -4 28 18 q18 4 14 20 h-106 q-12 -4 -6 -8 z"/></g>' +
    '<g id="rm_sun"><circle id="rm_sunGlow" cx="228" cy="580" r="150" fill="url(#gSun)" opacity="0"/><g fill="#ffc43d">' +
    '<path d="M228 488 l14 30 h-28 z"/><path d="M228 672 l14 -30 h-28 z"/><path d="M136 580 l30 14 v-28 z"/><path d="M320 580 l-30 14 v-28 z"/>' +
    '<path d="M163 515 l30 12 l-18 18 z"/><path d="M293 645 l-30 -12 l18 -18 z"/><path d="M293 515 l-12 30 l-18 -18 z"/><path d="M163 645 l12 -30 l18 18 z"/></g>' +
    '<circle cx="228" cy="580" r="62" fill="#ffcf4a"/><circle cx="228" cy="580" r="44" fill="#ffe27e"/></g></g>' +
    '<g fill="#f7ecd9"><rect x="175" y="460" width="10" height="320"/><rect x="60" y="615" width="240" height="10"/></g>' +
    '<rect x="26" y="792" width="308" height="24" rx="10" fill="#f3dfc0" filter="url(#cut)"/></g>' +
    '<g filter="url(#cut)"><rect x="484" y="400" width="112" height="126" rx="8" fill="#e8c77f"/><rect x="496" y="412" width="88" height="102" rx="4" fill="#fbf5ea"/>' + pic + '</g>' +
    '<g filter="url(#cut)"><path d="M885 414 L826 444 M885 414 L944 444" stroke="#6b4a3a" stroke-width="3" fill="none"/>' +
    '<circle cx="885" cy="414" r="8" fill="#6b4a3a"/><rect x="770" y="440" width="230" height="270" rx="16" fill="#fbf5ea"/>' +
    '<path d="M770 456 a16 16 0 0 1 16 -16 h198 a16 16 0 0 1 16 16 v54 h-230 z" fill="#d9483b"/>' +
    '<text id="rm_calLbl" x="885" y="492" style="font-family:Pop;font-weight:600;font-size:40px;fill:#fbf5ea;text-anchor:middle;letter-spacing:4px">' + (o.calLabel || "DAY") + '</text>' +
    '<rect x="818" y="426" width="12" height="32" rx="6" fill="#8b6a58"/><rect x="940" y="426" width="12" height="32" rx="6" fill="#8b6a58"/></g>' +
    '<text id="rm_calNum" x="885" y="664" style="font-family:Serif;font-size:150px;fill:#2b2320;text-anchor:middle">–</text>' +
    '<g id="rm_calPage" opacity="0"><rect x="770" y="512" width="230" height="198" fill="#fbf5ea" stroke="#eadcc6" stroke-width="3"/>' +
    '<text id="rm_calPageNum" x="885" y="664" style="font-family:Serif;font-size:150px;fill:#2b2320;text-anchor:middle">–</text></g>' +
    '<ellipse id="rm_calCircle" cx="885" cy="612" rx="80" ry="72" fill="none" stroke="#d9483b" stroke-width="8" stroke-linecap="round" opacity="0"/>' +
    '<g filter="url(#cut)"><rect x="956" y="745" width="40" height="262" rx="20" fill="#fbf5ea" stroke="#e2cfb3" stroke-width="3"/>' +
    '<circle id="rm_bulb" cx="976" cy="1010" r="28" fill="#d9483b"/></g>' +
    '<rect id="rm_merc" x="968" y="930" width="16" height="80" rx="8" fill="#d9483b"/>' +
    '<g stroke="#cdb593" stroke-width="3"><path d="M960 780 h10 M960 820 h10 M960 860 h10 M960 900 h10 M960 940 h10"/></g>');

  // ---------- SCENY: obsah vrstiev (M = za postavou, F = pred postavou)
  // couch: gauc + rastlina (+ ich tiene na zemi), presne povodny vzhlad
  var couchM =
    '<g fill="#4a1f12" opacity="0.32" filter="url(#soft6)"><ellipse cx="540" cy="1394" rx="370" ry="18"/><ellipse cx="80" cy="1424" rx="58" ry="9"/></g>' +
    '<g filter="url(#cut)">' +
    '<g id="rm_lf1"><path d="M80 1300 C 40 1250 18 1190 34 1134 C 72 1170 92 1240 80 1300 Z" fill="' + o.leaves[0] + '"/></g>' +
    '<g id="rm_lf2"><path d="M80 1300 C 60 1224 62 1156 86 1104 C 114 1160 106 1236 80 1300 Z" fill="' + o.leaves[1] + '"/></g>' +
    '<g id="rm_lf3"><path d="M80 1300 C 100 1240 126 1192 158 1174 C 154 1226 122 1276 80 1300 Z" fill="' + o.leaves[0] + '"/></g>' +
    '<g id="rm_lf4"><path d="M80 1300 C 50 1266 16 1250 2 1256 C 20 1292 52 1308 80 1300 Z" fill="' + o.leaves[1] + '"/></g>' +
    '<path d="M30 1296 L130 1296 L120 1420 L40 1420 Z" fill="' + o.pot[0] + '"/><rect x="24" y="1286" width="112" height="26" rx="8" fill="' + o.pot[1] + '"/></g>' +
    '<g filter="url(#rough)"><rect x="216" y="950" width="648" height="270" rx="60" fill="url(#rm_gSofaD)"/>' +
    '<rect x="244" y="985" width="290" height="220" rx="40" fill="url(#rm_gSofa)"/><rect x="546" y="985" width="290" height="220" rx="40" fill="url(#rm_gSofa)"/>' +
    '<rect x="204" y="1180" width="672" height="120" rx="34" fill="url(#rm_gSofa)"/><rect x="214" y="1262" width="652" height="80" rx="26" fill="' + o.sofaFront + '"/>' +
    '<rect x="180" y="1060" width="110" height="290" rx="52" fill="url(#rm_gSofaD)"/><rect x="790" y="1060" width="110" height="290" rx="52" fill="url(#rm_gSofaD)"/>' +
    '<rect x="228" y="1336" width="30" height="50" rx="8" fill="#7c5038"/><rect x="822" y="1336" width="30" height="50" rx="8" fill="#7c5038"/></g>' +
    '<g stroke="' + o.sofaSeam + '" stroke-width="4" fill="none" opacity="0.8"><path d="M389 1000 v190 M691 1000 v190 M540 1192 v100"/></g>';

  // desk: M = operadlo kancelarskej stolicky (postava ho z vacsej casti zakryje)
  var deskM = '<g filter="url(#cut)"><rect x="356" y="938" width="368" height="330" rx="72" fill="#5d4b5f"/></g>';
  // desk: F = stol (vrchna hrana y 1128: zakryje nohy aj pri priblizeni na tvar, kde sa popredie posunie najviac), monitor, klavesnica, hrnek.
  // Monitor je mierne natoceny k postave: predna stena = lichobeznik (lavy okraj kratsi) -> mq(u0, v0, u1, v1) v jej suradniciach 0..1
  var MX = [712, 914], MT = [910, 900], MB = [1062, 1072];
  var mp = function (u, v) { var yt = MT[0] + (MT[1] - MT[0]) * u, yb = MB[0] + (MB[1] - MB[0]) * u;
    return (MX[0] + (MX[1] - MX[0]) * u).toFixed(1) + " " + (yt + (yb - yt) * v).toFixed(1); };
  var mq = function (u0, v0, u1, v1) { return "M" + mp(u0, v0) + " L" + mp(u1, v0) + " L" + mp(u1, v1) + " L" + mp(u0, v1) + " Z"; };
  var SCR = [0.045, 0.075, 0.955, 0.925];   // obrazovka v ramci prednej steny; sq = obdlznik rozhrania v suradniciach obrazovky
  var sq = function (s0, t0, s1, t1, fill) { var U = function (s) { return SCR[0] + (SCR[2] - SCR[0]) * s; }, V = function (t) { return SCR[1] + (SCR[3] - SCR[1]) * t; };
    return '<path d="' + mq(U(s0), V(t0), U(s1), V(t1)) + '" fill="' + fill + '"/>'; };
  var scr = mq(SCR[0], SCR[1], SCR[2], SCR[3]), body = "M712 910 L914 900 L924 905 L924 1067 L914 1072 L712 1062 Z";
  d.insertAdjacentHTML("beforeend", '<clipPath id="rm_scrClip"><path d="' + scr + '"/></clipPath>');
  var deskF =
    '<g id="rm_dkGlow" opacity="0.35"><ellipse cx="818" cy="985" rx="180" ry="150" fill="url(#rm_gGlow)"/>' +     // ziara obrazovky + svetlo na tvari
    '<ellipse cx="626" cy="772" rx="122" ry="148" fill="url(#rm_gGlow)"/></g>' +
    '<g filter="url(#cut)"><rect x="60" y="1176" width="960" height="960" rx="16" fill="url(#rm_gDesk)"/>' +          // predna stena stola az pod zaber
    '<g fill="#b37853" stroke="#915c3c" stroke-width="3">' + [1210, 1326, 1442].map(function (y) {           // zasuvky (nad pasom titulkov)
      return '<rect x="88" y="' + y + '" width="180" height="100" rx="12"/><rect x="812" y="' + y + '" width="180" height="100" rx="12"/>'; }).join("") + '</g>' +
    '<g fill="#f3dcc2">' + [1260, 1376, 1492].map(function (y) { return '<circle cx="178" cy="' + y + '" r="9"/><circle cx="902" cy="' + y + '" r="9"/>'; }).join("") + '</g></g>' +
    '<g filter="url(#cut)"><path d="M72 1128 H1008 L1036 1168 H44 Z" fill="url(#rm_gDeskTop)"/><rect x="36" y="1164" width="1008" height="28" rx="10" fill="#b97c56"/></g>' +
    // monitor: noha, podstavec, skrinka (+ bocna stena), svietiaca obrazovka s naznakom rozhrania (bez textu)
    '<g filter="url(#cut)"><rect x="800" y="1050" width="26" height="88" fill="#3b4452"/><rect x="760" y="1132" width="106" height="18" rx="9" fill="#3b4452"/>' +
    '<path d="' + body + '" fill="#4b5563"/><path d="M914 900 L924 905 L924 1067 L914 1072 Z" fill="#39414d"/>' +
    '<path d="' + body + '" fill="none" stroke="#fbf5ea" stroke-width="6" stroke-linejoin="round"/></g>' +
    '<path d="' + scr + '" fill="url(#rm_gScr)"/>' +
    sq(0, 0, 1, 0.12, "#86b9e3") +
    sq(0.06, 0.2, 0.52, 0.86, "#ffffff") + sq(0.06, 0.2, 0.52, 0.3, "#f6c343") +
    sq(0.11, 0.4, 0.46, 0.46, "#c3d8ec") + sq(0.11, 0.54, 0.38, 0.6, "#c3d8ec") + sq(0.11, 0.68, 0.42, 0.74, "#c3d8ec") +
    sq(0.58, 0.2, 0.94, 0.66, "#ffffff") + sq(0.58, 0.2, 0.94, 0.3, "#f28b82") +
    sq(0.64, 0.48, 0.7, 0.6, "#86b9e3") + sq(0.74, 0.4, 0.8, 0.6, "#86b9e3") + sq(0.84, 0.34, 0.9, 0.6, "#86b9e3") +
    '<path d="M740 1070 L830 890 L870 890 L780 1070 Z" fill="#ffffff" opacity="0.22" clip-path="url(#rm_scrClip)"/>' +
    '<circle cx="' + mp(0.93, 0.965).replace(" ", '" cy="') + '" r="3.5" fill="#7cf5a2"/>' +
    // klavesnica + mys pred postavou, hrnek vlavo
    '<g filter="url(#cut)"><path d="M440 1136 H640 L654 1162 H426 Z" fill="#eef1f5"/><ellipse cx="712" cy="1150" rx="13" ry="9" fill="#eef1f5"/></g>' +
    '<g stroke="#c3cad4" stroke-width="4" stroke-dasharray="12 5"><path d="M446 1143 H634 M442 1150 H638 M438 1157 H642"/></g>' +
    '<g filter="url(#cut)"><path d="M200 1104 q-24 0 -24 20 q0 20 24 20" fill="none" stroke="#fbf5ea" stroke-width="9"/>' +
    '<path d="M198 1090 H256 V1140 q0 14 -14 14 H212 q-14 0 -14 -14 Z" fill="#fbf5ea"/><rect x="198" y="1108" width="58" height="16" fill="#e0795f"/>' +
    '<ellipse cx="227" cy="1090" rx="29" ry="7" fill="#efe2cc"/><ellipse cx="227" cy="1091" rx="23" ry="4.5" fill="#6b4a3a"/></g>';

  // bed: M = nocny stolik s lampou (vlavo, svetlo nesiaha k hlave), postel od postavy po pravy okraj (celo pod bankou teplomera), papuce
  var bedM =
    '<g fill="#4a1f12" opacity="0.32" filter="url(#soft6)"><ellipse cx="200" cy="1392" rx="112" ry="10"/><ellipse cx="800" cy="1400" rx="250" ry="15"/></g>' +
    '<circle cx="200" cy="1096" r="112" fill="#ffd98a" opacity="0.5" filter="url(#soft)"/>' +                         // teple svetlo lampy
    '<g filter="url(#cut)"><rect x="114" y="1346" width="18" height="40" rx="6" fill="#7c5038"/><rect x="268" y="1346" width="18" height="40" rx="6" fill="#7c5038"/>' +
    '<rect x="100" y="1200" width="200" height="156" rx="14" fill="#c9906a"/><rect x="120" y="1236" width="160" height="92" rx="10" fill="#d6a077"/>' +
    '<circle cx="200" cy="1282" r="9" fill="#f3dcc2"/><rect x="88" y="1186" width="224" height="24" rx="9" fill="#dcae86"/></g>' +
    '<g filter="url(#cut)"><rect x="236" y="1170" width="60" height="16" rx="3" fill="#5ab3e6"/><rect x="242" y="1157" width="50" height="14" rx="3" fill="#f6c343"/>' +
    '<rect x="196" y="1108" width="9" height="76" fill="#d9b36a"/><path d="M166 1188 q34 -22 68 0 z" fill="#e8c77f"/>' +
    '<path d="M160 1050 H240 L266 1122 H134 Z" fill="#fbe7bf"/></g>' +
    '<path d="M138 1114 H262" stroke="#f1cf8c" stroke-width="6" opacity="0.8"/>' +
    '<g fill="#7c5038"><rect x="612" y="1352" width="26" height="42" rx="7"/><rect x="936" y="1352" width="26" height="42" rx="7"/></g>' +
    '<g filter="url(#rough)"><rect x="966" y="1050" width="240" height="346" rx="42" fill="url(#rm_gSofaD)"/>' +          // celo (vrch pod bankou teplomera)
    '<rect x="988" y="1074" width="200" height="118" rx="30" fill="url(#rm_gSofa)"/>' +
    '<rect x="592" y="1268" width="390" height="92" rx="22" fill="' + o.sofaFront + '"/>' +
    '<rect x="600" y="1196" width="380" height="84" rx="28" fill="#fbf5ea"/>' +
    '<path d="M592 1216 C 592 1188 614 1172 648 1172 L 858 1174 C 874 1174 884 1184 884 1198 L 890 1318 C 864 1334 832 1320 802 1332 ' +
    'C 772 1344 738 1326 708 1336 C 678 1346 646 1330 618 1338 C 600 1343 590 1330 590 1316 Z" fill="url(#rm_gDuvet)"/>' +
    '<path d="M856 1174 C 872 1174 884 1184 884 1198 L 890 1318 L 862 1324 L 854 1200 Z" fill="#dfe7ef"/>' +
    '<path d="M900 1160 C 918 1146 956 1146 970 1162 C 978 1178 976 1200 966 1212 C 950 1220 916 1220 900 1212 C 890 1196 890 1174 900 1160 Z" fill="#fbf5ea"/></g>' +
    '<path d="M906 1186 q32 8 60 0" fill="none" stroke="#e6dccb" stroke-width="4" stroke-linecap="round"/>' +
    '<g stroke="#7f93ab" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.6"><path d="M636 1214 q70 14 150 2 M656 1272 q60 10 140 0"/></g>' +
    '<g filter="url(#cut)" fill="#e9a0a8"><path d="M742 1462 q30 -26 60 0 v8 h-60 z"/><path d="M814 1468 q30 -26 60 0 v8 h-60 z"/></g>';

  var LAY = { couch: { M: couchM }, desk: { M: deskM, F: deskF }, bed: { M: bedM } };
  var grp = function (L) { return SC.map(function (n) { return LAY[n][L] ? '<g id="rm_sc_' + n + '_' + L + '" opacity="' + (n === cur ? 1 : 0) + '">' + LAY[n][L] + '</g>' : ""; }).join(""); };
  PF.add("M",
    '<path d="M-200 1352 L1280 1352 L1280 2200 L-200 2200 Z" fill="url(#rm_gFloor)" filter="url(#rough)"/>' +
    '<g stroke="' + o.plank + '" stroke-width="4" opacity="0.5"><path d="M-200 1470 H1280 M-200 1640 H1280 M-200 1830 H1280"/></g>' +
    '<rect x="-200" y="1336" width="1480" height="26" fill="' + o.base + '" filter="url(#cut)"/>' +
    '<path id="rm_floorLight" d="M250 1372 L 560 1372 L 470 1512 L 110 1512 Z" fill="#fff4dc" opacity="0.26"/>' +
    '<ellipse cx="540" cy="1560" rx="480" ry="122" fill="' + o.rug + '" filter="url(#cut)"/>' +
    '<ellipse cx="540" cy="1560" rx="430" ry="96" fill="none" stroke="' + o.rugDash + '" stroke-width="10" stroke-dasharray="4 22" stroke-linecap="round"/>' +
    grp("M") +
    '<g id="rm_heatW" opacity="0" fill="none" stroke="#fff1d6" stroke-width="7" stroke-linecap="round">' +
    '<path id="rm_hw1" d="M300 1330 q12 -20 0 -40 q-12 -20 0 -40 q12 -20 0 -40"/><path id="rm_hw2" d="M780 1330 q12 -20 0 -40 q-12 -20 0 -40 q12 -20 0 -40"/>' +
    '<path id="rm_hw3" d="M540 1540 q12 -20 0 -40 q-12 -20 0 -40 q12 -20 0 -40"/></g>');
  PF.add("F", grp("F"));
  PF.P("rm_sun", 228, 580, { ty: 330 }); PF.P("rm_calPage", 772, 514);
  ["rm_lf1", "rm_lf2", "rm_lf3", "rm_lf4"].forEach(function (l) { PF.P(l, 80, 1300); });
  PF.P("rm_hw1", 300, 1290); PF.P("rm_hw2", 780, 1290); PF.P("rm_hw3", 540, 1500);
  var G = {};                                              // id skupin kazdej sceny (len vrstvy, kde ma scena obsah)
  SC.forEach(function (n) { G[n] = []; ["B", "M", "F"].forEach(function (L) { var id = "rm_sc_" + n + "_" + L;
    if (document.getElementById(id)) { PF.P(id, 540, 1200); G[n].push(id); } }); });
  // jemne kmitanie ziary obrazovky (perioda deli dlzku videa -> slucka sa nezasekne)
  var gp = PF.loopPeriod(2.8), gn = Math.round(PF.VO.total / gp) * 2 - 1;
  PF.tl.fromTo("#rm_dkGlow", { opacity: 0.35 }, { opacity: 0.24, duration: gp / 2, ease: "sine.inOut", yoyo: true, repeat: gn, immediateRender: false }, 0);
  var st = { sky: o.sky, calTxt: "–", light: ["#fff4dc", 0.26], merc: [930, 80], bulb: "#d9483b", leafCol: [o.leaves[0], o.leaves[1]] };
  var DROOP = [[0, 0, 0, 0], [-8, 0, 0, -6], [-20, -10, 12, -16], [-55, -40, 45, -35]];
  var api = {
    sky: function (col, t, dur) { PF.F("#rm_sky", st.sky, col, t, dur || 1); st.sky = col; },
    sun: function (up, t, dur) { PF.X("rm_sun", { ty: up ? 0 : 330 }, t, dur || 1.1, up ? "power2.out" : "power2.in"); },
    sunGlow: function (a, b, t, dur) { PF.O("#rm_sunGlow", a, b, t, dur || 0.8); },
    sunPulse: function (t, reps) { PF.tl.fromTo("#rm_sunGlow", { opacity: 1 }, { opacity: 0.55, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: reps, immediateRender: false }, t); },
    haze: function (t0, t1) {                 // tepelny opar cez okno (displacement filter len pocas trvania)
      PF.S("#rm_win", { attr: { filter: "url(#haze)" } }, t0);
      PF.AT("#hazeD", { scale: 0 }, { scale: 9 }, t0, 1.2, "power1.inOut");
      PF.AT("#hazeT", { baseFrequency: "0.012 0.05" }, { baseFrequency: "0.016 0.07" }, t0, Math.max(0.5, t1 - t0 - 0.3), "none");
      PF.AT("#hazeD", { scale: 9 }, { scale: 0 }, t1 - 0.3, 0.3); PF.S("#rm_win", { attr: { filter: "none" } }, t1);
    },
    heatWaves: function (t0, t1) {
      PF.O("#rm_heatW", 0, 0.8, t0, 0.4);
      ["rm_hw1", "rm_hw2", "rm_hw3"].forEach(function (h, i) { var n = Math.max(1, Math.floor((t1 - t0 - i * 0.2) / 1.1)) * 2 - 1; PF.XY(h, { ty: -60 }, t0 + i * 0.2, 0.55, "sine.inOut", n); });
      PF.O("#rm_heatW", 0.8, 0, t1 - 0.2, 0.2);
    },
    floorLight: function (col, op, t, dur) { PF.F("#rm_floorLight", st.light[0], col, t, dur || 1); PF.O("#rm_floorLight", st.light[1], op, t, dur || 1); st.light = [col, op]; },
    flip: function (txt, t, visible) {         // kalendar: novy den; viditelne = strhnutie stranky
      PF.S("#rm_calNum", { textContent: txt }, t);
      if (visible) {
        PF.S("#rm_calPageNum", { textContent: st.calTxt }, t); PF.S("#rm_calPage", { opacity: 1 }, t);
        PF.X("rm_calPage", { r: 30, ty: 170, s: 0.92 }, t + 0.02, 0.5, "power2.in"); PF.O("#rm_calPage", 1, 0, t + 0.32, 0.2);
        PF.X("rm_calPage", { r: 0, ty: 0, s: 1 }, t + 0.6, 0);
      }
      st.calTxt = txt;
    },
    circle: function (t) { PF.S("#rm_calCircle", { opacity: 1 }, t); PF.draw("rm_calCircle", t, 0.5); },
    circleOff: function (t) { PF.S("#rm_calCircle", { opacity: 0 }, t); },
    thermo: function (lvl, t, dur, ease) {    // 0 = normalne, 1 = uplne hore
      var h = Math.round(80 + 178 * lvl), y = 1010 - h;
      PF.AT("#rm_merc", { y: st.merc[0], height: st.merc[1] }, { y: y, height: h }, t, dur || 0.6, ease || "back.out(1.6)"); st.merc = [y, h];
    },
    bulb: function (col, t, dur) { PF.F("#rm_bulb", st.bulb, col, t, dur || 0.3); st.bulb = col; },
    plant: function (lvl, t, dur, ease) {     // vadnutie 0..3 (0 zdrava, 3 uplne zvadnuta)
      var a = DROOP[Math.max(0, Math.min(3, Math.round(lvl)))];
      ["rm_lf1", "rm_lf2", "rm_lf3", "rm_lf4"].forEach(function (l, i) { PF.X(l, { r: a[i] }, t, dur || 1.2, ease); });
    },
    plantColor: function (dead, t, dur) {
      var to = dead ? ["#9a8a4a", "#a8965a"] : [o.leaves[0], o.leaves[1]];
      PF.F("#rm_lf1 path, #rm_lf3 path", st.leafCol[0], to[0], t, dur || 1.4); PF.F("#rm_lf2 path, #rm_lf4 path", st.leafCol[1], to[1], t, dur || 1.4);
      st.leafCol = to;
    }
  };
  // ---------- spolocne rozhranie prostredi (recepty ho volaju bez ohladu na typ prostredia)
  api.kind = "room";
  // volne miesto pre odznak so stat. udajom (kruh r 95) podla sceny: mimo hlavy, kalendara, teplomera aj rekvizit popredia
  var ZONE = { couch: { x: 180, y: 960, r: 95 },          // medzi oknom a rastlinou
    desk: { x: 190, y: 946, r: 95 },                       // medzi oknom a hrnkom (monitor je vpravo)
    bed: { x: 836, y: 872, r: 95 } };                      // nad celom postele, medzi kalendarom a teplomerom (vlavo je lampa)
  api.badgeZone = Object.assign({}, ZONE[cur]);
  // ---------- sceny: prepnutie = papierova vymena rekvizit (stare spadnu dole a zmiznu, nove dopadnu zhora); viditelna vymena presne v case t
  api.scenes = SC.slice(); api.scene0 = cur;
  api.scene = function (name, t) {
    if (SC.indexOf(name) < 0) { console.warn("envRoom.scene: neznama scena '" + name + "' (" + SC.join(", ") + ")"); return; }
    if (name === cur) return;
    var old = cur, t0 = Math.max(0, t - 0.3), tp = Math.max(0, t - 0.02); cur = name;
    G[old].forEach(function (id) { PF.X(id, { ty: 240 }, t0, t - t0, "power2.in"); });
    PF.sceneSet("rm", old, false, t0, t - t0);
    G[old].forEach(function (id) { PF.X(id, { ty: 0 }, t + 0.01, 0); });            // po skonceni spat na miesto (uz neviditelne)
    G[name].forEach(function (id) { PF.X(id, { ty: -260 }, tp, 0); });               // nova scena caka nad zaberom, neviditelna
    PF.sceneSet("rm", name, false, tp, 0);
    PF.sceneSet("rm", name, true, t, 0.35);
    G[name].forEach(function (id) { PF.X(id, { ty: 0 }, t, 0.5, "back.out(1.4)"); });
    api.badgeZone = Object.assign({}, ZONE[name]);
  };
  api.metric = function (txt, t) { api.flip(txt, t, true); };
  api.metricReset = function (txt, t) { api.flip(txt, t, false); };
  api.metricLabel = function (txt, t) { PF.S("#rm_calLbl", { textContent: txt }, t + 0.4); };   // az ked stara stranka kalendara odletela
  api.mood = function (name, t, t1) {                    // night | hot | cold -> vracia funkciu na navrat do normalu
    if (name === "night") {
      api.sky("#2d3b6b", t, 0.9); api.sun(false, t, 0.01); PF.fx.night(0, 0.45, t); api.floorLight("#fff4dc", 0, t, 0.8);
      return function (tt, d) { api.sky(o.sky, tt, d || 0.01); PF.fx.night(0.45, 0, tt, d || 0.01); api.floorLight("#fff4dc", 0.26, tt, d || 0.01); };
    }
    if (name === "hot") {
      api.sun(true, t); api.sky("#ffc07a", t + 0.1); api.sunGlow(0, 1, t + 0.4); api.floorLight("#ffcf8f", 0.45, t + 0.2);
      api.thermo(1, t + 0.5); api.bulb("#ff2d1f", t + 0.6);
      if (t1 && t1 - t > 1.2) { api.heatWaves(t + 0.5, t1); api.haze(t + 0.2, t1); }
      return function (tt, d) { api.sun(false, tt, d || 0.01); api.sky(o.sky, tt, d || 0.01); api.sunGlow(1, 0, tt, d || 0.01); api.floorLight("#fff4dc", 0.26, tt, d || 0.01);
        api.thermo(0, tt, d || 0.01); api.bulb("#d9483b", tt, d || 0.01); };
    }
    if (name === "cold") {
      api.sky("#e6eef6", t, 0.8); api.thermo(-0.3, t + 0.2, 0.8, "power2.inOut"); api.bulb("#6aa6e8", t + 0.4); api.floorLight("#dfeaf5", 0.3, t, 0.8);
      return function (tt, d) { api.sky(o.sky, tt, d || 0.01); api.thermo(0, tt, d || 0.01); api.bulb("#d9483b", tt, d || 0.01); api.floorLight("#fff4dc", 0.26, tt, d || 0.01); };
    }
    return function () {};
  };
  return api;
};
