// paper-factory: jadro (casova os, transformacie, kamera s paralaxou, prechody, casy slov).
// Vsetko ide cez JEDNU pozastavenu GSAP timeline PF.tl (HyperFrames ju seekuje snimku po snimke).
// Transformacie SVG skupin: vlastny retazec "translate rotate(cx cy) scale" cez attr (ziadne CSS transform konflikty).
window.PF = (function () {
  var tl = gsap.timeline({ paused: true });
  var st = {};
  var NS = "http://www.w3.org/2000/svg";
  var VO = window.__VO || { start: {}, words: {}, seg: {}, total: 0 };
  // stylova suprava videa (engine vklada window.__KIT): chrome nadpisov/titulkov, prechod, podanie detailu, kamera, paleta
  var K = Object.assign({ chrome: "tape", trans: "circle", pres: "full", cam: "calm", palette: 0 }, window.__KIT || {});

  // ---------- casy slov (engine vklada window.__VO)
  function norm(w) { return String(w).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function at(key, word, nth, which) {       // absolutny cas slova vo vete key (tolerantne: spojene slova, predpona)
    var ws = VO.words[key] || [], w = norm(word), hits = ws.filter(function (x) { return norm(x.w) === w; });
    if (!hits.length) {
      for (var i = 0; i + 1 < ws.length && !hits.length; i++) if (norm(ws[i].w) + norm(ws[i + 1].w) === w) hits = [{ s: ws[i].s, e: ws[i + 1].e }];
      if (!hits.length) hits = ws.filter(function (x) { var n = norm(x.w); return n.length > 2 && (n.indexOf(w) === 0 || w.indexOf(n) === 0); });
      if (!hits.length) { console.warn("slovo '" + word + "' nie je vo vete " + key); return +((VO.seg[key] || [0])[0] + 0.5).toFixed(3); }
    }
    var h = hits[Math.min(nth || 0, hits.length - 1)]; return +(VO.start[key] + (which === "e" ? h.e : h.s)).toFixed(3);
  }
  function seg(key) { return VO.seg[key]; }

  // ---------- transformacie
  function ts(o) {
    return "translate(" + o.tx + " " + o.ty + ") rotate(" + o.r + " " + o.cx + " " + o.cy + ") translate(" + o.cx + " " + o.cy +
      ") scale(" + o.sx + " " + o.sy + ") translate(" + (-o.cx) + " " + (-o.cy) + ")";
  }
  function P(id, cx, cy, init) {             // registruj prvok: pivot + pociatocny stav (s = sx = sy)
    var o = { tx: 0, ty: 0, r: 0, sx: 1, sy: 1, cx: cx, cy: cy };
    if (init) { for (var k in init) { if (k === "s") { o.sx = o.sy = init.s; } else o[k] = init[k]; } }
    st[id] = o;
    var e = document.getElementById(id); if (!e) throw new Error("P: chyba #" + id);
    e.setAttribute("transform", ts(o));
  }
  function apply(o, to) { for (var k in to) { if (k === "s") { o.sx = o.sy = to.s; } else o[k] = to[k]; } }
  function X(id, to, t, dur, ease) {
    var a = ts(st[id]); apply(st[id], to); var b = ts(st[id]);
    if (!dur) { tl.set("#" + id, { attr: { transform: b } }, t); return; }
    tl.fromTo("#" + id, { attr: { transform: a } }, { attr: { transform: b }, duration: dur, ease: ease || "power2.inOut", immediateRender: false }, t);
  }
  function XY(id, to, t, dur, ease, rep) {   // yoyo kmitanie, konci vo vychodzom stave (rep neparne)
    var a = ts(st[id]), tmp = {}; for (var k in st[id]) tmp[k] = st[id][k]; apply(tmp, to);
    tl.fromTo("#" + id, { attr: { transform: a } }, { attr: { transform: ts(tmp) }, duration: dur, ease: ease || "sine.inOut", yoyo: true, repeat: rep, immediateRender: false }, t);
  }
  function O(sel, a, b, t, dur, ease) {
    if (!dur) { tl.set(sel, { opacity: b }, t); return; }
    tl.fromTo(sel, { opacity: a }, { opacity: b, duration: dur, ease: ease || "none", immediateRender: false }, t);
  }
  function F(sel, a, b, t, dur) { tl.fromTo(sel, { fill: a }, { fill: b, duration: dur, ease: "power1.inOut", immediateRender: false }, t); }
  function AT(sel, a, b, t, dur, ease) { tl.fromTo(sel, { attr: a }, { attr: b, duration: dur, ease: ease || "power2.inOut", immediateRender: false }, t); }
  function S(sel, v, t) { tl.set(sel, v, t); }
  // ---------- sceny prostredia: skupiny <g id="<pre>_sc_<meno>_<vrstva>"> (vrstvy B/M/F); tu len viditelnost, prechod robi prostredie
  function sceneSet(pre, name, on, t, dur) {
    ["B", "M", "F"].forEach(function (L) { var id = pre + "_sc_" + name + "_" + L; if (!document.getElementById(id)) return;
      if (dur) O("#" + id, on ? 0 : 1, on ? 1 : 0, t, dur); else S("#" + id, { opacity: on ? 1 : 0 }, t); });
  }
  function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var x = Math.imul(seed ^ seed >>> 15, 1 | seed);
    x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
  function svg(layer) { return document.querySelector("#lay" + layer + " svg"); }
  function add(parent, markup) {             // vloz SVG markup (string) do rodica (svg alebo #id skupiny)
    var p = typeof parent === "string" ? (parent.length === 1 ? svg(parent) : document.getElementById(parent)) : parent;
    p.insertAdjacentHTML("beforeend", markup); return p;
  }
  function draw(id, t, dur, ease) {           // "nakreslenie" cesty cez stroke-dashoffset
    var e = document.getElementById(id), L = Math.ceil(e.getTotalLength());
    e.setAttribute("stroke-dasharray", L + " " + L); e.setAttribute("stroke-dashoffset", L);
    tl.fromTo("#" + id, { attr: { "stroke-dashoffset": L } }, { attr: { "stroke-dashoffset": 0 }, duration: dur, ease: ease || "power2.inOut", immediateRender: false }, t);
  }

  // ---------- kamera s paralaxou (B = stena 0.8, M = scena 1.0, F = popredie 1.35)
  var LAY = [["#layB", 0.8], ["#layM", 1.0], ["#layF", 1.35]];
  var cam = { s: 1, px: 540, py: 960 };
  function lt(s, px, py, k) { return { scale: 1 + (s - 1) * k, x: -s * (px - 540) * k, y: -s * (py - 960) * k }; }
  function CAM(s, px, py, t, dur, ease) {
    LAY.forEach(function (L) {
      var a = lt(cam.s, cam.px, cam.py, L[1]), b = lt(s, px, py, L[1]);
      if (!dur) { tl.set(L[0], b, t); return; }
      tl.fromTo(L[0], a, { x: b.x, y: b.y, scale: b.scale, duration: dur, ease: ease || "power2.inOut", immediateRender: false }, t);
    });
    cam = { s: s, px: px, py: py };
  }
  function punch(t, amt) {                   // kratky naraz kamery (buchnutie, tlkot)
    amt = amt || 1.025;
    tl.fromTo("#camRot", { scale: 1 }, { scale: amt, duration: 0.05, ease: "power2.out", immediateRender: false }, t);
    tl.fromTo("#camRot", { scale: amt }, { scale: 1, duration: 0.22, ease: "power2.in", immediateRender: false }, t + 0.06);
  }
  function WORLD(on, t) { if (!on && K.pres === "card") return; tl.set("#camRot", { opacity: on ? 1 : 0 }, t); }   // pri karte svet ostava viditelny

  // ---------- nadpisy a prechody
  function CTA(txt, t0, t1) {              // vyzva na konci (Comment below...): pop pod nadpisom, zmizne pred navratom slucky
    S("#ctaTxt", { textContent: txt }, t0);
    tl.fromTo("#cta", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none", immediateRender: false }, t0);
    tl.fromTo("#ctaIn", { scale: 0.5, rotation: -8, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.2)", immediateRender: false }, t0);
    tl.fromTo("#cta", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "none", immediateRender: false }, Math.max(t0 + 0.6, t1));
  }
  function DAY(txt, t) {                     // nadpis casovej osi; vzhlad a nastup podla K.chrome
    var c = K.chrome;
    if (c === "bubble") {                    // okruhla nalepka: velke je vzdy cislo, maly je popis ("3 HOURS" -> 3 / HOURS, "DAY 1" -> DAY / 1)
      var parts = txt.split(" "), numFirst = /^[#0-9]/.test(parts[0]), big = numFirst ? parts[0] : parts.slice(1).join(" ") || parts[0],
        small = numFirst ? parts.slice(1).join(" ") : (parts.length > 1 ? parts[0] : ""), fs = big.length <= 3 ? 1 : big.length <= 5 ? 0.7 : 0.52;
      var bb = '<b style="display:block;font-size:' + fs + 'em">' + big + "</b>", ss = small ? "<small>" + small + "</small>" : "";
      S("#dayTxt", { innerHTML: numFirst ? bb + ss : ss + bb }, t);   // "3 HOURS" -> 3 nad HOURS; "DAY 1" -> DAY nad 1
    } else S("#dayTxt", { textContent: txt }, t);
    if (c === "sticky") tl.fromTo("#dayIn", { rotation: -16, scale: 1.25, y: -50, transformOrigin: "50% 0%" },
      { rotation: 0, scale: 1, y: 0, duration: 0.34, ease: "back.out(1.8)", immediateRender: false }, t);
    else if (c === "stamp") {
      tl.fromTo("#dayIn", { scale: 1.9, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.14, ease: "power3.in", immediateRender: false }, t);
      tl.fromTo("#dayIn", { x: -8 }, { x: 0, duration: 0.3, ease: "elastic.out(1, 0.3)", immediateRender: false }, t + 0.14);
    } else if (c === "bubble") tl.fromTo("#dayIn", { scale: 0, rotation: -40, transformOrigin: "50% 50%" },
      { scale: 1, rotation: 0, duration: 0.42, ease: "back.out(2.2)", immediateRender: false }, t);
    else tl.fromTo("#dayIn", { rotationX: -100, scale: 1.2, transformPerspective: 900 },
      { rotationX: 0, scale: 1, transformPerspective: 900, duration: 0.38, ease: "back.out(1.7)", immediateRender: false }, t);
  }
  function RING(cx, cy, t, dur) {
    S("#ring", { attr: { cx: cx, cy: cy } }, t); O("#ring", 0, 1, t, 0.02);
    AT("#ring", { r: 0 }, { r: 1500 }, t, dur, "power2.in"); O("#ring", 1, 0, t + dur - 0.02, 0.02);
  }
  function REVEAL(id, cx, cy, t, dur) {
    dur = dur || 0.27;
    S("#" + id, { opacity: 1, x: 0, y: 0, rotation: 0 }, t);
    tl.fromTo("#" + id, { clipPath: "circle(0px at " + cx + "px " + cy + "px)" },
      { clipPath: "circle(1500px at " + cx + "px " + cy + "px)", duration: dur, ease: "power2.in", immediateRender: false }, t);
    RING(cx, cy, t, dur);
  }
  function SLIDE(id, t) {
    S("#" + id, { opacity: 1, clipPath: "circle(1500px at 540px 960px)" }, t);
    tl.fromTo("#" + id, { x: 1150, rotation: 4 }, { x: 0, rotation: 0, duration: 0.4, ease: "power3.out", immediateRender: false }, t);
  }
  function WIPE(id, t, dir) {
    tl.fromTo("#" + id, { y: 0, rotation: 0 }, { y: dir * 2150, rotation: dir * -5, duration: 0.42, ease: "power2.in", immediateRender: false }, t);
    S("#" + id, { opacity: 0 }, t + 0.43);
    S("#" + id, { y: 0, rotation: 0 }, t + 0.45);
  }
  function HIDE(id, t) { S("#" + id, { opacity: 0 }, t); }
  // ---------- prechody svet <-> detail podla K.trans: circle | page | tear | zoom (skript vola len panelIn/Out/Swap)
  var TEAR = (function () { var r = rnd(77), p = [], x; for (x = 0; x <= 100; x += 4) p.push(x + "% " + (0.5 + r() * 2.6).toFixed(2) + "%");
    return "polygon(" + p.join(", ") + ", 100% 100%, 0% 100%)"; })();
  function reset(id, t) { S("#" + id, { opacity: 1, clipPath: "none", x: 0, y: 0, rotation: 0, rotationY: 0, scale: 1 }, t); }
  function panelIn(id, t, cx, cy) {          // svet -> detail (od bodu cx, cy)
    var k = K.trans; cx = cx || 540; cy = cy || 960;
    if (k === "page") { reset(id, t);
      tl.fromTo("#" + id, { rotationY: -96, transformOrigin: "0% 50%", transformPerspective: 2400 }, { rotationY: 0, duration: 0.34, ease: "power2.out", immediateRender: false }, t);
    } else if (k === "tear") { reset(id, t); S("#" + id, { clipPath: TEAR }, t);
      tl.fromTo("#" + id, { y: 1990 }, { y: 0, duration: 0.36, ease: "power3.out", immediateRender: false }, t);
      S("#" + id, { clipPath: "none" }, t + 0.37);
    } else if (k === "zoom") {
      S("#camRot", { transformOrigin: cx + "px " + cy + "px" }, t);
      tl.fromTo("#camRot", { scale: 1 }, { scale: 2.4, duration: 0.3, ease: "power2.in", immediateRender: false }, t);
      reset(id, t + 0.14);
      tl.fromTo("#" + id, { scale: 0.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.5)", immediateRender: false }, t + 0.14);
      S("#camRot", { scale: 1, transformOrigin: "540px 960px" }, t + 0.46);
    } else REVEAL(id, cx, cy, t);
  }
  function panelOut(id, t, dir) {            // detail -> svet (svet musi byt uz zapnuty)
    var k = K.trans;
    if (k === "page") {
      tl.fromTo("#" + id, { rotationY: 0, transformOrigin: "100% 50%", transformPerspective: 2400 }, { rotationY: 96, duration: 0.32, ease: "power2.in", immediateRender: false }, t);
      S("#" + id, { opacity: 0 }, t + 0.33); S("#" + id, { rotationY: 0 }, t + 0.35);
    } else if (k === "tear") { S("#" + id, { clipPath: TEAR }, t);
      tl.fromTo("#" + id, { y: 0 }, { y: 1990, duration: 0.36, ease: "power3.in", immediateRender: false }, t);
      S("#" + id, { opacity: 0 }, t + 0.37); S("#" + id, { y: 0, clipPath: "none" }, t + 0.39);
    } else if (k === "zoom") {
      tl.fromTo("#" + id, { scale: 1, opacity: 1 }, { scale: 0.3, opacity: 0, duration: 0.26, ease: "power2.in", immediateRender: false }, t);
      tl.fromTo("#camRot", { scale: 1.35 }, { scale: 1, duration: 0.36, ease: "power2.out", immediateRender: false }, t + 0.1);
      S("#" + id, { scale: 1 }, t + 0.3);
    } else WIPE(id, t, dir || -1);
  }
  function panelSwap(a, b, t) {              // detail -> iny detail (b musi mat vyssi z-index)
    var k = K.trans;
    if (k === "page" || k === "tear") { panelIn(b, t); HIDE(a, t + 0.4); }
    else if (k === "zoom") { reset(b, t); tl.fromTo("#" + b, { scale: 0.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.5)", immediateRender: false }, t); HIDE(a, t + 0.32); }
    else { SLIDE(b, t); HIDE(a, t + 0.45); }
  }
  function VIG(t, peak) { O("#vig", 0, peak || 0.75, t, 0.05, "power2.out"); O("#vig", peak || 0.75, 0, t + 0.06, 0.3, "power2.in"); }
  function panel(id, z, raw) {               // prazdny panel (close-up) nad svetom; vracia jeho <svg>; raw = vzdy cela obrazovka
    var d = document.createElement("div"); d.className = "panel" + (raw ? " raw" : ""); d.id = id; d.style.zIndex = z || 3;
    d.innerHTML = '<div class="pin"><svg viewBox="0 0 1080 1920"></svg></div><div class="ptape p1"></div><div class="ptape p2"></div>';
    document.getElementById("panels").appendChild(d); return d.querySelector("svg");
  }
  // perioda, ktora deli celu dlzku videa -> nekonecne pohyby sa v slucke nezaseknu
  function loopPeriod(p) { var n = Math.max(1, Math.round(VO.total / p)); return VO.total / n; }

  return { tl: tl, st: st, VO: VO, K: K, at: at, seg: seg, ts: ts, P: P, X: X, XY: XY, O: O, F: F, AT: AT, S: S, rnd: rnd, el: el, svg: svg,
    add: add, draw: draw, CAM: CAM, punch: punch, WORLD: WORLD, DAY: DAY, RING: RING, REVEAL: REVEAL, SLIDE: SLIDE, WIPE: WIPE,
    HIDE: HIDE, VIG: VIG, panel: panel, sceneSet: sceneSet, CTA: CTA, loopPeriod: loopPeriod, NS: NS, panelIn: panelIn, panelOut: panelOut, panelSwap: panelSwap };
})();
