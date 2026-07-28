import { getSaveManager } from "./SaveManager.js";

export function readHighScore(
  saveManager = getSaveManager(),
) {
  return saveManager.getSnapshot().bestScore;
}

export class ScoreManager {
  constructor({
    saveManager = getSaveManager(),
  } = {}) {
    this.saveManager = saveManager;
    this.best = readHighScore(this.saveManager);
    this.current = 0;
  }

  reset() {
    this.current = 0;
    return this.current;
  }

  increment(amount = 1) {
    const safeAmount =
      Number.isFinite(amount) && amount > 0
        ? Math.floor(amount)
        : 1;
    this.current += safeAmount;

    if (this.current > this.best) {
      this.best = this.current;
      this.saveManager.update((save) => {
        save.bestScore = this.best;
      });
    }

    return this.current;
  }
}
