// ─────────────────────────────────────────────────────────────────────────
// Explorer AI Validator — V5.0 Phase 5C (Explorer AI Explanations)
// Validates a POST /api/explorer-ai/explain body. Mirrors
// assistant.validator.js's exact pattern (same REQUIRED_CHART_FIELDS
// contract — Explorer AI consumes the same backend-generated chart object
// the AI Assistant/AI Report Chat already does): pure functions, no
// framework coupling, so the controller stays thin.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";

const REQUIRED_CHART_FIELDS = ["userData", "planetary", "numerology", "lagna", "moonSign", "sunSign", "nakshatra"];

// The eight Explorer selection types (frontend/src/constants/explorer.js).
// Kept as a literal list rather than importing the frontend constant —
// backend/frontend stay decoupled, same pattern every other validator in
// this codebase already follows.
export const EXPLORER_ITEM_TYPES = [
  "planet", "house", "sign", "yoga", "dosha", "nakshatra", "ascendant", "aspect",
];

export function validateExplorerAiRequest(body) {
  const errors = [];
  const { chart, itemType, itemId, itemLabel, contextFacts, history } = body || {};

  if (!chart || typeof chart !== "object") {
    errors.push("chart is required and must be the backend-generated chart object.");
  } else {
    for (const field of REQUIRED_CHART_FIELDS) {
      if (chart[field] === undefined || chart[field] === null) {
        errors.push(`chart.${field} is required.`);
      }
    }
  }

  if (typeof itemType !== "string" || !EXPLORER_ITEM_TYPES.includes(itemType)) {
    errors.push(`itemType is required and must be one of: ${EXPLORER_ITEM_TYPES.join(", ")}.`);
  }

  if (typeof itemLabel !== "string" || !itemLabel.trim()) {
    errors.push("itemLabel is required and must be a non-empty string.");
  } else if (itemLabel.length > config.EXPLORER_AI_MAX_LABEL_LENGTH) {
    errors.push(`itemLabel must be ${config.EXPLORER_AI_MAX_LABEL_LENGTH} characters or fewer.`);
  }

  if (itemId !== undefined && itemId !== null && typeof itemId !== "string") {
    errors.push("itemId must be a string when provided.");
  }

  // contextFacts is optional, additive, backend-authoritative-only context
  // the frontend detail panel has already resolved from `report` (position,
  // strength, dignity, aspect influence, nakshatra profile, etc.) — never
  // computed here, only forwarded to the prompt builder as grounding data.
  if (contextFacts !== undefined && contextFacts !== null && typeof contextFacts !== "object") {
    errors.push("contextFacts must be an object when provided.");
  }

  if (history !== undefined) {
    if (!Array.isArray(history)) {
      errors.push("history must be an array when provided.");
    } else if (history.some((turn) => !turn || (turn.role !== "user" && turn.role !== "assistant") || typeof turn.content !== "string")) {
      errors.push("Each history entry must be { role: 'user'|'assistant', content: string }.");
    }
  }

  return errors;
}

export default { validateExplorerAiRequest, EXPLORER_ITEM_TYPES };
