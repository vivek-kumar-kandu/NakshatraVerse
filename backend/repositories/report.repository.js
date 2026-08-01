// ─────────────────────────────────────────────────────────────────────────
// Report Repository (Priority 5.2)
// Persistence for saved astrology reports. Ownership checks (does this
// report belong to this user?) are enforced one layer up in
// services/reports/reportService.js — this file only stores/retrieves
// records by id/userId.
// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
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
=======
import Report from "../models/Report.model.js";

export async function create(record) {
  return await Report.create(record);
}

export async function findById(id) {
  return await Report.findById(id);
}

export async function findByUser(userId) {
  return await Report.find({ userId }).sort({
    createdAt: -1,
  });
}

export async function remove(id) {
  return await Report.findByIdAndDelete(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

export default { create, findById, findByUser, remove };
