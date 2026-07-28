import { MENU_ACHIEVEMENTS } from "../config/menuConfig.js";
import { getSaveManager } from "./SaveManager.js";

const PROFILE_FLUSH_INTERVAL = 4_000;

function toPositiveInteger(value) {
  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function getMetricValue(save, metric) {
  if (metric === "highScore") {
    return save.bestScore;
  }

  if (metric === "coinBalance") {
    return save.coins;
  }

  return toPositiveInteger(save[metric]);
}

function updateProgressMap(save, key, definitions) {
  const previous = save[key] ?? {};
  const next = { ...previous };

  for (const definition of definitions) {
    const progress = Math.min(
      getMetricValue(save, definition.metric),
      definition.target,
    );
    const oldEntry = previous[definition.id] ?? {};
    const completed = progress >= definition.target;

    next[definition.id] = {
      progress,
      completed,
      claimed: Boolean(oldEntry.claimed),
      ...(completed && oldEntry.completedAt
        ? { completedAt: oldEntry.completedAt }
        : {}),
    };
  }

  save[key] = next;
}

function syncDerivedProgress(save) {
  updateProgressMap(
    save,
    "achievements",
    MENU_ACHIEVEMENTS,
  );
}

export class PlayerProfileManager {
  constructor({
    saveManager = getSaveManager(),
    flushInterval = PROFILE_FLUSH_INTERVAL,
  } = {}) {
    this.saveManager = saveManager;
    this.flushInterval = flushInterval;
    this.pending = this.createPending();
    this.elapsedSinceFlush = 0;
  }

  createPending() {
    return {
      totalDeaths: 0,
      totalFlaps: 0,
      totalCoinsCollected: 0,
      totalObstaclesPassed: 0,
      playTime: 0,
      highestEvolution: 1,
    };
  }

  recordGameStarted() {
    return this.saveManager.update((save) => {
      save.totalGames += 1;
      syncDerivedProgress(save);
    });
  }

  recordFlap() {
    this.pending.totalFlaps += 1;
  }

  recordCoinCollected(value) {
    this.pending.totalCoinsCollected += toPositiveInteger(value);
  }

  recordObstaclePassed(evolutionLevel = 1) {
    this.pending.totalObstaclesPassed += 1;
    this.pending.highestEvolution = Math.max(
      this.pending.highestEvolution,
      toPositiveInteger(evolutionLevel) || 1,
    );
  }

  recordDeath() {
    this.pending.totalDeaths += 1;
    return this.flush();
  }

  update(delta) {
    const safeDelta = toPositiveInteger(delta);

    if (safeDelta === 0) {
      return;
    }

    this.pending.playTime += safeDelta;
    this.elapsedSinceFlush += safeDelta;

    if (this.elapsedSinceFlush >= this.flushInterval) {
      this.flush();
    }
  }

  flush() {
    const pending = { ...this.pending };
    const hasChanges = Object.entries(pending).some(
      ([key, value]) =>
        key !== "highestEvolution"
          ? value > 0
          : value > 1,
    );

    if (!hasChanges) {
      this.elapsedSinceFlush = 0;
      return Object.freeze({
        ok: true,
        persisted: true,
        snapshot: this.saveManager.getSnapshot(),
      });
    }

    const result = this.saveManager.update((save) => {
      save.totalDeaths += pending.totalDeaths;
      save.totalFlaps += pending.totalFlaps;
      save.totalCoinsCollected +=
        pending.totalCoinsCollected;
      save.totalObstaclesPassed +=
        pending.totalObstaclesPassed;
      save.playTime += pending.playTime;
      save.highestEvolution = Math.max(
        save.highestEvolution,
        pending.highestEvolution,
      );
      syncDerivedProgress(save);
    });

    if (result.ok) {
      this.pending = this.createPending();
      this.elapsedSinceFlush = 0;
    }

    return result;
  }
}
