import { POWER_UP_TYPES } from "./pickupConfig.js";

export const DAILY_MISSION_COUNT = 3;

export const MISSION_PROVIDER_SOURCES = Object.freeze({
  local: "local-daily-v1",
});

export const MISSION_EVENT_TYPES = Object.freeze({
  runStarted: "run-started",
  obstaclePassed: "obstacle-passed",
  coinCollected: "coin-collected",
  powerUpUsed: "power-up-used",
});

export const MISSION_PROGRESS_KINDS = Object.freeze({
  bestRunScore: "best-run-score",
  dailyCoins: "daily-coins",
  gamesPlayed: "games-played",
  evolutionReached: "evolution-reached",
  powerUpUsed: "power-up-used",
  obstaclesPassed: "obstacles-passed",
  bestRunCoins: "best-run-coins",
});

function createMission({
  id,
  label,
  description,
  kind,
  target,
  reward,
  powerUpType = null,
  evolutionLevel = null,
}) {
  return Object.freeze({
    id,
    label,
    description,
    kind,
    target,
    reward,
    powerUpType,
    evolutionLevel,
  });
}

export const DAILY_MISSION_POOL = Object.freeze([
  createMission({
    id: "run-score-15",
    label: "TEK NEFESTE",
    description: "Bir run'da 15 skor yap.",
    kind: MISSION_PROGRESS_KINDS.bestRunScore,
    target: 15,
    reward: 90,
  }),
  createMission({
    id: "daily-coins-30",
    label: "CEBİ DOLDUR",
    description: "Bugün toplam 30 coin topla.",
    kind: MISSION_PROGRESS_KINDS.dailyCoins,
    target: 30,
    reward: 60,
  }),
  createMission({
    id: "play-3-games",
    label: "ÜÇ TUR AT",
    description: "3 oyun oyna.",
    kind: MISSION_PROGRESS_KINDS.gamesPlayed,
    target: 3,
    reward: 45,
  }),
  createMission({
    id: "reach-cyber",
    label: "CYBER'A ÇIK",
    description: "CYBER KUŞ'a ulaş.",
    kind: MISSION_PROGRESS_KINDS.evolutionReached,
    target: 1,
    reward: 120,
    evolutionLevel: 3,
  }),
  createMission({
    id: "use-shield",
    label: "KALKANI AÇ",
    description: "Shield power-up'ını kullan.",
    kind: MISSION_PROGRESS_KINDS.powerUpUsed,
    target: 1,
    reward: 55,
    powerUpType: POWER_UP_TYPES.shield,
  }),
  createMission({
    id: "pass-20-obstacles",
    label: "KAPILARI AŞ",
    description: "20 engel geç.",
    kind: MISSION_PROGRESS_KINDS.obstaclesPassed,
    target: 20,
    reward: 75,
  }),
  createMission({
    id: "run-coins-10",
    label: "TEK RUN VURGUNU",
    description: "Bir run'da 10 coin topla.",
    kind: MISSION_PROGRESS_KINDS.bestRunCoins,
    target: 10,
    reward: 100,
  }),
]);

export function getMissionDefinition(id) {
  return (
    DAILY_MISSION_POOL.find((mission) => mission.id === id) ??
    null
  );
}
