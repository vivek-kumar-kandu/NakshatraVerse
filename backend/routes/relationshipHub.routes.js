// ─────────────────────────────────────────────────────────────────────────
// Relationship Hub routes (V4.2 — new, additive)
// Mounted at /api/relationship-hub in server.js. Does not alter any
// existing route.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { compareProfiles } from "../controllers/relationshipHub.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { relationshipHubRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/compare", requireAuth, relationshipHubRateLimiter, compareProfiles);

export default router;
