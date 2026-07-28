import {
  COLORS,
  DEPTH,
} from "../../config/constants.js";
import {
  PICKUP_CONFIG,
  getPowerUpConfig,
} from "../../config/pickupConfig.js";
import {
  createBoxCollider,
  disableCollider,
  setCircleCollider,
} from "../obstacles/obstaclePhysics.js";
import { drawPowerUpIcon } from "./powerUpVisuals.js";

export class PowerUpPickup {
  constructor(scene, colliderGroup, type) {
    this.scene = scene;
    this.type = type;
    this.config = getPowerUpConfig(type);
    this.active = false;
    this.collecting = false;
    this.x = -200;
    this.y = -200;
    this.elapsed = 0;

    this.glow = scene.add.graphics();
    this.glow.fillStyle(this.config.color, 0.14);
    this.glow.fillCircle(0, 0, 28);
    this.shell = scene.add.graphics();
    this.shell.fillStyle(COLORS.ink, 0.92);
    this.shell.fillCircle(0, 0, 21);
    this.shell.lineStyle(3, this.config.color, 0.9);
    this.shell.strokeCircle(0, 0, 20);
    this.shell.lineStyle(1, COLORS.cream, 0.38);
    this.shell.strokeCircle(0, 0, 16);
    this.icon = scene.add.graphics();
    drawPowerUpIcon(this.icon, type, 0.88);

    this.content = scene.add.container(0, 0, [
      this.glow,
      this.shell,
      this.icon,
    ]);
    this.container = scene.add
      .container(-200, -200, [this.content])
      .setDepth(DEPTH.obstacles + 2)
      .setVisible(false);

    this.collider = createBoxCollider(scene, colliderGroup);
    this.collider.pickupOwner = this;
  }

  activate({ x, y }) {
    this.scene.tweens.killTweensOf(this.container);
    this.active = true;
    this.collecting = false;
    this.x = x;
    this.y = y;
    this.elapsed = 0;
    this.content.setScale(1).setRotation(0);
    this.container
      .setPosition(x, y)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1)
      .setRotation(0);
    setCircleCollider(
      this.collider,
      x,
      y,
      PICKUP_CONFIG.powerUpRadius,
    );
  }

  collect() {
    if (!this.active || this.collecting) {
      return null;
    }

    this.collecting = true;
    disableCollider(this.collider);
    const result = Object.freeze({
      type: this.type,
      x: this.x,
      y: this.y,
    });

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      rotation: this.container.rotation + 0.55,
      duration: 205,
      ease: "Back.Out",
      onComplete: () => this.deactivate(),
    });

    return result;
  }

  update({ delta, speed, motionEnabled }) {
    if (!this.active || this.collecting) {
      return;
    }

    const safeDelta = Math.min(50, Math.max(0, delta));
    this.elapsed += safeDelta;

    if (motionEnabled) {
      this.x -= speed * (safeDelta / 1000);
    }

    this.container.setPosition(
      this.x,
      this.y + Math.sin(this.elapsed / 250) * 4,
    );
    this.content.rotation += safeDelta * 0.00065;
    this.content.setScale(
      1 + Math.sin(this.elapsed / 180) * 0.045,
    );
    this.glow.setAlpha(
      0.58 + Math.sin(this.elapsed / 125) * 0.24,
    );
    setCircleCollider(
      this.collider,
      this.container.x,
      this.container.y,
      PICKUP_CONFIG.powerUpRadius,
    );

    if (this.x < PICKUP_CONFIG.offscreenX) {
      this.deactivate();
    }
  }

  deactivate() {
    this.scene.tweens.killTweensOf(this.container);
    this.active = false;
    this.collecting = false;
    this.x = -200;
    this.y = -200;
    this.container
      .setVisible(false)
      .setPosition(-200, -200)
      .setAlpha(1)
      .setScale(1)
      .setRotation(0);
    this.content.setScale(1).setRotation(0);
    disableCollider(this.collider);
  }

  destroy() {
    this.deactivate();
    this.collider.destroy();
    this.container.destroy(true);
  }
}
