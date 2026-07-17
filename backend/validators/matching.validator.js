// ─────────────────────────────────────────────────────────────────────────
// Kundli Matching Validator (V4.0 Phase 1)
// Validates a POST /api/matching/* body carrying two people's birth data.
// Reuses validateBirthFields/sanitizeBirthFields from birthData.validator.js
// for name/dob/tob/pob (completely unmodified), and adds only the one new
// field Kundli Matching needs: gender.
// ─────────────────────────────────────────────────────────────────────────
import { validateBirthFields, sanitizeBirthFields } from "./birthData.validator.js";

const VALID_GENDERS = new Set(["male", "female", "other"]);

export function sanitizePerson(person) {
  const base = sanitizeBirthFields(person || {});
  const gender = typeof person?.gender === "string" ? person.gender.trim().toLowerCase() : "";
  return { ...base, gender };
}

export function validatePerson(person, label) {
  const errors = validateBirthFields(person).map((e) => `${label}: ${e}`);
  if (!person?.gender || !VALID_GENDERS.has(person.gender)) {
    errors.push(`${label}: gender is required and must be one of male, female, other`);
  }
  return errors;
}

export function validateMatchingRequest(body) {
  const personA = sanitizePerson(body?.personA);
  const personB = sanitizePerson(body?.personB);
  const errors = [
    ...validatePerson(personA, "personA"),
    ...validatePerson(personB, "personB"),
  ];
  return { errors, personA, personB };
}

export default { sanitizePerson, validatePerson, validateMatchingRequest };
