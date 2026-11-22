/**
 * behaviour/eren-state.js
 * Chibi Eren state machine, perch modes, deep-idle modes, time-of-day, and card reaction codes.
 */
/**
 * Perch Modes for Top-Row Cards (randomized so Eren's head never clips off-screen):
 * - 0: Standard top-edge perch (used for all non-top-row cards)
 * - 1: Hang upside-down from the bottom edge of the card
 * - 2: Sit/perch on the inner vertical side edge of the card
 * - 3: Low superhero crouch on the top edge (keeps head well below top screen border)
 */
const PERCH_TOP_NORMAL = 0;
const PERCH_BOTTOM_UPSIDE_DOWN = 1;
const PERCH_SIDE_EDGE = 2;
const PERCH_TOP_CROUCH = 3;

/**
 * Deep Idle Modes after ~18s perched:
 * - 0: Sleepy yawn & big overhead arm stretch ("Zzz...")
 * - 1: Lying flat on his back/stomach chilling on the card edge
 * - 2: Hanging upside-down from a short silk web thread below the card
 */
const DEEP_IDLE_YAWN = 0;
const DEEP_IDLE_LIE_DOWN = 1;
const DEEP_IDLE_CABLE_SWING = 2;

// ODM modes
const MODE_PERCH = 0;
const MODE_AIM = 1;
const MODE_SWING = 2;     // hooks anchored, winching, gravity pendulum
const MODE_BALLISTIC = 3; // hooks released, gas-guided arc to the perch
const MODE_LAND = 4;

// Time of day (checked once a minute, never inside the render loop)
const TOD_DAY = 0;
const TOD_NIGHT = 1;   // 23:00 - 05:00 -> drowsy, falls asleep sooner
const TOD_MORNING = 2; // 06:00 - 10:00 -> coffee mug while sitting, yawns
let timeOfDayMode = TOD_DAY;
function updateTimeOfDay() {
  const h = new Date().getHours();
  timeOfDayMode = (h >= 23 || h < 5) ? TOD_NIGHT : ((h >= 6 && h < 10) ? TOD_MORNING : TOD_DAY);
}
updateTimeOfDay();
setInterval(updateTimeOfDay, 60000);

function getDeepIdleDelay() {
  return timeOfDayMode === TOD_NIGHT ? Math.min(config.deepIdleDelay, 9.0) : config.deepIdleDelay;
}

// Hover reactions for special cards (indexed by card index)
const REACT_NONE = 0;
const REACT_GIMME = 1;
const REACT_AWESOME = 2;
const REACT_CAMERA = 3;
const REACT_HELLYES = 4;
const REACT_OWW = 5;
const REACT_SWEAT = 6;
const REACT_MUSIC = 7;
const REACT_HEARTS = 8;
const REACT_CONFUSED = 9;
const REACT_OUCH = 10;
const REACT_CHILL = 11;
const CARD_REACTIONS = new Int8Array(11); // all REACT_NONE until the AOT images exist


/**
 * Chibi Eren Swinging & Idle State Machine (Pre-allocated, zero GC pressure)
 */
const eren = {
  currentCard: 5,
  originCard: 5,
  perchMode: PERCH_TOP_NORMAL,
  nextPerchMode: PERCH_TOP_NORMAL,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  isSwinging: false,
  swingT: 1,
  swingDuration: 0.75,
  preJumpTimer: 0,       // >0 during the 0.11s launch crouch before takeoff
  pendingTargetCard: -1, // Card index waiting for preJumpTimer to finish
  hoverCandidateCard: -1,// Card currently under cursor for dwell debounce
  hoverDwellTimer: 0,    // Seconds cursor has rested on hoverCandidateCard
  startX: 0,
  startY: 0,
  ctrlX: 0,
  ctrlY: 0,
  endX: 0,
  endY: 0,
  anchorX: 0,
  anchorY: 0,
  anchorCard: -1,
  anchorRelX: 0,
  anchorRelY: 0,
  facing: 1,             // Target facing direction: 1 = right, -1 = left
  facingScale: 1,        // Smoothly interpolated [-1..1] for squash-turn over ~0.15s
  turnHop: 0,            // Subtle vertical hop during squash-turn
  landSquash: 0,
  idleTime: 0,
  sassyBlend: 0,
  sitBlend: 0,
  deepIdleBlend: 0,
  deepIdleMode: DEEP_IDLE_YAWN,
  // Natural randomized blink state
  blinkTimer: 2.8,
  blinkProgress: 0,
  isBlinking: false,
  pendingDoubleBlink: false,
  // Click flip/wave state (when clicking directly on Eren)
  flipTimer: 0,
  handWorldX: 0,         // Exact world X of Eren's web-shooting hand
  handWorldY: 0,         // Exact world Y of Eren's web-shooting hand
  headWorldX: 0,         // World position of his head (eye tracking, reactions, cast shadow)
  headWorldY: 0,
  headRot: 0,            // World rotation / flip of the head (for eye-tracking space)
  headFlipY: 1,
  // Swing mode state
  swingMode: 0,
  endIsCard: true,
  isChainSegment: false, // True during web #1 of a two-web long-distance swing
  chainTargetCard: -1,
  carryVx: 0,
  carryVy: 0,
  carryTime: 0,
  // Eye tracking & reactions
  lookX: 0,
  lookY: 0,
  cursorNear: 0,
  windBlend: 0,
  windDir: 1,
  reactionCode: 0,
  reactionBlend: 0,
  // ODM gear
  mode: MODE_PERCH,
  swingElapsed: 0,
  gas: 1.0,
  thrustX: 0,
  thrustY: 0,
  thrustT: 0,
  roll: 0,
  slashing: false,
  slashSpin: 0,
  bladeHold: 0,          // seconds blades remain drawn after landing
  hipLeftWorldX: 0,
  hipLeftWorldY: 0,
  hipRightWorldX: 0,
  hipRightWorldY: 0,
  initialized: false
};

