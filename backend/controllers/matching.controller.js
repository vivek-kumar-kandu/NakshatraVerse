// ─────────────────────────────────────────────────────────────────────────
// Kundli Matching Controller (V4.0 Phase 1 — Professional Kundli Matching)
// Orchestrates the request/response cycle for the three matching
// endpoints, mirroring astrology.controller.js's getChart/generateReport
// pattern exactly:
//   POST /api/matching/compute          — backend-authoritative, no Gemini
//   POST /api/matching/generate-report  — compute + Gemini explanation
//   POST /api/matching/export-pdf       — ad hoc PDF (no login required)
// No astrology calculation happens here — this layer only validates input,
// calls the existing birth chart engine (computeChart, completely
// unmodified) and the new kundliMatchingEngine, then optionally calls
// Gemini via the existing, unmodified geminiService.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";
import logger, { withTiming } from "../services/utils/logger.js";
import { validateMatchingRequest } from "../validators/matching.validator.js";
import { computeChart } from "../services/astrology/birthChartEngine.js";
import { computeMatching } from "../services/astrology/kundliMatchingEngine.js";
import { buildMatchingPrompt } from "../services/ai/matchingPromptBuilder.js";
import { callGemini } from "../services/ai/geminiService.js";
import { buildMatchingPdfBuffer } from "../services/pdf/matchingPdfService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Shared by both /compute and /generate-report: validate, then compute both
// charts (backend is the sole source of truth — any chart data a client
// might send is always ignored/recomputed here) and the matching object.
function computeChartsAndMatching(personA, personB) {
  const chartA = computeChart(personA);
  const chartB = computeChart(personB);
  const matching = computeMatching({ chartA, chartB, personA, personB });
  return { chartA, chartB, matching };
}

export const computeMatch = asyncHandler(async (req, res) => {
  const { errors, personA, personB } = validateMatchingRequest(req.body || {});
  if (errors.length) {
    logger.warn(`Validation failed for /api/matching/compute: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  try {
    const { chartA, chartB, matching } = await withTiming("Kundli matching calculation", async () =>
      computeChartsAndMatching(personA, personB)
    );
    res.json({ personA, personB, chartA, chartB, matching });
  } catch (err) {
    logger.error("Kundli matching calculation error:", err);
    res.status(500).json({ error: "Internal server error while calculating Kundli Matching." });
  }
});

export const generateMatchingReport = asyncHandler(async (req, res) => {
  const { errors, personA, personB } = validateMatchingRequest(req.body || {});
  if (errors.length) {
    logger.warn(`Validation failed for /api/matching/generate-report: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  try {
    const { chartA, chartB, matching } = await withTiming("Kundli matching calculation", async () =>
      computeChartsAndMatching(personA, personB)
    );

    if (!config.GOOGLE_API_KEY) {
      logger.error("matching/generate-report called but no API key is configured.");
      return res.status(500).json({
        error: "Server is missing an API key. Set GOOGLE_API_KEY in backend/.env (see backend/.env.example).",
      });
    }

    const prompt = buildMatchingPrompt({ personA, personB, chartA, chartB, matching });

    let explanation;
    try {
      explanation = await withTiming("Gemini AI request (matching)", () => callGemini(prompt));
    } catch (err) {
      logger.error("matching/generate-report: Gemini call failed:", err.message);
      return res.status(err.status || 502).json({
        error: err.message,
        detail: err.detail,
        raw: err.raw,
      });
    }

    res.json({ personA, personB, chartA, chartB, matching, explanation });
  } catch (err) {
    logger.error("Unhandled server error in /api/matching/generate-report:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Ad hoc PDF export — no login/save required, mirrors reports.controller.js's
// exportAdHocPdf exactly. Works from whatever the client currently has on
// screen (the response of /compute or /generate-report).
function buildPdfFilename(nameA, nameB) {
  const safe = (s) => (s || "Untitled").trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Untitled";
  const date = new Date().toISOString().slice(0, 10);
  return `NakshatraVerse_KundliMatch_${safe(nameA)}_${safe(nameB)}_${date}.pdf`;
}

export const exportMatchingPdf = asyncHandler(async (req, res) => {
  const { personA, chartA, personB, chartB, matching, explanation } = req.body || {};
  if (!personA || !personB || !chartA || !chartB || !matching) {
    return res.status(400).json({ error: "personA, personB, chartA, chartB, and matching are all required to generate a PDF." });
  }
  const buffer = await buildMatchingPdfBuffer({ personA, personB, chartA, chartB, matching, explanation });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${buildPdfFilename(personA.name, personB.name)}"`);
  res.send(buffer);
});

export default { computeMatch, generateMatchingReport, exportMatchingPdf };
