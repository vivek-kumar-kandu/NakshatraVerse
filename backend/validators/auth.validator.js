// ─────────────────────────────────────────────────────────────────────────
// Auth Validation (Priority 5.2)
// Mirrors the pattern already established in birthData.validator.js:
// sanitize first (trim/strip control chars), then validate shape/policy.
// Kept as its own module (rather than extending birthData.validator.js)
// since it validates an unrelated domain (accounts, not birth data) and
// birthData.validator.js is a completed component we're told not to touch
// unless necessary.
// ─────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 254; // generous; RFC 5321 email length ceiling

<<<<<<< HEAD
=======
// Plain-English fallback so any caller that doesn't pass `t` (e.g. an
// existing unit test constructed before Phase 3.6's localization, or a
// script invoking these validators directly outside a request) keeps
// getting the exact same strings as before — localization is additive,
// nothing that previously worked changes shape.
const DEFAULT_MESSAGES = {
  "validation.nameRequired": "name is required",
  "validation.validEmailRequired": "a valid email is required",
  "validation.passwordMinLength": "password must be at least 8 characters",
  "validation.passwordNeedsNumber": "password must contain at least one number",
  "validation.passwordRequired": "password is required",
};

>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
function cleanString(value) {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const trimmed = stripped.trim();
  return trimmed.length > MAX_FIELD_LENGTH ? trimmed.slice(0, MAX_FIELD_LENGTH) : trimmed;
}

export function sanitizeAuthFields({ name, email, password } = {}) {
  return {
    name: cleanString(name),
    email: cleanString(email),
    // Passwords are never trimmed/length-capped here beyond a sane ceiling
    // — legitimate passwords can contain leading/trailing-meaningful
    // characters. Only strip control characters and cap pathological length.
    password: typeof password === "string" ? password.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 1024) : password, // eslint-disable-line no-control-regex
  };
}

<<<<<<< HEAD
export function validateRegisterFields({ name, email, password } = {}) {
  const errors = [];
  if (!name || !String(name).trim()) errors.push("name is required");
  if (!email || !EMAIL_RE.test(email)) errors.push("a valid email is required");
  if (!password || String(password).length < 8) errors.push("password must be at least 8 characters");
  if (password && String(password).length > 0 && !/[0-9]/.test(password)) errors.push("password must contain at least one number");
  return errors;
}

export function validateLoginFields({ email, password } = {}) {
  const errors = [];
  if (!email || !EMAIL_RE.test(email)) errors.push("a valid email is required");
  if (!password) errors.push("password is required");
=======
export function validateRegisterFields({ name, email, password } = {}, t) {
  const tr = t || ((key) => DEFAULT_MESSAGES[key]);
  const errors = [];
  if (!name || !String(name).trim()) errors.push(tr("validation.nameRequired"));
  if (!email || !EMAIL_RE.test(email)) errors.push(tr("validation.validEmailRequired"));
  if (!password || String(password).length < 8) errors.push(tr("validation.passwordMinLength"));
  if (password && String(password).length > 0 && !/[0-9]/.test(password)) errors.push(tr("validation.passwordNeedsNumber"));
  return errors;
}

export function validateLoginFields({ email, password } = {}, t) {
  const tr = t || ((key) => DEFAULT_MESSAGES[key]);
  const errors = [];
  if (!email || !EMAIL_RE.test(email)) errors.push(tr("validation.validEmailRequired"));
  if (!password) errors.push(tr("validation.passwordRequired"));
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  return errors;
}

export default { sanitizeAuthFields, validateRegisterFields, validateLoginFields };
