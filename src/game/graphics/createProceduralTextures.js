import {
  COLORS,
  RENDER_SCALE,
} from "../../config/constants.js";

function generateHiDpiTexture(scene, graphics, key, width, height) {
  graphics.setScale(RENDER_SCALE);
  graphics.generateTexture(
    key,
    Math.round(width * RENDER_SCALE),
    Math.round(height * RENDER_SCALE),
  );
  graphics.setScale(1);
}

function createSoftDot(scene) {
  if (scene.textures.exists("soft-dot")) {
    return;
  }

  const graphics = scene.make.graphics({ add: false });
  graphics.fillStyle(COLORS.white, 0.08);
  graphics.fillCircle(10, 10, 10);
  graphics.fillStyle(COLORS.cream, 0.7);
  graphics.fillCircle(10, 10, 3);
  generateHiDpiTexture(scene, graphics, "soft-dot", 20, 20);
  graphics.destroy();
}

function createMenuEmblem(scene) {
  if (scene.textures.exists("menu-emblem")) {
    return;
  }

  const graphics = scene.make.graphics({ add: false });

  graphics.fillStyle(COLORS.black, 0.28);
  graphics.fillCircle(68, 73, 62);

  graphics.fillStyle(COLORS.amberDark);
  graphics.fillCircle(68, 68, 62);
  graphics.lineStyle(5, COLORS.cream, 1);
  graphics.strokeCircle(68, 68, 57);

  graphics.fillStyle(COLORS.navy);
  graphics.fillCircle(68, 68, 46);

  graphics.fillStyle(COLORS.hillFar);
  graphics.fillTriangle(20, 78, 52, 45, 80, 78);
  graphics.fillStyle(COLORS.sky);
  graphics.fillTriangle(52, 78, 86, 38, 116, 78);

  graphics.fillStyle(COLORS.cream);
  graphics.fillRect(38, 73, 27, 20);
  graphics.fillStyle(COLORS.coral);
  graphics.fillTriangle(34, 74, 52, 59, 69, 74);
  graphics.fillStyle(COLORS.navy);
  graphics.fillRect(48, 82, 7, 11);

  graphics.fillStyle(COLORS.amber);
  graphics.fillTriangle(67, 112, 88, 76, 109, 112);
  graphics.fillStyle(COLORS.cream);
  graphics.fillTriangle(83, 112, 88, 76, 93, 112);

  generateHiDpiTexture(scene, graphics, "menu-emblem", 136, 140);
  graphics.destroy();
}

export function createProceduralTextures(scene) {
  createSoftDot(scene);
  createMenuEmblem(scene);
}
