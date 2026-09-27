// Postava: dvojnoha "cibi" figurka (velka hlava). Vzhlady: "glass" (sklenene telo s vodou a organmi) a "clothed"
// (koza + oblecenie: kombineza, vlasy, topanky). Rovnaka kostra a API pre oba vzhlady -> epizody ich mozu striedat.
// PF.charBiped({id, look, lift, skin, hair, suit, boots, props}) -> API (ruky, tvar, oci, hladina, organy, morfy, efekty).
// Satnik pre vzhlad "clothed": outfit suit|tshirt|hoodie|pajamas|labcoat, hairStyle short|long|bun|spiky|curly|bald|cap,
// glasses, lashes, skin/skinDark, blush, pants, patch (akcent), capColor. Rozmery tela su vsade rovnake -> API sa nemeni.
// Druh (len "clothed"): species human (default) | cat | dog | bear + fur, furDark, muzzle -> PF._animal (ta ista kostra, oblecenie ostava).
PF._wardrobe = function (o, p) {
  var SK = o.skin, SKD = o.skinDark, SH = o.suit, SHD = o.suitDark, PA = o.pants || "#34466a", PAD = o.pantsDark || "#26344f", HC = o.hair;
  var OUT = o.outfit || "suit", HS = o.hairStyle || "short";
  var r = function (x, y, w, h, rx, f, s, sw) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + f + '"' + (s ? ' stroke="' + s + '" stroke-width="' + (sw || 5) + '"' : '') + '/>'; };
  var pa = function (d, f, s, sw) { return '<path d="' + d + '" fill="' + f + '"' + (s ? ' stroke="' + s + '" stroke-width="' + (sw || 5) + '"' : '') + '/>'; };
  var defs = OUT === "pajamas" ? '<pattern id="' + p + 'pj" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="' + SH + '"/>' +
    '<rect width="12" height="30" fill="' + (o.stripe || "#ffffff") + '" opacity="0.55"/></pattern>' : "";
  var TOP = OUT === "pajamas" ? "url(#" + p + "pj)" : OUT === "labcoat" ? "#f6f6f2" : SH, TOPS = OUT === "labcoat" ? "#c9cfd4" : SHD;
  var shoe = function (bx) {
    if (OUT === "suit") return pa("M" + bx + " 1428 q56 -30 104 0 v26 h-104 z", o.boots);
    if (OUT === "pajamas") return pa("M" + bx + " 1440 q52 -26 104 0 v16 h-104 z", o.slipper || "#e9a0a8");
    if (OUT === "labcoat") return pa("M" + bx + " 1430 q56 -28 104 0 v24 h-104 z", "#3a3230");
    return pa("M" + bx + " 1424 q56 -34 104 0 v30 h-104 z", "#f4f4f2", "#cfd4d8", 4) + '<path d="M' + (bx + 22) + ' 1440 h60" stroke="' + o.patch + '" stroke-width="7" stroke-linecap="round"/>';
  };
  var leg = function (x) {
    if (OUT === "suit") return r(x, 1236, 64, 196, 30, SH, SHD);
    if (OUT === "tshirt") return r(x + 6, 1236, 52, 196, 26, SK, SKD) + r(x - 4, 1230, 72, 92, 20, PA, PAD);
    if (OUT === "pajamas") return r(x, 1236, 64, 206, 30, TOP, SHD);
    return r(x, 1236, 64, 196, 30, PA, PAD) + '<path d="M' + (x + 32) + ' 1262 V1410" stroke="' + PAD + '" stroke-width="3" opacity="0.6"/>';
  };
  var hi = '<path d="M412 1010 C 400 1070 400 1140 410 1210" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.25"/>';
  var starCol = /^#f{3}(f{3})?$/i.test(o.patch) ? SH : "#ffffff";    // biela nasivka -> farebna hviezda (inak by zmizla)
  var star = function (x, y, k) { return '<path transform="translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')" d="M0 -18 l6 12 l13 2 l-10 9 l3 13 l-12 -7 l-12 7 l3 -13 l-10 -9 l13 -2 z" fill="' + starCol + '"/>'; };
  var inside = {
    suit: '<path d="M540 930 V1286" stroke="' + SHD + '" stroke-width="5"/><circle cx="600" cy="1010" r="30" fill="' + o.patch + '" stroke="#ffffff" stroke-width="5"/>' + star(600, 1010) +
      '<path d="M470 920 q70 40 140 0" fill="none" stroke="' + SHD + '" stroke-width="8" stroke-linecap="round"/>' + hi,
    tshirt: pa("M486 905 q54 46 108 0 Z", SK) + '<circle cx="540" cy="1052" r="46" fill="' + o.patch + '" stroke="#ffffff" stroke-width="5"/>' + star(540, 1054, 1.3) + hi,
    hoodie: pa("M428 922 C 468 876 612 876 652 922 C 622 968 458 968 428 922 Z", SHD) +
      '<path d="M520 944 v68 M560 944 v68" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/><circle cx="520" cy="1016" r="7" fill="#ffffff"/><circle cx="560" cy="1016" r="7" fill="#ffffff"/>' +
      pa("M456 1126 h168 q12 0 9 12 l-16 70 h-154 l-16 -70 q-3 -12 9 -12 z", SHD) + hi,
    pajamas: pa("M498 905 L540 966 L582 905 Z", SK) + '<path d="M498 905 L540 966 L582 905" fill="none" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>' +
      '<g fill="#ffffff"><circle cx="540" cy="1000" r="8"/><circle cx="540" cy="1070" r="8"/><circle cx="540" cy="1140" r="8"/></g>' + hi,
    labcoat: pa("M492 905 L540 996 L588 905 Z", SH) + pa("M532 918 h16 l7 86 l-15 20 l-15 -20 z", o.patch) +
      '<path d="M470 905 L540 1070 M610 905 L540 1070" stroke="#c9cfd4" stroke-width="6" fill="none"/>' + r(588, 1000, 58, 50, 8, "#eef0f0", "#c9cfd4", 4) +
      r(598, 982, 10, 32, 4, "#3d7cc9") + r(614, 988, 10, 26, 4, "#d9483b") + hi
  }[OUT];
  var pre = OUT === "labcoat" ? '<g filter="url(#cut)">' + pa("M396 1180 C 398 1290 416 1344 438 1360 L 642 1360 C 664 1344 682 1290 684 1180 Z", "#f6f6f2", "#c9cfd4", 5) + '</g>' : "";
  var CAP = "M378 770 C 370 650 450 590 540 592 C 640 590 716 660 702 772 C 690 720 650 690 610 700 C 590 668 540 660 500 676 C 460 670 410 700 378 770 Z";
  var shine = '<path d="M430 690 q30 -40 90 -46" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.22"/>';
  var curls = pa("M392 760 C 392 660 460 616 540 616 C 620 616 688 660 688 760 C 640 720 440 720 392 760 Z", HC);
  for (var a = 196; a <= 344; a += 18) { var rad = a * Math.PI / 180; curls += '<circle cx="' + (540 + 150 * Math.cos(rad)).toFixed(0) + '" cy="' + (770 + 150 * Math.sin(rad)).toFixed(0) + '" r="44" fill="' + HC + '"/>'; }
  var back = HS === "long" ? pa("M390 730 C 348 850 356 990 424 1040 C 446 1006 436 900 446 800 Z", HC) + pa("M690 730 C 732 850 724 990 656 1040 C 634 1006 644 900 634 800 Z", HC) :
    HS === "bun" ? '<circle cx="540" cy="584" r="52" fill="' + HC + '"/>' : "";
  var capC = o.capColor || o.patch;
  var front = {
    short: pa(CAP, HC) + shine, long: pa(CAP, HC) + shine,
    bun: pa(CAP, HC) + '<path d="M500 612 q40 16 80 0" fill="none" stroke="' + o.patch + '" stroke-width="10" stroke-linecap="round"/>' + shine,
    spiky: pa(CAP, HC) + pa("M432 652 l-14 -64 l50 42 z M488 616 l2 -70 l40 58 z M556 610 l34 -62 l14 68 z M620 632 l54 -40 l-14 64 z", HC) + shine,
    curly: curls + shine,
    bald: pa("M382 762 C 378 726 392 704 410 698 L 416 764 Z", HC) + pa("M698 762 C 702 726 688 704 670 698 L 664 764 Z", HC) +
      '<path d="M470 640 q40 -30 100 -26" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.3"/>',
    cap: pa("M386 744 C 386 632 458 586 540 586 C 622 586 694 632 694 744 C 640 716 440 716 386 744 Z", capC) +
      '<path d="M540 588 V724" stroke="rgba(0,0,0,0.18)" stroke-width="5"/><path d="M392 736 C 450 712 630 712 688 736" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="9"/>' +
      '<circle cx="540" cy="590" r="11" fill="' + capC + '" stroke="rgba(0,0,0,0.2)" stroke-width="3"/>'
  }[HS];
  var limb = function (x) {
    if (OUT === "suit") return r(x, 945, 52, 210, 26, SH, SHD, 6);
    if (OUT === "tshirt") return r(x + 4, 945, 44, 210, 22, SK, SKD, 6) + r(x - 4, 938, 60, 84, 24, SH, SHD, 6);
    if (OUT === "hoodie") return r(x, 945, 52, 210, 26, SH, SHD, 6) + r(x - 2, 1096, 56, 34, 14, SHD);
    if (OUT === "pajamas") return r(x, 945, 52, 210, 26, TOP, SHD, 6) + r(x - 2, 1100, 56, 28, 12, "#ffffff");
    return r(x, 945, 52, 210, 26, "#f6f6f2", "#c9cfd4", 6) + r(x - 2, 1098, 56, 30, 12, "#e4e7e9");
  };
  return { defs: defs, TOP: TOP, TOPS: TOPS, legs: '<g filter="url(#cut)"><g id="' + p + 'legL">' + leg(462) + shoe(430) + '</g><g id="' + p + 'legR">' + leg(554) + shoe(546) + '</g></g>',
    inside: inside, pre: pre, back: back, front: front, limb: limb,
    glasses: o.glasses ? '<g id="' + p + 'glasses" fill="#dff1fb" fill-opacity="0.18" stroke="#2b2320" stroke-width="6"><circle cx="484" cy="832" r="46"/><circle cx="596" cy="832" r="46"/>' +
      '<path d="M530 826 q10 -8 20 0" fill="none"/><path d="M438 822 L 398 806 M642 822 L 682 806" fill="none" stroke-linecap="round"/></g>' : "",
    lashes: o.lashes ? '<g fill="none" stroke="#2b2320" stroke-width="5" stroke-linecap="round"><path d="M452 814 l-15 -8 M459 804 l-10 -13"/><path d="M628 814 l15 -8 M621 804 l10 -13"/></g>' : "" };
};
// ---------- Zvieracie varianty oblecenej postavy: o.species "cat" | "dog" | "bear" (cokolvek ine = "human" -> null, povodny vzhlad).
// Ta ista kostra, id aj pivoty -> vsetky API a recepty funguju bez zmeny. Pokozka -> srst: o.fur (hex alebo nazov z PF._FUR,
// default podla druhu), o.furDark a o.muzzle (inak odvodene z fur). Hlava: usi (cat spicate s ruzovym vnutrom, dog ovisnute pred
// hlavou, bear okruhle + lica), svetly cumak s nosom, fuzy (cat); dlane = labky; chvost vo vrstve za telom a rukami, kyvanie s periodou
// deliacou dlzku videa (prvy snimok = posledny). Uces sa nekresli (hairStyle ignorovany), okuliare a satnik ostavaju.
PF._FUR = { orange: "#e8a15a", ginger: "#e8a15a", gray: "#9ea4aa", grey: "#9ea4aa", brown: "#b8865a", dark: "#8b5a3c", black: "#4d474a",
  white: "#f3eee5", cream: "#ecd5ae", golden: "#e0b25e", tan: "#caa079" };
PF._mix = function (a, b, k) {             // zmes dvoch farieb #rrggbb (k = podiel b)
  var c = "#";
  for (var i = 1; i < 7; i += 2) { var v = Math.round(parseInt(a.substr(i, 2), 16) * (1 - k) + parseInt(b.substr(i, 2), 16) * k); c += (v < 16 ? "0" : "") + v.toString(16); }
  return c;
};
PF._animal = function (o, p) {
  var SP = String(o.species || "human").toLowerCase().trim();
  if (SP !== "cat" && SP !== "dog" && SP !== "bear") return null;
  var hex = function (c) {                  // "#abc" | "#aabbcc" | nazov z PF._FUR -> "#aabbcc", inak null
    c = PF._FUR[String(c).toLowerCase()] || String(c);
    if (/^#[0-9a-f]{3}$/i.test(c)) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    return /^#[0-9a-f]{6}$/i.test(c) ? c : null;
  };
  var FU = hex(o.fur) || { cat: "#e8a15a", dog: "#b8865a", bear: "#8b5a3c" }[SP];
  var FD = hex(o.furDark) || PF._mix(FU, "#2b2320", 0.24), MZ = hex(o.muzzle) || PF._mix(FU, "#fff4e4", 0.62);
  var mir = function (s) { return '<g transform="translate(1080 0) scale(-1 1)">' + s + '</g>'; };   // prava strana = zrkadlo lavej
  var pa = function (d, f) { return '<path d="' + d + '"' + (f ? ' fill="' + f + '"' : "") + '/>'; };              // bez f = tvar siluety
  var ci = function (x, y, r, f) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"' + (f ? ' fill="' + f + '"' : "") + '/>'; };
  var ln = function (d, c, w, op) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"' + (op ? ' opacity="' + op + '"' : "") + '/>'; };
  var A = { fur: FU, furDark: FD, back: "", front: "", whisk: "" }, L, S, T, E;
  if (SP === "cat") {                        // spicate usi za hlavou, maly ruzovy nos, fuzy, dlhy chvost do otaznika
    E = "M398 708 L406 572 Q408 540 434 556 L514 632 Z"; S = pa(E);
    L = pa(E, FU) + pa("M414 690 L420 592 Q422 570 440 584 L500 640 Z", "#f2a3ae");
    A.back = L + mir(L);
    A.muzzle = '<ellipse cx="540" cy="906" rx="60" ry="38" fill="' + MZ + '"/>';
    A.nose = pa("M525 870 Q540 862 555 870 Q549 884 540 887 Q531 884 525 870 Z", "#e8899b");
    var lum = parseInt(FU.substr(1, 2), 16) * 0.3 + parseInt(FU.substr(3, 2), 16) * 0.59 + parseInt(FU.substr(5, 2), 16) * 0.11;
    L = ln("M494 902 L414 888 M492 912 L408 914 M494 922 L416 940", lum < 110 ? "#f3ead8" : "#2b2320", 4, 0.8);   // tmava srst -> svetle fuzy
    A.whisk = L + mir(L);
    T = ["M600 1240 C 710 1280 800 1270 836 1210 C 858 1172 866 1130 892 1110", 22, "", [570, 1080, 350, 220]];
    A.pv = [668, 1256]; A.amp = 7; A.per = 2.4;
  } else if (SP === "dog") {                 // ovisnute usi pred hlavou (vlastny tien), velky tmavy nos, hrubsi chvost so svetlou spickou
    E = "M470 650 C 410 626 350 660 336 724 C 322 790 330 858 358 884 C 384 906 416 888 422 852 C 428 810 426 758 448 710 C 456 690 464 670 470 650 Z"; S = pa(E);
    L = pa(E, FD);
    A.front = '<g filter="url(#cut)">' + L + mir(L) + '</g>';
    A.muzzle = '<ellipse cx="540" cy="902" rx="68" ry="46" fill="' + MZ + '"/>';
    A.nose = pa("M516 866 Q540 856 564 866 Q562 884 540 891 Q518 884 516 866 Z", "#3b2e2b") + '<ellipse cx="531" cy="866" rx="7" ry="3.5" fill="#ffffff" opacity="0.5"/>';
    T = ["M620 1236 C 720 1266 800 1250 838 1196 C 860 1164 868 1128 862 1098", 28, ln("M864 1121 C 864 1113 863.5 1105.5 862 1098", MZ, 28), [590, 1070, 310, 220]];
    A.pv = [676, 1250]; A.amp = 9; A.per = 1.2;
  } else {                                   // bear: okruhle usi so svetlym vnutrom + lica za hlavou, cierny ovalny nos, kratky chvost
    S = ci(428, 652, 46) + ci(404, 858, 38);
    L = ci(428, 652, 46, FU) + ci(424, 648, 25, MZ) + ci(404, 858, 38, FU);
    A.back = L + mir(L);
    A.muzzle = '<ellipse cx="540" cy="904" rx="72" ry="48" fill="' + MZ + '"/>';
    A.nose = '<ellipse cx="540" cy="874" rx="22" ry="14" fill="#2b2320"/><ellipse cx="532" cy="869" rx="7" ry="3.5" fill="#ffffff" opacity="0.45"/>';
    T = null;
    A.pv = [680, 1240]; A.amp = 6; A.per = 1.6;
  }
  // chvost: ciara srsti s tmavym obrysom (2 tahy); neviditelny ramik zvacsi bbox, inak by filter #cut (130 % bboxu bez tahu) orezal hrubku
  A.tail = '<g id="' + p + 'tail"><g filter="url(#cut)">' + (T ? '<rect x="' + T[3][0] + '" y="' + T[3][1] + '" width="' + T[3][2] + '" height="' + T[3][3] + '" fill="none"/>' +
    ln(T[0], FD, T[1] + 10) + ln(T[0], FU, T[1]) + T[2] :
    '<rect x="646" y="1218" width="96" height="44" rx="22" transform="rotate(-18 694 1240)" fill="' + FU + '" stroke="' + FD + '" stroke-width="5"/>') + '</g></g>';   // bear: kratky obly pahyl
  A.sil = '<circle cx="540" cy="780" r="165"/>' + S + mir(S);   // silueta hlavy s usami (prekryvy horucavy / choroby / zimy -> bez hrany cez usi)
  A.paw = function (cx) { return ln("M" + (cx - 11) + " 1177 v12 M" + (cx + 11) + " 1177 v12", FD, 5); };   // prsty labky
  return A;
};
PF.charBiped = function (o) {
  o = Object.assign({ id: "hero", look: "glass", lift: 60, skin: "#f1c9a5", skinDark: "#dca87f", hair: "#4a3226", suit: "#3f73b8",
    suitDark: "#2f5a93", boots: "#3a3f4a", patch: "#f6c343", props: [] }, o || {});
  var p = o.id + "_", G = o.look === "glass", A = G ? null : PF._animal(o, p);
  if (A) { o.skin = A.fur; o.skinDark = A.furDark; }   // zviera: vsade, kde ide pokozka (hlava, ruky, krk, nohy, lica, viecka) -> srst
  var W = G ? null : PF._wardrobe(o, p);
  var has = function (x) { return o.props.indexOf(x) >= 0; };
  var TORSO = "M446 905 C 404 960 376 1070 382 1175 C 388 1258 452 1292 540 1292 C 628 1292 692 1258 698 1175 C 704 1070 676 960 634 905 Z";
  var BODY = G ? "url(#gBody)" : W.TOP, LIMB = G ? "#cfe5ec" : o.suit, LIMB_ST = G ? "#ffffff" : o.suitDark;
  var HAND = G ? "#cfe5ec" : o.skin, HAND_ST = G ? "#ffffff" : o.skinDark, LID = G ? "#c9e1e9" : o.skinDark, BLUSH = o.blush || "#f2a0a0";
  document.getElementById("defs").insertAdjacentHTML("beforeend", (W ? W.defs : "") +
    '<clipPath id="' + p + 'torsoClip"><path d="' + TORSO + '"/></clipPath>' +
    '<clipPath id="' + p + 'eyeClipL"><circle cx="484" cy="832" r="34"/></clipPath><clipPath id="' + p + 'eyeClipR"><circle cx="596" cy="832" r="34"/></clipPath>' +
    '<clipPath id="' + p + 'glassClip"><path d="M400 1100 L456 1100 L450 1204 L406 1204 Z"/></clipPath>');
  var legs = G ?   // kazda noha vo vlastnej skupine (legL / legR, pivot v bedre) -> beh, trasenie kolien
    '<g filter="url(#cut)" fill="#cfe5ec" stroke="#ffffff" stroke-width="6"><g id="' + p + 'legL"><rect x="462" y="1236" width="64" height="204" rx="32"/><ellipse cx="486" cy="1446" rx="56" ry="24"/></g>' +
    '<g id="' + p + 'legR"><rect x="554" y="1236" width="64" height="204" rx="32"/><ellipse cx="594" cy="1446" rx="56" ry="24"/></g></g>' :
    W.legs;
  var inside = G ?
    '<g clip-path="url(#' + p + 'torsoClip)"><g id="' + p + 'wlevel"><g id="' + p + 'wwave">' +
    '<path d="M240 0 q30 -11 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 L960 420 L240 420 Z" fill="url(#gWater)" fill-opacity="0.86"/>' +
    '<path d="M240 0 q30 -11 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#b3e3fa" stroke-width="6"/>' +
    '<path d="M300 40 q30 -6 60 0 M480 70 q30 -6 60 0 M660 36 q30 -6 60 0" fill="none" stroke="#9fd6f3" stroke-width="4" opacity="0.7"/></g></g>' +
    '<rect id="' + p + 'heatT" x="360" y="890" width="360" height="420" fill="#ff8a3c" opacity="0" style="mix-blend-mode:screen"/><g id="' + p + 'bubbles"></g></g>' +
    '<circle id="' + p + 'heartGlow" cx="590" cy="1006" r="72" fill="url(#gRed)" opacity="0.85"/>' +
    '<path id="' + p + 'heartFill" d="M590 1040 C 560 1018 540 1000 546 982 C 552 964 578 962 590 980 C 602 962 628 964 634 982 C 640 1000 620 1018 590 1040 Z" fill="#de4a42" stroke="#fde3dc" stroke-width="4"/>' +
    '<path d="M556 986 q6 -12 18 -10" fill="none" stroke="#ff9d93" stroke-width="5" stroke-linecap="round"/>' +
    '<circle id="' + p + 'kidGlowL" cx="500" cy="1152" r="50" fill="url(#gOrange)" opacity="0.8"/><circle id="' + p + 'kidGlowR" cx="580" cy="1152" r="50" fill="url(#gOrange)" opacity="0.8"/>' +
    '<path id="' + p + 'kidFillL" d="M506 1120 C 526 1122 530 1146 520 1152 C 512 1158 514 1170 520 1176 C 522 1188 498 1188 486 1178 C 470 1164 472 1130 490 1122 C 495 1120 500 1119 506 1120 Z" fill="#b84a44" stroke="#f6d9d2" stroke-width="3"/>' +
    '<g transform="translate(1080 0) scale(-1 1)"><path id="' + p + 'kidFillR" d="M506 1120 C 526 1122 530 1146 520 1152 C 512 1158 514 1170 520 1176 C 522 1188 498 1188 486 1178 C 470 1164 472 1130 490 1122 C 495 1120 500 1119 506 1120 Z" fill="#b84a44" stroke="#f6d9d2" stroke-width="3"/></g>' +
    '<path d="' + TORSO.replace(" Z", "") + '" fill="none" stroke="#ffffff" stroke-width="7"/>' +
    '<path d="M414 1000 C 400 1060 398 1130 408 1200" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.7"/>' +
    '<path d="M690 1030 C 700 1100 698 1160 686 1220" fill="none" stroke="#9cc9d8" stroke-width="6" stroke-linecap="round" opacity="0.8"/>' :
    W.inside;
  var headFill = G ?
    '<g filter="url(#cut)"><circle cx="540" cy="780" r="165" fill="url(#gBody)" fill-opacity="0.9"/></g><circle id="' + p + 'heatH" cx="540" cy="780" r="160" fill="#ff8a3c" opacity="0"/>' +
    '<circle id="' + p + 'brainGlow" cx="540" cy="704" r="120" fill="url(#gPink)" opacity="0.8"/>' +
    '<path id="' + p + 'brainFill" d="M440 718 C 424 690 440 652 476 648 C 488 628 520 624 540 636 C 560 622 596 626 606 646 C 640 648 656 680 644 706 C 660 730 640 760 612 758 C 596 776 560 778 540 766 C 520 778 486 776 470 760 C 444 762 428 740 440 718 Z" fill="#f3a5b5" stroke="#fde4ea" stroke-width="4"/>' +
    '<g fill="none" stroke="#d9788e" stroke-width="5" stroke-linecap="round"><path d="M466 700 q20 -24 44 -6 q18 14 40 -6"/><path d="M494 742 q22 -14 40 2 q20 14 46 -4"/>' +
    '<path d="M540 642 q-6 28 6 52"/><path d="M598 676 q16 10 26 32"/><path d="M462 736 q-10 -12 -8 -30"/></g>' +
    '<path d="M478 666 q18 -16 40 -12" fill="none" stroke="#ffe3ea" stroke-width="6" stroke-linecap="round"/>' +
    '<circle cx="540" cy="780" r="165" fill="none" stroke="#ffffff" stroke-width="7"/>' +
    '<path d="M424 712 C 430 668 458 636 494 624" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.75"/>' : A ?
    '<g filter="url(#cut)">' + A.back + '<circle cx="540" cy="780" r="165" fill="' + o.skin + '"/></g>' + A.muzzle + A.front +   // zviera: usi, srst, cumak
    '<g id="' + p + 'heatH" fill="#ff8a3c" opacity="0">' + A.sil + '</g>' + A.nose :   // horucava tonuje celu srst hlavy aj usi (bez lemu)
    '<g filter="url(#cut)">' + W.back + '<circle cx="378" cy="800" r="30" fill="' + o.skin + '"/><circle cx="702" cy="800" r="30" fill="' + o.skin + '"/>' +
    '<circle cx="540" cy="780" r="165" fill="' + o.skin + '"/></g><circle id="' + p + 'heatH" cx="540" cy="780" r="160" fill="#ff8a3c" opacity="0"/>' + W.front;
  var ov = function (id, col) {              // prekryv choroby / zimy: clovek kruh vo tvari, zviera cela silueta hlavy s usami
    return A ? '<g id="' + p + id + '" fill="' + col + '" opacity="0" style="mix-blend-mode:multiply">' + A.sil + '</g>' :
      '<circle id="' + p + id + '" cx="540" cy="800" r="150" fill="' + col + '" opacity="0" style="mix-blend-mode:multiply"/>';
  };
  var sick = (G ? "" : '<g id="' + p + 'jowls" opacity="0"><circle cx="412" cy="860" r="58" fill="' + o.skin + '"/><circle cx="668" cy="860" r="58" fill="' + o.skin + '"/>' +
      '<ellipse cx="420" cy="890" rx="26" ry="14" fill="' + BLUSH + '" opacity="0.6"/><ellipse cx="660" cy="890" rx="26" ry="14" fill="' + BLUSH + '" opacity="0.6"/></g>') +
    ov("sick", "#9fcf6a") + ov("tint", "#8fb8f0");
  var face =
    '<ellipse cx="446" cy="884" rx="22" ry="12" fill="' + BLUSH + '" opacity="0.55"/><ellipse cx="634" cy="884" rx="22" ry="12" fill="' + BLUSH + '" opacity="0.55"/>' +
    (A ? A.whisk : "") +
    '<g id="' + p + 'eyesN"><circle cx="484" cy="832" r="36" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/><circle cx="596" cy="832" r="36" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/>' +
    '<g id="' + p + 'pupils"><circle cx="484" cy="832" r="16" fill="#2b2320"/><circle cx="596" cy="832" r="16" fill="#2b2320"/>' +
    '<circle cx="490" cy="826" r="5" fill="#ffffff"/><circle cx="602" cy="826" r="5" fill="#ffffff"/></g>' +
    '<g clip-path="url(#' + p + 'eyeClipL)"><rect id="' + p + 'lidL" x="446" y="796" width="76" height="0" fill="' + LID + '"/></g>' +
    '<g clip-path="url(#' + p + 'eyeClipR)"><rect id="' + p + 'lidR" x="558" y="796" width="76" height="0" fill="' + LID + '"/></g></g>' +
    '<g id="' + p + 'eyesSp" opacity="0"><circle cx="484" cy="832" r="36" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/><circle cx="596" cy="832" r="36" fill="#fffdf8" stroke="#2b2320" stroke-width="4"/>' +
    '<g id="' + p + 'spL"><path d="M484 832 m-3 0 a5 5 0 1 1 8 3 a11 11 0 1 1 -17 -7 a17 17 0 1 1 26 11 a23 23 0 1 1 -34 -15" fill="none" stroke="#2b2320" stroke-width="5" stroke-linecap="round"/></g>' +
    '<g id="' + p + 'spR"><path d="M596 832 m-3 0 a5 5 0 1 1 8 3 a11 11 0 1 1 -17 -7 a17 17 0 1 1 26 11 a23 23 0 1 1 -34 -15" fill="none" stroke="#2b2320" stroke-width="5" stroke-linecap="round"/></g></g>' +
    '<g id="' + p + 'eyesHap" opacity="0" fill="none" stroke="#2b2320" stroke-width="10" stroke-linecap="round"><path d="M456 846 Q 484 806 512 846"/><path d="M568 846 Q 596 806 624 846"/></g>' +
    '<g id="' + p + 'eyesCl" opacity="0" fill="none" stroke="#2b2320" stroke-width="9" stroke-linecap="round"><path d="M454 834 Q 484 856 514 834"/><path d="M566 834 Q 596 856 626 834"/></g>' +
    (W ? W.lashes + W.glasses : "") +
    '<g id="' + p + 'browL"><path d="M452 786 Q 480 770 510 780" fill="none" stroke="#2b2320" stroke-width="9" stroke-linecap="round"/></g>' +
    '<g id="' + p + 'browR"><path d="M570 780 Q 600 770 628 786" fill="none" stroke="#2b2320" stroke-width="9" stroke-linecap="round"/></g>' +
    '<path id="' + p + 'mSmile" d="M504 900 Q 540 926 576 900" fill="none" stroke="#2b2320" stroke-width="8" stroke-linecap="round" opacity="0"/>' +
    '<ellipse id="' + p + 'mO" cx="540" cy="910" rx="15" ry="19" fill="#5a2a2a" opacity="1"/>' +
    '<g id="' + p + 'mDry" opacity="0"><ellipse cx="540" cy="912" rx="34" ry="24" fill="#5a2a2a"/><ellipse cx="540" cy="926" rx="20" ry="10" fill="#e07a7a"/>' +
    '<path d="M512 897 l6 8 M530 890 l2 9 M556 891 l-3 9 M572 899 l-6 7" stroke="#f3e2c7" stroke-width="4" stroke-linecap="round"/></g>' +
    '<g id="' + p + 'mPant" opacity="0"><path d="M504 896 Q 540 952 576 896 Z" fill="#5a2a2a"/><path d="M526 914 q14 46 28 0 z" fill="#e0707a"/></g>' +
    '<path id="' + p + 'mWob" d="M502 912 q9 -9 19 0 t19 0 t19 0 t19 0" fill="none" stroke="#2b2320" stroke-width="7" stroke-linecap="round" opacity="0"/>' +
    '<g id="' + p + 'mBig" opacity="0"><path d="M494 894 Q 540 966 586 894 Z" fill="#5a2a2a"/><path d="M516 928 q24 -16 48 0 q-24 24 -48 0 z" fill="#e07a7a"/></g>' +
    '<g id="' + p + 'mSick" opacity="0"><path d="M506 918 q34 -26 68 0" fill="none" stroke="#2b2320" stroke-width="8" stroke-linecap="round"/><ellipse cx="540" cy="936" rx="12" ry="7" fill="#9fcf6a"/></g>' +
    '<path id="' + p + 'sweat" d="M676 726 C 688 746 692 760 676 768 C 660 760 664 746 676 726 Z" fill="#8fd3f5" stroke="#ffffff" stroke-width="3" opacity="0"/>' +
    '<path id="' + p + 'wisp" d="M676 730 q-12 -18 0 -34 q12 -16 0 -32" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0"/>' +
    '<g id="' + p + 'steam" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0"><path d="M494 600 q-14 -22 0 -42 q14 -20 0 -40"/><path d="M548 590 q-14 -22 0 -42 q14 -20 0 -40"/><path d="M600 600 q-14 -22 0 -42 q14 -20 0 -40"/></g>' +
    '<g id="' + p + 'pain" opacity="0" fill="none" stroke="#d9483b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M338 700 l20 -22 l6 20 l22 -24"/><path d="M704 646 l22 -18 l2 22 l24 -16"/><path d="M500 588 l16 -26 l12 18 l14 -28"/></g>' +
    '<g id="' + p + 'puff" opacity="0" fill="#f3e6cf"><circle cx="520" cy="950" r="16"/><circle cx="552" cy="960" r="20"/><circle cx="584" cy="948" r="13"/></g>';
  var cup = has("cup") ?
    '<g id="' + p + 'glassL"><path d="M398 1098 L458 1098 L452 1206 L404 1206 Z" fill="#e8f6fb" fill-opacity="0.65"/>' +
    '<g clip-path="url(#' + p + 'glassClip)"><rect id="' + p + 'glassW" x="394" y="1206" width="68" height="0" fill="url(#gWater)" fill-opacity="0.9"/></g>' +
    '<path d="M398 1098 L458 1098 L452 1206 L404 1206 Z" fill="none" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M410 1112 L408 1188" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.9"/></g>' : "";
  var fan = has("fan") ?
    '<g id="' + p + 'fan" opacity="0"><path d="M652 1168 L 586 1296 A 120 120 0 0 0 718 1296 Z" fill="#f6d36b" stroke="#ffffff" stroke-width="5"/>' +
    '<path d="M652 1168 L 612 1300 M652 1168 L 652 1306 M652 1168 L 692 1300" stroke="#e0a93b" stroke-width="4"/></g>' : "";
  var arm = function (x, id, extra, handId) {
    var hand = '<circle ' + (handId && !A ? 'id="' + p + handId + '" ' : "") + 'cx="' + (x + 26) + '" cy="1160" r="33" fill="' + HAND + '" stroke="' + HAND_ST + '" stroke-width="6"/>';
    if (A) hand = '<g' + (handId ? ' id="' + p + handId + '"' : "") + '>' + hand + A.paw(x + 26) + '</g>';   // labka: to iste id (thumb skryje celu)
    return '<g id="' + p + id + '">' + (W ? W.limb(x) : '<rect x="' + x + '" y="945" width="52" height="210" rx="26" fill="' + LIMB + '" stroke="' + LIMB_ST + '" stroke-width="6"/>') + extra +
      hand +
      (id === "armR" ? '<g id="' + p + 'thumb" opacity="0" transform="rotate(160 652 1160)"><rect x="612" y="1128" width="80" height="70" rx="26" fill="' + HAND + '" stroke="' + HAND_ST + '" stroke-width="6"/>' +
        '<rect x="636" y="1070" width="34" height="74" rx="17" fill="' + HAND + '" stroke="' + HAND_ST + '" stroke-width="6"/></g>' : "") + '</g>';
  };
  PF.add("M",
    '<g id="' + p + 'float"><g id="' + p + 'shadow" fill="#4a1f12" opacity="0.32" filter="url(#soft6)"><ellipse cx="486" cy="1466" rx="62" ry="10"/><ellipse cx="594" cy="1466" rx="62" ry="10"/></g>' +
    '<g id="' + p + 'legs">' + legs + '</g>' +
    '<g transform="translate(0 ' + (-o.lift) + ')"><ellipse id="' + p + 'heatGlow" cx="540" cy="1000" rx="250" ry="400" fill="url(#gOrange)" opacity="0"/>' +
    '<g id="' + p + 'up">' + (A ? A.tail : "") + (W ? W.pre : "") + '<g filter="url(#cut)"><path d="' + TORSO + '" fill="' + BODY + '" ' + (G ? 'fill-opacity="0.85"' : 'stroke="' + W.TOPS + '" stroke-width="6"') + '/></g>' + inside +
    '<g id="' + p + 'head">' + headFill + sick + face + '</g>' +
    arm(402, "armL", cup, null) + arm(626, "armR", fan, "handR") + '</g></g></g>');
  // ---------- registracia
  PF.P(p + "float", 540, 1100); PF.P(p + "legs", 540, 1236); PF.P(p + "up", 540, 1292); PF.P(p + "head", 540, 780);
  PF.P(p + "legL", 494, 1242); PF.P(p + "legR", 586, 1242);
  if (A) {                                   // chvost: kyvanie tam a spat cez cele video, perioda deli dlzku videa -> slucka bez skoku
    PF.P(p + "tail", A.pv[0], A.pv[1], { r: -A.amp });
    var tp = PF.loopPeriod(A.per);
    if (PF.VO.total > 0) PF.XY(p + "tail", { r: A.amp }, 0, tp / 2, "sine.inOut", Math.round(PF.VO.total / tp) * 2 - 1);
  }
  if (!G) PF.P(p + "jowls", 540, 860, { s: 0.6 });
  PF.P(p + "armL", 428, 955, { r: o.armL || 18 }); PF.P(p + "armR", 652, 955, { r: o.armR || -18 });
  PF.P(p + "pupils", 540, 832); PF.P(p + "browL", 481, 778); PF.P(p + "browR", 599, 778);
  PF.P(p + "spL", 484, 832); PF.P(p + "spR", 596, 832);
  PF.P(p + "pain", 540, 700); PF.P(p + "puff", 552, 955); PF.P(p + "sweat", 676, 750); PF.P(p + "wisp", 676, 700); PF.P(p + "steam", 548, 560);
  if (G) PF.P(p + "wlevel", 0, 0, { ty: Math.round(1292 - (o.level || 60) * 5) });
  if (has("cup")) PF.P(p + "glassL", 428, 1160);
  var S = { lid: 0, glassW: [1206, 0] };
  var MOUTH = ["mSmile", "mO", "mDry", "mPant", "mWob", "mBig", "mSick"], EYES = ["eyesN", "eyesSp", "eyesHap", "eyesCl"];
  var api = {
    id: o.id, p: p,
    arm: function (side, r, t, dur, ease) { PF.X(p + "arm" + side, { r: r }, t, dur || 0.5, ease); },
    armWave: function (side, r, t, dur, reps) { PF.XY(p + "arm" + side, { r: r }, t, dur, "sine.inOut", reps); },
    armThin: function (sx, t, dur) { PF.X(p + "armL", { sx: sx }, t, dur || 0.8); PF.X(p + "armR", { sx: sx }, t, dur || 0.8); },
    glassTilt: function (r, t, dur) { PF.X(p + "glassL", { r: r }, t, dur || 0.4); },
    glassFill: function (h, t, dur, ease) { var y = 1206 - h; PF.AT("#" + p + "glassW", { y: S.glassW[0], height: S.glassW[1] }, { y: y, height: h }, t, dur || 0.5, ease); S.glassW = [y, h]; },
    level: function (pct, t, dur, ease) { PF.X(p + "wlevel", { ty: Math.round(1292 - pct * 5) }, t, dur || 0.9, ease); },
    waves: function () { var wp = PF.loopPeriod(1.6); PF.tl.fromTo("#" + p + "wwave", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(-120 0)" }, duration: wp, ease: "none", repeat: Math.round(PF.VO.total / wp) - 1, immediateRender: false }, 0); },
    mouth: function (n, t) { MOUTH.forEach(function (m) { PF.S("#" + p + m, { opacity: m === n ? 1 : 0 }, t); }); },
    eyes: function (n, t) { EYES.forEach(function (m) { PF.S("#" + p + m, { opacity: m === n ? 1 : 0 }, t); }); },
    lids: function (v, t, dur) { PF.AT("#" + p + "lidL,#" + p + "lidR", { height: S.lid * 80 }, { height: v * 80 }, t, dur || 0.12); S.lid = v; },
    blink: function (t) { var q = S.lid; api.lids(1, t, 0.07); api.lids(q, t + 0.1, 0.09); },
    look: function (tx, ty, t, dur) { PF.X(p + "pupils", { tx: tx, ty: ty }, t, dur === undefined ? 0.2 : dur); },
    brows: function (rL, rR, ty, t, dur) { PF.X(p + "browL", { r: rL, ty: ty }, t, dur === undefined ? 0.2 : dur); PF.X(p + "browR", { r: rR, ty: ty }, t, dur === undefined ? 0.2 : dur); },
    spin: function (t, dur) { PF.X(p + "spL", { r: 900 }, t, dur, "none"); PF.X(p + "spR", { r: -900 }, t, dur, "none"); },
    headScale: function (s, t, dur, ease) { PF.X(p + "head", { s: s }, t, dur, ease); },
    throb: function (times, amt) {            // pulzujuca hlava + znaky bolesti (casy uderov)
      PF.O("#" + p + "pain", 0, 1, times[0] - 0.02, 0.06);
      times.forEach(function (b) {
        PF.X(p + "head", { s: amt || 1.075 }, b - 0.02, 0.06, "power2.out"); PF.X(p + "head", { s: 1 }, b + 0.05, 0.2, "power2.in");
        PF.X(p + "pain", { s: 1.25 }, b - 0.02, 0.06, "power2.out"); PF.X(p + "pain", { s: 1 }, b + 0.05, 0.2, "power2.in");
      });
    },
    painOff: function (t) { PF.O("#" + p + "pain", 1, 0, t, 0.1); },
    slump: function (r, t, dur) { PF.X(p + "up", { r: r }, t, dur || 1.1); },
    stretch: function (sy, t, dur, ease) { PF.X(p + "up", { sy: sy }, t, dur || 1, ease); },
    legsThin: function (sx, t, dur) { PF.X(p + "legs", { sx: sx }, t, dur || 0.8); },
    leg: function (side, to, t, dur, ease) { PF.X(p + "leg" + side, typeof to === "number" ? { r: to } : to, t, dur || 0.3, ease); },
    shadow: function (on, t, dur) { PF.O("#" + p + "shadow", on ? 0 : 0.32, on ? 0.32 : 0, t, dur || 0); },
    run: function (t0, t1, per, armL, armR, lift) {  // beh/chodza na mieste (pohlad spredu): dvihanie kolien (lift 0-1) + pumpovanie ruk + poskok
      per = per || 0.5; var h = per / 2, n = Math.max(1, Math.floor((t1 - t0) / per)) * 2 - 1, aL = armL === undefined ? 20 : armL, aR = armR === undefined ? -20 : armR, L = lift === undefined ? 0.3 : lift, sy = 1 - L, sw = Math.round(10 + 27 * L), by = Math.round(27 * L);
      PF.X(p + "legL", { sy: sy }, t0, 0.12); PF.X(p + "legR", { sy: 1 }, t0, 0.12);
      PF.tl.fromTo("#" + p + "legL", { attr: { transform: PF.ts(Object.assign({}, PF.st[p + "legL"], { sy: sy })) } },
        { attr: { transform: PF.ts(Object.assign({}, PF.st[p + "legL"], { sy: 1 })) }, duration: h, ease: "sine.inOut", yoyo: true, repeat: n, immediateRender: false }, t0 + 0.12);
      PF.tl.fromTo("#" + p + "legR", { attr: { transform: PF.ts(Object.assign({}, PF.st[p + "legR"], { sy: 1 })) } },
        { attr: { transform: PF.ts(Object.assign({}, PF.st[p + "legR"], { sy: sy })) }, duration: h, ease: "sine.inOut", yoyo: true, repeat: n, immediateRender: false }, t0 + 0.12);
      var te = t0 + 0.12 + (n + 1) * h;
      PF.X(p + "legL", { sy: 1 }, te, 0.15); PF.X(p + "legR", { sy: 1 }, te, 0.15);
      PF.X(p + "armL", { r: aL + sw }, t0, 0.12); PF.X(p + "armR", { r: aR + sw }, t0, 0.12);
      PF.XY(p + "armL", { r: aL - sw }, t0 + 0.12, h, "sine.inOut", n); PF.XY(p + "armR", { r: aR - sw }, t0 + 0.12, h, "sine.inOut", n);
      PF.X(p + "armL", { r: aL }, te, 0.15); PF.X(p + "armR", { r: aR }, te, 0.15);
      PF.XY(p + "up", { ty: -by }, t0 + 0.12, h / 2, "sine.inOut", n * 2 + 1);
      return te + 0.15;
    },
    kneeShake: function (t0, t1, amp) {       // trasuce sa kolena (slabe nohy)
      var q = 0.07, n = Math.max(1, Math.floor((t1 - t0) / (2 * q))) * 2 - 1, a = amp || 4;
      PF.XY(p + "legL", { r: a }, t0, q, "sine.inOut", n); PF.XY(p + "legR", { r: -a }, t0 + q / 2, q, "sine.inOut", n);
    },
    move: function (tx, ty, r, t, dur, ease) { PF.X(p + "float", { tx: tx, ty: ty, r: r }, t, dur, ease); },
    bob: function (t0, t1, amp) {              // vznasanie (beztiaz): pomale kmitanie hore-dole s natocenim
      var per = 1.4, n = Math.max(1, Math.floor((t1 - t0) / per)) * 2 - 1;
      PF.XY(p + "float", { ty: -(amp || 22), r: 3 }, t0, per / 2, "sine.inOut", n);
    },
    sick: function (a, b, t, dur) { PF.O("#" + p + "sick", a, b, t, dur || 0.5); },
    tint: function (col, a, b, t, dur) { PF.S("#" + p + "tint", { attr: { fill: col } }, t); PF.O("#" + p + "tint", a, b, t, dur || 0.5); },
    jowls: function (on, t, dur) {            // opuchnute lica (len oblecena postava)
      if (G) return;
      if (on) { PF.O("#" + p + "jowls", 0, 1, t, 0.08); PF.X(p + "jowls", { s: on === true ? 1 : on }, t, dur || 0.35, "back.out(2)"); }
      else { PF.O("#" + p + "jowls", 1, 0, t, dur ? 0.2 : 0); PF.X(p + "jowls", { s: 0.6 }, t + (dur ? 0.2 : 0), 0); }
    },
    organOff: function (name, t) {             // blikne a zhasne: heart | brain | kid
      var glow = name === "kid" ? "#" + p + "kidGlowL,#" + p + "kidGlowR" : "#" + p + name + "Glow";
      var fill = name === "kid" ? "#" + p + "kidFillL,#" + p + "kidFillR" : "#" + p + name + "Fill";
      var cols = { heart: ["#de4a42", "#8e7a78"], brain: ["#f3a5b5", "#b9a3a8"], kid: ["#b84a44", "#8f7f7c"] }[name];
      PF.O(glow, 0.85, 0.15, t, 0.05); PF.O(glow, 0.15, 0.6, t + 0.08, 0.05); PF.O(glow, 0.6, 0, t + 0.16, 0.12); PF.F(fill, cols[0], cols[1], t, 0.4);
    },
    organOn: function (name, t) {
      var glow = name === "kid" ? "#" + p + "kidGlowL,#" + p + "kidGlowR" : "#" + p + name + "Glow";
      var fill = name === "kid" ? "#" + p + "kidFillL,#" + p + "kidFillR" : "#" + p + name + "Fill";
      var cols = { heart: ["#de4a42", "#8e7a78"], brain: ["#f3a5b5", "#b9a3a8"], kid: ["#b84a44", "#8f7f7c"] }[name];
      PF.O(glow, 0, 0.85, t, 0.3); PF.F(fill, cols[1], cols[0], t, 0.4);
    },
    heat: function (on, t, dur) { var a = on ? 0 : 1, b = on ? 1 : 0;
      PF.O("#" + p + "heatT", a * 0.35, b * 0.35, t, dur || 0.7); PF.O("#" + p + "heatH", a * 0.3, b * 0.3, t, dur || 0.7); PF.O("#" + p + "heatGlow", a, b, t, dur || 0.8); },
    sweat: function (t0, tEvap) {
      PF.O("#" + p + "sweat", 0, 1, t0, 0.1); PF.X(p + "sweat", { s: 0.1 }, tEvap, 0.4, "power2.in"); PF.O("#" + p + "sweat", 1, 0, tEvap + 0.35, 0.06);
      PF.O("#" + p + "wisp", 0, 1, tEvap + 0.1, 0.1); PF.X(p + "wisp", { ty: -60 }, tEvap + 0.1, 0.7, "power1.out"); PF.O("#" + p + "wisp", 1, 0, tEvap + 0.5, 0.3);
    },
    steam: function (t) { PF.O("#" + p + "steam", 0, 1, t, 0.15); PF.X(p + "steam", { ty: -50 }, t, 0.8, "power1.out"); PF.O("#" + p + "steam", 1, 0, t + 0.5, 0.3); PF.X(p + "steam", { ty: 0 }, t + 1.0, 0); },
    puff: function (t) { PF.O("#" + p + "puff", 0, 1, t + 0.05, 0.08); PF.X(p + "puff", { s: 1.6, ty: 20 }, t + 0.05, 0.6, "power2.out"); PF.O("#" + p + "puff", 1, 0, t + 0.4, 0.25); },
    fan: function (on, t) { PF.O("#" + p + "fan", on ? 0 : 1, on ? 1 : 0, t, on ? 0.1 : 0); },
    thumb: function (on, t) { PF.S("#" + p + "handR", { opacity: on ? 0 : 1 }, t); PF.S("#" + p + "thumb", { opacity: on ? 1 : 0 }, t); },
    bubbles: function (t0, n, seed) {         // bublinky v tele pri plneni
      var g = document.getElementById(p + "bubbles"), rr = PF.rnd(seed || 91);
      for (var i = 0; i < n; i++) {
        var x = 410 + rr() * 260, r = 5 + rr() * 9, t = t0 + i * 0.05;
        var b = PF.el("circle", { cx: x, cy: 1270, r: r, fill: "none", stroke: "#d8f2ff", "stroke-width": 3, opacity: 0 }, g); b.id = p + "bb" + i;
        PF.P(b.id, x, 1270); PF.O("#" + b.id, 0, 0.9, t, 0.05); PF.X(b.id, { ty: -(170 + rr() * 110) }, t, 0.7, "power1.out"); PF.O("#" + b.id, 0.9, 0, t + 0.5, 0.2);
      }
    },
    cupDrop: function (t) {                   // posledna kvapka z prevrateneho pohara (ruka na 158 stupnoch)
      var d = PF.el("path", { d: "M374 766 C 383 782 386 792 374 799 C 362 792 365 782 374 766 Z", fill: "#5ab3e6", stroke: "#ffffff", "stroke-width": 3, opacity: 0 }, PF.svg("M"));
      d.id = p + "drop"; PF.P(d.id, 374, 784);
      PF.O("#" + d.id, 0, 1, t - 0.1, 0.08); PF.X(d.id, { ty: 370 }, t, 0.5, "power2.in"); PF.O("#" + d.id, 1, 0, t + 0.47, 0.05);
    }
  };
  if (G) api.waves();
  return api;
};
