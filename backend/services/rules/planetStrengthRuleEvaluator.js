// ─────────────────────────────────────────────────────────────────────────
// Planet Strength Rule Evaluator
// Single responsibility: orchestrate all planet-strength sub-evaluators
// (dignity, retrograde, combustion, friendship, natural dignity,
// functional nature, Dig Bala, foundation Shadbala) into one structured
// per-planet result, using config-driven data throughout
// (rules/exaltation.json, rules/debilitation.json, rules/planetStrength.json,
// rules/retrograde.json, rules/combustion.json, rules/planetaryFriendship.json,
// rules/naturalDignity.json, rules/functionalNature.json, rules/digBala.json,
// rules/naisargikaBala.json, rules/shadbala.json) instead of any hardcoded
// astrology logic. Each concern lives in its own focused evaluator module
// (Separation of Concerns); this file only composes them.
//
// This is genuinely computed here, but see
// services/astrology/planetStrengthEngine.js for why its result is still
// not merged into the API response — that boundary is what keeps this
// whole feature 100% backward compatible with the existing pipeline,
// API contract, and frontend.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { SIGN_LORD, PLANETS } from "../astrology/constants.js";
import { evaluateRetrograde } from "./retrogradeRuleEvaluator.js";
import { evaluateCombustion } from "./combustionRuleEvaluator.js";
import { evaluateFriendship } from "./friendshipRuleEvaluator.js";
import { evaluateNaturalDignity } from "./naturalDignityRuleEvaluator.js";
import { evaluateFunctionalNature } from "./functionalNatureRuleEvaluator.js";
import { evaluateDigBala } from "./digBalaRuleEvaluator.js";
import { evaluateShadbala } from "./shadbalaRuleEvaluator.js";
import { evaluateAspects } from "./aspectRuleEvaluator.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

// Sign dignity (exalted / debilitated / own sign / neutral) — unchanged
// logic from the original Priority 2 implementation.
function evaluateDignity(planetary) {
  const exaltation = loadRules("exaltation");
  const debilitation = loadRules("debilitation");
  const { states } = loadRules("planetStrength");

  const result = {};
  for (const fullKey of PLANETS) {
    const name = plainName(fullKey);
    const entry = planetary[fullKey];
    if (!entry) continue;
    const { sign } = entry;

    let stateKey;
    if (exaltation[name] && exaltation[name] === sign) {
      stateKey = "exalted";
    } else if (debilitation[name] && debilitation[name] === sign) {
      stateKey = "debilitated";
    } else if (SIGN_LORD[sign] === name) {
      stateKey = "ownSign";
    } else {
      stateKey = "neutral";
    }

    const state = states[stateKey];
    result[name] = { sign, state: stateKey, label: state.label, score: state.score };
  }
  return result;
}

// ── Priority 6 (V2.0) addition: Aspect Influence ────────────────────────
// Summarizes the aspects a planet receives (from aspectRuleEvaluator.js,
// itself driven by rules/aspects.json) into a benefic/malefic tally and a
// net influence, using the SAME natural benefic/malefic classification
// (rules/naturalDignity.json via naturalDignityRuleEvaluator.js) already
// computed for this chart — no new hardcoded benefic/malefic table.
function evaluateAspectInfluence(planetary, naturalDignity) {
  const { aspectedByPlanet, housesAspectedByPlanet } = evaluateAspects(planetary);
  const result = {};

  for (const name of Object.keys(aspectedByPlanet)) {
    const aspectors = aspectedByPlanet[name] || [];
    let beneficCount = 0;
    let maleficCount = 0;
    for (const aspector of aspectors) {
      const nature = naturalDignity[aspector]?.nature;
      if (nature === "benefic") beneficCount += 1;
      else if (nature === "malefic" || nature === "mildlyMalefic") maleficCount += 1;
    }
    result[name] = {
      aspectedBy: aspectors,
      housesAspected: housesAspectedByPlanet[name] || [],
      beneficAspectCount: beneficCount,
      maleficAspectCount: maleficCount,
      netInfluence: beneficCount - maleficCount,
    };
  }
  return result;
}

// ── Priority 6 (V2.0) addition: Improved Dignity Scoring ────────────────
// Adjusts the Priority 2 base dignity score with a small, transparent
// aspect-based modifier (+1 per net benefic aspect, -1 per net malefic
// aspect, using aspectInfluence.netInfluence computed above) rather than
// replacing it — dignity.score (Priority 2) is preserved unchanged, and
// this new adjustedScore is additive/derived, not a substitution.
function computeAdjustedScore(baseScore, aspectInfluence) {
  const modifier = aspectInfluence?.netInfluence ?? 0;
  return baseScore + modifier;
}

// ── Priority 6 (V2.0) addition: Explanation Metadata ────────────────────
// Builds a single human-readable "why" sentence per planet from all the
// already-computed facts, for Gemini (via structuredInsightsEngine.js) to
// draw on directly instead of re-deriving reasoning from raw fields.
function buildExplanation(name, profile) {
  const clauses = [];
  const dignityLabel = profile.dignity?.label;
  if (dignityLabel && dignityLabel !== "Neutral") clauses.push(`is ${dignityLabel.toLowerCase()} in ${profile.sign}`);
  else if (profile.sign) clauses.push(`is placed in ${profile.sign}`);
  if (profile.retrograde) clauses.push("is retrograde (Vakri)");
  if (profile.combustion?.combust) clauses.push("is combust (Asta) due to proximity to the Sun");
  if (profile.friendship?.relation === "friend") clauses.push(`sits in a friendly sign (lord ${profile.friendship.signLord})`);
  else if (profile.friendship?.relation === "enemy") clauses.push(`sits in an unfriendly sign (lord ${profile.friendship.signLord})`);
  if (profile.functionalNature?.nature === "yogakaraka") clauses.push("acts as a yogakaraka (strongest functional benefic) for this Lagna");
  else if (profile.functionalNature?.nature === "benefic") clauses.push("is functionally benefic for this Lagna");
  else if (profile.functionalNature?.nature === "malefic") clauses.push("is functionally malefic for this Lagna");
  const netInfluence = profile.aspectInfluence?.netInfluence ?? 0;
  if (netInfluence > 0) clauses.push(`receives net benefic aspects (from ${profile.aspectInfluence.aspectedBy.join(", ") || "none listed"})`);
  else if (netInfluence < 0) clauses.push(`receives net malefic aspects (from ${profile.aspectInfluence.aspectedBy.join(", ") || "none listed"})`);

  if (clauses.length === 0) return `${name} shows no notable strength factors in this foundation-phase evaluation.`;
  return `${name} ${clauses.join(", and ")}.`;
}

/**
 * @param {object} planetary - the chart's planetary position map.
 * @param {object} context - { dob, tob, lagna, housesConfig }
 */
export function evaluatePlanetStrength(planetary, context = {}) {
  const { dob, tob, lagna, housesConfig } = context;
  const planets = planetary || {};

  const dignity = evaluateDignity(planets);
  const retrograde = evaluateRetrograde(planets, dob, tob);
  const combustion = evaluateCombustion(planets, dob, tob, retrograde);
  const friendship = evaluateFriendship(planets);
  const naturalDignity = evaluateNaturalDignity(planets, dob, tob);
  const functionalNature = lagna
    ? evaluateFunctionalNature(lagna, housesConfig || loadRules("houses"), planets)
    : {};
  const digBala = evaluateDigBala(planets);
  const shadbala = evaluateShadbala(planets, dignity, friendship, retrograde);
  const aspectInfluence = evaluateAspectInfluence(planets, naturalDignity);

  const result = {};
  for (const fullKey of PLANETS) {
    const name = plainName(fullKey);
    if (!planets[fullKey]) continue;

    const profile = {
      sign: dignity[name]?.sign,
      dignity: dignity[name],
      retrograde: retrograde[name] ?? false,
      combustion: combustion[name] ?? null,
      friendship: friendship[name] ?? null,
      naturalDignity: naturalDignity[name] ?? null,
      functionalNature: functionalNature[name] ?? null,
      digBala: digBala[name] ?? null,
      shadbala: shadbala[name] ?? null,
      aspectInfluence: aspectInfluence[name] ?? null,
    };
    profile.adjustedScore = computeAdjustedScore(dignity[name]?.score ?? 0, profile.aspectInfluence);
    profile.explanation = buildExplanation(name, profile);

    result[name] = profile;
  }
  return result;
}

export default { evaluatePlanetStrength };
