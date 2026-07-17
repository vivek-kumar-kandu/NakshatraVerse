// ─────────────────────────────────────────────────────────────────────────
// Festival routes (V4.5 Phase 1A — new, additive)
// Mounted at /api/festivals in server.js. Does not alter any existing
// route. Public (no requireAuth) — mirrors panchang.routes.js, since
// festival dates are global reference data, not per-user data.
// "/year", "/month", "/upcoming", "/on/:date", and "/explain" are
// registered before "/:key" so they are never swallowed by the :key
// param — same ordering technique panchang.routes.js/notification.routes
// .js already use.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  listFestivals, getFestivalsForYear, getFestivalsForMonth, getUpcomingFestivals,
  getFestivalsOnDate, getFestivalByKey, explainFestival,
} from "../controllers/festival.controller.js";
import { festivalRateLimiter } from "../middleware/security.js";

const router = Router();

router.use(festivalRateLimiter);

router.get("/", listFestivals);
router.get("/year", getFestivalsForYear);
router.get("/month", getFestivalsForMonth);
router.get("/upcoming", getUpcomingFestivals);
router.get("/on/:date", getFestivalsOnDate);
router.post("/explain", explainFestival);
router.get("/:key", getFestivalByKey);

export default router;
