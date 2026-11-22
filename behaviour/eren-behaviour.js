/**
 * behaviour/eren-behaviour.js
 * Natural blinking, eye tracking, wind brace, idle progression, swing update, and comic reaction bubbles.
 */

/**
 * Updates natural randomized blinking (with 25% chance of double-blink).
 */
function updateNaturalBlinking(dt) {
  if (eren.isBlinking) {
    eren.blinkProgress += dt / 0.15;
    if (eren.blinkProgress >= 1) {
      eren.blinkProgress = 0;
      eren.isBlinking = false;
      if (eren.pendingDoubleBlink) {
        eren.pendingDoubleBlink = false;
        eren.blinkTimer = 0.09;
      } else {
        eren.blinkTimer = 2.2 + Math.random() * 3.8;
      }
    }
  } else {
    eren.blinkTimer -= dt;
    if (eren.blinkTimer <= 0) {
      eren.isBlinking = true;
      eren.blinkProgress = 0;
      eren.pendingDoubleBlink = Math.random() < 0.26;
    }
  }
}

/**
 * Records a direct click on Eren within a 5-second rolling window.
 * - 3rd & 4th clicks: Eren gets angry with his hand in front of his mouth (hand-bite warning).
 * - 5th click under 5s: 5-7 yellow thunderbolts + white clouds -> Attack Titan transformation!
 */
function recordErenClick() {
  const now = elapsedTime;
  let count = 0;
  for (let i = 0; i < eren.erenClickCount; i++) {
    if (now - eren.erenClickTimes[i] <= 5.0) {
      eren.erenClickTimes[count++] = eren.erenClickTimes[i];
    }
  }
  if (count < eren.erenClickTimes.length) {
    eren.erenClickTimes[count++] = now;
  }
  eren.erenClickCount = count;

  if (eren.erenClickCount >= 5) {
    triggerTitanTransform();
  }
}

function triggerTitanTransform() {
  const s = uniformScale * config.erenScale;
  eren.erenClickCount = 0;

  // Cancel any ODM swing/jump and lock strictly onto the current block
  if (typeof releaseAllHooks === 'function') releaseAllHooks();
  eren.isSwinging = false;
  eren.preJumpTimer = 0;
  eren.pendingTargetCard = -1;
  eren.mode = MODE_PERCH;
  eren.bladeHold = 0;
  eren.slashing = false;
  eren.sassyBlend = 0;
  eren.sitBlend = 0;
  eren.deepIdleBlend = 0;
  eren.reactionBlend = 0;
  eren.perchMode = PERCH_TOP_NORMAL;

  eren.x = getCardPerchX(eren.currentCard, PERCH_TOP_NORMAL);
  eren.y = getCardPerchY(eren.currentCard, PERCH_TOP_NORMAL);
  eren.vx = 0;
  eren.vy = 0;

  eren.titanState = TITAN_TRANSFORMING;
  eren.titanTransTimer = 0;
  eren.titanIdleTimer = 0;
  eren.titanJumpY = 0;
  eren.titanSteamAccum = 0;
  eren.titanHitCount = 0; // Leap to another image block after every 2 hits
  eren.titanLeapTargetCard = -1;

  // 5-7 yellow thunderbolts + white clouds + golden shockwave around him
  spawnTitanLightning(eren.x, eren.y, s);
  spawnTitanClouds(eren.x, eren.y, 28, s, false);
  spawnShockwave(eren.x, eren.y - 12 * s, 96 * s, '#ffe53b', 3.4 * s);
  eren.screenShake = 1.0;

  // Jolt the block he's standing on
  cards[eren.currentCard].offsetY += 10 * uniformScale;
}

function pushCardsRadially(originX, originY, strength) {
  const us = uniformScale;
  const maxDist = 280 * us;
  for (let i = 0; i < CARD_COUNT; i++) {
    if (i === eren.currentCard) continue;
    const c = cards[i];
    const dx = c.cx - originX;
    const dy = c.cy - originY;
    const d = Math.hypot(dx, dy);
    if (d > 1 && d < maxDist) {
      const f = (1 - d / maxDist) * strength * us;
      c.offsetX += (dx / d) * f;
      c.offsetY += (dy / d) * f;
    }
  }
}

// Pre-allocated Fisher-Yates shuffle bag so Attack Titan visits every non-Mikasa image before repeating
const titanCardBag = new Int8Array(CARD_COUNT);
let titanBagLen = 0;
let titanBagPos = 0;
let titanLastCard = -1;

function refillTitanCardBag(excludeCard) {
  titanBagLen = 0;
  for (let i = 0; i < CARD_COUNT; i++) {
    if (CARD_REACTIONS[i] !== REACT_MIKASA) {
      titanCardBag[titanBagLen++] = i;
    }
  }
  // Fisher-Yates shuffle
  for (let i = titanBagLen - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = titanCardBag[i];
    titanCardBag[i] = titanCardBag[j];
    titanCardBag[j] = tmp;
  }
  // Avoid starting a fresh bag with the current card or the immediately previous card
  if (titanBagLen > 1 && (titanCardBag[0] === excludeCard || titanCardBag[0] === titanLastCard)) {
    const swapIdx = 1 + Math.floor(Math.random() * (titanBagLen - 1));
    const tmp = titanCardBag[0];
    titanCardBag[0] = titanCardBag[swapIdx];
    titanCardBag[swapIdx] = tmp;
  }
  titanBagPos = 0;
}

function drawNextTitanCard() {
  if (titanBagPos >= titanBagLen) {
    refillTitanCardBag(eren.currentCard);
  }
  // If the next card in the bag happens to be the one he's standing on, swap it forward
  if (titanCardBag[titanBagPos] === eren.currentCard) {
    if (titanBagPos + 1 < titanBagLen) {
      const tmp = titanCardBag[titanBagPos];
      titanCardBag[titanBagPos] = titanCardBag[titanBagPos + 1];
      titanCardBag[titanBagPos + 1] = tmp;
    } else {
      refillTitanCardBag(eren.currentCard);
    }
  }
  const picked = titanCardBag[titanBagPos++];
  titanLastCard = eren.currentCard;
  return picked;
}

function pickNextTitanAction() {
  // Leap to the next unvisited image in the shuffle bag after every 2 hits (never Mikasa's card)
  if (eren.titanHitCount >= 2 && CARD_COUNT > 1) {
    const target = drawNextTitanCard();
    if (target < 0 || target === eren.currentCard) return;

    eren.titanHitCount = 0;
    eren.titanAction = TITAN_ACT_LEAP;
    eren.titanActionTimer = 0;
    eren.titanActionDur = 0.88;
    eren.titanImpactDone = false;
    eren.titanJumpY = 0;
    eren.titanLeapStartX = eren.x;
    eren.titanLeapStartY = eren.y;
    eren.titanLeapTargetCard = target;
    const tx = getCardPerchX(target, PERCH_TOP_NORMAL);
    eren.facing = (tx - eren.x) >= 0 ? 1 : -1;
    return;
  }

  // Pick a varied strike/roar without falling into a fixed Punch -> Kick -> Jump cycle
  const prev = eren.titanAction;
  let nextAct = prev;
  for (let tries = 0; tries < 6 && nextAct === prev; tries++) {
    const r = Math.random();
    if (r < 0.34) nextAct = TITAN_ACT_PUNCH;
    else if (r < 0.66) nextAct = TITAN_ACT_KICK;
    else if (r < 0.88) nextAct = TITAN_ACT_JUMP;
    else nextAct = TITAN_ACT_ROAR;
  }
  if (nextAct === prev) {
    nextAct = (prev + 1 + Math.floor(Math.random() * 2)) % 3;
  }

  eren.titanAction = nextAct;
  eren.titanActionTimer = 0;
  eren.titanImpactDone = false;
  eren.titanJumpY = 0;
  eren.titanActionDur = nextAct === TITAN_ACT_JUMP ? 0.95 : (nextAct === TITAN_ACT_ROAR ? 0.85 : 0.78);

  // Occasionally flip facing randomly during rampage (never following the mouse!)
  if (Math.random() < 0.35) {
    eren.facing = -eren.facing;
  }
}

/**
 * Updates Eren's pendulum swing trajectory, launch crouch, squash-turn,
 * autonomous roaming, multi-stage idle progression, and Attack Titan mode.
 */
function updateEren(dt) {
  if (!config.showEren) return;

  const s = uniformScale * config.erenScale;
  updateTitanEffects(dt);

  if (eren.screenShake > 0) {
    eren.screenShake = Math.max(0, eren.screenShake - dt * 2.8);
  }
  if (eren.titanMarkTimer > 0 && eren.titanState === TITAN_NONE) {
    eren.titanMarkTimer = Math.max(0, eren.titanMarkTimer - dt);
    eren.titanSteamAccum += dt;
    if (eren.titanSteamAccum >= 0.34 && eren.titanMarkTimer > 0.8) {
      eren.titanSteamAccum = 0;
      if (typeof spawnOdmSteam === 'function') {
        spawnOdmSteam(
          eren.x + (Math.random() - 0.5) * 10 * s,
          eren.y - 16 * s,
          (Math.random() - 0.5) * 0.25,
          -0.6
        );
      }
    }
  }

  // Prune clicks older than 5 seconds so 3rd-click angry pose resets if 5s elapse
  if (eren.erenClickCount > 0) {
    let kept = 0;
    for (let i = 0; i < eren.erenClickCount; i++) {
      if (elapsedTime - eren.erenClickTimes[i] <= 5.0) {
        eren.erenClickTimes[kept++] = eren.erenClickTimes[i];
      }
    }
    eren.erenClickCount = kept;
  }

  // Update landing dust particles (used by both human Eren and Attack Titan impacts)
  if (activeDustCount > 0) {
    let anyAlive = false;
    const dustDrag = Math.exp(-5.5 * dt);
    for (let i = 0; i < activeDustCount; i++) {
      if (dustAlpha[i] > 0.01) {
        dustX[i] += dustVx[i] * dt;
        dustY[i] += dustVy[i] * dt;
        dustVx[i] *= dustDrag;
        dustVy[i] *= dustDrag;
        dustAlpha[i] -= dt * 2.4;
        anyAlive = true;
      }
    }
    if (!anyAlive) activeDustCount = 0;
  }

  // =========================================================================
  // ATTACK TITAN MODE: Non-obedient, ignores mouse, stays on current block!
  // =========================================================================
  if (eren.titanState !== TITAN_NONE) {
    updateTrailingCables(dt);
    if (typeof updateSteam === 'function') updateSteam(dt);

    // Strictly ignore mouse cursor (angry & not obedient!)
    eren.lookX = 0;
    eren.lookY = 0;
    eren.cursorNear = 0;
    eren.windBlend = 0;
    eren.facingScale = eren.facing;
    eren.turnHop = 0;

    // Stay locked onto the top of his current image block (unless mid-leap to a random block)
    if (eren.titanState !== TITAN_ACTIVE || eren.titanAction !== TITAN_ACT_LEAP) {
      eren.x = getCardPerchX(eren.currentCard, PERCH_TOP_NORMAL);
      eren.y = getCardPerchY(eren.currentCard, PERCH_TOP_NORMAL);
    }
    eren.vx = 0;
    eren.vy = 0;

    if (eren.titanState === TITAN_TRANSFORMING) {
      eren.titanTransTimer += dt;
      if (eren.titanTransTimer >= 0.72) {
        eren.titanState = TITAN_ACTIVE;
        eren.titanIdleTimer = 0;
        eren.titanAction = TITAN_ACT_ROAR;
        eren.titanActionTimer = 0;
        eren.titanActionDur = 0.75;
        eren.titanImpactDone = false;
      }
    } else if (eren.titanState === TITAN_ACTIVE) {
      eren.titanIdleTimer += dt;
      eren.titanActionTimer += dt;

      // Subtle rising Titan heat steam
      eren.titanSteamAccum += dt;
      if (eren.titanSteamAccum >= 0.36) {
        eren.titanSteamAccum = 0;
        spawnTitanClouds(eren.x + (Math.random() - 0.5) * 18 * s, eren.y - 16 * s, 1, s * 0.48, false);
      }

      const p = Math.min(1, eren.titanActionTimer / Math.max(0.01, eren.titanActionDur));
      const c = cards[eren.currentCard];

      if (eren.titanAction === TITAN_ACT_LEAP && eren.titanLeapTargetCard >= 0) {
        const tx = getCardPerchX(eren.titanLeapTargetCard, PERCH_TOP_NORMAL);
        const ty = getCardPerchY(eren.titanLeapTargetCard, PERCH_TOP_NORMAL);
        if (p < 0.18) {
          eren.x = eren.titanLeapStartX;
          eren.y = eren.titanLeapStartY;
          eren.titanJumpY = 0;
        } else if (p < 0.82) {
          const u = (p - 0.18) / 0.64;
          eren.x = eren.titanLeapStartX + (tx - eren.titanLeapStartX) * u;
          eren.y = eren.titanLeapStartY + (ty - eren.titanLeapStartY) * u;
          const dist = Math.hypot(tx - eren.titanLeapStartX, ty - eren.titanLeapStartY);
          const arcH = Math.max(60 * s, Math.min(145 * s, dist * 0.42));
          eren.titanJumpY = Math.sin(u * Math.PI) * arcH;
        } else {
          eren.currentCard = eren.titanLeapTargetCard;
          eren.x = tx;
          eren.y = ty;
          eren.titanJumpY = 0;
          if (!eren.titanImpactDone) {
            eren.titanImpactDone = true;
            cards[eren.currentCard].offsetY += 18 * uniformScale;
            eren.screenShake = 1.0;
            spawnLandingImpact(eren.x, eren.y, 0, -1);
            spawnTitanClouds(eren.x, eren.y, 7, s * 0.72, false);
            spawnShockwave(eren.x, eren.y, 78 * s, '#ffffff', 2.8 * s);
            spawnAnchorSparks(eren.x, eren.y, 8);
            pushCardsRadially(eren.x, eren.y, 12);
          }
        }
      } else if (eren.titanAction === TITAN_ACT_JUMP) {
        if (p >= 0.22 && p <= 0.72) {
          eren.titanJumpY = Math.sin(((p - 0.22) / 0.50) * Math.PI) * 34 * s;
        } else {
          eren.titanJumpY = 0;
        }
        if (p >= 0.72 && !eren.titanImpactDone) {
          eren.titanImpactDone = true;
          eren.titanHitCount++;
          c.offsetY += 14 * uniformScale;
          eren.screenShake = 0.8;
          spawnLandingImpact(eren.x, eren.y, 0, -1);
          spawnShockwave(eren.x, eren.y, 62 * s, '#ffffff', 2.3 * s);
          spawnAnchorSparks(eren.x, eren.y, 6);
          pushCardsRadially(eren.x, eren.y, 8);
        }
      } else if (eren.titanAction === TITAN_ACT_PUNCH) {
        eren.titanJumpY = 0;
        if (p >= 0.52 && !eren.titanImpactDone) {
          eren.titanImpactDone = true;
          eren.titanHitCount++;
          c.offsetY += 11 * uniformScale;
          eren.screenShake = 0.65;
          const ix = eren.x + eren.facing * 14 * s;
          spawnLandingImpact(ix, eren.y, 0, -1);
          spawnShockwave(ix, eren.y, 46 * s, '#ffe8b0', 2.1 * s);
          spawnAnchorSparks(ix, eren.y, 5);
        }
      } else if (eren.titanAction === TITAN_ACT_KICK) {
        eren.titanJumpY = 0;
        if (p >= 0.52 && !eren.titanImpactDone) {
          eren.titanImpactDone = true;
          eren.titanHitCount++;
          c.offsetY += 9 * uniformScale;
          c.offsetX += eren.facing * 6 * uniformScale;
          eren.screenShake = 0.55;
          const ix = eren.x + eren.facing * 16 * s;
          spawnLandingImpact(ix, eren.y, 0, -1);
          spawnShockwave(ix, eren.y, 42 * s, '#ffe8b0', 1.9 * s);
          spawnAnchorSparks(ix, eren.y, 5);
        }
      } else {
        eren.titanJumpY = 0;
        eren.roarPulse = Math.sin(p * Math.PI);
        if (eren.roarPulse > 0.25) {
          eren.screenShake = Math.max(eren.screenShake, 0.32 * eren.roarPulse);
        }
        if (p >= 0.22 && !eren.titanImpactDone) {
          eren.titanImpactDone = true;
          const ry = eren.headWorldY || (eren.y - 48 * s);
          spawnShockwave(eren.x, ry, 72 * s, '#ffe53b', 2.4 * s);
          spawnShockwave(eren.x, ry, 108 * s, '#ffffff', 1.5 * s);
        }
      }
      if (eren.titanAction !== TITAN_ACT_ROAR) {
        eren.roarPulse = 0;
      }

      if (eren.titanActionTimer >= eren.titanActionDur) {
        pickNextTitanAction();
      }

      // After being left idle for 10 seconds -> revert back to Eren with lots of smoke!
      if (eren.titanIdleTimer >= 10.0 && eren.titanAction !== TITAN_ACT_LEAP) {
        eren.titanState = TITAN_REVERTING;
        eren.titanTransTimer = 0;
        eren.titanJumpY = 0;
        eren.titanSteamAccum = 0;
        spawnTitanClouds(eren.x, eren.y, 34, s, true);
      }
    } else if (eren.titanState === TITAN_REVERTING) {
      eren.titanTransTimer += dt;
      // Continuously billow dense white evaporation smoke during the transition back
      if (eren.titanTransTimer < 0.65) {
        eren.titanSteamAccum += dt;
        if (eren.titanSteamAccum >= 0.08) {
          eren.titanSteamAccum = 0;
          spawnTitanClouds(eren.x, eren.y, 5, s, true);
        }
      }
      if (eren.titanTransTimer >= 1.0) {
        eren.titanState = TITAN_NONE;
        eren.titanTransTimer = 0;
        eren.titanIdleTimer = 0;
        eren.roarPulse = 0;
        eren.erenClickCount = 0;
        eren.idleTime = 0;
        eren.landSquash = 0.6;
        eren.titanMarkTimer = 8.0; // Iconic post-revert Titan shifter cheek marks + light steam
        eren.titanSteamAccum = 0;
        eren.autoRoamTimer = 25 + Math.random() * 20;
      }
    }
    return;
  }

  updateNaturalBlinking(dt);

  // Eye tracking toward the cursor + squint when the cursor gets very close (skip math when idle & centered)
  if (isPointerActive || Math.abs(eren.lookX) > 0.002 || Math.abs(eren.lookY) > 0.002 || eren.cursorNear > 0.002 || eren.windBlend > 0.002) {
    let tx = 0;
    let ty = 0;
    let near = 0;
    if (isPointerActive && eren.headWorldX) {
      const ddx = smoothMouseX - eren.headWorldX;
      const ddy = smoothMouseY - eren.headWorldY;
      const d = Math.hypot(ddx, ddy);
      tx = ddx / (d + 60 * uniformScale);
      ty = ddy / (d + 60 * uniformScale);
      near = Math.max(0, Math.min(1, 1 - (d - 22 * s) / (40 * s)));
    }
    const lookA = 1 - Math.exp(-10 * dt);
    eren.lookX += (tx - eren.lookX) * lookA;
    eren.lookY += (ty - eren.lookY) * lookA;
    eren.cursorNear += (near - eren.cursorNear) * (1 - Math.exp(-8 * dt));

    // "Wind" brace when the cursor is whipped around fast
    const windTarget = (!eren.isSwinging && isPointerActive)
      ? Math.max(0, Math.min(1, (mouseSpeed / Math.max(0.1, uniformScale) - 1600) / 2400))
      : 0;
    const windRate = windTarget > eren.windBlend ? 7.0 : 2.2;
    eren.windBlend += (windTarget - eren.windBlend) * (1 - Math.exp(-windRate * dt));
    eren.windDir += (mouseDirX - eren.windDir) * (1 - Math.exp(-5 * dt));
  } else {
    eren.lookX = 0;
    eren.lookY = 0;
    eren.cursorNear = 0;
    eren.windBlend = 0;
  }

  // Smooth squash-turn interpolation over ~0.15s when facing flips between -1 and 1
  const prevFacingScale = eren.facingScale;
  const turnRate = 18.0;
  eren.facingScale += (eren.facing - eren.facingScale) * (1 - Math.exp(-turnRate * dt));
  if (Math.abs(eren.facing - eren.facingScale) < 0.01) {
    eren.facingScale = eren.facing;
  }
  // Subtle hop when passing through 0 during a turn
  if (prevFacingScale * eren.facingScale <= 0 || Math.abs(eren.facing - eren.facingScale) > 0.15) {
    eren.turnHop = (1 - Math.abs(eren.facingScale)) * 2.5 * uniformScale;
  } else {
    eren.turnHop = 0;
  }

  if (eren.landSquash > 0) {
    eren.landSquash = Math.max(0, eren.landSquash - dt * 3.8);
  }

  // Secondary motion for hair bangs & cowlicks (velocity lag + wind + landing bounce)
  const hairTargetX = eren.isSwinging
    ? Math.max(-2.6, Math.min(2.6, -eren.vx / (320 * Math.max(0.2, uniformScale))))
    : (eren.windDir * eren.windBlend * 2.4);
  const hairTargetY = eren.isSwinging
    ? Math.max(-2.0, Math.min(2.0, -eren.vy / (340 * Math.max(0.2, uniformScale))))
    : (Math.sin(eren.landSquash * Math.PI) * 1.4);
  const hairA = 1 - Math.exp(-12.0 * dt);
  eren.hairLagX += (hairTargetX - eren.hairLagX) * hairA;
  eren.hairLagY += (hairTargetY - eren.hairLagY) * hairA;

  if (clickEffect.active) {
    clickEffect.timer += dt;
    if (clickEffect.timer >= clickEffect.duration) {
      clickEffect.active = false;
    }
  }

  updateTrailingCables(dt);
  if (typeof updateSteam === 'function') updateSteam(dt);

  if (eren.bladeHold > 0) {
    eren.bladeHold = Math.max(0, eren.bladeHold - dt);
  }

  // Handle 0.11s launch crouch anticipation before jumping off a card
  if (eren.preJumpTimer > 0) {
    eren.preJumpTimer -= dt;
    eren.x = getCardPerchX(eren.currentCard, eren.perchMode);
    eren.y = getCardPerchY(eren.currentCard, eren.perchMode);
    if (eren.preJumpTimer <= 0 && eren.pendingTargetCard !== -1) {
      const nextTarget = eren.pendingTargetCard;
      eren.pendingTargetCard = -1;
      launchSwingNow(nextTarget, false);
    }
    return;
  }

  if (!eren.isSwinging) {
    eren.x = getCardPerchX(eren.currentCard, eren.perchMode);
    eren.y = getCardPerchY(eren.currentCard, eren.perchMode);
    eren.vx = 0;
    eren.vy = 0;

    // Progress through chibi idle states:
    // 0..2s:   Top panel pose (hands raised, wide giant eyes)
    // 2..5s:   Bottom panel pose (hands on hips, sassy squinting eyes)
    // 5..18s:  Sitting on the card edge dangling and kicking his stubby legs
    // >18s:    Deep idle behavior (yawn/stretch, lying flat on card, or web-hang)
    eren.idleTime += dt;

    const deepDelay = getDeepIdleDelay();
    const wasBelowDeep = (eren.idleTime - dt) < deepDelay;
    if (wasBelowDeep && eren.idleTime >= deepDelay) {
      const r = Math.random();
      if (timeOfDayMode === TOD_NIGHT) {
        eren.deepIdleMode = r < 0.15 ? DEEP_IDLE_YAWN : (r < 0.8 ? DEEP_IDLE_LIE_DOWN : DEEP_IDLE_CABLE_SWING);
      } else if (timeOfDayMode === TOD_MORNING) {
        eren.deepIdleMode = r < 0.7 ? DEEP_IDLE_YAWN : (r < 0.9 ? DEEP_IDLE_LIE_DOWN : DEEP_IDLE_CABLE_SWING);
      } else {
        eren.deepIdleMode = r < 0.34 ? DEEP_IDLE_YAWN : (r < 0.68 ? DEEP_IDLE_LIE_DOWN : DEEP_IDLE_CABLE_SWING);
      }
    }

    let targetSassy = (eren.idleTime >= config.sassyPoseDelay && eren.idleTime < config.idleSitDelay) ? 1.0 : 0.0;
    let targetSit = eren.idleTime >= config.idleSitDelay ? 1.0 : 0.0;
    let targetDeep = eren.idleTime >= deepDelay ? 1.0 : 0.0;

    // Hover reactions on special cards (cursor resting on the card he's perched on)
    const reactCode = CARD_REACTIONS[eren.currentCard] | 0;
    const wantReact = reactCode !== REACT_NONE && isPointerActive &&
      cards[eren.currentCard].fieldStrength > 0.45 && eren.idleTime > 0.35 &&
      !(clickEffect.active && clickEffect.isErenClick);
    if (wantReact || eren.reactionBlend < 0.02) eren.reactionCode = reactCode;
    eren.reactionBlend += ((wantReact ? 1 : 0) - eren.reactionBlend) * (1 - Math.exp(-(wantReact ? 6.0 : 3.0) * dt));
    if (wantReact) {
      targetDeep = 0;
      if (reactCode === REACT_EREN || reactCode === REACT_REINER || reactCode === REACT_ERWIN) {
        targetSassy = 1; targetSit = 0;
      } else if (reactCode === REACT_MIKASA || reactCode === REACT_YMIR) {
        targetSit = 0; targetSassy = 0;
      } else if (reactCode === REACT_LEVI || reactCode === REACT_ANNIE) {
        targetSassy = 0; targetSit = 0;
      }
    }

    eren.sassyBlend += (targetSassy - eren.sassyBlend) * (1 - Math.exp(-5.0 * dt));
    eren.sitBlend += (targetSit - eren.sitBlend) * (1 - Math.exp(-4.2 * dt));
    eren.deepIdleBlend += (targetDeep - eren.deepIdleBlend) * (1 - Math.exp(-3.2 * dt));

    if (isPointerActive) {
      const lookDx = smoothMouseX - eren.x;
      if (Math.abs(lookDx) > 16 * uniformScale) {
        eren.facing = lookDx >= 0 ? 1 : -1;
      }
      if (timeSinceMouseMove < 2.0) {
        eren.autoRoamTimer = 25 + Math.random() * 20;
      }
    }

    // Autonomous roaming when idle (skips while deeply asleep at night or actively reacting)
    const sleepingAtNight = (timeOfDayMode === TOD_NIGHT && eren.deepIdleBlend > 0.5);
    if (config.autoRoam && !sleepingAtNight && !wantReact && timeSinceMouseMove > 10.0 && CARD_COUNT > 1) {
      eren.autoRoamTimer -= dt;
      if (eren.autoRoamTimer <= 0) {
        eren.autoRoamTimer = 25 + Math.random() * 20;
        let nextCard = Math.floor(Math.random() * (CARD_COUNT - 1));
        if (nextCard >= eren.currentCard) nextCard++;
        setSlashWanted(nextCard);
        requestSwingToCard(nextCard);
      }
    }
    return;
  }

  eren.autoRoamTimer = 25 + Math.random() * 20;
  updateOdm(dt);
}

let cachedBubbleFontSize = -1;
let cachedBubbleFont = '';

/**
 * Comic speech bubble with Spider-Verse hard offset shadow and speech pointer tail.
 */
function drawComicBubble(x, y, text, s, alpha, rot) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const w = text.length * 5.0 * s + 12 * s;
  const hw = w * 0.5;
  // Clamp bubble inside viewport so it never clips off screen edges
  const clampedX = Math.max(hw + 8, Math.min(viewWidth - hw - 8, x));
  const clampedY = Math.max(14 * s + 6, y);
  ctx.translate(clampedX, clampedY);
  ctx.rotate(rot);
  const tailDir = -eren.facing;

  // 1. Hard comic offset shadow
  ctx.fillStyle = '#080608';
  traceRoundedRect(-hw + 1.5 * s, -8 * s + 1.7 * s, w, 16 * s, 5 * s);
  ctx.fill();

  // 2. Main speech bubble + pointer tail toward Eren
  ctx.fillStyle = '#fffef2';
  ctx.strokeStyle = '#080608';
  ctx.lineWidth = 1.2 * s;
  traceRoundedRect(-hw, -8 * s, w, 16 * s, 5 * s);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tailDir * 4.5 * s, 7.2 * s);
  ctx.lineTo(tailDir * 9.5 * s, 12.2 * s);
  ctx.lineTo(tailDir * 1.0 * s, 7.2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Bold comic lettering (cached font string)
  const fSize = Math.round(8.2 * s);
  if (fSize !== cachedBubbleFontSize) {
    cachedBubbleFontSize = fSize;
    cachedBubbleFont = '900 ' + fSize + 'px Impact, Arial Black, sans-serif';
  }
  ctx.fillStyle = '#1c2e4a';
  ctx.font = cachedBubbleFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0.5 * s);
  ctx.restore();
}

function drawHeartShape(x, y, h) {
  const w = h * 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.3);
  ctx.bezierCurveTo(x, y, x - w, y, x - w, y + h * 0.3);
  ctx.bezierCurveTo(x - w, y + h * 0.6, x, y + h * 0.75, x, y + h);
  ctx.bezierCurveTo(x, y + h * 0.75, x + w, y + h * 0.6, x + w, y + h * 0.3);
  ctx.bezierCurveTo(x + w, y, x, y, x, y + h * 0.3);
  ctx.closePath();
}

function drawSweatDrop(x, y, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#bfe6ff';
  ctx.strokeStyle = '#0f1423';
  ctx.lineWidth = Math.max(0.6, 0.8 * uniformScale);
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.8, y + size * 0.2, x, y + size * 0.6);
  ctx.quadraticCurveTo(x - size * 0.8, y + size * 0.2, x, y - size);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Mini-reactions when the cursor rests on each Attack on Titan character card Eren is perched on.
 */
function drawCardReaction(s) {
  const a = eren.reactionBlend;
  if (a < 0.03 || eren.isSwinging || eren.titanState !== TITAN_NONE || !eren.headWorldX) return;
  const hx = eren.headWorldX;
  const hy = eren.headWorldY;
  const f = eren.facing;
  const pop = Math.min(1, a * 1.3);
  const bx = hx + f * 24 * s;
  const by = hy - 20 * s - (1 - pop) * 6 * s;
  const code = eren.reactionCode;

  if (code === REACT_ERWIN) {
    // 0: Commander Erwin Smith
    drawComicBubble(bx, by - Math.abs(Math.sin(elapsedTime * 5)) * 2 * s, 'SASAGEYO!', s, a, -0.1 * f);
  } else if (code === REACT_FLOCH) {
    // 1: Floch Forster
    drawComicBubble(bx, by, 'FOR ELDIA!', s, a, -0.09 * f);
  } else if (code === REACT_MIKASA) {
    // 2: Mikasa Ackerman (floating hearts + soft bubble)
    ctx.save();
    ctx.fillStyle = '#ff4d6d';
    ctx.strokeStyle = '#080608';
    ctx.lineWidth = 0.8 * s;
    for (let k = 0; k < 3; k++) {
      const p = (elapsedTime * 0.55 + k / 3) % 1;
      ctx.globalAlpha = a * Math.sin(p * Math.PI);
      const size = (4.5 + p * 2.2) * s;
      drawHeartShape(hx + (k - 1) * 9 * s + Math.sin(p * 6 + k) * 3 * s, hy - 14 * s - p * 26 * s, size);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    drawComicBubble(bx, by, 'MIKASA...', s, a, -0.05 * f);
  } else if (code === REACT_PIECK) {
    // 3: Pieck Finger (hands up in Scout uniform)
    drawComicBubble(bx, by, 'HANDS UP!', s, a, 0.08 * f);
  } else if (code === REACT_ARMIN) {
    // 4: Armin Arlert (sweating/worried)
    drawSweatDrop(hx - f * 13 * s, hy - 7 * s + ((elapsedTime * 0.65) % 1) * 5 * s, 3.2 * s, a);
    drawComicBubble(bx, by, 'THE SEA, ARMIN!', s, a, -0.06 * f);
  } else if (code === REACT_EREN) {
    // 5: Season 4 Eren Yeager (Center card)
    const shake = Math.sin(elapsedTime * 36) * 1.0 * s;
    drawComicBubble(bx + shake, by, 'TATAKAE!', s, a, -0.12 * f);
  } else if (code === REACT_SASHA) {
    // 6: Sasha Braus
    drawComicBubble(bx, by - Math.abs(Math.sin(elapsedTime * 6)) * 2 * s, 'MEAT!!', s, a, -0.1 * f);
  } else if (code === REACT_ANNIE) {
    // 7: Annie Leonhart (manic laugh)
    const shake = Math.sin(elapsedTime * 42) * 1.2 * s;
    drawSweatDrop(hx - f * 13 * s, hy - 6 * s + ((elapsedTime * 0.8) % 1) * 5 * s, 3.2 * s, a);
    drawComicBubble(bx + shake, by, 'ANNIE?!', s, a, -0.13 * f);
  } else if (code === REACT_REINER) {
    // 8: Depressed Reiner Braun
    drawComicBubble(bx, by, 'SIT DOWN, REINER.', s, a, -0.04 * f);
  } else if (code === REACT_LEVI) {
    // 9: Captain Levi Ackerman (cold glare -> nervous sweat!)
    drawSweatDrop(hx - f * 13 * s, hy - 8 * s + ((elapsedTime * 0.7) % 1) * 6 * s, 3.4 * s, a);
    drawComicBubble(bx, by, 'CAPTAIN!!', s, a, 0.08 * f);
  } else if (code === REACT_YMIR) {
    // 10: Founder Ymir Fritz
    drawComicBubble(bx, by, 'YOU ARE FREE.', s, a, -0.04 * f);
  }
}
