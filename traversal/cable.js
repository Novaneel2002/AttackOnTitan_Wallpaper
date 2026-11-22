/**
 * traversal/cable.js
 * LMB card targeting queue and cable utility stubs.
 * (Card-to-card joining ropes feature completely removed as requested)
 */

var isLmbHeld = false;
var activeDragConnIdx = -1;
var webConnCount = 0;
var WEB_CONN_POOL_SIZE = 0;

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

// Stubs for legacy hooks / card-to-card webbing (disabled)
function addWebTag() {}
function updateWebTags() {}
function drawWebTags() {}
function finalizeActiveDragWeb() {}
function startPhotoWebConnection() {}
function updatePhotoWebConnections() {}
function drawPhotoWebConnections() {}
function clearAllPhotoWebConnections() {}
function rebuildStaticWebCache() {}
