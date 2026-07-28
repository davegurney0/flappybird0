export const EVOLUTION_IDS = Object.freeze({
  villager: "villager",
  turbo: "turbo",
  cyber: "cyber",
  crazy: "crazy",
  villageMaster: "village-master",
});

export const EVOLUTION_EFFECTS = Object.freeze({
  flashDuration: 260,
  announcementDuration: 1040,
  ringDuration: 520,
  playerPulseDuration: 180,
  maximumBurstParticles: 28,
  maximumTrailParticles: 18,
});

function createEvolutionStage({
  id,
  level,
  label,
  minScore,
  color,
  soundCue,
  palette,
  wing,
  eye,
  trail,
  particle,
  benefits,
}) {
  return Object.freeze({
    id,
    level,
    label,
    minScore,
    color,
    soundCue,
    palette: Object.freeze(palette),
    wing: Object.freeze(wing),
    eye: Object.freeze(eye),
    trail: Object.freeze(trail),
    particle: Object.freeze(particle),
    benefits: Object.freeze(benefits),
  });
}

export const EVOLUTION_STAGES = Object.freeze([
  createEvolutionStage({
    id: EVOLUTION_IDS.villager,
    level: 1,
    label: "KÖYLÜ KUŞ",
    minScore: 0,
    color: 0xffc247,
    soundCue: "evolution-villager",
    palette: {
      body: 0xffc247,
      bodyDark: 0xd88b22,
      belly: 0xfff0b5,
      outline: 0x6a3e1d,
      wing: 0xff6b57,
      wingAccent: 0xd88b22,
      eye: 0xfff8df,
      pupil: 0x151d31,
      beak: 0xff6b57,
      detail: 0x6de0b6,
      glow: 0xffc247,
    },
    wing: {
      style: "round",
      flapDuration: 130,
    },
    eye: {
      style: "wide",
    },
    trail: {
      enabled: false,
      shape: "dust",
      primary: 0xd88b22,
      secondary: 0xffc247,
      alpha: 0.32,
      spawnInterval: 110,
      lifetime: 360,
      drift: 74,
      size: 3,
    },
    particle: {
      shape: "leaf",
      primary: 0xffc247,
      secondary: 0x6de0b6,
      count: 12,
      speedMin: 70,
      speedMax: 128,
    },
    benefits: {
      flapVelocityMultiplier: 1,
      hitboxRadiusMultiplier: 1,
      coinMagnetDistance: 0,
    },
  }),
  createEvolutionStage({
    id: EVOLUTION_IDS.turbo,
    level: 2,
    label: "TURBO KUŞ",
    minScore: 15,
    color: 0xff7a35,
    soundCue: "evolution-turbo",
    palette: {
      body: 0xff9c34,
      bodyDark: 0xe54b36,
      belly: 0xffe59b,
      outline: 0x6d2430,
      wing: 0xff3f59,
      wingAccent: 0xffd447,
      eye: 0xfff8df,
      pupil: 0x281b2d,
      beak: 0xffd447,
      detail: 0xfff8df,
      glow: 0xff7a35,
    },
    wing: {
      style: "swept",
      flapDuration: 108,
    },
    eye: {
      style: "focused",
    },
    trail: {
      enabled: true,
      shape: "dash",
      primary: 0xffd447,
      secondary: 0xff5b42,
      alpha: 0.56,
      spawnInterval: 76,
      lifetime: 390,
      drift: 116,
      size: 4,
    },
    particle: {
      shape: "dash",
      primary: 0xffd447,
      secondary: 0xff5b42,
      count: 16,
      speedMin: 92,
      speedMax: 158,
    },
    benefits: {
      flapVelocityMultiplier: 1.025,
      hitboxRadiusMultiplier: 1,
      coinMagnetDistance: 0,
    },
  }),
  createEvolutionStage({
    id: EVOLUTION_IDS.cyber,
    level: 3,
    label: "CYBER KUŞ",
    minScore: 35,
    color: 0x53f2ff,
    soundCue: "evolution-cyber",
    palette: {
      body: 0x20cddd,
      bodyDark: 0x174b73,
      belly: 0x9bfbff,
      outline: 0x071827,
      wing: 0x7358ff,
      wingAccent: 0x53f2ff,
      eye: 0x0d1a2b,
      pupil: 0xff4ed7,
      beak: 0x53f2ff,
      detail: 0xff4ed7,
      glow: 0x53f2ff,
    },
    wing: {
      style: "tech",
      flapDuration: 104,
    },
    eye: {
      style: "visor",
    },
    trail: {
      enabled: true,
      shape: "diamond",
      primary: 0x53f2ff,
      secondary: 0x8b5cff,
      alpha: 0.68,
      spawnInterval: 68,
      lifetime: 430,
      drift: 126,
      size: 4,
    },
    particle: {
      shape: "diamond",
      primary: 0x53f2ff,
      secondary: 0xff4ed7,
      count: 20,
      speedMin: 104,
      speedMax: 178,
    },
    benefits: {
      flapVelocityMultiplier: 1.025,
      hitboxRadiusMultiplier: 0.96,
      coinMagnetDistance: 0,
    },
  }),
  createEvolutionStage({
    id: EVOLUTION_IDS.crazy,
    level: 4,
    label: "DELİ KUŞ",
    minScore: 60,
    color: 0xff3f83,
    soundCue: "evolution-crazy",
    palette: {
      body: 0xff3f83,
      bodyDark: 0x7d245e,
      belly: 0xffd84f,
      outline: 0x2b102d,
      wing: 0xffd84f,
      wingAccent: 0x9dff5a,
      eye: 0xfff8df,
      pupil: 0x4225ff,
      beak: 0x9dff5a,
      detail: 0x53f2ff,
      glow: 0xff3f83,
    },
    wing: {
      style: "spiked",
      flapDuration: 98,
    },
    eye: {
      style: "spiral",
    },
    trail: {
      enabled: true,
      shape: "spark",
      primary: 0xff3f83,
      secondary: 0x9dff5a,
      alpha: 0.78,
      spawnInterval: 58,
      lifetime: 480,
      drift: 136,
      size: 5,
    },
    particle: {
      shape: "spark",
      primary: 0xff3f83,
      secondary: 0x9dff5a,
      count: 24,
      speedMin: 118,
      speedMax: 205,
    },
    benefits: {
      flapVelocityMultiplier: 1.028,
      hitboxRadiusMultiplier: 0.96,
      coinMagnetDistance: 56,
    },
  }),
  createEvolutionStage({
    id: EVOLUTION_IDS.villageMaster,
    level: 5,
    label: "KÖYÜN EFENDİSİ",
    minScore: 100,
    color: 0xffe36a,
    soundCue: "evolution-village-master",
    palette: {
      body: 0xffd447,
      bodyDark: 0xa46c15,
      belly: 0xffffff,
      outline: 0x4a2d13,
      wing: 0xfff8df,
      wingAccent: 0xffd447,
      eye: 0xffffff,
      pupil: 0x7a3dff,
      beak: 0xff6b57,
      detail: 0x53f2ff,
      glow: 0xffe36a,
    },
    wing: {
      style: "royal",
      flapDuration: 92,
    },
    eye: {
      style: "star",
    },
    trail: {
      enabled: true,
      shape: "star",
      primary: 0xffe36a,
      secondary: 0x53f2ff,
      alpha: 0.88,
      spawnInterval: 50,
      lifetime: 540,
      drift: 146,
      size: 6,
    },
    particle: {
      shape: "star",
      primary: 0xffe36a,
      secondary: 0xfff8df,
      count: 28,
      speedMin: 126,
      speedMax: 224,
    },
    benefits: {
      flapVelocityMultiplier: 1.03,
      hitboxRadiusMultiplier: 0.94,
      coinMagnetDistance: 72,
    },
  }),
]);

export function getEvolutionStageForScore(score) {
  const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
  let stage = EVOLUTION_STAGES[0];

  for (const candidate of EVOLUTION_STAGES) {
    if (safeScore >= candidate.minScore) {
      stage = candidate;
    }
  }

  return stage;
}

export function getNextEvolutionStage(stage) {
  const currentIndex = EVOLUTION_STAGES.findIndex(
    (candidate) => candidate.id === stage?.id,
  );

  return EVOLUTION_STAGES[currentIndex + 1] ?? null;
}

export function getEvolutionHitboxRadius(baseRadius, stage) {
  const multiplier =
    stage?.benefits?.hitboxRadiusMultiplier ?? 1;

  return Math.max(1, baseRadius * multiplier);
}
