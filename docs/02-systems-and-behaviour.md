# 02 – Systems & Behaviour Reference (what to carry over)

Detailed notes on the systems that are **character-agnostic**. Rename `spidey`→`eren` and keep them. Companion docs: `01-architecture-and-reuse.md`, `03-odm-swing-spec.md`.

## 1. State object (`behaviour/spidey-state.js`)
Single pre-allocated object `spidey` (keep as `eren`). Groups:
- **Perch**: `currentCard`, `originCard`, `perchMode`, `nextPerchMode`, `x,y,vx,vy`, `facing` (±1 target), `facingScale` (smoothed −1..1 squash-turn, rate 18/s), `turnHop`, `landSquash`.
- **Swing**: `isSwinging`, `swingT` (0..1), `swingDuration`, `swingMode`, `startX/Y`, `endX/Y`, `anchorX/Y`, `anchorCard`, `anchorRelX/Y` (anchor stored relative to card so it follows magnetic drift), `preJumpTimer` (launch crouch 0.11s; 0.04s while LMB held), `pendingTargetCard`, `carryVx/Vy/carryTime` (momentum blended into the next segment, 0.2s), `isChainSegment`/`chainTargetCard` (two-anchor long jump).
- **Idle**: `idleTime`, `sassyBlend`, `sitBlend`, `deepIdleBlend`, `deepIdleMode`. All `*Blend` are 0..1 values eased with smoothstep `b*b*(3-2b)` in the renderer.
- **Face/attention**: `blinkTimer/blinkProgress/isBlinking/pendingDoubleBlink`, `lookX/lookY` (eye target), `cursorNear` (squint), `windBlend/windDir` (brace when cursor whipped fast), `reactionCode/reactionBlend`.
- **Published each frame by renderer for others to use**: `handWorldX/Y` (cable/web origin), `headWorldX/Y`, `headRot`, `headFlipY`.

### Enums
- **Perch modes** (top-row cards would clip the head off-screen, so randomized by `choosePerchModeForCard`): `PERCH_TOP_NORMAL=0`, `PERCH_BOTTOM_UPSIDE_DOWN=1`, `PERCH_SIDE_EDGE=2`, `PERCH_TOP_CROUCH=3`. Geometry in `getCardPerchX/Y(idx, mode)`.
- **Deep idle** (after `deepIdleDelay`=18s, 9s at night): yawn+stretch, lie flat, hang upside-down on thread. *Eren version idea*: hang from ODM cable, sit on edge sharpening blades, sleep with scarf.
- **Time of day** (`timeOfDayMode`, refreshed every 60s): night 23–05 drowsy; morning 06–10 coffee mug; else day.
- **Card reactions** (`CARD_REACTIONS` Int8Array indexed by card): `GIMME, AWESOME, CAMERA, HELLYES, OWW, SWEAT, MUSIC, HEARTS, CONFUSED, OUCH, CHILL`. Rendered by `drawCardReaction(s)` with comic bubbles (`drawComicBubble`, `drawHeartShape`, `drawSweatDrop`). **Rewrite the text/emotes to suit the new card images and Eren's personality** (e.g. "TATAKAE!", "I'll kill them all!", angry clench). The card→reaction table must be rewritten to match the new images.

## 2. Idle progression (in `updateSpiderMan`)
`idleTime` accumulates while perched; thresholds from `config`: `sassyPoseDelay=2s` (hands on hips squint) → `idleSitDelay=5s` (sit, dangle legs over border, leg kick `sin(t*3.2)`) → `deepIdleDelay=18s` (random deep idle). Launching a swing zeroes all blends. Breathing: `sin(elapsed*3)*0.65*s`.

## 3. Eye tracking, blink, wind brace
- Blink: 0.15s, interval `2.2+rand*3.8`s, 26% double blink.
- Look: unit-ish vector `delta/(d+60*uniformScale)` to `smoothMouse`, smoothed rate 10/s; `cursorNear` squint when cursor within ~22–62 px·s of the head.
- Wind brace: `windTarget = clamp((mouseSpeed/uniformScale − 1600)/2400)`, attack 7/s, release 2.2/s; renderer leans body `−windDir*0.13*w` + 31 Hz shiver and draws streak lines. *For Eren reuse as "scarf/hair whipped by wind"*.

## 4. Cards & magnetic field (`image-block/`)
- `CARD_DEFINITIONS`: 11 entries measured on a 1024×576 reference `{x,y,w,h,radius,isTopRow,sideDir,src,altSrc,crop}`; `crop` = ratios `{sxRatio,syRatio,swRatio,shRatio}` of the source image; both `./images/name%20(n).jpg` and raw-space `altSrc` fallback (Lively path quirks). `sideDir` = which inner side the character sits on.
- `card-renderer.js`: per-card **offscreen cache** (rounded rect, crop, film grain baked in; `rebuildCardCache` on resize/grain change), `drawCard`, `sortDrawOrderByScale` (bigger on top), `createFilmGrainPattern`.
- `magnetic-field.js`: for each card, `r = (dist−inner)/(radius−inner)`, `fieldStrength=(1−r²)²`, scale target `1+(maxScale−1)*field`, offset pull toward the cursor ≤ `maxMagnetPull`. Hover dwell (`hoverDwellTime=0.18s`, 0.04s while LMB held; min field 0.32 / 0.24) selects the strongest card → `requestSwingToCard`. Also exposes `projectPointToCardBorder(idx,px,py)` → sets globals `tempBorderX/Y`, `tempRelX/Y` (nearest point on card border + normalized rel coords) used by anchor selection.

## 5. Input (`input/pointer-events.js`)
- **Quick click**: on character → flip/wave (`flipTimer` 0.65s, 360° flip + hop 26·s); on a card → "shoot" at the click point (`clickEffect` {active,timer,duration,targetX/Y,cardIdx,relX/Y}), leaves a lingering tag (`addWebTag` after 0.14s) and swings there.
- **LMB hold** (≥170 ms or drag >8 px): dragging across cards enqueues them (`enqueueLmbCard`/`dequeueLmbCard`, `lmbCardQueue`), character visits each and connects consecutive cards with persistent strands (`startPhotoWebConnection(cardA, cardB)`, pool `WEB_CONN_POOL_SIZE`, states ACTIVE/FADING, oldest evicted, pluck/hover wobble, static cache rebuilt when cards are at rest).
- Also: blur/mouseleave reset, `visibilitychange` pauses rAF, `resize`→`handleResize`.
- **Eren mapping**: the card-to-card strand becomes a cable/rope or "wire" between photos; the click tag becomes an embedded hook with a small steel anchor plate.

## 6. Effects (`effects/particles.js`)
Pooled arrays (`dustX/Y/Vx/Vy/Alpha`, `activeDustCount`): `spawnLandingImpact(x,y,nx,ny)` (dust + impact ticks, drag `exp(−5.5dt)`, fade 2.4/s), `drawClickEffects(s)`, `drawLandingDust()`. Audio-reactive background specks (`PARTICLE_COUNT`, in `loop.js`). Add: gas/steam puffs (see doc 03 §6).

## 7. Character drawing conventions (`character/`)
- Helper primitives to **keep signatures** (art changes inside): `drawOutlinedSegment(x1,y1,x2,y2,thickness,fill,inkWidth)` (ink-outlined limb), `drawChibiBoot`, `drawChibiForearmAndHand`, `drawChibiHead(cx,cy,s,facingScale,squint)`, `drawChibiTorso`, `drawSpideyCastShadow()` (soft shadow on the card).
- Style: chibi proportions, thick ink outline, flat color + cel shading (Spider-Verse comic). All sizes = `k * s` where `s = uniformScale * config.scale`.
- `drawSpiderMan()` composes pose by blending numeric variables (sassy/sit/deep/crouch/swing/wind) rather than keyframes → add new poses by adding a blend variable and lerping joint coordinates. Pose uses a local space (`ctx.translate` to feet, `ctx.scale(facingScale,1)`), joints expressed as elbow/hand targets. During swing the body tilts `atan2(vy, vx*dir)*0.32*dir`, plus a release flip `sin(((t−0.78)/0.22)π)*0.4`.
- Hand world position is computed during render (local hand offset `(9.5·dir·s, −18.5·s)` rotated by body tilt) and stored in `handWorldX/Y`; the web/cable draws from there.
- Landing: `landSquash` decays 3.8/s; squash = `sin(landSquash·π)*0.22`; pre-jump crouch `sin(preJump/0.11·π)*0.34`.
