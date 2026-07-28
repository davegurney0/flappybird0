function isUiControl(gameObject) {
  let currentObject = gameObject;

  while (currentObject) {
    if (currentObject.isUiControl) {
      return true;
    }

    currentObject = currentObject.parentContainer;
  }

  return false;
}

export class FlapInputSystem {
  constructor(scene, onAction) {
    this.scene = scene;
    this.onAction = onAction;
    this.enabled = true;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handleSpaceDown = this.handleSpaceDown.bind(this);

    scene.input.on("pointerdown", this.handlePointerDown);
    scene.input.keyboard?.on("keydown-SPACE", this.handleSpaceDown);
  }

  handlePointerDown(_pointer, currentlyOver = []) {
    if (
      !this.enabled ||
      currentlyOver.some((gameObject) => isUiControl(gameObject))
    ) {
      return;
    }

    this.onAction?.("pointer");
  }

  handleSpaceDown(event) {
    if (!this.enabled || event.repeat) {
      return;
    }

    event.preventDefault();
    this.onAction?.("keyboard");
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  destroy() {
    this.scene.input.off("pointerdown", this.handlePointerDown);
    this.scene.input.keyboard?.off("keydown-SPACE", this.handleSpaceDown);
    this.onAction = null;
  }
}
