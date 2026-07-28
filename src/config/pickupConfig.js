export const POWER_UP_TYPES = Object.freeze({
  shield: "shield",
  slowMotion: "slow-motion",
  coinMagnet: "coin-magnet",
  doubleScore: "double-score",
});

export const POWER_UP_ORDER = Object.freeze([
  POWER_UP_TYPES.shield,
  POWER_UP_TYPES.slowMotion,
  POWER_UP_TYPES.coinMagnet,
  POWER_UP_TYPES.doubleScore,
]);

function createPowerUp({
  type,
  label,
  shortLabel,
  color,
  durationMs,
  worldTimeScale = 1,
  magnetDistance = 0,
  scoreMultiplier = 1,
}) {
  return Object.freeze({
    type,
    label,
    shortLabel,
    color,
    durationMs,
    worldTimeScale,
    magnetDistance,
    scoreMultiplier,
  });
}

export const POWER_UP_CONFIG = Object.freeze({
  [POWER_UP_TYPES.shield]: createPowerUp({
    type: POWER_UP_TYPES.shield,
    label: "KALKAN",
    shortLabel: "S",
    color: 0x5de6ff,
    durationMs: 14_000,
  }),
  [POWER_UP_TYPES.slowMotion]: createPowerUp({
    type: POWER_UP_TYPES.slowMotion,
    label: "YAVAŞ",
    shortLabel: "◷",
    color: 0xa98bff,
    durationMs: 5_500,
    worldTimeScale: 0.62,
  }),
  [POWER_UP_TYPES.coinMagnet]: createPowerUp({
    type: POWER_UP_TYPES.coinMagnet,
    label: "MIKNATIS",
    shortLabel: "U",
    color: 0xff5f70,
    durationMs: 9_000,
    magnetDistance: 142,
  }),
  [POWER_UP_TYPES.doubleScore]: createPowerUp({
    type: POWER_UP_TYPES.doubleScore,
    label: "2X SKOR",
    shortLabel: "×2",
    color: 0xffd447,
    durationMs: 8_000,
    scoreMultiplier: 2,
  }),
});

export const PICKUP_CONFIG = Object.freeze({
  standardCoinValue: 1,
  riskyCoinValue: 3,
  coinPoolSize: 36,
  powerUpPoolPerType: 2,

  coinRadius: 13,
  powerUpRadius: 18,
  coinPatternSize: 3,
  coinSpacing: 42,
  coinLeadDistance: 126,
  minimumPickupY: 118,
  maximumPickupY: 650,
  riskCoinSafeMargin: 15,
  magnetAttractionSpeed: 430,
  offscreenX: -54,

  coinPatternEveryObstacles: 2,
  riskCoinMinimumScore: 5,
  riskCoinChance: 0.58,

  powerUpMinimumScore: 6,
  powerUpEarliestMs: 12_000,
  powerUpMinimumIntervalMs: 24_000,
  powerUpPityMs: 44_000,
  powerUpMinimumObstacleGap: 5,
  powerUpChance: 0.28,
  powerUpLeadDistance: 188,

  shieldCollisionGraceMs: 780,
});

export function getPowerUpConfig(type) {
  return POWER_UP_CONFIG[type] ?? null;
}

export function clampPickupY(value) {
  return Math.min(
    PICKUP_CONFIG.maximumPickupY,
    Math.max(PICKUP_CONFIG.minimumPickupY, value),
  );
}
