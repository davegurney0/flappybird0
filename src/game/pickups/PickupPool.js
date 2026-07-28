export class PickupPool {
  constructor(size, factory) {
    this.items = Array.from({ length: size }, (_, index) =>
      factory(index),
    );
  }

  acquire() {
    return this.items.find((item) => !item.active) ?? null;
  }

  hasAvailable() {
    return this.items.some((item) => !item.active);
  }

  update(context) {
    this.items.forEach((item) => item.update(context));
  }

  reset() {
    this.items.forEach((item) => item.deactivate());
  }

  shutdown() {
    this.items.forEach((item) => item.destroy());
    this.items.length = 0;
  }
}
