import {
  createDefaultSave,
  LEGACY_STORAGE_KEYS,
  normalizeSave,
  SAVE_STORAGE_KEY,
} from "../config/saveConfig.js";

function resolveBrowserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function parseJson(rawValue) {
  if (typeof rawValue !== "string" || rawValue.length === 0) {
    return { ok: false, value: null };
  }

  try {
    return { ok: true, value: JSON.parse(rawValue) };
  } catch {
    return { ok: false, value: null };
  }
}

function cloneSave(save) {
  return {
    ...save,
    unlockedSkins: [...save.unlockedSkins],
    achievements: structuredClone(save.achievements),
    missions: {
      ...save.missions,
      assignments: save.missions.assignments.map(
        (assignment) => ({ ...assignment }),
      ),
    },
    settings: { ...save.settings },
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

function deepFreezeSave(save) {
  return deepFreeze(save);
}

export class SaveManager {
  constructor({
    storage = resolveBrowserStorage(),
    storageKey = SAVE_STORAGE_KEY,
  } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.state = createDefaultSave();
    this.loadStatus = "default";
    this.lastPersistSucceeded = false;
    this.load();
  }

  safeGetItem(key) {
    if (!this.storage?.getItem) {
      return null;
    }

    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  safeSetItem(key, value) {
    if (!this.storage?.setItem) {
      return null;
    }

    try {
      this.storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  readLegacySave() {
    const legacy = {};
    let found = false;

    for (const [field, key] of Object.entries(
      LEGACY_STORAGE_KEYS,
    )) {
      const parsed = parseJson(this.safeGetItem(key));

      if (!parsed.ok) {
        continue;
      }

      found = true;
      legacy[field] = parsed.value;
    }

    if (!found) {
      return null;
    }

    return {
      schemaVersion: 0,
      bestScore: legacy.bestScore,
      coins: legacy.coins,
      selectedSkin: legacy.selectedSkin,
      unlockedSkins: legacy.unlockedSkins,
      settings: legacy.settings,
    };
  }

  load() {
    const rawValue = this.safeGetItem(this.storageKey);
    const parsed = parseJson(rawValue);
    let candidate;

    if (parsed.ok) {
      candidate = parsed.value;
      this.loadStatus = "loaded";
    } else if (rawValue !== null) {
      candidate = createDefaultSave();
      this.loadStatus = "recovered-corrupt";
    } else {
      const legacy = this.readLegacySave();
      candidate = legacy ?? createDefaultSave();
      this.loadStatus = legacy
        ? "migrated-legacy"
        : "created-default";
    }

    this.state = normalizeSave(candidate);
    this.lastPersistSucceeded =
      this.safeSetItem(
        this.storageKey,
        JSON.stringify(this.state),
      ) === true;

    return this.getSnapshot();
  }

  getSnapshot() {
    return deepFreezeSave(cloneSave(this.state));
  }

  update(mutator) {
    if (typeof mutator !== "function") {
      return Object.freeze({
        ok: false,
        persisted: false,
        snapshot: this.getSnapshot(),
      });
    }

    const draft = cloneSave(this.state);

    try {
      mutator(draft);
    } catch {
      return Object.freeze({
        ok: false,
        persisted: false,
        snapshot: this.getSnapshot(),
      });
    }

    const nextState = normalizeSave(draft);
    let serialized;

    try {
      serialized = JSON.stringify(nextState);
    } catch {
      return Object.freeze({
        ok: false,
        persisted: false,
        snapshot: this.getSnapshot(),
      });
    }

    const persistResult = this.safeSetItem(
      this.storageKey,
      serialized,
    );

    if (persistResult === false) {
      this.lastPersistSucceeded = false;
      return Object.freeze({
        ok: false,
        persisted: false,
        snapshot: this.getSnapshot(),
      });
    }

    this.state = nextState;
    this.lastPersistSucceeded = persistResult === true;

    return Object.freeze({
      ok: true,
      persisted: persistResult === true,
      snapshot: this.getSnapshot(),
    });
  }

  resetProgress() {
    const settings = { ...this.state.settings };
    const defaults = createDefaultSave();

    return this.update((draft) => {
      Object.assign(draft, defaults, { settings });
    });
  }

  resetEverything() {
    const defaults = createDefaultSave();

    return this.update((draft) => {
      Object.assign(draft, defaults);
    });
  }
}

let defaultSaveManager = null;

export function getSaveManager() {
  if (!defaultSaveManager) {
    defaultSaveManager = new SaveManager();
  }

  return defaultSaveManager;
}
