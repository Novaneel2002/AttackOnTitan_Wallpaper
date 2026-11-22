/**
 * character/eren-model.js
 * High-Accuracy Drawing Primitives for Chibi Eren Yeager (Attack on Titan):
 * Faithfully matches the exact official Chibi Eren design from the reference image:
 * - Huge expressive anime head (~1:1 ratio with body)
 * - Layered dark-chocolate spiky hair with parted bangs, top-right cowlick, and honey-gold highlights
 * - Giant sage-teal anime eyes with thick black upper lash wings, double catchlights, and sharp tilted angry brows
 * - Open shouting battle cry mouth with teeth and tongue (TATAKAE!)
 * - Cropped tan Cadet Corps jacket with turned-up collar, Training Corps crossed-swords badge on left chest & sleeve
 * - Cream lace-up shirt, leather harness straps, silver-buckled belt, dark brown V-overlap waist wrap
 * - White pants with dual thigh straps, dark brown knee riding boots
 * - Green Survey Corps cloak with Wings of Freedom billowing from behind
 * - 3D Maneuver Gear: Hip scabbards, gas canisters, back winch turbine, dual snap-blades
 */

function drawOutlinedSegment(x1, y1, x2, y2, thickness, fill, inkWidth) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (inkWidth > 0) {
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = thickness + inkWidth * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.strokeStyle = fill;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws Eren's knee boot with turned rim and angled cuff
 */
function drawErenBoot(kneeX, kneeY, footX, footY, footDirX, s, ink) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Leg segment (boot shaft)
  drawOutlinedSegment(kneeX, kneeY, footX, footY, 3.8 * s, '#341f14', ink);

  // Angled knee cuff rim
  ctx.fillStyle = '#4c2e1f';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink * 0.85;
  ctx.beginPath();
  ctx.ellipse(kneeX, kneeY, 2.6 * s, 1.3 * s, (footDirX > 0 ? 0.15 : -0.15), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Foot sole / shoe
  ctx.fillStyle = '#24140c';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink * 0.85;
  ctx.beginPath();
  ctx.ellipse(footX + footDirX * 0.4, footY, 3.0 * s, 1.6 * s, (footDirX > 0 ? 0.22 : -0.22), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Boot shaft highlight
  ctx.strokeStyle = '#5c3927';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.moveTo(kneeX + (footDirX > 0 ? 0.6 : -0.6) * s, kneeY + 1.2 * s);
  ctx.lineTo(footX + (footDirX > 0 ? 0.6 : -0.6) * s, footY - 1.0 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws Eren's hand: clenched fist (Image 1), sword grip, or relaxed
 */
function drawErenHand(x, y, s, ink, mode, facing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fce9d8';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.lineJoin = 'round';

  if (mode === 'fist') {
    // Clenched fist exactly like Image 1
    ctx.beginPath();
    ctx.arc(0, 0, 2.8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Thumb wrapped over fingers
    ctx.beginPath();
    ctx.ellipse(-1.1 * facing * s, 0.4 * s, 1.4 * s, 1.0 * s, facing * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Knuckle crease lines
    ctx.strokeStyle = '#dfb598';
    ctx.lineWidth = 0.7 * s;
    ctx.beginPath();
    ctx.moveTo(0.2 * facing * s, -1.6 * s);
    ctx.lineTo(0.6 * facing * s, 1.2 * s);
    ctx.stroke();

  } else if (mode === 'grip') {
    // Grip holding sword handle
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5 * s, 2.1 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Relaxed hand
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.3 * s, 2.6 * s, facing * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the ODM snap-blade sword from a hand grip
 */
function drawOdmBlade(handX, handY, angle, s, ink) {
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(angle);

  // 1. Sword Handle / Grip with brake trigger
  ctx.fillStyle = '#2f3136';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink * 0.8;
  ctx.beginPath();
  ctx.rect(-1.2 * s, -3.5 * s, 2.4 * s, 7.0 * s);
  ctx.fill();
  ctx.stroke();

  // Handguard + brake lever
  ctx.strokeStyle = '#858d98';
  ctx.lineWidth = 1.0 * s;
  ctx.beginPath();
  ctx.moveTo(1.2 * s, -2.5 * s);
  ctx.lineTo(2.8 * s, 0);
  ctx.lineTo(1.2 * s, 2.5 * s);
  ctx.stroke();

  // 2. Long steel snap-blade
  const bladeLen = 30 * s;
  const bladeW = 2.4 * s;

  // Blade body
  ctx.fillStyle = '#e4ecf5';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.beginPath();
  ctx.moveTo(-bladeW * 0.5, 3.5 * s);
  ctx.lineTo(bladeW * 0.5, 3.5 * s);
  ctx.lineTo(bladeW * 0.5, 3.5 * s + bladeLen);
  // Angled chisel tip
  ctx.lineTo(-bladeW * 0.5, 3.5 * s + bladeLen + 3.2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center bevel line
  ctx.strokeStyle = '#a4b2c2';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.moveTo(0, 3.5 * s);
  ctx.lineTo(0, 3.5 * s + bladeLen + 1.2 * s);
  ctx.stroke();

  // Segment hash marks (break-off lines for disposable blades)
  ctx.strokeStyle = '#92a0b0';
  ctx.lineWidth = 0.6 * s;
  for (let k = 1; k <= 5; k++) {
    const yOff = 3.5 * s + (bladeLen / 6) * k;
    ctx.beginPath();
    ctx.moveTo(-bladeW * 0.45, yOff - 0.8 * s);
    ctx.lineTo(bladeW * 0.45, yOff + 0.8 * s);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the Training Corps shield badge (crossed swords)
 */
function drawTrainingCorpsBadge(cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);

  // Shield base
  ctx.fillStyle = '#34383e';
  ctx.strokeStyle = '#d6d1c7';
  ctx.lineWidth = Math.max(0.6, size * 0.15);
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.6);
  ctx.lineTo(size * 0.5, -size * 0.6);
  ctx.lineTo(size * 0.5, size * 0.2);
  ctx.lineTo(0, size * 0.7);
  ctx.lineTo(-size * 0.5, size * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crossed silver swords
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.6, size * 0.18);
  ctx.beginPath();
  ctx.moveTo(-size * 0.32, -size * 0.4);
  ctx.lineTo(size * 0.32, size * 0.45);
  ctx.moveTo(size * 0.32, -size * 0.4);
  ctx.lineTo(-size * 0.32, size * 0.45);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the Wings of Freedom shield emblem (on back of cloak)
 */
function drawWingsOfFreedom(cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);

  // Shield outline
  ctx.fillStyle = '#1c2e4a';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.6, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.6);
  ctx.lineTo(size * 0.5, -size * 0.6);
  ctx.lineTo(size * 0.5, size * 0.2);
  ctx.lineTo(0, size * 0.75);
  ctx.lineTo(-size * 0.5, size * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Blue wing (left)
  ctx.fillStyle = '#2758a0';
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, -size * 0.45);
  ctx.lineTo(-size * 0.42, -size * 0.1);
  ctx.lineTo(-size * 0.2, 0);
  ctx.lineTo(-size * 0.38, size * 0.25);
  ctx.lineTo(-size * 0.05, size * 0.3);
  ctx.closePath();
  ctx.fill();

  // White wing (right)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(size * 0.1, -size * 0.45);
  ctx.lineTo(size * 0.42, -size * 0.1);
  ctx.lineTo(size * 0.2, 0);
  ctx.lineTo(size * 0.38, size * 0.25);
  ctx.lineTo(size * 0.05, size * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draws Eren's Torso exactly matching Image 1:
 * - Cream inner shirt with lace-up collar
 * - Cropped warm-tan Cadet Corps jacket with turned-up collar
 * - Crossed leather harness straps
 * - Training Corps shield insignia on chest and sleeve
 * - Dark brown leather belt with silver buckle
 * - Iconic dark-brown overlapping V-sash wrap around waist
 */
function drawErenTorso(cx, cy, w, h, s, ink) {
  ctx.save();
  ctx.translate(cx, cy);

  const hw = w * 0.5;
  const hh = h * 0.5;

  // 1. Inner cream shirt
  ctx.fillStyle = '#eae2cf';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.beginPath();
  ctx.rect(-hw * 0.75, -hh, w * 0.75, h * 0.78);
  ctx.fill();

  // Chest harness leather straps (running down under jacket)
  ctx.strokeStyle = '#442a1a';
  ctx.lineWidth = 1.3 * s;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.55, -hh * 0.9);
  ctx.lineTo(-hw * 0.3, hh * 0.15);
  ctx.moveTo(hw * 0.55, -hh * 0.9);
  ctx.lineTo(hw * 0.3, hh * 0.15);
  ctx.stroke();

  // Horizontal strap
  ctx.beginPath();
  ctx.moveTo(-hw * 0.55, hh * 0.15);
  ctx.lineTo(hw * 0.55, hh * 0.15);
  ctx.stroke();

  // Shirt lace-up string detail at neck
  ctx.strokeStyle = '#5a3d28';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.moveTo(0, -hh * 0.85);
  ctx.lineTo(0, -hh * 0.1);
  ctx.stroke();

  // 2. Cropped tan Cadet Corps jacket (Image 1 warm caramel tone)
  ctx.fillStyle = '#b8824f';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;

  // Left jacket panel
  ctx.beginPath();
  ctx.moveTo(-hw * 0.95, -hh * 0.95);
  ctx.lineTo(-hw * 0.22, -hh * 0.95);
  ctx.lineTo(-hw * 0.32, hh * 0.18);
  ctx.lineTo(-hw * 0.95, hh * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right jacket panel
  ctx.beginPath();
  ctx.moveTo(hw * 0.22, -hh * 0.95);
  ctx.lineTo(hw * 0.95, -hh * 0.95);
  ctx.lineTo(hw * 0.95, hh * 0.22);
  ctx.lineTo(hw * 0.32, hh * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Turned-up dark collar flaps
  ctx.fillStyle = '#8a5626';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.95, -hh * 0.95);
  ctx.lineTo(-hw * 0.28, -hh * 0.95);
  ctx.lineTo(-hw * 0.42, -hh * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(hw * 0.95, -hh * 0.95);
  ctx.lineTo(hw * 0.28, -hh * 0.95);
  ctx.lineTo(hw * 0.42, -hh * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Training Corps Badge on left chest (Image 1)
  drawTrainingCorpsBadge(-hw * 0.62, -hh * 0.35, 3.4 * s);

  // 3. Waist belt with silver buckle
  ctx.fillStyle = '#3a2416';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink * 0.8;
  ctx.beginPath();
  ctx.rect(-hw * 0.85, hh * 0.2, w * 0.85, 2.6 * s);
  ctx.fill();
  ctx.stroke();

  // Silver rectangular belt buckle
  ctx.fillStyle = '#d0d7e0';
  ctx.fillRect(-1.5 * s, hh * 0.2 - 0.3 * s, 3.0 * s, 3.2 * s);
  ctx.strokeRect(-1.5 * s, hh * 0.2 - 0.3 * s, 3.0 * s, 3.2 * s);

  // 4. Iconic dark brown waist sash / loincloth wrap (overlapping V-wrap from Image 1)
  ctx.fillStyle = '#3c2518';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.9, hh * 0.45);
  ctx.lineTo(hw * 0.9, hh * 0.45);
  // Diagonal overlapping cross hem
  ctx.lineTo(hw * 0.65, hh + 3.0 * s);
  ctx.lineTo(0, hh + 1.8 * s);
  ctx.lineTo(-hw * 0.65, hh + 3.0 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wrap crease shadow
  ctx.strokeStyle = '#26170e';
  ctx.lineWidth = 1.0 * s;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.8, hh * 0.45);
  ctx.lineTo(hw * 0.2, hh + 2.8 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the 3D Maneuver Gear on the hips:
 * - Blade scabbards (silver rectangular boxes on each side)
 * - Gas canisters (cylinders above scabbards)
 * - Central back turbine drum (circular brass unit)
 */
function drawOdmGear(hipX, hipY, s, ink, facing, bodyAngle) {
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(bodyAngle * 0.6);

  // Central turbine drum on the lower back
  ctx.fillStyle = '#b88934';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.2 * s, 3.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Turbine spokes / vent disc
  ctx.fillStyle = '#26282b';
  ctx.beginPath();
  ctx.arc(0, 0, 2.2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d4aa50';
  ctx.lineWidth = 0.8 * s;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + elapsedTime * 4.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 2.0 * s, Math.sin(a) * 2.0 * s);
    ctx.stroke();
  }

  // Draw left and right blade boxes
  for (let side = -1; side <= 1; side += 2) {
    ctx.save();
    const bx = side * 7.5 * s;
    const by = 1.0 * s;
    ctx.translate(bx, by);
    ctx.rotate(side * facing * 0.15 - 0.25);

    // 1. Silver rectangular blade case
    ctx.fillStyle = '#b2bcc6';
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = ink * 0.9;
    ctx.beginPath();
    ctx.rect(-2.2 * s, -1.0 * s, 4.4 * s, 14.0 * s);
    ctx.fill();
    ctx.stroke();

    // Steel bands on the scabbard
    ctx.fillStyle = '#5c636d';
    ctx.fillRect(-2.2 * s, 2.5 * s, 4.4 * s, 1.4 * s);
    ctx.fillRect(-2.2 * s, 8.5 * s, 4.4 * s, 1.4 * s);

    // Spare blade handles sticking out the top
    ctx.fillStyle = '#2e3034';
    for (let h = -1; h <= 1; h += 2) {
      ctx.fillRect(h * 1.0 * s - 0.6 * s, -3.2 * s, 1.2 * s, 2.2 * s);
    }

    // 2. Gas cylinder canister mounted on top of the box
    ctx.fillStyle = '#d2dbe5';
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = ink * 0.75;
    ctx.beginPath();
    ctx.rect(-1.6 * s, -1.0 * s, 3.2 * s, 11.5 * s);
    ctx.fill();
    ctx.stroke();

    // Brass valve cap at top of canister
    ctx.fillStyle = '#c2963a';
    ctx.fillRect(-1.2 * s, -2.4 * s, 2.4 * s, 1.4 * s);
    ctx.strokeRect(-1.2 * s, -2.4 * s, 2.4 * s, 1.4 * s);

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws the Survey Corps green cloak with Wings of Freedom.
 * Floats behind Eren so his front jacket, harness, badge and pose remain 100% visible!
 */
function drawSurveyCorpsCloak(backX, backY, s, ink, facing, windBlend, speed, isBackView) {
  ctx.save();
  ctx.translate(backX, backY);

  const flutter = Math.sin(elapsedTime * 14.0 + speed * 0.01) * (2.8 + speed * 0.008) * s;
  const windOffset = -facing * windBlend * 8.5 * s;

  // Cloak body
  ctx.fillStyle = '#346036';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(-5.8 * s, -8.0 * s); // left shoulder
  ctx.quadraticCurveTo(0, -9.0 * s, 5.8 * s, -8.0 * s); // collar curve
  ctx.quadraticCurveTo(9.0 * s + windOffset * 0.4, 3.0 * s, 10.5 * s + windOffset + flutter, 16.5 * s); // right hem
  ctx.quadraticCurveTo(windOffset * 0.5, 15.0 * s, -10.5 * s + windOffset - flutter, 16.5 * s); // bottom hem ripple
  ctx.quadraticCurveTo(-9.0 * s + windOffset * 0.4, 3.0 * s, -5.8 * s, -8.0 * s); // left hem
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Darker inner fold shadow
  ctx.fillStyle = '#224024';
  ctx.beginPath();
  ctx.moveTo(0, -3.0 * s);
  ctx.lineTo(5.5 * s + windOffset * 0.5, 15.5 * s);
  ctx.lineTo(windOffset * 0.3, 15.2 * s);
  ctx.closePath();
  ctx.fill();

  // Wings of Freedom Emblem on the back of the cloak
  if (isBackView || Math.abs(windOffset) > 2.0 * s || speed > 90) {
    drawWingsOfFreedom(windOffset * 0.5, 3.0 * s, 5.4 * s);
  }

  // Cloak collar fold / clasp at shoulders
  ctx.fillStyle = '#467848';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink * 0.85;
  ctx.beginPath();
  ctx.ellipse(0, -7.5 * s, 6.2 * s, 2.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws Chibi Eren's Head matching Image 1 to perfection:
 * - Huge cute anime head silhouette (~1:1 proportion with body)
 * - Rich chocolate brown spiky hair with parted bangs, top-right cowlick, and honey-gold highlights
 * - Giant sage-teal anime eyes with thick black upper lash wings, double catchlights, and sharp tilted angry brows
 * - Open shouting battle cry mouth with teeth and tongue (TATAKAE!)
 */
function drawErenHead(cx, cy, s, facingScale, squint, isShouting, isSleepy) {
  ctx.save();
  ctx.translate(cx, cy);

  const ink = Math.max(1.0, 1.35 * s);

  // 1. Ears (drawn behind head base)
  ctx.fillStyle = '#fce9d8';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.ellipse(side * 8.8 * s, 1.2 * s, 2.6 * s, 3.4 * s, side * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner ear detail
    ctx.strokeStyle = '#dfb598';
    ctx.lineWidth = 0.9 * s;
    ctx.beginPath();
    ctx.arc(side * 8.8 * s, 1.2 * s, 1.5 * s, 0, Math.PI);
    ctx.stroke();
  }

  // 2. Chibi Face / Head Contour (smooth wide cheeks tapering to soft cute chin)
  ctx.fillStyle = '#fce9d8';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.beginPath();
  ctx.moveTo(-8.6 * s, -4.5 * s);
  ctx.quadraticCurveTo(-9.2 * s, 2.8 * s, -6.0 * s, 7.8 * s); // left chubby cheek
  ctx.quadraticCurveTo(0, 10.2 * s, 6.0 * s, 7.8 * s);        // rounded chin
  ctx.quadraticCurveTo(9.2 * s, 2.8 * s, 8.6 * s, -4.5 * s);  // right chubby cheek
  ctx.quadraticCurveTo(0, -10.0 * s, -8.6 * s, -4.5 * s);     // top cranium
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft peachy cheek blush
  ctx.fillStyle = 'rgba(245, 130, 110, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-5.5 * s, 4.0 * s, 2.8 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(5.5 * s, 4.0 * s, 2.8 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Eyes: Giant Anime Teal Eyes (Image 1)
  const eyeY = 1.0 * s;
  const eyeSpacing = 4.8 * s;
  const eyeW = 4.0 * s;
  const eyeH = 5.2 * s;

  for (let side = -1; side <= 1; side += 2) {
    const ex = side * eyeSpacing;

    if (isSleepy) {
      // Closed resting anime eye
      ctx.strokeStyle = '#14110f';
      ctx.lineWidth = 2.0 * s;
      ctx.beginPath();
      ctx.arc(ex, eyeY + 1.2 * s, 3.0 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      continue;
    }

    if (eren.isBlinking) {
      // Eyelid closing progression
      const bp = eren.blinkProgress;
      const lidY = eyeY - eyeH * 0.45 + bp * eyeH;
      ctx.strokeStyle = '#14110f';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW * 0.95, lidY);
      ctx.quadraticCurveTo(ex, lidY + 1.2 * s, ex + eyeW * 0.95, lidY);
      ctx.stroke();
      continue;
    }

    // Eye white (sclera)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW, eyeH * (1 - squint * 0.4), 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Iris (Deep charcoal-green top `#203530` blending down to pale sage-teal `#88b8a8` as in Image 1)
    const lookOffX = (eren.lookX || 0) * 1.3 * s;
    const lookOffY = (eren.lookY || 0) * 0.8 * s;
    const irisX = ex + lookOffX;
    const irisY = eyeY + lookOffY;
    const irisR = 3.3 * s;

    const grad = ctx.createRadialGradient(irisX, irisY - 1.2 * s, 0.6 * s, irisX, irisY, irisR);
    grad.addColorStop(0.0, '#98cbbe');
    grad.addColorStop(0.35, '#689d8f');
    grad.addColorStop(0.75, '#355c52');
    grad.addColorStop(1.0, '#1c302a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(irisX, irisY, irisR, 0, Math.PI * 2);
    ctx.fill();

    // Dark pupil
    ctx.fillStyle = '#0f1d19';
    ctx.beginPath();
    ctx.arc(irisX, irisY, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Crescent specular reflection at bottom-right of iris (Image 1)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(irisX + 0.9 * s, irisY + 1.2 * s, 0.8 * s, 0, Math.PI * 2);
    ctx.fill();

    // Top-left crisp white catchlight dot (Image 1)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(irisX - 1.1 * s, irisY - 1.1 * s, 1.0 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Heavy bold black upper lash line with sharp outer wing (Image 1 signature!)
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = 2.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 1.05, eyeY - eyeH * 0.35);
    ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.7, ex + eyeW * 1.12, eyeY - eyeH * 0.3);
    ctx.stroke();

    // Fine lower lash line
    ctx.strokeStyle = '#2b221a';
    ctx.lineWidth = 0.85 * s;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.55, eyeY + eyeH * 0.48);
    ctx.lineTo(ex + eyeW * 0.55, eyeY + eyeH * 0.48);
    ctx.stroke();
  }

  // 4. Sharp Angry Eyebrows (Image 1 Iconic Determined Expression)
  ctx.fillStyle = '#26160e';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink * 0.7;

  // Left eyebrow (steep diagonal arch down toward center)
  ctx.beginPath();
  ctx.moveTo(- eyeSpacing - 4.2 * s, eyeY - 4.2 * s);
  ctx.lineTo(- eyeSpacing + 3.4 * s, eyeY - 1.8 * s);
  ctx.lineTo(- eyeSpacing - 3.2 * s, eyeY - 5.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(eyeSpacing + 4.2 * s, eyeY - 4.2 * s);
  ctx.lineTo(eyeSpacing - 3.4 * s, eyeY - 1.8 * s);
  ctx.lineTo(eyeSpacing + 3.2 * s, eyeY - 5.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forehead furrow wrinkle creases (Image 1)
  ctx.strokeStyle = '#382014';
  ctx.lineWidth = 0.9 * s;
  ctx.beginPath();
  ctx.moveTo(-1.0 * s, eyeY - 2.6 * s);
  ctx.lineTo(-0.4 * s, eyeY - 4.0 * s);
  ctx.moveTo(1.0 * s, eyeY - 2.6 * s);
  ctx.lineTo(0.4 * s, eyeY - 4.0 * s);
  ctx.stroke();

  // 5. Mouth: Open Shouting Battle Cry (Image 1 "TATAKAE!")
  if (isShouting || eren.isSwinging || eren.mode !== MODE_PERCH) {
    ctx.save();
    // Mouth cavity
    ctx.fillStyle = '#a63d38';
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = ink;
    ctx.beginPath();
    ctx.moveTo(-2.6 * s, 5.0 * s);
    ctx.quadraticCurveTo(0, 4.4 * s, 2.6 * s, 5.0 * s);
    ctx.quadraticCurveTo(3.0 * s, 8.2 * s, 0, 8.6 * s);
    ctx.quadraticCurveTo(-3.0 * s, 8.2 * s, -2.6 * s, 5.0 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Upper white teeth band (Image 1)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-2.2 * s, 5.0 * s);
    ctx.lineTo(2.2 * s, 5.0 * s);
    ctx.lineTo(1.8 * s, 6.2 * s);
    ctx.lineTo(-1.8 * s, 6.2 * s);
    ctx.closePath();
    ctx.fill();

    // Pink tongue at bottom
    ctx.fillStyle = '#e4787e';
    ctx.beginPath();
    ctx.arc(0, 8.0 * s, 1.5 * s, Math.PI, 0);
    ctx.fill();

    // Tiny lower lip shadow accent
    ctx.fillStyle = '#b8826e';
    ctx.beginPath();
    ctx.arc(0, 9.6 * s, 0.7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else {
    // Determined clenched line
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = 1.3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.4 * s, 6.2 * s);
    ctx.lineTo(2.0 * s, 6.4 * s);
    ctx.stroke();

    // Lower lip shadow
    ctx.fillStyle = '#b8826e';
    ctx.beginPath();
    ctx.arc(0, 7.8 * s, 0.65 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Messy Spiky Hair (Faithful Translation of Reference Image 1)
  // Hair base color: dark chocolate `#452818` with deep shadow `#2a170c`
  ctx.fillStyle = '#452818';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = ink;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Left sideburn framing face
  ctx.moveTo(-9.2 * s, 0.5 * s);
  ctx.quadraticCurveTo(-11.2 * s, -5.5 * s, -9.0 * s, -9.8 * s); // left spike
  ctx.lineTo(-10.5 * s, -11.0 * s);
  ctx.quadraticCurveTo(-8.5 * s, -13.5 * s, -5.2 * s, -14.4 * s); // top-left lock
  ctx.lineTo(-4.8 * s, -16.2 * s);                                // back-left tuft
  ctx.lineTo(-2.0 * s, -15.0 * s);
  ctx.quadraticCurveTo(3.2 * s, -15.4 * s, 6.8 * s, -13.2 * s);  // crown
  // Top-Right iconic cowlick spike from Image 1!
  ctx.lineTo(8.2 * s, -16.8 * s);
  ctx.lineTo(9.4 * s, -13.8 * s);
  ctx.quadraticCurveTo(11.5 * s, -8.5 * s, 9.2 * s, 0.5 * s);    // right sideburn
  ctx.lineTo(8.5 * s, 2.2 * s);

  // Bangs over forehead (exact Image 1 silhouette with center-parted locks)
  ctx.lineTo(7.0 * s, -2.0 * s);
  ctx.lineTo(5.5 * s, 1.2 * s);   // right bang clump
  ctx.lineTo(3.6 * s, -3.2 * s);
  ctx.lineTo(2.0 * s, 0.8 * s);   // center-right lock
  ctx.lineTo(0.3 * s, -4.2 * s);  // center forehead parting!
  ctx.lineTo(-1.6 * s, 0.9 * s);  // center-left lock
  ctx.lineTo(-3.6 * s, -3.2 * s);
  ctx.lineTo(-5.2 * s, 1.2 * s);  // left bang clump
  ctx.lineTo(-7.0 * s, -2.0 * s);
  ctx.lineTo(-8.5 * s, 2.2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 7. Honey-Gold Gloss Highlights across Crown (Image 1 Signature Highlight!)
  ctx.fillStyle = '#a6784d';
  // Triangular glossy patch on top-right
  ctx.beginPath();
  ctx.moveTo(3.5 * s, -13.2 * s);
  ctx.lineTo(7.0 * s, -11.8 * s);
  ctx.lineTo(5.0 * s, -9.8 * s);
  ctx.closePath();
  ctx.fill();

  // Triangular glossy patch on top-left
  ctx.beginPath();
  ctx.moveTo(-2.5 * s, -13.5 * s);
  ctx.lineTo(-6.0 * s, -12.0 * s);
  ctx.lineTo(-4.2 * s, -10.2 * s);
  ctx.closePath();
  ctx.fill();

  // Hair strand accent lines
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = 0.9 * s;
  ctx.beginPath();
  ctx.moveTo(2.0 * s, 0.8 * s);
  ctx.lineTo(1.4 * s, -3.2 * s);
  ctx.moveTo(-1.6 * s, 0.9 * s);
  ctx.lineTo(-1.0 * s, -3.2 * s);
  ctx.stroke();

  ctx.restore();
}
