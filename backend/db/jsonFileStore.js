// ─────────────────────────────────────────────────────────────────────────
// JSON File Store (Priority 5.2)
//
// A tiny, dependency-free persistence primitive: one JSON array per
// "collection" (users.json, reports.json, ...), read into memory once and
// kept in sync on every write. It exists so the repository layer
// (backend/repositories/*) has a real, working persistence mechanism
// without requiring an external database service to be provisioned just
// to run this project locally or in a small deployment.
//
// This is deliberately isolated behind a small, generic API (all/insert/
// update/remove/findById/findOne/filter) so it can be swapped for a real
// database (Postgres, MongoDB, etc.) later by rewriting only the
// repository layer — no controller or service code depends on this file
// directly.
//
// Concurrency note: writes are serialized per-store instance via an
// internal promise chain, and persisted with a write-to-temp-file +
// rename so a crash mid-write can never corrupt the JSON file (the
// rename is atomic on POSIX filesystems). This is sufficient for a
// single-process deployment; a multi-instance deployment should replace
// this with a real database (see DEPLOYMENT.md).
// ─────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export class JsonFileStore {
  constructor(filePath) {
    this.filePath = filePath;
    this._records = null; // lazily loaded
    this._writeChain = Promise.resolve(); // serializes persist() calls
  }

  _ensureLoaded() {
    if (this._records !== null) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this._records = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      if (err.code === "ENOENT") {
        this._records = [];
      } else {
        // Corrupted file — don't silently wipe user data; surface the
        // error so it's fixed rather than masked.
        throw new Error(`Failed to read data store at ${this.filePath}: ${err.message}`);
      }
    }
  }

  _persist() {
    const snapshot = JSON.stringify(this._records, null, 2);
    this._writeChain = this._writeChain.then(
      () =>
        new Promise((resolve, reject) => {
          const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
          fs.writeFile(tmpPath, snapshot, "utf8", (writeErr) => {
            if (writeErr) return reject(writeErr);
            fs.rename(tmpPath, this.filePath, (renameErr) => {
              if (renameErr) return reject(renameErr);
              resolve();
            });
          });
        })
    );
    return this._writeChain;
  }

  all() {
    this._ensureLoaded();
    return [...this._records];
  }

  findById(id) {
    this._ensureLoaded();
    return this._records.find((r) => r.id === id) || null;
  }

  findOne(predicate) {
    this._ensureLoaded();
    return this._records.find(predicate) || null;
  }

  filter(predicate) {
    this._ensureLoaded();
    return this._records.filter(predicate);
  }

  async insert(record) {
    this._ensureLoaded();
    const withId = { id: record.id || crypto.randomUUID(), ...record };
    this._records.push(withId);
    await this._persist();
    return withId;
  }

  async update(id, patch) {
    this._ensureLoaded();
    const idx = this._records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this._records[idx] = { ...this._records[idx], ...patch, id };
    await this._persist();
    return this._records[idx];
  }

  async remove(id) {
    this._ensureLoaded();
    const before = this._records.length;
    this._records = this._records.filter((r) => r.id !== id);
    const removed = this._records.length < before;
    if (removed) await this._persist();
    return removed;
  }
}

export default JsonFileStore;
