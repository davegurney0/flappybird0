import {
  PICKUP_CONFIG,
  POWER_UP_ORDER,
  POWER_UP_TYPES,
  getPowerUpConfig,
} from "../config/pickupConfig.js";

function safeDelta(value) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export class PowerUpManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = new Map();
    this.collisionGraceRemainingMs = 0;
    return this.getSnapshot();
  }

  activate(type) {
    const config = getPowerUpConfig(type);

    if (!config) {
      return Object.freeze({
        activated: false,
        type,
        snapshot: this.getSnapshot(),
      });
    }

    const refreshed = this.active.has(type);
    this.active.set(type, config.durationMs);

    return Object.freeze({
      activated: true,
      refreshed,
      type,
      snapshot: this.getSnapshot(),
    });
  }

  update(delta) {
    const elapsed = safeDelta(delta);
    this.collisionGraceRemainingMs = Math.max(
      0,
      this.collisionGraceRemainingMs - elapsed,
    );

    for (const [type, remainingMs] of this.active.entries()) {
      const nextRemaining = remainingMs - elapsed;

      if (nextRemaining <= 0) {
        this.active.delete(type);
      } else {
        this.active.set(type, nextRemaining);
      }
    }

    return this.getSnapshot();
  }

  has(type) {
    return this.active.has(type);
  }

  consumeShield() {
    if (!this.has(POWER_UP_TYPES.shield)) {
      return false;
    }

    this.active.delete(POWER_UP_TYPES.shield);
    this.collisionGraceRemainingMs =
      PICKUP_CONFIG.shieldCollisionGraceMs;
    return true;
  }

  hasCollisionGrace() {
    return this.collisionGraceRemainingMs > 0;
  }

  getWorldTimeScale() {
    return this.has(POWER_UP_TYPES.slowMotion)
      ? getPowerUpConfig(POWER_UP_TYPES.slowMotion).worldTimeScale
      : 1;
  }

  getScoreMultiplier() {
    return this.has(POWER_UP_TYPES.doubleScore)
      ? getPowerUpConfig(POWER_UP_TYPES.doubleScore).scoreMultiplier
      : 1;
  }

  getMagnetDistance() {
    return this.has(POWER_UP_TYPES.coinMagnet)
      ? getPowerUpConfig(POWER_UP_TYPES.coinMagnet).magnetDistance
      : 0;
  }

  getSnapshot() {
    const active = POWER_UP_ORDER.filter((type) => this.has(type)).map(
      (type) => {
        const config = getPowerUpConfig(type);
        const remainingMs = this.active.get(type) ?? 0;

        return Object.freeze({
          type,
          label: config.label,
          color: config.color,
          remainingMs,
          durationMs: config.durationMs,
          remainingRatio: Math.max(
            0,
            Math.min(1, remainingMs / config.durationMs),
          ),
        });
      },
    );

    return Object.freeze({
      active: Object.freeze(active),
      collisionGraceRemainingMs:
        this.collisionGraceRemainingMs,
      worldTimeScale: this.getWorldTimeScale(),
      scoreMultiplier: this.getScoreMultiplier(),
      magnetDistance: this.getMagnetDistance(),
    });
  }
}
