// ─────────────────────────────────────────────────────────────────────────
// Relationship Hub Controller (V4.2 — Family Profiles & Relationship Hub)
// Lets a signed-in user pick any two of their saved Family Profiles and
// compare them across six dimensions: Kundli Matching, Birth Chart
// Comparison, Planet Strength Comparison, Dosha Comparison, Nakshatra
// Comparison, and Prediction Comparison.
//
// ZERO new astrology calculation happens in this file. Every fact comes
// from functions that already exist and are completely unmodified:
//   - computeChart()            (birthChartEngine.js — Kundli Matching's
//                                 own controller calls this exact function
//                                 the exact same way)
//   - computeMatching()          (kundliMatchingEngine.js) — its return
//                                 value already includes doshaComparison,
//                                 planetStrength comparison, and
//                                 nakshatraCompatibility/
//                                 moonSignCompatibility, so those four of
//                                 the six dimensions above are direct,
//                                 unmodified reads of its existing output.
//   - buildStructuredInsights() + buildPredictionApiFields()
//                                 (exactly what astrology.controller.js's
//                                 getChart already calls to expose
//                                 predictions without invoking Gemini) —
//                                 used here for the Prediction Comparison
//                                 dimension and to enrich the Birth Chart
//                                 Comparison with each profile's Nakshatra
//                                 Profile.
// Gemini is never called from this module — matching the brief's "Gemini
// MUST NEVER calculate astrology" constraint by construction.
// ─────────────────────────────────────────────────────────────────────────
import logger, { withTiming } from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as familyProfileService from "../services/family/familyProfileService.js";
import { computeChart } from "../services/astrology/birthChartEngine.js";
import { computeMatching } from "../services/astrology/kundliMatchingEngine.js";
import { buildStructuredInsights } from "../services/astrology/structuredInsightsEngine.js";
import { buildPredictionApiFields } from "../services/astrology/predictionApiMapper.js";

// A saved Family Profile record already stores exactly the fields
// computeChart()/computeMatching() expect (name/dob/tob/pob/gender) — this
// only picks those fields out, it computes nothing.
function toPerson(record) {
  return {
    name: record.name,
    dob: record.dob,
    tob: record.tob,
    pob: record.pob,
    gender: record.gender || "",
  };
}

function buildComparison(profileARecord, profileBRecord) {
  const personA = toPerson(profileARecord);
  const personB = toPerson(profileBRecord);

  // Reused verbatim from matching.controller.js#computeChartsAndMatching.
  const chartA = computeChart(personA);
  const chartB = computeChart(personB);
  const matching = computeMatching({ chartA, chartB, personA, personB });

  // Reused verbatim from astrology.controller.js#getChart's Phase 7.1
  // prediction-fields pattern — one call per person, never touching
  // Gemini.
  const insightsA = buildStructuredInsights(chartA);
  const insightsB = buildStructuredInsights(chartB);
  const predictionFieldsA = buildPredictionApiFields(insightsA);
  const predictionFieldsB = buildPredictionApiFields(insightsB);

  return {
    personA: { ...personA, id: profileARecord.id },
    personB: { ...personB, id: profileBRecord.id },

    // Kundli Matching — the existing, unmodified computeMatching() output
    // in full (Ashtakoota, Manglik, compatibility band, etc.)
    kundliMatching: matching,

    // Birth Chart Comparison — the two full, backend-authoritative charts
    // side by side (planetary positions, lagna, moon/sun sign, yogas,
    // doshas, remedies — see structuredJsonBuilder.js#buildChartJson,
    // completely unmodified).
    birthChartComparison: { chartA, chartB },

    // Planet Strength Comparison — computeMatching() already computed
    // this (calcPlanetStrength(), reused inside kundliMatchingEngine.js).
    planetStrengthComparison: matching.planetStrength,

    // Dosha Comparison — likewise already computed by computeMatching().
    doshaComparison: matching.doshaComparison,

    // Nakshatra Comparison — likewise already computed by
    // computeMatching(), enriched with each profile's full Nakshatra
    // Profile (personality/career/relationship/spiritual tendencies) from
    // the existing Phase 7.1 prediction-fields pipeline.
    nakshatraComparison: {
      ...matching.nakshatraCompatibility,
      profileA: predictionFieldsA.nakshatraProfile,
      profileB: predictionFieldsB.nakshatraProfile,
    },

    // Prediction Comparison — each profile's 7 category predictions
    // (career, marriage, health, ...), from the existing prediction
    // engine, exposed the same way /api/chart already does.
    predictionComparison: {
      personA: predictionFieldsA.predictions,
      personB: predictionFieldsB.predictions,
    },
  };
}

export const compareProfiles = asyncHandler(async (req, res) => {
  const { profileIdA, profileIdB } = req.body || {};
  if (!profileIdA || !profileIdB) {
    return res.status(400).json({ error: "profileIdA and profileIdB are both required." });
  }
  if (profileIdA === profileIdB) {
    return res.status(400).json({ error: "Choose two different profiles to compare." });
  }

  // getProfileRecord enforces ownership (404s if either profile doesn't
  // belong to this user) — same guarantee reportService.js/
  // familyProfileService.js already give every other profile/report read.
  const profileARecord = familyProfileService.getProfileRecord(req.user.id, profileIdA);
  const profileBRecord = familyProfileService.getProfileRecord(req.user.id, profileIdB);

  try {
    const comparison = await withTiming("Relationship Hub comparison", async () =>
      buildComparison(profileARecord, profileBRecord)
    );
    res.json(comparison);
  } catch (err) {
    logger.error("Relationship Hub comparison error:", err);
    res.status(500).json({ error: "Internal server error while comparing these two profiles." });
  }
});

export default { compareProfiles };
