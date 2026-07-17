// ─────────────────────────────────────────────────────────────────────────
// Advanced Yoga Engine (Priority 3.2)
// Single responsibility: detect additional classical yogas (Panch
// Mahapurusha, Neecha Bhanga Raja Yoga, Viparita Raja Yoga, Chandra Mangal
// Yoga, Lakshmi Yoga, Saraswati Yoga, Adhi Yoga, and others) beyond the
// Priority 2 base set. Thin, stable adapter over the config-driven rule
// evaluator — mirrors yogaDetectionEngine.js exactly, kept as a separate
// module so the original engine/rules are untouched.
// ─────────────────────────────────────────────────────────────────────────
import { evaluateAdvancedYogas } from "../rules/advancedYogaRuleEvaluator.js";

export function detectAdvancedYogas(planetary, lagna) {
  return evaluateAdvancedYogas(planetary, lagna);
}

export default { detectAdvancedYogas };
