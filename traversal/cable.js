/**
 * traversal/cable.js
 * Lingering hook nicks, LMB card queue and persistent card-to-card cables.
 */
// Lingering web tags: faded splats + short dangling threads that fade out over ~30s
var TAG_POOL = 14;
var TAG_LIFETIME = 30;
var tagX = new Float32Array(TAG_POOL);
var tagY = new Float32Array(TAG_POOL);
var tagAngle = new Float32Array(TAG_POOL);
var tagAge = new Float32Array(TAG_POOL).fill(999);
var tagCard = new Int16Array(TAG_POOL);
var tagRelX = new Float32Array(TAG_POOL);
var tagRelY = new Float32Array(TAG_POOL);
var tagSeed = new Float32Array(TAG_POOL);
var tagCursor = 0;

function addWebTag(x, y, angle, cardIdx, relX, relY) {
  const i = tagCursor;
  tagCursor = (tagCursor + 1) % TAG_POOL;
  tagX[i] = x;
  tagY[i] = y;
  tagAngle[i] = angle;
  tagCard[i] = cardIdx;
  tagRelX[i] = relX;
  tagRelY[i] = relY;
  tagAge[i] = 0;
  tagSeed[i] = Math.random();
}

function updateWebTags(dt) {
  for (let i = 0; i < TAG_POOL; i++) {
    if (tagAge[i] < TAG_LIFETIME) tagAge[i] += dt;
  }
}

function drawWebTags() {
  const us = uniformScale;
  for (let i = 0; i < TAG_POOL; i++) {
    const age = tagAge[i];
    if (age >= TAG_LIFETIME) continue;
    let x = tagX[i];
    let y = tagY[i];
    const ci = tagCard[i];
    if (ci >= 0) {
      const c = cards[ci];
      const sc = c.scale * (1 + audioEnergy * 0.025);
      x = (c.cx + c.offsetX) + tagRelX[i] * c.baseW * sc;
      y = (c.cy + c.offsetY) + tagRelY[i] * c.baseH * sc;
    }
    const life = 1 - age / TAG_LIFETIME;
    const a = 0.42 * Math.min(1, age / 0.6) * life * Math.sqrt(life);
    if (a < 0.01) continue;

    drawSplatAt(x, y, tagAngle[i], 5.5 * us, a);
  }
}

// Multi-photo webbing state (FIFO cap at 50 active webs; oldest web smoothly fades out & is removed)
var MAX_WEB_CONNECTIONS = 50;
var WEB_CONN_POOL_SIZE = 64;
var WEB_STATE_INACTIVE = 0;
var WEB_STATE_ACTIVE = 1;
var WEB_STATE_FADING = 2;
var WEB_FADE_DURATION = 0.65;
var WEB_VIBRATE_DURATION = 2.0; // Stop connected web vibration after 2 seconds
var WEB_CONN_LIFETIME = 30.0;   // Connected webs automatically fade out after 30 seconds

var webConnState = new Uint8Array(WEB_CONN_POOL_SIZE);
var webConnSeq = new Int32Array(WEB_CONN_POOL_SIZE);
var webConnAlpha = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnCardA = new Int16Array(WEB_CONN_POOL_SIZE);
var webConnCardB = new Int16Array(WEB_CONN_POOL_SIZE);
var webConnRelXA = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnRelYA = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnRelXB = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnRelYB = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnAge = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnHoverTime = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnAttached = new Uint8Array(WEB_CONN_POOL_SIZE);
var webConnTension = new Float32Array(WEB_CONN_POOL_SIZE);
var webConnCount = 0;
var webConnNextSeq = 0;
var activeDragConnIdx = -1;
var staticWebCanvas = null;
var staticWebCtx = null;
var staticWebDirty = true;
var staticWebBakedCount = 0;
var staticWebLastW = 0;
var staticWebLastH = 0;

var isLmbHeld = false;
var lastLmbClickCard = -1;
var lastLmbClickRelX = 0;
var lastLmbClickRelY = 0;

// Pre-allocated queue of cards swept across while holding LMB so Eren chains through them in order
var LMB_QUEUE_CAP = 16;
var lmbCardQueue = new Int16Array(LMB_QUEUE_CAP);
var lmbQueueHead = 0;
var lmbQueueTail = 0;
var lmbQueueCount = 0;

function clearLmbCardQueue() {
  lmbQueueHead = 0;
  lmbQueueTail = 0;
  lmbQueueCount = 0;
}

function enqueueLmbCard(cardIdx) {
  if (cardIdx < 0) return;
  const lastTarget = lmbQueueCount > 0
    ? lmbCardQueue[(lmbQueueTail - 1 + LMB_QUEUE_CAP) % LMB_QUEUE_CAP]
    : (eren.pendingTargetCard !== -1 ? eren.pendingTargetCard : eren.currentCard);
  if (cardIdx === lastTarget) return;

  if (!eren.isSwinging && eren.preJumpTimer <= 0) {
    requestSwingToCard(cardIdx);
    return;
  }
  if (lmbQueueCount < LMB_QUEUE_CAP) {
    lmbCardQueue[lmbQueueTail] = cardIdx;
    lmbQueueTail = (lmbQueueTail + 1) % LMB_QUEUE_CAP;
    lmbQueueCount++;
  }
}

function dequeueLmbCard() {
  while (lmbQueueCount > 0) {
    const idx = lmbCardQueue[lmbQueueHead];
    lmbQueueHead = (lmbQueueHead + 1) % LMB_QUEUE_CAP;
    lmbQueueCount--;
    if (idx >= 0 && idx !== eren.currentCard) {
      return idx;
    }
  }
  return -1;
}

function finalizeActiveDragWeb() {
  if (activeDragConnIdx >= 0) {
    webConnAttached[activeDragConnIdx] = 1;
    webConnAge[activeDragConnIdx] = 0;
    activeDragConnIdx = -1;
  }
}

/**
 * Creates a web connection between `cardA` and `cardB` when Eren travels
 * from `cardA` to `cardB` while LMB is held.
 * Uses a FIFO rule: when reaching MAX_WEB_CONNECTIONS (50), the oldest active web
 * smoothly fades away and is removed so new webs can be created continuously.
 */
function startPhotoWebConnection(cardA, cardB) {
  finalizeActiveDragWeb();
  if (cardA < 0 || cardB < 0 || cardA === cardB) return;

  // 1. Enforce FIFO cap of MAX_WEB_CONNECTIONS (50) active webs: fade out the oldest active web(s)
  let activeCount = 0;
  for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
    if (webConnState[i] === WEB_STATE_ACTIVE) activeCount++;
  }
  while (activeCount >= MAX_WEB_CONNECTIONS) {
    let oldestIdx = -1;
    let oldestSeq = 2147483647;
    for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
      if (webConnState[i] === WEB_STATE_ACTIVE && webConnSeq[i] < oldestSeq) {
        oldestSeq = webConnSeq[i];
        oldestIdx = i;
      }
    }
    if (oldestIdx < 0) break;
    webConnState[oldestIdx] = WEB_STATE_FADING;
    staticWebDirty = true;
    activeCount--;
  }

  // 2. Find an inactive slot in the pool (or reuse the most-faded slot if all 64 slots are busy)
  let slot = -1;
  for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
    if (webConnState[i] === WEB_STATE_INACTIVE) {
      slot = i;
      break;
    }
  }
  if (slot < 0) {
    let minAlpha = 999;
    for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
      if (webConnState[i] === WEB_STATE_FADING && webConnAlpha[i] < minAlpha) {
        minAlpha = webConnAlpha[i];
        slot = i;
      }
    }
    if (slot < 0) slot = 0;
  }

  // 3. Count existing active webs between this pair so multiple strands fan out naturally
  let pairCount = 0;
  for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
    if (webConnState[i] !== WEB_STATE_INACTIVE &&
        ((webConnCardA[i] === cardA && webConnCardB[i] === cardB) ||
         (webConnCardA[i] === cardB && webConnCardB[i] === cardA))) {
      pairCount++;
    }
  }
  const spreadOffset = ((pairCount % 5) - 2) * 0.065;

  const cA = cards[cardA];
  const cB = cards[cardB];
  const dx = (cB.cx + cB.offsetX) - (cA.cx + cA.offsetX);
  const dy = (cB.cy + cB.offsetY) - (cA.cy + cA.offsetY);
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;

  projectPointToCardBorder(cardA, cB.cx + cB.offsetX, cB.cy + cB.offsetY);
  const relXA = Math.max(-0.44, Math.min(0.44, tempRelX * 0.86 + nx * spreadOffset));
  const relYA = Math.max(-0.44, Math.min(0.44, tempRelY * 0.86 + ny * spreadOffset));

  let relXB = 0;
  let relYB = 0;
  if (lastLmbClickCard === cardB) {
    relXB = Math.max(-0.44, Math.min(0.44, lastLmbClickRelX));
    relYB = Math.max(-0.44, Math.min(0.44, lastLmbClickRelY));
    lastLmbClickCard = -1;
  } else {
    projectPointToCardBorder(cardB, cA.cx + cA.offsetX, cA.cy + cA.offsetY);
    relXB = Math.max(-0.44, Math.min(0.44, tempRelX * 0.86 + nx * spreadOffset));
    relYB = Math.max(-0.44, Math.min(0.44, tempRelY * 0.86 + ny * spreadOffset));
  }

  webConnState[slot] = WEB_STATE_ACTIVE;
  webConnSeq[slot] = ++webConnNextSeq;
  webConnAlpha[slot] = 1.0;
  webConnCardA[slot] = cardA;
  webConnCardB[slot] = cardB;
  webConnRelXA[slot] = relXA;
  webConnRelYA[slot] = relYA;
  webConnRelXB[slot] = relXB;
  webConnRelYB[slot] = relYB;
  webConnAge[slot] = 0;
  webConnHoverTime[slot] = 0;
  webConnAttached[slot] = 0;
  webConnTension[slot] = 0.78 + (webConnNextSeq % 4) * 0.04;
  activeDragConnIdx = slot;
  webConnCount = activeCount + 1;
}

function updatePhotoWebConnections(dt) {
  let aliveCount = 0;
  for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
    const st = webConnState[i];
    if (st === WEB_STATE_INACTIVE) continue;
    const prevAge = webConnAge[i];
    webConnAge[i] += dt;

    // Track hover duration on either connected image so hover vibration stops after 2 seconds
    const fieldSum = cards[webConnCardA[i]].fieldStrength + cards[webConnCardB[i]].fieldStrength;
    if (fieldSum > 0.02) {
      webConnHoverTime[i] += dt;
    } else {
      webConnHoverTime[i] = 0;
    }

    // When a newly attached web finishes its pluck wobble, bake it into the static web cache
    if (st === WEB_STATE_ACTIVE && webConnAttached[i] === 1 && prevAge < 0.65 && webConnAge[i] >= 0.65) {
      staticWebDirty = true;
    }

    // Automatically fade out connected webs after 30 seconds of connection
    if (st === WEB_STATE_ACTIVE && webConnAttached[i] === 1 && webConnAge[i] >= WEB_CONN_LIFETIME) {
      webConnState[i] = WEB_STATE_FADING;
      staticWebDirty = true;
    }

    if (webConnState[i] === WEB_STATE_FADING) {
      webConnAlpha[i] -= dt / WEB_FADE_DURATION;
      if (webConnAlpha[i] <= 0) {
        webConnAlpha[i] = 0;
        webConnState[i] = WEB_STATE_INACTIVE;
        continue;
      }
    }
    aliveCount++;
  }
  webConnCount = aliveCount;
  if (activeDragConnIdx >= 0 && !eren.isSwinging && eren.preJumpTimer <= 0) {
    finalizeActiveDragWeb();
  }
}

function isCardStationaryForWebCache(c) {
  return c.loaded &&
    c.loadProgress >= 0.999 &&
    Math.abs(c.scale - IDLE_SCALE) < 0.002 &&
    Math.abs(c.offsetX) < 0.15 &&
    Math.abs(c.offsetY) < 0.15 &&
    c.fieldStrength < 0.01;
}

function rebuildStaticWebCache() {
  if (!staticWebCanvas) {
    staticWebCanvas = document.createElement('canvas');
    staticWebCtx = staticWebCanvas.getContext('2d');
  }
  if (staticWebCanvas.width !== canvas.width || staticWebCanvas.height !== canvas.height) {
    staticWebCanvas.width = canvas.width;
    staticWebCanvas.height = canvas.height;
  }
  staticWebLastW = canvas.width;
  staticWebLastH = canvas.height;
  staticWebCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  staticWebCtx.clearRect(0, 0, viewWidth, viewHeight);
  staticWebBakedCount = 0;

  const us = uniformScale;
  const savedCtx = ctx;
  ctx = staticWebCtx;
  for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
    if (webConnState[i] !== WEB_STATE_ACTIVE || webConnAttached[i] !== 1 || webConnAge[i] < 0.65) continue;
    const cA = cards[webConnCardA[i]];
    const cB = cards[webConnCardB[i]];
    if (!cA.loaded || !cB.loaded) continue;

    const x1 = cA.cx + webConnRelXA[i] * cA.baseW;
    const y1 = cA.cy + webConnRelYA[i] * cA.baseH;
    const tx2 = cB.cx + webConnRelXB[i] * cB.baseW;
    const ty2 = cB.cy + webConnRelYB[i] * cB.baseH;

    drawSplatAt(x1, y1, Math.atan2(ty2 - y1, tx2 - x1), 6.6 * us, 0.88);
    drawWebLine(x1, y1, tx2, ty2, 1.0, 0.88, webConnTension[i], 0, true);
    staticWebBakedCount++;
  }
  ctx = savedCtx;
  staticWebDirty = false;
}

function drawPhotoWebConnections() {
  if (webConnCount <= 0) return;
  const us = uniformScale;
  const audioBoost = 1 + audioEnergy * 0.025;

  // Check if all cards are stationary (no magnetic pull or audio pulse) so settled webs can be blitted in 1 drawImage
  let allCardsRested = audioEnergy < 0.005;
  if (allCardsRested) {
    for (let cIdx = 0; cIdx < CARD_COUNT; cIdx++) {
      if (!isCardStationaryForWebCache(cards[cIdx])) {
        allCardsRested = false;
        break;
      }
    }
  }

  if (allCardsRested) {
    if (staticWebDirty || staticWebLastW !== canvas.width || staticWebLastH !== canvas.height) {
      rebuildStaticWebCache();
    }
    if (staticWebBakedCount > 0 && staticWebCanvas) {
      ctx.drawImage(staticWebCanvas, 0, 0, viewWidth, viewHeight);
    }
  }

  for (let i = 0; i < WEB_CONN_POOL_SIZE; i++) {
    const st = webConnState[i];
    if (st === WEB_STATE_INACTIVE) continue;
    // Skip webs already drawn by the single staticWebCanvas blit
    if (allCardsRested && st === WEB_STATE_ACTIVE && webConnAttached[i] === 1 && webConnAge[i] >= 0.65) {
      continue;
    }
    const fadeAlpha = webConnAlpha[i];
    if (fadeAlpha <= 0.01) continue;

    const cA = cards[webConnCardA[i]];
    const cB = cards[webConnCardB[i]];
    if (!cA.loaded || !cB.loaded) continue;

    const scA = cA.scale * audioBoost;
    const scB = cB.scale * audioBoost;
    const x1 = (cA.cx + cA.offsetX) + webConnRelXA[i] * (cA.baseW * scA);
    const y1 = (cA.cy + cA.offsetY) + webConnRelYA[i] * (cA.baseH * scA);
    const tx2 = (cB.cx + cB.offsetX) + webConnRelXB[i] * (cB.baseW * scB);
    const ty2 = (cB.cy + cB.offsetY) + webConnRelYB[i] * (cB.baseH * scB);

    if (webConnAttached[i] === 0 && eren.isSwinging) {
      // Eren is pulling this web from cardA to cardB as he swings
      const hx = eren.handWorldX || eren.x;
      const hy = eren.handWorldY || (eren.y - 12 * us);
      const t = eren.swingT;
      const snapP = t < 0.72 ? 0 : Math.min(1, (t - 0.72) / 0.28);
      const x2 = hx + (tx2 - hx) * snapP;
      const y2 = hy + (ty2 - hy) * snapP;

      drawSplatAt(x1, y1, Math.atan2(y2 - y1, x2 - x1), 6.6 * us, 0.9 * fadeAlpha);
      drawWebLine(
        x2, y2, x1, y1, 1.0, 0.9 * fadeAlpha, 0.65 + 0.2 * snapP,
        Math.sin(elapsedTime * 28 + i) * 2.2 * us,
        snapP > 0.92
      );
    } else {
      const tau = webConnAge[i];
      const pluckWobble = tau < 0.65
        ? 5.5 * us * Math.exp(-tau * 8.5) * Math.cos(tau * 40)
        : 0;
      const hoverT = webConnHoverTime[i];
      const hoverEnv = hoverT < WEB_VIBRATE_DURATION ? (1 - hoverT / WEB_VIBRATE_DURATION) : 0;
      const fieldWobble = hoverEnv > 0
        ? (cA.fieldStrength + cB.fieldStrength) * 1.4 * us * hoverEnv * Math.sin(elapsedTime * 14 + i * 1.7)
        : 0;
      const wobble = pluckWobble + fieldWobble;
      // Gently relax tension as an old web fades out so it droops slightly while dissolving
      const tension = webConnTension[i] * (0.4 + 0.6 * fadeAlpha);

      drawSplatAt(x1, y1, Math.atan2(ty2 - y1, tx2 - x1), 6.6 * us, 0.88 * fadeAlpha);
      drawWebLine(x1, y1, tx2, ty2, 1.0, 0.88 * fadeAlpha, tension, wobble, true);
    }
  }
}

