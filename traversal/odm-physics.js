/**
 * traversal/odm-physics.js
 * ODM gear traversal: two grapple hooks (fly -> anchor -> winch), fixed-step 2D simulation with
 * taut-cable constraints, gravity, drag and gas bursts, plus an autonomous controller that
 * fires, reels, releases onto a ballistic arc and lands exactly on the perch point.
 */
const ODM_STEP = 1 / 120;
const ODM_DRAG = Math.exp(-0.25 * ODM_STEP);
const HK_IDLE = 0;
const HK_FLYING = 1;
const HK_ANCHORED = 2;

// Hook pool (index 0 = left hip reel, 1 = right hip reel). Pre-allocated, zero GC.
const hkState = new Uint8Array(2);
const hkAx = new Float32Array(2);
const hkAy = new Float32Array(2);
const hkLen = new Float32Array(2);
const hkLen0 = new Float32Array(2);
const hkTh0 = new Float32Array(2); // swing angle (about the anchor) at the moment the cable bit
const hkTip = new Float32Array(2);
const hkDelay = new Float32Array(2);
const hkCard = new Int16Array(2).fill(-1);
const hkRelX = new Float32Array(2);
const hkRelY = new Float32Array(2);

// Retracting cables pool (cables unhooking and rapidly reeling back into the hip reels)
const trActive = new Uint8Array(2);
const trHookX = new Float32Array(2); // Current world position of the flying hook head
const trHookY = new Float32Array(2);
const trCard = new Int16Array(2).fill(-1);
const trRelX = new Float32Array(2);
const trRelY = new Float32Array(2);

let odmAcc = 0;
let odmTgo = 0;
let odmTgo0 = 1;
let odmTotal = 0;
let odmChain = 0;
let odmCheck = 0;
let odmTx = 0;
let odmTy = 0;
let odmJump = 1;
let odmRise = 0;
let burstT = 0;
let burstDX = 0;
let burstDY = 0;
let slashWanted = false;
const SLASH_CARDS = new Set(); // card indices that count as "Titan" cards (fill in when images exist)

function setSlashWanted(idx) {
  slashWanted = SLASH_CARDS.has(idx) || Math.random() < 0.2;
}

function hipPosX(i) {
  const v = i === 0 ? eren.hipLeftWorldX : eren.hipRightWorldX;
  return v || eren.x;
}
function hipPosY(i) {
  const v = i === 0 ? eren.hipLeftWorldY : eren.hipRightWorldY;
  return v || (eren.y - 12 * uniformScale * config.erenScale);
}

// ---------------------------------------------------------------------------
// Anchor selection (2D "raycast"): card borders + screen edges near an ideal point
// ---------------------------------------------------------------------------
let pkX = 0;
let pkY = 0;
let pkCard = -1;
let pkRelX = 0;
let pkRelY = 0;

function pickAnchor(idealX, idealY, startX, startY, endX, endY, originCardIdx, targetCardIdx, avoidX, avoidY) {
  const us = uniformScale;
  const dx = endX - startX;
  const highestY = Math.min(startY, endY);
  const lowestY = Math.max(startY, endY);
  const avoidR = 55 * us;

  let bestScore = 1e18;
  let bx0 = idealX;
  let by0 = 0;
  let bCard = -1;
  let bRelX = 0;
  let bRelY = 0;

  // Screen edges
  const topX = Math.max(16, Math.min(viewWidth - 16, idealX));
  if (Math.hypot(topX - avoidX, 0 - avoidY) > avoidR) {
    const sc = Math.hypot(topX - idealX, 0 - idealY) + (highestY - 0) * 0.35;
    if (sc < bestScore) { bestScore = sc; bx0 = topX; by0 = 0; bCard = -1; }
  }
  if (idealX < viewWidth * 0.28) {
    const ly = Math.max(16, Math.min(highestY - 25 * us, idealY));
    if (Math.hypot(0 - avoidX, ly - avoidY) > avoidR) {
      const sc = Math.hypot(0 - idealX, ly - idealY) + 30 * us;
      if (sc < bestScore) { bestScore = sc; bx0 = 0; by0 = ly; bCard = -1; }
    }
  }
  if (idealX > viewWidth * 0.72) {
    const ry = Math.max(16, Math.min(highestY - 25 * us, idealY));
    if (Math.hypot(viewWidth - avoidX, ry - avoidY) > avoidR) {
      const sc = Math.hypot(viewWidth - idealX, ry - idealY) + 30 * us;
      if (sc < bestScore) { bestScore = sc; bx0 = viewWidth; by0 = ry; bCard = -1; }
    }
  }

  // Card borders
  const minPathX = Math.min(startX, endX) - 130 * us;
  const maxPathX = Math.max(startX, endX) + 130 * us;
  for (let i = 0; i < CARD_COUNT; i++) {
    if (i === originCardIdx) continue;
    projectPointToCardBorder(i, idealX, idealY);
    const bx = tempBorderX;
    const by = tempBorderY;
    if (Math.hypot(bx - avoidX, by - avoidY) <= avoidR) continue;

    if (i === targetCardIdx) {
      if (endY < startY - 70 * us) {
        const c = cards[i];
        const cs = c.scale * (1 + audioEnergy * 0.025);
        const cornerX = (c.cx + c.offsetX) + (dx >= 0 ? -1 : 1) * (c.baseW * cs) * 0.35;
        const cornerY = (c.cy + c.offsetY) - (c.baseH * cs) * 0.5;
        const sc = Math.hypot(cornerX - idealX, cornerY - idealY) + 45 * us;
        if (sc < bestScore && Math.hypot(cornerX - avoidX, cornerY - avoidY) > avoidR) {
          bestScore = sc; bx0 = cornerX; by0 = cornerY; bCard = i;
          bRelX = dx >= 0 ? -0.35 : 0.35; bRelY = -0.5;
        }
      }
      continue;
    }
    if (by > lowestY - 15 * us) continue;
    if (bx < minPathX || bx > maxPathX) continue;
    const bonus = by <= highestY ? -35 * us : 20 * us;
    const sc = Math.hypot(bx - idealX, by - idealY) + bonus;
    if (sc < bestScore) {
      bestScore = sc; bx0 = bx; by0 = by; bCard = i; bRelX = tempRelX; bRelY = tempRelY;
    }
  }

  pkX = bx0; pkY = by0; pkCard = bCard; pkRelX = bRelX; pkRelY = bRelY;
  // A cable pivot must be above both ends, otherwise anchor to the top of the screen
  if (pkY > highestY - 25 * us) {
    pkX = Math.max(16, Math.min(viewWidth - 16, idealX));
    pkY = 0; pkCard = -1; pkRelX = 0; pkRelY = 0;
  }
}

function setHook(i, delay) {
  hkState[i] = HK_FLYING;
  hkAx[i] = pkX;
  hkAy[i] = pkY;
  hkCard[i] = pkCard;
  hkRelX[i] = pkRelX;
  hkRelY[i] = pkRelY;
  hkTip[i] = 0;
  hkDelay[i] = delay;
  hkLen[i] = 0;
}

function fireHooks(sx, sy, ex, ey, originCard, targetCard) {
  const us = uniformScale;
  const dx = ex - sx;
  const dy = ey - sy;
  const jump = Math.hypot(dx, dy);
  const idealX = sx + dx * 0.55;
  const highestY = Math.min(sy, ey);
  const lift = Math.max(95 * us, Math.min(220 * us, jump * 0.38));
  const idealY = Math.max(0, highestY - lift);

  pickAnchor(idealX, idealY, sx, sy, ex, ey, originCard, targetCard, -1e9, -1e9);
  setHook(0, 0);
  const p1x = pkX;
  const p1y = pkY;

  // Second hook: offset ahead of the path in x -> asymmetric two-point tension
  const dir = dx >= 0 ? 1 : -1;
  const off = Math.max(70 * us, Math.abs(dx) * 0.3);
  pickAnchor(idealX + dir * off, idealY, sx, sy, ex, ey, originCard, targetCard, p1x, p1y);
  if (Math.hypot(pkX - p1x, pkY - p1y) < 40 * us) {
    pkX = Math.max(16, Math.min(viewWidth - 16, idealX + dir * off));
    pkY = 0; pkCard = -1; pkRelX = 0; pkRelY = 0;
  }
  setHook(1, 0.06);
}

function updateLiveHooks() {
  for (let i = 0; i < 2; i++) {
    if (hkState[i] !== HK_IDLE && hkCard[i] >= 0) {
      const c = cards[hkCard[i]];
      const cs = c.scale * (1 + audioEnergy * 0.025);
      hkAx[i] = (c.cx + c.offsetX) + hkRelX[i] * c.baseW * cs;
      hkAy[i] = (c.cy + c.offsetY) + hkRelY[i] * c.baseH * cs;
    }
  }
}

function releaseHook(i) {
  const st = hkState[i];
  if (st === HK_IDLE) return;
  const hx = hipPosX(i);
  const hy = hipPosY(i);
  let startX = hkAx[i];
  let startY = hkAy[i];
  if (st === HK_FLYING) {
    startX = hx + (hkAx[i] - hx) * hkTip[i];
    startY = hy + (hkAy[i] - hy) * hkTip[i];
  }

  trActive[i] = 1;
  trHookX[i] = startX;
  trHookY[i] = startY;
  trCard[i] = hkCard[i];
  trRelX[i] = hkRelX[i];
  trRelY[i] = hkRelY[i];

  hkState[i] = HK_IDLE;
}

function releaseAllHooks() {
  releaseHook(0);
  releaseHook(1);
}

function anyHookActive() {
  return hkState[0] !== HK_IDLE || hkState[1] !== HK_IDLE;
}

/**
 * ODM Gear Retraction: unhooked cables are rapidly spooled back into the hip units
 * rather than being left behind to droop and fade.
 */
function updateTrailingCables(dt) {
  const us = uniformScale;
  for (let i = 0; i < 2; i++) {
    if (!trActive[i]) continue;
    const hx = hipPosX(i);
    const hy = hipPosY(i);
    const dx = hx - trHookX[i];
    const dy = hy - trHookY[i];
    const dist = Math.hypot(dx, dy);

    // High-speed winch retraction into the hip reel (~0.12 - 0.15s travel)
    const retractSpeed = Math.max(4200 * us, dist / 0.12);
    const step = retractSpeed * dt;

    if (dist <= step || dist < 10 * us) {
      // Fully retracted inside the ODM gear reel!
      trActive[i] = 0;
    } else {
      trHookX[i] += (dx / dist) * step;
      trHookY[i] += (dy / dist) * step;
    }
  }
}

function trailingCablesActive() {
  return trActive[0] === 1 || trActive[1] === 1;
}

function drawTrailingCables() {
  for (let i = 0; i < 2; i++) {
    if (!trActive[i]) continue;
    const hx = hipPosX(i);
    const hy = hipPosY(i);
    // Draw taut steel cable between hip reel and retracting hook head (no lingering anchor mark)
    drawWebLine(hx, hy, trHookX[i], trHookY[i], 1.0, 1.0, 1.0, 0, false);
  }
}

function drawHooks() {
  for (let i = 0; i < 2; i++) {
    const st = hkState[i];
    if (st === HK_IDLE) continue;
    const hx = hipPosX(i);
    const hy = hipPosY(i);
    if (st === HK_FLYING) {
      if (hkDelay[i] > 0) continue;
      drawWebLine(hx, hy, hkAx[i], hkAy[i], hkTip[i], 0.95, 0.5, 0, true);
    } else {
      const d = Math.hypot(hkAx[i] - hx, hkAy[i] - hy);
      let t = Math.min(1, d / Math.max(1, hkLen[i] + 3 * uniformScale));
      t = t * t * t * t * t;
      drawWebLine(hx, hy, hkAx[i], hkAy[i], 1.0, 0.95, t, 0, true);
    }
  }
}

// ---------------------------------------------------------------------------
// Swing requests (same API as before)
// ---------------------------------------------------------------------------
function requestSwingToCard(targetCardIdx) {
  if (eren.titanState !== TITAN_NONE) return;
  if (targetCardIdx < 0 || targetCardIdx === eren.currentCard) return;
  if (!eren.isSwinging && eren.preJumpTimer <= 0) {
    eren.pendingTargetCard = targetCardIdx;
    eren.preJumpTimer = isLmbHeld ? 0.04 : 0.11;
    const targetX = getCardPerchX(targetCardIdx, PERCH_TOP_NORMAL);
    eren.facing = (targetX - eren.x) >= 0 ? 1 : -1;
    return;
  }
  if (eren.preJumpTimer > 0) {
    eren.pendingTargetCard = targetCardIdx;
    const targetX = getCardPerchX(targetCardIdx, PERCH_TOP_NORMAL);
    eren.facing = (targetX - eren.x) >= 0 ? 1 : -1;
    return;
  }
  // If already mid-swing: retract one rope and re-shoot toward the new block (total stays 2)
  if (eren.isSwinging) {
    redirectSwingMidAir(targetCardIdx);
    return;
  }
  launchSwingNow(targetCardIdx, true);
}

function redirectSwingMidAir(targetCardIdx) {
  if (targetCardIdx < 0 || targetCardIdx === eren.currentCard) return;
  const us = uniformScale;

  const previousCard = eren.currentCard;
  eren.originCard = previousCard;
  eren.currentCard = targetCardIdx;
  eren.nextPerchMode = choosePerchModeForCard(targetCardIdx);

  eren.idleTime = 0;
  eren.sassyBlend = 0;
  eren.sitBlend = 0;
  eren.deepIdleBlend = 0;
  eren.reactionBlend = 0;

  const ex = getCardPerchX(targetCardIdx, eren.nextPerchMode);
  const ey = getCardPerchY(targetCardIdx, eren.nextPerchMode);
  eren.endX = ex;
  eren.endY = ey;
  eren.endIsCard = true;
  odmTx = ex;
  odmTy = ey;

  const dx = ex - eren.x;
  const dy = ey - eren.y;
  const dist = Math.hypot(dx, dy);
  odmJump = Math.max(60 * us, dist);
  odmRise = Math.max(0, eren.y - ey);
  if (Math.abs(dx) > 2) eren.facing = dx >= 0 ? 1 : -1;

  // Gas burst redirecting momentum toward the new target
  const bx = dx / Math.max(1, dist);
  const by = dy / Math.max(1, dist) - 0.45;
  const bl = Math.hypot(bx, by) || 1;
  burstDX = (bx / bl) * 2200 * us;
  burstDY = (by / bl) * 2200 * us;
  burstT = 0.16 * Math.max(0.6, config.gasPower);
  eren.thrustX = -bx / bl;
  eren.thrustY = -by / bl;
  eren.thrustT = 0.22;

  eren.isSwinging = true;
  eren.mode = MODE_SWING;
  eren.swingDuration = Math.max(0.7, Math.min(1.2, dist / (400 * us)));
  eren.swingElapsed = 0;
  odmTotal = 0;

  // Mid-air redirect: ONE of the two ropes retracts and shoots again,
  // while the other maintains tension/momentum, keeping exactly 2 ropes total!
  let hookToRetract = 0;
  if (hkState[0] === HK_IDLE && hkState[1] !== HK_IDLE) {
    hookToRetract = 0;
  } else if (hkState[1] === HK_IDLE && hkState[0] !== HK_IDLE) {
    hookToRetract = 1;
  } else if (hkState[0] !== HK_IDLE && hkState[1] !== HK_IDLE) {
    const d0 = Math.hypot(hkAx[0] - ex, hkAy[0] - ey);
    const d1 = Math.hypot(hkAx[1] - ex, hkAy[1] - ey);
    hookToRetract = (d0 >= d1) ? 0 : 1;
  }

  // 1. Retract this hook into the hip reel
  releaseHook(hookToRetract);

  // 2. Choose a new anchor for this hook towards the newly clicked card
  const idealX = eren.x + dx * 0.55;
  const highestY = Math.min(eren.y, ey);
  const lift = Math.max(95 * us, Math.min(220 * us, dist * 0.38));
  const idealY = Math.max(0, highestY - lift);

  const otherHook = 1 - hookToRetract;
  const avoidX = (hkState[otherHook] !== HK_IDLE) ? hkAx[otherHook] : -1e9;
  const avoidY = (hkState[otherHook] !== HK_IDLE) ? hkAy[otherHook] : -1e9;
  pickAnchor(idealX, idealY, eren.x, eren.y, ex, ey, -1, targetCardIdx, avoidX, avoidY);

  // 3. Re-shoot this hook toward the new anchor!
  setHook(hookToRetract, 0.08);

  // 4. If the other hook was idle (e.g. was in ballistic mode), arm it as well with an offset
  if (hkState[otherHook] === HK_IDLE && !trActive[otherHook]) {
    const dir = dx >= 0 ? 1 : -1;
    const off = Math.max(70 * us, Math.abs(dx) * 0.3);
    pickAnchor(idealX + dir * off, idealY, eren.x, eren.y, ex, ey, -1, targetCardIdx, pkX, pkY);
    setHook(otherHook, 0.14);
  }
}

function launchSwingNow(targetCardIdx, carryVelocity) {
  if (targetCardIdx === eren.currentCard || targetCardIdx < 0) return;
  const us = uniformScale;
  const wasSwinging = eren.isSwinging;
  if (wasSwinging) releaseAllHooks(0.85);

  const previousCard = eren.currentCard;
  eren.originCard = previousCard;
  eren.currentCard = targetCardIdx;
  eren.nextPerchMode = choosePerchModeForCard(targetCardIdx);

  eren.idleTime = 0;
  eren.sassyBlend = 0;
  eren.sitBlend = 0;
  eren.deepIdleBlend = 0;
  eren.reactionBlend = 0;

  const ex = getCardPerchX(targetCardIdx, eren.nextPerchMode);
  const ey = getCardPerchY(targetCardIdx, eren.nextPerchMode);
  eren.endX = ex;
  eren.endY = ey;
  eren.endIsCard = true;
  odmTx = ex;
  odmTy = ey;
  if (!wasSwinging || !carryVelocity) {
    if (!wasSwinging) { eren.vx = 0; eren.vy = 0; }
  }
  const dx = ex - eren.x;
  const dy = ey - eren.y;
  const dist = Math.hypot(dx, dy);
  odmJump = Math.max(60 * us, dist);
  odmRise = Math.max(0, eren.y - ey);
  if (Math.abs(dx) > 2) eren.facing = dx >= 0 ? 1 : -1;

  eren.isSwinging = true;
  eren.mode = MODE_SWING;
  eren.swingT = 0;
  eren.swingDuration = 1.0;
  eren.swingElapsed = 0;
  eren.slashing = slashWanted;
  eren.slashSpin = 0;
  slashWanted = false;
  odmAcc = 0;
  odmTotal = 0;
  odmChain = 0;
  odmCheck = 0;
  burstT = 0;

  fireHooks(eren.x, eren.y, ex, ey, previousCard, targetCardIdx);

  // Launch gas burst: forward + up toward the target
  if (dist > 90 * us || ey < eren.y - 40 * us) {
    let bx = dx / Math.max(1, dist);
    let by = dy / Math.max(1, dist) - 0.55;
    const bl = Math.hypot(bx, by) || 1;
    burstDX = (bx / bl) * 2200 * us;
    burstDY = (by / bl) * 2200 * us;
    burstT = 0.15 * Math.max(0.6, config.gasPower);
    eren.thrustX = -bx / bl;
    eren.thrustY = -by / bl;
    eren.thrustT = 0.22;
  }
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
function neededAccel(t) {
  const g = 1500 * uniformScale;
  const k = 2 / (t * t);
  const ax = (odmTx - eren.x - eren.vx * t) * k;
  const ay = (odmTy - eren.y - eren.vy * t) * k - g;
  return Math.hypot(ax, ay);
}

function releaseToBallistic(tgo) {
  // Stretch the guided finish until the required gas acceleration is comfortable (no snap/pop)
  for (let n = 0; n < 8 && tgo < 0.7 && neededAccel(tgo) > 3200 * uniformScale; n++) tgo *= 1.18;
  eren.mode = MODE_BALLISTIC;
  odmTgo = tgo;
  odmTgo0 = tgo;
  releaseAllHooks(0.9);
}

/** 0..1 angular progress of the swing about the first anchored cable (distance-based fallback). */
function swingProgress() {
  let i = hkState[0] === HK_ANCHORED ? 0 : (hkState[1] === HK_ANCHORED ? 1 : -1);
  if (i < 0) return 0;
  const th0 = hkTh0[i];
  let d1 = Math.atan2(odmTx - hkAx[i], odmTy - hkAy[i]) - th0;
  while (d1 > Math.PI) d1 -= Math.PI * 2;
  while (d1 < -Math.PI) d1 += Math.PI * 2;
  let d = Math.atan2(eren.x - hkAx[i], eren.y - hkAy[i]) - th0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  let p;
  if (Math.abs(d1) < 0.06) {
    p = 1 - Math.hypot(odmTx - eren.x, odmTy - eren.y) / odmJump;
  } else {
    p = d / d1;
  }
  return p < 0 ? 0 : (p > 1 ? 1 : p);
}

function tryPredictRelease() {
  const us = uniformScale;
  const g = 1500 * us;
  const px = eren.x;
  const py = eren.y;
  const vx = eren.vx;
  const vy = eren.vy;
  const toTx = odmTx - px;
  const toTy = odmTy - py;
  const dist = Math.hypot(toTx, toTy);
  if (vx * toTx + vy * toTy <= 0 && dist > 40 * us) return false;
  const disc = vy * vy - 2 * g * (py - odmTy);
  if (disc < 0) return false;
  const sq = Math.sqrt(disc);
  const t2 = (-vy + sq) / g;
  const t1 = (-vy - sq) / g;
  const tol = 45 * us;
  if (t2 >= 0.15 && t2 <= 0.85 && Math.abs(px + vx * t2 - odmTx) < tol) { releaseToBallistic(t2); return true; }
  if (t1 >= 0.15 && t1 <= 0.85 && Math.abs(px + vx * t1 - odmTx) < tol) { releaseToBallistic(t1); return true; }
  return false;
}

function finishLanding() {
  const e = eren;
  const us = uniformScale;
  releaseAllHooks(0.9);
  e.x = odmTx;
  e.y = odmTy;
  e.vx = 0;
  e.vy = 0;
  e.swingT = 1;
  e.isSwinging = false;
  e.mode = MODE_PERCH;
  e.perchMode = e.nextPerchMode;
  e.landSquash = 1.0;
  e.idleTime = 0;
  e.sassyBlend = 0;
  e.sitBlend = 0;
  e.deepIdleBlend = 0;
  e.thrustT = 0;
  e.bladeHold = 1.0; // blades stay drawn for 1s after landing

  if (e.perchMode === PERCH_BOTTOM_UPSIDE_DOWN) {
    spawnLandingImpact(e.x, e.y, 0, 1);
  } else if (e.perchMode === PERCH_SIDE_EDGE) {
    spawnLandingImpact(e.x, e.y, cards[e.currentCard].sideDir, 0);
  } else {
    spawnLandingImpact(e.x, e.y, 0, -1);
  }

  if (e.slashing) {
    e.slashing = false;
    e.slashSpin = 0;
    const c = cards[e.currentCard];
    c.offsetY += 7 * us; // the card jolts from the impact (relaxes back via the magnetic spring)
  }

  if (isLmbHeld && lmbQueueCount > 0) {
    const nextCard = dequeueLmbCard();
    if (nextCard !== -1) requestSwingToCard(nextCard);
  }
}

/** One fixed physics step. Returns true if Eren landed (state was reset). */
function odmStep(h) {
  const e = eren;
  const us = uniformScale;
  const g = 1500 * us;
  odmTotal += h;
  e.swingElapsed += h;

  e.vy += g * h;
  if (burstT > 0) {
    burstT -= h;
    e.vx += burstDX * h;
    e.vy += burstDY * h;
  }

  if (e.mode === MODE_BALLISTIC) {
    odmTgo -= h;
    if (odmTgo <= h * 1.5) {
      finishLanding();
      return true;
    }
    // Gas guidance: constant acceleration that rendezvous with the perch point at tgo
    const rx = odmTx - e.x;
    const ry = odmTy - e.y;
    const k = 2 / (odmTgo * odmTgo);
    let ax = (rx - e.vx * odmTgo) * k;
    let ay = (ry - e.vy * odmTgo) * k - g;
    const cap = 6000 * us;
    const m = Math.hypot(ax, ay);
    if (m > cap) { ax *= cap / m; ay *= cap / m; }
    if (m > cap * 0.85 && odmTgo < 0.8) odmTgo += h * 0.6; // can't make it in time: stretch the finish
    e.vx += ax * h;
    e.vy += ay * h;
    if (m > 650 * us) {
      e.thrustX = -ax / m;
      e.thrustY = -ay / m;
      e.thrustT = 0.2;
    }
  }

  e.vx *= ODM_DRAG;
  e.vy *= ODM_DRAG;
  e.x += e.vx * h;
  e.y += e.vy * h;

  // Hooks: flight, attach, winch, constraint
  if (e.mode === MODE_SWING) {
    for (let i = 0; i < 2; i++) {
      if (hkState[i] === HK_FLYING) {
        if (hkDelay[i] > 0) {
          hkDelay[i] -= h;
          if (hkDelay[i] <= 0) {
            trActive[i] = 0; // Retraction finished, now shooting!
          }
          continue;
        }
        const len = Math.hypot(hkAx[i] - hipPosX(i), hkAy[i] - hipPosY(i)) + 1;
        hkTip[i] += (2500 * us * h) / len;
        if (hkTip[i] >= 1) {
          hkTip[i] = 1;
          hkState[i] = HK_ANCHORED;
          const d = Math.hypot(hkAx[i] - e.x, hkAy[i] - e.y);
          hkLen[i] = Math.max(24 * us, d + (i === 1 ? 0.10 * odmJump : 0));
          hkLen0[i] = hkLen[i];
          hkTh0[i] = Math.atan2(e.x - hkAx[i], e.y - hkAy[i]);
        }
      }
    }
    // Scheduled winches: each cable is reeled / paid out toward the exact length that ends at the
    // perch point, combining angular progress with a time floor so vertical drops never deadlock
    const prog = swingProgress();
    const timeProg = Math.min(1, e.swingElapsed / Math.max(0.26, Math.min(0.58, odmJump / (700 * us))));
    const wProg = Math.max(prog, timeProg);
    const sm = wProg * wProg * (3 - 2 * wProg);
    const spool = 950 * us * config.cableSpeed * h;
    for (let i = 0; i < 2; i++) {
      if (hkState[i] !== HK_ANCHORED) continue;
      const lEnd = Math.hypot(odmTx - hkAx[i], odmTy - hkAy[i]) + (i === 1 ? 0.04 * odmJump : 0);
      const lTgt = hkLen0[i] + (lEnd - hkLen0[i]) * sm;
      const dl = lTgt - hkLen[i];
      hkLen[i] += Math.max(-spool, Math.min(spool, dl));
      if (hkLen[i] < 24 * us) hkLen[i] = 24 * us;
    }
    // Gas assist: keep enough energy to actually reach a higher perch
    if (hkState[0] === HK_ANCHORED && prog < 0.85) {
      const sp = Math.hypot(e.vx, e.vy);
      const vNeed = Math.min(1700 * us, Math.max(240 * us + Math.sqrt(2 * g * odmRise), odmJump / 0.8));
      if (sp < vNeed) {
        const tx = odmTx - e.x;
        const ty = odmTy - e.y - 0.3 * Math.hypot(odmTx - e.x, odmTy - e.y);
        const tl = Math.hypot(tx, ty) || 1;
        const ga = 1800 * us * config.gasPower;
        e.vx += (tx / tl) * ga * h;
        e.vy += (ty / tl) * ga * h;
        e.thrustX = -tx / tl;
        e.thrustY = -ty / tl;
        e.thrustT = 0.15;
      }
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < 2; i++) {
        if (hkState[i] !== HK_ANCHORED) continue;
        const dx = hkAx[i] - e.x;
        const dy = hkAy[i] - e.y;
        const d = Math.hypot(dx, dy);
        if (d > hkLen[i] && d > 0.001) {
          const ux = dx / d;
          const uy = dy / d;
          const pen = d - hkLen[i];
          e.x += ux * pen;
          e.y += uy * pen;
          const vr = -(e.vx * ux + e.vy * uy);
          if (vr > 0) { e.vx += ux * vr; e.vy += uy * vr; }
        }
      }
    }
  }

  // Keep inside the viewport
  const floorY = viewHeight - 14 * us;
  if (e.y > floorY) { e.y = floorY; if (e.vy > 0) e.vy *= -0.2; }
  if (e.x < 0) { e.x = 0; if (e.vx < 0) e.vx = 0; }
  else if (e.x > viewWidth) { e.x = viewWidth; if (e.vx > 0) e.vx = 0; }

  // Controller: choose release / chain / timeout
  if (e.mode === MODE_SWING) {
    const dist = Math.hypot(odmTx - e.x, odmTy - e.y);
    const prog = swingProgress();
    if (e.swingElapsed > 0.1) {
      const sp = Math.hypot(e.vx, e.vy);
      const isSteepDrop = (odmTy - e.y) > 70 * us && Math.abs(odmTx - e.x) < (odmTy - e.y) * 0.45;
      if (prog >= 0.88 || dist < 30 * us || (isSteepDrop && e.swingElapsed > 0.16)) {
        releaseToBallistic(Math.max(0.15, Math.min(0.42, dist / Math.max(sp, 350 * us))));
        return false;
      }
      if (e.swingElapsed > 0.35 && sp < 45 * us) {
        // Anti-stall guard: if trapped between opposing cables, release cleanly into a guided dive
        releaseToBallistic(Math.max(0.18, Math.min(0.45, dist / (750 * us))));
        return false;
      }
      if (prog > 0.35 && (++odmCheck % 3) === 0 && tryPredictRelease()) return false;
    }
    if (e.swingElapsed > 0.85 && odmChain < 2 && dist > 140 * us) {
      // Prediction failed: let go and re-fire the next anchor mid-air
      odmChain++;
      releaseAllHooks(0.9);
      fireHooks(e.x, e.y, odmTx, odmTy, -1, e.currentCard);
      e.swingElapsed = 0;
      odmJump = Math.max(60 * us, dist);
      return false;
    }
    if (odmTotal > 1.25) {
      // Timeout: force a guided finish so there is never an endless swing
      releaseToBallistic(Math.max(0.18, Math.min(0.45, dist / (900 * us))));
    }
  }
  return false;
}

function updateOdm(dt) {
  const e = eren;
  if (e.endIsCard) {
    e.endX = getCardPerchX(e.currentCard, e.nextPerchMode);
    e.endY = getCardPerchY(e.currentCard, e.nextPerchMode);
  }
  odmTx = e.endX;
  odmTy = e.endY;
  updateLiveHooks();

  odmAcc += dt;
  let n = 0;
  while (odmAcc >= ODM_STEP && n++ < 24) {
    odmAcc -= ODM_STEP;
    if (odmStep(ODM_STEP)) return;
  }
  if (n >= 24) odmAcc = 0;

  if (burstT > 0 || e.thrustT > 0) {
    if (typeof spawnOdmSteam === 'function' && Math.random() < 0.65) {
      spawnOdmSteam(hipPosX(0), hipPosY(0), e.thrustX || 0, e.thrustY || 1);
      spawnOdmSteam(hipPosX(1), hipPosY(1), e.thrustX || 0, e.thrustY || 1);
    }
  }

  e.thrustT = Math.max(0, e.thrustT - dt);
  e.swingT = Math.min(0.99, odmTotal / e.swingDuration);
  if (e.slashing && e.mode === MODE_BALLISTIC) {
    e.slashSpin = (1 - Math.max(0, odmTgo) / Math.max(0.01, odmTgo0)) * Math.PI * 2;
  }
  const rollTarget = Math.max(-1, Math.min(1, e.vx / (1400 * uniformScale))) * 0.5;
  e.roll += (rollTarget - e.roll) * (1 - Math.exp(-10 * dt));
}
