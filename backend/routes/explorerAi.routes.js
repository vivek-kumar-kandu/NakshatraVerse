// ─────────────────────────────────────────────────────────────────────────
// Explorer AI routes — V5.0 Phase 5C (Explorer AI Explanations)
// Mounted at /api/explorer-ai in server.js. Additive only — no existing
// route path, method, or behavior changes.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { postExplain } from "../controllers/explorerAi.controller.js";
import { explorerAiRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/explain", explorerAiRateLimiter, postExplain);

export default router;
