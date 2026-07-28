import assert from "node:assert/strict";
import test from "node:test";
import {
  GAME_SIZE,
  RENDER_CAMERA_SCROLL,
  RENDER_SCALE,
  RENDER_SIZE,
} from "../src/config/constants.js";
import { GAME_BALANCE } from "../src/config/gameBalance.js";

test("required balance values are finite and usable", () => {
  const requiredKeys = [
    "gravity",
    "flapVelocity",
    "maxFallVelocity",
    "obstacleSpeed",
    "spawnInterval",
    "gapSize",
  ];

  for (const key of requiredKeys) {
    assert.equal(Number.isFinite(GAME_BALANCE[key]), true, `${key} is finite`);
  }

  assert.ok(GAME_BALANCE.gravity > 0);
  assert.ok(GAME_BALANCE.flapVelocity < 0);
  assert.ok(GAME_BALANCE.maxFallVelocity > 0);
  assert.ok(GAME_BALANCE.obstacleSpeed > 0);
  assert.ok(GAME_BALANCE.spawnInterval > 0);
  assert.ok(GAME_BALANCE.gapSize > GAME_BALANCE.birdRadius * 2);
});

test("the high-DPI canvas preserves the 9:16 logical playfield", () => {
  assert.equal(RENDER_SCALE, 2);
  assert.equal(RENDER_SIZE.width, GAME_SIZE.width * RENDER_SCALE);
  assert.equal(RENDER_SIZE.height, GAME_SIZE.height * RENDER_SCALE);
  assert.equal(RENDER_SIZE.width / RENDER_SIZE.height, 9 / 16);

  const visibleLeft =
    RENDER_CAMERA_SCROLL.x +
    RENDER_SIZE.width / 2 -
    RENDER_SIZE.width / RENDER_SCALE / 2;
  const visibleTop =
    RENDER_CAMERA_SCROLL.y +
    RENDER_SIZE.height / 2 -
    RENDER_SIZE.height / RENDER_SCALE / 2;

  assert.equal(visibleLeft, 0);
  assert.equal(visibleTop, 0);
});

test("every generated gap leaves safe top and bottom clearance", () => {
  const halfGap = GAME_BALANCE.gapSize / 2;
  const topClearance = GAME_BALANCE.gapCenterMin - halfGap;
  const bottomClearance =
    GAME_BALANCE.groundY -
    (GAME_BALANCE.gapCenterMax + halfGap);
  const birdDiameter = GAME_BALANCE.birdRadius * 2;

  assert.ok(topClearance > birdDiameter);
  assert.ok(bottomClearance > birdDiameter);
  assert.ok(GAME_BALANCE.gapCenterMin < GAME_BALANCE.gapCenterMax);
});

test("obstacle spacing and pool capacity cover the full playfield", () => {
  const spawnDistance =
    GAME_BALANCE.obstacleSpeed *
    (GAME_BALANCE.spawnInterval / 1000);
  const minimumSpacing =
    GAME_BALANCE.obstacleWidth + GAME_BALANCE.birdRadius * 2;
  const activeTravelDistance =
    GAME_SIZE.width + GAME_BALANCE.obstacleWidth * 2;
  const maximumSimultaneousPairs =
    Math.ceil(activeTravelDistance / spawnDistance) + 1;

  assert.ok(spawnDistance > minimumSpacing);
  assert.ok(
    GAME_BALANCE.obstaclePoolSize >= maximumSimultaneousPairs,
  );
});
