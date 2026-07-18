// ─────────────────────────────────────────────────────────────────────────
// Kundli Matching routes (V4.0 Phase 1 — new, additive)
// Mounted at /api/matching in server.js. Does not alter any existing
// route.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { computeMatch, generateMatchingReport, exportMatchingPdf } from "../controllers/matching.controller.js";
import { matchingRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/compute", matchingRateLimiter, computeMatch);
router.post("/generate-report", matchingRateLimiter, generateMatchingReport);
router.post("/export-pdf", matchingRateLimiter, exportMatchingPdf);

export default router;
