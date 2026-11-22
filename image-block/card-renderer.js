/**
 * image-block/card-renderer.js
 * Film grain pattern generator, offscreen card cache builder, scale depth-sorting, and card drawing.
 */
function createFilmGrainPattern() {
  const gCanvas = document.createElement('canvas');
  const size = 128;
  gCanvas.width = size;
  gCanvas.height = size;
  const gCtx = gCanvas.getContext('2d');
  const imgData = gCtx.createImageData(size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const pxIdx = i >> 2;
    const x = pxIdx & (size - 1);
    const y = pxIdx >> 7;
    // Subtle halftone dot modulation + monochrome film grain
    const halftone = ((x & 1) === 0 && (y & 1) === 0) ? 28 : -18;
    const noise = Math.max(0, Math.min(255, 128 + ((Math.random() - 0.5) * 170) + halftone));
    data[i] = noise;
    data[i + 1] = noise;
    data[i + 2] = noise;
    data[i + 3] = 255;
  }
  gCtx.putImageData(imgData, 0, 0);
  grainPattern = ctx.createPattern(gCanvas, 'repeat');
  grainCanvas = gCanvas;
}


/**
 * Rebuilds a card's offscreen pre-rendered bitmap with rounded corners and film grain pre-baked
 * (eliminates 11 per-frame GPU stencil clip passes on the main canvas).
 */
function rebuildCardCache(card) {
  if (!card.loaded) return;
  const targetW = Math.max(16, Math.round(card.baseW * config.maxMagnetScale * dpr));
  const targetH = Math.max(16, Math.round(card.baseH * config.maxMagnetScale * dpr));
  const targetR = Math.min(card.baseRadius * config.maxMagnetScale * dpr, targetW * 0.5, targetH * 0.5);

  if (!card.cacheCanvas) {
    card.cacheCanvas = document.createElement('canvas');
    card.cacheCtx = card.cacheCanvas.getContext('2d');
  }
  card.cacheCanvas.width = targetW;
  card.cacheCanvas.height = targetH;

  const cCtx = card.cacheCtx;
  cCtx.clearRect(0, 0, targetW, targetH);
  cCtx.save();
  cCtx.beginPath();
  if (typeof cCtx.roundRect === 'function') {
    cCtx.roundRect(0, 0, targetW, targetH, targetR);
  } else {
    cCtx.moveTo(targetR, 0);
    cCtx.arcTo(targetW, 0, targetW, targetH, targetR);
    cCtx.arcTo(targetW, targetH, 0, targetH, targetR);
    cCtx.arcTo(0, targetH, 0, 0, targetR);
    cCtx.arcTo(0, 0, targetW, targetH, targetR);
    cCtx.closePath();
  }
  cCtx.clip();

  cCtx.imageSmoothingEnabled = true;
  cCtx.imageSmoothingQuality = 'high';
  if (card.hasImage) {
    // Bake subtle comic vibrancy once into the cached bitmap (avoids per-frame full-screen CSS filter)
    if ('filter' in cCtx) cCtx.filter = 'contrast(1.03) saturate(1.06)';
    cCtx.drawImage(card.img, card.sx, card.sy, card.sw, card.sh, 0, 0, targetW, targetH);
    if ('filter' in cCtx) cCtx.filter = 'none';
  } else {
    cCtx.fillStyle = '#f2f2f2';
    cCtx.fillRect(0, 0, targetW, targetH);

    // Draw bold card index number (0..10) so you know which slot in cards-data.js maps to each box
    const fontSize = Math.max(16, Math.round(Math.min(targetW, targetH) * 0.42));
    cCtx.fillStyle = '#222222';
    cCtx.font = '800 ' + fontSize + 'px system-ui, -apple-system, Segoe UI, sans-serif';
    cCtx.textAlign = 'center';
    cCtx.textBaseline = 'middle';
    cCtx.fillText(String(card.index), targetW * 0.5, targetH * 0.5);
  }

  // Bake the risograph / film grain overlay into the cache once (saves a full-card
  // overlay composite per card per frame)
  if (config.grainAmount > 0.005) {
    if (!grainCanvas) createFilmGrainPattern();
    const bakedPattern = cCtx.createPattern(grainCanvas, 'repeat');
    cCtx.globalAlpha = config.grainAmount;
    cCtx.globalCompositeOperation = 'overlay';
    cCtx.scale(dpr, dpr);
    cCtx.fillStyle = bakedPattern;
    cCtx.fillRect(0, 0, targetW / dpr, targetH / dpr);
  }
  cCtx.restore();
  card.cacheW = targetW;
  card.cacheH = targetH;
}


/**
 * In-place insertion sort on drawOrder so cards with larger scale draw on top.
 */
function sortDrawOrderByScale() {
  for (let i = 1; i < CARD_COUNT; i++) {
    const keyIdx = drawOrder[i];
    const keyScale = cards[keyIdx].scale;
    let j = i - 1;
    while (j >= 0 && cards[drawOrder[j]].scale > keyScale) {
      drawOrder[j + 1] = drawOrder[j];
      j--;
    }
    drawOrder[j + 1] = keyIdx;
  }
}

/**
 * Traces a rounded rectangle path onto a 2D context (defaults to `ctx`) without allocations.
 */
function traceRoundedRect(x, y, w, h, r, targetCtx) {
  const c = targetCtx || ctx;
  const radius = Math.min(r, w * 0.5, h * 0.5);
  c.beginPath();
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, w, h, radius);
  } else {
    c.moveTo(x + radius, y);
    c.arcTo(x + w, y, x + w, y + h, radius);
    c.arcTo(x + w, y + h, x, y + h, radius);
    c.arcTo(x, y + h, x, y, radius);
    c.arcTo(x, y, x + w, y, radius);
    c.closePath();
  }
}

/**
 * Renders a single rounded-rectangle image card onto the dedicated background layer (`bgCtx`).
 */
function drawCard(card) {
  if (!card.loaded) return;

  // Smooth cubic-out load-in animation (400ms fade + 0.92 -> 1.0 scale)
  const loadT = card.loadProgress;
  const isLoadedFully = loadT >= 0.999;
  const loadEase = isLoadedFully ? 1.0 : (1 - (1 - loadT) * (1 - loadT) * (1 - loadT));
  const loadScale = isLoadedFully ? 1.0 : (0.92 + 0.08 * loadEase);

  const audioBoost = 1 + audioEnergy * 0.025;
  const currentScale = card.scale * audioBoost * loadScale;
  const drawW = card.baseW * currentScale;
  const drawH = card.baseH * currentScale;
  const drawX = (card.cx + card.offsetX) - drawW * 0.5;
  const drawY = (card.cy + card.offsetY) - drawH * 0.5;

  const focusRatio = Math.max(0, Math.min(1, (card.scale - IDLE_SCALE) / Math.max(0.01, config.maxMagnetScale - IDLE_SCALE)));

  // Fast path for resting, fully-loaded cards: single hardware-accelerated blit with zero state changes or stencil clips
  if (isLoadedFully && focusRatio <= 0.02 && card.cacheCanvas) {
    bgCtx.drawImage(card.cacheCanvas, drawX, drawY, drawW, drawH);
    return;
  }

  const drawRadius = card.baseRadius * currentScale;
  bgCtx.save();
  bgCtx.globalAlpha = loadEase;

  // 1. Soft elevation drop shadow beneath focused cards
  if (focusRatio > 0.02) {
    bgCtx.save();
    bgCtx.globalAlpha = loadEase * focusRatio * 0.55;
    bgCtx.fillStyle = '#000000';
    const pad = 6 * focusRatio * uniformScale;
    traceRoundedRect(
      drawX - pad * 0.5,
      drawY + (4 + 8 * focusRatio) * uniformScale,
      drawW + pad,
      drawH + pad,
      drawRadius + 2 * uniformScale,
      bgCtx
    );
    bgCtx.fill();
    bgCtx.restore();
  }

  // 2. Draw from pre-clipped offscreen cache (or fallback clip if cache not built yet)
  if (card.cacheCanvas) {
    bgCtx.drawImage(card.cacheCanvas, drawX, drawY, drawW, drawH);
  } else {
    traceRoundedRect(drawX, drawY, drawW, drawH, drawRadius, bgCtx);
    bgCtx.save();
    bgCtx.clip();
    bgCtx.drawImage(card.img, card.sx, card.sy, card.sw, card.sh, drawX, drawY, drawW, drawH);
    bgCtx.restore();
  }

  // 3. Subtle rim light on enlarged cards for clean overlap separation
  if (focusRatio > 0.03) {
    bgCtx.globalAlpha = loadEase * focusRatio * 0.38;
    bgCtx.strokeStyle = '#ffffff';
    bgCtx.lineWidth = Math.max(1.0, 1.35 * uniformScale);
    traceRoundedRect(drawX + 0.5, drawY + 0.5, drawW - 1, drawH - 1, drawRadius, bgCtx);
    bgCtx.stroke();
  }

  bgCtx.restore();
}
