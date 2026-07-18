// ─────────────────────────────────────────────────────────────────────────
// Prediction Category Engine (V2.0 Phase 7 — Prediction Engine)
// Single responsibility: produce the 7 required backend prediction
// objects — Career, Finance, Marriage, Education, Health, Family,
// Spiritual Growth — for the CURRENT Mahadasha/Antardasha period. Thin,
// stable adapter over the config-driven rule evaluator, mirroring
// dashaEngine.js / transitEngine.js / yogaDetectionEngine.js exactly:
// this module contains no astrology logic itself, only wiring already-
// computed chart facts into predictionRuleEvaluator.js.
//
// Every input here (dasha, yogas/doshas, planetStrength) is something the
// backend has already calculated elsewhere — nothing is invented in this
// file, and nothing here ever calls Gemini. Gemini (via promptBuilder.js)
// only ever explains these already-computed objects.
// ─────────────────────────────────────────────────────────────────────────
import { evaluatePrediction } from "../rules/predictionRuleEvaluator.js";

const CATEGORY_KEYS = ["career", "finance", "marriage", "education", "health", "family", "spiritualGrowth"];

/**
 * @param {object} params
 * @param {object} params.planetary - natal planetary positions
 * @param {object} params.dasha - calcDasha() output (must have .available)
 * @param {Array} params.yogas - base-engine yogas
 * @param {Array} params.doshas - base-engine doshas
 * @param {Array} params.advancedYogas
 * @param {Array} params.advancedDoshas
 * @param {object} params.planetStrength - calcPlanetStrength() output
 * @param {object} [params.nakshatraProfile] - nakshatraProfileEngine.js output (Phase 7.2B; optional/additive — only strengthens scoring/reasoning, never required)
 * @param {object} [params.numerology] - numerologyEngine.js output {mulank, bhagyank} (Phase 7.2B; optional/additive)
 * @param {object} [params.transitForecast] - transitForecastEngine.js output {saturn, jupiter, rahuKetu} (Phase 7.2B; optional/additive)
 * @returns {Array} one prediction object per category (see predictionRuleEvaluator.js#evaluatePrediction for shape)
 */
export function generateCategoryPredictions({ planetary, dasha, yogas, doshas, advancedYogas, advancedDoshas, planetStrength, nakshatraProfile, numerology, transitForecast }) {
  if (!dasha?.available) return [];

  const allYogas = [...(yogas || []), ...(advancedYogas || [])];
  const allDoshas = [...(doshas || []), ...(advancedDoshas || [])];

  const ctx = {
    planetary,
    mahadasha: dasha.currentMahadasha,
    antardasha: dasha.currentAntardasha,
    timePeriod: dasha.currentMahadasha,
    yogas: allYogas,
    doshas: allDoshas,
    planetStrength,
    nakshatraProfile,
    numerology,
    transitForecast,
  };

  return CATEGORY_KEYS.map((key) => evaluatePrediction(key, ctx));
}

export default { generateCategoryPredictions };
