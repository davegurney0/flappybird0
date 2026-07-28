import assert from "node:assert/strict";
import test from "node:test";
import { GAME_BALANCE } from "../src/config/gameBalance.js";
import {
  PICKUP_CONFIG,
  clampPickupY,
} from "../src/config/pickupConfig.js";
import {
  createDefaultSave,
  SAVE_STORAGE_KEY,
} from "../src/config/saveConfig.js";
import {
  canSpawnPowerUp,
  createCoinSpawnPlan,
  isPowerUpPityDue,
} from "../src/game/pickups/pickupRules.js";
import { ScoreManager } from "../src/managers/ScoreManager.js";
import { SaveManager } from "../src/managers/SaveManager.js";
import { WalletManager } from "../src/managers/WalletManager.js";

test("coin plans keep normal coins safe and mark risk coins with extra value", () => {
  const plan = createCoinSpawnPlan(
    {
      x: 520,
      safeY: 340,
      riskY: 405,
    },
    true,
  );
  const standardCoins = plan.filter((coin) => !coin.risky);
  const riskCoins = plan.filter((coin) => coin.risky);

  assert.equal(
    standardCoins.length,
    PICKUP_CONFIG.coinPatternSize,
  );
  assert.equal(riskCoins.length, 1);
  assert.equal(
    standardCoins.every(
      (coin) => coin.value === PICKUP_CONFIG.standardCoinValue,
    ),
    true,
  );
  assert.equal(
    riskCoins[0].value,
    PICKUP_CONFIG.riskyCoinValue,
  );
  assert.ok(
    riskCoins[0].value > PICKUP_CONFIG.standardCoinValue,
  );
});

test("pickup paths stay within the playable vertical envelope", () => {
  assert.equal(
    clampPickupY(-500),
    PICKUP_CONFIG.minimumPickupY,
  );
  assert.equal(
    clampPickupY(5_000),
    PICKUP_CONFIG.maximumPickupY,
  );
  assert.ok(
    PICKUP_CONFIG.minimumPickupY >
      GAME_BALANCE.ceilingDeathY + GAME_BALANCE.birdRadius,
  );
  assert.ok(
    PICKUP_CONFIG.maximumPickupY <
      GAME_BALANCE.groundY - GAME_BALANCE.birdRadius,
  );
});

test("power-ups cannot spawn early or back-to-back", () => {
  const base = {
    score: PICKUP_CONFIG.powerUpMinimumScore,
    elapsedMs: PICKUP_CONFIG.powerUpEarliestMs,
    obstacleCount: 10,
    lastSpawnMs: null,
    lastSpawnObstacle: null,
  };

  assert.equal(
    canSpawnPowerUp({
      ...base,
      score: PICKUP_CONFIG.powerUpMinimumScore - 1,
    }),
    false,
  );
  assert.equal(canSpawnPowerUp(base), true);
  assert.equal(
    canSpawnPowerUp({
      ...base,
      elapsedMs:
        PICKUP_CONFIG.powerUpEarliestMs +
        PICKUP_CONFIG.powerUpMinimumIntervalMs -
        1,
      lastSpawnMs: PICKUP_CONFIG.powerUpEarliestMs,
      lastSpawnObstacle: 7,
    }),
    false,
  );
  assert.equal(
    isPowerUpPityDue(PICKUP_CONFIG.powerUpPityMs, null),
    true,
  );
});

test("wallet commits collected coins once at run end", () => {
  const initialSave = {
    ...createDefaultSave(),
    coins: 11,
  };
  const store = new Map([
    [SAVE_STORAGE_KEY, JSON.stringify(initialSave)],
  ]);
  const storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
  const saveManager = new SaveManager({ storage });
  const wallet = new WalletManager({ saveManager });

  wallet.collect(PICKUP_CONFIG.standardCoinValue);
  wallet.collect(PICKUP_CONFIG.riskyCoinValue);
  const firstCommit = wallet.commitRun();
  const duplicateCommit = wallet.commitRun();

  assert.equal(firstCommit.added, 4);
  assert.equal(firstCommit.balance, 15);
  assert.equal(duplicateCommit.added, 0);
  assert.equal(duplicateCommit.balance, 15);
  assert.equal(
    JSON.parse(store.get(SAVE_STORAGE_KEY)).coins,
    15,
  );
});

test("double-score increments obstacle score by two", () => {
  const score = new ScoreManager();

  assert.equal(score.increment(2), 2);
  assert.equal(score.increment(), 3);
});

test("pickup pools stay inside a mobile-friendly object budget", () => {
  const totalPickups =
    PICKUP_CONFIG.coinPoolSize +
    PICKUP_CONFIG.powerUpPoolPerType * 4;

  assert.ok(totalPickups <= 48);
  assert.ok(PICKUP_CONFIG.coinPoolSize >= 24);
});
