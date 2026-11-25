// pack_ninegee.js - momenty pre video 041 Pulling Nine G
// ngjet    "" = kokpit stihacky od snimku 0 (obloha + horizont za prekrytom, sedadlo, pristrojova doska, knipel, plyn, helma); bez dirty
//          "bank" = ostra zakruta: horizont sa naklopi, umely horizont na doske tiez, otras (dirty "jet"); "level" = vyrovnanie
//          "heavy" = 9 G: zavazie x9 padne na helmu, hlava klesne do ramien, lica ovisnu (dirty "heavy")
// ngmeter  cislo = displej G na doske napocita na hodnotu (9 = cerveny zablesk); "reset" = 1.0 (dirty "gmeter")
// ngblood  "show" = rontgen tela (krv po hlavu, alebo o.level); "drain" = krv stecie z hlavy do nohy; "nudge" = krv trochu hore (o.level); "full" = krv az po hlavu (dirty "blood")
// ngsight  "fade" = cely obraz straca farbu; "edges" = sede okraje sa zatvoria; "tunnel" = tunel sa zuzi; "black" = cierna, svietia len oci;
//          "awake" = oci behaju + STILL AWAKE; "out" = oci sa zavru, hrdina ovisne v sedom svete; "confused" = spiralove oci, otazniky; "pop" = farby vybuchnu (dirty "vision")
// ngclock  "guess" = velky displej "? SEC" bliká, rucicka sa toci; cislo = napocita sekundy (OUT COLD); "confused" = druhy riadok +15 SEC CONFUSED (dirty "clock")
// ngstrain "grip" = zovrie knipel, zatne zuby; "squeeze" = napne nohy a brucho (ziara, chvenie); "breathe" = styri prudke vydychy; "suit" = G oblek sa nafukne na nohach (dirty "strain")
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, OV = H.OV, st = H.st, shake = H.shake, uid = H.uid;
  var INK = "#2b2320", RED = "#d9483b", GRN = "#7dffa6", FULL = 600, LOW = 1130;
  function Hr() { return C().hero; }
  function flash(t, a) { tl.fromTo("#mo_flash", { opacity: a || 0.6 }, { opacity: 0, duration: 0.25, ease: "power1.out", immediateRender: false }, t); }

  // ================= KOKPIT (pozadie od snimku 0)
  function buildJet() {
    if (st.ng) return;
    var p = Hr().p, i, b = "", f = "", cl = "", gr = "";
    document.getElementById("defs").insertAdjacentHTML("beforeend",
      '<linearGradient id="mo_ngSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f9fd8"/><stop offset="0.5" stop-color="#a9d2ef"/><stop offset="1" stop-color="#e3f1f8"/></linearGradient>' +
      '<linearGradient id="mo_ngDash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5159"/><stop offset="0.25" stop-color="#383e45"/><stop offset="1" stop-color="#2a2f35"/></linearGradient>' +
      '<filter id="mo_ngBlur" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1680" height="2520"><feGaussianBlur stdDeviation="40"/></filter>' +
      '<clipPath id="mo_ngAiC"><circle cx="820" cy="1335" r="86"/></clipPath>' +
      '<clipPath id="mo_ngXUc"><circle cx="540" cy="780" r="165"/><rect x="495" y="930" width="90" height="40"/><path d="M382 965 Q382 905 442 905 H638 Q698 905 698 965 V1292 H382 Z"/></clipPath>' +
      '<clipPath id="mo_ngXLc"><rect x="460" y="1185" width="70" height="275" rx="32"/><rect x="550" y="1185" width="70" height="275" rx="32"/></clipPath>');
    // obloha + horizont (otaca sa pri zakrute), mraky bezia v slucke
    b += '<rect x="-500" y="-500" width="2080" height="2900" fill="url(#mo_ngSky)"/>';
    for (i = 0; i < 3; i++) {
      var o = i * 1400;
      [[-500, 640, 1.3], [-60, 760, 0.9], [330, 600, 1.2], [700, 790, 1.0], [1020, 660, 0.8]].forEach(function (c) {
        var x = c[0] + o, y = c[1], q = c[2];
        cl += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (150 * q).toFixed(0) + '" ry="' + (44 * q).toFixed(0) + '" fill="#ffffff" opacity="0.92"/>' +
          '<ellipse cx="' + (x + 70 * q).toFixed(0) + '" cy="' + (y - 26 * q).toFixed(0) + '" rx="' + (90 * q).toFixed(0) + '" ry="' + (40 * q).toFixed(0) + '" fill="#ffffff" opacity="0.92"/>';
      });
    }
    gr += '<path d="M-1600 985 L-1200 900 L-900 960 L-600 880 L-250 950 L60 890 L380 955 L700 875 L1000 950 L1300 885 L1650 960 L2000 900 L2600 985 Z" fill="#8ea7b6"/>';
    gr += '<rect x="-1600" y="980" width="4200" height="2800" fill="#7e9b52"/>';
    gr += '<g stroke="#6b8744" stroke-width="22">';
    for (i = -8; i <= 8; i++) gr += '<path d="M540 985 L' + (540 + i * 420) + ' 3600"/>';
    gr += '</g><g stroke="#93b064" stroke-width="16"><path d="M-1600 1030 H2600 M-1600 1110 H2600 M-1600 1240 H2600 M-1600 1450 H2600"/></g>';
    b += '<g id="mo_ngHz">' + gr + '<g id="mo_ngCl"><g id="mo_ngClA">' + cl + '</g></g></g>';
    // ram prekrytu + odlesk
    b += '<path fill-rule="evenodd" d="M-500 -500 H1580 V2400 H-500 Z M40 1300 L40 470 Q60 110 540 80 Q1020 110 1040 470 L1040 1300 Z" fill="#30353c"/>';
    b += '<path d="M40 1300 L40 470 Q60 110 540 80 Q1020 110 1040 470 L1040 1300" fill="none" stroke="#3d434b" stroke-width="54"/>';
    b += '<path d="M150 1250 L150 540 Q170 250 540 222 Q910 250 930 540 L930 1250" fill="none" stroke="#4a5059" stroke-width="12" opacity="0.7"/>';
    b += '<path d="M110 330 Q280 170 500 140 L490 178 Q300 205 150 360 Z" fill="#ffffff" opacity="0.28"/><path d="M880 230 Q950 300 985 420 L960 430 Q925 320 860 255 Z" fill="#ffffff" opacity="0.2"/>';
    // bocne konzoly
    b += '<path d="M-500 1060 L170 1090 L300 1230 L300 2400 L-500 2400 Z" fill="#454b53"/><path d="M1580 1060 L910 1090 L780 1230 L780 2400 L1580 2400 Z" fill="#454b53"/>';
    b += '<g fill="#5b626b"><rect x="60" y="1105" width="90" height="24" rx="8"/><rect x="930" y="1105" width="90" height="24" rx="8"/></g>';
    // vystrelovacie sedadlo za hrdinom
    b += '<path d="M470 400 V350 Q470 318 502 318 H578 Q610 318 610 350 V400" fill="none" stroke="#f2c230" stroke-width="24"/>' +
      '<path d="M470 400 V350 Q470 318 502 318 H578 Q610 318 610 350 V400" fill="none" stroke="' + INK + '" stroke-width="24" stroke-dasharray="16 16"/>';
    b += '<rect x="330" y="700" width="420" height="560" rx="50" fill="#353b42" stroke="#24282d" stroke-width="10"/>';
    b += '<rect x="330" y="720" width="62" height="520" rx="30" fill="#4a5159"/><rect x="688" y="720" width="62" height="520" rx="30" fill="#4a5159"/>';
    b += '<rect x="345" y="380" width="390" height="390" rx="64" fill="#3a4047" stroke="#24282d" stroke-width="10"/><rect x="385" y="415" width="310" height="230" rx="44" fill="#4c535b"/>';
    document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_ngBk">' + b + '</g>');
    // pristrojova doska pred hrdinom (zakryva nohy -> sedi)
    f += '<path d="M-500 1210 L250 1196 Q540 1150 830 1196 L1580 1210 L1580 2400 L-500 2400 Z" fill="url(#mo_ngDash)"/>';
    f += '<path d="M-500 1210 L250 1196 Q540 1150 830 1196 L1580 1210" fill="none" stroke="#22262b" stroke-width="26"/>';
    f += '<path d="M448 1250 Q448 1214 480 1214 H600 Q632 1214 632 1250 V2400 H448 Z" fill="#23272c"/>';
    f += '<rect x="105" y="1232" width="330" height="208" rx="18" fill="#1b1f23" stroke="#5b626b" stroke-width="6"/><rect x="122" y="1248" width="296" height="176" rx="10" fill="#0e2a1f"/>';
    f += '<rect id="mo_ngGr" x="122" y="1248" width="296" height="176" rx="10" fill="#ff3b30" opacity="0"/>';
    f += '<text x="140" y="1280" style="font-family:Hand;font-weight:700;font-size:34px;letter-spacing:3px;fill:#9cf0b8">G LOAD</text>';
    f += '<text id="mo_ngGv" x="250" y="1412" style="font-family:Pop;font-weight:600;font-size:104px;text-anchor:middle;fill:' + GRN + '">1</text>';
    f += '<text x="385" y="1408" style="font-family:Pop;font-weight:600;font-size:54px;text-anchor:middle;fill:' + GRN + '">G</text>';
    f += '<circle cx="820" cy="1335" r="100" fill="#1b1f23" stroke="#5b626b" stroke-width="6"/><g clip-path="url(#mo_ngAiC)"><g id="mo_ngAi"><rect x="680" y="1180" width="280" height="155" fill="#5fa8e0"/><rect x="680" y="1335" width="280" height="160" fill="#9a6a3a"/><path d="M680 1335 H960" stroke="#ffffff" stroke-width="5"/>' +
      '<path d="M790 1305 H850 M800 1290 H840 M790 1365 H850" stroke="#ffffff" stroke-width="3"/></g></g>' +
      '<path d="M760 1338 H800 L810 1350 L820 1338 L830 1350 L840 1338 H880" fill="none" stroke="#ffb02e" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>';
    f += '<g fill="#5b626b"><circle cx="690" cy="1250" r="14"/><circle cx="950" cy="1250" r="14"/><circle cx="690" cy="1420" r="14"/><circle cx="950" cy="1420" r="14"/></g>';
    f += '<g fill="#ffcf6b"><circle cx="470" cy="1186" r="9"/><circle cx="610" cy="1186" r="9"/></g>';
    // rontgen noh + G oblek + napatie (cez dosku)
    f += '<g id="mo_ngXL" opacity="0"><g clip-path="url(#mo_ngXLc)"><rect x="440" y="1180" width="200" height="300" fill="#1d3557" opacity="0.6"/><rect x="440" y="1180" width="200" height="300" fill="#d8323c" opacity="0.8"/>' +
      '<rect id="mo_ngXLp" x="440" y="1180" width="200" height="300" fill="#8a0f1c" opacity="0"/></g>' +
      '<g fill="none" stroke="#bfe3ff" stroke-width="5" stroke-dasharray="14 10"><rect x="460" y="1185" width="70" height="275" rx="32"/><rect x="550" y="1185" width="70" height="275" rx="32"/></g></g>';
    f += '<g id="mo_ngGS" opacity="0"><g id="mo_ngGSl"><rect x="440" y="1230" width="110" height="205" rx="44" fill="#8aa356" stroke="#4f6330" stroke-width="7" opacity="0.92"/><path d="M455 1290 H535 M455 1350 H535" stroke="#4f6330" stroke-width="5"/></g>' +
      '<g id="mo_ngGSr"><rect x="530" y="1230" width="110" height="205" rx="44" fill="#8aa356" stroke="#4f6330" stroke-width="7" opacity="0.92"/><path d="M545 1290 H625 M545 1350 H625" stroke="#4f6330" stroke-width="5"/></g>' +
      '<g id="mo_ngGSa" opacity="0" stroke="#ffffff" stroke-width="7" stroke-linecap="round"><path d="M410 1290 h-40 M410 1350 h-50 M670 1290 h40 M670 1350 h50"/></g></g>';
    f += '<g id="mo_ngTz" opacity="0" fill="none" stroke="#ffb02e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M425 1240 l-30 20 l30 20 l-30 20 l30 20"/><path d="M655 1240 l30 20 l-30 20 l30 20 l-30 20"/></g>';
    f += '<g id="mo_ngFx"></g>';
    document.getElementById(p + "float").insertAdjacentHTML("afterend", '<g id="mo_ngFr">' + f + '</g>');
    // helma (v hlave), knipel a plyn (v hornej casti tela, pod rukami), rontgen hornej casti tela
    document.getElementById(p + "head").insertAdjacentHTML("beforeend",
      '<g id="mo_ngHm"><path d="M328 800 A212 212 0 0 1 752 800 L720 812 Q708 704 540 692 Q372 704 360 812 Z" fill="#76854f" stroke="#4b5730" stroke-width="8"/>' +
      '<path d="M396 698 Q540 646 684 698 L674 664 Q540 618 406 664 Z" fill="#33424d" stroke="#1f2a31" stroke-width="6"/>' +
      '<path d="M432 668 Q474 648 524 642" stroke="#a9cde0" stroke-width="8" fill="none" opacity="0.7" stroke-linecap="round"/>' +
      '<rect x="528" y="596" width="24" height="56" rx="10" fill="#5f6d3f"/></g>' +
      '<g id="mo_ngWt" opacity="0"><g id="mo_ngWtI"><path d="M505 470 Q505 432 540 432 Q575 432 575 470" fill="none" stroke="' + INK + '" stroke-width="16"/>' +
      '<path d="M462 470 H618 L646 590 H434 Z" fill="' + INK + '" stroke="#fbf5ea" stroke-width="6" stroke-linejoin="round"/>' +
      '<text x="540" y="565" style="font-family:Pop;font-weight:600;font-size:74px;text-anchor:middle;fill:#fbf5ea">x9</text></g></g>');
    document.getElementById(p + "armR").insertAdjacentHTML("beforebegin",
      '<g id="mo_ngSt"><rect x="663" y="1150" width="22" height="130" fill="#1f2328"/><rect x="652" y="1100" width="44" height="120" rx="18" fill="#2a2e33" stroke="#16191c" stroke-width="5"/><circle cx="674" cy="1110" r="10" fill="' + RED + '"/></g>');
    document.getElementById(p + "armL").insertAdjacentHTML("beforebegin",
      '<g id="mo_ngTh"><rect x="380" y="1170" width="20" height="110" fill="#1f2328"/><rect x="356" y="1116" width="70" height="72" rx="14" fill="#2a2e33" stroke="#16191c" stroke-width="5"/></g>');
    document.getElementById(p + "up").insertAdjacentHTML("beforeend",
      '<ellipse id="mo_ngBg" cx="540" cy="1190" rx="170" ry="95" fill="url(#gOrange)" opacity="0"/>' +
      '<g id="mo_ngXU" opacity="0"><g clip-path="url(#mo_ngXUc)"><rect x="360" y="590" width="360" height="720" fill="#1d3557" opacity="0.5"/>' +
      '<rect id="mo_ngBl" x="360" y="' + FULL + '" width="360" height="900" fill="#d8323c" opacity="0.78"/>' +
      '<path d="M540 700 V1290 M540 960 L470 1060 M540 960 L610 1060 M540 1120 L480 1240 M540 1120 L600 1240" stroke="#ffd6d6" stroke-width="7" fill="none" opacity="0.6"/></g>' +
      '<g fill="none" stroke="#bfe3ff" stroke-width="6" stroke-dasharray="18 12"><circle cx="540" cy="780" r="160"/><path d="M386 965 Q386 909 442 909 H638 Q694 909 694 965 V1288 H386 Z"/></g>' +
      '<g id="mo_ngAr" opacity="0" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><g id="mo_ngArI"><path d="M500 820 L540 860 L580 820"/><path d="M500 900 L540 940 L580 900"/><path d="M500 980 L540 1020 L580 980"/></g></g>' +
      '<g id="mo_ngLo" opacity="0"><rect x="420" y="690" width="240" height="74" rx="14" fill="#fbf5ea"/><text x="540" y="746" style="font-family:Pop;font-weight:600;font-size:50px;text-anchor:middle;fill:' + RED + '">LOW O2</text></g></g>');
    PF.P("mo_ngHz", 540, 985); PF.P("mo_ngAi", 820, 1335); PF.P("mo_ngSt", 674, 1260);
    if (PF.VO.total > 0) {                    // mraky bezia cele video, perioda deli dlzku (slucka)
      var per = PF.loopPeriod(5), n = Math.max(1, Math.round(PF.VO.total / per));
      tl.fromTo("#mo_ngClA", { x: 0 }, { x: -1400, duration: per, ease: "none", repeat: n - 1, immediateRender: false }, 0);
    }
    st.ng = { g: 1.0, lv: FULL, bank: false };
  }

  M.ngjet = function (t, mode, t1, o) {
    o = o || {}; buildJet();
    var h = Hr(), p = h.p;
    if (mode === "bank" || mode === "level") {
      R.dirty("jet", function (tt, d) { PF.X("mo_ngHz", { r: 0 }, tt, d ? 0.5 : 0); PF.X("mo_ngAi", { r: 0 }, tt, d ? 0.5 : 0); st.ng.bank = false; });
      var a = mode === "bank" ? -(o.r || 38) : 0;
      PF.X("mo_ngHz", { r: a }, t, o.dur || 0.9, "power2.inOut"); PF.X("mo_ngAi", { r: a }, t, o.dur || 0.9, "power2.inOut");
      if (mode === "bank") { shake(t + 0.1, 0.5, 9); PF.punch(t + 0.1, 1.03); }
      st.ng.bank = mode === "bank";
      return null;
    }
    if (mode === "heavy") {                  // 9 G: zavazie padne na helmu, hlava zapadne
      R.dirty("heavy", function (tt, d) {
        PF.O("#mo_ngWt", 1, 0, tt, d ? 0.15 : 0.01);
        PF.X(p + "head", { ty: 0, sy: 1, sx: 1 }, tt, d ? 0.3 : 0); PF.X(p + "up", { sy: 1 }, tt, d ? 0.3 : 0); h.jowls(false, tt, d ? 0.3 : 0.01);
      });
      PF.S("#mo_ngWt", { opacity: 1 }, t);
      tl.fromTo("#mo_ngWtI", { y: -620 }, { y: 0, duration: 0.3, ease: "power3.in", immediateRender: false }, t);
      PF.X(p + "head", { ty: 40, sy: 0.9, sx: 1.04 }, t + 0.3, 0.14, "power2.out");
      PF.X(p + "up", { sy: 0.95 }, t + 0.3, 0.14, "power2.out");
      h.jowls(true, t + 0.3, 0.2);
      shake(t + 0.3, 0.35, 14); PF.punch(t + 0.3, 1.05);
      R.face(t + 0.3, "pain");
      return "body";
    }
    return null;                             // bez arg: kokpit je pozadie od 1. snimku
  };

  // ================= G DISPLEJ
  function gf(v) { var s = v.toFixed(1); return s.slice(-2) === ".0" ? s.slice(0, -2) : s; }
  function gCount(t, a, b, d) {
    var N = Math.max(2, Math.round(d * 30)), i;
    for (i = 1; i <= N; i++) { var k = i / N, e = 1 - (1 - k) * (1 - k); tl.set("#mo_ngGv", { innerHTML: gf(a + (b - a) * e) }, t + d * k); }
  }
  M.ngmeter = function (t, arg, t1, o) {
    o = o || {}; buildJet();
    R.dirty("gmeter", function (tt, d) { tl.set("#mo_ngGv", { innerHTML: "1" }, tt + (d ? 0.1 : 0)); PF.O("#mo_ngGr", 0.35, 0, tt, 0.01); st.ng.g = 1.0; });
    var v = arg === "reset" ? 1.0 : +arg, d = o.free ? (o.dur || 0.5) : Math.max(0.1, Math.min(o.dur || 0.5, (t1 || 1e9) - t - 0.1));
    if (!(v > 0)) return null;
    gCount(t, st.ng.g, v, d); st.ng.g = v;
    if (v >= 9 && !o.free) {
      tl.fromTo("#mo_ngGr", { opacity: 0.7 }, { opacity: 0.35, duration: 0.4, ease: "power1.out", immediateRender: false }, t + d);
      tl.fromTo("#mo_ngGv", { scale: 1.25, svgOrigin: "250 1370" }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + d);
      shake(t + d, 0.3, 10);
    } else PF.O("#mo_ngGr", 0.35, 0, t, 0.1);
    return "body";
  };

  // ================= KRV (rontgen)
  function level(t, y, d, ease) { PF.AT("#mo_ngBl", { y: st.ng.lv }, { y: y }, t, d, ease || "power2.inOut"); st.ng.lv = y; }
  function xrayOn(t) {
    if (st.ng.xr) return; st.ng.xr = true;
    PF.O("#mo_ngXU", 0, 0.92, t, 0.2); PF.O("#mo_ngXL", 0, 1, t, 0.2);
    R.dirty("blood", function (tt, d) {
      PF.O("#mo_ngXU", 0.92, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_ngXL", 1, 0, tt, d ? 0.15 : 0.01);
      PF.O("#mo_ngXLp", 0.5, 0, tt, 0.01); PF.O("#mo_ngLo", 1, 0, tt, 0.01); PF.O("#mo_ngAr", 1, 0, tt, 0.01);
      PF.AT("#mo_ngBl", { y: st.ng.lv }, { y: FULL }, tt + 0.2, 0.01); st.ng.lv = FULL; st.ng.xr = false;
    });
  }
  M.ngblood = function (t, arg, t1, o) {
    o = o || {}; buildJet();
    var left = (t1 || 1e9) - t - 0.12;
    if (arg === "drain") {
      xrayOn(t); var d = Math.max(0.3, Math.min(o.dur || 1.1, left - 0.3));
      level(t, LOW, d, "power2.in");
      PF.S("#mo_ngAr", { opacity: 1 }, t);
      tl.fromTo("#mo_ngArI", { y: -40 }, { y: 60, duration: 0.4, ease: "none", repeat: Math.max(0, Math.round(d / 0.4) - 1), immediateRender: false }, t);
      PF.O("#mo_ngAr", 1, 0, t + d, 0.15);
      PF.O("#mo_ngXLp", 0, 0.5, t, d);
      PF.S("#mo_ngLo", { opacity: 1 }, t + d);
      tl.fromTo("#mo_ngLo", { opacity: 1 }, { opacity: 0.2, duration: 0.15, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t + d);
      shake(t + d, 0.25, 6);
      return "body";
    }
    if (arg === "nudge" || arg === "full") {
      xrayOn(t);
      level(t, o.level || (arg === "full" ? FULL : 800), o.dur || 0.6, "back.out(1.6)");
      PF.O("#mo_ngXLp", 0.5, arg === "full" ? 0 : 0.25, t, 0.4);
      PF.O("#mo_ngLo", 1, 0, t, 0.1);
      if (arg === "full") PF.punch(t + 0.4, 1.03);
      return "body";
    }
    // show
    if (!st.ng.xr) { tl.set("#mo_ngBl", { attr: { y: o.level || FULL } }, t); st.ng.lv = o.level || FULL; }
    xrayOn(t);
    if (o.level) PF.O("#mo_ngXLp", 0, 0.5, t, 0.2);
    return "body";
  };

  // ================= ZRAK (celoplosne)
  function buildSight() {
    if (st.ngv) return; st.ngv = { on: false };
    var eye = function (x, id) {
      return '<g id="' + id + '"><path d="M' + (x - 110) + ' 820 Q' + x + ' 724 ' + (x + 110) + ' 820 Q' + x + ' 916 ' + (x - 110) + ' 820 Z" fill="#f4efe6"/>' +
        '<circle class="mo_ngVp" cx="' + x + '" cy="820" r="38" fill="#111111"/><circle class="mo_ngVp" cx="' + (x + 12) + '" cy="806" r="10" fill="#ffffff"/></g>';
    };
    OV().insertAdjacentHTML("beforeend", '<g id="mo_ngV">' +
      '<ellipse id="mo_ngVt" cx="540" cy="860" rx="1700" ry="2100" fill="none" stroke="#6b6b6b" stroke-width="1600" filter="url(#mo_ngBlur)" opacity="0"/>' +
      '<rect id="mo_ngVb" x="0" y="0" width="1080" height="1920" fill="#060606" opacity="0"/>' +
      '<g id="mo_ngVe" opacity="0"><g id="mo_ngVeP">' + eye(420, "mo_ngVeL") + eye(660, "mo_ngVeR") + '</g></g>' +
      '<text id="mo_ngVa" x="540" y="1060" opacity="0" style="font-family:Hand;font-weight:700;font-size:70px;letter-spacing:8px;text-anchor:middle;fill:#f4efe6">STILL AWAKE</text></g>');
  }
  function blinkEyes(t) {
    tl.fromTo("#mo_ngVeL,#mo_ngVeR", { scaleY: 1 }, { scaleY: 0.06, duration: 0.07, ease: "power1.in", yoyo: true, repeat: 1, immediateRender: false, svgOrigin: "540 820" }, t);
  }
  function sightReg() {
    var h = Hr(), p = h.p;
    R.dirty("vision", function (tt, d) {
      var q = d ? 0.45 : 0.01;
      tl.fromTo("#camRot", { filter: "saturate(" + (st.ngv.sat || 0) + ")" }, { filter: "saturate(1)", duration: q, ease: "power1.out", immediateRender: false }, tt);
      PF.S("#camRot", { filter: "none" }, tt + q + 0.02); st.ngv.sat = 1;
      PF.O("#mo_ngVt", 1, 0, tt, q); PF.AT("#mo_ngVt", { rx: 1000, ry: 1100 }, { rx: 1700, ry: 2100 }, tt + q + 0.02, 0.01);
      PF.O("#mo_ngVb", 1, 0, tt, q); PF.O("#mo_ngVe", 1, 0, tt, 0.01); PF.O("#mo_ngVa", 1, 0, tt, 0.01);
      PF.X(p + "head", { ty: 0, r: 0 }, tt, d ? 0.3 : 0); PF.X(p + "up", { r: 0 }, tt, d ? 0.3 : 0);
      h.arm("L", C().arms0[0], tt, d ? 0.3 : 0.01); h.arm("R", C().arms0[1], tt, d ? 0.3 : 0.01);
      R.setFace(tt, C().face0); h.eyes("eyesN", tt);
      PF.O(".mo_ngQ", 1, 0, tt, 0.01);
    });
  }
  M.ngsight = function (t, mode, t1, o) {
    o = o || {}; buildJet(); buildSight(); sightReg();
    var h = Hr(), p = h.p, left = (t1 || 1e9) - t - 0.12;
    if (mode === "fade") {
      var d = Math.max(0.3, Math.min(o.dur || 1.0, left));
      tl.fromTo("#camRot", { filter: "saturate(1)" }, { filter: "saturate(0.04)", duration: d, ease: "power1.inOut", immediateRender: false }, t);
      st.ngv.sat = 0.04;
      R.face(t, "worried");
      return null;
    }
    if (mode === "edges") {
      PF.S("#mo_ngVt", { opacity: 1 }, t);
      PF.AT("#mo_ngVt", { rx: 1700, ry: 2100 }, { rx: 1250, ry: 1420 }, t, Math.max(0.3, Math.min(0.9, left)), "power2.out");
      shake(t, 0.3, 5);
      return null;
    }
    if (mode === "tunnel") {
      PF.AT("#mo_ngVt", { rx: 1250, ry: 1420 }, { rx: 1000, ry: 1100 }, t, Math.max(0.3, Math.min(0.7, left)), "power2.in");
      R.face(t, "shocked");
      return "face";
    }
    if (mode === "black") {
      PF.O("#mo_ngVb", 0, 1, t, 0.22);
      PF.S("#mo_ngVe", { opacity: 1 }, t + 0.3);
      tl.fromTo("#mo_ngVeP", { scale: 0.6, svgOrigin: "540 820" }, { scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.3);
      if (t + 1.0 < t1 - 0.3) blinkEyes(t + 1.0);
      return null;
    }
    if (mode === "awake") {
      tl.fromTo(".mo_ngVp", { x: 0 }, { x: -40, duration: 0.18, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo(".mo_ngVp", { x: -40 }, { x: 40, duration: 0.25, ease: "power2.inOut", immediateRender: false }, t + 0.3);
      tl.fromTo(".mo_ngVp", { x: 40 }, { x: 0, duration: 0.2, ease: "power2.out", immediateRender: false }, t + 0.65);
      PF.S("#mo_ngVa", { opacity: 1 }, t + 0.1);
      tl.fromTo("#mo_ngVa", { scale: 0.4, svgOrigin: "540 1040" }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, t + 0.1);
      if (t + 1.0 < t1 - 0.2) blinkEyes(t + 1.0);
      return null;
    }
    if (mode === "out") {                    // oci sa zavru, zhasne; potom sivy svet a ovisnuty pilot
      PF.O("#mo_ngVa", 1, 0, t, 0.12);
      tl.fromTo("#mo_ngVeL,#mo_ngVeR", { scaleY: 1 }, { scaleY: 0.05, duration: 0.22, ease: "power2.in", immediateRender: false, svgOrigin: "540 820" }, t);
      PF.O("#mo_ngVe", 1, 0, t + 0.3, 0.12);
      tl.set("#mo_ngVeL,#mo_ngVeR", { scaleY: 1, svgOrigin: "540 820" }, t + 0.5);
      PF.X(p + "head", { ty: 44, r: 8 }, t + 0.2, 0.3, "power2.in");
      PF.X(p + "up", { r: -4 }, t + 0.2, 0.3);
      h.arm("L", 4, t + 0.2, 0.3); h.arm("R", -2, t + 0.2, 0.3);
      R.setFace(t + 0.2, "sleepy"); h.eyes("eyesCl", t + 0.25);
      PF.O("#mo_ngVt", 1, 0, t + 0.5, 0.5);
      PF.O("#mo_ngVb", 1, 0.62, t + 0.55, 0.6);
      return null;
    }
    if (mode === "confused") {               // napoly pri vedomi: spiralove oci, hlava sa kyva, otazniky
      PF.O("#mo_ngVb", 0.62, 0.2, t, 0.4);
      tl.fromTo("#camRot", { filter: "saturate(0.04)" }, { filter: "saturate(0.35)", duration: 0.4, ease: "none", immediateRender: false }, t);
      st.ngv.sat = 0.35;
      h.eyes("eyesSp", t); h.spin(t, Math.max(0.6, Math.min(2.0, left)));
      h.mouth("mWob", t);
      PF.X(p + "head", { ty: 16, r: -6 }, t, 0.35, "sine.inOut");
      PF.X(p + "head", { ty: 12, r: 6 }, t + 0.45, 0.4, "sine.inOut");
      PF.X(p + "head", { ty: 10, r: -3 }, t + 0.95, 0.4, "sine.inOut");
      var fx = document.getElementById("mo_ngFx");
      [[330, 600, -14], [760, 560, 12], [800, 760, 8]].forEach(function (q, j) {
        var id = uid("mo_ngQ");
        fx.insertAdjacentHTML("beforeend", '<text id="' + id + '" class="mo_ngQ" x="' + q[0] + '" y="' + q[1] + '" opacity="0" style="font-family:Pop;font-weight:600;font-size:110px;text-anchor:middle;fill:#ffd34d;stroke:' + INK + ';stroke-width:6px;paint-order:stroke">?</text>');
        var tj = t + 0.1 + j * 0.18;
        PF.S("#" + id, { opacity: 1 }, tj);
        tl.fromTo("#" + id, { scale: 0.2, rotation: 0, svgOrigin: q[0] + " " + (q[1] - 40) }, { scale: 1, rotation: q[2], duration: 0.3, ease: "back.out(2.5)", immediateRender: false }, tj);
        PF.O("#" + id, 1, 0, Math.max(tj + 0.5, Math.min(tj + 1.6, t1 - 0.2)), 0.15);
      });
      return null;
    }
    if (mode === "pop") {                    // farby naplno (bez dirty)
      tl.fromTo("#camRot", { filter: "saturate(1)" }, { filter: "saturate(1.7)", duration: 0.2, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, t);
      PF.S("#camRot", { filter: "none" }, t + 0.42);
      UI(); flash(t, 0.35);
      return null;
    }
    return null;
  };

  // ================= HODINY (velky displej)
  function buildClock(t, o) {
    if (st.ngc) return; st.ngc = { on: false };
    UI().insertAdjacentHTML("beforeend", '<div class="mo" id="mo_ngCk" style="top:' + (o.y || 875) + 'px"><div class="mo-paper" id="mo_ngCkIn" style="background:#10261c;border:8px solid #fbf5ea;padding:16px 40px 14px;width:640px;box-sizing:border-box;line-height:1">' +
      '<div id="mo_ngCkL" style="font-family:Hand;font-weight:700;font-size:40px;line-height:1.2;letter-spacing:.14em;color:#9cf0b8;margin-bottom:10px">YOUR GUESS?</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;height:170px">' +
      '<svg viewBox="0 0 120 120" style="position:static;display:block;flex:none;width:120px;height:120px;margin-right:26px"><circle cx="60" cy="60" r="52" fill="none" stroke="' + GRN + '" stroke-width="8"/>' +
      '<g stroke="' + GRN + '" stroke-width="6" stroke-linecap="round"><path d="M60 14 v10 M60 96 v10 M14 60 h10 M96 60 h10"/></g>' +
      '<g id="mo_ngCkH"><path d="M60 60 L60 22" stroke="#ffd34d" stroke-width="8" stroke-linecap="round"/></g><circle cx="60" cy="60" r="8" fill="' + GRN + '"/></svg>' +
      '<span id="mo_ngCkD" style="font-family:Pop;font-weight:600;font-size:170px;line-height:170px;height:170px;display:inline-block;overflow:hidden;color:' + GRN + ';min-width:220px;text-align:center">?</span>' +
      '<span style="font-family:Pop;font-weight:600;font-size:64px;line-height:1;display:inline-block;color:' + GRN + ';margin-left:14px">SEC</span></div>' +
      '<div id="mo_ngCk2" style="opacity:0;font-family:Pop;font-weight:600;font-size:50px;line-height:1.1;white-space:nowrap;color:#ffd34d;margin-top:14px">+ <span id="mo_ngCk2D">0</span> SEC CONFUSED</div></div></div>');
  }
  function clockOn(t) {
    if (st.ngc.on) return; st.ngc.on = true;
    PF.O("#mo_ngCk", 0, 1, t, 0.06);
    tl.fromTo("#mo_ngCkIn", { scale: 0.4, rotation: -6 }, { scale: 1, rotation: -1.5, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    R.dirty("clock", function (tt, d) {
      PF.O("#mo_ngCk", 1, 0, tt, d ? 0.15 : 0.01);
      tl.set("#mo_ngCkD", { innerHTML: "?" }, tt + 0.2); tl.set("#mo_ngCkL", { innerHTML: "YOUR GUESS?" }, tt + 0.2);
      PF.S("#mo_ngCk2", { opacity: 0 }, tt + 0.2); st.ngc.on = false;
    });
  }
  function secCount(sel, t, n, d) {          // cele sekundy, na zaciatku rychlo, ku koncu pomaly
    var i; for (i = 1; i <= n; i++) tl.set(sel, { innerHTML: String(i) }, t + d * (1 - Math.sqrt(1 - i / n)));
  }
  M.ngclock = function (t, arg, t1, o) {
    o = o || {}; buildClock(t, o);
    var left = (t1 || 1e9) - t - 0.12;
    if (arg === "guess") {
      clockOn(t);
      tl.set("#mo_ngCkD", { innerHTML: "?" }, t); tl.set("#mo_ngCkL", { innerHTML: o.label || "YOUR GUESS?" }, t);
      tl.fromTo("#mo_ngCkD", { opacity: 1 }, { opacity: 0.25, duration: 0.15, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t + 0.1);
      tl.fromTo("#mo_ngCkH", { rotation: 0, svgOrigin: "60 60" }, { rotation: 720, duration: Math.max(0.5, Math.min(1.4, left)), ease: "none", immediateRender: false }, t);
      PF.punch(t, 1.02);
      return "body";
    }
    if (arg === "confused") {
      clockOn(t);
      var d2 = Math.max(0.3, Math.min(o.dur || 1.2, left));
      PF.S("#mo_ngCk2", { opacity: 1 }, t);
      tl.fromTo("#mo_ngCk2", { scale: 0.5 }, { scale: 1, duration: 0.25, ease: "back.out(2.5)", immediateRender: false }, t);
      secCount("#mo_ngCk2D", t, +(o.n || 15), d2);
      return null;
    }
    var n = +arg; if (!(n > 0)) return null;
    clockOn(t);
    var d = Math.max(0.3, Math.min(o.dur || 1.2, left - 0.2));
    tl.set("#mo_ngCkD", { innerHTML: "0" }, t); tl.set("#mo_ngCkL", { innerHTML: o.label || "OUT COLD FOR ABOUT" }, t);
    secCount("#mo_ngCkD", t, n, d);
    tl.fromTo("#mo_ngCkH", { rotation: 0, svgOrigin: "60 60" }, { rotation: 360 * 2, duration: d, ease: "power1.out", immediateRender: false }, t);
    tl.fromTo("#mo_ngCkD", { scale: 1.35 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t + d);
    PF.punch(t + d, 1.04); shake(t + d, 0.25, 8);
    return "body";
  };

  // ================= BOJ PROTI G (kroky)
  function strainReg() {
    var h = Hr(), p = h.p;
    R.dirty("strain", function (tt, d) {
      h.arm("L", C().arms0[0], tt, d ? 0.25 : 0.01); h.arm("R", C().arms0[1], tt, d ? 0.25 : 0.01);
      PF.X("mo_ngSt", { r: 0 }, tt, d ? 0.2 : 0);
      PF.O("#mo_ngBg", 0.9, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_ngTz", 1, 0, tt, d ? 0.15 : 0.01);
      PF.O("#mo_ngGS", 1, 0, tt, d ? 0.15 : 0.01);
    });
  }
  M.ngstrain = function (t, mode, t1, o) {
    o = o || {}; buildJet(); strainReg();
    var h = Hr(), p = h.p, left = (t1 || 1e9) - t - 0.12, a0 = C().arms0, i;
    if (mode === "grip") {                   // zovrie knipel a potiahne
      h.arm("R", a0[1] - 10, t, 0.15, "power2.out");
      PF.X("mo_ngSt", { r: -10 }, t, 0.15, "power2.out");
      PF.XY("mo_ngSt", { r: -14 }, t + 0.2, 0.06, "none", 7);
      h.arm("L", a0[0] - 6, t, 0.2);
      R.face(t, "angry");
      PF.punch(t, 1.03);
      return "body";
    }
    if (mode === "squeeze") {                // napne nohy a brucho
      var d = Math.max(0.4, Math.min(o.dur || 1.6, left));
      h.arm("L", a0[0] - 8, t, 0.15); h.arm("R", a0[1] + 6, t, 0.15);
      PF.O("#mo_ngBg", 0, 0.9, t, 0.15); PF.O("#mo_ngTz", 0, 1, t, 0.1);
      tl.fromTo("#mo_ngBg", { opacity: 0.9 }, { opacity: 0.45, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: (Math.round(d / 0.2) | 1), immediateRender: false }, t + 0.15);
      tl.fromTo("#mo_ngTz", { opacity: 1 }, { opacity: 0.3, duration: 0.12, ease: "none", yoyo: true, repeat: (Math.round(d / 0.12) | 1), immediateRender: false }, t + 0.1);
      PF.XY(p + "up", { tx: 4 }, t, 0.05, "none", (Math.round(d / 0.05) | 1));
      R.face(t, "angry");
      return "body";
    }
    if (mode === "breathe") {                // styri prudke vydychy
      var n = o.n || 4, gap = o.gap || 0.34, fx = document.getElementById("mo_ngFx");
      for (i = 0; i < n; i++) {
        var ti = t + i * gap; if (ti > t + left - 0.2) break;
        var id = uid("mo_ngPf"), sx = (i % 2 ? 1 : -1);
        fx.insertAdjacentHTML("beforeend", '<g id="' + id + '" opacity="0"><g id="' + id + 'i"><ellipse cx="540" cy="880" rx="62" ry="44" fill="#ffffff"/><ellipse cx="' + (540 + sx * 50) + '" cy="860" rx="44" ry="34" fill="#ffffff"/><ellipse cx="' + (540 - sx * 40) + '" cy="900" rx="40" ry="30" fill="#ffffff"/></g></g>');
        PF.S("#" + id, { opacity: 0.95 }, ti);
        tl.fromTo("#" + id + "i", { scale: 0.3, x: 0, y: 0, svgOrigin: "540 880" }, { scale: 2.3, x: sx * 190, y: 70, duration: 0.45, ease: "power2.out", immediateRender: false }, ti);
        PF.O("#" + id, 0.95, 0, ti + 0.25, 0.2);
        PF.XY(p + "up", { sy: 1.04 }, ti, 0.08, "power2.out", 1);
        h.mouth("mO", ti); h.mouth("mWob", ti + 0.2);
      }
      R.face(t, "angry"); h.mouth("mO", t);
      return null;
    }
    if (mode === "suit") {                   // G oblek sa nafukne okolo noh
      PF.S("#mo_ngGS", { opacity: 1 }, t);
      tl.fromTo("#mo_ngGSl", { scaleX: 0.6, svgOrigin: "495 1330" }, { scaleX: 1.18, duration: 0.45, ease: "back.out(2.2)", immediateRender: false }, t);
      tl.fromTo("#mo_ngGSr", { scaleX: 0.6, svgOrigin: "585 1330" }, { scaleX: 1.18, duration: 0.45, ease: "back.out(2.2)", immediateRender: false }, t);
      PF.S("#mo_ngGSa", { opacity: 1 }, t + 0.1);
      tl.fromTo("#mo_ngGSa", { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.in", immediateRender: false }, t + 0.1);
      tl.fromTo("#mo_ngGSl,#mo_ngGSr", { scaleY: 1 }, { scaleY: 1.05, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t + 0.5);
      R.face(t + 0.3, "excited");
      return "body";
    }
    return null;
  };
})();
