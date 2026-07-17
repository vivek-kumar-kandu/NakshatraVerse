// ─────────────────────────────────────────────────────────────────────────
// Remedy Engine
// Single responsibility: derive traditional remedies from the Lagna lord
// and any detected doshas. Remedy *content* (templates, gemstone/mantra/
// day/deity data, dosha→remedy mapping) now lives in
// backend/rules/remedies.json and is evaluated by the config-driven Rule
// Engine (services/rules/) — this module is a thin, stable adapter so
// callers (birthChartEngine.js) never had to change. Output shape/content
// is unchanged from the original hardcoded implementation.
// ─────────────────────────────────────────────────────────────────────────
import { evaluateRemedies } from "../rules/remedyRuleEvaluator.js";

export function deriveRemedies({ lagna, doshas }) {
  return evaluateRemedies({ lagna, doshas });
}

export default { deriveRemedies };
