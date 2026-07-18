// ─────────────────────────────────────────────────────────────────────────
// Advanced Dosha Rule Evaluator (Priority 3.2)
// Single responsibility: run the config-driven advanced dosha rules
// (rules/doshasAdvanced.json) — Pitru Dosha, Guru Chandal Yoga, Grahan
// Yoga, Kemadruma Yoga, Shrapit Yoga — exactly like doshaRuleEvaluator.js
// does for rules/doshas.json, PLUS two data-driven refinements that need a
// small amount of per-chart lookup logic rather than a single AND-rule:
//   - Manglik Dosha severity, by house (config-driven lookup table).
//   - Kaal Sarp Dosha subtype (one of the 12 classical types), by which
//     house Rahu occupies (config-driven lookup table).
// This is a new, separate evaluator — doshaRuleEvaluator.js and
// rules/doshas.json (Priority 2/3.1) are completely untouched.
//
// Priority 6 / V2.0 addition: every returned item (rule-based AND the two
// data-driven special cases) is additionally enriched (via
// insightEnrichmentEvaluator.js / rules/insightMetadata.json) with
// influence/severity/remedies/explanationMeta — purely additive fields.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { ruleMatches, interpolate } from "./ruleEngine.js";
import { houseOf } from "../astrology/housePlacementEngine.js";
import { PLANETS } from "../astrology/constants.js";
import { enrichInsight } from "./insightEnrichmentEvaluator.js";

const PLAIN_TO_FULL_KEY = PLANETS.reduce((map, fullKey) => {
  map[fullKey.split(" ")[0]] = fullKey;
  return map;
}, {});

function houseOfPlain(planetary, plainName) {
  return houseOf(planetary, PLAIN_TO_FULL_KEY[plainName] || plainName);
}

export function evaluateAdvancedDoshas(planetary, lagna) {
  const config = loadRules("doshasAdvanced");
  const housesConfig = loadRules("houses");
  const context = { lagna };

  const doshas = [];
  for (const rule of config.rules) {
    if (ruleMatches(rule, planetary, housesConfig, context)) {
      doshas.push(
        enrichInsight("doshas", {
          name: rule.name,
          detail: interpolate(rule.detailTemplate, planetary),
        })
      );
    }
  }

  // Detailed Manglik Dosha: reuse the same houseGroup as the base
  // Priority 2 rule (doshas.json's mangalDosha), but attach a severity
  // level from the config-driven lookup table instead of a flat detail.
  const marsHouse = houseOfPlain(planetary, "Mars");
  const manglikHouses = housesConfig?.houseGroups?.manglikHouses || [];
  if (marsHouse && manglikHouses.includes(marsHouse)) {
    const severity = config.manglikSeverityByHouse[String(marsHouse)] || "mild";
    doshas.push(
      enrichInsight("doshas", {
        name: "Manglik Dosha (Detailed)",
        detail: `Mars in house ${marsHouse} is traditionally associated with ${severity}-severity Manglik (Mangal) Dosha.`,
        severity,
      })
    );
  }

  // Kaal Sarp Dosha subtype: only meaningful once the base condition (all
  // seven classical planets between the Rahu-Ketu axis) is true. Reuse
  // that exact check via the Priority 2 rule definition in doshas.json so
  // the two detections can never disagree.
  const { rules: baseDoshaRules } = loadRules("doshas");
  const kaalSarpRule = baseDoshaRules.find((r) => r.id === "kaalSarpDosha");
  if (kaalSarpRule && ruleMatches(kaalSarpRule, planetary, housesConfig)) {
    const rahuHouse = houseOfPlain(planetary, "Rahu");
    const subtype = config.kaalSarpTypesByRahuHouse[String(rahuHouse)];
    if (subtype) {
      doshas.push(
        enrichInsight("doshas", {
          name: `Kaal Sarp Dosha — ${subtype}`,
          detail: `With Rahu in house ${rahuHouse}, this Kaal Sarp Dosha configuration is traditionally classified as ${subtype}.`,
        })
      );
    }
  }

  return doshas;
}

export default { evaluateAdvancedDoshas };
