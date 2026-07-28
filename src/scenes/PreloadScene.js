import { SCENES } from "../config/constants.js";
import { createProceduralTextures } from "../game/graphics/createProceduralTextures.js";
import { BaseScene } from "./BaseScene.js";

export class PreloadScene extends BaseScene {
  constructor() {
    super(SCENES.preload);
  }

  create() {
    createProceduralTextures(this);
    this.scene.start(SCENES.menu);
  }
}
