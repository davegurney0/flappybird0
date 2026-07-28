import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createPoint } from "../src/utils/createPoint.js";

const GRAPHICS_SOURCE_FILES = [
  "../src/game/entities/KoyluKus.js",
  "../src/game/graphics/birdSkinGraphics.js",
  "../src/systems/EvolutionEffectsSystem.js",
];

test("graphics points use Phaser 4 compatible vector-like objects", () => {
  assert.deepEqual(createPoint(-14, -20), { x: -14, y: -20 });
});

test("removed Phaser.Geom.Point constructor is not used", async () => {
  for (const relativePath of GRAPHICS_SOURCE_FILES) {
    const source = await readFile(
      new URL(relativePath, import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(source, /Phaser\.Geom\.Point/);
  }
});
