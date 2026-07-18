// ─────────────────────────────────────────────────────────────────────────
// Combustion Rule Evaluator
// Single responsibility: classify each planet as combust (Asta) or not,
// using config-driven orb data (rules/combustion.json) instead of any
// hardcoded logic. Combustion is based on the angular distance between a
// planet's absolute longitude and the Sun's, compared against the planet's
// configured orb (tighter for Mercury/Venus while retrograde).
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { calcPlanetaryDegrees } from "../astrology/planetaryDegreeEngine.js";
import { SIGN_NAMES } from "../astrology/constants.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

function absoluteLongitude(sign, degree) {
  const signIndex = SIGN_NAMES.indexOf(sign);
  return signIndex < 0 ? degree : signIndex * 30 + degree;
}

function angularDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

export function evaluateCombustion(planetary, dob, tob, retrograde = {}) {
  const config = loadRules("combustion");
  const degrees = calcPlanetaryDegrees(dob, tob);
  const result = {};

  const sunEntry = planetary["Sun ☀️"];
  if (!sunEntry) return result;
  const sunLongitude = absoluteLongitude(sunEntry.sign, degrees["Sun ☀️"] ?? 0);

  for (const fullKey of Object.keys(planetary)) {
    const name = plainName(fullKey);

    if (config.excluded.includes(name)) {
      result[name] = { combust: false, distanceFromSun: null };
      continue;
    }

    const entry = planetary[fullKey];
    const longitude = absoluteLongitude(entry.sign, degrees[fullKey] ?? 0);
    const distance = angularDistance(sunLongitude, longitude);

    const retroKey = `${name}Retrograde`;
    const orbKey = retrograde[name] && config.orbs[retroKey] !== undefined ? retroKey : name;
    const orb = config.orbs[orbKey];

    result[name] = {
      combust: orb !== undefined && distance <= orb,
      distanceFromSun: Number(distance.toFixed(2)),
      orbUsed: orb ?? null,
    };
  }
  return result;
}

export default { evaluateCombustion };
