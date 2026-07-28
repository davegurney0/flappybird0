export const ZONE_IDS = Object.freeze({
  village: "village",
  evening: "evening",
  nightCity: "night-city",
  storm: "storm",
  space: "space",
});

export const ZONE_TRANSITION_DURATION = 2600;
export const ZONE_ANNOUNCEMENT_DURATION = 1000;
export const PARALLAX_SEGMENT_WIDTH = 648;

function createVisualConfig({
  skyTop,
  skyBottom,
  horizon,
  far,
  mid,
  near,
  ground,
  accent,
  light,
  parallax,
}) {
  return Object.freeze({
    skyTop,
    skyBottom,
    horizon,
    far,
    mid,
    near,
    ground,
    accent,
    light,
    parallax: Object.freeze(parallax),
  });
}

function createZone({
  id,
  label,
  minScore,
  difficulty,
  color,
  visual,
}) {
  return Object.freeze({
    id,
    label,
    minScore,
    difficulty,
    color,
    visual: createVisualConfig(visual),
  });
}

export const WORLD_ZONES = Object.freeze([
  createZone({
    id: ZONE_IDS.village,
    label: "KÖY",
    minScore: 0,
    difficulty: 0,
    color: 0xffc247,
    visual: {
      skyTop: 0x62b7e8,
      skyBottom: 0xc8e7d0,
      horizon: 0x86b786,
      far: 0x688aa0,
      mid: 0x446b58,
      near: 0x243f31,
      ground: 0x14291f,
      accent: 0xffc247,
      light: 0xfff3bd,
      parallax: { far: 0.075, mid: 0.17, near: 0.32 },
    },
  }),
  createZone({
    id: ZONE_IDS.evening,
    label: "AKŞAM",
    minScore: 15,
    difficulty: 0.2,
    color: 0xff8a4c,
    visual: {
      skyTop: 0x36294e,
      skyBottom: 0xf17b4d,
      horizon: 0xd65c45,
      far: 0x5f4561,
      mid: 0x3d3447,
      near: 0x232533,
      ground: 0x171b24,
      accent: 0xffa44d,
      light: 0xffe5a1,
      parallax: { far: 0.09, mid: 0.2, near: 0.36 },
    },
  }),
  createZone({
    id: ZONE_IDS.nightCity,
    label: "GECE ŞEHRİ",
    minScore: 30,
    difficulty: 0.43,
    color: 0x5de6ff,
    visual: {
      skyTop: 0x070b19,
      skyBottom: 0x202451,
      horizon: 0x33335f,
      far: 0x171b35,
      mid: 0x0e1329,
      near: 0x080c18,
      ground: 0x080b14,
      accent: 0x5de6ff,
      light: 0xffd767,
      parallax: { far: 0.1, mid: 0.23, near: 0.4 },
    },
  }),
  createZone({
    id: ZONE_IDS.storm,
    label: "FIRTINA",
    minScore: 50,
    difficulty: 0.7,
    color: 0x8aa7c4,
    visual: {
      skyTop: 0x111725,
      skyBottom: 0x3a4b5d,
      horizon: 0x4f6571,
      far: 0x283743,
      mid: 0x1a2831,
      near: 0x101b22,
      ground: 0x0a1218,
      accent: 0xa6d9ff,
      light: 0xe5f6ff,
      parallax: { far: 0.11, mid: 0.25, near: 0.42 },
    },
  }),
  createZone({
    id: ZONE_IDS.space,
    label: "UZAY / DELİLİK",
    minScore: 75,
    difficulty: 0.98,
    color: 0xff56d7,
    visual: {
      skyTop: 0x03020b,
      skyBottom: 0x160c32,
      horizon: 0x30114c,
      far: 0x17102f,
      mid: 0x100a24,
      near: 0x070511,
      ground: 0x07040e,
      accent: 0xff56d7,
      light: 0x62f4ff,
      parallax: { far: 0.12, mid: 0.27, near: 0.44 },
    },
  }),
]);

export const ZONE_RANK = Object.freeze(
  Object.fromEntries(
    WORLD_ZONES.map((zone, index) => [zone.id, index]),
  ),
);

export function getZoneRank(zoneId) {
  return ZONE_RANK[zoneId] ?? 0;
}

export function getWorldZoneById(zoneId) {
  return (
    WORLD_ZONES.find((zone) => zone.id === zoneId) ??
    WORLD_ZONES[0]
  );
}
