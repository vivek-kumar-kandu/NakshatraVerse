// ─────────────────────────────────────────────────────────────────────────
// Prediction & Profile API Mapper (V2.0 Phase 7.1 — Prediction & Profile
// Integration)
// Single responsibility: translate the objects that predictionEngine.js /
// predictionTimelineEngine.js / nakshatraProfileEngine.js / transitForecast
// Engine.js have ALREADY computed (via structuredInsightsEngine.js) into
// the exact public API contract this phase adds. This file performs no
// astrology calculation, no rule evaluation, and no scoring — it only
// renames/regroups fields that already exist on the engine output, the
// same "shape of the data, not how it's calculated" separation
// structuredJsonBuilder.js already uses for the base chart.
//
// Why a separate mapping layer instead of renaming the engine's own
// fields: predictionRuleEvaluator.js's return shape (`dasha`, `antardasha`,
// `planet`, `explanationMeta`, ...) is exercised directly by existing
// Phase 7 tests (tests/unit/predictionEngine.test.js) and consumed by
// promptBuilder.js's Gemini prompt. Renaming those fields in place would
// violate "Do NOT rename existing fields" / "Do NOT rewrite existing
// astrology engines". Instead, this adapter sits between the engine layer
// and the HTTP response and performs the renaming only for what the
// outside world (frontend + Gemini explanation context) sees.
// ─────────────────────────────────────────────────────────────────────────

// One category prediction (or one timeline "general" entry) -> the Phase
// 7.1 API contract shape. `raw` is exactly what predictionRuleEvaluator.js
// #evaluatePrediction already returned — every value below is a read, not
// a computation.
function mapPredictionToApiShape(raw) {
  if (!raw) return raw;
  return {
    category: raw.category,
    prediction: raw.prediction,
    confidence: raw.confidence,
    timePeriod: raw.timePeriod,
    activeMahadasha: raw.dasha,
    activeAntardasha: raw.antardasha,
    dominantPlanet: raw.planet,
    supportingYogas: raw.supportingYogas,
    supportingDoshas: raw.supportingDoshas,
    supportingHouses: raw.supportingHouses || [],
    supportingPlanets: raw.supportingPlanets || [],
    suggestedRemedies: raw.suggestedRemedies,
    reasoningMetadata: raw.explanationMeta,
    // V2.0 Phase 7.2B (Nakshatra Profile Intelligence): purely additive
    // fields — every existing key above is unchanged. All values are
    // direct reads of predictionRuleEvaluator.js#evaluatePrediction's own
    // output (see profileAlignmentRuleEvaluator.js); nothing is computed
    // in this mapping layer.
    supportingProfileFactors: raw.supportingProfileFactors || [],
    profileAlignmentScore: raw.profileAlignmentScore ?? null,
    profileSummary: raw.profileSummary ?? null,
    reasoningBreakdown: raw.reasoningBreakdown || null,
    // Explanation-only context for Gemini/the frontend: a compact,
    // read-only echo of the fields Gemini is allowed to use to explain
    // *why* this prediction was reached. It is never a new fact — every
    // value here already appears elsewhere in this same object — and it
    // must never be treated by Gemini as something it can add to or
    // override (see promptBuilder.js's Phase 7 constraints).
    GeminiExplanationContext: {
      dominantPlanet: raw.planet,
      activeMahadasha: raw.dasha,
      activeAntardasha: raw.antardasha,
      supportingYogas: (raw.supportingYogas || []).map((y) => y.name),
      supportingDoshas: (raw.supportingDoshas || []).map((d) => d.name),
      confidenceLabel: raw.confidence?.label ?? null,
      confidenceScore: raw.confidence?.score ?? null,
      basis: raw.explanationMeta,
      // Phase 7.2B: backend profile reasoning + supporting profile
      // factors, so Gemini can explain the Nakshatra Profile's role in
      // this prediction without ever inventing additional profile
      // content of its own.
      profileAlignmentScore: raw.profileAlignmentScore ?? null,
      profileSummary: raw.profileSummary ?? null,
      supportingProfileFactors: (raw.supportingProfileFactors || []).map((f) => f.factor),
    },
  };
}

// insights.predictions is an array of the 7 category objects
// (predictionEngine.js#generateCategoryPredictions).
export function mapPredictions(predictions) {
  return (predictions || []).map(mapPredictionToApiShape);
}

// insights.predictionTimeline is { oneYear, fiveYear, tenYear }, each an
// array of "general"-theme entries (predictionTimelineEngine.js).
export function mapPredictionTimeline(predictionTimeline) {
  if (!predictionTimeline) return predictionTimeline;
  const { oneYear, fiveYear, tenYear } = predictionTimeline;
  return {
    oneYear: (oneYear || []).map(mapPredictionToApiShape),
    fiveYear: (fiveYear || []).map(mapPredictionToApiShape),
    tenYear: (tenYear || []).map(mapPredictionToApiShape),
  };
}

// insights.nakshatraProfile -> the Phase 7.1 API contract's field names.
// Every value is a direct read of nakshatraProfileEngine.js's output
// (services/rules/nakshatraProfileRuleEvaluator.js); nothing is derived
// here. `strengths`/`weaknesses` are not present as their own facts in
// rules/nakshatraProfile.json (only combined `personalityTraits` is), so
// rather than inventing that split, they are omitted here — adding them
// would mean writing new interpretive content, which this integration-only
// phase explicitly forbids ("Do NOT hardcode logic").
export function mapNakshatraProfile(nakshatraProfile) {
  if (!nakshatraProfile) return nakshatraProfile;
  return {
    nakshatra: nakshatraProfile.name,
    lord: nakshatraProfile.lord,
    pada: nakshatraProfile.pada,
    symbol: nakshatraProfile.symbol,
    deity: nakshatraProfile.deity,
    gana: nakshatraProfile.gana,
    nadi: nakshatraProfile.nadi,
    yoni: nakshatraProfile.yoni,
    nature: nakshatraProfile.nature,
    personality: nakshatraProfile.personalityTraits,
    careerTendencies: nakshatraProfile.careerTendencies,
    relationshipTendencies: nakshatraProfile.relationshipTendencies,
    spiritualTendencies: nakshatraProfile.spiritualTendencies,
  };
}

// Builds the full set of optional Phase 7.1 API fields from an already-
// computed `insights` object (structuredInsightsEngine.js#buildStructuredInsights).
// Returns {} (nothing added) if insights is unavailable, so callers can
// always safely spread the result into a response without an extra guard.
export function buildPredictionApiFields(insights) {
  if (!insights) return {};
  return {
    nakshatraProfile: mapNakshatraProfile(insights.nakshatraProfile),
    predictions: mapPredictions(insights.predictions),
    predictionTimeline: mapPredictionTimeline(insights.predictionTimeline),
    transitForecast: insights.transitForecast ?? null,
    // V3.0 Phase 5 (Personalized Horoscope & Astrology Calendar): purely
    // additive fields — every key above is unchanged. Both values are
    // direct, unmodified reads of dashaEngine.js#calcDasha and
    // transitEngine.js#calcTransits, exactly as structuredInsightsEngine.js
    // already computed them for internal use (Gemini prompt context).
    // Nothing is recalculated here; this only exposes the already-computed
    // full Dasha (current/previous/next Mahadasha, current Antardasha,
    // full 120-year timeline) and the flat per-planet Transit list (with
    // classical flags like Sade Sati/Kantaka Shani/Ashtama Shani) to the
    // public API, so the new Horoscope/Calendar UI never needs to invent
    // or re-derive astrology that the backend hasn't already produced.
    dasha: insights.dasha ?? null,
    transits: insights.transits ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// V5.0 Phase 5B (Explorer Infrastructure — Backend Integration)
//
// A second, separate additive-fields builder (kept apart from
// `buildPredictionApiFields` above on purpose, so that function's existing
// exact-key-set contract/tests are untouched). Exposes facts the backend
// has already computed for internal use but never returned to the client:
//   - planetStrength: the full per-planet Planet Strength profile
//     (dignity, retrograde, combustion, friendship, functional nature,
//     Dig Bala, Shadbala, aspect influence) — see planetStrengthEngine.js,
//     whose own header names this exact exposure as the intended future
//     extension point.
//   - advancedYogas / advancedDoshas: additional classical yogas/doshas
//     (advancedYogaEngine.js / advancedDoshaEngine.js) already computed
//     alongside the base `chart.yogas`/`chart.doshas` but, until now,
//     never surfaced outside the Gemini prompt.
// No calculation happens here — every value is a direct read of an
// already-computed engine/insights field, purely reshaped for the public
// API the same way buildPredictionApiFields already does.
// ─────────────────────────────────────────────────────────────────────────
export function buildExplorerApiFields(insights) {
  if (!insights) return {};
  return {
    planetStrength: insights.planetStrength ?? null,
    advancedYogas: insights.advancedYogas || [],
    advancedDoshas: insights.advancedDoshas || [],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// V5.2 (AI Timeline)
//
// A third, separate additive-fields builder (kept apart from
// buildPredictionApiFields/buildExplorerApiFields above on purpose, same
// rationale as Phase 5B's own comment: so those functions' existing
// exact-key-set contracts/tests stay untouched). Reshapes
// aiTimelineEngine.js's section/event output — itself built entirely from
// evaluatePrediction() calls identical in shape to the ones
// buildPredictionApiFields already maps — through the very same
// `mapPredictionToApiShape()` this file already uses, then adds only the
// handful of fields that shape doesn't yet carry (a stable event id, which
// section it belongs to, the frontend filter-category tag, and a read-only
// echo of the Transit Forecast already exposed via `transitForecast`
// above). No calculation happens here — every value is a direct read of
// an already-computed engine/insights field.
// ─────────────────────────────────────────────────────────────────────────
function mapAiTimelineEvent(event, transitForecast) {
  const mapped = mapPredictionToApiShape(event.raw);
  return {
    ...mapped,
    id: event.id,
    section: event.section,
    filterCategory: event.filterCategory,
    relatedTransit: transitForecast ?? null,
  };
}

// insights.aiTimeline is { past, present, nearFuture, nextMonth,
// next3Months, next6Months, nextYear }, each an array of aiTimelineEngine.js
// event objects ({ id, section, filterCategory, raw }).
export function mapAiTimeline(aiTimeline, transitForecast) {
  if (!aiTimeline) return aiTimeline;
  const sections = ["past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear"];
  const result = {};
  for (const key of sections) {
    result[key] = (aiTimeline[key] || []).map((event) => mapAiTimelineEvent(event, transitForecast));
  }
  return result;
}

// Builds the full set of optional V5.2 API fields from an already-computed
// `insights` object. Returns {} (nothing added) if insights or its
// `insights.aiTimeline` is unavailable, so callers can always safely
// spread the result into a response without an extra guard — same
// contract buildExplorerApiFields already establishes.
export function buildAiTimelineApiFields(insights) {
  if (!insights?.aiTimeline) return {};
  return {
    aiTimeline: mapAiTimeline(insights.aiTimeline, insights.transitForecast),
  };
}

export default {
  mapPredictions,
  mapPredictionTimeline,
  mapNakshatraProfile,
  buildPredictionApiFields,
  buildExplorerApiFields,
  mapAiTimeline,
  buildAiTimelineApiFields,
};
