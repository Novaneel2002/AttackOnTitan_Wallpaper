# 01 – Architecture & Reuse Map (Spider-Man repo → Eren Yeager repo)

Purpose: let an AI (or human) bootstrap the Eren project by **copying what is unchanged** and only rewriting the two things that differ: **character design** and **swing mechanism**. See also `02-systems-and-behaviour.md` and `03-odm-swing-spec.md`.

## 1. What this project is
An **interactive desktop wallpaper** (Lively Wallpaper compatible, also runs in a plain browser over `file://` or `http://`). It is a **2D Canvas** app, no framework, no build step, no modules: every file is a classic `<script>` sharing **global scope**. A chibi character perches on 11 photo "cards", reacts to the cursor, and swings between cards.

> [!IMPORTANT]
> The existing renderer is **2D canvas, screen-space, 16:9 stage (1024×576 reference)**. The ODM spec (03) is written as a 3D forest model; for the Eren repo decide up front: **(A) keep 2D** and port the ODM ideas to 2D (recommended, reuses everything), or (B) go 3D (Three.js) and rewrite most of this. Doc 03 gives a 2D port.

## 2. File map and reuse verdict

| File | Role | Verdict for Eren |
|---|---|---|
| `index.html` | Script load order, web-module loader | **Reuse**; rename title/comments, swap script names |
| `config/settings.js` | canvas/ctx, `config`, viewport/pointer/timing globals, Lively listener, public API `window.SpiderManChibi` | **Reuse**; rename `showSpidey/spideyScale` → `showEren/erenScale`, API → `window.ErenChibi` |
| `LivelyProperties.json` | Lively settings panel | **Reuse**; rename keys (must match `livelyPropertyListener` cases); add ODM sliders (gas, cable speed) |
| `core/loop.js` | `handleResize`, 16:9 stage layout, adaptive FPS (`isSceneHighMotion`, `getFrameInterval`), `renderFrame` | **Reuse as-is**; only rename `spidey` refs and replace the draw/update calls in step 8 |
| `image-block/*` (`card-renderer`, `cards-data`, `magnetic-field`) | Card layout, cached offscreen draw w/ film grain, magnetic hover zoom, perch geometry, border projection | **Reuse unchanged** (swap images in `./images/` and `CARD_DEFINITIONS`) |
| `input/pointer-events.js` | Hover/click/hold-drag → swing requests | **Reuse**; hold-drag chains swings (fits ODM) |
| `effects/particles.js` | Landing impact, click effects, dust | **Adapt**: recolor, add gas/steam |
| `styles/spidey-fx.css` | Page/canvas CSS + contrast filter | **Reuse**; rename |
| `behaviour/spidey-state.js` | State object `spidey`, enums, time-of-day, reaction table | **Reuse structure**, rename, add ODM fields |
| `behaviour/spidey-behaviour.js` | Blinking, eye tracking, wind brace, idle progression, `updateSpiderMan`, comic bubbles, reactions | **Reuse logic**, rewrite the swing-update section; rewrite bubble text |
| `traversal/swing-physics.js` | Anchor picking, pendulum table, zip | **REWRITE** (ODM) – see doc 03 |
| `traversal/web.html` | Web strand physics, splat sprites, web tags, photo↔photo web connections, LMB queue | **REWRITE visuals** → cable/hook visuals; keep queue + connection-pool pattern |
| `character/spidey-model.js` | Primitive drawing (segments, boots, hands, head, torso, cast shadow) | **REWRITE** (Eren design) – keep helper function shapes |
| `character/spidey-renderer.js` | `drawSpiderMan()` pose composition (swing/idle/sit/sass/deep idle) | **REWRITE** poses; keep blend/pose-variable architecture |

## 3. Script load order (must stay in this order)
1. `config/settings.js` (globals) → 2. `behaviour/*-state.js` → 3. `image-block/card-renderer.js`, `cards-data.js`, `magnetic-field.js` → 4. `effects/particles.js` → 5. `traversal/swing-physics.js` → 6. `character/*-model.js`, `*-renderer.js` → 7. `behaviour/*-behaviour.js` → 8. `core/loop.js` → 9. web module + `input/pointer-events.js` then `startWallpaper()`.

**Quirk to preserve or remove deliberately:** `traversal/web.html` is loaded in a hidden iframe, which `postMessage`s its script text (`{type:'SPIDEY_WEB_MODULE', code}`) to the parent, which `eval`s it (global eval) – a workaround so a module can load on `file://` in Lively. For Eren it is simpler to turn it into a plain `traversal/cable.js` `<script>` and delete the iframe/eval block (all other scripts already load that way). The module is loaded *last*, but `loop.js` references its functions only at runtime, so a normal script tag before `loop.js` works.

## 4. Key global conventions
- **Coordinates**: CSS pixels, origin top-left, y down. Character position `spidey.x/y` = **feet/perch point**. Canvas backing store is `viewWidth*dpr`; `ctx.setTransform(dpr,…)` once in `handleResize`.
- **Scaling**: `uniformScale = min(vw/1024, vh/576)`; every distance/size is multiplied by `uniformScale` (and by `config.<char>Scale` for the character → local var `s`). Never use raw pixels.
- **Layout**: cards have reference coords (`refCx, refCy, refW, refH`) mapped into a centered stage via `layoutScaleX/Y` (35% expansion on non-16:9).
- **Time**: `dt` clamped (`0.05` active, `0.15` throttled); smoothing uses `1 - Math.exp(-rate*dt)` everywhere (frame-rate independent). Keep this idiom.
- **Zero GC in hot paths**: pre-allocated typed arrays (`Int8Array`, `Float32Array`), pooled web connections, no object literals per frame. Keep.
- **Adaptive FPS**: rAF when anything moves; otherwise `setTimeout` to 30 / 15 / 8 fps. Any new animated state **must be added to `isSceneHighMotion()`** or it will stutter/freeze at low fps.
- **Lively**: `window.livelyPropertyListener(name,val)`, `window.livelyAudioListener(arr)` (bass energy → `audioEnergy` pulses cards ×(1+0.025e)).
- **Card geometry**: `cards[i]` has `cx,cy` (stage center), `offsetX/Y` (magnetic pull), `scale`, `baseW/H`, `refRadius`, `isTopRow`, `sideDir`. Live position = `cx+offsetX`, size = `baseW*scale*(1+audioEnergy*0.025)`.

## 5. Suggested bootstrap steps for the new repo
1. Copy repo, delete `.git`, `git init`; copy `docs/`.
2. Keep: `core`, `image-block`, `input`, `config`, `styles`, `LivelyProperties.json`, `index.html`. Replace `images/`.
3. Mass-rename `spidey`→`eren`, `Spidey`→`Eren`, `SpiderMan`→`Eren`, `SPIDEY_WEB_MODULE`→remove.
4. Stub `traversal/odm-physics.js` and `character/eren-model.js`/`eren-renderer.js`; get the wallpaper running with a placeholder rectangle character perching on cards.
5. Implement doc 03, then character art.
