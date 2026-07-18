// ─────────────────────────────────────────────────────────────────────────
// Family Profile constants (V4.2 — Family Profiles & Relationship Hub)
// Mirrors backend/validators/familyProfile.validator.js's RELATIONSHIPS
// list exactly — kept as a small, standalone frontend constant (like
// constants/astrology.js already does for other shared values) rather
// than importing backend code into the frontend bundle.
// ─────────────────────────────────────────────────────────────────────────

export const RELATIONSHIPS = [
  "father", "mother", "husband", "wife", "son", "daughter",
  "brother", "sister", "friend", "client", "custom",
];

export default { RELATIONSHIPS };
