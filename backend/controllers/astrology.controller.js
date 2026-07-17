// ─────────────────────────────────────────────────────────────────────────
// Astrology Controller
// Orchestrates the request/response cycle for the astrology endpoints:
//   validate input → run birth chart engine → (optionally) call Gemini →
//   format response.
// No astrology calculation or Gemini-calling logic lives here — this layer
// only coordinates the services/ modules and shapes HTTP responses, exactly
// matching the original server.js route handler behavior and status codes.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";
import logger, { withTiming } from "../services/utils/logger.js";
import { validateBirthFields, sanitizeBirthFields } from "../validators/birthData.validator.js";
import { computeChart } from "../services/astrology/birthChartEngine.js";
import { buildStructuredInsights } from "../services/astrology/structuredInsightsEngine.js";
import { buildPrompt } from "../services/ai/promptBuilder.js";
import { callGemini } from "../services/ai/geminiService.js";
import { formatGenerateReportResponse } from "../services/utils/responseFormatter.js";
// V2.0 Phase 7.1 (Prediction & Profile Integration): lets /api/chart expose
// the same optional nakshatraProfile/predictions/predictionTimeline/
// transitForecast fields as /api/generate-report, WITHOUT calling Gemini —
// this is what makes "if Gemini is disabled, prediction cards still render
// from backend JSON" true, since /api/chart has never required an API key.
import { buildPredictionApiFields, buildExplorerApiFields, buildAiTimelineApiFields } from "../services/astrology/predictionApiMapper.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getChartCacheStats } from "../services/astrology/birthChartEngine.js";
import { getGeminiCacheStats } from "../services/ai/geminiService.js";
import { getMetricsSnapshot } from "../services/utils/metrics.js";

// Backend-authoritative chart calculation endpoint (no Gemini involved).
// The frontend can call this on its own if it only needs chart data without
// an AI narrative.
export const getChart = asyncHandler(async (req, res) => {
  const { name, dob, tob, pob } = sanitizeBirthFields(req.body || {});
  const errors = validateBirthFields({ name, dob, tob, pob });
  if (errors.length) {
    logger.warn(`Validation failed for /api/chart: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  try {
    const chart = await withTiming("Birth chart calculation", async () =>
      computeChart({ name, dob, tob, pob })
    );

    // V2.0 Phase 7.1: additive, optional prediction/profile fields — same
    // backend-authoritative data /api/generate-report exposes, computed
    // here without ever calling Gemini. Wrapped defensively so that, if
    // anything in the insights/prediction pipeline ever throws, /api/chart
    // still returns the core chart exactly as before rather than a 500 —
    // the base chart response must never regress because of this addition.
    let predictionFields = {};
    let explorerFields = {};
    let aiTimelineFields = {};
    try {
      const insights = buildStructuredInsights(chart);
      predictionFields = buildPredictionApiFields(insights);
      // V5.0 Phase 5B (Explorer Infrastructure — Backend Integration):
      // same defensive try/catch as Phase 7.1 above — additive-only fields
      // (planetStrength/advancedYogas/advancedDoshas) for the new Explorer
      // tab. If this ever throws, /api/chart still returns everything it
      // did before this phase rather than a 500.
      explorerFields = buildExplorerApiFields(insights);
      // V5.2 (AI Timeline): same defensive try/catch as Phase 7.1/5B above —
      // additive-only `aiTimeline` field. If this ever throws, /api/chart
      // still returns everything it did before this phase rather than a 500.
      aiTimelineFields = buildAiTimelineApiFields(insights);
    } catch (insightsErr) {
      logger.error("Chart calculation succeeded but Phase 7.1 insight/prediction fields failed:", insightsErr);
    }

    res.json({ ...chart, ...predictionFields, ...explorerFields, ...aiTimelineFields });
  } catch (err) {
    logger.error("Chart calculation error:", err);
    res.status(500).json({ error: "Internal server error while calculating the chart." });
  }
});

export const generateReport = asyncHandler(async (req, res) => {
  // Sanitize the four known fields but keep any other properties the
  // client sent (e.g. the frontend currently also sends a client-computed
  // `lagna`, which buildChartJson always overwrites with the
  // backend-authoritative value anyway) — this guarantees Priority 4's
  // sanitization step can never silently drop a field a future frontend
  // version starts relying on.
  const userData = { ...(req.body?.userData || {}), ...sanitizeBirthFields(req.body?.userData || {}) };
  const errors = validateBirthFields(userData);
  if (errors.length) {
    logger.warn(`Validation failed for /api/generate-report: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid userData: ${errors.join(", ")}` });
  }

  try {
    // Backend is the sole source of truth for all astrological facts.
    // Any planetary/numerology data sent by the client is ignored/recomputed
    // here so the AI narrative and the displayed chart can never disagree.
    const chart = await withTiming("Birth chart calculation", async () => computeChart(userData));

    if (!config.GOOGLE_API_KEY) {
      logger.error("generate-report called but no API key is configured.");
      return res.status(500).json({
        error: "Server is missing an API key. Set GOOGLE_API_KEY in backend/.env (see backend/.env.example).",
      });
    }

    // Priority 3.2: richer structured astrology data (Nakshatra profile,
    // Dasha, Transits, additional Yogas/Doshas, planet-strength
    // contributors) so Gemini can explain WHY, not just WHAT. This never
    // changes what fields Gemini must return, and never touches the
    // response shape sent back to the client.
    const insights = buildStructuredInsights(chart);
    const prompt = buildPrompt(chart, insights);

    let report;
    try {
      report = await withTiming("Gemini AI request", () => callGemini(prompt));
    } catch (err) {
      logger.error("generate-report: Gemini call failed:", err.message);
      return res.status(err.status || 502).json({
        error: err.message,
        detail: err.detail,
        raw: err.raw,
      });
    }

    res.json(formatGenerateReportResponse(chart, report, insights));
  } catch (err) {
    logger.error("Unhandled server error in /api/generate-report:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export const getHealth = (req, res) => {
  res.json({
    ok: true,
    port: config.PORT,
    model: config.GEMINI_MODEL,
    fallbackModel: config.GEMINI_FALLBACK_MODEL || null,
    maxRetries: config.GEMINI_MAX_RETRIES,
    totalBudgetMs: config.GEMINI_TOTAL_BUDGET_MS,
    apiKeyConfigured: Boolean(config.GOOGLE_API_KEY),
  });
};

// ── Priority 4: observability ────────────────────────────────────────────
// New, additive endpoint — does not exist in any pre-Priority-4 client, and
// none of the existing endpoints/response shapes change because of it.
// Exposes request/timing counters plus cache hit rates so operators can
// watch performance without an external APM.
export const getMetrics = (req, res) => {
  res.json({
    ...getMetricsSnapshot(),
    caches: {
      chart: getChartCacheStats(),
      gemini: getGeminiCacheStats(),
    },
  });
};

export default { getChart, generateReport, getHealth, getMetrics };
