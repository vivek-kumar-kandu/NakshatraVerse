// ─────────────────────────────────────────────────────────────────────────
// Centralized error handling.
//
// - asyncHandler: wraps an async route/controller function so any thrown
//   error (or rejected promise) is forwarded to Express's error-handling
//   middleware via next(err), instead of every controller needing its own
//   try/catch.
// - notFoundHandler: same JSON 404 shape as before.
// - errorHandler: centralized error-handling middleware. Behavior for
//   every *curated* error path (validation messages, Gemini error
//   messages, JSON parse errors) is unchanged — those already contain
//   safe, actionable text and never included stack traces. The one thing
//   Priority 4 changes: a truly *unexpected* error (a bug, not one of the
//   handled cases above) now returns a generic, safe message in production
//   instead of potentially leaking err.message (which could echo internal
//   file paths, library internals, etc.), while still logging the full
//   error server-side for debugging. In development, the original
//   err.message is still surfaced to make local debugging easy.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import config from "../config/env.js";

export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route ${req.method} ${req.originalUrl}` });
}

// Errors thrown by our own code (validation, Gemini service, etc.) already
// carry a deliberately-written, safe `.message` plus sometimes `.status`;
// we treat those as "curated" and pass them straight through unchanged, as
// before. Anything else (e.g. a genuine bug throwing a raw JS error) is
// treated as unexpected and gets a generic message in production.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(`Express error handler caught${req?.id ? ` [${req.id}]` : ""}:`, err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in request body." });
  }

  // Body too large (from the Priority 4 express.json size limit).
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large." });
  }

  const status = err.status || 500;
  // A curated error is one our own code constructed on purpose: it has an
  // explicit status code already set (validation/Gemini errors always do).
  // A bare 500 with no status is the signature of an unhandled exception,
  // which is exactly the case where we don't want to echo err.message
  // verbatim in production.
  const isCurated = Boolean(err.status);
  const safeMessage =
    isCurated || !config.IS_PRODUCTION
      ? err.message || "Internal server error."
      : "Internal server error. Please try again, and contact support if the problem persists.";

  const body = { error: safeMessage };
  if (err.detail !== undefined) body.detail = err.detail;
  if (err.raw !== undefined) body.raw = err.raw;
  res.status(status).json(body);
}

export default { asyncHandler, notFoundHandler, errorHandler };
