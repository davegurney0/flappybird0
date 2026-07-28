import Phaser from "phaser";
import {
  COLORS,
  DEPTH,
  GAME_SIZE,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { addText } from "../utils/addText.js";
import { ArcadeButton } from "./ArcadeButton.js";

export class SettingsPanel extends Phaser.GameObjects.Container {
  constructor(scene, settingsManager, onClose) {
    super(scene, 0, 12);

    this.settingsManager = settingsManager;
    this.onClose = onClose;

    const overlay = scene.add
      .rectangle(
        GAME_SIZE.width / 2,
        GAME_SIZE.height / 2,
        GAME_SIZE.width,
        GAME_SIZE.height,
        COLORS.ink,
        0.76,
      )
      .setInteractive();

    const panel = scene.add.graphics();
    panel.fillStyle(COLORS.ink, 0.42);
    panel.fillRoundedRect(30, 219, 372, 358, 28);
    panel.fillStyle(COLORS.navy, 1);
    panel.fillRoundedRect(30, 211, 372, 358, 28);
    panel.lineStyle(2, COLORS.cream, 0.16);
    panel.strokeRoundedRect(31, 212, 370, 356, 27);
    panel.fillStyle(COLORS.amber, 1);
    panel.fillRoundedRect(54, 236, 44, 7, 4);

    const title = addText(scene, GAME_SIZE.width / 2, 270, "AYARLAR", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "32px",
      color: TEXT_COLORS.cream,
      align: "center",
    });
    title.setOrigin(0.5);

    const caption = addText(
      scene,
      GAME_SIZE.width / 2,
      313,
      "Küçük ama şimdiden düzenli.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "15px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    );
    caption.setOrigin(0.5);

    this.soundButton = new ArcadeButton(scene, GAME_SIZE.width / 2, 390, {
      label: this.getSoundLabel(),
      onActivate: () => {
        this.settingsManager.toggleSound();
        this.soundButton.setLabel(this.getSoundLabel());
      },
      style: "secondary",
      width: 284,
      height: 64,
    });

    const closeButton = new ArcadeButton(scene, GAME_SIZE.width / 2, 488, {
      label: "KAPAT",
      onActivate: () => this.close(),
      style: "primary",
      width: 214,
      height: 62,
    });

    overlay.on("pointerup", () => this.close());
    this.add([
      overlay,
      panel,
      title,
      caption,
      this.soundButton,
      closeButton,
    ]);

    this.setDepth(DEPTH.overlay);
    this.setAlpha(0);
    scene.add.existing(this);
    scene.tweens.add({
      targets: this,
      y: 0,
      alpha: 1,
      duration: 180,
      ease: "Cubic.Out",
    });
  }

  getSoundLabel() {
    return `SES  ${this.settingsManager.soundEnabled ? "AÇIK" : "KAPALI"}`;
  }

  close() {
    if (!this.active || this.closing) {
      return;
    }

    this.closing = true;
    this.scene.tweens.add({
      targets: this,
      y: 12,
      alpha: 0,
      duration: 140,
      ease: "Quad.In",
      onComplete: () => {
        this.onClose?.();
        this.destroy(true);
      },
    });
  }
}
