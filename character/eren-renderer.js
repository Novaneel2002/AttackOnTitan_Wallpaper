/**
 * character/eren-renderer.js
 * Master Renderer for Chibi Eren Yeager (Attack on Titan):
 * - Dynamic ODM gear swinging with body banking, dual blades drawn, spinning slash trails, and flapping cloak
 * - Blade drawing rules: dual blades held while swinging and for 1.0s after landing (`bladeHold`) with metallic glint
 * - Top-row perch orientations: upside-down bottom hang (`PERCH_BOTTOM_UPSIDE_DOWN`), side-edge perch (`PERCH_SIDE_EDGE`), low crouch
 * - Smoothly blended idle poses: Standing TATAKAE -> Sassy arms-crossed -> Sitting & dangling legs (with morning tea + steam)
 * - Deep idle modes: Yawn & stretch ("Zzz..."), Cloak nap ("Zzz..."), and ODM cable swing
 * - Wind-brace stance, audio-reactive head bob/foot tap, and card-specific body poses (Erwin, Levi, Mikasa, Sasha, Pieck)
 */

function getReactionExpression() {
  if (eren.reactionBlend < 0.15) return null;
  switch (eren.reactionCode) {
    case REACT_ERWIN: return 'heroic';
    case REACT_FLOCH: return 'fierce';
    case REACT_MIKASA: return 'soft';
    case REACT_PIECK: return 'smirk';
    case REACT_ARMIN: return 'hopeful';
    case REACT_EREN: return 'angry';
    case REACT_SASHA: return 'happy';
    case REACT_ANNIE: return 'shocked';
    case REACT_REINER: return 'cold';
    case REACT_LEVI: return 'nervous';
    case REACT_YMIR: return 'serene';
    default: return null;
  }
}

function isShowingAttackTitan() {
  return eren.titanState === TITAN_ACTIVE ||
    (eren.titanState === TITAN_TRANSFORMING && eren.titanTransTimer >= 0.22) ||
    (eren.titanState === TITAN_REVERTING && eren.titanTransTimer < 0.50);
}

function drawSleepZzz(x, y, s, alpha) {
  if (alpha <= 0.04) return;
  ctx.save();
  ctx.fillStyle = '#e8f4ff';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = Math.max(0.7, 0.9 * s);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < 3; k++) {
    const p = (elapsedTime * 0.35 + k / 3) % 1;
    const a = alpha * Math.sin(p * Math.PI);
    if (a <= 0.03) continue;
    const zx = x + (4 + p * 12 + Math.sin(p * 6 + k) * 2.5) * s;
    const zy = y - (8 + p * 22) * s;
    const fSize = Math.max(6, Math.round((5.5 + p * 4.5) * s));
    ctx.globalAlpha = a;
    ctx.font = '900 ' + fSize + 'px Impact, Arial Black, sans-serif';
    ctx.strokeText('Z', zx, zy);
    ctx.fillText('Z', zx, zy);
  }
  ctx.restore();
}

function drawBladeGlint(x, y, s, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  const rLong = 5.8 * s * alpha;
  const rShort = 1.4 * s * alpha;
  ctx.beginPath();
  ctx.moveTo(0, -rLong);
  ctx.lineTo(rShort, -rShort);
  ctx.lineTo(rLong, 0);
  ctx.lineTo(rShort, rShort);
  ctx.lineTo(0, rLong);
  ctx.lineTo(-rShort, rShort);
  ctx.lineTo(-rLong, 0);
  ctx.lineTo(-rShort, -rShort);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawErenCastShadow() {
  if (!config.showEren || !eren.initialized || eren.isSwinging) return;
  const isTitan = isShowingAttackTitan();
  if (!isTitan) {
    if (eren.perchMode === PERCH_BOTTOM_UPSIDE_DOWN || eren.perchMode === PERCH_SIDE_EDGE) return;
    if (eren.deepIdleBlend > 0.2 && eren.deepIdleMode === DEEP_IDLE_CABLE_SWING) return;
  }
  const s = uniformScale * config.erenScale;
  const scaleMult = isTitan ? 2.0 * Math.max(0.5, 1 - eren.titanJumpY / (85 * s)) : 1.0;
  ctx.save();
  ctx.globalAlpha = isTitan ? 0.34 : 0.28;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(eren.x, eren.y + 1.2 * s * scaleMult, 10.5 * s * scaleMult, 2.6 * s * scaleMult, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEren() {
  if (!config.showEren || !eren.initialized) return;

  const s = uniformScale * config.erenScale;
  const ink = Math.max(0.65, 0.75 * s);

  // Attack Titan rendering branch (2x scale, rampaging on current block!)
  if (isShowingAttackTitan()) {
    drawLandingDust();
    drawSteam();
    drawAttackTitan(s);
    drawTitanEffects();
    return;
  }

  // Background effects behind Eren
  drawLandingDust();
  drawSteam();
  drawTrailingCables();
  drawHooks();

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const dir = eren.facing;
  const fs = eren.facingScale;
  const speed = Math.hypot(eren.vx, eren.vy);
  const beatEnergy = (typeof audioEnergy !== 'undefined' ? audioEnergy : 0);

  // =========================================================================
  // 1. SWINGING / BALLISTIC / SLASH POSE
  // =========================================================================
  if (eren.isSwinging) {
    const t = eren.swingT;
    const bodyTilt = Math.atan2(eren.vy, eren.vx * dir) * 0.32 * dir + eren.roll * 0.35 + eren.slashSpin * dir;

    // Faint comic speed lines during high-speed travel
    if (speed > 260 * uniformScale) {
      const invSpeed = 1 / Math.max(1, speed);
      const ux = -eren.vx * invSpeed;
      const uy = -eren.vy * invSpeed;
      const nx = -uy;
      const ny = ux;
      const lineLen = Math.min(38 * s, speed * 0.045);

      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.15 * s;
      for (let k = -1; k <= 1; k++) {
        ctx.globalAlpha = (k === 0 ? 0.28 : 0.16) * Math.sin(Math.min(1, t * 1.5) * Math.PI);
        const ox = eren.x + nx * (k * 9.0 * s) + ux * 10 * s;
        const oy = (eren.y - 12 * s) + ny * (k * 9.0 * s) + uy * 10 * s;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + ux * lineLen, oy + uy * lineLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Mid-air drop shadow
    ctx.save();
    ctx.globalAlpha = 0.22 * (1 - Math.sin(t * Math.PI) * 0.35);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(eren.x, eren.y + 16 * s, 11.5 * s, 3.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // World anchor points for hip boxes
    const cosA = Math.cos(bodyTilt);
    const sinA = Math.sin(bodyTilt);
    eren.hipLeftWorldX = eren.x + (-6.0 * dir * s * cosA - (-2.0 * s) * sinA);
    eren.hipLeftWorldY = (eren.y - 12 * s) + (-6.0 * dir * s * sinA + (-2.0 * s) * cosA);
    eren.hipRightWorldX = eren.x + (6.0 * dir * s * cosA - (-2.0 * s) * sinA);
    eren.hipRightWorldY = (eren.y - 12 * s) + (6.0 * dir * s * sinA + (-2.0 * s) * cosA);

    ctx.translate(eren.x, eren.y - 12 * s);
    ctx.rotate(bodyTilt);

    // Spinning blade motion-smear vortex arcs during lethal slash
    if (eren.slashing) {
      ctx.save();
      const spinA = eren.slashSpin * dir;
      ctx.lineCap = 'round';
      for (let arcIdx = 0; arcIdx < 2; arcIdx++) {
        const baseAng = spinA + arcIdx * Math.PI;
        ctx.strokeStyle = 'rgba(210, 245, 255, 0.52)';
        ctx.lineWidth = 6.5 * s;
        ctx.beginPath();
        ctx.arc(0, -4 * s, 36 * s, baseAng - 1.35 * dir, baseAng + 0.2 * dir, dir < 0);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.4 * s;
        ctx.beginPath();
        ctx.arc(0, -4 * s, 38 * s, baseAng - 1.15 * dir, baseAng + 0.25 * dir, dir < 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Green Cloak billowing behind during flight
    drawSurveyCorpsCloak(-2.0 * dir * s, -4.0 * s, s, ink, dir, eren.windBlend, speed, false);

    // Trailing legs in white pants and knee boots
    const legKick = Math.sin(elapsedTime * 12.0) * 2.2 * s;

    // Back leg
    drawOutlinedSegment(-3.5 * dir * s, 4.0 * s, (-7.5 * dir) * s, (7.5 + legKick) * s, 4.2 * s, '#f2f0e8', ink);
    drawErenBoot((-7.5 * dir) * s, (7.5 + legKick) * s, (-10.5 * dir) * s, (11.5 + legKick) * s, -1.5 * dir * s, s, ink);

    // Front leg
    drawOutlinedSegment(3.0 * dir * s, 4.0 * s, (6.5 * dir) * s, (5.5 - legKick) * s, 4.4 * s, '#f2f0e8', ink);
    drawErenBoot((6.5 * dir) * s, (5.5 - legKick) * s, (7.0 * dir) * s, (10.5 - legKick) * s, 1.4 * dir * s, s, ink);

    // Torso (Tan Cadet Corps jacket, harness, sash)
    drawErenTorso(0, -1.0 * s, 11.4 * s, 10.5 * s, s, ink);

    // 3D Maneuver Gear on hips
    drawOdmGear(0, 3.2 * s, s, ink, dir, 0);

    // Dual snap-blades drawn in hands
    if (eren.slashing) {
      const spinA = eren.slashSpin * dir;
      drawOdmBlade(9.0 * dir * s, -4.0 * s, spinA + 0.4 * dir, s, ink);
      drawOdmBlade(-9.0 * dir * s, -4.0 * s, spinA + Math.PI + 0.4 * dir, s, ink);
      drawErenHand(9.0 * dir * s, -4.0 * s, s, ink, 'grip', dir);
      drawErenHand(-9.0 * dir * s, -4.0 * s, s, ink, 'grip', -dir);
    } else {
      // Leading arm holding right blade forward
      const leadElbowX = 7.5 * dir * s;
      const leadElbowY = -7.5 * s;
      const leadHandX = 11.5 * dir * s;
      const leadHandY = -12.5 * s;
      drawOutlinedSegment(4.0 * dir * s, -4.0 * s, leadElbowX, leadElbowY, 3.6 * s, '#be8650', ink);
      drawOutlinedSegment(leadElbowX, leadElbowY, leadHandX, leadHandY, 3.4 * s, '#fee4d2', ink);
      drawErenHand(leadHandX, leadHandY, s, ink, 'grip', dir);
      drawOdmBlade(leadHandX, leadHandY, (dir > 0 ? -1.1 : 1.1) + bodyTilt * 0.4, s, ink);

      // Trailing arm holding left blade angled back
      const backElbowX = -6.5 * dir * s;
      const backElbowY = -4.5 * s;
      const backHandX = -10.5 * dir * s;
      const backHandY = 0.5 * s;
      drawOutlinedSegment(-4.0 * dir * s, -4.0 * s, backElbowX, backElbowY, 3.6 * s, '#be8650', ink);
      drawOutlinedSegment(backElbowX, backElbowY, backHandX, backHandY, 3.4 * s, '#fee4d2', ink);
      drawErenHand(backHandX, backHandY, s, ink, 'grip', -dir);
      drawOdmBlade(backHandX, backHandY, (dir > 0 ? 1.9 : -1.9) + bodyTilt * 0.4, s, ink);
    }

    // Head
    eren.headRot = bodyTilt;
    eren.headFlipY = 1;
    eren.headWorldX = eren.x + (1.2 * dir * s * cosA - (-15.2 * s) * sinA);
    eren.headWorldY = (eren.y - 12 * s) + (1.2 * dir * s * sinA + (-15.2 * s) * cosA);
    drawErenHead(1.2 * dir * s, -15.2 * s, s, eren.facingScale, 0, true, false);

  } else {
    // =========================================================================
    // 2. PERCHED & IDLE POSES
    // =========================================================================
    const sassy = eren.sassyBlend * eren.sassyBlend * (3 - 2 * eren.sassyBlend);
    const rawSit = eren.sitBlend;
    const sit = rawSit * rawSit * (3 - 2 * rawSit);
    const deep = eren.deepIdleBlend * eren.deepIdleBlend * (3 - 2 * eren.deepIdleBlend);

    const isUpsideDown = (eren.perchMode === PERCH_BOTTOM_UPSIDE_DOWN);
    const isSideEdge = (eren.perchMode === PERCH_SIDE_EDGE);
    const sideDir = cards[eren.currentCard] ? cards[eren.currentCard].sideDir : 1;

    const audioBob = (beatEnergy > 0.03 && deep < 0.3) ? Math.sin(elapsedTime * 14.0) * beatEnergy * 1.45 * s : 0;
    const breath = Math.sin(elapsedTime * 3.0) * 0.65 * s + audioBob;
    const preJumpCrouch = eren.preJumpTimer > 0 ? Math.sin((eren.preJumpTimer / 0.11) * Math.PI) * 0.34 : 0;
    const landSquashVal = Math.sin(eren.landSquash * Math.PI) * 0.22;
    const totalCrouch = Math.max(preJumpCrouch, landSquashVal);
    const modeCrouch = eren.perchMode === PERCH_TOP_CROUCH ? 0.26 * (1 - sit * 0.7) : 0;

    const scaleXPerch = 1 + (totalCrouch + modeCrouch * 0.4) * 0.65;
    const scaleYPerch = 1 - (totalCrouch + modeCrouch);

    const worldOriginX = eren.x;
    const worldOriginY = eren.y - (isUpsideDown ? -eren.turnHop : eren.turnHop);

    const isAngryBitePose = (eren.titanState === TITAN_NONE && eren.erenClickCount >= 3);
    const isCableSwing = (!isAngryBitePose && deep > 0.15 && eren.deepIdleMode === DEEP_IDLE_CABLE_SWING && !isUpsideDown && !isSideEdge);
    const isLieDown = (!isAngryBitePose && deep > 0.22 && eren.deepIdleMode === DEEP_IDLE_LIE_DOWN && !isUpsideDown && !isSideEdge);
    const isYawnStretch = (!isAngryBitePose && deep > 0.22 && eren.deepIdleMode === DEEP_IDLE_YAWN && !isUpsideDown && !isSideEdge);

    if (isCableSwing) {
      // ---------------------------------------------------------------------
      // DEEP IDLE 3: SITTING ON AN ODM CABLE SWING
      // ---------------------------------------------------------------------
      const swingDrop = 26.0 * s;
      const swayAngle = Math.sin(elapsedTime * 2.2) * 0.14;
      const swayOffset = Math.sin(swayAngle) * swingDrop;

      const cardX = eren.x;
      const cardY = eren.y;
      const cableLeftX = cardX - 7.0 * s;
      const cableRightX = cardX + 7.0 * s;
      const seatLeftX = cardX + swayOffset - 6.0 * s;
      const seatRightX = cardX + swayOffset + 6.0 * s;
      const seatY = cardY + swingDrop;

      drawWebLine(cableLeftX, cardY, seatLeftX, seatY, 1.0, 0.95 * deep, 0.9, 0, true);
      drawWebLine(cableRightX, cardY, seatRightX, seatY, 1.0, 0.95 * deep, 0.9, 0, true);

      ctx.save();
      ctx.strokeStyle = '#b9c2cc';
      ctx.lineWidth = Math.max(1.1, 1.5 * uniformScale);
      ctx.beginPath();
      ctx.moveTo(seatLeftX, seatY);
      ctx.lineTo(seatRightX, seatY);
      ctx.stroke();
      ctx.restore();

      ctx.translate(cardX + swayOffset, seatY);
      ctx.rotate(swayAngle * 0.6);

      drawSurveyCorpsCloak(0, -6.0 * s, s, ink, dir, eren.windBlend, 15, false);

      const dLegSwing = Math.sin(elapsedTime * 2.2) * 1.8 * s;
      drawOutlinedSegment(-3.5 * s, 1.0 * s, -4.5 * s, (7.0 + dLegSwing) * s, 4.4 * s, '#f2f0e8', ink);
      drawErenBoot(-4.5 * s, (7.0 + dLegSwing) * s, -4.0 * s, (11.5 + dLegSwing) * s, 1.2 * s, s, ink);

      drawOutlinedSegment(3.5 * s, 1.0 * s, 4.5 * s, (7.0 - dLegSwing) * s, 4.4 * s, '#f2f0e8', ink);
      drawErenBoot(4.5 * s, (7.0 - dLegSwing) * s, 5.0 * s, (11.5 - dLegSwing) * s, 1.2 * s, s, ink);

      drawErenTorso(0, -4.0 * s, 11.4 * s, 10.5 * s, s, ink);
      drawOdmGear(0, 0, s, ink, dir, 0);

      drawOutlinedSegment(-4.2 * s, -7.0 * s, -5.8 * s, -4.0 * s, 3.4 * s, '#be8650', ink);
      drawErenHand(-5.8 * s, -4.0 * s, s, ink, 'grip', -1);

      drawOutlinedSegment(4.2 * s, -7.0 * s, 5.8 * s, -4.0 * s, 3.4 * s, '#be8650', ink);
      drawErenHand(5.8 * s, -4.0 * s, s, ink, 'grip', 1);

      eren.headRot = swayAngle * 0.6;
      eren.headFlipY = 1;
      eren.headWorldX = cardX + swayOffset;
      eren.headWorldY = seatY - 18.0 * s;
      drawErenHead(0, -18.0 * s, s, 1, 0, false, true);

    } else if (isLieDown) {
      // ---------------------------------------------------------------------
      // DEEP IDLE 2: SLEEPING WRAPPED IN SURVEY CORPS CLOAK ON CARD RIM
      // ---------------------------------------------------------------------
      const sleepBreath = Math.sin(elapsedTime * 1.9) * 0.75 * s;
      ctx.translate(worldOriginX, worldOriginY);
      ctx.scale(dir, 1);

      // Boots peeking out the back of the cloak bundle
      drawErenBoot(-11.0 * s, -2.0 * s, -14.2 * s, -1.0 * s, -1.2 * s, s, ink);

      // Snug green Survey Corps cloak cocoon mound
      ctx.fillStyle = '#245934';
      ctx.strokeStyle = '#120d0a';
      ctx.lineWidth = ink * 0.9;
      ctx.beginPath();
      ctx.moveTo(-12.5 * s, 0.5 * s);
      ctx.quadraticCurveTo(-12.0 * s, -10.5 * s - sleepBreath, -1.0 * s, -10.8 * s - sleepBreath);
      ctx.quadraticCurveTo(8.5 * s, -10.0 * s - sleepBreath * 0.6, 10.5 * s, 0.5 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cloak fold shadow & silver clasp
      ctx.fillStyle = '#173d22';
      ctx.beginPath();
      ctx.moveTo(-9.5 * s, 0.2 * s);
      ctx.quadraticCurveTo(-2.0 * s, -5.0 * s - sleepBreath * 0.5, 6.5 * s, 0.2 * s);
      ctx.closePath();
      ctx.fill();

      // Wings of Freedom patch resting on top of the cloak
      drawWingsOfFreedom(-3.5 * s, -5.8 * s - sleepBreath * 0.6, 5.4 * s);

      // Folded arm pillow under head
      drawOutlinedSegment(6.5 * s, -1.8 * s, 12.8 * s, -1.4 * s, 3.6 * s, '#be8650', ink);
      drawErenHand(13.2 * s, -1.5 * s, s, ink, 'relaxed', 1);

      // Sleepy head resting sideways on the card edge
      ctx.save();
      ctx.translate(9.5 * s, -9.2 * s - sleepBreath * 0.35);
      ctx.rotate(0.28);
      drawErenHead(0, 0, s, 1, 0, false, true);
      ctx.restore();

      eren.headRot = 0.28 * dir;
      eren.headFlipY = 1;
      eren.headWorldX = worldOriginX + dir * 9.5 * s;
      eren.headWorldY = worldOriginY - 9.2 * s;

      // Floating "Zzz..." above his head (drawn in world-upright space)
      ctx.restore();
      ctx.save();
      drawSleepZzz(eren.headWorldX, eren.headWorldY - 12 * s, s, deep);

    } else {
      // ---------------------------------------------------------------------
      // STANDARD PERCH / TOP-ROW HANG / SIDE-EDGE / SMOOTH SIT / WIND BRACE / REACTIONS
      // ---------------------------------------------------------------------
      const reactExpr = isAngryBitePose ? 'angry' : getReactionExpression();
      const isBladesDrawn = eren.bladeHold > 0;
      const windLean = (eren.windBlend > 0.05 && !isAngryBitePose)
        ? eren.windDir * eren.windBlend * 0.22 * (fs >= 0 ? 1 : -1)
        : 0;
      const sashaBounce = (reactExpr === 'happy' && !isAngryBitePose)
        ? Math.abs(Math.sin(elapsedTime * 7.5)) * 2.6 * s * eren.reactionBlend
        : 0;
      const leviShiver = (reactExpr === 'nervous' && !isAngryBitePose)
        ? Math.sin(elapsedTime * 48) * 0.65 * s * eren.reactionBlend
        : 0;

      ctx.translate(worldOriginX + leviShiver, worldOriginY - (isUpsideDown ? -sashaBounce : sashaBounce));

      let baseRot = 0;
      if (isSideEdge) {
        baseRot = sideDir * Math.PI * 0.5;
        ctx.rotate(baseRot);
      }

      const flipY = isUpsideDown ? -1 : 1;
      ctx.scale(fs * scaleXPerch, flipY * scaleYPerch);

      const totalTilt = windLean + (reactExpr === 'smirk' ? -0.09 * eren.reactionBlend : 0);
      if (Math.abs(totalTilt) > 0.002) {
        ctx.rotate(totalTilt);
      }

      // Survey Corps cloak
      drawSurveyCorpsCloak(0, -12.0 * s + sit * 2.5 * s, s, ink, dir, eren.windBlend, beatEnergy * 95, false);

      // Smoothly blended sitting factor (disabled during angry bite, blades drawn, or reaction poses that stand)
      const effSit = (isAngryBitePose || isBladesDrawn || isUpsideDown || isSideEdge || isYawnStretch) ? 0 : sit;
      const dangleSpeed = 3.2 + beatEnergy * 5.0;
      const dangleAmp = (2.4 + beatEnergy * 2.2) * effSit;
      const dangleSwing = Math.sin(elapsedTime * dangleSpeed) * dangleAmp * s;
      const standTap = (beatEnergy > 0.05 && effSit < 0.2) ? Math.abs(Math.sin(elapsedTime * 14.0)) * beatEnergy * 1.2 * s : 0;

      // Smoothly interpolated legs & boots (Standing <-> Sitting)
      const hipY = (-6.0 + 4.0 * effSit) * s;
      const lHipX = (-3.8 + 0.3 * effSit) * s;
      const rHipX = (3.8 - 0.3 * effSit) * s;
      const lKneeX = (-4.8 + 0.3 * effSit) * s;
      const lKneeY = (-1.0 + 6.0 * effSit) * s + dangleSwing;
      const rKneeX = (4.8 - 0.3 * effSit) * s;
      const rKneeY = (-1.0 + 6.0 * effSit) * s - dangleSwing;
      const lFootX = (-5.2 + 1.2 * effSit) * s;
      const lFootY = (1.2 + 8.3 * effSit) * s + dangleSwing;
      const rFootX = (5.2 - 0.2 * effSit) * s;
      const rFootY = (1.2 + 8.3 * effSit) * s - dangleSwing - standTap;

      drawOutlinedSegment(lHipX, hipY, lKneeX, lKneeY, 4.4 * s, '#f4f3ed', ink);
      drawOutlinedSegment(rHipX, hipY, rKneeX, rKneeY, 4.4 * s, '#f4f3ed', ink);

      // Dark leather thigh straps when standing
      if (effSit < 0.6) {
        ctx.save();
        ctx.globalAlpha = 1 - effSit / 0.6;
        ctx.strokeStyle = '#42281a';
        ctx.lineWidth = 0.65 * s;
        ctx.beginPath();
        ctx.moveTo(-6.2 * s, -4.4 * s); ctx.lineTo(-2.4 * s, -3.8 * s);
        ctx.moveTo(-6.5 * s, -2.4 * s); ctx.lineTo(-2.8 * s, -1.8 * s);
        ctx.moveTo(2.4 * s, -3.8 * s); ctx.lineTo(6.2 * s, -4.4 * s);
        ctx.moveTo(2.8 * s, -1.8 * s); ctx.lineTo(6.5 * s, -2.4 * s);
        ctx.stroke();
        ctx.restore();
      }

      drawErenBoot(lKneeX, lKneeY, lFootX, lFootY, (-1.2 + 2.4 * effSit) * s, s, ink);
      drawErenBoot(rKneeX, rKneeY, rFootX, rFootY, 1.2 * s, s, ink);

      const torsoY = (-11.5 + 2.5 * effSit) * s + breath;
      const gearY = (-7.0 + 2.5 * effSit) * s + breath;
      const shoulderY = (-14.5 + 3.0 * effSit) * s + breath;
      const headY = (-25.5 + 2.5 * effSit) * s + breath;

      drawErenTorso(0, torsoY, 11.4 * s, 10.5 * s, s, ink);
      drawOdmGear(0, gearY, s, ink, dir, 0);

      // ---------------------------------------------------------------------
      // ARMS & PROPS (Card Reactions, Yawn, Wind Brace, Blades, Morning Tea, Smooth Sassy/Sit)
      // ---------------------------------------------------------------------
      if (isAngryBitePose) {
        // 3rd & 4th Click Warning Pose: Left arm clenched at side; right arm drawn over head below
        const leftElbowX = -6.8 * s;
        const leftElbowY = -10.5 * s + breath;
        const leftHandX = -7.4 * s;
        const leftHandY = -5.2 * s + breath;
        drawOutlinedSegment(-4.5 * s, shoulderY, leftElbowX, leftElbowY, 3.6 * s, '#be8650', ink);
        drawOutlinedSegment(leftElbowX, leftElbowY, leftHandX, leftHandY, 3.4 * s, '#fee4d2', ink);
        drawWingsOfFreedom(leftElbowX - 0.5 * s, leftElbowY - 1.2 * s, 3.4 * s);
        drawErenHand(leftHandX, leftHandY, s, ink, 'fist', -1);

      } else if (isYawnStretch) {
        // Deep Idle 1: Big overhead arm stretch & yawn!
        const st = Math.sin(elapsedTime * 1.8) * 0.5 + 0.5;
        const lift = (1.8 * st) * s;
        drawOutlinedSegment(-4.5 * s, shoulderY, -8.8 * s, shoulderY - 6.5 * s - lift, 3.5 * s, '#be8650', ink);
        drawOutlinedSegment(-8.8 * s, shoulderY - 6.5 * s - lift, -10.5 * s, shoulderY - 13.5 * s - lift, 3.2 * s, '#fee4d2', ink);
        drawErenHand(-10.5 * s, shoulderY - 13.5 * s - lift, s, ink, 'relaxed', -1);

        drawOutlinedSegment(4.5 * s, shoulderY, 8.8 * s, shoulderY - 6.5 * s - lift, 3.5 * s, '#be8650', ink);
        drawOutlinedSegment(8.8 * s, shoulderY - 6.5 * s - lift, 10.5 * s, shoulderY - 13.5 * s - lift, 3.2 * s, '#fee4d2', ink);
        drawErenHand(10.5 * s, shoulderY - 13.5 * s - lift, s, ink, 'relaxed', 1);

      } else if (eren.windBlend > 0.14) {
        // Wind-Brace Stance: shielding face with right arm, left arm braced back
        drawOutlinedSegment(-4.5 * s, shoulderY, -8.5 * s, shoulderY + 3.2 * s, 3.5 * s, '#be8650', ink);
        drawErenHand(-8.5 * s, shoulderY + 3.2 * s, s, ink, 'fist', -1);

        drawOutlinedSegment(4.5 * s, shoulderY, 7.2 * s, shoulderY - 4.2 * s, 3.5 * s, '#be8650', ink);
        drawOutlinedSegment(7.2 * s, shoulderY - 4.2 * s, 3.2 * s, shoulderY - 7.8 * s, 3.3 * s, '#fee4d2', ink);
        drawErenHand(3.2 * s, shoulderY - 7.8 * s, s, ink, 'fist', 1);

      } else if (reactExpr === 'heroic') {
        // Commander Erwin Reaction: Iconic "Shinzou wo Sasageyo!" Scout salute (right fist over heart!)
        drawOutlinedSegment(4.5 * s, shoulderY, 7.6 * s, shoulderY + 3.3 * s, 3.6 * s, '#be8650', ink);
        drawOutlinedSegment(7.6 * s, shoulderY + 3.3 * s, -2.2 * s, shoulderY + 1.9 * s, 3.4 * s, '#be8650', ink);
        drawErenHand(-2.2 * s, shoulderY + 1.9 * s, s, ink, 'fist', -1);

        const leftElbowX = -6.4 * s;
        const leftElbowY = shoulderY + 4.3 * s;
        drawOutlinedSegment(-4.5 * s, shoulderY, leftElbowX, leftElbowY, 3.6 * s, '#be8650', ink);
        drawWingsOfFreedom(leftElbowX - 0.4 * s, leftElbowY - 1.2 * s, 3.4 * s);

      } else if (reactExpr === 'nervous') {
        // Captain Levi Reaction: Stiff upright attention posture, hands snapped tightly to sides
        drawOutlinedSegment(-4.5 * s, shoulderY, -5.8 * s, shoulderY + 8.5 * s, 3.5 * s, '#be8650', ink);
        drawErenHand(-5.8 * s, shoulderY + 8.5 * s, s, ink, 'fist', -1);
        drawOutlinedSegment(4.5 * s, shoulderY, 5.8 * s, shoulderY + 8.5 * s, 3.5 * s, '#be8650', ink);
        drawErenHand(5.8 * s, shoulderY + 8.5 * s, s, ink, 'fist', 1);

      } else if (reactExpr === 'soft') {
        // Mikasa Reaction: Shy hand scratching behind head, left hand relaxed
        drawOutlinedSegment(-4.5 * s, shoulderY, -6.8 * s, shoulderY + 6.0 * s, 3.5 * s, '#be8650', ink);
        drawErenHand(-6.8 * s, shoulderY + 6.0 * s, s, ink, 'relaxed', -1);

        drawOutlinedSegment(4.5 * s, shoulderY, 8.2 * s, shoulderY - 4.5 * s, 3.5 * s, '#be8650', ink);
        drawOutlinedSegment(8.2 * s, shoulderY - 4.5 * s, 5.2 * s, shoulderY - 10.5 * s, 3.2 * s, '#fee4d2', ink);
        drawErenHand(5.2 * s, shoulderY - 10.5 * s, s, ink, 'relaxed', 1);

      } else if (reactExpr === 'happy') {
        // Sasha Reaction: Both fists pumping happily in excitement ("MEAT!!")
        const pump = Math.sin(elapsedTime * 15.0) * 2.5 * s;
        drawOutlinedSegment(-4.5 * s, shoulderY, -8.2 * s, shoulderY - 2.0 * s + pump, 3.5 * s, '#be8650', ink);
        drawErenHand(-8.2 * s, shoulderY - 2.0 * s + pump, s, ink, 'fist', -1);
        drawOutlinedSegment(4.5 * s, shoulderY, 8.2 * s, shoulderY - 2.0 * s - pump, 3.5 * s, '#be8650', ink);
        drawErenHand(8.2 * s, shoulderY - 2.0 * s - pump, s, ink, 'fist', 1);

      } else if (reactExpr === 'smirk') {
        // Pieck Reaction: Playful pointing / finger-gun gesture ("HANDS UP!")
        drawOutlinedSegment(-4.5 * s, shoulderY, -6.8 * s, shoulderY + 5.8 * s, 3.5 * s, '#be8650', ink);
        drawErenHand(-6.8 * s, shoulderY + 5.8 * s, s, ink, 'fist', -1);

        drawOutlinedSegment(4.5 * s, shoulderY, 9.8 * s, shoulderY - 1.5 * s, 3.5 * s, '#be8650', ink);
        drawOutlinedSegment(9.8 * s, shoulderY - 1.5 * s, 14.0 * s, shoulderY - 2.2 * s, 3.1 * s, '#fee4d2', ink);
        drawErenHand(14.0 * s, shoulderY - 2.2 * s, s, ink, 'grip', 1);

      } else if (isBladesDrawn) {
        // Combat ready stance right after landing: both blades held defensively + landing glint
        drawOutlinedSegment(-4.5 * s, shoulderY, -8.0 * s, shoulderY + 2.5 * s, 3.5 * s, '#be8650', ink);
        drawErenHand(-8.0 * s, shoulderY + 2.5 * s, s, ink, 'grip', -1);
        drawOdmBlade(-8.0 * s, shoulderY + 2.5 * s, -1.2, s, ink);

        drawOutlinedSegment(4.5 * s, shoulderY, 8.0 * s, shoulderY + 2.5 * s, 3.5 * s, '#be8650', ink);
        drawErenHand(8.0 * s, shoulderY + 2.5 * s, s, ink, 'grip', 1);
        drawOdmBlade(8.0 * s, shoulderY + 2.5 * s, 1.2, s, ink);

        if (eren.bladeHold > 0.72) {
          const gp = (1.0 - eren.bladeHold) / 0.28; // 0 -> 1
          const gAlpha = Math.sin(gp * Math.PI);
          const dist = (10 + gp * 22) * s;
          drawBladeGlint(8.0 * s + Math.cos(1.2 + Math.PI * 0.5) * dist, shoulderY + 2.5 * s + Math.sin(1.2 + Math.PI * 0.5) * dist, s, gAlpha);
          drawBladeGlint(-8.0 * s + Math.cos(-1.2 + Math.PI * 0.5) * dist, shoulderY + 2.5 * s + Math.sin(-1.2 + Math.PI * 0.5) * dist, s, gAlpha);
        }

      } else if (effSit > 0.65 && timeOfDayMode === TOD_MORNING) {
        // Morning Sitting: Holding warm ceramic teacup with rising steam wisps!
        drawOutlinedSegment(-4.2 * s, shoulderY, -1.8 * s, shoulderY + 4.0 * s, 3.4 * s, '#be8650', ink);
        drawOutlinedSegment(4.2 * s, shoulderY, 1.8 * s, shoulderY + 4.0 * s, 3.4 * s, '#be8650', ink);
        drawErenHand(0, shoulderY + 4.0 * s, s, ink, 'grip', 1);

        // Ceramic teacup
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#14110f';
        ctx.lineWidth = 1.0 * s;
        ctx.beginPath();
        ctx.rect(-2.2 * s, shoulderY + 3.3 * s, 4.4 * s, 3.6 * s);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#653a1e';
        ctx.fillRect(-1.8 * s, shoulderY + 3.7 * s, 3.6 * s, 1.2 * s);

        // Rising curly tea steam wisps
        ctx.save();
        ctx.strokeStyle = 'rgba(240, 248, 255, 0.72)';
        ctx.lineWidth = 0.75 * s;
        for (let k = 0; k < 2; k++) {
          const sp = (elapsedTime * 0.55 + k * 0.5) % 1;
          ctx.globalAlpha = Math.sin(sp * Math.PI) * 0.75;
          const sx = (k === 0 ? -0.9 : 0.9) * s;
          const sy = shoulderY + 2.6 * s - sp * 7.5 * s;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(sx + Math.sin(sp * 9 + k) * 1.6 * s, sy - 2.0 * s, sx, sy - 4.0 * s);
          ctx.stroke();
        }
        ctx.restore();

      } else {
        // Smoothly blended arms: Standing TATAKAE -> Sassy Crossed -> Sitting Relaxed
        const standW = (1 - sassy) * (1 - effSit);
        const sassyW = sassy * (1 - effSit);
        const sitW = effSit;

        // Right arm lerp
        const rElbowX = (8.2 * standW + 1.2 * sassyW + 7.0 * sitW) * s;
        const rElbowY = ((-14.0) * standW + (-11.0) * sassyW + (-7.5) * sitW) * s + breath;
        const rHandX = (7.8 * standW + (-2.5) * sassyW + 7.0 * sitW) * s;
        const rHandY = ((-18.2) * standW + (-11.0) * sassyW + (-7.5) * sitW) * s + breath;

        // Left arm lerp
        const lElbowX = ((-6.8) * standW + (-1.2) * sassyW + (-7.0) * sitW) * s;
        const lElbowY = ((-10.5) * standW + (-10.0) * sassyW + (-7.5) * sitW) * s + breath;
        const lHandX = ((-7.2) * standW + (2.5) * sassyW + (-7.0) * sitW) * s;
        const lHandY = ((-5.0) * standW + (-10.0) * sassyW + (-7.5) * sitW) * s + breath;

        // Draw left arm
        drawOutlinedSegment(-4.5 * s, shoulderY, lElbowX, lElbowY, 3.6 * s, '#be8650', ink);
        if (standW > 0.25) {
          drawOutlinedSegment(lElbowX, lElbowY, lHandX, lHandY, 3.4 * s, '#fee4d2', ink);
          drawWingsOfFreedom(lElbowX - 0.5 * s, lElbowY - 1.2 * s, 3.4 * s);
        } else {
          drawOutlinedSegment(lElbowX, lElbowY, lHandX, lHandY, 3.4 * s, '#be8650', ink);
        }
        drawErenHand(lHandX, lHandY, s, ink, sitW > 0.5 ? 'relaxed' : 'fist', -1);

        // Draw right arm
        drawOutlinedSegment(4.5 * s, shoulderY, rElbowX, rElbowY, 3.6 * s, '#be8650', ink);
        drawOutlinedSegment(rElbowX, rElbowY, rHandX, rHandY, 3.4 * s, standW > 0.35 ? '#fee4d2' : '#be8650', ink);
        drawErenHand(rHandX, rHandY, s, ink, sitW > 0.5 ? 'relaxed' : 'fist', 1);
      }

      // ---------------------------------------------------------------------
      // HEAD
      // ---------------------------------------------------------------------
      const isShouting = (isAngryBitePose || eren.bladeHold > 0 || (typeof clickEffect !== 'undefined' && clickEffect.active));
      const headExpr = isYawnStretch ? 'yawn' : reactExpr;
      const headSquint = Math.min(1, (isAngryBitePose ? 0.45 : eren.cursorNear) + eren.windBlend * 0.55);
      const headTilt = isYawnStretch ? -0.14 : (reactExpr === 'soft' ? 0.12 * eren.reactionBlend : 0);

      // Compute accurate world head coordinates for eye tracking, reactions & Zzz
      eren.headRot = baseRot + totalTilt;
      eren.headFlipY = flipY;
      if (isSideEdge) {
        eren.headWorldX = worldOriginX - sideDir * headY;
        eren.headWorldY = worldOriginY;
      } else {
        eren.headWorldX = worldOriginX + leviShiver;
        eren.headWorldY = worldOriginY + flipY * headY;
      }

      ctx.save();
      ctx.translate(0, headY);
      if (Math.abs(headTilt) > 0.002) ctx.rotate(headTilt);
      drawErenHead(0, 0, s, eren.facingScale, headSquint, isShouting, false, isAngryBitePose, headExpr);
      ctx.restore();

      if (isAngryBitePose) {
        // Anime anger vein mark on forehead/temple
        ctx.save();
        ctx.strokeStyle = '#d92626';
        ctx.lineWidth = Math.max(0.9, 1.1 * s);
        ctx.lineCap = 'round';
        const vx = 5.6 * s;
        const vy = headY - 5.0 * s;
        const vr = 2.1 * s;
        ctx.beginPath();
        ctx.moveTo(vx - vr, vy - vr * 0.4); ctx.quadraticCurveTo(vx - vr * 0.3, vy - vr * 0.3, vx - vr * 0.4, vy - vr);
        ctx.moveTo(vx + vr, vy - vr * 0.4); ctx.quadraticCurveTo(vx + vr * 0.3, vy - vr * 0.3, vx + vr * 0.4, vy - vr);
        ctx.moveTo(vx - vr, vy + vr * 0.4); ctx.quadraticCurveTo(vx - vr * 0.3, vy + vr * 0.3, vx - vr * 0.4, vy + vr);
        ctx.moveTo(vx + vr, vy + vr * 0.4); ctx.quadraticCurveTo(vx + vr * 0.3, vy + vr * 0.3, vx + vr * 0.4, vy + vr);
        ctx.stroke();
        ctx.restore();

        // Right arm & hand raised IN FRONT of Eren's mouth (iconic Titan-bite pose!)
        const biteElbowX = 7.4 * s;
        const biteElbowY = shoulderY + 0.9 * s;
        const biteHandX = 1.6 * s;
        const biteHandY = headY + 6.7 * s;
        drawOutlinedSegment(4.5 * s, shoulderY, biteElbowX, biteElbowY, 3.6 * s, '#be8650', ink);
        drawOutlinedSegment(biteElbowX, biteElbowY, biteHandX, biteHandY, 3.3 * s, '#fee4d2', ink);
        drawErenHand(biteHandX, biteHandY, s, ink, 'fist', 1);
      }

      if (isYawnStretch) {
        ctx.restore();
        ctx.save();
        drawSleepZzz(eren.headWorldX, eren.headWorldY - 14 * s, s, deep);
      }
    }
  }

  ctx.restore();

  // Overlay Comic Reactions, Click Badges, Anchor Sparks, Shockwaves & Titan VFX
  drawCardReaction(s);
  drawClickEffects(s);
  drawTitanEffects();
}
