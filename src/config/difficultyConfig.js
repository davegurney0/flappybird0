import {
  WORLD_ZONES,
  ZONE_IDS,
} from "./zoneConfig.js";

export { ZONE_IDS };

export const OBSTACLE_TYPES = Object.freeze({
  normal: "normal",
  moving: "moving",
  closing: "closing",
  double: "double",
  wind: "wind",
  fan: "fan",
  laser: "laser",
});

export const DIFFICULTY_CONFIG = Object.freeze({
  scoreForMaximumDifficulty: 78,
  secondsForMaximumDifficulty: 165,
  scoreWeight: 0.62,
  timeWeight: 0.23,
  zoneWeight: 0.15,
  smoothingPerSecond: 0.82,

  zones: WORLD_ZONES,

  obstacleUnlockScore: Object.freeze({
    [OBSTACLE_TYPES.normal]: 0,
    [OBSTACLE_TYPES.moving]: 10,
    [OBSTACLE_TYPES.closing]: 20,
    [OBSTACLE_TYPES.wind]: 35,
    [OBSTACLE_TYPES.fan]: 35,
    [OBSTACLE_TYPES.double]: 50,
    [OBSTACLE_TYPES.laser]: 50,
  }),

  obstacleMinimumZone: Object.freeze({
    [OBSTACLE_TYPES.normal]: ZONE_IDS.village,
    [OBSTACLE_TYPES.moving]: ZONE_IDS.village,
    [OBSTACLE_TYPES.closing]: ZONE_IDS.evening,
    [OBSTACLE_TYPES.wind]: ZONE_IDS.nightCity,
    [OBSTACLE_TYPES.fan]: ZONE_IDS.nightCity,
    [OBSTACLE_TYPES.double]: ZONE_IDS.storm,
    [OBSTACLE_TYPES.laser]: ZONE_IDS.storm,
  }),

  obstacleWeights: Object.freeze({
    [OBSTACLE_TYPES.normal]: 5.4,
    [OBSTACLE_TYPES.moving]: 3.2,
    [OBSTACLE_TYPES.closing]: 2.45,
    [OBSTACLE_TYPES.wind]: 1.7,
    [OBSTACLE_TYPES.fan]: 1.55,
    [OBSTACLE_TYPES.double]: 1.25,
    [OBSTACLE_TYPES.laser]: 1.35,
  }),

  unlockRampScore: 6,
  cooldownSpawns: Object.freeze({
    [OBSTACLE_TYPES.normal]: 0,
    [OBSTACLE_TYPES.moving]: 1,
    [OBSTACLE_TYPES.closing]: 1,
    [OBSTACLE_TYPES.wind]: 2,
    [OBSTACLE_TYPES.fan]: 2,
    [OBSTACLE_TYPES.double]: 3,
    [OBSTACLE_TYPES.laser]: 3,
  }),
  maxConsecutive: Object.freeze({
    [OBSTACLE_TYPES.normal]: 3,
    [OBSTACLE_TYPES.moving]: 1,
    [OBSTACLE_TYPES.closing]: 1,
    [OBSTACLE_TYPES.wind]: 1,
    [OBSTACLE_TYPES.fan]: 1,
    [OBSTACLE_TYPES.double]: 1,
    [OBSTACLE_TYPES.laser]: 1,
  }),
  forbiddenTransitions: Object.freeze({
    [OBSTACLE_TYPES.wind]: Object.freeze([
      OBSTACLE_TYPES.closing,
      OBSTACLE_TYPES.double,
      OBSTACLE_TYPES.laser,
    ]),
    [OBSTACLE_TYPES.fan]: Object.freeze([
      OBSTACLE_TYPES.double,
      OBSTACLE_TYPES.laser,
    ]),
    [OBSTACLE_TYPES.double]: Object.freeze([
      OBSTACLE_TYPES.closing,
      OBSTACLE_TYPES.wind,
      OBSTACLE_TYPES.fan,
      OBSTACLE_TYPES.double,
      OBSTACLE_TYPES.laser,
    ]),
    [OBSTACLE_TYPES.laser]: Object.freeze([
      OBSTACLE_TYPES.closing,
      OBSTACLE_TYPES.wind,
      OBSTACLE_TYPES.fan,
      OBSTACLE_TYPES.double,
      OBSTACLE_TYPES.laser,
    ]),
  }),

  extraSpacing: Object.freeze({
    [OBSTACLE_TYPES.normal]: 0,
    [OBSTACLE_TYPES.moving]: 12,
    [OBSTACLE_TYPES.closing]: 24,
    [OBSTACLE_TYPES.wind]: 56,
    [OBSTACLE_TYPES.fan]: 38,
    [OBSTACLE_TYPES.double]: 184,
    [OBSTACLE_TYPES.laser]: 34,
  }),

  poolSize: Object.freeze({
    [OBSTACLE_TYPES.normal]: 4,
    [OBSTACLE_TYPES.moving]: 2,
    [OBSTACLE_TYPES.closing]: 2,
    [OBSTACLE_TYPES.wind]: 2,
    [OBSTACLE_TYPES.fan]: 2,
    [OBSTACLE_TYPES.double]: 2,
    [OBSTACLE_TYPES.laser]: 2,
  }),
});
