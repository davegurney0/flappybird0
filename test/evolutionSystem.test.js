import assert from "node:assert/strict";
import test from "node:test";
import {
  EVOLUTION_EFFECTS,
  EVOLUTION_STAGES,
  getEvolutionHitboxRadius,
  getEvolutionStageForScore,
} from "../src/config/evolutionConfig.js";
import { GAME_BALANCE } from "../src/config/gameBalance.js";
import { EvolutionManager } from "../src/managers/EvolutionManager.js";

test("five evolution stages use the requested score thresholds", () => {
  assert.deepEqual(
    EVOLUTION_STAGES.map((stage) => stage.minScore),
    [0, 15, 35, 60, 100],
  );
  assert.deepEqual(
    EVOLUTION_STAGES.map((stage) => stage.label),
    [
      "KÖYLÜ KUŞ",
      "TURBO KUŞ",
      "CYBER KUŞ",
      "DELİ KUŞ",
      "KÖYÜN EFENDİSİ",
    ],
  );

  assert.equal(getEvolutionStageForScore(14).level, 1);
  assert.equal(getEvolutionStageForScore(15).level, 2);
  assert.equal(getEvolutionStageForScore(35).level, 3);
  assert.equal(getEvolutionStageForScore(60).level, 4);
  assert.equal(getEvolutionStageForScore(100).level, 5);
});

test("evolution only moves forward inside a run and reset restores level one", () => {
  const manager = new EvolutionManager();

  assert.equal(manager.getSnapshot().stage.level, 1);
  assert.equal(manager.update(15).changed, true);
  assert.equal(manager.getSnapshot().stage.level, 2);
  assert.equal(manager.update(12).changed, false);
  assert.equal(manager.getSnapshot().stage.level, 2);
  assert.equal(manager.update(100).stage.level, 5);
  assert.equal(manager.reset().stage.level, 1);
});

test("every evolution has a distinct visual language", () => {
  const uniqueValues = (selector) =>
    new Set(EVOLUTION_STAGES.map(selector)).size;

  assert.equal(uniqueValues((stage) => stage.color), 5);
  assert.equal(uniqueValues((stage) => stage.wing.style), 5);
  assert.equal(uniqueValues((stage) => stage.eye.style), 5);
  assert.equal(uniqueValues((stage) => stage.trail.shape), 5);
  assert.equal(uniqueValues((stage) => stage.particle.shape), 5);
  assert.equal(EVOLUTION_STAGES[0].trail.enabled, false);
  assert.equal(
    EVOLUTION_STAGES.slice(1).every((stage) => stage.trail.enabled),
    true,
  );
});

test("evolution advantages stay small and centrally bounded", () => {
  const flapMultipliers = EVOLUTION_STAGES.map(
    (stage) => stage.benefits.flapVelocityMultiplier,
  );
  const hitboxMultipliers = EVOLUTION_STAGES.map(
    (stage) => stage.benefits.hitboxRadiusMultiplier,
  );
  const magnetDistances = EVOLUTION_STAGES.map(
    (stage) => stage.benefits.coinMagnetDistance,
  );

  assert.ok(Math.max(...flapMultipliers) <= 1.03);
  assert.ok(Math.min(...hitboxMultipliers) >= 0.94);
  assert.ok(Math.max(...magnetDistances) <= 72);
  assert.equal(magnetDistances[3] > magnetDistances[2], true);

  const cyberRadius = getEvolutionHitboxRadius(
    GAME_BALANCE.birdRadius,
    EVOLUTION_STAGES[2],
  );
  assert.ok(cyberRadius < GAME_BALANCE.birdRadius);
  assert.ok(cyberRadius > GAME_BALANCE.birdRadius - 1);
});

test("evolution presentation is brief and uses bounded pools", () => {
  assert.ok(EVOLUTION_EFFECTS.flashDuration < 400);
  assert.ok(EVOLUTION_EFFECTS.announcementDuration <= 1100);
  assert.ok(EVOLUTION_EFFECTS.maximumBurstParticles <= 28);
  assert.ok(EVOLUTION_EFFECTS.maximumTrailParticles <= 18);
  assert.equal(
    Math.max(
      ...EVOLUTION_STAGES.map((stage) => stage.particle.count),
    ) <= EVOLUTION_EFFECTS.maximumBurstParticles,
    true,
  );
});
