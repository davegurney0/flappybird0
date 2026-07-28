import {
  EVOLUTION_STAGES,
  getEvolutionStageForScore,
  getNextEvolutionStage,
} from "../config/evolutionConfig.js";

function createSnapshot(stage, changed, previousStage = null) {
  return Object.freeze({
    stage,
    previousStage,
    nextStage: getNextEvolutionStage(stage),
    changed,
    benefits: stage.benefits,
  });
}

export class EvolutionManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = EVOLUTION_STAGES[0];
    this.snapshot = createSnapshot(this.stage, false);
    return this.snapshot;
  }

  update(score) {
    const targetStage = getEvolutionStageForScore(score);

    if (targetStage.level <= this.stage.level) {
      this.snapshot = createSnapshot(this.stage, false);
      return this.snapshot;
    }

    const previousStage = this.stage;
    this.stage = targetStage;
    this.snapshot = createSnapshot(
      this.stage,
      true,
      previousStage,
    );
    return this.snapshot;
  }

  getSnapshot() {
    return this.snapshot;
  }
}
