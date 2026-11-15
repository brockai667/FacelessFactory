# MOMENTS.md - reference for writing new moments (paper cut-out engine)

Sources read: `lib/moments.js`, `lib/recipes.js`, `lib/core.js`, `lib/char_biped.js`, `lib/fx.js`, top tables + `world_actions` of `engine/compose.py`.
Comments in the code are Slovak; this file is English. "unclear" = not determinable from the code.

## 0. How an action becomes a call

Spec action: `{"r": "<name>", "arg": ..., "at": "<word>" | "@<sec>", "o": {...}}` (in a beat's `shots[].do`, or `hook_do`, or `end.do`).

- `r` in `MOMENTS` -> `F(PF.M.<r>(t, arg, t1, o), t)`. `t` = absolute time of word `at` (`PF.at`) or `s0(key)+sec` for `"@sec"` (seconds from sentence start). No `at` -> `t0 + 0.45 + j*0.9`.
- `t1` = end time of the shot (next sentence start). `o` is `{}` if absent.
- `F = R.focus`: the moment's return value (`"face"|"body"|null`) moves the camera. In the hook (`in_hook=True`) the call is emitted WITHOUT `F` -> return value ignored.
- Other `r`: `mood` -> `R.mood(t,arg||"normal",t1)`; `badge` -> `R.badge(t,String(arg),action.small,t1)` (`small` is a key of the ACTION, not of `o`); `heartbeat` -> `R.heartbeat(t,int(arg||4))`; `ADUR` recipes (shiver, zzz, stars, jog, walk) -> `R.x(t, float(arg||default))` (jog/walk clamped to `t1-t-0.3`, min 0.8); `face/look/level/organ_off` -> `R.x(t,arg)`; everything else `R.x(t)`.
- Actions are sorted by the word index of `at` (`@sec` actions sort first, by seconds), because state-based API (`PF.X`, `st`) needs chronological calls.
- SFX come from `SFX_R[r]` (list, or dict keyed by `arg`), played at anchor + offset. With a dict: the `None` key (in pack JSON the `""` key) is used ONLY when the action has no `arg`; an `arg` that is not a key gets no sound. Number args are looked up as `str(arg)`.
- Silent blinks `hero.blink(t0+1.2)` (+`t0+2.9` if shot > 3.2 s) are added unless some action in the shot is in `NOBLINK` or in a hard-coded list (face, slump, yawn, nod, recover, hallucinate, thumbs_up, bury, struggle, spin, reach, release, rewind, airpocket, spit, wayup, armup, drink, jug, snake, suck, venom, ride, antivenom, breath, pant, water, burn, gauge, co2, alarm). Packs set `"noblink": true` in JSON.
- `RDUR[name]` = nominal duration (default 0.6 for unknown); used by compose for timing (e.g. end tail). Camera focus: `R.focus(name,t)`.
- v2 specs (`"v": 2`) also load `moments.js` and `pack_*.js` for moments used. `PF.M.handheld()` is emitted automatically in the hook of v2 videos.

Packs (`lib/pack_<name>.js` + `lib/pack_<name>.json`): JSON `{"moments": {"name": {"dur": 1.2, "sfx": [["pop.wav", 0, 0.6]] | {"<arg>": [[...]], "": [[...]]}, "noblink": true}}}`. Name must match `[a-z][a-z0-9_]*`, must not exist in RECIPES/FACES, the JS must contain `M.<name> =` (regex check), sfx files must exist in `assets/sfx/`. sfx tuple = `[file, offset_s_from_anchor, volume]`. Whole pack is rejected on any error (errors go to `PACK_ERR`). A pack is loaded after `moments.js` and only into videos that use one of its moments. Skeleton of `lib/pack_<name>.js`:

```js
// pack_elevator.js - momenty pre video 036 Falling Elevator
(function () {
  var M = PF.M, H = M._h, tl = PF.tl, R = PF.R, C = H.C, UI = H.UI, st = H.st;
  M.shaft = function (t, arg, t1, o) {
    o = o || {};
    if (!st.shaft) { st.shaft = 1; /* build DOM once, opacity 0 */ R.dirty("shaft", function (tt, d) { PF.O("#mo_shaft", 1, 0, tt, d || 0.01); }); }
    /* tweens on tl at absolute time t */
    return "body";               // "body" | "face" | null = camera target
  };
})();
```

Rules for packs: ids start with `mo_<pack>` (no clash with ids in the catalog), every persistent change has an `R.dirty` undo, nothing fades in at frame 0 that is not there at the last frame (loop), no `Math.random` (use `PF.rnd(seed)`), no negative timeline times. Existing moments may be called from a pack (`M.stamp(t, "TEXT", t1, {})`).

## 1. Moments catalog (file order of `M` in moments.js)

Legend: signature is `M.name(t, arg, t1, o)`. "dirty" = keys passed to `R.dirty` (removed by `clear` / `R.clean`). "ret" = camera target. Ids use `uid()` (counter `n`, shared by all) where `<n>` appears. Element ids with fixed names are single-instance (second call re-uses / re-animates them, or creates a duplicate - unclear for most).

| name | arg / modes | `o` (defaults) | on screen | dirty | ret | ids / notes |
|---|---|---|---|---|---|---|
| handheld | none | - | whole `#camRot` swings rotation +-0.4 deg all video (loop-safe period) | - | undefined (no return) | called from time 0; returns early if `VO.total` is 0 |
| shake | arg = amplitude px (10) | dur 0.35 | camera shake | - | null | uses `shake()` helper |
| closeup | - (arg ignored) | zoom 1.5, fy 800 | camera zooms to the hero's face, follows hero rotation/offset (0.45 s, power2.out) | - | null | uses `R.camTo`; no undo (camera reset by `R.settle`) |
| bury | `"snow"` (default, from top) / `"sand"` / `"water"` (from bottom) | dur 0.85 | full-screen blob of material sweeps over the picture with flying chunks, shake, punch; then fades to reveal `encase` view | (via encase: encase, face) | null | panel `mo_bu<n>` z4 raw, `mo_bu<n>g`, chunks `mo_bu<n>c0..9`; calls `OV()`, `M.encase(t+dur+0.02, mat)` |
| encase | mat as bury | - | "inside the material" view: gradient backdrop, lumps, falling flecks, cavity around hero; hero moved (-20,70) rotated -28, no shadow, tinted (snow/water), face worried | `encase`, `face` | null | `#mo_enc` inserted before `<p>float` (behind hero), `mo_encPk`, `mo_encL`, `mo_fk0..15`, front blur layer `#mo_encF` in layer F, gradient `mo_gIn`; built once with the FIRST material |
| squeeze | - | dur 0.45 | cavity shrinks around hero (needs `encase` first - `PF.P("mo_encPk")` throws otherwise), shake, punch, face pain | `squeeze`, `face` | body | scales `mo_encPk`, `mo_encF`, `<p>float` |
| buddy | - | outfit "hoodie", hair, skin "#c98d62", skinDark, hairColor, suit "#3f8f6b", suitDark, dx 185 | second clothed character (id `buddy`) appears at right, waves; hero shifts left by dx | `buddy` | body | creates `PF.charBiped({id:"buddy",...})` lazily; ids `buddy_*`, `buddy_float` |
| struggle | - | dur 1.0 | arms/head jitter, face angry + sweat, then worried; hands stay in place | `face` (via R.face) | body | |
| spin | - | dur 2.2 (min 1.2, capped by t1-t-0.25) | hero rotates 360 deg, spiral eyes, 5 big "?" in overlay | `face` | body | `mo_q<n>` in `OV()` (screen coords) |
| mask | - | cy 922, dur 1.0 | ice mask grows in front of mouth/nose (in head group) | `mask` | null | `#mo_mask` appended to `<p>head` |
| reach | - | - | light + hole at top, orange rescuer arm with red glove reaches down; hero raises right arm (-165), face excited, looks up; cleans timer/people/step/spit/wayup first | `reach`, `face` | null | `mo_hand`, `mo_hole`, `mo_handG` in `OV()` |
| release | - | - | white flash, cleans many keys (squeeze, airpocket, spit, wayup, armup, step, encase, mask, reach, timer, people), face happy, hop | `face` | body | uses `#mo_flash` (from `UI()`) |
| airpocket | - | - | palms in front of mouth + dashed breathing air bubble | `airpocket` | body | `#mo_air` in `<p>up`; arms L -108 / R 108 |
| spit | - | - | drop falls from mouth + dashed arrow "DOWN"; cleans airpocket; face shocked | `spit` | body | `mo_sp<n>` in layer M (world coords via `pt`) |
| wayup | - | - | big green arrow "UP" right of the hero; hero looks up | `wayup` | body | `mo_up<n>` in layer M; x = min(900, hero x + 320), y 900 |
| armup | - | y 380, sleeve "#e98a2b", skin | R arm shoots up; circular inset (top right, `.mo-inset`) shows an arm waving out of snow with a ping ring | `armup` | body | `#mo_in`, `#mo_inIn`, `#mo_inH`, `#mo_inP` (HTML) |
| step | arg = step number | y 150, text, size | numbered red-circle step card at top; new call replaces the previous; punch; cleans airpocket/spit/wayup | `step` | null | `mo_sx<n>` (`.mo-step`) |
| rewind | - | dur 0.8, y 425, text "REWIND" | stamp-like "<<" REWIND banner, white scan bars, shake; timer counts back to 0 (if present), cleans squeeze/mask/people/timer; face shocked | `face` (via `R.face`) | body | `mo_rw<n>` `.mo-stamp` + bars `mo_rw<n>b0..2` |
| timer | arg = target in MINUTES (to `mm:ss`) | dur 1.0, y 150, label "TIME", color | paper stopwatch card top-centre; later calls continue from last value (smoothstep) | `timer` (first call only) | null | `#mo_tm`, `#mo_tmIn`, `#mo_tmD`; state `st.tm.v` (seconds) |
| people | arg = k survivors of N | of 10, y 386 | row of green person icons in a paper card; icons beyond k grey out; later calls remove more | `people` | null | `#mo_pp`, `mo_pp0..N-1` |
| stamp | arg = text, lines split by `\|` | y 240, rot -6, size (font px), hold 1.6, over | red stamp slams in (scale 2.6 -> 1), punch + shake; fades after hold or before t1 | - | null | `mo_st<n>` `.mo-stamp` |
| card | arg = title | text [lines], size, y 1120 | taped paper card slides up from bottom, stays to the end | `card` | null | fixed ids `#mo_cd`, `#mo_cdIn` (single instance) |
| _lvl | internal (level 0-1, t, dur) | - | animates bottle water | - | - | not an action |
| bottle | `"show"` = lift and show (anything else = only create) | hold 0.9 | water bottle in right hand, present from frame 0 (no opacity tween); show: arm up to -104, bottle upright, shakes | `bottle` (at creation) | null | `#mo_bt` inserted before `<p>handR`; `#mo_btW` water; clip `mo_btC`; state `st.bt.v`; MUST be called before `drink` |
| drink | arg = target level 0-1 | gulps 3 | bottle to mouth, eyes closed, gulps, water drops, face happy -> smile, puff | `face` | body | requires `st.bt`; cleans `slump` |
| meter | arg = value 0-1 | y 600, label "WATER<br>IN YOU", dur 0.8, ease, flash | left paper card with vertical gauge. First call shows it (and returns), later calls change level; <0.42 turns red + shakes; `flash` = green arrow | `meter` | null | `#mo_mt`, `#mo_mtIn`, `#mo_mtW`, `#mo_mtUp`; `.mo-left .mo-meter` |
| jug | - | y 620, label "SWEAT IN<br>1 HOUR", dur 1.7, hold 3.4, over | right card: clock hand turns once while a measuring jug fills "1 L"; sweat drops fly from head into it (screen-space UIS); face pant | `face` | body | `mo_jg<n>` (`.mo-right .mo-side`), drops `mo_jg<n>d0..8` |
| spot | arg = `"head"` or other (= right hand) | r 108, color "#d9483b", hold 2.0, text, size 66, tcolor, dx, below | dashed red ring with label around head/hand ("look here"), rotates | - | body | `mo_sp<n>` in M layer (`headPt`/`handPt`) |
| choice | `"A"`/`"B"` show card, `"small"` shrink to strip, `"big"` restore, `"off"` hide | y 196, text (card text) | two cards A (orange) / B (blue) at top; A/B slide in one by one | `choice` | null | `#mo_ch`, `#mo_chIn`, `#mo_chA/B`, `#mo_chAt` (text), `#mo_chAx` (X), `#mo_chAok`; `big` cleans `step` |
| pick | arg = `"A"`/`"B"` | mark `"x"` (wrong, greys) or `"ok"` (green) | card pulses; with mark: X/tick stamped; no mark = tapping | - | null | needs `choice` ids |
| cardie | - | - | desert only: car (`#fd_dsCar`) shakes, dark smoke puffs. Returns null silently if the car does not exist | - | null | `mo_cx<n>` |
| cover | - | color "#f4efe2", stroke, rays 3 | hat drops on head (bounce), sleeves extend to wrists, sun rays bounce off hat | `cover` | body | `#mo_hat` in head, `.mo_slv` sleeves (class), rays in UIS |
| shade | - | - | two poles + awning unfold, hero darkens (tint "#2e2a4a") | `shade` | body | `#mo_sh` before `<p>float` (behind hero): `mo_shP1/P2/T/S` |
| perch | - | - | spare tyre rolls in from right, hero jumps onto it | `perch` | body | `#mo_ty`; moves `<p>float` ty -42 |
| thermo | - | y 620, label "HOW HOT", hold 3.0, over | right card with 2 thermometers SAND vs AIR, sand fills higher | - | null | `mo_th<n>` |
| aerial | - | y 620, label "FROM THE AIR", hold 3.6, q 1.5, over | right card: top-down desert, plane flies, car glints, hero a dot, "?"; calls `M.hail` | `look` | body | `mo_ae<n>` |
| hail | - | n 5, face | left arm waves overhead | `face` only if `o.face` | body | |
| snake | undefined = idle wiggle, `"strike"`, `"back"` | - | snake in grass left of hero, there from frame 0 (no opacity tween); strike: bites left hand, red flash, bite marks, shake; back: ends everything snake-related | strike: `snake`, `bite`, `face`; back: cleans sling, ride, venom, antivenom, hand, step, bite, snake | body (null for idle) | `#mo_sn`, `#mo_snT`; hand circle gets id `mo_hL`, `#mo_bite`, `#mo_biteP`; state `st.sn` (stores hand fill/stroke) |
| hand | `"show"`, `"swell"`, `"ring"`, `"watch"`, `"off"` | y 540 | round inset left: bitten hand with 2 wounds, ring, watch; swell grows and reddens (also hero left hand); ring/watch fly off | `hand` (on show) | null | `#mo_hd`, `#mo_hdIn`, `.mo_hdS/.mo_hdF`, `#mo_hdH/R/W/P` |
| movie | - | hold 4, x 50, y 1150 (clapper pos) | full-screen old-film look: sepia, dark frame, scratches, clapperboard "MOVIE"; ends by t1-0.1 | - | null | `mo_mv<n>` (HTML) |
| suck | - | hold 1.9 | hero sucks the wound (arm to mouth), green drops fly off to the left | `face` | body | drops in UIS, `mo_sk<n>d0..2` |
| vial | `"pct"` = slam "<1%"; else create | y 600, label "LAB TEST" | right card with 2 test tubes (venom, what was sucked out) | `vial` | null | `#mo_vl`, `#mo_vlIn`, `#mo_vlT` |
| count | arg = number | dur 2.3, y 280, label "UP TO", sub, size 128, hold 9 | big red counter card top-centre counting from 0 with thousands separator; intermediate values rounded to 100s (so small numbers < 100 stay 0 until the end: unclear if intended) | - | null | `mo_ct<n>`; ends by t1-0.12 |
| _vn | internal (venom progress 0-1) | - | dash-offset animation of venom trail | - | - | |
| venom | `"move"` (hero runs, trail climbs to chest), `"still"` (hero stands, trail pauses, pause sign), `"back"` (retreats); other = show | dur 1.6, to 0.9 | green trail from left hand up the arm to chest + red heart blob | `venom` | body (move/still), null | classes `.mo_vnG/.mo_vnA/.mo_vnT` (in `<p>armL` and `<p>up`), `#mo_vnH`, `#mo_vnP` |
| sling | - | - | left arm into a cloth sling across chest | `sling` | body | `#mo_sl` in `<p>up` |
| ride | `"sign"` = hospital sign pops | - | red car pulls in from right; face smile | `ride`, `face` | body | `#mo_car`, `#mo_hsp` |
| antivenom | - | y 600 | left card with ampoule + green tick; calls `venom back` if active; face happy | `antivenom`, `face` | body | `#mo_av` |
| clear | arg = comma list of dirty keys e.g. `"timer,o2,step"` | - | removes those moments (0.15 s fade) | - | null | calls `R.clean(key, t, 0.15)` per key |
| breath | `"hold"`, `"zero"`, `"out"`, `"badge"` | y 118 (hold) / 420 (badge), ring (false = no ring), keep 0.7, rest 1.0, hold 9, check 1.0, x 300 (badge) | hold: inhale, chest up, cheeks puffed, mouth shut (`H.mouth("none")` hides ALL mouths + line `mo_brM`), ring with countdown 10 top; zero: countdown lands exactly at t (1 digit = 1 s), red face tint, head shakes last 3 s, ring turns green "BREATHE"; out: exhale puffs, face pant; badge: small "SECONDS" ring with green tick | `breath`, `face` (hold) | body (hold/out), null (zero/badge) | `#mo_br/#mo_brIn/#mo_brA/#mo_brD/#mo_brL/#mo_brK` (HTML+SVG), `#mo_brM` (head), `#mo_brRed` (after `<p>sick`); `out` also calls gauge drop / co2 out / alarm off if active |
| gauge | `"drop"` or default (rise) | y 690 | right card "PRESSURE" half-dial, needle to red and trembles; chest pulses | `gauge` | body | `#mo_gg`, `#mo_ggN` |
| o2 | `"doubt"`, `"full"`, `"pct"`, `"check"`, `"off"` | y 640 | left card with oxygen cylinder: doubt = almost empty + blinking "EMPTY?"; full = actually ~full (blue); pct = "92%"; check = green tick | `o2` | null | `#mo_ox`, `#mo_oxIn`, `#mo_oxW/E/P/K` |
| co2 | `"pile"` (default), `"glow"`, `"out"`, `"off"` | dur 1.5 | grey "CO2" bubbles pile up in belly/chest (on `<p>up`); glow pulses; out = float away | `co2` (re-registered, `out` sets a no-op) | body (null for out/off) | `#mo_coG`, `mo_co0..8`; state `st.co` |
| alarm | `"ring"` (default), `"sock"`, `"off"` | x 790, y 410 (absolute px), hold 3, lead 0.5 | yellow alarm bell top-right rings; sock = sock covers it | `alarm` | null | `#mo_al` (HTML), `#mo_alB/W/S` |
| burn | - | hold 1.6, face (false = no face change) | flame in chest | `face` (unless `o.face===false`) | body | `#mo_bn`, `#mo_bnF` in `<p>up` |
| pant | - | hold 2.2 | fast breathing, CO2 bubbles fly off; ends dizzy | `face` | body | `mo_pt<n>b<i>` in UIS |
| water | default = water rises to chest, `"x"` big red X, `"dark"` blackout + bubbles + silent bell "NO ALARM", `"off"` | level 1010 (px y), dur 0.6, bell 1.05 | full-screen HTML overlay `#mo_wt` (water over the picture); dark: hero tilts r 9, eyes closed | `water` | body (null for x/dark) | `#mo_wt`, `#mo_wtW/V/X/D/B`, bubbles `mo_wtU0..5` |

Note: `R.face(...)` always registers the `face` key, so every moment calling it (encase, squeeze, struggle, spin, reach, release, rewind) implicitly owns `face`; `R.setFace(...)` does not.

Shared-state quirk: moments keep their state in module `st` (`st.tm, st.pp, st.ch, st.bt, st.sn, ...`). `st` is never reset by `R.clean`, only the visuals are; so a moment first called after `clear` re-uses old DOM.

## 2. Recipes catalog (`PF.R`, usable as `r` in specs)

Allowed set (`RECIPES` in compose.py): face, look, puffy, skinny_legs, thin_arms, bigger, taller, slump, sweat, steam, puff, pain, heartbeat, shiver, zzz, stars, yawn, nod, thumbs_up, wave, hallucinate, mood, badge, level, organ_off, recover, jog, walk (+ all moments). `blink` and `metric` exist in `R` but are NOT in `RECIPES` (cannot be used from a spec). Return value = camera target.

| name | arg | effect | dur (RDUR/ADUR) | dirty | ret |
|---|---|---|---|---|---|
| face | face name (section 3) | sets face; `dizzy` also spins eyes 1.2 s; `sick` fades green overlay `<p>sick` | 0.6 default | `face` (and `sick`) | face |
| look | up/down/left/right/cam | pupils shift 12 px | 0.6 | `look` | null |
| puffy | - | head x1.1, cheeks (jowls, clothed only) | 0.4 | `puffy` | face |
| skinny_legs | - | legs sx 0.5 | 0.45 | `legs` | body |
| thin_arms | - | arms sx 0.6, torso sx 0.93 | 0.5 | `arms` | arms |
| bigger | - | torso sx 1.16, legs 1.15, head 1.04 | 0.6 | `bigger` | body |
| taller | - | legs sy 1.18, float ty -38 | 0.7 | `taller` | body |
| slump | - | torso r -12, arms drop, lids 0.5, looks down | 0.9 | `slump` | body |
| sweat | - | sweat drop on temple, evaporates (1.1 s) | 1.2 | - | face |
| steam | - | 3 steam wisps above head | 1.0 | - | face |
| puff | - | small puff cloud at mouth | 0.6 | - | face |
| pain | - | 3 head throbs + red pain marks + vignette + punch (0.3 s apart) | 1.3 | - | face |
| heartbeat | n beats (default 4) | vignette + camera punch every 0.45 s (not char) | 1.9 | - | null |
| shiver | seconds (1.4) | torso jitter tx 5 | ADUR 1.4 | - | body |
| zzz | seconds (1.4) | "Z" letters rise from head | ADUR 1.4 | - | face |
| stars | seconds (1.4) | yellow stars around head | ADUR 1.4 | - | face |
| jog | seconds (2.5) | run in place (knees lift 0.3, arms pump) | ADUR 2.5 | - | body |
| walk | seconds (2.5) | walk in place (lift 0.15) | ADUR 2.5 | - | body |
| yawn | - | mouth big, arms stretch up, then back | 1.5 | `face` | body |
| nod | - | micro-sleep: eyes closed, head drops, jerks up | 0.75 | `face` | face |
| thumbs_up | - | right arm up, thumb up, happy; hand returns by itself | 1.7 | `face` | body |
| recover | - | `R.reset(t,0.6)` (everything smooth back), face happy | 0.3 | `face` | body |
| wave | - | right arm waves 3x | 1.25 | - | body |
| hallucinate | - | world sways + hue shift 1.2 s, spiral eyes, stars; then looks aside | 2.0 | `face` | body |
| mood | `night` / `hot` / `cold` / `normal` (default); 3rd arg t1 | env mood (see env.mood); hot: orange heat on hero; cold: blue tint; only one mood at a time (previous cleaned) | 1.0 | `mood` | body |
| badge | big text (action key `small` = caption) | paper badge circle in env `badgeZone` (room only; field/space have none -> nothing happens, compose uses a panel instead); fades at t1-0.2 | - | - | null |
| level | pct | glass hero only: water level (`C.level0` = 60 default) | - | `level` | body |
| organ_off | heart/brain/kid | glass hero: organ flickers and greys out | - | `organ_<name>` | body |

`R.mood` names: room supports night/hot/cold; field night/hot/cold; space night/hot (also triggers env alarm)/cold (+frost).

## 3. Faces (`R.setFace`, FACES table)

Row = `[eyes, mouth, browL rot, browR rot, brow ty, lids 0..1]`. Eyes: `eyesN` normal round with white and pupil; `eyesHap` closed happy arcs (^ ^); `eyesSp` spiral eyes; `eyesCl` closed curved lines (used by moments, no named face). Mouths: `mO` small open oval; `mSmile` smile line; `mBig` big open grin with tongue; `mWob` wavy line; `mDry` open mouth with dry cracks; `mPant` open with tongue (panting); `mSick` wavy frown with green blob. Lids: fraction of eye height covered (x80 px rect).

| face | row | look (derived from the row only) |
|---|---|---|
| neutral | eyesN, mO, 0,0,0, 0 | plain, small open mouth |
| smile | eyesN, mSmile, 0,0,0, 0 | default `face0` |
| happy | eyesHap, mBig, 0,0,-6, 0 | closed happy eyes, big grin |
| worried | eyesN, mWob, -12,12,-2, 0 | wavy mouth, tilted brows |
| shocked | eyesN, mO, -6,6,-12, 0 | brows raised |
| tired | eyesN, mWob, 8,-8,4, 0.45 | half lids |
| sleepy | eyesN, mO, 6,-6,4, 0.72 | nearly closed lids |
| angry | eyesN, mWob, 18,-18,6, 0.2 | strongly tilted brows |
| pain | eyesN, mWob, 14,-14,4, 0.38 | |
| pant | eyesN, mPant, -10,10,0, 0.15 | open mouth with tongue |
| dry | eyesN, mDry, -18,18,-2, 0 | dry cracked mouth |
| sick | eyesN, mSick, -10,10,2, 0.3 | + green overlay `<p>sick` (opacity 0->0.5); note: `H.sick` targets `<p>sick` which is the face overlay circle (see section 5d) |
| dizzy | eyesSp, mWob, -8,8,-4, 0 | spiral eyes, eyes rotate |
| excited | eyesN, mBig, -8,8,-10, 0 | big grin, raised brows |

Which sign of brow rotation is "inner up" vs "inner down": unclear.

## 4. Environments and scenes (`ENVS` in compose.py)

| env | scenes (spec `scene` / beat `scene`) | hero stands (shadow) | notes |
|---|---|---|---|
| `room` | `couch` (default-first), `desk`, `bed` | yes | `PF.envRoom`; has `badgeZone` (per scene); v2 hides `#rm_gauges` (calendar/thermometer); ids `rm_*` (e.g. `rm_win`, `rm_sky`, `rm_calNum`); scenes are `rm_sc_<name>_<M|F>` |
| `space` | `station`, `mars` (mars stands, station floats) | station: floats (`hero.bob`) | `PF.envSpace`; ids `sp_*`; scene groups `sp_sc_<name>_<B|M|F>`; `sp_scr*` screen text; `api.float=true` |
| `field` | `meadow`, `mountain`, `summit`, `road`, `desert` | yes | `PF.envField`; ids `fd_*`; scene groups `fd_sc_<name>_<B|M|F>`; desert has `#fd_dsCar` (used by `cardie`), `fd_dsHeat`, `fd_dsRays`; `env.show(true,0)` called; `badgeZone` null |
| `mountain` | alias of `field` with `scene0="mountain"` | yes | older specs |

Layer system: `PF.sceneSet(prefix, name, on, t, dur)` toggles groups `<prefix>_sc_<name>_<B|M|F>` (B = back, parallax 0.8; M = scene/hero, 1.0; F = foreground, 1.35). Scene switch in a beat = prechod done by the env. `env.scene(...)` signature: unclear (room/space/field each define their own).

## 5. Helper API for writing new moments

### 5a. `PF.M._h` (moments.js helpers)

`var H = PF.M._h; var C = H.C, st = H.st, ...` Exposed: `C, uid, pt, UI, OV, UIS, fmt, shake, LIFT, ap, upPt, handPt, headPt, scr, st, MAT`.

| helper | signature | meaning |
|---|---|---|
| `C()` | -> ctx | `PF.R.ctx()`: `{face0, arms0:[armL,armR], look0:[0,0], level0, accent, hero, env}` |
| `uid(prefix)` | -> `prefix + counter` | unique id; counter shared across all moments (use for repeatable elements) |
| `pt(x, y)` | -> `[X,Y]` world | maps a point in "room" coords through the hero's `<p>float` state (rotation, scale, translate) only. Does NOT apply `up` or `LIFT` -> good for floor/legs level points |
| `UI()` | -> `#mo_ui` div | lazily creates the HTML overlay (1080x1920, z 7, pointer-events none) plus a `<style>` block and `#mo_flash`; append cards with `UI().insertAdjacentHTML("beforeend", ...)` |
| `OV()` | -> svg | `PF.panel("mo_ov", 5, true)` raw full-screen SVG panel, opacity forced 1; SCREEN coordinates (not affected by camera); below `#mo_ui` |
| `UIS()` | -> svg `#mo_uiS` | SVG inside `#mo_ui` (z 2, above cards): screen coordinates; used for flying drops/rays; svg has no viewBox attribute in markup (relies on CSS: `#mo_ui svg` / base.html - exact sizing unclear), elements positioned with `x`/`y` tweens |
| `fmt(sec)` | -> html string | `mm:ss` as `<i>` digit cells (fixed-width digits, class `.mo-dig i`) |
| `shake(t, dur, amp)` | - | camera shake of `#camRot` x/y, ends at 0 (`dur` default 0.3, `amp` 10) |
| `LIFT` | 60 | `charBiped` draws trunk/head/arms inside `translate(0,-60)`; leg/shadow are not lifted. All "up-group" coords must subtract LIFT to become world coords |
| `ap(state, [x,y])` | -> `[X,Y]` | applies a `PF.st[id]` state (tx,ty,r,sx,sy,cx,cy) to a point |
| `upPt([x,y])` | -> world | point in room coords of the upper body (torso/head/arms drawn coords) -> world: applies `<p>up`, then LIFT, then `<p>float` ... implemented as `ap(float, [u.x, u.y - LIFT])` |
| `handPt(side, x, y)` | -> world | point in arm coords (e.g. hand centre `428,1160` L / `652,1160` R) -> world, follows arm rotation |
| `headPt(x, y)` | -> world | point in head coords (e.g. `540,780`) -> world, follows head rotation/scale |
| `scr([x,y])` | -> screen | world -> screen for the camera "body" of the DYNAMIC kit: `540 + 1.06*(x-528), 960 + 1.06*(y-980)`. For calm kit (body = 1.0 @ 540,990) it is slightly off. For anything not at camera "body" it is wrong. Use it only for overlays in `UIS()` right after a `"body"` focus |
| `st` | object | persistent per-video moment state (flags like `st.tm`, `st.bt`) |
| `MAT` | object | materials for bury/encase: `snow/sand/water`: `top` (comes from top), `cols[3]`, `inn[2]` gradient, `lump[3]`, `pocket`, `tint` |

Coordinate systems: WORLD = 1080x1920 SVG user space of layers B/M/F (`#layB/#layM/#layF svg`; camera scales these, parallax 0.8/1.0/1.35). SCREEN = 1080x1920 pixels of the output frame (HTML `#mo_ui`, `OV()`, panels, `UIS()`) - not moved by the camera. Hero coordinates are "room" coords of char_biped (see 5d). Camera: `calm` kit body = scale 1.0 @ (540,990), face 1.45 @ (540,780); `dynamic` body = 1.06 @ (528,980), face 1.6 @ (548,790).

CSS defined in `UI()` (variables `--paper #fbf5ea`, `--ink #2b2320`, `--stamp #d9483b` from base.html; fonts `"Pop"` display, `"Hand"` labels):

| class | meaning / use |
|---|---|
| `#mo_ui` | root overlay, absolute 1080x1920, z 7 |
| `.mo` | row container: `position:absolute; left:0; right:0; display:flex; justify-content:center; opacity:0` - set `style="top:Ypx"`, fade with `PF.O("#id",0,1,t,0.08)` |
| `.mo-left` / `.mo-right` | align row left/right (padding 30 px) - side cards (`meter`, `o2`, `jug`, `thermo`, `aerial`, `gauge`, `vial`, `antivenom`, `hand`) |
| `.mo-paper` | paper card: bg paper, radius 16, hard shadow, Pop 600, centred text; tween `scale 0.4 -> 1, rotation -8 -> -2` with `back.out(2)` for pop-in |
| `.mo-lbl` | block label, Hand 700, 36 px, letter-spacing .12em (inside cards) |
| `.mo-side` | side card: padding 14/16/12, label 30 px, child `svg` 220x270 (viewBox `0 0 220 270`) |
| `.mo-meter` | like side, svg 124x430 (viewBox `0 0 124 430`) |
| `.mo-timer` | stopwatch/counter card: padding 16/40/2; `.mo-dig` 150 px digits, `.mo-dig i` fixed 0.64em cells |
| `.mo-people` | row of 62x98 svg persons |
| `.mo-stamp` | red double-border stamp, 96 px; child `div` is the animated one (`#idIn`) |
| `.mo-card` | taped card (`.mo-tape.a/.b`), label coloured `--stamp`, `b` lines 96 px |
| `.mo-step` | numbered step: red circle `em` 108 px + text 74 px |
| `.mo-inset` | right-aligned circular inset (360 px, paper border); `#mo_inIn` |
| `.mo-ch`, `.mo-mk`, `#mo_chIn` | choice cards A/B (430 px wide, badge `em`) + X/tick marks |
| `#mo_flash` | full-screen flash div (z 3, white); `tl.fromTo("#mo_flash",...)` |

Typical inside use: `<div class="mo mo-right mo-side" id="X" style="top:620px"><div class="mo-paper" id="XIn"><span class="mo-lbl">LABEL</span><svg viewBox="0 0 220 270">...</svg></div></div>` then `PF.O("#X",0,1,t,0.08)` and a scale/rotation tween on `#XIn`.

### 5b. `PF` core (`lib/core.js`)

All animation goes onto ONE paused GSAP timeline `PF.tl` (HyperFrames seeks it frame by frame). SVG groups get transforms from a state table `PF.st[id] = {tx,ty,r,sx,sy,cx,cy}` written as an attr string `translate rotate(cx cy) scale` (not CSS transforms).

| fn | signature | notes / gotchas |
|---|---|---|
| `PF.tl` | GSAP timeline | never use negative times (GSAP shifts the whole timeline); repeating tweens "at 0" (see `encase`) are used for loops |
| `PF.st` | state table | `X` mutates it at CALL time -> calls must be made in chronological order per element |
| `PF.P(id, cx, cy, init)` | register element | sets pivot and initial state (`{s}` = sx=sy) and writes transform; THROWS if element is missing. Must be called before `X`/`XY` on that id |
| `PF.X(id, to, t, dur, ease)` | tween to state | `to` keys tx,ty,r,sx,sy (+`s`); `dur` 0/undefined = instant `tl.set`; default ease `power2.inOut`; updates `PF.st` to the target state (stateful) |
| `PF.XY(id, to, t, dur, ease, rep)` | yoyo pulse | goes to `to` and back, `rep` = yoyo repeat count: use ODD numbers so it ends in the start state; does NOT change `PF.st` |
| `PF.O(sel, a, b, t, dur, ease)` | opacity a -> b | `dur` 0 = set; `sel` is a CSS selector (needs `#`); `ease` default none |
| `PF.S(sel, vars, t)` | `tl.set` | instant set |
| `PF.F(sel, a, b, t, dur)` | fill colour tween | |
| `PF.AT(sel, a, b, t, dur, ease)` | tween SVG attrs (`r`, `y`, `height`...) | `a`/`b` are attr objects |
| `PF.el(tag, attrs, parent)` | create SVG element | parent = DOM element; returns element |
| `PF.add(parent, markup)` | insertAdjacentHTML beforeend | parent: `"B"/"M"/"F"` (layer svg), an element id string, or an element; returns parent |
| `PF.svg(layer)` | layer `<svg>` | `"B"|"M"|"F"` |
| `PF.draw(id, t, dur, ease)` | stroke draw-on for a path | via dasharray |
| `PF.panel(id, z, raw)` | creates `.panel` div (opacity 0) in `#panels`, returns inner `<svg viewBox="0 0 1080 1920">` | `raw` = always full screen (no paper frame); set its opacity with `PF.O("#id",...)`/`PF.S("#id",{opacity:1})` |
| `PF.punch(t, amt)` | camera bump on `#camRot` scale 1 -> amt (default 1.025) -> 1 | |
| `PF.VIG(t, peak)` | red vignette flash | |
| `PF.CAM(s, px, py, t, dur, ease)` | raw camera move | stateful (remembers previous cam); prefer `R.camTo` / `R.focus` |
| `PF.rnd(seed)` | seeded PRNG -> function | deterministic art |
| `PF.at(key, word, nth, which)` | absolute time of a word in sentence `key` ("s" start default, `"e"` end) | warns and falls back to seg start +0.5 if the word is missing |
| `PF.seg(key)` | `[start, end]` of sentence | |
| `PF.VO` | `{start, words, seg, total}` | `total` = video length; `PF.loopPeriod(p)` = period dividing the total length (infinite motions loop cleanly) |
| `PF.K` | kit `{chrome, trans, pres, cam, palette}` | |
| `PF.fx` | `dust, leaves, night, tone, frost, zzz, stars, hallucinate, cloudWipe, blur, unblur` | `cloudWipe(t, dir, cols)` full-screen cloud panel z9, returns time of full cover |
| `PF.panelIn/panelOut/panelSwap`, `PF.REVEAL/SLIDE/WIPE/RING/WORLD/DAY/CTA` | transitions/titles | used by compose, not by moments |

### 5c. `PF.R` (recipes.js) functions for moments

| fn | signature | semantics |
|---|---|---|
| `R.ctx()` | -> ctx | current hero + env + `arms0`, `look0`, `face0`, `level0`, `accent` |
| `R.dirty(key, fn(tt, d))` | register undo | stores ONE function per key (a second call with the same key REPLACES the first). `fn(tt, d)`: undo at time `tt`; `d > 0` = smooth (duration ~d), `d` falsy/0 = instant. Always write `d \|\| 0.01` or `d ? 0.15 : 0.01` so it works both ways |
| `R.clean(key, t, d)` | run + delete one undo | no-op if the key is not registered. Used by `clear` and by moments that tidy up other moments (`d` default 0) |
| `R.reset(t, d)` | run all undos | all keys, in registration order of the object; `d > 0` smooth |
| `R.setFace(t, name, dur)` | set face | eyes/mouth/brows/lids from FACES; does NOT register dirty |
| `R.face(t, name)` | recipe | like setFace + registers `face` dirty (and for sick/dizzy side effects); cleans `sick` first |
| `R.focus(name, t)` | camera target | `"face"|"body"|"legs"|"arms"|"wide"`; waits for `camFree` (no overlapping moves); follows hero rotation/offset; compose passes each action's return value here |
| `R.camTo(t, s, px, py, dur, ease)` | free camera move | no overlap with previous |
| `R.camSet(name, t)`, `R.camHold(t)` | immediate cam / occupy cam | |
| `R.settle(t, tot, o)` | end of video: `R.reset(t, 0.6 or 0.3 if o.fast)`, face -> face0, look -> look0, camera wide, fades `#day`, shows `#hook` at `tot-0.8` | this is the loop-to-first-frame mechanism |
| `R.beats(t0, t1, dt)` | array of times | |
| `R.init(ctx)` | called by compose | |

Why `dirty` matters: the video loops, so the last frame must equal the first frame. `R.settle` calls every registered undo, which therefore must restore ALL persistent state (opacity of overlays, hero parts, arm angles, `PF.st` states you changed with `X`, tint, etc.). A moment that changes something persistent but registers no undo breaks the loop and bleeds into later shots (`clear`/`release`/`recover` also rely on keys). Rule of thumb: elements start at `opacity 0` (or the state they have at frame 0) and `dirty` fades/moves them back. Things that fade themselves out by time (`stamp`, `thermo`, `aerial`) need no dirty. Note: `R.settle` can run before a `dirty` was registered at a later `t` - registration order is build order (chronological), not time order.

### 5d. Hero object (`C().hero` = `PF.charBiped(...)` result)

`H.p` = `"hero_"` (id prefix = `o.id + "_"`; buddy uses `"buddy_"`). Look: `"clothed"` (spec default via compose; outfit suit|tshirt|hoodie|pajamas|labcoat, hairStyle short|long|bun|spiky|curly|bald|cap, glasses, lashes, species human|cat|dog|bear) or `"glass"` (water body + organs; has `level`, `organOff/On`, `bubbles`, `waves`; no jowls).

Part ids (all inside `<p>float`): `<p>float` (pivot 540,1100; whole hero), `<p>shadow`, `<p>legs` (pivot 540,1236) with `<p>legL` (494,1242) / `<p>legR` (586,1242); `<p>up` (pivot 540,1292: torso+head+arms, wrapped by `translate(0,-60)`), `<p>head` (540,780), `<p>armL` (428,955), `<p>armR` (652,955), `<p>handR` (R hand circle or paw group; gets hidden by `thumb`), `<p>thumb`, `<p>pupils`, `<p>browL` (481,778), `<p>browR` (599,778), `<p>lidL/lidR` (rects inside eye clips), eyes groups `<p>eyesN/eyesSp/eyesHap/eyesCl`, spirals `<p>spL/spR`, mouths `<p>mSmile/mO/mDry/mPant/mWob/mBig/mSick`, `<p>jowls` (clothed only, pivot 540,860, base scale 0.6, opacity 0), `<p>sick` (green multiply overlay, circle (540,800) r150), `<p>tint` (second overlay, multiply, default #8fb8f0), `<p>heatH/heatT/heatGlow` (heat), `<p>sweat/wisp/steam/pain/puff`, `<p>tail` (animals), `<p>glasses` (if glasses), glass look: `<p>wlevel/wwave/bubbles/heartGlow/heartFill/brainGlow/brainFill/kidGlowL/R/kidFillL/R`. Props: `cup` -> `<p>glassL`, `<p>glassW`; `fan` -> `<p>fan`.

Methods (times absolute; `dur` seconds):
`arm(side "L"|"R", rotDeg, t, dur=0.5, ease)` (default arm rest +18 / -18; up ~ +-150..165; L positive = outward/away? unclear sign convention beyond: R -165 = straight up, R -150 wave, L 150 up); `armWave(side, r, t, dur, reps)`; `armThin(sx,t,dur)`; `leg(side, rot|{...}, t, dur, ease)`; `legsThin(sx,t,dur)`; `kneeShake(t0,t1,amp)`; `run(t0,t1,period,armL,armR,lift)` returns end time; `bob(t0,t1,amp)`; `move(tx,ty,rot,t,dur,ease)` (moves `<p>float`; used by encase/perch/buddy); `shadow(on,t,dur)`; `slump(rot,t,dur)`; `stretch(sy,t,dur,ease)`; `headScale(s,t,dur,ease)`; `mouth(name,t)` (one of mSmile mO mDry mPant mWob mBig mSick; any other value e.g. `"none"` hides all); `eyes(name,t)` (eyesN eyesSp eyesHap eyesCl); `lids(v 0..1, t, dur=0.12)` (stateful, remembers last); `blink(t)`; `look(tx,ty,t,dur=0.2)` (pupil offset px, usually +-12); `brows(rotL,rotR,ty,t,dur=0.2)`; `spin(t,dur)` (spiral eyes rotate 900 deg); `throb(times[],amt)`, `painOff(t)`; `sick(a,b,t,dur)` (opacity of `<p>sick`); `tint(col,a,b,t,dur)` (sets fill of `<p>tint` then fades a -> b; one overlay shared by cold mood, shade, bury/encase); `jowls(on,t,dur)`; `heat(on,t,dur)`; `sweat(t0,tEvap)`, `steam(t)`, `puff(t)`; `fan(on,t)`; `thumb(on,t)`; glass-only: `level(pct,t,dur,ease)`, `waves()`, `organOff/On(name,t)`, `bubbles(t0,n,seed)`; cup: `glassTilt`, `glassFill`, `cupDrop(t)`.

Body geometry (room coords, i.e. as drawn; subtract 60 in y for world coords of upper body parts): head centre (540,780) r 165 (world 540,720); eyes (484,832) & (596,832) r 36; brows y~780; blush (446,884)/(634,884); mouth ~ (540,910); torso path: x 382..698, y 905..1292 (centre ~ (540,1100), chest ~ (540,1000); heart (590,1006)); arms: rect x 402..454 (L) / 626..678 (R), y 945..1155, hands at (428,1160) / (652,1160) r 33; legs x 462..526 (L) / 554..618 (R), y 1236..1440, feet ellipse y ~1446, shadow ellipses at y 1466; ground line therefore ~ y 1466 in world (legs are not lifted). `pt(x,y)` takes room coords and applies only the float transform; `upPt/handPt/headPt` also apply the lift.

## 6. Patterns worth copying

- Paper card sliding in from the side with a pop: `meter` (lines 410-424) / `jug` (440-454): `.mo.mo-left|mo-right.mo-side` + `.mo-paper` + `svg viewBox="0 0 220 270"`, `PF.O` then `scale 0.4->1, rotation 8->2, back.out(2)`; register dirty to fade it.
- Counter / timer: `timer` (320-336) steps `innerHTML` with `tl.set` at 30 fps using `fmt()` and smoothstep; `count` (791-801) with thousand separators and ease-out; `breath zero` (935-945) lands exactly at `t` with 1 s ticks.
- SVG object attached to the hand from frame 0 (no appearance tween): `bottle` (376-395): `insertAdjacentHTML("beforebegin", ...)` into `<p>handR`, `PF.P` pivot, counter-rotate by `-arms0[1]`. Same for `snake` (639-654: `mo_sn` visible from frame 0, `mo_hL` id on hand circle).
- Attach something to a hero part so it moves with it: `mask` (192-203) in `<p>head`; `airpocket`, `co2`, `burn`, `sling` in `<p>up`; `venom` in `<p>armL` + `<p>up`.
- Tint the face / hero: `H.tint(col, 0, 0.24, t, dur)` (`encase` 141, `shade` 569); red face glow `#mo_brRed` inserted after `<p>sick` (`breath`, 911, 941).
- Full-screen overlay with its own content: `water` (1146-1194): HTML `#mo_wt` inside `UI()`, sub-modes via `arg`, one `dirty("water", off)`; `movie` (722-739) for a full-screen look without dirty.
- Full-screen sweeping panel + follow-up scene: `bury` (87-109) uses `PF.panel(id,4,true)` then calls `encase` which builds the persistent inside view.
- Cleaning up previous shots: `clear` (896-898) = `R.clean` per key; `release` (225-233) cleans a fixed list; `step` (290-300) and `reach` (216) tidy peers first; `snake "back"` (672-675).
- Stateful multi-mode moment sharing one DOM (`st.x` flag + `arg` modes): `o2` (1000-1049), `hand` (681-721), `venom` (809-847), `choice` (481-502), `water`, `breath`.
- Flying drops/rays in screen coords: `jug` (456-464), `suck`, `pant`, `cover`: create paths in `UIS()`, position with `scr(headPt(...))`, tween `x`/`y` (not transform attr).
- Camera feel: `PF.punch(t,1.02..1.05)` + `shake(t,dur,amp)` on impacts (`stamp` 359, `pick` 511); `stamp`/`count` pop with `scale 2.4..2.6 -> 1`, `power3.in`.
- Repeat/yoyo loops that must end clean: use odd `rep`; ending state after `XY` equals start.

## 7. SFX files (`assets/sfx/`) and usage (`SFX_R`)

Files: air_low, beep, fill, heartbeat, paper, pop, pour, rumble, sparkle, sub_hit, swell, thud, tick, whoosh, wobble (all `.wav`).

Recipes: puffy/skinny_legs/thin_arms/bigger -> pop; taller -> swell; pain, heartbeat -> heartbeat (x3 / x4); shiver -> wobble; stars -> sparkle; hallucinate -> swell+sparkle; nod -> thud; thumbs_up, recover -> sparkle; badge -> pop; mood -> swell; face dizzy/sick -> wobble, shocked -> pop.

Moments: cardie thud+wobble; bottle(show) pop; drink pour, pop, sparkle; meter tick; jug tick x4, fill, beep; spot pop; pick pop+thud; choice A/B pop+paper, small whoosh, big paper+pop; cover whoosh, thud, sparkle; shade whoosh, paper, thud; perch whoosh, thud; thermo pop+swell; aerial pop, beep x2; snake idle wobble, back whoosh, strike whoosh+thud+sub_hit+heartbeat x2; hand show pop, swell swell+heartbeat x2, ring tick x2+pop+sparkle, watch tick+pop; movie paper+thud; suck wobble; vial show pop+fill, pct pop+thud; count tick x6 + thud; venom move swell+heartbeat x4, still beep, back sparkle; sling whoosh+paper; ride whoosh+thud, sign pop+beep; antivenom pop+sparkle; breath hold swell+pop, zero tick x9 (1 s apart before anchor) + beep, out whoosh+sparkle, badge pop+sparkle; gauge swell+heartbeat x3, drop whoosh; o2 doubt pop+beep x3, full fill+sparkle, pct pop+thud, check pop+sparkle; co2 pile pop x9, glow swell+pop; alarm ring beep x5, sock beep x3+paper+thud; burn swell+heartbeat; pant whoosh x5 + wobble; water default pour, x thud+sub_hit, dark sub_hit+air_low, off whoosh; rewind whoosh, wobble, tick x2; step pop+tick; airpocket paper+swell; spit pop+tick; wayup sparkle+pop; armup whoosh, thud, beep; squeeze rumble+thud; buddy pop+sparkle; bury rumble, whoosh, sub_hit; stamp thud+sub_hit; struggle wobble; spin wobble+swell; mask swell+tick x2; timer tick x5 + beep; people pop x2 + thud; card paper+pop; reach swell+sparkle; release whoosh+sparkle. No SFX registered: handheld, shake, closeup, encase, hail, clear.
Other sfx tables: panels (`SFX_P`), title chrome (`CHROME_SFX`: paper/thud/pop), transitions (`TRANS_SFX`: whoosh/paper); hook uses sub_hit/whoosh.
SFX offsets are relative to the action anchor (word time or sentence start + `@sec`); an action with no anchor (`at` missing) gets no SFX.

## 8. Traps found while building videos (read before writing a pack)

- `tl.fromTo(sel, {opacity: 1}, {...})`: a property that is only in the "from" vars is never applied when the tween is seeked. Set it with `PF.S(sel, {opacity: 1}, t)` and tween the rest. (Cause of "element never shows".)
- `count` rounds intermediate values to hundreds, so numbers under 100 show 0 until the end. For small numbers write your own counter (pattern: `timer`, `tl.set` of `innerHTML` per frame step).
- Backdrop that must be there from frame 0 (video starts inside a lift, in the sea...): build it at call time with no opacity tween and NO `R.dirty` undo, and call the moment in `hook_do` at `"@0.0"`. Then first frame = last frame. A backdrop that appears later needs `R.dirty` and must be gone (via `clear` on a word) before the end shot settles.
- Elements of the env's F layer (foreground) draw on top of anything inserted before `<p>float`. `room`/`couch` has no foreground; pick the env/scene accordingly or cover the whole screen from `UI()`.
- The title sits at about screen y 100-360 during the hook (and stays until `hook_hide` or the end of the hook). Captions use y > 1500. Keep cards between.
- The hero's ground line is world y ~1466; anything drawn at floor level touches the top of the caption strip. Keep floors thin or dark there.
- `"@sec"` anchors are not allowed in `end.do`; close overlays there with `clear` anchored on a word.
- `scr()` is only right while the camera is on "body" of the dynamic kit.
- Face `neutral` has an open "o" mouth and reads as surprised; the calm face is `smile`.
- Hook B: the camera/title at t=0 differ a little from the settle frame at the end (engine behaviour, same in 033). Hero, backdrop, light and face must still match.
- Two packs must not use the same moment name or element id; prefix ids with `mo_<pack>`.
- The render CHECK step may flag low contrast on decorative text and overlapping text blocks; look at the frame it names and fix real overlaps.
- Arms are drawn IN FRONT of the head: an arm raised overhead or waving crosses the face unless the body is tilted or the arm goes out to the side.
- Never tween GSAP `x`/`y`/`scale` on an SVG group that already has a `transform` attribute (it gets overwritten). Wrap the content in an inner group without one, or use `PF.P` + `PF.X`.
- `PF.VO.total` is 0 during some build passes; guard endless loops with `if (PF.VO.total > 0)` (see `handheld`).
- The `face` recipe moves the camera to a face close-up (it returns "face"); on a tilted or lying hero that crops badly. Inside a pack use `R.setFace(t, name)` when the camera should stay.
- `step` tidies only its own catalog peers (airpocket, spit, wayup). Things made by a pack need an explicit `clear` action with the pack's dirty keys.
- Own full-screen backdrop over an engine env (sea, shaft, sky): hide or cover the env layers (`#fd_B/#fd_M/#fd_F` groups of the scene), insert the backdrop before `<p>float` (behind the hero) and a front layer after it if the hero stands in something, and turn the hero shadow off (`hero.shadow(false, 0)`). Worked examples: `lib/pack_rip.js` (`sea`), `lib/pack_elevator.js` (`lift`, `rig`, `tower`).
- Render QC (HyperFrames check, runs with `--render`, not with `--snap`) FAILS the render when two text blocks overlap, also inside one SVG group. Leave line spacing in multi-line SVG labels and keep cards apart.
- Under the rtk shell wrapper `grep 'a\|b'` can return nothing; use `command grep -a` or the Grep tool.
- The engine positions SVGs inside cards absolutely, so a label and a graphic stacked in one card overlap. Give your own SVG `style="position:static"` (see the 7 MPH sticker in `pack_elevator.js`).
- An overlay or a face set late in the last beat leaks into the end shot. Make the first `end.do` action a `clear` of your dirty keys (and `face`) on the first word of the end line, so the hero is back at `face0` before the loop.
- Do not start two renders of the same slug at once (they share `episodes/<slug>/build`), and wait for a background render to finish before reading its sheets.
- Always put `export HF_CLI="npx -y hyperframes@0.8.78"` in the same command as compose. Without the pinned version `--snap` saves frames elsewhere and reports `snimky: 0`.
- A pack that throws a JS error does not fail compose or `--snap`: everything after the exception is simply frozen. If animations are dead from some point on, suspect your pack. Typical cause: a group moved with `PF.XY` / `PF.X` that was not registered with `PF.P` first (child groups such as arm pivots too). To see the error, serve `episodes/<slug>/build` with `python -m http.server` and read the browser console (change the URL query on each reload, the pack JS is cached).
- An undo / `clear` tween must start after the moment's own tweens on the same property have ended. If a fade-in is still running when the fade-out starts, `--snap` (seek) looks clean but the in-order render keeps the element on screen. Cap the moment's duration by the time left in the shot.
- Env layers that are not loop-safe from frame 0 (aurora, twinkle, `fd_snowfall`) and anything in layer F that would cross the hero's face: hide them and draw your own in the pack (see `polar` in `pack_antarctica.js`, `abyss` in `pack_blackhole.js`). A seamless falling loop needs three tweens: start position down, full cycles, top back to the start position.
- Choice cards have no text-size option; long labels clip. Wrap the label in `<span style="font-size:62px">`.
- Key insets must be readable on a phone: at least about 420 px wide, label text at least 30 px. Scenes drawn as small icons in the middle of an empty frame look weak; fill roughly y 420–1400.
- edge-tts sometimes fails once with NoAudioReceived; retry.
- The beat-start body camera follows the hero's offset and rotation. A pack that moves or rotates the hero (lying down, sitting in a car) must reset the camera itself, otherwise the next beat starts with a jump (see the "highway cam" action in `pack_tornado.js`).
- `compose.py` without `--snap` or `--render` builds nothing, so `times.py` has no `build/index.html` to read. Run one `--snap` first.
- `tts.py` saves `vo_cache.json` only after every line succeeded. When edge-tts is flaky, one failed line throws away the whole run; do not change spoken lines in a polish round, so the cache stays valid.
- The last frame must equal frame 0. Stamps, cards and props of the end shot have to be gone before the return to the hook pose, and a looping background element (funnel, waves) should be back in its start phase.
