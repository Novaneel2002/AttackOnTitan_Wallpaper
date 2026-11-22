/**
 * config/settings.js
 * Global canvas context, reference design dimensions, configurable settings,
 * viewport/pointer/audio/timing state, and Lively Wallpaper integration.
 */
const bgCanvas = document.getElementById('cardsCanvas');
let bgCtx = bgCanvas.getContext('2d', { alpha: false });
const canvas = document.getElementById('wallpaperCanvas');
let ctx = canvas.getContext('2d', { alpha: true });

// Reference design dimensions (16:9 aspect ratio matching the 1024x576 reference image)
const REF_WIDTH = 1024;
const REF_HEIGHT = 576;

// Configurable Settings (customizable live via LivelyProperties.json)
const config = {
  showEren: true,
  erenScale: 1.0,
  maxMagnetScale: 1.22,
  magnetRadius: 185,
  maxMagnetPull: 14,
  grainAmount: 0.085,
  hoverDwellTime: 0.18,       // 180ms cursor dwell required before triggering a swing
  sassyPoseDelay: 2.0,        // 2s -> sassy hands-on-hips squint pose
  idleSitDelay: 5.0,          // 5s -> sit & dangle legs over border
  gasPower: 1.0,
  cableSpeed: 1.0,
  showSteam: true,
  powerSaver: false,
  deepIdleDelay: 18.0, // 18s -> deep idle (yawn, lie flat, or hang on cable swing)
  autoRoam: true,      // Autonomous ODM roaming between cards when idle
};

const IDLE_SCALE = 1.0;
const INNER_CORE_RADIUS = 18;

// Smooth viscous-fluid damping rates (lower = slower, silkier, zero bounce)
const CURSOR_SMOOTH_RATE = 8.5;
const SCALE_SMOOTH_RATE = 5.0;
const PULL_SMOOTH_RATE = 5.5;

// Viewport & centered 16:9 stage state (prevents stretching on ultrawide 21:9 or 16:10 displays)
let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let uniformScale = 1;
let stageOffsetX = 0;
let stageOffsetY = 0;
let scaledMagnetRadius = config.magnetRadius;
let scaledInnerRadius = INNER_CORE_RADIUS;
let scaledMaxPull = config.maxMagnetPull;

// Layer dirty-tracking flags (eliminates redundant background & full-screen redraws)
let bgDirty = true;
let fxDirtyFull = true;
let isSleeping = false;

// Pointer state (raw, smoothed, and inactivity timeout)
let rawMouseX = -9999;
let rawMouseY = -9999;
let smoothMouseX = -9999;
let smoothMouseY = -9999;
let isPointerActive = false;
let timeSinceMouseMove = 999;

// Timing & adaptive frame-rate state
let lastFrameTime = performance.now();
let lastRenderTime = 0;
let elapsedTime = 0;
let isPageHidden = document.hidden;
let rafId = 0;

// Optional Lively Wallpaper audio reactivity state (0 when silent/unused)
let audioEnergy = 0;
let targetAudioEnergy = 0;

// Pre-rendered seamless film grain / halftone pattern
let grainPattern = null;
let grainCanvas = null; // Source tile, reused to bake grain into each card cache

let idleTimerId = 0;
let lastFrameInterval = 0;
// Cursor speed tracking (for the "wind" brace reaction)
let mouseTravel = 0;
let mouseTravelX = 0;
let mouseSpeed = 0;
let mouseDirX = 1;

/**
 * Lively Wallpaper Settings Panel Listener (wired to LivelyProperties.json)
 */
window.livelyPropertyListener = function (name, val) {
  switch (name) {
    case 'showEren':
      config.showEren = Boolean(val);
      fxDirtyFull = true;
      break;
    case 'erenScale':
      config.erenScale = Math.max(0.4, Math.min(3.5, Number(val) || 1.0));
      fxDirtyFull = true;
      break;
    case 'magnetStrength':
      config.maxMagnetScale = 1.0 + Math.max(0.05, Math.min(0.5, Number(val) || 0.22));
      bgDirty = true;
      break;
    case 'magnetRadius':
      config.magnetRadius = Math.max(90, Math.min(350, Number(val) || 185));
      scaledMagnetRadius = config.magnetRadius * uniformScale;
      bgDirty = true;
      break;
    case 'grainAmount':
      config.grainAmount = Math.max(0, Math.min(0.25, Number(val) || 0.085));
      for (let i = 0; i < CARD_COUNT; i++) {
        if (cards[i].loaded) rebuildCardCache(cards[i]);
      }
      bgDirty = true;
      break;
    case 'gasPower':
      config.gasPower = Math.max(0.5, Math.min(2.0, Number(val) || 1.0));
      break;
    case 'cableSpeed':
      config.cableSpeed = Math.max(0.5, Math.min(2.0, Number(val) || 1.0));
      break;
    case 'showSteam':
      config.showSteam = Boolean(val);
      break;
    case 'powerSaver':
      config.powerSaver = Boolean(val);
      if (typeof handleResize === 'function') handleResize(false);
      break;
    case 'idleSitDelay':
      config.idleSitDelay = Math.max(2, Math.min(20, Number(val) || 5.0));
      break;
  }
  wakeNow();
};

/**
 * Optional Lively Wallpaper Audio API Listener
 */
window.livelyAudioListener = function (audioArray) {
  if (!audioArray || !audioArray.length) return;
  let bassSum = 0;
  const bins = Math.min(16, audioArray.length);
  for (let i = 0; i < bins; i++) {
    bassSum += audioArray[i];
  }
  targetAudioEnergy = Math.min(1, bassSum / bins);
  if (targetAudioEnergy > 0.01) wakeNow();
};

// Tiny public API: the character remains self-contained in this HTML file,
// but can also be controlled by another script or a host wallpaper panel.
// Example: ErenChibi.setScale(1.35); ErenChibi.setVisible(false);
window.ErenChibi = {
  setScale: function (value) {
    config.erenScale = Math.max(0.4, Math.min(3.5, Number(value) || 1.0));
    fxDirtyFull = true;
    wakeNow();
  },
  setVisible: function (value) {
    config.showEren = Boolean(value);
    fxDirtyFull = true;
    wakeNow();
  },
  swingTo: function (cardIndex) {
    const idx = Math.max(0, Math.min(CARD_COUNT - 1, Number(cardIndex) || 0));
    requestSwingToCard(idx);
    wakeNow();
  }
};
