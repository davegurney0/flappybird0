import Phaser from "phaser";
import {
  COLORS,
  DEPTH,
  GAME_SIZE,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import {
  getMenuProgressSnapshot,
  MENU_PAGES,
  MENU_PAGE_IDS,
} from "../config/menuConfig.js";
import { BIRD_SKINS } from "../config/skinConfig.js";
import { BirdSkinPreview } from "../game/graphics/birdSkinGraphics.js";
import { addText } from "../utils/addText.js";
import { ArcadeButton } from "./ArcadeButton.js";
import { SkinCard } from "./SkinCard.js";

function toCssColor(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function formatPlayTime(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  }

  return `${minutes}dk`;
}

function addCard(
  scene,
  container,
  {
    x = 42,
    y,
    width = 348,
    height,
    accent = COLORS.amber,
    accentWidth = 5,
  },
) {
  const card = scene.add.graphics();

  card.fillStyle(COLORS.ink, 0.54);
  card.fillRoundedRect(x, y + 4, width, height, 15);
  card.fillStyle(COLORS.navy, 0.96);
  card.fillRoundedRect(x, y, width, height, 15);
  card.lineStyle(1, COLORS.cream, 0.1);
  card.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, 14);
  card.fillStyle(accent, 0.8);
  card.fillRoundedRect(
    x + 9,
    y + 9,
    accentWidth,
    height - 18,
    Math.min(accentWidth / 2, 3),
  );
  container.add(card);

  return card;
}

function addPageText(
  scene,
  container,
  x,
  y,
  content,
  style,
) {
  const text = addText(scene, x, y, content, style);
  container.add(text);
  return text;
}

export class MenuPagePanel extends Phaser.GameObjects.Container {
  constructor(
    scene,
    settingsManager,
    {
      onClose,
      reducedMotion = false,
      saveManager,
      walletManager,
      skinManager,
      missionManager,
      onSettingsChanged,
      onStatsChanged,
    } = {},
  ) {
    super(scene, 0, 14);

    this.settingsManager = settingsManager;
    this.onClose = onClose;
    this.onSettingsChanged = onSettingsChanged;
    this.onStatsChanged = onStatsChanged;
    this.reducedMotion = reducedMotion;
    this.saveManager = saveManager;
    this.walletManager = walletManager;
    this.skinManager = skinManager;
    this.missionManager = missionManager;
    this.pageViews = new Map();
    this.currentPageId = null;
    this.opened = false;
    this.closing = false;

    this.overlay = scene.add
      .rectangle(
        GAME_SIZE.width / 2,
        GAME_SIZE.height / 2,
        GAME_SIZE.width,
        GAME_SIZE.height,
        COLORS.ink,
        0.84,
      )
      .setInteractive();
    this.overlay.isUiControl = true;
    this.overlay.on("pointerup", () => this.close());

    this.panelShield = scene.add
      .rectangle(
        GAME_SIZE.width / 2,
        382,
        398,
        690,
        COLORS.black,
        0.001,
      )
      .setInteractive();
    this.panelShield.isUiControl = true;
    this.panelShield.on(
      "pointerdown",
      (_pointer, _x, _y, event) => event?.stopPropagation(),
    );
    this.panelShield.on(
      "pointerup",
      (_pointer, _x, _y, event) => event?.stopPropagation(),
    );

    const panel = scene.add.graphics();
    panel.fillStyle(COLORS.black, 0.4);
    panel.fillRoundedRect(17, 43, 398, 690, 28);
    panel.fillStyle(COLORS.night, 0.99);
    panel.fillRoundedRect(17, 36, 398, 690, 28);
    panel.lineStyle(2, COLORS.cream, 0.13);
    panel.strokeRoundedRect(18, 37, 396, 688, 27);
    panel.fillStyle(COLORS.navy, 0.92);
    panel.fillRoundedRect(29, 50, 374, 111, 20);

    this.headerAccent = scene.add.graphics();
    this.headerAccent.fillStyle(COLORS.amber, 1);
    this.headerAccent.fillRoundedRect(42, 63, 42, 6, 3);

    this.headerIcon = addText(scene, 49, 100, "●", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "22px",
      color: TEXT_COLORS.amber,
      align: "center",
    }).setOrigin(0.5);

    this.headerTitle = addText(scene, 74, 92, "KUŞLAR", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "27px",
      color: TEXT_COLORS.cream,
      align: "left",
    }).setOrigin(0, 0.5);

    this.headerSubtitle = addText(
      scene,
      74,
      125,
      "Sahip olduğun kuşu seç.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "13px",
        color: TEXT_COLORS.mist,
        align: "left",
      },
    ).setOrigin(0, 0.5);

    this.add([
      this.overlay,
      this.panelShield,
      panel,
      this.headerAccent,
      this.headerIcon,
      this.headerTitle,
      this.headerSubtitle,
    ]);

    this.createBirdsPage();
    this.createStorePage();
    this.createMissionsPage();
    this.createAchievementsPage();
    this.createStatisticsPage();
    this.createSettingsPage();

    this.closeButton = new ArcadeButton(
      scene,
      GAME_SIZE.width / 2,
      680,
      {
        label: "GERİ",
        onActivate: () => this.close(),
        style: "secondary",
        width: 202,
        height: 52,
        fontSize: 16,
      },
    );
    this.add(this.closeButton);
    this.createPurchaseConfirmation();
    this.createResetConfirmation();
    this.createFeedbackToast();

    this.setDepth(DEPTH.overlay);
    this.setVisible(false);
    this.setActive(false);
    this.disableControls();
    scene.add.existing(this);
  }

  createPage(id) {
    const page = this.scene.add.container(0, 0);
    page.setVisible(false);
    this.pageViews.set(id, page);
    this.add(page);
    return page;
  }

  createBirdsPage() {
    const page = this.createPage(MENU_PAGE_IDS.birds);
    this.birdCards = BIRD_SKINS.map((skin, index) => {
      const card = new SkinCard(
        this.scene,
        GAME_SIZE.width / 2,
        193 + index * 60,
        {
          skin,
          mode: "collection",
          onActivate: () =>
            this.handleSkinCardActivated(skin, "collection"),
        },
      );

      page.add(card);
      return card;
    });

    this.birdSummary = addPageText(
      this.scene,
      page,
      GAME_SIZE.width / 2,
      563,
      "SEÇİLİ  •  KÖYLÜ",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "12px",
        color: TEXT_COLORS.mint,
        align: "center",
      },
    ).setOrigin(0.5);

    addPageText(
      this.scene,
      page,
      GAME_SIZE.width / 2,
      589,
      "Rarity yalnızca görünüşü değiştirir.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "10px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    ).setOrigin(0.5);
  }

  createStorePage() {
    const page = this.createPage(MENU_PAGE_IDS.store);

    addCard(this.scene, page, {
      y: 174,
      height: 50,
      accent: COLORS.amber,
      accentWidth: 7,
    });

    const coin = this.scene.add.graphics();
    coin.fillStyle(COLORS.amberDark, 1);
    coin.fillCircle(76, 202, 16);
    coin.fillStyle(COLORS.amber, 1);
    coin.fillCircle(76, 199, 14);
    coin.lineStyle(2, COLORS.cream, 0.62);
    coin.strokeCircle(76, 199, 9);
    page.add(coin);

    addPageText(
      this.scene,
      page,
      102,
      190,
      "COIN BAKİYESİ",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "10px",
        color: TEXT_COLORS.mist,
      },
    ).setOrigin(0, 0.5);

    this.storeBalance = addPageText(
      this.scene,
      page,
      102,
      210,
      "0",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "18px",
        color: TEXT_COLORS.amber,
      },
    ).setOrigin(0, 0.5);

    addPageText(
      this.scene,
      page,
      368,
      199,
      "P2W YOK",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "10px",
        color: TEXT_COLORS.mint,
      },
    ).setOrigin(1, 0.5);

    this.storeCards = BIRD_SKINS.map((skin, index) => {
      const card = new SkinCard(
        this.scene,
        GAME_SIZE.width / 2,
        255 + index * 58,
        {
          skin,
          mode: "store",
          onActivate: () =>
            this.handleSkinCardActivated(skin, "store"),
        },
      );

      page.add(card);
      return card;
    });

    this.storeHint = addPageText(
      this.scene,
      page,
      GAME_SIZE.width / 2,
      596,
      "Satın alma ikinci bir onay ister.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "10px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    ).setOrigin(0.5);
  }

  createPurchaseConfirmation() {
    const layer = this.scene.add
      .container(0, 0)
      .setVisible(false)
      .setActive(false);
    const shield = this.scene.add
      .rectangle(
        GAME_SIZE.width / 2,
        382,
        398,
        690,
        COLORS.ink,
        0.92,
      )
      .setInteractive();
    shield.isUiControl = true;
    shield.on("pointerdown", (_pointer, _x, _y, event) =>
      event?.stopPropagation(),
    );
    shield.on("pointerup", (_pointer, _x, _y, event) => {
      event?.stopPropagation();
      this.hidePurchaseConfirmation();
    });

    const panel = this.scene.add.graphics();
    panel.fillStyle(COLORS.black, 0.45);
    panel.fillRoundedRect(54, 218, 324, 326, 24);
    panel.fillStyle(COLORS.navy, 1);
    panel.fillRoundedRect(54, 211, 324, 326, 24);
    panel.lineStyle(2, COLORS.amber, 0.62);
    panel.strokeRoundedRect(55, 212, 322, 324, 23);
    panel.fillStyle(COLORS.amber, 1);
    panel.fillRoundedRect(177, 211, 78, 6, 3);

    const eyebrow = addText(
      this.scene,
      GAME_SIZE.width / 2,
      244,
      "SATIN ALMA ONAYI",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "11px",
        color: TEXT_COLORS.amber,
        align: "center",
      },
    ).setOrigin(0.5);
    this.confirmationPreview = new BirdSkinPreview(
      this.scene,
      GAME_SIZE.width / 2,
      313,
      BIRD_SKINS[0],
      {
        scale: 0.94,
        showBackdrop: true,
      },
    );
    this.confirmationName = addText(
      this.scene,
      GAME_SIZE.width / 2,
      374,
      BIRD_SKINS[0].name,
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "20px",
        color: TEXT_COLORS.cream,
        align: "center",
      },
    ).setOrigin(0.5);
    this.confirmationRarity = addText(
      this.scene,
      GAME_SIZE.width / 2,
      401,
      BIRD_SKINS[0].rarity.label.toUpperCase(),
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "10px",
        color: toCssColor(BIRD_SKINS[0].rarity.color),
        align: "center",
      },
    ).setOrigin(0.5);
    this.confirmationPrice = addText(
      this.scene,
      GAME_SIZE.width / 2,
      431,
      "0 COIN",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "17px",
        color: TEXT_COLORS.amber,
        align: "center",
      },
    ).setOrigin(0.5);
    const warning = addText(
      this.scene,
      GAME_SIZE.width / 2,
      456,
      "Bu işlem bakiyenden coin düşürür.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "10px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    ).setOrigin(0.5);

    this.cancelPurchaseButton = new ArcadeButton(
      this.scene,
      142,
      498,
      {
        label: "VAZGEÇ",
        onActivate: () => this.hidePurchaseConfirmation(),
        style: "secondary",
        width: 132,
        height: 44,
        fontSize: 12,
      },
    );
    this.confirmPurchaseButton = new ArcadeButton(
      this.scene,
      290,
      498,
      {
        label: "SATIN AL",
        onActivate: () => this.confirmPurchase(),
        style: "primary",
        width: 132,
        height: 44,
        fontSize: 12,
      },
    );

    layer.add([
      shield,
      panel,
      eyebrow,
      this.confirmationPreview,
      this.confirmationName,
      this.confirmationRarity,
      this.confirmationPrice,
      warning,
      this.cancelPurchaseButton,
      this.confirmPurchaseButton,
    ]);
    this.purchaseConfirmation = layer;
    this.add(layer);
  }

  createResetConfirmation() {
    const layer = this.scene.add
      .container(0, 0)
      .setVisible(false)
      .setActive(false);
    const shield = this.scene.add
      .rectangle(
        GAME_SIZE.width / 2,
        382,
        398,
        690,
        COLORS.ink,
        0.94,
      )
      .setInteractive();
    shield.isUiControl = true;
    shield.on("pointerdown", (_pointer, _x, _y, event) =>
      event?.stopPropagation(),
    );
    shield.on("pointerup", (_pointer, _x, _y, event) => {
      event?.stopPropagation();
      this.hideResetConfirmation();
    });

    const panel = this.scene.add.graphics();
    panel.fillStyle(COLORS.black, 0.48);
    panel.fillRoundedRect(43, 241, 346, 280, 24);
    panel.fillStyle(COLORS.navy, 1);
    panel.fillRoundedRect(43, 234, 346, 280, 24);
    panel.lineStyle(2, COLORS.coral, 0.76);
    panel.strokeRoundedRect(44, 235, 344, 278, 23);
    panel.fillStyle(COLORS.coral, 1);
    panel.fillRoundedRect(177, 234, 78, 6, 3);

    const eyebrow = addText(
      this.scene,
      GAME_SIZE.width / 2,
      274,
      "SON BİR KEZ DÜŞÜN",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "11px",
        color: TEXT_COLORS.coral,
        align: "center",
      },
    ).setOrigin(0.5);
    const question = addText(
      this.scene,
      GAME_SIZE.width / 2,
      337,
      "Harbi her şeyi\nsileyim mi?",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "24px",
        color: TEXT_COLORS.cream,
        align: "center",
        lineSpacing: 6,
      },
    ).setOrigin(0.5);
    const warning = addText(
      this.scene,
      GAME_SIZE.width / 2,
      403,
      "Bu işlem geri alınamaz.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "11px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    ).setOrigin(0.5);

    this.cancelResetButton = new ArcadeButton(
      this.scene,
      137,
      468,
      {
        label: "VAZGEÇ",
        onActivate: () => this.hideResetConfirmation(),
        style: "secondary",
        width: 142,
        height: 46,
        fontSize: 12,
      },
    );
    this.confirmResetButton = new ArcadeButton(
      this.scene,
      295,
      468,
      {
        label: "SİL GİTSİN",
        onActivate: () => this.confirmProgressReset(),
        style: "danger",
        width: 142,
        height: 46,
        fontSize: 12,
      },
    );

    layer.add([
      shield,
      panel,
      eyebrow,
      question,
      warning,
      this.cancelResetButton,
      this.confirmResetButton,
    ]);
    this.resetConfirmation = layer;
    this.add(layer);
  }

  showResetConfirmation() {
    if (!this.saveManager || this.resetConfirmation.visible) {
      return;
    }

    this.hideFeedback();
    this.resetConfirmation
      .setVisible(true)
      .setActive(true)
      .setAlpha(0);
    this.setSettingsControlsEnabled(false);
    this.closeButton.setEnabled(false);
    this.cancelResetButton.setEnabled(true);
    this.confirmResetButton.setEnabled(true);
    this.scene.tweens.killTweensOf(this.resetConfirmation);
    this.scene.tweens.add({
      targets: this.resetConfirmation,
      alpha: 1,
      duration: this.reducedMotion ? 60 : 150,
      ease: "Cubic.Out",
    });
  }

  hideResetConfirmation() {
    if (!this.resetConfirmation.visible) {
      return;
    }

    this.scene.tweens.killTweensOf(this.resetConfirmation);
    this.resetConfirmation
      .setVisible(false)
      .setActive(false)
      .setAlpha(1);
    this.cancelResetButton.setEnabled(false);
    this.confirmResetButton.setEnabled(false);

    if (this.opened && !this.closing) {
      this.closeButton.setEnabled(true);
      this.setSettingsControlsEnabled(
        this.currentPageId === MENU_PAGE_IDS.settings,
      );
    }
  }

  confirmProgressReset() {
    this.confirmResetButton.setEnabled(false);
    const result = this.saveManager.resetProgress();

    if (!result.ok) {
      this.hideResetConfirmation();
      this.showFeedback(
        "İlerleme silinemedi köylü.",
        COLORS.coral,
      );
      return;
    }

    this.walletManager.reload();
    this.skinManager.reload();
    this.settingsManager.reload();
    this.hideResetConfirmation();
    this.onStatsChanged?.();
    this.refreshSettingLabels();
    this.showFeedback("Köy hafızası temizlendi.", COLORS.mint);
  }

  createFeedbackToast() {
    const toast = this.scene.add
      .container(0, 0)
      .setVisible(false)
      .setActive(false);
    this.feedbackPanel = this.scene.add.graphics();
    this.feedbackText = addText(
      this.scene,
      GAME_SIZE.width / 2,
      618,
      "",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "11px",
        color: TEXT_COLORS.cream,
        align: "center",
        wordWrap: { width: 286 },
      },
    ).setOrigin(0.5);
    toast.add([this.feedbackPanel, this.feedbackText]);
    this.feedbackToast = toast;
    this.feedbackCall = null;
    this.add(toast);
  }

  handleSkinCardActivated(skin, mode) {
    if (this.purchaseConfirmation.visible) {
      return;
    }

    if (this.skinManager.owns(skin.id)) {
      const result = this.skinManager.select(skin.id);

      if (
        result.status === "selected" ||
        result.status === "already-selected"
      ) {
        this.onStatsChanged?.();
        this.showFeedback(
          result.status === "selected"
            ? `${skin.name} seçildi.`
            : `${skin.name} zaten seçili.`,
          skin.rarity.color,
        );
      } else {
        this.showFeedback(
          "Seçim kaydedilemedi köylü.",
          COLORS.coral,
        );
      }
      return;
    }

    if (mode === "collection") {
      this.showFeedback(
        "Önce mağazadan al köylü.",
        COLORS.coral,
      );
      return;
    }

    const result = this.skinManager.purchase(
      skin.id,
      this.walletManager,
    );

    if (result.status === "insufficient-funds") {
      this.showFeedback(
        "Paran yetmiyor köylü.",
        COLORS.coral,
      );
      return;
    }

    if (result.status === "confirmation-required") {
      this.showPurchaseConfirmation(skin);
    }
  }

  showPurchaseConfirmation(skin) {
    this.pendingPurchaseSkin = skin;
    this.hideFeedback();
    this.confirmationPreview
      .setSkin(skin)
      .setSelected(true);
    this.confirmationName.setText(skin.name);
    this.confirmationRarity
      .setText(skin.rarity.label.toUpperCase())
      .setColor(toCssColor(skin.rarity.color));
    this.confirmationPrice.setText(`${skin.price} COIN`);
    this.confirmPurchaseButton.setLabel(
      `AL • ${skin.price}`,
    );
    this.purchaseConfirmation
      .setVisible(true)
      .setActive(true)
      .setAlpha(0);
    this.setSkinCardsEnabled(false);
    this.closeButton.setEnabled(false);
    this.cancelPurchaseButton.setEnabled(true);
    this.confirmPurchaseButton.setEnabled(true);
    this.scene.tweens.killTweensOf(
      this.purchaseConfirmation,
    );
    this.scene.tweens.add({
      targets: this.purchaseConfirmation,
      alpha: 1,
      duration: this.reducedMotion ? 60 : 150,
      ease: "Cubic.Out",
    });
  }

  hidePurchaseConfirmation() {
    if (!this.purchaseConfirmation.visible) {
      return;
    }

    this.pendingPurchaseSkin = null;
    this.scene.tweens.killTweensOf(
      this.purchaseConfirmation,
    );
    this.purchaseConfirmation
      .setVisible(false)
      .setActive(false)
      .setAlpha(1);
    this.cancelPurchaseButton.setEnabled(false);
    this.confirmPurchaseButton.setEnabled(false);

    if (this.opened && !this.closing) {
      this.closeButton.setEnabled(true);
      this.setSkinCardsEnabled(true);
    }
  }

  confirmPurchase() {
    const skin = this.pendingPurchaseSkin;

    if (!skin) {
      return;
    }

    this.confirmPurchaseButton.setEnabled(false);
    const result = this.skinManager.purchase(
      skin.id,
      this.walletManager,
      {
        confirmed: true,
        selectAfterPurchase: true,
      },
    );
    this.hidePurchaseConfirmation();

    if (result.status === "purchased") {
      this.onStatsChanged?.();
      this.showFeedback(
        `${skin.name} artık senin. Seçildi!`,
        skin.rarity.color,
      );
      return;
    }

    if (result.status === "insufficient-funds") {
      this.showFeedback(
        "Paran yetmiyor köylü.",
        COLORS.coral,
      );
      return;
    }

    this.showFeedback(
      "Satın alma kaydedilemedi.",
      COLORS.coral,
    );
  }

  showFeedback(message, accent = COLORS.amber) {
    this.feedbackCall?.remove(false);
    this.scene.tweens.killTweensOf(this.feedbackToast);
    this.feedbackPanel.clear();
    this.feedbackPanel.fillStyle(COLORS.black, 0.4);
    this.feedbackPanel.fillRoundedRect(57, 598, 318, 43, 14);
    this.feedbackPanel.fillStyle(COLORS.navy, 0.99);
    this.feedbackPanel.fillRoundedRect(57, 594, 318, 43, 14);
    this.feedbackPanel.lineStyle(2, accent, 0.76);
    this.feedbackPanel.strokeRoundedRect(
      58,
      595,
      316,
      41,
      13,
    );
    this.feedbackText.setText(message);
    this.feedbackToast
      .setVisible(true)
      .setActive(true)
      .setAlpha(0)
      .setY(5);
    this.scene.tweens.add({
      targets: this.feedbackToast,
      alpha: 1,
      y: 0,
      duration: this.reducedMotion ? 50 : 140,
      ease: "Cubic.Out",
    });
    this.feedbackCall = this.scene.time.delayedCall(
      1_650,
      () => this.hideFeedback(),
    );
  }

  hideFeedback() {
    this.feedbackCall?.remove(false);
    this.feedbackCall = null;
    this.scene.tweens.killTweensOf(this.feedbackToast);
    this.feedbackToast
      .setVisible(false)
      .setActive(false)
      .setAlpha(1)
      .setY(0);
  }

  createMissionsPage() {
    const page = this.createPage(MENU_PAGE_IDS.missions);

    addCard(this.scene, page, {
      y: 174,
      height: 74,
      accent: 0x8aa7c4,
    });
    addPageText(
      this.scene,
      page,
      66,
      197,
      "GÜNLÜK GÖREVLER",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "14px",
        color: TEXT_COLORS.cream,
      },
    ).setOrigin(0, 0.5);
    this.missionSummary = addPageText(
      this.scene,
      page,
      368,
      197,
      "0 / 3 TAMAM",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "13px",
        color: "#8aa7c4",
      },
    ).setOrigin(1, 0.5);

    this.missionDateText = addPageText(
      this.scene,
      page,
      66,
      225,
      "YEREL TARİHE GÖRE HER GÜN YENİLENİR",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "9px",
        color: TEXT_COLORS.mist,
      },
    ).setOrigin(0, 0.5);

    this.missionRows = Array.from({ length: 3 }, (_, index) => {
      const y = 264 + index * 92;
      const row = this.scene.add.container(0, 0);
      const rowState = {
        missionId: null,
        row,
      };

      addCard(this.scene, row, {
        y,
        height: 82,
        accent: 0x8aa7c4,
      });

      addPageText(
        this.scene,
        row,
        65,
        y + 22,
        `0${index + 1}`,
        {
          fontFamily: TYPOGRAPHY.display,
          fontSize: "18px",
          color: "#8aa7c4",
        },
      ).setOrigin(0.5);

      rowState.label = addPageText(
        this.scene,
        row,
        91,
        y + 18,
        "GÖREV YÜKLENİYOR",
        {
          fontFamily: TYPOGRAPHY.display,
          fontSize: "13px",
          color: TEXT_COLORS.cream,
        },
      ).setOrigin(0, 0.5);

      rowState.description = addPageText(
        this.scene,
        row,
        91,
        y + 40,
        "Bugünün hedefi hazırlanıyor.",
        {
          fontFamily: TYPOGRAPHY.body,
          fontSize: "10px",
          color: TEXT_COLORS.mist,
          wordWrap: { width: 190 },
        },
      ).setOrigin(0, 0.5);

      rowState.progress = addPageText(
        this.scene,
        row,
        91,
        y + 65,
        "0 / 0",
        {
          fontFamily: TYPOGRAPHY.display,
          fontSize: "10px",
          color: TEXT_COLORS.mist,
        },
      ).setOrigin(0, 0.5);

      rowState.reward = addPageText(
        this.scene,
        row,
        370,
        y + 18,
        "+0 COIN",
        {
          fontFamily: TYPOGRAPHY.display,
          fontSize: "10px",
          color: TEXT_COLORS.amber,
        },
      ).setOrigin(1, 0.5);

      rowState.status = addPageText(
        this.scene,
        row,
        370,
        y + 61,
        "DEVAM",
        {
          fontFamily: TYPOGRAPHY.display,
          fontSize: "10px",
          color: TEXT_COLORS.mist,
        },
      ).setOrigin(1, 0.5);

      rowState.claimButton = new ArcadeButton(
        this.scene,
        340,
        y + 56,
        {
          label: "AL",
          onActivate: () =>
            this.handleMissionClaim(rowState.missionId),
          style: "primary",
          width: 70,
          height: 34,
          fontSize: 12,
        },
      )
        .setVisible(false)
        .setEnabled(false);
      row.add(rowState.claimButton);

      page.add(row);
      return rowState;
    });
  }

  handleMissionClaim(missionId) {
    if (!missionId || !this.missionManager) {
      return;
    }

    const result = this.missionManager.claimReward(missionId);

    if (result.status === "claimed") {
      this.walletManager.reload();
      this.onStatsChanged?.();
      this.showFeedback(
        `+${result.reward} COIN ALINDI!`,
        COLORS.mint,
      );
      return;
    }

    if (result.status === "already-claimed") {
      this.showFeedback("Bu ödülü zaten aldın.", COLORS.mist);
      return;
    }

    if (result.status === "incomplete") {
      this.showFeedback("Önce görevi tamamla köylü.", COLORS.coral);
      return;
    }

    this.showFeedback("Ödül kaydedilemedi.", COLORS.coral);
  }

  createAchievementsPage() {
    const page = this.createPage(MENU_PAGE_IDS.achievements);

    addCard(this.scene, page, {
      y: 181,
      height: 60,
      accent: 0xffe36a,
    });
    addPageText(
      this.scene,
      page,
      66,
      211,
      "AÇILAN BAŞARIM",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "13px",
        color: TEXT_COLORS.cream,
      },
    ).setOrigin(0, 0.5);
    this.achievementSummary = addPageText(
      this.scene,
      page,
      368,
      211,
      "0 / 4",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "18px",
        color: "#ffe36a",
      },
    ).setOrigin(1, 0.5);

    const labels = [
      ["İLK UÇUŞ", "İlk kapını geç."],
      ["CYBER KÖY", "CYBER KUŞ seviyesine ulaş."],
      ["ZENGİN KÖYLÜ", "50 coinlik bakiye yap."],
      ["KÖYÜN EFENDİSİ", "100 skor barajını aş."],
    ];

    this.achievementRows = labels.map(
      ([label, description], index) => {
        const y = 263 + index * 70;
        const row = this.scene.add.container(0, 0);
        addCard(this.scene, row, {
          y,
          height: 56,
          accent: 0xffe36a,
        });

        const medal = this.scene.add.graphics();
        medal.fillStyle(COLORS.amber, 0.16);
        medal.fillCircle(69, y + 28, 15);
        medal.lineStyle(2, COLORS.amber, 0.58);
        medal.strokeCircle(69, y + 28, 11);
        medal.fillStyle(COLORS.amber, 0.9);
        medal.fillCircle(69, y + 28, 4);
        row.add(medal);

        addPageText(
          this.scene,
          row,
          95,
          y + 20,
          label,
          {
            fontFamily: TYPOGRAPHY.display,
            fontSize: "13px",
            color: TEXT_COLORS.cream,
          },
        ).setOrigin(0, 0.5);

        addPageText(
          this.scene,
          row,
          95,
          y + 39,
          description,
          {
            fontFamily: TYPOGRAPHY.body,
            fontSize: "10px",
            color: TEXT_COLORS.mist,
          },
        ).setOrigin(0, 0.5);

        const status = addPageText(
          this.scene,
          row,
          368,
          y + 28,
          "KİLİTLİ",
          {
            fontFamily: TYPOGRAPHY.display,
            fontSize: "9px",
            color: TEXT_COLORS.mist,
          },
        ).setOrigin(1, 0.5);

        page.add(row);
        return { row, status };
      },
    );
  }

  createStatisticsPage() {
    const page = this.createPage(MENU_PAGE_IDS.statistics);
    const statCards = [
      {
        key: "record",
        label: "REKOR",
        x: 42,
        y: 188,
        color: COLORS.amber,
      },
      {
        key: "coins",
        label: "COIN",
        x: 222,
        y: 188,
        color: COLORS.mint,
      },
      {
        key: "birds",
        label: "SAHİP SKIN",
        x: 42,
        y: 322,
        color: 0x53f2ff,
      },
      {
        key: "zone",
        label: "EN UZAK DÜNYA",
        x: 222,
        y: 322,
        color: 0xff8a4c,
      },
    ];

    this.statValues = {};
    statCards.forEach((card) => {
      addCard(this.scene, page, {
        x: card.x,
        y: card.y,
        width: 168,
        height: 108,
        accent: card.color,
      });

      addPageText(
        this.scene,
        page,
        card.x + 24,
        card.y + 28,
        card.label,
        {
          fontFamily: TYPOGRAPHY.body,
          fontSize: "10px",
          color: TEXT_COLORS.mist,
        },
      ).setOrigin(0, 0.5);

      this.statValues[card.key] = addPageText(
        this.scene,
        page,
        card.x + 84,
        card.y + 70,
        "0",
        {
          fontFamily: TYPOGRAPHY.display,
          fontSize: card.key === "zone" ? "17px" : "27px",
          color: toCssColor(card.color),
          align: "center",
          wordWrap: { width: 136 },
        },
      ).setOrigin(0.5);
    });

    addCard(this.scene, page, {
      y: 454,
      height: 150,
      accent: COLORS.mist,
    });
    const profileStats = [
      ["games", "OYUN", 98, 492],
      ["deaths", "ÖLÜM", 216, 492],
      ["flaps", "FLAP", 334, 492],
      ["passed", "ENGEL", 98, 558],
      ["collected", "TOPLANAN", 216, 558],
      ["playTime", "SÜRE", 334, 558],
    ];
    this.profileStatValues = {};

    profileStats.forEach(([key, label, x, y]) => {
      addPageText(this.scene, page, x, y - 12, label, {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "9px",
        color: TEXT_COLORS.mist,
        align: "center",
      }).setOrigin(0.5);
      this.profileStatValues[key] = addPageText(
        this.scene,
        page,
        x,
        y + 12,
        "0",
        {
          fontFamily: TYPOGRAPHY.display,
          fontSize: "15px",
          color: TEXT_COLORS.cream,
          align: "center",
        },
      ).setOrigin(0.5);
    });
  }

  createSettingsPage() {
    const page = this.createPage(MENU_PAGE_IDS.settings);

    addCard(this.scene, page, {
      y: 174,
      height: 286,
      accent: 0xff8a4c,
    });
    addPageText(
      this.scene,
      page,
      GAME_SIZE.width / 2,
      198,
      "OYUN AYARLARI",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "14px",
        color: TEXT_COLORS.cream,
        align: "center",
      },
    ).setOrigin(0.5);
    this.musicButton = new ArcadeButton(
      this.scene,
      GAME_SIZE.width / 2,
      238,
      {
        label: this.getMusicLabel(),
        onActivate: () => {
          this.settingsManager.toggleMusic();
          this.refreshSettingLabels();
        },
        style: "secondary",
        width: 300,
        height: 42,
        fontSize: 12,
      },
    );
    this.soundEffectsButton = new ArcadeButton(
      this.scene,
      GAME_SIZE.width / 2,
      298,
      {
        label: this.getSoundEffectsLabel(),
        onActivate: () => {
          this.settingsManager.toggleSoundEffects();
          this.refreshSettingLabels();
        },
        style: "secondary",
        width: 300,
        height: 42,
        fontSize: 12,
      },
    );
    this.vibrationButton = new ArcadeButton(
      this.scene,
      GAME_SIZE.width / 2,
      358,
      {
        label: this.getVibrationLabel(),
        onActivate: () => {
          this.settingsManager.toggleVibration();
          this.refreshSettingLabels();
        },
        style: "secondary",
        width: 300,
        height: 42,
        fontSize: 12,
      },
    );
    this.reducedMotionButton = new ArcadeButton(
      this.scene,
      GAME_SIZE.width / 2,
      418,
      {
        label: this.getReducedMotionLabel(),
        onActivate: () => {
          this.settingsManager.toggleReducedMotion();
          this.refreshSettingLabels();
          this.onSettingsChanged?.();
        },
        style: "secondary",
        width: 300,
        height: 42,
        fontSize: 11,
      },
    );
    this.settingsButtons = [
      this.musicButton,
      this.soundEffectsButton,
      this.vibrationButton,
      this.reducedMotionButton,
    ];
    page.add(this.settingsButtons);

    addCard(this.scene, page, {
      y: 486,
      height: 118,
      accent: COLORS.coral,
    });
    addPageText(
      this.scene,
      page,
      GAME_SIZE.width / 2,
      509,
      "TEHLİKELİ BÖLGE",
      {
        fontFamily: TYPOGRAPHY.display,
        fontSize: "13px",
        color: TEXT_COLORS.coral,
        align: "center",
      },
    ).setOrigin(0.5);
    addPageText(
      this.scene,
      page,
      GAME_SIZE.width / 2,
      534,
      "Coin, rekor, skin ve tüm istatistikleri siler.",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "10px",
        color: TEXT_COLORS.mist,
        align: "center",
      },
    ).setOrigin(0.5);
    this.resetProgressButton = new ArcadeButton(
      this.scene,
      GAME_SIZE.width / 2,
      574,
      {
        label: "İLERLEMEYİ SIFIRLA",
        onActivate: () => this.showResetConfirmation(),
        style: "danger",
        width: 286,
        height: 44,
        fontSize: 12,
      },
    );
    page.add(this.resetProgressButton);
  }

  getMusicLabel() {
    return `MÜZİK  ${
      this.settingsManager.musicEnabled ? "AÇIK" : "KAPALI"
    }`;
  }

  getSoundEffectsLabel() {
    return `SES EFEKTLERİ  ${
      this.settingsManager.soundEffectsEnabled
        ? "AÇIK"
        : "KAPALI"
    }`;
  }

  getVibrationLabel() {
    return `TİTREŞİM  ${
      this.settingsManager.vibrationEnabled
        ? "AÇIK"
        : "KAPALI"
    }`;
  }

  getReducedMotionLabel() {
    return `AZALTILMIŞ HAREKET  ${
      this.settingsManager.reducedMotion ? "AÇIK" : "KAPALI"
    }`;
  }

  refreshSettingLabels() {
    this.musicButton.setLabel(this.getMusicLabel());
    this.soundEffectsButton.setLabel(
      this.getSoundEffectsLabel(),
    );
    this.vibrationButton.setLabel(this.getVibrationLabel());
    this.reducedMotionButton.setLabel(
      this.getReducedMotionLabel(),
    );
  }

  refresh(stats) {
    const snapshot = getMenuProgressSnapshot(stats);
    const skinSnapshot =
      stats?.skinSnapshot ?? this.skinManager.getSnapshot();

    this.storeBalance.setText(String(snapshot.coinBalance));
    this.birdSummary.setText(
      `SEÇİLİ  •  ${skinSnapshot.selectedSkin.name.toUpperCase()}`,
    );
    this.birdCards.forEach((card) => {
      card.setState({
        owned: skinSnapshot.ownedSkinIds.includes(card.skin.id),
        selected:
          skinSnapshot.selectedSkinId === card.skin.id,
      });
    });
    this.storeCards.forEach((card) => {
      card.setState({
        owned: skinSnapshot.ownedSkinIds.includes(card.skin.id),
        selected:
          skinSnapshot.selectedSkinId === card.skin.id,
      });
    });

    const missionSnapshot =
      stats?.missionSnapshot ??
      this.missionManager?.getSnapshot();
    const dailyMissions = missionSnapshot?.missions ?? [];
    this.missionSummary.setText(
      `${missionSnapshot?.completedCount ?? 0} / ${
        dailyMissions.length
      } TAMAM`,
    );
    this.missionDateText.setText(
      `${missionSnapshot?.dateKey ?? "YEREL TARİH"} • HER GÜN YENİLENİR`,
    );
    this.missionRows.forEach((missionRow, index) => {
      const mission = dailyMissions[index];

      if (!mission) {
        missionRow.missionId = null;
        missionRow.row.setVisible(false);
        return;
      }

      missionRow.missionId = mission.id;
      missionRow.row
        .setVisible(true)
        .setAlpha(mission.completed ? 1 : 0.8);
      missionRow.label.setText(mission.label);
      missionRow.description.setText(mission.description);
      missionRow.progress
        .setText(`${mission.progress} / ${mission.target}`)
        .setColor(
          mission.completed
            ? TEXT_COLORS.mint
            : TEXT_COLORS.mist,
        );
      missionRow.reward.setText(`+${mission.reward} COIN`);
      missionRow.status
        .setVisible(!mission.claimable)
        .setText(
          mission.claimed
            ? "ALINDI"
            : mission.completed
              ? "TAMAM"
              : "DEVAM",
        )
        .setColor(
          mission.completed
            ? TEXT_COLORS.mint
            : TEXT_COLORS.mist,
        );
      missionRow.claimButton
        .setVisible(mission.claimable)
        .setEnabled(
          mission.claimable &&
            this.opened &&
            this.currentPageId === MENU_PAGE_IDS.missions,
        );
    });

    this.achievementSummary.setText(
      `${snapshot.completedAchievementCount} / ${snapshot.achievements.length}`,
    );
    this.achievementRows.forEach(
      ({ row, status }, index) => {
        const achievement = snapshot.achievements[index];
        row.setAlpha(achievement.complete ? 1 : 0.5);
        status
          .setText(achievement.complete ? "AÇIK" : "KİLİTLİ")
          .setColor(
            achievement.complete
              ? TEXT_COLORS.amber
              : TEXT_COLORS.mist,
          );
      },
    );

    this.statValues.record.setText(String(snapshot.highScore));
    this.statValues.coins.setText(String(snapshot.coinBalance));
    this.statValues.birds.setText(
      `${skinSnapshot.ownedCount} / ${BIRD_SKINS.length}`,
    );
    this.statValues.zone.setText(snapshot.zone.label);
    this.profileStatValues.games.setText(
      String(snapshot.totalGames),
    );
    this.profileStatValues.deaths.setText(
      String(snapshot.totalDeaths),
    );
    this.profileStatValues.flaps.setText(
      String(snapshot.totalFlaps),
    );
    this.profileStatValues.passed.setText(
      String(snapshot.totalObstaclesPassed),
    );
    this.profileStatValues.collected.setText(
      String(snapshot.totalCoinsCollected),
    );
    this.profileStatValues.playTime.setText(
      formatPlayTime(snapshot.playTime),
    );
    this.refreshSettingLabels();
  }

  open(pageId, stats) {
    const definition =
      MENU_PAGES.find((page) => page.id === pageId) ??
      MENU_PAGES[0];

    this.currentPageId = definition.id;
    this.headerTitle.setText(definition.label);
    this.headerSubtitle.setText(definition.subtitle);
    this.headerIcon
      .setText(definition.icon)
      .setColor(toCssColor(definition.accent));
    this.headerAccent.clear();
    this.headerAccent.fillStyle(definition.accent, 1);
    this.headerAccent.fillRoundedRect(42, 63, 42, 6, 3);

    for (const [id, page] of this.pageViews) {
      page.setVisible(id === definition.id);
    }

    this.hideFeedback();
    this.hidePurchaseConfirmation();
    this.hideResetConfirmation();
    this.refresh(stats);
    this.opened = true;
    this.closing = false;
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(0);
    this.setY(this.reducedMotion ? 0 : 14);
    this.enableControls();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: 0,
      alpha: 1,
      duration: this.reducedMotion ? 80 : 190,
      ease: "Cubic.Out",
    });
  }

  close() {
    if (this.purchaseConfirmation.visible) {
      this.hidePurchaseConfirmation();
      return;
    }

    if (this.resetConfirmation.visible) {
      this.hideResetConfirmation();
      return;
    }

    if (!this.opened || this.closing) {
      return;
    }

    this.closing = true;
    this.hideFeedback();
    this.disableControls();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.reducedMotion ? 0 : 12,
      alpha: 0,
      duration: this.reducedMotion ? 60 : 140,
      ease: "Quad.In",
      onComplete: () => {
        this.opened = false;
        this.closing = false;
        this.currentPageId = null;
        this.setVisible(false);
        this.setActive(false);
        this.onClose?.();
      },
    });
  }

  enableControls() {
    this.overlay.setInteractive();
    this.panelShield.setInteractive();
    this.closeButton.setEnabled(true);
    this.setSettingsControlsEnabled(
      this.currentPageId === MENU_PAGE_IDS.settings,
    );
    this.setSkinCardsEnabled(true);
    this.setMissionControlsEnabled(
      this.currentPageId === MENU_PAGE_IDS.missions,
    );
  }

  disableControls() {
    this.overlay.disableInteractive();
    this.panelShield.disableInteractive();
    this.closeButton?.setEnabled(false);
    this.setSettingsControlsEnabled(false);
    this.setSkinCardsEnabled(false);
    this.setMissionControlsEnabled(false);
    this.cancelPurchaseButton?.setEnabled(false);
    this.confirmPurchaseButton?.setEnabled(false);
    this.cancelResetButton?.setEnabled(false);
    this.confirmResetButton?.setEnabled(false);
  }

  setSettingsControlsEnabled(enabled) {
    this.settingsButtons?.forEach((button) =>
      button.setEnabled(enabled),
    );
    this.resetProgressButton?.setEnabled(enabled);
  }

  setReducedMotion(reducedMotion) {
    this.reducedMotion = Boolean(reducedMotion);
  }

  setSkinCardsEnabled(enabled) {
    const birdsEnabled =
      enabled &&
      this.currentPageId === MENU_PAGE_IDS.birds &&
      !this.purchaseConfirmation?.visible;
    const storeEnabled =
      enabled &&
      this.currentPageId === MENU_PAGE_IDS.store &&
      !this.purchaseConfirmation?.visible;

    this.birdCards?.forEach((card) =>
      card.setEnabled(birdsEnabled),
    );
    this.storeCards?.forEach((card) =>
      card.setEnabled(storeEnabled),
    );
  }

  setMissionControlsEnabled(enabled) {
    this.missionRows?.forEach(({ claimButton }) => {
      claimButton.setEnabled(
        Boolean(enabled && claimButton.visible),
      );
    });
  }
}
