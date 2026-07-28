import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD_ZONES,
  ZONE_ANNOUNCEMENT_DURATION,
  ZONE_TRANSITION_DURATION,
} from "../src/config/zoneConfig.js";
import {
  getCrossfadeAlphas,
  getParallaxOffset,
} from "../src/systems/WorldZoneSystem.js";

test("five world zones use the requested score thresholds", () => {
  assert.deepEqual(
    WORLD_ZONES.map((zone) => zone.minScore),
    [0, 15, 30, 50, 75],
  );
  assert.deepEqual(
    WORLD_ZONES.map((zone) => zone.label),
    ["KÖY", "AKŞAM", "GECE ŞEHRİ", "FIRTINA", "UZAY / DELİLİK"],
  );
});

test("every zone keeps three visibly different parallax speeds", () => {
  WORLD_ZONES.forEach((zone) => {
    const { far, mid, near } = zone.visual.parallax;

    assert.ok(far > 0);
    assert.ok(far < mid);
    assert.ok(mid < near);
  });
});

test("zone crossfade is gradual and completes cleanly", () => {
  assert.deepEqual(getCrossfadeAlphas(0), {
    outgoing: 1,
    incoming: 0,
  });
  assert.deepEqual(
    getCrossfadeAlphas(ZONE_TRANSITION_DURATION / 2),
    {
      outgoing: 0.5,
      incoming: 0.5,
    },
  );
  assert.deepEqual(
    getCrossfadeAlphas(ZONE_TRANSITION_DURATION),
    {
      outgoing: 0,
      incoming: 1,
    },
  );
  assert.ok(ZONE_TRANSITION_DURATION >= 2000);
  assert.equal(ZONE_ANNOUNCEMENT_DURATION, 1000);
});

test("parallax offsets wrap without unbounded coordinates", () => {
  const segmentWidth = 648;
  const offset = getParallaxOffset(9284, 0.44, segmentWidth);

  assert.ok(offset <= 0);
  assert.ok(offset > -segmentWidth);
  assert.equal(getParallaxOffset(0, 0.44, segmentWidth), -0);
});
