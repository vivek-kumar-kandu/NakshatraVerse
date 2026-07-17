// ─────────────────────────────────────────────────────────────────────────
// Family Profiles routes (V4.2 — new, additive)
// Mounted at /api/family-profiles in server.js. Does not alter any
// existing route. Every route requires auth — profiles belong to a
// signed-in user's account, same as Saved Reports.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  createProfile, listProfiles, getStats, getRecentlyOpened, getProfile,
  updateProfile, deleteProfile, duplicateProfile, archiveProfile, restoreProfile, touchProfile,
} from "../controllers/familyProfile.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { familyProfileRateLimiter } from "../middleware/security.js";

const router = Router();

router.use(requireAuth, familyProfileRateLimiter);

router.post("/", createProfile);
router.get("/", listProfiles);
router.get("/stats", getStats);
router.get("/recent", getRecentlyOpened);
router.get("/:id", getProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);
router.post("/:id/duplicate", duplicateProfile);
router.post("/:id/archive", archiveProfile);
router.post("/:id/restore", restoreProfile);
router.post("/:id/touch", touchProfile);

export default router;
