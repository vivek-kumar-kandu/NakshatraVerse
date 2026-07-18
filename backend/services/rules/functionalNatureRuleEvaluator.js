// ─────────────────────────────────────────────────────────────────────────
// Functional Nature Rule Evaluator
// Single responsibility: derive each planet's functional benefic/malefic
// role FOR THIS SPECIFIC LAGNA, algorithmically from house lordship rather
// than a hardcoded 12-Lagna lookup table — using the existing
// kendra/trikona/dusthana house groups (rules/houses.json) plus the
// priority rules in rules/functionalNature.json. This keeps the logic
// scalable/config-driven per the Priority 3 requirement instead of
// hardcoding results.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { SIGN_NAMES, SIGN_LORD, PLANETS } from "../astrology/constants.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

// Inverts sign->lord into lord->[signs] (some planets own two signs).
function invertSignLord() {
  const map = {};
  for (const [sign, lord] of Object.entries(SIGN_LORD)) {
    if (!map[lord]) map[lord] = [];
    map[lord].push(sign);
  }
  return map;
}

// House number (1-12) of `sign` counted from `lagnaSign`.
function houseFromLagna(sign, lagnaSign) {
  const diff = SIGN_NAMES.indexOf(sign) - SIGN_NAMES.indexOf(lagnaSign);
  return (((diff % 12) + 12) % 12) + 1;
}

function findRule(rules, id) {
  return rules.find((r) => r.id === id);
}

export function evaluateFunctionalNature(lagna, housesConfig, planetary = {}) {
  const config = loadRules("functionalNature");
  const lordToSigns = invertSignLord();
  const { kendra, trikona, dusthana } = housesConfig.houseGroups;
  const result = {};

  for (const fullKey of PLANETS) {
    const name = plainName(fullKey);
    const signs = lordToSigns[name];

    if (!signs) {
      // Rahu/Ketu (or any planet owning no sign classically) - no house
      // lordship to evaluate. Foundation approximation: soften to neutral
      // when they occupy a kendra/trikona house from this Lagna, otherwise
      // keep/worsen to malefic (see rules/functionalNature.json).
      const occupiedHouse = planetary[fullKey]?.house;
      const inKendraOrTrikona = kendra.includes(occupiedHouse) || trikona.includes(occupiedHouse);
      result[name] = {
        nature: inKendraOrTrikona ? config.nodesFallback.softenedInKendraOrTrikona : config.nodesFallback.worsenedInDusthana,
        ownedHouses: [],
        occupiedHouse,
        reason: config.nodesFallback.description,
      };
      continue;
    }

    const ownedHouses = signs.map((s) => houseFromLagna(s, lagna));
    const ownsKendra = ownedHouses.some((h) => kendra.includes(h));
    const ownsTrikona = ownedHouses.some((h) => trikona.includes(h));
    const ownsDusthana = ownedHouses.some((h) => dusthana.includes(h));
    const isLagnaLord = ownedHouses.includes(1);

    let rule;
    if (isLagnaLord) rule = findRule(config.priorityRules, "lagnaLord");
    else if (ownsKendra && ownsTrikona) rule = findRule(config.priorityRules, "yogakaraka");
    else if (ownsTrikona && !ownsDusthana) rule = findRule(config.priorityRules, "trikonaOnly");
    else if (ownsDusthana && !ownsTrikona && !ownsKendra) rule = findRule(config.priorityRules, "dusthanaOnly");
    else if (ownsKendra && !ownsTrikona && !ownsDusthana) rule = findRule(config.priorityRules, "kendraOnly");
    else if (ownsTrikona && ownsDusthana) rule = findRule(config.priorityRules, "mixedTrikonaDusthana");
    else rule = findRule(config.priorityRules, "default");

    result[name] = { nature: rule.result, ownedHouses, reason: rule.description };
  }
  return result;
}

export default { evaluateFunctionalNature };
