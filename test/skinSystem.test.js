import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultSave,
  SAVE_STORAGE_KEY,
} from "../src/config/saveConfig.js";
import {
  BIRD_SKINS,
  DEFAULT_SKIN_ID,
  normalizeOwnedSkinIds,
  SKIN_IDS,
} from "../src/config/skinConfig.js";
import { SaveManager } from "../src/managers/SaveManager.js";
import { SkinManager } from "../src/managers/SkinManager.js";
import { WalletManager } from "../src/managers/WalletManager.js";

function createMemoryStorage(initialSave = createDefaultSave()) {
  const store = new Map([
    [SAVE_STORAGE_KEY, JSON.stringify(initialSave)],
  ]);
  const storage = {
    store,
    failWrites: false,
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      if (this.failWrites) {
        throw new Error("quota exceeded");
      }

      store.set(key, value);
    },
  };

  return storage;
}

function createManagers(initial = {}) {
  const storage = createMemoryStorage({
    ...createDefaultSave(),
    ...initial,
  });
  const saveManager = new SaveManager({ storage });

  return {
    storage,
    saveManager,
    wallet: new WalletManager({ saveManager }),
    skins: new SkinManager({ saveManager }),
  };
}

test("skin catalog exposes the requested names and exact prices", () => {
  assert.deepEqual(
    BIRD_SKINS.map(({ name, price }) => [name, price]),
    [
      ["Köylü", 0],
      ["Muhtar", 500],
      ["Almancı", 1000],
      ["Mafya Güvercini", 1750],
      ["Uzay Köylüsü", 2500],
      ["Altın Muhtar", 5000],
    ],
  );
  assert.deepEqual(
    new Set(BIRD_SKINS.map((skin) => skin.rarity.label)),
    new Set(["Common", "Rare", "Epic", "Legendary"]),
  );
});

test("rarity and skins contain no gameplay advantage fields", () => {
  for (const skin of BIRD_SKINS) {
    assert.equal("benefits" in skin, false);
    assert.equal("hitbox" in skin, false);
    assert.equal("speed" in skin, false);
    assert.equal("scoreMultiplier" in skin, false);
    assert.deepEqual(
      Object.keys(skin.rarity).sort(),
      ["color", "glowAlpha", "id", "label"],
    );
  }
});

test("owned skin data always includes the default and drops invalid ids", () => {
  assert.deepEqual(
    normalizeOwnedSkinIds([
      "fake-skin",
      SKIN_IDS.mukhtar,
      SKIN_IDS.mukhtar,
    ]),
    [DEFAULT_SKIN_ID, SKIN_IDS.mukhtar],
  );
});

test("purchase requires an explicit confirmation before spending", () => {
  const { saveManager, wallet, skins } = createManagers({
    coins: 800,
  });

  const intent = skins.purchase(SKIN_IDS.mukhtar, wallet);

  assert.equal(intent.status, "confirmation-required");
  assert.equal(wallet.balance, 800);
  assert.equal(skins.owns(SKIN_IDS.mukhtar), false);
  assert.deepEqual(
    saveManager.getSnapshot().unlockedSkins,
    [DEFAULT_SKIN_ID],
  );
});

test("confirmed purchase deducts coins, persists ownership and selects the skin", () => {
  const { saveManager, wallet, skins } = createManagers({
    coins: 2000,
  });

  const purchase = skins.purchase(
    SKIN_IDS.mafiaPigeon,
    wallet,
    { confirmed: true },
  );
  const saved = saveManager.getSnapshot();

  assert.equal(purchase.status, "purchased");
  assert.equal(wallet.balance, 250);
  assert.equal(skins.owns(SKIN_IDS.mafiaPigeon), true);
  assert.equal(
    skins.getSnapshot().selectedSkinId,
    SKIN_IDS.mafiaPigeon,
  );
  assert.deepEqual(saved.unlockedSkins, [
    DEFAULT_SKIN_ID,
    SKIN_IDS.mafiaPigeon,
  ]);
  assert.equal(saved.selectedSkin, SKIN_IDS.mafiaPigeon);

  const reloaded = new SkinManager({ saveManager });
  assert.equal(reloaded.owns(SKIN_IDS.mafiaPigeon), true);
  assert.equal(
    reloaded.getSelectedSkin().id,
    SKIN_IDS.mafiaPigeon,
  );
});

test("insufficient balance leaves ownership and wallet untouched", () => {
  const { wallet, skins } = createManagers({ coins: 499 });

  const result = skins.purchase(
    SKIN_IDS.mukhtar,
    wallet,
    { confirmed: true },
  );

  assert.equal(result.status, "insufficient-funds");
  assert.equal(result.shortfall, 1);
  assert.equal(wallet.balance, 499);
  assert.equal(skins.owns(SKIN_IDS.mukhtar), false);
});

test("failed atomic save leaves wallet and ownership untouched", () => {
  const {
    storage,
    saveManager,
    wallet,
    skins,
  } = createManagers({ coins: 1000 });
  storage.failWrites = true;

  const result = skins.purchase(
    SKIN_IDS.mukhtar,
    wallet,
    { confirmed: true },
  );

  assert.equal(result.status, "save-failed");
  assert.equal(wallet.balance, 1000);
  assert.equal(saveManager.getSnapshot().coins, 1000);
  assert.equal(skins.owns(SKIN_IDS.mukhtar), false);
});

test("an unowned or invalid saved selection falls back to Köylü", () => {
  const { skins } = createManagers({
    unlockedSkins: [DEFAULT_SKIN_ID],
    selectedSkin: SKIN_IDS.goldenMukhtar,
  });

  assert.equal(skins.getSelectedSkin().id, DEFAULT_SKIN_ID);
  assert.equal(
    skins.select(SKIN_IDS.goldenMukhtar).status,
    "not-owned",
  );
});
