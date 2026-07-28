function normalizeSeed(seed) {
  const numericSeed = Number.isFinite(seed) ? Math.floor(seed) : 1;
  return (numericSeed >>> 0) || 1;
}

export class SeededRandom {
  constructor(seed = Date.now()) {
    this.state = normalizeSeed(seed);
  }

  reseed(seed) {
    this.state = normalizeSeed(seed);
  }

  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  between(min, max) {
    return min + (max - min) * this.next();
  }

  integerBetween(min, max) {
    return Math.floor(this.between(min, max + 1));
  }

  weightedPick(entries) {
    const usableEntries = entries.filter(
      (entry) => Number.isFinite(entry.weight) && entry.weight > 0,
    );
    const totalWeight = usableEntries.reduce(
      (total, entry) => total + entry.weight,
      0,
    );

    if (totalWeight <= 0) {
      return null;
    }

    let cursor = this.next() * totalWeight;

    for (const entry of usableEntries) {
      cursor -= entry.weight;
      if (cursor <= 0) {
        return entry.value;
      }
    }

    return usableEntries.at(-1)?.value ?? null;
  }
}
