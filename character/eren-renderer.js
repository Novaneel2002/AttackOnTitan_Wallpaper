/**
 * character/eren-renderer.js
 * Master Renderer for Chibi Eren Yeager (Attack on Titan):
 * - Dynamic ODM gear swinging with body banking, dual blades drawn, and flapping Survey Corps cloak
 * - Slashing attack with spinning dual-blade vortex
 * - Blade drawing rules: dual blades held while swinging and for exactly 1.0s after landing (`bladeHold`)
 * - Poses:
 *   1. Default Perch: Clenched right fist raised in iconic "TATAKAE!" pose (Image 1)
 *   2. Sassy / Glare: Arms crossed over chest, fierce glare
 *   3. Sitting & Dangling: Sitting on card edge, legs kicking over the rim, morning tea
 *   4. Deep Idle 1: Big stretch & yawn ("Zzz...")
 *   5. Deep Idle 2: Sleeping wrapped inside green cloak
 *   6. Deep Idle 3: Sitting on an ODM cable swing (holding cables, swaying gently like a playground swing)
 */

function isShowingAttackTitan() {
  return eren.titanState === TITAN_ACTIVE ||
    (eren.titanState === TITAN_TRANSFORMING && eren.titanTransTimer >= 0.35) ||
    (eren.titanState === TITAN_REVERTING && eren.titanTransTimer < 0.50);
}

function drawErenCastShadow() {
  if (!config.showEren || !eren.initialized || eren.isSwinging) return;
  const s = uniformScale * config.erenScale;
  const isTitan = isShowingAttackTitan();
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
      // Spinning lethal slash attack: blades extended wide outward
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

    const breath = Math.sin(elapsedTime * 3.0) * 0.65 * s;
    const preJumpCrouch = eren.preJumpTimer > 0 ? Math.sin((eren.preJumpTimer / 0.11) * Math.PI) * 0.34 : 0;
    const landSquashVal = Math.sin(eren.landSquash * Math.PI) * 0.22;
    const totalCrouch = Math.max(preJumpCrouch, landSquashVal);
    const modeCrouch = eren.perchMode === PERCH_TOP_CROUCH ? 0.26 * (1 - sit * 0.7) : 0;

    const scaleXPerch = 1 + (totalCrouch + modeCrouch * 0.4) * 0.65;
    const scaleYPerch = 1 - (totalCrouch + modeCrouch);

    let worldOriginX = eren.x;
    let worldOriginY = eren.y - eren.turnHop;

    // Check for Deep Idle 3: Cable Swing Mode!
    const isCableSwing = (deep > 0.15 && eren.deepIdleMode === DEEP_IDLE_CABLE_SWING && eren.perchMode !== PERCH_BOTTOM_UPSIDE_DOWN);

    if (isCableSwing) {
      // ---------------------------------------------------------------------
      // DEEP IDLE 3: SITTING ON AN ODM CABLE SWING (USER SPECIFIED)
      // ---------------------------------------------------------------------
      const swingDrop = 26.0 * s;
      const swayAngle = Math.sin(elapsedTime * 2.2) * 0.14;
      const swayOffset = Math.sin(swayAngle) * swingDrop;

      // Draw the two ODM cables hanging from the card border
      const cardX = eren.x;
      const cardY = eren.y;
      const cableLeftX = cardX - 7.0 * s;
      const cableRightX = cardX + 7.0 * s;
      const seatLeftX = cardX + swayOffset - 6.0 * s;
      const seatRightX = cardX + swayOffset + 6.0 * s;
      const seatY = cardY + swingDrop;

      // Draw two sturdy steel cables
      drawWebLine(cableLeftX, cardY, seatLeftX, seatY, 1.0, 0.95 * deep, 0.9, 0, true);
      drawWebLine(cableRightX, cardY, seatRightX, seatY, 1.0, 0.95 * deep, 0.9, 0, true);

      // Bottom connecting loop
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

      // Cloak trailing behind
      drawSurveyCorpsCloak(0, -6.0 * s, s, ink, dir, eren.windBlend, 15, false);

      // Sitting legs dangling forward
      const dLegSwing = Math.sin(elapsedTime * 2.2) * 1.8 * s;
      drawOutlinedSegment(-3.5 * s, 1.0 * s, -4.5 * s, (7.0 + dLegSwing) * s, 4.4 * s, '#f2f0e8', ink);
      drawErenBoot(-4.5 * s, (7.0 + dLegSwing) * s, -4.0 * s, (11.5 + dLegSwing) * s, 1.2 * s, s, ink);

      drawOutlinedSegment(3.5 * s, 1.0 * s, 4.5 * s, (7.0 - dLegSwing) * s, 4.4 * s, '#f2f0e8', ink);
      drawErenBoot(4.5 * s, (7.0 - dLegSwing) * s, 5.0 * s, (11.5 - dLegSwing) * s, 1.2 * s, s, ink);

      // Torso
      drawErenTorso(0, -4.0 * s, 11.4 * s, 10.5 * s, s, ink);
      drawOdmGear(0, 0, s, ink, dir, 0);

      // Hands holding onto the cables on each side
      drawOutlinedSegment(-4.2 * s, -7.0 * s, -5.8 * s, -4.0 * s, 3.4 * s, '#be8650', ink);
      drawErenHand(-5.8 * s, -4.0 * s, s, ink, 'grip', -1);

      drawOutlinedSegment(4.2 * s, -7.0 * s, 5.8 * s, -4.0 * s, 3.4 * s, '#be8650', ink);
      drawErenHand(5.8 * s, -4.0 * s, s, ink, 'grip', 1);

      // Head
      eren.headRot = swayAngle * 0.6;
      eren.headFlipY = 1;
      eren.headWorldX = cardX + swayOffset;
      eren.headWorldY = seatY - 18.0 * s;
      drawErenHead(0, -18.0 * s, s, 1, 0, false, true);

    } else {
      // ---------------------------------------------------------------------
      // STANDARD PERCH / SIT / STAND / SASSY POSES
      // ---------------------------------------------------------------------
      ctx.translate(worldOriginX, worldOriginY);
      ctx.scale(fs * scaleXPerch, scaleYPerch);

      // Check whether blades should be held (only while swinging and for 1.0s after landing)
      const isBladesDrawn = eren.bladeHold > 0;
      const isAngryBitePose = (eren.titanState === TITAN_NONE && eren.erenClickCount >= 3);

      // Survey Corps cloak
      drawSurveyCorpsCloak(0, -12.0 * s, s, ink, dir, eren.windBlend, 0, false);

      if (sit > 0.05 && !isAngryBitePose) {
        // Sitting & dangling legs over card edge
        const dangleSwing = Math.sin(elapsedTime * 3.2) * 2.4 * s;

        drawOutlinedSegment(-3.5 * s, -2.0 * s, -4.5 * s, (5.0 + dangleSwing) * s, 4.4 * s, '#f2f0e8', ink);
        drawErenBoot(-4.5 * s, (5.0 + dangleSwing) * s, -4.0 * s, (9.5 + dangleSwing) * s, 1.2 * s, s, ink);

        drawOutlinedSegment(3.5 * s, -2.0 * s, 4.5 * s, (5.0 - dangleSwing) * s, 4.4 * s, '#f2f0e8', ink);
        drawErenBoot(4.5 * s, (5.0 - dangleSwing) * s, 5.0 * s, (9.5 - dangleSwing) * s, 1.2 * s, s, ink);

        drawErenTorso(0, -9.0 * s + breath, 11.4 * s, 10.5 * s, s, ink);
        drawOdmGear(0, -4.5 * s + breath, s, ink, dir, 0);

        // Arms: holding tea mug if morning, otherwise hands resting on scabbards
        if (timeOfDayMode === TOD_MORNING) {
          // Teacup
          drawOutlinedSegment(-4.2 * s, -11.5 * s + breath, -1.8 * s, -7.5 * s + breath, 3.4 * s, '#be8650', ink);
          drawOutlinedSegment(4.2 * s, -11.5 * s + breath, 1.8 * s, -7.5 * s + breath, 3.4 * s, '#be8650', ink);
          drawErenHand(0, -7.5 * s + breath, s, ink, 'grip', 1);

          // Ceramic teacup + steam
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#14110f';
          ctx.lineWidth = 1.0 * s;
          ctx.beginPath();
          ctx.rect(-2.2 * s, -8.2 * s + breath, 4.4 * s, 3.6 * s);
          ctx.fill();
          ctx.stroke();
          // Tea liquid
          ctx.fillStyle = '#653a1e';
          ctx.fillRect(-1.8 * s, -7.8 * s + breath, 3.6 * s, 1.2 * s);
        } else {
          drawOutlinedSegment(-4.2 * s, -11.5 * s + breath, -7.0 * s, -7.5 * s + breath, 3.4 * s, '#be8650', ink);
          drawErenHand(-7.0 * s, -7.5 * s + breath, s, ink, 'relaxed', -1);

          drawOutlinedSegment(4.2 * s, -11.5 * s + breath, 7.0 * s, -7.5 * s + breath, 3.4 * s, '#be8650', ink);
          drawErenHand(7.0 * s, -7.5 * s + breath, s, ink, 'relaxed', 1);
        }

        // Head
        eren.headRot = 0;
        eren.headFlipY = 1;
        eren.headWorldX = worldOriginX;
        eren.headWorldY = worldOriginY - 23.0 * s + breath;
        drawErenHead(0, -23.0 * s + breath, s, eren.facingScale, eren.cursorNear, false, false);

      } else {
        // Standing perch (Iconic TATAKAE! Clenched Fist Pose from Reference Image 1)
        // White pants legs
        drawOutlinedSegment(-3.8 * s, -6.0 * s, -4.8 * s, -1.0 * s, 4.4 * s, '#f4f3ed', ink);
        drawOutlinedSegment(3.8 * s, -6.0 * s, 4.8 * s, -1.0 * s, 4.4 * s, '#f4f3ed', ink);

        // Dark leather thigh straps wrapping around upper thighs (Image 1)
        ctx.strokeStyle = '#42281a';
        ctx.lineWidth = 0.65 * s;
        ctx.beginPath();
        ctx.moveTo(-6.2 * s, -4.4 * s); ctx.lineTo(-2.4 * s, -3.8 * s);
        ctx.moveTo(-6.5 * s, -2.4 * s); ctx.lineTo(-2.8 * s, -1.8 * s);
        ctx.moveTo(2.4 * s, -3.8 * s); ctx.lineTo(6.2 * s, -4.4 * s);
        ctx.moveTo(2.8 * s, -1.8 * s); ctx.lineTo(6.5 * s, -2.4 * s);
        ctx.stroke();

        drawErenBoot(-4.8 * s, -1.0 * s, -5.2 * s, 1.2 * s, -1.2 * s, s, ink);
        drawErenBoot(4.8 * s, -1.0 * s, 5.2 * s, 1.2 * s, 1.2 * s, s, ink);

        drawErenTorso(0, -11.5 * s + breath, 11.4 * s, 10.5 * s, s, ink);
        drawOdmGear(0, -7.0 * s + breath, s, ink, dir, 0);

        if (isAngryBitePose) {
          // 3rd & 4th Click Warning Pose: Angry Eren holding his hand directly in front of his mouth!
          // Left arm clenched tightly at his side
          const leftElbowX = -6.8 * s;
          const leftElbowY = -10.5 * s + breath;
          const leftHandX = -7.4 * s;
          const leftHandY = -5.2 * s + breath;
          drawOutlinedSegment(-4.5 * s, -14.5 * s + breath, leftElbowX, leftElbowY, 3.6 * s, '#be8650', ink);
          drawOutlinedSegment(leftElbowX, leftElbowY, leftHandX, leftHandY, 3.4 * s, '#fee4d2', ink);
          drawWingsOfFreedom(leftElbowX - 0.5 * s, leftElbowY - 1.2 * s, 3.4 * s);
          drawErenHand(leftHandX, leftHandY, s, ink, 'fist', -1);

        } else if (isBladesDrawn) {
          // Combat ready stance right after landing: both blades held defensively
          drawOutlinedSegment(-4.5 * s, -14.5 * s + breath, -8.0 * s, -12.0 * s + breath, 3.5 * s, '#be8650', ink);
          drawErenHand(-8.0 * s, -12.0 * s + breath, s, ink, 'grip', -1);
          drawOdmBlade(-8.0 * s, -12.0 * s + breath, -1.2, s, ink);

          drawOutlinedSegment(4.5 * s, -14.5 * s + breath, 8.0 * s, -12.0 * s + breath, 3.5 * s, '#be8650', ink);
          drawErenHand(8.0 * s, -12.0 * s + breath, s, ink, 'grip', 1);
          drawOdmBlade(8.0 * s, -12.0 * s + breath, 1.2, s, ink);

        } else if (sassy > 0.05) {
          // Sassy / Fierce glare: arms crossed over chest
          drawOutlinedSegment(-4.5 * s, -14.5 * s + breath, 2.5 * s, -10.0 * s + breath, 3.6 * s, '#be8650', ink);
          drawOutlinedSegment(4.5 * s, -14.5 * s + breath, -2.5 * s, -11.0 * s + breath, 3.6 * s, '#be8650', ink);
          drawErenHand(2.5 * s, -10.0 * s + breath, s, ink, 'fist', 1);
          drawErenHand(-2.5 * s, -11.0 * s + breath, s, ink, 'fist', -1);

        } else {
          // Image 1 Signature Pose: Clenched right fist raised in determination ("TATAKAE!")
          const fistX = 7.8 * s;
          const fistY = -18.2 * s + breath;
          drawOutlinedSegment(4.5 * s, -14.5 * s + breath, 8.2 * s, -14.0 * s + breath, 3.6 * s, '#be8650', ink);
          drawOutlinedSegment(8.2 * s, -14.0 * s + breath, fistX, fistY, 3.4 * s, '#fee4d2', ink);
          drawErenHand(fistX, fistY, s, ink, 'fist', 1);

          // Left arm hanging down with clenched fist + Wings of Freedom sleeve badge (Survey Corps)
          const leftElbowX = -6.8 * s;
          const leftElbowY = -10.5 * s + breath;
          const leftHandX = -7.2 * s;
          const leftHandY = -5.0 * s + breath;
          drawOutlinedSegment(-4.5 * s, -14.5 * s + breath, leftElbowX, leftElbowY, 3.6 * s, '#be8650', ink);
          drawOutlinedSegment(leftElbowX, leftElbowY, leftHandX, leftHandY, 3.4 * s, '#fee4d2', ink);
          drawWingsOfFreedom(leftElbowX - 0.5 * s, leftElbowY - 1.2 * s, 3.4 * s);
          drawErenHand(leftHandX, leftHandY, s, ink, 'fist', -1);
        }

        // Head (Angry open biting mouth at 3rd+ click, or shouting during combat/click, else fierce glare)
        const isShouting = (isAngryBitePose || eren.bladeHold > 0 || (typeof clickEffect !== 'undefined' && clickEffect.active) || eren.reactionBlend > 0.05);
        eren.headRot = 0;
        eren.headFlipY = 1;
        eren.headWorldX = worldOriginX;
        eren.headWorldY = worldOriginY - 25.5 * s + breath;
        drawErenHead(0, -25.5 * s + breath, s, eren.facingScale, isAngryBitePose ? 0.45 : eren.cursorNear, isShouting, false, isAngryBitePose);

        if (isAngryBitePose) {
          // Anime anger vein mark on forehead/temple
          ctx.save();
          ctx.strokeStyle = '#d92626';
          ctx.lineWidth = Math.max(0.9, 1.1 * s);
          ctx.lineCap = 'round';
          const vx = 5.6 * s;
          const vy = -30.5 * s + breath;
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
          const biteElbowY = -13.6 * s + breath;
          const biteHandX = 1.6 * s;
          const biteHandY = -18.8 * s + breath;
          drawOutlinedSegment(4.5 * s, -14.5 * s + breath, biteElbowX, biteElbowY, 3.6 * s, '#be8650', ink);
          drawOutlinedSegment(biteElbowX, biteElbowY, biteHandX, biteHandY, 3.3 * s, '#fee4d2', ink);
          drawErenHand(biteHandX, biteHandY, s, ink, 'fist', 1);
        }
      }
    }
  }

  ctx.restore();

  // Overlay Comic Reactions, Click Badges, and Attack Titan Transformation VFX (Lightning / Clouds / Smoke)
  drawCardReaction(s);
  drawClickEffects(s);
  drawTitanEffects();
}

/**
 * Comic speech bubble with hard offset shadow and speech pointer tail.
 */
function drawComicBubble(x, y, text, s, alpha, rot) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const w = text.length * 5.2 * s + 12 * s;
  const hw = w * 0.5;
  const tailDir = -eren.facing;

  // 1. Hard comic offset shadow
  ctx.fillStyle = '#080608';
  traceRoundedRect(-hw + 1.8 * s, -8 * s + 2.0 * s, w, 16 * s, 5 * s);
  ctx.fill();

  // 2. Main speech bubble + pointer tail toward Eren
  ctx.fillStyle = '#fffef2';
  ctx.strokeStyle = '#080608';
  ctx.lineWidth = 1.15 * s;
  traceRoundedRect(-hw, -8 * s, w, 16 * s, 5 * s);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tailDir * 4.5 * s, 7.2 * s);
  ctx.lineTo(tailDir * 9.5 * s, 12.5 * s);
  ctx.lineTo(tailDir * 1.0 * s, 7.2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Bold comic lettering
  ctx.fillStyle = '#1c2e4a';
  ctx.font = '900 ' + Math.round(8.5 * s) + 'px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0.5 * s);
  ctx.restore();
}

/**
 * Mini-reactions when hovering cards or clicking Eren
 */
function drawCardReaction(s) {
  const a = eren.reactionBlend;
  if (a < 0.03 || eren.isSwinging || !eren.headWorldX) return;
  const hx = eren.headWorldX;
  const hy = eren.headWorldY;
  const f = eren.facing;
  const pop = Math.min(1, a * 1.3);
  const bx = hx + f * 24 * s;
  const by = hy - 20 * s - (1 - pop) * 6 * s;

  // Default energetic Eren reaction
  drawComicBubble(bx, by, 'TATAKAE!', s, a, -0.1 * f);
}
