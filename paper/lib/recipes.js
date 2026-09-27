// Recepty = hotove mini-choreografie, z ktorych rezisér (compose.py) sklada video. Kazdy recept(t, arg) pracuje nad
// aktualnou postavou a prostredim (PF.R.init) a vracia, kam ma ist kamera ("face" | "body" | "legs" | "arms" | null).
// Recepty, ktore trvalo menia stav, si zaregistruju navrat (PF.R.reset(t) -> vsetko ako v prvom snimku, kvoli slucke).
PF.R = (function () {
  var C = { face0: "smile" }, undo = {}, badgeN = 0;
  function init(ctx) { C = Object.assign({ face0: "smile" }, ctx); }
  function dirty(k, fn) { undo[k] = fn; }
  function clean(k, t, d) { if (undo[k]) { undo[k](t, d || 0); delete undo[k]; } }
  function reset(t, d) { Object.keys(undo).forEach(function (k) { undo[k](t, d || 0); }); undo = {}; }   // d > 0 = plynulo
  var FACES = {
    neutral: ["eyesN", "mO", 0, 0, 0, 0], smile: ["eyesN", "mSmile", 0, 0, 0, 0], happy: ["eyesHap", "mBig", 0, 0, -6, 0],
    worried: ["eyesN", "mWob", -12, 12, -2, 0], shocked: ["eyesN", "mO", -6, 6, -12, 0], tired: ["eyesN", "mWob", 8, -8, 4, 0.45],
    sleepy: ["eyesN", "mO", 6, -6, 4, 0.72], angry: ["eyesN", "mWob", 18, -18, 6, 0.2], pain: ["eyesN", "mWob", 14, -14, 4, 0.38],
    pant: ["eyesN", "mPant", -10, 10, 0, 0.15], dry: ["eyesN", "mDry", -18, 18, -2, 0], sick: ["eyesN", "mSick", -10, 10, 2, 0.3],
    dizzy: ["eyesSp", "mWob", -8, 8, -4, 0], excited: ["eyesN", "mBig", -8, 8, -10, 0]
  };
  function setFace(t, name, dur) {
    var f = FACES[name] || FACES.neutral, H = C.hero;
    H.eyes(f[0], t); H.mouth(f[1], t); H.brows(f[2], f[3], f[4], t, dur === undefined ? 0.18 : dur); H.lids(f[5], t, dur === undefined ? 0.14 : 0.01);
  }
  function faceBack(tt, d) { setFace(tt, C.face0, d ? undefined : 0); }   // navrat tvare (d > 0 = plynulo)
  var R = {
    // ---------- tvar
    face: function (t, name) {
      var H = C.hero; clean("sick", t);
      setFace(t, name);
      if (name === "dizzy") H.spin(t, 1.2);
      if (name === "sick") { H.sick(0, 0.5, t, 0.4); dirty("sick", function (tt, d) { H.sick(0.5, 0, tt, d || 0.01); }); }
      dirty("face", faceBack);
      return "face";
    },
    look: function (t, dir) { var v = { up: [0, -12], down: [0, 12], left: [-12, 0], right: [12, 0], cam: [0, 0] }[dir] || [0, 0];
      C.hero.look(v[0], v[1], t, 0.2); dirty("look", function (tt, d) { C.hero.look(C.look0[0], C.look0[1], tt, d ? 0.25 : 0); }); return null; },
    blink: function (t) { C.hero.blink(t); return null; },
    // ---------- telo (trvale zmeny)
    puffy: function (t) { var H = C.hero; H.headScale(1.1, t, 0.35, "back.out(2)"); H.jowls(true, t);
      dirty("puffy", function (tt, d) { H.headScale(1, tt, d || 0); H.jowls(false, tt, d); }); return "face"; },
    skinny_legs: function (t) { var H = C.hero; H.legsThin(0.5, t, 0.4); dirty("legs", function (tt, d) { H.legsThin(1, tt, d || 0.01); }); return "body"; },
    thin_arms: function (t) { var H = C.hero; H.armThin(0.6, t, 0.5); PF.X(H.p + "up", { sx: 0.93 }, t, 0.5);
      dirty("arms", function (tt, d) { H.armThin(1, tt, d || 0.01); PF.X(H.p + "up", { sx: 1 }, tt, d || 0); }); return "arms"; },
    bigger: function (t) { var H = C.hero; PF.X(H.p + "up", { sx: 1.16 }, t, 0.6, "back.out(1.6)"); H.legsThin(1.15, t, 0.6); H.headScale(1.04, t, 0.6);
      dirty("bigger", function (tt, d) { PF.X(H.p + "up", { sx: 1 }, tt, d || 0); H.legsThin(1, tt, d || 0.01); H.headScale(1, tt, d || 0); }); return "body"; },
    taller: function (t) { var H = C.hero; PF.X(H.p + "legs", { sy: 1.18 }, t, 0.7, "power2.inOut"); PF.X(H.p + "float", { ty: -38 }, t, 0.7, "power2.inOut");
      dirty("taller", function (tt, d) { PF.X(H.p + "legs", { sy: 1 }, tt, d || 0); PF.X(H.p + "float", { ty: 0 }, tt, d || 0); }); return "body"; },
    slump: function (t) { var H = C.hero; H.slump(-12, t, 0.9); H.arm("L", 6, t, 0.8); H.arm("R", -6, t, 0.8); H.lids(0.5, t + 0.2, 0.3); H.look(0, 10, t + 0.2, 0.3);
      dirty("slump", function (tt, d) { H.slump(0, tt, d || 0.01); H.arm("L", C.arms0[0], tt, d || 0.01); H.arm("R", C.arms0[1], tt, d || 0.01); }); return "body"; },
    // ---------- kratke efekty
    sweat: function (t) { C.hero.sweat(t, t + 1.1); return "face"; },
    steam: function (t) { C.hero.steam(t); return "face"; },
    puff: function (t) { C.hero.puff(t); return "face"; },
    pain: function (t) { var ts = [t, t + 0.3, t + 0.6]; C.hero.throb(ts); ts.forEach(function (b) { PF.VIG(b - 0.02, 0.55); PF.punch(b - 0.02); }); C.hero.painOff(t + 1.2); return "face"; },
    heartbeat: function (t, n) { for (var i = 0; i < (n || 4); i++) { PF.VIG(t + i * 0.45, 0.45); PF.punch(t + i * 0.45, 1.018); } return null; },
    shiver: function (t, dur) { var H = C.hero, n = Math.max(3, Math.round((dur || 1.2) / 0.06)) | 1; PF.XY(H.p + "up", { tx: 5 }, t, 0.03, "none", n); return "body"; },
    zzz: function (t, dur) { PF.fx.zzz(660, 600, t, t + (dur || 1.6)); return "face"; },
    stars: function (t, dur) { PF.fx.stars(540, 640, t, t + (dur || 1.6)); return "face"; },
    jog: function (t, dur) { C.hero.run(t, t + (dur || 2.5), 0.42, C.arms0[0], C.arms0[1], 0.3); return "body"; },    // beh na mieste (maraton)
    walk: function (t, dur) { C.hero.run(t, t + (dur || 2.5), 0.7, C.arms0[0], C.arms0[1], 0.15); return "body"; },   // chodza na mieste
    yawn: function (t) { var H = C.hero; H.mouth("mBig", t); H.lids(0.75, t, 0.2); H.arm("L", 150, t, 0.45, "power2.out"); H.arm("R", -150, t, 0.45, "power2.out");
      H.arm("L", C.arms0[0], t + 1.0, 0.45); H.arm("R", C.arms0[1], t + 1.0, 0.45); H.lids(0.3, t + 1.0, 0.2); H.mouth("mWob", t + 1.0);
      dirty("face", faceBack); return "body"; },
    nod: function (t) {                      // mikrospanok: oci sa zavru (ciarky), hlava klesne, trhne sa hore
      var H = C.hero; H.eyes("eyesCl", t + 0.12); PF.X(H.p + "head", { r: 10, ty: 18 }, t, 0.35, "power2.in"); PF.X(H.p + "head", { r: 0, ty: 0 }, t + 0.55, 0.12, "back.out(2)");
      H.eyes("eyesN", t + 0.55); H.lids(0.1, t + 0.55, 0.08); H.brows(-10, 10, -10, t + 0.55, 0.1);
      dirty("face", faceBack); return "face"; },
    thumbs_up: function (t) {                // palec hore na chvilu, potom ruka sama klesne (inak by ostala hore cele video)
      var H = C.hero; H.eyes("eyesHap", t); H.mouth("mBig", t); H.arm("R", -160, t - 0.05, 0.4, "back.out(1.6)"); H.thumb(true, t + 0.12);
      H.thumb(false, t + 1.35); H.arm("R", C.arms0[1], t + 1.25, 0.4); H.eyes("eyesN", t + 1.3);
      dirty("face", faceBack); return "body"; },
    recover: function (t) {                  // spamata sa: vsetko (nalada, telo, tvar) sa plynulo vrati, usmeje sa
      var H = C.hero; reset(t, 0.6); setFace(t + 0.02, "happy"); H.look(0, 0, t, 0.25);
      dirty("face", faceBack); return "body"; },
    wave: function (t) { var H = C.hero; H.arm("R", -150, t, 0.25, "back.out(1.6)"); H.armWave("R", -120, t + 0.25, 0.16, 3); H.arm("R", C.arms0[1], t + 0.9, 0.3); return "body"; },
    hallucinate: function (t) { var H = C.hero; PF.fx.hallucinate(t, 1.2); H.eyes("eyesSp", t); H.spin(t, 1.6); PF.fx.stars(540, 640, t, t + 1.8);
      H.eyes("eyesN", t + 1.9); H.look(10, -6, t + 1.9, 0); H.brows(-6, 20, -6, t + 1.9, 0.15);   // spamata sa, pozre bokom
      dirty("face", faceBack); return "body"; },
    // ---------- prostredie (noc / horucava / zima) - vzdy len jedna nalada, predosla sa vrati
    mood: function (t, name, t1) {
      clean("mood", t); if (!name || name === "normal") return null;
      var back = C.env.mood(name, t, t1), H = C.hero;
      if (name === "hot") H.heat(true, t + 0.3);
      if (name === "cold") { H.tint("#8fb8f0", 0, 0.45, t + 0.3, 0.6); }
      dirty("mood", function (tt, d) { back(tt, d); if (name === "hot") H.heat(false, tt, d || 0.01); if (name === "cold") H.tint("#8fb8f0", 0.45, 0, tt, d || 0.01); });
      return "body";
    },
    // ---------- udaje
    badge: function (t, big, small, t1) {    // papierovy odznak so stat. udajom v volnej zone prostredia (inak nic - kompilator da panel)
      var z = C.env.badgeZone; if (!z) return null;
      var id = "bdg" + (++badgeN), fs = big.length > 4 ? 52 : 66;
      PF.add("M", '<g id="' + id + '" opacity="0" filter="url(#cut)"><circle cx="' + z.x + '" cy="' + z.y + '" r="' + z.r + '" fill="#fbf5ea" stroke="' + C.accent + '" stroke-width="8"/>' +
        '<text x="' + z.x + '" y="' + (z.y + (small ? 4 : 22)) + '" style="font-family:Pop;font-weight:600;font-size:' + fs + 'px;fill:' + C.accent + ';text-anchor:middle">' + big + '</text>' +
        (small ? '<text x="' + z.x + '" y="' + (z.y + 50) + '" style="font-family:Hand;font-weight:700;font-size:26px;fill:#2b2320;text-anchor:middle;letter-spacing:2px">' + small + '</text>' : "") + '</g>');
      PF.P(id, z.x, z.y, { s: 0.3 }); PF.O("#" + id, 0, 1, t, 0.08); PF.X(id, { s: 1 }, t, 0.42, "back.out(2)");
      if (t1) PF.O("#" + id, 1, 0, t1 - 0.2, 0.2);
      return null;
    },
    metric: function (t, txt) { C.env.metric(txt, t); return null; },
    // ---------- sklenena postava (voda / organy)
    level: function (t, pct) { if (!C.hero.level) return null; C.hero.level(pct, t, 0.9); dirty("level", function (tt, d) { C.hero.level(C.level0, tt, d || 0.01); }); return "body"; },
    organ_off: function (t, name) { C.hero.organOff(name, t); dirty("organ_" + name, function (tt) { C.hero.organOn(name, tt); }); return "body"; }
  };
  // ---------- kamera podla sady K.cam: recept vrati ciel ("face"...), R.focus sa tam presunie (bez prekryvania pohybov)
  var CAMS = {
    calm: { face: [1.45, 540, 780], body: [1.0, 540, 990], legs: [1.25, 540, 1200], arms: [1.28, 540, 1040], wide: [1.0, 540, 960], dur: 0.5, ease: "sine.inOut" },
    dynamic: { face: [1.6, 548, 790], body: [1.06, 528, 980], legs: [1.36, 540, 1220], arms: [1.38, 560, 1030], wide: [1.0, 540, 960], dur: 0.32, ease: "power3.out" }
  };
  var camNow = "wide", camFree = 0;
  R.focus = function (name, t) {
    if (!name || name === camNow) return;
    var k = CAMS[PF.K.cam] || CAMS.calm, c = k[name], t0 = Math.max(camFree, t - k.dur * 0.7);
    PF.CAM(c[0], c[1], c[2], t0, k.dur, k.ease); camFree = t0 + k.dur + 0.02; camNow = name;
    if (PF.K.cam === "dynamic") PF.punch(t0 + k.dur, 1.018);
  };
  R.camSet = function (name, t) { var c = (CAMS[PF.K.cam] || CAMS.calm)[name]; PF.CAM(c[0], c[1], c[2], t, 0); camNow = name; camFree = t + 0.01; };
  R.camHold = function (t) { camFree = Math.max(camFree, t); camNow = "push"; };   // kamera je obsadena (napr. pomaly najazd v hooku)
  // koniec videa bez zakrytia: vsetko sa plynulo vrati do stavu prveho snimku, kamera na celok, zjavi sa hook (slucka)
  R.settle = function (t, tot) {
    reset(t, 0.6); setFace(t + 0.08, C.face0); C.hero.look(C.look0[0], C.look0[1], t + 0.08, 0.25);
    var t0 = Math.max(camFree, t), dur = Math.max(0.2, Math.min(0.9, tot - 0.35 - t0));
    PF.CAM(1.0, 540, 960, t0, dur, "sine.inOut"); camNow = "wide"; camFree = t0 + dur;
    PF.O("#day", 1, 0, t, 0.3); PF.O("#hook", 0, 1, tot - 0.8, 0.4);
  };
  R.beats = function (t0, t1, dt) { var a = []; for (var t = t0; t < t1 - 0.05; t += dt) a.push(+t.toFixed(3)); return a; };
  R.init = init; R.reset = reset; R.dirty = dirty; R.clean = clean; R.setFace = setFace;
  return R;
})();
