// ─────────────────────────────────────────────────────────────────────────
// Input Validation
// Single responsibility: validate the shape of birth data coming from the
// client before it ever reaches the astrology engine. Rules/messages for
// validateBirthFields are unchanged from before Priority 4 — every request
// that used to pass still passes, and every error message is identical.
//
// Priority 4 addition: sanitizeBirthFields(), a new, separate function that
// trims strings and strips control characters before validation runs. It
// is purely defensive (guards against null-byte/control-character
// injection and leading/trailing whitespace confusing downstream string
// comparisons) and never rejects input on its own — only
// validateBirthFields decides pass/fail, exactly as before. Also caps
// pathological input length (10,000 chars) to reject obvious abuse/DoS
// payloads; no real name/place-of-birth is anywhere near that long.
// ─────────────────────────────────────────────────────────────────────────

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD (native <input type="date"> format)
const TOB_RE = /^\d{2}:\d{2}$/; // HH:MM (native <input type="time"> format)
const MAX_FIELD_LENGTH = 10000; // generous ceiling; only rejects abuse, never real input

// Strips ASCII control characters (including null bytes) and trims
// surrounding whitespace. Non-string values are returned unchanged so
// downstream validation still reports its normal "X is required" error
// instead of throwing on `.replace`.
function cleanString(value) {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const trimmed = stripped.trim();
  return trimmed.length > MAX_FIELD_LENGTH ? trimmed.slice(0, MAX_FIELD_LENGTH) : trimmed;
}

/**
 * Returns a new object with name/dob/tob/pob sanitized (trimmed, control
 * characters stripped, length-capped). Safe to call on any request body
 * before validation/use — never throws, never changes a value that was
 * already clean.
 */
export function sanitizeBirthFields({ name, dob, tob, pob } = {}) {
  return {
    name: cleanString(name),
    dob: cleanString(dob),
    tob: cleanString(tob),
    pob: cleanString(pob),
  };
}

export function validateBirthFields({ name, dob, tob, pob } = {}) {
  const errors = [];
  if (!name || !String(name).trim()) errors.push("name is required");
  if (!dob || !DOB_RE.test(dob)) errors.push("dob must be in YYYY-MM-DD format");
  if (!tob || !TOB_RE.test(tob)) errors.push("tob must be in HH:MM format");
  if (!pob || !String(pob).trim()) errors.push("pob is required");
  return errors;
}

export default { validateBirthFields, sanitizeBirthFields };
