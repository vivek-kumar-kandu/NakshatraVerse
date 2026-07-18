// ─────────────────────────────────────────────────────────────────────────
// Personal Intent Detector — AI Assistant Two-Mode Chat
// Single responsibility: decide whether a free-text chat question is asking
// about the PERSON's own chart ("Explain my Nakshatra", "Which planet is
// strongest in my chart?", "Explain my Dasha") vs. a general/educational
// astrology question that needs no chart at all ("What is a Nakshatra?",
// "How does Vedic astrology differ from Western astrology?").
//
// This is a pure, deterministic, keyword/pattern-based heuristic — no LLM
// call, no astrology calculation. It only ever gates whether
// assistantService requires `chart` to answer; it never itself decides the
// content of an answer.
//
// The heuristic is intentionally conservative in one direction only: it
// prefers to treat an ambiguous question as "general" rather than block it,
// since the general-mode prompt already tells Gemini to invite the person
// to open/generate their report whenever a question actually turns out to
// need personal data it doesn't have.
// ─────────────────────────────────────────────────────────────────────────

// First-person references — "my", "mine", "i'm"/"im", "i am", or a bare
// leading "I"/"me" — that, combined with an astrology-domain keyword below,
// signal the person is asking about THEIR OWN chart.
const FIRST_PERSON_RE = /\b(my|mine|i'm|im|i\s+am)\b/i;

// Astrology-domain keywords/phrases that are personal-chart concepts when
// paired with a first-person reference above.
const PERSONAL_DOMAIN_RE = new RegExp(
  [
    "chart", "nakshatra", "dasha", "dosha", "yoga", "planet", "house",
    "lagna", "ascendant", "rashi", "moon sign", "sun sign", "kundli",
    "horoscope", "numerology", "mulank", "bhagyank", "remedy", "remedies",
    "prediction", "report", "reading", "transit", "mahadasha", "antardasha",
    "birth chart", "marriage", "career", "finance", "health", "love life",
    "future", "life summary",
  ].join("|"),
  "i"
);

// Direct personal-fortune phrasing that's unambiguous even without one of
// the domain keywords above, e.g. "Will I get married?", "When will I get
// a promotion?", "Am I going to be rich?".
const DIRECT_PERSONAL_RE = /\b(will i|am i going to|when will i|what does my future|what will happen to me|is it a good time for me)\b/i;

// Explicit "my <astrology-thing>" phrasing — covers cases where the domain
// word immediately follows "my" even if it's not in PERSONAL_DOMAIN_RE
// (defense in depth; the two lists overlap heavily on purpose).
const MY_THING_RE = /\bmy\s+(chart|report|reading|horoscope|birth\s*chart|kundli|nakshatra|dasha|dosha|yoga|numerology|remedies?|prediction|lagna|ascendant|rashi)\b/i;

/**
 * Returns true if `question` depends on the person's own backend-generated
 * chart to answer correctly, false if it can be answered as general
 * astrology knowledge/education.
 */
export function requiresPersonalChart(question) {
  const q = typeof question === "string" ? question.trim() : "";
  if (!q) return false;

  if (MY_THING_RE.test(q)) return true;
  if (DIRECT_PERSONAL_RE.test(q)) return true;
  if (FIRST_PERSON_RE.test(q) && PERSONAL_DOMAIN_RE.test(q)) return true;

  return false;
}

export default { requiresPersonalChart };
