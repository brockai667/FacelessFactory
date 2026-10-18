// Prostredie: VESMIRNA STANICA (papierovy modul, okruhle okno so Zemou a hviezdami, obrazovka misie, madla, kable,
// blikajuce kontrolky, vznasajuce sa predmety). Rozlozenie bez prekryvania s postavou (x 250-830 aj pri prevrateni):
// okno 79-371 x 464-756, obrazovka 760-1010 x 450-640, panel 800-970 x 690-810, madla x 40-66 / 1014-1040 (y 880-1180),
// kable len v rohoch stropu, podlaha od y 1560. PF.envSpace(opts) -> API (show, screen, alarm, scene).
// SCENY (opts.scene = uvodna, default "station"): "station" = interier stanice, "mars" = povrch Marsu (obloha, slnko
// 162-218 / 442-498, 2 mesiace x 783-960 / y 336-463 (pod kartou hooku), mesas y 1090-1330, kupola zakladne so solarnym
// panelom x -20-370 / y 988-1330, skaly x 90-305 a 812-1020 / y 1358-1452, rover x 760-996 / y 1158-1334, zem od y ~1310).
// Kazda scena = skupiny sp_sc_<meno>_B/M/F vo vrstvach sp_B/M/F (prepina ich PF.sceneSet); api.scene(meno, t) = prachovy
// prestrih (PF.fx.cloudWipe), viditelna vymena presne v case t. Hlava x 375-705 / y 560-1000 je v M/F volna.
PF.envSpace = function (o) {
  o = Object.assign({ scene: "station", wall: ["#e7edf3", "#c9d4df"], panel: "#dbe3ec", seam: "#b7c4d2", accent: "#f39c42", rail: "#f6c343", screen: "#16202e", led: "#7cf5a2" }, o || {});
  var SCENES = ["station", "mars"];
  if (SCENES.indexOf(o.scene) < 0) { console.warn("envSpace: neznama scena '" + o.scene + "' -> station"); o.scene = "station"; }
  var vis = function (name) { return name === o.scene ? "" : ' opacity="0"'; };   // uvodna scena viditelna, ostatne skryte
  // ---------- tvary Marsu (pouzite aj v clipPath)
  var FAR = "M-200 1238 L -150 1238 C -130 1230 -122 1206 -112 1192 L 20 1192 C 30 1210 44 1234 70 1240 L 140 1240 " +
    "C 160 1236 166 1216 172 1206 L 250 1206 C 258 1222 270 1236 300 1238 L 330 1238 C 350 1230 358 1170 366 1150 L 470 1150 " +
    "C 478 1172 488 1218 520 1226 L 600 1226 C 624 1222 632 1190 640 1178 L 716 1178 C 724 1196 736 1222 770 1228 L 790 1228 " +
    "C 812 1220 822 1130 830 1098 L 1010 1098 C 1018 1130 1030 1196 1070 1204 L 1130 1204 C 1146 1196 1150 1176 1156 1166 L 1280 1166 V2200 H-200 Z";
  var NEAR = "M-200 1290 C -120 1276 -40 1270 40 1276 C 110 1282 150 1296 230 1292 C 300 1288 330 1270 380 1268 " +
    "C 430 1266 470 1284 540 1286 C 620 1288 660 1262 720 1258 L 760 1258 C 770 1240 776 1232 790 1230 L 850 1230 " +
    "C 862 1236 868 1252 880 1260 C 960 1270 1040 1250 1120 1256 C 1180 1260 1240 1272 1280 1276 V2200 H-200 Z";
  var GROUND = "M-200 1336 C 80 1326 300 1342 520 1332 C 690 1324 790 1306 940 1306 C 1060 1306 1180 1318 1280 1324 V2200 H-200 Z";
  document.getElementById("defs").insertAdjacentHTML("beforeend",
    '<linearGradient id="sp_gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + o.wall[0] + '"/><stop offset="1" stop-color="' + o.wall[1] + '"/></linearGradient>' +
    '<radialGradient id="sp_gEarth" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#5fa8ea"/><stop offset="1" stop-color="#23579d"/></radialGradient>' +
    '<radialGradient id="sp_gAtmo"><stop offset="0.82" stop-color="#9fd8ff" stop-opacity="0"/><stop offset="0.93" stop-color="#9fd8ff" stop-opacity="0.8"/><stop offset="1" stop-color="#9fd8ff" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="sp_winClip"><circle cx="225" cy="610" r="118"/></clipPath><clipPath id="sp_earthClip"><circle cx="225" cy="700" r="150"/></clipPath>' +
    // Mars: obloha "butterscotch", zem, kupola, slnko
    '<linearGradient id="sp_gMarsSky" gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="1330"><stop offset="0" stop-color="#e9b58e"/><stop offset="1" stop-color="#cf7a55"/></linearGradient>' +
    '<linearGradient id="sp_gMarsGround" gradientUnits="userSpaceOnUse" x1="0" y1="1310" x2="0" y2="1920"><stop offset="0" stop-color="#b9603f"/><stop offset="1" stop-color="#9c4a30"/></linearGradient>' +
    '<radialGradient id="sp_gDome" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#fffaf2"/><stop offset="1" stop-color="#e4d2b9"/></radialGradient>' +
    '<radialGradient id="sp_gMarsSun"><stop offset="0" stop-color="#fff6e6" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6e6" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="sp_gMarsHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e09a77" stop-opacity="0"/><stop offset="1" stop-color="#e09a77" stop-opacity="0.75"/></linearGradient>' +
    '<clipPath id="sp_farClip"><path d="' + FAR + '"/></clipPath><clipPath id="sp_domeClip"><path d="M84 1318 A 128 128 0 0 1 340 1318 Z"/></clipPath>');
  var rr = PF.rnd(21), stars = "";
  for (var i = 0; i < 40; i++) stars += '<circle cx="' + (100 + rr() * 250).toFixed(0) + '" cy="' + (490 + rr() * 240).toFixed(0) + '" r="' + (1 + rr() * 2.2).toFixed(1) + '" fill="#ffffff" opacity="' + (0.4 + rr() * 0.6).toFixed(2) + '"/>';
  var land = '<path d="M60 660 q30 -40 70 -20 q20 30 60 10 q30 -30 50 10 q-10 40 -60 40 q-40 30 -90 0 z" fill="#6fbf73"/>' +
    '<path d="M250 720 q40 -30 80 0 q10 40 -30 50 q-40 10 -50 -50 z" fill="#7fca7c"/><path d="M130 780 q50 -10 70 20 q-30 30 -70 -20 z" fill="#6fbf73"/>';
  var clouds = '<path d="M80 640 q40 -12 80 0 t80 0" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.85"/>' +
    '<path d="M170 745 q30 -10 60 0 t60 0" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>';
  var panels = ""; for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++)
    panels += '<rect x="' + (30 + c * 345) + '" y="' + (300 + r * 315) + '" width="330" height="300" rx="26" fill="' + o.panel + '" stroke="' + o.seam + '" stroke-width="4"/>';
  var rivets = ""; for (var k = 0; k < 12; k++) rivets += '<circle cx="' + (50 + k * 90) + '" cy="282" r="6" fill="' + o.seam + '"/>';
  var rail = function (x) { return '<rect x="' + x + '" y="880" width="26" height="300" rx="13" fill="' + o.rail + '"/>' +
    '<rect x="' + (x < 540 ? x : x - 18) + '" y="905" width="44" height="16" rx="8" fill="#d9a92e"/><rect x="' + (x < 540 ? x : x - 18) + '" y="1140" width="44" height="16" rx="8" fill="#d9a92e"/>'; };
  // ---------- scena STATION (dnesny interier)
  var stationB = '<rect x="-200" y="-200" width="1480" height="2400" fill="url(#sp_gWall)"/>' + panels + rivets +
    '<rect x="-200" y="-200" width="1480" height="470" fill="#bcc9d6"/><rect x="-200" y="96" width="1480" height="36" fill="#f7fbff" opacity="0.8"/>' +
    '<g fill="none" stroke="#6d7b8c" stroke-width="12" stroke-linecap="round" opacity="0.9"><path d="M-30 170 C 60 250 150 150 250 230"/><path d="M1110 180 C 1020 250 930 160 830 230"/></g>' +
    '<g filter="url(#cut)"><circle cx="225" cy="610" r="146" fill="#8d9aab"/><circle cx="225" cy="610" r="132" fill="#dfe6ee"/>' +
    '<g fill="#8d9aab">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { var rad = a * Math.PI / 180; return '<circle cx="' + (225 + Math.cos(rad) * 139).toFixed(1) + '" cy="' + (610 + Math.sin(rad) * 139).toFixed(1) + '" r="5"/>'; }).join("") + '</g></g>' +
    '<g clip-path="url(#sp_winClip)"><rect x="90" y="480" width="280" height="270" fill="#0f1733"/>' + stars +
    '<g clip-path="url(#sp_earthClip)"><circle cx="225" cy="700" r="150" fill="url(#sp_gEarth)"/><g id="sp_land">' + land + '<g transform="translate(300 0)">' + land + '</g></g>' +
    '<g id="sp_clouds">' + clouds + '<g transform="translate(300 0)">' + clouds + '</g></g></g><circle cx="225" cy="700" r="160" fill="url(#sp_gAtmo)"/></g>' +
    '<path d="M110 540 q40 -40 100 -46" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.35"/>' +
    '<g filter="url(#cut)"><rect x="760" y="450" width="250" height="190" rx="16" fill="#8d9aab"/><rect id="sp_scr" x="776" y="466" width="218" height="158" rx="10" fill="' + o.screen + '"/></g>' +
    '<text id="sp_scrLbl" x="885" y="506" style="font-family:Pop;font-weight:600;font-size:21px;fill:' + o.led + ';text-anchor:middle;letter-spacing:3px" opacity="0.85">MISSION DAY</text>' +
    '<text id="sp_scrTxt" x="885" y="596" style="font-family:Pop;font-weight:600;font-size:74px;fill:' + o.led + ';text-anchor:middle">0</text>' +
    '<g filter="url(#cut)"><rect x="800" y="690" width="170" height="120" rx="12" fill="#cfd8e2" stroke="' + o.seam + '" stroke-width="3"/>' +
    '<circle id="sp_led1" cx="840" cy="730" r="11" fill="#3fd67a"/><circle id="sp_led2" cx="885" cy="730" r="11" fill="' + o.accent + '"/><circle id="sp_led3" cx="930" cy="730" r="11" fill="#e0483d"/>' +
    '<rect x="828" y="760" width="114" height="14" rx="7" fill="#9aa7b6"/><rect x="828" y="782" width="80" height="14" rx="7" fill="#9aa7b6"/></g>' +
    '<g filter="url(#cut)">' + rail(40) + rail(1014) + '</g>';
  var stationM = '<g filter="url(#cut)"><path d="M-200 1560 H1280 V2200 H-200 Z" fill="#aebccb"/>' +
    '<rect x="40" y="1610" width="260" height="160" rx="18" fill="#c9d4df" stroke="#9fb0c2" stroke-width="4"/><rect x="780" y="1610" width="260" height="160" rx="18" fill="#c9d4df" stroke="#9fb0c2" stroke-width="4"/>' +
    '<rect x="90" y="1650" width="160" height="20" rx="10" fill="' + o.accent + '"/><rect x="830" y="1650" width="160" height="20" rx="10" fill="' + o.accent + '"/></g>' +
    '<g id="sp_float"></g>';
  var stationF = '<g filter="url(#dof)" opacity="0.95"><path d="M-80 1760 C 60 1700 160 1820 260 1990" fill="none" stroke="#56657a" stroke-width="34" stroke-linecap="round"/></g>';
  // ---------- scena MARS: B = obloha, slnko, prachove pasy, mesiace, mesas, kupola zakladne
  var streaks = '<path d="M-60 560 q150 -16 300 0 t300 0" stroke-width="9"/><path d="M640 468 q110 -12 220 0 t220 0" stroke-width="7"/>' +
    '<path d="M300 716 q130 -14 260 0" stroke-width="6"/><path d="M860 800 q120 -12 240 0" stroke-width="8"/>';
  var domeLines = '<ellipse cx="212" cy="1318" rx="62" ry="128"/><ellipse cx="212" cy="1318" rx="110" ry="128"/>';
  var win = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="13" fill="#3d5a78" stroke="#cdbb9f" stroke-width="4"/><path d="M' + (x - 6) + ' ' + (y - 5) + ' q5 -5 11 -4" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>'; };
  var edge = function (d) { return d.replace(" V2200 H-200 Z", ""); };   // horna hrana vrstvy krajiny
  var shade = function (d) {   // mekky tien nad hranou vrstvy (papierove vrstvy krajiny)
    return '<path d="' + edge(d) + '" transform="translate(0 -5)" fill="none" stroke="#5a2616" stroke-width="12" opacity="0.22" filter="url(#soft6)"/>'; };
  var marsB = '<rect x="-200" y="-200" width="1480" height="1760" fill="url(#sp_gMarsSky)"/>' +
    '<circle cx="190" cy="470" r="92" fill="url(#sp_gMarsSun)"/><g filter="url(#cut)"><circle cx="190" cy="470" r="28" fill="#fff4e4"/></g>' +
    '<g id="sp_mStreaks" fill="none" stroke="#f7d9bc" stroke-linecap="round" opacity="0.45">' + streaks + '<g transform="translate(1180 0)">' + streaks + '</g></g>' +
    '<g filter="url(#cut)"><path d="M864 382 C 860 354 888 336 916 340 C 944 344 960 368 953 394 C 946 420 914 432 888 424 C 870 418 866 400 864 382 Z" fill="#efe1d0"/>' +
    '<circle cx="921" cy="373" r="11" fill="#dcc7b0"/><circle cx="890" cy="400" r="6" fill="#dcc7b0"/><circle cx="934" cy="408" r="4" fill="#dcc7b0"/>' +
    '<circle cx="798" cy="448" r="15" fill="#f4e9dc"/><circle cx="803" cy="444" r="4" fill="#e2d2c0"/></g>' +
    '<g filter="url(#rough)"><path d="' + FAR + '" fill="#c47a5d"/></g>' +
    '<g clip-path="url(#sp_farClip)"><g fill="#e2a483"><path d="M826 1098 H1014 V1110 H826 Z"/><path d="M362 1150 H474 V1160 H362 Z"/><path d="M636 1178 H720 V1187 H636 Z"/><path d="M-116 1192 H24 V1201 H-116 Z"/><path d="M168 1206 H254 V1214 H168 Z"/></g>' +
    '<path d="M780 1146 H1040 M780 1178 H1060 M340 1190 H500" fill="none" stroke="#b0664a" stroke-width="5" opacity="0.45"/></g>' +
    '<rect x="-200" y="1120" width="1480" height="200" fill="url(#sp_gMarsHaze)"/>' +
    shade(NEAR) + '<g filter="url(#rough)"><path d="' + NEAR + '" fill="#a3553c"/></g>' +
    '<ellipse cx="220" cy="1326" rx="170" ry="14" fill="#5a2616" opacity="0.3" filter="url(#soft6)"/>' +
    '<g filter="url(#cut)"><rect x="25" y="1262" width="6" height="60" fill="#8f8a84"/><path d="M-20 1238 L 58 1224 L 74 1262 L -4 1276 Z" fill="#4f7196"/>' +
    '<path d="M6 1233 L 22 1271 M32 1229 L 48 1267 M-12 1257 L 66 1243" fill="none" stroke="#8db0d2" stroke-width="2.5"/>' +
    '<rect x="263" y="1000" width="7" height="210" rx="3" fill="#8f8a84"/>' +
    '<path d="M244 1050 Q 262 1022 292 1034 Q 272 1054 244 1050 Z" fill="#efe6d8" stroke="#b9ab96" stroke-width="3"/>' +
    '<rect x="318" y="1262" width="52" height="58" rx="10" fill="#eadfcd"/><rect x="336" y="1276" width="22" height="38" rx="6" fill="#b9ab96"/>' +
    '<path d="M84 1318 A 128 128 0 0 1 340 1318 Z" fill="url(#sp_gDome)"/>' +
    '<g clip-path="url(#sp_domeClip)"><g fill="none" stroke="#dccab0" stroke-width="3">' + domeLines + '</g><rect x="84" y="1286" width="256" height="12" fill="#8d9aab"/></g>' +
    '<path d="M190 1320 V1262 a22 22 0 0 1 44 0 V1320 Z" fill="#cdbb9f"/><rect x="220" y="1290" width="8" height="4" rx="2" fill="#8f8a84"/>' +
    win(134, 1250) + win(290, 1250) + '<rect x="72" y="1310" width="286" height="18" rx="6" fill="#d9c8ae"/></g>' +
    '<circle id="sp_mBeacon" cx="266" cy="996" r="8" fill="#e0483d"/>';
  // M = zem s dunami, kamene, skaly, rover (vsetko mimo x 380-700 nad y 1330 -> postava nic neprekryva)
  var wheel = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="17" fill="#4a4440"/><circle cx="' + x + '" cy="' + y + '" r="7" fill="#a39b91"/>'; };
  var marsM = shade(GROUND) + '<path d="' + GROUND + '" fill="url(#sp_gMarsGround)" filter="url(#rough)"/>' +
    '<g fill="none" stroke-linecap="round"><path d="M-200 1394 C 60 1376 300 1402 560 1390 S 1000 1372 1280 1392" stroke="#c9714c" stroke-width="7" opacity="0.55"/>' +
    '<path d="M-200 1512 C 120 1494 380 1526 700 1510 S 1120 1494 1280 1512" stroke="#a9563a" stroke-width="6" opacity="0.45"/>' +
    '<path d="M-200 1796 C 200 1774 520 1810 820 1792 S 1150 1780 1280 1798" stroke="#8d4229" stroke-width="7" opacity="0.4"/></g>' +
    '<g fill="#86412b" opacity="0.8"><ellipse cx="60" cy="1520" rx="12" ry="5"/><ellipse cx="330" cy="1378" rx="9" ry="4"/><ellipse cx="740" cy="1436" rx="10" ry="4"/>' +
    '<ellipse cx="1030" cy="1540" rx="13" ry="5"/><ellipse cx="160" cy="1850" rx="14" ry="5"/><ellipse cx="960" cy="1860" rx="12" ry="5"/></g>' +
    '<g filter="url(#cut)"><path d="M92 1442 L 106 1388 L 148 1358 L 204 1366 L 236 1404 L 240 1442 Z" fill="#8e4630"/><path d="M106 1388 L 148 1358 L 204 1366 L 172 1394 Z" fill="#b5633f"/>' +
    '<path d="M250 1448 L 260 1416 L 288 1404 L 306 1428 L 304 1448 Z" fill="#96492f"/><path d="M260 1416 L 288 1404 L 282 1422 Z" fill="#b8683f"/>' +
    '<path d="M812 1452 L 826 1410 L 870 1384 L 926 1394 L 952 1430 L 950 1452 Z" fill="#8e4630"/><path d="M826 1410 L 870 1384 L 926 1394 L 890 1414 Z" fill="#b5633f"/>' +
    '<path d="M966 1448 L 976 1420 L 1002 1412 L 1020 1432 L 1016 1448 Z" fill="#96492f"/><path d="M976 1420 L 1002 1412 L 996 1426 Z" fill="#b8683f"/></g>' +
    '<ellipse cx="872" cy="1334" rx="120" ry="8" fill="#5a2616" opacity="0.35" filter="url(#soft6)"/>' +
    '<g filter="url(#cut)"><g fill="#3a3531"><circle cx="800" cy="1308" r="15"/><circle cx="878" cy="1308" r="15"/><circle cx="956" cy="1308" r="15"/></g>' +
    '<path d="M788 1316 L 826 1276 L 866 1316 M826 1276 L 904 1268 L 944 1316" fill="none" stroke="#7d7770" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<g transform="rotate(-24 784 1246)"><rect x="762" y="1236" width="44" height="20" rx="5" fill="#5f5953"/><path d="M771 1233 v26 M780 1233 v26 M789 1233 v26 M798 1233 v26" stroke="#8a837b" stroke-width="3"/></g>' +
    '<rect x="790" y="1230" width="160" height="40" rx="8" fill="#efe6d8"/><rect x="790" y="1258" width="160" height="12" rx="5" fill="#d7c8b1"/>' +
    '<rect x="804" y="1220" width="62" height="12" rx="4" fill="#e2b24c"/><rect x="878" y="1216" width="30" height="16" rx="4" fill="#cfc3b0"/>' +
    '<rect x="820" y="1206" width="4" height="16" fill="#8f8a84"/><ellipse cx="822" cy="1204" rx="16" ry="6" fill="#dcd3c5" transform="rotate(-20 822 1204)"/>' +
    '<path d="M950 1254 L 980 1266 L 986 1294" fill="none" stroke="#8f8a84" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="986" cy="1298" r="8" fill="#6f6a64"/>' +
    '<rect x="928" y="1182" width="8" height="50" rx="3" fill="#8f8a84"/>' + wheel(788, 1316) + wheel(866, 1316) + wheel(944, 1316) + '</g>' +
    '<g id="sp_mCam" filter="url(#cut)"><rect x="908" y="1158" width="50" height="28" rx="8" fill="#efe6d8"/>' +
    '<circle cx="924" cy="1172" r="7" fill="#2f3945"/><circle cx="942" cy="1172" r="7" fill="#2f3945"/><circle cx="926" cy="1170" r="2" fill="#9fd8ff"/><circle cx="944" cy="1170" r="2" fill="#9fd8ff"/></g>';
  // F = rozmazane skaly v rohoch (popredie, paralaxa)
  var marsF = '<g filter="url(#dof)" opacity="0.95"><path d="M-130 1800 C -60 1748 40 1740 118 1766 C 190 1790 240 1850 262 1930 L 270 2020 L -130 2020 Z" fill="#7c3a26"/>' +
    '<path d="M-40 1778 C 20 1758 90 1758 140 1782 C 90 1794 30 1802 -40 1812 Z" fill="#a0543a"/>' +
    '<path d="M1000 1990 C 1020 1920 1090 1886 1190 1896 L 1190 2020 L 1000 2020 Z" fill="#84412b"/></g>';
  PF.add("B", '<g id="sp_B"><g id="sp_sc_station_B"' + vis("station") + '>' + stationB + '</g><g id="sp_sc_mars_B"' + vis("mars") + '>' + marsB + '</g></g>');
  PF.add("M", '<g id="sp_M"><g id="sp_sc_station_M"' + vis("station") + '>' + stationM + '</g><g id="sp_sc_mars_M"' + vis("mars") + '>' + marsM + '</g></g>');
  PF.add("F", '<g id="sp_F"><g id="sp_sc_station_F"' + vis("station") + '>' + stationF + '</g><g id="sp_sc_mars_F"' + vis("mars") + '>' + marsF + '</g></g>');
  // pohyb Zeme a oblakov (periody delia dlzku videa -> slucka)
  var per = PF.loopPeriod(9), rep = Math.round(PF.VO.total / per) - 1;
  PF.tl.fromTo("#sp_land", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(-300 0)" }, duration: per, ease: "none", repeat: rep, immediateRender: false }, 0);
  var per2 = PF.loopPeriod(6), rep2 = Math.round(PF.VO.total / per2) - 1;
  PF.tl.fromTo("#sp_clouds", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(-300 0)" }, duration: per2, ease: "none", repeat: rep2, immediateRender: false }, 0);
  var lp = PF.loopPeriod(1.2), lr = Math.round(PF.VO.total / lp) * 2 - 1;
  ["sp_led1", "sp_led2", "sp_led3"].forEach(function (id, i) {
    var a = i === 1 ? 0.25 : 1, b = i === 1 ? 1 : 0.25;   // stred blika v protifaze; vsetko od 0 -> cista slucka
    PF.tl.fromTo("#" + id, { opacity: a }, { opacity: b, duration: lp / 2, ease: "steps(1)", yoyo: true, repeat: lr, immediateRender: false }, 0);
  });
  // vznasajuce sa predmety v prazdnych zonach steny: jablko (160,870), kvapka vody, zosit, pero (pomaly drift + rotacia, slucka)
  var items = [
    ["M0 -30 c 26 -8 40 16 30 36 c -8 18 -22 20 -30 14 c -8 6 -22 4 -30 -14 c -10 -20 4 -44 30 -36 z", "#e0483d", 160, 870],
    ["M0 -26 c 20 0 32 14 30 28 c -2 16 -16 24 -30 24 c -14 0 -28 -8 -30 -24 c -2 -14 10 -28 30 -28 z", "#6cc0ee", 930, 920],
    ["M-40 -30 h80 v60 h-80 z", "#f6c343", 130, 1330], ["M-40 -8 h80 l14 8 l-14 8 h-80 z", "#e0483d", 950, 1300]];
  var fl = document.getElementById("sp_float");
  items.forEach(function (it, i) {
    var g = PF.el("g", {}, fl); g.id = "sp_it" + i; g.setAttribute("filter", "url(#cut)");
    var inner = PF.el("g", { transform: "translate(" + it[2] + " " + it[3] + ")" }, g);
    PF.el("path", { d: it[0], fill: it[1], stroke: "#ffffff", "stroke-width": 4 }, inner);
    if (i === 0) PF.el("path", { d: "M0 -30 q4 -14 14 -18", fill: "none", stroke: "#6b4a3a", "stroke-width": 5 }, inner);
    if (i === 2) PF.el("path", { d: "M-30 -14 h60 M-30 0 h60 M-30 14 h40", stroke: "#c9973a", "stroke-width": 4 }, inner);
    PF.P(g.id, it[2], it[3]);
    var p = PF.loopPeriod(3 + i * 0.7), n = Math.round(PF.VO.total / p) * 2 - 1;
    PF.XY(g.id, { tx: (i % 2 ? -1 : 1) * (15 + i * 4), ty: -(20 + i * 4), r: (i % 2 ? -1 : 1) * (20 + i * 8) }, 0, p / 2, "sine.inOut", n);
  });
  // Mars: prachove pasy na oblohe (1 dlazdica za celu dlzku videa = slucka), majak na anteny kupoly, kamera rovera sa rozhliada
  PF.tl.fromTo("#sp_mStreaks", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(-1180 0)" }, duration: PF.VO.total, ease: "none", immediateRender: false }, 0);
  var bp = PF.loopPeriod(1.6), br = Math.round(PF.VO.total / bp) * 2 - 1;
  PF.tl.fromTo("#sp_mBeacon", { opacity: 1 }, { opacity: 0.2, duration: bp / 2, ease: "steps(1)", yoyo: true, repeat: br, immediateRender: false }, 0);
  PF.P("sp_mCam", 932, 1184);
  var cp = PF.loopPeriod(5), cn = Math.round(PF.VO.total / cp) * 2 - 1;
  PF.XY("sp_mCam", { r: 9 }, 0, cp / 2, "sine.inOut", cn);
  var lbl = "MISSION DAY";   // ulozeny nadpis obrazovky (nastavuje metricLabel; screen() s vlastnym nadpisom ho nemeni)
  var api = {
    show: function (on, t) { ["#sp_B", "#sp_M", "#sp_F"].forEach(function (s) { PF.S(s, { opacity: on ? 1 : 0 }, t); }); },
    screen: function (big, t, label, size) {  // obrazovka misie: velky text + maly nadpis (bez nadpisu = ulozeny lbl)
      PF.S("#sp_scrTxt", { textContent: big, attr: { style: "font-family:Pop;font-weight:600;font-size:" + (size || 74) + "px;fill:" + o.led + ";text-anchor:middle" } }, t);
      PF.S("#sp_scrLbl", { textContent: label || lbl }, t);
      PF.O("#sp_scrTxt,#sp_scrLbl", 0.2, 1, t, 0.25, "steps(3)");
    },
    alarm: function (t0, t1) { var n = Math.max(1, Math.floor((t1 - t0) / 0.4)) * 2 - 1; PF.tl.fromTo("#sp_scr", { fill: o.screen }, { fill: "#5a1d22", duration: 0.2, ease: "steps(1)", yoyo: true, repeat: n, immediateRender: false }, t0); }
  };
  // ---------- sceny: prachovy prestrih (zakrytie cca t-0.1 .. t+0.05), vymena viditelnosti presne v t
  var cur = o.scene, WIPE = { mars: ["#d9a37a", "#c98b63", "#b87552"], station: ["#ffffff", "#eef2f6", "#e1e8ef"] };
  var DUST = { mars: "#f3d2b2" }, dust0 = null;   // farba prachu vo vzduchu (PF.fx.dust): na Marse piesocna, na stanici povodna
  var dustTint = function (name, t) {
    var du = document.getElementById("dust"); if (!du) return;
    if (dust0 === null) dust0 = du.getAttribute("fill") || "#ffffff";
    PF.S("#dust", { attr: { fill: DUST[name] || dust0 } }, t);
  };
  if (DUST[o.scene]) PF.S("#dust", { attr: { fill: DUST[o.scene] } }, 0);
  api.scenes = SCENES; api.scene0 = o.scene;
  api.scene = function (name, t) {
    if (SCENES.indexOf(name) < 0) { console.warn("envSpace.scene: neznama scena '" + name + "'"); return; }
    if (name === cur) return;
    if (t >= 0.6) PF.fx.cloudWipe(t - 0.55, -1, WIPE[name]);   // uplne na zaciatku videa len okamzita vymena
    PF.sceneSet("sp", cur, false, t, 0); PF.sceneSet("sp", name, true, t, 0);
    dustTint(name, t);
    cur = name;
  };
  // ---------- spolocne rozhranie prostredi
  api.kind = "space"; api.badgeZone = null; api.float = true;
  api.metric = function (txt, t) { api.screen(txt, t); };
  api.metricReset = function (txt, t) { api.screen(txt, t); };
  api.metricLabel = function (txt, t) { lbl = txt; PF.S("#sp_scrLbl", { textContent: txt }, t); };
  api.mood = function (name, t) {
    if (name === "night") { PF.fx.night(0, 0.35, t); return function (tt, d) { PF.fx.night(0.35, 0, tt, d || 0.01); }; }
    if (name === "hot") { PF.fx.tone("#ffb070", 0, 0.4, t); api.alarm(t + 0.2, t + 2.2); return function (tt, d) { PF.fx.tone("#ffb070", 0.4, 0, tt, d || 0.01); }; }
    if (name === "cold") { PF.fx.tone("#9fc4ef", 0, 0.4, t); PF.fx.frost(true, t); return function (tt, d) { PF.fx.tone("#9fc4ef", 0.4, 0, tt, d || 0.01); PF.fx.frost(false, tt, d); }; }
    return function () {};
  };
  return api;
};
