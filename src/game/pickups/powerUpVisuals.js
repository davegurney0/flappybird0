import {
  POWER_UP_TYPES,
  getPowerUpConfig,
} from "../../config/pickupConfig.js";

function drawShield(graphics, color, scale) {
  graphics.fillStyle(color, 0.22);
  graphics.lineStyle(2.5 * scale, color, 0.98);
  graphics.beginPath();
  graphics.moveTo(0, -11 * scale);
  graphics.lineTo(9 * scale, -7 * scale);
  graphics.lineTo(7 * scale, 5 * scale);
  graphics.lineTo(0, 12 * scale);
  graphics.lineTo(-7 * scale, 5 * scale);
  graphics.lineTo(-9 * scale, -7 * scale);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
}

function drawClock(graphics, color, scale) {
  graphics.lineStyle(2.5 * scale, color, 0.98);
  graphics.strokeCircle(0, 0, 10 * scale);
  graphics.lineBetween(0, 0, 0, -6 * scale);
  graphics.lineBetween(0, 0, 5 * scale, 3 * scale);
  graphics.fillStyle(color);
  graphics.fillCircle(0, 0, 2 * scale);
}

function drawMagnet(graphics, color, scale) {
  graphics.lineStyle(5 * scale, color, 0.98);
  graphics.beginPath();
  graphics.arc(
    0,
    -1 * scale,
    8 * scale,
    Math.PI,
    0,
    true,
  );
  graphics.strokePath();
  graphics.lineBetween(-8 * scale, -1 * scale, -8 * scale, 9 * scale);
  graphics.lineBetween(8 * scale, -1 * scale, 8 * scale, 9 * scale);
  graphics.lineStyle(3 * scale, 0xfff8df, 0.9);
  graphics.lineBetween(-8 * scale, 5 * scale, -8 * scale, 10 * scale);
  graphics.lineBetween(8 * scale, 5 * scale, 8 * scale, 10 * scale);
}

function drawDoubleScore(graphics, color, scale) {
  graphics.lineStyle(2.8 * scale, color, 0.98);
  graphics.lineBetween(-10 * scale, -5 * scale, -3 * scale, 5 * scale);
  graphics.lineBetween(-3 * scale, -5 * scale, -10 * scale, 5 * scale);
  graphics.beginPath();
  graphics.moveTo(2 * scale, -7 * scale);
  graphics.lineTo(8 * scale, -7 * scale);
  graphics.lineTo(10 * scale, -3 * scale);
  graphics.lineTo(2 * scale, 7 * scale);
  graphics.lineTo(11 * scale, 7 * scale);
  graphics.strokePath();
}

export function drawPowerUpIcon(
  graphics,
  type,
  scale = 1,
) {
  const color = getPowerUpConfig(type)?.color ?? 0xffffff;

  graphics.clear();

  if (type === POWER_UP_TYPES.shield) {
    drawShield(graphics, color, scale);
    return;
  }

  if (type === POWER_UP_TYPES.slowMotion) {
    drawClock(graphics, color, scale);
    return;
  }

  if (type === POWER_UP_TYPES.coinMagnet) {
    drawMagnet(graphics, color, scale);
    return;
  }

  drawDoubleScore(graphics, color, scale);
}
