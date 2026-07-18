// ─────────────────────────────────────────────────────────────────────────
// Dosha Detection Engine
// Single responsibility: detect classical doshas from planetary house
// placements. Rule *data* (which doshas, which conditions, which wording)
// now lives in backend/rules/doshas.json and is evaluated by the config-
// driven Rule Engine (services/rules/) — this module is a thin, stable
// adapter so callers (birthChartEngine.js) never had to change. Output
// shape/content is unchanged from the original hardcoded implementation.
// ─────────────────────────────────────────────────────────────────────────
import { evaluateDoshas } from "../rules/doshaRuleEvaluator.js";

export function detectDoshas(planetary) {
  return evaluateDoshas(planetary);
}

export default { detectDoshas };
