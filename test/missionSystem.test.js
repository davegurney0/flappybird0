import assert from "node:assert/strict";
import test from "node:test";
import {
  DAILY_MISSION_COUNT,
  getMissionDefinition,
} from "../src/config/missionConfig.js";
import { createDefaultSave } from "../src/config/saveConfig.js";
import { MissionManager } from "../src/managers/MissionManager.js";
import { SaveManager } from "../src/managers/SaveManager.js";
import {
  LocalDailyMissionProvider,
  selectDailyMissions,
  toLocalDateKey,
} from "../src/services/missions/LocalDailyMissionProvider.js";

function createStorage(initial = {}) {
  const store = new Map(Object.entries(initial));

  return {
    store,
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

class TestMissionProvider {
  constructor(
    missionIds,
    dateKey = "2026-07-28",
  ) {
    this.missionIds = missionIds;
    this.dateKey = dateKey;
  }

  getCurrentMissionSet() {
    return {
      cycleId: `test-provider:${this.dateKey}`,
      dateKey: this.dateKey,
      source: "test-provider",
      resetsAt: 1_800_000_000_000,
      missions: this.missionIds.map((id) =>
        getMissionDefinition(id),
      ),
    };
  }
}

function createMissionManager(missionIds) {
  const saveManager = new SaveManager({
    storage: createStorage(),
  });
  const provider = new TestMissionProvider(missionIds);
  const manager = new MissionManager({
    saveManager,
    provider,
  });

  return { manager, provider, saveManager };
}

test("local provider returns three stable unique missions for a local day", () => {
  const morning = new Date(2026, 6, 28, 8, 15);
  const evening = new Date(2026, 6, 28, 23, 40);
  const provider = new LocalDailyMissionProvider({
    clock: () => morning,
  });
  const first = provider.getCurrentMissionSet();
  const second = selectDailyMissions(toLocalDateKey(evening));

  assert.equal(first.dateKey, "2026-07-28");
  assert.equal(first.missions.length, DAILY_MISSION_COUNT);
  assert.equal(
    new Set(first.missions.map((mission) => mission.id)).size,
    DAILY_MISSION_COUNT,
  );
  assert.deepEqual(
    first.missions.map((mission) => mission.id),
    second.map((mission) => mission.id),
  );
});

test("daily mission progress comes from run events and rewards wait for AL", () => {
  const { manager, saveManager } = createMissionManager([
    "run-score-15",
    "daily-coins-30",
    "play-3-games",
  ]);

  manager.beginRun();
  manager.recordObstaclePassed({
    score: 15,
    evolutionLevel: 2,
  });
  manager.recordCoinCollected({ value: 12, runCoins: 12 });
  manager.beginRun();
  manager.recordCoinCollected({ value: 18, runCoins: 18 });
  manager.beginRun();

  const beforeClaim = manager.getSnapshot();

  assert.equal(
    beforeClaim.missions.every((mission) => mission.completed),
    true,
  );
  assert.equal(saveManager.getSnapshot().coins, 0);

  const claim = manager.claimReward("run-score-15");
  const duplicate = manager.claimReward("run-score-15");

  assert.equal(claim.status, "claimed");
  assert.equal(claim.reward, 90);
  assert.equal(saveManager.getSnapshot().coins, 90);
  assert.equal(duplicate.status, "already-claimed");
  assert.equal(saveManager.getSnapshot().coins, 90);
});

test("cyber, shield and obstacle missions track their own event types", () => {
  const { manager } = createMissionManager([
    "reach-cyber",
    "use-shield",
    "pass-20-obstacles",
  ]);

  manager.beginRun();

  for (let count = 1; count <= 20; count += 1) {
    manager.recordObstaclePassed({
      score: count,
      evolutionLevel: count === 20 ? 3 : 2,
    });
  }

  manager.recordPowerUpUsed("shield");
  const snapshot = manager.getSnapshot();

  assert.equal(
    snapshot.missions.find(
      (mission) => mission.id === "reach-cyber",
    ).progress,
    1,
  );
  assert.equal(
    snapshot.missions.find(
      (mission) => mission.id === "use-shield",
    ).completed,
    true,
  );
  assert.equal(
    snapshot.missions.find(
      (mission) => mission.id === "pass-20-obstacles",
    ).progress,
    20,
  );
});

test("single-run coin mission keeps the best run instead of summing runs", () => {
  const { manager } = createMissionManager([
    "run-coins-10",
    "play-3-games",
    "daily-coins-30",
  ]);

  manager.beginRun();
  manager.recordCoinCollected({ value: 6, runCoins: 6 });
  manager.beginRun();
  manager.recordCoinCollected({ value: 4, runCoins: 4 });

  const mission = manager
    .getSnapshot()
    .missions.find(
      (candidate) => candidate.id === "run-coins-10",
    );

  assert.equal(mission.progress, 6);
  assert.equal(mission.completed, false);
});

test("changing the local date replaces assignments and resets progress", () => {
  const { manager, provider } = createMissionManager([
    "play-3-games",
    "daily-coins-30",
    "pass-20-obstacles",
  ]);

  manager.beginRun();
  assert.equal(
    manager.getSnapshot().missions[0].progress,
    1,
  );

  provider.dateKey = "2026-07-29";
  const nextDay = manager.getSnapshot();

  assert.equal(nextDay.dateKey, "2026-07-29");
  assert.equal(
    nextDay.missions.every(
      (mission) => mission.progress === 0,
    ),
    true,
  );
});

test("schema v1 migration replaces legacy mission maps without losing profile data", () => {
  const legacy = {
    ...createDefaultSave(),
    schemaVersion: 1,
    coins: 321,
    bestScore: 44,
    missions: {
      "first-five": {
        progress: 5,
        completed: true,
        claimed: false,
      },
    },
  };
  const manager = new SaveManager({
    storage: createStorage({
      "sgk.save": JSON.stringify(legacy),
    }),
  });
  const save = manager.getSnapshot();

  assert.equal(save.schemaVersion, 2);
  assert.equal(save.coins, 321);
  assert.equal(save.bestScore, 44);
  assert.deepEqual(save.missions.assignments, []);
});
