/**
 * effects/particles.js
 * Audio-reactive background dust, landing impact dust puffs, and interactive click effects.
 */
// Pre-allocated subtle background dust pool (capped at 120, zero heap allocation in loop)
const PARTICLE_COUNT = 120;
const particleX = new Float32Array(PARTICLE_COUNT);
const particleY = new Float32Array(PARTICLE_COUNT);
const particleVx = new Float32Array(PARTICLE_COUNT);
const particleVy = new Float32Array(PARTICLE_COUNT);
const particleSize = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particleX[i] = Math.random() * REF_WIDTH;
  particleY[i] = Math.random() * REF_HEIGHT;
  particleVx[i] = (Math.random() - 0.5) * 0.15;
  particleVy[i] = (Math.random() - 0.5) * 0.15;
  particleSize[i] = 0.8 + Math.random() * 1.2;
}

// Pre-allocated landing dust / impact particles pool (zero GC allocation)
const DUST_POOL_SIZE = 14;
const dustX = new Float32Array(DUST_POOL_SIZE);
const dustY = new Float32Array(DUST_POOL_SIZE);
const dustVx = new Float32Array(DUST_POOL_SIZE);
const dustVy = new Float32Array(DUST_POOL_SIZE);
const dustRadius = new Float32Array(DUST_POOL_SIZE);
const dustAlpha = new Float32Array(DUST_POOL_SIZE);
let activeDustCount = 0;

// Pre-allocated ODM gas thruster steam particle pool
const STEAM_POOL_SIZE = 32;
const steamX = new Float32Array(STEAM_POOL_SIZE);
const steamY = new Float32Array(STEAM_POOL_SIZE);
const steamVx = new Float32Array(STEAM_POOL_SIZE);
const steamVy = new Float32Array(STEAM_POOL_SIZE);
const steamRadius = new Float32Array(STEAM_POOL_SIZE);
const steamAlpha = new Float32Array(STEAM_POOL_SIZE);
let activeSteamCount = 0;
let steamCursor = 0;

function spawnOdmSteam(x, y, dirX, dirY) {
  if (!config.showSteam) return;
  const count = 3;
  const us = uniformScale;
  for (let k = 0; k < count; k++) {
    const i = steamCursor;
    steamCursor = (steamCursor + 1) % STEAM_POOL_SIZE;
    if (activeSteamCount < STEAM_POOL_SIZE) activeSteamCount++;

    const spread = (Math.random() - 0.5) * 0.8;
    const nx = -dirY * spread;
    const ny = dirX * spread;
    const spd = (90 + Math.random() * 80) * us;

    steamX[i] = x + (Math.random() - 0.5) * 3 * us;
    steamY[i] = y + (Math.random() - 0.5) * 3 * us;
    steamVx[i] = (dirX + nx) * spd;
    steamVy[i] = (dirY + ny) * spd;
    steamRadius[i] = (2.8 + Math.random() * 2.2) * us;
    steamAlpha[i] = 0.85;
  }
}

function updateSteam(dt) {
  if (activeSteamCount <= 0) return;
  let alive = 0;
  const drag = Math.exp(-3.5 * dt);
  const growStep = dt * 8.0 * uniformScale;
  const fadeStep = dt * 1.8;
  for (let i = 0; i < STEAM_POOL_SIZE; i++) {
    if (steamAlpha[i] > 0.01) {
      steamX[i] += steamVx[i] * dt;
      steamY[i] += steamVy[i] * dt;
      steamVx[i] *= drag;
      steamVy[i] *= drag;
      steamRadius[i] += growStep;
      steamAlpha[i] -= fadeStep;
      alive++;
    } else {
      steamAlpha[i] = 0;
    }
  }
  activeSteamCount = alive;
}

function drawSteam() {
  if (activeSteamCount <= 0) return;
  ctx.save();
  ctx.fillStyle = '#f0f5fa';
  for (let i = 0; i < STEAM_POOL_SIZE; i++) {
    const a = steamAlpha[i];
    if (a <= 0.01) continue;
    ctx.globalAlpha = a * 0.55;
    ctx.beginPath();
    ctx.arc(steamX[i], steamY[i], steamRadius[i], 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function spawnLandingImpact(x, y, normalX, normalY) {
  activeDustCount = 8;
  for (let i = 0; i < activeDustCount; i++) {
    const spread = ((i / (activeDustCount - 1)) - 0.5) * 2.2;
    const tangentX = -normalY;
    const tangentY = normalX;
    const speed = (28 + (i % 3) * 16) * uniformScale;
    dustX[i] = x + tangentX * spread * 6 * uniformScale;
    dustY[i] = y + normalY * 2 * uniformScale;
    dustVx[i] = (tangentX * spread + normalX * (0.35 + (i % 2) * 0.25)) * speed;
    dustVy[i] = (tangentY * spread + normalY * (0.35 + (i % 2) * 0.25)) * speed;
    dustRadius[i] = (2.2 + (i % 3) * 1.1) * uniformScale;
    dustAlpha[i] = 0.85;
  }
}


// Interactive "SHING!" click web shot & comic bubble state
const clickEffect = {
  active: false,
  timer: 0,
  duration: 1.15,
  targetX: 0,
  targetY: 0,
  cardIdx: -1,
  relX: 0,
  relY: 0,
  isErenClick: false,
  text: 'TCH.',
  isAngry: false
};


let cachedClickFontSize = -1;
let cachedClickFont = '';

/**
 * Draws comic-book "SHING!" or "TCH." speech bubble and web-splat on click.
 */
function drawClickEffects(s) {
  if (!clickEffect.active) return;

  const progress = clickEffect.timer / clickEffect.duration;
  const alpha = progress < 0.7 ? 1.0 : Math.max(0, (1.0 - progress) / 0.3);

  const fSize = Math.round(9.5 * s);
  if (fSize !== cachedClickFontSize) {
    cachedClickFontSize = fSize;
    cachedClickFont = '900 ' + fSize + 'px Impact, Arial Black, sans-serif';
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  if (!clickEffect.isErenClick) {
    // Comic "SHING!" badge near Eren with hard comic shadow & action ticks (cables are handled purely by ODM gear)
    const bx = eren.x + eren.facing * 24 * s;
    const by = eren.y - 32 * s - Math.min(1, progress * 3) * 5 * s;
    ctx.translate(bx, by);
    ctx.rotate(-0.12 * eren.facing);

    ctx.fillStyle = '#080608';
    traceRoundedRect(-23 * s + 1.8 * s, -9.5 * s + 2.0 * s, 46 * s, 19 * s, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#ffea54';
    ctx.strokeStyle = '#080608';
    ctx.lineWidth = 1.8 * s;
    traceRoundedRect(-23 * s, -9.5 * s, 46 * s, 19 * s, 6 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d11f28';
    ctx.font = cachedClickFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHING!', 0, 0.5 * s);
  } else {
    // Comic speech bubble when clicking directly on Eren:
    // 1st & 2nd click: "TCH." | 3rd click: "YAMERO!!" | 4th click: "OII!!"
    const label = clickEffect.text || 'TCH.';
    ctx.font = cachedClickFont;
    const textW = ctx.measureText(label).width;
    const boxW = Math.max(42 * s, textW + 14 * s);
    const halfW = boxW * 0.5;

    const shake = clickEffect.isAngry ? Math.sin(elapsedTime * 38) * 1.1 * s : 0;
    const rawBx = eren.x + eren.facing * 22 * s + shake;
    const bx = Math.max(halfW + 8, Math.min(viewWidth - halfW - 8, rawBx));
    const by = Math.max(12 * s + 6, eren.y - 38 * s - Math.sin(progress * Math.PI) * 6 * s);
    ctx.translate(bx, by);
    if (clickEffect.isAngry) {
      ctx.rotate(-0.08 * eren.facing);
    }

    ctx.fillStyle = '#080608';
    traceRoundedRect(-halfW + 1.8 * s, -9.5 * s + 2.0 * s, boxW, 19 * s, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#fffef2';
    ctx.strokeStyle = '#080608';
    ctx.lineWidth = 1.8 * s;
    traceRoundedRect(-halfW, -9.5 * s, boxW, 19 * s, 6 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d11f28';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0.5 * s);
  }

  ctx.restore();
}

/**
 * Renders landing dust puffs and radial comic impact ticks.
 */
function drawLandingDust() {
  if (activeDustCount <= 0) return;
  ctx.save();
  ctx.fillStyle = '#f0f4ff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.8, 1.1 * uniformScale);
  ctx.lineCap = 'round';
  for (let i = 0; i < activeDustCount; i++) {
    const a = dustAlpha[i];
    if (a <= 0.01) continue;
    ctx.globalAlpha = a * 0.68;
    ctx.beginPath();
    ctx.arc(dustX[i], dustY[i], dustRadius[i], 0, Math.PI * 2);
    ctx.fill();
    // Crisp radial comic impact tick on alternate particles
    if ((i & 1) === 0 && a > 0.35) {
      const vx = dustVx[i];
      const vy = dustVy[i];
      const sp = Math.hypot(vx, vy);
      if (sp > 1) {
        const ux = vx / sp;
        const uy = vy / sp;
        const tickLen = 4.2 * uniformScale * a;
        ctx.beginPath();
        ctx.moveTo(dustX[i], dustY[i]);
        ctx.lineTo(dustX[i] + ux * tickLen, dustY[i] + uy * tickLen);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// ============================================================================
// METALLIC ANCHOR SPARKS & TITAN IMPACT DEBRIS POOL (Pre-allocated, zero GC)
// ============================================================================
const SPARK_POOL_SIZE = 28;
const sparkX = new Float32Array(SPARK_POOL_SIZE);
const sparkY = new Float32Array(SPARK_POOL_SIZE);
const sparkVx = new Float32Array(SPARK_POOL_SIZE);
const sparkVy = new Float32Array(SPARK_POOL_SIZE);
const sparkAlpha = new Float32Array(SPARK_POOL_SIZE);
const sparkHot = new Uint8Array(SPARK_POOL_SIZE); // 0 = orange-gold, 1 = white-hot
let activeSparkCount = 0;
let sparkCursor = 0;

function spawnAnchorSparks(x, y, count) {
  const n = count || 3;
  const us = uniformScale;
  for (let k = 0; k < n; k++) {
    const i = sparkCursor;
    sparkCursor = (sparkCursor + 1) % SPARK_POOL_SIZE;
    if (activeSparkCount < SPARK_POOL_SIZE) activeSparkCount++;

    const ang = -Math.PI * 0.9 + Math.random() * Math.PI * 1.8;
    const spd = (75 + Math.random() * 145) * us;
    sparkX[i] = x + (Math.random() - 0.5) * 3 * us;
    sparkY[i] = y + (Math.random() - 0.5) * 3 * us;
    sparkVx[i] = Math.cos(ang) * spd;
    sparkVy[i] = Math.sin(ang) * spd - 40 * us;
    sparkAlpha[i] = 0.9 + Math.random() * 0.1;
    sparkHot[i] = (k & 1);
  }
}

function updateSparks(dt) {
  if (activeSparkCount <= 0) return;
  let alive = 0;
  const g = 520 * uniformScale;
  const drag = Math.exp(-3.2 * dt);
  for (let i = 0; i < SPARK_POOL_SIZE; i++) {
    if (sparkAlpha[i] > 0.02) {
      sparkX[i] += sparkVx[i] * dt;
      sparkY[i] += sparkVy[i] * dt;
      sparkVx[i] *= drag;
      sparkVy[i] = sparkVy[i] * drag + g * dt;
      sparkAlpha[i] -= dt * 3.1;
      alive++;
    } else {
      sparkAlpha[i] = 0;
    }
  }
  activeSparkCount = alive;
}

function drawSparks() {
  if (activeSparkCount <= 0) return;
  const us = uniformScale;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < SPARK_POOL_SIZE; i++) {
    const a = sparkAlpha[i];
    if (a <= 0.02) continue;
    ctx.globalAlpha = a;
    ctx.strokeStyle = sparkHot[i] ? '#fffbe6' : '#ffae2b';
    ctx.lineWidth = (sparkHot[i] ? 1.5 : 2.1) * us;
    const tail = 0.032;
    ctx.beginPath();
    ctx.moveTo(sparkX[i], sparkY[i]);
    ctx.lineTo(sparkX[i] - sparkVx[i] * tail, sparkY[i] - sparkVy[i] * tail);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// IMPACT SHOCKWAVE & TITAN ROAR SOUNDWAVE RINGS (Pre-allocated, zero GC)
// ============================================================================
const RING_POOL_SIZE = 10;
const ringX = new Float32Array(RING_POOL_SIZE);
const ringY = new Float32Array(RING_POOL_SIZE);
const ringR = new Float32Array(RING_POOL_SIZE);
const ringMaxR = new Float32Array(RING_POOL_SIZE);
const ringAlpha = new Float32Array(RING_POOL_SIZE);
const ringWidth = new Float32Array(RING_POOL_SIZE);
const ringColor = new Array(RING_POOL_SIZE).fill('#ffffff');
let activeRingCount = 0;
let ringCursor = 0;

function spawnShockwave(x, y, maxR, color, width) {
  const i = ringCursor;
  ringCursor = (ringCursor + 1) % RING_POOL_SIZE;
  if (activeRingCount < RING_POOL_SIZE) activeRingCount++;

  ringX[i] = x;
  ringY[i] = y;
  ringR[i] = 6 * uniformScale;
  ringMaxR[i] = maxR;
  ringAlpha[i] = 0.88;
  ringWidth[i] = width || (2.4 * uniformScale);
  ringColor[i] = color || '#ffffff';
}

function updateShockwaves(dt) {
  if (activeRingCount <= 0) return;
  let alive = 0;
  for (let i = 0; i < RING_POOL_SIZE; i++) {
    if (ringAlpha[i] > 0.015) {
      const rem = ringMaxR[i] - ringR[i];
      ringR[i] += Math.max(45 * uniformScale, rem * 6.5) * dt;
      ringAlpha[i] -= dt * 2.25;
      alive++;
    } else {
      ringAlpha[i] = 0;
    }
  }
  activeRingCount = alive;
}

function drawShockwaves() {
  if (activeRingCount <= 0) return;
  ctx.save();
  for (let i = 0; i < RING_POOL_SIZE; i++) {
    const a = ringAlpha[i];
    if (a <= 0.015) continue;
    ctx.globalAlpha = a * 0.72;
    ctx.strokeStyle = ringColor[i];
    ctx.lineWidth = Math.max(0.8, ringWidth[i] * a);
    ctx.beginPath();
    ctx.arc(ringX[i], ringY[i], ringR[i], 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// ATTACK TITAN TRANSFORMATION VFX: Yellow Thunderbolts (5-7) & White Smoke Clouds
// ============================================================================
const TITAN_BOLT_MAX = 7;
const TITAN_BOLT_SEGS = 9;
const boltPtsX = new Float32Array(TITAN_BOLT_MAX * TITAN_BOLT_SEGS);
const boltPtsY = new Float32Array(TITAN_BOLT_MAX * TITAN_BOLT_SEGS);
let titanBoltCount = 0;
let titanBoltTimer = 0;
let titanBoltDur = 0.72;
let titanFlashAlpha = 0;

const SMOKE_POOL_SIZE = 72;
const smokeX = new Float32Array(SMOKE_POOL_SIZE);
const smokeY = new Float32Array(SMOKE_POOL_SIZE);
const smokeVx = new Float32Array(SMOKE_POOL_SIZE);
const smokeVy = new Float32Array(SMOKE_POOL_SIZE);
const smokeRadius = new Float32Array(SMOKE_POOL_SIZE);
const smokeGrow = new Float32Array(SMOKE_POOL_SIZE);
const smokeAlpha = new Float32Array(SMOKE_POOL_SIZE);
const smokeFade = new Float32Array(SMOKE_POOL_SIZE);
const smokeTint = new Uint8Array(SMOKE_POOL_SIZE); // 0 = bright white cloud, 1 = dense steam grey-white
let activeSmokeCount = 0;
let smokeCursor = 0;

function spawnTitanLightning(cx, cy, s) {
  // Strictly 5 to 7 yellow thunderbolts around Eren!
  titanBoltCount = 5 + Math.floor(Math.random() * 3); // 5, 6, or 7
  titanBoltTimer = titanBoltDur;
  titanFlashAlpha = 1.0;

  const spreadX = 95 * s;
  const reachY = 175 * s;
  for (let b = 0; b < titanBoltCount; b++) {
    const tNorm = (b / Math.max(1, titanBoltCount - 1)) - 0.5; // -0.5 .. 0.5
    const startX = cx + tNorm * spreadX * 2.1 + (Math.random() - 0.5) * 28 * s;
    const startY = cy - reachY * (0.75 + Math.random() * 0.45);
    const endX = cx + (Math.random() - 0.5) * 26 * s;
    const endY = cy - (6 + Math.random() * 24) * s;

    const base = b * TITAN_BOLT_SEGS;
    for (let k = 0; k < TITAN_BOLT_SEGS; k++) {
      const f = k / (TITAN_BOLT_SEGS - 1);
      const jitter = (k === 0 || k === TITAN_BOLT_SEGS - 1) ? 0 : (Math.random() - 0.5) * 26 * s;
      boltPtsX[base + k] = startX + (endX - startX) * f + jitter;
      boltPtsY[base + k] = startY + (endY - startY) * f + (Math.random() - 0.5) * 8 * s;
    }
  }
}

function spawnTitanClouds(cx, cy, count, s, isRevertSmoke) {
  for (let n = 0; n < count; n++) {
    const i = smokeCursor;
    smokeCursor = (smokeCursor + 1) % SMOKE_POOL_SIZE;
    if (activeSmokeCount < SMOKE_POOL_SIZE) activeSmokeCount++;

    const ang = Math.random() * Math.PI * 2;
    const spd = (isRevertSmoke ? (22 + Math.random() * 88) : (40 + Math.random() * 115)) * s;
    const rOff = (Math.random() * (isRevertSmoke ? 24 : 16)) * s;

    smokeX[i] = cx + Math.cos(ang) * rOff;
    smokeY[i] = cy - (12 + Math.random() * (isRevertSmoke ? 44 : 26)) * s + Math.sin(ang) * rOff * 0.5;
    smokeVx[i] = Math.cos(ang) * spd;
    smokeVy[i] = Math.sin(ang) * spd * 0.65 - (isRevertSmoke ? (32 + Math.random() * 52) : (18 + Math.random() * 34)) * s;
    smokeRadius[i] = (isRevertSmoke ? (11 + Math.random() * 14) : (9 + Math.random() * 12)) * s;
    smokeGrow[i] = (isRevertSmoke ? (18 + Math.random() * 14) : (16 + Math.random() * 12)) * s;
    smokeAlpha[i] = isRevertSmoke ? (0.85 + Math.random() * 0.15) : (0.78 + Math.random() * 0.2);
    smokeFade[i] = isRevertSmoke ? (0.58 + Math.random() * 0.32) : (0.95 + Math.random() * 0.45);
    smokeTint[i] = isRevertSmoke && (n & 1) ? 1 : 0;
  }
}

function updateTitanEffects(dt) {
  updateSparks(dt);
  updateShockwaves(dt);
  if (titanBoltTimer > 0) {
    titanBoltTimer = Math.max(0, titanBoltTimer - dt);
  }
  if (titanFlashAlpha > 0) {
    titanFlashAlpha = Math.max(0, titanFlashAlpha - dt * 2.2);
  }
  if (activeSmokeCount > 0) {
    let alive = 0;
    const dragX = Math.exp(-2.6 * dt);
    const dragY = Math.exp(-2.0 * dt);
    for (let i = 0; i < SMOKE_POOL_SIZE; i++) {
      if (smokeAlpha[i] > 0.01) {
        smokeX[i] += smokeVx[i] * dt;
        smokeY[i] += smokeVy[i] * dt;
        smokeVx[i] *= dragX;
        smokeVy[i] *= dragY;
        smokeRadius[i] += smokeGrow[i] * dt;
        smokeAlpha[i] -= smokeFade[i] * dt;
        alive++;
      } else {
        smokeAlpha[i] = 0;
      }
    }
    activeSmokeCount = alive;
  }
}

function drawTitanEffects() {
  const us = uniformScale;

  // 0. Expanding shockwave / roar soundwave rings & sparks
  drawShockwaves();
  drawSparks();

  // 1. White clouds / dense Titan evaporation smoke
  if (activeSmokeCount > 0) {
    ctx.save();
    for (let i = 0; i < SMOKE_POOL_SIZE; i++) {
      const a = smokeAlpha[i];
      if (a <= 0.01) continue;
      ctx.globalAlpha = Math.min(0.92, a);
      ctx.fillStyle = smokeTint[i] === 0 ? '#ffffff' : '#e6ecf2';
      ctx.beginPath();
      ctx.arc(smokeX[i], smokeY[i], smokeRadius[i], 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Golden transformation flash & 5-7 yellow thunderbolts
  if (titanFlashAlpha > 0.01 || titanBoltTimer > 0) {
    ctx.save();
    const s = uniformScale * config.erenScale;
    if (titanFlashAlpha > 0.01) {
      const rad = 85 * s * (1.4 - titanFlashAlpha * 0.4);
      const grad = ctx.createRadialGradient(eren.x, eren.y - 20 * s, 4 * s, eren.x, eren.y - 20 * s, rad);
      grad.addColorStop(0.0, 'rgba(255, 252, 200, ' + (titanFlashAlpha * 0.95).toFixed(3) + ')');
      grad.addColorStop(0.45, 'rgba(255, 224, 52, ' + (titanFlashAlpha * 0.65).toFixed(3) + ')');
      grad.addColorStop(1.0, 'rgba(255, 170, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(eren.x, eren.y - 20 * s, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    if (titanBoltTimer > 0 && titanBoltCount > 0) {
      const env = Math.min(1, titanBoltTimer / (titanBoltDur * 0.45));
      const flicker = 0.72 + 0.28 * Math.sin(elapsedTime * 75);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let b = 0; b < titanBoltCount; b++) {
        const base = b * TITAN_BOLT_SEGS;
        const jx = (Math.sin(elapsedTime * 60 + b * 4.1)) * 3.5 * us;

        // Outer golden lightning aura
        ctx.globalAlpha = env * flicker * 0.48;
        ctx.strokeStyle = '#ffae00';
        ctx.lineWidth = Math.max(4.5, 6.2 * us);
        ctx.beginPath();
        ctx.moveTo(boltPtsX[base] + jx, boltPtsY[base]);
        for (let k = 1; k < TITAN_BOLT_SEGS; k++) {
          ctx.lineTo(boltPtsX[base + k] + jx, boltPtsY[base + k]);
        }
        ctx.stroke();

        // Mid vivid yellow thunderbolt
        ctx.globalAlpha = env * flicker * 0.92;
        ctx.strokeStyle = '#ffe53b';
        ctx.lineWidth = Math.max(2.4, 3.2 * us);
        ctx.stroke();

        // Crisp white-hot electric core
        ctx.globalAlpha = env * flicker;
        ctx.strokeStyle = '#fffff0';
        ctx.lineWidth = Math.max(1.0, 1.35 * us);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 3. Vibrating "ROAAAR!!" comic burst during Attack Titan roar
  if (eren.titanState === TITAN_ACTIVE && eren.titanAction === TITAN_ACT_ROAR && eren.roarPulse > 0.15) {
    const s = uniformScale * config.erenScale;
    const pulse = eren.roarPulse;
    const shakeX = Math.sin(elapsedTime * 68) * 2.4 * s;
    const shakeY = Math.cos(elapsedTime * 74) * 1.8 * s;
    const bx = Math.max(52 * s, Math.min(viewWidth - 52 * s, eren.x + eren.facing * 36 * s + shakeX));
    const by = Math.max(24 * s, (eren.headWorldY || eren.y - 50 * s) - 26 * s + shakeY);

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-0.12 * eren.facing);
    ctx.globalAlpha = Math.min(1, pulse * 1.35);

    const sc = 0.82 + 0.24 * pulse;
    ctx.scale(sc, sc);

    // Spiky jagged comic roar burst background
    const spikes = 12;
    ctx.beginPath();
    for (let k = 0; k < spikes * 2; k++) {
      const ang = (k / (spikes * 2)) * Math.PI * 2;
      const rx = (k & 1) ? 38 * s : 48 * s;
      const ry = (k & 1) ? 14 * s : 21 * s;
      const px = Math.cos(ang) * rx;
      const py = Math.sin(ang) * ry;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#080608';
    ctx.save();
    ctx.translate(2.2 * s, 2.4 * s);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffe53b';
    ctx.strokeStyle = '#080608';
    ctx.lineWidth = 2.0 * s;
    ctx.fill();
    ctx.stroke();

    const fSize = Math.round(11.5 * s);
    ctx.font = '900 ' + fSize + 'px Impact, Arial Black, sans-serif';
    ctx.fillStyle = '#b9121b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROAAAR!!', 0, 0.5 * s);
    ctx.restore();
  }
}


