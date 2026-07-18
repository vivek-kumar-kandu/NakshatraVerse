// ─────────────────────────────────────────────────────────────────────────
// AI Timeline routes — V5.2 (AI Timeline)
// Mounted at /api/ai-timeline in server.js. Additive only — no existing
// route path, method, or behavior changes.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { postExplain } from "../controllers/aiTimeline.controller.js";
import { aiTimelineRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/explain", aiTimelineRateLimiter, postExplain);

export default router;
