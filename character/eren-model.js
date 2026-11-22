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

// Cached radial gradients for Eren's iris (rebuilt only when scale/radius changes)
let cachedIrisScale = -1;
let cachedIrisRadius = -1;
let cachedIrisGradNormal = null;
let cachedIrisGradAngry = null;

function getErenIrisGradient(s, irisR, isAngryOrFierce) {
  if (cachedIrisScale !== s || cachedIrisRadius !== irisR || !cachedIrisGradNormal) {
    cachedIrisScale = s;
    cachedIrisRadius = irisR;

    const gNorm = ctx.createRadialGradient(0, -1.0 * s, 0.35 * s, 0, 0, irisR);
    gNorm.addColorStop(0.0, '#98fae2');
    gNorm.addColorStop(0.35, '#38dfb4');
    gNorm.addColorStop(0.65, '#168a6d');
    gNorm.addColorStop(0.9, '#0e4a3b');
    gNorm.addColorStop(1.0, '#092119');
    cachedIrisGradNormal = gNorm;

    const gAngry = ctx.createRadialGradient(0, -1.0 * s, 0.35 * s, 0, 0, irisR);
    gAngry.addColorStop(0.0, '#c8ffee');
    gAngry.addColorStop(0.38, '#3ef5b8');
    gAngry.addColorStop(0.72, '#11966a');
    gAngry.addColorStop(1.0, '#072b20');
    cachedIrisGradAngry = gAngry;
  }
  return isAngryOrFierce ? cachedIrisGradAngry : cachedIrisGradNormal;
}

function drawOutlinedSegment(x1, y1, x2, y2, thickness, fill, inkWidth) {
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

  const audioBoost = (typeof audioEnergy !== 'undefined' ? audioEnergy : 0);
  const flutter = Math.sin(elapsedTime * (14.0 + audioBoost * 6.0) + speed * 0.01) * (3.0 + speed * 0.009 + audioBoost * 3.8) * s;
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
function drawErenHead(cx, cy, s, facingScale, squint, isShouting, isSleepy, isAngry, expr) {
  ctx.save();
  ctx.translate(cx, cy);

  const ink = Math.max(0.65, 0.75 * s);
  const angry = Boolean(isAngry || expr === 'angry');
  const happy = expr === 'happy';
  const soft = expr === 'soft';
  const shocked = expr === 'shocked';
  const cold = expr === 'cold';
  const nervous = expr === 'nervous';
  const smirk = expr === 'smirk';
  const hopeful = expr === 'hopeful';
  const heroic = expr === 'heroic';
  const fierce = expr === 'fierce';
  const serene = expr === 'serene';
  const yawn = expr === 'yawn';
  const hx = (eren.hairLagX || 0) * s;
  const hy = (eren.hairLagY || 0) * s;

  // =========================================================================
  // 1. BACK HAIR LAYER (Behind face and ears, giving head full volume)
  // =========================================================================
  ctx.fillStyle = '#26150c';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.85;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Spikes flaring behind the neck and lower ears (with subtle secondary motion)
  ctx.moveTo(-7.5 * s + hx * 0.5, 6.5 * s + hy * 0.3);
  ctx.lineTo(-9.8 * s + hx * 0.8, 4.5 * s + hy * 0.4);
  ctx.lineTo(-9.0 * s + hx * 0.5, 2.0 * s);
  ctx.lineTo(-11.5 * s + hx * 0.9, -1.0 * s + hy * 0.3);
  ctx.lineTo(-10.2 * s + hx * 0.6, -4.5 * s);
  ctx.lineTo(-12.4 * s + hx * 1.0, -8.5 * s + hy * 0.4);
  ctx.lineTo(-9.5 * s + hx * 0.6, -12.5 * s);
  ctx.lineTo(-6.5 * s + hx * 0.8, -15.5 * s + hy * 0.5);
  ctx.lineTo(-2.0 * s + hx * 0.4, -16.8 * s + hy * 0.4);
  ctx.lineTo(2.0 * s + hx * 0.4, -16.8 * s + hy * 0.4);
  ctx.lineTo(6.5 * s + hx * 0.8, -15.5 * s + hy * 0.5);
  ctx.lineTo(9.5 * s + hx * 0.6, -12.5 * s);
  ctx.lineTo(12.4 * s + hx * 1.0, -8.5 * s + hy * 0.4);
  ctx.lineTo(10.2 * s + hx * 0.6, -4.5 * s);
  ctx.lineTo(11.5 * s + hx * 0.9, -1.0 * s + hy * 0.3);
  ctx.lineTo(9.0 * s + hx * 0.5, 2.0 * s);
  ctx.lineTo(9.8 * s + hx * 0.8, 4.5 * s + hy * 0.4);
  ctx.lineTo(7.5 * s + hx * 0.5, 6.5 * s + hy * 0.3);
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

  // Soft peachy cheek blush (extra rosy when reacting to Mikasa or Sasha!)
  ctx.fillStyle = (soft || happy) ? 'rgba(255, 95, 110, 0.40)' : 'rgba(255, 115, 95, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-5.8 * s, 4.4 * s, (soft || happy ? 3.5 : 3.0) * s, (soft || happy ? 1.9 : 1.6) * s, 0, 0, Math.PI * 2);
  ctx.ellipse(5.8 * s, 4.4 * s, (soft || happy ? 3.5 : 3.0) * s, (soft || happy ? 1.9 : 1.6) * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle anime nose dot
  ctx.fillStyle = '#d89b7d';
  ctx.beginPath();
  ctx.arc(0, 3.2 * s, 0.65 * s, 0, Math.PI * 2);
  ctx.fill();

  // Iconic Titan Shifter under-eye marks (post-revert fade or intense 3rd/4th click warning)
  const markAlpha = eren.titanMarkTimer > 0
    ? Math.min(0.88, (eren.titanMarkTimer / 2.2) * 0.88)
    : (angry && eren.erenClickCount >= 3 ? 0.55 : 0);
  if (markAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = markAlpha;
    ctx.strokeStyle = '#6c2420';
    ctx.lineWidth = 0.72 * s;
    ctx.lineCap = 'round';
    for (let side = -1; side <= 1; side += 2) {
      const mx = side * 4.8 * s;
      const my = 4.3 * s;
      ctx.beginPath();
      ctx.moveTo(mx - side * 1.4 * s, my - 0.2 * s);
      ctx.lineTo(mx - side * 0.4 * s, my + 2.3 * s);
      ctx.moveTo(mx + side * 0.2 * s, my - 0.1 * s);
      ctx.lineTo(mx + side * 1.1 * s, my + 2.4 * s);
      ctx.moveTo(mx + side * 1.5 * s, my - 0.3 * s);
      ctx.lineTo(mx + side * 2.1 * s, my + 1.8 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // 4. EYES: GIANT EMERALD-TEAL ANIME EYES (The Soul of Eren Yeager!)
  // =========================================================================
  const eyeY = 1.0 * s;
  const eyeSpacing = 5.0 * s;
  const eyeW = 4.2 * s;
  const eyeH = 5.4 * s;

  for (let side = -1; side <= 1; side += 2) {
    const ex = side * eyeSpacing;

    if (yawn) {
      // Cozy squeezed-shut yawning eyes (> <) with tiny sleepy tear glint
      ctx.strokeStyle = '#120d0a';
      ctx.lineWidth = 1.45 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - side * 2.8 * s, eyeY - 0.8 * s);
      ctx.lineTo(ex + side * 0.6 * s, eyeY + 0.8 * s);
      ctx.lineTo(ex - side * 2.6 * s, eyeY + 2.1 * s);
      ctx.stroke();
      ctx.fillStyle = '#a8e0ff';
      ctx.beginPath();
      ctx.arc(ex + side * 2.8 * s, eyeY + 1.9 * s, 0.85 * s, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

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

    if (happy) {
      // Joyful ^ ^ curved smiling anime eyes (Sasha - MEAT!!)
      ctx.strokeStyle = '#120d0a';
      ctx.lineWidth = 1.65 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, eyeY + 2.0 * s, 3.3 * s, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
      continue;
    }

    if (eren.isBlinking && !shocked && !angry) {
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
    if (angry) {
      // Sharply slanted angry glare silhouette (\  / angled down toward nose bridge)
      const innerY = eyeY - eyeH * 0.08;
      const outerY = eyeY - eyeH * 0.56;
      const botY = eyeY + eyeH * 0.58;
      ctx.moveTo(ex - side * eyeW * 1.02, innerY);
      ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.28, ex + side * eyeW * 1.05, outerY);
      ctx.quadraticCurveTo(ex + side * eyeW * 0.92, botY, ex, botY + 0.3 * s);
      ctx.quadraticCurveTo(ex - side * eyeW * 0.88, botY, ex - side * eyeW * 1.02, innerY);
      ctx.closePath();
    } else if (cold) {
      // Season 4 dead-serious half-lidded stare (Reiner - SIT DOWN, REINER.)
      const topLidY = eyeY - eyeH * 0.12;
      const botY = eyeY + eyeH * 0.58;
      ctx.moveTo(ex - eyeW * 1.05, topLidY);
      ctx.lineTo(ex + eyeW * 1.05, topLidY);
      ctx.quadraticCurveTo(ex + eyeW * 0.9, botY, ex, botY + 0.2 * s);
      ctx.quadraticCurveTo(ex - eyeW * 0.9, botY, ex - eyeW * 1.05, topLidY);
      ctx.closePath();
    } else if (serene) {
      // Calm, compassionate gently lowered lids (Ymir - YOU ARE FREE.)
      const topLidY = eyeY - eyeH * 0.28;
      const botY = eyeY + eyeH * 0.56;
      ctx.moveTo(ex - eyeW * 1.02, topLidY);
      ctx.quadraticCurveTo(ex, topLidY - 0.8 * s, ex + eyeW * 1.02, topLidY);
      ctx.quadraticCurveTo(ex + eyeW * 0.9, botY, ex, botY + 0.2 * s);
      ctx.quadraticCurveTo(ex - eyeW * 0.9, botY, ex - eyeW * 1.02, topLidY);
      ctx.closePath();
    } else if (shocked || nervous) {
      // Extra-wide startled eyes (Annie / Levi)
      ctx.ellipse(ex, eyeY, eyeW * 1.08, eyeH * 1.06, 0, 0, Math.PI * 2);
    } else if (smirk) {
      // Confident slightly narrowed eyes (Pieck)
      ctx.ellipse(ex, eyeY + 0.2 * s, eyeW * 1.0, eyeH * 0.78, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(ex, eyeY, eyeW, eyeH * (1 - squint * 0.35), 0, 0, Math.PI * 2);
    }
    ctx.clip();

    // Sclera base fill
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Upper eyeball shadow (heavier when angry or cold)
    ctx.fillStyle = (angry || cold) ? 'rgba(28, 34, 42, 0.38)' : '#d9e2ec';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY - eyeH * (angry || cold ? 0.20 : 0.35), eyeW * 1.1, eyeH * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (Vibrant Attack on Titan emerald-teal gradient)
    const lookOffX = (eren.lookX || 0) * 1.35 * s;
    const lookOffY = (eren.lookY || 0) * 0.85 * s;
    const jitterX = nervous ? Math.sin(elapsedTime * 55 + side) * 0.45 * s : 0;
    const irisX = ex + lookOffX + jitterX;
    const irisY = eyeY + lookOffY + (angry || cold ? 0.45 * s : 0);
    const irisR = (shocked || nervous ? 2.4 : (angry ? 2.85 : (hopeful || heroic || soft ? 3.55 : 3.4))) * s;

    // Multi-stop rich emerald gradient (cached, zero per-frame allocation)
    ctx.translate(irisX, irisY);
    ctx.fillStyle = getErenIrisGradient(s, irisR, angry || fierce);
    ctx.beginPath();
    ctx.arc(0, 0, irisR, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(-irisX, -irisY);

    // Dark charcoal-black pupil
    ctx.fillStyle = '#06120e';
    ctx.beginPath();
    if (shocked || nervous) {
      ctx.arc(irisX, irisY, 0.72 * s, 0, Math.PI * 2);
    } else if (angry) {
      ctx.ellipse(irisX, irisY, 0.9 * s, 1.15 * s, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(irisX, irisY, 1.4 * s, 1.7 * s, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    if (angry || cold) {
      // Single sharp piercing glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(irisX - 0.85 * s, irisY - 0.75 * s, 0.65 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (!shocked && !nervous) {
      // Lower-right crescent reflection shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(irisX + 1.0 * s, irisY + 1.2 * s, 0.9 * s, 0, Math.PI * 2);
      ctx.fill();

      // Secondary crisp white sparkle catchlight (lower-right)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(irisX + 0.9 * s, irisY + 0.9 * s, (hopeful || heroic ? 0.85 : 0.65) * s, 0, Math.PI * 2);
      ctx.fill();

      // Primary bright white circular catchlight (top-left)
      ctx.beginPath();
      ctx.arc(irisX - 1.2 * s, irisY - 1.1 * s, (hopeful || heroic || soft ? 1.35 : 1.15) * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Heavy bold black upper lash line
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = (angry || cold ? 1.75 : 1.45) * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (angry) {
      ctx.moveTo(ex - side * eyeW * 1.08, eyeY - eyeH * 0.06);
      ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.28, ex + side * eyeW * 1.14, eyeY - eyeH * 0.58);
    } else if (cold) {
      ctx.moveTo(ex - eyeW * 1.12, eyeY - eyeH * 0.12);
      ctx.lineTo(ex + eyeW * 1.12, eyeY - eyeH * 0.12);
    } else if (serene) {
      ctx.moveTo(ex - eyeW * 1.08, eyeY - eyeH * 0.26);
      ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.42, ex + eyeW * 1.08, eyeY - eyeH * 0.26);
    } else {
      ctx.moveTo(ex - eyeW * 1.08, eyeY - eyeH * 0.35);
      ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.75, ex + eyeW * 1.15, eyeY - eyeH * 0.32);
    }
    ctx.stroke();

    // Double-crease eyelid line above lash line
    ctx.strokeStyle = '#2b1b12';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    if (angry) {
      ctx.moveTo(ex - side * eyeW * 0.85, eyeY - eyeH * 0.28);
      ctx.lineTo(ex + side * eyeW * 0.92, eyeY - eyeH * 0.74);
    } else if (cold) {
      ctx.moveTo(ex - eyeW * 0.85, eyeY - eyeH * 0.36);
      ctx.lineTo(ex + eyeW * 0.85, eyeY - eyeH * 0.36);
    } else {
      ctx.moveTo(ex - eyeW * 0.8, eyeY - eyeH * 0.75);
      ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.95, ex + eyeW * 0.75, eyeY - eyeH * 0.72);
    }
    ctx.stroke();

    // Fine lower lash line (+ extra under-eye rage/deadpan line)
    ctx.strokeStyle = '#2b1b12';
    ctx.lineWidth = (angry || cold ? 0.75 : 0.55) * s;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.65, eyeY + eyeH * (angry || cold ? 0.56 : 0.5));
    ctx.lineTo(ex + eyeW * 0.65, eyeY + eyeH * (angry || cold ? 0.56 : 0.5));
    ctx.stroke();

    if (angry || cold) {
      ctx.strokeStyle = 'rgba(72, 36, 26, 0.7)';
      ctx.lineWidth = 0.55 * s;
      ctx.beginPath();
      ctx.moveTo(ex - side * eyeW * 0.65, eyeY + eyeH * 0.74);
      ctx.quadraticCurveTo(ex, eyeY + eyeH * 0.82, ex + side * eyeW * 0.52, eyeY + eyeH * 0.72);
      ctx.stroke();
    }
  }

  // =========================================================================
  // 5. EYEBROWS: EXPRESSIVE ANIME BROWS MATCHING EACH REACTION!
  // =========================================================================
  ctx.fillStyle = '#1c0f08';
  ctx.strokeStyle = '#120d0a';
  ctx.lineWidth = ink * 0.45;

  if (soft || happy || hopeful || serene) {
    // Gentle relaxed / hopeful upward-arched brows (Mikasa, Sasha, Armin, Ymir)
    const lift = (hopeful || happy) ? 1.4 * s : 0.5 * s;
    ctx.strokeStyle = '#1c0f08';
    ctx.lineWidth = 1.25 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 3.6 * s, eyeY - 4.8 * s - lift);
    ctx.quadraticCurveTo(-eyeSpacing, eyeY - 6.2 * s - lift, -eyeSpacing + 3.2 * s, eyeY - 5.0 * s - lift);
    ctx.moveTo(eyeSpacing + 3.6 * s, eyeY - 4.8 * s - lift);
    ctx.quadraticCurveTo(eyeSpacing, eyeY - 6.2 * s - lift, eyeSpacing - 3.2 * s, eyeY - 5.0 * s - lift);
    ctx.stroke();
  } else if (shocked || nervous) {
    // Worried / startled brows angled UP toward the center (/  \)
    const lift = shocked ? 2.2 * s : 1.0 * s;
    ctx.strokeStyle = '#1c0f08';
    ctx.lineWidth = 1.3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 3.8 * s, eyeY - 4.2 * s - lift * 0.4);
    ctx.quadraticCurveTo(-eyeSpacing, eyeY - 5.8 * s - lift, -eyeSpacing + 3.4 * s, eyeY - 6.2 * s - lift);
    ctx.moveTo(eyeSpacing + 3.8 * s, eyeY - 4.2 * s - lift * 0.4);
    ctx.quadraticCurveTo(eyeSpacing, eyeY - 5.8 * s - lift, eyeSpacing - 3.4 * s, eyeY - 6.2 * s - lift);
    ctx.stroke();
  } else if (cold) {
    // Flat, dead-serious Season 4 brows (Reiner)
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 4.2 * s, eyeY - 3.6 * s);
    ctx.lineTo(-eyeSpacing + 3.6 * s, eyeY - 3.2 * s);
    ctx.lineTo(-eyeSpacing - 3.6 * s, eyeY - 4.6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(eyeSpacing + 4.2 * s, eyeY - 3.6 * s);
    ctx.lineTo(eyeSpacing - 3.6 * s, eyeY - 3.2 * s);
    ctx.lineTo(eyeSpacing + 3.6 * s, eyeY - 4.6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Determined / angry / heroic / smirk brows
    const browDrop = angry ? 1.55 * s : (fierce || heroic ? 0.65 * s : 0);
    const browLiftOuter = angry ? 0.9 * s : (heroic ? 0.8 * s : 0);
    const rightCock = smirk ? 1.6 * s : 0;

    // Left eyebrow
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 4.5 * s, eyeY - 4.4 * s - browLiftOuter);
    ctx.lineTo(-eyeSpacing + 3.8 * s, eyeY - 2.0 * s + browDrop);
    ctx.lineTo(-eyeSpacing - 3.4 * s, eyeY - 5.8 * s - browLiftOuter);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right eyebrow (cocked upward when smirking!)
    ctx.beginPath();
    ctx.moveTo(eyeSpacing + 4.5 * s, eyeY - 4.4 * s - browLiftOuter - rightCock);
    ctx.lineTo(eyeSpacing - 3.8 * s, eyeY - 2.0 * s + browDrop - rightCock * 0.5);
    ctx.lineTo(eyeSpacing + 3.4 * s, eyeY - 5.8 * s - browLiftOuter - rightCock);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forehead furrow wrinkle creases between the eyes
    if (!smirk) {
      ctx.strokeStyle = '#321c10';
      ctx.lineWidth = (angry ? 0.8 : 0.55) * s;
      ctx.beginPath();
      ctx.moveTo(-1.1 * s, eyeY - 2.8 * s + browDrop * 0.7);
      ctx.lineTo(-0.45 * s, eyeY - 4.4 * s + browDrop * 0.2);
      ctx.moveTo(1.1 * s, eyeY - 2.8 * s + browDrop * 0.7);
      ctx.lineTo(0.45 * s, eyeY - 4.4 * s + browDrop * 0.2);
      if (angry) {
        ctx.moveTo(-0.7 * s, eyeY - 1.5 * s + browDrop * 0.5);
        ctx.lineTo(0.7 * s, eyeY - 1.5 * s + browDrop * 0.5);
      }
      ctx.stroke();
    }
  }

  // =========================================================================
  // 6. MOUTH: DYNAMIC EXPRESSIONS MATCHING EACH REACTION!
  // =========================================================================
  if (yawn) {
    // Cozy wide-open yawning oval mouth
    ctx.save();
    ctx.fillStyle = '#a83c42';
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = ink * 0.75;
    ctx.beginPath();
    ctx.ellipse(0, 6.7 * s, 2.3 * s, 2.8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f28b94';
    ctx.beginPath();
    ctx.ellipse(0, 8.2 * s, 1.4 * s, 0.9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (happy || hopeful) {
    // Big cheerful open laughing/excited smile (Sasha / Armin)
    ctx.save();
    ctx.fillStyle = '#c9494e';
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = ink * 0.75;
    ctx.beginPath();
    ctx.moveTo(-3.2 * s, 5.2 * s);
    ctx.quadraticCurveTo(0, 5.6 * s, 3.2 * s, 5.2 * s);
    ctx.quadraticCurveTo(2.8 * s, 8.8 * s, 0, 9.0 * s);
    ctx.quadraticCurveTo(-2.8 * s, 8.8 * s, -3.2 * s, 5.2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f28b94';
    ctx.beginPath();
    ctx.arc(0, 8.4 * s, 1.7 * s, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  } else if (soft || serene) {
    // Gentle warm small smile (Mikasa / Ymir)
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 0.9 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.2 * s, 6.0 * s);
    ctx.quadraticCurveTo(0, 7.4 * s, 2.2 * s, 6.0 * s);
    ctx.stroke();
  } else if (smirk) {
    // Confident cheeky side smirk (Pieck - HANDS UP!)
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 0.95 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.4 * s, 6.5 * s);
    ctx.quadraticCurveTo(0.6 * s, 6.7 * s, 2.8 * s, 5.3 * s);
    ctx.stroke();
  } else if (shocked) {
    // Startled open "O" mouth (Annie)
    ctx.save();
    ctx.fillStyle = '#8f2924';
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = ink * 0.75;
    ctx.beginPath();
    ctx.ellipse(0, 6.8 * s, 2.0 * s, 2.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (nervous) {
    // Wavy nervous grimace (Levi - CAPTAIN!!)
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 0.95 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.6 * s, 6.6 * s);
    ctx.quadraticCurveTo(-1.3 * s, 5.7 * s, 0, 6.6 * s);
    ctx.quadraticCurveTo(1.3 * s, 7.5 * s, 2.6 * s, 6.4 * s);
    ctx.stroke();
  } else if (cold) {
    // Flat, dead-serious Season 4 mouth (Reiner - SIT DOWN, REINER.)
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 0.9 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.6 * s, 6.5 * s);
    ctx.lineTo(2.6 * s, 6.5 * s);
    ctx.stroke();
  } else if (isShouting || heroic || fierce || angry) {
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
  // 1. Left sideburn framing face (with subtle secondary-motion lag)
  ctx.moveTo(-9.5 * s, 0.8 * s);
  ctx.lineTo(-8.8 * s + hx * 0.85, 3.8 * s + hy * 0.5);   // left long sideburn tip
  ctx.lineTo(-8.2 * s + hx * 0.35, 1.2 * s);

  // 2. Left curtain bangs (sweeping across forehead from center part)
  ctx.lineTo(-7.2 * s, -1.5 * s);
  ctx.lineTo(-5.6 * s + hx * 0.75, 1.6 * s + hy * 0.45);   // left outer bang clump
  ctx.lineTo(-4.2 * s + hx * 0.25, -2.6 * s);
  ctx.lineTo(-2.2 * s + hx * 0.75, 1.2 * s + hy * 0.45);   // left center bang clump
  ctx.lineTo(-0.6 * s + hx * 0.2, -1.8 * s);               // delicate center strand
  ctx.lineTo(0.2 * s, -4.5 * s);                           // CENTER PARTING

  // 3. Right curtain bangs (sweeping across forehead from center part)
  ctx.lineTo(1.0 * s + hx * 0.2, -1.6 * s);
  ctx.lineTo(2.4 * s + hx * 0.75, 1.2 * s + hy * 0.45);    // right center bang clump
  ctx.lineTo(4.4 * s + hx * 0.25, -2.5 * s);
  ctx.lineTo(5.8 * s + hx * 0.75, 1.6 * s + hy * 0.45);    // right outer bang clump
  ctx.lineTo(7.4 * s, -1.4 * s);

  // 4. Right sideburn framing face
  ctx.lineTo(8.4 * s + hx * 0.35, 1.2 * s);
  ctx.lineTo(9.0 * s + hx * 0.85, 3.8 * s + hy * 0.5);     // right long sideburn tip
  ctx.lineTo(9.6 * s, 0.8 * s);

  // 5. Crown & outer layered spikes (cowlicks lag with velocity/wind)
  ctx.quadraticCurveTo(11.8 * s + hx * 0.4, -8.5 * s, 9.8 * s + hx * 0.5, -13.5 * s);
  ctx.lineTo(8.4 * s + hx * 1.15, -17.2 * s + hy * 0.7);   // top-right cowlick spike
  ctx.lineTo(7.0 * s + hx * 0.4, -13.8 * s);
  ctx.quadraticCurveTo(3.5 * s, -15.8 * s, -1.8 * s, -15.4 * s);
  ctx.lineTo(-4.8 * s + hx * 1.1, -16.8 * s + hy * 0.65);  // top-left tuft
  ctx.lineTo(-5.4 * s + hx * 0.4, -14.6 * s);
  ctx.quadraticCurveTo(-9.0 * s + hx * 0.4, -13.8 * s, -10.8 * s + hx * 0.8, -11.2 * s + hy * 0.3);
  ctx.lineTo(-9.4 * s + hx * 0.3, -10.0 * s);
  ctx.quadraticCurveTo(-11.5 * s + hx * 0.4, -5.8 * s, -9.5 * s, 0.8 * s);
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
