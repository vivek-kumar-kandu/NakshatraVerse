// ─────────────────────────────────────────────────────────────────────────
// Notification Repository (V4.4 Phase 1 — Notification Infrastructure)
// Persistence for user notifications. Mirrors familyProfile.repository.js
// exactly: a thin wrapper around JsonFileStore, one JSON file per
// collection (notifications.json), ownership enforcement left to the
// service layer above this file.
// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
import path from "node:path";
import config from "../config/env.js";
import JsonFileStore from "../db/jsonFileStore.js";

const store = new JsonFileStore(path.join(config.DATA_DIR, "notifications.json"));

export async function create(record) {
  const now = new Date().toISOString();
  return store.insert({ isRead: false, ...record, createdAt: now, updatedAt: now });
}

export function findById(id) {
  return store.findById(id);
}

export function findByUser(userId) {
  return store
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function update(id, patch) {
  return store.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function remove(id) {
  return store.remove(id);
=======
import Notification from "../models/Notification.model.js";

export async function create(record) {
  return await Notification.create({
    isRead: false,
    ...record,
  });
}

export async function findById(id) {
  return await Notification.findById(id);
}

export async function findByUser(userId) {
  return await Notification.find({ userId })
    .sort({ createdAt: -1 });
}

export async function update(id, patch) {
  return await Notification.findByIdAndUpdate(
    id,
    patch,
    {
      new: true,
      runValidators: true,
    }
  );
}

export async function remove(id) {
  return await Notification.findByIdAndDelete(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

// ─────────────────────────────────────────────────────────────────────────
// V4.4 Phase 2 (Intelligent Notification Generation) — additive only.
// Duplicate-prevention lookup: generators tag every notification they
// create with a stable `metadata.dedupeKey` (e.g. "panchang:2026-07-13" or
// "family-birthday:<profileId>:2026"), and check here first so the same
// backend event never produces two notifications. Nothing above this line
// is changed.
// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
export function findByUserAndDedupeKey(userId, dedupeKey) {
  if (!dedupeKey) return null;
  return store
    .filter((n) => n.userId === userId && n.metadata?.dedupeKey === dedupeKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

=======
export async function findByUserAndDedupeKey(userId, dedupeKey) {
  if (!dedupeKey) return null;

  return await Notification.findOne({
    userId,
    "metadata.dedupeKey": dedupeKey,
  }).sort({ createdAt: -1 });
}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
// Bulk helpers — used by "Mark All Read" / "Delete All Read". Sequential
// awaits are fine here: JsonFileStore already serializes every write via
// its internal promise chain (see db/jsonFileStore.js), and notification
// volume per user is small.
export async function markAllReadForUser(userId) {
<<<<<<< HEAD
  const unread = store.filter((n) => n.userId === userId && !n.isRead);
  for (const record of unread) {
    // eslint-disable-next-line no-await-in-loop
    await store.update(record.id, { isRead: true, updatedAt: new Date().toISOString() });
  }
  return unread.length;
}

export async function removeAllReadForUser(userId) {
  const read = store.filter((n) => n.userId === userId && n.isRead);
  for (const record of read) {
    // eslint-disable-next-line no-await-in-loop
    await store.remove(record.id);
  }
  return read.length;
=======
  const result = await Notification.updateMany(
    {
      userId,
      isRead: false,
    },
    {
      $set: { isRead: true },
    }
  );

  return result.modifiedCount;
}

export async function removeAllReadForUser(userId) {
  const result = await Notification.deleteMany({
    userId,
    isRead: true,
  });

  return result.deletedCount;
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

// ─────────────────────────────────────────────────────────────────────────
// V4.4 Phase 2 (Intelligent Notification Generation) — additive only.
// Automatic Cleanup: expired notifications already stop appearing in
// active lists (notificationService.listNotifications filters them out
// unless includeExpired is set) — this is the "no longer appear in
// active lists" requirement. This helper is the conservative *physical*
// cleanup on top of that: it only removes records that are both expired
// AND already read AND have been expired for a while, so a still-unread
// or recently-expired notification is never silently deleted — "Do NOT
// delete historical records unless required" from the Phase 2 spec.
// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
export async function removeStaleExpiredForUser(userId, { staleAfterMs = 30 * 24 * 60 * 60 * 1000 } = {}) {
  const now = Date.now();
  const stale = store.filter((n) => (
    n.userId === userId
    && n.isRead
    && n.expiresAt
    && new Date(n.expiresAt).getTime() <= now - staleAfterMs
  ));
  for (const record of stale) {
    // eslint-disable-next-line no-await-in-loop
    await store.remove(record.id);
  }
  return stale.length;
=======
export async function removeStaleExpiredForUser(
  userId,
  { staleAfterMs = 30 * 24 * 60 * 60 * 1000 } = {}
) {
  const cutoff = new Date(Date.now() - staleAfterMs);

  const result = await Notification.deleteMany({
    userId,
    isRead: true,
    expiresAt: { $lte: cutoff },
  });

  return result.deletedCount;
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

export default {
  create, findById, findByUser, update, remove,
  markAllReadForUser, removeAllReadForUser,
  findByUserAndDedupeKey, removeStaleExpiredForUser,
};
