// ─────────────────────────────────────────────────────────────────────────
// Natural Dignity Rule Evaluator
// Single responsibility: classify each planet's Naisargika (natural, fixed)
// benefic/malefic nature, using config-driven data (rules/naturalDignity.json)
// instead of any hardcoded logic. The Moon is the one exception with a
// dynamic rule: its natural nature depends on lunar Paksha (waxing/waning),
// computed here from the Sun-Moon angular distance rather than statically
// configured, since it genuinely varies per chart.
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

export function evaluateNaturalDignity(planetary, dob, tob) {
  const config = loadRules("naturalDignity");
  const degrees = calcPlanetaryDegrees(dob, tob);
  const result = {};

  const moonEntry = planetary["Moon 🌙"];
  const sunEntry = planetary["Sun ☀️"];
  let moonPhase = null;
  if (moonEntry && sunEntry) {
    const moonLongitude = absoluteLongitude(moonEntry.sign, degrees["Moon 🌙"] ?? 0);
    const sunLongitude = absoluteLongitude(sunEntry.sign, degrees["Sun ☀️"] ?? 0);
    const elongation = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
    moonPhase = elongation < 180 ? "waxing" : "waning";
  }

  for (const fullKey of Object.keys(planetary)) {
    const name = plainName(fullKey);

    if (name === "Moon") {
      result[name] = {
        nature: moonPhase === "waning" ? "mildlyMalefic" : "benefic",
        reason: `Moon is ${moonPhase ?? "unknown"} (Paksha), derived from Sun-Moon angular distance.`,
      };
      continue;
    }

    if (config.benefics.includes(name)) {
      result[name] = { nature: "benefic", reason: "Naisargika (natural) benefic." };
    } else if (config.malefics.includes(name)) {
      result[name] = { nature: "malefic", reason: "Naisargika (natural) malefic." };
    } else {
      result[name] = { nature: "neutral", reason: "Not classified as a fixed natural benefic/malefic." };
    }
  }
  return result;
}

export default { evaluateNaturalDignity };
