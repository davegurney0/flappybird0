import {
  BIRD_SKINS,
  DEFAULT_SKIN_ID,
  getBirdSkin,
  isValidSkinId,
  normalizeOwnedSkinIds,
} from "../config/skinConfig.js";
import { getSaveManager } from "./SaveManager.js";

function createResult(status, manager, extra = {}) {
  return Object.freeze({
    status,
    ...extra,
    snapshot: manager.getSnapshot(),
  });
}

export function readOwnedSkinIds(
  saveManager = getSaveManager(),
) {
  return normalizeOwnedSkinIds(
    saveManager.getSnapshot().unlockedSkins,
  );
}

export function readSelectedSkinId(
  ownedSkinIds,
  saveManager = getSaveManager(),
) {
  const requestedId =
    saveManager.getSnapshot().selectedSkin;

  return isValidSkinId(requestedId) &&
    ownedSkinIds.includes(requestedId)
    ? requestedId
    : DEFAULT_SKIN_ID;
}

export class SkinManager {
  constructor({
    saveManager = getSaveManager(),
  } = {}) {
    this.saveManager = saveManager;
    this.reload();
  }

  reload() {
    this.ownedSkinIds = readOwnedSkinIds(this.saveManager);
    this.selectedSkinId = readSelectedSkinId(
      this.ownedSkinIds,
      this.saveManager,
    );
    return this.getSnapshot();
  }

  owns(skinId) {
    return this.ownedSkinIds.includes(skinId);
  }

  select(skinId) {
    if (!isValidSkinId(skinId) || !this.owns(skinId)) {
      return createResult("not-owned", this);
    }

    if (skinId === this.selectedSkinId) {
      return createResult("already-selected", this);
    }

    const result = this.saveManager.update((save) => {
      save.selectedSkin = skinId;
    });

    if (!result.ok) {
      return createResult("save-failed", this);
    }

    this.selectedSkinId = skinId;
    return createResult("selected", this, {
      skin: getBirdSkin(skinId),
    });
  }

  purchase(
    skinId,
    wallet,
    {
      confirmed = false,
      selectAfterPurchase = true,
    } = {},
  ) {
    if (!isValidSkinId(skinId)) {
      return createResult("invalid-skin", this);
    }

    const skin = getBirdSkin(skinId);

    if (this.owns(skinId)) {
      const selection = selectAfterPurchase
        ? this.select(skinId)
        : createResult("already-owned", this);
      return createResult("already-owned", this, {
        skin,
        selectionStatus: selection.status,
      });
    }

    wallet?.reload();

    if (!wallet || wallet.balance < skin.price) {
      return createResult("insufficient-funds", this, {
        skin,
        shortfall: Math.max(
          0,
          skin.price - (wallet?.balance ?? 0),
        ),
      });
    }

    if (!confirmed) {
      return createResult("confirmation-required", this, {
        skin,
      });
    }

    if (wallet.saveManager !== this.saveManager) {
      return createResult("save-failed", this, { skin });
    }

    const result = this.saveManager.update((save) => {
      if (save.coins < skin.price) {
        throw new Error("insufficient-funds");
      }

      save.coins -= skin.price;
      save.unlockedSkins = normalizeOwnedSkinIds([
        ...save.unlockedSkins,
        skinId,
      ]);

      if (selectAfterPurchase) {
        save.selectedSkin = skinId;
      }
    });

    if (!result.ok) {
      return createResult("save-failed", this, { skin });
    }

    this.reload();
    wallet.reload();

    return createResult("purchased", this, {
      skin,
      selectionStatus: selectAfterPurchase
        ? "selected"
        : "not-requested",
      wallet: wallet.getSnapshot(),
    });
  }

  getSelectedSkin() {
    return getBirdSkin(this.selectedSkinId);
  }

  getSnapshot() {
    const ownedSkinIds = [...this.ownedSkinIds];

    return Object.freeze({
      ownedSkinIds: Object.freeze(ownedSkinIds),
      ownedSkins: Object.freeze(
        BIRD_SKINS.filter((skin) =>
          ownedSkinIds.includes(skin.id),
        ),
      ),
      ownedCount: ownedSkinIds.length,
      selectedSkinId: this.selectedSkinId,
      selectedSkin: this.getSelectedSkin(),
    });
  }
}
