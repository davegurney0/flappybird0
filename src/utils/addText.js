import { RENDER_SCALE } from "../config/constants.js";

export function addText(scene, x, y, content, style = {}) {
  return scene.add.text(x, y, content, {
    ...style,
    resolution: RENDER_SCALE,
  });
}
