import { getSaveManager } from "./SaveManager.js";

const SETTING_KEYS = Object.freeze({
  music: "music",
  soundEffects: "soundEffects",
  vibration: "vibration",
  reducedMotion: "reducedMotion",
});

export class SettingsManager {
  constructor({
    saveManager = getSaveManager(),
  } = {}) {
    this.saveManager = saveManager;
    this.reload();
  }

  reload() {
    this.settings = {
      ...this.saveManager.getSnapshot().settings,
    };
    return this.getSnapshot();
  }

  get musicEnabled() {
    return this.settings.music;
  }

  get soundEffectsEnabled() {
    return this.settings.soundEffects;
  }

  get soundEnabled() {
    return this.soundEffectsEnabled;
  }

  get vibrationEnabled() {
    return this.settings.vibration;
  }

  get reducedMotion() {
    return this.settings.reducedMotion;
  }

  toggle(settingKey) {
    if (!Object.values(SETTING_KEYS).includes(settingKey)) {
      return false;
    }

    const nextValue = !this.settings[settingKey];
    const result = this.saveManager.update((save) => {
      save.settings[settingKey] = nextValue;
    });

    if (!result.ok) {
      return this.settings[settingKey];
    }

    this.settings[settingKey] = nextValue;
    return nextValue;
  }

  toggleMusic() {
    return this.toggle(SETTING_KEYS.music);
  }

  toggleSoundEffects() {
    return this.toggle(SETTING_KEYS.soundEffects);
  }

  toggleSound() {
    return this.toggleSoundEffects();
  }

  toggleVibration() {
    return this.toggle(SETTING_KEYS.vibration);
  }

  toggleReducedMotion() {
    return this.toggle(SETTING_KEYS.reducedMotion);
  }

  getSnapshot() {
    return Object.freeze({ ...this.settings });
  }
}
