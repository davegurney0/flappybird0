import Phaser from "phaser";
import {
  COLORS,
  DEPTH,
  GAME_SIZE,
  RENDER_SCALE,
} from "../../config/constants.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";

const PARTICLE_POSITIONS = Object.freeze([
  [38, 112, 0.55],
  [388, 156, 0.4],
  [72, 268, 0.34],
  [356, 326, 0.48],
  [114, 430, 0.3],
  [324, 518, 0.38],
  [54, 630, 0.28],
  [382, 676, 0.32],
]);

function drawHill(graphics, points, color, alpha = 1) {
  graphics.fillStyle(color, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0][0], points[0][1]);

  for (let index = 1; index < points.length; index += 1) {
    graphics.lineTo(points[index][0], points[index][1]);
  }

  graphics.closePath();
  graphics.fillPath();
}

function drawVillage(graphics, horizonY) {
  const houses = [
    { x: 16, width: 45, height: 36 },
    { x: 72, width: 34, height: 29 },
    { x: 333, width: 38, height: 31 },
    { x: 380, width: 42, height: 42 },
  ];

  for (const house of houses) {
    const top = horizonY - house.height;
    graphics.fillStyle(COLORS.ground, 0.9);
    graphics.fillRect(house.x, top, house.width, house.height);
    graphics.fillTriangle(
      house.x - 5,
      top + 2,
      house.x + house.width / 2,
      top - 16,
      house.x + house.width + 5,
      top + 2,
    );

    graphics.fillStyle(COLORS.amber, 0.45);
    graphics.fillRect(house.x + 8, top + 12, 7, 8);
  }
}

function addAtmosphere(scene) {
  for (const [x, y, alpha] of PARTICLE_POSITIONS) {
    const dot = scene.add
      .image(x, y, "soft-dot")
      .setDepth(DEPTH.particles)
      .setAlpha(alpha)
      .setScale(
        Phaser.Math.FloatBetween(0.6, 1.15) / RENDER_SCALE,
      );

    scene.tweens.add({
      targets: dot,
      y: y - Phaser.Math.Between(8, 18),
      alpha: Math.min(alpha + 0.24, 0.72),
      duration: Phaser.Math.Between(1800, 3200),
      delay: Phaser.Math.Between(0, 900),
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
  }
}

export function createArcadeBackdrop(scene, variant = "menu") {
  const graphics = scene.add
    .graphics()
    .setDepth(DEPTH.background);
  const isGame = variant === "game";

  graphics.fillGradientStyle(
    isGame ? 0x172238 : COLORS.slate,
    isGame ? 0x172238 : COLORS.slate,
    COLORS.night,
    COLORS.night,
    1,
  );
  graphics.fillRect(0, 0, GAME_SIZE.width, GAME_SIZE.height);

  graphics.fillStyle(isGame ? COLORS.mint : COLORS.amber, 0.13);
  graphics.fillCircle(isGame ? 338 : 92, 132, isGame ? 86 : 78);
  graphics.fillStyle(isGame ? COLORS.mint : COLORS.amber, 0.85);
  graphics.fillCircle(isGame ? 338 : 92, 132, isGame ? 31 : 28);

  graphics.fillStyle(COLORS.cream, 0.07);
  graphics.fillRoundedRect(268, 92, 112, 18, 9);
  graphics.fillRoundedRect(294, 72, 72, 14, 7);
  graphics.fillRoundedRect(42, 202, 95, 15, 8);

  const farHillPoints = isGame
    ? [
        [0, 686],
        [0, 570],
        [76, 520],
        [149, 594],
        [233, 505],
        [314, 584],
        [383, 532],
        [432, 575],
        [432, 686],
      ]
    : [
        [0, 485],
        [0, 380],
        [82, 326],
        [148, 393],
        [224, 312],
        [307, 390],
        [385, 330],
        [432, 378],
        [432, 485],
      ];

  drawHill(
    graphics,
    farHillPoints,
    COLORS.hillFar,
    0.82,
  );

  const nearHillPoints = isGame
    ? [
        [0, 710],
        [0, 638],
        [72, 588],
        [151, 660],
        [241, 583],
        [320, 646],
        [382, 603],
        [432, 642],
        [432, 710],
      ]
    : [
        [0, 526],
        [0, 442],
        [74, 390],
        [151, 468],
        [239, 392],
        [318, 455],
        [381, 406],
        [432, 440],
        [432, 526],
      ];

  drawHill(
    graphics,
    nearHillPoints,
    COLORS.hillNear,
  );

  const groundY = isGame ? GAME_BALANCE.groundY : 510;
  drawVillage(graphics, isGame ? groundY - 5 : 514);

  graphics.fillStyle(COLORS.ground);
  graphics.fillRect(0, groundY, GAME_SIZE.width, GAME_SIZE.height - groundY);

  if (isGame) {
    graphics.fillStyle(COLORS.amberDark, 0.18);
    graphics.fillTriangle(128, 768, 216, groundY - 8, 304, 768);
    graphics.fillStyle(COLORS.cream, 0.12);
    graphics.fillTriangle(204, 768, 216, groundY - 8, 228, 768);
  }

  graphics.lineStyle(1, COLORS.white, 0.05);
  for (
    let y = isGame ? groundY + 18 : 548;
    y < GAME_SIZE.height;
    y += 44
  ) {
    graphics.lineBetween(0, y, GAME_SIZE.width, y);
  }

  graphics.fillStyle(COLORS.black, 0.2);
  graphics.fillRect(0, GAME_SIZE.height - 14, GAME_SIZE.width, 14);

  addAtmosphere(scene);
  return graphics;
}
