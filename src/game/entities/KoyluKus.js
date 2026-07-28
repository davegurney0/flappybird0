import Phaser from "phaser";
import { COLORS } from "../../config/constants.js";
import {
  EVOLUTION_STAGES,
  getEvolutionHitboxRadius,
} from "../../config/evolutionConfig.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";
import {
  createSkinEvolutionAppearance,
  getBirdSkin,
} from "../../config/skinConfig.js";
import { createPoint } from "../../utils/createPoint.js";
import { drawBirdSkinAccessory } from "../graphics/birdSkinGraphics.js";

const BIRD_WIDTH = 58;
const BIRD_HEIGHT = 44;
const BODY_CENTER_X = BIRD_WIDTH / 2;
const BODY_CENTER_Y = BIRD_HEIGHT / 2;

function createStarPoints(
  centerX,
  centerY,
  outerRadius,
  innerRadius,
  pointCount = 5,
) {
  const points = [];

  for (let index = 0; index < pointCount * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (Math.PI * index) / pointCount;

    points.push(
      createPoint(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
      ),
    );
  }

  return points;
}

export class KoyluKus extends Phaser.GameObjects.Container {
  constructor(scene, x, y, skin) {
    super(scene, x, y);

    this.spawnX = x;
    this.spawnY = y;
    this.isAlive = true;
    this.readyTween = null;
    this.evolutionStage = EVOLUTION_STAGES[0];
    this.skin = getBirdSkin(skin?.id ?? skin);
    this.appearanceStage = this.evolutionStage;
    this.coinMagnetDistance = 0;
    this.currentHitboxRadius = GAME_BALANCE.birdRadius;

    this.auraGraphic = scene.add.graphics();
    this.tailGraphic = scene.add.graphics();
    this.bodyGraphic = scene.add.graphics();
    this.wing = scene.add.graphics({ x: -10, y: 4 });
    this.faceGraphic = scene.add.graphics();
    this.detailGraphic = scene.add.graphics();
    this.skinGraphic = scene.add.graphics();

    this.add([
      this.auraGraphic,
      this.tailGraphic,
      this.bodyGraphic,
      this.wing,
      this.faceGraphic,
      this.detailGraphic,
      this.skinGraphic,
    ]);
    this.setSize(BIRD_WIDTH, BIRD_HEIGHT);
    this.setDepth(32);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body
      .setCircle(GAME_BALANCE.birdRadius, 11, 4)
      .setAllowGravity(false)
      .setGravityY(GAME_BALANCE.gravity)
      .setMaxVelocity(900, GAME_BALANCE.maxFallVelocity)
      .setCollideWorldBounds(false);

    this.applyEvolution(this.evolutionStage);
  }

  drawAura(stage) {
    const graphics = this.auraGraphic;
    const { glow, detail } = stage.palette;

    graphics.clear();

    if (stage.level === 2) {
      graphics.lineStyle(3, glow, 0.48);
      graphics.lineBetween(-36, -11, -49, -11);
      graphics.lineBetween(-39, 0, -56, 0);
      graphics.lineBetween(-35, 11, -47, 11);
      return;
    }

    if (stage.level === 3) {
      graphics.lineStyle(2, glow, 0.28);
      graphics.strokeCircle(0, 0, 31);
      graphics.lineStyle(1, detail, 0.5);
      graphics.lineBetween(-32, -14, -27, -14);
      graphics.lineBetween(-32, 14, -24, 14);
      graphics.lineBetween(27, -15, 33, -15);
      return;
    }

    if (stage.level === 4) {
      graphics.lineStyle(3, glow, 0.34);

      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        graphics.lineBetween(
          Math.cos(angle) * 30,
          Math.sin(angle) * 23,
          Math.cos(angle) * 38,
          Math.sin(angle) * 31,
        );
      }
      return;
    }

    if (stage.level === 5) {
      graphics.lineStyle(3, glow, 0.42);
      graphics.strokeEllipse(0, 1, 68, 54);
      graphics.lineStyle(1, detail, 0.55);
      graphics.strokeEllipse(0, 1, 76, 62);
      graphics.fillStyle(glow, 0.88);
      graphics.fillPoints(createStarPoints(-34, -18, 4, 2), true);
      graphics.fillPoints(createStarPoints(35, 14, 4, 2), true);
    }
  }

  drawTail(stage) {
    const graphics = this.tailGraphic;
    const { wing, wingAccent, bodyDark, detail } = stage.palette;

    graphics.clear();

    if (stage.wing.style === "round") {
      graphics.fillStyle(wing);
      graphics.fillTriangle(-20, -7, -34, -17, -30, 2);
      graphics.fillStyle(bodyDark);
      graphics.fillTriangle(-20, 2, -32, 4, -24, 14);
      return;
    }

    if (stage.wing.style === "swept") {
      graphics.fillStyle(wing);
      graphics.fillTriangle(-19, -9, -43, -14, -27, 0);
      graphics.fillStyle(wingAccent);
      graphics.fillTriangle(-22, 0, -47, 5, -26, 10);
      graphics.lineStyle(2, detail, 0.62);
      graphics.lineBetween(-30, -8, -39, -10);
      graphics.lineBetween(-31, 5, -42, 6);
      return;
    }

    if (stage.wing.style === "tech") {
      graphics.fillStyle(bodyDark);
      graphics.fillTriangle(-19, -10, -43, -9, -30, 1);
      graphics.fillStyle(wing);
      graphics.fillTriangle(-20, 0, -40, 5, -25, 13);
      graphics.lineStyle(2, wingAccent, 0.92);
      graphics.lineBetween(-36, -7, -27, -2);
      graphics.lineBetween(-34, 6, -25, 7);
      return;
    }

    if (stage.wing.style === "spiked") {
      graphics.fillStyle(wing);
      graphics.fillTriangle(-18, -9, -44, -17, -31, -1);
      graphics.fillTriangle(-20, -1, -48, 2, -27, 9);
      graphics.fillStyle(wingAccent);
      graphics.fillTriangle(-20, 7, -41, 17, -24, 14);
      return;
    }

    graphics.fillStyle(wing);
    graphics.fillTriangle(-18, -9, -45, -16, -30, 0);
    graphics.fillTriangle(-20, 1, -43, 7, -27, 13);
    graphics.lineStyle(3, wingAccent, 0.95);
    graphics.lineBetween(-38, -10, -28, -4);
    graphics.lineBetween(-37, 6, -27, 7);
  }

  drawBody(stage) {
    const graphics = this.bodyGraphic;
    const {
      body,
      bodyDark,
      belly,
      outline,
      detail,
    } = stage.palette;

    graphics.clear();
    graphics.fillStyle(COLORS.black, 0.28);
    graphics.fillEllipse(1, 5, 54, 38);
    graphics.fillStyle(bodyDark);
    graphics.fillEllipse(-1, 1, 54, 38);
    graphics.fillStyle(body);
    graphics.fillEllipse(4, -2, 43, 30);
    graphics.fillStyle(belly, stage.level >= 3 ? 0.74 : 0.65);
    graphics.fillEllipse(8, 6, 28, 17);
    graphics.lineStyle(2, outline, 0.72);
    graphics.strokeEllipse(-1, 1, 52, 36);

    if (stage.level === 2) {
      graphics.lineStyle(3, detail, 0.68);
      graphics.lineBetween(-5, -9, 8, -13);
      graphics.lineBetween(-8, -2, 4, -5);
    }

    if (stage.level === 3) {
      graphics.lineStyle(2, detail, 0.9);
      graphics.strokeRoundedRect(-11, -9, 23, 18, 4);
      graphics.lineBetween(0, -9, 0, -16);
      graphics.fillStyle(detail, 0.95);
      graphics.fillCircle(0, -17, 2);
    }

    if (stage.level === 4) {
      graphics.lineStyle(2, detail, 0.82);
      graphics.lineBetween(-12, -8, -4, -1);
      graphics.lineBetween(-4, -1, -12, 7);
      graphics.fillStyle(detail, 0.78);
      graphics.fillCircle(-15, -10, 2);
      graphics.fillCircle(-11, 11, 2);
    }

    if (stage.level === 5) {
      graphics.lineStyle(2, detail, 0.88);
      graphics.strokeCircle(-6, 0, 8);
      graphics.fillStyle(detail, 0.92);
      graphics.fillCircle(-6, 0, 2);
    }
  }

  drawWing(stage) {
    const graphics = this.wing;
    const { wing, wingAccent, outline, detail } = stage.palette;

    graphics.clear();

    if (stage.wing.style === "round") {
      graphics.fillStyle(wing);
      graphics.fillEllipse(0, 0, 27, 19);
      graphics.fillStyle(wingAccent);
      graphics.fillEllipse(-3, 1, 17, 11);
      graphics.lineStyle(2, outline, 0.48);
      graphics.strokeEllipse(0, 0, 26, 18);
      return;
    }

    if (stage.wing.style === "swept") {
      graphics.fillStyle(wing);
      graphics.fillTriangle(-13, -7, 18, -3, -8, 13);
      graphics.fillStyle(wingAccent);
      graphics.fillTriangle(-7, -2, 11, 0, -5, 8);
      graphics.lineStyle(2, outline, 0.62);
      graphics.lineBetween(-12, -6, 17, -2);
      return;
    }

    if (stage.wing.style === "tech") {
      graphics.fillStyle(wing);
      graphics.fillPoints(
        [
          createPoint(-13, -7),
          createPoint(14, -8),
          createPoint(18, 1),
          createPoint(2, 12),
          createPoint(-12, 8),
        ],
        true,
      );
      graphics.lineStyle(2, wingAccent, 0.95);
      graphics.strokePoints(
        [
          createPoint(-13, -7),
          createPoint(14, -8),
          createPoint(18, 1),
          createPoint(2, 12),
          createPoint(-12, 8),
        ],
        true,
      );
      graphics.lineBetween(-4, 1, 10, -2);
      return;
    }

    if (stage.wing.style === "spiked") {
      graphics.fillStyle(wing);
      graphics.fillTriangle(-14, -7, 18, -8, 2, 2);
      graphics.fillTriangle(-11, 0, 16, 2, -2, 9);
      graphics.fillTriangle(-8, 7, 10, 11, -5, 15);
      graphics.lineStyle(2, wingAccent, 0.86);
      graphics.lineBetween(-10, 0, 13, 1);
      return;
    }

    graphics.fillStyle(wing);
    graphics.fillEllipse(0, 0, 31, 22);
    graphics.fillStyle(wingAccent);
    graphics.fillPoints(createStarPoints(0, 0, 10, 5), true);
    graphics.lineStyle(2, outline, 0.72);
    graphics.strokeEllipse(0, 0, 30, 21);
    graphics.fillStyle(detail, 0.8);
    graphics.fillCircle(-8, 2, 2);
  }

  drawEye(graphics, stage) {
    const { eye, pupil, detail, outline } = stage.palette;
    const style = stage.eye.style;

    if (style === "visor") {
      graphics.fillStyle(eye);
      graphics.fillRoundedRect(6, -16, 24, 13, 5);
      graphics.lineStyle(2, detail, 0.95);
      graphics.strokeRoundedRect(6, -16, 24, 13, 5);
      graphics.fillStyle(pupil);
      graphics.fillRoundedRect(18, -13, 8, 4, 2);
      return;
    }

    graphics.fillStyle(eye);
    graphics.fillCircle(14, -8, 9);
    graphics.lineStyle(1.5, outline, 0.54);
    graphics.strokeCircle(14, -8, 9);

    if (style === "focused") {
      graphics.fillStyle(pupil);
      graphics.fillEllipse(18, -7, 7, 9);
      graphics.lineStyle(3, outline, 0.9);
      graphics.lineBetween(7, -16, 21, -12);
      graphics.fillStyle(COLORS.white);
      graphics.fillCircle(19, -10, 1.4);
      return;
    }

    if (style === "spiral") {
      graphics.lineStyle(2, pupil, 0.96);
      graphics.strokeCircle(14, -8, 6);
      graphics.strokeCircle(14, -8, 3);
      graphics.lineBetween(14, -8, 21, -8);
      graphics.fillStyle(detail);
      graphics.fillCircle(14, -8, 1.4);
      return;
    }

    if (style === "star") {
      graphics.fillStyle(pupil);
      graphics.fillPoints(createStarPoints(15, -8, 6, 2.7), true);
      graphics.fillStyle(COLORS.white);
      graphics.fillCircle(17, -11, 1.2);
      return;
    }

    graphics.fillStyle(pupil);
    graphics.fillCircle(17, -8, 4);
    graphics.fillStyle(COLORS.white);
    graphics.fillCircle(18, -10, 1.5);
  }

  drawFace(stage) {
    const graphics = this.faceGraphic;
    const { beak, detail, outline } = stage.palette;

    graphics.clear();
    this.drawEye(graphics, stage);
    graphics.fillStyle(beak);
    graphics.fillTriangle(23, -3, 38, 1, 23, 7);
    graphics.lineStyle(1.5, outline, 0.58);
    graphics.lineBetween(24, 1, 35, 1);

    if (stage.level >= 3) {
      graphics.fillStyle(detail, 0.92);
      graphics.fillCircle(25, 11, 2);
    }
  }

  drawDetails(stage) {
    const graphics = this.detailGraphic;
    const {
      belly,
      beak,
      detail,
      outline,
      wingAccent,
    } = stage.palette;

    graphics.clear();

    if (stage.level === 1) {
      graphics.fillStyle(belly);
      graphics.fillTriangle(-7, -18, -2, -30, 3, -17);
      graphics.fillStyle(beak);
      graphics.fillTriangle(0, -18, 8, -27, 9, -14);
      return;
    }

    if (stage.level === 2) {
      graphics.fillStyle(wingAccent);
      graphics.fillTriangle(-5, -18, 4, -31, 7, -16);
      graphics.fillStyle(beak);
      graphics.fillTriangle(3, -18, 13, -28, 12, -13);
      graphics.lineStyle(2, detail, 0.85);
      graphics.lineBetween(-13, 15, 2, 18);
      return;
    }

    if (stage.level === 3) {
      graphics.lineStyle(2, detail, 0.9);
      graphics.lineBetween(-2, -19, 2, -29);
      graphics.lineBetween(2, -29, 8, -25);
      graphics.fillStyle(detail);
      graphics.fillCircle(2, -30, 2);
      graphics.lineStyle(2, wingAccent, 0.88);
      graphics.lineBetween(-15, 11, -6, 11);
      graphics.lineBetween(-6, 11, -2, 16);
      return;
    }

    if (stage.level === 4) {
      graphics.fillStyle(wingAccent);
      graphics.fillTriangle(-10, -17, -7, -31, 0, -18);
      graphics.fillStyle(beak);
      graphics.fillTriangle(-1, -18, 8, -33, 10, -16);
      graphics.fillStyle(detail);
      graphics.fillTriangle(8, -17, 19, -27, 17, -12);
      graphics.lineStyle(2, outline, 0.78);
      graphics.lineBetween(-8, 16, 6, 18);
      graphics.lineBetween(6, 18, 13, 13);
      return;
    }

    graphics.fillStyle(wingAccent);
    graphics.fillPoints(
      [
        createPoint(-9, -18),
        createPoint(-7, -34),
        createPoint(0, -27),
        createPoint(7, -38),
        createPoint(12, -25),
        createPoint(20, -32),
        createPoint(18, -17),
      ],
      true,
    );
    graphics.lineStyle(2, outline, 0.8);
    graphics.strokePoints(
      [
        createPoint(-9, -18),
        createPoint(-7, -34),
        createPoint(0, -27),
        createPoint(7, -38),
        createPoint(12, -25),
        createPoint(20, -32),
        createPoint(18, -17),
      ],
      true,
    );
    graphics.fillStyle(detail);
    graphics.fillCircle(7, -32, 2.5);
  }

  redrawAppearance() {
    this.appearanceStage = createSkinEvolutionAppearance(
      this.evolutionStage,
      this.skin,
    );
    this.drawAura(this.appearanceStage);
    this.drawTail(this.appearanceStage);
    this.drawBody(this.appearanceStage);
    this.drawWing(this.appearanceStage);
    this.drawFace(this.appearanceStage);
    this.drawDetails(this.appearanceStage);
    this.skinGraphic.clear();
    drawBirdSkinAccessory(this.skinGraphic, this.skin, {
      evolutionAccent: this.appearanceStage.palette.detail,
      evolutionLevel: this.evolutionStage.level,
    });
  }

  applySkin(skinValue) {
    this.skin = getBirdSkin(skinValue?.id ?? skinValue);
    this.redrawAppearance();
    return this.skin;
  }

  applyEvolution(stage) {
    if (!stage) {
      return;
    }

    this.evolutionStage = stage;
    this.coinMagnetDistance = stage.benefits.coinMagnetDistance;
    this.currentHitboxRadius = getEvolutionHitboxRadius(
      GAME_BALANCE.birdRadius,
      stage,
    );
    this.scene.tweens.killTweensOf(this.wing);
    this.wing.setRotation(0);
    this.redrawAppearance();

    if (this.body) {
      this.body.setCircle(
        this.currentHitboxRadius,
        BODY_CENTER_X - this.currentHitboxRadius,
        BODY_CENTER_Y - this.currentHitboxRadius,
      );
    }
  }

  beginReadyMotion() {
    this.stopReadyMotion();
    this.readyTween = this.scene.tweens.add({
      targets: this,
      y: this.spawnY - 8,
      duration: 720,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
  }

  stopReadyMotion() {
    this.readyTween?.stop();
    this.readyTween = null;
  }

  resetForRun(
    stage = EVOLUTION_STAGES[0],
    skin = this.skin,
  ) {
    this.stopReadyMotion();
    this.skin = getBirdSkin(skin?.id ?? skin);
    this.applyEvolution(stage);
    this.isAlive = true;
    this.setVisible(true);
    this.setAlpha(1);
    this.setRotation(0);
    this.setScale(1);
    this.wing.setRotation(0);
    this.body.reset(this.spawnX, this.spawnY);
    this.body.setAllowGravity(false);
    this.body.setGravityY(GAME_BALANCE.gravity);
    this.body.setVelocity(0, 0);
    this.beginReadyMotion();
  }

  startFlying() {
    this.stopReadyMotion();
    this.body.setAllowGravity(true);
  }

  flap() {
    if (!this.isAlive) {
      return;
    }

    const flapVelocity =
      GAME_BALANCE.flapVelocity *
      this.evolutionStage.benefits.flapVelocityMultiplier;

    this.body.setVelocityY(flapVelocity);
    this.scene.tweens.killTweensOf(this.wing);
    this.wing.setRotation(-0.5);
    this.scene.tweens.add({
      targets: this.wing,
      rotation: 0.28,
      duration: this.evolutionStage.wing.flapDuration,
      ease: "Back.Out",
    });
  }

  applyVerticalAcceleration(acceleration, delta) {
    if (!this.isAlive || !this.body.allowGravity) {
      return;
    }

    const safeDelta = Math.min(Math.max(delta, 0), 50);
    const minimumWindVelocity = GAME_BALANCE.flapVelocity * 0.9;
    const nextVelocity = Phaser.Math.Clamp(
      this.body.velocity.y + acceleration * (safeDelta / 1000),
      minimumWindVelocity,
      GAME_BALANCE.maxFallVelocity,
    );
    this.body.setVelocityY(nextVelocity);
  }

  beginDeath() {
    this.isAlive = false;
    this.stopReadyMotion();
    this.body.setAllowGravity(true);
    this.body.setVelocityX(0);
    this.body.setVelocityY(90);
  }

  land() {
    this.body.reset(this.x, GAME_BALANCE.groundY - 22);
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.setRotation(1.12);
  }

  updateMotion(delta) {
    if (!this.body?.enable) {
      return;
    }

    if (this.body.velocity.y > GAME_BALANCE.maxFallVelocity) {
      this.body.setVelocityY(GAME_BALANCE.maxFallVelocity);
    }

    const velocityY = this.body.velocity.y;
    const targetRotation =
      velocityY <= 0
        ? Phaser.Math.Linear(
            GAME_BALANCE.rotationNeutral,
            GAME_BALANCE.rotationUp,
            Phaser.Math.Clamp(
              velocityY / GAME_BALANCE.flapVelocity,
              0,
              1,
            ),
          )
        : Phaser.Math.Linear(
            GAME_BALANCE.rotationNeutral,
            GAME_BALANCE.rotationDown,
            Phaser.Math.Clamp(
              velocityY / GAME_BALANCE.maxFallVelocity,
              0,
              1,
            ),
          );
    const smoothing =
      1 - Math.exp(-GAME_BALANCE.rotationResponsiveness * (delta / 1000));

    this.rotation = Phaser.Math.Linear(
      this.rotation,
      targetRotation,
      smoothing,
    );
  }
}
