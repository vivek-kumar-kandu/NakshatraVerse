// ─────────────────────────────────────────────────────────────────────────
// Dig Bala (Directional Strength) Rule Evaluator
// Single responsibility: compute each planet's directional strength, using
// config-driven data (rules/digBala.json) instead of any hardcoded logic.
// Strength is maximal in the planet's configured "strongest house" and
// falls off linearly to zero at the opposite house — see rules/digBala.json
// for why this house-level approximation is this phase's intentional scope.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

function cyclicHouseDistance(a, b) {
  const diff = Math.abs(a - b) % 12;
  return Math.min(diff, 12 - diff);
}

export function evaluateDigBala(planetary) {
  const config = loadRules("digBala");
  const result = {};

  for (const fullKey of Object.keys(planetary)) {
    const name = plainName(fullKey);
    const strongestHouse = config.strongestHouse[name];

    if (strongestHouse === undefined) {
      result[name] = { virupas: null, strongestHouse: null, note: "Not applicable in this foundation phase (see rules/digBala.json)." };
      continue;
    }

    const house = planetary[fullKey].house;
    const distance = cyclicHouseDistance(house, strongestHouse);
    const virupas = Number((config.maxVirupas * (1 - distance / 6)).toFixed(2));

    result[name] = { virupas, strongestHouse, currentHouse: house, houseDistance: distance };
  }
  return result;
}

export default { evaluateDigBala };
