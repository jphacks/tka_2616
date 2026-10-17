---
name: pixel-anims
description: "Build polished single-file HTML pixel-art sprite animations (vanilla JS + Canvas 2D, no assets or libraries): any character performing a looping action (idle, windup, strike, cast or breath, recover) in a minimal scene, with a 16-bit look, fixed palette, integer scaling, a 60 Hz fixed step, pooled particles and per-state snapshot QA. Use for requests like pixel art animation, animated sprite, 8-bit or 16-bit character doing X, pixel wizard/knight/dragon/ninja, or retro canvas loops."
license: MIT
compatibility: "Snapshot QA needs Node 18+, Chrome, Edge or Chromium, and a model that can read PNG images."
---

# Pixel Anims

Produce one self-contained `.html` file that loops a 16-bit style sprite animation: a character runs through an action state machine in a minimal scene. It uses vanilla JS and Canvas 2D only, with no assets, libraries or network requests.

`assets/wizard-spellcaster.html` is a finished example (a wizard casting a spell) that contains the whole engine. Never write a new engine. Scaffold from the template and write only the SCENE regions.

## Inputs

| Input | Default |
|---|---|
| Character + action | Required. Ask if either is missing. |
| Scene | Minimal: sky or air bands, one landmark, a floor line |
| Resolution | 128x96. Use 160x90 when the actor is wider than ~40px or the action/FX travels more than ~60px sideways. |
| Palette | About 24 colors, mood taken from the brief |
| Beats | Rest, build-up, strike/release, recover (3-6 states) |
| Output | `./<character>-<action>.html` in the current directory |

## Workflow

1. **Design note.** Write it in your reply, or in your final report if you run as a subagent. Keep it to 10-20 lines:
   - palette ramps by material, with the FX hue and the backdrop mood;
   - the states with `DUR` and `EASE` in ticks;
   - the pose params and what each state's `TARGET` does;
   - the event tick and its FX kit;
   - the FX light (`srcX/srcY`);
   - the actor size and anchor.
2. **Scaffold.** Run `node <skill-dir>/scripts/new-scene.mjs <out.html>`. It copies the template with ENGINE intact and every SCENE region emptied. Then set `<title>` and the canvas `aria-label` to describe the subject, and both CSS `background` colors to `PAL[0]`.
3. **Write SCENE config, then SCENE logic,** following the contract below and `references/pixel-craft-rules.md`. Reading the wizard's SCENE code for patterns is fine. Do not carry its parts (gem, hat, projectile) into an unrelated subject.
4. **Run QA** (below). Fix what the snapshots show. At most 3 rounds.
5. **Deliver** (below).

## Hard rules

1. Draw only into the index buffers (`bg`, `buf`, `spr`). Only the engine's `present()` touches the canvas.
2. Every pixel comes from `PAL`, which holds 16-32 colors. Index 0 is the darkest ink.
3. Plot at integer pixels only. Float geometry is fine as long as it is derived only from sampled values and rounded before plotting.
4. No gradients, `shadowBlur`, `globalAlpha`, filters, `arc()` or anti-aliasing. Build glow from `halo()`, `lighten()` and Bayer dither. Bake static glows (lanterns, windows) into `bg` by passing it as the last argument inside `buildBackground()`.
5. Leave scaling, resizing and the loop to the engine: integer scale, fixed 60 Hz step, rAF render.
6. Do not allocate anything from `step`, `sample` or any draw function. That means no object or array literals, closures, template strings or `new`. Keep persistent floats in typed arrays and integers in `let`. Boot code (`buildBackground`, table parsing) may allocate.
7. Only `step()` and `sample()` may call `rand()`, never draw functions. Never use `Math.random`. `buildBackground` may use its own seeded generator.
8. Update the sprite only on pose frames. `drawActor()` reads `snap` and the integer anchors set in `sample()`, and never `pose` or `tick`.
9. Make the loop seamless:
   - every `DUR` is a multiple of `POSE_STEP`, and `1 <= EASE <= DUR`;
   - the last state targets `TARGET[0]` and eases fully back;
   - springs settle before the end. Springs start at 0, so give each a rest target of 0 or seed `spring[k]` with its rest value in `buildBackground()`;
   - cycles keyed to `tick` (flutter, wave) have a period that divides L, or are keyed to `stT` instead;
   - one-shot objects end or leave the screen;
   - no idle FX fire at `stT === 0`.
10. Shake only through `shakeT` (1-2 px) and flash only through `flashT` (frames of a one-step `LIGHTEN`, 3-4 max). The engine turns both off under `prefers-reduced-motion`.
11. Keep the literal form `const W = 128, H = 96;` because `snapshot.mjs` parses it.
12. Never edit ENGINE regions, and never redeclare engine functions. If the engine lacks something, write a new helper under a new name in SCENE logic. `snapshot.mjs` fails on both.

## Engine contract

**SCENE config must define:**

| Name | Meaning |
|---|---|
| `W, H` | Logical resolution |
| `FY` | Lowest row particles reach; they bounce there. With no floor or a partial floor, use `H - 1` and cull or bounce particles in `step()`. |
| `POSE_STEP` | Ticks per pose frame: 5-7, i.e. 12-8.6 fps |
| `PAL` | `#rrggbb` strings; index 0 is the darkest ink |
| `LIGHTEN` | `Uint8Array(PAL.length)`: the next brighter color in the same ramp. Used for rim level 1, flicker, flash and `lighten()`. Give every actor ramp a same-hue top highlight; only backdrop and FX ramps may jump to another hue, or idle rim leaves off-hue stray pixels. Map a landmark to itself if a flash should not bleach it. |
| `RAMPS` | Array of particle life ramps, each bright to dark (4-6 colors). Spawns pick one by index. |
| `RIM` | 3 colors for rim levels 2, 3 and 4+ |
| `RIM_BANDS` | 3 px radii from `srcX/srcY` where rim drops a level. The wizard uses 10, 18, 28; widen them for big actors. |
| `RIM_OK` | `Uint8Array(PAL.length)`: 1 if that color takes rim light. It works per color, so thin props aimed at the light and trailing cloth (scarves, ribbons, tails) need palette indices of their own set to 0. |
| `AIR` | `Uint8Array(PAL.length)`: 1 if `halo()` may tint that backdrop color |
| `LIGHT` | `Float32Array` unit vector toward the key light, used by `capsule()` shading |
| `DUR`, `EASE`, `EASE_OUT` | Per state: ticks, ticks to reach the target, and 1 for snap-in (easeOutQuad) or 0 for easeInOutSine |
| `NP`, `TARGET` | Pose param count, and per state a `Float32Array(NP)`. `TARGET[0]` is both the start and end pose. |

**SCENE logic must define:**

| Function | Job |
|---|---|
| `buildBackground()` | Writes `bg` once, plus any scene init (stars, bitmaps, tables). |
| `step()` | Runs every tick:<br>1. springs;<br>2. `if (tick % POSE_STEP === 0) sample()`;<br>3. spawns and events;<br>4. scene objects. |
| `sample()` | A scene helper that `step()` calls:<br>`snap.set(pose)`;<br>rounds anchors to integers;<br>sets `srcX`, `srcY`, `rim` and the scene's light levels. |
| `drawActor()` | Draws the character into `spr` using palette indices. |
| `drawUnder()` | Draws onto `buf` before the actor: animated backdrop and floor light. |
| `drawOver()` | Draws onto `buf` after the actor: halos, `drawParticles(false)`, glowing props, `drawParticles(true)`, impact FX. |

**`srcX/srcY` is the FX light:** the emitter, glint or impact point, and also the orbit center. Ambient light (sun, moon) is baked into the palette shading. `RIM` colors follow the FX hue, warm or cool. When nothing is emitting yet, park it on the prop that will.

**Rim math:** an actor pixel on an edge facing `srcX/srcY` gets level `rim - band`, where band is 0-3 by distance past `RIM_BANDS`. Level 1 applies `LIGHTEN`, and levels 2 and up use `RIM`.

| Source | Idle | Build-up | Event |
|---|---|---|---|
| Emissive (gem, fire) | 1 | 2-4 | up to 6 on small actors, 4 on big ones |
| Non-emissive (steel glint, thrown prop) | 1 | 1 | about 3 |

Higher values outline the whole actor.

**ENGINE gives you:**

- **State:**
  - `state`, `stT` (ticks spent in the current state), `tick`;
  - `pose` (smooth) and `snap` (its value at the last sample);
  - `spring` (8 floats: 4 springs as `[pos, vel]`);
  - `srcX`, `srcY`, `rim`;
  - `shakeT` (frames of shake, e.g. 16) and `flashT` (frames of flash, e.g. 4);
  - `jx`, `jy`, written by `joint()`.
- **Buffers:** `bg`, `buf`, `spr` (`EMPTY = 255` means transparent), `N = W*H`, `BAYER` (4x4 thresholds 0-15).
- **Drawing:**
  - `plot(t, x, y, c)`, `hline(t, x0, x1, y, c)`, `rect(t, x, y, w, h, c)`;
  - `line(t, x0, y0, x1, y1, c, yMax = H-1)`;
  - `line2(t, x0, y0, x1, y1, light, dark, yMax)`: a 2px prop drawn from one DDA, so both edges step together;
  - `capsule(t, x0, y0, r0, x1, y1, r1, dark, base, light)`: a tapered limb, neck or tail, shaded toward `LIGHT`;
  - `joint(ax, ay, bx, by, l1, l2, side)`: a two-bone elbow or knee, written to `jx, jy`;
  - `disc(cx, cy, r, c, t = buf)` and `ring(cx, cy, r, c, t = buf)`;
  - `halo(cx, cy, r, core, mid, t = buf)`, which tints only `AIR` pixels;
  - `lighten(cx, cy, r, t = buf)`: a `LIGHTEN` light pool on any surface.
  - Pass `bg` as `t` to bake a glow into the backdrop.
- **Particles:**
  - `spawn(kind, life, x, y, vx, vy, ramp = 0)` returns the slot index.
  - Kinds: `BURST` (drag, gravity, floor bounce), `TRAIL` (drag), `MOTE` (slow drift), `ORBIT`.
  - `spawnOrbit(r, speed, decay, a0 = 0, arc = 2π, ramp = 0)` makes a spark that spirals into `srcX/srcY` from angles in `[a0, a0 + arc)` and returns its index. Far-side orbits pass behind the actor.
  - `drawParticles(front)` draws them.
- **Motion and randomness:** `stepSpring(k, target)` with `k` in 0, 2, 4, 6. `rand()` returns [0, 1).
- **Composite and render:**
  - `composite()` adds the ink outline and a rim on edges facing `srcX/srcY`.
  - Render order: `bg`, `drawUnder`, `drawActor`, `composite`, `drawOver`, flash, present.
  - `checkContract()` throws at boot if tables have the wrong size, `DUR`/`EASE` are wrong, or the loop does not close.
- **Embedding control:** while playing (not in `#t=N` QA mode), the page exposes `window.pixelAnims` for same-origin embedders: `tick`, `loop`, `paused`, `seeking`, `pause()`, `play()`, and `seek(t, rate)`, which runs `rate` ticks a frame forward to tick `t` of the loop, then plays on. It is part of ENGINE; nothing to write.

## QA

```bash
node <skill-dir>/scripts/snapshot.mjs <page.html> <t1,t2,...> [--scale 4] [--crop x,y,w,h] [--out DIR]
```

- `#t=N` simulates and renders ticks 0..N, then shows tick N, so an error on any earlier tick also surfaces.
- It writes `snapshots/snap-<t>.png` next to the page. The scale is raised automatically so the shot is at least 512px wide.
- Exit codes:
  - 2: the page logged errors (including a seam mismatch);
  - 3: an ENGINE region was edited or a function was declared twice;
  - fix either one before judging the pictures.
- State k starts at tick `DUR[0] + ... + DUR[k-1]`. The loop length is L = sum(DUR). For the wizard: 0, 144, 240, 276, and L = 348.
- The strike state's first pose frame (`stT < POSE_STEP`) still shows the build-up pose: that is the anticipation frame. The next pose frame is `event + POSE_STEP`.
- Pick 8-10 ticks:
  - 0 and the middle of every state;
  - late build-up;
  - the strike state's start tick (the anticipation frame);
  - the event tick and event + `POSE_STEP`;
  - **L itself**: the engine then compares the actor at tick L with tick 0 and logs an error if they differ.
- To hunt stray pixels, re-shoot 2-3 ticks (idle, late build-up, event + `POSE_STEP`) with `--crop` set to the actor's bounding box in logical pixels. It zooms that region to fill the shot as `snap-<t>-crop-x-y-w-h.png` (page URL `#t=N&crop=x,y,w,h`). Shake at an event can offset the crop by 1-2px.
- To upgrade an old page to a newer engine, re-copy the ENGINE regions from the template. The helper signatures only ever gain trailing optional parameters.
- Read every PNG and check:
  - [ ] Silhouette and action read clearly; the actor is not buried by FX beyond 2-3 frames.
  - [ ] Outline is closed; no stray or orphan pixels; no zigzag row steps; limbs don't vanish into same-material bodies.
  - [ ] Props stay attached to hands at every pose.
  - [ ] Rim light sits only on edges facing the source; thin props are not lit end to end.
  - [ ] Every state is visibly different, and the event FX are visible without bleaching the frame.
  - [ ] Backdrop bands, landmark and floor are clean; the palette looks coherent.

## Deliver

- Give the file path, one line listing the states and timings, and the ticks you checked.
- If an Artifact tool is available and the user wants a link, publish the file as it is. It already has no doctype, html or body tags.
- Mention any rule you knowingly bent and why.
