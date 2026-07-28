import {
  PICKUP_CONFIG,
  POWER_UP_ORDER,
} from "../config/pickupConfig.js";
import { CoinPickup } from "../game/pickups/CoinPickup.js";
import { PickupPool } from "../game/pickups/PickupPool.js";
import { PowerUpPickup } from "../game/pickups/PowerUpPickup.js";
import {
  canSpawnPowerUp,
  createCoinSpawnPlan,
  isPowerUpPityDue,
} from "../game/pickups/pickupRules.js";
import { SeededRandom } from "../utils/SeededRandom.js";

export class PickupSystem {
  constructor(
    scene,
    player,
    { onCoinCollected, onPowerUpCollected },
  ) {
    this.scene = scene;
    this.onCoinCollected = onCoinCollected;
    this.onPowerUpCollected = onPowerUpCollected;
    this.colliderGroup = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.coinPool = new PickupPool(
      PICKUP_CONFIG.coinPoolSize,
      () => new CoinPickup(scene, this.colliderGroup),
    );
    this.powerUpPools = Object.fromEntries(
      POWER_UP_ORDER.map((type) => [
        type,
        new PickupPool(
          PICKUP_CONFIG.powerUpPoolPerType,
          () =>
            new PowerUpPickup(
              scene,
              this.colliderGroup,
              type,
            ),
        ),
      ]),
    );
    this.random = new SeededRandom(Date.now() ^ 0x51f15e);
    this.overlap = scene.physics.add.overlap(
      player,
      this.colliderGroup,
      (_bird, collider) =>
        this.handleCollected(collider.pickupOwner),
    );
    this.reset();
  }

  reset() {
    this.elapsedMs = 0;
    this.obstacleCount = 0;
    this.lastPowerUpSpawnMs = null;
    this.lastPowerUpSpawnObstacle = null;
    this.lastPowerUpType = null;
    this.coinPool.reset();
    Object.values(this.powerUpPools).forEach((pool) =>
      pool.reset(),
    );
    this.random.reseed(Date.now() ^ (performance.now() * 1000));
  }

  handleCollected(pickup) {
    if (!pickup?.active) {
      return;
    }

    const result = pickup.collect();

    if (!result) {
      return;
    }

    if ("value" in result) {
      this.onCoinCollected?.(result);
    } else {
      this.onPowerUpCollected?.(result);
    }
  }

  spawnCoinPattern(spawnInfo, score) {
    const includeRiskCoin =
      score >= PICKUP_CONFIG.riskCoinMinimumScore &&
      this.random.next() < PICKUP_CONFIG.riskCoinChance;
    const plan = createCoinSpawnPlan(
      spawnInfo,
      includeRiskCoin,
    );

    for (const coinPlan of plan) {
      const coin = this.coinPool.acquire();

      if (!coin) {
        break;
      }

      coin.activate(coinPlan);
    }
  }

  selectPowerUpType() {
    const availableTypes = POWER_UP_ORDER.filter(
      (type) => this.powerUpPools[type].hasAvailable(),
    );
    const nonRepeating =
      availableTypes.length > 1
        ? availableTypes.filter(
            (type) => type !== this.lastPowerUpType,
          )
        : availableTypes;

    if (nonRepeating.length === 0) {
      return null;
    }

    return nonRepeating[
      this.random.integerBetween(0, nonRepeating.length - 1)
    ];
  }

  trySpawnPowerUp(spawnInfo, score) {
    const eligible = canSpawnPowerUp({
      score,
      elapsedMs: this.elapsedMs,
      obstacleCount: this.obstacleCount,
      lastSpawnMs: this.lastPowerUpSpawnMs,
      lastSpawnObstacle: this.lastPowerUpSpawnObstacle,
    });

    if (!eligible) {
      return false;
    }

    const pityDue = isPowerUpPityDue(
      this.elapsedMs,
      this.lastPowerUpSpawnMs,
    );

    if (
      !pityDue &&
      this.random.next() >= PICKUP_CONFIG.powerUpChance
    ) {
      return false;
    }

    const type = this.selectPowerUpType();
    const pickup = type
      ? this.powerUpPools[type].acquire()
      : null;

    if (!pickup) {
      return false;
    }

    pickup.activate({
      x: spawnInfo.x - PICKUP_CONFIG.powerUpLeadDistance,
      y: spawnInfo.safeY,
    });
    this.lastPowerUpSpawnMs = this.elapsedMs;
    this.lastPowerUpSpawnObstacle = this.obstacleCount;
    this.lastPowerUpType = type;
    return true;
  }

  handleObstacleSpawned(spawnInfo, difficulty) {
    if (!spawnInfo) {
      return;
    }

    this.obstacleCount += 1;
    const score = difficulty?.score ?? 0;

    if (this.trySpawnPowerUp(spawnInfo, score)) {
      return;
    }

    if (
      (this.obstacleCount - 1) %
        PICKUP_CONFIG.coinPatternEveryObstacles ===
      0
    ) {
      this.spawnCoinPattern(spawnInfo, score);
    }
  }

  update(
    delta,
    {
      realDelta,
      bird,
      speed,
      motionEnabled,
      magnetDistance,
    },
  ) {
    if (motionEnabled) {
      this.elapsedMs += Math.min(
        100,
        Math.max(0, realDelta),
      );
    }

    const context = {
      delta,
      bird,
      speed,
      motionEnabled,
      magnetDistance,
    };
    this.coinPool.update(context);
    Object.values(this.powerUpPools).forEach((pool) =>
      pool.update(context),
    );
  }

  shutdown() {
    this.overlap?.destroy();
    this.coinPool.shutdown();
    Object.values(this.powerUpPools).forEach((pool) =>
      pool.shutdown(),
    );
    this.onCoinCollected = null;
    this.onPowerUpCollected = null;
  }
}
