import {
  COLORS,
  DEPTH,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../../config/constants.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";
import { addText } from "../../utils/addText.js";

function drawWindArrow(graphics, direction) {
  const rise = direction < 0 ? -13 : 13;
  const endX = 40;
  const endY = rise;
  const headDirection = direction < 0 ? 1 : -1;

  graphics.clear();
  graphics.lineStyle(3, COLORS.cream, 0.58);
  graphics.beginPath();
  graphics.moveTo(0, 0);
  graphics.lineTo(12, rise * 0.22);
  graphics.lineTo(26, rise * 0.58);
  graphics.lineTo(endX, endY);
  graphics.strokePath();
  graphics.lineStyle(3, COLORS.cream, 0.78);
  graphics.lineBetween(
    endX,
    endY,
    endX - 10,
    endY + 2 * headDirection,
  );
  graphics.lineBetween(
    endX,
    endY,
    endX - 3,
    endY + 10 * headDirection,
  );
}

export class WindZoneObstacle {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.scored = false;
    this.x = -400;
    this.direction = -1;

    const width = GAME_BALANCE.windZoneWidth;
    const height =
      GAME_BALANCE.windZoneBottom - GAME_BALANCE.windZoneTop;
    this.background = scene.add.graphics();
    this.background.fillStyle(COLORS.mint, 0.075);
    this.background.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      26,
    );
    this.background.lineStyle(2, COLORS.mint, 0.24);
    this.background.strokeRoundedRect(
      -width / 2 + 1,
      -height / 2 + 1,
      width - 2,
      height - 2,
      25,
    );

    this.label = addText(scene, 0, -height / 2 + 29, "RÜZGÂR ↑", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "14px",
      color: TEXT_COLORS.mint,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5);

    this.arrows = Array.from({ length: 7 }, (_, index) => {
      const arrow = scene.add.graphics({
        x: -width / 2 + 18 + (index % 3) * 78,
        y: -height / 2 + 88 + index * 58,
      });
      drawWindArrow(arrow, this.direction);
      return arrow;
    });

    this.container = scene.add
      .container(-400, (GAME_BALANCE.windZoneTop + GAME_BALANCE.windZoneBottom) / 2, [
        this.background,
        ...this.arrows,
        this.label,
      ])
      .setDepth(DEPTH.obstacles - 1)
      .setVisible(false);
  }

  activate({ x, direction }) {
    this.active = true;
    this.scored = false;
    this.x = x;
    this.direction = direction < 0 ? -1 : 1;
    this.label
      .setText(this.direction < 0 ? "RÜZGÂR ↑" : "RÜZGÂR ↓")
      .setColor(
        this.direction < 0
          ? TEXT_COLORS.mint
          : TEXT_COLORS.coral,
      );
    this.background.clear();

    const width = GAME_BALANCE.windZoneWidth;
    const height =
      GAME_BALANCE.windZoneBottom - GAME_BALANCE.windZoneTop;
    const color =
      this.direction < 0 ? COLORS.mint : COLORS.coral;
    this.background.fillStyle(color, 0.075);
    this.background.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      26,
    );
    this.background.lineStyle(2, color, 0.25);
    this.background.strokeRoundedRect(
      -width / 2 + 1,
      -height / 2 + 1,
      width - 2,
      height - 2,
      25,
    );
    this.arrows.forEach((arrow) =>
      drawWindArrow(arrow, this.direction),
    );
    this.container.setPosition(
      x,
      (GAME_BALANCE.windZoneTop +
        GAME_BALANCE.windZoneBottom) /
        2,
    );
    this.container.setVisible(true);
  }

  update({
    delta,
    bird,
    birdX,
    speed,
    motionEnabled,
    difficulty,
    onPassed,
    applyWind,
  }) {
    if (!this.active) {
      return;
    }

    const safeDelta = Math.min(Math.max(delta, 0), 50);
    const width = GAME_BALANCE.windZoneWidth;

    if (motionEnabled) {
      this.x -= speed * (safeDelta / 1000);
      const windStrength =
        (this.direction < 0
          ? GAME_BALANCE.windAccelerationUp
          : GAME_BALANCE.windAccelerationDown) *
        (0.9 + Math.min(1, difficulty) * 0.16);

      if (
        bird &&
        birdX >= this.x - width / 2 &&
        birdX <= this.x + width / 2 &&
        bird.y >= GAME_BALANCE.windZoneTop &&
        bird.y <= GAME_BALANCE.windZoneBottom
      ) {
        applyWind?.(
          this.direction * windStrength,
          safeDelta,
        );
      }

      this.arrows.forEach((arrow) => {
        arrow.x +=
          GAME_BALANCE.windLineSpeed * (safeDelta / 1000);
        if (arrow.x > width / 2 - 22) {
          arrow.x = -width / 2 + 8;
        }
      });
    }

    this.container.x = this.x;

    if (!this.scored && this.x + width / 2 < birdX) {
      this.scored = true;
      onPassed?.();
    }

    if (this.x + width / 2 < -40) {
      this.deactivate();
    }
  }

  deactivate() {
    this.active = false;
    this.scored = false;
    this.x = -400;
    this.container.setVisible(false).setPosition(-400, -400);
  }
}
