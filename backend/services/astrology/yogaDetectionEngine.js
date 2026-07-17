// ─────────────────────────────────────────────────────────────────────────
// Yoga Detection Engine
// Single responsibility: detect classical yogas from planetary house
// placements. Rule *data* (which yogas, which conditions, which wording)
// now lives in backend/rules/yogas.json and is evaluated by the config-
// driven Rule Engine (services/rules/) — this module is a thin, stable
// adapter so callers (birthChartEngine.js) never had to change. Output
// shape/content is unchanged from the original hardcoded implementation.
// ─────────────────────────────────────────────────────────────────────────
import { evaluateYogas } from "../rules/yogaRuleEvaluator.js";

export function detectYogas(planetary) {
  return evaluateYogas(planetary);
}

export default { detectYogas };
