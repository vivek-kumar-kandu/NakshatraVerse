// ─────────────────────────────────────────────────────────────────────────
// Explanation Validator — V5.3 (Explainable Report Intelligence)
// Validates each POST /api/explanation/* body. Mirrors
// explorerAi.validator.js/aiTimeline.validator.js's exact pattern (same
// REQUIRED_CHART_FIELDS contract — the Explanation Engine consumes the
// same backend-generated chart object every other AI surface does): pure
// functions, no framework coupling, so the controller stays thin.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";

const REQUIRED_CHART_FIELDS = ["userData", "planetary", "numerology", "lagna", "moonSign", "sunSign", "nakshatra"];

function validateChart(chart, errors) {
  if (!chart || typeof chart !== "object") {
    errors.push("chart is required and must be the backend-generated chart object.");
    return;
  }
  for (const field of REQUIRED_CHART_FIELDS) {
    if (chart[field] === undefined || chart[field] === null) {
      errors.push(`chart.${field} is required.`);
    }
  }
}

function validateHistory(history, errors) {
  if (history === undefined) return;
  if (!Array.isArray(history)) {
    errors.push("history must be an array when provided.");
  } else if (history.some((turn) => !turn || (turn.role !== "user" && turn.role !== "assistant") || typeof turn.content !== "string")) {
    errors.push("Each history entry must be { role: 'user'|'assistant', content: string }.");
  }
}

function validateLabelField(value, fieldName, errors, { required = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) errors.push(`${fieldName} is required and must be a non-empty string.`);
    return;
  }
  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string.`);
  } else if (value.length > config.EXPLANATION_MAX_LABEL_LENGTH) {
    errors.push(`${fieldName} must be ${config.EXPLANATION_MAX_LABEL_LENGTH} characters or fewer.`);
  }
}

export function validateReportSummaryRequest(body) {
  const errors = [];
  const { chart, history } = body || {};
  validateChart(chart, errors);
  validateHistory(history, errors);
  return errors;
}

export function validateConfidenceExplanationRequest(body) {
  const errors = [];
  const { chart, category, history } = body || {};
  validateChart(chart, errors);
  validateLabelField(category, "category", errors);
  validateHistory(history, errors);
  return errors;
}

export function validatePredictionEvidenceRequest(body) {
  const errors = [];
  const { chart, category, history } = body || {};
  validateChart(chart, errors);
  validateLabelField(category, "category", errors);
  validateHistory(history, errors);
  return errors;
}

export function validateRemedyExplanationRequest(body) {
  const errors = [];
  const { chart, remedyType, history } = body || {};
  validateChart(chart, errors);
  validateLabelField(remedyType, "remedyType", errors);
  validateHistory(history, errors);
  return errors;
}

const CROSS_LINK_ITEM_TYPES = ["planet", "house", "sign", "yoga", "dosha", "nakshatra", "ascendant", "aspect", "category"];

export function validateCrossLinkRequest(body) {
  const errors = [];
  const { chart, itemType, itemId, itemLabel, planet, category } = body || {};
  validateChart(chart, errors);

  if (itemType !== undefined && itemType !== null && !CROSS_LINK_ITEM_TYPES.includes(itemType)) {
    errors.push(`itemType must be one of: ${CROSS_LINK_ITEM_TYPES.join(", ")}.`);
  }
  if (itemId !== undefined && itemId !== null && typeof itemId !== "string") {
    errors.push("itemId must be a string when provided.");
  }
  validateLabelField(itemLabel, "itemLabel", errors, { required: false });
  validateLabelField(planet, "planet", errors, { required: false });
  validateLabelField(category, "category", errors, { required: false });

  if (!itemLabel && !planet && !category) {
    errors.push("At least one of itemLabel, planet, or category is required to compute cross-links.");
  }

  return errors;
}

export default {
  validateReportSummaryRequest,
  validateConfidenceExplanationRequest,
  validatePredictionEvidenceRequest,
  validateRemedyExplanationRequest,
  validateCrossLinkRequest,
  CROSS_LINK_ITEM_TYPES,
};
