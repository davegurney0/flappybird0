import { OBSTACLE_TYPES } from "../../config/difficultyConfig.js";
import { GAME_BALANCE } from "../../config/gameBalance.js";
import { GateObstacle } from "./GateObstacle.js";

export class DoubleGateObstacle {
  constructor(scene, colliderGroup) {
    this.active = false;
    this.scored = false;
    this.firstGate = new GateObstacle(
      scene,
      colliderGroup,
      OBSTACLE_TYPES.normal,
    );
    this.secondGate = new GateObstacle(
      scene,
      colliderGroup,
      OBSTACLE_TYPES.normal,
    );
  }

  activate({
    x,
    gapCenter,
    secondGapCenter,
    gapSize,
    zoneId,
  }) {
    this.active = true;
    this.scored = false;
    this.firstGate.activate({
      x,
      gapCenter,
      gapSize,
      zoneId,
    });
    this.secondGate.activate({
      x: x + GAME_BALANCE.doubleGateSeparation,
      gapCenter: secondGapCenter,
      gapSize,
      zoneId,
    });
  }

  update(context) {
    if (!this.active) {
      return;
    }

    const silentContext = { ...context, onPassed: null };
    this.firstGate.update(silentContext);
    this.secondGate.update(silentContext);

    if (
      !this.scored &&
      this.secondGate.x + GAME_BALANCE.obstacleWidth / 2 <
        context.birdX
    ) {
      this.scored = true;
      context.onPassed?.();
    }

    if (!this.firstGate.active && !this.secondGate.active) {
      this.active = false;
    }
  }

  deactivate() {
    this.active = false;
    this.scored = false;
    this.firstGate.deactivate();
    this.secondGate.deactivate();
  }
}
