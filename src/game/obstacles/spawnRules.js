import {
  DIFFICULTY_CONFIG,
  OBSTACLE_TYPES,
} from "../../config/difficultyConfig.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";
import { getZoneRank } from "../../config/zoneConfig.js";

export function getUnlockedObstacleTypes(score, zoneId) {
  const zoneRank = getZoneRank(zoneId);

  return Object.values(OBSTACLE_TYPES).filter((type) => {
    const unlockScore =
      DIFFICULTY_CONFIG.obstacleUnlockScore[type];
    const minimumZone =
      DIFFICULTY_CONFIG.obstacleMinimumZone[type];

    return (
      score >= unlockScore &&
      zoneRank >= getZoneRank(minimumZone)
    );
  });
}

export function isTransitionAllowed(previousType, nextType) {
  if (!previousType) {
    return true;
  }

  return !(
    DIFFICULTY_CONFIG.forbiddenTransitions[previousType] ?? []
  ).includes(nextType);
}

export function getSafeGapBounds() {
  return {
    min: GAME_BALANCE.gapCenterMin,
    max: GAME_BALANCE.gapCenterMax,
  };
}

export function getReachableGapCenter({
  lastCenter,
  randomValue,
  maxShift = GAME_BALANCE.maxGapCenterShift,
}) {
  const { min, max } = getSafeGapBounds();
  const unit = Math.min(1, Math.max(0, randomValue));

  if (!Number.isFinite(lastCenter)) {
    return min + (max - min) * unit;
  }

  const proposed =
    lastCenter + (unit * 2 - 1) * Math.max(0, maxShift);
  return Math.min(max, Math.max(min, proposed));
}

export function isGatePassable(gapCenter, gapSize) {
  const birdDiameter = GAME_BALANCE.birdRadius * 2;
  const topHeight = gapCenter - gapSize / 2;
  const bottomStart = gapCenter + gapSize / 2;
  const bottomHeight = GAME_BALANCE.groundY - bottomStart;

  return (
    gapSize >= GAME_BALANCE.closingGateMinimumGap &&
    topHeight > birdDiameter &&
    bottomHeight > birdDiameter &&
    gapCenter >= GAME_BALANCE.gapCenterMin &&
    gapCenter <= GAME_BALANCE.gapCenterMax
  );
}

export function calculateSpawnDelay(
  spawnDistance,
  worldSpeed,
  extraSpacing = 0,
) {
  const safeSpeed = Math.max(1, worldSpeed);
  return ((spawnDistance + Math.max(0, extraSpacing)) / safeSpeed) * 1000;
}

export function getUnlockWeight(type, score, difficulty) {
  if (type === OBSTACLE_TYPES.normal) {
    return DIFFICULTY_CONFIG.obstacleWeights[type];
  }

  const unlockScore =
    DIFFICULTY_CONFIG.obstacleUnlockScore[type];
  const ramp = Math.min(
    1,
    Math.max(
      0.18,
      (score - unlockScore + 1) /
        DIFFICULTY_CONFIG.unlockRampScore,
    ),
  );
  const difficultyBoost = 0.82 + Math.max(0, difficulty) * 0.38;

  return (
    DIFFICULTY_CONFIG.obstacleWeights[type] *
    ramp *
    difficultyBoost
  );
}
