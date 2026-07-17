// ─────────────────────────────────────────────────────────────────────────
// Assistant routes — V3.0 Phase 4 (AI Astrology Assistant)
// Mounted at /api/assistant in server.js. Additive only — no existing
// route path, method, or behavior changes.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { postChatMessage } from "../controllers/assistant.controller.js";
import { assistantRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/chat", assistantRateLimiter, postChatMessage);

export default router;
