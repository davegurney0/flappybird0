import {
  COLORS,
  DEPTH,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { ZONE_ANNOUNCEMENT_DURATION } from "../config/zoneConfig.js";
import { addText } from "../utils/addText.js";

export class ZoneAnnouncement {
  constructor(scene, x, y) {
    this.scene = scene;
    this.progress = { value: 0 };

    this.panel = scene.add.graphics();
    this.kicker = addText(scene, 0, -14, "YENİ BÖLGE", {
      fontFamily: TYPOGRAPHY.body,
      fontSize: "10px",
      color: TEXT_COLORS.mist,
      align: "center",
    }).setOrigin(0.5);
    this.title = addText(scene, 0, 7, "", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "21px",
      color: TEXT_COLORS.cream,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5);
    this.container = scene.add
      .container(x, y, [this.panel, this.kicker, this.title])
      .setDepth(DEPTH.hud)
      .setVisible(false)
      .setAlpha(0);
  }

  drawPanel(color) {
    this.panel.clear();
    this.panel.fillStyle(COLORS.ink, 0.82);
    this.panel.fillRoundedRect(-112, -36, 224, 72, 18);
    this.panel.lineStyle(2, color, 0.72);
    this.panel.strokeRoundedRect(-111, -35, 222, 70, 17);
    this.panel.fillStyle(color, 0.95);
    this.panel.fillRoundedRect(-28, -36, 56, 4, 2);
  }

  show(zone) {
    if (!zone) {
      return;
    }

    this.scene.tweens.killTweensOf(this.progress);
    this.drawPanel(zone.color);
    this.title.setText(zone.label);
    this.progress.value = 0;
    this.container
      .setVisible(true)
      .setAlpha(0)
      .setScale(0.92)
      .setY(174);

    this.scene.tweens.add({
      targets: this.progress,
      value: 1,
      duration: ZONE_ANNOUNCEMENT_DURATION,
      ease: "Linear",
      onUpdate: () => {
        const value = this.progress.value;
        const enter = Math.min(1, value / 0.18);
        const exit = Math.min(1, (1 - value) / 0.2);
        const visibility = Math.min(enter, exit);

        this.container
          .setAlpha(visibility)
          .setScale(0.92 + visibility * 0.08)
          .setY(174 - visibility * 8);
      },
      onComplete: () => {
        this.container.setVisible(false).setAlpha(0);
      },
    });
  }

  hide() {
    this.scene.tweens.killTweensOf(this.progress);
    this.container.setVisible(false).setAlpha(0);
  }

  destroy() {
    this.hide();
    this.container.destroy(true);
    this.scene = null;
  }
}
