import {
  COLORS,
  GAME_SIZE,
  MOTION,
  SCENES,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { addText } from "../utils/addText.js";
import { BaseScene } from "./BaseScene.js";

export class BootScene extends BaseScene {
  constructor() {
    super(SCENES.boot);
  }

  create() {
    const { width, height } = GAME_SIZE;
    const background = this.add.graphics();

    background.fillGradientStyle(
      COLORS.slate,
      COLORS.slate,
      COLORS.night,
      COLORS.night,
      1,
    );
    background.fillRect(0, 0, width, height);
    background.fillStyle(COLORS.amber, 0.1);
    background.fillCircle(width / 2, height / 2 - 38, 168);
    background.lineStyle(1, COLORS.cream, 0.08);
    background.strokeCircle(width / 2, height / 2 - 38, 144);
    background.strokeCircle(width / 2, height / 2 - 38, 165);

    const topLine = this.add
      .rectangle(width / 2, 228, 58, 6, COLORS.amber)
      .setOrigin(0.5);
    const firstLine = addText(this, width / 2, 290, "MAMED", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "48px",
      color: TEXT_COLORS.cream,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 8,
      align: "center",
    });
    const secondLine = addText(this, width / 2, 352, "", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "58px",
      color: TEXT_COLORS.amber,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 9,
      align: "center",
    });
    const subtitle = addText(
      this,
      width / 2,
      438,
      "Bir köy macerası değil.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "17px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    );

    firstLine.setOrigin(0.5);
    secondLine.setOrigin(0.5);
    subtitle.setOrigin(0.5);

    const splashElements = [topLine, firstLine, secondLine, subtitle];
    splashElements.forEach((element) => {
      element.setAlpha(0);
      element.setScale(0.94);
    });

    this.tweens.add({
      targets: splashElements,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 420,
      ease: "Back.Out",
      stagger: 65,
    });

    this.time.delayedCall(MOTION.splashHold, () => {
      this.cameras.main.fadeOut(MOTION.sceneFade, 8, 11, 20);
      this.time.delayedCall(MOTION.sceneFade, () => {
        this.scene.start(SCENES.preload);
      });
    });
  }
}
