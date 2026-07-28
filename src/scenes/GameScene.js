import Phaser from "phaser";
import {
  COLORS,
  DEPTH,
  GAME_EVENTS,
  GAME_SIZE,
  MOTION,
  SCENES,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import { GAME_BALANCE } from "../config/gameBalance.js";
import { KoyluKus } from "../game/entities/KoyluKus.js";
import { ObstacleSpawner } from "../game/obstacles/ObstacleSpawner.js";
import { DifficultyManager } from "../managers/DifficultyManager.js";
import { EvolutionManager } from "../managers/EvolutionManager.js";
import { MissionManager } from "../managers/MissionManager.js";
import { PlayerProfileManager } from "../managers/PlayerProfileManager.js";
import { PowerUpManager } from "../managers/PowerUpManager.js";
import { ScoreManager } from "../managers/ScoreManager.js";
import { SkinManager } from "../managers/SkinManager.js";
import { WalletManager } from "../managers/WalletManager.js";
import { EvolutionEffectsSystem } from "../systems/EvolutionEffectsSystem.js";
import { FlapInputSystem } from "../systems/FlapInputSystem.js";
import { PickupSystem } from "../systems/PickupSystem.js";
import { PowerUpEffectsSystem } from "../systems/PowerUpEffectsSystem.js";
import { WorldZoneSystem } from "../systems/WorldZoneSystem.js";
import { ArcadeButton } from "../ui/ArcadeButton.js";
import { GameOverPanel } from "../ui/GameOverPanel.js";
import { PowerUpHud } from "../ui/PowerUpHud.js";
import { ZoneAnnouncement } from "../ui/ZoneAnnouncement.js";
import { addText } from "../utils/addText.js";
import { transitionToScene } from "../utils/sceneTransitions.js";
import { BaseScene } from "./BaseScene.js";

const RUN_STATE = Object.freeze({
  ready: "ready",
  playing: "playing",
  dead: "dead",
  gameOver: "game-over",
});

export class GameScene extends BaseScene {
  constructor() {
    super(SCENES.game);
  }

  create() {
    this.runState = RUN_STATE.ready;
    this.isLanded = false;
    this.gameOverPanel = null;
    this.hitStopCall = null;
    this.gameOverCall = null;
    this.saveManager = this.registry.get("saveManager");
    this.scoreManager = new ScoreManager({
      saveManager: this.saveManager,
    });
    this.difficultyManager = new DifficultyManager();
    this.evolutionManager = new EvolutionManager();
    this.walletManager = new WalletManager({
      saveManager: this.saveManager,
    });
    this.powerUpManager = new PowerUpManager();
    this.skinManager = new SkinManager({
      saveManager: this.saveManager,
    });
    this.profileManager = new PlayerProfileManager({
      saveManager: this.saveManager,
    });
    this.missionManager = new MissionManager({
      saveManager: this.saveManager,
    });
    this.walletSettlement = null;

    this.worldZoneSystem = new WorldZoneSystem(
      this,
      this.difficultyManager.getSnapshot().zone,
    );
    this.createGroundLip();
    this.createHud();
    this.createReadyPrompt();

    this.player = new KoyluKus(
      this,
      GAME_BALANCE.birdStartX,
      GAME_BALANCE.birdStartY,
      this.skinManager.getSelectedSkin(),
    );
    this.player.resetForRun(
      this.evolutionManager.getSnapshot().stage,
      this.skinManager.getSelectedSkin(),
    );
    this.evolutionEffects = new EvolutionEffectsSystem(
      this,
      this.evolutionManager.getSnapshot().stage,
    );
    this.powerUpEffects = new PowerUpEffectsSystem(this);
    this.pickupSystem = new PickupSystem(this, this.player, {
      onCoinCollected: (pickup) =>
        this.handleCoinCollected(pickup),
      onPowerUpCollected: (pickup) =>
        this.handlePowerUpCollected(pickup),
    });

    this.obstacleSpawner = new ObstacleSpawner(this, {
      onPassed: () => {
        this.handleObstaclePassed();
      },
      onSpawned: (spawnInfo, difficulty) => {
        this.pickupSystem.handleObstacleSpawned(
          spawnInfo,
          difficulty,
        );
      },
      applyWind: (acceleration, delta) => {
        this.player.applyVerticalAcceleration(acceleration, delta);
      },
    });
    this.obstacleCollider = this.physics.add.overlap(
      this.player,
      this.obstacleSpawner.colliderGroup,
      (player, collider) =>
        this.handleObstacleCollision(player, collider),
      undefined,
      this,
    );

    this.flapInput = new FlapInputSystem(this, () => {
      this.handlePrimaryAction();
    });

    this.handleEscape = () => this.menuButton.activate();
    this.input.keyboard?.on("keydown-ESC", this.handleEscape);
    this.input.keyboard?.on("keydown-BACKSPACE", this.handleEscape);
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleShutdown,
      this,
    );

    this.cameras.main.fadeIn(MOTION.sceneFade, 8, 11, 20);
  }

  createGroundLip() {
    const ground = this.add.graphics().setDepth(DEPTH.content);
    ground.fillStyle(COLORS.black, 0.3);
    ground.fillRect(0, GAME_BALANCE.groundY, GAME_SIZE.width, 10);
    ground.fillStyle(COLORS.amberDark);
    ground.fillRect(0, GAME_BALANCE.groundY, GAME_SIZE.width, 5);
    ground.fillStyle(COLORS.cream, 0.34);
    ground.fillRect(0, GAME_BALANCE.groundY, GAME_SIZE.width, 1);

    for (let x = -18; x < GAME_SIZE.width + 28; x += 42) {
      ground.fillStyle(COLORS.amber, 0.18);
      ground.fillTriangle(
        x,
        GAME_BALANCE.groundY + 9,
        x + 21,
        GAME_BALANCE.groundY + 9,
        x + 10,
        GAME_BALANCE.groundY + 18,
      );
    }
  }

  createHud() {
    const centerX = GAME_SIZE.width / 2;

    const scoreShadow = addText(this, centerX + 3, 61, "0", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "54px",
      color: "#000000",
      align: "center",
    });
    scoreShadow.setOrigin(0.5).setAlpha(0.42).setDepth(DEPTH.hud);

    this.scoreText = addText(this, centerX, 56, "0", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "54px",
      color: TEXT_COLORS.cream,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 7,
      align: "center",
    });
    this.scoreText.setOrigin(0.5).setDepth(DEPTH.hud);
    this.scoreShadow = scoreShadow;

    this.zoneBadgePanel = this.add.graphics();
    this.zoneText = addText(this, 0, 0, "", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "11px",
      color: TEXT_COLORS.ink,
      align: "center",
    }).setOrigin(0.5);
    this.zoneBadge = this.add
      .container(centerX, 104, [
        this.zoneBadgePanel,
        this.zoneText,
      ])
      .setDepth(DEPTH.hud);
    this.zoneAnnouncement = new ZoneAnnouncement(
      this,
      centerX,
      166,
    );
    this.currentZoneId = null;
    this.updateZoneHud(
      this.difficultyManager.getSnapshot(),
      false,
    );

    this.menuButton = new ArcadeButton(this, 65, 48, {
      label: "‹ MENÜ",
      onActivate: () => this.returnToMenu(),
      style: "secondary",
      width: 108,
      height: 42,
      fontSize: 13,
    }).setDepth(DEPTH.hud);

    this.powerUpHud = new PowerUpHud(this);
    this.powerUpHud.reset(
      this.walletManager.getSnapshot(),
      this.powerUpManager.getSnapshot(),
    );
  }

  createReadyPrompt() {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.ink, 0.64);
    panel.fillRoundedRect(-154, -50, 308, 100, 24);
    panel.lineStyle(2, COLORS.mint, 0.34);
    panel.strokeRoundedRect(-153, -49, 306, 98, 23);
    panel.fillStyle(COLORS.mint);
    panel.fillRoundedRect(-25, -50, 50, 6, 3);

    const title = addText(this, 0, -10, "DOKUN DA UÇ", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "30px",
      color: TEXT_COLORS.cream,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 5,
      align: "center",
    });
    title.setOrigin(0.5);

    const caption = addText(
      this,
      0,
      26,
      "Ekran  •  Mouse  •  Space",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "14px",
        color: TEXT_COLORS.mint,
        align: "center",
      },
    );
    caption.setOrigin(0.5);

    this.readyPrompt = this.add
      .container(GAME_SIZE.width / 2, 248, [panel, title, caption])
      .setDepth(DEPTH.hud);

    this.tweens.add({
      targets: this.readyPrompt,
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 760,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
  }

  handlePrimaryAction() {
    if (this.runState === RUN_STATE.ready) {
      this.startRun();
      this.player.flap();
      this.profileManager.recordFlap();
      return;
    }

    if (this.runState === RUN_STATE.playing) {
      this.player.flap();
      this.profileManager.recordFlap();
    }
  }

  startRun() {
    this.runState = RUN_STATE.playing;
    this.profileManager.recordGameStarted();
    this.missionManager.beginRun();
    this.player.startFlying();
    this.obstacleSpawner.start();
    this.tweens.killTweensOf(this.readyPrompt);
    this.tweens.add({
      targets: this.readyPrompt,
      y: this.readyPrompt.y - 12,
      alpha: 0,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 150,
      ease: "Quad.In",
      onComplete: () => this.readyPrompt.setVisible(false),
    });
  }

  updateZoneHud(difficulty, animate = true) {
    if (
      !difficulty?.zone ||
      difficulty.zone.id === this.currentZoneId
    ) {
      return;
    }

    this.currentZoneId = difficulty.zone.id;
    this.zoneText.setText(difficulty.zone.label);
    const panelWidth = Math.max(
      106,
      Math.ceil(this.zoneText.width) + 28,
    );
    const panelX = -panelWidth / 2;

    this.zoneBadgePanel.clear();
    this.zoneBadgePanel.fillStyle(
      difficulty.zone.color,
      0.92,
    );
    this.zoneBadgePanel.fillRoundedRect(
      panelX,
      -12,
      panelWidth,
      24,
      12,
    );
    this.zoneBadgePanel.lineStyle(1, COLORS.cream, 0.4);
    this.zoneBadgePanel.strokeRoundedRect(
      panelX + 1,
      -11,
      panelWidth - 2,
      22,
      11,
    );

    if (!animate) {
      this.zoneBadge.setScale(1).setAlpha(1);
      return;
    }

    this.tweens.killTweensOf(this.zoneBadge);
    this.zoneBadge.setScale(0.86).setAlpha(0.65);
    this.tweens.add({
      targets: this.zoneBadge,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 260,
      ease: "Back.Out",
    });
    this.zoneAnnouncement.show(difficulty.zone);
  }

  handleObstaclePassed() {
    if (this.runState !== RUN_STATE.playing) {
      return;
    }

    const scoreGain = this.powerUpManager.getScoreMultiplier();
    const score = this.scoreManager.increment(scoreGain);
    this.scoreText.setText(String(score));
    this.scoreShadow.setText(String(score));
    const evolution = this.evolutionManager.update(score);
    this.profileManager.recordObstaclePassed(
      evolution.stage.level,
    );
    this.missionManager.recordObstaclePassed({
      score,
      evolutionLevel: evolution.stage.level,
    });

    if (evolution.changed) {
      this.player.applyEvolution(evolution.stage);
      this.evolutionEffects.showEvolution(
        evolution.stage,
        this.player,
        score,
      );
    }

    this.tweens.killTweensOf(this.scoreText);
    this.tweens.killTweensOf(this.scoreShadow);
    const scorePulse = scoreGain > 1 ? 1.46 : 1.34;
    this.scoreText.setScale(scorePulse);
    this.scoreShadow.setScale(scorePulse);
    this.tweens.add({
      targets: [this.scoreText, this.scoreShadow],
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.Out",
    });
  }

  handleCoinCollected({ value, risky, x, y }) {
    if (this.runState !== RUN_STATE.playing) {
      return;
    }

    const wallet = this.walletManager.collect(value);
    this.profileManager.recordCoinCollected(value);
    this.missionManager.recordCoinCollected({
      value,
      runCoins: wallet.runCoins,
    });
    this.powerUpHud.updateCoins(wallet.runCoins);
    const eventData = {
      value,
      risky,
      x,
      y,
      runCoins: wallet.runCoins,
    };
    this.events.emit(GAME_EVENTS.coinCollected, eventData);
    this.game.events.emit(GAME_EVENTS.coinCollected, eventData);
  }

  handlePowerUpCollected({ type, x, y }) {
    if (this.runState !== RUN_STATE.playing) {
      return;
    }

    const activation = this.powerUpManager.activate(type);
    this.missionManager.recordPowerUpUsed(type);
    const eventData = {
      type,
      x,
      y,
      active: activation.snapshot.active,
    };
    this.powerUpEffects.showPowerUpBurst(type, this.player);
    this.powerUpHud.update(activation.snapshot);
    this.events.emit(GAME_EVENTS.powerUpCollected, eventData);
    this.game.events.emit(GAME_EVENTS.powerUpCollected, eventData);
    this.game.events.emit(GAME_EVENTS.powerUpSound, eventData);
  }

  handleObstacleCollision() {
    if (this.runState !== RUN_STATE.playing) {
      return;
    }

    if (this.powerUpManager.consumeShield()) {
      const eventData = {
        score: this.scoreManager.current,
        remainingPowerUps:
          this.powerUpManager.getSnapshot().active,
      };
      this.powerUpEffects.showShieldImpact(this.player);
      this.powerUpHud.update(this.powerUpManager.getSnapshot());
      this.events.emit(GAME_EVENTS.shieldBlocked, eventData);
      this.game.events.emit(GAME_EVENTS.shieldBlocked, eventData);
      this.cameras.main.shake(90, 0.003);
      return;
    }

    if (this.powerUpManager.hasCollisionGrace()) {
      return;
    }

    this.handleDeath("obstacle");
  }

  handleDeath(reason) {
    if (this.runState !== RUN_STATE.playing) {
      return;
    }

    this.runState = RUN_STATE.dead;
    this.flapInput.setEnabled(false);
    this.obstacleSpawner.stop();
    this.player.beginDeath();
    this.physics.world.pause();
    this.walletSettlement = this.walletManager.commitRun();
    this.profileManager.recordDeath();
    this.powerUpManager.reset();
    this.powerUpHud.update(this.powerUpManager.getSnapshot());

    const deathData = {
      reason,
      score: this.scoreManager.current,
      best: this.scoreManager.best,
      coinsEarned: this.walletSettlement.added,
      coinBalance: this.walletSettlement.balance,
    };
    this.events.emit(GAME_EVENTS.playerDeath, deathData);
    this.game.events.emit(GAME_EVENTS.playerDeath, deathData);
    this.cameras.main.shake(
      GAME_BALANCE.cameraShakeDuration,
      GAME_BALANCE.cameraShakeIntensity,
    );

    this.hitStopCall = this.time.delayedCall(
      GAME_BALANCE.hitStopDuration,
      () => {
        this.physics.world.resume();
        this.hitStopCall = null;
      },
    );

    this.gameOverCall = this.time.delayedCall(
      GAME_BALANCE.gameOverDelay,
      () => {
        this.showGameOver();
        this.gameOverCall = null;
      },
    );
  }

  showGameOver() {
    if (this.runState !== RUN_STATE.dead) {
      return;
    }

    this.runState = RUN_STATE.gameOver;
    this.gameOverPanel = new GameOverPanel(this, {
      score: this.scoreManager.current,
      best: this.scoreManager.best,
      coinsEarned: this.walletSettlement?.added ?? 0,
      coinBalance:
        this.walletSettlement?.balance ??
        this.walletManager.balance,
      onRestart: () => this.resetRun(),
      onMenu: () => this.returnToMenu(),
    });
  }

  resetRun() {
    this.hitStopCall?.remove(false);
    this.gameOverCall?.remove(false);
    this.hitStopCall = null;
    this.gameOverCall = null;
    this.gameOverPanel = null;
    this.isLanded = false;
    this.runState = RUN_STATE.ready;
    this.walletSettlement = null;

    this.physics.world.resume();
    this.obstacleSpawner.reset();
    this.pickupSystem.reset();
    const initialDifficulty = this.difficultyManager.reset();
    const initialEvolution = this.evolutionManager.reset();
    const initialPowerUps = this.powerUpManager.reset();
    const initialWallet = this.walletManager.resetRun();
    this.worldZoneSystem.reset(initialDifficulty.zone);
    this.zoneAnnouncement.hide();
    this.evolutionEffects.reset(initialEvolution.stage);
    this.powerUpEffects.reset();
    this.scoreManager.reset();
    this.player.resetForRun(
      initialEvolution.stage,
      this.skinManager.getSelectedSkin(),
    );
    this.scoreText.setText("0").setScale(1);
    this.scoreShadow.setText("0").setScale(1);
    this.currentZoneId = null;
    this.updateZoneHud(initialDifficulty, false);
    this.powerUpHud.reset(initialWallet, initialPowerUps);

    this.tweens.killTweensOf(this.readyPrompt);
    this.readyPrompt
      .setVisible(true)
      .setAlpha(1)
      .setPosition(GAME_SIZE.width / 2, 248)
      .setScale(1);
    this.tweens.add({
      targets: this.readyPrompt,
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 760,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });

    this.flapInput.setEnabled(true);
  }

  returnToMenu() {
    this.walletManager?.commitRun();
    this.profileManager?.flush();
    this.flapInput?.setEnabled(false);
    this.obstacleSpawner?.stop();
    transitionToScene(this, SCENES.menu);
  }

  update(_time, delta) {
    if (!this.player) {
      return;
    }

    if (!this.isLanded) {
      this.player.updateMotion(delta);
    }

    let difficulty = this.difficultyManager.getSnapshot();
    let powerUps = this.powerUpManager.getSnapshot();
    const motionEnabled = this.runState === RUN_STATE.playing;
    let worldDelta = delta;

    if (motionEnabled) {
      this.profileManager.update(delta);
      powerUps = this.powerUpManager.update(delta);
      worldDelta = delta * powerUps.worldTimeScale;
      difficulty = this.difficultyManager.update(
        worldDelta,
        this.scoreManager.current,
      );
      this.updateZoneHud(difficulty);
      this.obstacleSpawner.update(worldDelta, {
        bird: this.player,
        difficulty,
      });
      this.pickupSystem.update(worldDelta, {
        realDelta: delta,
        bird: this.player,
        speed: difficulty.worldSpeed,
        motionEnabled,
        magnetDistance:
          this.player.coinMagnetDistance +
          powerUps.magnetDistance,
      });

      if (
        this.player.y + 22 >= GAME_BALANCE.groundY ||
        this.player.y < GAME_BALANCE.ceilingDeathY
      ) {
        this.handleDeath(
          this.player.y < GAME_BALANCE.ceilingDeathY ? "ceiling" : "ground",
        );
      }
    } else {
      this.obstacleSpawner.update(worldDelta, {
        bird: this.player,
        difficulty,
      });
      this.pickupSystem.update(worldDelta, {
        realDelta: delta,
        bird: this.player,
        speed: difficulty.worldSpeed,
        motionEnabled,
        magnetDistance: 0,
      });
    }

    this.worldZoneSystem.update(worldDelta, {
      zone: difficulty.zone,
      worldSpeed: difficulty.worldSpeed,
      motionEnabled,
    });
    this.evolutionEffects.update(delta, {
      player: this.player,
      motionEnabled,
    });
    this.powerUpEffects.update(delta, {
      player: this.player,
      powerUps,
    });
    this.powerUpHud.update(powerUps);

    if (
      (this.runState === RUN_STATE.dead ||
        this.runState === RUN_STATE.gameOver) &&
      !this.isLanded &&
      this.player.y + 22 >= GAME_BALANCE.groundY
    ) {
      this.isLanded = true;
      this.player.land();
    }
  }

  handleShutdown() {
    this.hitStopCall?.remove(false);
    this.gameOverCall?.remove(false);
    this.profileManager?.flush();
    this.physics?.world?.resume?.();
    this.flapInput?.destroy();
    this.obstacleCollider?.destroy();
    this.obstacleSpawner?.shutdown();
    this.pickupSystem?.shutdown();
    this.zoneAnnouncement?.destroy();
    this.evolutionEffects?.shutdown();
    this.powerUpEffects?.shutdown();
    this.powerUpHud?.destroy();
    this.worldZoneSystem?.shutdown();
    this.input.keyboard?.off("keydown-ESC", this.handleEscape);
    this.input.keyboard?.off("keydown-BACKSPACE", this.handleEscape);
  }
}
