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
<<<<<<< HEAD
=======
import { translate, DEFAULT_LANGUAGE } from "../services/localization/localizationService.js";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)

export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

<<<<<<< HEAD
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route ${req.method} ${req.originalUrl}` });
=======
// Multilingual Foundation Phase: prefers req.t (set by middleware/language.js)
// but falls back to a direct translate() call against the default language
// if this handler is ever invoked without the full middleware chain (e.g.
// a unit test constructing req/res by hand) — the resolved English text is
// byte-for-byte identical to what this function returned before this
// phase, so no existing test/behavior changes.
function resolveT(req) {
  return req?.t || ((key, vars) => translate(DEFAULT_LANGUAGE, key, vars));
}

export function notFoundHandler(req, res) {
  const t = resolveT(req);
  res.status(404).json({ error: t("errors.notFound", { method: req.method, path: req.originalUrl }) });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

// Errors thrown by our own code (validation, Gemini service, etc.) already
// carry a deliberately-written, safe `.message` plus sometimes `.status`;
// we treat those as "curated" and pass them straight through unchanged, as
// before. Anything else (e.g. a genuine bug throwing a raw JS error) is
// treated as unexpected and gets a generic message in production.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(`Express error handler caught${req?.id ? ` [${req.id}]` : ""}:`, err);
<<<<<<< HEAD

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in request body." });
=======
  const t = resolveT(req);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: t("errors.malformedJson") });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }

  // Body too large (from the Priority 4 express.json size limit).
  if (err.type === "entity.too.large") {
<<<<<<< HEAD
    return res.status(413).json({ error: "Request body too large." });
=======
    return res.status(413).json({ error: t("errors.bodyTooLarge") });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }

  const status = err.status || 500;
  // A curated error is one our own code constructed on purpose: it has an
  // explicit status code already set (validation/Gemini errors always do).
  // A bare 500 with no status is the signature of an unhandled exception,
  // which is exactly the case where we don't want to echo err.message
<<<<<<< HEAD
  // verbatim in production.
  const isCurated = Boolean(err.status);
  const safeMessage =
    isCurated || !config.IS_PRODUCTION
      ? err.message || "Internal server error."
      : "Internal server error. Please try again, and contact support if the problem persists.";
=======
  // verbatim in production. err.message itself is left as-is (it's
  // constructed by the code that threw it, in whatever language that
  // call site already used — those call sites are localized incrementally
  // in later phases, not here) — only the two *generic* fallback strings
  // this handler itself owns are routed through the translator.
  const isCurated = Boolean(err.status);
  const safeMessage =
    isCurated || !config.IS_PRODUCTION
      ? err.message || t("errors.internalError")
      : t("errors.internalErrorProduction");
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)

  const body = { error: safeMessage };
  if (err.detail !== undefined) body.detail = err.detail;
  if (err.raw !== undefined) body.raw = err.raw;
  res.status(status).json(body);
}

export default { asyncHandler, notFoundHandler, errorHandler };
