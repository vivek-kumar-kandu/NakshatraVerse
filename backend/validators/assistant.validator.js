// ─────────────────────────────────────────────────────────────────────────
// Assistant Chat Validator — V3.0 Phase 4 (AI Astrology Assistant)
// V4.5 Phase 4 (AI Report Chat): additive-only — accepts three new,
// entirely optional context objects (festivalContext/panchangContext/
// muhuratContext) so a caller that has already fetched Festival
// Intelligence/Panchang/Muhurat data for the person can hand it to the
// chat as extra backend-authoritative facts. None of these are required;
// omitting them keeps the exact V3.0 Phase 4 behavior.
// Validates a POST /api/assistant/chat body. Mirrors the style of
// birthData.validator.js: pure functions, no framework coupling, so the
// controller stays thin.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";

const REQUIRED_CHART_FIELDS = ["userData", "planetary", "numerology", "lagna", "moonSign", "sunSign", "nakshatra"];
const OPTIONAL_CONTEXT_FIELDS = ["festivalContext", "panchangContext", "muhuratContext"];

export function validateChatRequest(body) {
  const errors = [];
  const { chart, question, history } = body || {};

  for (const field of OPTIONAL_CONTEXT_FIELDS) {
    const value = body?.[field];
    if (value !== undefined && value !== null && typeof value !== "object") {
      errors.push(`${field} must be an object when provided.`);
    }
  }

  if (!chart || typeof chart !== "object") {
    errors.push("chart is required and must be the backend-generated chart object.");
  } else {
    for (const field of REQUIRED_CHART_FIELDS) {
      if (chart[field] === undefined || chart[field] === null) {
        errors.push(`chart.${field} is required.`);
      }
    }
  }

  if (typeof question !== "string" || !question.trim()) {
    errors.push("question is required and must be a non-empty string.");
  } else if (question.length > config.ASSISTANT_MAX_QUESTION_LENGTH) {
    errors.push(`question must be ${config.ASSISTANT_MAX_QUESTION_LENGTH} characters or fewer.`);
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

// Keeps only the most recent N turns so the prompt sent to Gemini stays
// bounded in size regardless of how long the chat session has run.
export function trimHistory(history) {
  if (!Array.isArray(history) || !history.length) return [];
  const max = config.ASSISTANT_MAX_HISTORY_TURNS;
  return history.slice(Math.max(0, history.length - max));
}

export default { validateChatRequest, trimHistory };
