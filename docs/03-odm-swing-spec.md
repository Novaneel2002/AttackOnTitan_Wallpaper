# 03 – ODM Gear Swing Spec & Eren Character Brief

Replaces `traversal/swing-physics.js` + `traversal/web.html` visuals + `character/*`. Everything else: see docs 01–02.

## 1. How the current Spider-Man swing works (to replace)
Not a real simulation: a **parametric arc** driven by `swingT` (0→1 over `swingDuration`).
- `requestSwingToCard(i)` → pre-jump crouch → `launchSwingNow(i, carryVelocity)` picks a mode:
  - **ZIP** (target clearly higher or very close): `computeZipPosition(t)` – hold 0.16 while the web flies, then eased yank `1−(1−k)^2.6` plus a small perpendicular bulge. Duration 0.42–0.7s.
  - **PENDULUM**: `resolvePhysicalWebAnchor` scores candidates (screen top/left/right edge, other card borders above the path, target card top corner) near an "ideal" point `start + 0.55·d`, lifted `clamp(0.38·jump, 95..220)·us`; anchor stored card-relative. Fallback anchor = top screen edge. `buildPendulumTable` builds a 48-sample time-warp from energy conservation (`v=√(vMin²+2·Δh)`) so he is fast at the bottom; `computePendulumPosition(t)` returns `anchor + (sinθ, cosθ)·r` with θ and r interpolated start→end (r smoothstep'd). Duration 0.6–1.1s.
  - **Two-web chain** (|dx| > 0.42·viewWidth): swing #1 to a mid-air release point, release, then 2nd web (`isChainSegment`).
- Release: `releaseWebStrand(alpha)` → `trailingWeb` droops under gravity (1100·us px/s²) and fades; carried velocity blends into next segment for 0.2s.
- Landing: `landSquash`, `spawnLandingImpact`, perch mode chosen by `choosePerchModeForCard`.
- Velocity `vx,vy` is derived from position deltas each frame (used for body tilt, carry, wind).

## 2. Target ODM behaviour (source description from the user)
> The ODM gear is a high-impulse cable-and-thruster hybrid modeled as a **3D variable-length pendulum** augmented by **directional gas jets** and **winch reels**. Two grapple hooks fire along ballistic/near-instant straight trajectories and embed in wood, creating two fixed world anchors **P₁, P₂**; the COM is at **p** with velocity **v**. Each cable is an **active taut constraint with reel-in/out**: if ‖p−Pᵢ‖ exceeds cable length Lᵢ (or the winch retracts Lᵢ at spool rate L̇ᵢ<0), a constraint force pulls p along **ûᵢ=(Pᵢ−p)/‖p−Pᵢ‖**, converting radial retraction and gravity **g** into tangential rotational momentum. Hip gas thrusters fire bursts along selectable **d̂_gas** (forward‑up boost, lateral banking, braking reverse), applying **a_gas=(F_gas/m)·d̂_gas**, which breaks pendulum energy conservation – enabling vertical trunk climbs, tight corners, or a high-speed horizontal slash toward a Titan's nape before hooks detach, carrying residual linear/angular momentum into the next cast.
>
> **Implementation:** state-driven **fixed-timestep** sim (dt 1/60–1/120 s) with procedural skeletal banking, camera FOV dynamics, blade-attack alignment. Each frame: raycast/sphere-cast from the aim cone against valid colliders to choose anchors; fire cables with fast travel or near-instant lock; solve constraints (XPBD/Verlet distance constraints, or explicit projection: remove outward velocity along ûᵢ when taut, winch adds inward pull) while integrating gravity, drag, and gas impulses. Orient spine/torso into the turn (lean toward the centripetal acceleration; pitch along v̂). Releasing hooks → ballistic arc (gravity + drag); within strike range trigger dash/slash toward the nape hitbox. Accent with FOV widening at speed, steam/wind trails from vents, snappy cuts/motion streaks on release and blade impact.
>
> **vs Spider-Man:** ODM = **two independent winching anchors + active propulsion** (asymmetric two-point tension → roll/yaw control, winch up against gravity, mid-swing gas jets reaching directions a pendulum can't). Spider-Man = **single overhead line**, gravity pendulum, speed peaks at the trough, release at upward tangent into a parabola, acrobatic flips, no thrusters. ODM is sharper, mechanical, thruster-boosted; Spider-Man smoother and more continuous.

## 3. 2D port for this wallpaper (recommended design)
Replace the parametric arc with a **real fixed-step 2D simulation** (keep `swingT`-style progress only for animation blends). Fixed `STEP = 1/120`, accumulate `dt` in `updateEren(dt)` (dt is already clamped).

### State additions
```
eren.hooks = [ {state: IDLE|FLYING|ANCHORED|RELEASED, ax, ay, anchorCard, relX, relY, len, tipT} x2 ]  // pre-allocated
eren.gas = 1.0        // 0..1 tank, regen when perched
eren.thrustX, eren.thrustY, eren.thrustT   // current burst for fx/pose
eren.roll             // body tilt (smoothed)
eren.mode             // PERCH | AIM | ODM_SWING | BOOST | SLASH | BALLISTIC | LAND
```
Add `eren.mode !== PERCH` and `thrustT>0` to `isSceneHighMotion()`.

### Anchor selection (replaces `resolvePhysicalWebAnchor`)
2D "raycast" from the hand toward the target: candidate anchors = card borders + screen edges (reuse `projectPointToCardBorder`, `getCardPerch*`, card-relative anchors via `updateLiveWebAnchor`). **Two hooks**: P₁ = anchor above-and-ahead of the path (like the old ideal point), P₂ = a second anchor offset in x (±0.2–0.35·jump) or the target card corner → gives asymmetric tension. Fire stagger P₂ by ~0.06s. Hooks fly at ~2500·us px/s (`tipT`) – draw the cable to the tip while FLYING; attach when tip reaches anchor.
Fallback: if no card border is valid, anchor to top/side screen edge (as before).

### Physics step (per hook i, per STEP)
```
v += g*STEP   (g = 1500*us px/s², tune)       // gravity
v += a_gas*STEP                                // gas burst
dx = P_i - p;  d = |dx|;  u = dx/d
if hook ANCHORED:
    L_i = max(Lmin, L_i + Ldot_i*STEP)         // winch: Ldot<0 reel-in (e.g. -520*us), >0 pay out
    if d > L_i:                                // taut
        p += u*(d - L_i)                       // position projection (Verlet/XPBD, compliance≈0)
        vr = dot(v,-u)                         // outward component (away from anchor)
        if vr > 0: v += u*vr                   // remove outward velocity
        // optional winch pull: v += u*reelAccel*STEP
v *= exp(-drag*STEP)   (drag≈0.15..0.4)
p += v*STEP
```
With two taut hooks the solver iterates both 2–4×. Asymmetry produces a natural roll: `rollTarget = clamp(atan2(centripetalX, g)·k)`.
Bounds: soft-clamp p inside the viewport (bounce/absorb) and avoid passing through cards only if desired (cards are decoration; allow overlap but draw character above).

### Controller (autonomous, since user only hovers/clicks)
A small decision loop picks inputs to reach the **target perch point T**:
1. **Fire** hooks (P₁,P₂) when entering ODM_SWING.
2. **Winch**: reel-in rate scaled by `clamp(dist(p,T)/jump,0.3,1)`; pay out slightly when moving away to keep a pendulum arc.
3. **Gas bursts** (cost 0.12–0.25 each, cooldown ≥0.18s): forward-up boost at launch if target higher (d̂ = normalize(T−p)+up bias); lateral bank at the arc bottom when |vx| low; **braking reverse** `d̂ = −v̂` when `dist(p,T) < brakeDist` and speed too high (replaces `landSquash` softness); vertical boost for ZIP-like climbs.
4. **Release** when `dot(v, T−p) > 0` and projected ballistic apex/landing (integrate gravity+drag analytically/numerically) lands within ~12·us of T, or when strike range reached. Release is a **ballistic** phase; then guide with a small final brake burst and snap to perch (blend last 12·us with ease-out to avoid foot popping).
5. **Chain**: if landing prediction fails, re-fire next anchor mid-air (generalizes the old two-web chain). Carry velocity is automatic because the sim keeps `v` (delete `carryVx/Vy`).
6. **Slash mode** (optional flourish): when clicked on a card with an enemy/Titan image or the card whose `CARD_REACTIONS` is aggressive: release hooks, short gas dash straight at card center, spin 360° with blades (`flipTimer` pattern), impact → `spawnLandingImpact` + shake/streaks + the card briefly jolts via `targetOffset`.
Keep `preJumpTimer` crouch (0.11s) and `landSquash`; keep `requestSwingToCard` / `window.ErenChibi.swingTo` API and LMB queue behaviour unchanged.

### Fixed-timestep wrapper
```
acc += dt; let n = 0;
while (acc >= STEP && n++ < 8) { odmStep(STEP); acc -= STEP; }
eren.vx = (p.x - prevX)/dt ...   // keep published vx,vy for renderer
```
Landing must still end with `spidey.isSwinging=false`, `swingT=1`, `perchMode=nextPerchMode`, `landSquash=1`, `spawnLandingImpact(...)`, so downstream idle logic is untouched.

## 4. Visual mapping
| Description element | 2D implementation |
|---|---|
| Camera FOV widening | Canvas has no camera: emulate with a subtle full-scene zoom `1 + 0.02·speedNorm` around the character and radial speed lines at screen edges when `|v|>~900·us`. Keep cheap (skip when low fps). |
| Spine banking | Rotate whole body `roll`; torso leans toward centripetal vector, head counter-rotates 40%. |
| Cables | Two thin steel lines (2px·us + dark outline) from each hip reel to hook; slight sag when slack (quadratic curve), straight when taut; tiny reel spin ticks. Hook head = small barbed triangle embedded in the card border/screen edge, leaves nick mark (replaces `addWebTag`). Fire: line extends with `tipT`; release: cable end whips and falls under gravity (reuse `trailingWeb` code with two strands). |
| Gas vents | Pooled white steam particles from hip units opposite `d̂_gas`: size grows, alpha fades ~0.5s, drag; plus a short hiss-flash. Reuse dust pool pattern from `particles.js`. |
| Slash / blades | Dual blades in hands; arc-trail polyline of the last ~8 blade-tip positions fading; white impact star at hit. |
| Hook release / impact | 2–3 frame motion streak along v̂ + tiny screen shake (≤3·us px) – skip when `audio`/perf low. |

## 5. Eren Yeager (teen, 104th Cadet Corps / Survey Corps era) design brief
Chibi proportions same as Spidey model (large head, ~2.5-head body), thick ink outline, cel shading; **no mask** → real face rendering (the biggest change: `drawChibiHead` must draw hair, brows, eyes, mouth instead of lenses).
- **Hair**: short messy dark brown, bangs with spiky strands, sway with wind (`windBlend`) and swing speed.
- **Eyes**: large teal-green (`#3b8f8a`-ish) with dark rim, intense angled brows; expression set: neutral, **determined** (default in swing), **angry/screaming** (reactions, slash), sleepy (night/deep idle), squint (cursor near). Reuse blink/lookX/lookY pipeline (blink, pupil offset).
- **Outfit (Survey Corps)**: white shirt, **green hooded cloak** with Wings of Freedom emblem (white/blue wings on back, flaps in wind – animate with `windBlend` and speed), brown jacket, **white pants**, **brown/black knee boots**, brown leather ODM harness straps crossing chest and thighs, **hip ODM controller boxes** (two silver gas/blade-sheath units with cable reels), small blade grips in hands (steel blades with angled tip), **gas canisters on hips**. Optional green scarf-less look; Mikasa's red scarf may be a card-based easter egg only.
- Palette suggestion: cloak `#4c6b3d`/shade `#385030`, jacket `#6b4a2f`, skin `#f2c9a3`, hair `#3a2a20`, steel `#b9c2cc`, ink `#14110f`.
- **Poses to build** (mirror existing blend variables): perch stand (arms at belt/blade grips), sassy→"arms crossed, glare", sit & dangle (blade sharpening/cleaning), crouch launch (knees bent, hands on triggers), ODM swing (leaning, both arms extended pulling triggers, legs trailing), boost (arched back), slash (spin, blades forward), landing squash, deep idle (sleeping against card edge in cloak / hanging from cable), flip on click (360° with blades).
- **Personality for reactions**: rewrite bubbles to match: "TATAKAE!", "…", "I'M GONNA KILL THEM ALL!", sweat drop, annoyed vein-pop, heart → blush + "tch".
- **Hand origin**: ODM cables originate from the **hip boxes**, not the hand. Publish `hipLeftWorldX/Y`, `hipRightWorldX/Y` (instead of `handWorldX/Y`) from the renderer; trigger-hand gesture is cosmetic only.

## 6. Implementation checklist
1. Skeleton: rename + stubs; character as simple rectangle perched on cards (verify loop/FPS/input).
2. Write `traversal/odm-physics.js` with `odmStep`, hook state machine, controller; test with `ErenChibi.swingTo(i)` between all card pairs (long, short, upward, downward, edge cards on screen borders).
3. Landing precision test: character must always finish exactly on the perch point (use snap-blend); no infinite swings (timeout 2.5s → force zip-yank with winch at max).
4. Visuals: cables, hooks, steam, banking, streaks.
5. Character model + poses + reactions.
6. Update `isSceneHighMotion`, Lively properties (add `gasPower`, `cableSpeed`, `showSteam`), perf check at 4K / 60 fps.

> [!NOTE]
> Tuning starting values (reference 1024×576, multiply by `uniformScale`): gravity 1500 px/s², hook speed 2500 px/s, reel-in 520 px/s, gas accel 2200 px/s² for 0.12–0.25s, drag 0.25/s, Lmin 24 px, release tolerance 12 px.
