// ─────────────────────────────────────────────────────────────────────────
// Notification Controller (V4.4 Phase 1 — Notification Infrastructure)
// HTTP layer for the Notification module. Mirrors
// familyProfile.controller.js's structure exactly — validate/delegate to
// the service layer, shape the JSON response. No notification-generation
// logic happens here (see notification.routes.js's header for why there
// is no public "create" endpoint in this phase).
// ─────────────────────────────────────────────────────────────────────────
import { asyncHandler } from "../middleware/errorHandler.js";
import * as notificationService from "../services/notifications/notificationService.js";
// V4.4 Phase 2 (Intelligent Notification Generation) — additive import.
import { generateForUser } from "../services/notifications/notificationGenerationService.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { search, category, priority, isRead, sort, page, limit, group } = req.query;
  const result = notificationService.listNotifications(req.user.id, {
    search, category, priority, isRead, sort, page, limit,
  });
  // V4.4 Phase 2 (Intelligent Notification Generation) — additive, opt-in
  // via ?group=true. Response shape is unchanged unless a caller asks for
  // grouping, so every existing consumer of this endpoint is unaffected.
  if (group === "true" || group === true) {
    res.json({ ...result, groups: notificationService.groupNotifications(result.notifications) });
    return;
  }
  res.json(result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  res.json({ unreadCount: notificationService.unreadCount(req.user.id) });
});

export const getLatest = asyncHandler(async (req, res) => {
  res.json({ notification: notificationService.latestNotification(req.user.id) });
});

export const getNotification = asyncHandler(async (req, res) => {
  res.json({ notification: notificationService.getNotification(req.user.id, req.params.id) });
});

export const markRead = asyncHandler(async (req, res) => {
  res.json({ notification: await notificationService.markRead(req.user.id, req.params.id) });
});

export const markAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.user.id));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user.id, req.params.id);
  res.json({ ok: true });
});

export const deleteAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.deleteAllRead(req.user.id));
});

// V4.4 Phase 2 (Intelligent Notification Generation) — additive. Runs
// every generator (Panchang/Muhurat/Family/Festival/Transit/Prediction/AI
// Life Coach) for the signed-in user and reports counts. See
// notificationGenerationService.js for what each generator does and why.
export const generateNotifications = asyncHandler(async (req, res) => {
  // V4.4 Phase 2 — Automatic Cleanup runs alongside generation, the same
  // on-demand trigger point every other Phase 2 generator already uses
  // (see notificationGenerationService.js's file header) rather than
  // introducing a new cron/scheduler into this codebase.
  await notificationService.cleanupExpired(req.user.id);
  const result = await generateForUser(req.user.id);
  res.json(result);
});

export default {
  listNotifications, getUnreadCount, getLatest, getNotification,
  markRead, markAllRead, deleteNotification, deleteAllRead,
  generateNotifications,
};
