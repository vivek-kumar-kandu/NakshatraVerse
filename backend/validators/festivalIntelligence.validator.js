// ─────────────────────────────────────────────────────────────────────────
// Festival Intelligence Validator (V4.5 Phase 2 — Festival Intelligence)
// Mirrors festival.validator.js's exact style: pure functions, no
// framework coupling, return { errors, ...sanitizedFields }.
// ─────────────────────────────────────────────────────────────────────────

function isNonEmptyFestival(festival) {
  return festival && typeof festival === "object" && typeof festival.key === "string" && typeof festival.date === "string";
}

export function validateFestivalIntelligenceRequest(body) {
  const errors = [];
  if (!isNonEmptyFestival(body?.festival)) {
    errors.push("`festival` (the already-computed festival occurrence object, with at least `key` and `date`) is required.");
  }
  return { errors, festival: body?.festival };
}

export function validatePersonalizedFestivalRequest(body) {
  const errors = [];
  if (!isNonEmptyFestival(body?.festival)) {
    errors.push("`festival` (the already-computed festival occurrence object, with at least `key` and `date`) is required.");
  }
  if (!body?.chart || typeof body.chart !== "object") {
    errors.push("`chart` (the already-computed birth chart) is required for personalized guidance.");
  }
  return { errors, festival: body?.festival, chart: body?.chart, report: body?.report };
}

export function validatePreparationRequest(body) {
  return validateFestivalIntelligenceRequest(body);
}

export function validateTimelineRequest(body) {
  return validateFestivalIntelligenceRequest(body);
}

export default {
  validateFestivalIntelligenceRequest,
  validatePersonalizedFestivalRequest,
  validatePreparationRequest,
  validateTimelineRequest,
};
