/**
 * character/titan-model.js
 * High-Accuracy Chibi Attack Titan (Eren Yeager Titan Form) Renderer:
 * Faithfully matches the pasted reference images:
 * - 2x scale relative to human Eren
 * - Muscular shredded chibi anatomy (bare sculpted pectorals, 6-pack abs, obliques, quads, clenched fists, bare feet)
 * - Long, wild shaggy dark-brown/black hair draping over forehead and shoulders
 * - Pointed elf-like ears poking cleanly out through the hair
 * - Deeply sunken dark eye sockets with piercing glowing emerald-green eyes & furrowed angry brow
 * - Iconic lipless exposed jaw with cheek muscle striations and interlocking jagged teeth (clenched or wide roaring!)
 * - Rampage poses on current card: Punching, Kicking, Jumping/Stomping, and Roaring
 */

function drawTitanSegment(x1, y1, x2, y2, thickness, fill, inkWidth) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (inkWidth > 0) {
    ctx.strokeStyle = '#180d09';
    ctx.lineWidth = thickness + Math.max(0.7, inkWidth * 0.85);
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
 * Draws a muscular Attack Titan fist (clenched or roaring smash)
 */
function drawTitanFist(x, y, s, ink, facing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#d49d7c';
  ctx.strokeStyle = '#180d09';
  ctx.lineWidth = ink * 0.85;
  ctx.lineJoin = 'round';

  // Bulky clenched fist
  ctx.beginPath();
  ctx.arc(0, 0, 3.3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Muscle shadow on bottom half of fist
  ctx.fillStyle = 'rgba(130, 72, 46, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0.6 * s, 2.7 * s, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.fill();

  // Wrapped thumb
  ctx.fillStyle = '#d49d7c';
  ctx.beginPath();
  ctx.ellipse(-1.2 * facing * s, 0.5 * s, 1.6 * s, 1.15 * s, facing * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Knuckle ridges
  ctx.strokeStyle = '#8b5438';
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.moveTo(-0.5 * facing * s, -1.8 * s);
  ctx.lineTo(-0.2 * facing * s, 0.8 * s);
  ctx.moveTo(0.8 * facing * s, -1.7 * s);
  ctx.lineTo(1.0 * facing * s, 0.9 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws Attack Titan's bare muscular foot with toes
 */
function drawTitanFoot(x, y, dir, s, ink) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#cca082';
  ctx.strokeStyle = '#180d09';
  ctx.lineWidth = ink * 0.85;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.ellipse(dir * 1.0 * s, 0, 3.4 * s, 1.7 * s, dir * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Toe division ticks
  ctx.strokeStyle = '#7d4a31';
  ctx.lineWidth = 0.55 * s;
  ctx.beginPath();
  ctx.moveTo(dir * 2.6 * s, -0.5 * s);
  ctx.lineTo(dir * 3.8 * s, -0.1 * s);
  ctx.moveTo(dir * 2.3 * s, 0.4 * s);
  ctx.lineTo(dir * 3.5 * s, 0.7 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws Attack Titan's shredded muscular torso (no clothes: pecs, 6-pack abs, serratus, traps)
 */
function drawTitanTorso(cx, cy, w, h, s, ink) {
  ctx.save();
  ctx.translate(cx, cy);

  const hw = w * 0.5;
  const hh = h * 0.5;

  // 1. Broad muscular V-taper torso silhouette
  ctx.fillStyle = '#d49d7c';
  ctx.strokeStyle = '#180d09';
  ctx.lineWidth = ink * 0.9;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-hw * 1.1, -hh * 0.95); // broad left shoulder/trap
  ctx.quadraticCurveTo(0, -hh * 1.15, hw * 1.1, -hh * 0.95); // traps & neck base
  ctx.quadraticCurveTo(hw * 1.05, -hh * 0.1, hw * 0.72, hh * 0.7); // tapered waist right
  ctx.quadraticCurveTo(hw * 0.65, hh * 1.05, 0, hh * 1.12); // pelvis
  ctx.quadraticCurveTo(-hw * 0.65, hh * 1.05, -hw * 0.72, hh * 0.7); // tapered waist left
  ctx.quadraticCurveTo(-hw * 1.05, -hh * 0.1, -hw * 1.1, -hh * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Muscle shading (under pecs, flanks, lower abs)
  ctx.fillStyle = 'rgba(135, 74, 46, 0.34)';
  ctx.beginPath();
  ctx.ellipse(-hw * 0.45, -hh * 0.3, hw * 0.42, hh * 0.28, 0.08, 0, Math.PI * 2);
  ctx.ellipse(hw * 0.45, -hh * 0.3, hw * 0.42, hh * 0.28, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // 3. Sculpted Pectorals & Collarbone definition
  ctx.strokeStyle = '#7c472d';
  ctx.lineWidth = 0.75 * s;
  ctx.lineCap = 'round';
  // Collarbones
  ctx.beginPath();
  ctx.moveTo(-hw * 0.75, -hh * 0.72);
  ctx.quadraticCurveTo(-hw * 0.35, -hh * 0.62, -0.4 * s, -hh * 0.7);
  ctx.moveTo(hw * 0.75, -hh * 0.72);
  ctx.quadraticCurveTo(hw * 0.35, -hh * 0.62, 0.4 * s, -hh * 0.7);
  ctx.stroke();

  // Pectoral lower contours & sternum line
  ctx.lineWidth = 0.85 * s;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.88, -hh * 0.22);
  ctx.quadraticCurveTo(-hw * 0.45, -hh * 0.05, -0.2 * s, -hh * 0.25);
  ctx.moveTo(hw * 0.88, -hh * 0.22);
  ctx.quadraticCurveTo(hw * 0.45, -hh * 0.05, 0.2 * s, -hh * 0.25);
  // Center linea alba
  ctx.moveTo(0, -hh * 0.62);
  ctx.lineTo(0, hh * 0.82);
  ctx.stroke();

  // 4. Shredded 6-pack Abs
  ctx.strokeStyle = '#854e33';
  ctx.lineWidth = 0.65 * s;
  for (let row = 0; row < 3; row++) {
    const ry = hh * (0.08 + row * 0.26);
    const rw = hw * (0.48 - row * 0.05);
    ctx.beginPath();
    ctx.moveTo(-rw, ry);
    ctx.quadraticCurveTo(-rw * 0.45, ry + 0.7 * s, -0.25 * s, ry + 0.2 * s);
    ctx.moveTo(rw, ry);
    ctx.quadraticCurveTo(rw * 0.45, ry + 0.7 * s, 0.25 * s, ry + 0.2 * s);
    ctx.stroke();
  }

  // Oblique / ribcage muscle striations on flanks
  ctx.strokeStyle = 'rgba(124, 71, 45, 0.65)';
  ctx.lineWidth = 0.55 * s;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(side * hw * 0.78, -hh * 0.05);
    ctx.lineTo(side * hw * 0.56, hh * 0.12);
    ctx.moveTo(side * hw * 0.72, hh * 0.22);
    ctx.lineTo(side * hw * 0.52, hh * 0.36);
    ctx.stroke();
  }

  // Subtle muscle highlights on upper chest
  ctx.fillStyle = 'rgba(248, 212, 188, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-hw * 0.42, -hh * 0.48, hw * 0.28, hh * 0.13, -0.1, 0, Math.PI * 2);
  ctx.ellipse(hw * 0.42, -hh * 0.48, hw * 0.28, hh * 0.13, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the Chibi Attack Titan's Head matching the pasted reference image:
 * - Wild long dark shaggy hair cascading past jaw/shoulders
 * - Pointed elf-like ears sticking out through hair
 * - Deeply sunken dark eye sockets with glowing bright emerald-green eyes
 * - Exposed lipless jaw with interlocking jagged teeth (or huge roaring open mouth!)
 */
function drawTitanHead(cx, cy, s, isRoaring) {
  ctx.save();
  ctx.translate(cx, cy);

  const ink = Math.max(0.65, 0.58 * s);

  // =========================================================================
  // 1. BACK SHAGGY HAIR LAYER (Long wild dark locks framing neck & shoulders)
  // =========================================================================
  ctx.fillStyle = '#1d120c';
  ctx.strokeStyle = '#100906';
  ctx.lineWidth = ink * 0.9;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-9.5 * s, 9.8 * s);
  ctx.lineTo(-12.2 * s, 6.2 * s);
  ctx.lineTo(-10.8 * s, 3.0 * s);
  ctx.lineTo(-13.2 * s, -1.8 * s);
  ctx.lineTo(-11.4 * s, -6.5 * s);
  ctx.lineTo(-12.6 * s, -11.0 * s);
  ctx.lineTo(-8.2 * s, -15.4 * s);
  ctx.lineTo(-2.5 * s, -17.2 * s);
  ctx.lineTo(2.5 * s, -17.2 * s);
  ctx.lineTo(8.2 * s, -15.4 * s);
  ctx.lineTo(12.6 * s, -11.0 * s);
  ctx.lineTo(11.4 * s, -6.5 * s);
  ctx.lineTo(13.2 * s, -1.8 * s);
  ctx.lineTo(10.8 * s, 3.0 * s);
  ctx.lineTo(12.2 * s, 6.2 * s);
  ctx.lineTo(9.5 * s, 9.8 * s);
  ctx.lineTo(6.2 * s, 8.2 * s);
  ctx.lineTo(-6.2 * s, 8.2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // =========================================================================
  // 2. POINTED ELF-LIKE TITAN EARS (Signature Attack Titan trait!)
  // =========================================================================
  ctx.fillStyle = '#d49d7c';
  ctx.strokeStyle = '#180d09';
  ctx.lineWidth = ink * 0.85;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(side * 8.4 * s, -1.4 * s);
    ctx.quadraticCurveTo(side * 12.2 * s, -2.8 * s, side * 14.5 * s, -3.4 * s); // sharp elf tip!
    ctx.quadraticCurveTo(side * 12.0 * s, 1.4 * s, side * 8.6 * s, 3.0 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner ear shadow fold
    ctx.strokeStyle = '#8b5438';
    ctx.lineWidth = 0.65 * s;
    ctx.beginPath();
    ctx.moveTo(side * 9.3 * s, -0.4 * s);
    ctx.lineTo(side * 12.6 * s, -1.9 * s);
    ctx.stroke();
  }

  // =========================================================================
  // 3. FACE / SCULPTED CHIBI TITAN SKULL CONTOUR
  // =========================================================================
  const jawDrop = isRoaring ? 2.4 * s : 0;
  ctx.fillStyle = '#dbb094';
  ctx.strokeStyle = '#180d09';
  ctx.lineWidth = ink * 0.9;
  ctx.beginPath();
  ctx.moveTo(-9.2 * s, -5.0 * s);
  ctx.quadraticCurveTo(-9.8 * s, 2.2 * s, -6.8 * s, 7.6 * s + jawDrop * 0.5);
  ctx.quadraticCurveTo(0, 11.0 * s + jawDrop, 6.8 * s, 7.6 * s + jawDrop * 0.5);
  ctx.quadraticCurveTo(9.8 * s, 2.2 * s, 9.2 * s, -5.0 * s);
  ctx.quadraticCurveTo(0, -10.8 * s, -9.2 * s, -5.0 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cheekbone / jaw muscle shading
  ctx.fillStyle = 'rgba(130, 68, 44, 0.25)';
  ctx.beginPath();
  ctx.ellipse(-6.8 * s, 2.0 * s, 2.2 * s, 3.0 * s, 0.2, 0, Math.PI * 2);
  ctx.ellipse(6.8 * s, 2.0 * s, 2.2 * s, 3.0 * s, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // =========================================================================
  // 4. DEEPLY SUNKEN DARK EYE SOCKETS & GLOWING EMERALD EYES
  // =========================================================================
  const eyeY = -0.2 * s;
  const eyeSpacing = 4.6 * s;

  for (let side = -1; side <= 1; side += 2) {
    const ex = side * eyeSpacing;

    // Deep sunken shadowed eye socket (classic Attack Titan intensity)
    ctx.fillStyle = '#331c14';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, 3.7 * s, 3.0 * s, side * -0.18, 0, Math.PI * 2);
    ctx.fill();

    // Inner dark socket core
    ctx.fillStyle = '#160b08';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY + 0.15 * s, 3.1 * s, 2.3 * s, side * -0.18, 0, Math.PI * 2);
    ctx.fill();

    // Glowing emerald-green Titan eye (does NOT follow mouse — stares fiercely!)
    const gx = ex - side * 0.2 * s;
    const gy = eyeY + 0.2 * s;
    const eyeGrad = ctx.createRadialGradient(gx, gy, 0.3 * s, gx, gy, 2.5 * s);
    eyeGrad.addColorStop(0.0, '#ccffea');
    eyeGrad.addColorStop(0.35, '#42f5ad');
    eyeGrad.addColorStop(0.75, '#12a366');
    eyeGrad.addColorStop(1.0, 'rgba(12, 95, 58, 0.0)');
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Crisp bright emerald iris disc
    ctx.fillStyle = '#52ffba';
    ctx.beginPath();
    ctx.ellipse(gx, gy, 1.55 * s, 1.45 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fierce pinpoint pupil
    ctx.fillStyle = '#072418';
    ctx.beginPath();
    ctx.arc(gx, gy, 0.55 * s, 0, Math.PI * 2);
    ctx.fill();

    // Tiny white glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx - 0.5 * s, gy - 0.5 * s, 0.4 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heavy angry furrowed brow ridges & nose bridge wrinkles
  ctx.strokeStyle = '#3a1f15';
  ctx.lineWidth = 1.15 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // Left heavy brow ridge
  ctx.moveTo(-eyeSpacing - 3.6 * s, eyeY - 2.9 * s);
  ctx.lineTo(-1.0 * s, eyeY - 1.2 * s);
  // Right heavy brow ridge
  ctx.moveTo(eyeSpacing + 3.6 * s, eyeY - 2.9 * s);
  ctx.lineTo(1.0 * s, eyeY - 1.2 * s);
  ctx.stroke();

  // Furrow wrinkles between eyes
  ctx.strokeStyle = '#6c3c27';
  ctx.lineWidth = 0.65 * s;
  ctx.beginPath();
  ctx.moveTo(-0.8 * s, eyeY - 1.4 * s);
  ctx.lineTo(-0.5 * s, eyeY - 3.6 * s);
  ctx.moveTo(0.8 * s, eyeY - 1.4 * s);
  ctx.lineTo(0.5 * s, eyeY - 3.6 * s);
  // Sharp Titan nose bridge & nostrils
  ctx.moveTo(-0.6 * s, eyeY + 1.8 * s);
  ctx.lineTo(-1.1 * s, eyeY + 3.0 * s);
  ctx.moveTo(0.6 * s, eyeY + 1.8 * s);
  ctx.lineTo(1.1 * s, eyeY + 3.0 * s);
  ctx.stroke();

  // =========================================================================
  // 5. ICONIC LIPLESS EXPOSED JAW & INTERLOCKING TEETH (Signature Attack Titan!)
  // =========================================================================
  const mouthY = 4.6 * s;
  if (isRoaring) {
    // WIDE-OPEN ROARING JAW (like middle row of reference image!)
    ctx.save();
    // Exposed red cheek muscles around open jaw
    ctx.fillStyle = '#7d2020';
    ctx.strokeStyle = '#180d09';
    ctx.lineWidth = ink * 0.85;
    ctx.beginPath();
    ctx.moveTo(-6.8 * s, mouthY - 0.8 * s);
    ctx.quadraticCurveTo(0, mouthY - 2.2 * s, 6.8 * s, mouthY - 0.8 * s);
    ctx.quadraticCurveTo(6.4 * s, mouthY + 5.8 * s, 0, mouthY + 6.4 * s);
    ctx.quadraticCurveTo(-6.4 * s, mouthY + 5.8 * s, -6.8 * s, mouthY - 0.8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark throat cavity
    ctx.fillStyle = '#36090b';
    ctx.beginPath();
    ctx.ellipse(0, mouthY + 2.5 * s, 4.8 * s, 3.0 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tongue
    ctx.fillStyle = '#bf424a';
    ctx.beginPath();
    ctx.ellipse(0, mouthY + 4.4 * s, 3.0 * s, 1.3 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Upper jagged teeth row
    ctx.fillStyle = '#f5f0e1';
    ctx.strokeStyle = '#180d09';
    ctx.lineWidth = 0.55 * s;
    const teethCount = 8;
    for (let t = 0; t < teethCount; t++) {
      const u1 = -5.6 * s + (t / teethCount) * 11.2 * s;
      const u2 = -5.6 * s + ((t + 1) / teethCount) * 11.2 * s;
      const um = (u1 + u2) * 0.5;
      const arch = Math.abs(um) * 0.14;
      // Upper tooth
      ctx.beginPath();
      ctx.moveTo(u1, mouthY - 1.2 * s + arch);
      ctx.lineTo(u2, mouthY - 1.2 * s + arch);
      ctx.lineTo(um, mouthY + 0.6 * s + arch);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lower tooth
      ctx.beginPath();
      ctx.moveTo(u1 + 0.2 * s, mouthY + 5.4 * s - arch * 0.8);
      ctx.lineTo(u2 - 0.2 * s, mouthY + 5.4 * s - arch * 0.8);
      ctx.lineTo(um, mouthY + 3.8 * s - arch * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // CLENCHED EXPOSED LIPLESS GRIN (exact top row of reference image!)
    ctx.save();
    // Exposed dark red gums / cheek-split muscle
    ctx.fillStyle = '#7c211f';
    ctx.strokeStyle = '#180d09';
    ctx.lineWidth = ink * 0.8;
    ctx.beginPath();
    ctx.moveTo(-7.0 * s, mouthY - 0.4 * s);
    ctx.quadraticCurveTo(0, mouthY + 0.4 * s, 7.0 * s, mouthY - 0.4 * s);
    ctx.quadraticCurveTo(5.8 * s, mouthY + 3.4 * s, 0, mouthY + 3.8 * s);
    ctx.quadraticCurveTo(-5.8 * s, mouthY + 3.4 * s, -7.0 * s, mouthY - 0.4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Interlocking white teeth band
    ctx.fillStyle = '#f5f1e4';
    ctx.beginPath();
    ctx.moveTo(-6.3 * s, mouthY - 0.1 * s);
    ctx.quadraticCurveTo(0, mouthY + 0.6 * s, 6.3 * s, mouthY - 0.1 * s);
    ctx.quadraticCurveTo(5.2 * s, mouthY + 2.8 * s, 0, mouthY + 3.2 * s);
    ctx.quadraticCurveTo(-5.2 * s, mouthY + 2.8 * s, -6.3 * s, mouthY - 0.1 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center bite line + vertical interlocking tooth gaps
    ctx.strokeStyle = '#291510';
    ctx.lineWidth = 0.6 * s;
    ctx.beginPath();
    ctx.moveTo(-6.1 * s, mouthY + 1.3 * s);
    ctx.quadraticCurveTo(0, mouthY + 1.9 * s, 6.1 * s, mouthY + 1.3 * s);
    for (let k = -5; k <= 5; k++) {
      const tx = k * 1.1 * s;
      ctx.moveTo(tx, mouthY + 0.1 * s);
      ctx.lineTo(tx, mouthY + 2.8 * s);
    }
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // 6. WILD SHAGGY FRONT HAIR & HANGING LOCKS (Attack Titan's iconic mane!)
  // =========================================================================
  // Forehead drop shadow
  ctx.fillStyle = 'rgba(20, 10, 6, 0.34)';
  ctx.beginPath();
  ctx.moveTo(-8.8 * s, -3.5 * s);
  ctx.quadraticCurveTo(-4.0 * s, 2.2 * s, 0, -2.2 * s);
  ctx.quadraticCurveTo(4.0 * s, 2.2 * s, 8.8 * s, -3.5 * s);
  ctx.quadraticCurveTo(0, -6.5 * s, -8.8 * s, -3.5 * s);
  ctx.closePath();
  ctx.fill();

  // Main front dark-chocolate/black wild hair
  ctx.fillStyle = '#261710';
  ctx.strokeStyle = '#100906';
  ctx.lineWidth = ink * 0.85;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  // Long wild left side locks draping past cheeks
  ctx.moveTo(-10.0 * s, -1.5 * s);
  ctx.lineTo(-10.6 * s, 7.2 * s);
  ctx.lineTo(-8.8 * s, 4.2 * s);
  ctx.lineTo(-8.0 * s, 6.0 * s);
  ctx.lineTo(-7.2 * s, -1.0 * s);

  // Shaggy parted bangs partially framing glowing green eyes
  ctx.lineTo(-5.2 * s, 2.6 * s);
  ctx.lineTo(-3.8 * s, -2.5 * s);
  ctx.lineTo(-1.8 * s, 2.0 * s);
  ctx.lineTo(0.0 * s, -4.4 * s); // fierce center part
  ctx.lineTo(1.8 * s, 2.2 * s);
  ctx.lineTo(3.8 * s, -2.4 * s);
  ctx.lineTo(5.4 * s, 2.5 * s);
  ctx.lineTo(7.2 * s, -1.0 * s);

  // Long wild right side locks draping past cheeks
  ctx.lineTo(8.0 * s, 6.0 * s);
  ctx.lineTo(8.8 * s, 4.2 * s);
  ctx.lineTo(10.6 * s, 7.2 * s);
  ctx.lineTo(10.0 * s, -1.5 * s);

  // Crown & spiky mane tufts
  ctx.quadraticCurveTo(12.2 * s, -9.0 * s, 9.6 * s, -14.2 * s);
  ctx.lineTo(7.4 * s, -17.4 * s);
  ctx.lineTo(5.6 * s, -14.6 * s);
  ctx.quadraticCurveTo(0, -17.0 * s, -5.6 * s, -14.6 * s);
  ctx.lineTo(-7.6 * s, -17.2 * s);
  ctx.lineTo(-9.6 * s, -14.2 * s);
  ctx.quadraticCurveTo(-12.2 * s, -9.0 * s, -10.0 * s, -1.5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Warm dark-brown hair sheen & strand flow lines
  ctx.fillStyle = '#4a2e20';
  ctx.beginPath();
  ctx.moveTo(2.8 * s, -13.8 * s);
  ctx.lineTo(6.8 * s, -12.2 * s);
  ctx.lineTo(4.6 * s, -9.8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2.8 * s, -13.8 * s);
  ctx.lineTo(-6.8 * s, -12.2 * s);
  ctx.lineTo(-4.6 * s, -9.8 * s);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#140b07';
  ctx.lineWidth = 0.55 * s;
  ctx.beginPath();
  ctx.moveTo(-1.8 * s, 2.0 * s); ctx.lineTo(-1.2 * s, -3.5 * s);
  ctx.moveTo(1.8 * s, 2.2 * s);  ctx.lineTo(1.2 * s, -3.5 * s);
  ctx.moveTo(-5.2 * s, 2.6 * s); ctx.lineTo(-4.4 * s, -3.2 * s);
  ctx.moveTo(5.4 * s, 2.5 * s);  ctx.lineTo(4.6 * s, -3.2 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Master Renderer for the 2x-sized Chibi Attack Titan (rampaging on his current block)
 * Actions:
 *   0 = PUNCH (wind-up + ferocious heavy fist smash into the block)
 *   1 = KICK  (high wind-up + fierce stomp/side kick against the block)
 *   2 = JUMP  (crouch + high leap + ground-shaking slam back onto the block)
 *   3 = ROAR  (head tilted back, wide-open roaring jaw, fists clenched)
 */
function drawAttackTitan(s) {
  const ts = s * 2.0; // Strictly 2x bigger than human Eren!
  const ink = Math.max(0.7, 0.58 * ts);

  const action = eren.titanAction;
  const p = Math.max(0, Math.min(1, eren.titanActionTimer / Math.max(0.01, eren.titanActionDur)));
  const breath = Math.sin(elapsedTime * 5.2) * 0.55 * ts;

  let bodyY = -eren.titanJumpY;
  let bodyTilt = 0;
  let squashX = 1.0;
  let squashY = 1.0;
  let isRoaring = false;

  // Limb targets (in local Titan coords where y=0 is card top edge)
  let lKneeX = -4.6 * ts, lKneeY = -3.8 * ts, lFootX = -5.4 * ts, lFootY = -0.6 * ts;
  let rKneeX = 4.6 * ts, rKneeY = -3.8 * ts, rFootX = 5.4 * ts, rFootY = -0.6 * ts;

  let lElbowX = -8.4 * ts, lElbowY = -12.5 * ts + breath, lHandX = -9.6 * ts, lHandY = -8.5 * ts + breath;
  let rElbowX = 8.4 * ts, rElbowY = -12.5 * ts + breath, rHandX = 9.6 * ts, rHandY = -8.5 * ts + breath;
  let headX = 0, headY = -25.0 * ts + breath;

  if (action === TITAN_ACT_PUNCH) {
    // Wind up (0..0.38) -> Smash down/forward (0.38..0.58) -> Follow-through & recover (0.58..1.0)
    if (p < 0.38) {
      const k = p / 0.38;
      bodyTilt = -0.16 * k;
      rElbowX = (8.4 + 2.5 * k) * ts;
      rElbowY = (-12.5 - 5.0 * k) * ts;
      rHandX = (9.6 + 3.2 * k) * ts;
      rHandY = (-8.5 - 12.0 * k) * ts;
      lElbowX = (-8.4 - 1.0 * k) * ts;
      lHandX = (-9.6 - 1.5 * k) * ts;
      lHandY = (-8.5 - 2.0 * k) * ts;
    } else if (p < 0.58) {
      const k = (p - 0.38) / 0.20;
      bodyTilt = -0.16 + 0.42 * k;
      bodyY += 2.2 * k * ts;
      squashX = 1 + 0.08 * k;
      squashY = 1 - 0.08 * k;
      isRoaring = true;
      // Right fist smashes right down into the block!
      rElbowX = (10.9 - 3.5 * k) * ts;
      rElbowY = (-17.5 + 11.5 * k) * ts;
      rHandX = (12.8 - 6.5 * k) * ts;
      rHandY = (-20.5 + 21.0 * k) * ts;
      lElbowX = -9.5 * ts;
      lHandX = -11.5 * ts;
      lHandY = -13.5 * ts;
    } else {
      const k = 1 - (p - 0.58) / 0.42;
      bodyTilt = 0.26 * k;
      bodyY += 2.2 * k * ts;
      squashX = 1 + 0.08 * k;
      squashY = 1 - 0.08 * k;
      isRoaring = k > 0.4;
      rElbowX = (8.4 - 1.0 * k) * ts;
      rElbowY = (-12.5 + 6.5 * k) * ts;
      rHandX = (9.6 - 3.3 * k) * ts;
      rHandY = (-8.5 + 9.0 * k) * ts;
    }
  } else if (action === TITAN_ACT_KICK) {
    // Wind up leg (0..0.36) -> Fierce stomp/side kick (0.36..0.58) -> Recover (0.58..1.0)
    if (p < 0.36) {
      const k = p / 0.36;
      bodyTilt = -0.14 * k;
      rKneeX = (4.6 + 2.2 * k) * ts;
      rKneeY = (-3.8 - 5.2 * k) * ts;
      rFootX = (5.4 + 1.0 * k) * ts;
      rFootY = (-0.6 - 6.5 * k) * ts;
      lHandY = (-8.5 - 4.5 * k) * ts;
      rHandY = (-8.5 - 4.5 * k) * ts;
    } else if (p < 0.58) {
      const k = (p - 0.36) / 0.22;
      bodyTilt = -0.14 + 0.32 * k;
      isRoaring = true;
      // Right leg slams outward/downward in a ferocious kick
      rKneeX = (6.8 + 2.8 * k) * ts;
      rKneeY = (-9.0 + 5.2 * k) * ts;
      rFootX = (6.4 + 5.5 * k) * ts;
      rFootY = (-7.1 + 7.4 * k) * ts;
      lHandX = -11.5 * ts;
      lHandY = -14.0 * ts;
      rHandX = 8.0 * ts;
      rHandY = -15.5 * ts;
    } else {
      const k = 1 - (p - 0.58) / 0.42;
      bodyTilt = 0.18 * k;
      isRoaring = k > 0.5;
      rKneeX = (4.6 + 5.0 * k) * ts;
      rKneeY = (-3.8) * ts;
      rFootX = (5.4 + 6.5 * k) * ts;
      rFootY = (-0.6 + 0.9 * k) * ts;
    }
  } else if (action === TITAN_ACT_JUMP || action === TITAN_ACT_LEAP) {
    // Crouch -> High angry leap -> Heavy slam landing
    const isLeap = (action === TITAN_ACT_LEAP);
    const crouchEnd = isLeap ? 0.18 : 0.22;
    const landStart = isLeap ? 0.82 : 0.72;
    if (p < crouchEnd) {
      const k = p / crouchEnd;
      squashX = 1 + 0.16 * k;
      squashY = 1 - 0.18 * k;
      lHandY = (-8.5 + 3.0 * k) * ts;
      rHandY = (-8.5 + 3.0 * k) * ts;
    } else if (p < landStart) {
      const k = (p - crouchEnd) / (landStart - crouchEnd);
      const arc = Math.sin(k * Math.PI);
      squashX = 1 - 0.08 * arc;
      squashY = 1 + 0.10 * arc;
      bodyTilt = isLeap ? 0.18 * arc : 0;
      isRoaring = true;
      // Fists raised overhead ready to slam!
      lElbowX = -9.5 * ts;
      lElbowY = (-12.5 - 6.0 * arc) * ts;
      lHandX = -8.5 * ts;
      lHandY = (-18.0 - 7.5 * arc) * ts;
      rElbowX = 9.5 * ts;
      rElbowY = (-12.5 - 6.0 * arc) * ts;
      rHandX = 8.5 * ts;
      rHandY = (-18.0 - 7.5 * arc) * ts;
      // Knees tucked mid-air
      lFootY = (-0.6 - 3.5 * arc) * ts;
      rFootY = (-0.6 - 3.5 * arc) * ts;
    } else {
      const k = Math.sin(((p - landStart) / (1 - landStart)) * Math.PI);
      squashX = 1 + 0.24 * k;
      squashY = 1 - 0.24 * k;
      isRoaring = true;
      lHandY = (-8.5 + 7.5 * k) * ts;
      rHandY = (-8.5 + 7.5 * k) * ts;
    }
  } else {
    // TITAN_ACT_ROAR: Throws head back, fists clenched outward in rage!
    const roarEnv = Math.sin(p * Math.PI);
    isRoaring = roarEnv > 0.15;
    bodyTilt = -0.08 * roarEnv;
    headY = (-25.0 - 1.2 * roarEnv) * ts + breath;
    lElbowX = (-8.4 - 2.4 * roarEnv) * ts;
    lElbowY = (-12.5 - 1.5 * roarEnv) * ts;
    lHandX = (-9.6 - 3.2 * roarEnv) * ts;
    lHandY = (-8.5 - 4.5 * roarEnv) * ts;
    rElbowX = (8.4 + 2.4 * roarEnv) * ts;
    rElbowY = (-12.5 - 1.5 * roarEnv) * ts;
    rHandX = (9.6 + 3.2 * roarEnv) * ts;
    rHandY = (-8.5 - 4.5 * roarEnv) * ts;
  }

  ctx.save();
  ctx.translate(eren.x, eren.y + bodyY);
  ctx.scale(eren.facing * squashX, squashY);
  ctx.rotate(bodyTilt);

  // 1. Muscular Legs & Bare Feet
  // Left leg
  drawTitanSegment(-3.8 * ts, -7.2 * ts, lKneeX, lKneeY, 4.9 * ts, '#cf9675', ink);
  drawTitanSegment(lKneeX, lKneeY, lFootX, lFootY, 4.3 * ts, '#cf9675', ink);
  drawTitanFoot(lFootX, lFootY, -1, ts, ink);

  // Right leg
  drawTitanSegment(3.8 * ts, -7.2 * ts, rKneeX, rKneeY, 4.9 * ts, '#d49d7c', ink);
  drawTitanSegment(rKneeX, rKneeY, rFootX, rFootY, 4.3 * ts, '#d49d7c', ink);
  drawTitanFoot(rFootX, rFootY, 1, ts, ink);

  // 2. Shredded Muscular Torso
  drawTitanTorso(0, -12.4 * ts + breath, 12.6 * ts, 11.4 * ts, ts, ink);

  // 3. Muscular Arms & Clenched Fists
  // Left arm
  drawTitanSegment(-5.4 * ts, -15.6 * ts + breath, lElbowX, lElbowY, 4.4 * ts, '#cf9675', ink);
  drawTitanSegment(lElbowX, lElbowY, lHandX, lHandY, 4.0 * ts, '#d49d7c', ink);
  drawTitanFist(lHandX, lHandY, ts, ink, -1);

  // Right arm
  drawTitanSegment(5.4 * ts, -15.6 * ts + breath, rElbowX, rElbowY, 4.4 * ts, '#d49d7c', ink);
  drawTitanSegment(rElbowX, rElbowY, rHandX, rHandY, 4.0 * ts, '#d8a281', ink);
  drawTitanFist(rHandX, rHandY, ts, ink, 1);

  // 4. Attack Titan Head
  eren.headWorldX = eren.x;
  eren.headWorldY = eren.y + bodyY + headY;
  drawTitanHead(headX, headY, ts, isRoaring);

  ctx.restore();
}
