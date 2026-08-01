// ─────────────────────────────────────────────────────────────────────────
// Report Repository (Priority 5.2)
// Persistence for saved astrology reports. Ownership checks (does this
// report belong to this user?) are enforced one layer up in
// services/reports/reportService.js — this file only stores/retrieves
// records by id/userId.
// ─────────────────────────────────────────────────────────────────────────
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
}

export default { create, findById, findByUser, remove };
