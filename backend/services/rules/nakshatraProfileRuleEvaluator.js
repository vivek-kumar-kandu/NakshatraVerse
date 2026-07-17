// ─────────────────────────────────────────────────────────────────────────
// Nakshatra Profile Rule Evaluator (Priority 3.2)
// Single responsibility: look up the professional Nakshatra profile
// (Pada, Lord, Gana, Yoni, Nadi, Symbol, Deity, Nature, and traditional
// personality/career/relationship/spiritual tendencies) for an
// already-computed { name, pada } nakshatra fact, using config-driven data
// (rules/nakshatraProfile.json). Pure lookup — no astrology calculation
// happens here; the calculation (which nakshatra/pada) already happened in
// planetPositionEngine.calcNakshatra(), matching the existing Rule Engine
// separation of "which facts" (engine) vs "what they mean" (config).
//
// Phase 7.2A data-completion audit: verified null-safe on missing/unknown
// nakshatra fact (falls back to explicit "Not enough data..." strings,
// never throws), and confirmed deterministic — same input always returns
// the same output, since it is a pure lookup with no randomness or
// external I/O. No logic changes were needed; see
// tests/unit/nakshatraProfile.phase7_2A.test.js for the coverage that
// backs this up.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";

export function evaluateNakshatraProfile(nakshatra) {
  const { nakshatras } = loadRules("nakshatraProfile");
  const match = nakshatras.find((n) => n.name === nakshatra?.name);

  if (!match) {
    return {
      name: nakshatra?.name ?? null,
      pada: nakshatra?.pada ?? null,
      lord: null,
      gana: null,
      yoni: null,
      nadi: null,
      symbol: null,
      deity: null,
      nature: null,
      personalityTraits: "Not enough data to determine Nakshatra-based personality traits.",
      careerTendencies: "Not enough data to determine Nakshatra-based career tendencies.",
      relationshipTendencies: "Not enough data to determine Nakshatra-based relationship tendencies.",
      spiritualTendencies: "Not enough data to determine Nakshatra-based spiritual tendencies.",
    };
  }

  return {
    name: match.name,
    pada: nakshatra.pada,
    lord: match.lord,
    gana: match.gana,
    yoni: match.yoni,
    nadi: match.nadi,
    symbol: match.symbol,
    deity: match.deity,
    nature: match.nature,
    personalityTraits: match.personalityTraits,
    careerTendencies: match.careerTendencies,
    relationshipTendencies: match.relationshipTendencies,
    spiritualTendencies: match.spiritualTendencies,
  };
}

export default { evaluateNakshatraProfile };
