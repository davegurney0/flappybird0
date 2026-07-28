import { DIFFICULTY_CONFIG } from "../config/difficultyConfig.js";
import { GAME_BALANCE } from "../config/gameBalance.js";

export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function getZoneForScore(
  score,
  zones = DIFFICULTY_CONFIG.zones,
) {
  const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
  let currentZone = zones[0];

  for (const zone of zones) {
    if (safeScore >= zone.minScore) {
      currentZone = zone;
    }
  }

  return currentZone;
}

export function calculateTargetDifficulty({
  score,
  elapsedSeconds,
  zone = getZoneForScore(score),
}) {
  const scoreProgress = clamp01(
    score / DIFFICULTY_CONFIG.scoreForMaximumDifficulty,
  );
  const timeProgress = clamp01(
    elapsedSeconds /
      DIFFICULTY_CONFIG.secondsForMaximumDifficulty,
  );

  return clamp01(
    scoreProgress * DIFFICULTY_CONFIG.scoreWeight +
      timeProgress * DIFFICULTY_CONFIG.timeWeight +
      zone.difficulty * DIFFICULTY_CONFIG.zoneWeight,
  );
}

export function smoothDifficulty(current, target, delta) {
  const safeDelta = Math.min(Math.max(delta, 0), 100);
  const blend =
    1 -
    Math.exp(
      -DIFFICULTY_CONFIG.smoothingPerSecond *
        (safeDelta / 1000),
    );

  return current + (target - current) * blend;
}

export function getDifficultyValues(difficulty) {
  const progress = clamp01(difficulty);

  return {
    worldSpeed:
      GAME_BALANCE.obstacleSpeed +
      (GAME_BALANCE.maxObstacleSpeed -
        GAME_BALANCE.obstacleSpeed) *
        progress,
    gapSize:
      GAME_BALANCE.gapSize -
      (GAME_BALANCE.gapSize - GAME_BALANCE.minimumGapSize) *
        progress,
    spawnDistance:
      GAME_BALANCE.spawnDistance -
      (GAME_BALANCE.spawnDistance -
        GAME_BALANCE.minimumSpawnDistance) *
        progress,
  };
}

export class DifficultyManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.elapsedSeconds = 0;
    this.difficulty = 0;
    this.score = 0;
    this.zone = getZoneForScore(0);
    this.snapshot = this.createSnapshot(false);
    return this.snapshot;
  }

  update(delta, score) {
    const safeDelta = Math.min(Math.max(delta, 0), 100);
    const previousZoneId = this.zone.id;

    this.elapsedSeconds += safeDelta / 1000;
    this.score = Math.max(0, Number.isFinite(score) ? score : 0);
    this.zone = getZoneForScore(this.score);

    const target = calculateTargetDifficulty({
      score: this.score,
      elapsedSeconds: this.elapsedSeconds,
      zone: this.zone,
    });
    this.difficulty = smoothDifficulty(
      this.difficulty,
      target,
      safeDelta,
    );
    this.snapshot = this.createSnapshot(
      previousZoneId !== this.zone.id,
    );
    return this.snapshot;
  }

  createSnapshot(zoneChanged) {
    return Object.freeze({
      score: this.score,
      elapsedSeconds: this.elapsedSeconds,
      value: this.difficulty,
      target: calculateTargetDifficulty({
        score: this.score,
        elapsedSeconds: this.elapsedSeconds,
        zone: this.zone,
      }),
      zone: this.zone,
      zoneChanged,
      ...getDifficultyValues(this.difficulty),
    });
  }

  getSnapshot() {
    return this.snapshot;
  }
}
