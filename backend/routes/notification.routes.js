// ─────────────────────────────────────────────────────────────────────────
// Notification routes (V4.4 Phase 1 — new, additive)
// Mounted at /api/notifications in server.js. Does not alter any existing
// route. Every route requires auth — notifications belong to a signed-in
// user's account, same as Family Profiles/Saved Reports.
//
// Deliberately no public POST "/" create route in this phase — see
// notificationService.js's file header. Only Read/Mark Read/Mark All
// Read/Delete/Delete All Read/Search/Filter/Pagination are exposed, per
// the Phase 1 spec's API list. "/read" (delete-all-read) and
// "/mark-all-read"/"/unread-count"/"/latest" are registered before the
// "/:id" routes so they're never swallowed by the :id param — same
// ordering technique familyProfile.routes.js already uses for /stats and
// /recent.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  listNotifications, getUnreadCount, getLatest, getNotification,
  markRead, markAllRead, deleteNotification, deleteAllRead,
  generateNotifications,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { notificationRateLimiter } from "../middleware/security.js";

const router = Router();

router.use(requireAuth, notificationRateLimiter);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.get("/latest", getLatest);
router.post("/mark-all-read", markAllRead);
// V4.4 Phase 2 (Intelligent Notification Generation) — additive. Triggers
// every notification generator for the signed-in user (see
// notificationGenerationService.js). Ordered before "/:id" for the same
// reason "/mark-all-read" already is.
router.post("/generate", generateNotifications);
router.delete("/read", deleteAllRead);
router.get("/:id", getNotification);
router.post("/:id/read", markRead);
router.delete("/:id", deleteNotification);

export default router;
