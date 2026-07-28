import { EVOLUTION_STAGES } from "./evolutionConfig.js";
import { BIRD_SKINS } from "./skinConfig.js";
import { WORLD_ZONES } from "./zoneConfig.js";

export const MENU_PAGE_IDS = Object.freeze({
  birds: "birds",
  store: "store",
  missions: "missions",
  achievements: "achievements",
  statistics: "statistics",
  settings: "settings",
});

export const MENU_PAGES = Object.freeze([
  Object.freeze({
    id: MENU_PAGE_IDS.birds,
    label: "KUŞLAR",
    icon: "●",
    accent: 0x6de0b6,
    subtitle: "Sahip olduğun kuşu seç.",
  }),
  Object.freeze({
    id: MENU_PAGE_IDS.store,
    label: "MAĞAZA",
    icon: "◆",
    accent: 0xffc247,
    subtitle: "Tamamen kozmetik köy tezgâhı.",
  }),
  Object.freeze({
    id: MENU_PAGE_IDS.missions,
    label: "GÖREVLER",
    icon: "✓",
    accent: 0x8aa7c4,
    subtitle: "Bugünün 3 hedefini tamamla, ödülü AL.",
  }),
  Object.freeze({
    id: MENU_PAGE_IDS.achievements,
    label: "BAŞARIMLAR",
    icon: "★",
    accent: 0xffe36a,
    subtitle: "Köy tarihine geçen hareketler.",
  }),
  Object.freeze({
    id: MENU_PAGE_IDS.statistics,
    label: "İSTATİSTİK",
    icon: "▥",
    accent: 0x53f2ff,
    subtitle: "Bu cihazdaki ilerleme özeti.",
  }),
  Object.freeze({
    id: MENU_PAGE_IDS.settings,
    label: "AYARLAR",
    icon: "⚙",
    accent: 0xff8a4c,
    subtitle: "Oyun deneyimini düzenle.",
  }),
]);

export const MENU_ACHIEVEMENTS = Object.freeze([
  Object.freeze({
    id: "first-flight",
    label: "İLK UÇUŞ",
    description: "İlk kapını geç.",
    metric: "highScore",
    target: 1,
  }),
  Object.freeze({
    id: "cyber-village",
    label: "CYBER KÖY",
    description: "CYBER KUŞ seviyesine ulaş.",
    metric: "highScore",
    target: 35,
  }),
  Object.freeze({
    id: "rich-villager",
    label: "ZENGİN KÖYLÜ",
    description: "50 coinlik bakiye yap.",
    metric: "coinBalance",
    target: 50,
  }),
  Object.freeze({
    id: "village-master",
    label: "KÖYÜN EFENDİSİ",
    description: "100 skor barajını aş.",
    metric: "highScore",
    target: 100,
  }),
]);

function normalizeNonNegativeInteger(value) {
  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function getLastUnlocked(items, score) {
  let unlocked = items[0];

  for (const item of items) {
    if (score >= item.minScore) {
      unlocked = item;
    }
  }

  return unlocked;
}

function createProgressState(item, stats) {
  const current = stats[item.metric] ?? 0;

  return Object.freeze({
    ...item,
    current: Math.min(current, item.target),
    complete: current >= item.target,
  });
}

export function normalizeMenuStats({
  highScore = 0,
  coinBalance = 0,
  totalGames = 0,
  totalDeaths = 0,
  totalFlaps = 0,
  totalCoinsCollected = 0,
  totalObstaclesPassed = 0,
  highestEvolution = 1,
  playTime = 0,
} = {}) {
  return Object.freeze({
    highScore: normalizeNonNegativeInteger(highScore),
    coinBalance: normalizeNonNegativeInteger(coinBalance),
    totalGames: normalizeNonNegativeInteger(totalGames),
    totalDeaths: normalizeNonNegativeInteger(totalDeaths),
    totalFlaps: normalizeNonNegativeInteger(totalFlaps),
    totalCoinsCollected: normalizeNonNegativeInteger(
      totalCoinsCollected,
    ),
    totalObstaclesPassed: normalizeNonNegativeInteger(
      totalObstaclesPassed,
    ),
    highestEvolution: Math.min(
      5,
      Math.max(1, normalizeNonNegativeInteger(highestEvolution)),
    ),
    playTime: normalizeNonNegativeInteger(playTime),
  });
}

export function getMenuProgressSnapshot(stats = {}) {
  const normalized = normalizeMenuStats(stats);
  const evolution = getLastUnlocked(
    EVOLUTION_STAGES,
    normalized.highScore,
  );
  const zone = getLastUnlocked(
    WORLD_ZONES,
    normalized.highScore,
  );
  const achievements = MENU_ACHIEVEMENTS.map((achievement) =>
    createProgressState(achievement, normalized),
  );
  const unlockedEvolutionCount = EVOLUTION_STAGES.filter(
    (stage) => normalized.highScore >= stage.minScore,
  ).length;
  const ownedSkinCount = Number.isFinite(stats.ownedSkinCount)
    ? Math.min(
        BIRD_SKINS.length,
        Math.max(1, Math.floor(stats.ownedSkinCount)),
      )
    : unlockedEvolutionCount;

  return Object.freeze({
    ...normalized,
    evolution,
    zone,
    unlockedBirdCount: unlockedEvolutionCount,
    ownedSkinCount,
    unlockedZoneCount: WORLD_ZONES.filter(
      (candidate) => normalized.highScore >= candidate.minScore,
    ).length,
    achievements: Object.freeze(achievements),
    completedAchievementCount: achievements.filter(
      (achievement) => achievement.complete,
    ).length,
  });
}
