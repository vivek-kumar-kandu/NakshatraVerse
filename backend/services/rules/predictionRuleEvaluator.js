// ─────────────────────────────────────────────────────────────────────────
// Prediction Rule Evaluator (V2.0 Phase 7 — Prediction Engine)
// Single responsibility: the shared, config-driven scoring/selection logic
// used by BOTH predictionEngine.js (per-category predictions) and
// predictionTimelineEngine.js (1/5/10-year timeline entries), so the two
// callers can never drift into duplicate confidence math or duplicate
// "which yoga/dosha counts as supporting evidence" logic.
//
// Mirrors this codebase's established Rule Engine convention exactly:
//   - No hardcoded astrology values here — categories/houses/significators
//     (rules/predictionCategories.json), remedy content
//     (rules/predictionRemedies.json), and scoring weights/thresholds
//     (rules/predictionConfidence.json) are all read from JSON.
//   - Reuses ruleEngine.js's interpolate() for {token} templating and
//     housePlacementEngine.js's houseOf() for house lookups, instead of
//     reimplementing either.
//   - Every value fed into a prediction is something the backend already
//     computed (Planet Strength, Dasha, Yogas/Doshas) — nothing here
//     invents a new astrological fact, matching Phase 7's "Gemini must
//     ONLY explain backend-generated prediction data" requirement one
//     level up: this module is that backend-generated data.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { interpolate } from "./ruleEngine.js";
import { houseOf } from "../astrology/housePlacementEngine.js";
import { PLANETS } from "../astrology/constants.js";
import { evaluateProfileAlignment } from "./profileAlignmentRuleEvaluator.js";

const PLAIN_TO_FULL_KEY = PLANETS.reduce((map, key) => {
  map[key.split(" ")[0]] = key;
  return map;
}, {});

function fullKeyOf(plainName) {
  return PLAIN_TO_FULL_KEY[plainName] || plainName;
}

// The category's classical significator planets, plus whichever planets
// this specific chart happens to have placed in the category's
// significator houses — the union of "always relevant to this life area"
// and "relevant because this chart puts a planet there".
function resolveRelevantPlanets(categoryConfig, planetary) {
  const fromHouses = (categoryConfig.houses || []).length
    ? PLANETS
        .filter((fullKey) => (categoryConfig.houses || []).includes(houseOf(planetary, fullKey)))
        .map((fullKey) => fullKey.split(" ")[0])
    : [];
  return [...new Set([...(categoryConfig.significatorPlanets || []), ...fromHouses])];
}

// Picks the single "dominant" planet for a category: whichever relevant
// planet has the highest already-computed Planet Strength adjustedScore.
// Falls back to the first configured significator (or the Antardasha lord,
// for the category-agnostic "general" theme) if strength data is missing.
function pickDominantPlanet(relevantPlanets, planetStrength, fallback) {
  let best = null;
  let bestScore = -Infinity;
  for (const planet of relevantPlanets) {
    const score = planetStrength?.[planet]?.adjustedScore;
    if (typeof score === "number" && score > bestScore) {
      best = planet;
      bestScore = score;
    }
  }
  return best || relevantPlanets[0] || fallback || null;
}

// Yogas/doshas are only ever detected from house placements (never from
// free text), so "is this insight relevant to this category" is decided by
// checking whether its already-generated `detail` sentence names one of
// the category's relevant planets — the same planets whose placements
// produced that detail sentence in the first place (see
// ruleEngine.js#interpolate, which is what wrote each planet's name into
// `detail`). This is a deterministic text match, not a new inference.
function matchSupportingInsights(items, relevantPlanets, limit) {
  if (!relevantPlanets.length) return [];
  const matched = (items || []).filter((item) =>
    relevantPlanets.some((planet) => item.detail?.includes(planet))
  );
  return matched.slice(0, limit).map((item) => ({ name: item.name, influence: item.influence }));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bandFor(score, bands, fallbackLabel) {
  for (const band of bands) {
    if (score >= band.min) return band.label;
  }
  return fallbackLabel;
}

/**
 * Deterministic 5-95 confidence score built entirely from already-computed
 * backend facts — see rules/predictionConfidence.json for the weights.
 * This is a foundation-phase transparent scoring model, not a statistical
 * confidence interval (documented in that config file too).
 *
 * V2.0 Phase 7.2B (Nakshatra Profile Intelligence) additions: confidence
 * now also moves with House Placement agreement, Numerology agreement,
 * current-Dasha resonance, the Nakshatra Profile Alignment score, and
 * Transit Foundation conflict — all optional/default-off params so any
 * existing caller passing only the original three fields behaves exactly
 * as before. Weights for these five additions live in
 * rules/profileAlignment.json's confidenceWeights (kept separate from
 * predictionConfidence.json so that file's existing weights are never
 * touched/renumbered).
 */
export function computeConfidence({
  planetProfile,
  supportingYogasCount = 0,
  supportingDoshasCount = 0,
  houseAgreement = false,
  numerologyAgreement = false,
  dashaResonance = false,
  profileAlignmentScore = null,
  transitConflictCount = 0,
}) {
  const { baseScore, weights, scoreClamp, confidenceBands } = loadRules("predictionConfidence");
  const { confidenceWeights } = loadRules("profileAlignment");

  let score = baseScore;
  if (planetProfile) {
    score += (planetProfile.adjustedScore || 0) * weights.adjustedScorePerPoint;
    if (planetProfile.functionalNature?.nature === "benefic") score += weights.functionalBenefic;
    if (planetProfile.functionalNature?.nature === "malefic") score += weights.functionalMalefic;
    if (planetProfile.combustion?.combust) score += weights.combust;
    if (planetProfile.retrograde) score += weights.retrograde;
  }
  score += Math.min(supportingYogasCount * weights.supportingYogaEach, weights.maxYogaBonus);
  score -= Math.min(supportingDoshasCount * weights.supportingDoshaEach, weights.maxDoshaPenalty);

  if (houseAgreement) score += confidenceWeights.houseAgreementBonus;
  if (numerologyAgreement) score += confidenceWeights.numerologyAgreementBonus;
  if (dashaResonance) score += confidenceWeights.dashaResonanceBonus;
  if (typeof profileAlignmentScore === "number") {
    score += profileAlignmentScore * confidenceWeights.profileAlignmentPerPoint;
  }
  if (transitConflictCount > 0) {
    score -= Math.min(transitConflictCount * confidenceWeights.transitConflictEach, confidenceWeights.maxTransitConflictPenalty);
  } else {
    score += confidenceWeights.transitCleanBonus;
  }

  const clamped = Math.round(clamp(score, scoreClamp.min, scoreClamp.max));
  return { score: clamped, label: bandFor(clamped, confidenceBands, "Low") };
}

// Which prediction template band (favorable/mixed/challenging) a
// confidence score corresponds to — a separate threshold set from the
// confidence label above, since "how sure are we" and "is this a
// favorable period" are conceptually different questions even though both
// are derived from the same underlying score in this foundation-phase model.
export function favorabilityBandFor(score) {
  const { favorabilityBands } = loadRules("predictionConfidence");
  return bandFor(score, favorabilityBands, "mixed");
}

// Builds the Dasha-lord + category-specific remedy pair using
// rules/predictionRemedies.json — every Vimshottari lord (including
// Rahu/Ketu, absent from remedies.json's Lagna-lord-only coverage) is
// covered, so this never silently returns nothing for a Rahu/Ketu Dasha.
export function pickPredictionRemedies({ dashaLord, categoryLabel }) {
  const config = loadRules("predictionRemedies");
  const info = dashaLord ? config.lordRemedyInfo[dashaLord] : null;
  if (!info) return [];

  const remedies = [
    {
      type: `Dasha Lord (${dashaLord})`,
      detail: interpolate(config.dashaLordRemedyTemplate, {}, { lord: dashaLord, ...info }),
    },
  ];
  if (categoryLabel && categoryLabel !== "General") {
    remedies.push({
      type: `${categoryLabel} Remedy`,
      detail: interpolate(config.categoryRemedyTemplate, {}, { category: categoryLabel, deity: info.deity }),
    });
  }
  return remedies;
}

/**
 * Evaluates one prediction object — used for both a life-area category
 * (career/finance/marriage/education/health/family/spiritualGrowth) and
 * the category-agnostic "general" theme of a single timeline Antardasha
 * segment. Every field returned matches Phase 7's unified prediction
 * object shape (Dasha, Antardasha, Planet, Time Period, Prediction,
 * Confidence, Supporting Yogas, Supporting Doshas, Suggested Remedies,
 * Explanation metadata).
 *
 * @param {string} categoryKey - key into rules/predictionCategories.json ("career", ..., "general")
 * @param {object} ctx
 * @param {object} ctx.planetary - natal planetary positions
 * @param {{lord: string}|null} ctx.mahadasha - the Mahadasha active for this prediction (current, for categories; the timeline segment's, for timeline entries)
 * @param {{lord: string}|null} ctx.antardasha - the Antardasha active for this prediction
 * @param {{startDate: string, endDate: string}|null} ctx.timePeriod - the date range this prediction covers
 * @param {Array} ctx.yogas - combined base + advanced yogas already detected for this chart
 * @param {Array} ctx.doshas - combined base + advanced doshas already detected for this chart
 * @param {object} ctx.planetStrength - calcPlanetStrength() output
 * @param {object} [ctx.nakshatraProfile] - nakshatraProfileEngine.js output (Phase 7.2B; optional/additive)
 * @param {object} [ctx.numerology] - numerologyEngine.js output {mulank, bhagyank} (Phase 7.2B; optional/additive)
 * @param {object} [ctx.transitForecast] - transitForecastEngine.js output {saturn, jupiter, rahuKetu} (Phase 7.2B; optional/additive)
 */
export function evaluatePrediction(categoryKey, ctx) {
  const { categories } = loadRules("predictionCategories");
  const categoryConfig = categories.find((c) => c.key === categoryKey);
  if (!categoryConfig) {
    throw new Error(`Prediction Engine: unknown prediction category "${categoryKey}"`);
  }

  const { planetary, mahadasha, antardasha, timePeriod, yogas, doshas, planetStrength, nakshatraProfile, numerology, transitForecast } = ctx;
  const mahaLord = mahadasha?.lord ?? null;
  const antarLord = antardasha?.lord ?? null;

  const relevantPlanets = resolveRelevantPlanets(categoryConfig, planetary || {});
  const dominantPlanet = pickDominantPlanet(relevantPlanets, planetStrength, antarLord || mahaLord);

  // For the category-agnostic "general" timeline theme, every currently-
  // detected insight is relevant (there's no significator set to filter
  // by); for a specific life-area category, only insights naming one of
  // that category's relevant planets count as supporting evidence.
  const isGeneral = categoryKey === "general";
  const supportingYogas = isGeneral
    ? (yogas || []).slice(0, 5).map((y) => ({ name: y.name, influence: y.influence }))
    : matchSupportingInsights(yogas, relevantPlanets, 5);
  const supportingDoshas = isGeneral
    ? (doshas || []).slice(0, 5).map((d) => ({ name: d.name, influence: d.influence }))
    : matchSupportingInsights(doshas, relevantPlanets, 5);

  const planetProfile = dominantPlanet ? planetStrength?.[dominantPlanet] : null;

  // ── V2.0 Phase 7.2B (Nakshatra Profile Intelligence) ──────────────────
  // Every signal below is read from facts the backend already computed
  // elsewhere (House Placement via houseOf(), current Dasha via
  // mahaLord/antarLord, Numerology via ctx.numerology, Transit Foundation
  // via ctx.transitForecast) — nothing here is a new astrology calculation.
  const dominantFullKey = dominantPlanet ? fullKeyOf(dominantPlanet) : null;
  const dominantHouse = dominantFullKey ? houseOf(planetary || {}, dominantFullKey) : null;
  const houseAgreement = Boolean(dominantHouse) && (categoryConfig.houses || []).includes(dominantHouse);
  const dashaResonance = Boolean(dominantPlanet) && (dominantPlanet === mahaLord || dominantPlanet === antarLord);

  const transitFlagGroups = [transitForecast?.saturn, transitForecast?.jupiter, ...(transitForecast?.rahuKetu || [])].filter(Boolean);
  const transitConflictCount = transitFlagGroups.reduce((sum, t) => sum + (t.flags?.length || 0), 0);

  const profileAlignment = evaluateProfileAlignment(categoryKey, {
    nakshatraProfile,
    dominantPlanet,
    mahaLord,
    antarLord,
    numerology,
    transitConflictCount,
  });

  const confidence = computeConfidence({
    planetProfile,
    supportingYogasCount: supportingYogas.length,
    supportingDoshasCount: supportingDoshas.length,
    houseAgreement,
    numerologyAgreement: profileAlignment.numerologyMatches,
    dashaResonance,
    profileAlignmentScore: profileAlignment.profileAlignmentScore,
    transitConflictCount,
  });
  const band = favorabilityBandFor(confidence.score);

  const predictionText = mahaLord && antarLord
    ? interpolate(
        categoryConfig.templates[band],
        planetary,
        { dominantPlanet: dominantPlanet || "the ruling planet", mahaLord, antarLord }
      )
    : "Not enough Dasha data available to generate this prediction.";

  return {
    category: categoryConfig.label,
    dasha: mahaLord,
    antardasha: antarLord,
    planet: dominantPlanet,
    timePeriod: timePeriod ? { startDate: timePeriod.startDate, endDate: timePeriod.endDate } : null,
    prediction: predictionText,
    confidence,
    supportingYogas,
    supportingDoshas,
    suggestedRemedies: mahaLord ? pickPredictionRemedies({ dashaLord: mahaLord, categoryLabel: categoryConfig.label }) : [],
    // V2.0 Phase 7.1 (Prediction & Profile Integration): these two are NOT
    // new calculations — categoryConfig.houses is the same classical
    // significator-house config already loaded above, and relevantPlanets
    // is the exact planet set already computed by resolveRelevantPlanets()
    // a few lines up (used to pick dominantPlanet and to filter supporting
    // yogas/doshas). They were simply never returned before; exposing them
    // lets the API/Gemini-explanation layer show which houses/planets a
    // prediction is grounded in without recomputing anything.
    supportingHouses: categoryConfig.houses || [],
    supportingPlanets: relevantPlanets,
    // V2.0 Phase 7.2B (Nakshatra Profile Intelligence): the Nakshatra
    // Profile's contribution to this specific prediction — every value is
    // either a direct read of the already-computed Nakshatra Profile
    // (supportingProfileFactors) or a deterministic score/summary built
    // from it and the other already-computed facts above
    // (profileAlignmentScore/profileSummary; see
    // profileAlignmentRuleEvaluator.js). Backend-generated only; Gemini
    // must only explain these, never invent additional profile content.
    supportingProfileFactors: profileAlignment.supportingProfileFactors,
    profileAlignmentScore: profileAlignment.profileAlignmentScore,
    profileSummary: profileAlignment.profileSummary,
    // Structured "why" breakdown (Phase 7.2B requirement 4): which
    // Nakshatra traits supported this prediction, which yogas supported
    // it, which doshas reduced confidence, and which planets/houses
    // influenced it — all direct reads of fields already computed above.
    reasoningBreakdown: {
      nakshatraTraitsSupporting: profileAlignment.supportingProfileFactors.map((f) => f.factor),
      yogasSupporting: supportingYogas.map((y) => y.name),
      doshasReducingConfidence: supportingDoshas.map((d) => d.name),
      planetsInfluencing: dominantPlanet ? [dominantPlanet] : [],
      housesInfluencing: categoryConfig.houses || [],
    },
    explanationMeta:
      `Derived from the ${categoryConfig.label} significator houses/planets (or, for the general theme, the whole chart), ` +
      `the ${mahaLord ?? "unknown"} Mahadasha–${antarLord ?? "unknown"} Antardasha period, already-detected supporting yogas/doshas, ` +
      `and the Nakshatra Profile's alignment (${profileAlignment.profileAlignmentScore}/100) with these same facts. ` +
      `Explanation-only, hedged, non-absolute — not a certainty.`,
  };
}

export default {
  computeConfidence,
  favorabilityBandFor,
  pickPredictionRemedies,
  evaluatePrediction,
};
