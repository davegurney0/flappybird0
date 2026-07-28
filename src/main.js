import Phaser from "phaser";
import "./styles.css";
import { createGameConfig } from "./config/gameConfig.js";
import { getSaveManager } from "./managers/SaveManager.js";
import { SettingsManager } from "./managers/SettingsManager.js";
import { initViewportSystem } from "./systems/ViewportSystem.js";

const saveManager = getSaveManager();
const settingsManager = new SettingsManager({ saveManager });
const disposeViewportSystem = initViewportSystem();
const game = new Phaser.Game(
  createGameConfig(settingsManager, saveManager),
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeViewportSystem();
    game.destroy(true);
  });
}
