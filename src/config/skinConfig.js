export const SKIN_IDS = Object.freeze({
  villager: "villager",
  mukhtar: "mukhtar",
  almanci: "almanci",
  mafiaPigeon: "mafia-pigeon",
  spaceVillager: "space-villager",
  goldenMukhtar: "golden-mukhtar",
});

export const SKIN_RARITY_IDS = Object.freeze({
  common: "common",
  rare: "rare",
  epic: "epic",
  legendary: "legendary",
});

export const SKIN_RARITIES = Object.freeze({
  [SKIN_RARITY_IDS.common]: Object.freeze({
    id: SKIN_RARITY_IDS.common,
    label: "Common",
    color: 0xaab4cc,
    glowAlpha: 0.12,
  }),
  [SKIN_RARITY_IDS.rare]: Object.freeze({
    id: SKIN_RARITY_IDS.rare,
    label: "Rare",
    color: 0x53c7ff,
    glowAlpha: 0.18,
  }),
  [SKIN_RARITY_IDS.epic]: Object.freeze({
    id: SKIN_RARITY_IDS.epic,
    label: "Epic",
    color: 0xb978ff,
    glowAlpha: 0.24,
  }),
  [SKIN_RARITY_IDS.legendary]: Object.freeze({
    id: SKIN_RARITY_IDS.legendary,
    label: "Legendary",
    color: 0xffd447,
    glowAlpha: 0.34,
  }),
});

function createSkin({
  id,
  name,
  price,
  rarity,
  tagline,
  accessory,
  palette,
}) {
  return Object.freeze({
    id,
    name,
    price,
    rarity: SKIN_RARITIES[rarity],
    tagline,
    accessory,
    palette: Object.freeze(palette),
  });
}

export const BIRD_SKINS = Object.freeze([
  createSkin({
    id: SKIN_IDS.villager,
    name: "Köylü",
    price: 0,
    rarity: SKIN_RARITY_IDS.common,
    tagline: "Hasır şapka, sağlam kanat.",
    accessory: "straw-hat",
    palette: {
      body: 0xffc247,
      bodyDark: 0xd88b22,
      belly: 0xfff0b5,
      outline: 0x6a3e1d,
      wing: 0xff6b57,
      wingAccent: 0xd88b22,
      beak: 0xff6b57,
      accessoryPrimary: 0xe7bd62,
      accessorySecondary: 0xb76d2e,
    },
  }),
  createSkin({
    id: SKIN_IDS.mukhtar,
    name: "Muhtar",
    price: 500,
    rarity: SKIN_RARITY_IDS.rare,
    tagline: "Mühür onda, meydan onda.",
    accessory: "flat-cap",
    palette: {
      body: 0x4d88a8,
      bodyDark: 0x24465f,
      belly: 0xeaf6e8,
      outline: 0x111d2b,
      wing: 0x7eb6c9,
      wingAccent: 0xe44c55,
      beak: 0xf5a34f,
      accessoryPrimary: 0x28394d,
      accessorySecondary: 0xd94a4f,
    },
  }),
  createSkin({
    id: SKIN_IDS.almanci,
    name: "Almancı",
    price: 1000,
    rarity: SKIN_RARITY_IDS.rare,
    tagline: "Bagaj dolu, dönüş kesin değil.",
    accessory: "sunglasses",
    palette: {
      body: 0x37b8a2,
      bodyDark: 0x17645f,
      belly: 0xf0f0e9,
      outline: 0x102d30,
      wing: 0xd94a4f,
      wingAccent: 0xffd447,
      beak: 0xffa348,
      accessoryPrimary: 0x111723,
      accessorySecondary: 0xffd447,
    },
  }),
  createSkin({
    id: SKIN_IDS.mafiaPigeon,
    name: "Mafya Güvercini",
    price: 1750,
    rarity: SKIN_RARITY_IDS.epic,
    tagline: "Bu geçişi görmedin.",
    accessory: "fedora",
    palette: {
      body: 0x6f7080,
      bodyDark: 0x272936,
      belly: 0xe6e3db,
      outline: 0x090b12,
      wing: 0x242631,
      wingAccent: 0x8f263d,
      beak: 0xc98a56,
      accessoryPrimary: 0x171923,
      accessorySecondary: 0xd4a62a,
    },
  }),
  createSkin({
    id: SKIN_IDS.spaceVillager,
    name: "Uzay Köylüsü",
    price: 2500,
    rarity: SKIN_RARITY_IDS.epic,
    tagline: "Mars'ta tarla bakıyor.",
    accessory: "space-helmet",
    palette: {
      body: 0x54d6e8,
      bodyDark: 0x245687,
      belly: 0xd9fbff,
      outline: 0x101a3b,
      wing: 0x7657e8,
      wingAccent: 0xff4ed7,
      beak: 0x8ef6ff,
      accessoryPrimary: 0x93f4ff,
      accessorySecondary: 0xff4ed7,
    },
  }),
  createSkin({
    id: SKIN_IDS.goldenMukhtar,
    name: "Altın Muhtar",
    price: 5000,
    rarity: SKIN_RARITY_IDS.legendary,
    tagline: "Köy bütçesi hakkında soru sorma.",
    accessory: "golden-crown",
    palette: {
      body: 0xffd447,
      bodyDark: 0x9b6514,
      belly: 0xfff8df,
      outline: 0x4a2d13,
      wing: 0xfff0a3,
      wingAccent: 0xff8a34,
      beak: 0xff6b57,
      accessoryPrimary: 0xffe36a,
      accessorySecondary: 0x53f2ff,
    },
  }),
]);

export const DEFAULT_SKIN_ID = SKIN_IDS.villager;

const SKIN_BY_ID = new Map(
  BIRD_SKINS.map((skin) => [skin.id, skin]),
);

export function getBirdSkin(skinId) {
  return SKIN_BY_ID.get(skinId) ?? BIRD_SKINS[0];
}

export function isValidSkinId(skinId) {
  return SKIN_BY_ID.has(skinId);
}

export function normalizeOwnedSkinIds(value) {
  const requestedIds = Array.isArray(value) ? value : [];
  const normalized = new Set([DEFAULT_SKIN_ID]);

  for (const skinId of requestedIds) {
    if (isValidSkinId(skinId)) {
      normalized.add(skinId);
    }
  }

  return BIRD_SKINS
    .map((skin) => skin.id)
    .filter((skinId) => normalized.has(skinId));
}

function blendChannel(first, second, secondWeight) {
  return Math.round(first + (second - first) * secondWeight);
}

function blendColor(first, second, secondWeight) {
  const firstRed = (first >> 16) & 0xff;
  const firstGreen = (first >> 8) & 0xff;
  const firstBlue = first & 0xff;
  const secondRed = (second >> 16) & 0xff;
  const secondGreen = (second >> 8) & 0xff;
  const secondBlue = second & 0xff;

  return (
    (blendChannel(firstRed, secondRed, secondWeight) << 16) |
    (blendChannel(firstGreen, secondGreen, secondWeight) << 8) |
    blendChannel(firstBlue, secondBlue, secondWeight)
  );
}

export function createSkinEvolutionAppearance(stage, skinValue) {
  const skin = getBirdSkin(skinValue?.id ?? skinValue);

  if (skin.id === DEFAULT_SKIN_ID) {
    return stage;
  }

  const palette = skin.palette;

  if (stage.level === 1) {
    return {
      ...stage,
      palette: {
        ...stage.palette,
        body: palette.body,
        bodyDark: palette.bodyDark,
        belly: palette.belly,
        outline: palette.outline,
        wing: palette.wing,
        wingAccent: palette.wingAccent,
        beak: palette.beak,
        glow: skin.rarity.color,
      },
    };
  }

  const skinWeight = 0.58;

  return {
    ...stage,
    palette: {
      ...stage.palette,
      body: blendColor(
        stage.palette.body,
        palette.body,
        skinWeight,
      ),
      bodyDark: blendColor(
        stage.palette.bodyDark,
        palette.bodyDark,
        skinWeight,
      ),
      belly: blendColor(
        stage.palette.belly,
        palette.belly,
        0.42,
      ),
      outline: blendColor(
        stage.palette.outline,
        palette.outline,
        0.5,
      ),
      wing: blendColor(
        stage.palette.wing,
        palette.wing,
        skinWeight,
      ),
      wingAccent: blendColor(
        stage.palette.wingAccent,
        palette.wingAccent,
        0.44,
      ),
      beak: blendColor(
        stage.palette.beak,
        palette.beak,
        0.64,
      ),
    },
  };
}
