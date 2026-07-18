// ─────────────────────────────────────────────────────────────────────────
// Notification Validator (V4.4 Phase 1 — Notification Infrastructure)
// Validates/sanitizes the notification model's fields. Mirrors the exact
// pattern familyProfile.validator.js already uses (a plain
// sanitize/validate pair, never throws, returns an errors array).
//
// This phase never generates notifications automatically (see the Phase 1
// spec's "AI Rules" section — no AI-generated notifications, no
// AI-calculated priorities). This validator is infrastructure: it defines
// the closed set of Categories/Priorities the model supports and enforces
// that any notification record — however it's created — conforms to one
// of them. Priority is never freeform text; it must be one of the four
// canonical values below, which is what "priority comes from backend
// logic, not from arbitrary caller input" means in practice.
// ─────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "system", "reminder", "ai", "panchang", "muhurat",
  "prediction", "transit", "family", "festival", "general",
];

export const PRIORITIES = ["critical", "high", "medium", "low"];

const VALID_CATEGORIES = new Set(CATEGORIES);
const VALID_PRIORITIES = new Set(PRIORITIES);

const MAX_TITLE_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 1000;

function cleanString(value, maxLength) {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const trimmed = stripped.trim();
  return maxLength && trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

// Returns a sanitized copy of a notification request body. Safe to call on
// any input — never throws (mirrors sanitizeFamilyProfile's contract).
export function sanitizeNotification(body) {
  const title = cleanString(body?.title, MAX_TITLE_LENGTH);
  const message = cleanString(body?.message, MAX_MESSAGE_LENGTH);
  const category = typeof body?.category === "string" ? body.category.trim().toLowerCase() : "general";
  const priority = typeof body?.priority === "string" ? body.priority.trim().toLowerCase() : "medium";
  const expiresAt = typeof body?.expiresAt === "string" && body.expiresAt.trim() ? body.expiresAt.trim() : null;
  const metadata = body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? body.metadata
    : {};
  return { title, message, category, priority, expiresAt, metadata };
}

export function validateNotification(notification) {
  const errors = [];
  if (!notification?.title) errors.push("title is required");
  if (!notification?.message) errors.push("message is required");
  if (!notification?.category || !VALID_CATEGORIES.has(notification.category)) {
    errors.push(`category is required and must be one of ${CATEGORIES.join(", ")}`);
  }
  if (!notification?.priority || !VALID_PRIORITIES.has(notification.priority)) {
    errors.push(`priority is required and must be one of ${PRIORITIES.join(", ")}`);
  }
  if (notification?.expiresAt && Number.isNaN(Date.parse(notification.expiresAt))) {
    errors.push("expiresAt must be a valid ISO date string");
  }
  return errors;
}

export default { CATEGORIES, PRIORITIES, sanitizeNotification, validateNotification };
