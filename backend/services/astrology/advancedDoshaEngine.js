// ─────────────────────────────────────────────────────────────────────────
// Advanced Dosha Engine (Priority 3.2)
// Single responsibility: detect additional classical doshas (detailed
// Manglik severity, Kaal Sarp subtypes, Pitru Dosha, Guru Chandal Yoga,
// Grahan Yoga, Kemadruma Yoga, Shrapit Yoga) beyond the Priority 2 base
// set. Thin, stable adapter over the config-driven rule evaluator —
// mirrors doshaDetectionEngine.js exactly, kept as a separate module so
// the original engine/rules are untouched.
// ─────────────────────────────────────────────────────────────────────────
import { evaluateAdvancedDoshas } from "../rules/advancedDoshaRuleEvaluator.js";

export function detectAdvancedDoshas(planetary, lagna) {
  return evaluateAdvancedDoshas(planetary, lagna);
}

export default { detectAdvancedDoshas };
