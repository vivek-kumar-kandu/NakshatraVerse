// ─────────────────────────────────────────────────────────────────────────
// Insight Enrichment Evaluator (Priority 6 / V2.0)
// Single responsibility: take the plain [{ name, detail }] items produced
// by the yoga/dosha rule evaluators and attach richer, config-driven
// metadata (rules/insightMetadata.json) — positive/negative influence,
// severity (where applicable), suggested remedies (where available), and
// an explanationMeta hint for Gemini — WITHOUT altering the existing
// name/detail fields. This is purely additive: any code still reading
// only `.name`/`.detail` (e.g. promptBuilder.js's yogaList/doshaList) is
// completely unaffected, and no existing rule file or evaluator's
// matching logic is touched.
//
// Lookup strategy, in order:
//   1. Exact match on the item's `name` in insightMetadata.json.
//   2. Prefix match against known family keys (handles dynamically-
//      suffixed names, e.g. a specific "Kaal Sarp Dosha — <subtype>" or a
//      specific "Parivartana Yoga (<A>-<B>)" pair) via each kind's
//      `_<family>Default` entry or a same-prefix exact key.
//   3. A safe generic fallback so an unrecognized name is enriched rather
//      than causing the response to lose data.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";

function findFamilyMatch(config, name) {
  // A dynamically-suffixed dosha, e.g. "Kaal Sarp Dosha — Anant Kaal Sarp
  // Dosha", should reuse the base "Kaal Sarp Dosha" entry's metadata.
  for (const key of Object.keys(config)) {
    if (key.startsWith("_")) continue;
    if (name.startsWith(key)) return config[key];
  }
  // Parivartana Yoga pairs (e.g. "Parivartana Yoga (Sun-Moon)") share one
  // generic entry rather than 21 near-identical copies.
  if (name.startsWith("Parivartana Yoga") && config._parivartanaDefault) {
    return config._parivartanaDefault;
  }
  return null;
}

function genericFallback(kind) {
  return kind === "doshas"
    ? {
        influence: "negative",
        explanationMeta: "Traditionally associated with a challenging classical combination; consult a qualified astrologer for a personalized interpretation.",
      }
    : {
        influence: "positive",
        explanationMeta: "Traditionally associated with a favorable classical combination; consult a qualified astrologer for a personalized interpretation.",
      };
}

/**
 * @param {"yogas"|"doshas"} kind
 * @param {{name: string, detail: string, [key: string]: any}} item
 */
export function enrichInsight(kind, item) {
  const metadata = loadRules("insightMetadata");
  const config = metadata[kind] || {};

  const meta = Object.prototype.hasOwnProperty.call(config, item.name)
    ? config[item.name]
    : findFamilyMatch(config, item.name) || genericFallback(kind);

  const enriched = { ...item, influence: meta.influence };
  if (meta.severity && !enriched.severity) enriched.severity = meta.severity;
  if (meta.remedies) enriched.remedies = meta.remedies;
  enriched.explanationMeta = meta.explanationMeta;
  return enriched;
}

/**
 * @param {"yogas"|"doshas"} kind
 * @param {Array<{name: string, detail: string}>} items
 */
export function enrichInsights(kind, items) {
  return (items || []).map((item) => enrichInsight(kind, item));
}

export default { enrichInsight, enrichInsights };
