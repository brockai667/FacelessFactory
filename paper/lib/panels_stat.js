// Univerzalny panel s udajom: velka ikona na papierovom kruhu + velke cislo/text (pocita sa nahor) + maly popis.
// PF.panelStat(z, {big, small, icon, bg, accent}) -> {id, show(t, t1)}. Ikony: kreslene papierove piktogramy (stred 0,0; ~220 px).
PF.STAT_ICONS = {
  clock: '<circle r="104" fill="#fbf5ea" stroke="#2b2320" stroke-width="12"/><g stroke="#2b2320" stroke-width="8" stroke-linecap="round"><path d="M0 -84 v16 M84 0 h-16 M0 84 v-16 M-84 0 h16"/></g>' +
    '<g id="__ID__h"><path d="M0 0 V-58" stroke="#d9483b" stroke-width="12" stroke-linecap="round"/></g><path d="M0 0 L40 26" stroke="#2b2320" stroke-width="10" stroke-linecap="round"/><circle r="12" fill="#2b2320"/>',
  calendar: '<rect x="-100" y="-86" width="200" height="190" rx="18" fill="#fbf5ea" stroke="#2b2320" stroke-width="10"/><path d="M-100 -68 a18 18 0 0 1 18 -18 h164 a18 18 0 0 1 18 18 v34 h-200 z" fill="#d9483b"/>' +
    '<g fill="#2b2320"><rect x="-58" y="-112" width="16" height="44" rx="8"/><rect x="42" y="-112" width="16" height="44" rx="8"/></g>' +
    '<g fill="#e8d9bf"><rect x="-74" y="-10" width="36" height="30" rx="6"/><rect x="-18" y="-10" width="36" height="30" rx="6"/><rect x="38" y="-10" width="36" height="30" rx="6"/>' +
    '<rect x="-74" y="40" width="36" height="30" rx="6"/><rect x="38" y="40" width="36" height="30" rx="6"/></g><rect x="-18" y="40" width="36" height="30" rx="6" fill="#d9483b"/>',
  drop: '<path d="M0 -118 C 44 -56 86 -12 86 32 C 86 84 48 116 0 116 C -48 116 -86 84 -86 32 C -86 -12 -44 -56 0 -118 Z" fill="#4aa6e0" stroke="#ffffff" stroke-width="10"/>' +
    '<path d="M-44 30 C -44 60 -26 80 -4 86" fill="none" stroke="#bfe8fb" stroke-width="14" stroke-linecap="round"/>',
  heart: '<path d="M0 100 C -70 50 -120 10 -110 -46 C -100 -96 -40 -110 0 -58 C 40 -110 100 -96 110 -46 C 120 10 70 50 0 100 Z" fill="#e0483d" stroke="#ffffff" stroke-width="10"/>' +
    '<path d="M-72 -42 C -66 -70 -44 -80 -24 -74" fill="none" stroke="#ff9d93" stroke-width="14" stroke-linecap="round"/>',
  brain: '<g transform="scale(1.9) translate(-540 -700)"><path d="M440 718 C 424 690 440 652 476 648 C 488 628 520 624 540 636 C 560 622 596 626 606 646 C 640 648 656 680 644 706 C 660 730 640 760 612 758 C 596 776 560 778 540 766 C 520 778 486 776 470 760 C 444 762 428 740 440 718 Z" fill="#f3a5b5" stroke="#ffffff" stroke-width="5"/>' +
    '<g fill="none" stroke="#d9788e" stroke-width="4" stroke-linecap="round"><path d="M466 700 q20 -24 44 -6 q18 14 40 -6"/><path d="M494 742 q22 -14 40 2 q20 14 46 -4"/><path d="M540 642 q-6 28 6 52"/></g></g>',
  bolt: '<path d="M22 -118 L-66 18 H-6 L-28 118 L70 -30 H8 Z" fill="#f6c343" stroke="#ffffff" stroke-width="10" stroke-linejoin="round"/>',
  flame: '<path d="M0 -120 C 30 -70 90 -40 88 26 C 86 84 46 116 0 116 C -46 116 -86 84 -86 30 C -86 -14 -50 -30 -40 -70 C -20 -44 -14 -28 -12 -10 C 6 -46 10 -82 0 -120 Z" fill="#f28a2e" stroke="#ffffff" stroke-width="10"/>' +
    '<path d="M0 -10 C 20 20 44 36 42 66 C 40 92 22 108 0 108 C -22 108 -40 92 -40 68 C -40 44 -22 30 -16 8 C -8 20 -4 28 -2 36 C 6 18 8 6 0 -10 Z" fill="#f6c343"/>',
  snow: '<g stroke="#6aa6e8" stroke-width="16" stroke-linecap="round"><path d="M0 -112 V112 M-97 -56 L97 56 M-97 56 L97 -56"/></g>' +
    '<g stroke="#6aa6e8" stroke-width="12" stroke-linecap="round" fill="none"><path d="M-26 -86 L0 -64 L26 -86 M-26 86 L0 64 L26 86 M-88 -20 L-56 -32 L-62 -66 M88 20 L56 32 L62 66 M-88 20 L-56 32 L-62 66 M88 -20 L56 -32 L62 -66"/></g><circle r="20" fill="#ffffff" stroke="#6aa6e8" stroke-width="8"/>',
  moon: '<path d="M30 -110 C -40 -100 -90 -40 -84 24 C -78 88 -20 124 44 112 C -6 90 -34 44 -34 -4 C -34 -52 -6 -92 30 -110 Z" fill="#f6c343" stroke="#ffffff" stroke-width="10"/>' +
    '<path d="M64 -54 l8 18 l18 8 l-18 8 l-8 18 l-8 -18 l-18 -8 l18 -8 z M84 30 l6 12 l12 6 l-12 6 l-6 12 l-6 -12 l-12 -6 l12 -6 z" fill="#fbf5ea"/>',
  bone: '<g fill="#fbf1dc" stroke="#d9c8a4" stroke-width="8"><circle cx="-84" cy="-34" r="34"/><circle cx="-84" cy="34" r="34"/><circle cx="84" cy="-34" r="34"/><circle cx="84" cy="34" r="34"/></g>' +
    '<rect x="-90" y="-30" width="180" height="60" fill="#fbf1dc"/><path d="M-60 -30 H60 M-60 30 H60" stroke="#d9c8a4" stroke-width="8"/>',
  cup: '<path d="M-78 -40 H62 V60 C 62 96 34 112 -8 112 C -50 112 -78 96 -78 60 Z" fill="#fbf5ea" stroke="#2b2320" stroke-width="10"/><path d="M62 -12 C 110 -12 110 60 62 60" fill="none" stroke="#2b2320" stroke-width="12"/>' +
    '<rect x="-66" y="-30" width="116" height="30" fill="#8a5a3c"/><g fill="none" stroke="#b9a684" stroke-width="10" stroke-linecap="round"><path d="M-40 -60 q-12 -20 0 -40 q12 -20 0 -40"/><path d="M10 -60 q-12 -20 0 -40 q12 -20 0 -40"/></g>',
  bed: '<rect x="-118" y="-10" width="236" height="70" rx="16" fill="#6fa8d6" stroke="#ffffff" stroke-width="8"/><rect x="-118" y="-60" width="26" height="150" rx="10" fill="#8a5a3c"/>' +
    '<rect x="92" y="-20" width="26" height="110" rx="10" fill="#8a5a3c"/><rect x="-90" y="-44" width="70" height="40" rx="18" fill="#fbf5ea"/>' +
    '<text x="40" y="-60" style="font-family:Hand;font-weight:700;font-size:70px;fill:#2b2320">z</text><text x="78" y="-100" style="font-family:Hand;font-weight:700;font-size:50px;fill:#2b2320">z</text>',
  sun: '<g fill="#f6c343"><path d="M0 -120 l16 36 h-32 z"/><path d="M0 120 l16 -36 h-32 z"/><path d="M-120 0 l36 16 v-32 z"/><path d="M120 0 l-36 16 v-32 z"/>' +
    '<path d="M-85 -85 l36 14 l-22 22 z"/><path d="M85 85 l-36 -14 l22 -22 z"/><path d="M85 -85 l-14 36 l-22 -22 z"/><path d="M-85 85 l14 -36 l22 22 z"/></g><circle r="66" fill="#f6c343" stroke="#ffffff" stroke-width="10"/>',
  phone: '<rect x="-64" y="-116" width="128" height="232" rx="22" fill="#2f3945" stroke="#ffffff" stroke-width="10"/><rect x="-50" y="-92" width="100" height="170" rx="8" fill="#7cc6f5"/><circle cy="96" r="10" fill="#9aa7b6"/>',
  rocket: '<path d="M0 -122 C 44 -80 54 -20 44 52 H-44 C -54 -20 -44 -80 0 -122 Z" fill="#fbf5ea" stroke="#2b2320" stroke-width="10"/><circle cy="-30" r="22" fill="#6fa8d6" stroke="#2b2320" stroke-width="8"/>' +
    '<path d="M-44 20 L-80 70 L-40 60 Z M44 20 L80 70 L40 60 Z" fill="#d9483b" stroke="#2b2320" stroke-width="8" stroke-linejoin="round"/><path d="M-26 56 C -20 96 20 96 26 56 C 12 80 -12 80 -26 56 Z" fill="#f28a2e"/>',
  lungs: '<path d="M-14 -60 C -30 -90 -100 -60 -106 20 C -110 90 -70 110 -26 96 C -10 90 -10 60 -12 30 Z" fill="#f29aa0" stroke="#ffffff" stroke-width="10"/>' +
    '<path d="M14 -60 C 30 -90 100 -60 106 20 C 110 90 70 110 26 96 C 10 90 10 60 12 30 Z" fill="#f29aa0" stroke="#ffffff" stroke-width="10"/><path d="M0 -118 V-40 M0 -40 L-18 -10 M0 -40 L18 -10" stroke="#e7a6a6" stroke-width="14" stroke-linecap="round" fill="none"/>',
  muscle: '<path d="M-100 60 C -110 10 -80 -40 -40 -60 C -30 -100 20 -110 40 -80 C 60 -60 40 -40 20 -40 C 10 -10 40 0 70 -10 C 110 -20 120 40 90 70 C 50 110 -70 110 -100 60 Z" fill="#f1c9a5" stroke="#ffffff" stroke-width="10"/>' +
    '<path d="M-10 20 C 10 0 50 0 60 20" fill="none" stroke="#dca87f" stroke-width="10" stroke-linecap="round"/>',
  apple: '<path d="M0 -60 C 60 -90 110 -30 96 30 C 84 84 44 112 0 96 C -44 112 -84 84 -96 30 C -110 -30 -60 -90 0 -60 Z" fill="#e0483d" stroke="#ffffff" stroke-width="10"/>' +
    '<path d="M0 -62 C 4 -90 16 -104 34 -110" fill="none" stroke="#6b4a3a" stroke-width="10" stroke-linecap="round"/><path d="M8 -84 C 30 -110 70 -100 76 -84 C 50 -70 24 -72 8 -84 Z" fill="#76b46a"/>',
  up: '<path d="M0 -118 L96 -10 H38 V112 H-38 V-10 H-96 Z" fill="#76b46a" stroke="#ffffff" stroke-width="10" stroke-linejoin="round"/>',
  down: '<path d="M0 118 L96 10 H38 V-112 H-38 V10 H-96 Z" fill="#e0483d" stroke="#ffffff" stroke-width="10" stroke-linejoin="round"/>',
  eye: '<path d="M-120 0 C -70 -70 70 -70 120 0 C 70 70 -70 70 -120 0 Z" fill="#fbf5ea" stroke="#2b2320" stroke-width="10"/><circle r="44" fill="#4a8fc4"/><circle r="22" fill="#2b2320"/><circle cx="12" cy="-12" r="8" fill="#ffffff"/>'
};
PF.panelStat = function (z, o) {
  o = Object.assign({ big: "?", small: "", icon: "clock", bg: "#e9e3f3", accent: "#2a74b3" }, o || {});
  PF._stat = (PF._stat || 0) + 1;
  var id = "cuStat" + PF._stat, q = "s" + PF._stat + "_", s = PF.panel(id, z || 4);
  var fs = Math.min(190, Math.floor(1700 / Math.max(3, o.big.length))), fs2 = Math.min(64, Math.floor(1500 / Math.max(8, o.small.length)));
  var icon = (PF.STAT_ICONS[o.icon] || PF.STAT_ICONS.clock).replace(/__ID__/g, q);
  var rr = PF.rnd(300 + PF._stat), conf = "";
  for (var i = 0; i < 14; i++) { var cx = 80 + rr() * 920, cy = 330 + rr() * 1150;
    if (Math.abs(cx - 540) < 300 && cy > 420 && cy < 1360) cx = cx < 540 ? cx - 300 : cx + 300;   // mimo ikonu a text
    conf += '<rect x="' + cx.toFixed(0) + '" y="' + cy.toFixed(0) + '" width="' + (14 + rr() * 16).toFixed(0) + '" height="' + (8 + rr() * 8).toFixed(0) +
    '" rx="3" fill="' + ["#f6c343", "#e0483d", "#6fa8d6", "#76b46a"][i % 4] + '" opacity="0.55" transform="rotate(' + Math.round(rr() * 180) + ' ' + cx.toFixed(0) + ' ' + cy.toFixed(0) + ')"/>'; }
  s.insertAdjacentHTML("beforeend",
    '<defs><filter id="' + q + 'cut" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="12" stdDeviation="3" flood-color="#2a2a3a" flood-opacity="0.25"/></filter></defs>' +
    '<rect width="1080" height="1920" fill="' + o.bg + '"/><g opacity="0.6">' + conf + '</g>' +
    '<g id="' + q + 'disc"><g filter="url(#' + q + 'cut)"><circle cx="540" cy="700" r="240" fill="#fbf5ea"/></g><circle cx="540" cy="700" r="214" fill="none" stroke="' + o.accent + '" stroke-width="10" stroke-dasharray="4 20" stroke-linecap="round"/></g>' +
    '<g id="' + q + 'ico"><g transform="translate(540 700) scale(1.2)" filter="url(#' + q + 'cut)">' + icon + '</g></g>' +
    '<g filter="url(#' + q + 'cut)"><text id="' + q + 'big" x="540" y="' + (1080 + fs * 0.36).toFixed(0) + '" style="font-family:Pop;font-weight:600;font-size:' + fs + 'px;fill:' + o.accent + ';text-anchor:middle">' + o.big + '</text></g>' +
    '<text id="' + q + 'small" x="540" y="1300" opacity="0" style="font-family:Hand;font-weight:700;font-size:' + fs2 + 'px;fill:#2b2320;text-anchor:middle;letter-spacing:2px">' + o.small + '</text>');
  PF.P(q + "ico", 540, 700, { s: 0.2 }); PF.P(q + "disc", 540, 700, { s: 0.6 }); PF.P(q + "small", 540, 1280);
  if (document.getElementById(q + "h")) PF.P(q + "h", 0, 0);
  var m = /^([^0-9]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/.exec(o.big);
  return {
    id: id,
    show: function (t, t1) {
      PF.X(q + "disc", { s: 1 }, t, 0.45, "back.out(1.8)"); PF.X(q + "ico", { s: 1 }, t + 0.08, 0.5, "back.out(2.2)");
      if (m) {                                 // odpocitavanie nahor: 0 -> hodnota
        var val = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length, steps = Math.min(12, Math.max(3, Math.round(val)));
        for (var k = 0; k <= steps; k++) { var v = val * k / steps, txt = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
          PF.S("#" + q + "big", { textContent: m[1] + txt + m[3] }, t + k * (0.6 / steps)); }
      }
      PF.O("#" + q + "small", 0, 1, t + 0.4, 0.2); PF.X(q + "small", { ty: 30 }, t, 0); PF.X(q + "small", { ty: 0 }, t + 0.4, 0.35, "back.out(2)");
      if (document.getElementById(q + "h")) PF.X(q + "h", { r: 360 }, t + 0.1, Math.max(0.6, (t1 || t + 2) - t - 0.2), "power1.inOut");
      else if (t1 && t1 - t > 1.4) PF.XY(q + "ico", { r: 5 }, t + 0.6, 0.45, "sine.inOut", Math.max(1, Math.floor((t1 - t - 0.8) / 0.9)) * 2 - 1);
    }
  };
};
