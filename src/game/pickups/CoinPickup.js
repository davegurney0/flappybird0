import {
  COLORS,
  DEPTH,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../../config/constants.js";
import { PICKUP_CONFIG } from "../../config/pickupConfig.js";
import { addText } from "../../utils/addText.js";
import {
  createBoxCollider,
  disableCollider,
  setCircleCollider,
} from "../obstacles/obstaclePhysics.js";

export class CoinPickup {
  constructor(scene, colliderGroup) {
    this.scene = scene;
    this.active = false;
    this.collecting = false;
    this.x = -200;
    this.y = -200;
    this.elapsed = 0;

    this.glow = scene.add.graphics();
    this.glow.fillStyle(COLORS.amber, 0.15);
    this.glow.fillCircle(0, 0, 20);

    this.face = scene.add.graphics();
    this.sparkle = scene.add.graphics();
    this.valueText = addText(scene, 0, 1, "3", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "10px",
      color: TEXT_COLORS.ink,
      align: "center",
    })
      .setOrigin(0.5)
      .setVisible(false);

    this.content = scene.add.container(0, 0, [
      this.glow,
      this.face,
      this.sparkle,
      this.valueText,
    ]);
    this.container = scene.add
      .container(-200, -200, [this.content])
      .setDepth(DEPTH.obstacles + 1)
      .setVisible(false);

    this.collider = createBoxCollider(scene, colliderGroup);
    this.collider.pickupOwner = this;
  }

  redraw() {
    const edgeColor = this.risky ? COLORS.coral : COLORS.amberDark;

    this.face.clear();
    this.face.fillStyle(COLORS.black, 0.25);
    this.face.fillEllipse(2, 3, 23, 27);
    this.face.fillStyle(COLORS.amber);
    this.face.fillEllipse(0, 0, 22, 27);
    this.face.lineStyle(3, edgeColor, 0.95);
    this.face.strokeEllipse(0, 0, 20, 25);
    this.face.lineStyle(2, COLORS.cream, 0.62);
    this.face.lineBetween(-4, -8, -4, 7);

    this.sparkle.clear();
    this.sparkle.lineStyle(2, COLORS.cream, 0.95);
    this.sparkle.lineBetween(7, -16, 7, -10);
    this.sparkle.lineBetween(4, -13, 10, -13);
    this.valueText.setVisible(this.risky);
  }

  activate({ x, y, value, risky = false }) {
    this.scene.tweens.killTweensOf(this.container);
    this.active = true;
    this.collecting = false;
    this.x = x;
    this.y = y;
    this.value = value;
    this.risky = risky;
    this.elapsed = 0;
    this.redraw();
    this.content.setScale(1).setRotation(0);
    this.container
      .setPosition(x, y)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1);
    setCircleCollider(
      this.collider,
      x,
      y,
      PICKUP_CONFIG.coinRadius,
    );
  }

  collect() {
    if (!this.active || this.collecting) {
      return null;
    }

    this.collecting = true;
    disableCollider(this.collider);
    const result = Object.freeze({
      value: this.value,
      risky: this.risky,
      x: this.x,
      y: this.y,
    });

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 1.65,
      scaleY: 1.65,
      rotation: this.container.rotation + 0.42,
      duration: 170,
      ease: "Back.Out",
      onComplete: () => this.deactivate(),
    });

    return result;
  }

  update({
    delta,
    bird,
    speed,
    motionEnabled,
    magnetDistance,
  }) {
    if (!this.active || this.collecting) {
      return;
    }

    const safeDelta = Math.min(50, Math.max(0, delta));
    this.elapsed += safeDelta;

    if (motionEnabled) {
      this.x -= speed * (safeDelta / 1000);

      if (bird && magnetDistance > 0) {
        const offsetX = bird.x - this.x;
        const offsetY = bird.y - this.y;
        const distance = Math.hypot(offsetX, offsetY);

        if (distance > 1 && distance <= magnetDistance) {
          const attraction =
            Math.min(
              distance,
              PICKUP_CONFIG.magnetAttractionSpeed *
                (safeDelta / 1000),
            ) / distance;
          this.x += offsetX * attraction;
          this.y += offsetY * attraction;
        }
      }
    }

    this.container.setPosition(this.x, this.y);
    this.content.scaleX =
      0.5 + Math.abs(Math.cos(this.elapsed / 190)) * 0.5;
    this.content.rotation = Math.sin(this.elapsed / 420) * 0.09;
    this.glow.setAlpha(0.6 + Math.sin(this.elapsed / 150) * 0.22);
    this.sparkle.setAlpha(
      0.55 + Math.sin(this.elapsed / 105) * 0.42,
    );
    setCircleCollider(
      this.collider,
      this.x,
      this.y,
      PICKUP_CONFIG.coinRadius,
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
