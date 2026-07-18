// ─────────────────────────────────────────────────────────────────────────
// Family Profile Validator (V4.2 — Family Profiles & Relationship Hub)
// Validates a saved Family Profile's fields. Reuses
// validateBirthFields/sanitizeBirthFields from birthData.validator.js for
// name/dob/tob/pob (completely unmodified — the same fields/format every
// other birth-data form in this app already requires), the exact same
// pattern matching.validator.js already uses for gender. Adds only the
// two fields this module needs that nothing else does: relationship and
// an optional custom relationship label.
// ─────────────────────────────────────────────────────────────────────────
import { validateBirthFields, sanitizeBirthFields } from "./birthData.validator.js";

export const RELATIONSHIPS = [
  "father", "mother", "husband", "wife", "son", "daughter",
  "brother", "sister", "friend", "client", "custom",
];

const VALID_RELATIONSHIPS = new Set(RELATIONSHIPS);
const VALID_GENDERS = new Set(["male", "female", "other"]);
const MAX_LABEL_LENGTH = 60;

function cleanString(value) {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const trimmed = stripped.trim();
  return trimmed.length > MAX_LABEL_LENGTH ? trimmed.slice(0, MAX_LABEL_LENGTH) : trimmed;
}

// Returns a sanitized copy of a family-profile request body. Safe to call
// on any input — never throws (mirrors sanitizeBirthFields' contract).
export function sanitizeFamilyProfile(body) {
  const base = sanitizeBirthFields(body || {});
  const relationship = typeof body?.relationship === "string" ? body.relationship.trim().toLowerCase() : "";
  const customRelationshipLabel = cleanString(body?.customRelationshipLabel);
  const gender = typeof body?.gender === "string" ? body.gender.trim().toLowerCase() : "";
  return { ...base, relationship, customRelationshipLabel, gender };
}

export function validateFamilyProfile(profile) {
  const errors = validateBirthFields(profile);
  if (!profile?.relationship || !VALID_RELATIONSHIPS.has(profile.relationship)) {
    errors.push(`relationship is required and must be one of ${RELATIONSHIPS.join(", ")}`);
  }
  if (profile?.relationship === "custom" && !profile?.customRelationshipLabel) {
    errors.push("customRelationshipLabel is required when relationship is 'custom'");
  }
  if (profile?.gender && !VALID_GENDERS.has(profile.gender)) {
    errors.push("gender must be one of male, female, other");
  }
  return errors;
}

export default { RELATIONSHIPS, sanitizeFamilyProfile, validateFamilyProfile };
