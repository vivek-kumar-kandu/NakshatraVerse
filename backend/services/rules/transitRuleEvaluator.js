// ─────────────────────────────────────────────────────────────────────────
// Transit (Gochar) Rule Evaluator (Priority 3.2)
// Single responsibility: given a deterministic "current sky" transit sign
// per slow-moving planet (Saturn, Jupiter, Rahu, Ketu) and the natal Moon
// sign, compute the classical house-from-Moon count and look up its
// config-driven effect text (rules/transitEffects.json) plus any special
// classical flags (Sade Sati, Kantaka Shani, Ashtama Shani for Saturn).
//
// Like the rest of this backend, there is no real ephemeris — transit
// positions are derived from a deterministic, date-seeded formula (see
// transitEngine.js), consistent with planetPositionEngine.js's own
// documented approximation philosophy.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { SIGN_NAMES } from "../astrology/constants.js";

function houseFromMoon(natalMoonSign, transitSign) {
  const moonIdx = SIGN_NAMES.indexOf(natalMoonSign);
  const transitIdx = SIGN_NAMES.indexOf(transitSign);
  if (moonIdx < 0 || transitIdx < 0) return null;
  return ((transitIdx - moonIdx + 12) % 12) + 1;
}

export function evaluateTransit(planetName, transitSign, natalMoonSign) {
  const config = loadRules("transitEffects");
  const house = houseFromMoon(natalMoonSign, transitSign);
  const effect = house ? config.effects[planetName]?.[String(house)] : null;

  const flags = [];
  if (planetName === "Saturn" && house) {
    if (config.sadeSatiHouses.includes(house)) flags.push({ name: "Sade Sati", note: config.sadeSatiNote });
    if (config.kantakaShaniHouses.includes(house)) flags.push({ name: "Kantaka Shani", note: config.kantakaShaniNote });
    if (house === config.ashtamaShaniHouse) flags.push({ name: "Ashtama Shani", note: config.ashtamaShaniNote });
  }

  return {
    planet: planetName,
    transitSign,
    natalMoonSign,
    houseFromMoon: house,
    effect: effect || "Not enough data to determine this transit's effect.",
    flags,
  };
}

export default { evaluateTransit };
