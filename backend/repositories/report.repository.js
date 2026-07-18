// ─────────────────────────────────────────────────────────────────────────
// Report Repository (Priority 5.2)
// Persistence for saved astrology reports. Ownership checks (does this
// report belong to this user?) are enforced one layer up in
// services/reports/reportService.js — this file only stores/retrieves
// records by id/userId.
// ─────────────────────────────────────────────────────────────────────────
import path from "node:path";
import config from "../config/env.js";
import JsonFileStore from "../db/jsonFileStore.js";

const store = new JsonFileStore(path.join(config.DATA_DIR, "reports.json"));

export async function create(record) {
  const now = new Date().toISOString();
  return store.insert({ ...record, createdAt: now, updatedAt: now });
}

export function findById(id) {
  return store.findById(id);
}

export function findByUser(userId) {
  return store
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function remove(id) {
  return store.remove(id);
}

export default { create, findById, findByUser, remove };
