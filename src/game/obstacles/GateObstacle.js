import {
  COLORS,
  DEPTH,
  GAME_SIZE,
  TEXT_COLORS,
  TYPOGRAPHY,
} from "../../config/constants.js";
import { OBSTACLE_TYPES } from "../../config/difficultyConfig.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";
import { ZONE_IDS } from "../../config/zoneConfig.js";
import { addText } from "../../utils/addText.js";
import {
  createBoxCollider,
  disableCollider,
  setBoxCollider,
} from "./obstaclePhysics.js";

function getGatePalette(type, zoneId) {
  const typeAccent =
    type === OBSTACLE_TYPES.moving
      ? COLORS.mint
      : type === OBSTACLE_TYPES.closing
        ? COLORS.coral
        : COLORS.amber;

  if (zoneId === ZONE_IDS.nightCity) {
    return {
      shell: 0x0c1328,
      stoneA: 0x1a2a43,
      stoneB: 0x122038,
      woodA: 0x17314c,
      woodB: 0x0c2036,
      accent:
        type === OBSTACLE_TYPES.closing
          ? 0xff5c9a
          : 0x5de6ff,
      bolt: 0xffd767,
    };
  }

  if (zoneId === ZONE_IDS.storm) {
    return {
      shell: 0x111b24,
      stoneA: 0x344654,
      stoneB: 0x263743,
      woodA: 0x24333e,
      woodB: 0x17252e,
      accent:
        type === OBSTACLE_TYPES.closing
          ? COLORS.coral
          : 0xa6d9ff,
      bolt: 0xe5f6ff,
    };
  }

  if (zoneId === ZONE_IDS.space) {
    return {
      shell: 0x080412,
      stoneA: 0x2e1250,
      stoneB: 0x1a0b38,
      woodA: 0x1a0936,
      woodB: 0x0c0620,
      accent:
        type === OBSTACLE_TYPES.moving
          ? 0x62f4ff
          : type === OBSTACLE_TYPES.closing
            ? 0xff4fa8
            : 0xff56d7,
      bolt: 0x62f4ff,
    };
  }

  if (zoneId === ZONE_IDS.evening) {
    return {
      shell: 0x241b26,
      stoneA: 0x5b4553,
      stoneB: 0x463741,
      woodA: 0x8a4b2b,
      woodB: 0x59301f,
      accent: typeAccent,
      bolt: 0xffd38b,
    };
  }

  return {
    shell: COLORS.navy,
    stoneA: COLORS.slate,
    stoneB: COLORS.hillFar,
    woodA: COLORS.amberDark,
    woodB: 0x6f4524,
    accent: typeAccent,
    bolt: COLORS.amber,
  };
}

function drawStoneCourse(graphics, y, width, index, palette) {
  const inset = index % 2 === 0 ? 9 : 14;
  const courseWidth = width - inset * 2;

  graphics.fillStyle(
    index % 2 === 0 ? palette.stoneA : palette.stoneB,
  );
  graphics.fillRoundedRect(inset, y, courseWidth, 31, 5);
  graphics.lineStyle(1, COLORS.cream, 0.12);
  graphics.strokeRoundedRect(
    inset + 1,
    y + 1,
    courseWidth - 2,
    29,
    4,
  );

  const seamX =
    inset + courseWidth * (index % 3 === 0 ? 0.42 : 0.6);
  graphics.lineStyle(2, COLORS.ink, 0.28);
  graphics.lineBetween(seamX, y + 3, seamX, y + 28);
}

function drawVillageGateSegment(
  graphics,
  height,
  isTop,
  type,
  zoneId,
) {
  const width = GAME_BALANCE.obstacleWidth;
  const lintelY = isTop ? height - 38 : 6;
  const palette = getGatePalette(type, zoneId);

  graphics.clear();
  graphics.fillStyle(COLORS.black, 0.28);
  graphics.fillRoundedRect(9, 4, width - 12, height, 9);
  graphics.fillStyle(palette.shell);
  graphics.fillRoundedRect(5, 0, width - 12, height, 9);
  graphics.lineStyle(2, COLORS.cream, 0.14);
  graphics.strokeRoundedRect(6, 1, width - 14, height - 2, 8);

  for (
    let y = 8, index = 0;
    y < height - 24;
    y += 34, index += 1
  ) {
    drawStoneCourse(graphics, y, width - 2, index, palette);
  }

  graphics.fillStyle(palette.woodA);
  graphics.fillRoundedRect(
    24,
    5,
    48,
    Math.max(36, height - 10),
    7,
  );
  graphics.fillStyle(palette.woodB);
  graphics.fillRoundedRect(
    29,
    7,
    18,
    Math.max(32, height - 14),
    5,
  );
  graphics.fillRoundedRect(
    49,
    7,
    18,
    Math.max(32, height - 14),
    5,
  );
  graphics.lineStyle(2, COLORS.ink, 0.32);
  graphics.lineBetween(48, 10, 48, height - 10);

  for (let y = 24; y < height - 12; y += 54) {
    graphics.fillStyle(palette.bolt, 0.72);
    graphics.fillCircle(38, y, 3);
    graphics.fillCircle(59, y, 3);
  }

  graphics.fillStyle(COLORS.ink, 0.32);
  graphics.fillRoundedRect(-2, lintelY + 6, width + 4, 35, 8);
  graphics.fillStyle(palette.accent);
  graphics.fillRoundedRect(-6, lintelY, width + 12, 34, 8);
  graphics.fillStyle(palette.woodA);
  graphics.fillRoundedRect(-1, lintelY + 5, width + 2, 23, 5);
  graphics.lineStyle(2, COLORS.cream, 0.36);
  graphics.strokeRoundedRect(
    -5,
    lintelY + 1,
    width + 10,
    32,
    7,
  );

  graphics.fillStyle(COLORS.ink, 0.45);
  graphics.fillTriangle(
    width / 2 - 7,
    lintelY + 9,
    width / 2 + 7,
    lintelY + 9,
    width / 2,
    lintelY + 22,
  );
}

function drawLaserSegment(graphics, height, isTop, active) {
  const width = GAME_BALANCE.obstacleWidth;
  const beamWidth = GAME_BALANCE.laserBeamWidth;
  const beamX = (width - beamWidth) / 2;
  const emitterY = isTop ? Math.max(0, height - 25) : 0;
  const color = active ? 0xff3d74 : 0x5de6ff;
  const beamAlpha = active ? 0.9 : 0.2;

  graphics.clear();
  graphics.fillStyle(color, beamAlpha * 0.16);
  graphics.fillRect(beamX - 9, 0, beamWidth + 18, height);
  graphics.fillStyle(color, beamAlpha);
  graphics.fillRect(beamX, 0, beamWidth, height);
  graphics.fillStyle(COLORS.white, active ? 0.88 : 0.28);
  graphics.fillRect(width / 2 - 3, 0, 6, height);

  if (!active) {
    graphics.fillStyle(COLORS.night, 0.9);
    for (let y = 5; y < height; y += 18) {
      graphics.fillRect(beamX - 2, y, beamWidth + 4, 9);
    }
  }

  graphics.fillStyle(COLORS.ink, 0.92);
  graphics.fillRoundedRect(13, emitterY, width - 26, 25, 7);
  graphics.fillStyle(COLORS.slate);
  graphics.fillRoundedRect(18, emitterY + 4, width - 36, 17, 5);
  graphics.lineStyle(2, color, active ? 0.95 : 0.55);
  graphics.strokeRoundedRect(
    14,
    emitterY + 1,
    width - 28,
    23,
    6,
  );
  graphics.fillStyle(color);
  graphics.fillCircle(width / 2, emitterY + 12, 5);
}

export class GateObstacle {
  constructor(scene, colliderGroup, type = OBSTACLE_TYPES.normal) {
    this.scene = scene;
    this.type = type;
    this.active = false;
    this.scored = false;
    this.x = -300;
    this.elapsed = 0;
    this.laserActive = type !== OBSTACLE_TYPES.laser;
    this.lastTopHeight = null;
    this.lastBottomHeight = null;
    this.lastLaserState = null;

    this.topVisual = scene.add
      .graphics()
      .setDepth(DEPTH.obstacles)
      .setVisible(false);
    this.bottomVisual = scene.add
      .graphics()
      .setDepth(DEPTH.obstacles)
      .setVisible(false);

    this.warningText =
      type === OBSTACLE_TYPES.laser
        ? addText(scene, -300, -300, "! LAZER !", {
            fontFamily: TYPOGRAPHY.display,
            fontSize: "13px",
            color: TEXT_COLORS.coral,
            stroke: TEXT_COLORS.ink,
            strokeThickness: 4,
            align: "center",
          })
            .setOrigin(0.5)
            .setDepth(DEPTH.obstacles + 1)
            .setVisible(false)
        : null;

    this.topCollider = createBoxCollider(scene, colliderGroup);
    this.bottomCollider = createBoxCollider(scene, colliderGroup);
  }

  activate({
    x,
    gapCenter,
    gapSize,
    phase = 0,
    zoneId = ZONE_IDS.village,
  }) {
    this.active = true;
    this.scored = false;
    this.x = x;
    this.elapsed = 0;
    this.baseGapCenter = gapCenter;
    this.baseGapSize = gapSize;
    this.phase = phase;
    this.zoneId = zoneId;
    this.laserActive = this.type !== OBSTACLE_TYPES.laser;
    this.lastTopHeight = null;
    this.lastBottomHeight = null;
    this.lastLaserState = null;
    this.topVisual.setVisible(true);
    this.bottomVisual.setVisible(true);
    this.warningText?.setVisible(true);
    this.updateGeometry(gapCenter, gapSize, true);
  }

  getAnimatedGeometry() {
    let gapCenter = this.baseGapCenter;
    let gapSize = this.baseGapSize;

    if (this.type === OBSTACLE_TYPES.moving) {
      const wave =
        Math.sin(
          (this.elapsed / GAME_BALANCE.movingGatePeriod) *
            Math.PI *
            2 +
            this.phase,
        ) * GAME_BALANCE.movingGateAmplitude;
      gapCenter += wave;
    }

    if (this.type === OBSTACLE_TYPES.closing) {
      const closeWave =
        0.5 -
        0.5 *
          Math.cos(
            (this.elapsed / GAME_BALANCE.closingGatePeriod) *
              Math.PI *
              2,
          );
      gapSize = Math.max(
        GAME_BALANCE.closingGateMinimumGap,
        this.baseGapSize -
          GAME_BALANCE.closingGateAmount * closeWave,
      );
    }

    gapCenter = Math.min(
      GAME_BALANCE.gapCenterMax,
      Math.max(GAME_BALANCE.gapCenterMin, gapCenter),
    );

    return { gapCenter, gapSize };
  }

  updateGeometry(gapCenter, gapSize, forceRender = false) {
    const gapHalf = gapSize / 2;
    const topHeight = Math.max(1, gapCenter - gapHalf);
    const bottomStart = gapCenter + gapHalf;
    const bottomHeight = Math.max(
      1,
      GAME_BALANCE.groundY - bottomStart,
    );
    const isLaser = this.type === OBSTACLE_TYPES.laser;
    const needsRender =
      forceRender ||
      Math.abs((this.lastTopHeight ?? -99) - topHeight) >= 2 ||
      Math.abs((this.lastBottomHeight ?? -99) - bottomHeight) >=
        2 ||
      this.lastLaserState !== this.laserActive;

    if (needsRender) {
      if (isLaser) {
        drawLaserSegment(
          this.topVisual,
          topHeight,
          true,
          this.laserActive,
        );
        drawLaserSegment(
          this.bottomVisual,
          bottomHeight,
          false,
          this.laserActive,
        );
      } else {
        drawVillageGateSegment(
          this.topVisual,
          topHeight,
          true,
          this.type,
          this.zoneId,
        );
        drawVillageGateSegment(
          this.bottomVisual,
          bottomHeight,
          false,
          this.type,
          this.zoneId,
        );
      }

      this.lastTopHeight = topHeight;
      this.lastBottomHeight = bottomHeight;
      this.lastLaserState = this.laserActive;
    }

    this.topVisual.setPosition(
      this.x - GAME_BALANCE.obstacleWidth / 2,
      0,
    );
    this.bottomVisual.setPosition(
      this.x - GAME_BALANCE.obstacleWidth / 2,
      bottomStart,
    );

    if (!isLaser || this.laserActive) {
      const colliderWidth = isLaser
        ? GAME_BALANCE.laserHitboxWidth
        : GAME_BALANCE.obstacleWidth;
      setBoxCollider(
        this.topCollider,
        this.x,
        topHeight / 2,
        colliderWidth,
        topHeight,
      );
      setBoxCollider(
        this.bottomCollider,
        this.x,
        bottomStart + bottomHeight / 2,
        colliderWidth,
        bottomHeight,
      );
    } else {
      disableCollider(this.topCollider);
      disableCollider(this.bottomCollider);
    }

    if (this.warningText) {
      this.warningText
        .setPosition(this.x, gapCenter)
        .setAlpha(
          this.laserActive
            ? 0
            : 0.55 +
                Math.sin(this.elapsed / 75) * 0.35,
        )
        .setVisible(!this.laserActive && this.x < GAME_SIZE.width + 45);
    }
  }

  update({
    delta,
    birdX,
    speed,
    motionEnabled,
    onPassed,
  }) {
    if (!this.active) {
      return;
    }

    const safeDelta = Math.min(Math.max(delta, 0), 50);

    if (motionEnabled) {
      this.elapsed += safeDelta;
      this.x -= speed * (safeDelta / 1000);
    }

    if (
      this.type === OBSTACLE_TYPES.laser &&
      !this.laserActive &&
      this.elapsed >= GAME_BALANCE.laserWarningDuration
    ) {
      this.laserActive = true;
    }

    const { gapCenter, gapSize } = this.getAnimatedGeometry();
    this.updateGeometry(gapCenter, gapSize);

    if (
      !this.scored &&
      this.x + GAME_BALANCE.obstacleWidth / 2 < birdX
    ) {
      this.scored = true;
      onPassed?.();
    }

    if (this.x < -GAME_BALANCE.obstacleWidth) {
      this.deactivate();
    }
  }

  deactivate() {
    this.active = false;
    this.scored = false;
    this.x = -300;
    this.topVisual.setVisible(false);
    this.bottomVisual.setVisible(false);
    this.warningText?.setVisible(false);
    disableCollider(this.topCollider);
    disableCollider(this.bottomCollider);
  }
}
