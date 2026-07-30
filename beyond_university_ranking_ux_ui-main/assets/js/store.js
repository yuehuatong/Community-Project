const listeners = new Set();

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Device storage is a convenience only; the interface remains functional.
  }
}

export const store = {
  programmeIds: new Set(),
  compare: [],
  view: readJson("bur-view", "cards"),
  initialize(programmes) {
    this.programmeIds = new Set(programmes.map((programme) => programme.id));
    this.compare = readJson("bur-compare", [])
      .filter((id) => this.programmeIds.has(id))
      .slice(0, 3);
    if (!["cards", "table"].includes(this.view)) this.view = "cards";
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit() {
    listeners.forEach((listener) => listener(this));
  },
  setView(view) {
    if (!["cards", "table"].includes(view)) return;
    this.view = view;
    writeJson("bur-view", view);
    this.emit();
  },
  toggleCompare(id) {
    if (!this.programmeIds.has(id)) return { changed: false, message: "Programme not found." };
    if (this.compare.includes(id)) {
      this.compare = this.compare.filter((item) => item !== id);
      writeJson("bur-compare", this.compare);
      this.emit();
      return { changed: true, message: "Removed from comparison." };
    }
    if (this.compare.length >= 3) {
      return { changed: false, message: "You can compare up to three programmes." };
    }
    this.compare.push(id);
    writeJson("bur-compare", this.compare);
    this.emit();
    return { changed: true, message: "Added to comparison." };
  },
  removeCompare(id) {
    if (!this.compare.includes(id)) return;
    this.compare = this.compare.filter((item) => item !== id);
    writeJson("bur-compare", this.compare);
    this.emit();
  },
  replaceCompare(ids) {
    const next = [...new Set(ids)]
      .filter((id) => this.programmeIds.has(id))
      .slice(0, 3);
    if (next.length === this.compare.length && next.every((id, index) => id === this.compare[index])) {
      return;
    }
    this.compare = next;
    writeJson("bur-compare", this.compare);
    this.emit();
  },
};
