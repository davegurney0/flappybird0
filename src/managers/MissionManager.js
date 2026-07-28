import {
  MISSION_EVENT_TYPES,
  MISSION_PROGRESS_KINDS,
} from "../config/missionConfig.js";
import { getSaveManager } from "./SaveManager.js";
import { LocalDailyMissionProvider } from "../services/missions/LocalDailyMissionProvider.js";

function toSafeInteger(value) {
  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function createAssignment(definition, previous = {}) {
  const progress = Math.min(
    definition.target,
    toSafeInteger(previous.progress),
  );
  const completed = progress >= definition.target;

  return {
    id: definition.id,
    progress,
    target: definition.target,
    reward: definition.reward,
    completed,
    claimed: completed && Boolean(previous.claimed),
    ...(completed && previous.completedAt
      ? { completedAt: previous.completedAt }
      : {}),
  };
}

function assignmentsMatchCurrentSet(savedMissions, missionSet) {
  if (
    savedMissions?.cycleId !== missionSet.cycleId ||
    savedMissions?.dateKey !== missionSet.dateKey ||
    savedMissions?.source !== missionSet.source ||
    savedMissions?.assignments?.length !==
      missionSet.missions.length
  ) {
    return false;
  }

  return missionSet.missions.every((definition, index) => {
    const assignment = savedMissions.assignments[index];

    return (
      assignment?.id === definition.id &&
      assignment.target === definition.target &&
      assignment.reward === definition.reward
    );
  });
}

function getProgressForEvent(
  definition,
  currentProgress,
  eventType,
  payload,
) {
  switch (definition.kind) {
    case MISSION_PROGRESS_KINDS.bestRunScore:
      return eventType === MISSION_EVENT_TYPES.obstaclePassed
        ? Math.max(currentProgress, toSafeInteger(payload.score))
        : currentProgress;
    case MISSION_PROGRESS_KINDS.dailyCoins:
      return eventType === MISSION_EVENT_TYPES.coinCollected
        ? currentProgress + toSafeInteger(payload.value)
        : currentProgress;
    case MISSION_PROGRESS_KINDS.gamesPlayed:
      return eventType === MISSION_EVENT_TYPES.runStarted
        ? currentProgress + 1
        : currentProgress;
    case MISSION_PROGRESS_KINDS.evolutionReached:
      return eventType === MISSION_EVENT_TYPES.obstaclePassed &&
        toSafeInteger(payload.evolutionLevel) >=
          definition.evolutionLevel
        ? definition.target
        : currentProgress;
    case MISSION_PROGRESS_KINDS.powerUpUsed:
      return eventType === MISSION_EVENT_TYPES.powerUpUsed &&
        payload.type === definition.powerUpType
        ? definition.target
        : currentProgress;
    case MISSION_PROGRESS_KINDS.obstaclesPassed:
      return eventType === MISSION_EVENT_TYPES.obstaclePassed
        ? currentProgress + 1
        : currentProgress;
    case MISSION_PROGRESS_KINDS.bestRunCoins:
      return eventType === MISSION_EVENT_TYPES.coinCollected
        ? Math.max(
            currentProgress,
            toSafeInteger(payload.runCoins),
          )
        : currentProgress;
    default:
      return currentProgress;
  }
}

function createMissionSnapshot(missionSet, savedMissions, coins) {
  const savedById = new Map(
    (savedMissions?.assignments ?? []).map((assignment) => [
      assignment.id,
      assignment,
    ]),
  );
  const missions = missionSet.missions.map((definition) => {
    const assignment = createAssignment(
      definition,
      savedById.get(definition.id),
    );

    return Object.freeze({
      ...definition,
      ...assignment,
      claimable: assignment.completed && !assignment.claimed,
    });
  });

  return Object.freeze({
    cycleId: missionSet.cycleId,
    dateKey: missionSet.dateKey,
    source: missionSet.source,
    resetsAt: missionSet.resetsAt,
    coinBalance: coins,
    completedCount: missions.filter(
      (mission) => mission.completed,
    ).length,
    claimedCount: missions.filter(
      (mission) => mission.claimed,
    ).length,
    missions: Object.freeze(missions),
  });
}

export class MissionManager {
  constructor({
    saveManager = getSaveManager(),
    provider = new LocalDailyMissionProvider(),
  } = {}) {
    this.saveManager = saveManager;
    this.provider = provider;
    this.currentRun = this.createRunState();
    this.ensureCurrentMissionSet();
  }

  createRunState() {
    return {
      score: 0,
      coins: 0,
    };
  }

  ensureCurrentMissionSet() {
    const missionSet = this.provider.getCurrentMissionSet();
    const snapshot = this.saveManager.getSnapshot();

    if (assignmentsMatchCurrentSet(snapshot.missions, missionSet)) {
      return {
        missionSet,
        save: snapshot,
      };
    }

    const preserveProgress =
      snapshot.missions?.cycleId === missionSet.cycleId;
    const previousById = new Map(
      (preserveProgress
        ? snapshot.missions.assignments
        : []
      ).map((assignment) => [assignment.id, assignment]),
    );
    const result = this.saveManager.update((save) => {
      save.missions = {
        cycleId: missionSet.cycleId,
        dateKey: missionSet.dateKey,
        source: missionSet.source,
        assignments: missionSet.missions.map((definition) =>
          createAssignment(
            definition,
            previousById.get(definition.id),
          ),
        ),
      };
    });

    return {
      missionSet,
      save: result.snapshot,
    };
  }

  getSnapshot() {
    const { missionSet, save } =
      this.ensureCurrentMissionSet();

    return createMissionSnapshot(
      missionSet,
      save.missions,
      save.coins,
    );
  }

  record(eventType, payload = {}) {
    const { missionSet, save } =
      this.ensureCurrentMissionSet();
    const definitions = new Map(
      missionSet.missions.map((mission) => [
        mission.id,
        mission,
      ]),
    );
    let changed = false;
    const nextAssignments = save.missions.assignments.map(
      (assignment) => {
        const definition = definitions.get(assignment.id);

        if (!definition || assignment.completed) {
          return assignment;
        }

        const progress = Math.min(
          definition.target,
          getProgressForEvent(
            definition,
            assignment.progress,
            eventType,
            payload,
          ),
        );

        if (progress === assignment.progress) {
          return assignment;
        }

        changed = true;
        const completed = progress >= definition.target;

        return {
          ...assignment,
          progress,
          completed,
          ...(completed ? { completedAt: Date.now() } : {}),
        };
      },
    );

    if (!changed) {
      return createMissionSnapshot(
        missionSet,
        save.missions,
        save.coins,
      );
    }

    const result = this.saveManager.update((draft) => {
      if (draft.missions.cycleId !== missionSet.cycleId) {
        return;
      }

      draft.missions.assignments = nextAssignments;
    });

    return createMissionSnapshot(
      missionSet,
      result.snapshot.missions,
      result.snapshot.coins,
    );
  }

  beginRun() {
    this.currentRun = this.createRunState();
    return this.record(MISSION_EVENT_TYPES.runStarted);
  }

  recordObstaclePassed({ score, evolutionLevel } = {}) {
    this.currentRun.score = Math.max(
      this.currentRun.score,
      toSafeInteger(score),
    );

    return this.record(MISSION_EVENT_TYPES.obstaclePassed, {
      score: this.currentRun.score,
      evolutionLevel,
    });
  }

  recordCoinCollected({ value, runCoins } = {}) {
    this.currentRun.coins = Math.max(
      this.currentRun.coins,
      toSafeInteger(runCoins),
    );

    return this.record(MISSION_EVENT_TYPES.coinCollected, {
      value,
      runCoins: this.currentRun.coins,
    });
  }

  recordPowerUpUsed(type) {
    return this.record(MISSION_EVENT_TYPES.powerUpUsed, {
      type,
    });
  }

  claimReward(missionId) {
    const current = this.getSnapshot();
    const mission = current.missions.find(
      (candidate) => candidate.id === missionId,
    );

    if (!mission) {
      return Object.freeze({
        ok: false,
        status: "not-found",
        reward: 0,
        snapshot: current,
      });
    }

    if (!mission.completed) {
      return Object.freeze({
        ok: false,
        status: "incomplete",
        reward: 0,
        snapshot: current,
      });
    }

    if (mission.claimed) {
      return Object.freeze({
        ok: false,
        status: "already-claimed",
        reward: 0,
        snapshot: current,
      });
    }

    let claimApplied = false;
    const result = this.saveManager.update((save) => {
      if (save.missions.cycleId !== current.cycleId) {
        return;
      }

      const assignment = save.missions.assignments.find(
        (candidate) => candidate.id === mission.id,
      );

      if (
        !assignment ||
        !assignment.completed ||
        assignment.claimed
      ) {
        return;
      }

      assignment.claimed = true;
      save.coins += mission.reward;
      claimApplied = true;
    });
    const snapshot = this.getSnapshot();

    if (!result.ok || !claimApplied) {
      return Object.freeze({
        ok: false,
        status: "save-failed",
        reward: 0,
        snapshot,
      });
    }

    return Object.freeze({
      ok: true,
      status: "claimed",
      reward: mission.reward,
      coinBalance: result.snapshot.coins,
      snapshot,
    });
  }
}
