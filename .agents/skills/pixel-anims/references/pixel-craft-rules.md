# Pixel craft rules

How to make a pixel-anims scene look like a polished 16-bit sprite animation instead of vector shapes scaled down. Numbers come from `assets/wizard-spellcaster.html` and from the field tests (knight slash, dragon breath).

## 1. Palette

- Use 16-32 colors in total. A typical budget:
  - backdrop air/sky: 4-6
  - ground: 3-4
  - each actor material: 2-3 (dark, base, light)
  - skin: 2
  - FX ramp: 4-5 (white, light, mid, dark, deep)
- Index 0 is the darkest ink. It gets a slight hue and is never pure `#000`. The engine uses it for outlines and the letterbox.
- Hue-shift the ramps: shadows lean blue/purple, highlights lean yellow/warm.
  - Wizard robe: `#4e1734 → #8a2638 → #c4473a`. Its LIGHTEN top goes to gold `#f2b84b`.
- Separate the actor from the backdrop by temperature and value.
  - Examples: a warm actor on a cool night, cool armor on a warm dusk, a green dragon on a red night.
  - The actor's mid values must not match the backdrop's.
- Make the FX hue distinct from the actor. Complementary works well: red robe with cyan magic.
- `LIGHTEN` maps each index to the next brighter color in its ramp.
  - Actor ramp tops need a same-hue highlight entry (e.g. `GARB_H`), because idle rim level 1 runs actor colors through `LIGHTEN`.
  - Backdrop and FX ramp tops may go to a bright neighbor, then `WHITE`.
  - Backdrop colors may lighten toward the FX hue, which makes flashes tinted.
  - Map a landmark (moon, sun) to itself if a flash should not bleach it.
- Give a prop its own palette indices when it needs different rules, such as a blade excluded from rim light via `RIM_OK`.
- Name constants by material and shade: `ROBE_D / ROBE_M / ROBE_L`.

## 2. Silhouette and readability

- Size the actor to the scene:
  - humanoid: about 20-24px wide at the widest pose, about 32px tall at 128x96 and about 28px at 160x90. Give the torso real width (8px or more), because stick-thin bodies read as walking, not standing ready;
  - creatures with wings or tails: up to about 60x48 at 160x90;
  - always leave headroom for FX.
- For big actors, widen `RIM_BANDS` (for example 16, 30, 46) or keep `rim` at 4 or below. Otherwise far wing and tail edges light up.
- Props (staff, sword, wings, tail) extend the silhouette. On key frames, pose them away from the body.
- The engine's auto outline closes the shape. Add an inner dark edge (the `_D` shade on the back side) for volume.
- Where a limb crosses a body of the same material (a steel arm over a breastplate), separate them with an ink line along the limb's underside. Otherwise the arm vanishes.
- Squint test: at 1x, the action must read from the silhouette alone.
- If the action travels sideways, put the actor on one third facing the travel direction and keep the lane empty.

## 3. Building the sprite

- **Body masses:** use row tables (`Int8Array` of `[left, right]` offsets from an anchor). Walk the rows and pick each color by comparing x with a shade split column.
- **Limbs, necks, tails:**
  - `capsule()`: tapered, shaded toward `LIGHT`, independent of the stroke direction.
  - `joint()`: places elbows and knees, from shoulder to hand or hip to foot.
  - Chain capsules for tails, and put a spring on the tip.
  - A limb helper worth writing once per scene:
    ```js
    function limb(ax, ay, bx, by, l1, l2, side, r0, r1, r2, dark, base, light) {
      joint(ax, ay, bx, by, l1, l2, side);
      capsule(spr, ax, ay, r0, jx, jy, r1, dark, base, light);
      capsule(spr, jx, jy, r1, bx, by, r2, dark, base, light);
    }
    ```
  - To separate a limb from a same-material body, ink only the pixels already in `spr` along the limb's underside. Plotting blindly adds new silhouette.
    ```js
    function inkEdge(x0, y0, x1, y1) { // ink the underside run of a limb, only over existing sprite pixels
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let s = 0; s <= n; s++) {
        const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n);
        if (x >= 0 && x < W && y >= 0 && y < H && spr[y * W + x] !== EMPTY) spr[y * W + x] = 0;
      }
    }
    ```
  - Hands at 2x2 read as blobs. Give them 3px with a 1px knuckle or thumb in the dark shade, and keep the far hand tucked against the body.
- **Props:** use `line2()`, 2px wide with both edges drawn from one DDA. Two separate `line()` calls step differently on diagonals and look like a ladder.
- **Faces and heads:** when detail matters, use char bitmaps (`['..##..', '.#oo#.']`). Parse them once in `buildBackground` into a `Uint8Array` through a char-to-palette map, then stamp them at the sampled anchor.
- **Folds and scales:** 1px darker fold lines that follow the sway. For belly scales, alternate base and light every 2 rows.
- **Parametric shapes** (such as a cone whose centerline bends quadratically) are fine if you round per row. Check that the row steps are monotonic, with no zigzag.
- `drawActor()` reads only sampled values: `snap` plus the integer anchors from `sample()`.

## 4. Motion

**Pose and sampling**
- Use 6-10 pose params: angles in radians, offsets in px, blends 0..1. Give each state its target pose in `TARGET`.
- The math runs at 60 Hz, but the sprite only changes every `POSE_STEP` ticks (6 = 10 fps). That stepped look is what makes it feel hand-animated.

**Per state**
- **Idle:** a 2-frame bob (1px, 36 ticks per frame). Secondary parts (beard, plume, tail) lag by half a frame. Blinks and embers are welcome, but never at `stT === 0`.
- **Build-up:** ease in-out over about 55% of the state. Then hold with a 1px tremble that alternates every pose frame.
- **Anticipation and strike:**
  - The strike state's first pose frame still shows the build-up pose. That is the anticipation frame; the build-up target itself should already be pulled back.
  - Snap into the strike pose on the next pose frame: `EASE_OUT = 1`, `EASE = POSE_STEP`.
  - Fire the event there (`FIRE_T = POSE_STEP`).
  - A 1-2 frame smear (see slash arc in §5) can stand in for the missing in-between.
- **Hold:** keep a strike 0.4-0.6 s. Sustained actions (breath, beam, channel) may hold up to about 1.5 s. Recover eases back over about 80% of its state.

**Secondary motion**
- Springs: `stepSpring` uses k 0.03 and damping 0.88, which gives about a 0.7 s period and about 28% overshoot. Use them for cloth, hair, capes, plumes, tail tips and wing tips.
- The spring target is an offset driven by the pose. Round it in `sample()`.
- Apply offsets more at the free end, with a `t²` falloff down a robe or tail.

**Loop**
- The last state eases back to `TARGET[0]` before it ends.
- Every `DUR` is a multiple of `POSE_STEP`.
- Springs settle before the end, and one-shot objects are gone or off screen.
- Snapshot tick L to let the engine verify the seam.

Wizard timing (ticks at 60 Hz):

| State | DUR | EASE | Beats |
|---|---|---|---|
| IDLE | 144 | 6 | bob every 36 ticks; mote every 20 ticks |
| CHARGE | 96 | 54 in-out | orbit sparks every 3 then every 2 ticks; tremble from tick 54 |
| CAST | 36 | 6 out | fire at 6: 46 burst sparks, projectile, `shakeT = 16`, `flashT = 4` |
| RECOVER | 72 | 60 in-out | rim and halo decay back to idle levels |

The dragon test used 144 / 96 / 120 / 96 ticks, with the breath streaming from stT 6 to 84.

## 5. FX

**Particles**
- Each particle's color walks its `RAMPS[i]` from bright to dark over its life. The engine draws the previous position one step darker, which gives a 2px streak.
- Use separate ramps when warm and cool sparks coexist, for example steel sparks next to fire embers.
- Particle kinds:
  - `ORBIT`: gathering energy. Pass `a0` and `arc` to `spawnOrbit` to limit it to a cone, such as in front of a mouth.
  - `BURST`: impacts. Bias `vx` toward the action direction.
  - `TRAIL`: 1-2 per tick behind moving objects.
  - `MOTE`: idle ambience.
- The pool holds 320. Wizard peaks: about 50 orbit + 46 burst + 20 trail.
- Objects spawned in `step()` move once before they are first drawn. Spawn them one velocity step back so there is no gap at the emitter.

**Glow**
- `halo()` tints only `AIR` pixels. Step its radius with the state.
- `lighten()` makes a light pool on any surface (floor, wall, the actor's own body) by stepping colors up with `LIGHTEN`.

**Impact kit** (use one of each, never all at full strength for long):
- a filled disc for 2-4 frames, shrinking;
- 4-point glint lines;
- a ring expanding about 1.4 px/tick, colored through a ramp;
- `flashT = 3-4`, one `LIGHTEN` step per frame;
- `shakeT = 16`, which shakes 1-2 px;
- a `lighten()` pool at the contact point.

**Slash arc (no `arc()`)**
- Loop over the pixels of the annulus bounding box. Keep those whose radius is in [r0, r1] and whose `atan2` angle is inside the swept range.
- Thickness tapers from head to tail.
- Color: white at the leading edge, then the ramp. Show it for 1-2 pose frames: the tail retracts and darkens on the second frame.
- Keep the inner radius clear of the head.

**Sustained stream (breath, beam, spray)**
- Keep a small pool in SCENE (typed arrays, about 96 slots) of "puffs": x, y, vx, vy, age.
- Emit about 2 per tick from the emitter, with speed jitter and a slight spread; the radius grows with age.
- Draw oldest first, as stacked discs: dark edge, mid, core, and a white spine near the emitter.
- Add `halo()` along the stream, and shed `BURST` embers from random puffs.
- To end it, stop emitting and let the body drift off. It reads as the stream breaking away.

**Light source**
- Put `srcX/srcY` on the emitter or impact point (gem, blade tip, mouth). When nothing emits yet, park it on the prop that will.
- Rim level: see the rim math table in SKILL.md.
  - Emissive sources: 1 at idle, 2-4 while building, up to 6 on the impact frame for small actors (4 for big ones), decaying through recover.
  - Non-emissive sources (steel glint, thrown prop): 1 while building, about 3 at the event. Anything higher reads as a magic aura.

**Limit:** FX may bury the silhouette for at most 2-3 frames. Streams are exempt but must not cover the actor's head or body.

## 6. Backdrop

- Build it once into `bg`, and add any animated bits in `drawUnder()`.
- Sky or air: 3-4 flat bands joined by narrow Bayer seams. Do not dither the whole field.
- Include:
  - one landmark (moon, sun, tower);
  - a low far ridge, darker than the horizon band;
  - a floor line with a lit top edge and darker courses below;
  - a contact shadow under the actor.
- For natural rock, avoid brick-like rectangles and cone-plus-checker shapes. Use irregular slab outlines, a lit top edge and 1-2 crack lines.
- With a partial floor (cliff, ledge): set `FY = H - 1`, keep a per-column ground table, and cull or bounce particles against it in `step()`.
- Keep animated backdrop bits (twinkle, torch flicker, drifting cloud) sparse and slow.

## 7. Anti-patterns

- Sub-pixel drift: plotting unrounded floats, or reading `pose` or `tick` inside `drawActor()`.
- Canvas gradients, `shadowBlur`, `globalAlpha`, filters or `arc()`. Each one breaks the palette or the grid.
- Pillow shading, where the outline is shaded evenly inward. Light has a direction.
- Noise dither everywhere. Use flat bands with narrow seams only.
- 1px diagonal props, props drawn as two separate lines, and row steps that zigzag.
- Symmetric, stiff poses; everything moving at once; no holds.
- More than about 32 colors, or near-duplicate shades.
- Rim light on everything. Rim only lights edges that face the source, never thin props aimed at it, and big actors need wider bands.
- Impact FX that last a whole state, or a flash that bleaches the key frame.
- Allocating in the loop: `[x, y]` returns, closures, template strings, `new`.
