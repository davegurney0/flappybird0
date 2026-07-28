import assert from "node:assert/strict";
import test from "node:test";
import {
  getMenuProgressSnapshot,
  MENU_PAGES,
  MENU_PAGE_IDS,
  normalizeMenuStats,
} from "../src/config/menuConfig.js";
import {
  prefersReducedMotion,
  supportsDesktopHover,
} from "../src/utils/inputCapabilities.js";

test("advanced menu exposes six unique requested destinations", () => {
  assert.deepEqual(
    MENU_PAGES.map((page) => page.label),
    [
      "KUŞLAR",
      "MAĞAZA",
      "GÖREVLER",
      "BAŞARIMLAR",
      "İSTATİSTİK",
      "AYARLAR",
    ],
  );
  assert.equal(
    new Set(MENU_PAGES.map((page) => page.id)).size,
    6,
  );
  assert.equal(
    MENU_PAGES.some(
      (page) => page.id === MENU_PAGE_IDS.settings,
    ),
    true,
  );
});

test("menu stats normalize unsafe values before rendering", () => {
  assert.deepEqual(
    normalizeMenuStats({
      highScore: -20,
      coinBalance: Number.NaN,
    }),
    {
      highScore: 0,
      coinBalance: 0,
      totalGames: 0,
      totalDeaths: 0,
      totalFlaps: 0,
      totalCoinsCollected: 0,
      totalObstaclesPassed: 0,
      highestEvolution: 1,
      playTime: 0,
    },
  );
  assert.deepEqual(
    normalizeMenuStats({
      highScore: 35.9,
      coinBalance: 50.2,
    }),
    {
      highScore: 35,
      coinBalance: 50,
      totalGames: 0,
      totalDeaths: 0,
      totalFlaps: 0,
      totalCoinsCollected: 0,
      totalObstaclesPassed: 0,
      highestEvolution: 1,
      playTime: 0,
    },
  );
});

test("statistics derive bird and world progress from the saved record", () => {
  const snapshot = getMenuProgressSnapshot({
    highScore: 35,
    coinBalance: 18,
  });

  assert.equal(snapshot.evolution.label, "CYBER KUŞ");
  assert.equal(snapshot.zone.label, "GECE ŞEHRİ");
  assert.equal(snapshot.unlockedBirdCount, 3);
  assert.equal(snapshot.unlockedZoneCount, 3);
});

test("menu can report owned cosmetic skins independently from evolution", () => {
  const snapshot = getMenuProgressSnapshot({
    highScore: 100,
    coinBalance: 18,
    ownedSkinCount: 2,
  });

  assert.equal(snapshot.unlockedBirdCount, 5);
  assert.equal(snapshot.ownedSkinCount, 2);
});

test("achievements use real record and wallet progress", () => {
  const snapshot = getMenuProgressSnapshot({
    highScore: 100,
    coinBalance: 50,
  });

  assert.equal(
    snapshot.completedAchievementCount,
    snapshot.achievements.length,
  );
  assert.equal("missions" in snapshot, false);
});

test("hover is enabled only for a fine desktop pointer", () => {
  const queries = [];
  const matchMedia = (query) => {
    queries.push(query);
    return {
      matches:
        query === "(hover: hover) and (pointer: fine)",
    };
  };

  assert.equal(supportsDesktopHover(matchMedia), true);
  assert.equal(prefersReducedMotion(matchMedia), false);
  assert.deepEqual(queries, [
    "(hover: hover) and (pointer: fine)",
    "(prefers-reduced-motion: reduce)",
  ]);
});

test("reduced motion follows the operating system preference", () => {
  const matchMedia = (query) => ({
    matches: query.includes("prefers-reduced-motion"),
  });

  assert.equal(prefersReducedMotion(matchMedia), true);
  assert.equal(supportsDesktopHover(matchMedia), false);
});
