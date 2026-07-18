// ─────────────────────────────────────────────────────────────────────────
// AI Timeline Validator — V5.2 (AI Timeline)
// Validates a POST /api/ai-timeline/explain body. Mirrors
// explorerAi.validator.js's exact pattern (same REQUIRED_CHART_FIELDS
// contract — AI Timeline consumes the same backend-generated chart object
// the AI Assistant/Explorer AI already does): pure functions, no framework
// coupling, so the controller stays thin.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";

const REQUIRED_CHART_FIELDS = ["userData", "planetary", "numerology", "lagna", "moonSign", "sunSign", "nakshatra"];

// The 7 AI Timeline sections (frontend/src/constants/aiTimeline.js). Kept
// as a literal list rather than importing the frontend constant —
// backend/frontend stay decoupled, same pattern explorerAi.validator.js's
// EXPLORER_ITEM_TYPES already follows.
export const AI_TIMELINE_SECTIONS = [
  "past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear",
];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateAiTimelineRequest(body) {
  const errors = [];
  const { chart, event, history } = body || {};

  if (!chart || typeof chart !== "object") {
    errors.push("chart is required and must be the backend-generated chart object.");
  } else {
    for (const field of REQUIRED_CHART_FIELDS) {
      if (chart[field] === undefined || chart[field] === null) {
        errors.push(`chart.${field} is required.`);
      }
    }
  }

  if (!event || typeof event !== "object") {
    errors.push("event is required and must be the selected AI Timeline event object.");
  } else {
    if (!isNonEmptyString(event.id)) {
      errors.push("event.id is required and must be a non-empty string.");
    } else if (event.id.length > config.AI_TIMELINE_MAX_LABEL_LENGTH) {
      errors.push(`event.id must be ${config.AI_TIMELINE_MAX_LABEL_LENGTH} characters or fewer.`);
    }
    if (!isNonEmptyString(event.section) || !AI_TIMELINE_SECTIONS.includes(event.section)) {
      errors.push(`event.section is required and must be one of: ${AI_TIMELINE_SECTIONS.join(", ")}.`);
    }
    if (event.category !== undefined && event.category !== null && typeof event.category !== "string") {
      errors.push("event.category must be a string when provided.");
    }
    // contextFacts is optional, additive, backend-authoritative-only
    // context already computed for this event (see
    // predictionApiMapper.js#mapAiTimelineEvent's GeminiExplanationContext
    // equivalent) — never computed here, only forwarded as grounding data.
    if (event.contextFacts !== undefined && event.contextFacts !== null && typeof event.contextFacts !== "object") {
      errors.push("event.contextFacts must be an object when provided.");
    }
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

export default { validateAiTimelineRequest, AI_TIMELINE_SECTIONS };
