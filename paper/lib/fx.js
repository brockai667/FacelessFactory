// Efekty: prach vo svetle, rozmazané popredie, noc, halucinácia (farby + kývanie), heartbeat vinetu rieši PF.VIG.
PF.fx = {
  dust: function (n, seed, color) {          // pomaly sa vznášajúci prach (periódy delia dĺžku videa -> slučka)
    var g = document.getElementById("dust"), rr = PF.rnd(seed || 314); if (color) g.setAttribute("fill", color);
    for (var i = 0; i < (n || 26); i++) {
      var x = 60 + rr() * 960, y = 380 + rr() * 1200, r = 2 + rr() * 4.5;
      var c = PF.el("circle", { cx: x, cy: y, r: r, opacity: (0.25 + rr() * 0.45).toFixed(2) }, g); c.id = "du" + i;
      var per = PF.VO.total / (2 + Math.floor(rr() * 3)), dx = (rr() - 0.5) * 60, dy = -(40 + rr() * 80);
      c.setAttribute("transform", "translate(0 0)");
      PF.tl.fromTo("#du" + i, { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(" + dx.toFixed(1) + " " + dy.toFixed(1) + ")" },
        duration: per / 2, ease: "sine.inOut", yoyo: true, repeat: Math.round(PF.VO.total / per) * 2 - 1, immediateRender: false }, 0);
    }
  },
  leaves: function (col) {                    // rozmazané listy v rohoch popredia (hĺbka)
    PF.add("F", '<g filter="url(#dof)" opacity="0.95"><path d="M-60 2000 C -40 1830 40 1720 170 1690 C 150 1800 90 1900 -60 2000 Z" fill="' + (col || "#3f7a4a") + '"/>' +
      '<path d="M-80 1930 C 20 1840 130 1830 230 1870 C 150 1930 40 1960 -80 1930 Z" fill="#4f8f58"/>' +
      '<path d="M1160 1990 C 1100 1860 1030 1800 930 1790 C 960 1880 1040 1950 1160 1990 Z" fill="' + (col || "#3f7a4a") + '"/></g>');
  },
  night: function (a, b, t, dur) { PF.O("#night", a, b, t, dur || 0.9); },
  tone: function (col, a, b, t, dur) { PF.S("#tone", { backgroundColor: col }, t); PF.O("#tone", a, b, t, dur || 0.8); },   // farebny nadych sveta (teplo/zima)
  frost: function (on, t, dur) {             // namraza v rohoch obrazovky
    if (!document.getElementById("frost")) {
      var s = PF.panel("frost", 5, true), m = "", rr = PF.rnd(404);
      [[0, 0, 1, 1], [1080, 0, -1, 1], [0, 1920, 1, -1], [1080, 1920, -1, -1]].forEach(function (c) {
        for (var i = 0; i < 7; i++) { var a = (i / 6) * Math.PI / 2, L = 150 + rr() * 170, x2 = c[0] + c[2] * Math.cos(a) * L, y2 = c[1] + c[3] * Math.sin(a) * L;
          m += '<path d="M' + c[0] + ' ' + c[1] + ' L' + x2.toFixed(0) + ' ' + y2.toFixed(0) + '" stroke="#ffffff" stroke-width="' + (5 + rr() * 5).toFixed(1) + '" stroke-linecap="round" opacity="0.85"/>';
          for (var k = 1; k < 4; k++) { var px = c[0] + c[2] * Math.cos(a) * L * k / 4, py = c[1] + c[3] * Math.sin(a) * L * k / 4, b = a + 0.5, l2 = 26 + rr() * 30;
            m += '<path d="M' + px.toFixed(0) + ' ' + py.toFixed(0) + ' l' + (c[2] * Math.cos(b) * l2).toFixed(0) + ' ' + (c[3] * Math.sin(b) * l2).toFixed(0) + '" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>'; } }
        m += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="150" fill="#eaf6ff" opacity="0.55"/>'; });
      s.insertAdjacentHTML("beforeend", m);
    }
    PF.S("#frost", { clipPath: "none" }, t); PF.O("#frost", on ? 0 : 1, on ? 1 : 0, t, dur || (on ? 0.8 : 0.01));
  },
  zzz: function (x, y, t0, t1) {             // pismena Z stupaju od hlavy (spanok, unava)
    var g = PF.svg("M"), n = Math.max(1, Math.floor((t1 - t0) / 0.45));
    for (var i = 0; i < n; i++) { var id = "zz" + (PF._zz = (PF._zz || 0) + 1), t = t0 + i * 0.45;
      var e = PF.el("text", { x: x, y: y, opacity: 0, style: "font-family:Hand;font-weight:700;font-size:" + (54 + (i % 3) * 14) + "px;fill:#fbf5ea;stroke:#2b2320;stroke-width:5;paint-order:stroke" }, g);
      e.textContent = "Z"; e.id = id; PF.P(id, x, y);
      PF.O("#" + id, 0, 1, t, 0.12); PF.X(id, { tx: 60 + (i % 2) * 30, ty: -150, r: 14 }, t, 1.1, "power1.out"); PF.O("#" + id, 1, 0, t + 0.8, 0.3); }
  },
  stars: function (x, y, t0, t1) {           // hviezdicky okolo hlavy (zavrat)
    var g = PF.svg("M"), pos = [[-150, -60], [150, -80], [-90, -160], [170, 10], [40, -190]];
    pos.forEach(function (q, i) { var id = "st" + (PF._st = (PF._st || 0) + 1);
      PF.add(g, '<g id="' + id + '" opacity="0"><path transform="translate(' + (x + q[0]) + ' ' + (y + q[1]) + ') scale(1.8)" d="M0 -22 l7 15 l16 3 l-12 11 l3 16 l-14 -8 l-14 8 l3 -16 l-12 -11 l16 -3 z" fill="#f6c343" stroke="#2b2320" stroke-width="3" stroke-linejoin="round"/></g>');
      PF.P(id, x + q[0], y + q[1], { s: 0.3 });
      var n = Math.max(1, Math.floor((t1 - t0 - i * 0.12) / 0.5)) | 1;
      PF.O("#" + id, 0, 1, t0 + i * 0.12, 0.08); PF.XY(id, { s: 1, r: 40 }, t0 + i * 0.12, 0.25, "sine.inOut", n); PF.O("#" + id, 1, 0, t1 - 0.15, 0.15); });
  },
  hallucinate: function (t, dur) {           // kývanie sveta + posun farieb, končí v neutrále
    var reps = Math.max(1, Math.round(dur / 0.4)) | 1;
    PF.tl.fromTo("#camRot", { rotation: 0 }, { rotation: 1.4, duration: 0.38, ease: "sine.inOut", yoyo: true, repeat: reps, immediateRender: false }, t);
    PF.tl.fromTo("#camRot", { filter: "hue-rotate(0deg) saturate(1)" }, { filter: "hue-rotate(38deg) saturate(1.35)", duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: reps, immediateRender: false }, t);
    PF.S("#camRot", { filter: "none", rotation: 0 }, t + (reps + 1) * 0.4 + 0.05);
  },
  cloudWipe: function (t, dir, cols) {       // oblaky/dym cez celu obrazovku (dir 1 = zdola nahor, -1 = zhora nadol); vracia cas plneho zakrytia
    dir = dir || 1; cols = cols || ["#ffffff", "#eef2f6", "#e1e8ef"]; PF._cw = (PF._cw || 0) + 1;
    var id = "cw" + PF._cw, s = PF.panel(id, 9, true), rr = PF.rnd(700 + PF._cw), m = '<rect x="-120" y="0" width="1320" height="1920" fill="' + cols[0] + '"/>';
    for (var i = 0; i < 10; i++) { var x = -80 + i * 140;
      m += '<circle cx="' + x + '" cy="0" r="' + (110 + rr() * 70).toFixed(0) + '" fill="' + cols[0] + '"/><circle cx="' + (x + 70) + '" cy="1920" r="' + (110 + rr() * 70).toFixed(0) + '" fill="' + cols[0] + '"/>'; }
    for (var j = 0; j < 16; j++) m += '<circle cx="' + (rr() * 1080).toFixed(0) + '" cy="' + (320 + rr() * 1280).toFixed(0) + '" r="' + (110 + rr() * 90).toFixed(0) + '" fill="' + cols[1 + (j % 2)] + '"/>';
    s.insertAdjacentHTML("beforeend", '<g id="' + id + 'g" transform="translate(0 ' + (dir * 2200) + ')">' + m + '</g>');
    PF.S("#" + id, { opacity: 1, clipPath: "none" }, t);
    PF.tl.fromTo("#" + id + "g", { attr: { transform: "translate(0 " + (dir * 2200) + ")" } }, { attr: { transform: "translate(0 0)" }, duration: 0.45, ease: "power2.in", immediateRender: false }, t);
    PF.tl.fromTo("#" + id + "g", { attr: { transform: "translate(0 0)" } }, { attr: { transform: "translate(0 " + (-dir * 2200) + ")" }, duration: 0.5, ease: "power2.out", immediateRender: false }, t + 0.6);
    PF.S("#" + id, { opacity: 0 }, t + 1.12);
    return t + 0.45;
  },
  blur: function (px, t, dur) { PF.tl.fromTo("#camRot", { filter: "blur(0px)" }, { filter: "blur(" + px + "px)", duration: dur || 0.6, ease: "power1.inOut", immediateRender: false }, t); },
  unblur: function (px, t, dur) { PF.tl.fromTo("#camRot", { filter: "blur(" + px + "px)" }, { filter: "blur(0px)", duration: dur || 0.4, ease: "power1.inOut", immediateRender: false }, t); PF.S("#camRot", { filter: "none" }, t + (dur || 0.4) + 0.01); }
};
