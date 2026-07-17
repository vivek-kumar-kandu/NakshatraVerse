// ─────────────────────────────────────────────────────────────────────────
// Notification Service (V4.4 Phase 1 — Notification Infrastructure)
// Business logic for a user's notifications: create (internal only — see
// below), read/list with search+filter+sort+pagination, mark read/mark
// all read, delete/delete all read. Ownership enforcement mirrors
// familyProfileService.js's assertOwnership pattern exactly.
//
// createNotification is exported but deliberately NOT wired to any public
// HTTP route in this phase (see notification.routes.js) — the Phase 1
// spec's API list is Get/Mark Read/Mark All Read/Delete/Delete All Read/
// Search/Filter/Pagination only, no public "create". This function exists
// so Phase 2 (Intelligent Notification Generation) has a real, tested
// insertion point to call from — Panchang/Muhurat/Family/Festival/Dasha/
// Transit/AI Life Coach modules will call this service function directly,
// server-side, once Phase 2 defines *when* and *what* to notify about.
// Nothing in this phase calls it automatically.
// ─────────────────────────────────────────────────────────────────────────
import * as notificationRepository from "../../repositories/notification.repository.js";
import { sanitizeNotification, validateNotification } from "../../validators/notification.validator.js";

function assertOwnership(record, userId) {
  if (!record || record.userId !== userId) {
    const err = new Error("Notification not found.");
    err.status = 404;
    throw err;
  }
}

function isExpired(record) {
  return Boolean(record.expiresAt) && new Date(record.expiresAt).getTime() <= Date.now();
}

// Shape returned to the client for every notification — a single,
// consistent projection, same rationale as toPublicProfile.
export function toPublicNotification(record) {
  if (!record) return null;
  const { id, title, message, category, priority, isRead, createdAt, updatedAt, expiresAt, metadata } = record;
  return {
    id, title, message, category, priority,
    isRead: Boolean(isRead),
    createdAt, updatedAt,
    expiresAt: expiresAt || null,
    metadata: metadata || {},
    expired: isExpired(record),
  };
}

// Internal insertion point — see file header. Not exposed over HTTP.
export async function createNotification(userId, input) {
  const notification = sanitizeNotification(input || {});
  const errors = validateNotification(notification);
  if (errors.length) {
    const err = new Error(`Invalid notification: ${errors.join(", ")}`);
    err.status = 400;
    throw err;
  }
  const saved = await notificationRepository.create({ userId, ...notification });
  return toPublicNotification(saved);
}

// V4.4 Phase 2 (Intelligent Notification Generation) — additive only.
// Thin wrapper around createNotification that first checks the dedupe
// lookup added to the repository. `input.metadata.dedupeKey` must be set
// by the caller (a generator function); if a live (non-expired) match
// already exists for this user, nothing new is created and the existing
// record is returned instead. This is the only place Phase 2's "duplicate
// notification prevention" requirement is enforced — createNotification
// itself is untouched.
export async function createNotificationIfNew(userId, input) {
  const dedupeKey = input?.metadata?.dedupeKey || null;
  if (dedupeKey) {
    const existing = notificationRepository.findByUserAndDedupeKey(userId, dedupeKey);
    if (existing && !isExpired(existing)) {
      return { created: false, notification: toPublicNotification(existing) };
    }
  }
  const notification = await createNotification(userId, input);
  return { created: true, notification };
}

export function getNotification(userId, id) {
  const record = notificationRepository.findById(id);
  assertOwnership(record, userId);
  return toPublicNotification(record);
}

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  priority: (a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    const diff = (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
    return diff !== 0 ? diff : new Date(b.createdAt) - new Date(a.createdAt);
  },
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// List with search/filter/sort/pagination, all applied server-side —
// mirrors familyProfileService.listProfiles' shape, extended with
// pagination since a notification feed can grow much larger than a
// person's saved family profiles.
export function listNotifications(userId, {
  search, category, priority, isRead, sort, page, limit, includeExpired,
} = {}) {
  let notifications = notificationRepository.findByUser(userId).map(toPublicNotification);

  if (!includeExpired) {
    notifications = notifications.filter((n) => !n.expired);
  }

  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    notifications = notifications.filter((n) =>
      n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
    );
  }

  if (category && category !== "all") {
    notifications = notifications.filter((n) => n.category === category);
  }

  if (priority && priority !== "all") {
    notifications = notifications.filter((n) => n.priority === priority);
  }

  if (isRead === "true" || isRead === true) {
    notifications = notifications.filter((n) => n.isRead);
  } else if (isRead === "false" || isRead === false) {
    notifications = notifications.filter((n) => !n.isRead);
  }

  notifications.sort(SORTERS[sort] || SORTERS.newest);

  const total = notifications.length;
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * safeLimit;
  const pageItems = notifications.slice(start, start + safeLimit);

  return {
    notifications: pageItems,
    pagination: { page: safePage, limit: safeLimit, total, totalPages },
  };
}

export function unreadCount(userId) {
  return notificationRepository.findByUser(userId)
    .map(toPublicNotification)
    .filter((n) => !n.isRead && !n.expired)
    .length;
}

export function latestNotification(userId) {
  const [latest] = notificationRepository.findByUser(userId).map(toPublicNotification).filter((n) => !n.expired);
  return latest || null;
}

export async function markRead(userId, id) {
  const existing = notificationRepository.findById(id);
  assertOwnership(existing, userId);
  const updated = await notificationRepository.update(id, { isRead: true });
  return toPublicNotification(updated);
}

export async function markAllRead(userId) {
  const count = await notificationRepository.markAllReadForUser(userId);
  return { updated: count };
}

export async function deleteNotification(userId, id) {
  const existing = notificationRepository.findById(id);
  assertOwnership(existing, userId);
  return notificationRepository.remove(id);
}

export async function deleteAllRead(userId) {
  const count = await notificationRepository.removeAllReadForUser(userId);
  return { deleted: count };
}

// V4.4 Phase 2 — Automatic Cleanup. See
// notificationRepository.removeStaleExpiredForUser's header for exactly
// what "stale" means and why it's conservative. Safe to call as often as
// needed (e.g. from POST /api/notifications/generate) — a no-op when
// there's nothing stale to remove.
export async function cleanupExpired(userId) {
  const removed = await notificationRepository.removeStaleExpiredForUser(userId);
  return { removed };
}

// V4.4 Phase 2 — Notification Grouping. Purely a read-side transform: it
// never changes what's stored, just how listNotifications' output can
// optionally be shaped for display. Generators tag related notifications
// with the same metadata.groupKey (see notificationGenerationService.js's
// Panchang cluster); this collapses consecutive-in-sort-order items that
// share a groupKey into one { groupKey, groupLabel, notifications } entry
// so the existing Notification Center UI can render "Today's Panchang"
// as a single group instead of N separate rows. Ungrouped notifications
// pass through unchanged as { notification }.
export function groupNotifications(notifications) {
  const result = [];
  const seenGroups = new Map();
  for (const n of notifications) {
    const groupKey = n.metadata?.groupKey;
    if (!groupKey) {
      result.push({ notification: n });
      continue;
    }
    if (seenGroups.has(groupKey)) {
      seenGroups.get(groupKey).notifications.push(n);
      continue;
    }
    const group = { groupKey, groupLabel: n.metadata?.groupLabel || groupKey, notifications: [n] };
    seenGroups.set(groupKey, group);
    result.push(group);
  }
  return result;
}

export default {
  toPublicNotification,
  createNotification,
  createNotificationIfNew,
  getNotification,
  listNotifications,
  unreadCount,
  latestNotification,
  markRead,
  markAllRead,
  deleteNotification,
  deleteAllRead,
  cleanupExpired,
  groupNotifications,
};
