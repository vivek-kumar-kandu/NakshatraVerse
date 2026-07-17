// ─────────────────────────────────────────────────────────────────────────
// Panchang / Muhurat Validator (V4.1 Phase 2)
// Mirrors the validation style of the other validators in this directory
// (matching.validator.js, birthData.validator.js): pure functions, no
// framework coupling, return { errors, ...sanitizedFields }.
// ─────────────────────────────────────────────────────────────────────────
import { MUHURAT_ACTIVITIES } from "../services/astrology/muhuratEngine.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateStr(dateStr) {
  if (!DATE_RE.test(dateStr || "")) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateDateQuery(query) {
  const errors = [];
  const date = (query?.date || "").trim();
  if (!date || !isValidDateStr(date)) {
    errors.push("A valid `date` query parameter (YYYY-MM-DD) is required.");
  }
  let lat, lon;
  if (query?.lat !== undefined) {
    lat = Number(query.lat);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.push("`lat` must be a number between -90 and 90.");
  }
  if (query?.lon !== undefined) {
    lon = Number(query.lon);
    if (Number.isNaN(lon) || lon < -180 || lon > 180) errors.push("`lon` must be a number between -180 and 180.");
  }
  return { errors, date, lat, lon };
}

export function validateMonthQuery(query) {
  const errors = [];
  const year = Number(query?.year);
  const month = Number(query?.month);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) errors.push("`year` must be a valid integer year.");
  if (!Number.isInteger(month) || month < 1 || month > 12) errors.push("`month` must be an integer 1-12.");
  return { errors, year, month };
}

export function validateMuhuratRequest(body) {
  const errors = [];
  const activity = (body?.activity || "").trim();
  if (!activity || !MUHURAT_ACTIVITIES.includes(activity)) {
    errors.push(`\`activity\` is required and must be one of: ${MUHURAT_ACTIVITIES.join(", ")}`);
  }
  const startDate = (body?.startDate || "").trim();
  if (!startDate || !isValidDateStr(startDate)) {
    errors.push("A valid `startDate` (YYYY-MM-DD) is required.");
  }
  let rangeDays = Number(body?.rangeDays);
  if (body?.rangeDays === undefined) rangeDays = 30;
  if (Number.isNaN(rangeDays) || rangeDays < 1 || rangeDays > 90) {
    errors.push("`rangeDays` must be a number between 1 and 90.");
  }
  return { errors, activity, startDate, rangeDays };
}

export function validateExplainRequest(body) {
  const errors = [];
  const kind = (body?.kind || "").trim();
  if (!["daily", "muhurat"].includes(kind)) {
    errors.push("`kind` is required and must be either \"daily\" or \"muhurat\".");
  }
  if (!body?.data || typeof body.data !== "object") {
    errors.push("`data` (the already-computed Panchang or Muhurat object) is required.");
  }
  return { errors, kind, data: body?.data };
}

export default { isValidDateStr, validateDateQuery, validateMonthQuery, validateMuhuratRequest, validateExplainRequest };
