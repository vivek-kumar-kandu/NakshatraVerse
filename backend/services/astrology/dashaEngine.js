// ─────────────────────────────────────────────────────────────────────────
// Vimshottari Dasha Engine (Priority 3.2)
// Single responsibility: compute Mahadasha / Antardasha / remaining Dasha /
// full timeline from the already-computed birth Nakshatra. Thin, stable
// adapter over the config-driven rule evaluator — mirrors
// yogaDetectionEngine.js / doshaDetectionEngine.js / nakshatraProfileEngine.js.
// ─────────────────────────────────────────────────────────────────────────
import { calcMoonLongitude } from "./planetPositionEngine.js";
import { evaluateVimshottariDasha } from "../rules/dashaRuleEvaluator.js";

export function calcDasha(nakshatra, dob, tob, asOf = new Date()) {
  const moonLongitude = calcMoonLongitude(dob, tob);
  return evaluateVimshottariDasha(nakshatra, moonLongitude, dob, asOf);
}

export default { calcDasha };
