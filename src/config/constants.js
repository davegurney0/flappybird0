export const GAME_SIZE = Object.freeze({
  width: 432,
  height: 768,
});

export const RENDER_SCALE = 2;

export const RENDER_SIZE = Object.freeze({
  width: GAME_SIZE.width * RENDER_SCALE,
  height: GAME_SIZE.height * RENDER_SCALE,
});

export const RENDER_CAMERA_SCROLL = Object.freeze({
  x: (GAME_SIZE.width - RENDER_SIZE.width) / 2,
  y: (GAME_SIZE.height - RENDER_SIZE.height) / 2,
});

export const SCENES = Object.freeze({
  boot: "BootScene",
  preload: "PreloadScene",
  menu: "MenuScene",
  game: "GameScene",
});

export const COLORS = Object.freeze({
  ink: 0x080b14,
  night: 0x0b1020,
  navy: 0x151d31,
  slate: 0x25304d,
  mist: 0xaab4cc,
  cream: 0xfff8df,
  amber: 0xffc247,
  amberDark: 0xd88b22,
  coral: 0xff6b57,
  mint: 0x6de0b6,
  sky: 0x4776a8,
  hillFar: 0x253b52,
  hillNear: 0x172b37,
  ground: 0x101d24,
  white: 0xffffff,
  black: 0x000000,
});

export const TEXT_COLORS = Object.freeze({
  cream: "#fff8df",
  amber: "#ffc247",
  coral: "#ff6b57",
  mint: "#6de0b6",
  mist: "#aab4cc",
  navy: "#151d31",
  ink: "#080b14",
  white: "#ffffff",
});

export const TYPOGRAPHY = Object.freeze({
  display: '"Arial Black", "Trebuchet MS", sans-serif',
  body: '"Trebuchet MS", Arial, sans-serif',
});

export const MOTION = Object.freeze({
  sceneFade: 260,
  splashHold: 1350,
  menuEnter: 420,
});

export const DEPTH = Object.freeze({
  background: 0,
  scenery: 10,
  particles: 20,
  obstacles: 25,
  content: 30,
  hud: 40,
  overlay: 100,
});

export const GAME_EVENTS = Object.freeze({
  playerDeath: "sgk:player-death",
  playerEvolution: "sgk:player-evolution",
  evolutionSound: "sgk:sound:evolution",
  coinCollected: "sgk:coin-collected",
  powerUpCollected: "sgk:power-up-collected",
  powerUpSound: "sgk:sound:power-up",
  shieldBlocked: "sgk:shield-blocked",
});
