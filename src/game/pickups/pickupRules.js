import {
  PICKUP_CONFIG,
  clampPickupY,
} from "../../config/pickupConfig.js";

export function createCoinSpawnPlan(
  spawnInfo,
  includeRiskCoin,
) {
  const safeY = clampPickupY(spawnInfo.safeY);
  const startX =
    spawnInfo.x -
    PICKUP_CONFIG.coinLeadDistance -
    PICKUP_CONFIG.coinSpacing *
      (PICKUP_CONFIG.coinPatternSize - 1);
  const coins = Array.from(
    { length: PICKUP_CONFIG.coinPatternSize },
    (_, index) =>
      Object.freeze({
        x: startX + index * PICKUP_CONFIG.coinSpacing,
        y: clampPickupY(
          safeY +
            Math.sin(
              (index / Math.max(1, PICKUP_CONFIG.coinPatternSize - 1)) *
                Math.PI,
            ) *
              8,
        ),
        value: PICKUP_CONFIG.standardCoinValue,
        risky: false,
      }),
  );

  if (includeRiskCoin && Number.isFinite(spawnInfo.riskY)) {
    coins.push(
      Object.freeze({
        x: spawnInfo.x - 38,
        y: clampPickupY(spawnInfo.riskY),
        value: PICKUP_CONFIG.riskyCoinValue,
        risky: true,
      }),
    );
  }

  return Object.freeze(coins);
}

export function canSpawnPowerUp({
  score,
  elapsedMs,
  obstacleCount,
  lastSpawnMs,
  lastSpawnObstacle,
}) {
  if (
    score < PICKUP_CONFIG.powerUpMinimumScore ||
    elapsedMs < PICKUP_CONFIG.powerUpEarliestMs
  ) {
    return false;
  }

  const obstacleGap =
    obstacleCount -
    (Number.isFinite(lastSpawnObstacle)
      ? lastSpawnObstacle
      : -Infinity);

  if (obstacleGap < PICKUP_CONFIG.powerUpMinimumObstacleGap) {
    return false;
  }

  if (
    Number.isFinite(lastSpawnMs) &&
    elapsedMs - lastSpawnMs <
      PICKUP_CONFIG.powerUpMinimumIntervalMs
  ) {
    return false;
  }

  return true;
}

export function isPowerUpPityDue(elapsedMs, lastSpawnMs) {
  const reference = Number.isFinite(lastSpawnMs)
    ? lastSpawnMs
    : 0;

  return elapsedMs - reference >= PICKUP_CONFIG.powerUpPityMs;
}
