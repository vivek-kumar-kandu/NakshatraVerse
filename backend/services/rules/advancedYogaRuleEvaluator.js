// ─────────────────────────────────────────────────────────────────────────
// Advanced Yoga Rule Evaluator (Priority 3.2)
// Single responsibility: run the config-driven advanced yoga rules
// (rules/yogasAdvanced.json) against a planetary chart, exactly like
// yogaRuleEvaluator.js does for rules/yogas.json — but additionally passes
// the chart's Lagna as evaluation context, since a few of these rules
// (Viparita Raja Yoga, Neecha Bhanga) need `houseLordInHouses` to resolve
// house-sign-lord facts. This is a new, separate evaluator (not a change
// to yogaRuleEvaluator.js) so the original Priority 2/3.1 yoga detection
// path is completely untouched.
//
// Priority 6 / V2.0 addition: every returned item is additionally enriched
// (via insightEnrichmentEvaluator.js / rules/insightMetadata.json) with
// influence/severity/remedies/explanationMeta — purely additive fields.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { ruleMatches, interpolate } from "./ruleEngine.js";
import { enrichInsight } from "./insightEnrichmentEvaluator.js";

export function evaluateAdvancedYogas(planetary, lagna) {
  const { rules } = loadRules("yogasAdvanced");
  const housesConfig = loadRules("houses");
  const context = { lagna };

  const yogas = [];
  for (const rule of rules) {
    if (ruleMatches(rule, planetary, housesConfig, context)) {
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

export default { evaluateAdvancedYogas };
