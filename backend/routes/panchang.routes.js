// ─────────────────────────────────────────────────────────────────────────
// Panchang / Muhurat routes (V4.1 Phase 2 — new, additive)
// Mounted at /api/panchang in server.js. Does not alter any existing route.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  getDailyPanchang, getMonthPanchang, getMuhuratActivities, postFindMuhurat, explainPanchang,
} from "../controllers/panchang.controller.js";
import { panchangRateLimiter } from "../middleware/security.js";

const router = Router();

router.get("/daily", panchangRateLimiter, getDailyPanchang);
router.get("/month", panchangRateLimiter, getMonthPanchang);
router.get("/muhurat/activities", getMuhuratActivities);
router.post("/muhurat", panchangRateLimiter, postFindMuhurat);
router.post("/explain", panchangRateLimiter, explainPanchang);

export default router;
