import { MOTION } from "../config/constants.js";

export function transitionToScene(scene, targetScene, data = undefined) {
  if (!scene.input.enabled) {
    return;
  }

  scene.input.enabled = false;
  scene.cameras.main.fadeOut(MOTION.sceneFade, 8, 11, 20);

  scene.time.delayedCall(MOTION.sceneFade, () => {
    scene.scene.start(targetScene, data);
  });
}
