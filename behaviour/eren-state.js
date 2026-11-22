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

// Attack Titan transformation & rampage states
const TITAN_NONE = 0;
const TITAN_TRANSFORMING = 1; // 5th click: yellow thunderbolts + white clouds -> Attack Titan
const TITAN_ACTIVE = 2;       // 2x Attack Titan rampaging on current block (ignores mouse)
const TITAN_REVERTING = 3;    // After 10s idle: heavy smoke clouds -> back to human Eren

const TITAN_ACT_PUNCH = 0;
const TITAN_ACT_KICK = 1;
const TITAN_ACT_JUMP = 2;
const TITAN_ACT_ROAR = 3;
const TITAN_ACT_LEAP = 4; // Random furious leap across blocks (1-2 times per rampage)

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

// Hover reactions for each Attack on Titan character card (indexed by card 0..10)
const REACT_NONE = 0;
const REACT_ERWIN = 1;     // 0: Commander Erwin -> "SASAGEYO!"
const REACT_FLOCH = 2;     // 1: Floch -> "FOR ELDIA!"
const REACT_MIKASA = 3;    // 2: Mikasa -> Floating hearts + "MIKASA..."
const REACT_PIECK = 4;     // 3: Pieck (hands up) -> "HANDS UP!"
const REACT_ARMIN = 5;     // 4: Armin -> Sweat drop + "THE SEA!"
const REACT_EREN = 6;      // 5: Season 4 Eren -> "TATAKAE!"
const REACT_SASHA = 7;     // 6: Sasha -> "MEAT!!"
const REACT_ANNIE = 8;     // 7: Annie laughing -> Sweat drop + "ANNIE?!"
const REACT_REINER = 9;    // 8: Depressed Reiner -> "SIT DOWN, REINER."
const REACT_LEVI = 10;     // 9: Captain Levi glare -> Sweat drop + "CAPTAIN!"
const REACT_YMIR = 11;     // 10: Founder Ymir -> "YOU ARE FREE."

const CARD_REACTIONS = new Int8Array([
  REACT_ERWIN,   // 0: Image0.jpg (Erwin)
  REACT_FLOCH,   // 1: Image1.jpg (Floch)
  REACT_MIKASA,  // 2: Image2.jpg (Mikasa)
  REACT_PIECK,   // 3: Image3.jpg (Pieck)
  REACT_ARMIN,   // 4: Image4.jpg (Armin)
  REACT_EREN,    // 5: Image5.jpg (Eren S4)
  REACT_SASHA,   // 6: Image6.jpg (Sasha)
  REACT_ANNIE,   // 7: Image7.jpg (Annie)
  REACT_REINER,  // 8: Image8.jpg (Reiner)
  REACT_LEVI,    // 9: Image9.jpg (Levi)
  REACT_YMIR     // 10: image10.jpg (Ymir)
]);


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
  handWorldX: 0,         // Exact world X of Eren's hand
  handWorldY: 0,         // Exact world Y of Eren's hand
  headWorldX: 0,         // World position of his head (eye tracking, reactions, cast shadow)
  headWorldY: 0,
  headRot: 0,            // World rotation / flip of the head (for eye-tracking space)
  headFlipY: 1,
  // Secondary motion (hair lag) & autonomous roam
  hairLagX: 0,
  hairLagY: 0,
  autoRoamTimer: 28.0,
  titanMarkTimer: 0,     // Post-revert Titan shifter cheek marks & lingering shoulder steam
  screenShake: 0,        // Foreground micro-shake intensity on Titan impacts
  roarPulse: 0,          // Attack Titan roar intensity for soundwave rings & comic burst
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
  // Attack Titan transformation click counter (5 clicks in 5s) & rampage state
  erenClickTimes: new Float64Array(8),
  erenClickCount: 0,
  titanState: TITAN_NONE,
  titanTransTimer: 0,
  titanIdleTimer: 0,
  titanAction: TITAN_ACT_ROAR,
  titanActionTimer: 0,
  titanActionDur: 0.85,
  titanImpactDone: false,
  titanJumpY: 0,
  titanSteamAccum: 0,
  titanHitCount: 0,
  titanLeapStartX: 0,
  titanLeapStartY: 0,
  titanLeapTargetCard: -1,
  initialized: false
};

