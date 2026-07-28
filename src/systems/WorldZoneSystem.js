import {
  DEPTH,
  GAME_SIZE,
} from "../config/constants.js";
import { GAME_BALANCE } from "../config/gameBalance.js";
import {
  PARALLAX_SEGMENT_WIDTH,
  WORLD_ZONES,
  ZONE_IDS,
  ZONE_TRANSITION_DURATION,
  getWorldZoneById,
} from "../config/zoneConfig.js";

const LAYER_KEYS = Object.freeze(["far", "mid", "near"]);
const LIGHTNING_DELAYS = Object.freeze([3100, 4700, 3600, 5400]);
const SKY_GRADIENT_BANDS = 18;

export function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

export function smoothCrossfade(value) {
  const progress = clampUnit(value);
  return progress * progress * (3 - 2 * progress);
}

export function getCrossfadeAlphas(
  elapsed,
  duration = ZONE_TRANSITION_DURATION,
) {
  const safeDuration = Math.max(1, duration);
  const incoming = smoothCrossfade(elapsed / safeDuration);

  return {
    outgoing: 1 - incoming,
    incoming,
  };
}

export function getParallaxOffset(
  worldDistance,
  speedMultiplier,
  segmentWidth = PARALLAX_SEGMENT_WIDTH,
) {
  const safeWidth = Math.max(1, segmentWidth);
  const distance =
    Math.max(0, worldDistance) * Math.max(0, speedMultiplier);
  return -(distance % safeWidth);
}

function interpolateColor(start, end, progress) {
  const amount = clampUnit(progress);
  const startRed = (start >> 16) & 0xff;
  const startGreen = (start >> 8) & 0xff;
  const startBlue = start & 0xff;
  const endRed = (end >> 16) & 0xff;
  const endGreen = (end >> 8) & 0xff;
  const endBlue = end & 0xff;
  const red = Math.round(startRed + (endRed - startRed) * amount);
  const green = Math.round(
    startGreen + (endGreen - startGreen) * amount,
  );
  const blue = Math.round(
    startBlue + (endBlue - startBlue) * amount,
  );

  return (red << 16) | (green << 8) | blue;
}

function drawVerticalGradient(graphics, topColor, bottomColor, height) {
  const bandHeight = height / SKY_GRADIENT_BANDS;

  for (let index = 0; index < SKY_GRADIENT_BANDS; index += 1) {
    const progress = index / Math.max(1, SKY_GRADIENT_BANDS - 1);

    graphics.fillStyle(
      interpolateColor(topColor, bottomColor, progress),
      1,
    );
    graphics.fillRect(
      0,
      index * bandHeight,
      GAME_SIZE.width,
      bandHeight + 1,
    );
  }
}

function drawCloud(
  graphics,
  x,
  y,
  scale,
  color,
  alpha = 1,
) {
  graphics.fillStyle(color, alpha);
  graphics.fillCircle(x, y, 18 * scale);
  graphics.fillCircle(x + 22 * scale, y - 8 * scale, 24 * scale);
  graphics.fillCircle(x + 49 * scale, y, 19 * scale);
  graphics.fillRoundedRect(
    x - 4 * scale,
    y,
    58 * scale,
    18 * scale,
    8 * scale,
  );
}

function drawStars(graphics, offsetX, count, color, alpha, salt) {
  for (let index = 0; index < count; index += 1) {
    const x =
      offsetX +
      ((index * 83 + salt * 41) % PARALLAX_SEGMENT_WIDTH);
    const y = 52 + ((index * 67 + salt * 29) % 480);
    const radius = index % 5 === 0 ? 2.1 : 1.1;
    graphics.fillStyle(color, alpha * (0.68 + (index % 3) * 0.14));
    graphics.fillCircle(x, y, radius);
  }
}

function drawVillageHouse(graphics, x, groundY, color, accent, scale = 1) {
  const width = 44 * scale;
  const height = 39 * scale;
  const top = groundY - height;

  graphics.fillStyle(color);
  graphics.fillRoundedRect(x, top, width, height, 3 * scale);
  graphics.fillStyle(accent);
  graphics.fillTriangle(
    x - 7 * scale,
    top + 2 * scale,
    x + width / 2,
    top - 20 * scale,
    x + width + 7 * scale,
    top + 2 * scale,
  );
  graphics.fillStyle(0x1b1720, 0.72);
  graphics.fillRect(
    x + width * 0.4,
    groundY - 18 * scale,
    width * 0.22,
    18 * scale,
  );
  graphics.fillStyle(0xffe7a4, 0.7);
  graphics.fillRect(
    x + 8 * scale,
    top + 11 * scale,
    8 * scale,
    8 * scale,
  );
}

function drawFence(graphics, offsetX, color, alpha = 1) {
  graphics.fillStyle(color, alpha);
  graphics.fillRect(
    offsetX,
    GAME_BALANCE.groundY - 35,
    PARALLAX_SEGMENT_WIDTH,
    7,
  );

  for (
    let x = offsetX + 18;
    x < offsetX + PARALLAX_SEGMENT_WIDTH;
    x += 54
  ) {
    graphics.fillRoundedRect(
      x,
      GAME_BALANCE.groundY - 54,
      9,
      57,
      3,
    );
    graphics.fillTriangle(
      x,
      GAME_BALANCE.groundY - 54,
      x + 4.5,
      GAME_BALANCE.groundY - 64,
      x + 9,
      GAME_BALANCE.groundY - 54,
    );
  }
}

function drawCityBuildings(
  graphics,
  offsetX,
  baseY,
  count,
  width,
  color,
  light,
  salt,
) {
  const spacing = PARALLAX_SEGMENT_WIDTH / count;

  for (let index = 0; index < count; index += 1) {
    const height = 70 + ((index * 47 + salt * 31) % 170);
    const x = offsetX + index * spacing;
    const buildingWidth = width + ((index * 13) % 17);

    graphics.fillStyle(color);
    graphics.fillRect(x, baseY - height, buildingWidth, height);
    graphics.fillStyle(light, 0.72);

    for (let row = 0; row < Math.floor((height - 20) / 24); row += 1) {
      for (let column = 0; column < 2; column += 1) {
        if ((row + column + index + salt) % 3 !== 0) {
          graphics.fillRect(
            x + 8 + column * 15,
            baseY - height + 14 + row * 24,
            6,
            9,
          );
        }
      }
    }

    if (index % 4 === 0) {
      graphics.lineStyle(2, light, 0.48);
      graphics.lineBetween(
        x + buildingWidth / 2,
        baseY - height,
        x + buildingWidth / 2,
        baseY - height - 23,
      );
      graphics.fillStyle(light, 0.82);
      graphics.fillCircle(
        x + buildingWidth / 2,
        baseY - height - 25,
        2,
      );
    }
  }
}

function drawVillageLayer(graphics, layerKey, offsetX, visual) {
  if (layerKey === "far") {
    graphics.fillStyle(visual.far);
    for (let index = 0; index < 6; index += 1) {
      const x = offsetX + index * 118 - 28;
      const peakY = 390 + (index % 3) * 32;
      graphics.fillTriangle(
        x,
        610,
        x + 74,
        peakY,
        x + 156,
        610,
      );
      graphics.fillStyle(visual.light, 0.34);
      graphics.fillTriangle(
        x + 53,
        peakY + 38,
        x + 74,
        peakY,
        x + 95,
        peakY + 42,
      );
      graphics.fillStyle(visual.far);
    }
    return;
  }

  if (layerKey === "mid") {
    graphics.fillStyle(visual.mid);
    graphics.fillTriangle(offsetX, 704, offsetX + 135, 530, offsetX + 290, 704);
    graphics.fillTriangle(
      offsetX + 230,
      704,
      offsetX + 405,
      545,
      offsetX + 575,
      704,
    );
    graphics.fillTriangle(
      offsetX + 490,
      704,
      offsetX + 590,
      580,
      offsetX + 680,
      704,
    );
    drawVillageHouse(
      graphics,
      offsetX + 78,
      665,
      0x8c6540,
      visual.accent,
      0.86,
    );
    drawVillageHouse(
      graphics,
      offsetX + 492,
      654,
      0x765239,
      visual.accent,
      0.72,
    );
    return;
  }

  graphics.fillStyle(visual.near);
  for (let index = 0; index < 15; index += 1) {
    const x = offsetX + index * 46;
    const height = 12 + (index % 4) * 6;
    graphics.fillCircle(x, GAME_BALANCE.groundY - 8, 18 + height * 0.25);
    graphics.fillTriangle(
      x - 14,
      GAME_BALANCE.groundY,
      x,
      GAME_BALANCE.groundY - height,
      x + 9,
      GAME_BALANCE.groundY,
    );
  }
  drawFence(graphics, offsetX, 0x83572f, 0.95);
}

function drawEveningLayer(graphics, layerKey, offsetX, visual) {
  if (layerKey === "far") {
    graphics.fillStyle(visual.far);
    for (let index = 0; index < 5; index += 1) {
      const x = offsetX + index * 145 - 30;
      graphics.fillTriangle(
        x,
        622,
        x + 102,
        420 + (index % 2) * 45,
        x + 205,
        622,
      );
    }
    return;
  }

  if (layerKey === "mid") {
    graphics.fillStyle(visual.mid);
    graphics.fillTriangle(offsetX, 704, offsetX + 160, 550, offsetX + 330, 704);
    graphics.fillTriangle(
      offsetX + 250,
      704,
      offsetX + 455,
      525,
      offsetX + 690,
      704,
    );
    drawVillageHouse(
      graphics,
      offsetX + 112,
      672,
      0x5b3c38,
      visual.accent,
      0.82,
    );

    for (const x of [offsetX + 380, offsetX + 585]) {
      graphics.fillStyle(visual.near);
      graphics.fillRect(x - 4, 548, 8, 132);
      graphics.fillCircle(x, 538, 27);
      graphics.fillCircle(x - 17, 551, 21);
      graphics.fillCircle(x + 18, 553, 22);
    }
    return;
  }

  graphics.fillStyle(visual.near);
  for (let index = 0; index < 19; index += 1) {
    const x = offsetX + index * 36;
    const grassHeight = 22 + (index % 5) * 7;
    graphics.fillTriangle(
      x,
      GAME_BALANCE.groundY,
      x + 7,
      GAME_BALANCE.groundY - grassHeight,
      x + 13,
      GAME_BALANCE.groundY,
    );
  }
  drawFence(graphics, offsetX, 0x5a3c32, 0.9);
}

function drawNightCityLayer(graphics, layerKey, offsetX, visual) {
  if (layerKey === "far") {
    drawCityBuildings(
      graphics,
      offsetX,
      634,
      15,
      30,
      visual.far,
      visual.light,
      1,
    );
    return;
  }

  if (layerKey === "mid") {
    drawCityBuildings(
      graphics,
      offsetX,
      GAME_BALANCE.groundY,
      10,
      47,
      visual.mid,
      visual.accent,
      4,
    );
    return;
  }

  graphics.fillStyle(visual.near);
  graphics.fillRect(
    offsetX,
    GAME_BALANCE.groundY - 38,
    PARALLAX_SEGMENT_WIDTH,
    38,
  );
  graphics.lineStyle(4, visual.accent, 0.54);
  graphics.lineBetween(
    offsetX,
    GAME_BALANCE.groundY - 39,
    offsetX + PARALLAX_SEGMENT_WIDTH,
    GAME_BALANCE.groundY - 39,
  );

  for (
    let x = offsetX + 42;
    x < offsetX + PARALLAX_SEGMENT_WIDTH;
    x += 132
  ) {
    graphics.fillStyle(visual.near);
    graphics.fillRect(x - 4, 572, 8, 96);
    graphics.lineStyle(3, visual.light, 0.8);
    graphics.lineBetween(x, 574, x + 27, 553);
    graphics.fillStyle(visual.light, 0.92);
    graphics.fillCircle(x + 29, 551, 6);
  }
}

function drawStormLayer(graphics, layerKey, offsetX, visual) {
  if (layerKey === "far") {
    for (let index = 0; index < 6; index += 1) {
      drawCloud(
        graphics,
        offsetX + index * 124 - 36,
        185 + (index % 3) * 58,
        1.5,
        visual.far,
        0.92,
      );
    }
    graphics.fillStyle(visual.horizon, 0.44);
    graphics.fillTriangle(offsetX, 650, offsetX + 180, 480, offsetX + 370, 650);
    graphics.fillTriangle(
      offsetX + 280,
      650,
      offsetX + 485,
      465,
      offsetX + 690,
      650,
    );
    return;
  }

  if (layerKey === "mid") {
    for (let index = 0; index < 7; index += 1) {
      drawCloud(
        graphics,
        offsetX + index * 108 - 52,
        300 + (index % 2) * 54,
        1.15,
        visual.mid,
        0.9,
      );
    }
    graphics.fillStyle(visual.mid);
    graphics.fillTriangle(offsetX, 704, offsetX + 168, 560, offsetX + 350, 704);
    graphics.fillTriangle(
      offsetX + 260,
      704,
      offsetX + 472,
      545,
      offsetX + 690,
      704,
    );
    return;
  }

  graphics.fillStyle(visual.near);
  for (let index = 0; index < 12; index += 1) {
    const x = offsetX + 18 + index * 57;
    const treeHeight = 68 + (index % 4) * 17;
    graphics.fillRect(
      x - 4,
      GAME_BALANCE.groundY - treeHeight,
      8,
      treeHeight,
    );
    graphics.fillTriangle(
      x - 29,
      GAME_BALANCE.groundY - treeHeight + 28,
      x,
      GAME_BALANCE.groundY - treeHeight - 30,
      x + 25,
      GAME_BALANCE.groundY - treeHeight + 28,
    );
    graphics.fillTriangle(
      x - 24,
      GAME_BALANCE.groundY - treeHeight + 53,
      x,
      GAME_BALANCE.groundY - treeHeight + 4,
      x + 22,
      GAME_BALANCE.groundY - treeHeight + 53,
    );
  }
}

function drawSpaceLayer(graphics, layerKey, offsetX, visual) {
  if (layerKey === "far") {
    drawStars(graphics, offsetX, 28, visual.light, 0.82, 3);
    return;
  }

  if (layerKey === "mid") {
    drawStars(graphics, offsetX, 16, visual.accent, 0.72, 7);
    for (let index = 0; index < 7; index += 1) {
      const x = offsetX + 38 + index * 94;
      const y = 205 + ((index * 79) % 360);
      const radius = 12 + (index % 3) * 7;
      graphics.fillStyle(visual.mid, 0.96);
      graphics.fillCircle(x, y, radius);
      graphics.fillTriangle(
        x - radius,
        y,
        x - radius * 0.15,
        y - radius * 1.2,
        x + radius,
        y + radius * 0.25,
      );
      graphics.lineStyle(2, visual.accent, 0.34);
      graphics.strokeCircle(x, y, radius + 3);
    }
    return;
  }

  graphics.fillStyle(visual.near);
  graphics.fillRect(
    offsetX,
    GAME_BALANCE.groundY - 52,
    PARALLAX_SEGMENT_WIDTH,
    52,
  );
  graphics.lineStyle(4, visual.accent, 0.9);
  graphics.lineBetween(
    offsetX,
    GAME_BALANCE.groundY - 52,
    offsetX + PARALLAX_SEGMENT_WIDTH,
    GAME_BALANCE.groundY - 52,
  );
  graphics.lineStyle(2, visual.light, 0.52);

  for (let x = offsetX; x < offsetX + PARALLAX_SEGMENT_WIDTH; x += 52) {
    graphics.lineBetween(
      x,
      GAME_BALANCE.groundY,
      x + 35,
      GAME_BALANCE.groundY - 52,
    );
  }

  for (
    let x = offsetX + 74;
    x < offsetX + PARALLAX_SEGMENT_WIDTH;
    x += 190
  ) {
    graphics.lineStyle(5, visual.accent, 0.28);
    graphics.strokeCircle(x, GAME_BALANCE.groundY - 98, 37);
    graphics.lineStyle(2, visual.light, 0.9);
    graphics.strokeCircle(x, GAME_BALANCE.groundY - 98, 29);
  }
}

function drawLayer(graphics, zone, layerKey) {
  const drawByZone = {
    [ZONE_IDS.village]: drawVillageLayer,
    [ZONE_IDS.evening]: drawEveningLayer,
    [ZONE_IDS.nightCity]: drawNightCityLayer,
    [ZONE_IDS.storm]: drawStormLayer,
    [ZONE_IDS.space]: drawSpaceLayer,
  };
  const drawSegment = drawByZone[zone.id] ?? drawVillageLayer;

  drawSegment(graphics, layerKey, 0, zone.visual);
  drawSegment(
    graphics,
    layerKey,
    PARALLAX_SEGMENT_WIDTH,
    zone.visual,
  );
}

function drawSky(graphics, zone) {
  const visual = zone.visual;

  drawVerticalGradient(
    graphics,
    visual.skyTop,
    visual.skyBottom,
    GAME_BALANCE.groundY,
  );
  graphics.fillStyle(visual.ground);
  graphics.fillRect(
    0,
    GAME_BALANCE.groundY,
    GAME_SIZE.width,
    GAME_SIZE.height - GAME_BALANCE.groundY,
  );

  if (zone.id === ZONE_IDS.village) {
    graphics.fillStyle(visual.light, 0.2);
    graphics.fillCircle(334, 126, 64);
    graphics.fillStyle(visual.light, 0.96);
    graphics.fillCircle(334, 126, 28);
    drawCloud(graphics, 34, 156, 0.82, 0xffffff, 0.5);
    drawCloud(graphics, 256, 238, 0.58, 0xffffff, 0.34);
  } else if (zone.id === ZONE_IDS.evening) {
    graphics.fillStyle(visual.light, 0.18);
    graphics.fillCircle(98, 286, 78);
    graphics.fillStyle(visual.accent, 0.94);
    graphics.fillCircle(98, 286, 35);
    drawCloud(graphics, 240, 180, 0.8, 0x352940, 0.38);
  } else if (zone.id === ZONE_IDS.nightCity) {
    drawStars(graphics, 0, 20, 0xe6f7ff, 0.64, 2);
    graphics.fillStyle(0xe8f4ff, 0.78);
    graphics.fillCircle(348, 126, 31);
    graphics.fillStyle(visual.skyTop);
    graphics.fillCircle(361, 116, 29);
  } else if (zone.id === ZONE_IDS.storm) {
    graphics.fillStyle(visual.light, 0.08);
    graphics.fillCircle(326, 134, 54);
    drawCloud(graphics, -20, 104, 1.7, visual.far, 0.58);
    drawCloud(graphics, 262, 92, 1.55, visual.far, 0.66);
  } else {
    graphics.fillStyle(0x7b2cff, 0.12);
    graphics.fillEllipse(176, 260, 360, 170);
    graphics.fillStyle(0x62f4ff, 0.08);
    graphics.fillEllipse(320, 420, 280, 135);
    graphics.fillStyle(0xff56d7, 0.2);
    graphics.fillCircle(342, 148, 58);
    graphics.fillStyle(0x241346, 1);
    graphics.fillCircle(342, 148, 46);
    graphics.lineStyle(5, visual.light, 0.55);
    graphics.strokeEllipse(342, 148, 124, 28);
  }
}

function createRain(scene, root, color) {
  const rainContainer = scene.add.container(0, 0);
  const drops = Array.from({ length: 38 }, (_, index) => {
    const x = (index * 79 + 17) % (GAME_SIZE.width + 80) - 40;
    const y = (index * 113 + 43) % GAME_SIZE.height;
    const length = 13 + (index % 5) * 4;
    const speed = 470 + (index % 7) * 34;
    const view = scene.add
      .rectangle(x, y, 1.4, length, color, 0.3 + (index % 3) * 0.08)
      .setRotation(-0.22);
    rainContainer.add(view);

    return { view, x, y, speed };
  });

  root.add(rainContainer);
  return { rainContainer, drops };
}

function drawLightning(graphics, sequenceIndex, color) {
  const startX = 74 + ((sequenceIndex * 137) % 286);
  const points = [
    [startX, 96],
    [startX - 18, 185],
    [startX + 7, 185],
    [startX - 16, 292],
    [startX + 18, 265],
    [startX + 4, 365],
  ];

  graphics.clear();
  graphics.lineStyle(8, color, 0.12);
  graphics.beginPath();
  graphics.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => graphics.lineTo(x, y));
  graphics.strokePath();
  graphics.lineStyle(2, color, 0.96);
  graphics.beginPath();
  graphics.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => graphics.lineTo(x, y));
  graphics.strokePath();
}

function createStormEffects(scene, root, zone) {
  const rain = createRain(scene, root, zone.visual.light);
  const flash = scene.add.graphics();
  flash.fillStyle(zone.visual.light, 1);
  flash.fillRect(0, 0, GAME_SIZE.width, GAME_SIZE.height);
  flash.setAlpha(0);
  root.add(flash);

  const lightning = scene.add.graphics().setAlpha(0);
  root.add(lightning);

  return {
    ...rain,
    flash,
    lightning,
    lightningIndex: 0,
    nextLightning: 2400,
    flashRemaining: 0,
  };
}

function createZoneGroup(scene, zone) {
  const root = scene.add
    .container(0, 0)
    .setDepth(DEPTH.background)
    .setVisible(false)
    .setAlpha(0);
  const sky = scene.add.graphics();
  drawSky(sky, zone);
  root.add(sky);

  const layers = LAYER_KEYS.map((key) => {
    const view = scene.add.graphics();
    drawLayer(view, zone, key);
    root.add(view);

    return {
      key,
      view,
      speedMultiplier: zone.visual.parallax[key],
    };
  });
  const effects =
    zone.id === ZONE_IDS.storm
      ? createStormEffects(scene, root, zone)
      : null;

  return { zone, root, layers, effects };
}

export class WorldZoneSystem {
  constructor(scene, initialZone = WORLD_ZONES[0]) {
    this.scene = scene;
    this.groups = new Map(
      WORLD_ZONES.map((zone) => [
        zone.id,
        createZoneGroup(scene, zone),
      ]),
    );
    this.reset(initialZone);
  }

  resolveZone(zone) {
    return getWorldZoneById(zone?.id ?? zone);
  }

  reset(zone = WORLD_ZONES[0]) {
    const nextZone = this.resolveZone(zone);

    this.transition = null;
    this.worldDistance = 0;
    this.currentZone = nextZone;
    this.groups.forEach((group) => {
      group.root.setVisible(false).setAlpha(0);
      group.layers.forEach((layer) => {
        layer.view.x = 0;
      });
      this.resetEffects(group);
    });

    const currentGroup = this.groups.get(nextZone.id);
    currentGroup?.root.setVisible(true).setAlpha(1);
  }

  resetEffects(group) {
    const effects = group.effects;

    if (!effects) {
      return;
    }

    effects.drops.forEach((drop, index) => {
      drop.x = (index * 79 + 17) % (GAME_SIZE.width + 80) - 40;
      drop.y = (index * 113 + 43) % GAME_SIZE.height;
      drop.view.setPosition(drop.x, drop.y);
    });
    effects.lightningIndex = 0;
    effects.nextLightning = 2400;
    effects.flashRemaining = 0;
    effects.flash.setAlpha(0);
    effects.lightning.setAlpha(0);
  }

  changeZone(zone) {
    const nextZone = this.resolveZone(zone);
    const activeTarget =
      this.transition?.to.zone.id ?? this.currentZone.id;

    if (nextZone.id === activeTarget) {
      return false;
    }

    if (this.transition) {
      const { incoming } = getCrossfadeAlphas(
        this.transition.elapsed,
        this.transition.duration,
      );
      const dominant =
        incoming >= 0.5 ? this.transition.to : this.transition.from;

      this.groups.forEach((group) =>
        group.root.setVisible(false).setAlpha(0),
      );
      dominant.root.setVisible(true).setAlpha(1);
      this.currentZone = dominant.zone;
      this.transition = null;
    }

    const from = this.groups.get(this.currentZone.id);
    const to = this.groups.get(nextZone.id);

    if (!from || !to) {
      return false;
    }

    to.root.setVisible(true).setAlpha(0);
    this.syncParallax(to);
    this.transition = {
      from,
      to,
      elapsed: 0,
      duration: ZONE_TRANSITION_DURATION,
    };
    return true;
  }

  syncParallax(group) {
    group.layers.forEach((layer) => {
      layer.view.x = getParallaxOffset(
        this.worldDistance,
        layer.speedMultiplier,
      );
    });
  }

  updateEffects(group, delta) {
    const effects = group.effects;

    if (!effects || !group.root.visible || group.root.alpha <= 0.02) {
      return;
    }

    const seconds = delta / 1000;

    effects.drops.forEach((drop) => {
      drop.x -= drop.speed * 0.22 * seconds;
      drop.y += drop.speed * seconds;

      if (drop.y > GAME_SIZE.height + 30) {
        drop.y = -30;
        drop.x =
          (drop.x + GAME_SIZE.width + 137) %
            (GAME_SIZE.width + 80) -
          40;
      }

      if (drop.x < -50) {
        drop.x = GAME_SIZE.width + 40;
      }

      drop.view.setPosition(drop.x, drop.y);
    });

    effects.nextLightning -= delta;

    if (
      effects.nextLightning <= 0 &&
      group.root.alpha >= 0.55
    ) {
      drawLightning(
        effects.lightning,
        effects.lightningIndex,
        group.zone.visual.light,
      );
      effects.lightningIndex += 1;
      effects.flashRemaining = 150;
      effects.nextLightning =
        LIGHTNING_DELAYS[
          effects.lightningIndex % LIGHTNING_DELAYS.length
        ];
    }

    if (effects.flashRemaining > 0) {
      effects.flashRemaining = Math.max(
        0,
        effects.flashRemaining - delta,
      );
      const pulse = effects.flashRemaining / 150;
      effects.flash.setAlpha(0.17 * pulse);
      effects.lightning.setAlpha(Math.min(1, pulse * 1.45));
    } else {
      effects.flash.setAlpha(0);
      effects.lightning.setAlpha(0);
    }
  }

  updateTransition(delta) {
    if (!this.transition) {
      return;
    }

    this.transition.elapsed += delta;
    const { outgoing, incoming } = getCrossfadeAlphas(
      this.transition.elapsed,
      this.transition.duration,
    );
    this.transition.from.root.setAlpha(outgoing);
    this.transition.to.root.setAlpha(incoming);

    if (this.transition.elapsed >= this.transition.duration) {
      this.transition.from.root.setVisible(false).setAlpha(0);
      this.transition.to.root.setVisible(true).setAlpha(1);
      this.currentZone = this.transition.to.zone;
      this.transition = null;
    }
  }

  update(
    delta,
    {
      zone = this.currentZone,
      worldSpeed = 0,
      motionEnabled = false,
    } = {},
  ) {
    const safeDelta = Math.min(Math.max(delta, 0), 100);
    const nextZone = this.resolveZone(zone);

    if (
      nextZone.id !==
      (this.transition?.to.zone.id ?? this.currentZone.id)
    ) {
      this.changeZone(nextZone);
    }

    if (motionEnabled) {
      this.worldDistance +=
        Math.max(0, worldSpeed) * (safeDelta / 1000);
    }

    this.groups.forEach((group) => {
      if (group.root.visible) {
        this.syncParallax(group);
        this.updateEffects(group, safeDelta);
      }
    });
    this.updateTransition(safeDelta);
  }

  getActiveZoneId() {
    return this.transition?.to.zone.id ?? this.currentZone.id;
  }

  isTransitioning() {
    return Boolean(this.transition);
  }

  shutdown() {
    this.groups.forEach((group) => group.root.destroy(true));
    this.groups.clear();
    this.transition = null;
    this.scene = null;
  }
}
