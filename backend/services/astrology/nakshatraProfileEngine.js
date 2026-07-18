// ─────────────────────────────────────────────────────────────────────────
// Nakshatra Profile Engine (Priority 3.2)
// Single responsibility: expand the basic { name, pada } nakshatra fact
// (already computed by planetPositionEngine.calcNakshatra) into the full
// professional Nakshatra profile — Lord, Gana, Yoni, Nadi, Symbol, Deity,
// Nature, and traditional personality/career/relationship/spiritual
// tendencies. Thin, stable adapter over the config-driven rule evaluator,
// exactly like yogaDetectionEngine.js / doshaDetectionEngine.js.
// ─────────────────────────────────────────────────────────────────────────
import { evaluateNakshatraProfile } from "../rules/nakshatraProfileRuleEvaluator.js";

export function calcNakshatraProfile(nakshatra) {
  return evaluateNakshatraProfile(nakshatra);
}

export default { calcNakshatraProfile };
