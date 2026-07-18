// ─────────────────────────────────────────────────────────────────────────
// Reports routes (Priority 5.2 — new, additive)
// Mounted at /api/reports in server.js. Does not alter any existing route.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  createReport,
  listReports,
  getReport,
  deleteReport,
  exportAdHocPdf,
  exportSavedReportPdf,
} from "../controllers/reports.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { reportRateLimiter } from "../middleware/security.js";

const router = Router();

// Ad hoc PDF export never requires a session — it just formats whatever
// chart/report data the client already has in memory.
router.post("/export-pdf", reportRateLimiter, exportAdHocPdf);

router.post("/", requireAuth, createReport);
router.get("/", requireAuth, listReports);
router.get("/:id", requireAuth, getReport);
router.delete("/:id", requireAuth, deleteReport);
router.get("/:id/pdf", requireAuth, exportSavedReportPdf);

export default router;
