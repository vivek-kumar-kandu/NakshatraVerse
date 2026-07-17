// ─────────────────────────────────────────────────────────────────────────
// Dosha Rule Evaluator
// Single responsibility: run the config-driven dosha rules (rules/doshas.json)
// against a planetary chart and return the same [{ name, detail }] shape
// the original hardcoded doshaDetectionEngine.js produced.
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

export function evaluateDoshas(planetary) {
  const { rules } = loadRules("doshas");
  const housesConfig = loadRules("houses");

  const doshas = [];
  for (const rule of rules) {
    if (ruleMatches(rule, planetary, housesConfig)) {
      doshas.push(
        enrichInsight("doshas", {
          name: rule.name,
          detail: interpolate(rule.detailTemplate, planetary),
        })
      );
    }
  }
  return doshas;
}

export default { evaluateDoshas };
