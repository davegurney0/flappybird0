import assert from "node:assert/strict";
import test from "node:test";
import {
  DIFFICULTY_CONFIG,
  OBSTACLE_TYPES,
  ZONE_IDS,
} from "../src/config/difficultyConfig.js";
import { GAME_BALANCE } from "../src/config/gameBalance.js";
import {
  calculateSpawnDelay,
  getReachableGapCenter,
  getUnlockedObstacleTypes,
  isGatePassable,
  isTransitionAllowed,
} from "../src/game/obstacles/spawnRules.js";
import { SeededRandom } from "../src/utils/SeededRandom.js";

function asSet(values) {
  return new Set(values);
}

test("obstacle unlocks match every requested score band", () => {
  assert.deepEqual(
    asSet(getUnlockedObstacleTypes(9, ZONE_IDS.village)),
    asSet([OBSTACLE_TYPES.normal]),
  );
  assert.deepEqual(
    asSet(getUnlockedObstacleTypes(19, ZONE_IDS.evening)),
    asSet([OBSTACLE_TYPES.normal, OBSTACLE_TYPES.moving]),
  );
  assert.deepEqual(
    asSet(getUnlockedObstacleTypes(34, ZONE_IDS.nightCity)),
    asSet([
      OBSTACLE_TYPES.normal,
      OBSTACLE_TYPES.moving,
      OBSTACLE_TYPES.closing,
    ]),
  );
  assert.deepEqual(
    asSet(getUnlockedObstacleTypes(49, ZONE_IDS.nightCity)),
    asSet([
      OBSTACLE_TYPES.normal,
      OBSTACLE_TYPES.moving,
      OBSTACLE_TYPES.closing,
      OBSTACLE_TYPES.wind,
      OBSTACLE_TYPES.fan,
    ]),
  );
  assert.deepEqual(
    asSet(getUnlockedObstacleTypes(50, ZONE_IDS.storm)),
    asSet(Object.values(OBSTACLE_TYPES)),
  );
});

test("every dynamic gate remains inside the safe passage envelope", () => {
  assert.equal(
    isGatePassable(
      GAME_BALANCE.gapCenterMin,
      GAME_BALANCE.closingGateMinimumGap,
    ),
    true,
  );
  assert.equal(
    isGatePassable(
      GAME_BALANCE.gapCenterMax,
      GAME_BALANCE.closingGateMinimumGap,
    ),
    true,
  );

  const shifted = getReachableGapCenter({
    lastCenter: 340,
    randomValue: 1,
    maxShift: GAME_BALANCE.doubleGateMaxGapShift,
  });
  assert.equal(
    shifted - 340 <= GAME_BALANCE.doubleGateMaxGapShift,
    true,
  );
});

test("spacing calculation preserves distance as speed rises", () => {
  const extra = DIFFICULTY_CONFIG.extraSpacing[OBSTACLE_TYPES.laser];
  const delay = calculateSpawnDelay(
    GAME_BALANCE.minimumSpawnDistance,
    GAME_BALANCE.maxObstacleSpeed,
    extra,
  );
  const travelledDistance =
    GAME_BALANCE.maxObstacleSpeed * (delay / 1000);

  assert.equal(
    Math.round(travelledDistance),
    GAME_BALANCE.minimumSpawnDistance + extra,
  );
});

test("dangerous back-to-back combinations are rejected", () => {
  assert.equal(
    isTransitionAllowed(
      OBSTACLE_TYPES.wind,
      OBSTACLE_TYPES.laser,
    ),
    false,
  );
  assert.equal(
    isTransitionAllowed(
      OBSTACLE_TYPES.double,
      OBSTACLE_TYPES.closing,
    ),
    false,
  );
  assert.equal(
    isTransitionAllowed(
      OBSTACLE_TYPES.normal,
      OBSTACLE_TYPES.moving,
    ),
    true,
  );
});

test("controlled random streams are repeatable for the same seed", () => {
  const first = new SeededRandom(12345);
  const second = new SeededRandom(12345);

  const firstSequence = Array.from({ length: 8 }, () => first.next());
  const secondSequence = Array.from({ length: 8 }, () =>
    second.next(),
  );
  assert.deepEqual(firstSequence, secondSequence);
});

test("preallocated obstacle pools stay within a mobile-friendly budget", () => {
  const pooledPatterns = Object.values(
    DIFFICULTY_CONFIG.poolSize,
  ).reduce((total, size) => total + size, 0);

  assert.ok(pooledPatterns <= 16);
  assert.ok(pooledPatterns >= Object.keys(OBSTACLE_TYPES).length);
});
