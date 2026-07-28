import Phaser from "phaser";
import {
  COLORS,
  DEPTH,
  GAME_EVENTS,
  GAME_SIZE,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../config/constants.js";
import {
  EVOLUTION_EFFECTS,
  EVOLUTION_STAGES,
} from "../config/evolutionConfig.js";
import { addText } from "../utils/addText.js";
import { createPoint } from "../utils/createPoint.js";

function createStarPoints(
  centerX,
  centerY,
  outerRadius,
  innerRadius,
  pointCount = 5,
) {
  const points = [];

  for (let index = 0; index < pointCount * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (Math.PI * index) / pointCount;

    points.push(
      createPoint(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
      ),
    );
  }

  return points;
}

function getAlternatingColor(config, index) {
  return index % 2 === 0 ? config.primary : config.secondary;
}

export class EvolutionEffectsSystem {
  constructor(scene, initialStage = EVOLUTION_STAGES[0]) {
    this.scene = scene;
    this.stage = initialStage;
    this.trailElapsed = 0;
    this.trailSpawnIndex = 0;
    this.announcementProgress = { value: 0 };

    this.flash = scene.add
      .graphics()
      .setDepth(DEPTH.hud - 1)
      .setVisible(false)
      .setAlpha(0);
    this.ring = scene.add
      .graphics()
      .setDepth(DEPTH.content + 6)
      .setVisible(false)
      .setAlpha(0);

    this.trailParticles = Array.from(
      { length: EVOLUTION_EFFECTS.maximumTrailParticles },
      () => this.createTrailParticle(),
    );
    this.burstParticles = Array.from(
      { length: EVOLUTION_EFFECTS.maximumBurstParticles },
      () =>
        scene.add
          .graphics()
          .setDepth(DEPTH.content + 5)
          .setVisible(false)
          .setActive(false),
    );

    this.createAnnouncement();
  }

  createTrailParticle() {
    const graphics = this.scene.add
      .graphics()
      .setDepth(DEPTH.particles)
      .setVisible(false)
      .setActive(false);

    return {
      graphics,
      age: 0,
      lifetime: 1,
      drift: 0,
      verticalDrift: 0,
      startAlpha: 0,
      startScale: 1,
    };
  }

  createAnnouncement() {
    this.announcementPanel = this.scene.add.graphics();
    this.announcementKicker = addText(
      this.scene,
      0,
      -17,
      "EVRİMLEŞTİN LAN!",
      {
        fontFamily: TYPOGRAPHY.body,
        fontSize: "13px",
        color: TEXT_COLORS.cream,
        align: "center",
      },
    ).setOrigin(0.5);
    this.announcementTitle = addText(this.scene, 0, 13, "", {
      fontFamily: TYPOGRAPHY.display,
      fontSize: "27px",
      color: TEXT_COLORS.cream,
      stroke: TEXT_COLORS.ink,
      strokeThickness: 5,
      align: "center",
    }).setOrigin(0.5);
    this.announcementContainer = this.scene.add
      .container(GAME_SIZE.width / 2, 300, [
        this.announcementPanel,
        this.announcementKicker,
        this.announcementTitle,
      ])
      .setDepth(DEPTH.overlay)
      .setVisible(false)
      .setAlpha(0);
  }

  drawAnnouncement(stage) {
    this.announcementPanel.clear();
    this.announcementPanel.fillStyle(COLORS.ink, 0.9);
    this.announcementPanel.fillRoundedRect(
      -166,
      -50,
      332,
      100,
      24,
    );
    this.announcementPanel.lineStyle(3, stage.color, 0.92);
    this.announcementPanel.strokeRoundedRect(
      -164.5,
      -48.5,
      329,
      97,
      22,
    );
    this.announcementPanel.fillStyle(stage.color, 0.98);
    this.announcementPanel.fillRoundedRect(
      -39,
      -50,
      78,
      6,
      3,
    );
    this.announcementTitle.setText(stage.label);
    this.announcementKicker.setColor(
      `#${stage.color.toString(16).padStart(6, "0")}`,
    );
  }

  drawParticle(graphics, shape, color, secondary, size) {
    graphics.clear();

    if (shape === "dash") {
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(
        -size * 2,
        -size * 0.45,
        size * 4,
        size * 0.9,
        size * 0.4,
      );
      graphics.fillStyle(secondary, 0.9);
      graphics.fillCircle(size * 1.55, 0, size * 0.45);
      return;
    }

    if (shape === "diamond") {
      graphics.fillStyle(color, 1);
      graphics.fillPoints(
        [
          createPoint(0, -size * 1.5),
          createPoint(size, 0),
          createPoint(0, size * 1.5),
          createPoint(-size, 0),
        ],
        true,
      );
      graphics.lineStyle(1.5, secondary, 0.9);
      graphics.strokePoints(
        [
          createPoint(0, -size * 1.5),
          createPoint(size, 0),
          createPoint(0, size * 1.5),
          createPoint(-size, 0),
        ],
        true,
      );
      return;
    }

    if (shape === "spark") {
      graphics.lineStyle(Math.max(2, size * 0.5), color, 1);
      graphics.lineBetween(-size * 1.7, 0, size * 1.7, 0);
      graphics.lineStyle(Math.max(1, size * 0.32), secondary, 0.92);
      graphics.lineBetween(0, -size * 1.7, 0, size * 1.7);
      graphics.lineBetween(
        -size,
        -size,
        size,
        size,
      );
      return;
    }

    if (shape === "star") {
      graphics.fillStyle(color, 1);
      graphics.fillPoints(
        createStarPoints(0, 0, size * 1.7, size * 0.72),
        true,
      );
      graphics.fillStyle(secondary, 0.96);
      graphics.fillCircle(0, 0, size * 0.38);
      return;
    }

    graphics.fillStyle(color, 1);
    graphics.fillEllipse(0, 0, size * 2.2, size * 1.15);
    graphics.lineStyle(1, secondary, 0.82);
    graphics.lineBetween(-size * 0.8, 0, size * 0.8, 0);
  }

  setEvolution(stage) {
    if (!stage) {
      return;
    }

    this.stage = stage;
    this.trailElapsed = 0;
  }

  spawnTrail(player) {
    const particle = this.trailParticles.find(
      (candidate) => !candidate.graphics.active,
    );

    if (!particle) {
      return;
    }

    const trail = this.stage.trail;
    const index = this.trailSpawnIndex;
    const color = getAlternatingColor(trail, index);
    const secondary =
      color === trail.primary ? trail.secondary : trail.primary;
    const verticalOffset = Math.sin(index * 1.7) * 7;
    const scale = 0.72 + (index % 4) * 0.08;

    this.drawParticle(
      particle.graphics,
      trail.shape,
      color,
      secondary,
      trail.size,
    );
    particle.age = 0;
    particle.lifetime = trail.lifetime;
    particle.drift = trail.drift;
    particle.verticalDrift = Math.cos(index * 1.3) * 11;
    particle.startAlpha = trail.alpha;
    particle.startScale = scale;
    particle.graphics
      .setPosition(player.x - 27, player.y + verticalOffset)
      .setRotation(player.rotation * 0.18 + index * 0.27)
      .setScale(scale)
      .setAlpha(trail.alpha)
      .setVisible(true)
      .setActive(true);
    this.trailSpawnIndex += 1;
  }

  updateTrail(delta) {
    this.trailParticles.forEach((particle) => {
      if (!particle.graphics.active) {
        return;
      }

      particle.age += delta;
      const progress = Phaser.Math.Clamp(
        particle.age / particle.lifetime,
        0,
        1,
      );
      const seconds = delta / 1000;

      particle.graphics.x -= particle.drift * seconds;
      particle.graphics.y += particle.verticalDrift * seconds;
      particle.graphics.rotation -= 0.8 * seconds;
      particle.graphics
        .setAlpha(particle.startAlpha * (1 - progress))
        .setScale(
          particle.startScale * (1 - progress * 0.46),
        );

      if (progress >= 1) {
        particle.graphics
          .setVisible(false)
          .setActive(false)
          .setAlpha(0);
      }
    });
  }

  update(delta, { player, motionEnabled }) {
    const safeDelta = Math.min(Math.max(delta, 0), 50);

    this.updateTrail(safeDelta);

    if (
      !motionEnabled ||
      !player?.isAlive ||
      !this.stage.trail.enabled
    ) {
      return;
    }

    this.trailElapsed += safeDelta;

    if (this.trailElapsed < this.stage.trail.spawnInterval) {
      return;
    }

    this.trailElapsed %= this.stage.trail.spawnInterval;
    this.spawnTrail(player);
  }

  showFlash(stage) {
    this.scene.tweens.killTweensOf(this.flash);
    this.flash.clear();
    this.flash.fillStyle(stage.particle.secondary, 1);
    this.flash.fillRect(0, 0, GAME_SIZE.width, GAME_SIZE.height);
    this.flash
      .setVisible(true)
      .setAlpha(stage.level >= 4 ? 0.42 : 0.3);
    this.scene.tweens.add({
      targets: this.flash,
      alpha: 0,
      duration: EVOLUTION_EFFECTS.flashDuration,
      ease: "Quad.Out",
      onComplete: () => this.flash.setVisible(false),
    });
  }

  showRing(stage, player) {
    this.scene.tweens.killTweensOf(this.ring);
    this.ring.clear();
    this.ring.lineStyle(5, stage.color, 0.96);
    this.ring.strokeCircle(0, 0, 38);
    this.ring.lineStyle(2, stage.particle.secondary, 0.72);
    this.ring.strokeCircle(0, 0, 47);
    this.ring
      .setPosition(player.x, player.y)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.7);
    this.scene.tweens.add({
      targets: this.ring,
      alpha: 0,
      scaleX: 2.35,
      scaleY: 2.35,
      rotation: 0.35,
      duration: EVOLUTION_EFFECTS.ringDuration,
      ease: "Cubic.Out",
      onComplete: () => this.ring.setVisible(false),
    });
  }

  showBurst(stage, player) {
    const config = stage.particle;
    const count = Math.min(config.count, this.burstParticles.length);

    this.burstParticles.forEach((particle, index) => {
      this.scene.tweens.killTweensOf(particle);

      if (index >= count) {
        particle
          .setVisible(false)
          .setActive(false)
          .setAlpha(0);
        return;
      }

      const angle =
        (Math.PI * 2 * index) / count + stage.level * 0.19;
      const speedProgress =
        count <= 1 ? 0 : (index % Math.ceil(count / 2)) / (count / 2);
      const speed = Phaser.Math.Linear(
        config.speedMin,
        config.speedMax,
        Phaser.Math.Clamp(speedProgress, 0, 1),
      );
      const duration = 420 + (index % 5) * 30;
      const distance = speed * (duration / 1000);
      const color = getAlternatingColor(config, index);
      const secondary =
        color === config.primary ? config.secondary : config.primary;
      const size = 4 + (index % 3);

      this.drawParticle(
        particle,
        config.shape,
        color,
        secondary,
        size,
      );
      particle
        .setPosition(player.x, player.y)
        .setRotation(angle)
        .setScale(0.75)
        .setAlpha(1)
        .setVisible(true)
        .setActive(true);
      this.scene.tweens.add({
        targets: particle,
        x: player.x + Math.cos(angle) * distance,
        y: player.y + Math.sin(angle) * distance,
        rotation: angle + (index % 2 === 0 ? 1.8 : -1.8),
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        duration,
        ease: "Cubic.Out",
        onComplete: () => {
          particle.setVisible(false).setActive(false);
        },
      });
    });
  }

  showAnnouncement(stage) {
    this.scene.tweens.killTweensOf(this.announcementProgress);
    this.drawAnnouncement(stage);
    this.announcementProgress.value = 0;
    this.announcementContainer
      .setVisible(true)
      .setAlpha(0)
      .setScale(0.86)
      .setY(312);

    this.scene.tweens.add({
      targets: this.announcementProgress,
      value: 1,
      duration: EVOLUTION_EFFECTS.announcementDuration,
      ease: "Linear",
      onUpdate: () => {
        const value = this.announcementProgress.value;
        const enter = Math.min(1, value / 0.16);
        const exit = Math.min(1, (1 - value) / 0.24);
        const visibility = Math.min(enter, exit);

        this.announcementContainer
          .setAlpha(visibility)
          .setScale(0.86 + visibility * 0.14)
          .setY(312 - visibility * 12);
      },
      onComplete: () => {
        this.announcementContainer.setVisible(false).setAlpha(0);
      },
    });
  }

  emitEvolutionEvents(stage, score) {
    const payload = Object.freeze({
      id: stage.id,
      level: stage.level,
      label: stage.label,
      score,
      soundCue: stage.soundCue,
    });

    this.scene.events.emit(GAME_EVENTS.playerEvolution, payload);
    this.scene.game.events.emit(
      GAME_EVENTS.playerEvolution,
      payload,
    );
    this.scene.events.emit(GAME_EVENTS.evolutionSound, payload);
    this.scene.game.events.emit(
      GAME_EVENTS.evolutionSound,
      payload,
    );
  }

  showEvolution(stage, player, score) {
    if (!stage || !player) {
      return;
    }

    this.setEvolution(stage);
    this.showFlash(stage);
    this.showRing(stage, player);
    this.showBurst(stage, player);
    this.showAnnouncement(stage);
    this.scene.tweens.killTweensOf(player);
    player.setScale(1.18);
    this.scene.tweens.add({
      targets: player,
      scaleX: 1,
      scaleY: 1,
      duration: EVOLUTION_EFFECTS.playerPulseDuration,
      ease: "Back.Out",
    });
    this.emitEvolutionEvents(stage, score);
  }

  reset(stage = EVOLUTION_STAGES[0]) {
    this.setEvolution(stage);
    this.scene.tweens.killTweensOf(this.flash);
    this.scene.tweens.killTweensOf(this.ring);
    this.scene.tweens.killTweensOf(this.announcementProgress);
    this.flash.setVisible(false).setAlpha(0);
    this.ring.setVisible(false).setAlpha(0);
    this.announcementContainer.setVisible(false).setAlpha(0);
    this.trailSpawnIndex = 0;

    this.trailParticles.forEach((particle) => {
      particle.graphics
        .setVisible(false)
        .setActive(false)
        .setAlpha(0);
    });
    this.burstParticles.forEach((particle) => {
      this.scene.tweens.killTweensOf(particle);
      particle.setVisible(false).setActive(false).setAlpha(0);
    });
  }

  shutdown() {
    this.reset(EVOLUTION_STAGES[0]);
    this.flash.destroy();
    this.ring.destroy();
    this.announcementContainer.destroy(true);
    this.trailParticles.forEach((particle) =>
      particle.graphics.destroy(),
    );
    this.burstParticles.forEach((particle) => particle.destroy());
    this.trailParticles.length = 0;
    this.burstParticles.length = 0;
    this.scene = null;
  }
}
