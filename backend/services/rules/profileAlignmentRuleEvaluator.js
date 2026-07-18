// ─────────────────────────────────────────────────────────────────────────
// Profile Alignment Rule Evaluator (V2.0 Phase 7.2B — Nakshatra Profile
// Intelligence)
// Single responsibility: score how well the ALREADY-COMPUTED Nakshatra
// Profile (nakshatraProfileEngine.js) agrees with the other
// already-computed astrology facts feeding a prediction (dominant planet,
// current Dasha, Numerology, Transit Foundation), and expose the four
// extended profile dimensions Phase 7.2B asks for (Emotional Pattern,
// Learning Style, Leadership Style, Health Tendencies).
//
// IMPORTANT — this does NOT modify the Nakshatra Profile schema:
// rules/nakshatraProfile.json and nakshatraProfileRuleEvaluator.js are
// completely untouched. The four extended dimensions are looked up here,
// in a separate config file (rules/profileAlignment.json), keyed off the
// Nakshatra's classical ruling planet (`nakshatraProfile.lord`) — a fact
// that already exists on every Nakshatra Profile object. They are only
// ever attached to the PREDICTION objects (supportingProfileFactors /
// profileAlignmentScore / profileSummary), never merged back into the
// Nakshatra Profile object itself or the /api response's nakshatraProfile
// field, so mapNakshatraProfile()'s existing field list in
// predictionApiMapper.js needs no change.
//
// Reuses ruleEngine.js's loadRules/interpolate exactly like every other
// rule evaluator in this codebase — no hardcoded logic, only config-driven
// lookups and deterministic arithmetic.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { interpolate } from "./ruleEngine.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Looks up the four extended profile dimensions (Emotional Pattern,
 * Learning Style, Leadership Style, Health Tendencies) for an
 * already-computed Nakshatra Profile, keyed off its classical ruling
 * planet (`nakshatraProfile.lord`). Pure lookup, same null-safety
 * convention as nakshatraProfileRuleEvaluator.js.
 */
export function deriveExtendedProfileTraits(nakshatraProfile) {
  const { lordExtendedTraits } = loadRules("profileAlignment");
  const traits = nakshatraProfile?.lord ? lordExtendedTraits[nakshatraProfile.lord] : null;

  return {
    emotionalPattern: traits?.emotionalPattern ?? "Not enough data to determine Nakshatra-based emotional pattern.",
    learningStyle: traits?.learningStyle ?? "Not enough data to determine Nakshatra-based learning style.",
    leadershipStyle: traits?.leadershipStyle ?? "Not enough data to determine Nakshatra-based leadership style.",
    healthTendencies: traits?.healthTendencies ?? "Not enough data to determine Nakshatra-based health tendencies.",
  };
}

// A trait "supports" a category prediction if the category's configured
// trait map includes that field name — see rules/profileAlignment.json's
// categoryTraitMap, built from the same 8 dimensions Phase 7.2B lists
// (Personality, Career, Relationship, Spiritual, Emotional, Learning,
// Leadership, Health).
function collectSupportingFactors(categoryKey, nakshatraProfile, extendedTraits) {
  const { categoryTraitMap } = loadRules("profileAlignment");
  const relevantFields = categoryTraitMap[categoryKey] || categoryTraitMap.general || [];
  const allFields = { ...nakshatraProfile, ...extendedTraits };

  return relevantFields
    .filter((field) => Boolean(allFields[field]))
    .map((field) => ({ factor: field, detail: allFields[field] }));
}

/**
 * Deterministic 0-100 alignment score between the existing Nakshatra
 * Profile and the other already-computed facts behind a prediction:
 *   - does the Nakshatra's classical lord match the Dasha lord or the
 *     category's dominant planet (agreement between Profile and Dasha)?
 *   - does the Nakshatra's Gana traditionally favor this life category?
 *   - does the Mulank/Bhagyank's classical ruling planet match the
 *     Nakshatra's lord (agreement between Profile and Numerology)?
 *   - is the current Transit Foundation free of affliction flags
 *     (agreement between Profile and Transits)?
 * Every input is a fact the backend already computed elsewhere; nothing
 * here is a new astrology calculation.
 */
export function evaluateProfileAlignment(categoryKey, { nakshatraProfile, dominantPlanet, mahaLord, antarLord, numerology, transitConflictCount = 0 }) {
  const { ganaFavorableCategories, numerologyPlanetRulers, alignmentWeights, scoreClamp } = loadRules("profileAlignment");
  const extendedTraits = deriveExtendedProfileTraits(nakshatraProfile);

  let score = alignmentWeights.baseScore;
  const reasons = [];

  const lord = nakshatraProfile?.lord ?? null;
  const lordMatchesDasha = Boolean(lord) && (lord === mahaLord || lord === antarLord || lord === dominantPlanet);
  if (lordMatchesDasha) {
    score += alignmentWeights.lordMatchesDashaOrDominant;
    reasons.push(`its ruling planet (${lord}) matches the active Dasha/dominant-planet influence`);
  }

  const ganaFavors = Boolean(nakshatraProfile?.gana) && (ganaFavorableCategories[nakshatraProfile.gana] || []).includes(categoryKey);
  if (ganaFavors) {
    score += alignmentWeights.ganaFavorsCategory;
    reasons.push(`its ${nakshatraProfile.gana} Gana traditionally favors this life area`);
  }

  const mulankRuler = numerology ? numerologyPlanetRulers[String(numerology.mulank)] : null;
  const bhagyankRuler = numerology ? numerologyPlanetRulers[String(numerology.bhagyank)] : null;
  const numerologyMatches = Boolean(lord) && (mulankRuler === lord || bhagyankRuler === lord);
  if (numerologyMatches) {
    score += alignmentWeights.numerologyMatchesLord;
    reasons.push("its ruling planet agrees with the Numerology-derived ruling planet");
  }

  const transitClean = transitConflictCount === 0;
  if (transitClean) {
    score += alignmentWeights.transitClean;
    reasons.push("current transits show no conflicting classical flags against it");
  }

  const profileAlignmentScore = Math.round(clamp(score, scoreClamp.min, scoreClamp.max));
  const supportingProfileFactors = collectSupportingFactors(categoryKey, nakshatraProfile, extendedTraits);

  const profileSummary = lord
    ? interpolate(
        reasons.length
          ? "{nakshatra} Nakshatra (ruled by {lord}) shows {alignment} alignment with this prediction because {reasonList}."
          : "{nakshatra} Nakshatra (ruled by {lord}) shows {alignment} alignment with this prediction based on its traditional tendencies alone.",
        {},
        {
          nakshatra: nakshatraProfile?.name ?? "This",
          lord,
          alignment: profileAlignmentScore >= 70 ? "strong" : profileAlignmentScore >= 45 ? "moderate" : "limited",
          reasonList: reasons.join("; "),
        }
      )
    : "Not enough Nakshatra Profile data to determine profile alignment for this prediction.";

  return { profileAlignmentScore, supportingProfileFactors, profileSummary, extendedTraits, lordMatchesDasha, numerologyMatches };
}

export default { deriveExtendedProfileTraits, evaluateProfileAlignment };
