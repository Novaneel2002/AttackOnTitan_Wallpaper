/**
 * input/pointer-events.js
 * Mouse movement, LMB hold multi-photo webbing, click hit-testing, and visibility/resize listeners.
 */
let lmbDownTime = 0;
let lmbDownX = 0;
let lmbDownY = 0;
let lmbHoldActive = false;
let lmbHoldTimerId = 0;

function hitTestCardAndQueue(clientX, clientY) {
  if (eren.titanState !== TITAN_NONE) return;
  for (let i = CARD_COUNT - 1; i >= 0; i--) {
    const idx = drawOrder[i];
    const c = cards[idx];
    const currentScale = c.scale * (1 + audioEnergy * 0.025);
    const halfW = (c.baseW * currentScale) * 0.5;
    const halfH = (c.baseH * currentScale) * 0.5;
    const dx = clientX - (c.cx + c.offsetX);
    const dy = clientY - (c.cy + c.offsetY);
    if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) {
      enqueueLmbCard(idx);
      break;
    }
  }
}

function activateLmbHold(clientX, clientY) {
  if (lmbHoldActive) return;
  lmbHoldActive = true;
  isLmbHeld = true;
  clearLmbCardQueue();
  clickEffect.active = false; // Do not show "SHING!" when holding LMB

  if (config.showEren && eren.initialized) {
    hitTestCardAndQueue(clientX, clientY);
  }
}

function triggerSingleClickAction(clickX, clickY) {
  if (!config.showEren || !eren.initialized) return;
  const s = uniformScale * config.erenScale;

  // While in Attack Titan mode: NEVER obey or move to another block!
  if (eren.titanState !== TITAN_NONE) {
    if (eren.titanState === TITAN_ACTIVE) {
      const distToTitan = Math.hypot(clickX - eren.x, clickY - (eren.y - 26 * s));
      if (distToTitan <= 58 * s) {
        // Clicking the Titan resets his 10s idle timer and triggers an angry strike!
        eren.titanIdleTimer = 0;
        pickNextTitanAction();
      }
    }
    return;
  }

  // 1. Check if the user clicked directly on Chibi Eren
  const distToEren = Math.hypot(clickX - eren.x, clickY - (eren.y - 12 * s));
  if (distToEren <= 28 * s) {
    recordErenClick();
    if (eren.titanState !== TITAN_NONE) {
      // 5th click triggered Attack Titan transformation!
      clickEffect.active = false;
      return;
    }
    eren.idleTime = 0;
    eren.sassyBlend = 0;
    eren.sitBlend = 0;
    eren.deepIdleBlend = 0;
    eren.autoRoamTimer = 25 + Math.random() * 20;
    clickEffect.active = true;
    clickEffect.timer = 0;
    clickEffect.isErenClick = true;
    if (eren.erenClickCount === 3) {
      clickEffect.text = 'YAMERO!!';
      clickEffect.isAngry = true;
    } else if (eren.erenClickCount === 4) {
      clickEffect.text = 'OII!!';
      clickEffect.isAngry = true;
    } else {
      clickEffect.text = 'TCH.';
      clickEffect.isAngry = false;
    }
    return;
  }

  // 2. Check if the user clicked on any image card -> shoot "SHING!" web & swing there (and done)
  for (let i = CARD_COUNT - 1; i >= 0; i--) {
    const idx = drawOrder[i];
    const c = cards[idx];
    const currentScale = c.scale * (1 + audioEnergy * 0.025);
    const halfW = (c.baseW * currentScale) * 0.5;
    const halfH = (c.baseH * currentScale) * 0.5;
    const dx = clickX - (c.cx + c.offsetX);
    const dy = clickY - (c.cy + c.offsetY);

    if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) {
      eren.facing = (clickX - eren.x) >= 0 ? 1 : -1;
      clickEffect.active = true;
      clickEffect.timer = 0;
      clickEffect.isErenClick = false;
      clickEffect.targetX = clickX;
      clickEffect.targetY = clickY;
      clickEffect.cardIdx = idx;
      clickEffect.relX = dx / Math.max(1, c.baseW * currentScale);
      clickEffect.relY = dy / Math.max(1, c.baseH * currentScale);

      if (idx !== eren.currentCard) {
        setSlashWanted(idx);
        requestSwingToCard(idx);
      }
      return;
    }
  }
}

window.addEventListener('mousemove', function (e) {
  if (isPointerActive) {
    const mdx = e.clientX - rawMouseX;
    mouseTravel += Math.abs(mdx) + Math.abs(e.clientY - rawMouseY);
    mouseTravelX += mdx;
  }
  wakeNow();
  rawMouseX = e.clientX;
  rawMouseY = e.clientY;
  timeSinceMouseMove = 0;
  if (!isPointerActive) {
    smoothMouseX = rawMouseX;
    smoothMouseY = rawMouseY;
    isPointerActive = true;
  }

  // Promote LMB press to LMB hold immediately if dragged > 8px
  if (lmbDownTime > 0 && !lmbHoldActive) {
    if (Math.hypot(e.clientX - lmbDownX, e.clientY - lmbDownY) > 8) {
      if (lmbHoldTimerId) {
        clearTimeout(lmbHoldTimerId);
        lmbHoldTimerId = 0;
      }
      activateLmbHold(e.clientX, e.clientY);
    }
  }

  // While holding LMB, dragging over any photo card queues/triggers Eren to travel & web it
  if (isLmbHeld && config.showEren && eren.initialized) {
    hitTestCardAndQueue(e.clientX, e.clientY);
  }
}, { passive: true });

window.addEventListener('mousedown', function (e) {
  wakeNow();
  if (!config.showEren || !eren.initialized) return;
  if (e.button === 0) {
    lmbDownTime = performance.now();
    lmbDownX = e.clientX;
    lmbDownY = e.clientY;
    lmbHoldActive = false;
    if (lmbHoldTimerId) clearTimeout(lmbHoldTimerId);
    lmbHoldTimerId = setTimeout(function () {
      lmbHoldTimerId = 0;
      if (lmbDownTime > 0) {
        activateLmbHold(rawMouseX, rawMouseY);
      }
    }, 170);
  }
}, { passive: true });

window.addEventListener('mouseup', function (e) {
  if (e.button === 0) {
    if (lmbHoldTimerId) {
      clearTimeout(lmbHoldTimerId);
      lmbHoldTimerId = 0;
    }
    const wasQuickClick = lmbDownTime > 0 && !lmbHoldActive;
    lmbDownTime = 0;
    lmbHoldActive = false;
    isLmbHeld = false;
    lastLmbClickCard = -1;
    clearLmbCardQueue();

    if (wasQuickClick) {
      triggerSingleClickAction(e.clientX, e.clientY);
    }
  }
}, { passive: true });

window.addEventListener('blur', function () {
  if (lmbHoldTimerId) {
    clearTimeout(lmbHoldTimerId);
    lmbHoldTimerId = 0;
  }
  lmbDownTime = 0;
  lmbHoldActive = false;
  isLmbHeld = false;
  lastLmbClickCard = -1;
  clearLmbCardQueue();
}, { passive: true });

window.addEventListener('mouseleave', function () {
  if (lmbHoldTimerId) {
    clearTimeout(lmbHoldTimerId);
    lmbHoldTimerId = 0;
  }
  isPointerActive = false;
  lmbDownTime = 0;
  lmbHoldActive = false;
  isLmbHeld = false;
  lastLmbClickCard = -1;
  clearLmbCardQueue();
}, { passive: true });

document.addEventListener('visibilitychange', function () {
  isPageHidden = document.hidden;
  if (isPageHidden) {
    if (rafId > 0) cancelAnimationFrame(rafId);
    if (idleTimerId) clearTimeout(idleTimerId);
    rafId = 0;
    idleTimerId = 0;
  } else {
    lastFrameTime = performance.now();
    bgDirty = true;
    fxDirtyFull = true;
    wakeNow();
  }
});

window.addEventListener('resize', function () {
  handleResize(true);
  scheduleCardCacheRebuild();
  wakeNow();
}, { passive: true });

