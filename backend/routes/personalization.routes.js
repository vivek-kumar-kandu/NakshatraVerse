import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getPersonalizedInsights } from "../controllers/personalization.controller.js";

const router = Router();
// A single authenticated, read-only surface keeps V5.4 additive and allows
// the dashboard, summaries, recommendations, comparison, and history to
// share one cached payload.
router.get("/", requireAuth, getPersonalizedInsights);
export default router;
