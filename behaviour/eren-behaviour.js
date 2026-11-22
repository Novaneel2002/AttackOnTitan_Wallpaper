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
 * Updates Eren's pendulum swing trajectory, launch crouch, squash-turn,
 * autonomous roaming, and multi-stage idle progression.
 */
function updateEren(dt) {
  if (!config.showEren) return;

  updateNaturalBlinking(dt);

  // Eye tracking toward the cursor + squint when the cursor gets very close
  {
    const s = uniformScale * config.erenScale;
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

  if (eren.flipTimer > 0) {
    eren.flipTimer = Math.max(0, eren.flipTimer - dt / 0.65);
  }

  if (clickEffect.active) {
    const prevClickTimer = clickEffect.timer;
    clickEffect.timer += dt;
    // Leave a lingering web tag where the click web stuck
    if (!clickEffect.isErenClick && prevClickTimer < 0.14 && clickEffect.timer >= 0.14) {
      addWebTag(
        clickEffect.targetX, clickEffect.targetY,
        Math.atan2(clickEffect.targetY - eren.handWorldY, clickEffect.targetX - eren.handWorldX),
        clickEffect.cardIdx, clickEffect.relX, clickEffect.relY
      );
    }
    if (clickEffect.timer >= clickEffect.duration) {
      clickEffect.active = false;
    }
  }

  updateTrailingCables(dt);
  if (typeof updateSteam === 'function') updateSteam(dt);

  if (eren.bladeHold > 0) {
    eren.bladeHold = Math.max(0, eren.bladeHold - dt);
  }

  // Update landing dust particles
  if (activeDustCount > 0) {
    let anyAlive = false;
    for (let i = 0; i < activeDustCount; i++) {
      if (dustAlpha[i] > 0.01) {
        dustX[i] += dustVx[i] * dt;
        dustY[i] += dustVy[i] * dt;
        dustVx[i] *= Math.exp(-5.5 * dt);
        dustVy[i] *= Math.exp(-5.5 * dt);
        dustAlpha[i] -= dt * 2.4;
        anyAlive = true;
      }
    }
    if (!anyAlive) activeDustCount = 0;
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
      cards[eren.currentCard].fieldStrength > 0.45 && eren.idleTime > 0.35 && eren.flipTimer <= 0;
    if (wantReact || eren.reactionBlend < 0.02) eren.reactionCode = reactCode;
    eren.reactionBlend += ((wantReact ? 1 : 0) - eren.reactionBlend) * (1 - Math.exp(-(wantReact ? 6.0 : 3.0) * dt));
    if (wantReact) {
      targetDeep = 0;
      if (reactCode === REACT_HELLYES) { targetSassy = 1; targetSit = 0; }
      else if (reactCode === REACT_GIMME) { targetSassy = 0; targetSit = 0; }
      else if (reactCode === REACT_AWESOME) { eren.deepIdleMode = DEEP_IDLE_LIE_DOWN; targetDeep = 1; }
      else if (reactCode === REACT_CHILL) { targetSit = 1; targetSassy = 0; }
    }

    eren.sassyBlend += (targetSassy - eren.sassyBlend) * (1 - Math.exp(-5.0 * dt));
    eren.sitBlend += (targetSit - eren.sitBlend) * (1 - Math.exp(-4.2 * dt));
    eren.deepIdleBlend += (targetDeep - eren.deepIdleBlend) * (1 - Math.exp(-3.2 * dt));

    if (isPointerActive) {
      const lookDx = smoothMouseX - eren.x;
      if (Math.abs(lookDx) > 16 * uniformScale) {
        eren.facing = lookDx >= 0 ? 1 : -1;
      }
    }
    return;
  }

  updateOdm(dt);
}

/**
 * Comic speech bubble with Spider-Verse hard offset shadow and speech pointer tail.
 */
function drawComicBubble(x, y, text, s, alpha, rot) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const w = text.length * 5.0 * s + 11 * s;
  const hw = w * 0.5;
  const tailDir = -eren.facing;

  // 1. Hard comic offset shadow
  ctx.fillStyle = '#080608';
  traceRoundedRect(-hw + 1.6 * s, -8 * s + 1.8 * s, w, 16 * s, 5 * s);
  ctx.fill();

  // 2. Main speech bubble + pointer tail toward Eren
  ctx.fillStyle = '#fffef2';
  ctx.strokeStyle = '#080608';
  ctx.lineWidth = 1.6 * s;
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

  // 3. Bold comic lettering
  ctx.fillStyle = '#d11f28';
  ctx.font = '900 ' + Math.round(8.5 * s) + 'px Impact, Arial Black, sans-serif';
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
 * Mini-reactions when the cursor rests on the special card Eren is perched on.
 */
function drawCardReaction(s) {
  const a = eren.reactionBlend;
  if (a < 0.03 || eren.isSwinging || !eren.headWorldX) return;
  const hx = eren.headWorldX;
  const hy = eren.headWorldY;
  const f = eren.facing;
  const pop = Math.min(1, a * 1.3);
  const bx = hx + f * 22 * s;
  const by = hy - 20 * s - (1 - pop) * 6 * s;
  const code = eren.reactionCode;

  if (code === REACT_HEARTS) {
    ctx.save();
    ctx.fillStyle = '#ff4d6d';
    ctx.strokeStyle = '#080608';
    ctx.lineWidth = 0.9 * s;
    for (let k = 0; k < 3; k++) {
      const p = (elapsedTime * 0.55 + k / 3) % 1;
      ctx.globalAlpha = a * Math.sin(p * Math.PI);
      const size = (5 + p * 2.5) * s;
      drawHeartShape(hx + (k - 1) * 9 * s + Math.sin(p * 6 + k) * 3 * s, hy - 14 * s - p * 28 * s, size);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  } else if (code === REACT_MUSIC) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const p = (elapsedTime * 0.5 + k / 3) % 1;
      ctx.globalAlpha = a * Math.sin(p * Math.PI) * 0.95;
      ctx.font = 'bold ' + Math.round((9 + p * 3) * s) + 'px sans-serif';
      ctx.fillText(k === 1 ? '\u266B' : '\u266A', hx + f * (10 + k * 6) * s + Math.sin(p * 7 + k) * 3 * s, hy - 10 * s - p * 26 * s);
    }
    ctx.restore();
  } else if (code === REACT_CAMERA) {
    const p = (elapsedTime * 0.7) % 1;
    const flash = p < 0.12 ? 1 - p / 0.12 : 0;
    if (flash > 0.01) {
      const fx = hx + f * 16 * s;
      const fy = hy - 2 * s;
      const r = 11 * s * (0.6 + flash * 0.4);
      ctx.save();
      ctx.globalAlpha = a * flash;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(fx, fy - r);
      ctx.quadraticCurveTo(fx, fy, fx + r, fy);
      ctx.quadraticCurveTo(fx, fy, fx, fy + r);
      ctx.quadraticCurveTo(fx, fy, fx - r, fy);
      ctx.quadraticCurveTo(fx, fy, fx, fy - r);
      ctx.fill();
      ctx.restore();
    }
    drawComicBubble(bx, by, 'CLICK!', s, a, -0.1 * f);
  } else if (code === REACT_OWW) {
    const shake = Math.sin(elapsedTime * 40) * 1.2 * s;
    drawComicBubble(bx + shake, by, 'OWW!', s, a, -0.14 * f);
    drawSweatDrop(hx - f * 13 * s, hy - 6 * s + ((elapsedTime * 0.8) % 1) * 5 * s, 3.2 * s, a);
  } else if (code === REACT_SWEAT) {
    drawSweatDrop(hx - f * 13 * s, hy - 8 * s + ((elapsedTime * 0.6) % 1) * 6 * s, 3.4 * s, a);
    drawComicBubble(bx, by, '...', s, a, 0);
  } else if (code === REACT_GIMME) {
    drawComicBubble(bx, by - Math.abs(Math.sin(elapsedTime * 6)) * 2 * s, 'GIMME!', s, a, -0.12 * f);
  } else if (code === REACT_HELLYES) {
    drawComicBubble(bx, by, 'HELL YEAH!', s, a, -0.1 * f);
  } else if (code === REACT_AWESOME) {
    drawComicBubble(bx, by, 'AWESOME.', s, a, -0.06 * f);
  } else if (code === REACT_CONFUSED) {
    drawComicBubble(bx, by, '?!', s, a, 0.1 * f);
  } else if (code === REACT_OUCH) {
    drawComicBubble(bx, by, 'ouch...', s, a, 0.05 * f);
  } else if (code === REACT_CHILL) {
    drawComicBubble(bx, by, 'NICE.', s, a, -0.05 * f);
  }
}
