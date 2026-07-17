// ─────────────────────────────────────────────────────────────────────────
// Explanation Controller — V5.3 (Explainable Report Intelligence)
// HTTP layer only: validate the request, delegate to explanationEngine.js,
// and shape the response/error exactly like explorerAi.controller.js's
// postExplain / aiTimeline.controller.js's postExplain. No astrology
// calculation or prompt construction happens here.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  validateReportSummaryRequest,
  validateConfidenceExplanationRequest,
  validatePredictionEvidenceRequest,
  validateRemedyExplanationRequest,
  validateCrossLinkRequest,
} from "../validators/explanation.validator.js";
import {
  getReportSummary,
  getConfidenceExplanation,
  getPredictionEvidence,
  getRemedyExplanation,
  getCrossLinks,
} from "../services/ai/explanationEngine.js";

function handleGeminiError(res, err, label) {
  logger.error(`${label} error:`, err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
  res.status(status).json({ error: err.message || `${label} is unavailable right now.` });
}

export const postReportSummary = asyncHandler(async (req, res) => {
  const errors = validateReportSummaryRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/explanation/report-summary: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  const { chart, report, history } = req.body;
  try {
    const result = await getReportSummary({ chart, report, history });
    res.json(result);
  } catch (err) {
    handleGeminiError(res, err, "The AI Report Summary");
  }
});

export const postConfidenceExplanation = asyncHandler(async (req, res) => {
  const errors = validateConfidenceExplanationRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/explanation/confidence: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  const { chart, report, category, history } = req.body;
  try {
    const result = await getConfidenceExplanation({ chart, report, category, history });
    res.json(result);
  } catch (err) {
    handleGeminiError(res, err, "The Confidence Explanation");
  }
});

export const postPredictionEvidence = asyncHandler(async (req, res) => {
  const errors = validatePredictionEvidenceRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/explanation/prediction-evidence: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  const { chart, report, category, history } = req.body;
  try {
    const result = await getPredictionEvidence({ chart, report, category, history });
    res.json(result);
  } catch (err) {
    handleGeminiError(res, err, "The Prediction Evidence");
  }
});

export const postRemedyExplanation = asyncHandler(async (req, res) => {
  const errors = validateRemedyExplanationRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/explanation/remedy: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  const { chart, report, remedyType, history } = req.body;
  try {
    const result = await getRemedyExplanation({ chart, report, remedyType, history });
    res.json(result);
  } catch (err) {
    handleGeminiError(res, err, "The Remedy Explanation");
  }
});

export const postCrossLinks = asyncHandler(async (req, res) => {
  const errors = validateCrossLinkRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/explanation/cross-links: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }
  const { chart, itemType, itemId, itemLabel, planet, category } = req.body;
  try {
    const result = await getCrossLinks({ chart, itemType, itemId, itemLabel, planet, category });
    res.json(result);
  } catch (err) {
    // getCrossLinks never calls Gemini, so this branch only ever handles
    // an unexpected internal failure (e.g. a malformed chart object) —
    // still shaped consistently with every other explanation endpoint.
    handleGeminiError(res, err, "Explorer/Timeline cross-linking");
  }
});

export default {
  postReportSummary,
  postConfidenceExplanation,
  postPredictionEvidence,
  postRemedyExplanation,
  postCrossLinks,
};
