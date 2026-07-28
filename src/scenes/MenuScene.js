import {
  COLORS,
  DEPTH,
  GAME_SIZE,
  MOTION,
  SCENES,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { MENU_PAGES, MENU_PAGE_IDS } from "../config/menuConfig.js";
import { createArcadeBackdrop } from "../game/graphics/createArcadeBackdrop.js";
import { MissionManager } from "../managers/MissionManager.js";
import { readHighScore } from "../managers/ScoreManager.js";
import { SkinManager } from "../managers/SkinManager.js";
import { WalletManager } from "../managers/WalletManager.js";
import { MenuBackgroundSystem } from "../systems/MenuBackgroundSystem.js";
import { ArcadeButton } from "../ui/ArcadeButton.js";
import { MenuPagePanel } from "../ui/MenuPagePanel.js";
import { addText } from "../utils/addText.js";
import { prefersReducedMotion } from "../utils/inputCapabilities.js";
import { transitionToScene } from "../utils/sceneTransitions.js";
import { BaseScene } from "./BaseScene.js";

function drawCoinIcon(graphics, x, y) {
  graphics.fillStyle(COLORS.amberDark, 1);
  graphics.fillCircle(x, y + 2, 12);
  graphics.fillStyle(COLORS.amber, 1);
  graphics.fillCircle(x, y, 11);
  graphics.lineStyle(2, COLORS.cream, 0.55);
  graphics.strokeCircle(x, y, 7);
}

function drawTrophyIcon(graphics, x, y) {
  graphics.fillStyle(COLORS.amber, 1);
  graphics.fillRoundedRect(x - 9, y - 10, 18, 16, 5);
  graphics.fillRect(x - 3, y + 5, 6, 7);
  graphics.fillRoundedRect(x - 10, y + 11, 20, 5, 2);
  graphics.lineStyle(3, COLORS.amberDark, 1);
  graphics.arc(x - 10, y - 3, 7, 1.5, 4.7, false);
  graphics.arc(x + 10, y - 3, 7, -1.55, 1.55, false);
}

function createStatBadge(
  scene,
  x,
  y,
  {
    label,
    value,
    icon,
    accent,
  },
) {
  const container = scene.add
    .container(x, y)
    .setDepth(DEPTH.content);
  const face = scene.add.graphics();

  face.fillStyle(COLORS.black, 0.3);
  face.fillRoundedRect(-76, -23, 152, 50, 16);
  face.fillStyle(COLORS.navy, 0.92);
  face.fillRoundedRect(-76, -27, 152, 50, 16);
  face.lineStyle(1, COLORS.cream, 0.12);
  face.strokeRoundedRect(-75, -26, 150, 48, 15);
  face.fillStyle(accent, 0.15);
  face.fillCircle(-50, -2, 18);

  if (icon === "coin") {
    drawCoinIcon(face, -50, -2);
  } else {
    drawTrophyIcon(face, -50, -2);
  }

  const labelText = addText(scene, -25, -13, label, {
    fontFamily: TYPOGRAPHY.body,
    fontSize: "10px",
    color: TEXT_COLORS.mist,
  }).setOrigin(0, 0.5);
  const valueText = addText(scene, -25, 7, String(value), {
    fontFamily: TYPOGRAPHY.display,
    fontSize: "18px",
    color:
      icon === "coin"
        ? TEXT_COLORS.amber
        : TEXT_COLORS.cream,
  }).setOrigin(0, 0.5);

  container.add([face, labelText, valueText]);
  return { container, valueText };
}

export class MenuScene extends BaseScene {
  constructor() {
    super(SCENES.menu);
  }

  create() {
    const centerX = GAME_SIZE.width / 2;

    this.saveManager = this.registry.get("saveManager");
    this.settingsManager = this.registry.get("settings");
    this.reducedMotion =
      this.settingsManager.reducedMotion ||
      prefersReducedMotion();
    this.keyboardMode = false;
    this.focusIndex = 0;
    this.keyboardBindings = [];
    this.walletManager = new WalletManager({
      saveManager: this.saveManager,
    });
    this.skinManager = new SkinManager({
      saveManager: this.saveManager,
    });
    this.missionManager = new MissionManager({
      saveManager: this.saveManager,
    });
    this.currentMissionCycleId =
      this.missionManager.getSnapshot().cycleId;
    this.nextMissionDateCheck = 30_000;

    createArcadeBackdrop(this, "menu");
    this.backgroundSystem = new MenuBackgroundSystem(this, {
      reducedMotion: this.reducedMotion,
    });
    this.cameras.main.fadeIn(MOTION.menuEnter, 8, 11, 20);

    this.titleContainer = this.createTitle(centerX);
    const stats = this.readMenuStats();
    this.coinBadge = createStatBadge(this, 128, 191, {
      label: "COIN",
      value: stats.coinBalance,
      icon: "coin",
      accent: COLORS.amber,
    });
    this.recordBadge = createStatBadge(this, 304, 191, {
      label: "REKOR",
      value: stats.highScore,
      icon: "trophy",
      accent: COLORS.mint,
    });

    const tagline = addText(
      this,
      centerX,
      252,
      "KANADINI AÇ. KÖYÜ AŞ.",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "12px",
        color: TEXT_COLORS.mist,
        align: "center",
        letterSpacing: 1,
      },
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.content);

    this.playButton = new ArcadeButton(this, centerX, 410, {
      label: "OYNA",
      onActivate: () => this.startGame(),
      style: "primary",
      width: 316,
      height: 76,
      showArrow: true,
      fontSize: 25,
    }).setDepth(DEPTH.content);

    const navigationLabel = addText(
      this,
      centerX,
      480,
      "KÖY MEYDANI",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "11px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.content);

    const navigationLine = this.add
      .rectangle(centerX, 497, 46, 3, COLORS.amber, 0.82)
      .setDepth(DEPTH.content);

    const columns = [78, 216, 354];
    const rows = [544, 616];
    this.navButtons = MENU_PAGES.map((page, index) => {
      const button = new ArcadeButton(
        this,
        columns[index % 3],
        rows[Math.floor(index / 3)],
        {
          label: page.label,
          icon: page.icon,
          onActivate: () => this.openPage(page.id),
          style: "nav",
          width: 124,
          height: 58,
          fontSize:
            page.id === MENU_PAGE_IDS.achievements ||
            page.id === MENU_PAGE_IDS.statistics
              ? 10
              : 11,
          iconFontSize: 18,
        },
      ).setDepth(DEPTH.content);

      return button;
    });

    const footer = addText(
      this,
      centerX,
      681,
      "DOKUN • TIKLA • SPACE",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "10px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    )
      .setOrigin(0.5)
      .setAlpha(0.72)
      .setDepth(DEPTH.content);

    this.controls = [this.playButton, ...this.navButtons];
    this.pagePanel = new MenuPagePanel(
      this,
      this.settingsManager,
      {
        reducedMotion: this.reducedMotion,
        onClose: () => this.handlePanelClosed(),
        saveManager: this.saveManager,
        walletManager: this.walletManager,
        skinManager: this.skinManager,
        missionManager: this.missionManager,
        onSettingsChanged: () =>
          this.handleSettingsChanged(),
        onStatsChanged: () =>
          this.handlePersistentStatsChanged(),
      },
    );

    this.animateMenuEntrance([
      this.titleContainer,
      this.coinBadge.container,
      this.recordBadge.container,
      tagline,
      this.playButton,
      navigationLabel,
      navigationLine,
      ...this.navButtons,
      footer,
    ]);
    this.registerKeyboard();
    this.events.once("shutdown", this.handleShutdown, this);
  }

  createTitle(centerX) {
    const title = this.add
      .container(centerX, 111)
      .setDepth(DEPTH.content);
    const shadowFirst = addText(this, 3, -31, "MAMED", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "40px",
      color: "#000000",
      align: "center",
    }).setOrigin(0.5);
    const shadowSecond = addText(this, 3, 23, "", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "51px",
      color: "#000000",
      align: "center",
    }).setOrigin(0.5);
    const firstLine = addText(this, 0, -35, "MAMED", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "40px",
      color: TEXT_COLORS.cream,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 8,
      align: "center",
    }).setOrigin(0.5);
    const secondLine = addText(this, 0, 18, "", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "51px",
      color: TEXT_COLORS.amber,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 9,
      align: "center",
    }).setOrigin(0.5);

    shadowFirst.setAlpha(0.38);
    shadowSecond.setAlpha(0.38);
    title.add([
      shadowFirst,
      shadowSecond,
      firstLine,
      secondLine,
    ]);

    return title;
  }

  animateMenuEntrance(elements) {
    if (this.reducedMotion) {
      elements.forEach((element) => element.setAlpha(1));
      return;
    }

    elements.forEach((element) => {
      element.setAlpha(0);
      element.y += 10;
    });

    this.tweens.add({
      targets: elements,
      alpha: 1,
      y: "-=10",
      duration: 360,
      delay: this.tweens.stagger(36),
      ease: "Cubic.Out",
    });

    this.time.delayedCall(920, () => {
      if (!this.titleContainer?.active) {
        return;
      }

      this.tweens.add({
        targets: this.titleContainer,
        y: this.titleContainer.y - 4,
        scaleX: 1.012,
        scaleY: 1.012,
        duration: 1_800,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }

  readMenuStats() {
    const skinSnapshot = this.skinManager.getSnapshot();
    const save = this.saveManager.getSnapshot();

    return {
      coinBalance: save.coins,
      highScore: readHighScore(this.saveManager),
      ownedSkinCount: skinSnapshot.ownedCount,
      skinSnapshot,
      totalGames: save.totalGames,
      totalDeaths: save.totalDeaths,
      totalFlaps: save.totalFlaps,
      totalCoinsCollected: save.totalCoinsCollected,
      totalObstaclesPassed: save.totalObstaclesPassed,
      highestEvolution: save.highestEvolution,
      playTime: save.playTime,
      achievements: save.achievements,
      missionSnapshot: this.missionManager.getSnapshot(),
    };
  }

  update(time) {
    if (time < this.nextMissionDateCheck) {
      return;
    }

    this.nextMissionDateCheck = time + 30_000;
    const missionSnapshot = this.missionManager.getSnapshot();

    if (missionSnapshot.cycleId === this.currentMissionCycleId) {
      return;
    }

    this.currentMissionCycleId = missionSnapshot.cycleId;
    this.handlePersistentStatsChanged();
  }

  handlePersistentStatsChanged() {
    const stats = this.readMenuStats();

    this.coinBadge.valueText.setText(String(stats.coinBalance));
    this.recordBadge.valueText.setText(String(stats.highScore));
    this.pagePanel.refresh(stats);
  }

  handleSettingsChanged() {
    const reducedMotion =
      this.settingsManager.reducedMotion ||
      prefersReducedMotion();

    if (reducedMotion === this.reducedMotion) {
      return;
    }

    this.reducedMotion = reducedMotion;
    this.backgroundSystem?.destroy();
    this.backgroundSystem = new MenuBackgroundSystem(this, {
      reducedMotion,
    });
    this.pagePanel.setReducedMotion(reducedMotion);
  }

  startGame() {
    if (this.pagePanel.opened) {
      return;
    }

    transitionToScene(this, SCENES.game);
  }

  openPage(pageId) {
    if (this.pagePanel.opened || this.pagePanel.closing) {
      return;
    }

    this.setMenuControlsEnabled(false);
    this.clearControlFocus();
    this.pagePanel.open(pageId, this.readMenuStats());
  }

  handlePanelClosed() {
    this.setMenuControlsEnabled(true);

    if (this.keyboardMode) {
      this.updateControlFocus();
    }
  }

  setMenuControlsEnabled(enabled) {
    for (const control of this.controls) {
      control.setEnabled(enabled);
    }
  }

  clearControlFocus() {
    for (const control of this.controls) {
      control.setFocused(false);
    }
  }

  moveFocus(direction) {
    if (this.pagePanel.opened) {
      return;
    }

    this.keyboardMode = true;
    this.focusIndex =
      (this.focusIndex + direction + this.controls.length) %
      this.controls.length;
    this.updateControlFocus();
  }

  updateControlFocus() {
    this.controls.forEach((control, index) => {
      control.setFocused(index === this.focusIndex);
    });
  }

  activateFocused(event) {
    event?.preventDefault();

    if (this.pagePanel.opened) {
      return;
    }

    this.keyboardMode = true;
    this.updateControlFocus();
    this.controls[this.focusIndex]?.activate();
  }

  closePanel(event) {
    event?.preventDefault();
    this.pagePanel.close();
  }

  registerKeyboard() {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    const bind = (eventName, handler) => {
      keyboard.on(eventName, handler, this);
      this.keyboardBindings.push([eventName, handler]);
    };

    bind("keydown-ENTER", this.activateFocused);
    bind("keydown-SPACE", this.activateFocused);
    bind("keydown-UP", () => this.moveFocus(-1));
    bind("keydown-LEFT", () => this.moveFocus(-1));
    bind("keydown-DOWN", () => this.moveFocus(1));
    bind("keydown-RIGHT", () => this.moveFocus(1));
    bind("keydown-S", () => {
      if (!this.pagePanel.opened) {
        this.openPage(MENU_PAGE_IDS.settings);
      }
    });
    bind("keydown-ESC", this.closePanel);
    bind("keydown-BACKSPACE", this.closePanel);
  }

  handleShutdown() {
    const keyboard = this.input.keyboard;

    if (keyboard) {
      for (const [eventName, handler] of this.keyboardBindings) {
        keyboard.off(eventName, handler, this);
      }
    }

    this.keyboardBindings = [];
    this.backgroundSystem?.destroy();
    this.backgroundSystem = null;
  }
}
