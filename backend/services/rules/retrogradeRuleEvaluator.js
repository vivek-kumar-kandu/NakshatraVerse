// ─────────────────────────────────────────────────────────────────────────
// Retrograde Rule Evaluator
// Single responsibility: classify each planet as retrograde (Vakri) or
// direct, using config-driven data (rules/retrograde.json) instead of any
// hardcoded logic. Sun/Moon are never retrograde; Rahu/Ketu are always
// treated as retrograde by convention; the remaining five grahas are
// evaluated via a deterministic value derived from the synthetic per-planet
// degree (see planetaryDegreeEngine.js) — consistent with this engine's
// seed-based model since no real ephemeris data is available.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { calcPlanetaryDegrees } from "../astrology/planetaryDegreeEngine.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

export function evaluateRetrograde(planetary, dob, tob) {
  const config = loadRules("retrograde");
  const degrees = calcPlanetaryDegrees(dob, tob);
  const result = {};

  for (const fullKey of Object.keys(planetary)) {
    const name = plainName(fullKey);

    if (config.neverRetrograde.includes(name)) {
      result[name] = false;
      continue;
    }
    if (config.alwaysRetrograde.includes(name)) {
      result[name] = true;
      continue;
    }

    const degree = degrees[fullKey] ?? 0;
    // Deterministic pseudo-uniform value in [0, 1) derived from the
    // synthetic degree, compared against the configured threshold.
    const pseudoRandom = (degree * 7) % 1;
    result[name] = pseudoRandom < config.retrogradeThreshold;
  }
  return result;
}

export default { evaluateRetrograde };
