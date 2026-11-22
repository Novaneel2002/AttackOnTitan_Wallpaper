/**
 * character/eren-model.js
 * High-Accuracy Drawing Primitives for Chibi Eren Yeager (Attack on Titan):
 * Faithfully matches the exact official Chibi Eren design from the reference images:
 * - Huge expressive anime head (~1:1 ratio with body) with plump cheeks & soft chin
 * - Layered dark-chocolate spiky hair with center-parted curtain bangs, top cowlicks, and amber-gold gloss highlights
 * - Giant emerald-teal anime eyes with rich multi-stop gradient, double catchlights, thick black winged liner & sharp determined brows
 * - Open battle-cry shouting mouth (TATAKAE!) or intense determined glare
 * - Cropped tan Survey Corps jacket with dark brown collar, epaulets, chest pockets & Wings of Freedom badge
 * - Cream inner tunic with lace-up collar slit, criss-cross leather harness straps, silver-buckled belt & brown leather waist wrap (kilt)
 * - Military ecru trousers with dual dark leather thigh straps, high dark brown riding boots with cuffs
 * - Green Survey Corps hooded cloak with Wings of Freedom billowing behind
 * - 3D Maneuver Gear (ODM Gear): Hip scabbards, dual gas canisters with brass valves, back turbine drum, segmented snap-blades
 */

function drawOutlinedSegment(x1, y1, x2, y2, thickness, fill, inkWidth) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (inkWidth > 0) {
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = thickness + Math.max(0.6, inkWidth * 0.8);
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
 * Draws Eren's knee riding boot with turned cuff, shaft highlight, and sole
 */
function drawErenBoot(kneeX, kneeY, footX, footY, footDirX, s, ink) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Boot shaft (leg segment)
  drawOutlinedSegment(kneeX, kneeY, footX, footY, 4.0 * s, '#2b1910', ink);

  // 2. Angled knee cuff rim
  ctx.fillStyle = '#42281b';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.75;
  ctx.beginPath();
  ctx.ellipse(kneeX, kneeY, 2.9 * s, 1.45 * s, (footDirX > 0 ? 0.16 : -0.16), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cuff top highlight
  ctx.strokeStyle = '#68402c';
  ctx.lineWidth = 0.55 * s;
  ctx.beginPath();
  ctx.ellipse(kneeX, kneeY - 0.2 * s, 2.3 * s, 0.9 * s, (footDirX > 0 ? 0.16 : -0.16), 0, Math.PI * 2);
  ctx.stroke();

  // 3. Foot shoe / sole
  ctx.fillStyle = '#1c100a';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.75;
  ctx.beginPath();
  ctx.ellipse(footX + footDirX * 0.45, footY, 3.3 * s, 1.8 * s, (footDirX > 0 ? 0.2 : -0.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Boot shaft shin highlight
  ctx.strokeStyle = '#5a3522';
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.moveTo(kneeX + (footDirX > 0 ? 0.7 : -0.7) * s, kneeY + 1.2 * s);
  ctx.lineTo(footX + (footDirX > 0 ? 0.7 : -0.7) * s, footY - 1.0 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws Eren's hand: clenched fist, sword grip, or relaxed
 */
function drawErenHand(x, y, s, ink, mode, facing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fee4d2';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.lineJoin = 'round';

  if (mode === 'fist') {
    // Clenched fist with wrapped thumb and knuckle crease
    ctx.beginPath();
    ctx.arc(0, 0, 3.0 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Thumb wrapped over fingers
    ctx.beginPath();
    ctx.ellipse(-1.2 * facing * s, 0.45 * s, 1.5 * s, 1.1 * s, facing * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Knuckle crease lines
    ctx.strokeStyle = '#dfb598';
    ctx.lineWidth = 0.55 * s;
    ctx.beginPath();
    ctx.moveTo(0.25 * facing * s, -1.8 * s);
    ctx.lineTo(0.7 * facing * s, 1.3 * s);
    ctx.stroke();

  } else if (mode === 'grip') {
    // Grip holding sword handle
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.7 * s, 2.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Finger separation
    ctx.strokeStyle = '#dfb598';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(-1.2 * s, 0);
    ctx.lineTo(1.2 * s, 0);
    ctx.stroke();
  } else {
    // Relaxed hand
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5 * s, 2.8 * s, facing * 0.2, 0, Math.PI * 2);
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
  ctx.fillStyle = '#26282c';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.7;
  ctx.beginPath();
  ctx.rect(-1.3 * s, -3.8 * s, 2.6 * s, 7.6 * s);
  ctx.fill();
  ctx.stroke();

  // Handguard + brake lever
  ctx.strokeStyle = '#8c95a0';
  ctx.lineWidth = 0.75 * s;
  ctx.beginPath();
  ctx.moveTo(1.3 * s, -2.8 * s);
  ctx.lineTo(3.0 * s, 0);
  ctx.lineTo(1.3 * s, 2.8 * s);
  ctx.stroke();

  // Trigger release wire cable
  ctx.strokeStyle = '#4a4f56';
  ctx.lineWidth = 0.55 * s;
  ctx.beginPath();
  ctx.moveTo(0, 3.8 * s);
  ctx.quadraticCurveTo(2.0 * s, 5.0 * s, 1.0 * s, 6.5 * s);
  ctx.stroke();

  // 2. Long steel snap-blade
  const bladeLen = 34 * s;
  const bladeW = 2.6 * s;

  // Blade body (bright tempered steel)
  ctx.fillStyle = '#edf2f7';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.beginPath();
  ctx.moveTo(-bladeW * 0.5, 3.8 * s);
  ctx.lineTo(bladeW * 0.5, 3.8 * s);
  ctx.lineTo(bladeW * 0.5, 3.8 * s + bladeLen);
  // Angled chisel tip (iconic Attack on Titan utility box-cutter blade)
  ctx.lineTo(-bladeW * 0.5, 3.8 * s + bladeLen + 3.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Blade bevel highlight line
  ctx.strokeStyle = '#b9c7d4';
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.moveTo(0, 3.8 * s);
  ctx.lineTo(0, 3.8 * s + bladeLen + 1.4 * s);
  ctx.stroke();

  // Segment hash marks (break-off lines for disposable blades)
  ctx.strokeStyle = '#9caec0';
  ctx.lineWidth = 0.45 * s;
  for (let k = 1; k <= 5; k++) {
    const yOff = 3.8 * s + (bladeLen / 6) * k;
    ctx.beginPath();
    ctx.moveTo(-bladeW * 0.45, yOff - 0.9 * s);
    ctx.lineTo(bladeW * 0.45, yOff + 0.9 * s);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the high-detail Survey Corps Wings of Freedom shield emblem
 */
function drawWingsOfFreedom(cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);

  const hw = size * 0.5;
  const hh = size * 0.6;

  // 1. Outer shield border (silver)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = Math.max(0.45, size * 0.07);
  ctx.beginPath();
  ctx.moveTo(-hw, -hh);
  ctx.lineTo(hw, -hh);
  ctx.lineTo(hw, hh * 0.3);
  ctx.lineTo(0, hh * 1.1);
  ctx.lineTo(-hw, hh * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Inner shield field (deep Survey Corps navy blue)
  ctx.fillStyle = '#152640';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.85, -hh * 0.88);
  ctx.lineTo(hw * 0.85, -hh * 0.88);
  ctx.lineTo(hw * 0.85, hh * 0.25);
  ctx.lineTo(0, hh * 0.95);
  ctx.lineTo(-hw * 0.85, hh * 0.25);
  ctx.closePath();
  ctx.fill();

  // 3. Blue Wing (Left) - overlapping feathered quills
  ctx.fillStyle = '#1f5bb5';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.15, -hh * 0.65);
  ctx.lineTo(-hw * 0.72, -hh * 0.15);
  ctx.lineTo(-hw * 0.35, -hh * 0.05);
  ctx.lineTo(-hw * 0.68, hh * 0.35);
  ctx.lineTo(-hw * 0.25, hh * 0.38);
  ctx.lineTo(-hw * 0.48, hh * 0.68);
  ctx.lineTo(-hw * 0.05, hh * 0.45);
  ctx.lineTo(-hw * 0.08, -hh * 0.55);
  ctx.closePath();
  ctx.fill();

  // 4. White Wing (Right) - overlapping feathered quills crossing center
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(hw * 0.15, -hh * 0.65);
  ctx.lineTo(hw * 0.72, -hh * 0.15);
  ctx.lineTo(hw * 0.35, -hh * 0.05);
  ctx.lineTo(hw * 0.68, hh * 0.35);
  ctx.lineTo(hw * 0.25, hh * 0.38);
  ctx.lineTo(hw * 0.48, hh * 0.68);
  ctx.lineTo(hw * 0.05, hh * 0.45);
  ctx.lineTo(hw * 0.08, -hh * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the Training Corps crossed swords badge (alternative badge)
 */
function drawTrainingCorpsBadge(cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);

  // Shield base
  ctx.fillStyle = '#34383e';
  ctx.strokeStyle = '#d6d1c7';
  ctx.lineWidth = Math.max(0.6, size * 0.14);
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.6);
  ctx.lineTo(size * 0.5, -size * 0.6);
  ctx.lineTo(size * 0.5, size * 0.2);
  ctx.lineTo(0, size * 0.75);
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
 * Draws Eren's Torso with authentic Survey Corps details:
 * - Cream inner tunic with keyhole / lace-up neck opening
 * - Cropped warm-caramel tan Scout jacket with dark brown collar & lapels
 * - Chest pockets with button flaps & Wings of Freedom badge on left breast
 * - Leather harness straps running over chest & shoulders
 * - Dark brown leather belt with silver rectangular buckle
 * - Dark brown leather waist wrap (kilt) overlapping in front
 */
function drawErenTorso(cx, cy, w, h, s, ink) {
  ctx.save();
  ctx.translate(cx, cy);

  const hw = w * 0.5;
  const hh = h * 0.5;

  // 1. Inner cream shirt / tunic
  ctx.fillStyle = '#f4ede1';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink;
  ctx.beginPath();
  ctx.rect(-hw * 0.75, -hh, w * 0.75, h * 0.78);
  ctx.fill();

  // Keyhole / V-slit open collar showing throat
  ctx.fillStyle = '#fee4d2';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.2, -hh);
  ctx.lineTo(hw * 0.2, -hh);
  ctx.lineTo(0, -hh * 0.2);
  ctx.closePath();
  ctx.fill();

  // Criss-cross string lacing across the open collar
  ctx.strokeStyle = '#4a2c1a';
  ctx.lineWidth = 0.55 * s;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.18, -hh * 0.85);
  ctx.lineTo(hw * 0.18, -hh * 0.55);
  ctx.moveTo(hw * 0.18, -hh * 0.85);
  ctx.lineTo(-hw * 0.18, -hh * 0.55);
  ctx.stroke();

  // Chest harness leather straps (running down over chest under the open jacket)
  ctx.strokeStyle = '#3a2215';
  ctx.lineWidth = 0.95 * s;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.55, -hh * 0.9);
  ctx.lineTo(-hw * 0.28, hh * 0.15);
  ctx.moveTo(hw * 0.55, -hh * 0.9);
  ctx.lineTo(hw * 0.28, hh * 0.15);
  ctx.stroke();

  // Horizontal connector chest strap
  ctx.beginPath();
  ctx.moveTo(-hw * 0.55, hh * 0.15);
  ctx.lineTo(hw * 0.55, hh * 0.15);
  ctx.stroke();

  // Central metal ring / connector rivet on chest harness
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.arc(0, hh * 0.15, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();

  // 2. Cropped tan Scout jacket (Iconic warm caramel tone #be8650)
  ctx.fillStyle = '#be8650';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;

  // Left jacket panel
  ctx.beginPath();
  ctx.moveTo(-hw * 0.98, -hh * 0.95);
  ctx.lineTo(-hw * 0.24, -hh * 0.95);
  ctx.lineTo(-hw * 0.34, hh * 0.22);
  ctx.lineTo(-hw * 0.98, hh * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right jacket panel
  ctx.beginPath();
  ctx.moveTo(hw * 0.24, -hh * 0.95);
  ctx.lineTo(hw * 0.98, -hh * 0.95);
  ctx.lineTo(hw * 0.98, hh * 0.24);
  ctx.lineTo(hw * 0.34, hh * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dark chocolate turned-down collar & lapels
  ctx.fillStyle = '#3c2214';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.98, -hh * 0.98);
  ctx.lineTo(-hw * 0.26, -hh * 0.98);
  ctx.lineTo(-hw * 0.44, -hh * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(hw * 0.98, -hh * 0.98);
  ctx.lineTo(hw * 0.26, -hh * 0.98);
  ctx.lineTo(hw * 0.44, -hh * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Breast pockets with button flaps
  ctx.fillStyle = '#a9733e';
  // Left breast pocket
  ctx.fillRect(-hw * 0.85, -hh * 0.3, hw * 0.45, hh * 0.4);
  ctx.strokeRect(-hw * 0.85, -hh * 0.3, hw * 0.45, hh * 0.4);
  // Right breast pocket
  ctx.fillRect(hw * 0.4, -hh * 0.3, hw * 0.45, hh * 0.4);
  ctx.strokeRect(hw * 0.4, -hh * 0.3, hw * 0.45, hh * 0.4);

  // Wings of Freedom Badge on left chest pocket (Survey Corps!)
  drawWingsOfFreedom(-hw * 0.62, -hh * 0.12, 3.8 * s);

  // Silver jacket buttons
  ctx.fillStyle = '#cfd8dc';
  ctx.beginPath();
  ctx.arc(-hw * 0.3, -hh * 0.15, 0.7 * s, 0, Math.PI * 2);
  ctx.arc(-hw * 0.32, hh * 0.08, 0.7 * s, 0, Math.PI * 2);
  ctx.arc(hw * 0.3, -hh * 0.15, 0.7 * s, 0, Math.PI * 2);
  ctx.arc(hw * 0.32, hh * 0.08, 0.7 * s, 0, Math.PI * 2);
  ctx.fill();

  // Shoulder epaulet straps
  ctx.strokeStyle = '#3c2214';
  ctx.lineWidth = 0.7 * s;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.95, -hh * 0.85);
  ctx.lineTo(-hw * 0.65, -hh * 0.92);
  ctx.moveTo(hw * 0.95, -hh * 0.85);
  ctx.lineTo(hw * 0.65, -hh * 0.92);
  ctx.stroke();

  // 3. Waist belt with silver buckle
  ctx.fillStyle = '#341f13';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.7;
  ctx.beginPath();
  ctx.rect(-hw * 0.88, hh * 0.22, w * 0.88, 2.8 * s);
  ctx.fill();
  ctx.stroke();

  // Silver rectangular belt buckle
  ctx.fillStyle = '#e0e7ec';
  ctx.fillRect(-1.7 * s, hh * 0.22 - 0.3 * s, 3.4 * s, 3.4 * s);
  ctx.strokeRect(-1.7 * s, hh * 0.22 - 0.3 * s, 3.4 * s, 3.4 * s);
  ctx.fillStyle = '#341f13';
  ctx.fillRect(-0.7 * s, hh * 0.22 + 0.5 * s, 1.4 * s, 1.8 * s);

  // 4. Iconic dark brown leather waist wrap (kilt / butt-cape)
  ctx.fillStyle = '#382216';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.92, hh * 0.48);
  ctx.lineTo(hw * 0.92, hh * 0.48);
  // Diagonal overlapping cross hem
  ctx.lineTo(hw * 0.7, hh + 3.4 * s);
  ctx.lineTo(0, hh + 2.0 * s);
  ctx.lineTo(-hw * 0.7, hh + 3.4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wrap crease shadow & seam
  ctx.strokeStyle = '#22140c';
  ctx.lineWidth = 0.7 * s;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.85, hh * 0.48);
  ctx.lineTo(hw * 0.22, hh + 3.2 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the 3D Maneuver Gear on the hips:
 * - Blade scabbards (metallic silver boxes on both hips)
 * - Gas canisters (dual pressurized cylinders with copper valve caps)
 * - Central back turbine drum (circular propulsion unit)
 */
function drawOdmGear(hipX, hipY, s, ink, facing, bodyAngle) {
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(bodyAngle * 0.6);

  // Central turbine drum on the lower back
  ctx.fillStyle = '#b88934';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.4 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Turbine spokes / vent disc
  ctx.fillStyle = '#26282b';
  ctx.beginPath();
  ctx.arc(0, 0, 2.4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e0b85c';
  ctx.lineWidth = 0.55 * s;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + elapsedTime * 4.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 2.2 * s, Math.sin(a) * 2.2 * s);
    ctx.stroke();
  }

  // Draw left and right blade boxes
  for (let side = -1; side <= 1; side += 2) {
    ctx.save();
    const bx = side * 8.0 * s;
    const by = 1.0 * s;
    ctx.translate(bx, by);
    ctx.rotate(side * facing * 0.15 - 0.25);

    // 1. Silver rectangular blade case
    ctx.fillStyle = '#b8c4ce';
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = ink * 0.75;
    ctx.beginPath();
    ctx.rect(-2.4 * s, -1.0 * s, 4.8 * s, 15.0 * s);
    ctx.fill();
    ctx.stroke();

    // Steel bands on the scabbard
    ctx.fillStyle = '#4c535d';
    ctx.fillRect(-2.4 * s, 2.8 * s, 4.8 * s, 1.5 * s);
    ctx.fillRect(-2.4 * s, 9.2 * s, 4.8 * s, 1.5 * s);

    // Spare blade handles sticking out the top
    ctx.fillStyle = '#2a2c30';
    for (let h = -1; h <= 1; h += 2) {
      ctx.fillRect(h * 1.1 * s - 0.65 * s, -3.4 * s, 1.3 * s, 2.4 * s);
    }

    // 2. Gas cylinder canister mounted on top of the box
    ctx.fillStyle = '#d8e2ec';
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = ink * 0.6;
    ctx.beginPath();
    ctx.rect(-1.8 * s, -1.0 * s, 3.6 * s, 12.5 * s);
    ctx.fill();
    ctx.stroke();

    // Specular highlight stripe along the cylinder
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.0 * s, -0.6 * s, 0.9 * s, 11.5 * s);

    // Brass valve cap at top of canister
    ctx.fillStyle = '#c8963e';
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = ink * 0.55;
    ctx.beginPath();
    ctx.rect(-1.3 * s, -2.6 * s, 2.6 * s, 1.6 * s);
    ctx.fill();
    ctx.stroke();

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

  const flutter = Math.sin(elapsedTime * 14.0 + speed * 0.01) * (3.0 + speed * 0.009) * s;
  const windOffset = -facing * windBlend * 9.5 * s;

  // Cloak body (Forest green)
  ctx.fillStyle = '#245934';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.8;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(-6.2 * s, -8.5 * s); // left shoulder
  ctx.quadraticCurveTo(0, -9.6 * s, 6.2 * s, -8.5 * s); // collar curve
  ctx.quadraticCurveTo(9.5 * s + windOffset * 0.4, 3.0 * s, 11.5 * s + windOffset + flutter, 17.5 * s); // right hem
  ctx.quadraticCurveTo(windOffset * 0.5, 16.0 * s, -11.5 * s + windOffset - flutter, 17.5 * s); // bottom hem ripple
  ctx.quadraticCurveTo(-9.5 * s + windOffset * 0.4, 3.0 * s, -6.2 * s, -8.5 * s); // left hem
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Darker inner fold shadow
  ctx.fillStyle = '#173d22';
  ctx.beginPath();
  ctx.moveTo(0, -3.0 * s);
  ctx.lineTo(6.0 * s + windOffset * 0.5, 16.5 * s);
  ctx.lineTo(windOffset * 0.3, 16.0 * s);
  ctx.closePath();
  ctx.fill();

  // Wings of Freedom Emblem on the back of the cloak
  if (isBackView || Math.abs(windOffset) > 2.0 * s || speed > 80) {
    drawWingsOfFreedom(windOffset * 0.5, 3.5 * s, 6.2 * s);
  }

  // Cloak collar fold / clasp at shoulders
  ctx.fillStyle = '#327042';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.65;
  ctx.beginPath();
  ctx.ellipse(0, -8.0 * s, 6.8 * s, 2.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cloak silver clasp button
  ctx.fillStyle = '#d0dbe5';
  ctx.beginPath();
  ctx.arc(0, -7.5 * s, 1.0 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws Chibi Eren's Head matching the official anime / Nendoroid design:
 * - Expressive rounded anime head (~1:1 proportion with body)
 * - Layered dark-chocolate spiky hair with center-parted curtain bangs, sideburns, cowlicks & warm amber gloss
 * - Soft forehead drop-shadow under the bangs for true 2D anime depth
 * - Giant luminous emerald-teal eyes with multi-stop gradient, black pupil, double catchlights & thick winged liner
 * - Determined angled eyebrows with inner furrow crease (signature Eren resolve!)
 * - Open battle cry shouting mouth with teeth & tongue (TATAKAE!) or fierce clenched glare
 */
function drawErenHead(cx, cy, s, facingScale, squint, isShouting, isSleepy) {
  ctx.save();
  ctx.translate(cx, cy);

  const ink = Math.max(0.65, 0.75 * s);

  // =========================================================================
  // 1. BACK HAIR LAYER (Behind face and ears, giving head full volume)
  // =========================================================================
  ctx.fillStyle = '#26150c';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Spikes flaring behind the neck and lower ears
  ctx.moveTo(-7.5 * s, 6.5 * s);
  ctx.lineTo(-9.8 * s, 4.5 * s);
  ctx.lineTo(-9.0 * s, 2.0 * s);
  ctx.lineTo(-11.5 * s, -1.0 * s);
  ctx.lineTo(-10.2 * s, -4.5 * s);
  ctx.lineTo(-12.4 * s, -8.5 * s);
  ctx.lineTo(-9.5 * s, -12.5 * s);
  ctx.lineTo(-6.5 * s, -15.5 * s);
  ctx.lineTo(-2.0 * s, -16.8 * s);
  ctx.lineTo(2.0 * s, -16.8 * s);
  ctx.lineTo(6.5 * s, -15.5 * s);
  ctx.lineTo(9.5 * s, -12.5 * s);
  ctx.lineTo(12.4 * s, -8.5 * s);
  ctx.lineTo(10.2 * s, -4.5 * s);
  ctx.lineTo(11.5 * s, -1.0 * s);
  ctx.lineTo(9.0 * s, 2.0 * s);
  ctx.lineTo(9.8 * s, 4.5 * s);
  ctx.lineTo(7.5 * s, 6.5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // =========================================================================
  // 2. EARS
  // =========================================================================
  ctx.fillStyle = '#fee4d2';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.75;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.ellipse(side * 9.2 * s, 1.4 * s, 2.8 * s, 3.6 * s, side * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner ear cartilage fold
    ctx.strokeStyle = '#dfb094';
    ctx.lineWidth = 0.55 * s;
    ctx.beginPath();
    ctx.arc(side * 9.2 * s, 1.4 * s, 1.6 * s, 0, Math.PI);
    ctx.stroke();
  }

  // =========================================================================
  // 3. CHIBI FACE / CHEEKS CONTOUR
  // =========================================================================
  ctx.fillStyle = '#fee4d2';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.beginPath();
  ctx.moveTo(-9.0 * s, -4.5 * s);
  ctx.quadraticCurveTo(-9.6 * s, 3.2 * s, -6.2 * s, 8.2 * s); // chubby left cheek
  ctx.quadraticCurveTo(0, 10.6 * s, 6.2 * s, 8.2 * s);        // rounded chin
  ctx.quadraticCurveTo(9.6 * s, 3.2 * s, 9.0 * s, -4.5 * s);  // chubby right cheek
  ctx.quadraticCurveTo(0, -10.5 * s, -9.0 * s, -4.5 * s);     // top cranium
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft peachy cheek blush
  ctx.fillStyle = 'rgba(255, 115, 95, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-5.8 * s, 4.4 * s, 3.0 * s, 1.6 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(5.8 * s, 4.4 * s, 3.0 * s, 1.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle anime nose dot
  ctx.fillStyle = '#d89b7d';
  ctx.beginPath();
  ctx.arc(0, 3.2 * s, 0.65 * s, 0, Math.PI * 2);
  ctx.fill();

  // =========================================================================
  // 4. EYES: GIANT EMERALD-TEAL ANIME EYES (The Soul of Eren Yeager!)
  // =========================================================================
  const eyeY = 1.0 * s;
  const eyeSpacing = 5.0 * s;
  const eyeW = 4.2 * s;
  const eyeH = 5.4 * s;

  for (let side = -1; side <= 1; side += 2) {
    const ex = side * eyeSpacing;

    if (isSleepy) {
      // Closed resting anime eye with relaxed lash curve
      ctx.strokeStyle = '#120d0a';
      ctx.lineWidth = 1.35 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, eyeY + 1.2 * s, 3.2 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      continue;
    }

    if (eren.isBlinking) {
      // Smooth eyelid blinking progression
      const bp = eren.blinkProgress;
      const lidY = eyeY - eyeH * 0.45 + bp * eyeH;
      ctx.strokeStyle = '#120d0a';
      ctx.lineWidth = 1.4 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - eyeW * 1.0, lidY);
      ctx.quadraticCurveTo(ex, lidY + 1.4 * s, ex + eyeW * 1.0, lidY);
      ctx.stroke();
      continue;
    }

    // Eye white (sclera)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW, eyeH * (1 - squint * 0.35), 0, 0, Math.PI * 2);
    ctx.clip();

    // Sclera base fill
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Subtle soft blue-grey curvature shadow at top of eyeball
    ctx.fillStyle = '#d9e2ec';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY - eyeH * 0.35, eyeW, eyeH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (Vibrant Attack on Titan emerald-teal gradient)
    const lookOffX = (eren.lookX || 0) * 1.35 * s;
    const lookOffY = (eren.lookY || 0) * 0.85 * s;
    const irisX = ex + lookOffX;
    const irisY = eyeY + lookOffY;
    const irisR = 3.4 * s;

    // Multi-stop rich emerald gradient
    const grad = ctx.createRadialGradient(irisX, irisY - 1.2 * s, 0.4 * s, irisX, irisY, irisR);
    grad.addColorStop(0.0, '#98fae2');  // bright glowing center
    grad.addColorStop(0.35, '#38dfb4'); // vivid turquoise
    grad.addColorStop(0.65, '#168a6d'); // rich emerald
    grad.addColorStop(0.9, '#0e4a3b');  // deep hunter teal
    grad.addColorStop(1.0, '#092119');  // dark shadow rim
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(irisX, irisY, irisR, 0, Math.PI * 2);
    ctx.fill();

    // Dark charcoal-black pupil
    ctx.fillStyle = '#06120e';
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, 1.4 * s, 1.7 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lower-right crescent reflection shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(irisX + 1.0 * s, irisY + 1.2 * s, 0.9 * s, 0, Math.PI * 2);
    ctx.fill();

    // Secondary crisp white sparkle catchlight (lower-right)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(irisX + 0.9 * s, irisY + 0.9 * s, 0.65 * s, 0, Math.PI * 2);
    ctx.fill();

    // Primary bright white circular catchlight (top-left)
    ctx.beginPath();
    ctx.arc(irisX - 1.2 * s, irisY - 1.1 * s, 1.15 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Heavy bold black upper lash line with sharp winged outer tip (Eren's signature fierce gaze!)
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 1.45 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 1.08, eyeY - eyeH * 0.35);
    ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.75, ex + eyeW * 1.15, eyeY - eyeH * 0.32);
    ctx.stroke();

    // Double-crease eyelid line above lash line
    ctx.strokeStyle = '#2b1b12';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.8, eyeY - eyeH * 0.75);
    ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.95, ex + eyeW * 0.75, eyeY - eyeH * 0.72);
    ctx.stroke();

    // Fine lower lash line
    ctx.strokeStyle = '#2b1b12';
    ctx.lineWidth = 0.55 * s;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.55, eyeY + eyeH * 0.5);
    ctx.lineTo(ex + eyeW * 0.55, eyeY + eyeH * 0.5);
    ctx.stroke();
  }

  // =========================================================================
  // 5. EYEBROWS: THICK DETERMINED ANIME BROWS (Eren's Unwavering Will)
  // =========================================================================
  ctx.fillStyle = '#1c0f08';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.45;

  // Left eyebrow (steep diagonal arch down toward nose bridge)
  ctx.beginPath();
  ctx.moveTo(-eyeSpacing - 4.5 * s, eyeY - 4.4 * s);
  ctx.lineTo(-eyeSpacing + 3.6 * s, eyeY - 2.0 * s);
  ctx.lineTo(-eyeSpacing - 3.4 * s, eyeY - 5.8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(eyeSpacing + 4.5 * s, eyeY - 4.4 * s);
  ctx.lineTo(eyeSpacing - 3.6 * s, eyeY - 2.0 * s);
  ctx.lineTo(eyeSpacing + 3.4 * s, eyeY - 5.8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forehead furrow wrinkle creases between the eyes
  ctx.strokeStyle = '#321c10';
  ctx.lineWidth = 0.55 * s;
  ctx.beginPath();
  ctx.moveTo(-1.1 * s, eyeY - 2.8 * s);
  ctx.lineTo(-0.45 * s, eyeY - 4.2 * s);
  ctx.moveTo(1.1 * s, eyeY - 2.8 * s);
  ctx.lineTo(0.45 * s, eyeY - 4.2 * s);
  ctx.stroke();

  // =========================================================================
  // 6. MOUTH: SHOUTING BATTLE CRY (TATAKAE!) OR DETERMINED GLARE
  // =========================================================================
  if (isShouting) {
    ctx.save();
    // Mouth cavity
    ctx.fillStyle = '#8f2924';
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = ink * 0.75;
    ctx.beginPath();
    ctx.moveTo(-2.8 * s, 5.2 * s);
    ctx.quadraticCurveTo(0, 4.6 * s, 2.8 * s, 5.2 * s);
    ctx.quadraticCurveTo(3.2 * s, 8.5 * s, 0, 8.9 * s);
    ctx.quadraticCurveTo(-3.2 * s, 8.5 * s, -2.8 * s, 5.2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Upper white teeth band
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-2.4 * s, 5.2 * s);
    ctx.lineTo(2.4 * s, 5.2 * s);
    ctx.lineTo(2.0 * s, 6.4 * s);
    ctx.lineTo(-2.0 * s, 6.4 * s);
    ctx.closePath();
    ctx.fill();

    // Pink tongue at bottom
    ctx.fillStyle = '#e4727a';
    ctx.beginPath();
    ctx.arc(0, 8.2 * s, 1.6 * s, Math.PI, 0);
    ctx.fill();

    // Lower lip shadow accent
    ctx.fillStyle = '#c48974';
    ctx.beginPath();
    ctx.arc(0, 9.8 * s, 0.75 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else {
    // Determined, unwavering closed line with subtle downturn & lip shadow
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 0.85 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.5 * s, 6.2 * s);
    ctx.quadraticCurveTo(0, 6.0 * s, 2.2 * s, 6.3 * s);
    ctx.stroke();

    // Lower lip shadow
    ctx.fillStyle = '#c48974';
    ctx.beginPath();
    ctx.arc(0, 7.8 * s, 0.7 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================================================================
  // 7. SOFT FOREHEAD DROP SHADOW UNDER BANGS (True Anime Depth!)
  // =========================================================================
  ctx.fillStyle = 'rgba(25, 12, 6, 0.28)';
  ctx.beginPath();
  ctx.moveTo(-8.0 * s, -3.0 * s);
  ctx.quadraticCurveTo(-4.5 * s, 2.5 * s, 0, -1.8 * s);
  ctx.quadraticCurveTo(4.5 * s, 2.5 * s, 8.0 * s, -3.0 * s);
  ctx.quadraticCurveTo(0, -5.5 * s, -8.0 * s, -3.0 * s);
  ctx.closePath();
  ctx.fill();

  // =========================================================================
  // 8. FRONT SPIKY HAIR & CENTER-PARTED CURTAIN BANGS (Authentic Eren Hair!)
  // =========================================================================
  // Rich dark chocolate brown base (#331c11) with deep ink outline
  ctx.fillStyle = '#331c11';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // 1. Left sideburn framing face
  ctx.moveTo(-9.5 * s, 0.8 * s);
  ctx.lineTo(-8.8 * s, 3.8 * s);   // left long sideburn tip
  ctx.lineTo(-8.2 * s, 1.2 * s);

  // 2. Left curtain bangs (sweeping across forehead from center part)
  ctx.lineTo(-7.2 * s, -1.5 * s);
  ctx.lineTo(-5.6 * s, 1.6 * s);   // left outer bang clump
  ctx.lineTo(-4.2 * s, -2.6 * s);
  ctx.lineTo(-2.2 * s, 1.2 * s);   // left center bang clump
  ctx.lineTo(-0.6 * s, -1.8 * s);  // delicate center strand
  ctx.lineTo(0.2 * s, -4.5 * s);   // CENTER PARTING (Forehead visible in center!)

  // 3. Right curtain bangs (sweeping across forehead from center part)
  ctx.lineTo(1.0 * s, -1.6 * s);
  ctx.lineTo(2.4 * s, 1.2 * s);    // right center bang clump
  ctx.lineTo(4.4 * s, -2.5 * s);
  ctx.lineTo(5.8 * s, 1.6 * s);    // right outer bang clump
  ctx.lineTo(7.4 * s, -1.4 * s);

  // 4. Right sideburn framing face
  ctx.lineTo(8.4 * s, 1.2 * s);
  ctx.lineTo(9.0 * s, 3.8 * s);    // right long sideburn tip
  ctx.lineTo(9.6 * s, 0.8 * s);

  // 5. Crown & outer layered spikes
  ctx.quadraticCurveTo(11.8 * s, -8.5 * s, 9.8 * s, -13.5 * s);
  ctx.lineTo(8.4 * s, -17.2 * s);  // top-right cowlick spike
  ctx.lineTo(7.0 * s, -13.8 * s);
  ctx.quadraticCurveTo(3.5 * s, -15.8 * s, -1.8 * s, -15.4 * s);
  ctx.lineTo(-4.8 * s, -16.8 * s); // top-left tuft
  ctx.lineTo(-5.4 * s, -14.6 * s);
  ctx.quadraticCurveTo(-9.0 * s, -13.8 * s, -10.8 * s, -11.2 * s);
  ctx.lineTo(-9.4 * s, -10.0 * s);
  ctx.quadraticCurveTo(-11.5 * s, -5.8 * s, -9.5 * s, 0.8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // =========================================================================
  // 9. WARM AMBER-GOLD HAIR GLOSS HIGHLIGHTS (Anime Specular Sheen)
  // =========================================================================
  ctx.fillStyle = '#8f5732';
  // Top-right glossy patch
  ctx.beginPath();
  ctx.moveTo(3.6 * s, -13.5 * s);
  ctx.lineTo(7.2 * s, -12.0 * s);
  ctx.lineTo(5.2 * s, -10.0 * s);
  ctx.closePath();
  ctx.fill();

  // Top-left glossy patch
  ctx.beginPath();
  ctx.moveTo(-2.4 * s, -13.8 * s);
  ctx.lineTo(-6.2 * s, -12.2 * s);
  ctx.lineTo(-4.4 * s, -10.4 * s);
  ctx.closePath();
  ctx.fill();

  // Bangs gloss accent
  ctx.fillStyle = '#a66b40';
  ctx.beginPath();
  ctx.ellipse(-3.2 * s, -1.2 * s, 1.8 * s, 0.8 * s, -0.4, 0, Math.PI * 2);
  ctx.ellipse(3.2 * s, -1.2 * s, 1.8 * s, 0.8 * s, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Hair strand flow lines
  ctx.strokeStyle = '#1a0d06';
  ctx.lineWidth = 0.55 * s;
  ctx.beginPath();
  // Center bang flow
  ctx.moveTo(-2.2 * s, 1.2 * s); ctx.lineTo(-1.6 * s, -2.8 * s);
  ctx.moveTo(2.4 * s, 1.2 * s);  ctx.lineTo(1.8 * s, -2.8 * s);
  // Outer bang flow
  ctx.moveTo(-5.6 * s, 1.6 * s); ctx.lineTo(-4.8 * s, -2.2 * s);
  ctx.moveTo(5.8 * s, 1.6 * s);  ctx.lineTo(5.0 * s, -2.2 * s);
  // Crown flow
  ctx.moveTo(0, -15.2 * s);      ctx.lineTo(0, -11.0 * s);
  ctx.stroke();

  ctx.restore();
}
