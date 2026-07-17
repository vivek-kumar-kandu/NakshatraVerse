// ─────────────────────────────────────────────────────────────────────────
// AI Timeline Engine — V5.2 (AI Timeline)
//
// Single responsibility: build the seven AI Timeline sections (Past,
// Present, Near Future, Next Month, Next 3 Months, Next 6 Months, Next
// Year) by walking the Antardasha segments ALREADY present in
// dashaEngine.js's full Vimshottari timeline (`dasha.timeline`, exactly
// the same array predictionTimelineEngine.js already windows over for its
// "Next 1/5/10 Year" horizons) and, for each segment that falls in a
// section's date window, calling predictionRuleEvaluator.js's
// `evaluatePrediction()` — the SAME unmodified function
// predictionEngine.js (per-category predictions) and
// predictionTimelineEngine.js (the "general" theme) already call. No new
// astrology calculation happens anywhere in this file: every fact fed
// into `evaluatePrediction()` (planetary positions, Dasha lords, yogas,
// doshas, Planet Strength, Nakshatra Profile, Numerology, Transit
// Forecast) is a direct, unmodified read of something
// structuredInsightsEngine.js already computed.
//
// The only genuinely new logic here is:
//   1. Windowing dasha.timeline segments into the 7 AI Timeline sections
//      (pure date-range math, mirroring predictionTimelineEngine.js's own
//      collectAntardashaSegments — duplicated here in a smaller form
//      rather than importing, since that helper isn't exported and
//      predictionTimelineEngine.js is explicitly off-limits to modify).
//   2. Evaluating each in-window segment against every one of the 7
//      distinct backend prediction categories already defined in
//      rules/predictionCategories.json (career/finance/marriage/
//      education/health/family/spiritualGrowth) — the exact same
//      categories predictionEngine.js already evaluates for the CURRENT
//      Dasha — extended here across each section's own segment(s) so the
//      frontend's 8 life-area filters (Career/Finance/Love/Marriage/
//      Health/Education/Family/Spiritual) have real, distinctly-computed
//      backend content instead of only the category-agnostic "general"
//      theme predictionTimelineEngine.js produces. "Love" and "Marriage"
//      both surface the SAME already-computed "marriage" category
//      evaluation (this rule engine has no separate "Love" significator
//      set — see predictionCategories.json), tagged twice rather than
//      evaluated twice, so this never doubles Gemini/rule-engine work.
// ─────────────────────────────────────────────────────────────────────────
import { evaluatePrediction } from "../rules/predictionRuleEvaluator.js";

// The 7 distinct backend prediction categories (rules/predictionCategories.json,
// minus the category-agnostic "general" theme already used by
// predictionTimelineEngine.js). Kept as a literal list, same pattern
// explorerAi.validator.js already uses for EXPLORER_ITEM_TYPES, so this
// file never has to parse the rules JSON itself.
const BACKEND_CATEGORIES = ["career", "finance", "marriage", "education", "health", "family", "spiritualGrowth"];

// Frontend-facing filter tag -> backend category key. "love" intentionally
// reuses "marriage"'s already-computed evaluation (see header) rather than
// inventing a new significator set.
const FILTER_TAGS_BY_BACKEND_CATEGORY = {
  career: ["career"],
  finance: ["finance"],
  marriage: ["marriage", "love"],
  education: ["education"],
  health: ["health"],
  family: ["family"],
  spiritualGrowth: ["spiritual"],
};

function toDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Every Antardasha segment (across every Mahadasha in the full cycle) that
// overlaps [windowStart, windowEnd), clipped so displayed dates never fall
// outside the requested window. Mirrors predictionTimelineEngine.js's own
// collectAntardashaSegments exactly (see header — duplicated, not
// imported, since that function is private to an off-limits file).
function collectSegments(mahadashaTimeline, windowStart, windowEnd, maxSegments) {
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
      if (segments.length >= maxSegments) return segments;
    }
  }
  return segments;
}

// The single Antardasha segment containing `asOf` (the "right now" of the
// Vimshottari cycle) — same lookup dashaRuleEvaluator.js's own
// currentAntardasha resolution already performs, just re-derived here from
// the already-computed `timeline` array rather than re-reading
// dasha.currentAntardasha directly, so this file only ever depends on the
// one `dasha.timeline` shape.
function findActiveSegment(mahadashaTimeline, asOf) {
  for (const maha of mahadashaTimeline || []) {
    if (asOf < toDate(maha.startDate) || asOf >= toDate(maha.endDate)) continue;
    for (const antar of maha.antardashas || []) {
      if (asOf >= toDate(antar.startDate) && asOf < toDate(antar.endDate)) {
        return { mahaLord: maha.lord, antarLord: antar.lord, startDate: antar.startDate, endDate: antar.endDate };
      }
    }
  }
  return null;
}

// Builds every category-tagged event for one segment, sharing a single
// evaluatePrediction() call per BACKEND category (never per frontend
// filter tag) — see FILTER_TAGS_BY_BACKEND_CATEGORY's "love"/"marriage"
// note above for why this matters.
function buildSegmentEvents({ segment, section, segIndex, planetary, yogas, doshas, planetStrength, nakshatraProfile, numerology, transitForecast }) {
  const events = [];
  for (const backendCategory of BACKEND_CATEGORIES) {
    const raw = evaluatePrediction(backendCategory, {
      planetary,
      mahadasha: { lord: segment.mahaLord },
      antardasha: { lord: segment.antarLord },
      timePeriod: { startDate: segment.startDate, endDate: segment.endDate },
      yogas,
      doshas,
      planetStrength,
      nakshatraProfile,
      numerology,
      transitForecast,
    });
    const filterTags = FILTER_TAGS_BY_BACKEND_CATEGORY[backendCategory] || [backendCategory];
    for (const filterTag of filterTags) {
      events.push({
        filterCategory: filterTag,
        section,
        id: `${section}-${segIndex}-${filterTag}`,
        raw,
      });
    }
  }
  return events;
}

// Section definitions: [sectionKey, windowStart(asOf), windowEnd(asOf), maxSegments].
// Every future window is cumulative from `asOf` (same "Next N" convention
// predictionTimelineEngine.js's oneYear/fiveYear/tenYear already use), so
// "Next 3 Months" naturally contains the same near-term segments "Next
// Month" does — exactly how a person would expect an expanding timeline
// horizon to behave.
function buildSectionWindows(asOf) {
  return [
    { key: "nearFuture", start: asOf, end: addDays(asOf, 14), max: 3 },
    { key: "nextMonth", start: asOf, end: addDays(asOf, 30), max: 4 },
    { key: "next3Months", start: asOf, end: addDays(asOf, 90), max: 8 },
    { key: "next6Months", start: asOf, end: addDays(asOf, 180), max: 12 },
    { key: "nextYear", start: asOf, end: addDays(asOf, 365), max: 20 },
  ];
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
 * @param {object} [params.nakshatraProfile]
 * @param {object} [params.numerology]
 * @param {object} [params.transitForecast]
 * @param {Date} [params.asOf]
 * @returns {{past: Array, present: Array, nearFuture: Array, nextMonth: Array, next3Months: Array, next6Months: Array, nextYear: Array}}
 */
export function generateAiTimeline({ planetary, dasha, yogas, doshas, advancedYogas, advancedDoshas, planetStrength, nakshatraProfile, numerology, transitForecast, asOf = new Date() }) {
  const EMPTY = { past: [], present: [], nearFuture: [], nextMonth: [], next3Months: [], next6Months: [], nextYear: [] };
  if (!dasha?.available) return EMPTY;

  const allYogas = [...(yogas || []), ...(advancedYogas || [])];
  const allDoshas = [...(doshas || []), ...(advancedDoshas || [])];
  const shared = { planetary, yogas: allYogas, doshas: allDoshas, planetStrength, nakshatraProfile, numerology, transitForecast };

  const result = {};

  // Past — the most recent already-elapsed Antardasha segments (bounded to
  // the last 365 days so this never grows toward the full birth-to-now
  // span). windowStart/windowEnd order is reversed vs. future sections
  // (asOf-365d -> asOf) but collectSegments() itself is direction-agnostic.
  const pastStart = addDays(asOf, -365);
  const pastSegments = collectSegments(dasha.timeline, pastStart, asOf, 6);
  result.past = pastSegments.flatMap((segment, i) =>
    buildSegmentEvents({ segment, section: "past", segIndex: i, ...shared })
  );

  // Present — the single Antardasha segment active right now.
  const activeSegment = findActiveSegment(dasha.timeline, asOf);
  result.present = activeSegment
    ? buildSegmentEvents({ segment: activeSegment, section: "present", segIndex: 0, ...shared })
    : [];

  // Near Future / Next Month / Next 3 Months / Next 6 Months / Next Year —
  // cumulative forward-looking windows.
  for (const { key, start, end, max } of buildSectionWindows(asOf)) {
    const segments = collectSegments(dasha.timeline, start, end, max);
    result[key] = segments.flatMap((segment, i) => buildSegmentEvents({ segment, section: key, segIndex: i, ...shared }));
  }

  return result;
}

export default { generateAiTimeline };
