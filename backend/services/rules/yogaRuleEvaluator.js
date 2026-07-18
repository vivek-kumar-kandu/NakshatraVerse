// ─────────────────────────────────────────────────────────────────────────
// Yoga Rule Evaluator
// Single responsibility: run the config-driven yoga rules (rules/yogas.json)
// against a planetary chart and return the same [{ name, detail }] shape
// the original hardcoded yogaDetectionEngine.js produced.
//
// Priority 6 / V2.0 addition: every returned item is additionally enriched
// (via insightEnrichmentEvaluator.js / rules/insightMetadata.json) with
// influence/severity/remedies/explanationMeta — purely additive fields
// appended after name/detail, so existing consumers reading only
// name/detail are unaffected.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { ruleMatches, interpolate } from "./ruleEngine.js";
import { enrichInsight } from "./insightEnrichmentEvaluator.js";

export function evaluateYogas(planetary) {
  const { rules } = loadRules("yogas");
  const housesConfig = loadRules("houses");

  const yogas = [];
  for (const rule of rules) {
    if (ruleMatches(rule, planetary, housesConfig)) {
      yogas.push(
        enrichInsight("yogas", {
          name: rule.name,
          detail: interpolate(rule.detailTemplate, planetary),
        })
      );
    }
  }
  return yogas;
}

export default { evaluateYogas };
