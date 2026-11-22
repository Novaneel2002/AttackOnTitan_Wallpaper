/**
 * traversal/cable-visuals.js
 * Steel ODM cable + grapple hook drawing (replaces the old silk web strand and splat sprite).
 */
var WEB_SEGMENTS = 20;

/**
 * Draws a steel cable from (x1, y1) [hip reel] to (x2, y2) [anchor]:
 * - shootProgress 0..1: how far the hook head has flown
 * - tension: 0 = slack (sags) .. 1 = taut (straight)
 * - wobble: signed perpendicular vibration amplitude
 * - showSplat: draw the embedded hook head at the anchor
 */
function drawWebLine(x1, y1, x2, y2, shootProgress, alpha, tension, wobble, showSplat) {
  if (alpha <= 0.01) return;
  if (tension === undefined) tension = 1;
  if (wobble === undefined) wobble = 0;
  if (showSplat === undefined) showSplat = true;

  const sp = Math.max(0, Math.min(1, shootProgress));
  const tipX = x1 + (x2 - x1) * sp;
  const tipY = y1 + (y2 - y1) * sp;
  const dx = tipX - x1;
  const dy = tipY - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;

  const us = uniformScale;
  const nx = -dy / len;
  const ny = dx / len;
  const tens = Math.max(0, Math.min(1, tension));
  const sag = (1 - tens) * Math.min(len * 0.22, 70 * us);
  const cx = (x1 + tipX) * 0.5 + nx * wobble * 1.4;
  const cy = (y1 + tipY) * 0.5 + ny * wobble * 1.4 + sag * 2;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = Math.max(2.2, 2.6 * us + 1.2);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, tipX, tipY);
  ctx.stroke();

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#b9c2cc';
  ctx.lineWidth = Math.max(1.1, 1.5 * us);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, tipX, tipY);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.55;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.5, 0.55 * us);
  ctx.beginPath();
  ctx.moveTo(x1 + nx * 0.5, y1 + ny * 0.5);
  ctx.quadraticCurveTo(cx + nx * 0.5, cy + ny * 0.5, tipX + nx * 0.5, tipY + ny * 0.5);
  ctx.stroke();
  ctx.restore();

  // Hook head: leading barbed head while flying, embedded nick once stuck
  const ang = Math.atan2(dy, dx);
  if (sp < 0.999) {
    drawSplatAt(tipX, tipY, ang, 7.0 * us, alpha);
  } else if (showSplat) {
    drawSplatAt(tipX, tipY, ang, 7.5 * us, alpha);
  }
}

/**
 * Barbed grapple hook head pointing along `angle`, with a small nick mark.
 */
function drawSplatAt(x, y, angle, r, alpha) {
  if (alpha <= 0.01) return;
  const k = r / 7;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#b9c2cc';
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = Math.max(0.8, 1.0 * uniformScale);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(1.5 * k, 0);
  ctx.lineTo(-6 * k, -3.4 * k);
  ctx.lineTo(-4 * k, 0);
  ctx.lineTo(-6 * k, 3.4 * k);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.6;
  ctx.beginPath();
  ctx.moveTo(2 * k, -3.6 * k);
  ctx.lineTo(3.4 * k, -1.2 * k);
  ctx.moveTo(2 * k, 3.6 * k);
  ctx.lineTo(3.4 * k, 1.2 * k);
  ctx.stroke();
  ctx.restore();
}
