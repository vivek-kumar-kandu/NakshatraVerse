// ─────────────────────────────────────────────────────────────────────────
// Festival Controller (V4.5 Phase 1A — Festival Backend Infrastructure)
// Mirrors panchang.controller.js's exact pattern: this layer only
// validates input and orchestrates calls into festivalService.js (all
// calculation happens further down, in festivalEngine.js) and, for
// /explain only, geminiService (prose explanation of already-computed
// facts — never recalculation).
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";
import logger, { withTiming } from "../services/utils/logger.js";
import * as festivalService from "../services/festival/festivalService.js";
import { buildFestivalExplainPrompt } from "../services/ai/festivalPromptBuilder.js";
import { callGemini } from "../services/ai/geminiService.js";
import {
  validateYearQuery, validateMonthQuery, validateFestivalKeyParam,
  validateDateQuery, validateUpcomingQuery, validateExplainRequest,
} from "../validators/festival.validator.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// GET /api/festivals — static list of every supported festival (no dates).
export const listFestivals = asyncHandler(async (req, res) => {
  res.json({ festivals: festivalService.listSupportedFestivals() });
});

// GET /api/festivals/year?year=YYYY — every occurrence of every festival
// in a given Gregorian year (defaults to the current year).
export const getFestivalsForYear = asyncHandler(async (req, res) => {
  const { errors, year } = validateYearQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const festivals = await withTiming("Festival year computation", async () => festivalService.getFestivalsForYear(year));
    res.json({ year, festivals });
  } catch (err) {
    logger.error("Festival year computation error:", err);
    res.status(500).json({ error: "Internal server error while computing the festival calendar." });
  }
});

// GET /api/festivals/month?year=YYYY&month=MM
export const getFestivalsForMonth = asyncHandler(async (req, res) => {
  const { errors, year, month } = validateMonthQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const festivals = await withTiming("Festival month computation", async () => festivalService.getFestivalsForMonth(year, month));
    res.json({ year, month, festivals });
  } catch (err) {
    logger.error("Festival month computation error:", err);
    res.status(500).json({ error: "Internal server error while computing the festival calendar." });
  }
});

// GET /api/festivals/upcoming?date=YYYY-MM-DD&days=N
export const getUpcomingFestivals = asyncHandler(async (req, res) => {
  const { errors, date, days } = validateUpcomingQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const festivals = await withTiming("Upcoming festival computation", async () => festivalService.getUpcomingFestivals(date, days));
    res.json({ from: date, days, festivals });
  } catch (err) {
    logger.error("Upcoming festival computation error:", err);
    res.status(500).json({ error: "Internal server error while computing upcoming festivals." });
  }
});

// GET /api/festivals/on/:date — festivals occurring on a specific date.
export const getFestivalsOnDate = asyncHandler(async (req, res) => {
  const { errors, date } = validateDateQuery({ date: req.params.date });
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const festivals = await withTiming("Festival-on-date computation", async () => festivalService.getFestivalsForDate(date));
    res.json({ date, festivals });
  } catch (err) {
    logger.error("Festival-on-date computation error:", err);
    res.status(500).json({ error: "Internal server error while checking festivals for the given date." });
  }
});

// GET /api/festivals/:key?year=YYYY — a single festival's definition +
// its occurrence(s) in the given year.
export const getFestivalByKey = asyncHandler(async (req, res) => {
  const keyResult = validateFestivalKeyParam(req.params || {});
  const yearResult = validateYearQuery(req.query || {});
  const errors = [...keyResult.errors, ...yearResult.errors];
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  try {
    const result = await withTiming("Single festival computation", async () => festivalService.getFestival(keyResult.key, yearResult.year));
    res.json({ year: yearResult.year, ...result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    logger.error("Single festival computation error:", err);
    res.status(500).json({ error: "Internal server error while computing this festival." });
  }
});

// POST /api/festivals/explain — { festival: <already-computed festival
// occurrence object> }. Gemini only ever explains data the backend already
// computed and the client already has; it never receives raw dates and is
// never asked to calculate anything (see festivalPromptBuilder.js).
export const explainFestival = asyncHandler(async (req, res) => {
  const { errors, festival } = validateExplainRequest(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  if (!config.GOOGLE_API_KEY) {
    logger.error("festivals/explain called but no API key is configured.");
    return res.status(500).json({
      error: "Server is missing an API key. Set GOOGLE_API_KEY in backend/.env (see backend/.env.example).",
    });
  }

  const prompt = buildFestivalExplainPrompt(festival);

  try {
    const explanation = await withTiming("Gemini AI request (festival)", () => callGemini(prompt));
    res.json({ explanation });
  } catch (err) {
    logger.error("festivals/explain: Gemini call failed:", err.message);
    res.status(err.status || 502).json({ error: err.message, detail: err.detail, raw: err.raw });
  }
});

export default {
  listFestivals, getFestivalsForYear, getFestivalsForMonth, getUpcomingFestivals,
  getFestivalsOnDate, getFestivalByKey, explainFestival,
};
