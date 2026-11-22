/**
 * core/loop.js
 * Responsive 16:9 stage layout, two-layer dirty-rect rendering, adaptive FPS throttling,
 * true 0-FPS idle sleep, and main renderFrame animation loop.
 */

let resizeCacheTimerId = 0;
let prevHadAudio = false;
let prevFxX = 0;
let prevFxY = 0;
let prevFxW = 0;
let prevFxH = 0;
let hasPrevFxRect = false;

/**
 * Debounced offscreen card cache rebuild on window resize (avoids memory spikes while dragging).
 */
function scheduleCardCacheRebuild() {
  if (resizeCacheTimerId) clearTimeout(resizeCacheTimerId);
  resizeCacheTimerId = setTimeout(function () {
    resizeCacheTimerId = 0;
    for (let i = 0; i < CARD_COUNT; i++) {
      if (cards[i].loaded) rebuildCardCache(cards[i]);
    }
    bgDirty = true;
    wakeNow();
  }, 120);
}

/**
 * Recalculates canvas resolution and centered 16:9 responsive card geometry on window resize.
 */
function handleResize(skipCacheRebuild) {
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;
  const maxDpr = config.powerSaver ? 1 : 2;
  dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  const backingW = Math.round(viewWidth * dpr);
  const backingH = Math.round(viewHeight * dpr);

  bgCanvas.width = backingW;
  bgCanvas.height = backingH;
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  bgCtx.imageSmoothingEnabled = true;
  bgCtx.imageSmoothingQuality = 'medium';

  canvas.width = backingW;
  canvas.height = backingH;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';

  bgDirty = true;
  fxDirtyFull = true;
  hasPrevFxRect = false;

  if (!grainCanvas) {
    createFilmGrainPattern();
  }

  // Centered 16:9 stage with gentle aspect-ratio breathing room so 21:9/16:10 never distort
  const rawScaleX = viewWidth / REF_WIDTH;
  const rawScaleY = viewHeight / REF_HEIGHT;
  uniformScale = Math.min(rawScaleX, rawScaleY);

  // Allow up to 12% gentle spacing expansion on ultrawide/tall monitors while centering the rest
  const layoutScaleX = uniformScale + (rawScaleX - uniformScale) * 0.35;
  const layoutScaleY = uniformScale + (rawScaleY - uniformScale) * 0.35;
  stageOffsetX = (viewWidth - REF_WIDTH * layoutScaleX) * 0.5;
  stageOffsetY = (viewHeight - REF_HEIGHT * layoutScaleY) * 0.5;

  scaledMagnetRadius = config.magnetRadius * uniformScale;
  scaledInnerRadius = INNER_CORE_RADIUS * uniformScale;
  scaledMaxPull = config.maxMagnetPull * uniformScale;

  for (let i = 0; i < CARD_COUNT; i++) {
    const c = cards[i];
    c.cx = stageOffsetX + c.refCx * layoutScaleX;
    c.cy = stageOffsetY + c.refCy * layoutScaleY;
    c.baseW = c.refW * uniformScale;
    c.baseH = c.refH * uniformScale;
    c.baseRadius = c.refRadius * uniformScale;
    if (c.loaded && !skipCacheRebuild) {
      rebuildCardCache(c);
    }
  }

  if (!eren.initialized) {
    eren.perchMode = PERCH_TOP_NORMAL;
    eren.x = getCardPerchX(eren.currentCard, eren.perchMode);
    eren.y = getCardPerchY(eren.currentCard, eren.perchMode);
    eren.initialized = true;
  }
}

/**
 * Checks whether any card is still loading, scaling, or relaxing back to rest.
 */
function areCardsSettled() {
  for (let i = 0; i < CARD_COUNT; i++) {
    const c = cards[i];
    if (!c.loaded || c.loadProgress < 1) return false;
    if (Math.abs(c.scale - c.targetScale) > 0.002) return false;
    if (Math.abs(c.offsetX - c.targetOffsetX) > 0.1 || Math.abs(c.offsetY - c.targetOffsetY) > 0.1) return false;
  }
  return true;
}

/**
 * Determines whether the scene is actively moving (requires full 60+ FPS)
 * or resting in a calm idle state (throttled to save GPU/CPU).
 */
function isSceneHighMotion() {
  if (eren.titanState !== TITAN_NONE || activeSmokeCount > 0 || titanBoltTimer > 0 || titanFlashAlpha > 0) return true;
  if ((isPointerActive && timeSinceMouseMove < 0.5) || audioEnergy > 0.01) return true;
  if (config.showEren) {
    if (eren.isSwinging || eren.preJumpTimer > 0 || eren.flipTimer > 0 || eren.thrustT > 0 || eren.bladeHold > 0 || eren.mode !== MODE_PERCH) return true;
    if (isLmbHeld || trailingCablesActive() || eren.windBlend > 0.02 || eren.reactionBlend > 0.03 || eren.landSquash > 0 || eren.cursorNear > 0.35) return true;
    if (clickEffect.active || activeDustCount > 0 || (typeof activeSteamCount !== 'undefined' && activeSteamCount > 0)) return true;
  }
  return !areCardsSettled();
}

/**
 * Frame pacing:
 *  - completely static (Eren hidden + cards/audio settled) -> -1 (0 FPS full sleep)
 *  - anything moving                                       -> 0 (rAF, or 33ms in Power Saver)
 *  - calm                                                  -> ~30 fps (33ms)
 *  - calm for > 3s                                         -> ~15 fps (66ms)
 *  - asleep (deep idle) & quiet                            -> ~8 fps (125ms)
 * Low-rate frames are scheduled with setTimeout so the browser does no work in between.
 */
function getFrameInterval() {
  const highMotion = isSceneHighMotion();
  if (!config.showEren && !highMotion && !bgDirty && !fxDirtyFull) {
    return -1; // True 0 FPS sleep until next input/audio/property/resize event
  }
  if (highMotion || (config.showEren && eren.isBlinking && timeSinceMouseMove < 3)) {
    return config.powerSaver ? 33 : 0;
  }
  const asleep = eren.deepIdleBlend > 0.95 && !eren.isSwinging;
  if (asleep && timeSinceMouseMove > 3) return 125;
  if (timeSinceMouseMove > 3) return 66;
  return 33;
}

function wakeFrameFromTimer() {
  idleTimerId = 0;
  rafId = isPageHidden ? 0 : requestAnimationFrame(renderFrame);
}

function scheduleNextFrame() {
  if (isPageHidden) {
    rafId = 0;
    return;
  }
  const interval = getFrameInterval();
  lastFrameInterval = interval;
  if (interval < 0) {
    isSleeping = true;
    rafId = 0;
  } else if (interval === 0) {
    isSleeping = false;
    rafId = requestAnimationFrame(renderFrame);
  } else {
    isSleeping = false;
    rafId = -1; // Marker: a timer is pending
    idleTimerId = setTimeout(wakeFrameFromTimer, Math.max(1, interval - 4));
  }
}

// Immediately resume full-rate rendering (input, resize, settings change, visibility restore)
function wakeNow() {
  if (isPageHidden) return;
  if (idleTimerId) {
    clearTimeout(idleTimerId);
    idleTimerId = 0;
    lastFrameInterval = 0;
    isSleeping = false;
    rafId = requestAnimationFrame(renderFrame);
    return;
  }
  if (isSleeping || !rafId) {
    isSleeping = false;
    lastFrameInterval = 0;
    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(renderFrame);
  }
}

/**
 * Main animation loop optimized for minimal CPU/GPU usage and zero GC pressure.
 */
function renderFrame(now) {
  if (isPageHidden) {
    rafId = 0;
    return;
  }
  rafId = 0;
  lastRenderTime = now;

  const realDt = Math.max(0.001, (now - lastFrameTime) * 0.001);
  const dt = Math.min(lastFrameInterval > 0 ? 0.15 : 0.05, realDt);
  lastFrameTime = now;

  // Smoothed cursor speed + direction (drives the wind brace)
  if (mouseTravel > 0 || mouseSpeed > 0.5) {
    mouseSpeed += (mouseTravel / realDt - mouseSpeed) * (1 - Math.exp(-7 * dt));
    if (Math.abs(mouseTravelX) > 2) mouseDirX = mouseTravelX > 0 ? 1 : -1;
    mouseTravel = 0;
    mouseTravelX = 0;
  } else {
    mouseSpeed = 0;
  }
  elapsedTime += dt;
  timeSinceMouseMove += dt;

  // 1. Smoothly interpolate cursor coordinates so the magnetic field glides organically
  if (isPointerActive) {
    const cursorAlpha = 1 - Math.exp(-CURSOR_SMOOTH_RATE * dt);
    smoothMouseX += (rawMouseX - smoothMouseX) * cursorAlpha;
    smoothMouseY += (rawMouseY - smoothMouseY) * cursorAlpha;
  }

  // 2. Smoothly decay or follow Lively audio energy (skip math when silent)
  if (audioEnergy > 0.0005 || targetAudioEnergy > 0.0005) {
    audioEnergy += (targetAudioEnergy - audioEnergy) * (1 - Math.exp(-8 * dt));
    targetAudioEnergy *= Math.exp(-4 * dt);
  } else {
    audioEnergy = 0;
    targetAudioEnergy = 0;
  }

  // 3. Compute strictly local magnetic targets for cards near the cursor
  updateMagneticTargets(dt);

  // 4. Exponential viscous relaxation + 400ms card load fade-in progression
  const scaleAlpha = 1 - Math.exp(-SCALE_SMOOTH_RATE * dt);
  const pullAlpha = 1 - Math.exp(-PULL_SMOOTH_RATE * dt);
  let anyCardScaling = false;
  let anyCardMoving = false;
  let anyCardLoading = false;

  for (let i = 0; i < CARD_COUNT; i++) {
    const c = cards[i];
    if (c.loaded && c.loadProgress < 1) {
      c.loadProgress = Math.min(1, c.loadProgress + dt / 0.40);
      anyCardLoading = true;
    }
    const ds = c.targetScale - c.scale;
    if (Math.abs(ds) > 0.0002) {
      c.scale += ds * scaleAlpha;
      anyCardScaling = true;
      anyCardMoving = true;
    } else if (c.scale !== c.targetScale) {
      c.scale = c.targetScale;
      anyCardScaling = true;
      anyCardMoving = true;
    }
    const dox = c.targetOffsetX - c.offsetX;
    const doy = c.targetOffsetY - c.offsetY;
    if (Math.abs(dox) > 0.02 || Math.abs(doy) > 0.02) {
      c.offsetX += dox * pullAlpha;
      c.offsetY += doy * pullAlpha;
      anyCardMoving = true;
    } else if (c.offsetX !== c.targetOffsetX || c.offsetY !== c.targetOffsetY) {
      c.offsetX = c.targetOffsetX;
      c.offsetY = c.targetOffsetY;
      anyCardMoving = true;
    }
  }

  // 5. Redraw background card layer ONLY when cards, audio, or layout actually changed
  const hasAudio = audioEnergy > 0.01;
  if (bgDirty || anyCardMoving || anyCardLoading || hasAudio || prevHadAudio) {
    bgDirty = false;
    prevHadAudio = hasAudio;

    bgCtx.fillStyle = '#000000';
    bgCtx.fillRect(0, 0, viewWidth, viewHeight);

    if (hasAudio) {
      const dtScale = dt * 60;
      bgCtx.save();
      bgCtx.globalAlpha = Math.min(audioEnergy * 0.18, 0.12);
      bgCtx.fillStyle = '#ffffff';
      const stageW = viewWidth - stageOffsetX * 2;
      const stageH = viewHeight - stageOffsetY * 2;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particleX[i] += particleVx[i] * dtScale;
        particleY[i] += particleVy[i] * dtScale;
        if (particleX[i] < 0) particleX[i] += REF_WIDTH;
        else if (particleX[i] > REF_WIDTH) particleX[i] -= REF_WIDTH;
        if (particleY[i] < 0) particleY[i] += REF_HEIGHT;
        else if (particleY[i] > REF_HEIGHT) particleY[i] -= REF_HEIGHT;

        const pSize = particleSize[i] * uniformScale;
        bgCtx.fillRect(
          stageOffsetX + (particleX[i] / REF_WIDTH) * stageW,
          stageOffsetY + (particleY[i] / REF_HEIGHT) * stageH,
          pSize,
          pSize
        );
      }
      bgCtx.restore();
    }

    if (anyCardScaling) {
      sortDrawOrderByScale();
    }
    for (let i = 0; i < CARD_COUNT; i++) {
      drawCard(cards[drawOrder[i]]);
    }
  }

  // 6. Update & render Eren + FX on the transparent foreground layer (dirty-rect when calm)
  if (config.showEren) {
    updateEren(dt);

    const wideFxActive = eren.isSwinging || eren.titanState !== TITAN_NONE ||
      eren.reactionBlend > 0.02 || clickEffect.active ||
      activeDustCount > 0 || activeSteamCount > 0 ||
      activeSmokeCount > 0 || titanBoltTimer > 0 || titanFlashAlpha > 0 ||
      trailingCablesActive() || anyHookActive();

    if (fxDirtyFull || wideFxActive || !hasPrevFxRect) {
      ctx.clearRect(0, 0, viewWidth, viewHeight);
      fxDirtyFull = wideFxActive;
    } else {
      ctx.clearRect(prevFxX, prevFxY, prevFxW, prevFxH);
    }

    drawErenCastShadow();
    drawEren();

    if (wideFxActive || !eren.initialized) {
      hasPrevFxRect = false;
    } else {
      const s = uniformScale * config.erenScale;
      const padX = 56 * s;
      const padTop = 74 * s;
      const padBot = 62 * s;
      const x0 = Math.max(0, Math.floor(eren.x - padX));
      const y0 = Math.max(0, Math.floor(eren.y - padTop));
      const x1 = Math.min(viewWidth, Math.ceil(eren.x + padX));
      const y1 = Math.min(viewHeight, Math.ceil(eren.y + padBot));
      prevFxX = x0;
      prevFxY = y0;
      prevFxW = Math.max(0, x1 - x0);
      prevFxH = Math.max(0, y1 - y0);
      hasPrevFxRect = prevFxW > 0 && prevFxH > 0;
    }
  } else if (fxDirtyFull || hasPrevFxRect) {
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    fxDirtyFull = false;
    hasPrevFxRect = false;
  }

  scheduleNextFrame();
}

let wallpaperStarted = false;
function startWallpaper() {
  if (wallpaperStarted) return;
  wallpaperStarted = true;
  handleResize(false);
  rafId = requestAnimationFrame(renderFrame);
}
