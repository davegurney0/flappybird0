import Phaser from "phaser";
import { COLORS } from "../../config/constants.js";
import { getBirdSkin } from "../../config/skinConfig.js";
import { createPoint } from "../../utils/createPoint.js";

function drawCrownPoints(graphics, palette) {
  graphics.fillStyle(palette.accessoryPrimary, 1);
  graphics.fillPoints(
    [
      createPoint(-14, -20),
      createPoint(-12, -35),
      createPoint(-4, -27),
      createPoint(3, -39),
      createPoint(10, -27),
      createPoint(18, -35),
      createPoint(16, -19),
    ],
    true,
  );
  graphics.lineStyle(2, palette.outline, 0.84);
  graphics.strokePoints(
    [
      createPoint(-14, -20),
      createPoint(-12, -35),
      createPoint(-4, -27),
      createPoint(3, -39),
      createPoint(10, -27),
      createPoint(18, -35),
      createPoint(16, -19),
    ],
    true,
  );
  graphics.fillStyle(palette.accessorySecondary, 1);
  graphics.fillCircle(3, -31, 3);
  graphics.fillStyle(0xff5b72, 1);
  graphics.fillCircle(-10, -27, 2);
  graphics.fillStyle(0x8f6dff, 1);
  graphics.fillCircle(14, -27, 2);
}

export function drawBirdSkinAccessory(
  graphics,
  skinValue,
  {
    evolutionAccent = null,
    evolutionLevel = 1,
  } = {},
) {
  const skin = getBirdSkin(skinValue?.id ?? skinValue);
  const palette = skin.palette;
  const accent = evolutionAccent ?? skin.rarity.color;

  if (skin.accessory === "straw-hat") {
    graphics.fillStyle(COLORS.black, 0.2);
    graphics.fillEllipse(-1, -20, 48, 9);
    graphics.fillStyle(palette.accessoryPrimary, 1);
    graphics.fillRoundedRect(-14, -34, 28, 15, 6);
    graphics.fillEllipse(0, -20, 48, 9);
    graphics.fillStyle(palette.accessorySecondary, 1);
    graphics.fillRect(-14, -25, 28, 5);
    graphics.lineStyle(1.5, palette.outline, 0.62);
    graphics.strokeRoundedRect(-14, -34, 28, 15, 6);
    graphics.lineBetween(-22, -20, 22, -20);
    graphics.fillStyle(0xfff0b5, 0.66);
    graphics.fillRoundedRect(-6, -32, 8, 5, 2);
    return;
  }

  if (skin.accessory === "flat-cap") {
    graphics.fillStyle(COLORS.black, 0.24);
    graphics.fillEllipse(-2, -19, 43, 10);
    graphics.fillStyle(palette.accessoryPrimary, 1);
    graphics.fillEllipse(-2, -27, 39, 18);
    graphics.fillRoundedRect(5, -22, 25, 6, 3);
    graphics.lineStyle(2, palette.outline, 0.78);
    graphics.strokeEllipse(-2, -27, 39, 18);
    graphics.fillStyle(palette.accessorySecondary, 0.96);
    graphics.fillTriangle(-14, 0, 11, 13, 7, 18);
    graphics.lineStyle(2, palette.accessorySecondary, 0.88);
    graphics.lineBetween(-12, -1, 10, 11);
    graphics.fillStyle(palette.outline, 0.92);
    graphics.fillEllipse(20, 1, 13, 5);
    return;
  }

  if (skin.accessory === "sunglasses") {
    graphics.fillStyle(palette.accessoryPrimary, 0.96);
    graphics.fillRoundedRect(4, -15, 18, 11, 4);
    graphics.fillRoundedRect(23, -14, 11, 10, 4);
    graphics.fillRect(19, -12, 7, 3);
    graphics.lineStyle(1.5, 0x6de0ff, 0.72);
    graphics.lineBetween(7, -13, 17, -7);
    graphics.lineBetween(25, -12, 31, -8);
    graphics.lineStyle(2, palette.accessorySecondary, 0.92);
    graphics.arc(-1, 3, 18, 0.18, 1.42, false);
    graphics.fillStyle(palette.accessorySecondary, 1);
    graphics.fillCircle(12, 16, 2.5);
    graphics.fillCircle(18, 14, 2.2);
    graphics.fillCircle(23, 11, 2);
    return;
  }

  if (skin.accessory === "fedora") {
    graphics.fillStyle(COLORS.black, 0.3);
    graphics.fillEllipse(0, -19, 52, 9);
    graphics.fillStyle(palette.accessoryPrimary, 1);
    graphics.fillRoundedRect(-14, -35, 31, 17, 6);
    graphics.fillEllipse(1, -19, 55, 10);
    graphics.fillStyle(palette.wingAccent, 1);
    graphics.fillRect(-14, -24, 31, 5);
    graphics.lineStyle(2, palette.outline, 0.9);
    graphics.strokeRoundedRect(-14, -35, 31, 17, 6);
    graphics.lineBetween(-27, -19, 28, -19);
    graphics.fillStyle(palette.accessoryPrimary, 0.96);
    graphics.fillTriangle(-12, 4, 2, 18, -5, 19);
    graphics.fillTriangle(6, 4, 0, 18, 14, 10);
    graphics.fillStyle(palette.wingAccent, 1);
    graphics.fillTriangle(1, 6, 7, 9, 3, 18);
    graphics.lineStyle(2, palette.accessorySecondary, 0.9);
    graphics.arc(-3, 3, 17, 0.18, 1.42, false);
    return;
  }

  if (skin.accessory === "space-helmet") {
    graphics.fillStyle(palette.accessoryPrimary, 0.09);
    graphics.fillEllipse(1, -1, 72, 58);
    graphics.lineStyle(4, palette.accessoryPrimary, 0.72);
    graphics.strokeEllipse(1, -1, 72, 58);
    graphics.lineStyle(2, accent, 0.88);
    graphics.strokeEllipse(1, -1, 63, 51);
    graphics.lineStyle(2, COLORS.white, 0.48);
    graphics.arc(-1, -3, 28, 3.55, 4.65, false);
    graphics.lineStyle(2, palette.accessorySecondary, 0.86);
    graphics.lineBetween(-1, -30, 4, -40);
    graphics.fillStyle(palette.accessorySecondary, 1);
    graphics.fillCircle(5, -42, 4);
    graphics.fillStyle(palette.outline, 0.84);
    graphics.fillRoundedRect(-11, 15, 29, 11, 4);
    graphics.fillStyle(accent, 1);
    graphics.fillCircle(-5, 20, 2);
    graphics.fillStyle(0x9dff5a, 1);
    graphics.fillCircle(2, 20, 2);
    graphics.fillStyle(0xffd447, 1);
    graphics.fillCircle(9, 20, 2);
    return;
  }

  drawCrownPoints(graphics, palette);
  graphics.fillStyle(palette.accessoryPrimary, 0.26);
  graphics.fillTriangle(-14, -1, 13, 18, 8, 22);
  graphics.lineStyle(4, palette.accessoryPrimary, 0.92);
  graphics.lineBetween(-12, -1, 10, 17);
  graphics.lineStyle(2, palette.accessorySecondary, 0.95);
  graphics.strokeCircle(-27, -12, 4);
  graphics.strokeCircle(34, 11, 3);

  if (evolutionLevel > 1) {
    graphics.fillStyle(accent, 0.92);
    graphics.fillCircle(-27, -12, 2);
    graphics.fillCircle(34, 11, 1.5);
  }
}

export class BirdSkinPreview extends Phaser.GameObjects.Container {
  constructor(
    scene,
    x,
    y,
    skin,
    {
      scale = 1,
      showBackdrop = true,
    } = {},
  ) {
    super(scene, x, y);

    this.showBackdrop = showBackdrop;
    this.backdrop = scene.add.graphics();
    this.bird = scene.add.graphics();
    this.add([this.backdrop, this.bird]);
    this.setScale(scale);
    this.setSkin(skin);
    scene.add.existing(this);
  }

  setSkin(skinValue) {
    this.skin = getBirdSkin(skinValue?.id ?? skinValue);
    this.draw();
    return this;
  }

  setSelected(selected) {
    this.selected = Boolean(selected);
    this.drawBackdrop();
    return this;
  }

  drawBackdrop() {
    const graphics = this.backdrop;
    const rarity = this.skin.rarity;

    graphics.clear();

    if (!this.showBackdrop) {
      if (this.selected) {
        graphics.fillStyle(rarity.color, 0.2);
        graphics.fillCircle(0, 0, 40);
        graphics.lineStyle(2, rarity.color, 0.7);
        graphics.strokeCircle(0, 0, 35);
      }
      return;
    }

    graphics.fillStyle(COLORS.black, 0.25);
    graphics.fillCircle(0, 3, 43);
    graphics.fillStyle(rarity.color, 0.1 + rarity.glowAlpha);
    graphics.fillCircle(0, 0, 41);
    graphics.lineStyle(
      this.selected ? 3 : 2,
      rarity.color,
      this.selected ? 0.92 : 0.5,
    );
    graphics.strokeCircle(0, 0, 39);
  }

  draw() {
    const graphics = this.bird;
    const palette = this.skin.palette;

    this.drawBackdrop();
    graphics.clear();

    graphics.fillStyle(palette.wing, 1);
    graphics.fillTriangle(-19, -7, -41, -16, -29, 1);
    graphics.fillStyle(palette.wingAccent, 0.94);
    graphics.fillTriangle(-20, 2, -38, 11, -25, 13);

    graphics.fillStyle(COLORS.black, 0.28);
    graphics.fillEllipse(1, 5, 55, 38);
    graphics.fillStyle(palette.bodyDark, 1);
    graphics.fillEllipse(-1, 1, 54, 38);
    graphics.fillStyle(palette.body, 1);
    graphics.fillEllipse(4, -2, 43, 30);
    graphics.fillStyle(palette.belly, 0.72);
    graphics.fillEllipse(8, 6, 28, 17);
    graphics.lineStyle(2, palette.outline, 0.76);
    graphics.strokeEllipse(-1, 1, 52, 36);

    graphics.fillStyle(palette.wing, 1);
    graphics.fillEllipse(-8, 5, 28, 19);
    graphics.fillStyle(palette.wingAccent, 0.9);
    graphics.fillEllipse(-11, 6, 17, 10);
    graphics.lineStyle(1.5, palette.outline, 0.52);
    graphics.strokeEllipse(-8, 5, 27, 18);

    graphics.fillStyle(0xfff8df, 1);
    graphics.fillCircle(14, -8, 9);
    graphics.fillStyle(palette.outline, 1);
    graphics.fillCircle(17, -8, 4);
    graphics.fillStyle(COLORS.white, 1);
    graphics.fillCircle(18, -10, 1.5);
    graphics.fillStyle(palette.beak, 1);
    graphics.fillTriangle(23, -3, 39, 1, 23, 7);
    graphics.lineStyle(1.3, palette.outline, 0.6);
    graphics.lineBetween(24, 1, 36, 1);

    drawBirdSkinAccessory(graphics, this.skin);
  }
}
