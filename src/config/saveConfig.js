import {
  DEFAULT_SKIN_ID,
  isValidSkinId,
  normalizeOwnedSkinIds,
} from "./skinConfig.js";

export const SAVE_SCHEMA_VERSION = 2;
export const SAVE_STORAGE_KEY = "sgk.save";

export const LEGACY_STORAGE_KEYS = Object.freeze({
  settings: "sgk.settings.v1",
  bestScore: "sgk.high-score.v1",
  coins: "sgk.coin-balance.v1",
  unlockedSkins: "sgk.owned-skins.v1",
  selectedSkin: "sgk.selected-skin.v1",
});

export const DEFAULT_SAVE_SETTINGS = Object.freeze({
  music: true,
  soundEffects: true,
  vibration: true,
  reducedMotion: false,
});

const MAX_COUNTER_VALUE = Number.MAX_SAFE_INTEGER;
const MAX_PROGRESS_ENTRIES = 128;
const MAX_DAILY_MISSION_ENTRIES = 12;
const BLOCKED_RECORD_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toSafeInteger(value, fallback = 0, minimum = 0, maximum = MAX_COUNTER_VALUE) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function toBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeProgressEntry(value) {
  if (typeof value === "boolean") {
    return {
      progress: value ? 1 : 0,
      completed: value,
      claimed: false,
    };
  }

  if (Number.isFinite(value)) {
    return {
      progress: toSafeInteger(value),
      completed: false,
      claimed: false,
    };
  }

  if (!isPlainObject(value)) {
    return null;
  }

  const completedAt =
    value.completedAt === null
      ? null
      : toSafeInteger(value.completedAt, 0);

  return {
    progress: toSafeInteger(value.progress),
    completed: toBoolean(value.completed, false),
    claimed: toBoolean(value.claimed, false),
    ...(completedAt > 0 ? { completedAt } : {}),
  };
}

function sanitizeProgressMap(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  const result = {};
  const entries = Object.entries(value).slice(0, MAX_PROGRESS_ENTRIES);

  for (const [key, entry] of entries) {
    if (
      BLOCKED_RECORD_KEYS.has(key) ||
      !/^[a-z0-9][a-z0-9-]{0,63}$/i.test(key)
    ) {
      continue;
    }

    const sanitizedEntry = sanitizeProgressEntry(entry);

    if (sanitizedEntry) {
      result[key] = sanitizedEntry;
    }
  }

  return result;
}

export function createDefaultMissionSaveState() {
  return {
    cycleId: null,
    dateKey: null,
    source: null,
    assignments: [],
  };
}

function sanitizeIdentifier(value, maximumLength = 96) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximumLength ||
    BLOCKED_RECORD_KEYS.has(value) ||
    !/^[a-z0-9][a-z0-9:._-]*$/i.test(value)
  ) {
    return null;
  }

  return value;
}

function sanitizeMissionAssignment(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = sanitizeIdentifier(value.id, 64);

  if (!id) {
    return null;
  }

  const target = toSafeInteger(
    value.target,
    1,
    1,
    MAX_COUNTER_VALUE,
  );
  const progress = toSafeInteger(
    value.progress,
    0,
    0,
    target,
  );
  const completed = progress >= target;
  const completedAt =
    completed && value.completedAt !== null
      ? toSafeInteger(value.completedAt, 0)
      : 0;

  return {
    id,
    progress,
    target,
    reward: toSafeInteger(value.reward),
    completed,
    claimed: completed && toBoolean(value.claimed, false),
    ...(completedAt > 0 ? { completedAt } : {}),
  };
}

function sanitizeMissionState(value) {
  if (!isPlainObject(value) || !Array.isArray(value.assignments)) {
    return createDefaultMissionSaveState();
  }

  const dateKey =
    typeof value.dateKey === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.dateKey)
      ? value.dateKey
      : null;
  const source = sanitizeIdentifier(value.source);
  const cycleId = sanitizeIdentifier(value.cycleId, 128);
  const assignments = [];
  const seenIds = new Set();

  for (const candidate of value.assignments.slice(
    0,
    MAX_DAILY_MISSION_ENTRIES,
  )) {
    const assignment = sanitizeMissionAssignment(candidate);

    if (!assignment || seenIds.has(assignment.id)) {
      continue;
    }

    seenIds.add(assignment.id);
    assignments.push(assignment);
  }

  if (!dateKey || !source || !cycleId) {
    return createDefaultMissionSaveState();
  }

  return {
    cycleId,
    dateKey,
    source,
    assignments,
  };
}

export function createDefaultSave() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    bestScore: 0,
    coins: 0,
    selectedSkin: DEFAULT_SKIN_ID,
    unlockedSkins: [DEFAULT_SKIN_ID],
    totalGames: 0,
    totalDeaths: 0,
    totalFlaps: 0,
    totalCoinsCollected: 0,
    totalObstaclesPassed: 0,
    highestEvolution: 1,
    playTime: 0,
    achievements: {},
    missions: createDefaultMissionSaveState(),
    settings: { ...DEFAULT_SAVE_SETTINGS },
  };
}

function migrateVersionZero(save) {
  const legacySettings = isPlainObject(save.settings)
    ? save.settings
    : {};

  return {
    ...save,
    schemaVersion: 1,
    settings: {
      music:
        legacySettings.music ??
        legacySettings.musicEnabled ??
        DEFAULT_SAVE_SETTINGS.music,
      soundEffects:
        legacySettings.soundEffects ??
        legacySettings.soundEnabled ??
        DEFAULT_SAVE_SETTINGS.soundEffects,
      vibration:
        legacySettings.vibration ??
        legacySettings.vibrationEnabled ??
        DEFAULT_SAVE_SETTINGS.vibration,
      reducedMotion:
        legacySettings.reducedMotion ??
        DEFAULT_SAVE_SETTINGS.reducedMotion,
    },
  };
}

function migrateVersionOne(save) {
  return {
    ...save,
    schemaVersion: 2,
    missions: createDefaultMissionSaveState(),
  };
}

export const SAVE_MIGRATIONS = Object.freeze({
  0: migrateVersionZero,
  1: migrateVersionOne,
});

export function migrateSave(candidate) {
  let save = isPlainObject(candidate) ? { ...candidate } : {};
  let version = toSafeInteger(save.schemaVersion, 0);

  while (version < SAVE_SCHEMA_VERSION) {
    const migration = SAVE_MIGRATIONS[version];

    if (typeof migration !== "function") {
      break;
    }

    save = migration(save);
    const nextVersion = toSafeInteger(save.schemaVersion, version);

    if (nextVersion <= version) {
      break;
    }

    version = nextVersion;
  }

  return save;
}

export function sanitizeSave(candidate) {
  const defaults = createDefaultSave();
  const source = isPlainObject(candidate) ? candidate : {};
  const settings = isPlainObject(source.settings)
    ? source.settings
    : {};
  const unlockedSkins = normalizeOwnedSkinIds(source.unlockedSkins);
  const requestedSkin = source.selectedSkin;
  const selectedSkin =
    isValidSkinId(requestedSkin) &&
    unlockedSkins.includes(requestedSkin)
      ? requestedSkin
      : DEFAULT_SKIN_ID;

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    bestScore: toSafeInteger(source.bestScore),
    coins: toSafeInteger(source.coins),
    selectedSkin,
    unlockedSkins,
    totalGames: toSafeInteger(source.totalGames),
    totalDeaths: toSafeInteger(source.totalDeaths),
    totalFlaps: toSafeInteger(source.totalFlaps),
    totalCoinsCollected: toSafeInteger(
      source.totalCoinsCollected,
    ),
    totalObstaclesPassed: toSafeInteger(
      source.totalObstaclesPassed,
    ),
    highestEvolution: toSafeInteger(
      source.highestEvolution,
      defaults.highestEvolution,
      1,
      5,
    ),
    playTime: toSafeInteger(source.playTime),
    achievements: sanitizeProgressMap(source.achievements),
    missions: sanitizeMissionState(source.missions),
    settings: {
      music: toBoolean(
        settings.music,
        DEFAULT_SAVE_SETTINGS.music,
      ),
      soundEffects: toBoolean(
        settings.soundEffects,
        DEFAULT_SAVE_SETTINGS.soundEffects,
      ),
      vibration: toBoolean(
        settings.vibration,
        DEFAULT_SAVE_SETTINGS.vibration,
      ),
      reducedMotion: toBoolean(
        settings.reducedMotion,
        DEFAULT_SAVE_SETTINGS.reducedMotion,
      ),
    },
  };
}

export function normalizeSave(candidate) {
  return sanitizeSave(migrateSave(candidate));
}
