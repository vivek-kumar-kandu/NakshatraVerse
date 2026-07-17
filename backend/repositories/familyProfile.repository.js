// ─────────────────────────────────────────────────────────────────────────
// Family Profile Repository (V4.2 — Family Profiles & Relationship Hub)
// Persistence for saved family/relationship profiles. Mirrors
// report.repository.js exactly: a thin wrapper around JsonFileStore, one
// JSON file per collection (family_profiles.json), ownership enforcement
// left to the service layer above this file.
// ─────────────────────────────────────────────────────────────────────────
import path from "node:path";
import config from "../config/env.js";
import JsonFileStore from "../db/jsonFileStore.js";

const store = new JsonFileStore(path.join(config.DATA_DIR, "family_profiles.json"));

export async function create(record) {
  const now = new Date().toISOString();
  return store.insert({ ...record, createdAt: now, updatedAt: now });
}

export function findById(id) {
  return store.findById(id);
}

export function findByUser(userId) {
  return store
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function update(id, patch) {
  return store.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function remove(id) {
  return store.remove(id);
}

export default { create, findById, findByUser, update, remove };
