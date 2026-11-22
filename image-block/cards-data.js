/**
 * image-block/cards-data.js
 * Image block definitions, crop ratios, relative paths, and card state initialization.
 */
/**
 * Exact 11 card definitions measured from the 1024x576 reference image.
 * All paths use explicit relative "./images/..." notation (no leading slash or absolute path).
 */
const CARD_DEFINITIONS = [
  {
    // 0. Top-Left (Commander Erwin Smith) - TOP ROW
    x: 45, y: 34, w: 106, h: 107, radius: 16, isTopRow: true, sideDir: 1,
    src: './images/Image0.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 1. Top-Mid-Left (Floch Forster) - TOP ROW
    x: 313, y: 31, w: 97, h: 80, radius: 16, isTopRow: true, sideDir: 1,
    src: './images/Image1.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 2. Upper-Mid-Right (Mikasa Ackerman)
    x: 610, y: 89, w: 127, h: 105, radius: 18, isTopRow: false, sideDir: -1,
    src: './images/Image2.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 3. Top-Right (Pieck Finger) - TOP ROW
    x: 844, y: 29, w: 124, h: 119, radius: 18, isTopRow: true, sideDir: -1,
    src: './images/Image3.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 4. Mid-Left (Armin Arlert)
    x: 154, y: 217, w: 149, h: 117, radius: 18, isTopRow: false, sideDir: 1,
    src: './images/Image4.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 5. Center (Eren Yeager - Season 4)
    x: 391, y: 166, w: 153, h: 146, radius: 20, isTopRow: false, sideDir: 1,
    src: './images/Image5.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 6. Mid-Right (Sasha Braus)
    x: 785, y: 207, w: 141, h: 132, radius: 18, isTopRow: false, sideDir: -1,
    src: './images/Image6.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 7. Bottom-Left (Annie Leonhart)
    x: 41, y: 424, w: 114, h: 104, radius: 16, isTopRow: false, sideDir: 1,
    src: './images/Image7.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 8. Bottom-Mid-Left (Reiner Braun)
    x: 361, y: 372, w: 111, h: 108, radius: 16, isTopRow: false, sideDir: 1,
    src: './images/Image8.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 9. Bottom-Mid-Right (Captain Levi Ackerman)
    x: 614, y: 403, w: 121, h: 124, radius: 18, isTopRow: false, sideDir: -1,
    src: './images/Image9.jpg',
    altSrc: null,
    crop: null
  },
  {
    // 10. Bottom-Right (Founder Ymir Fritz)
    x: 869, y: 411, w: 109, h: 118, radius: 16, isTopRow: false, sideDir: -1,
    src: './images/image10.jpg',
    altSrc: null,
    crop: null
  }
];

// Pre-allocated runtime state for each card
const CARD_COUNT = CARD_DEFINITIONS.length;
const cards = new Array(CARD_COUNT);
const drawOrder = new Int32Array(CARD_COUNT);


for (let i = 0; i < CARD_COUNT; i++) {
  drawOrder[i] = i;
  const def = CARD_DEFINITIONS[i];
  const img = new Image();
  img.decoding = 'async';

  const card = {
    index: i,
    refCx: def.x + def.w * 0.5,
    refCy: def.y + def.h * 0.5,
    refW: def.w,
    refH: def.h,
    refRadius: def.radius,
    isTopRow: def.isTopRow,
    sideDir: def.sideDir,
    cx: 0,
    cy: 0,
    baseW: 0,
    baseH: 0,
    baseRadius: 0,
    sx: 0,
    sy: 0,
    sw: 1,
    sh: 1,
    cropSpec: def.crop,
    scale: IDLE_SCALE,
    targetScale: IDLE_SCALE,
    offsetX: 0,
    offsetY: 0,
    targetOffsetX: 0,
    targetOffsetY: 0,
    fieldStrength: 0,
    loadProgress: 0, // 0 -> 1 over 400ms on load for smooth fade+scale-in
    img: img,
    cacheCanvas: null,
    cacheCtx: null,
    cacheW: 1,
    cacheH: 1,
    loaded: false,
    triedAlt: false,
    hasImage: !!def.src
  };

  img.onload = function () {
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;

    if (card.cropSpec) {
      card.sx = natW * card.cropSpec.sxRatio;
      card.sy = natH * card.cropSpec.syRatio;
      card.sw = natW * card.cropSpec.swRatio;
      card.sh = natH * card.cropSpec.shRatio;
    } else {
      const targetAR = card.refW / card.refH;
      const srcAR = natW / natH;
      if (srcAR > targetAR) {
        card.sh = natH;
        card.sw = natH * targetAR;
        card.sx = (natW - card.sw) * 0.5;
        card.sy = 0;
      } else {
        card.sw = natW;
        card.sh = natW / targetAR;
        card.sx = 0;
        card.sy = (natH - card.sh) * 0.5;
      }
    }
    card.loaded = true;
    card.loadProgress = 0.001;
    rebuildCardCache(card);
  };

  img.onerror = function () {
    if (!card.triedAlt && def.altSrc) {
      card.triedAlt = true;
      img.src = def.altSrc;
    }
  };

  if (def.src) {
    img.src = def.src;
  } else {
    // White placeholder box until the AOT image is assigned
    card.loaded = true;
    card.loadProgress = 0.001;
  }
  cards[i] = card;
}

