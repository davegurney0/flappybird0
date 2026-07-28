import Phaser from "phaser";
import {
  COLORS,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { addText } from "../utils/addText.js";
import { supportsDesktopHover } from "../utils/inputCapabilities.js";

const BUTTON_STYLES = Object.freeze({
  primary: {
    face: COLORS.amber,
    facePressed: COLORS.amberDark,
    label: TEXT_COLORS.ink,
    outline: COLORS.cream,
    shadow: COLORS.coral,
    arrow: TEXT_COLORS.ink,
    focus: COLORS.cream,
  },
  secondary: {
    face: COLORS.navy,
    facePressed: COLORS.slate,
    label: TEXT_COLORS.cream,
    outline: COLORS.mist,
    shadow: COLORS.ink,
    arrow: TEXT_COLORS.amber,
    focus: COLORS.amber,
  },
  nav: {
    face: COLORS.navy,
    facePressed: COLORS.slate,
    label: TEXT_COLORS.cream,
    outline: COLORS.mist,
    shadow: COLORS.ink,
    arrow: TEXT_COLORS.amber,
    focus: COLORS.amber,
  },
  danger: {
    face: COLORS.coral,
    facePressed: 0xc53f3f,
    label: TEXT_COLORS.cream,
    outline: COLORS.cream,
    shadow: COLORS.ink,
    arrow: TEXT_COLORS.cream,
    focus: COLORS.amber,
  },
});

export class ArcadeButton extends Phaser.GameObjects.Container {
  constructor(
    scene,
    x,
    y,
    {
      label,
      onActivate,
      style = "primary",
      width = 288,
      height = 68,
      showArrow = false,
      fontSize = 22,
      icon = null,
      iconFontSize = 20,
    },
  ) {
    super(scene, x, y);

    this.buttonWidth = width;
    this.buttonHeight = height;
    this.buttonStyle =
      BUTTON_STYLES[style] ?? BUTTON_STYLES.primary;
    this.onActivate = onActivate;
    this.enabled = true;
    this.isPressed = false;
    this.isFocused = false;
    this.activating = false;
    this.hoverEnabled = supportsDesktopHover();
    this.isUiControl = true;
    this.baseLabelY = icon ? 12 : -2;

    this.face = scene.add.graphics();
    this.label = addText(
      scene,
      showArrow ? -10 : 0,
      this.baseLabelY,
      label,
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: `${fontSize}px`,
        color: this.buttonStyle.label,
        align: "center",
      },
    );
    this.label.setOrigin(0.5);

    this.add([this.face, this.label]);

    if (icon) {
      this.iconLabel = addText(scene, 0, -13, icon, {
        fontFamily: TYPOGRAPHY.display,
        fontSize: `${iconFontSize}px`,
        color: this.buttonStyle.arrow,
        align: "center",
      });
      this.iconLabel.setOrigin(0.5);
      this.add(this.iconLabel);
    }

    if (showArrow) {
      this.arrow = addText(scene, width / 2 - 34, -3, "›", {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "32px",
        color: this.buttonStyle.arrow,
      });
      this.arrow.setOrigin(0.5);
      this.add(this.arrow);
    }

    this.setSize(width, height + 8);
    this.setInteractive(
      new Phaser.Geom.Rectangle(
        -width / 2,
        -(height + 8) / 2,
        width,
        height + 8,
      ),
      Phaser.Geom.Rectangle.Contains,
    );
    this.input.cursor = "pointer";

    this.on("pointerover", this.handlePointerOver, this);
    this.on("pointerout", this.handlePointerOut, this);
    this.on("pointerdown", this.handlePointerDown, this);
    this.on("pointerup", this.handlePointerUp, this);

    this.draw();
    scene.add.existing(this);
  }

  draw(pressed = false) {
    const { buttonWidth: width, buttonHeight: height } = this;
    const left = -width / 2;
    const top = -height / 2;

    this.face.clear();
    this.face.fillStyle(this.buttonStyle.shadow, 0.95);
    this.face.fillRoundedRect(left, top + 8, width, height, 18);

    this.face.fillStyle(
      pressed ? this.buttonStyle.facePressed : this.buttonStyle.face,
      1,
    );
    this.face.fillRoundedRect(left, top + (pressed ? 5 : 0), width, height, 18);
    this.face.lineStyle(
      this.isFocused ? 3 : 2,
      this.isFocused
        ? this.buttonStyle.focus
        : this.buttonStyle.outline,
      this.isFocused ? 0.84 : 0.34,
    );
    this.face.strokeRoundedRect(
      left + 1,
      top + (pressed ? 6 : 1),
      width - 2,
      height - 2,
      17,
    );

    this.face.fillStyle(COLORS.white, 0.1);
    this.face.fillRoundedRect(
      left + 14,
      top + (pressed ? 13 : 8),
      width - 28,
      4,
      2,
    );

    const contentOffset = pressed ? 5 : 0;
    this.label.setY(this.baseLabelY + contentOffset);
    this.iconLabel?.setY(-13 + contentOffset);
    this.arrow?.setY(-3 + contentOffset);
  }

  handlePointerOver() {
    if (
      !this.enabled ||
      this.isPressed ||
      !this.hoverEnabled
    ) {
      return;
    }

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 90,
      ease: "Quad.Out",
    });
  }

  handlePointerOut() {
    if (!this.enabled) {
      return;
    }

    this.isPressed = false;
    this.draw(false);
    this.scene.tweens.add({
      targets: this,
      scaleX: this.isFocused ? 1.018 : 1,
      scaleY: this.isFocused ? 1.018 : 1,
      duration: 90,
      ease: "Quad.Out",
    });
  }

  handlePointerDown(_pointer, _localX, _localY, event) {
    event?.stopPropagation();

    if (!this.enabled) {
      return;
    }

    this.isPressed = true;
    this.draw(true);
    this.setScale(0.985);
  }

  handlePointerUp(_pointer, _localX, _localY, event) {
    event?.stopPropagation();

    if (!this.enabled || !this.isPressed) {
      return;
    }

    this.isPressed = false;
    this.draw(false);
    this.setScale(this.isFocused ? 1.018 : 1);
    this.onActivate?.();
  }

  activate() {
    if (!this.enabled || this.activating) {
      return;
    }

    this.activating = true;
    this.draw(true);
    this.setScale(0.985);
    this.scene.time.delayedCall(90, () => {
      this.activating = false;

      if (!this.active) {
        return;
      }

      this.draw(false);
      this.setScale(this.isFocused ? 1.018 : 1);
      this.onActivate?.();
    });
  }

  setLabel(label) {
    this.label.setText(label);
    return this;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.disableInteractive();
    this.setAlpha(enabled ? 1 : 0.55);

    if (!enabled) {
      this.isPressed = false;
      this.activating = false;
      this.scene.tweens.killTweensOf(this);
      this.setScale(1);
      this.draw(false);
    }

    if (enabled) {
      this.setInteractive(
        new Phaser.Geom.Rectangle(
          -this.buttonWidth / 2,
          -(this.buttonHeight + 8) / 2,
          this.buttonWidth,
          this.buttonHeight + 8,
        ),
        Phaser.Geom.Rectangle.Contains,
      );
      this.input.cursor = "pointer";
    }

    return this;
  }

  setFocused(focused) {
    this.isFocused = Boolean(focused);
    this.draw(this.isPressed);

    if (!this.isPressed) {
      this.scene.tweens.add({
        targets: this,
        scaleX: this.isFocused ? 1.018 : 1,
        scaleY: this.isFocused ? 1.018 : 1,
        duration: 110,
        ease: "Quad.Out",
      });
    }

    return this;
  }
}
