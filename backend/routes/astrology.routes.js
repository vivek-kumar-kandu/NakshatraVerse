// ─────────────────────────────────────────────────────────────────────────
// Astrology routes
// Same paths/methods as before: POST /api/chart, POST /api/generate-report,
// GET /api/health. Priority 4 adds GET /api/metrics (new, additive) and
// lightweight rate limiting on the two POST endpoints only.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { getChart, generateReport, getHealth, getMetrics } from "../controllers/astrology.controller.js";
import { chartRateLimiter, reportRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/chart", chartRateLimiter, getChart);
router.post("/generate-report", reportRateLimiter, generateReport);
router.get("/health", getHealth);
router.get("/metrics", getMetrics);

export default router;
