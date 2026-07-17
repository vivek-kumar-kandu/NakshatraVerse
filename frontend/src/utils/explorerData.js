// ─────────────────────────────────────────────────────────────────────────
// explorerData (V5.0 Phase 5B — Explorer Infrastructure: Backend Integration)
//
// Small, read-only helpers shared by the eight Explorer detail panels.
// Every function here only reads and cross-references fields the backend
// has already computed and returned on `report` (report.predictions,
// report.chart.yogas/doshas, report.planetStrength, ...) — none of them
// perform astrology calculation, scoring, or interpretation of their own.
// This is the same "assemble what's already been computed" role
// structuredInsightsEngine.js plays on the backend, just for presentation
// on the frontend.
// ─────────────────────────────────────────────────────────────────────────

// "Sun ☀️" -> "Sun" — report.planetStrength (and predictions'
// dominantPlanet/supportingPlanets) key/refer to planets by their plain
// name, while `planetary`/the side panel's item ids use the full
// emoji-suffixed constant. Both already exist verbatim elsewhere in this
// codebase (e.g. structuredInsightsEngine.js's own `plainName`
// convention) — this just mirrors that on the frontend.
export function plainPlanetName(fullKey) {
  return typeof fullKey === "string" ? fullKey.split(" ")[0] : fullKey;
}

// Every category prediction (report.predictions[]) that named this yoga
// or dosha as a supporting factor — i.e. the backend's own record of
// which predictions this finding contributed to.
export function predictionsCiting(report, kind, name) {
  const predictions = report?.predictions || [];
  const key = kind === "yoga" ? "supportingYogas" : "supportingDoshas";
  return predictions.filter((p) => (p[key] || []).some((entry) => entry.name === name));
}

// Every category prediction whose dominant planet or supporting-planets
// list names this plain planet name.
export function predictionsForPlanet(report, plainName) {
  const predictions = report?.predictions || [];
  return predictions.filter(
    (p) => p.dominantPlanet === plainName || (p.supportingPlanets || []).includes(plainName)
  );
}

// Every category prediction whose supporting-houses list includes this
// house number.
export function predictionsForHouse(report, houseNumber) {
  const predictions = report?.predictions || [];
  return predictions.filter((p) => (p.supportingHouses || []).includes(houseNumber));
}

// Union of every `suggestedRemedies` entry (already `{ type, detail }`,
// backend-computed) across a set of predictions, deduplicated by type —
// used so a Planet/House/Yoga/Dosha detail panel can show "remedies
// relevant to this selection" without inventing a new remedy source.
export function remediesFromPredictions(predictions) {
  const seen = new Map();
  for (const p of predictions || []) {
    for (const r of p.suggestedRemedies || []) {
      if (!seen.has(r.type)) seen.set(r.type, r);
    }
  }
  return [...seen.values()];
}

export default {
  plainPlanetName,
  predictionsCiting,
  predictionsForPlanet,
  predictionsForHouse,
  remediesFromPredictions,
};
