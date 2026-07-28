import Phaser from "phaser";
import {
  RENDER_CAMERA_SCROLL,
  RENDER_SCALE,
} from "../config/constants.js";

export class BaseScene extends Phaser.Scene {
  constructor(key) {
    super(key);
  }

  init() {
    this.cameras.main
      .setZoom(RENDER_SCALE)
      .setScroll(RENDER_CAMERA_SCROLL.x, RENDER_CAMERA_SCROLL.y);
  }
}
