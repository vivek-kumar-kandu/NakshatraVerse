// ─────────────────────────────────────────────────────────────────────────
// Friendship Rule Evaluator
// Single responsibility: classify each planet's relationship (friend /
// neutral / enemy / own sign) with the lord of the sign it currently
// occupies, using the config-driven Naisargika Maitri table
// (rules/planetaryFriendship.json) instead of any hardcoded logic. This
// feeds Sthana Bala in the Shadbala foundation calculation.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { SIGN_LORD } from "../astrology/constants.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

export function evaluateFriendship(planetary) {
  const table = loadRules("planetaryFriendship");
  const result = {};

  for (const fullKey of Object.keys(planetary)) {
    const name = plainName(fullKey);
    const { sign } = planetary[fullKey];
    const signLord = SIGN_LORD[sign];

    if (signLord === name) {
      result[name] = { signLord, relation: "self" };
      continue;
    }

    const rel = table[name];
    let relation = "neutral";
    if (rel?.friends?.includes(signLord)) relation = "friend";
    else if (rel?.enemies?.includes(signLord)) relation = "enemy";
    else if (rel?.neutral?.includes(signLord)) relation = "neutral";

    result[name] = { signLord: signLord || null, relation };
  }
  return result;
}

export default { evaluateFriendship };
