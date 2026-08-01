// ─────────────────────────────────────────────────────────────────────────
// aiLanguageInstruction (Multilingual Foundation Phase)
//
// Single shared helper every Gemini prompt builder calls to append a
// "respond in <language>" instruction to its prompt. Centralizing this in
// one place means:
//   - every AI prompt builder localizes the same way (no drifting wording)
//   - turning on a new language for AI responses is a one-line addition to
//     LANGUAGE_NAMES below, not a change to every prompt builder
//   - English (the default/source language) is a deliberate no-op: this
//     returns "" for "en", so every existing prompt's exact text — and
//     therefore every existing test/snapshot that asserts on prompt
//     content — is completely unchanged by this phase.
//
// Per Phase 8/9 of the multilingual migration: Gemini is asked to respond
// DIRECTLY in the target language (never "answer in English, then
// translate"), and this instruction only ever wraps the *narrative*
// portions of a prompt — it never asks the model to translate canonical
// identifiers (planet/house/nakshatra/yoga/dosha names, dates, numbers),
// which every prompt builder already instructs Gemini to treat as fixed,
// backend-computed facts.
// ─────────────────────────────────────────────────────────────────────────

// Display names used in the instruction sent to Gemini. Only the languages
// actually offered to users need an entry here; anything missing safely
// falls back to the language code itself.
export const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  sa: "Sanskrit",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  or: "Odia",
  as: "Assamese",
  ne: "Nepali",
  ur: "Urdu",
};

export const DEFAULT_LANGUAGE = "en";

/**
 * Returns a short instruction block to append to a Gemini prompt asking it
 * to respond in `language`, or "" for the default language (English) so
 * today's prompts/tests are unaffected.
 *
 * Deliberately narrative-only: callers append this near the end of a
 * prompt, after all the "never invent/never recalculate" rules and the
 * backend-computed facts section, so it reads as a formatting/language
 * instruction rather than something that could be mistaken for license to
 * alter the underlying facts.
 */
export function getAiLanguageInstruction(language) {
  const code = (language || DEFAULT_LANGUAGE).toLowerCase();
  if (code === DEFAULT_LANGUAGE) return "";
  const name = LANGUAGE_NAMES[code] || code;
  return `\n\nRespond in ${name} (language code: ${code}). Write all narrative text — explanations, summaries, recommendations — in ${name}. Do NOT translate proper nouns that are canonical identifiers (planet names like Sun/Moon/Mars, house numbers, Nakshatra/Yoga/Dosha names, dates, or numeric values) unless a well-established ${name} astrological term for them exists; when in doubt, keep the original term and explain it in ${name}.`;
}

export default { LANGUAGE_NAMES, DEFAULT_LANGUAGE, getAiLanguageInstruction };
