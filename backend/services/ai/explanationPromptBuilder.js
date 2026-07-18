// ─────────────────────────────────────────────────────────────────────────
// Explanation Prompt Builder — V5.3 (Explainable Report Intelligence)
//
// Single responsibility: the ONE shared place that turns an "explanation
// request" (a kind + a subject + a backend-authored focus instruction +
// optional grounding facts) into the deterministic "question" text that
// buildChatPrompt() (chatPromptBuilder.js — UNMODIFIED) already knows how
// to wrap with the full facts/rules/JSON-contract prompt.
//
// This does not replace buildChatPrompt() or buildPrompt() — it sits one
// layer above them. Before V5.3, every AI surface that needed a one-off
// Gemini explanation (Explorer AI, AI Timeline) hand-rolled its own
// "buildXQuestion()" function (see explorerAiService.js#buildExplorerQuestion,
// aiTimelineService.js#buildTimelineQuestion) — nearly identical logic,
// duplicated per feature. explanationEngine.js's new capabilities (Report
// Summary, Confidence Explanations, Prediction Evidence, Remedy
// Explanations) all funnel through this single builder instead of adding a
// fifth/sixth copy of that pattern.
//
// Nothing here calculates astrology. Nothing here calls Gemini. This module
// only assembles text.
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.kind - short machine label for the explanation
 *   type ("report-summary" | "confidence" | "prediction-evidence" |
 *   "remedy" | "cross-link"). Used only to phrase the question naturally.
 * @param {string} params.subject - human-readable label for what is being
 *   explained (e.g. "your overall report", "the Career prediction",
 *   "the Gemstone remedy").
 * @param {string} params.focusInstruction - backend-authored instruction
 *   describing exactly what Gemini should cover — mirrors the
 *   ITEM_TYPE_FOCUS / buildTimelineQuestion focus strings that already
 *   ship in explorerAiService.js/aiTimelineService.js.
 * @param {object} [params.contextFacts] - optional, additive, already-
 *   computed backend facts specific to this one explanation request
 *   (never invented here, only forwarded as grounding data — identical
 *   contract to explorerAiService.js's contextFacts/aiTimelineService.js's
 *   event.contextFacts).
 * @returns {string} the deterministic "question" text for buildChatPrompt().
 */
export function buildExplanationQuestion({ kind, subject, focusInstruction, contextFacts }) {
  const hasFacts = contextFacts && typeof contextFacts === "object" && Object.keys(contextFacts).length > 0;
  const factsBlock = hasFacts
    ? `\n\nBackend-Computed Context For This Specific Explanation Request (already-computed facts — treat as authoritative grounding, never invent anything beyond what's given here or in the sections above):\n${JSON.stringify(contextFacts)}`
    : "";

  return `The person requested a "${kind}" explanation for ${subject}. ${focusInstruction}${factsBlock}`;
}

/**
 * Shared entry point: builds an explanation "question" and immediately
 * wraps it with buildChatPrompt() (imported by the caller, not here, to
 * avoid a circular/duplicate dependency graph — see explanationEngine.js).
 * Kept as a pure function so it is trivially unit-testable without a
 * network call.
 */
export function buildExplanationPrompt({ buildChatPrompt, chart, report, insights, history, kind, subject, focusInstruction, contextFacts }) {
  const question = buildExplanationQuestion({ kind, subject, focusInstruction, contextFacts });
  return buildChatPrompt({
    chart,
    report: report || chart?.report,
    insights,
    history: Array.isArray(history) ? history.slice(-4) : [],
    question,
  });
}

export default { buildExplanationQuestion, buildExplanationPrompt };
