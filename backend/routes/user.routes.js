// ─────────────────────────────────────────────────────────────────────────
// User routes (Priority 5.2 — new, additive)
// Mounted at /api/users in server.js. Every route requires authentication.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { getProfile, updateProfile, changePassword, updatePhoto } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.patch("/me", requireAuth, updateProfile);
router.patch("/me/photo", requireAuth, updatePhoto);  // BUG-07: persist profile photo to DB
router.post("/me/password", requireAuth, changePassword);

export default router;

