import {
  COLORS,
  DEPTH,
  GAME_SIZE,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { getPowerUpConfig } from "../config/pickupConfig.js";
import { drawPowerUpIcon } from "../game/pickups/powerUpVisuals.js";
import { addText } from "../utils/addText.js";

function createPowerUpSlot(scene, index) {
  const panel = scene.add.graphics();
  const icon = scene.add.graphics({ x: -57, y: 0 });
  const timeText = addText(scene, -15, 0, "", {
    fontFamily: TYPOGRAPHY.display,
    fontSize: "12px",
    color: TEXT_COLORS.cream,
    stroke: TEXT_COLORS.ink,
    strokeThickness: 3,
    align: "center",
  }).setOrigin(0.5);
  const container = scene.add
    .container(
      GAME_SIZE.width - 8,
      96 + index * 38,
      [panel, icon, timeText],
    )
    .setDepth(DEPTH.hud)
    .setVisible(false);

  return {
    container,
    panel,
    icon,
    timeText,
    type: null,
  };
}

export class PowerUpHud {
  constructor(scene) {
    this.scene = scene;
    this.coinPanel = scene.add.graphics();
    this.coinPanel.fillStyle(COLORS.ink, 0.72);
    this.coinPanel.fillRoundedRect(-86, -18, 86, 36, 18);
    this.coinPanel.lineStyle(1, COLORS.amber, 0.5);
    this.coinPanel.strokeRoundedRect(-85, -17, 84, 34, 17);

    this.coinIcon = scene.add.graphics({ x: -67, y: 0 });
    this.coinIcon.fillStyle(COLORS.amber);
    this.coinIcon.fillCircle(0, 0, 9);
    this.coinIcon.lineStyle(2, COLORS.amberDark);
    this.coinIcon.strokeCircle(0, 0, 8);
    this.coinIcon.lineStyle(1, COLORS.cream, 0.72);
    this.coinIcon.lineBetween(-2, -5, -2, 5);

    this.coinText = addText(scene, -30, 0, "0", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "16px",
      color: TEXT_COLORS.amber,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 3,
      align: "center",
    }).setOrigin(0.5);

    this.coinContainer = scene.add
      .container(GAME_SIZE.width - 8, 48, [
        this.coinPanel,
        this.coinIcon,
        this.coinText,
      ])
      .setDepth(DEPTH.hud);

    this.slots = Array.from({ length: 4 }, (_, index) =>
      createPowerUpSlot(scene, index),
    );
  }

  updateCoins(runCoins) {
    const text = String(Math.max(0, Math.floor(runCoins ?? 0)));

    if (this.coinText.text === text) {
      return;
    }

    this.coinText.setText(text);
    this.scene.tweens.killTweensOf(this.coinContainer);
    this.coinContainer.setScale(1.12);
    this.scene.tweens.add({
      targets: this.coinContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: "Back.Out",
    });
  }

  update(powerUpSnapshot) {
    const active = powerUpSnapshot?.active ?? [];

    this.slots.forEach((slot, index) => {
      const item = active[index];

      if (!item) {
        slot.container.setVisible(false);
        slot.type = null;
        return;
      }

      const config = getPowerUpConfig(item.type);

      if (slot.type !== item.type) {
        slot.type = item.type;
        slot.panel.clear();
        slot.panel.fillStyle(COLORS.ink, 0.76);
        slot.panel.fillRoundedRect(-76, -15, 76, 30, 15);
        slot.panel.lineStyle(2, config.color, 0.68);
        slot.panel.strokeRoundedRect(-75, -14, 74, 28, 14);
        drawPowerUpIcon(slot.icon, item.type, 0.66);
        slot.container.setScale(0.82);
        this.scene.tweens.add({
          targets: slot.container,
          scaleX: 1,
          scaleY: 1,
          duration: 180,
          ease: "Back.Out",
        });
      }

      slot.timeText.setText(
        `${Math.max(0, Math.ceil(item.remainingMs / 1000))}s`,
      );
      slot.container
        .setVisible(true)
        .setAlpha(0.78 + item.remainingRatio * 0.22);
    });
  }

  reset(coinSnapshot, powerUpSnapshot) {
    this.updateCoins(coinSnapshot?.runCoins ?? 0);
    this.update(powerUpSnapshot);
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.coinContainer);
    this.coinContainer.destroy(true);
    this.slots.forEach((slot) => {
      this.scene.tweens.killTweensOf(slot.container);
      slot.container.destroy(true);
    });
    this.slots.length = 0;
  }
}
