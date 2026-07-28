import assert from "node:assert/strict";
import test from "node:test";
import {
  DIFFICULTY_CONFIG,
  ZONE_IDS,
} from "../src/config/difficultyConfig.js";
import { GAME_BALANCE } from "../src/config/gameBalance.js";
import {
  DifficultyManager,
  getDifficultyValues,
  getZoneForScore,
} from "../src/managers/DifficultyManager.js";

test("zone thresholds follow the configured score progression", () => {
  assert.equal(getZoneForScore(0).id, ZONE_IDS.village);
  assert.equal(getZoneForScore(14).id, ZONE_IDS.village);
  assert.equal(getZoneForScore(15).id, ZONE_IDS.evening);
  assert.equal(getZoneForScore(29).id, ZONE_IDS.evening);
  assert.equal(getZoneForScore(30).id, ZONE_IDS.nightCity);
  assert.equal(getZoneForScore(49).id, ZONE_IDS.nightCity);
  assert.equal(getZoneForScore(50).id, ZONE_IDS.storm);
  assert.equal(getZoneForScore(74).id, ZONE_IDS.storm);
  assert.equal(getZoneForScore(75).id, ZONE_IDS.space);
});

test("difficulty reacts smoothly instead of jumping at a score threshold", () => {
  const manager = new DifficultyManager();
  const before = manager.getSnapshot();
  const afterThreshold = manager.update(16, 50);

  assert.ok(afterThreshold.target > before.target);
  assert.ok(afterThreshold.value > before.value);
  assert.ok(
    afterThreshold.worldSpeed - before.worldSpeed < 2,
    "one frame cannot create a sudden world-speed jump",
  );
});

test("world speed and gap size stay inside their hard caps", () => {
  const maximum = getDifficultyValues(1);
  const aboveMaximum = getDifficultyValues(999);

  assert.equal(maximum.worldSpeed, GAME_BALANCE.maxObstacleSpeed);
  assert.equal(
    aboveMaximum.worldSpeed,
    GAME_BALANCE.maxObstacleSpeed,
  );
  assert.equal(maximum.gapSize, GAME_BALANCE.minimumGapSize);
  assert.ok(maximum.spawnDistance >= GAME_BALANCE.minimumSpawnDistance);
});

test("difficulty config keeps all three progression inputs active", () => {
  assert.ok(DIFFICULTY_CONFIG.scoreWeight > 0);
  assert.ok(DIFFICULTY_CONFIG.timeWeight > 0);
  assert.ok(DIFFICULTY_CONFIG.zoneWeight > 0);
  assert.equal(
    DIFFICULTY_CONFIG.scoreWeight +
      DIFFICULTY_CONFIG.timeWeight +
      DIFFICULTY_CONFIG.zoneWeight,
    1,
  );
});
