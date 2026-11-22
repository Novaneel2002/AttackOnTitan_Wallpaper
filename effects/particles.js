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
  for (let i = 0; i < STEAM_POOL_SIZE; i++) {
    if (steamAlpha[i] > 0.01) {
      steamX[i] += steamVx[i] * dt;
      steamY[i] += steamVy[i] * dt;
      steamVx[i] *= Math.exp(-3.5 * dt);
      steamVy[i] *= Math.exp(-3.5 * dt);
      steamRadius[i] += dt * 8.0 * uniformScale;
      steamAlpha[i] -= dt * 1.8;
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
  for (let i = 0; i < STEAM_POOL_SIZE; i++) {
    const a = steamAlpha[i];
    if (a <= 0.01) continue;
    ctx.globalAlpha = a * 0.55;
    ctx.fillStyle = '#f0f5fa';
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
  isErenClick: false
};


/**
 * Draws comic-book "SHING!" or "TCH." speech bubble and web-splat on click.
 */
function drawClickEffects(s) {
  if (!clickEffect.active) return;

  const progress = clickEffect.timer / clickEffect.duration;
  const alpha = progress < 0.7 ? 1.0 : Math.max(0, (1.0 - progress) / 0.3);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (!clickEffect.isErenClick) {
    // Live position on clicked card
    let tx = clickEffect.targetX;
    let ty = clickEffect.targetY;
    if (clickEffect.cardIdx >= 0) {
      const c = cards[clickEffect.cardIdx];
      const currentScale = c.scale * (1 + audioEnergy * 0.025);
      tx = (c.cx + c.offsetX) + clickEffect.relX * (c.baseW * currentScale);
      ty = (c.cy + c.offsetY) + clickEffect.relY * (c.baseH * currentScale);
    }

    const shootP = Math.min(1, clickEffect.timer / 0.14);
    const handX = eren.handWorldX || eren.x;
    const handY = eren.handWorldY || (eren.y - 12 * s);
    const clickTau = clickEffect.timer - 0.14;
    const clickWobble = clickTau > 0 ? 4 * uniformScale * Math.exp(-clickTau * 9) * Math.cos(clickTau * 42) : 0;
    drawWebLine(handX, handY, tx, ty, shootP, alpha * 0.85, shootP < 1 ? 0.4 : 0.8, clickWobble, true);

    // Comic "SHING!" badge near Eren with hard comic shadow & action ticks
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
    ctx.font = '900 ' + Math.round(9.5 * s) + 'px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHING!', 0, 0.5 * s);
  } else {
    // Comic "TCH." badge when clicking directly on Eren
    const bx = eren.x + eren.facing * 22 * s;
    const by = eren.y - 38 * s - Math.sin(progress * Math.PI) * 6 * s;
    ctx.translate(bx, by);

    ctx.fillStyle = '#080608';
    traceRoundedRect(-21 * s + 1.8 * s, -9.5 * s + 2.0 * s, 42 * s, 19 * s, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#fffef2';
    ctx.strokeStyle = '#080608';
    ctx.lineWidth = 1.8 * s;
    traceRoundedRect(-21 * s, -9.5 * s, 42 * s, 19 * s, 6 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d11f28';
    ctx.font = '900 ' + Math.round(9.5 * s) + 'px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TCH.', 0, 0.5 * s);
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

