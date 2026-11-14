// Momenty v2 (10. 11. 2026): velke deje, ktore sa na obraze naozaj STANU (nie len tvar a titulok), a zapojenie divaka.
// Kazdy moment(t, arg, t1, o) pracuje nad aktualnou postavou (PF.R.ctx()) a vracia ciel kamery ako recepty ("face" | "body" | null).
// Co trvalo meni stav, registruje navrat cez PF.R.dirty -> slucka (R.settle) vrati vsetko do prveho snimku.
// Vrstvy: #mo_ui (HTML nad svetom: stopky, ludia, peciatka, karta), mo_ov (SVG nad svetom: ulomky, otazniky, ruka).
PF.M = (function () {
  var tl = PF.tl, R = PF.R, n = 0, ui = null, ov = null, st = {};
  var ALIVE = "#3fa35b", DEAD = "#9aa4af";
  var MAT = {   // material zavalenia: top = prichadza zhora; cols = hmota; inn = vnutro (prechod); lump = hrudy; pocket = dutina; tint = nadych postavy
    snow: { top: true, cols: ["#ffffff", "#eaf2f9", "#d5e3ef"], inn: ["#a9c8e6", "#4f74a3"], lump: ["#dcebf8", "#9fbfdf", "#7ea4cc"], pocket: "#3d5f8c", tint: "#8fb8f0" },
    sand: { top: false, cols: ["#e6c88f", "#d8b577", "#c7a163"], inn: ["#cda766", "#7b5c31"], lump: ["#e0c084", "#b99352", "#a17e44"], pocket: "#6b4f29", tint: null },
    water: { top: false, cols: ["#58aee6", "#3f93d4", "#2f7cbd"], inn: ["#3f93d4", "#12365c"], lump: ["#6fbdf0", "#2f7cbd", "#215f96"], pocket: "#0f2c4c", tint: "#7fb4ea" }
  };
  function C() { return R.ctx(); }
  function uid(p) { n += 1; return p + n; }
  function pt(x, y) {                      // bod postavy (suradnice v pokoji) -> svet, podla natocenia, posunu a mierky postavy
    var s = PF.st[C().hero.p + "float"], a = s.r * Math.PI / 180, dx = (x - s.cx) * s.sx, dy = (y - s.cy) * s.sy;
    return [s.cx + dx * Math.cos(a) - dy * Math.sin(a) + s.tx, s.cy + dx * Math.sin(a) + dy * Math.cos(a) + s.ty];
  }
  function UI() {
    if (ui) return ui;
    var s = document.createElement("style");
    s.textContent = '#mo_ui{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:7;pointer-events:none}' +
      '.mo{position:absolute;left:0;right:0;display:flex;justify-content:center;opacity:0}' +
      '.mo-paper{position:relative;background:var(--paper);border-radius:16px;box-shadow:0 9px 0 rgba(90,42,26,.25);color:var(--ink);font-family:"Pop";font-weight:600;text-align:center}' +
      '.mo-lbl{display:block;font-family:"Hand";font-weight:700;font-size:36px;letter-spacing:.12em;line-height:1.1}' +
      '.mo-timer .mo-paper{padding:16px 40px 2px}.mo-dig{display:block;font-size:150px;line-height:1.04;white-space:nowrap}' +
      '.mo-dig i{display:inline-block;width:.64em;font-style:normal;text-align:center}' +
      '.mo-people .mo-paper{padding:18px 26px 12px;display:flex;gap:12px}.mo-people svg{position:static;width:62px;height:98px;display:block;overflow:visible}' +
      '.mo-stamp>div{border:12px solid var(--stamp);outline:4px solid var(--stamp);outline-offset:8px;color:var(--stamp);background:rgba(251,245,234,.94);' +
      'font-family:"Pop";font-weight:600;font-size:96px;letter-spacing:.04em;line-height:1.06;padding:24px 46px 12px;border-radius:14px;text-align:center;white-space:nowrap}' +
      '.mo-card .mo-paper{padding:30px 56px 22px}.mo-card .mo-lbl{color:var(--stamp);font-size:40px}.mo-card b{display:block;font-size:96px;line-height:1.08;font-weight:600;white-space:nowrap}' +
      '.mo-step .mo-paper{padding:14px 46px 12px 18px;display:flex;align-items:center;gap:24px;font-size:74px;line-height:1;white-space:nowrap}' +
      '.mo-step em{font-style:normal;display:inline-block;width:108px;height:108px;line-height:112px;border-radius:54px;background:#b8342a;color:#ffffff;font-size:80px}' +
      '.mo-inset{justify-content:flex-end;padding-right:54px;box-sizing:border-box}#mo_inIn{width:360px;height:360px;border-radius:50%;overflow:hidden;border:14px solid var(--paper);box-shadow:0 9px 0 rgba(90,42,26,.25)}' +
      '.mo-inset svg{position:static;width:360px;height:360px;display:block}' +
      '.mo-tape{position:absolute;width:120px;height:40px;background:rgba(242,200,110,.9);top:-18px}.mo-tape.a{left:-30px;transform:rotate(-24deg)}.mo-tape.b{right:-30px;transform:rotate(22deg)}' +
      '.mo-left{justify-content:flex-start;padding-left:30px;box-sizing:border-box}.mo-right{justify-content:flex-end;padding-right:30px;box-sizing:border-box}' +
      '.mo-meter .mo-paper{padding:14px 14px 12px}.mo-meter .mo-lbl,.mo-side .mo-lbl{font-size:30px;letter-spacing:.05em}' +
      '.mo-meter svg{position:static;display:block;width:124px;height:430px;margin:6px auto 0;overflow:visible}' +
      '.mo-side .mo-paper{padding:14px 16px 12px}.mo-side svg{position:static;display:block;width:220px;height:270px;margin-top:6px;overflow:visible}' +
      '#mo_chIn{display:flex;gap:44px;transform-origin:50% 0%}' +
      '.mo-ch{position:relative;width:430px;background:#fbf5ea;border-radius:18px;box-shadow:0 9px 0 rgba(90,42,26,.25);color:var(--ink);font-family:"Pop";font-weight:600;text-align:center;' +
      'padding:70px 8px 18px;font-size:76px;line-height:1.02;white-space:nowrap;opacity:0}' +
      '.mo-ch em{position:absolute;left:50%;top:-54px;margin-left:-56px;width:112px;height:112px;line-height:116px;border-radius:56px;font-style:normal;font-size:80px;color:#fbf5ea}' +
      '.mo-mk{position:absolute;left:auto;right:-36px;top:-50px;width:136px;height:136px;margin:0;opacity:0;overflow:visible}' +
      '#mo_flash{position:absolute;left:0;top:0;width:1080px;height:1920px;background:#ffffff;opacity:0;z-index:3}';
    document.head.appendChild(s);
    ui = document.createElement("div"); ui.id = "mo_ui"; ui.innerHTML = '<div id="mo_flash"></div>';
    document.getElementById("root").appendChild(ui);
    return ui;
  }
  function OV() { if (!ov) { ov = PF.panel("mo_ov", 5, true); document.getElementById("mo_ov").style.opacity = 1; } return ov; }
  function fmt(s) { var d = function (q) { return "<i>" + Math.floor(q / 10) + "</i><i>" + (q % 10) + "</i>"; }; return d(Math.floor(s / 60)) + ":" + d(s % 60); }
  function shake(t, dur, amp) {            // otras kamery (naraz, lavina); konci v pokoji
    var k = Math.max(3, Math.round((dur || 0.3) / 0.045)) | 1; amp = amp || 10;
    tl.fromTo("#camRot", { x: -amp, y: amp * 0.5 }, { x: amp, y: -amp * 0.5, duration: 0.045, ease: "none", yoyo: true, repeat: k, immediateRender: false }, t);
    PF.S("#camRot", { x: 0, y: 0 }, t + (k + 1) * 0.045 + 0.01);
  }

  var LIFT = 60;                           // vrch postavy (trup, hlava, ruky) je kresleny o 60 vyssie (char_biped o.lift)
  function ap(s, q) {                      // stav prvku (PF.st) -> kam sa posunie bod q
    var a = s.r * Math.PI / 180, dx = (q[0] - s.cx) * s.sx, dy = (q[1] - s.cy) * s.sy;
    return [s.cx + dx * Math.cos(a) - dy * Math.sin(a) + s.tx, s.cy + dx * Math.sin(a) + dy * Math.cos(a) + s.ty];
  }
  function upPt(q) { var p = C().hero.p, u = ap(PF.st[p + "up"], q); return ap(PF.st[p + "float"], [u[0], u[1] - LIFT]); }
  function handPt(side, x, y) { return upPt(ap(PF.st[C().hero.p + "arm" + side], [x, y])); }   // bod ruky (suradnice ruky v pokoji) -> svet
  function headPt(x, y) { return upPt(ap(PF.st[C().hero.p + "head"], [x, y])); }                // bod hlavy -> svet
  function scr(q) { return [540 + 1.06 * (q[0] - 528), 960 + 1.06 * (q[1] - 980)]; }           // svet -> obrazovka pri kamere "body"
  function UIS() {                         // SVG v suradniciach obrazovky NAD kartami (kvapky, luce)
    var e = document.getElementById("mo_uiS");
    if (!e) { UI().insertAdjacentHTML("beforeend", '<svg id="mo_uiS" style="z-index:2"></svg>'); e = document.getElementById("mo_uiS"); }
    return e;
  }

  var M = {
    // ---------- kamera
    handheld: function () {                // jemne kyvanie obrazu cele video -> nic nie je staticke; perioda deli dlzku videa (slucka)
      var T = PF.VO.total; if (!(T > 0)) return; var p = PF.loopPeriod(6), m = Math.max(1, Math.round(T / p));
      tl.fromTo("#camRot", { rotation: -0.4 }, { rotation: 0.4, duration: p / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * m - 1, immediateRender: false }, 0);
    },
    shake: function (t, amp, t1, o) { shake(t, (o && o.dur) || 0.35, +amp || 10); return null; },
    closeup: function (t, x, t1, o) {      // najazd na tvar aj ked je postava natocena / posunuta
      o = o || {}; var s = PF.st[C().hero.p + "float"], a = s.r * Math.PI / 180, fy = (o.fy || 800) - s.cy;
      R.camTo(t, o.zoom || 1.5, s.cx - fy * Math.sin(a) + s.tx, s.cy + fy * Math.cos(a) + s.ty, 0.45, "power2.out"); return null;
    },
    // ---------- velke deje
    bury: function (t, mat, t1, o) {       // hmota zavali cely obraz (lavina zhora, piesok/voda zdola) a postava ostane v nej
      o = o || {}; var c = MAT[mat] || MAT.snow, id = uid("mo_bu"), s = PF.panel(id, 4, true), rr = PF.rnd(900 + n), dur = o.dur || 0.85,
        from = c.top ? -2420 : 2420, edge = c.top ? 1920 : 0, i, m, g = OV();
      m = '<rect x="-160" y="' + (c.top ? -500 : 0) + '" width="1400" height="2420" fill="' + c.cols[0] + '"/>';
      for (i = 0; i < 11; i++) m += '<circle cx="' + (-90 + i * 126) + '" cy="' + edge + '" r="' + (120 + rr() * 90).toFixed(0) + '" fill="' + c.cols[0] + '"/>';
      for (i = 0; i < 22; i++) m += '<circle cx="' + (rr() * 1080).toFixed(0) + '" cy="' + (rr() * 1900).toFixed(0) + '" r="' + (90 + rr() * 130).toFixed(0) + '" fill="' + c.cols[1 + (i % 2)] + '" opacity="0.8"/>';
      s.insertAdjacentHTML("beforeend", '<g id="' + id + 'g" transform="translate(0 ' + from + ')">' + m + '</g>');
      PF.S("#" + id, { opacity: 1, clipPath: "none" }, t);
      tl.fromTo("#" + id + "g", { attr: { transform: "translate(0 " + from + ")" } }, { attr: { transform: "translate(0 0)" }, duration: dur, ease: "power2.in", immediateRender: false }, t);
      for (i = 0; i < 10; i++) {           // ulomky letia pred celom hmoty
        var cid = id + "c" + i, x0 = 60 + rr() * 960, y0 = c.top ? -120 : 2040, y1 = c.top ? 2060 : -140, tt = t + 0.05 + rr() * dur * 0.6;
        PF.el("circle", { id: cid, cx: 0, cy: 0, r: (26 + rr() * 46).toFixed(0), fill: c.cols[i % 3], stroke: c.cols[2], "stroke-width": 5, opacity: 0, transform: "translate(" + x0.toFixed(0) + " " + y0 + ")" }, g);
        PF.S("#" + cid, { opacity: 1 }, tt);
        tl.fromTo("#" + cid, { attr: { transform: "translate(" + x0.toFixed(0) + " " + y0 + ")" } }, { attr: { transform: "translate(" + (x0 + (rr() - 0.5) * 380).toFixed(0) + " " + y1 + ")" },
          duration: 0.42 + rr() * 0.2, ease: "power1.in", immediateRender: false }, tt);
        PF.S("#" + cid, { opacity: 0 }, tt + 0.64);
      }
      shake(t, dur + 0.3, 12);
      var tc = t + dur; PF.punch(tc, 1.05);
      M.encase(tc + 0.02, mat);
      PF.O("#" + id, 1, 0, tc + 0.12, 0.4, "power1.in");   // hmota zredne -> pohlad dovnutra
      return null;
    },
    encase: function (t, mat) {            // pohlad dovnutra: postava zaliata v hmote (dutina okolo nej), nakloneny, bez tiena
      var c = MAT[mat] || MAT.snow, H = C().hero, p = H.p, rr = PF.rnd(1234), i, m, x, y;
      if (!document.getElementById("mo_enc")) {
        document.getElementById("defs").insertAdjacentHTML("beforeend", '<linearGradient id="mo_gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.inn[0] +
          '"/><stop offset="1" stop-color="' + c.inn[1] + '"/></linearGradient>');
        m = '<rect x="-500" y="-500" width="2080" height="2920" fill="url(#mo_gIn)"/><ellipse id="mo_encPk" cx="540" cy="1040" rx="400" ry="610" fill="' + c.pocket + '" opacity="0.55" filter="url(#soft)"/><g id="mo_encL">';
        for (i = 0; i < 46; i++) {
          x = -160 + rr() * 1400; y = -120 + rr() * 2160;
          if (Math.pow((x - 540) / 400, 2) + Math.pow((y - 1040) / 600, 2) < 1) continue;
          m += '<ellipse cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" rx="' + (80 + rr() * 130).toFixed(0) + '" ry="' + (56 + rr() * 80).toFixed(0) + '" transform="rotate(' + (rr() * 60 - 30).toFixed(0) +
            " " + x.toFixed(0) + " " + y.toFixed(0) + ')" fill="' + c.lump[i % 3] + '" opacity="' + (0.5 + rr() * 0.4).toFixed(2) + '"/>';
        }
        m += "</g>";
        var T = PF.VO.total || 30, fl = [];                // drobne ulomky pomaly padaju dutinou -> vnutro nie je mrtve
        for (i = 0; i < 16; i++) {
          x = 190 + rr() * 700; var per = 2.2 + rr() * 2.4, ph = 380 + rr() * 700, fid = "mo_fk" + i;   // ph = vyska, z ktorej ulomok pada (rozne -> nejdu v rade)
          m += '<circle id="' + fid + '" cx="0" cy="0" r="' + (5 + rr() * 9).toFixed(0) + '" fill="#ffffff" opacity="' + (0.35 + rr() * 0.4).toFixed(2) + '" transform="translate(' + x.toFixed(0) + ' 300)"/>';
          fl.push([fid, x, per, ph, (rr() - 0.5) * 120]);
        }
        document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_enc" opacity="0">' + m + '</g>');
        fl.forEach(function (f) {
          tl.fromTo("#" + f[0], { attr: { transform: "translate(" + f[1].toFixed(0) + " " + f[3].toFixed(0) + ")" } }, { attr: { transform: "translate(" + (f[1] + f[4]).toFixed(0) + " 1720)" },
            duration: f[2], ease: "none", repeat: Math.ceil(T / f[2]) + 1, immediateRender: false }, 0); });   // nikdy zaporny cas: GSAP by posunul celu casovu os
        tl.fromTo("#mo_encL", { scale: 1 }, { scale: 1.04, svgOrigin: "540 1040", duration: 1.5, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(T / 1.5) + 1, immediateRender: false }, 0);
        m = "";
        [[-40, -40, 330], [1120, -40, 310], [-60, 1960, 360], [1140, 1960, 340], [-90, 900, 230], [1170, 1050, 240], [540, 2060, 300], [300, -110, 220], [820, -120, 230]].forEach(function (q, j) {
          m += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="' + c.cols[j % 2] + '"/>'; });
        PF.add("F", '<g id="mo_encF" opacity="0" filter="url(#dof)">' + m + '</g>');
      }
      PF.S("#mo_enc", { opacity: 1 }, t); PF.S("#mo_encF", { opacity: 1 }, t);
      H.move(-20, 70, -28, t, 0); H.shadow(false, t);
      if (c.tint) H.tint(c.tint, 0, 0.24, t + 0.1, 0.5);
      R.face(t, "worried");
      R.dirty("encase", function (tt, d) {
        PF.O("#mo_enc", 1, 0, tt, d || 0.01); PF.O("#mo_encF", 1, 0, tt, d || 0.01); H.move(0, 0, 0, tt, d || 0); H.shadow(true, tt, d || 0);
        if (c.tint) H.tint(c.tint, 0.24, 0, tt, d || 0.01); });
      return null;
    },
    squeeze: function (t, x, t1, o) {      // hmota stuhne: dutina sa zovrie okolo postavy, hrudy sa pritlacia (napr. sneh ako beton)
      var p = C().hero.p, d = (o && o.dur) || 0.45;
      if (!st.sq) { PF.P("mo_encPk", 540, 1040); PF.P("mo_encF", 540, 960); st.sq = true; }
      PF.X("mo_encPk", { s: 0.72 }, t, d, "power3.in"); PF.X("mo_encF", { s: 0.88 }, t, d, "power3.in"); PF.X(p + "float", { s: 0.92 }, t, d, "power3.in");
      shake(t + d, 0.26, 9); PF.punch(t + d, 1.035); R.face(t + d, "pain");
      R.dirty("squeeze", function (tt, dd) { PF.X("mo_encPk", { s: 1 }, tt, dd || 0); PF.X("mo_encF", { s: 1 }, tt, dd || 0); PF.X(p + "float", { s: 1 }, tt, dd || 0); });
      return "body";
    },
    buddy: function (t, x, t1, o) {        // druha postava sa postavi vedla hrdinu (zachranca, partak); hrdina ustupi nabok
      o = o || {}; var H = C().hero;
      if (!st.bd) {
        st.bd = PF.charBiped({ id: "buddy", look: "clothed", outfit: o.outfit || "hoodie", hairStyle: o.hair || "short", skin: o.skin || "#c98d62", skinDark: o.skinDark || "#a8703f",
          hair: o.hairColor || "#2b2320", suit: o.suit || "#3f8f6b", suitDark: o.suitDark || "#2f7052", armL: 18, armR: -18 });
        PF.S("#buddy_float", { opacity: 0 }, 0); PF.X("buddy_float", { tx: 330, s: 0.6 }, 0, 0);
        st.bd.eyes("eyesHap", 0); st.bd.mouth("mBig", 0);
      }
      var B = st.bd, dx = o.dx || 185;
      H.move(-dx, 0, 0, t, 0.3, "power2.out");
      PF.O("#buddy_float", 0, 1, t, 0.08); PF.X("buddy_float", { tx: dx, s: 1 }, t, 0.34, "back.out(1.7)");
      B.arm("L", 150, t + 0.2, 0.3, "back.out(1.8)"); B.armWave("L", 128, t + 0.52, 0.16, 3);
      R.dirty("buddy", function (tt, d) { PF.O("#buddy_float", 1, 0, tt, d ? 0.15 : 0.01); PF.X("buddy_float", { tx: 330, s: 0.6 }, tt + 0.16, 0);
        B.arm("L", 18, tt + 0.16, 0); H.move(0, 0, 0, tt, d || 0); });
      return "body";
    },
    struggle: function (t, x, t1, o) {     // trha sebou, ale ruky sa nepohnu z miesta (uviaznutie)
      var H = C().hero, p = H.p, dur = (o && o.dur) || 1.0, k = Math.max(3, Math.round(dur / 0.07)) | 1;
      PF.XY(p + "armL", { r: PF.st[p + "armL"].r + 12 }, t, 0.07, "sine.inOut", k); PF.XY(p + "armR", { r: PF.st[p + "armR"].r - 12 }, t + 0.03, 0.07, "sine.inOut", k);
      PF.XY(p + "head", { r: 6 }, t, 0.09, "sine.inOut", Math.max(3, Math.round(dur / 0.09)) | 1);
      R.face(t, "angry"); H.sweat(t + 0.15, t + dur); R.face(t + dur, "worried");
      return "body";
    },
    spin: function (t, x, t1, o) {         // strata orientacie: postava sa pomaly pretoci dokola, otazniky
      var H = C().hero, p = H.p, r0 = PF.st[p + "float"].r, dur = Math.max(1.2, Math.min((o && o.dur) || 2.2, (t1 || 1e9) - t - 0.25)), g = OV();
      PF.X(p + "float", { r: r0 + 360 }, t, dur, "sine.inOut"); PF.X(p + "float", { r: r0 }, t + dur + 0.01, 0);
      H.eyes("eyesSp", t); H.spin(t, dur); H.eyes("eyesN", t + dur); R.face(t + dur + 0.02, "worried");
      [[230, 640, -14], [850, 720, 12], [200, 1180, 10], [870, 1250, -10], [560, 470, 4]].forEach(function (q, i) {
        var id = uid("mo_q"), ti = t + 0.12 + i * (dur - 0.5) / 5;
        PF.add(g, '<text id="' + id + '" x="' + q[0] + '" y="' + q[1] + '" opacity="0" transform="rotate(' + q[2] + " " + q[0] + " " + q[1] +
          ')" style="font-family:Pop;font-weight:600;font-size:170px;fill:#fbf5ea;stroke:#2b2320;stroke-width:14;paint-order:stroke;text-anchor:middle">?</text>');
        PF.P(id, q[0], q[1] - 60, { s: 0.2, r: q[2] });
        PF.O("#" + id, 0, 1, ti, 0.06); PF.X(id, { s: 1 }, ti, 0.26, "back.out(2.6)"); PF.O("#" + id, 1, 0, t + dur - 0.05, 0.15); PF.X(id, { s: 0.2 }, t + dur + 0.12, 0); });
      return "body";
    },
    mask: function (t, x, t1, o) {         // ladova maska rastie pred ustami a nosom
      o = o || {}; var p = C().hero.p, cy = o.cy || 922, i, m;
      if (!document.getElementById("mo_mask")) {
        m = '<ellipse cx="540" cy="' + cy + '" rx="118" ry="78" fill="#dbf1ff" fill-opacity="0.72" stroke="#ffffff" stroke-width="10"/>' +
          '<path d="M462 ' + (cy - 24) + ' q38 -36 90 -34" stroke="#ffffff" stroke-width="11" stroke-linecap="round" fill="none"/>';
        for (i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2, x1 = 540 + Math.cos(a) * 118, y1 = cy + Math.sin(a) * 78;
          m += '<path d="M' + x1.toFixed(0) + " " + y1.toFixed(0) + " l" + (Math.cos(a) * (22 + (i % 3) * 14)).toFixed(0) + " " + (Math.sin(a) * (22 + (i % 3) * 14)).toFixed(0) +
            '" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>'; }
        PF.add(p + "head", '<g id="mo_mask" opacity="0">' + m + '</g>'); PF.P("mo_mask", 540, cy, { s: 0.12 });
      }
      PF.O("#mo_mask", 0, 1, t, 0.12); PF.X("mo_mask", { s: 1 }, t, (o.dur || 1.0), "power2.out");
      R.dirty("mask", function (tt, d) { PF.O("#mo_mask", 1, 0, tt, d || 0.01); PF.X("mo_mask", { s: 0.12 }, tt + (d || 0.01) + 0.01, 0); });
      return null;
    },
    reach: function (t, x, t1, o) {        // zhora sa prederie svetlo a ruka zachrancu; postava sa naciahne
      var H = C().hero, g = OV();
      if (!document.getElementById("mo_hand")) {
        PF.add(g, '<g id="mo_hand" opacity="0"><circle cx="560" cy="20" r="360" fill="url(#gSun)" opacity="0.95"/>' +
          '<g id="mo_hole"><ellipse cx="560" cy="0" rx="240" ry="176" fill="#bfe3fb" stroke="#ffffff" stroke-width="24"/></g>' +
          '<g id="mo_handG"><rect x="508" y="-620" width="104" height="740" rx="40" fill="#e98a2b" stroke="#c76f1c" stroke-width="6"/>' +
          '<rect x="498" y="92" width="124" height="38" rx="14" fill="#fbf5ea" stroke="#d9d2c4" stroke-width="5"/>' +
          '<path d="M612 142 q46 4 40 46 q-8 26 -40 14 z" fill="#d9483b" stroke="#b53a30" stroke-width="6"/>' +
          '<path d="M506 128 h108 v74 a54 54 0 0 1 -108 0 z" fill="#d9483b" stroke="#b53a30" stroke-width="6"/></g></g>');
        PF.P("mo_hole", 560, 0, { s: 0 }); PF.P("mo_handG", 560, 0, { ty: -760 });
      }
      ["timer", "people", "step", "spit", "wayup"].forEach(function (k) { R.clean(k, t - 0.12, 0.2); });   // udaje uvolnia vrch obrazu pre ruku
      PF.O("#mo_hand", 0, 1, t, 0.1); PF.X("mo_hole", { s: 1 }, t, 0.36, "back.out(1.6)"); PF.X("mo_handG", { ty: 400 }, t + 0.2, 0.45, "back.out(1.3)");
      st.hand = true;
      if (PF.st[H.p + "armR"].r !== -165) H.arm("R", -165, t + 0.3, 0.4, "back.out(1.6)");   // po armup je ruka uz hore
      R.face(t + 0.1, "excited"); H.look(0, -12, t + 0.1, 0.2);
      R.dirty("reach", function (tt, d) { H.arm("R", C().arms0[1], tt, d || 0.01); H.look(C().look0[0], C().look0[1], tt, 0);
        if (st.hand) { PF.O("#mo_hand", 1, 0, tt, 0.1); PF.X("mo_hole", { s: 0 }, tt + 0.12, 0); PF.X("mo_handG", { ty: -760 }, tt + 0.12, 0); st.hand = false; } });
      return null;
    },
    release: function (t, x, t1, o) {      // vyslobodenie: zablesk, hmota zmizne, postava stoji, udaje zmiznu
      UI(); var H = C().hero;
      if (st.hand) { PF.X("mo_handG", { ty: -760 }, t - 0.02, 0.24, "power2.in"); }
      PF.O("#mo_flash", 0, 0.96, t, 0.08); PF.O("#mo_flash", 0.96, 0, t + 0.12, 0.45, "power1.out");
      ["squeeze", "airpocket", "spit", "wayup", "armup", "step", "encase", "mask", "reach", "timer", "people"].forEach(function (k) { R.clean(k, t + 0.09); });
      PF.punch(t + 0.09, 1.04); R.face(t + 0.1, "happy");
      PF.XY(H.p + "float", { ty: -34 }, t + 0.12, 0.16, "sine.out", 1);
      return "body";
    },
    // ---------- navod: co ma clovek urobit sam (kroky s animaciou)
    airpocket: function (t, x, t1, o) {    // dlane pred usta + vzduchova kapsa, ktora dycha
      var H = C().hero, p = H.p, a0 = C().arms0;
      if (!document.getElementById("mo_air")) {
        PF.add(p + "up", '<g id="mo_air" opacity="0"><ellipse cx="540" cy="915" rx="158" ry="116" fill="#eaf7ff" fill-opacity="0.45" stroke="#ffffff" stroke-width="9" stroke-dasharray="26 18" stroke-linecap="round"/></g>');
        PF.P("mo_air", 540, 915, { s: 0.3 });
      }
      H.arm("L", -108, t, 0.3, "back.out(1.4)"); H.arm("R", 108, t + 0.05, 0.3, "back.out(1.4)");
      PF.O("#mo_air", 0, 1, t + 0.3, 0.12); PF.X("mo_air", { s: 1 }, t + 0.3, 0.4, "back.out(2)");
      PF.XY("mo_air", { s: 1.1 }, t + 0.75, 0.42, "sine.inOut", 3);
      R.face(t + 0.35, "neutral");
      R.dirty("airpocket", function (tt, d) { H.arm("L", a0[0], tt, d || 0.01); H.arm("R", a0[1], tt, d || 0.01); PF.O("#mo_air", 1, 0, tt, d || 0.01); PF.X("mo_air", { s: 0.3 }, tt + (d || 0.01) + 0.01, 0); });
      return "body";
    },
    spit: function (t, x, t1, o) {         // slina pada dole (gravitacia) -> ukaze, kde je dole
      var m = pt(540, 866), id = uid("mo_sp"), mx = (m[0] - 26).toFixed(0), my = +m[1].toFixed(0);
      R.clean("airpocket", t - 0.28, 0.2); R.face(t - 0.06, "shocked");
      PF.add("M", '<g id="' + id + '" opacity="0"><g id="' + id + 'a" opacity="0"><path d="M' + mx + " " + (my + 70) + ' v250" stroke="#fbf5ea" stroke-width="13" stroke-dasharray="30 24" stroke-linecap="round" fill="none"/>' +
        '<path d="M' + (mx - 36) + " " + (my + 322) + ' l36 46 l36 -46" stroke="#fbf5ea" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
        '<text x="' + (+mx - 64) + '" y="' + (my + 250) + '" style="font-family:Pop;font-weight:600;font-size:64px;fill:#fbf5ea;text-anchor:end">DOWN</text></g>' +
        '<path id="' + id + 'd" d="M0 -26 C 16 -4 21 6 21 16 A21 21 0 0 1 -21 16 C -21 6 -16 -4 0 -26 Z" fill="#bfe3fb" stroke="#ffffff" stroke-width="6" transform="translate(' + mx + " " + my + ')"/></g>');
      PF.O("#" + id, 0, 1, t, 0.05); PF.O("#" + id + "a", 0, 1, t + 0.3, 0.15);
      tl.fromTo("#" + id + "d", { attr: { transform: "translate(" + mx + " " + my + ")" } }, { attr: { transform: "translate(" + mx + " " + (my + 390) + ")" }, duration: 0.55, ease: "power2.in", immediateRender: false }, t + 0.04);
      R.dirty("spit", function (tt, d) { PF.O("#" + id, 1, 0, tt, d ? 0.15 : 0.01); });
      return "body";
    },
    wayup: function (t, x, t1, o) {        // velka zelena sipka: hore je opacnym smerom
      var H = C().hero, id = uid("mo_up"), ax = Math.min(900, pt(540, 1100)[0] + 320), ay = 900;   // vpravo od postavy, pod stitkom kroku
      PF.add("M", '<g id="' + id + '" opacity="0"><path d="M' + ax + " " + ay + " V" + (ay - 250) + '" stroke="' + ALIVE + '" stroke-width="38" stroke-linecap="round" fill="none"/>' +
        '<path d="M' + (ax - 78) + " " + (ay - 210) + " L" + ax + " " + (ay - 320) + " L" + (ax + 78) + " " + (ay - 210) + '" stroke="' + ALIVE + '" stroke-width="38" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
        '<text x="' + ax + '" y="' + (ay - 352) + '" style="font-family:Pop;font-weight:600;font-size:120px;text-anchor:middle;fill:' + ALIVE + ';stroke:#fbf5ea;stroke-width:14;paint-order:stroke">UP</text></g>');
      PF.P(id, ax, ay, { s: 0.15 });
      PF.O("#" + id, 0, 1, t, 0.06); PF.X(id, { s: 1 }, t, 0.32, "back.out(2.2)"); PF.XY(id, { ty: -26 }, t + 0.4, 0.3, "sine.inOut", 3);
      H.look(0, -12, t, 0.2); R.face(t + 0.05, "excited");
      R.dirty("wayup", function (tt, d) { PF.O("#" + id, 1, 0, tt, d ? 0.15 : 0.01); H.look(C().look0[0], C().look0[1], tt, 0); });
      return "body";
    },
    armup: function (t, x, t1, o) {        // ruka vystreli hore; okienko ukaze povrch, kde ruka trci zo snehu a mava
      o = o || {}; var H = C().hero, u = UI(), sl = o.sleeve || "#e98a2b", sk = o.skin || "#f1c9a5";
      H.arm("R", -165, t, 0.22, "back.out(2.4)"); shake(t + 0.2, 0.2, 7);
      if (!st.inset) {
        u.insertAdjacentHTML("beforeend", '<div class="mo mo-inset" id="mo_in" style="top:' + (o.y || 380) + 'px"><div id="mo_inIn"><svg viewBox="0 0 360 360"><rect width="360" height="360" fill="#a9d4f2"/>' +
          '<circle cx="290" cy="70" r="34" fill="#ffd66b"/><g id="mo_inH"><rect x="160" y="150" width="46" height="200" rx="20" fill="' + sl + '"/><circle cx="183" cy="146" r="34" fill="' + sk + '" stroke="#dca87f" stroke-width="5"/></g>' +
          '<circle id="mo_inP" cx="183" cy="146" r="40" fill="none" stroke="#d9483b" stroke-width="9" opacity="0"/>' +
          '<path d="M-10 262 Q 90 214 180 250 T 370 236 V370 H-10 Z" fill="#ffffff"/><path d="M-10 300 Q 120 270 230 300 T 370 290 V370 H-10 Z" fill="#e3edf6"/></svg></div></div>');
        st.inset = true;
      }
      PF.O("#mo_in", 0, 1, t + 0.12, 0.08);
      tl.fromTo("#mo_inIn", { scale: 0.3, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t + 0.12);
      tl.fromTo("#mo_inH", { y: 150, rotation: 0, svgOrigin: "183 300" }, { y: 0, duration: 0.24, ease: "back.out(2.2)", immediateRender: false }, t + 0.3);
      tl.fromTo("#mo_inH", { rotation: -13, svgOrigin: "183 300" }, { rotation: 13, duration: 0.16, ease: "sine.inOut", yoyo: true, repeat: 9, immediateRender: false }, t + 0.56);
      tl.fromTo("#mo_inP", { attr: { r: 40 }, opacity: 0.9 }, { attr: { r: 150 }, opacity: 0, duration: 0.6, ease: "power1.out", repeat: 2, immediateRender: false }, t + 0.5);
      R.dirty("armup", function (tt, d) { H.arm("R", C().arms0[1], tt, d || 0.01); PF.O("#mo_in", 1, 0, tt, d ? 0.15 : 0.01); });
      return "body";
    },
    // ---------- udaje a zapojenie divaka (HTML nad svetom)
    step: function (t, num, t1, o) {       // cislovany krok navodu hore; dalsie volanie vymeni predosly
      o = o || {}; var u = UI(), id = uid("mo_sx"), prev = st.step;
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-step" id="' + id + '" style="top:' + (o.y || 150) + 'px"><div class="mo-paper" id="' + id + 'In"' + (o.size ? ' style="font-size:' + o.size + 'px"' : '') + '><em>' + num + '</em><span>' + (o.text || "") + '</span></div></div>');
      if (prev) PF.O("#" + prev, 1, 0, t - 0.1, 0.1);
      ["airpocket", "spit", "wayup"].forEach(function (k) { R.clean(k, t - 0.12, 0.12); });   // novy krok zacina s cistym obrazom
      PF.O("#" + id, 0, 1, t, 0.06);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2.2)", immediateRender: false }, t);
      PF.punch(t + 0.1, 1.02); st.step = id;
      R.dirty("step", function (tt, d) { PF.O("#" + id, 1, 0, tt, d ? 0.15 : 0.01); st.step = null; });
      return null;
    },
    rewind: function (t, x, t1, o) {       // pretocenie spat: pasy cez obraz, stopky bezia na nulu a zmiznu, zovretie povoli
      o = o || {}; var u = UI(), id = uid("mo_rw"), d = o.dur || 0.8, i, N = Math.round(d * 30);
      var h = '<div class="mo mo-stamp" id="' + id + '" style="top:' + (o.y || 425) + 'px"><div id="' + id + 'In"><svg viewBox="0 0 64 40" style="position:static;display:inline-block;width:128px;height:80px;vertical-align:-6px;overflow:visible">' +
        '<path d="M30 2 L4 20 L30 38 Z M60 2 L34 20 L60 38 Z" fill="currentColor"/></svg> ' + (o.text || "REWIND") + '</div></div>';
      for (i = 0; i < 3; i++) h += '<div id="' + id + 'b' + i + '" style="position:absolute;left:0;top:0;width:1080px;height:' + (70 + i * 40) + 'px;background:#ffffff;opacity:0"></div>';
      u.insertAdjacentHTML("beforeend", h);
      PF.O("#" + id, 0, 1, t, 0.05); tl.fromTo("#" + id + "In", { scale: 1.8, rotation: 6 }, { scale: 1, rotation: -4, duration: 0.14, ease: "power3.in", immediateRender: false }, t);
      PF.O("#" + id, 1, 0, t + d, 0.12);
      for (i = 0; i < 3; i++) tl.fromTo("#" + id + "b" + i, { y: 1920 + i * 500, opacity: 0.28 }, { y: -200, opacity: 0.28, duration: 0.26 + i * 0.05, ease: "none", repeat: 2, immediateRender: false }, t + i * 0.07);
      for (i = 0; i < 3; i++) PF.S("#" + id + "b" + i, { opacity: 0 }, t + d + 0.2);
      shake(t, d, 6); R.clean("squeeze", t + 0.1, Math.max(0.2, d - 0.3)); R.face(t, "shocked");
      ["mask", "people"].forEach(function (k) { R.clean(k, t + 0.1, 0.25); });   // pretocenie vrati aj masku a pocty
      if (st.tm) {
        var a = st.tm.v;
        for (i = 1; i <= N; i++) tl.set("#mo_tmD", { innerHTML: fmt(Math.round(a * (1 - i / N))) }, t + d * i / N);
        st.tm.v = 0; R.clean("timer", t + d + 0.05, 0.2);
      }
      return "body";
    },
    timer: function (t, to, t1, o) {       // stopky: cas vybehne na `to` minut; dalsie volanie pokracuje od poslednej hodnoty
      o = o || {}; var u = UI(), dur = o.dur || 1.0, i, N = Math.max(2, Math.round(dur * 30));
      if (!st.tm) {
        u.insertAdjacentHTML("beforeend", '<div class="mo mo-timer" id="mo_tm" style="top:' + (o.y || 150) + 'px"><div class="mo-paper" id="mo_tmIn"><span class="mo-lbl">' +
          (o.label || "TIME") + '</span><span class="mo-dig" id="mo_tmD">' + fmt(0) + '</span></div></div>');
        st.tm = { v: 0 };
        PF.O("#mo_tm", 0, 1, t - 0.18, 0.08);
        tl.fromTo("#mo_tmIn", { scale: 0.5, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t - 0.18);
        R.dirty("timer", function (tt, d) { PF.O("#mo_tm", 1, 0, tt, d ? 0.2 : 0.01); });
      }
      var a = st.tm.v, b = Math.round(+to * 60);
      for (i = 1; i <= N; i++) { var k = i / N, e = k * k * (3 - 2 * k); tl.set("#mo_tmD", { innerHTML: fmt(Math.round(a + (b - a) * e)) }, t + dur * k); }
      st.tm.v = b;
      if (o.color) tl.set("#mo_tmD", { color: o.color }, t + dur);
      tl.fromTo("#mo_tmIn", { scale: 1.14 }, { scale: 1, duration: 0.28, ease: "power2.out", immediateRender: false }, t + dur);
      return null;
    },
    people: function (t, k, t1, o) {       // rad postaviciek: k z N ostava (ostatne zosivu); dalsie volanie ubera dalsich
      o = o || {}; var u = UI(), N = o.of || 10, i;
      if (!st.pp) {
        var h = "";
        for (i = 0; i < N; i++) h += '<svg id="mo_pp' + i + '" viewBox="0 0 40 64" style="color:' + ALIVE + '"><circle cx="20" cy="12" r="11" fill="currentColor"/><path d="M4 62 V37 a16 16 0 0 1 32 0 V62 z" fill="currentColor"/></svg>';
        u.insertAdjacentHTML("beforeend", '<div class="mo mo-people" id="mo_pp" style="top:' + (o.y || 386) + 'px"><div class="mo-paper">' + h + '</div></div>');
        PF.O("#mo_pp", 0, 1, t - 0.1, 0.08);
        for (i = 0; i < N; i++) tl.fromTo("#mo_pp" + i, { scale: 0, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.22, ease: "back.out(2.5)", immediateRender: false }, t - 0.1 + i * 0.03);
        st.pp = { alive: N }; t += 0.5;
        R.dirty("people", function (tt, d) { PF.O("#mo_pp", 1, 0, tt, d ? 0.2 : 0.01); });
      }
      for (i = st.pp.alive - 1; i >= +k; i--)
        tl.fromTo("#mo_pp" + i, { color: ALIVE, opacity: 1, y: 0 }, { color: DEAD, opacity: 0.55, y: 10, duration: 0.18, ease: "power2.in", immediateRender: false }, t + (st.pp.alive - 1 - i) * 0.09);
      st.pp.alive = Math.min(st.pp.alive, +k);
      return null;
    },
    stamp: function (t, txt, t1, o) {      // peciatka buchne do obrazu (riadky oddelene |)
      o = o || {}; var u = UI(), id = uid("mo_st"), rot = o.rot === undefined ? -6 : o.rot;
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-stamp" id="' + id + '" style="top:' + (o.y || 240) + 'px"><div id="' + id + 'In"' + (o.size ? ' style="font-size:' + o.size + 'px"' : "") + '>' + String(txt).replace(/\|/g, "<br>") + '</div></div>');
      tl.set("#" + id + "In", { rotation: rot }, 0);
      PF.O("#" + id, 0, 1, t, 0.05);
      tl.fromTo("#" + id + "In", { scale: 2.6, rotation: rot - 9 }, { scale: 1, rotation: rot, duration: 0.14, ease: "power3.in", immediateRender: false }, t);
      PF.punch(t + 0.14, 1.035); shake(t + 0.14, 0.22, 9);
      PF.O("#" + id, 1, 0, Math.max(t + 0.5, Math.min(t + (o.hold || 1.6), (t1 || 1e9) - 0.18 + (o.over || 0))), 0.15);
      return null;
    },
    card: function (t, title, t1, o) {     // karta na ulozenie (pravidlo): vysunie sa zdola, ostava do konca
      o = o || {}; var u = UI(), h = (o.text || []).map(function (b) { return "<b" + (o.size ? ' style="font-size:' + o.size + 'px"' : "") + ">" + b + "</b>"; }).join("");
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-card" id="mo_cd" style="top:' + (o.y || 1120) + 'px"><div class="mo-paper" id="mo_cdIn"><div class="mo-tape a"></div><div class="mo-tape b"></div>' +
        '<span class="mo-lbl">' + title + '</span>' + h + '</div></div>');
      PF.O("#mo_cd", 0, 1, t, 0.06);
      tl.fromTo("#mo_cdIn", { y: 460, rotation: 8 }, { y: 0, rotation: -2, duration: 0.42, ease: "back.out(1.5)", immediateRender: false }, t);
      R.dirty("card", function (tt, d) { PF.O("#mo_cd", 1, 0, tt, d ? 0.2 : 0.01); });
      return null;
    }    ,
    // ---------- voda a pust (034 Stranded In The Desert): flasa v ruke, pitie, ukazovatel vody, volba A / B, tien, klobuk
    _lvl: function (v, t, d) {             // hladina vo flasi (0-1)
      tl.fromTo("#mo_btW", { attr: { y: 1248 - 132 * st.bt.v } }, { attr: { y: 1248 - 132 * v }, duration: d, ease: "power1.inOut", immediateRender: false }, t); st.bt.v = v;
    },
    bottle: function (t, mode, t1, o) {    // flasa vody v pravej ruke (je tam od prveho snimku); "show" = zdvihne ju a ukaze
      o = o || {}; var H = C().hero, p = H.p, a0 = C().arms0[1];
      if (!st.bt) {
        document.getElementById("defs").insertAdjacentHTML("beforeend", '<clipPath id="mo_btC"><rect x="627" y="1101" width="50" height="144" rx="13"/></clipPath>');
        document.getElementById(p + "handR").insertAdjacentHTML("beforebegin", '<g id="mo_bt"><rect x="624" y="1098" width="56" height="150" rx="16" fill="#e8f6fc" fill-opacity="0.92" stroke="#ffffff" stroke-width="5"/>' +
          '<g clip-path="url(#mo_btC)"><rect id="mo_btW" x="620" y="1116" width="64" height="220" fill="#3f9be0"/></g>' +
          '<rect x="640" y="1076" width="24" height="26" fill="#e8f6fc" stroke="#ffffff" stroke-width="5"/><rect x="635" y="1060" width="34" height="20" rx="6" fill="#2f6fb5"/></g>');
        PF.P("mo_bt", 652, 1160, { r: -a0 });   // v pokoji stoji zvislo (ruka je natocena o a0)
        st.bt = { v: 1 };
        R.dirty("bottle", function (tt, d) { M._lvl(1, tt, d || 0.01); });
      }
      if (mode === "show") {
        var hold = o.hold || 0.9, te = t + 0.38 + hold;
        H.arm("R", -104, t, 0.34, "back.out(1.5)"); PF.X("mo_bt", { r: 104 }, t, 0.34, "back.out(1.5)");
        PF.XY("mo_bt", { r: 90 }, t + 0.38, 0.12, "sine.inOut", 3);
        H.look(12, -3, t, 0.2);
        H.arm("R", a0, te, 0.35); PF.X("mo_bt", { r: -a0 }, te, 0.35); H.look(C().look0[0], C().look0[1], te, 0.25);
      }
      return null;
    },
    drink: function (t, to, t1, o) {       // napije sa: flasa k ustam, hlty, hladina vo flasi klesne na `to` (0-1)
      o = o || {}; var H = C().hero, p = H.p, a0 = C().arms0[1], n = o.gulps || 3, i, v0 = st.bt.v, v1 = +to;
      R.clean("slump", t - 0.36, 0.3);
      H.arm("R", 112, t, 0.34, "power2.out"); PF.X("mo_bt", { r: 0 }, t, 0.34, "power2.out");
      PF.X(p + "head", { r: -7 }, t + 0.12, 0.24, "power2.out");
      H.eyes("eyesCl", t + 0.2); H.mouth("mO", t + 0.2); H.lids(0, t + 0.2, 0.01); H.brows(-4, 4, -6, t + 0.2, 0.15);
      for (i = 0; i < n; i++) { var tg = t + 0.44 + i * 0.3;
        PF.XY(p + "head", { ty: 6 }, tg, 0.1, "sine.inOut", 1); M._lvl(v0 + (v1 - v0) * (i + 1) / n, tg, 0.24); }
      var te = t + 0.44 + n * 0.3 + 0.08;
      H.arm("R", a0, te, 0.36); PF.X("mo_bt", { r: -a0 }, te, 0.36); PF.X(p + "head", { r: 0 }, te, 0.26);
      R.setFace(te + 0.05, "happy"); R.setFace(te + 1.0, "smile"); H.look(C().look0[0], C().look0[1], te, 0.2); H.puff(te + 0.14);
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
      return "body";
    },
    meter: function (t, val, t1, o) {      // "WATER IN YOU": stlpec vlavo; prve volanie ho ukaze, dalsie menia hladinu (flash = zelena sipka: usetrene)
      o = o || {}; var u = UI(), v = Math.max(0.03, Math.min(1, +val)), dur = o.dur || 0.8, i, Y = function (q) { return (12 + 400 * (1 - q)).toFixed(1); };
      if (!st.mt) {
        u.insertAdjacentHTML("beforeend", '<div class="mo mo-left mo-meter" id="mo_mt" style="top:' + (o.y || 600) + 'px"><div class="mo-paper" id="mo_mtIn"><span class="mo-lbl">' + (o.label || "WATER<br>IN YOU") + '</span>' +
          '<svg viewBox="0 0 124 430"><defs><clipPath id="mo_mtC"><rect x="32" y="12" width="60" height="406" rx="30"/></clipPath></defs>' +
          '<rect x="32" y="12" width="60" height="406" rx="30" fill="#ffffff"/><g clip-path="url(#mo_mtC)"><rect x="32" y="290" width="60" height="130" fill="#d9483b" opacity="0.16"/>' +
          '<rect id="mo_mtW" x="32" y="' + Y(v) + '" width="60" height="440" fill="#3f9be0"/></g>' +
          '<rect x="32" y="12" width="60" height="406" rx="30" fill="none" stroke="#2b2320" stroke-width="7"/>' +
          '<path d="M100 60 h16 M100 150 h16 M100 240 h16 M100 330 h16" stroke="#2b2320" stroke-width="6" stroke-linecap="round"/>' +
          '<path id="mo_mtUp" d="M14 250 L14 190 M2 204 L14 188 L26 204" fill="none" stroke="#3fa35b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg></div></div>');
        st.mt = { v: v, red: false };
        PF.O("#mo_mt", 0, 1, t, 0.08);
        tl.fromTo("#mo_mtIn", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.32, ease: "back.out(2)", immediateRender: false }, t);
        R.dirty("meter", function (tt, d) { PF.O("#mo_mt", 1, 0, tt, d ? 0.2 : 0.01); });
        return null;
      }
      tl.fromTo("#mo_mtW", { attr: { y: Y(st.mt.v) } }, { attr: { y: Y(v) }, duration: dur, ease: o.ease || "power1.inOut", immediateRender: false }, t);
      var red = v < 0.42;
      if (red !== st.mt.red) {
        tl.fromTo("#mo_mtW", { fill: red ? "#3f9be0" : "#d9483b" }, { fill: red ? "#d9483b" : "#3f9be0", duration: 0.4, ease: "none", immediateRender: false }, t + (red ? dur * 0.55 : 0)); st.mt.red = red;
      }
      if (red) for (i = 0; i < 3; i++) { var ts = t + dur * 0.55 + i * 0.5;
        tl.fromTo("#mo_mtIn", { x: -7 }, { x: 7, duration: 0.05, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, ts); PF.S("#mo_mtIn", { x: 0 }, ts + 0.31); }
      if (o.flash) {
        PF.O("#mo_mtUp", 0, 1, t, 0.08); tl.fromTo("#mo_mtUp", { y: 26 }, { y: -16, duration: 0.5, ease: "power2.out", immediateRender: false }, t); PF.O("#mo_mtUp", 1, 0, t + 0.7, 0.2);
        tl.fromTo("#mo_mtIn", { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.05);
      }
      st.mt.v = v;
      return null;
    },
    jug: function (t, x, t1, o) {          // pot kvapka z postavy do odmerky: kym sa hodiny otocia raz (1 hodina), je v nej 1 liter
      o = o || {}; var u = UI(), g = UIS(), H = C().hero, dur = o.dur || 1.7, id = uid("mo_jg"), i, N = 9, te = Math.min(t + (o.hold || 3.4), (t1 || 1e9) - 0.2 + (o.over || 0));
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="' + id + '" style="top:' + (o.y || 620) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "SWEAT IN<br>1 HOUR") + '</span>' +
        '<svg viewBox="0 0 220 270"><defs><clipPath id="' + id + 'C"><path d="M52 96 H176 L164 258 H64 Z"/></clipPath></defs>' +
        '<circle cx="46" cy="46" r="38" fill="#ffffff" stroke="#2b2320" stroke-width="7"/><path id="' + id + 'h" d="M46 46 V20" stroke="#d9483b" stroke-width="8" stroke-linecap="round"/><circle cx="46" cy="46" r="6" fill="#2b2320"/>' +
        '<path d="M52 96 H176 L164 258 H64 Z" fill="#ffffff"/><g clip-path="url(#' + id + 'C)"><rect id="' + id + 'w" x="40" y="258" width="150" height="180" fill="#7cc4f2"/></g>' +
        '<path d="M52 96 H176 L164 258 H64 Z" fill="none" stroke="#2b2320" stroke-width="7" stroke-linejoin="round"/><path d="M175 118 h20 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-25" fill="none" stroke="#2b2320" stroke-width="7"/>' +
        '<path d="M57 128 h26" stroke="#d9483b" stroke-width="6" stroke-linecap="round"/>' +
        '<text id="' + id + 't" x="114" y="216" style="font-family:Pop;font-weight:600;font-size:64px;text-anchor:middle;fill:#2b2320" opacity="0">1 L</text></svg></div></div>');
      PF.O("#" + id, 0, 1, t, 0.08);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.fromTo("#" + id + "h", { rotation: 0, svgOrigin: "46 46" }, { rotation: 360, svgOrigin: "46 46", duration: dur, ease: "none", immediateRender: false }, t + 0.3);
      tl.fromTo("#" + id + "w", { attr: { y: 258 } }, { attr: { y: 128 }, duration: dur, ease: "none", immediateRender: false }, t + 0.3);
      PF.O("#" + id + "t", 0, 1, t + 0.3 + dur, 0.08);
      tl.fromTo("#" + id + "In", { scale: 1.15 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.3 + dur);
      R.setFace(t, "pant"); H.sweat(t, t + 1.3);
      for (i = 0; i < N; i++) {             // kvapky z hlavy (striedavo z oboch stran) obluckom do odmerky
        var did = id + "d" + i, q = scr(i % 2 ? headPt(384, 730) : headPt(702, 730)), x0 = q[0], y0 = q[1] + (i % 3) * 30, td = t + 0.1 + i * (dur / N), x1 = 928 + (i % 3 - 1) * 26, y1 = 812;
        PF.el("path", { id: did, d: "M0 -17 C 10 -3 14 4 14 10 A14 14 0 0 1 -14 10 C -14 4 -10 -3 0 -17 Z", fill: "#7cc4f2", stroke: "#ffffff", "stroke-width": 5, opacity: 0 }, g);
        PF.S("#" + did, { opacity: 1 }, td);
        tl.fromTo("#" + did, { x: x0 }, { x: x1, duration: 0.5, ease: "none", immediateRender: false }, td);
        tl.fromTo("#" + did, { y: y0 }, { y: y0 - 70, duration: 0.2, ease: "power1.out", immediateRender: false }, td);
        tl.fromTo("#" + did, { y: y0 - 70 }, { y: y1, duration: 0.3, ease: "power1.in", immediateRender: false }, td + 0.2);
        PF.S("#" + did, { opacity: 0 }, td + 0.5);
      }
      PF.O("#" + id, 1, 0, te, 0.15);
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
      return "body";
    },
    spot: function (t, what, t1, o) {      // kruzok so stitkom okolo veci postavy (flasa v ruke, hlava): pozri sem
      o = o || {}; var id = uid("mo_sp"), q = what === "head" ? headPt(540, 700) : handPt("R", 652, 1150), r = o.r || 108, col = o.color || "#d9483b",
        te = Math.min(t + (o.hold || 2.0), (t1 || 1e9) - 0.18), cx = q[0].toFixed(0), cy = q[1].toFixed(0),
        lx = Math.max(250, Math.min(830, q[0] + (o.dx || 0))).toFixed(0), ly = (q[1] + (o.below ? r + 78 : -r - 32)).toFixed(0);
      PF.add("M", '<g id="' + id + '" opacity="0"><g id="' + id + 'r"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#fbf5ea" stroke-width="20"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="10" stroke-dasharray="26 18" stroke-linecap="round"/></g>' +
        (o.text ? '<text x="' + lx + '" y="' + ly + '" style="font-family:Pop;font-weight:600;font-size:' + (o.size || 66) + 'px;text-anchor:middle;fill:' + (o.tcolor || "#a8261c") + ';stroke:#fbf5ea;stroke-width:14px;paint-order:stroke">' + o.text + '</text>' : "") + '</g>');
      PF.P(id + "r", q[0], q[1], { s: 1.7 });
      PF.O("#" + id, 0, 1, t, 0.06); PF.X(id + "r", { s: 1 }, t, 0.28, "back.out(2)"); PF.X(id + "r", { r: 50 }, t + 0.3, Math.max(0.3, te - t - 0.3), "none");
      PF.O("#" + id, 1, 0, te, 0.15);
      return "body";
    },
    choice: function (t, which, t1, o) {   // dve karty A / B hore: "A" / "B" ich vysunu, "small" zmensi na listu, "big" vrati velke, "off" skryje
      o = o || {}; var u = UI();
      if (!st.ch) {
        var card = function (L, col) { return '<div class="mo-ch" id="mo_ch' + L + '"><em style="background:' + col + '">' + L + '</em><span id="mo_ch' + L + 't"></span>' +
          '<svg class="mo-mk" id="mo_ch' + L + 'x" viewBox="0 0 100 100"><path d="M16 16 L84 84 M84 16 L16 84" fill="none" stroke="#d9483b" stroke-width="17" stroke-linecap="round"/></svg>' +
          '<svg class="mo-mk" id="mo_ch' + L + 'ok" viewBox="0 0 100 100"><path d="M12 54 L40 82 L90 20" fill="none" stroke="#3fa35b" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'; };
        u.insertAdjacentHTML("beforeend", '<div class="mo" id="mo_ch" style="top:' + (o.y || 196) + 'px"><div id="mo_chIn">' + card("A", "#c96a12") + card("B", "#3f7fbf") + '</div></div>');
        st.ch = { s: 1, y: 0, on: false };
        R.dirty("choice", function (tt, d) { if (st.ch.on) PF.O("#mo_ch", 1, 0, tt, d ? 0.2 : 0.01); st.ch.on = false; });
      }
      var show = function (tt) { if (!st.ch.on) { PF.O("#mo_ch", 0, 1, tt, 0.06); st.ch.on = true; } };
      var size = function (s, y, tt, d) { tl.fromTo("#mo_chIn", { scale: st.ch.s, y: st.ch.y }, { scale: s, y: y, duration: d, ease: "back.out(1.4)", immediateRender: false }, tt); st.ch.s = s; st.ch.y = y; };
      if (which === "A" || which === "B") {
        document.getElementById("mo_ch" + which + "t").innerHTML = o.text || which;
        show(t - 0.02); PF.O("#mo_ch" + which, 0, 1, t, 0.06);
        tl.fromTo("#mo_ch" + which, { scale: 0.3, rotation: which === "A" ? -14 : 14 }, { scale: 1, rotation: which === "A" ? -3 : 3, duration: 0.34, ease: "back.out(2.2)", immediateRender: false }, t);
        PF.punch(t + 0.1, 1.02);
      } else if (which === "small") { size(0.6, -66, t, 0.35);
      } else if (which === "big") { R.clean("step", t - 0.12, 0.12); show(t - 0.02); size(1, 0, t, 0.4); PF.punch(t + 0.22, 1.02);
      } else if (which === "off") { if (st.ch.on) { PF.O("#mo_ch", 1, 0, t, 0.15); st.ch.on = false; } }
      return null;
    },
    pick: function (t, which, t1, o) {     // oznac kartu volby: bez znacky = poklepanie (toto si mysli vacsina), mark "x" = zle (zosivie), "ok" = spravne
      o = o || {}; var c = "#mo_ch" + which, m = o.mark;
      tl.fromTo(c, { scale: 1 }, { scale: 1.14, duration: 0.14, ease: "power2.out", yoyo: true, repeat: m ? 1 : 3, immediateRender: false }, t);
      if (m) {
        PF.O(c + m, 0, 1, t + 0.1, 0.04);
        tl.fromTo(c + m, { scale: 2.6, rotation: -20 }, { scale: 1, rotation: m === "x" ? -6 : 4, duration: 0.16, ease: "power3.in", immediateRender: false }, t + 0.1);
        if (m === "x") tl.fromTo(c, { backgroundColor: "#fbf5ea", color: "#2b2320" }, { backgroundColor: "#ddd5c6", color: "#6f655b", duration: 0.25, ease: "none", immediateRender: false }, t + 0.26);
        else tl.fromTo(c, { backgroundColor: "#fbf5ea" }, { backgroundColor: "#dcf2dc", duration: 0.25, ease: "none", immediateRender: false }, t + 0.26);
        shake(t + 0.26, 0.18, 6);
      }
      return null;
    },
    cardie: function (t) {                 // auto sa zatrasie a vypusti tmavy oblak: prave zdochlo (scena desert)
      if (!document.getElementById("fd_dsCar")) return null;
      if (!PF.st.fd_dsCar) PF.P("fd_dsCar", 1000, 1400);
      PF.XY("fd_dsCar", { ty: -9, r: -0.8 }, t, 0.06, "sine.inOut", 7);
      var id = uid("mo_cx"), i, m = "";
      for (i = 0; i < 4; i++) m += '<circle id="' + id + "_" + i + '" r="' + (30 + i * 9) + '" fill="#5d5650" opacity="0" transform="translate(866 1240)"/>';
      PF.add("M", '<g id="' + id + '">' + m + '</g>');
      for (i = 0; i < 4; i++) { var s = "#" + id + "_" + i, tt = t + 0.1 + i * 0.09, x1 = 816 + i * 34, y1 = 1050 - i * 46;
        tl.fromTo(s, { attr: { transform: "translate(866 1240)" } }, { attr: { transform: "translate(" + x1 + " " + y1 + ")" }, duration: 0.9, ease: "power2.out", immediateRender: false }, tt);
        PF.O(s, 0, 0.85, tt, 0.1); PF.O(s, 0.85, 0, tt + 0.45, 0.5); }
      return null;
    },
    cover: function (t, x, t1, o) {        // zakryje sa: klobuk dopadne na hlavu, rukavy sa stiahnu po zapastie, luce sa od klobuka odrazia
      o = o || {}; var H = C().hero, p = H.p, g = UIS(), i, id = uid("mo_cv"), col = o.color || "#f4efe2";
      if (!st.cv) {
        document.getElementById(p + "head").insertAdjacentHTML("beforeend", '<g id="mo_hat" opacity="0"><ellipse cx="540" cy="672" rx="232" ry="42" fill="#e6cf96" stroke="#ffffff" stroke-width="6"/>' +
          '<path d="M410 668 C 410 586 468 548 540 548 C 612 548 670 586 670 668 Z" fill="#f3e2b3" stroke="#ffffff" stroke-width="6"/>' +
          '<path d="M412 640 C 470 664 610 664 668 640 L 669 670 C 610 694 470 694 411 670 Z" fill="#d9483b"/></g>');
        var slv = function (xx) { return '<rect class="mo_slv" x="' + xx + '" y="1016" width="56" height="0" rx="20" fill="' + col + '" stroke="' + (o.stroke || "#ffffff") + '" stroke-width="6" opacity="0"/>'; };
        (document.getElementById("mo_bt") || document.getElementById(p + "handR")).insertAdjacentHTML("beforebegin", slv(624));
        var cs = document.getElementById(p + "armL").querySelectorAll(":scope > circle");
        if (cs.length) cs[cs.length - 1].insertAdjacentHTML("beforebegin", slv(400));
        PF.P("mo_hat", 540, 672, { ty: -660, r: -24 });
        st.cv = true;
      }
      PF.O("#mo_hat", 0, 1, t, 0.05); PF.X("mo_hat", { ty: 0, r: 0 }, t, 0.4, "bounce.out");
      PF.XY(p + "head", { ty: 9 }, t + 0.16, 0.07, "sine.inOut", 1);
      tl.fromTo(".mo_slv", { attr: { height: 0 }, opacity: 1 }, { attr: { height: 124 }, opacity: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.3);
      var hp = scr(headPt(456, 578));             // miesto dopadu lucov na klobuku
      for (i = 0; i < (o.rays || 3); i++) {
        var a = id + "a" + i, b = id + "b" + i, k = id + "k" + i, tt = t + 0.75 + i * 0.27;
        PF.el("path", { id: a, d: "M0 0 L46 36", stroke: "#ffd23f", "stroke-width": 14, "stroke-linecap": "round", fill: "none", opacity: 0 }, g);
        PF.el("path", { id: b, d: "M0 0 L36 -40", stroke: "#ffd23f", "stroke-width": 12, "stroke-linecap": "round", fill: "none", opacity: 0 }, g);
        PF.el("circle", { id: k, cx: hp[0].toFixed(0), cy: hp[1].toFixed(0), r: 20, fill: "#ffffff", opacity: 0 }, g);
        PF.S("#" + a, { opacity: 1 }, tt);
        tl.fromTo("#" + a, { x: hp[0] - 236, y: hp[1] - 186 }, { x: hp[0] - 46, y: hp[1] - 36, duration: 0.2, ease: "none", immediateRender: false }, tt);
        PF.S("#" + a, { opacity: 0 }, tt + 0.2);
        tl.fromTo("#" + b, { x: hp[0], y: hp[1], opacity: 1 }, { x: hp[0] + 150, y: hp[1] - 166, opacity: 0, duration: 0.34, ease: "power1.out", immediateRender: false }, tt + 0.2);
        tl.fromTo("#" + k, { opacity: 0.95, scale: 0.5, svgOrigin: hp[0].toFixed(0) + " " + hp[1].toFixed(0) }, { opacity: 0, scale: 1.7, duration: 0.2, ease: "power1.out", immediateRender: false }, tt + 0.2);
      }
      R.dirty("cover", function (tt, d) { PF.O("#mo_hat", 1, 0, tt, d ? 0.15 : 0.01); PF.X("mo_hat", { ty: -660, r: -24 }, tt + (d ? 0.17 : 0.02), 0); PF.O(".mo_slv", 1, 0, tt, d ? 0.15 : 0.01); });
      return "body";
    },
    shade: function (t, x, t1, o) {        // tien: dve tyce vyrastu zo zeme, plachta sa medzi nimi rozvinie, postava stmavne (je v tieni)
      var H = C().hero, p = H.p;
      if (!st.sh) {
        document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_sh"><ellipse id="mo_shS" cx="540" cy="1472" rx="330" ry="30" fill="#4a1f12" opacity="0" filter="url(#soft6)"/>' +
          '<g id="mo_shP1"><rect x="291" y="352" width="18" height="1114" rx="8" fill="#8a5a3c"/></g><g id="mo_shP2"><rect x="763" y="352" width="18" height="1114" rx="8" fill="#8a5a3c"/></g>' +
          '<g id="mo_shT" filter="url(#cut)"><path d="M226 340 H846 V386 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 q-31 30 -62 0 Z" fill="#f1ead7"/><path d="M226 340 H846 V358 H226 Z" fill="#d9483b"/><path d="M288 358 V392 M412 358 V392 M536 358 V392 M660 358 V392 M784 358 V392" stroke="#d9483b" stroke-width="10" opacity="0.55"/></g></g>');
        PF.P("mo_shP1", 300, 1466, { sy: 0 }); PF.P("mo_shP2", 772, 1466, { sy: 0 }); PF.P("mo_shT", 226, 368, { sx: 0 });
        st.sh = true;
      }
      PF.X("mo_shP1", { sy: 1 }, t, 0.3, "back.out(1.4)"); PF.X("mo_shP2", { sy: 1 }, t + 0.08, 0.3, "back.out(1.4)");
      PF.X("mo_shT", { sx: 1 }, t + 0.32, 0.34, "power3.out"); shake(t + 0.64, 0.15, 5);
      PF.O("#mo_shS", 0, 0.3, t + 0.5, 0.3); H.tint("#2e2a4a", 0, 0.2, t + 0.5, 0.3);
      R.dirty("shade", function (tt, d) { var q = d ? 0.2 : 0;
        PF.X("mo_shT", { sx: 0 }, tt, q); PF.X("mo_shP1", { sy: 0 }, tt, q); PF.X("mo_shP2", { sy: 0 }, tt, q); PF.O("#mo_shS", 0.3, 0, tt, q || 0.01); H.tint("#2e2a4a", 0.2, 0, tt, q || 0.01); });
      return "body";
    },
    perch: function (t, x, t1, o) {        // prec zo zeme: rezervne koleso sa privali, postava nan vyskoci
      var H = C().hero, p = H.p;
      if (!st.pc) {
        document.getElementById(p + "float").insertAdjacentHTML("beforebegin", '<g id="mo_ty" opacity="0"><g filter="url(#cut)"><path d="M400 1428 V1450 A140 20 0 0 0 680 1450 V1428 Z" fill="#2b2320"/><ellipse cx="540" cy="1428" rx="140" ry="20" fill="#3d3530"/><ellipse cx="540" cy="1428" rx="78" ry="10" fill="#1d1a18"/>' +
          '<path d="M418 1446 v14 M452 1454 v13 M492 1459 v12 M540 1461 v12 M588 1459 v12 M628 1454 v13 M662 1446 v14" stroke="#5a4e44" stroke-width="7" stroke-linecap="round"/></g></g>');
        PF.P("mo_ty", 540, 1442, { tx: 640 });
        st.pc = true;
      }
      PF.O("#mo_ty", 0, 1, t, 0.04); PF.X("mo_ty", { tx: 0 }, t + 0.02, 0.4, "power3.out");
      H.shadow(false, t + 0.12); H.move(0, -112, 0, t + 0.12, 0.22, "power2.out"); H.move(0, -42, 0, t + 0.36, 0.16, "power2.in"); shake(t + 0.52, 0.15, 6);
      PF.XY(p + "up", { sy: 0.96 }, t + 0.52, 0.08, "sine.inOut", 1);
      R.dirty("perch", function (tt, d) { var q = d ? 0.2 : 0;
        H.move(0, 0, 0, tt, q); PF.O("#mo_ty", 1, 0, tt, q || 0.01); PF.X("mo_ty", { tx: 640 }, tt + q + 0.02, 0); H.shadow(true, tt + q); });
      return "body";
    },
    thermo: function (t, x, t1, o) {       // dva teplomery: piesok je ovela horucejsi nez vzduch (bez cisel)
      o = o || {}; var u = UI(), id = uid("mo_th"), te = Math.min(t + (o.hold || 3.0), (t1 || 1e9) - 0.2 + (o.over || 0));
      var th = function (xx, k, lbl) { return '<rect x="' + (xx - 16) + '" y="14" width="32" height="176" rx="16" fill="#ffffff" stroke="#2b2320" stroke-width="7"/>' +
        '<rect id="' + id + k + '" x="' + (xx - 7) + '" y="184" width="14" height="10" rx="6" fill="#d9483b"/><circle cx="' + xx + '" cy="204" r="26" fill="#d9483b" stroke="#2b2320" stroke-width="7"/>' +
        '<text x="' + xx + '" y="266" style="font-family:Hand;font-weight:700;font-size:34px;text-anchor:middle;fill:#2b2320;letter-spacing:2px">' + lbl + '</text>'; };
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="' + id + '" style="top:' + (o.y || 620) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "HOW HOT") + '</span>' +
        '<svg viewBox="0 0 220 270">' + th(62, "a", "SAND") + th(158, "b", "AIR") + '</svg></div></div>');
      PF.O("#" + id, 0, 1, t, 0.08);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      [["a", 30], ["b", 118]].forEach(function (q, i) {
        tl.fromTo("#" + id + q[0], { attr: { y: 184, height: 10 } }, { attr: { y: q[1], height: 194 - q[1] }, duration: 0.9, ease: "power2.out", immediateRender: false }, t + 0.25 + i * 0.12); });
      tl.fromTo("#" + id + "In", { x: -6 }, { x: 6, duration: 0.05, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t + 1.15); PF.S("#" + id + "In", { x: 0 }, t + 1.46);
      PF.O("#" + id, 1, 0, te, 0.15);
      return null;
    },
    hail: function (t, x, t1, o) {         // mava lavou rukou nad hlavou (prava drzi flasu)
      var H = C().hero, n = (o && o.n) || 5;
      if (o && o.face) { R.setFace(t, o.face); R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); }); }
      H.arm("L", 150, t, 0.25, "back.out(1.6)"); H.armWave("L", 122, t + 0.26, 0.15, n); H.arm("L", C().arms0[0], t + 0.3 + 0.15 * (n + 1), 0.3);
      return "body";
    },
    aerial: function (t, x, t1, o) {       // pohlad z lietadla: auto je velke a leskne sa, clovek o kus dalej je len bodka
      o = o || {}; var u = UI(), H = C().hero, id = uid("mo_ae"), te = Math.min(t + (o.hold || 3.6), (t1 || 1e9) - 0.2 + (o.over || 0)), i, ft = "", tq = t + (o.q || 1.5);
      for (i = 0; i < 6; i++) ft += '<circle cx="' + (122 - i * 14) + '" cy="' + (156 + i * 15) + '" r="3.5"/>';
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="' + id + '" style="top:' + (o.y || 620) + 'px"><div class="mo-paper" id="' + id + 'In"><span class="mo-lbl">' + (o.label || "FROM THE AIR") + '</span>' +
        '<svg viewBox="0 0 220 270"><defs><clipPath id="' + id + 'C"><rect x="4" y="4" width="212" height="262" rx="18"/></clipPath></defs><g clip-path="url(#' + id + 'C)">' +
        '<rect width="220" height="270" fill="#e9c98b"/><path d="M-10 60 q60 -26 120 0 t120 0 M-10 214 q60 -26 120 0 t120 0 M-10 134 q50 -18 100 0" fill="none" stroke="#d2ab66" stroke-width="7" stroke-linecap="round"/>' +
        '<g fill="#b98f52">' + ft + '</g><circle cx="40" cy="244" r="6" fill="#2b2320"/>' +
        '<text id="' + id + 'q" x="66" y="258" style="font-family:Pop;font-weight:600;font-size:46px;text-anchor:middle;fill:#d9483b" opacity="0">?</text>' +
        '<g transform="rotate(-24 142 124)"><rect x="100" y="103" width="84" height="42" rx="12" fill="#2f8f8a" stroke="#ffffff" stroke-width="4"/><rect x="118" y="109" width="20" height="30" rx="5" fill="#cfeaf2"/><rect x="150" y="109" width="14" height="30" rx="5" fill="#cfeaf2"/></g>' +
        '<circle id="' + id + 'p" cx="142" cy="124" r="30" fill="none" stroke="#d9483b" stroke-width="8" opacity="0"/>' +
        '<path id="' + id + 'g" d="M172 84 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 Z" fill="#ffffff" opacity="0"/>' +
        '<g id="' + id + 'pl"><ellipse cx="6" cy="24" rx="30" ry="7" fill="#4a1f12" opacity="0.22"/><path d="M-4 -3 L-22 -30 L-8 -30 L12 -3 Z M-4 3 L-22 30 L-8 30 L12 3 Z M-30 -3 L-40 -17 L-31 -17 L-22 -3 Z" fill="#f4f1e8" stroke="#55606c" stroke-width="4" stroke-linejoin="round"/>' +
        '<ellipse rx="34" ry="8" fill="#f4f1e8" stroke="#55606c" stroke-width="4"/></g>' +
        '</g><rect x="4" y="4" width="212" height="262" rx="18" fill="none" stroke="#2b2320" stroke-width="7"/></svg></div></div>');
      PF.O("#" + id, 0, 1, t, 0.08);
      tl.fromTo("#" + id + "In", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.fromTo("#" + id + "pl", { x: -50, y: 250, rotation: -34, svgOrigin: "0 0" }, { x: 280, y: 26, rotation: -34, svgOrigin: "0 0", duration: 1.6, ease: "none", immediateRender: false }, t + 0.2);
      tl.fromTo("#" + id + "g", { opacity: 0, scale: 0.4, svgOrigin: "172 104" }, { opacity: 1, scale: 1.3, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 5, immediateRender: false }, t + 0.7);
      tl.fromTo("#" + id + "p", { attr: { r: 30 }, opacity: 0.95 }, { attr: { r: 96 }, opacity: 0, duration: 0.6, ease: "power1.out", repeat: 2, immediateRender: false }, t + 0.95);
      PF.O("#" + id + "q", 0, 1, tq, 0.08);
      tl.fromTo("#" + id + "q", { scale: 0.3, svgOrigin: "66 244" }, { scale: 1, duration: 0.3, ease: "back.out(2.4)", immediateRender: false }, tq);
      H.look(8, -12, t + 0.2, 0.2); M.hail(t + 0.35, null, t1, { n: 5 });
      R.dirty("look", function (tt, d) { H.look(C().look0[0], C().look0[1], tt, d ? 0.25 : 0); });
      PF.O("#" + id, 1, 0, te, 0.15);
      return "body";
    },
    // ---------- had a jed (035 Bitten By A Snake): had v trave, uhryznutie, detail ruky, "ako vo filme", skumavky, pocitadlo, jed v ramene, satka, odvoz, protijed
    snake: function (t, mode, t1, o) {     // had vlavo v trave (je tam od prveho snimku, kyva sa); "strike" = vyrazi na lavu ruku, uhryzne a zmizne; "back" = koniec: vsetko zmizne, had je spat
      o = o || {}; var H = C().hero, p = H.p, a0 = C().arms0[0];
      if (!st.sn) {
        var q = handPt("L", 428, 1160), bx = q[0] - 215, by = 1448, HX = 111, HY = q[1] - 4 - by, K = -HY;
        var d = "M20 -56 C 130 " + (-0.36 * K).toFixed(0) + " -90 " + (-0.6 * K).toFixed(0) + " -6 " + (-0.8 * K).toFixed(0) + " S " + (HX - 74) + " " + (HY - 34).toFixed(0) + " " + HX + " " + HY.toFixed(0);
        PF.add("M", '<g id="mo_sn"><g transform="translate(' + bx.toFixed(0) + ' ' + by + ')" filter="url(#cut)">' +
          '<ellipse cx="0" cy="-20" rx="96" ry="25" fill="#3d7d31"/><ellipse cx="-4" cy="-46" rx="72" ry="23" fill="#5aa646"/>' +
          '<path d="' + d + '" fill="none" stroke="#5aa646" stroke-width="46" stroke-linecap="round"/>' +
          '<path d="' + d + '" fill="none" stroke="#3d7d31" stroke-width="46" stroke-dasharray="12 38" stroke-dashoffset="-20"/>' +
          '<g transform="translate(' + HX + ' ' + HY.toFixed(0) + ') rotate(18)"><ellipse cx="20" cy="0" rx="46" ry="29" fill="#5aa646"/>' +
          '<path id="mo_snT" d="M62 6 l30 2 l14 -9 m-14 9 l14 9" fill="none" stroke="#d9483b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<circle cx="30" cy="-10" r="10" fill="#ffe07a"/><ellipse cx="31" cy="-10" rx="3.5" ry="8" fill="#2b2320"/></g></g></g>');
        PF.P("mo_sn", bx, by);
        var hc = document.getElementById(p + "armL").querySelectorAll(":scope > circle"); hc = hc[hc.length - 1]; hc.id = "mo_hL";
        hc.insertAdjacentHTML("afterend", '<g id="mo_bite" opacity="0"><circle id="mo_biteP" cx="428" cy="1160" r="33" fill="none" stroke="#d9483b" stroke-width="8" opacity="0"/>' +
          '<circle cx="417" cy="1157" r="5.5" fill="#8f1d14"/><circle cx="437" cy="1152" r="5.5" fill="#8f1d14"/></g>');
        st.sn = { fill: hc.getAttribute("fill"), stroke: hc.getAttribute("stroke"), big: false };
      }
      if (mode === "strike") {
        PF.X("mo_sn", { r: -9 }, t - 0.2, 0.14, "power2.out"); PF.X("mo_sn", { r: 21, tx: 30, ty: -34 }, t - 0.05, 0.08, "power3.in");
        PF.X("mo_sn", { r: 0, tx: 0, ty: 0 }, t + 0.14, 0.2, "power2.out");
        PF.X("mo_sn", { sy: 0.32, r: -6 }, t + 0.5, 0.22, "power2.in"); PF.X("mo_sn", { tx: -620 }, t + 0.68, 0.55, "power1.in"); PF.O("#mo_sn", 1, 0, t + 1.2, 0.06);
        R.setFace(t, "pain"); R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
        H.arm("L", a0 - 46, t + 0.05, 0.13, "back.out(3)"); H.arm("L", a0, t + 0.95, 0.4); R.setFace(t + 1.2, C().face0);
        PF.XY(p + "float", { ty: -24 }, t + 0.04, 0.11, "power2.out", 1);
        shake(t, 0.3, 12); UI();
        tl.fromTo("#mo_flash", { opacity: 0.5, backgroundColor: "#d9483b" }, { opacity: 0, backgroundColor: "#d9483b", duration: 0.35, ease: "power1.out", immediateRender: false }, t);
        tl.set("#mo_flash", { backgroundColor: "#ffffff" }, t + 0.4);
        PF.O("#mo_bite", 0, 1, t + 0.02, 0.01);
        tl.fromTo("#mo_biteP", { attr: { r: 33 }, opacity: 0.95 }, { attr: { r: 90 }, opacity: 0, duration: 0.5, ease: "power1.out", repeat: 3, immediateRender: false }, t + 0.05);
        R.dirty("snake", function (tt, d) { PF.X("mo_sn", { ty: 0, r: 0, sy: 1 }, tt, 0); PF.O("#mo_sn", 0, 1, tt, 0.01); PF.X("mo_sn", { tx: 0 }, tt + 0.01, d || 0, "power2.out"); });
        R.dirty("bite", function (tt, d) { PF.O("#mo_bite", 1, 0, tt, d || 0.01);
          if (st.sn.big) { tl.fromTo("#mo_hL", { attr: { r: 45 }, fill: "#ea9c86" }, { attr: { r: 33 }, fill: st.sn.fill, duration: d || 0.01, ease: "none", immediateRender: false }, tt); st.sn.big = false; } });
        return "body";
      }
      if (mode === "back") {
        ["sling", "ride", "venom", "antivenom", "hand", "step", "bite"].forEach(function (k) { R.clean(k, t, 0.3); });
        R.clean("snake", t + 0.1, 0.4); H.look(-12, 6, t + 0.2, 0.2);
        return "body";
      }
      PF.XY("mo_sn", { r: 4 }, t, 0.16, "sine.inOut", 3);
      tl.fromTo("#mo_snT", { opacity: 1 }, { opacity: 0, duration: 0.07, ease: "none", yoyo: true, repeat: 5, repeatDelay: 0.06, immediateRender: false }, t + 0.08);
      return null;
    },
    hand: function (t, mode, t1, o) {      // detail uhryznutej ruky v okienku vlavo: "show" ukaze (2 ranky, prsten, hodinky), "swell" opuchne, "ring" / "watch" ich da dole, "off" skryje
      o = o || {}; var u = UI(), i;
      if (!st.hd) {
        var sk = (st.sn && st.sn.fill) || "#f1c9a5", skd = (st.sn && st.sn.stroke) || "#dca87f", fin = "", FX = [112, 158, 204, 250], FH = [88, 114, 120, 98];
        for (i = 0; i < 4; i++) fin += '<rect class="mo_hdS mo_hdF" x="' + FX[i] + '" y="' + (184 - FH[i]) + '" width="38" height="' + (FH[i] + 40) + '" rx="19" fill="' + sk + '" stroke="' + skd + '" stroke-width="6"/>';
        u.insertAdjacentHTML("beforeend", '<div class="mo mo-left" id="mo_hd" style="top:' + (o.y || 540) + 'px;padding-left:16px"><div id="mo_hdIn" style="width:340px;height:340px;border-radius:50%;overflow:hidden;border:14px solid var(--paper);box-shadow:0 9px 0 rgba(90,42,26,.25)">' +
          '<svg viewBox="0 0 400 400" style="position:static;width:340px;height:340px;display:block"><rect width="400" height="400" fill="#bfe3b2"/>' +
          '<rect class="mo_hdS" x="150" y="300" width="100" height="130" rx="30" fill="' + sk + '" stroke="' + skd + '" stroke-width="6"/>' + fin +
          '<rect class="mo_hdS" x="270" y="206" width="40" height="104" rx="20" fill="' + sk + '" stroke="' + skd + '" stroke-width="6" transform="rotate(-34 290 300)"/>' +
          '<rect class="mo_hdS" id="mo_hdP" x="106" y="166" width="188" height="170" rx="58" fill="' + sk + '" stroke="' + skd + '" stroke-width="6"/>' +
          '<circle id="mo_hdH" cx="190" cy="246" r="34" fill="#d9483b" opacity="0.3"/><circle cx="176" cy="250" r="7.5" fill="#8f1d14"/><circle cx="206" cy="243" r="7.5" fill="#8f1d14"/>' +
          '<g id="mo_hdR"><rect x="200" y="112" width="46" height="18" rx="7" fill="#f2c230" stroke="#b98a12" stroke-width="4"/><circle cx="223" cy="110" r="9" fill="#7fd0f5" stroke="#ffffff" stroke-width="3"/></g>' +
          '<g id="mo_hdW"><rect x="142" y="318" width="116" height="36" rx="9" fill="#2b2320"/><circle cx="200" cy="336" r="27" fill="#ffffff" stroke="#2b2320" stroke-width="7"/>' +
          '<path d="M200 336 V320 M200 336 H212" fill="none" stroke="#2b2320" stroke-width="5" stroke-linecap="round"/></g></svg></div></div>');
        st.hd = { on: false, big: false, sk: sk };
      }
      if (mode === "show") {
        if (!st.hd.on) {
          PF.O("#mo_hd", 0, 1, t, 0.08); tl.fromTo("#mo_hdIn", { scale: 0.3, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.32, ease: "back.out(2)", immediateRender: false }, t); st.hd.on = true;
          R.dirty("hand", function (tt, d) { if (st.hd.on) PF.O("#mo_hd", 1, 0, tt, d ? 0.15 : 0.01); st.hd.on = false; });
        }
        else tl.fromTo("#mo_hdIn", { scale: 1 }, { scale: 1.1, duration: 0.16, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t);
        tl.fromTo("#mo_hdH", { attr: { r: 26 }, opacity: 0.5 }, { attr: { r: st.hd.big ? 74 : 50 }, opacity: 0.12, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.2);
      } else if (mode === "swell") {
        var d = o.dur || 1.0;
        tl.fromTo(".mo_hdF", { attr: { width: 38, rx: 19 }, x: 0 }, { attr: { width: 54, rx: 25 }, x: -8, duration: d, ease: "power1.inOut", stagger: 0.07, immediateRender: false }, t);
        tl.fromTo("#mo_hdP", { attr: { x: 106, y: 166, width: 188, height: 170 } }, { attr: { x: 96, y: 158, width: 208, height: 186 }, duration: d, ease: "power1.inOut", immediateRender: false }, t);
        tl.fromTo(".mo_hdS", { fill: st.hd.sk }, { fill: "#eb9f88", duration: d, ease: "none", immediateRender: false }, t);
        tl.fromTo("#mo_hdH", { attr: { r: 30 }, opacity: 0.5 }, { attr: { r: 80 }, opacity: 0.2, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t);
        tl.fromTo("#mo_hdIn", { scale: 1 }, { scale: 1.06, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t + 0.1);
        if (st.sn) { tl.fromTo("#mo_hL", { attr: { r: 33 }, fill: st.sn.fill }, { attr: { r: 45 }, fill: "#ea9c86", duration: d, ease: "power1.inOut", immediateRender: false }, t); st.sn.big = true; }
        st.hd.big = true;
      } else if (mode === "ring") {
        tl.fromTo("#mo_hdR", { x: -5 }, { x: 5, duration: 0.06, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t);
        tl.fromTo("#mo_hdR", { x: 0, y: 0, rotation: 0, opacity: 1 }, { x: 70, y: -190, rotation: 60, opacity: 0, duration: 0.42, ease: "power2.in", svgOrigin: "223 121", immediateRender: false }, t + 0.38);
      } else if (mode === "watch") {
        tl.fromTo("#mo_hdW", { x: -5 }, { x: 5, duration: 0.06, ease: "none", yoyo: true, repeat: 3, immediateRender: false }, t);
        tl.fromTo("#mo_hdW", { x: 0, y: 0, rotation: 0, opacity: 1 }, { x: -240, y: 30, rotation: -70, opacity: 0, duration: 0.42, ease: "power2.in", svgOrigin: "200 336", immediateRender: false }, t + 0.26);
      } else if (mode === "off") { if (st.hd.on) { PF.O("#mo_hd", 1, 0, t, 0.15); st.hd.on = false; } }
      return null;
    },
    movie: function (t, x, t1, o) {        // "ako vo filme": stary film cez cely obraz (tmavy ram, sepia, skrabance) + klapka vlavo dole; do konca vety
      o = o || {}; var u = UI(), id = uid("mo_mv"), te = Math.min(t + (o.hold || 4), (t1 || 1e9) - 0.1), i, h, str = "", W = 'position:absolute;left:0;top:0;width:1080px;height:1920px;';
      for (i = 0; i < 5; i++) str += '<path d="M' + (34 + i * 38) + ' 34 h20 l-14 34 h-20 Z" fill="#fbf5ea"/>';
      h = '<div id="' + id + '" style="' + W + 'opacity:0"><div id="' + id + 'p" style="' + W + 'background:rgba(120,78,28,.32)"></div>' +
        '<div style="' + W + 'box-sizing:border-box;border:30px solid #17110d;box-shadow:inset 0 0 240px 70px rgba(23,17,13,.7)"></div>';
      for (i = 0; i < 3; i++) h += '<div id="' + id + 's' + i + '" style="position:absolute;top:0;width:4px;height:1920px;background:rgba(255,246,225,.55);left:' + [214, 652, 903][i] + 'px;opacity:0"></div>';
      h += '<svg viewBox="0 0 220 190" style="position:absolute;left:' + (o.x || 50) + 'px;top:' + (o.y || 1150) + 'px;width:240px;height:207px;overflow:visible">' +
        '<rect x="10" y="70" width="200" height="112" rx="10" fill="#2b2320" stroke="#fbf5ea" stroke-width="6"/>' +
        '<text x="110" y="144" style="font-family:Pop;font-weight:600;font-size:46px;text-anchor:middle;fill:#fbf5ea">MOVIE</text>' +
        '<g id="' + id + 'a"><rect x="10" y="34" width="200" height="34" rx="6" fill="#2b2320" stroke="#fbf5ea" stroke-width="6"/>' + str + '</g></svg></div>';
      u.insertAdjacentHTML("beforeend", h);
      PF.O("#" + id, 0, 1, t, 0.1);
      tl.fromTo("#" + id + "p", { opacity: 0.65 }, { opacity: 1, duration: 0.07, ease: "none", yoyo: true, repeat: 2 * Math.max(1, Math.round((te - t) / 0.14)) - 1, immediateRender: false }, t);
      tl.fromTo("#" + id + "a", { rotation: -32, svgOrigin: "14 68" }, { rotation: 0, duration: 0.1, ease: "power3.in", immediateRender: false }, t + 0.26);
      for (i = 0; i < 7; i++) { var s = "#" + id + "s" + (i % 3), ts = t + 0.15 + i * 0.37; if (ts < te - 0.1) { PF.S(s, { opacity: 1 }, ts); PF.S(s, { opacity: 0 }, ts + 0.08); } }
      PF.O("#" + id, 1, 0, te, 0.12);
      return null;
    },
    suck: function (t, x, t1, o) {         // priklada ranu k ustam a saje (filmovy trik), potom odpluje zelene kvapky
      o = o || {}; var H = C().hero, p = H.p, a0 = C().arms0[0], g = UIS(), i, n = 3, te = Math.min(t + (o.hold || 1.9), (t1 || 1e9) - 0.3), id = uid("mo_sk");
      H.arm("L", -112, t, 0.3, "back.out(1.4)"); PF.X(p + "head", { r: 6 }, t + 0.1, 0.22, "power2.out");
      H.eyes("eyesCl", t + 0.2); H.mouth("mO", t + 0.2); H.lids(0, t + 0.2, 0.01); H.brows(8, -8, 2, t + 0.2, 0.15);
      for (i = 0; i < n; i++) if (t + 0.42 + i * 0.3 < te - 0.4) PF.XY(p + "head", { ty: 7 }, t + 0.42 + i * 0.3, 0.12, "sine.inOut", 1);
      H.arm("L", a0, te - 0.36, 0.34);
      for (i = 0; i < 3; i++) {
        var did = id + "d" + i, q = scr(headPt(486, 878)), td = te - 0.3 + i * 0.07;
        PF.el("path", { id: did, d: "M0 -15 C 9 -3 12 4 12 9 A12 12 0 0 1 -12 9 C -12 4 -9 -3 0 -15 Z", fill: "#7ed957", stroke: "#ffffff", "stroke-width": 5, opacity: 0 }, g);
        PF.S("#" + did, { opacity: 1 }, td);
        tl.fromTo("#" + did, { x: q[0] }, { x: q[0] - 210 - i * 36, duration: 0.5, ease: "none", immediateRender: false }, td);
        tl.fromTo("#" + did, { y: q[1] }, { y: q[1] - 50, duration: 0.18, ease: "power1.out", immediateRender: false }, td);
        tl.fromTo("#" + did, { y: q[1] - 50 }, { y: q[1] + 250, duration: 0.32, ease: "power1.in", immediateRender: false }, td + 0.18);
        PF.S("#" + did, { opacity: 0 }, td + 0.5);
      }
      PF.X(p + "head", { r: 0 }, te - 0.1, 0.25); R.setFace(te - 0.3, "sick");
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
      return "body";
    },
    vial: function (t, mode, t1, o) {      // pokus v labaku vpravo: skumavka s jedom a skumavka s tym, co sa podarilo odsat (skoro nic); "pct" = buchne "<1%"
      o = o || {}; var u = UI();
      if (mode === "pct") {
        if (!st.vl) return null;
        PF.O("#mo_vlT", 0, 1, t, 0.04); tl.fromTo("#mo_vlT", { scale: 2.4, rotation: -8, svgOrigin: "110 128" }, { scale: 1, rotation: -8, duration: 0.16, ease: "power3.in", immediateRender: false }, t);
        PF.O("#mo_vlG", 1, 0.3, t, 0.15);
        tl.fromTo("#mo_vlIn", { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.16); shake(t + 0.16, 0.18, 6);
        return null;
      }
      var tube = function (x) { return "M" + x + " 24 V196 a30 30 0 0 0 60 0 V24"; }, te = (t1 || 1e9) - 0.15;
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="mo_vl" style="top:' + (o.y || 600) + 'px"><div class="mo-paper" id="mo_vlIn"><span class="mo-lbl">' + (o.label || "LAB TEST") + '</span>' +
        '<svg viewBox="0 0 220 270"><g id="mo_vlG"><defs><clipPath id="mo_vlA"><path d="' + tube(22) + ' Z"/></clipPath><clipPath id="mo_vlB"><path d="' + tube(138) + ' Z"/></clipPath></defs>' +
        '<path d="' + tube(22) + ' Z" fill="#ffffff"/><path d="' + tube(138) + ' Z" fill="#ffffff"/>' +
        '<g clip-path="url(#mo_vlA)"><rect id="mo_vlWa" x="16" y="60" width="72" height="180" fill="#58c234"/></g><g clip-path="url(#mo_vlB)"><rect id="mo_vlWb" x="132" y="228" width="72" height="20" fill="#58c234"/></g>' +
        '<path d="' + tube(22) + '" fill="none" stroke="#2b2320" stroke-width="7" stroke-linecap="round"/><path d="' + tube(138) + '" fill="none" stroke="#2b2320" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M96 110 h30 m-11 -11 l11 11 l-11 11" fill="none" stroke="#2b2320" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle id="mo_vlD" cx="52" cy="44" r="8" fill="#58c234" stroke="#ffffff" stroke-width="3" opacity="0"/></g>' +
        '<text x="52" y="264" style="font-family:Hand;font-weight:700;font-size:28px;text-anchor:middle;fill:#2b2320">VENOM</text><text x="168" y="264" style="font-family:Hand;font-weight:700;font-size:28px;text-anchor:middle;fill:#2b2320">OUT</text>' +
        '<text id="mo_vlT" x="110" y="158" style="font-family:Pop;font-weight:600;font-size:92px;text-anchor:middle;fill:#a8261c;stroke:#fbf5ea;stroke-width:14px;paint-order:stroke" opacity="0">&lt;1%</text></svg></div></div>');
      st.vl = true;
      PF.O("#mo_vl", 0, 1, t, 0.08); tl.fromTo("#mo_vlIn", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      PF.S("#mo_vlD", { opacity: 1 }, t + 0.45);
      tl.fromTo("#mo_vlD", { attr: { cx: 52 } }, { attr: { cx: 168 }, duration: 0.4, ease: "none", immediateRender: false }, t + 0.45);
      tl.fromTo("#mo_vlD", { attr: { cy: 44 } }, { attr: { cy: 10 }, duration: 0.2, ease: "power1.out", immediateRender: false }, t + 0.45);
      tl.fromTo("#mo_vlD", { attr: { cy: 10 } }, { attr: { cy: 222 }, duration: 0.3, ease: "power1.in", immediateRender: false }, t + 0.65);
      PF.S("#mo_vlD", { opacity: 0 }, t + 0.95);
      tl.fromTo("#mo_vlWb", { attr: { y: 228 } }, { attr: { y: 221 }, duration: 0.15, ease: "none", immediateRender: false }, t + 0.93);
      tl.fromTo("#mo_vlWa", { attr: { y: 60 } }, { attr: { y: 63 }, duration: 0.3, ease: "none", immediateRender: false }, t + 0.45);
      PF.O("#mo_vl", 1, 0, te, 0.15);
      R.dirty("vial", function (tt, d) { PF.S("#mo_vl", { opacity: 0 }, tt); });
      return null;
    },
    count: function (t, num, t1, o) {      // velke cislo, ktore vybehne z nuly (karta hore v strede); zmizne s koncom vety
      o = o || {}; var u = UI(), id = uid("mo_ct"), dur = o.dur || 2.3, i, N = Math.max(2, Math.round(dur * 30)), n = +num, te = Math.min(t + (o.hold || 9), (t1 || 1e9) - 0.12);
      var f = function (v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/\d/g, "<i>$&</i>"); };
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-timer" id="' + id + '" style="top:' + (o.y || 280) + 'px"><div class="mo-paper" id="' + id + 'In" style="padding:18px 44px 14px"><span class="mo-lbl">' + (o.label || "UP TO") + '</span>' +
        '<span class="mo-dig" id="' + id + 'D" style="font-size:' + (o.size || 128) + 'px;color:#a8261c">' + f(0) + '</span><span class="mo-lbl" style="color:#a8261c">' + (o.sub || "") + '</span></div></div>');
      PF.O("#" + id, 0, 1, t, 0.08); tl.fromTo("#" + id + "In", { scale: 0.4, rotation: -6 }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      for (i = 1; i <= N; i++) { var k = i / N, e = 1 - Math.pow(1 - k, 2.2); tl.set("#" + id + "D", { innerHTML: f(i === N ? n : Math.round(n * e / 100) * 100) }, t + 0.15 + dur * k); }
      tl.fromTo("#" + id + "In", { scale: 1.16 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.15 + dur); shake(t + 0.15 + dur, 0.22, 8);
      PF.O("#" + id, 1, 0, te, 0.15);
      return null;
    },
    _vn: function (v, t, d) {              // postup jedu 0-1: 0-0.6 rameno (od ruky po plece), 0.6-1 hrud
      var a = st.vn.v, off = function (q) { return [100 - Math.min(1, q / 0.6) * 100, 100 - Math.max(0, (q - 0.6) / 0.4) * 100]; }, A = off(a), B = off(v), up = v >= a;
      var sh = Math.abs(Math.min(v, 0.6) - Math.min(a, 0.6)) / (Math.abs(v - a) || 1), da = d * sh, dt = d - da;
      if (da > 0) tl.fromTo(".mo_vnA", { attr: { "stroke-dashoffset": A[0] } }, { attr: { "stroke-dashoffset": B[0] }, duration: da, ease: "none", immediateRender: false }, up ? t : t + dt);
      if (dt > 0) tl.fromTo(".mo_vnT", { attr: { "stroke-dashoffset": A[1] } }, { attr: { "stroke-dashoffset": B[1] }, duration: dt, ease: "none", immediateRender: false }, up ? t + da : t);
      st.vn.v = v;
    },
    venom: function (t, mode, t1, o) {     // jed v lymfe: zelena stopa z ruky hore ramenom k hrudi. "move" = postava bezi a stopa rychlo stupa; "still" = stoji a stopa stoji; "back" = ustupi
      o = o || {}; var H = C().hero, p = H.p, a0 = C().arms0;
      if (!st.vn) {
        var seg = function (c, d) { return '<path class="' + c + '" d="' + d + '" fill="none" stroke="#eaffd8" stroke-width="30" opacity="0.65" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/>' +
          '<path class="' + c + '" d="' + d + '" fill="none" stroke="#4fbf2a" stroke-width="15" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/>'; };
        PF.add(p + "armL", '<g class="mo_vnG" opacity="0">' + seg("mo_vnA", "M428 1136 V958") + '</g>');
        PF.add(p + "up", '<g class="mo_vnG" opacity="0">' + seg("mo_vnT", "M430 958 C 452 992 520 978 582 994") +
          '<g transform="translate(604 1000) scale(0.82)"><path id="mo_vnH" d="M0 22 C -46 -12 -22 -46 0 -22 C 22 -46 46 -12 0 22 Z" fill="#d9483b" stroke="#ffffff" stroke-width="5" opacity="0"/></g></g>');
        st.vn = { v: 0, on: false };
      }
      if (!st.vn.on && mode !== "back") {
        PF.O(".mo_vnG", 0, 1, t, 0.1); st.vn.on = true;
        R.dirty("venom", function (tt, d) { PF.O(".mo_vnG", 1, 0, tt, d ? 0.2 : 0.01); PF.S(".mo_vnA,.mo_vnT", { attr: { "stroke-dashoffset": 100 } }, tt + 0.25); PF.S("#mo_vnH", { opacity: 0 }, tt + 0.25);
          if (st.vn.pause) PF.O("#mo_vnP", 1, 0, tt, d ? 0.15 : 0.01); st.vn.on = false; st.vn.v = 0; st.vn.pause = false; });
      }
      if (mode === "move") {
        var dur = Math.max(0.8, Math.min(o.dur || 1.6, (t1 || 1e9) - t - 0.45));
        M._vn(0.14, t, 0.18); M._vn(o.to || 0.9, t + 0.2, dur);
        R.setFace(t, "shocked"); H.run(t + 0.05, t + 0.15 + dur, 0.3, a0[0], a0[1]);
        PF.O("#mo_vnH", 0, 1, t + 0.2 + dur * 0.62, 0.12);
        tl.fromTo("#mo_vnH", { scale: 1, svgOrigin: "0 0" }, { scale: 1.45, duration: 0.14, ease: "sine.inOut", yoyo: true, repeat: 7, immediateRender: false }, t + 0.2 + dur * 0.62);
        R.setFace(t + 0.3 + dur, "worried"); R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
        return "body";
      }
      if (mode === "still") {
        if (!document.getElementById("mo_vnP")) { var q = pt(540, 1150);
          PF.add("M", '<g id="mo_vnP" opacity="0"><circle cx="' + (q[0] + 250).toFixed(0) + '" cy="' + (q[1] - 150).toFixed(0) + '" r="62" fill="#fbf5ea" stroke="#2b2320" stroke-width="9"/>' +
            '<path d="M' + (q[0] + 232).toFixed(0) + " " + (q[1] - 178).toFixed(0) + ' v56 M' + (q[0] + 268).toFixed(0) + " " + (q[1] - 178).toFixed(0) + ' v56" stroke="#2b2320" stroke-width="18" stroke-linecap="round"/></g>');
          PF.P("mo_vnP", q[0] + 250, q[1] - 150, { s: 0.3 }); }
        PF.O("#mo_vnP", 0, 1, t, 0.06); PF.X("mo_vnP", { s: 1 }, t, 0.3, "back.out(2.2)"); st.vn.pause = true;
        tl.fromTo(".mo_vnG", { opacity: 1 }, { opacity: 0.55, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t + 0.1);
        return "body";
      }
      if (mode === "back" && st.vn.on) {
        M._vn(0, t, o.dur || 0.9); PF.O("#mo_vnH", 1, 0, t + 0.3, 0.2);
        if (st.vn.pause) { PF.O("#mo_vnP", 1, 0, t, 0.15); PF.X("mo_vnP", { s: 0.3 }, t + 0.2, 0); st.vn.pause = false; }
      }
      return null;
    },
    sling: function (t, x, t1, o) {        // ruka do satky cez hrud: znehybnena, v pohodlnej polohe
      var H = C().hero, p = H.p;
      if (!st.sl) {
        PF.add(p + "up", '<g id="mo_sl" opacity="0"><path d="M506 966 L 436 1040 M 576 966 L 628 1056" fill="none" stroke="#f4efe2" stroke-width="15" stroke-linecap="round"/>' +
          '<path d="M408 1030 L 640 1054 L 622 1150 Q 520 1176 436 1128 Z" fill="#f4efe2" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/>' +
          '<path d="M436 1128 Q 520 1152 622 1150" fill="none" stroke="#d8cfbb" stroke-width="5"/></g>');
        PF.P("mo_sl", 524, 1090, { s: 0.2 }); st.sl = true;
      }
      H.arm("L", -40, t, 0.4, "power2.inOut");
      PF.O("#mo_sl", 0, 1, t + 0.3, 0.08); PF.X("mo_sl", { s: 1 }, t + 0.3, 0.32, "back.out(2)");
      R.dirty("sling", function (tt, d) { PF.O("#mo_sl", 1, 0, tt, d ? 0.15 : 0.01); PF.X("mo_sl", { s: 0.2 }, tt + 0.2, 0); H.arm("L", C().arms0[0], tt, d || 0.01); });
      return "body";
    },
    ride: function (t, mode, t1, o) {      // auto s vodicom pribrzdi vpravo; "sign" = nad nim vyskoci znacka nemocnice
      o = o || {}; var H = C().hero;
      if (!st.rd) {
        PF.add("M", '<g id="mo_car" opacity="0"><g filter="url(#cut)"><path d="M792 1352 L 826 1290 H 952 L 990 1352 Z" fill="#d9483b"/>' +
          '<path d="M806 1348 L 834 1300 H 884 V 1348 Z M 896 1300 H 946 L 974 1348 H 896 Z" fill="#cfe9f7"/><circle cx="852" cy="1332" r="19" fill="#e3ae82"/>' +
          '<rect x="736" y="1346" width="308" height="76" rx="30" fill="#d9483b"/><rect x="736" y="1394" width="308" height="14" fill="#b8342a"/><circle cx="754" cy="1376" r="11" fill="#ffe07a"/>' +
          '<circle cx="806" cy="1424" r="32" fill="#2b2320"/><circle cx="806" cy="1424" r="13" fill="#d8d2c8"/><circle cx="976" cy="1424" r="32" fill="#2b2320"/><circle cx="976" cy="1424" r="13" fill="#d8d2c8"/></g></g>' +
          '<g id="mo_hsp" opacity="0"><path d="M894 1262 v30" stroke="#fbf5ea" stroke-width="12"/><g filter="url(#cut)"><rect x="806" y="1112" width="176" height="152" rx="16" fill="#fbf5ea"/>' +
          '<rect x="876" y="1140" width="36" height="96" rx="6" fill="#d9483b"/><rect x="846" y="1170" width="96" height="36" rx="6" fill="#d9483b"/></g></g>');
        PF.P("mo_car", 890, 1440, { tx: 520 }); PF.P("mo_hsp", 894, 1290, { s: 0.2, tx: -26 }); st.rd = true;
      }
      if (mode === "sign") { PF.O("#mo_hsp", 0, 1, t, 0.06); PF.X("mo_hsp", { s: 1 }, t, 0.3, "back.out(2.2)"); return null; }
      PF.O("#mo_car", 0, 1, t, 0.05); PF.X("mo_car", { tx: -26 }, t, 0.5, "power3.out"); PF.XY("mo_car", { ty: -9 }, t + 0.5, 0.09, "sine.inOut", 3);
      H.look(12, 2, t, 0.2); R.setFace(t + 0.3, "smile");
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
      R.dirty("ride", function (tt, d) { PF.O("#mo_car", 1, 0, tt, d ? 0.15 : 0.01); PF.O("#mo_hsp", 1, 0, tt, d ? 0.15 : 0.01); PF.X("mo_car", { tx: 520 }, tt + 0.2, 0); PF.X("mo_hsp", { s: 0.2 }, tt + 0.2, 0);
        H.look(C().look0[0], C().look0[1], tt, 0); });
      return "body";
    },
    antivenom: function (t, x, t1, o) {    // protijed: ampulka vlavo, zelena fajka, jed v ramene ustupi
      o = o || {}; var u = UI(), H = C().hero;
      u.insertAdjacentHTML("beforeend", '<div class="mo mo-left mo-side" id="mo_av" style="top:' + (o.y || 600) + 'px"><div class="mo-paper" id="mo_avIn"><span class="mo-lbl">ANTIVENOM</span>' +
        '<svg viewBox="0 0 220 270"><rect x="76" y="76" width="68" height="160" rx="14" fill="#e8f6fc" stroke="#2b2320" stroke-width="7"/><rect x="81" y="128" width="58" height="103" rx="9" fill="#f2c230"/>' +
        '<rect x="88" y="44" width="44" height="34" rx="6" fill="#9aa4af" stroke="#2b2320" stroke-width="7"/><rect x="76" y="146" width="68" height="50" fill="#ffffff" stroke="#2b2320" stroke-width="5"/>' +
        '<path d="M110 156 v30 M95 171 h30" stroke="#d9483b" stroke-width="9"/>' +
        '<path id="mo_avK" d="M150 206 L176 232 L214 176" fill="none" stroke="#3fa35b" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg></div></div>');
      PF.O("#mo_av", 0, 1, t, 0.08); tl.fromTo("#mo_avIn", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      PF.O("#mo_avK", 0, 1, t + 0.5, 0.05); tl.fromTo("#mo_avK", { scale: 2.2, svgOrigin: "180 206" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, t + 0.5);
      if (st.vn && st.vn.on) M.venom(t + 0.4, "back", t1, { dur: 0.8 });
      R.setFace(t + 0.5, "happy"); H.look(C().look0[0], C().look0[1], t + 0.4, 0.2);
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
      R.dirty("antivenom", function (tt, d) { PF.O("#mo_av", 1, 0, tt, d ? 0.15 : 0.01); });
      return "body";
    },
    // ---------- 040 Holding Your Breath
    clear: function (t, keys) {            // uprac veci predoslych zaberov: zoznam klucov oddelenych ciarkou (timer, o2, step, alarm ...)
      String(keys || "").split(",").forEach(function (k) { R.clean(k.trim(), t, 0.15); }); return null;
    },
    breath: function (t, mode, t1, o) {    // zadrz dych s divakom: "hold" = nadych, lica von, kruh s 10 (o.ring false = bez kruhu); "zero" = odpocet dobehne presne sem (kazda cislica = 1 s);
      o = o || {}; var u = UI(), H = C().hero, p = H.p, i;   // "out" = vydych; "badge" = maly kruh 10 s so zelenou fajkou (pravidlo)
      if (!st.br) {
        u.insertAdjacentHTML("beforeend", '<div class="mo" id="mo_br" style="top:' + (o.y || 118) + 'px"><div id="mo_brIn" style="position:relative;width:300px;height:300px">' +
          '<svg viewBox="0 0 300 300" style="position:static;display:block;width:300px;height:300px;overflow:visible">' +
          '<circle cx="150" cy="159" r="140" fill="#5a2a1a" opacity="0.25"/><circle cx="150" cy="150" r="140" fill="#fbf5ea"/>' +
          '<circle cx="150" cy="150" r="118" fill="none" stroke="#e6d9c2" stroke-width="20"/>' +
          '<circle id="mo_brA" cx="150" cy="150" r="118" fill="none" stroke="#d9483b" stroke-width="20" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="0" transform="rotate(-90 150 150)"/>' +
          '<text id="mo_brD" x="150" y="186" style="font-family:Pop;font-weight:600;font-size:120px;text-anchor:middle;fill:#2b2320">10</text>' +
          '<text id="mo_brL" x="150" y="232" style="font-family:Hand;font-weight:700;font-size:30px;letter-spacing:3px;text-anchor:middle;fill:#a8261c">HOLD</text>' +
          '<path id="mo_brK" d="M196 236 L228 268 L288 190" fill="none" stroke="#3fa35b" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg></div></div>');
        PF.add(p + "head", '<path id="mo_brM" d="M520 908 Q 540 915 560 908" fill="none" stroke="#2b2320" stroke-width="9" stroke-linecap="round" opacity="0"/>');
        document.getElementById(p + "sick").insertAdjacentHTML("afterend", '<circle id="mo_brRed" cx="540" cy="800" r="150" fill="#ec5a4c" opacity="0" style="mix-blend-mode:multiply"/>');
        st.br = { t0: 0, ring: false, puff: false };
      }
      var ringOff = function (tt, d) { if (st.br.ring) { PF.O("#mo_br", 1, 0, tt, d || 0.01); st.br.ring = false; } };
      var undo = function (tt, d) {
        ringOff(tt, d ? 0.15 : 0.01);
        if (st.br.puff) { PF.X(p + "jowls", { s: 0.6 }, tt, d ? 0.14 : 0); PF.O("#" + p + "jowls", 1, 0, tt + (d ? 0.1 : 0), d ? 0.06 : 0); PF.S("#mo_brM", { opacity: 0 }, tt);
          PF.X(p + "up", { sy: 1 }, tt, d ? 0.2 : 0); st.br.puff = false; }
        PF.S("#mo_brRed", { opacity: 0 }, tt + 0.01);
      };
      if (mode === "hold") {
        st.br.t0 = t; st.br.puff = true;
        if (o.ring !== false) {
          tl.set("#mo_br", { top: o.y || 118, x: 0 }, t - 0.3); tl.set("#mo_brD", { textContent: "10" }, t - 0.3); tl.set("#mo_brL", { textContent: "HOLD" }, t - 0.3);
          tl.set("#mo_brA", { attr: { "stroke-dashoffset": 0 }, stroke: "#d9483b" }, t - 0.3); PF.S("#mo_brK", { opacity: 0 }, t - 0.3);
          PF.O("#mo_br", 0, 1, t - 0.12, 0.08); st.br.ring = true;
          tl.fromTo("#mo_brIn", { scale: 0.3, rotation: -10 }, { scale: 1, rotation: 0, duration: 0.34, ease: "back.out(2)", immediateRender: false }, t - 0.12);
        }
        PF.X(p + "up", { sy: 1.05 }, t - 0.05, 0.3, "back.out(2)");            // nadych: hrud hore, lica von, usta zavrete
        H.eyes("eyesN", t); H.mouth("none", t + 0.12); PF.S("#mo_brM", { opacity: 1 }, t + 0.12); H.brows(-8, 8, -8, t, 0.2); H.lids(0, t, 0.01);
        PF.O("#" + p + "jowls", 0, 1, t + 0.1, 0.06); PF.X(p + "jowls", { s: 1 }, t + 0.1, 0.28, "back.out(2.4)");
        R.dirty("breath", undo); R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
        return "body";
      }
      if (mode === "zero") {
        var t0 = st.br.t0, ts = Math.max(t0 + 0.2, t - 10);
        for (i = 1; i <= 10; i++) { var tk = t - 10 + i; if (tk <= t0 + 0.1) continue;
          tl.set("#mo_brD", { textContent: String(10 - i) }, tk);
          tl.fromTo("#mo_brIn", { scale: i === 10 ? 1.28 : 1.09 }, { scale: 1, duration: i === 10 ? 0.3 : 0.22, ease: "power2.out", immediateRender: false }, tk); }
        tl.fromTo("#mo_brA", { attr: { "stroke-dashoffset": 0 } }, { attr: { "stroke-dashoffset": 100 }, duration: t - ts, ease: "none", immediateRender: false }, ts);
        tl.fromTo("#mo_brRed", { opacity: 0 }, { opacity: 0.45, duration: t - t0 - 0.6, ease: "power1.in", immediateRender: false }, t0 + 0.6);
        PF.XY(p + "head", { tx: 6 }, t - 3, 0.06, "sine.inOut", 49);            // posledne 3 s: hlava sa chveje
        tl.set("#mo_brL", { textContent: "BREATHE" }, t); tl.set("#mo_brA", { attr: { "stroke-dashoffset": 0 }, stroke: "#3fa35b" }, t + 0.02);
        return null;
      }
      if (mode === "out") {
        var g = UIS(), q = scr(headPt(540, 922)), id = uid("mo_bp");
        if (st.br.puff) { PF.X(p + "jowls", { s: 0.6 }, t, 0.14, "power2.in"); PF.O("#" + p + "jowls", 1, 0, t + 0.1, 0.06); PF.S("#mo_brM", { opacity: 0 }, t);
          PF.X(p + "up", { sy: 0.97 }, t, 0.16, "power2.out"); PF.X(p + "up", { sy: 1 }, t + 0.16, 0.4, "back.out(2)"); st.br.puff = false; }
        R.setFace(t, "pant"); tl.to("#mo_brRed", { opacity: 0, duration: 0.7, ease: "power1.out" }, t + 0.02);
        for (i = 0; i < 8; i++) {                                               // oblacik vydychu: kruhy sa rozleteia od ust dole do stran
          var a = (18 + i * 20.5) * Math.PI / 180, r = 150 + (i % 3) * 60, cid = id + i;
          PF.el("circle", { id: cid, r: 26 + (i % 3) * 9, fill: "#ffffff", opacity: 0 }, g);
          tl.fromTo("#" + cid, { x: q[0], y: q[1], scale: 0.3, opacity: 0.95 }, { x: q[0] + Math.cos(a) * r, y: q[1] + Math.sin(a) * r * 0.75 + 30, scale: 1.5, opacity: 0, duration: 0.7 + (i % 3) * 0.12, ease: "power2.out", immediateRender: false }, t + (i % 2) * 0.05);
        }
        ringOff(t + (o.keep || 0.7), 0.2);
        if (st.gg && st.gg.on) M.gauge(t + 0.05, "drop"); if (st.co && st.co.on) M.co2(t, "out"); if (st.al && st.al.on) M.alarm(t, "off");
        R.setFace(t + (o.rest || 1.0), C().face0);
        return "body";
      }
      if (mode === "badge") {
        var te = Math.min(t + (o.hold || 9), (t1 || 1e9) - 0.12), tc = t + (o.check === undefined ? 1.0 : o.check);
        tl.set("#mo_br", { top: o.y || 420, x: o.x === undefined ? 300 : o.x }, t - 0.05); tl.set("#mo_brD", { textContent: "10" }, t - 0.05); tl.set("#mo_brL", { textContent: "SECONDS" }, t - 0.05);
        tl.set("#mo_brA", { attr: { "stroke-dashoffset": 0 }, stroke: "#3fa35b" }, t - 0.05);
        PF.O("#mo_br", 0, 1, t, 0.06); st.br.ring = true;
        tl.fromTo("#mo_brIn", { scale: 0.3, rotation: -12 }, { scale: 0.86, rotation: 4, duration: 0.32, ease: "back.out(2.2)", immediateRender: false }, t);
        if (tc < te - 0.2) { PF.O("#mo_brK", 0, 1, tc, 0.05); tl.fromTo("#mo_brK", { scale: 2.4, svgOrigin: "240 230" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, tc);
          tl.fromTo("#mo_brIn", { scale: 0.96 }, { scale: 0.86, duration: 0.25, ease: "power2.out", immediateRender: false }, tc + 0.16); }
        ringOff(te, 0.15); PF.S("#mo_brK", { opacity: 0 }, te + 0.2);
        R.dirty("breath", undo);
        return null;
      }
      return null;
    },
    gauge: function (t, mode, t1, o) {     // tlakomer vpravo: rucicka vybehne do cervenej a chveje sa, hrud pulzuje; "drop" = spat do zelenej a zmizne
      o = o || {}; var u = UI(), p = C().hero.p;
      if (!st.gg) {
        u.insertAdjacentHTML("beforeend", '<div class="mo mo-right mo-side" id="mo_gg" style="top:' + (o.y || 690) + 'px"><div class="mo-paper" id="mo_ggIn"><span class="mo-lbl">PRESSURE</span>' +
          '<svg viewBox="0 0 220 170" style="height:170px"><g fill="none" stroke-width="28"><path d="M22 140 A88 88 0 0 1 66 64" stroke="#3fa35b"/><path d="M66 64 A88 88 0 0 1 154 64" stroke="#f2c230"/>' +
          '<path d="M154 64 A88 88 0 0 1 198 140" stroke="#d9483b"/></g>' +
          '<g id="mo_ggN"><path d="M110 140 L110 58" stroke="#2b2320" stroke-width="11" stroke-linecap="round"/></g><circle cx="110" cy="140" r="16" fill="#2b2320"/></svg></div></div>');
        tl.set("#mo_ggN", { rotation: -72, svgOrigin: "110 140" }, 0);
        st.gg = { on: false };
      }
      if (mode === "drop") {
        if (!st.gg.on) return null;
        tl.to("#mo_ggN", { rotation: -72, svgOrigin: "110 140", duration: 0.5, ease: "power2.inOut" }, t); R.clean("gauge", t + 0.75, 0.2);
        return null;
      }
      var te = Math.max(t + 1.6, (t1 || t + 2) - 0.1), n = Math.max(1, Math.round((te - t - 1.1) / 0.24)) * 2 - 1;
      PF.O("#mo_gg", 0, 1, t, 0.08); tl.fromTo("#mo_ggIn", { scale: 0.4, rotation: 8 }, { scale: 1, rotation: 2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
      tl.fromTo("#mo_ggN", { rotation: -72, svgOrigin: "110 140" }, { rotation: 58, svgOrigin: "110 140", duration: 0.9, ease: "power2.in", immediateRender: false }, t + 0.15);
      tl.fromTo("#mo_ggN", { rotation: 58, svgOrigin: "110 140" }, { rotation: 72, svgOrigin: "110 140", duration: 0.12, ease: "sine.inOut", yoyo: true, repeat: n, immediateRender: false }, t + 1.06);
      tl.set("#mo_ggN", { rotation: 66, svgOrigin: "110 140" }, t + 1.07 + (n + 1) * 0.12);
      PF.XY(p + "up", { sx: 1.035 }, t + 0.3, 0.22, "sine.inOut", 5);
      st.gg.on = true;
      R.dirty("gauge", function (tt, d) { PF.O("#mo_gg", 1, 0, tt, d ? 0.2 : 0.01); tl.set("#mo_ggN", { rotation: -72, svgOrigin: "110 140" }, tt + 0.25); st.gg.on = false; });
      return "body";
    },
    o2: function (t, mode, t1, o) {        // kyslik vlavo: "doubt" = skoro prazdna flasa a blika EMPTY? (takto sa to citi); "full" = v skutocnosti je takmer plna; "pct" = 92%; "check" = fajka; "off"
      o = o || {}; var u = UI(), Y = function (v) { return (258 - 196 * v).toFixed(1); };
      if (!st.ox) {
        u.insertAdjacentHTML("beforeend", '<div class="mo mo-left mo-side" id="mo_ox" style="top:' + (o.y || 640) + 'px"><div class="mo-paper" id="mo_oxIn"><span class="mo-lbl">OXYGEN</span>' +
          '<svg viewBox="0 0 220 270"><defs><clipPath id="mo_oxC"><rect x="62" y="62" width="96" height="196" rx="34"/></clipPath></defs>' +
          '<rect x="92" y="14" width="36" height="32" rx="6" fill="#9aa4af" stroke="#2b2320" stroke-width="7"/><rect x="72" y="40" width="76" height="22" rx="8" fill="#9aa4af" stroke="#2b2320" stroke-width="7"/>' +
          '<rect x="62" y="62" width="96" height="196" rx="34" fill="#ffffff"/><g clip-path="url(#mo_oxC)"><rect id="mo_oxW" x="62" y="' + Y(0.07) + '" width="96" height="220" fill="#d9483b"/></g>' +
          '<rect x="62" y="62" width="96" height="196" rx="34" fill="none" stroke="#2b2320" stroke-width="7"/><path d="M82 96 v70" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.7"/>' +
          '<text id="mo_oxE" x="110" y="176" transform="rotate(-10 110 160)" style="font-family:Pop;font-weight:600;font-size:54px;text-anchor:middle;fill:#d9483b;stroke:#fbf5ea;stroke-width:12px;paint-order:stroke" opacity="0">EMPTY?</text>' +
          '<text id="mo_oxP" x="110" y="196" transform="rotate(-8 110 160)" style="font-family:Pop;font-weight:600;font-size:92px;text-anchor:middle;fill:#2f8a4c;stroke:#fbf5ea;stroke-width:14px;paint-order:stroke" opacity="0">92%</text>' +
          '<path id="mo_oxK" d="M140 214 L168 242 L214 176" fill="none" stroke="#3fa35b" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg></div></div>');
        st.ox = { on: false, v: 0.07 };
      }
      var show = function (tt) {
        if (st.ox.on) return;
        PF.O("#mo_ox", 0, 1, tt, 0.08); tl.fromTo("#mo_oxIn", { scale: 0.4, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.3, ease: "back.out(2)", immediateRender: false }, tt); st.ox.on = true;
        R.dirty("o2", function (t2, d) { PF.O("#mo_ox", 1, 0, t2, d ? 0.2 : 0.01); st.ox.on = false;
          tl.set("#mo_oxW", { attr: { y: Y(0.07) }, fill: "#d9483b", opacity: 1 }, t2 + 0.25); PF.S("#mo_oxE,#mo_oxP,#mo_oxK", { opacity: 0 }, t2 + 0.25); st.ox.v = 0.07; });
      };
      if (mode === "off") { R.clean("o2", t, 0.15); return null; }
      if (mode === "doubt") {
        show(t); var te = Math.max(t + 0.9, (t1 || t + 2) - 0.12), n = Math.max(1, Math.round((te - t - 0.3) / 0.44)) * 2 - 1;
        PF.O("#mo_oxE", 0, 1, t + 0.15, 0.05); tl.fromTo("#mo_oxE", { scale: 2, svgOrigin: "110 160" }, { scale: 1, duration: 0.15, ease: "power3.in", immediateRender: false }, t + 0.15);
        tl.fromTo("#mo_oxE", { opacity: 1 }, { opacity: 0.2, duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: n, immediateRender: false }, t + 0.32);
        tl.fromTo("#mo_oxIn", { x: -6 }, { x: 6, duration: 0.05, ease: "none", yoyo: true, repeat: 5, immediateRender: false }, t + 0.3); PF.S("#mo_oxIn", { x: 0 }, t + 0.62);
        return null;
      }
      if (mode === "full") {
        var was = st.ox.on; show(t);
        tl.to("#mo_oxE", { opacity: 0, duration: 0.12 }, t + (was ? 0 : 0.01));
        tl.fromTo("#mo_oxW", { attr: { y: Y(st.ox.v) } }, { attr: { y: Y(0.92) }, duration: 0.6, ease: "power2.out", immediateRender: false }, t + 0.05);
        tl.fromTo("#mo_oxW", { fill: "#d9483b" }, { fill: "#3f9be0", duration: 0.3, ease: "none", immediateRender: false }, t + 0.05); st.ox.v = 0.92;
        tl.fromTo("#mo_oxIn", { scale: 1.14 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.6);
        return null;
      }
      if (mode === "pct") {
        if (!st.ox.on) { show(t - 0.3); tl.set("#mo_oxW", { attr: { y: Y(0.92) }, fill: "#3f9be0" }, t - 0.31); st.ox.v = 0.92; }
        PF.O("#mo_oxP", 0, 1, t, 0.04); tl.fromTo("#mo_oxP", { scale: 2.4, svgOrigin: "110 160" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, t);
        PF.O("#mo_oxW", 1, 0.4, t, 0.15); shake(t + 0.16, 0.2, 7);
        tl.fromTo("#mo_oxIn", { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.16);
        return null;
      }
      if (mode === "check") {
        if (!st.ox.on) { show(t - 0.3); tl.set("#mo_oxW", { attr: { y: Y(0.92) }, fill: "#3f9be0" }, t - 0.31); st.ox.v = 0.92; }
        PF.O("#mo_oxK", 0, 1, t, 0.05); tl.fromTo("#mo_oxK", { scale: 2.3, svgOrigin: "176 214" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, t);
        tl.fromTo("#mo_oxIn", { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.16);
        return null;
      }
      return null;
    },
    co2: function (t, mode, t1, o) {       // CO2 sa hromadi v tele: "pile" = bubliny pribudaju od brucha hore; "glow" = ukazu sa a zapulzuju; "out" = odidu hore (vydych); "off"
      o = o || {}; var p = C().hero.p, B = [[494, 1196, 30], [566, 1204, 27], [612, 1160, 24], [462, 1150, 24], [534, 1140, 31], [596, 1104, 27], [478, 1092, 27], [468, 1036, 22], [612, 1042, 22]];
      if (!st.co) {
        var h = "";
        B.forEach(function (b, k) { h += '<g id="mo_co' + k + '" opacity="0"><circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="#5b6475" stroke="#ffffff" stroke-width="5"/>' +
          (b[2] >= 26 ? '<text x="' + (b[0] - 3) + '" y="' + (b[1] + 7) + '" style="font-family:Pop;font-weight:600;font-size:' + (b[2] > 28 ? 21 : 18) + 'px;text-anchor:middle;fill:#ffffff">CO<tspan dy="5" style="font-size:13px">2</tspan></text>' : "") + '</g>'; });
        PF.add(p + "up", '<g id="mo_coG">' + h + '</g>');
        B.forEach(function (b, k) { PF.P("mo_co" + k, b[0], b[1], { s: 0.2 }); });
        st.co = { on: false };
      }
      var pop = function (k, tt) { PF.O("#mo_co" + k, 0, 1, tt, 0.05); PF.X("mo_co" + k, { s: 1 }, tt, 0.24, "back.out(2.6)"); };
      var reg = function () { st.co.on = true; R.dirty("co2", function (tt, d) { B.forEach(function (b, k) { PF.O("#mo_co" + k, 1, 0, tt, d ? 0.15 : 0.01); PF.X("mo_co" + k, { s: 0.2, ty: 0 }, tt + 0.2, 0); }); st.co.on = false; }); };
      if (mode === "off") { R.clean("co2", t, 0.15); return null; }
      if (mode === "out") {
        if (!st.co.on) return null;
        B.forEach(function (b, k) { PF.X("mo_co" + k, { ty: -(b[1] - 900), s: 0.4 }, t + k * 0.02, 0.42, "power2.in"); PF.O("#mo_co" + k, 1, 0, t + 0.3 + k * 0.02, 0.14); PF.X("mo_co" + k, { s: 0.2, ty: 0 }, t + 0.7, 0); });
        st.co.on = false; R.dirty("co2", function () {});
        return null;
      }
      if (mode === "glow") {
        if (!st.co.on) { B.forEach(function (b, k) { pop(k, t + k * 0.04); }); reg(); t += 0.5; }
        B.forEach(function (b, k) { PF.XY("mo_co" + k, { s: 1.28 }, t + (k % 3) * 0.06, 0.2, "sine.inOut", 3); });
        return "body";
      }
      var dur = Math.max(0.6, Math.min(o.dur || 1.5, (t1 || 1e9) - t - 0.3));
      B.forEach(function (b, k) { pop(k, t + dur * k / (B.length - 1)); }); reg();
      PF.XY(p + "up", { sx: 1.03 }, t + dur, 0.2, "sine.inOut", 3);
      return "body";
    },
    alarm: function (t, mode, t1, o) {     // poplasny zvoncek vpravo hore: "ring" = zvoni do konca vety; "sock" = zazvoni a prikryje ho ponozka (stlmeny); "off"
      o = o || {}; var u = UI();
      if (!st.al) {
        u.insertAdjacentHTML("beforeend", '<div id="mo_al" style="position:absolute;left:' + (o.x || 790) + 'px;top:' + (o.y || 410) + 'px;width:230px;height:230px;opacity:0">' +
          '<svg viewBox="0 0 230 230" style="position:static;display:block;width:230px;height:230px;overflow:visible">' +
          '<g id="mo_alW" fill="none" stroke="#d9483b" stroke-width="12" stroke-linecap="round"><path d="M36 70 q-22 42 0 84"/><path d="M8 50 q-34 62 0 124"/><path d="M194 70 q22 42 0 84"/><path d="M222 50 q34 62 0 124"/></g>' +
          '<g id="mo_alB"><path d="M115 34 C 66 34 60 96 56 130 C 54 150 44 158 40 168 H 190 C 186 158 176 150 174 130 C 170 96 164 34 115 34 Z" fill="#f2c230" stroke="#2b2320" stroke-width="8" stroke-linejoin="round"/>' +
          '<circle cx="115" cy="26" r="13" fill="#f2c230" stroke="#2b2320" stroke-width="8"/><circle cx="115" cy="188" r="17" fill="#d9483b" stroke="#2b2320" stroke-width="8"/>' +
          '<path d="M86 66 q-12 26 -12 56" fill="none" stroke="#fff6cf" stroke-width="9" stroke-linecap="round"/></g>' +
          '<g id="mo_alS" opacity="0"><g transform="translate(28.75 -85.5) scale(0.75)"><path d="M52 14 H178 V150 Q180 176 206 186 Q236 198 230 220 Q224 236 196 236 H92 Q52 236 52 196 Z" fill="#7fb0e0" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>' +
          '<rect x="46" y="2" width="138" height="38" rx="12" fill="#ffffff" stroke="#c9d6e6" stroke-width="5"/><path d="M52 78 H178 M52 112 H178" stroke="#ffffff" stroke-width="12"/>' +
          '<path d="M176 222 q24 6 44 -8" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/></g></g></svg></div>');
        st.al = { on: false };
      }
      var ring = function (ta, tb) {
        var n = Math.max(1, Math.round((tb - ta) / 0.16)) * 2 - 1;
        tl.fromTo("#mo_alB", { rotation: -16, svgOrigin: "115 30" }, { rotation: 16, svgOrigin: "115 30", duration: 0.08, ease: "sine.inOut", yoyo: true, repeat: n, immediateRender: false }, ta);
        tl.set("#mo_alB", { rotation: 0, svgOrigin: "115 30" }, ta + (n + 1) * 0.08 + 0.01);
        tl.fromTo("#mo_alW", { opacity: 1 }, { opacity: 0.15, duration: 0.08, ease: "none", yoyo: true, repeat: n, immediateRender: false }, ta);
      };
      var show = function (tt) {
        if (st.al.on) return;
        tl.set("#mo_al", { left: o.x || 790, top: o.y || 410 }, tt - 0.02); PF.S("#mo_alS", { opacity: 0 }, tt - 0.02); PF.S("#mo_alW", { opacity: 1 }, tt - 0.02);
        PF.O("#mo_al", 0, 1, tt, 0.06); tl.fromTo("#mo_al", { scale: 0.3 }, { scale: 1, duration: 0.28, ease: "back.out(2.4)", immediateRender: false }, tt); st.al.on = true;
        R.dirty("alarm", function (t2, d) { PF.O("#mo_al", 1, 0, t2, d ? 0.15 : 0.01); st.al.on = false; });
      };
      if (mode === "off") { R.clean("alarm", t, 0.15); return null; }
      if (mode === "sock") {
        var tr = t - (o.lead || 0.5); show(tr); ring(tr + 0.05, t);
        PF.O("#mo_alS", 0, 1, t - 0.04, 0.04); tl.fromTo("#mo_alS", { y: -300 }, { y: 0, duration: 0.3, ease: "bounce.out", immediateRender: false }, t - 0.04);
        PF.O("#mo_alW", 1, 0, t + 0.1, 0.1);
        tl.fromTo("#mo_alB", { rotation: -4, svgOrigin: "115 30" }, { rotation: 4, svgOrigin: "115 30", duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, t + 0.3);
        tl.set("#mo_alB", { rotation: 0, svgOrigin: "115 30" }, t + 1.12);
        return null;
      }
      show(t); ring(t + 0.1, Math.max(t + 0.7, Math.min(t + (o.hold || 3), (t1 || 1e9) - 0.1))); shake(t + 0.1, 0.4, 5);
      return null;
    },
    burn: function (t, x, t1, o) {         // palenie v hrudi: plamienok na hrudi so ziarou, do konca vety
      o = o || {}; var p = C().hero.p, te = Math.max(t + 0.7, Math.min(t + (o.hold || 1.6), (t1 || 1e9) - 0.12));
      if (!st.bn) {
        PF.add(p + "up", '<g id="mo_bn" opacity="0"><ellipse cx="540" cy="1056" rx="130" ry="110" fill="#ff6a3d" opacity="0.4" filter="url(#soft6)"/>' +
          '<g id="mo_bnF"><path d="M540 946 C 584 1002 610 1036 600 1082 C 592 1118 564 1134 540 1134 C 516 1134 488 1118 480 1082 C 472 1044 506 1028 510 988 C 524 1000 532 982 540 946 Z" fill="#f2762e" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>' +
          '<path d="M540 1036 C 562 1062 572 1080 566 1100 C 562 1116 550 1122 540 1122 C 530 1122 518 1116 514 1100 C 510 1082 528 1068 540 1036 Z" fill="#ffd34d"/></g></g>');
        PF.P("mo_bnF", 540, 1132, { s: 0.2 }); st.bn = true;
      }
      var n = Math.max(1, Math.round((te - t - 0.34) / 0.2)) * 2 - 1;
      PF.O("#mo_bn", 0, 1, t, 0.08); PF.X("mo_bnF", { s: 1 }, t, 0.3, "back.out(2.2)");
      PF.XY("mo_bnF", { sx: 0.88, sy: 1.14 }, t + 0.32, 0.1, "sine.inOut", n);
      PF.X("mo_bnF", { s: 0.2 }, te, 0.15, "power2.in"); PF.O("#mo_bn", 1, 0, te, 0.15);
      if (o.face !== false) { R.setFace(t, "worried"); R.setFace(te, C().face0); R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); }); }
      return "body";
    },
    pant: function (t, x, t1, o) {         // rychle hlboke dychanie (hyperventilacia): hrud pumpuje, CO2 odlieta z ust -> poplach nema co spustit
      o = o || {}; var H = C().hero, p = H.p, g = UIS(), te = Math.min(t + (o.hold || 2.2), (t1 || 1e9) - 0.2), per = 0.34, n = Math.max(2, Math.floor((te - t) / per)), i, id = uid("mo_pt");
      R.setFace(t, "pant"); PF.XY(p + "up", { sy: 1.055 }, t, per / 2, "sine.inOut", n * 2 - 1);
      for (i = 0; i < n; i++) {
        var q = scr(headPt(540, 922)), bid = id + "b" + i, tb = t + i * per + per / 2, dx = (i % 2 ? 1 : -1) * (215 + i * 24);
        g.insertAdjacentHTML("beforeend", '<g id="' + bid + '" opacity="0"><circle r="32" fill="#5b6475" stroke="#ffffff" stroke-width="5"/>' +
          '<text x="-3" y="8" style="font-family:Pop;font-weight:600;font-size:22px;text-anchor:middle;fill:#ffffff">CO<tspan dy="5" style="font-size:14px">2</tspan></text></g>');
        tl.fromTo("#" + bid, { x: q[0], y: q[1], scale: 0.3, opacity: 1 }, { x: q[0] + dx, y: q[1] - 110 - (i % 3) * 55, scale: 1, opacity: 1, duration: 0.6, ease: "power1.out", immediateRender: false }, tb);
        PF.O("#" + bid, 1, 0, tb + 0.6, 0.15);
      }
      R.setFace(te, "dizzy"); H.spin(te, 1.0);
      R.dirty("face", function (tt, d) { R.setFace(tt, C().face0, d ? undefined : 0); });
      return "body";
    },
    water: function (t, mode, t1, o) {     // "nikdy vo vode": voda vystupi po hrud; "x" = velke cervene X; "dark" = zatmenie bez varovania (bublinky, zvoncek mlci); "off" = vsetko prec
      o = o || {}; var u = UI(), H = C().hero, p = H.p, i;
      if (!st.wt) {
        var d = "M-240 0", bub = "";
        for (i = 0; i < 13; i++) d += " q 30 -24 60 0 q 30 24 60 0";
        for (i = 0; i < 6; i++) bub += '<circle id="mo_wtU' + i + '" cx="' + (553 + (i % 3 - 1) * 34) + '" cy="760" r="' + (13 + (i % 3) * 6) + '" fill="none" stroke="#cfe9f7" stroke-width="6" opacity="0"/>';
        u.insertAdjacentHTML("beforeend", '<div id="mo_wt" style="position:absolute;left:0;top:0;width:1080px;height:1920px;opacity:0">' +
          '<svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px"><g id="mo_wtW"><g id="mo_wtV"><path d="' + d + ' V 1100 H -240 Z" fill="#3f93d4" fill-opacity="0.6"/>' +
          '<path d="' + d + '" fill="none" stroke="#e6f5ff" stroke-width="9" stroke-linecap="round"/></g></g>' +
          '<g id="mo_wtX" opacity="0"><path d="M390 1150 L690 1450 M690 1150 L390 1450" stroke="#fbf5ea" stroke-width="74" stroke-linecap="round"/><path d="M390 1150 L690 1450 M690 1150 L390 1450" stroke="#d9483b" stroke-width="44" stroke-linecap="round"/></g></svg>' +
          '<div id="mo_wtD" style="position:absolute;left:0;top:0;width:1080px;height:1920px;background:#081220;opacity:0"></div>' +
          '<svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px">' + bub +
          '<g id="mo_wtB" opacity="0"><g transform="translate(790 400)"><path d="M115 34 C 66 34 60 96 56 130 C 54 150 44 158 40 168 H 190 C 186 158 176 150 174 130 C 170 96 164 34 115 34 Z" fill="#9aa4af" stroke="#fbf5ea" stroke-width="8" stroke-linejoin="round"/>' +
          '<circle cx="115" cy="26" r="13" fill="#9aa4af" stroke="#fbf5ea" stroke-width="8"/><circle cx="115" cy="188" r="17" fill="#9aa4af" stroke="#fbf5ea" stroke-width="8"/>' +
          '<path d="M24 208 L206 18" stroke="#fbf5ea" stroke-width="34" stroke-linecap="round"/><path d="M24 208 L206 18" stroke="#d9483b" stroke-width="18" stroke-linecap="round"/></g>' +
          '<text x="905" y="696" style="font-family:Hand;font-weight:700;font-size:44px;letter-spacing:3px;text-anchor:middle;fill:#fbf5ea">NO ALARM</text></g></svg></div>');
        st.wt = { on: false, dark: false };
      }
      var off = function (tt, dd) {
        if (!st.wt.on) return;
        PF.O("#mo_wt", 1, 0, tt, dd ? 0.3 : 0.01); PF.S("#mo_wtD,#mo_wtX,#mo_wtB", { opacity: 0 }, tt + 0.32);
        if (st.wt.dark) { PF.X(p + "up", { r: 0 }, tt, dd ? 0.3 : 0); R.setFace(tt + 0.05, C().face0, dd ? undefined : 0); st.wt.dark = false; }
        st.wt.on = false;
      };
      if (mode === "off") { R.clean("water", t, 0.3); return null; }
      if (mode === "x") {
        PF.O("#mo_wtX", 0, 1, t, 0.04); tl.fromTo("#mo_wtX", { scale: 2.4, svgOrigin: "540 1300" }, { scale: 1, duration: 0.16, ease: "power3.in", immediateRender: false }, t);
        shake(t + 0.16, 0.25, 9); PF.punch(t + 0.16, 1.03); R.setFace(t + 0.1, "worried");
        return null;
      }
      if (mode === "dark") {
        var te = Math.max(t + 1.2, (t1 || t + 2) - 0.05), tb = t + (o.bell === undefined ? 1.05 : o.bell);
        tl.fromTo("#mo_wtD", { opacity: 0 }, { opacity: 0.55, duration: 0.1, ease: "none", immediateRender: false }, t);
        tl.fromTo("#mo_wtD", { opacity: 0.55 }, { opacity: 0.2, duration: 0.1, ease: "none", immediateRender: false }, t + 0.12);
        tl.fromTo("#mo_wtD", { opacity: 0.2 }, { opacity: 0.72, duration: 0.3, ease: "power2.in", immediateRender: false }, t + 0.24);
        PF.O("#mo_wtX", 1, 0, t, 0.12);
        H.eyes("eyesCl", t + 0.2); H.mouth("mO", t + 0.2); H.brows(6, -6, 4, t + 0.2, 0.2); PF.X(p + "up", { r: 9 }, t + 0.25, 0.9, "power1.inOut"); st.wt.dark = true;
        for (i = 0; i < 6; i++) { var ta = t + 0.45 + i * 0.26; if (ta > te - 0.5) break;
          tl.fromTo("#mo_wtU" + i, { y: 0, opacity: 0.9 }, { y: -430 - (i % 2) * 60, opacity: 0, duration: 1.0, ease: "power1.out", immediateRender: false }, ta); }
        if (tb < te - 0.25) { PF.O("#mo_wtB", 0, 1, tb, 0.06); tl.fromTo("#mo_wtB", { scale: 0.4, svgOrigin: "905 520" }, { scale: 1, duration: 0.28, ease: "back.out(2.2)", immediateRender: false }, tb); }
        return null;
      }
      var rise = o.dur || 0.6, per = 1.2, n = Math.max(1, Math.ceil(((t1 || t + 3) + 1.5 - t) / per));
      PF.S("#mo_wtD,#mo_wtX,#mo_wtB", { opacity: 0 }, t - 0.02); PF.O("#mo_wt", 0, 1, t, 0.08); st.wt.on = true;
      tl.fromTo("#mo_wtW", { y: 1960 }, { y: o.level || 1010, duration: rise, ease: "power2.out", immediateRender: false }, t);
      tl.fromTo("#mo_wtV", { x: 0 }, { x: -120, duration: per, ease: "none", repeat: n + 2, immediateRender: false }, t);
      R.dirty("water", off);
      return "body";
    }
  };
  return M;
})();
