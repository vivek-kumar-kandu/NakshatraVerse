// ─────────────────────────────────────────────────────────────────────────
// Planet Strength Engine
//
// NOTE ON SCOPE: the original application (astroEngine.js) never calculated
// or exposed any notion of planetary strength (exaltation/debilitation/
// own-sign scoring, etc.) — it was not part of the existing feature set,
// and birthChartEngine.js has always discarded this function's return
// value. That discard point is what made this module a safe place to add
// real functionality without any risk to the API response shape or
// existing behavior, and it remains so in Priority 3.
//
// Priority 3 extends the Rule Engine (still config-driven, still no
// hardcoded astrology logic) to compute a full professional-grade Planet
// Strength profile per planet:
//   - Dignity: exaltation / debilitation / own sign / neutral (Priority 2)
//   - Retrograde (Vakri) status
//   - Combustion (Asta) status and distance from the Sun
//   - Planetary Friendship (Naisargika Maitri) relative to the sign lord
//   - Natural benefic/malefic (Naisargika Shubha/Ashubha)
//   - Functional benefic/malefic for this chart's Lagna (Karyesha)
//   - Directional strength (Dig Bala)
//   - Foundation Shadbala (Sthana + Dig + Naisargika + Chesta Bala)
// See services/rules/planetStrengthRuleEvaluator.js for the composition of
// the individual rule evaluators that produce each of these.
//
// Its result is still not merged into buildChartJson's output, so the
// frontend, the Gemini prompt, and the /api response are all 100%
// unchanged — this remains a safe, working extension point: a future
// feature request to surface strength scoring in the UI/report only needs
// to wire this return value into structuredJsonBuilder.js (and, if the AI
// narrative should mention it, promptBuilder.js), with no changes needed
// here. See CHANGELOG for a recommended follow-up phase.
// ─────────────────────────────────────────────────────────────────────────
import { evaluatePlanetStrength } from "../rules/planetStrengthRuleEvaluator.js";
import { loadRules } from "../rules/ruleLoader.js";
import logger from "../utils/logger.js";

export function calcPlanetStrength(planetary, lagna, dob, tob) {
  const housesConfig = loadRules("houses");
  const strength = evaluatePlanetStrength(planetary || {}, { dob, tob, lagna, housesConfig });
  logger.debug("Planet strength (computed, not exposed in API response):", strength);
  return strength;
}

export default { calcPlanetStrength };
