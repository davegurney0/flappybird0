import {
  DAILY_MISSION_COUNT,
  DAILY_MISSION_POOL,
  MISSION_PROVIDER_SOURCES,
} from "../../config/missionConfig.js";

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

export function toLocalDateKey(value = new Date()) {
  const date = normalizeDate(value);
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function hashText(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed || 0x9e3779b9;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectDailyMissions(
  dateKey,
  {
    pool = DAILY_MISSION_POOL,
    count = DAILY_MISSION_COUNT,
  } = {},
) {
  const candidates = [...pool];
  const random = createRandom(hashText(String(dateKey)));

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [
      candidates[swapIndex],
      candidates[index],
    ];
  }

  return Object.freeze(
    candidates.slice(0, Math.min(count, candidates.length)),
  );
}

function getNextLocalMidnight(date) {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime();
}

export class LocalDailyMissionProvider {
  constructor({
    clock = () => new Date(),
    pool = DAILY_MISSION_POOL,
    count = DAILY_MISSION_COUNT,
  } = {}) {
    this.clock = clock;
    this.pool = pool;
    this.count = count;
    this.source = MISSION_PROVIDER_SOURCES.local;
  }

  getCurrentMissionSet() {
    const now = normalizeDate(this.clock());
    const dateKey = toLocalDateKey(now);

    return Object.freeze({
      cycleId: `${this.source}:${dateKey}`,
      dateKey,
      source: this.source,
      resetsAt: getNextLocalMidnight(now),
      missions: selectDailyMissions(dateKey, {
        pool: this.pool,
        count: this.count,
      }),
    });
  }
}
