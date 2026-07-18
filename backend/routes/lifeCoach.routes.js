// ─────────────────────────────────────────────────────────────────────────
// AI Life Coach routes — V4.3 (AI Life Coach)
// Mounted at /api/life-coach in server.js. Additive only — no existing
// route path, method, or behavior changes.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { postDailyGuidance } from "../controllers/lifeCoach.controller.js";
import { lifeCoachRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/guidance", lifeCoachRateLimiter, postDailyGuidance);

export default router;
