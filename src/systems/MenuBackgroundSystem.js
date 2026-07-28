import {
  COLORS,
  DEPTH,
  GAME_SIZE,
} from "../config/constants.js";

const CLOUDS = Object.freeze([
  Object.freeze({
    x: -90,
    y: 118,
    scale: 0.78,
    alpha: 0.14,
    duration: 24_000,
    delay: 0,
  }),
  Object.freeze({
    x: 286,
    y: 252,
    scale: 0.54,
    alpha: 0.1,
    duration: 19_000,
    delay: 1_600,
  }),
  Object.freeze({
    x: 62,
    y: 352,
    scale: 0.68,
    alpha: 0.08,
    duration: 28_000,
    delay: 3_800,
  }),
]);

function createCloud(scene, config) {
  const cloud = scene.add
    .container(config.x, config.y)
    .setScale(config.scale)
    .setAlpha(config.alpha);
  const graphic = scene.add.graphics();

  graphic.fillStyle(COLORS.cream, 1);
  graphic.fillEllipse(0, 4, 104, 28);
  graphic.fillCircle(-27, -2, 22);
  graphic.fillCircle(2, -12, 30);
  graphic.fillCircle(32, -2, 21);
  cloud.add(graphic);

  return cloud;
}

function createFlyingBird(scene) {
  const bird = scene.add
    .container(-78, 306)
    .setAlpha(0.62)
    .setScale(0.82);
  const tail = scene.add.graphics();
  const body = scene.add.graphics();
  const wing = scene.add.graphics({ x: -5, y: 4 });
  const face = scene.add.graphics();

  tail.fillStyle(COLORS.coral, 0.92);
  tail.fillTriangle(-20, -6, -43, -15, -29, 2);
  tail.fillStyle(COLORS.amberDark, 0.88);
  tail.fillTriangle(-21, 2, -40, 11, -27, 12);

  body.fillStyle(COLORS.black, 0.18);
  body.fillEllipse(1, 5, 58, 38);
  body.fillStyle(COLORS.amberDark, 0.96);
  body.fillEllipse(-1, 1, 58, 38);
  body.fillStyle(COLORS.amber, 1);
  body.fillEllipse(5, -2, 45, 30);
  body.fillStyle(COLORS.cream, 0.58);
  body.fillEllipse(9, 6, 28, 16);
  body.lineStyle(2, COLORS.cream, 0.32);
  body.strokeEllipse(-1, 1, 56, 36);

  wing.fillStyle(COLORS.coral, 1);
  wing.fillEllipse(0, 0, 29, 20);
  wing.fillStyle(COLORS.amberDark, 0.9);
  wing.fillEllipse(-4, 1, 17, 11);

  face.fillStyle(COLORS.cream, 1);
  face.fillCircle(16, -9, 9);
  face.fillStyle(COLORS.ink, 1);
  face.fillCircle(19, -8, 4);
  face.fillStyle(COLORS.white, 1);
  face.fillCircle(20, -10, 1.5);
  face.fillStyle(COLORS.coral, 1);
  face.fillTriangle(23, -4, 41, 1, 23, 6);

  bird.add([tail, body, wing, face]);

  return { bird, wing };
}

export class MenuBackgroundSystem {
  constructor(scene, { reducedMotion = false } = {}) {
    this.scene = scene;
    this.reducedMotion = reducedMotion;
    this.root = scene.add
      .container(0, 0)
      .setDepth(DEPTH.scenery + 1);
    this.animatedTargets = [];

    this.clouds = CLOUDS.map((config) => {
      const cloud = createCloud(scene, config);
      this.root.add(cloud);

      if (!this.reducedMotion) {
        this.animatedTargets.push(cloud);
        scene.tweens.add({
          targets: cloud,
          x: GAME_SIZE.width + 100,
          duration: config.duration,
          delay: config.delay,
          ease: "Linear",
          repeat: -1,
        });
      }

      return cloud;
    });

    const { bird, wing } = createFlyingBird(scene);
    this.bird = bird;
    this.wing = wing;
    this.root.add(bird);

    if (this.reducedMotion) {
      bird.setPosition(322, 318).setAlpha(0.28);
      return;
    }

    this.animatedTargets.push(bird, wing);
    scene.tweens.add({
      targets: bird,
      x: GAME_SIZE.width + 82,
      duration: 12_500,
      ease: "Linear",
      repeat: -1,
      repeatDelay: 900,
    });
    scene.tweens.add({
      targets: bird,
      y: 292,
      angle: -2,
      duration: 1_450,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
    scene.tweens.add({
      targets: wing,
      angle: -24,
      scaleY: 0.72,
      duration: 150,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
  }

  destroy() {
    if (!this.root) {
      return;
    }

    for (const target of this.animatedTargets) {
      this.scene.tweens.killTweensOf(target);
    }

    this.root.destroy(true);
    this.root = null;
  }
}
