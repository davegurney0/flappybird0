import { getSaveManager } from "./SaveManager.js";

function normalizeCoinAmount(value) {
  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export function readCoinBalance(
  saveManager = getSaveManager(),
) {
  return saveManager.getSnapshot().coins;
}

export class WalletManager {
  constructor({
    saveManager = getSaveManager(),
  } = {}) {
    this.saveManager = saveManager;
    this.balance = readCoinBalance(this.saveManager);
    this.resetRun();
  }

  reload() {
    this.balance = readCoinBalance(this.saveManager);
    return this.getSnapshot();
  }

  resetRun() {
    this.runCoins = 0;
    this.committed = false;
    return this.getSnapshot();
  }

  collect(value) {
    if (this.committed) {
      return this.getSnapshot();
    }

    this.runCoins += normalizeCoinAmount(value);
    return this.getSnapshot();
  }

  spend(value) {
    const cost = normalizeCoinAmount(value);

    if (cost === 0) {
      return Object.freeze({
        ok: true,
        status: "spent",
        spent: 0,
        ...this.getSnapshot(),
      });
    }

    if (this.balance < cost) {
      return Object.freeze({
        ok: false,
        status: "insufficient-funds",
        spent: 0,
        ...this.getSnapshot(),
      });
    }

    const nextBalance = this.balance - cost;
    const result = this.saveManager.update((save) => {
      save.coins = nextBalance;
    });

    if (!result.ok) {
      return Object.freeze({
        ok: false,
        status: "save-failed",
        spent: 0,
        ...this.getSnapshot(),
      });
    }

    this.balance = nextBalance;

    return Object.freeze({
      ok: true,
      status: "spent",
      spent: cost,
      ...this.getSnapshot(),
    });
  }

  credit(value) {
    const amount = normalizeCoinAmount(value);

    if (amount === 0) {
      return Object.freeze({
        ok: true,
        status: "credited",
        credited: 0,
        ...this.getSnapshot(),
      });
    }

    const nextBalance = this.balance + amount;
    const result = this.saveManager.update((save) => {
      save.coins = nextBalance;
    });

    if (!result.ok) {
      return Object.freeze({
        ok: false,
        status: "save-failed",
        credited: 0,
        ...this.getSnapshot(),
      });
    }

    this.balance = nextBalance;

    return Object.freeze({
      ok: true,
      status: "credited",
      credited: amount,
      ...this.getSnapshot(),
    });
  }

  commitRun() {
    if (this.committed) {
      return Object.freeze({
        added: 0,
        status: "already-committed",
        ...this.getSnapshot(),
      });
    }

    const added = this.runCoins;
    const nextBalance = this.balance + added;
    const result = this.saveManager.update((save) => {
      save.coins = nextBalance;
    });

    if (!result.ok) {
      return Object.freeze({
        added: 0,
        status: "save-failed",
        ...this.getSnapshot(),
      });
    }

    this.balance = nextBalance;
    this.committed = true;

    return Object.freeze({
      added,
      status: "committed",
      ...this.getSnapshot(),
    });
  }

  getSnapshot() {
    return Object.freeze({
      runCoins: this.runCoins,
      balance: this.balance,
      committed: this.committed,
    });
  }
}
