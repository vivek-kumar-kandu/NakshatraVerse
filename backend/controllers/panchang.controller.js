// ─────────────────────────────────────────────────────────────────────────
// Panchang / Muhurat Controller (V4.1 Phase 2 — Professional Daily
// Panchang & Muhurat Finder)
// Mirrors matching.controller.js's exact pattern: this layer only
// validates input and orchestrates calls into panchangEngine.js /
// muhuratEngine.js (all calculation) and, for /explain only, geminiService
// (prose explanation of already-computed facts — never recalculation).
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";
import logger, { withTiming } from "../services/utils/logger.js";
import { computePanchang } from "../services/astrology/panchangEngine.js";
import { findMuhurat, MUHURAT_ACTIVITIES } from "../services/astrology/muhuratEngine.js";
import { buildPanchangExplainPrompt } from "../services/ai/panchangPromptBuilder.js";
import { callGemini } from "../services/ai/geminiService.js";
import {
  validateDateQuery, validateMonthQuery, validateMuhuratRequest, validateExplainRequest,
} from "../validators/panchang.validator.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// GET /api/panchang/daily?date=YYYY-MM-DD&lat=&lon=
export const getDailyPanchang = asyncHandler(async (req, res) => {
  const { errors, date, lat, lon } = validateDateQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const panchang = await withTiming("Panchang calculation", async () => computePanchang(date, lat, lon));
    res.json({ panchang });
  } catch (err) {
    logger.error("Panchang calculation error:", err);
    res.status(500).json({ error: "Internal server error while calculating Panchang." });
  }
});

// GET /api/panchang/month?year=&month=&lat=&lon=
// Lightweight day-quality overview for the whole month — powers Calendar
// visual indicators (Good/Neutral/Avoid) without the caller having to
// make one request per day.
export const getMonthPanchang = asyncHandler(async (req, res) => {
  const { errors, year, month } = validateMonthQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  const lat = req.query?.lat !== undefined ? Number(req.query.lat) : undefined;
  const lon = req.query?.lon !== undefined ? Number(req.query.lon) : undefined;

  try {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const days = await withTiming("Panchang month overview", async () => {
      const out = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const p = computePanchang(dateStr, lat, lon);
        let quality = "neutral";
        if (p.auspiciousnessScore >= 60) quality = "good";
        else if (p.auspiciousnessScore < 30) quality = "avoid";
        out.push({
          date: dateStr,
          quality,
          score: p.auspiciousnessScore,
          tithi: p.tithi.name,
          nakshatra: p.nakshatra.name,
          isAbhijitNotable: !p.yoga.isInauspicious && !p.karana.isInauspicious,
        });
      }
      return out;
    });
    res.json({ year, month, days });
  } catch (err) {
    logger.error("Panchang month overview error:", err);
    res.status(500).json({ error: "Internal server error while building the Panchang month overview." });
  }
});

// GET /api/panchang/muhurat/activities — small static list, but served
// from the backend (not hardcoded twice in the frontend) so the 8
// activity options always match the engine's actual supported set.
export const getMuhuratActivities = asyncHandler(async (req, res) => {
  res.json({ activities: MUHURAT_ACTIVITIES });
});

// POST /api/panchang/muhurat — { activity, startDate, rangeDays? }
export const postFindMuhurat = asyncHandler(async (req, res) => {
  const { errors, activity, startDate, rangeDays } = validateMuhuratRequest(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const muhurat = await withTiming("Muhurat search", async () => findMuhurat({ activity, startDate, rangeDays }));
    res.json({ muhurat });
  } catch (err) {
    logger.error("Muhurat search error:", err);
    res.status(500).json({ error: "Internal server error while finding a Muhurat." });
  }
});

// POST /api/panchang/explain — { kind: "daily"|"muhurat", data: <already-
// computed Panchang or Muhurat object> }. Gemini only ever explains data
// the backend already computed and the client already has on screen; it
// never receives raw dates and is never asked to calculate anything.
export const explainPanchang = asyncHandler(async (req, res) => {
  const { errors, kind, data } = validateExplainRequest(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  if (!config.GOOGLE_API_KEY) {
    logger.error("panchang/explain called but no API key is configured.");
    return res.status(500).json({
      error: "Server is missing an API key. Set GOOGLE_API_KEY in backend/.env (see backend/.env.example).",
    });
  }

  const prompt = buildPanchangExplainPrompt({ kind, data });

  try {
    const explanation = await withTiming("Gemini AI request (panchang)", () => callGemini(prompt));
    res.json({ kind, explanation });
  } catch (err) {
    logger.error("panchang/explain: Gemini call failed:", err.message);
    res.status(err.status || 502).json({ error: err.message, detail: err.detail, raw: err.raw });
  }
});

export default { getDailyPanchang, getMonthPanchang, getMuhuratActivities, postFindMuhurat, explainPanchang };
