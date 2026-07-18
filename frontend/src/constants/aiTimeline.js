// ─────────────────────────────────────────────────────────────────────────
// AI Timeline constants — V5.2 (AI Timeline)
// Mirrors constants/astrology.js's role for the rest of the app: a single
// source of truth for display order/labels, imported wherever needed
// instead of re-declared. Section keys match
// backend/services/astrology/aiTimelineEngine.js's output keys and
// backend/validators/aiTimeline.validator.js's AI_TIMELINE_SECTIONS
// exactly (kept in sync by convention, same as every other backend/
// frontend constant pair in this app).
// ─────────────────────────────────────────────────────────────────────────
export const TIMELINE_SECTIONS = [
  { key: "past", label: "Past", icon: "📜" },
  { key: "present", label: "Present", icon: "🕰️" },
  { key: "nearFuture", label: "Near Future", icon: "🌅" },
  { key: "nextMonth", label: "Next Month", icon: "🌒" },
  { key: "next3Months", label: "Next 3 Months", icon: "🌓" },
  { key: "next6Months", label: "Next 6 Months", icon: "🌔" },
  { key: "nextYear", label: "Next Year", icon: "🌕" },
];

// The eight life-area filters from the V5.2 spec. "filterCategory" values
// on each event (see predictionApiMapper.js#mapAiTimelineEvent) always
// match one of these keys exactly.
export const TIMELINE_FILTER_CATEGORIES = [
  { key: "career", label: "Career", icon: "💼" },
  { key: "finance", label: "Finance", icon: "💰" },
  { key: "love", label: "Love", icon: "❤️" },
  { key: "marriage", label: "Marriage", icon: "💍" },
  { key: "health", label: "Health", icon: "🩺" },
  { key: "education", label: "Education", icon: "🎓" },
  { key: "family", label: "Family", icon: "👨‍👩‍👧" },
  { key: "spiritual", label: "Spiritual", icon: "🕉️" },
];

export default { TIMELINE_SECTIONS, TIMELINE_FILTER_CATEGORIES };
