import assert from "node:assert/strict";
import test from "node:test";
import {
  PICKUP_CONFIG,
  POWER_UP_CONFIG,
  POWER_UP_ORDER,
  POWER_UP_TYPES,
} from "../src/config/pickupConfig.js";
import { PowerUpManager } from "../src/managers/PowerUpManager.js";

test("four power-ups have distinct identities and bounded durations", () => {
  assert.deepEqual(
    new Set(POWER_UP_ORDER),
    new Set(Object.values(POWER_UP_TYPES)),
  );
  assert.equal(
    new Set(
      POWER_UP_ORDER.map(
        (type) => POWER_UP_CONFIG[type].color,
      ),
    ).size,
    4,
  );

  for (const type of POWER_UP_ORDER) {
    const duration = POWER_UP_CONFIG[type].durationMs;
    assert.ok(duration >= 5_000);
    assert.ok(duration <= 14_000);
  }
});

test("slow motion affects world time without changing the bird controls", () => {
  const manager = new PowerUpManager();
  manager.activate(POWER_UP_TYPES.slowMotion);

  assert.equal(manager.getWorldTimeScale(), 0.62);
  assert.equal(manager.getScoreMultiplier(), 1);
  assert.equal(manager.getMagnetDistance(), 0);

  manager.update(
    POWER_UP_CONFIG[POWER_UP_TYPES.slowMotion].durationMs,
  );
  assert.equal(manager.getWorldTimeScale(), 1);
});

test("double score and coin magnet stay temporary and non-stacking", () => {
  const manager = new PowerUpManager();
  const first = manager.activate(POWER_UP_TYPES.doubleScore);
  const refreshed = manager.activate(
    POWER_UP_TYPES.doubleScore,
  );
  manager.activate(POWER_UP_TYPES.coinMagnet);

  assert.equal(first.refreshed, false);
  assert.equal(refreshed.refreshed, true);
  assert.equal(manager.getScoreMultiplier(), 2);
  assert.equal(
    manager.getMagnetDistance(),
    POWER_UP_CONFIG[POWER_UP_TYPES.coinMagnet].magnetDistance,
  );
  assert.equal(
    manager.getSnapshot().active.filter(
      (item) => item.type === POWER_UP_TYPES.doubleScore,
    ).length,
    1,
  );
});

test("shield blocks exactly one obstacle hit and grants short overlap grace", () => {
  const manager = new PowerUpManager();
  manager.activate(POWER_UP_TYPES.shield);

  assert.equal(manager.consumeShield(), true);
  assert.equal(manager.consumeShield(), false);
  assert.equal(manager.hasCollisionGrace(), true);
  assert.equal(
    manager.getSnapshot().collisionGraceRemainingMs,
    PICKUP_CONFIG.shieldCollisionGraceMs,
  );

  manager.update(PICKUP_CONFIG.shieldCollisionGraceMs);
  assert.equal(manager.hasCollisionGrace(), false);
});

test("reset clears every run-only power-up effect", () => {
  const manager = new PowerUpManager();
  POWER_UP_ORDER.forEach((type) => manager.activate(type));

  const snapshot = manager.reset();
  assert.equal(snapshot.active.length, 0);
  assert.equal(snapshot.worldTimeScale, 1);
  assert.equal(snapshot.scoreMultiplier, 1);
  assert.equal(snapshot.magnetDistance, 0);
});
