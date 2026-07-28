import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultSave,
  LEGACY_STORAGE_KEYS,
  normalizeSave,
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
} from "../src/config/saveConfig.js";
import { SKIN_IDS } from "../src/config/skinConfig.js";
import { PlayerProfileManager } from "../src/managers/PlayerProfileManager.js";
import { SaveManager } from "../src/managers/SaveManager.js";
import { SettingsManager } from "../src/managers/SettingsManager.js";

function createStorage(initial = {}) {
  const store = new Map(Object.entries(initial));

  return {
    store,
    failWrites: false,
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      if (this.failWrites) {
        throw new Error("storage unavailable");
      }

      store.set(key, value);
    },
  };
}

test("default save contains the complete player profile schema", () => {
  const storage = createStorage();
  const manager = new SaveManager({ storage });
  const save = manager.getSnapshot();

  assert.deepEqual(Object.keys(save).sort(), [
    "achievements",
    "bestScore",
    "coins",
    "highestEvolution",
    "missions",
    "playTime",
    "schemaVersion",
    "selectedSkin",
    "settings",
    "totalCoinsCollected",
    "totalDeaths",
    "totalFlaps",
    "totalGames",
    "totalObstaclesPassed",
    "unlockedSkins",
  ]);
  assert.equal(save.schemaVersion, SAVE_SCHEMA_VERSION);
  assert.equal(
    JSON.parse(storage.store.get(SAVE_STORAGE_KEY))
      .schemaVersion,
    SAVE_SCHEMA_VERSION,
  );
});

test("corrupt JSON recovers to a valid default without throwing", () => {
  const storage = createStorage({
    [SAVE_STORAGE_KEY]: "{this is not json",
  });

  const manager = new SaveManager({ storage });

  assert.equal(manager.loadStatus, "recovered-corrupt");
  assert.deepEqual(manager.getSnapshot(), createDefaultSave());
  assert.doesNotThrow(() =>
    JSON.parse(storage.store.get(SAVE_STORAGE_KEY)),
  );
});

test("missing and invalid properties are migrated and sanitized", () => {
  const storage = createStorage({
    [SAVE_STORAGE_KEY]: JSON.stringify({
      schemaVersion: 0,
      bestScore: 12.8,
      coins: -90,
      selectedSkin: SKIN_IDS.goldenMukhtar,
      unlockedSkins: ["fake-skin"],
      totalGames: null,
      totalDeaths: "many",
      totalFlaps: 4.9,
      playTime: -1,
      settings: {
        soundEnabled: false,
        vibration: "yes",
      },
    }),
  });

  const save = new SaveManager({ storage }).getSnapshot();

  assert.equal(save.schemaVersion, SAVE_SCHEMA_VERSION);
  assert.equal(save.bestScore, 12);
  assert.equal(save.coins, 0);
  assert.equal(save.selectedSkin, "villager");
  assert.deepEqual(save.unlockedSkins, ["villager"]);
  assert.equal(save.totalGames, 0);
  assert.equal(save.totalDeaths, 0);
  assert.equal(save.totalFlaps, 4);
  assert.equal(save.playTime, 0);
  assert.equal(save.settings.soundEffects, false);
  assert.equal(save.settings.vibration, true);
  assert.equal(save.settings.music, true);
});

test("legacy split keys migrate into the central save once", () => {
  const storage = createStorage({
    [LEGACY_STORAGE_KEYS.bestScore]: JSON.stringify(42),
    [LEGACY_STORAGE_KEYS.coins]: JSON.stringify(875),
    [LEGACY_STORAGE_KEYS.unlockedSkins]: JSON.stringify([
      "villager",
      SKIN_IDS.mukhtar,
    ]),
    [LEGACY_STORAGE_KEYS.selectedSkin]: JSON.stringify(
      SKIN_IDS.mukhtar,
    ),
    [LEGACY_STORAGE_KEYS.settings]: JSON.stringify({
      soundEnabled: false,
    }),
  });

  const manager = new SaveManager({ storage });
  const save = manager.getSnapshot();

  assert.equal(manager.loadStatus, "migrated-legacy");
  assert.equal(save.bestScore, 42);
  assert.equal(save.coins, 875);
  assert.equal(save.selectedSkin, SKIN_IDS.mukhtar);
  assert.deepEqual(save.unlockedSkins, [
    "villager",
    SKIN_IDS.mukhtar,
  ]);
  assert.equal(save.settings.soundEffects, false);
  assert.equal(
    JSON.parse(storage.store.get(SAVE_STORAGE_KEY)).coins,
    875,
  );
});

test("NaN, Infinity and undefined cannot poison a save update", () => {
  const storage = createStorage();
  const manager = new SaveManager({ storage });

  const result = manager.update((save) => {
    save.bestScore = Number.NaN;
    save.coins = Number.POSITIVE_INFINITY;
    save.totalGames = undefined;
    save.settings.music = "sometimes";
    save.achievements = {
      safe: {
        progress: Number.NaN,
        completed: true,
      },
      ["__proto__"]: {
        progress: 99,
      },
    };
  });
  const savedJson = storage.store.get(SAVE_STORAGE_KEY);
  const save = manager.getSnapshot();

  assert.equal(result.ok, true);
  assert.equal(save.bestScore, 0);
  assert.equal(save.coins, 0);
  assert.equal(save.totalGames, 0);
  assert.equal(save.settings.music, true);
  assert.equal(save.achievements.safe.progress, 0);
  assert.equal(savedJson.includes("NaN"), false);
  assert.equal(savedJson.includes("undefined"), false);
});

test("migration entry point can safely normalize an old partial object", () => {
  const save = normalizeSave({
    schemaVersion: 0,
    bestScore: 9,
    settings: { musicEnabled: false },
  });

  assert.equal(save.schemaVersion, SAVE_SCHEMA_VERSION);
  assert.equal(save.bestScore, 9);
  assert.equal(save.settings.music, false);
  assert.equal(save.highestEvolution, 1);
});

test("invalid daily mission fields are bounded without corrupting the profile", () => {
  const save = normalizeSave({
    ...createDefaultSave(),
    missions: {
      cycleId: "local-daily-v1:2026-07-28",
      dateKey: "2026-07-28",
      source: "local-daily-v1",
      assignments: [
        {
          id: "run-score-15",
          progress: Number.NaN,
          target: 15,
          reward: Number.POSITIVE_INFINITY,
          completed: true,
          claimed: true,
        },
        {
          id: "run-score-15",
          progress: 999,
          target: 15,
          reward: 90,
        },
        {
          id: "__proto__",
          progress: 1,
          target: 1,
          reward: 999,
        },
      ],
    },
  });

  assert.equal(save.missions.assignments.length, 1);
  assert.deepEqual(save.missions.assignments[0], {
    id: "run-score-15",
    progress: 0,
    target: 15,
    reward: 0,
    completed: false,
    claimed: false,
  });
  assert.equal(save.coins, 0);
});

test("settings persist independently and progress reset keeps accessibility choices", () => {
  const storage = createStorage({
    [SAVE_STORAGE_KEY]: JSON.stringify({
      ...createDefaultSave(),
      bestScore: 60,
      coins: 900,
      selectedSkin: SKIN_IDS.mukhtar,
      unlockedSkins: ["villager", SKIN_IDS.mukhtar],
    }),
  });
  const saveManager = new SaveManager({ storage });
  const settings = new SettingsManager({ saveManager });

  settings.toggleMusic();
  settings.toggleSoundEffects();
  settings.toggleVibration();
  settings.toggleReducedMotion();
  const result = saveManager.resetProgress();
  settings.reload();
  const save = saveManager.getSnapshot();

  assert.equal(result.ok, true);
  assert.equal(save.bestScore, 0);
  assert.equal(save.coins, 0);
  assert.equal(save.selectedSkin, "villager");
  assert.deepEqual(save.unlockedSkins, ["villager"]);
  assert.deepEqual(settings.getSnapshot(), {
    music: false,
    soundEffects: false,
    vibration: false,
    reducedMotion: true,
  });
});

test("player profile batches counters without overwriting daily missions", () => {
  const storage = createStorage();
  const saveManager = new SaveManager({ storage });
  const profile = new PlayerProfileManager({
    saveManager,
    flushInterval: 10_000,
  });

  profile.recordGameStarted();
  profile.recordFlap();
  profile.recordFlap();
  profile.recordCoinCollected(3);
  profile.recordObstaclePassed(3);
  profile.update(1_234);
  profile.recordDeath();
  const save = saveManager.getSnapshot();

  assert.equal(save.totalGames, 1);
  assert.equal(save.totalDeaths, 1);
  assert.equal(save.totalFlaps, 2);
  assert.equal(save.totalCoinsCollected, 3);
  assert.equal(save.totalObstaclesPassed, 1);
  assert.equal(save.highestEvolution, 3);
  assert.equal(save.playTime, 1_234);
  assert.equal(save.achievements["first-flight"].completed, false);
  assert.deepEqual(save.missions.assignments, []);
});

test("failed storage writes do not replace the last valid in-memory save", () => {
  const storage = createStorage();
  const manager = new SaveManager({ storage });
  storage.failWrites = true;

  const result = manager.update((save) => {
    save.coins = 999;
  });

  assert.equal(result.ok, false);
  assert.equal(manager.getSnapshot().coins, 0);
});
