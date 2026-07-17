// ─────────────────────────────────────────────────────────────────────────
// Explanation routes — V5.3 (Explainable Report Intelligence)
// Mounted at /api/explanation in server.js. Additive only — no existing
// route path, method, or behavior changes.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  postReportSummary,
  postConfidenceExplanation,
  postPredictionEvidence,
  postRemedyExplanation,
  postCrossLinks,
} from "../controllers/explanation.controller.js";
import { explanationRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/report-summary", explanationRateLimiter, postReportSummary);
router.post("/confidence", explanationRateLimiter, postConfidenceExplanation);
router.post("/prediction-evidence", explanationRateLimiter, postPredictionEvidence);
router.post("/remedy", explanationRateLimiter, postRemedyExplanation);
router.post("/cross-links", explanationRateLimiter, postCrossLinks);

export default router;
