// ─────────────────────────────────────────────────────────────────────────
// Festival Intelligence routes (V4.5 Phase 2 — new, additive)
// Mounted at /api/festival-intelligence in server.js. Does not alter
// festival.routes.js (Phase 1A's /api/festivals stays completely
// untouched) — this is a sibling router, same technique
// relationshipHub.routes.js used alongside familyProfile.routes.js.
// /explain, /personalized, /preparation, and /timeline are public (no
// requireAuth) — the client already holds the festival/chart/report
// objects and passes them in the body, same posture as
// festival.routes.js's /explain and lifeCoach.routes.js's /guidance.
// /family-suggestions requires auth, since it reads the signed-in user's
// own Family Profiles.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  explainFestivalIntelligence, getPersonalizedGuidance, getPreparation, getTimeline, getFamilySuggestions,
} from "../controllers/festivalIntelligence.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { festivalIntelligenceRateLimiter } from "../middleware/security.js";

const router = Router();

router.use(festivalIntelligenceRateLimiter);

router.post("/explain", explainFestivalIntelligence);
router.post("/personalized", getPersonalizedGuidance);
router.post("/preparation", getPreparation);
router.post("/timeline", getTimeline);
router.get("/family-suggestions", requireAuth, getFamilySuggestions);

export default router;
