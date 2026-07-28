import Phaser from "phaser";
import {
  COLORS,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { BirdSkinPreview } from "../game/graphics/birdSkinGraphics.js";
import { addText } from "../utils/addText.js";
import { supportsDesktopHover } from "../utils/inputCapabilities.js";

const CARD_WIDTH = 348;
const CARD_HEIGHT = 56;

function toCssColor(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export class SkinCard extends Phaser.GameObjects.Container {
  constructor(
    scene,
    x,
    y,
    {
      skin,
      mode,
      onActivate,
    },
  ) {
    super(scene, x, y);

    this.skin = skin;
    this.mode = mode;
    this.onActivate = onActivate;
    this.enabled = false;
    this.owned = false;
    this.selected = false;
    this.pressed = false;
    this.hoverEnabled = supportsDesktopHover();
    this.isUiControl = true;

    this.face = scene.add.graphics();
    this.preview = new BirdSkinPreview(
      scene,
      -142,
      0,
      skin,
      {
        scale: 0.54,
        showBackdrop: false,
      },
    );
    this.nameText = addText(scene, -108, -9, skin.name, {
      fontFamily: TYPOGRAPHY.display,
      fontSize:
        skin.name.length > 13 ? "11px" : "13px",
      color: TEXT_COLORS.cream,
    }).setOrigin(0, 0.5);
    this.rarityText = addText(
      scene,
      -108,
      12,
      skin.rarity.label.toUpperCase(),
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "9px",
        color: toCssColor(skin.rarity.color),
      },
    ).setOrigin(0, 0.5);
    this.actionText = addText(scene, 139, -8, "", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "9px",
      color: TEXT_COLORS.ink,
      align: "center",
    }).setOrigin(0.5);
    this.ownershipText = addText(scene, 139, 13, "", {
      fontFamily: TYPOGRAPHY.body,
      fontSize: "8px",
      color: TEXT_COLORS.mist,
      align: "center",
    }).setOrigin(0.5);

    this.add([
      this.face,
      this.preview,
      this.nameText,
      this.rarityText,
      this.actionText,
      this.ownershipText,
    ]);
    this.setSize(CARD_WIDTH, CARD_HEIGHT);
    this.on("pointerover", this.handlePointerOver, this);
    this.on("pointerout", this.handlePointerOut, this);
    this.on("pointerdown", this.handlePointerDown, this);
    this.on("pointerup", this.handlePointerUp, this);
    scene.add.existing(this);
    this.draw();
  }

  setState({
    owned,
    selected,
  }) {
    this.owned = Boolean(owned);
    this.selected = Boolean(selected);
    this.preview.setSelected(this.selected);

    if (this.selected) {
      this.actionText.setText("✓ SEÇİLİ");
      this.ownershipText.setText("AKTİF SKIN");
    } else if (this.owned) {
      this.actionText.setText("SEÇ");
      this.ownershipText.setText("SAHİPSİN");
    } else if (this.mode === "store") {
      this.actionText.setText(`${this.skin.price} C`);
      this.ownershipText.setText("SATIN AL");
    } else {
      this.actionText.setText("MAĞAZA");
      this.ownershipText.setText("KİLİTLİ");
    }

    this.nameText.setAlpha(this.owned ? 1 : 0.84);
    this.preview.setAlpha(this.owned ? 1 : 0.72);
    this.draw();
    return this;
  }

  draw() {
    const graphics = this.face;
    const left = -CARD_WIDTH / 2;
    const top = -CARD_HEIGHT / 2;
    const rarityColor = this.skin.rarity.color;
    const actionColor = this.selected
      ? rarityColor
      : this.owned
        ? COLORS.mint
        : this.mode === "store"
          ? COLORS.amber
          : COLORS.slate;
    const pressedOffset = this.pressed ? 3 : 0;

    graphics.clear();
    graphics.fillStyle(COLORS.black, 0.38);
    graphics.fillRoundedRect(
      left,
      top + 4,
      CARD_WIDTH,
      CARD_HEIGHT,
      14,
    );
    graphics.fillStyle(
      this.selected ? rarityColor : COLORS.navy,
      this.selected ? 0.22 : 0.97,
    );
    graphics.fillRoundedRect(
      left,
      top + pressedOffset,
      CARD_WIDTH,
      CARD_HEIGHT,
      14,
    );
    graphics.lineStyle(
      this.selected ? 3 : 1,
      this.selected ? rarityColor : COLORS.cream,
      this.selected ? 0.96 : 0.12,
    );
    graphics.strokeRoundedRect(
      left + 1,
      top + pressedOffset + 1,
      CARD_WIDTH - 2,
      CARD_HEIGHT - 2,
      13,
    );
    graphics.fillStyle(rarityColor, this.selected ? 1 : 0.72);
    graphics.fillRoundedRect(
      left + 8,
      top + 8 + pressedOffset,
      5,
      CARD_HEIGHT - 16,
      3,
    );
    graphics.fillStyle(actionColor, 0.96);
    graphics.fillRoundedRect(
      103,
      -21 + pressedOffset,
      72,
      25,
      10,
    );
    graphics.lineStyle(1, COLORS.white, 0.22);
    graphics.strokeRoundedRect(
      104,
      -20 + pressedOffset,
      70,
      23,
      9,
    );

    const contentOffset = pressedOffset;
    this.preview.setY(contentOffset);
    this.nameText.setY(-9 + contentOffset);
    this.rarityText.setY(12 + contentOffset);
    this.actionText.setY(-8 + contentOffset);
    this.ownershipText.setY(13 + contentOffset);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.disableInteractive();

    if (this.enabled) {
      this.setInteractive(
        new Phaser.Geom.Rectangle(
          -CARD_WIDTH / 2,
          -CARD_HEIGHT / 2,
          CARD_WIDTH,
          CARD_HEIGHT,
        ),
        Phaser.Geom.Rectangle.Contains,
      );
      this.input.cursor = "pointer";
    } else {
      this.pressed = false;
      this.scene.tweens.killTweensOf(this);
      this.setScale(1);
      this.draw();
    }

    return this;
  }

  handlePointerOver() {
    if (!this.enabled || !this.hoverEnabled) {
      return;
    }

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.012,
      scaleY: 1.012,
      duration: 90,
      ease: "Quad.Out",
    });
  }

  handlePointerOut() {
    if (!this.enabled) {
      return;
    }

    this.pressed = false;
    this.draw();
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 90,
      ease: "Quad.Out",
    });
  }

  handlePointerDown(_pointer, _x, _y, event) {
    event?.stopPropagation();

    if (!this.enabled) {
      return;
    }

    this.pressed = true;
    this.draw();
    this.setScale(0.992);
  }

  handlePointerUp(_pointer, _x, _y, event) {
    event?.stopPropagation();

    if (!this.enabled || !this.pressed) {
      return;
    }

    this.pressed = false;
    this.setScale(1);
    this.draw();
    this.onActivate?.(this.skin);
  }
}
