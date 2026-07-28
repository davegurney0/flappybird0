import Phaser from "phaser";
import {
  RENDER_SCALE,
  RENDER_SIZE,
  TEXT_COLORS,
} from "./constants.js";
import { BootScene } from "../scenes/BootScene.js";
import { GameScene } from "../scenes/GameScene.js";
import { MenuScene } from "../scenes/MenuScene.js";
import { PreloadScene } from "../scenes/PreloadScene.js";

export function createGameConfig(settingsManager, saveManager) {
  return {
    type: Phaser.AUTO,
    parent: "game-root",
    width: RENDER_SIZE.width,
    height: RENDER_SIZE.height,
    backgroundColor: TEXT_COLORS.ink,
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: RENDER_SIZE.width,
      height: RENDER_SIZE.height,
      fullscreenTarget: "game-shell",
    },
    input: {
      activePointers: 2,
      touch: {
        capture: true,
      },
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    callbacks: {
      preBoot(game) {
        game.registry.set("settings", settingsManager);
        game.registry.set("saveManager", saveManager);
        game.registry.set("renderScale", RENDER_SCALE);
      },
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene],
  };
}
