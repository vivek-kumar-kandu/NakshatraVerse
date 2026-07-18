// ─────────────────────────────────────────────────────────────────────────
// AI Life Coach Validator — V4.3 (AI Life Coach)
// Validates a POST /api/life-coach/guidance body. Mirrors
// assistant.validator.js's exact pattern (same REQUIRED_CHART_FIELDS
// contract — the Life Coach consumes the same backend-generated chart
// object the AI Assistant already does): pure functions, no framework
// coupling, so the controller stays thin.
// ─────────────────────────────────────────────────────────────────────────
import { isValidDateStr } from "./panchang.validator.js";

const REQUIRED_CHART_FIELDS = ["userData", "planetary", "numerology", "lagna", "moonSign", "sunSign", "nakshatra"];

export function validateLifeCoachRequest(body) {
  const errors = [];
  const { chart, date, lat, lon } = body || {};

  if (!chart || typeof chart !== "object") {
    errors.push("chart is required and must be the backend-generated chart object.");
  } else {
    for (const field of REQUIRED_CHART_FIELDS) {
      if (chart[field] === undefined || chart[field] === null) {
        errors.push(`chart.${field} is required.`);
      }
    }
  }

  // Optional — defaults to "today" server-side (see lifeCoachService.js)
  // when omitted, exactly like panchang.controller.js's own optional
  // lat/lon handling.
  if (date !== undefined && !isValidDateStr(date)) {
    errors.push("`date` must be a valid YYYY-MM-DD string when provided.");
  }
  let sanitizedLat, sanitizedLon;
  if (lat !== undefined) {
    sanitizedLat = Number(lat);
    if (Number.isNaN(sanitizedLat) || sanitizedLat < -90 || sanitizedLat > 90) {
      errors.push("`lat` must be a number between -90 and 90.");
    }
  }
  if (lon !== undefined) {
    sanitizedLon = Number(lon);
    if (Number.isNaN(sanitizedLon) || sanitizedLon < -180 || sanitizedLon > 180) {
      errors.push("`lon` must be a number between -180 and 180.");
    }
  }

  return { errors, date, lat: sanitizedLat, lon: sanitizedLon };
}

export default { validateLifeCoachRequest };
