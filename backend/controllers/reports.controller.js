// ─────────────────────────────────────────────────────────────────────────
// Reports Controller (Priority 5.2)
// HTTP layer for saved reports + PDF export. No astrology calculation or
// Gemini calling happens here — this only persists/retrieves data the
// existing /api/generate-report endpoint already produced, and formats it
// as PDF via services/pdf/pdfReportService.js.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as reportService from "../services/reports/reportService.js";
import { buildReportPdfBuffer } from "../services/pdf/pdfReportService.js";

export const createReport = asyncHandler(async (req, res) => {
  const { title, userData, chart, report } = req.body || {};
  const saved = await reportService.saveReport(req.user.id, { title, userData, chart, report });
  logger.info(`Report saved for user ${req.user.id}: ${saved.id}`);
  res.status(201).json({ report: { id: saved.id, title: saved.title, createdAt: saved.createdAt } });
});

export const listReports = asyncHandler(async (req, res) => {
  res.json({ reports: reportService.listReports(req.user.id) });
});

export const getReport = asyncHandler(async (req, res) => {
  const record = reportService.getReport(req.user.id, req.params.id);
  res.json({ report: record });
});

export const deleteReport = asyncHandler(async (req, res) => {
  await reportService.deleteReport(req.user.id, req.params.id);
  res.json({ ok: true });
});

function sendPdf(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

// V3.0 Phase 6: standardized export filename — "NakshatraVerse_Report_<Name>_<Date>.pdf".
// Purely a naming convention for the Content-Disposition header; does not
// affect PDF contents.
function buildPdfFilename(name) {
  const safeName = (name || "Untitled").trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Untitled";
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `NakshatraVerse_Report_${safeName}_${date}.pdf`;
}

// Ad hoc export: no login/save required — works straight from whatever
// the client currently has on screen (used by the "Download PDF" button
// on the results page for anonymous visitors).
export const exportAdHocPdf = asyncHandler(async (req, res) => {
  const { userData, chart, report, title } = req.body || {};
  if (!userData || !chart || !report) {
    return res.status(400).json({ error: "userData, chart, and report are all required to generate a PDF." });
  }
  const buffer = await buildReportPdfBuffer({ userData, chart, report, title });
  sendPdf(res, buffer, buildPdfFilename(userData.name));
});

// Download a previously saved report as PDF (ownership-checked).
export const exportSavedReportPdf = asyncHandler(async (req, res) => {
  const record = reportService.getReport(req.user.id, req.params.id);
  const buffer = await buildReportPdfBuffer({
    userData: record.userData,
    chart: record.chart,
    report: record.report,
    title: record.title,
  });
  sendPdf(res, buffer, buildPdfFilename(record.userData?.name || record.title));
});

export default { createReport, listReports, getReport, deleteReport, exportAdHocPdf, exportSavedReportPdf };
