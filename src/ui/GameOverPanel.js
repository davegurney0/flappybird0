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

export class GameOverPanel extends Phaser.GameObjects.Container {
  constructor(
    scene,
    {
      score,
      best,
      coinsEarned,
      coinBalance,
      onRestart,
      onMenu,
    },
  ) {
    super(scene, 0, 18);

    this.isUiControl = true;
    this.closing = false;

    const overlay = scene.add
      .rectangle(
        GAME_SIZE.width / 2,
        GAME_SIZE.height / 2,
        GAME_SIZE.width,
        GAME_SIZE.height,
        COLORS.ink,
        0.74,
      )
      .setInteractive();
    overlay.isUiControl = true;
    overlay.on("pointerdown", (_pointer, _x, _y, event) => {
      event?.stopPropagation();
    });

    const panel = scene.add.graphics();
    panel.fillStyle(COLORS.black, 0.36);
    panel.fillRoundedRect(25, 160, 382, 482, 30);
    panel.fillStyle(COLORS.navy, 1);
    panel.fillRoundedRect(25, 151, 382, 482, 30);
    panel.lineStyle(2, COLORS.cream, 0.18);
    panel.strokeRoundedRect(26, 152, 380, 480, 29);
    panel.fillStyle(COLORS.coral);
    panel.fillRoundedRect(50, 176, 52, 7, 4);

    const title = addText(
      scene,
      GAME_SIZE.width / 2,
      218,
      "MAMED",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "28px",
        color: TEXT_COLORS.cream,
        stroke: TEXT_COLORS.ink,
        strokeThickness: 6,
        align: "center",
      },
    );
    title.setOrigin(0.5);

    const caption = addText(
      scene,
      GAME_SIZE.width / 2,
      256,
      "Tekrar dene, bir sonraki turda daha iyi ol.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "15px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    );
    caption.setOrigin(0.5);

    const scoreCard = scene.add.graphics();
    scoreCard.fillStyle(COLORS.ink, 0.52);
    scoreCard.fillRoundedRect(52, 286, 328, 152, 18);
    scoreCard.lineStyle(1, COLORS.cream, 0.1);
    scoreCard.strokeRoundedRect(53, 287, 326, 150, 17);
    scoreCard.fillStyle(COLORS.amber, 0.16);
    scoreCard.fillRoundedRect(62, 296, 8, 132, 4);

    const scoreText = addText(
      scene,
      GAME_SIZE.width / 2,
      313,
      `Skor: ${score}`,
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "23px",
        color: TEXT_COLORS.cream,
        align: "center",
      },
    );
    scoreText.setOrigin(0.5);

    const bestText = addText(
      scene,
      GAME_SIZE.width / 2,
      348,
      `Rekor: ${best}`,
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "19px",
        color: TEXT_COLORS.amber,
        align: "center",
      },
    );
    bestText.setOrigin(0.5);

    const coinText = addText(
      scene,
      GAME_SIZE.width / 2,
      383,
      `Coin: +${coinsEarned}`,
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "18px",
        color: TEXT_COLORS.amber,
        align: "center",
      },
    );
    coinText.setOrigin(0.5);

    const balanceText = addText(
      scene,
      GAME_SIZE.width / 2,
      414,
      `Bakiye: ${coinBalance}`,
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "15px",
        color: TEXT_COLORS.mint,
        align: "center",
      },
    );
    balanceText.setOrigin(0.5);

    this.restartButton = new ArcadeButton(scene, GAME_SIZE.width / 2, 493, {
      label: "TEKRAR",
      onActivate: () => this.close(onRestart),
      style: "primary",
      width: 288,
      height: 66,
      showArrow: true,
    });

    this.menuButton = new ArcadeButton(scene, GAME_SIZE.width / 2, 577, {
      label: "ANA MENÜ",
      onActivate: onMenu,
      style: "secondary",
      width: 252,
      height: 58,
      fontSize: 19,
    });

    this.add([
      overlay,
      panel,
      title,
      caption,
      scoreCard,
      scoreText,
      bestText,
      coinText,
      balanceText,
      this.restartButton,
      this.menuButton,
    ]);

    this.setDepth(DEPTH.overlay);
    this.setAlpha(0);
    this.setScale(0.94);
    scene.add.existing(this);
    scene.tweens.add({
      targets: this,
      y: 0,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 210,
      ease: "Back.Out",
    });
  }

  close(onComplete) {
    if (this.closing || !this.active) {
      return;
    }

    this.closing = true;
    this.restartButton.setEnabled(false);
    this.menuButton.setEnabled(false);
    this.scene.tweens.add({
      targets: this,
      y: 12,
      alpha: 0,
      scaleX: 0.96,
      scaleY: 0.96,
      duration: 140,
      ease: "Quad.In",
      onComplete: () => {
        this.destroy(true);
        onComplete?.();
      },
    });
  }
}
