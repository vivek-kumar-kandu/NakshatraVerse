// ─────────────────────────────────────────────────────────────────────────
// Phase 3 — AI Report Premium Presentation
//
// Small, presentation-only helpers shared by `AiText` and `KeyHighlights`.
// The backend/Gemini always return each report field as a single plain
// string (see backend/services/ai/promptBuilder.js — "N-M sentences…").
// These helpers split that string into sentences purely so the frontend
// can style the opening sentence as a lead-in and stagger the rest in —
// they never alter, summarize, or regenerate the AI's actual words.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Splits a plain-text AI report string into its constituent sentences.
 * Falls back gracefully for strings with no terminal punctuation (e.g.
 * short test fixtures like "a") by returning the whole string as one
 * "sentence" instead of throwing or returning nothing.
 */
export function splitSentences(text) {
  if (!text || typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  const matches = trimmed.match(/[^.!?]+[.!?]+(?:["')\]]*\s*)|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [trimmed];
}

/** Returns just the first sentence of an AI report field, or "" if empty. */
export function leadSentence(text) {
  const [lead] = splitSentences(text);
  return lead || "";
}
