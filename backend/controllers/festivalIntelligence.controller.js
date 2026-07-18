// ─────────────────────────────────────────────────────────────────────────
// Festival Intelligence Controller (V4.5 Phase 2 — Festival Intelligence)
// HTTP layer only: validate input, delegate to festivalIntelligenceService
// .js, shape the response/error exactly like festival.controller.js's
// explainFestival. No astrology calculation or prompt construction
// happens here.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";
import logger, { withTiming } from "../services/utils/logger.js";
import * as festivalIntelligenceService from "../services/festival/festivalIntelligenceService.js";
import {
  validateFestivalIntelligenceRequest,
  validatePersonalizedFestivalRequest,
  validatePreparationRequest,
  validateTimelineRequest,
} from "../validators/festivalIntelligence.validator.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function requireApiKey(res) {
  if (!config.GOOGLE_API_KEY) {
    logger.error("Festival Intelligence endpoint called but no API key is configured.");
    res.status(500).json({
      error: "Server is missing an API key. Set GOOGLE_API_KEY in backend/.env (see backend/.env.example).",
    });
    return false;
  }
  return true;
}

// POST /api/festival-intelligence/explain — { festival }.
export const explainFestivalIntelligence = asyncHandler(async (req, res) => {
  const { errors, festival } = validateFestivalIntelligenceRequest(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  if (!requireApiKey(res)) return;

  try {
    const intelligence = await withTiming(
      "Gemini AI request (festival intelligence)",
      () => festivalIntelligenceService.generateFestivalIntelligence(festival)
    );
    res.json({ intelligence });
  } catch (err) {
    logger.error("festival-intelligence/explain: Gemini call failed:", err.message);
    res.status(err.status || 502).json({ error: err.message, detail: err.detail, raw: err.raw });
  }
});

// POST /api/festival-intelligence/personalized — { festival, chart, report }.
export const getPersonalizedGuidance = asyncHandler(async (req, res) => {
  const { errors, festival, chart, report } = validatePersonalizedFestivalRequest(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  if (!requireApiKey(res)) return;

  try {
    const result = await withTiming(
      "Gemini AI request (personalized festival guidance)",
      () => festivalIntelligenceService.generatePersonalizedFestivalGuidance({ festival, chart, report })
    );
    res.json(result);
  } catch (err) {
    logger.error("festival-intelligence/personalized: Gemini call failed:", err.message);
    res.status(err.status || 502).json({ error: err.message, detail: err.detail, raw: err.raw });
  }
});

// POST /api/festival-intelligence/preparation — { festival }. Deterministic
// (no Gemini call), so no API-key check is needed here.
export const getPreparation = asyncHandler(async (req, res) => {
  const { errors, festival } = validatePreparationRequest(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const preparation = festivalIntelligenceService.buildFestivalPreparation(festival);
    res.json({ preparation });
  } catch (err) {
    logger.error("festival-intelligence/preparation error:", err);
    res.status(500).json({ error: "Internal server error while building the preparation checklist." });
  }
});

// POST /api/festival-intelligence/timeline — { festival }. Deterministic
// (no Gemini call).
export const getTimeline = asyncHandler(async (req, res) => {
  const { errors, festival } = validateTimelineRequest(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const timeline = festivalIntelligenceService.buildFestivalTimeline(festival);
    res.json({ timeline });
  } catch (err) {
    logger.error("festival-intelligence/timeline error:", err);
    res.status(500).json({ error: "Internal server error while building the festival timeline." });
  }
});

// GET /api/festival-intelligence/family-suggestions?festivalKey=&date=&year=
// Requires auth — reads the signed-in user's own Family Profiles, same
// posture as every /api/family-profiles route.
export const getFamilySuggestions = asyncHandler(async (req, res) => {
  const key = (req.query.festivalKey || "").trim();
  if (!key) {
    return res.status(400).json({ error: "`festivalKey` query parameter is required." });
  }
  const year = req.query.year ? Number(req.query.year) : new Date().getUTCFullYear();

  try {
    const { getFestival } = await import("../services/festival/festivalService.js");
    const { occurrences } = getFestival(key, year);
    const occurrence = req.query.date
      ? occurrences.find((o) => o.date === req.query.date) || occurrences[0]
      : occurrences[0];
    if (!occurrence) {
      return res.status(404).json({ error: `No occurrence of "${key}" found for year ${year}.` });
    }
    const suggestions = festivalIntelligenceService.getFamilyFestivalSuggestions(req.user.id, occurrence);
    res.json({ festival: occurrence, ...suggestions });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    logger.error("festival-intelligence/family-suggestions error:", err);
    res.status(500).json({ error: "Internal server error while building family festival suggestions." });
  }
});

export default {
  explainFestivalIntelligence, getPersonalizedGuidance, getPreparation, getTimeline, getFamilySuggestions,
};
