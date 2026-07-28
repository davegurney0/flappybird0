import { GAME_SIZE } from "../../config/constants.js";
import {
  DIFFICULTY_CONFIG,
  OBSTACLE_TYPES,
} from "../../config/difficultyConfig.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";
import { SeededRandom } from "../../utils/SeededRandom.js";
import { DoubleGateObstacle } from "./DoubleGateObstacle.js";
import { FanObstacle } from "./FanObstacle.js";
import { GateObstacle } from "./GateObstacle.js";
import { ObstaclePool } from "./ObstaclePool.js";
import {
  calculateSpawnDelay,
  getReachableGapCenter,
  getUnlockedObstacleTypes,
  getUnlockWeight,
  isGatePassable,
  isTransitionAllowed,
} from "./spawnRules.js";
import { WindZoneObstacle } from "./WindZoneObstacle.js";

export class ObstacleSpawner {
  constructor(scene, { onPassed, onSpawned, applyWind }) {
    this.scene = scene;
    this.onPassed = onPassed;
    this.onSpawned = onSpawned;
    this.applyWind = applyWind;
    this.colliderGroup = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.random = new SeededRandom(Date.now());
    this.pools = this.createPools(scene);
    this.reset();
  }

  createPools(scene) {
    const size = DIFFICULTY_CONFIG.poolSize;

    return {
      [OBSTACLE_TYPES.normal]: new ObstaclePool(
        size[OBSTACLE_TYPES.normal],
        () =>
          new GateObstacle(
            scene,
            this.colliderGroup,
            OBSTACLE_TYPES.normal,
          ),
      ),
      [OBSTACLE_TYPES.moving]: new ObstaclePool(
        size[OBSTACLE_TYPES.moving],
        () =>
          new GateObstacle(
            scene,
            this.colliderGroup,
            OBSTACLE_TYPES.moving,
          ),
      ),
      [OBSTACLE_TYPES.closing]: new ObstaclePool(
        size[OBSTACLE_TYPES.closing],
        () =>
          new GateObstacle(
            scene,
            this.colliderGroup,
            OBSTACLE_TYPES.closing,
          ),
      ),
      [OBSTACLE_TYPES.double]: new ObstaclePool(
        size[OBSTACLE_TYPES.double],
        () => new DoubleGateObstacle(scene, this.colliderGroup),
      ),
      [OBSTACLE_TYPES.wind]: new ObstaclePool(
        size[OBSTACLE_TYPES.wind],
        () => new WindZoneObstacle(scene),
      ),
      [OBSTACLE_TYPES.fan]: new ObstaclePool(
        size[OBSTACLE_TYPES.fan],
        () => new FanObstacle(scene, this.colliderGroup),
      ),
      [OBSTACLE_TYPES.laser]: new ObstaclePool(
        size[OBSTACLE_TYPES.laser],
        () =>
          new GateObstacle(
            scene,
            this.colliderGroup,
            OBSTACLE_TYPES.laser,
          ),
      ),
    };
  }

  start() {
    this.running = true;
    this.timeUntilNextSpawn = GAME_BALANCE.firstSpawnDelay;
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.running = false;
    this.timeUntilNextSpawn = GAME_BALANCE.firstSpawnDelay;
    this.lastGapCenter = null;
    this.lastWindDirection = 0;
    this.windDirectionRepeats = 0;
    this.spawnIndex = 0;
    this.history = [];
    this.lastUsedAt = new Map();
    Object.values(this.pools ?? {}).forEach((pool) => pool.reset());
    this.random?.reseed(Date.now() ^ (performance.now() * 1000));
  }

  hasAvailable(type) {
    return this.pools[type]?.hasAvailable() ?? false;
  }

  getConsecutiveCount(type) {
    let count = 0;

    for (let index = this.history.length - 1; index >= 0; index -= 1) {
      if (this.history[index] !== type) {
        break;
      }
      count += 1;
    }

    return count;
  }

  isOffCooldown(type) {
    const lastUsed = this.lastUsedAt.get(type);

    if (!Number.isFinite(lastUsed)) {
      return true;
    }

    return (
      this.spawnIndex - lastUsed >
      DIFFICULTY_CONFIG.cooldownSpawns[type]
    );
  }

  getCandidateEntries(difficulty) {
    const previousType = this.history.at(-1) ?? null;
    const unlocked = getUnlockedObstacleTypes(
      difficulty.score,
      difficulty.zone.id,
    );

    return unlocked
      .filter((type) => this.hasAvailable(type))
      .filter((type) => isTransitionAllowed(previousType, type))
      .filter((type) => this.isOffCooldown(type))
      .filter(
        (type) =>
          this.getConsecutiveCount(type) <
          DIFFICULTY_CONFIG.maxConsecutive[type],
      )
      .map((type) => ({
        value: type,
        weight: getUnlockWeight(
          type,
          difficulty.score,
          difficulty.value,
        ),
      }));
  }

  selectType(difficulty) {
    let candidates = this.getCandidateEntries(difficulty);

    if (candidates.length === 0 && this.hasAvailable(OBSTACLE_TYPES.normal)) {
      candidates = [
        {
          value: OBSTACLE_TYPES.normal,
          weight: 1,
        },
      ];
    }

    return this.random.weightedPick(candidates);
  }

  getNextGapCenter(difficulty, maxShiftMultiplier = 1) {
    const speedProgress =
      (difficulty.worldSpeed - GAME_BALANCE.obstacleSpeed) /
      (GAME_BALANCE.maxObstacleSpeed -
        GAME_BALANCE.obstacleSpeed);
    const maxShift =
      (GAME_BALANCE.maxGapCenterShift +
        (GAME_BALANCE.dynamicMaxGapCenterShift -
          GAME_BALANCE.maxGapCenterShift) *
          Math.max(0, Math.min(1, speedProgress))) *
      maxShiftMultiplier;
    const center = getReachableGapCenter({
      lastCenter: this.lastGapCenter,
      randomValue: this.random.next(),
      maxShift,
    });

    this.lastGapCenter = center;
    return center;
  }

  getWindDirection() {
    let direction = this.random.next() < 0.5 ? -1 : 1;

    if (
      direction === this.lastWindDirection &&
      this.windDirectionRepeats >= 1
    ) {
      direction *= -1;
    }

    if (direction === this.lastWindDirection) {
      this.windDirectionRepeats += 1;
    } else {
      this.lastWindDirection = direction;
      this.windDirectionRepeats = 1;
    }

    return direction;
  }

  getFanPattern() {
    const topDistance = Math.abs(
      (this.lastGapCenter ?? GAME_BALANCE.fanSafeBottomRouteY) -
        GAME_BALANCE.fanSafeBottomRouteY,
    );
    const bottomDistance = Math.abs(
      (this.lastGapCenter ?? GAME_BALANCE.fanSafeTopRouteY) -
        GAME_BALANCE.fanSafeTopRouteY,
    );
    const useTopAnchor =
      topDistance < bottomDistance ||
      (topDistance === bottomDistance && this.random.next() < 0.5);
    const anchor = useTopAnchor ? "top" : "bottom";

    this.lastGapCenter = useTopAnchor
      ? GAME_BALANCE.fanSafeBottomRouteY
      : GAME_BALANCE.fanSafeTopRouteY;

    return {
      anchor,
      rotationDirection: this.random.next() < 0.5 ? -1 : 1,
    };
  }

  ensurePassableGate(gapCenter, gapSize, minimumCycleGap = gapSize) {
    if (isGatePassable(gapCenter, minimumCycleGap)) {
      return { gapCenter, gapSize };
    }

    return {
      gapCenter:
        (GAME_BALANCE.gapCenterMin +
          GAME_BALANCE.gapCenterMax) /
        2,
      gapSize: Math.max(
        gapSize,
        GAME_BALANCE.closingGateMinimumGap,
      ),
    };
  }

  activateObstacle(type, obstacle, difficulty) {
    const gateX =
      GAME_SIZE.width + GAME_BALANCE.obstacleWidth;
    const generousGap = Math.min(
      GAME_BALANCE.gapSize,
      difficulty.gapSize + 10,
    );

    if (type === OBSTACLE_TYPES.wind) {
      const x = GAME_SIZE.width + GAME_BALANCE.windZoneWidth / 2;
      const direction = this.getWindDirection();
      obstacle.activate({
        x,
        direction,
        zoneId: difficulty.zone.id,
      });
      return Object.freeze({
        type,
        x,
        safeY:
          (GAME_BALANCE.windZoneTop +
            GAME_BALANCE.windZoneBottom) /
          2,
        riskY: null,
        zoneId: difficulty.zone.id,
      });
    }

    if (type === OBSTACLE_TYPES.fan) {
      const x = GAME_SIZE.width + GAME_BALANCE.fanRadius + 16;
      const fanPattern = this.getFanPattern();
      const safeY =
        fanPattern.anchor === "top"
          ? GAME_BALANCE.fanSafeBottomRouteY
          : GAME_BALANCE.fanSafeTopRouteY;
      const riskY =
        fanPattern.anchor === "top"
          ? GAME_BALANCE.fanTopY +
            GAME_BALANCE.fanRadius +
            GAME_BALANCE.birdRadius +
            14
          : GAME_BALANCE.fanBottomY -
            GAME_BALANCE.fanRadius -
            GAME_BALANCE.birdRadius -
            14;
      obstacle.activate({
        x,
        ...fanPattern,
        zoneId: difficulty.zone.id,
      });
      return Object.freeze({
        type,
        x,
        safeY,
        riskY,
        zoneId: difficulty.zone.id,
      });
    }

    const proposedGapCenter = this.getNextGapCenter(
      difficulty,
      type === OBSTACLE_TYPES.double ? 0.72 : 1,
    );

    if (type === OBSTACLE_TYPES.double) {
      const firstPlan = this.ensurePassableGate(
        proposedGapCenter,
        generousGap,
      );
      const proposedSecondGapCenter = getReachableGapCenter({
        lastCenter: firstPlan.gapCenter,
        randomValue: this.random.next(),
        maxShift: GAME_BALANCE.doubleGateMaxGapShift,
      });
      const secondPlan = this.ensurePassableGate(
        proposedSecondGapCenter,
        generousGap,
      );
      this.lastGapCenter = secondPlan.gapCenter;
      obstacle.activate({
        x: gateX,
        gapCenter: firstPlan.gapCenter,
        secondGapCenter: secondPlan.gapCenter,
        gapSize: firstPlan.gapSize,
        zoneId: difficulty.zone.id,
      });
      const riskOffset = Math.max(
        20,
        firstPlan.gapSize / 2 -
          GAME_BALANCE.birdRadius -
          15,
      );
      return Object.freeze({
        type,
        x: gateX,
        safeY: firstPlan.gapCenter,
        riskY:
          firstPlan.gapCenter +
          (this.random.next() < 0.5 ? -1 : 1) * riskOffset,
        zoneId: difficulty.zone.id,
      });
    }

    const configuredGapSize =
      type === OBSTACLE_TYPES.closing ||
      type === OBSTACLE_TYPES.laser
        ? generousGap
        : difficulty.gapSize;
    const gatePlan = this.ensurePassableGate(
      proposedGapCenter,
      configuredGapSize,
      type === OBSTACLE_TYPES.closing
        ? GAME_BALANCE.closingGateMinimumGap
        : configuredGapSize,
    );
    this.lastGapCenter = gatePlan.gapCenter;
    obstacle.activate({
      x: gateX,
      gapCenter: gatePlan.gapCenter,
      gapSize: gatePlan.gapSize,
      phase:
        type === OBSTACLE_TYPES.moving
          ? this.random.between(-0.5, 0.5)
          : 0,
      zoneId: difficulty.zone.id,
    });
    const effectiveRiskGap =
      type === OBSTACLE_TYPES.closing
        ? GAME_BALANCE.closingGateMinimumGap
        : gatePlan.gapSize;
    const movingAllowance =
      type === OBSTACLE_TYPES.moving
        ? GAME_BALANCE.movingGateAmplitude
        : 0;
    const riskOffset = Math.max(
      20,
      effectiveRiskGap / 2 -
        GAME_BALANCE.birdRadius -
        movingAllowance -
        15,
    );
    return Object.freeze({
      type,
      x: gateX,
      safeY: gatePlan.gapCenter,
      riskY:
        gatePlan.gapCenter +
        (this.random.next() < 0.5 ? -1 : 1) * riskOffset,
      zoneId: difficulty.zone.id,
    });
  }

  spawn(difficulty) {
    const type = this.selectType(difficulty);

    if (!type) {
      return null;
    }

    const obstacle = this.pools[type].acquire();

    if (!obstacle) {
      return null;
    }

    const spawnInfo = this.activateObstacle(
      type,
      obstacle,
      difficulty,
    );
    this.history.push(type);
    this.history = this.history.slice(-8);
    this.lastUsedAt.set(type, this.spawnIndex);
    this.spawnIndex += 1;
    this.onSpawned?.(spawnInfo, difficulty);
    return type;
  }

  update(delta, { bird, difficulty }) {
    const context = {
      delta,
      bird,
      birdX: bird?.x ?? GAME_BALANCE.birdStartX,
      speed: difficulty.worldSpeed,
      motionEnabled: this.running,
      difficulty: difficulty.value,
      onPassed: this.onPassed,
      applyWind: this.applyWind,
    };

    Object.values(this.pools).forEach((pool) =>
      pool.update(context),
    );

    if (!this.running) {
      return;
    }

    this.timeUntilNextSpawn -= Math.min(Math.max(delta, 0), 50);

    if (this.timeUntilNextSpawn > 0) {
      return;
    }

    const spawnedType = this.spawn(difficulty);

    if (!spawnedType) {
      this.timeUntilNextSpawn = 120;
      return;
    }

    this.timeUntilNextSpawn = calculateSpawnDelay(
      difficulty.spawnDistance,
      difficulty.worldSpeed,
      DIFFICULTY_CONFIG.extraSpacing[spawnedType],
    );
  }

  shutdown() {
    this.reset();
    Object.values(this.pools).forEach((pool) => pool.shutdown());
    this.onPassed = null;
    this.onSpawned = null;
    this.applyWind = null;
  }
}
