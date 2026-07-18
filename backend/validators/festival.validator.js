// ─────────────────────────────────────────────────────────────────────────
// Festival Validator (V4.5 Phase 1A — Festival Backend Infrastructure)
// Mirrors panchang.validator.js's style exactly: pure functions, no
// framework coupling, return { errors, ...sanitizedFields }.
// ─────────────────────────────────────────────────────────────────────────
import { isValidDateStr } from "./panchang.validator.js";

const MIN_YEAR = 1900;
const MAX_YEAR = 2200;

export function validateYearQuery(query) {
  const errors = [];
  const year = query?.year !== undefined ? Number(query.year) : new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    errors.push(`\`year\` must be a valid integer year between ${MIN_YEAR} and ${MAX_YEAR}.`);
  }
  return { errors, year };
}

export function validateMonthQuery(query) {
  const { errors, year } = validateYearQuery(query);
  const month = Number(query?.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.push("`month` must be an integer 1-12.");
  }
  return { errors, year, month };
}

export function validateFestivalKeyParam(params) {
  const errors = [];
  const key = (params?.key || "").trim();
  // Only a missing/empty key is a malformed request (400). Whether `key`
  // matches a known festival is a lookup concern, not a validation
  // concern — festivalService.getFestival() already throws a proper
  // err.status = 404 for an unknown-but-well-formed key, and
  // festival.controller.js#getFestivalByKey already forwards that status.
  // Rejecting unknown keys here too pre-empted that 404 with a blanket
  // 400 before the request ever reached the service.
  if (!key) {
    errors.push("`key` is required.");
  }
  return { errors, key };
}

export function validateDateQuery(query) {
  const errors = [];
  const date = (query?.date || "").trim();
  if (!date || !isValidDateStr(date)) {
    errors.push("A valid `date` query parameter (YYYY-MM-DD) is required.");
  }
  return { errors, date };
}

export function validateUpcomingQuery(query) {
  const { errors, date } = validateDateQuery(query);
  let days = query?.days !== undefined ? Number(query.days) : 30;
  if (Number.isNaN(days) || days < 1 || days > 365) {
    errors.push("`days` must be a number between 1 and 365.");
  }
  return { errors, date, days };
}

export function validateExplainRequest(body) {
  const errors = [];
  if (!body?.festival || typeof body.festival !== "object") {
    errors.push("`festival` (the already-computed festival object) is required.");
  }
  return { errors, festival: body?.festival };
}

export default {
  validateYearQuery, validateMonthQuery, validateFestivalKeyParam,
  validateDateQuery, validateUpcomingQuery, validateExplainRequest,
};
