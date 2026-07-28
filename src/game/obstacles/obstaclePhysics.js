export function createBoxCollider(scene, colliderGroup) {
  const collider = scene.add
    .zone(-300, -300, 8, 8)
    .setActive(false);

  scene.physics.add.existing(collider);
  collider.body.setAllowGravity(false);
  collider.body.setImmovable(true);
  collider.body.enable = false;
  colliderGroup.add(collider);
  return collider;
}

export function setBoxCollider(
  collider,
  x,
  y,
  width,
  height,
) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);

  collider.setActive(true);
  collider.setSize(safeWidth, safeHeight);
  collider.body.enable = true;
  collider.body.setSize(safeWidth, safeHeight);
  collider.body.reset(x, y);
  collider.body.setAllowGravity(false);
  collider.body.setImmovable(true);
}

export function setCircleCollider(collider, x, y, radius) {
  const diameter = radius * 2;

  collider.setActive(true);
  collider.setSize(diameter, diameter);
  collider.body.enable = true;
  collider.body.setSize(diameter, diameter);
  collider.body.setCircle(radius);
  collider.body.reset(x, y);
  collider.body.setAllowGravity(false);
  collider.body.setImmovable(true);
}

export function disableCollider(collider) {
  if (!collider) {
    return;
  }

  if (collider.body) {
    collider.body.stop?.();
    collider.body.enable = false;
  }

  collider.setActive?.(false);
  collider.setPosition?.(-300, -300);
}
