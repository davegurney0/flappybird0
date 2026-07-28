import {
  COLORS,
  DEPTH,
  GAME_SIZE,
} from "../config/constants.js";
import {
  POWER_UP_TYPES,
  getPowerUpConfig,
} from "../config/pickupConfig.js";

function hasPowerUp(snapshot, type) {
  return snapshot?.active?.some((item) => item.type === type);
}

export class PowerUpEffectsSystem {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;

    this.slowOverlay = scene.add
      .rectangle(
        GAME_SIZE.width / 2,
        GAME_SIZE.height / 2,
        GAME_SIZE.width,
        GAME_SIZE.height,
        getPowerUpConfig(POWER_UP_TYPES.slowMotion).color,
        0,
      )
      .setDepth(DEPTH.content + 1)
      .setVisible(false);

    this.magnetRing = scene.add
      .graphics()
      .setDepth(DEPTH.content + 2)
      .setVisible(false);
    this.magnetRing.lineStyle(
      2,
      getPowerUpConfig(POWER_UP_TYPES.coinMagnet).color,
      0.34,
    );
    this.magnetRing.strokeCircle(0, 0, 43);
    this.magnetRing.lineStyle(1, COLORS.cream, 0.18);
    this.magnetRing.strokeCircle(0, 0, 49);

    this.shieldRing = scene.add
      .graphics()
      .setDepth(DEPTH.content + 3)
      .setVisible(false);
    this.shieldRing.lineStyle(
      4,
      getPowerUpConfig(POWER_UP_TYPES.shield).color,
      0.74,
    );
    this.shieldRing.strokeEllipse(0, 0, 75, 61);
    this.shieldRing.lineStyle(1.5, COLORS.cream, 0.54);
    this.shieldRing.strokeEllipse(0, 0, 66, 53);

    this.impactRing = scene.add
      .graphics()
      .setDepth(DEPTH.content + 4)
      .setVisible(false);
    this.impactRing.lineStyle(
      5,
      getPowerUpConfig(POWER_UP_TYPES.shield).color,
      0.96,
    );
    this.impactRing.strokeCircle(0, 0, 34);
  }

  showShieldImpact(player) {
    this.scene.tweens.killTweensOf(this.impactRing);
    this.impactRing.clear();
    this.impactRing.lineStyle(
      5,
      getPowerUpConfig(POWER_UP_TYPES.shield).color,
      0.96,
    );
    this.impactRing.strokeCircle(0, 0, 34);
    this.impactRing
      .setPosition(player.x, player.y)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.72);
    this.scene.tweens.add({
      targets: this.impactRing,
      alpha: 0,
      scaleX: 1.75,
      scaleY: 1.75,
      duration: 280,
      ease: "Quad.Out",
      onComplete: () => this.impactRing.setVisible(false),
    });
  }

  showPowerUpBurst(type, player) {
    const color = getPowerUpConfig(type)?.color ?? COLORS.cream;

    this.scene.tweens.killTweensOf(this.impactRing);
    this.impactRing.clear();
    this.impactRing.lineStyle(4, color, 0.9);
    this.impactRing.strokeCircle(0, 0, 30);
    this.impactRing
      .setPosition(player.x, player.y)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.5);
    this.scene.tweens.add({
      targets: this.impactRing,
      alpha: 0,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 230,
      ease: "Back.Out",
      onComplete: () => this.impactRing.setVisible(false),
    });
  }

  update(delta, { player, powerUps }) {
    this.elapsed += Math.min(50, Math.max(0, delta));
    const shieldActive = hasPowerUp(
      powerUps,
      POWER_UP_TYPES.shield,
    );
    const slowActive = hasPowerUp(
      powerUps,
      POWER_UP_TYPES.slowMotion,
    );
    const magnetActive = hasPowerUp(
      powerUps,
      POWER_UP_TYPES.coinMagnet,
    );

    this.shieldRing
      .setVisible(shieldActive)
      .setPosition(player.x, player.y)
      .setRotation(-player.rotation * 0.2)
      .setScale(1 + Math.sin(this.elapsed / 145) * 0.045)
      .setAlpha(0.76 + Math.sin(this.elapsed / 110) * 0.18);

    this.magnetRing
      .setVisible(magnetActive)
      .setPosition(player.x, player.y)
      .setRotation(this.elapsed * 0.0011)
      .setScale(1 + Math.sin(this.elapsed / 180) * 0.06)
      .setAlpha(0.58 + Math.sin(this.elapsed / 130) * 0.14);

    this.slowOverlay
      .setVisible(slowActive)
      .setAlpha(
        slowActive
          ? 0.055 + Math.sin(this.elapsed / 260) * 0.012
          : 0,
      );
  }

  reset() {
    this.elapsed = 0;
    this.scene.tweens.killTweensOf(this.impactRing);
    this.shieldRing.setVisible(false);
    this.magnetRing.setVisible(false);
    this.slowOverlay.setVisible(false).setAlpha(0);
    this.impactRing.setVisible(false).setAlpha(1).setScale(1);
  }

  shutdown() {
    this.reset();
    this.shieldRing.destroy();
    this.magnetRing.destroy();
    this.slowOverlay.destroy();
    this.impactRing.destroy();
  }
}
