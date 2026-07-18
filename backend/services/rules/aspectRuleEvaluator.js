// ─────────────────────────────────────────────────────────────────────────
// Aspect (Drishti) Rule Evaluator (Priority 6 / V2.0)
// Single responsibility: compute classical planetary aspects (drishti)
// from config-driven data (rules/aspects.json — every planet aspects the
// 7th house ahead of it; Mars/Jupiter/Saturn have additional special
// aspects) instead of any hardcoded logic. rules/aspects.json existed
// since Priority 3.2 but was intentionally NOT wired into the detection
// pipeline yet ("safe extension point" — see its _comment); this evaluator
// is that wiring, added now for the Phase 6 "Aspect influence" requirement
// without touching aspects.json's shape or any existing behavior.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { houseOf } from "../astrology/housePlacementEngine.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

// Classical inclusive "Nth house counted from" a given house (1-12): the
// planet's own house counts as the 1st, so the "7th house from house 5"
// is house 11, not house 12. This matches rules/aspects.json's stated
// semantics ("the 4th and 8th houses from its position", etc.) and the
// classical Vedic convention used throughout the rest of the Rule Engine
// (see houseDistanceFromIn in ruleEngine.js, which counts the same way).
function houseAhead(house, nthHouse) {
  return ((house - 1 + (nthHouse - 1)) % 12) + 1;
}

/**
 * @param {object} planetary - the chart's planetary position map.
 * @returns {{
 *   housesAspectedByPlanet: Record<string, number[]>,
 *   aspectedByPlanet: Record<string, string[]>
 * }}
 *   housesAspectedByPlanet: for each planet, which houses it casts an
 *     aspect on (its own 7th-house aspect plus any special aspects).
 *   aspectedByPlanet: for each planet, the list of OTHER planets whose
 *     aspect currently falls on its occupied house (i.e. aspects received).
 */
export function evaluateAspects(planetary) {
  const config = loadRules("aspects");
  const planets = planetary || {};

  const houseOfPlanet = {};
  for (const fullKey of Object.keys(planets)) {
    houseOfPlanet[plainName(fullKey)] = houseOf(planets, fullKey);
  }

  const housesAspectedByPlanet = {};
  for (const [name, house] of Object.entries(houseOfPlanet)) {
    if (!house) {
      housesAspectedByPlanet[name] = [];
      continue;
    }
    const aheadList = [
      config.defaultAspect.housesAhead,
      ...(config.specialAspects?.[name]?.housesAhead || []),
    ];
    // De-duplicate in case a special aspect ever coincides with the
    // default 7th-house aspect.
    housesAspectedByPlanet[name] = [...new Set(aheadList.map((ahead) => houseAhead(house, ahead)))];
  }

  const aspectedByPlanet = {};
  for (const name of Object.keys(houseOfPlanet)) aspectedByPlanet[name] = [];

  for (const [aspector, houses] of Object.entries(housesAspectedByPlanet)) {
    for (const [target, targetHouse] of Object.entries(houseOfPlanet)) {
      if (aspector === target || !targetHouse) continue;
      if (houses.includes(targetHouse)) {
        aspectedByPlanet[target].push(aspector);
      }
    }
  }

  return { housesAspectedByPlanet, aspectedByPlanet };
}

export default { evaluateAspects };
