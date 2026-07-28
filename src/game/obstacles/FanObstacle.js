import { COLORS, DEPTH } from "../../config/constants.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";
import {
  createBoxCollider,
  disableCollider,
  setBoxCollider,
  setCircleCollider,
} from "./obstaclePhysics.js";

function drawRotor(graphics) {
  const radius = GAME_BALANCE.fanRadius;

  graphics.clear();
  graphics.fillStyle(COLORS.coral);
  graphics.fillRoundedRect(13, -10, radius - 15, 20, 7);
  graphics.fillRoundedRect(-radius + 2, -10, radius - 15, 20, 7);
  graphics.fillRoundedRect(-10, 13, 20, radius - 15, 7);
  graphics.fillRoundedRect(-10, -radius + 2, 20, radius - 15, 7);

  graphics.fillStyle(COLORS.amberDark);
  graphics.fillTriangle(23, -8, radius - 2, -17, radius - 2, 17);
  graphics.fillTriangle(-23, 8, -radius + 2, 17, -radius + 2, -17);
  graphics.fillTriangle(-8, 23, -17, radius - 2, 17, radius - 2);
  graphics.fillTriangle(8, -23, 17, -radius + 2, -17, -radius + 2);
}

export class FanObstacle {
  constructor(scene, colliderGroup) {
    this.active = false;
    this.scored = false;
    this.x = -300;
    this.anchor = "bottom";
    this.rotationDirection = 1;

    this.support = scene.add.graphics();
    this.rotor = scene.add.graphics();
    drawRotor(this.rotor);

    this.guard = scene.add.graphics();
    this.guard.fillStyle(COLORS.ink, 0.92);
    this.guard.fillCircle(0, 0, 17);
    this.guard.fillStyle(COLORS.amber);
    this.guard.fillCircle(0, 0, 10);
    this.guard.lineStyle(4, COLORS.cream, 0.28);
    this.guard.strokeCircle(0, 0, GAME_BALANCE.fanRadius);
    this.guard.lineStyle(2, COLORS.coral, 0.55);
    this.guard.strokeCircle(0, 0, GAME_BALANCE.fanRadius - 6);

    this.container = scene.add
      .container(-300, -300, [
        this.support,
        this.rotor,
        this.guard,
      ])
      .setDepth(DEPTH.obstacles)
      .setVisible(false);

    this.rotorCollider = createBoxCollider(scene, colliderGroup);
    this.supportCollider = createBoxCollider(scene, colliderGroup);
  }

  drawSupport(y) {
    const isTop = this.anchor === "top";
    const supportEnd = isTop ? -y : GAME_BALANCE.groundY - y;
    const halfWidth = GAME_BALANCE.fanSupportWidth / 2;

    this.support.clear();
    this.support.fillStyle(COLORS.black, 0.28);
    this.support.fillRoundedRect(
      -halfWidth - 4,
      Math.min(0, supportEnd),
      GAME_BALANCE.fanSupportWidth + 8,
      Math.abs(supportEnd),
      7,
    );
    this.support.fillStyle(COLORS.amberDark);
    this.support.fillRoundedRect(
      -halfWidth,
      Math.min(0, supportEnd),
      GAME_BALANCE.fanSupportWidth,
      Math.abs(supportEnd),
      6,
    );
    this.support.lineStyle(2, COLORS.cream, 0.22);
    this.support.lineBetween(
      -halfWidth + 4,
      Math.min(0, supportEnd),
      -halfWidth + 4,
      Math.max(0, supportEnd),
    );
  }

  activate({ x, anchor, rotationDirection }) {
    this.active = true;
    this.scored = false;
    this.x = x;
    this.anchor = anchor === "top" ? "top" : "bottom";
    this.rotationDirection = rotationDirection < 0 ? -1 : 1;
    this.y =
      this.anchor === "top"
        ? GAME_BALANCE.fanTopY
        : GAME_BALANCE.fanBottomY;
    this.rotor.rotation = 0;
    this.drawSupport(this.y);
    this.container.setPosition(this.x, this.y).setVisible(true);
    this.updateColliders();
  }

  updateColliders() {
    setCircleCollider(
      this.rotorCollider,
      this.x,
      this.y,
      GAME_BALANCE.fanRadius,
    );

    const supportTop =
      this.anchor === "top" ? 0 : this.y;
    const supportBottom =
      this.anchor === "top" ? this.y : GAME_BALANCE.groundY;
    setBoxCollider(
      this.supportCollider,
      this.x,
      (supportTop + supportBottom) / 2,
      GAME_BALANCE.fanSupportWidth,
      supportBottom - supportTop,
    );
  }

  update({
    delta,
    birdX,
    speed,
    motionEnabled,
    onPassed,
  }) {
    if (!this.active) {
      return;
    }

    const safeDelta = Math.min(Math.max(delta, 0), 50);

    if (motionEnabled) {
      this.x -= speed * (safeDelta / 1000);
      this.rotor.rotation +=
        this.rotationDirection *
        GAME_BALANCE.fanRotationSpeed *
        (safeDelta / 1000);
    }

    this.container.x = this.x;
    this.updateColliders();

    if (
      !this.scored &&
      this.x + GAME_BALANCE.fanRadius < birdX
    ) {
      this.scored = true;
      onPassed?.();
    }

    if (this.x < -GAME_BALANCE.fanRadius - 40) {
      this.deactivate();
    }
  }

  deactivate() {
    this.active = false;
    this.scored = false;
    this.x = -300;
    this.container.setVisible(false).setPosition(-300, -300);
    disableCollider(this.rotorCollider);
    disableCollider(this.supportCollider);
  }
}
