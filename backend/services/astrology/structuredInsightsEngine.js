// ─────────────────────────────────────────────────────────────────────────
// Structured Insights Engine (Priority 3.2 — "AI Report Intelligence";
// extended in V2.0 Phase 7 — Prediction Engine)
// Single responsibility: assemble the richer, already-computed astrology
// facts (Planet Strength, Nakshatra profile, Dasha, Transits, Advanced
// Yogas/Doshas, and — as of Phase 7 — Prediction Engine category/timeline/
// transit-forecast objects) into the "Structured Astrology Data" object
// the architecture diagram places right before Gemini. This is the ONLY
// new module that promptBuilder.js reads from — it does not change
// chart.js's shape, does not touch buildChartJson/buildChartResponsePayload,
// and is never sent to the frontend. Gemini still only ever *explains*
// these backend-computed facts; nothing here performs new astrology
// inference — every value is read from engines that already exist
// (Priority 3.1/3.2) or were added in Phase 7, never invented here.
// ─────────────────────────────────────────────────────────────────────────
import { calcPlanetStrength } from "./planetStrengthEngine.js";
import { calcNakshatraProfile } from "./nakshatraProfileEngine.js";
import { calcDasha } from "./dashaEngine.js";
import { calcTransits } from "./transitEngine.js";
import { detectAdvancedYogas } from "./advancedYogaEngine.js";
import { detectAdvancedDoshas } from "./advancedDoshaEngine.js";
// V2.0 Phase 7 (Prediction Engine) additions — see each module's own
// header for how they reuse the engines above without duplicating logic.
import { generateCategoryPredictions } from "./predictionEngine.js";
import { generatePredictionTimeline } from "./predictionTimelineEngine.js";
import { calcTransitForecast } from "./transitForecastEngine.js";
// V5.2 (AI Timeline): same reuse pattern as the two imports directly
// above — builds Past/Present/Near Future/Next Month/Next 3 Months/
// Next 6 Months/Next Year sections purely by windowing the same
// `dasha.timeline` and calling the same evaluatePrediction() rule
// evaluator predictionTimelineEngine.js already calls. See
// aiTimelineEngine.js's own header for the full rationale.
import { generateAiTimeline } from "./aiTimelineEngine.js";

// Summarizes planetStrengthEngine's per-planet profile into short,
// prompt-friendly "contributor" notes — e.g. which planets are
// exalted/debilitated/combust/retrograde — so Gemini can point to *why* a
// conclusion was reached instead of restating raw data.
function summarizePlanetStrengthContributors(planetStrength) {
  const notes = [];
  for (const [planet, profile] of Object.entries(planetStrength || {})) {
    const tags = [];
    if (profile?.dignity?.state && profile.dignity.state !== "neutral") tags.push(profile.dignity.state);
    if (profile?.retrograde === true) tags.push("retrograde");
    if (profile?.combustion?.combust) tags.push("combust");
    if (profile?.functionalNature?.nature) tags.push(`functionally ${profile.functionalNature.nature}`);
    if (tags.length) notes.push(`${planet}: ${tags.join(", ")}`);
  }
  return notes;
}

/**
 * Build the "Structured Astrology Data" object for the AI explanation
 * layer. Takes the already-computed, authoritative `chart` (whatever
 * computeChart() returned) — never recalculates anything astrology-wise
 * that chart doesn't already contain the inputs for.
 */
export function buildStructuredInsights(chart) {
  const { planetary, lagna, nakshatra, userData, yogas, doshas, numerology } = chart;
  const { dob, tob } = userData;

  const planetStrength = calcPlanetStrength(planetary, lagna, dob, tob);
  const nakshatraProfile = calcNakshatraProfile(nakshatra);
  const dasha = calcDasha(nakshatra, dob, tob);
  const moonSign = planetary["Moon 🌙"]?.sign;
  const transits = calcTransits(planetary, moonSign);
  const advancedYogas = detectAdvancedYogas(planetary, lagna);
  const advancedDoshas = detectAdvancedDoshas(planetary, lagna);
  const transitForecast = calcTransitForecast(planetary, moonSign);

  // V2.0 Phase 7 (Prediction Engine): category predictions, 1/5/10-year
  // timeline, and the Saturn/Jupiter/Rahu-Ketu transit forecast — all
  // built purely from the facts already computed above (dasha, transits,
  // yogas/doshas incl. advanced, planetStrength). Nothing here is a new
  // astrological calculation; it's the same "assemble what's already been
  // computed" role this whole file already plays for Dasha/Transits.
  //
  // V2.0 Phase 7.2B (Nakshatra Profile Intelligence): nakshatraProfile,
  // numerology (chart.numerology — already computed by numerologyEngine.js
  // and already present on `chart`), and transitForecast (moved above,
  // unchanged) are now also passed in, so predictionRuleEvaluator.js can
  // score Profile/Numerology/Transit agreement — still nothing new is
  // calculated here, only additional already-computed facts are wired
  // through.
  const predictions = generateCategoryPredictions({
    planetary, dasha, yogas, doshas, advancedYogas, advancedDoshas, planetStrength,
    nakshatraProfile, numerology, transitForecast,
  });
  const predictionTimeline = generatePredictionTimeline({
    planetary, dasha, yogas, doshas, advancedYogas, advancedDoshas, planetStrength,
    nakshatraProfile, numerology, transitForecast,
  });
  // V5.2 (AI Timeline): purely additive — same inputs as predictionTimeline
  // above, just windowed/categorized differently (see aiTimelineEngine.js).
  const aiTimeline = generateAiTimeline({
    planetary, dasha, yogas, doshas, advancedYogas, advancedDoshas, planetStrength,
    nakshatraProfile, numerology, transitForecast,
  });

  return {
    planetStrengthContributors: summarizePlanetStrengthContributors(planetStrength),
    // V5.0 Phase 5B (Explorer Infrastructure — Backend Integration): the
    // full per-planet Planet Strength profile (dignity, retrograde,
    // combustion, friendship, natural/functional benefic-malefic, Dig
    // Bala, Shadbala, aspect influence) was already computed above for
    // the Gemini-facing summary (`planetStrengthContributors`) but never
    // exposed as its own field. Adding it here — unchanged, unsummarized —
    // is exactly the "wire this return value through" extension point
    // planetStrengthEngine.js's own header already calls out. Nothing is
    // recalculated; this is the same `planetStrength` object every line
    // above already had in scope.
    planetStrength,
    nakshatraProfile,
    dasha,
    transits,
    advancedYogas,
    advancedDoshas,
    predictions,
    predictionTimeline,
    // V5.2 (AI Timeline): purely additive field — every existing key above
    // and below is unchanged. See buildAiTimelineApiFields()
    // (predictionApiMapper.js) for how this becomes the public
    // `report.aiTimeline` field.
    aiTimeline,
    transitForecast,
    contributingFactors: {
      // Explicit "why" pointers for requirement 7 (AI Report Intelligence):
      // which planets/yogas/doshas/strengths fed into this reading.
      planetsContributing: Object.keys(planetary || {}).map((k) => k.split(" ")[0]),
      yogasContributing: [...(yogas || []), ...advancedYogas].map((y) => y.name),
      doshasContributing: [...(doshas || []), ...advancedDoshas].map((d) => d.name),
      strengthsAndWeaknesses: summarizePlanetStrengthContributors(planetStrength),
    },
  };
}

export default { buildStructuredInsights };
