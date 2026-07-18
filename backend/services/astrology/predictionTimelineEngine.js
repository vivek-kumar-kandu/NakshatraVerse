// ─────────────────────────────────────────────────────────────────────────
// Prediction Timeline Engine (V2.0 Phase 7 — Prediction Engine)
// Single responsibility: build the "Next 1 Year / Next 5 Years / Next 10
// Years" prediction timelines by walking the Antardasha segments already
// present in dashaEngine.js's full 120-year timeline and falling within
// each forecast window. No new Dasha math happens here — this is purely a
// windowing/selection layer over calcDasha()'s existing `timeline` array,
// reusing predictionRuleEvaluator.js's category-agnostic "general" theme
// for each segment (see rules/predictionCategories.json's `general` entry).
// ─────────────────────────────────────────────────────────────────────────
import { evaluatePrediction } from "../rules/predictionRuleEvaluator.js";

const WINDOWS = [
  { key: "oneYear", years: 1 },
  { key: "fiveYear", years: 5 },
  { key: "tenYear", years: 10 },
];

// Defensive upper bound on entries per window — a real 120-year
// Vimshottari cycle has ~9 Mahadashas and ~81 Antardashas total, so even
// the 10-year window (which spans the most segments) stays well under
// this in practice; it exists only to guarantee this never grows
// unbounded on unexpected input.
const MAX_SEGMENTS_PER_WINDOW = 60;

function toDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

// Every Antardasha segment (across every Mahadasha in the full cycle) that
// overlaps [windowStart, windowEnd) at all, clipped so displayed dates
// never fall outside the requested window.
function collectAntardashaSegments(mahadashaTimeline, windowStart, windowEnd) {
  const segments = [];
  for (const maha of mahadashaTimeline || []) {
    if (toDate(maha.endDate) <= windowStart || toDate(maha.startDate) >= windowEnd) continue;
    for (const antar of maha.antardashas || []) {
      const antarStart = toDate(antar.startDate);
      const antarEnd = toDate(antar.endDate);
      if (antarEnd <= windowStart || antarStart >= windowEnd) continue;

      const clippedStart = antarStart < windowStart ? windowStart : antarStart;
      const clippedEnd = antarEnd > windowEnd ? windowEnd : antarEnd;
      segments.push({
        mahaLord: maha.lord,
        antarLord: antar.lord,
        startDate: clippedStart.toISOString().slice(0, 10),
        endDate: clippedEnd.toISOString().slice(0, 10),
      });
      if (segments.length >= MAX_SEGMENTS_PER_WINDOW) return segments;
    }
  }
  return segments;
}

/**
 * @param {object} params
 * @param {object} params.planetary
 * @param {object} params.dasha - calcDasha() output (must have .available and .timeline)
 * @param {Array} params.yogas
 * @param {Array} params.doshas
 * @param {Array} params.advancedYogas
 * @param {Array} params.advancedDoshas
 * @param {object} params.planetStrength
 * @param {object} [params.nakshatraProfile] - nakshatraProfileEngine.js output (Phase 7.2B; optional/additive — birth-time fact, applies unchanged across every segment)
 * @param {object} [params.numerology] - numerologyEngine.js output {mulank, bhagyank} (Phase 7.2B; optional/additive — also a birth-time fact)
 * @param {object} [params.transitForecast] - transitForecastEngine.js output (Phase 7.2B; optional/additive — the current Transit Foundation snapshot, reused for every segment exactly as this codebase's other foundation-phase approximations already do; see transitEngine.js's own header)
 * @param {Date} [params.asOf]
 * @returns {{oneYear: Array, fiveYear: Array, tenYear: Array}}
 */
export function generatePredictionTimeline({ planetary, dasha, yogas, doshas, advancedYogas, advancedDoshas, planetStrength, nakshatraProfile, numerology, transitForecast, asOf = new Date() }) {
  if (!dasha?.available) return { oneYear: [], fiveYear: [], tenYear: [] };

  const allYogas = [...(yogas || []), ...(advancedYogas || [])];
  const allDoshas = [...(doshas || []), ...(advancedDoshas || [])];

  const result = {};
  for (const { key, years } of WINDOWS) {
    const windowEnd = new Date(asOf.getTime());
    windowEnd.setUTCFullYear(windowEnd.getUTCFullYear() + years);

    const segments = collectAntardashaSegments(dasha.timeline, asOf, windowEnd);
    result[key] = segments.map((seg) =>
      evaluatePrediction("general", {
        planetary,
        mahadasha: { lord: seg.mahaLord },
        antardasha: { lord: seg.antarLord },
        timePeriod: { startDate: seg.startDate, endDate: seg.endDate },
        yogas: allYogas,
        doshas: allDoshas,
        planetStrength,
        nakshatraProfile,
        numerology,
        transitForecast,
      })
    );
  }
  return result;
}

export default { generatePredictionTimeline };
