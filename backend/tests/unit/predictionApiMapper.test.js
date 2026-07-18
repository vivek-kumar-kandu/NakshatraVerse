import { describe, it, expect } from "vitest";
import { computeChart, clearChartCache } from "../../services/astrology/birthChartEngine.js";
import { buildStructuredInsights } from "../../services/astrology/structuredInsightsEngine.js";
import {
  mapPredictions,
  mapPredictionTimeline,
  mapNakshatraProfile,
  buildPredictionApiFields,
} from "../../services/astrology/predictionApiMapper.js";

// V2.0 Phase 7.1 — Prediction & Profile Integration
const CHARTS = [
  { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  { name: "Rahul", dob: "1985-01-01", tob: "23:45", pob: "Delhi" },
  { name: "Meera", dob: "2001-11-23", tob: "12:00", pob: "Mumbai" },
];

const REQUIRED_CATEGORIES = ["Career", "Finance", "Marriage", "Education", "Health", "Family", "Spiritual Growth"];

describe.each(CHARTS)("Phase 7.1 API mapper — $name", (userData) => {
  clearChartCache();
  const chart = computeChart(userData);
  const insights = buildStructuredInsights(chart);

  it("mapPredictions: every category exposes the full Phase 7.1 API contract shape", () => {
    const mapped = mapPredictions(insights.predictions);
    expect(mapped.map((p) => p.category).sort()).toEqual([...REQUIRED_CATEGORIES].sort());
    for (const p of mapped) {
      expect(p).toHaveProperty("category");
      expect(p).toHaveProperty("prediction");
      expect(p).toHaveProperty("confidence");
      expect(p).toHaveProperty("timePeriod");
      expect(p).toHaveProperty("activeMahadasha");
      expect(p).toHaveProperty("activeAntardasha");
      expect(p).toHaveProperty("dominantPlanet");
      expect(p).toHaveProperty("supportingYogas");
      expect(p).toHaveProperty("supportingDoshas");
      expect(p).toHaveProperty("supportingHouses");
      expect(p).toHaveProperty("supportingPlanets");
      expect(p).toHaveProperty("suggestedRemedies");
      expect(p).toHaveProperty("reasoningMetadata");
      expect(p).toHaveProperty("GeminiExplanationContext");
      expect(Array.isArray(p.supportingHouses)).toBe(true);
      expect(Array.isArray(p.supportingPlanets)).toBe(true);
      expect(p.GeminiExplanationContext).toMatchObject({
        dominantPlanet: p.dominantPlanet,
        activeMahadasha: p.activeMahadasha,
        activeAntardasha: p.activeAntardasha,
      });
    }
  });

  it("mapPredictions: never invents data — every mapped value traces back to the raw engine object", () => {
    const raw = insights.predictions;
    const mapped = mapPredictions(raw);
    mapped.forEach((p, i) => {
      expect(p.activeMahadasha).toBe(raw[i].dasha);
      expect(p.activeAntardasha).toBe(raw[i].antardasha);
      expect(p.dominantPlanet).toBe(raw[i].planet);
      expect(p.reasoningMetadata).toBe(raw[i].explanationMeta);
      expect(p.confidence).toEqual(raw[i].confidence);
      expect(p.suggestedRemedies).toEqual(raw[i].suggestedRemedies);
    });
  });

  it("mapPredictionTimeline: preserves oneYear/fiveYear/tenYear structure with mapped entries", () => {
    const mapped = mapPredictionTimeline(insights.predictionTimeline);
    expect(mapped).toHaveProperty("oneYear");
    expect(mapped).toHaveProperty("fiveYear");
    expect(mapped).toHaveProperty("tenYear");
    for (const entry of mapped.tenYear) {
      expect(entry).toHaveProperty("activeMahadasha");
      expect(entry).toHaveProperty("activeAntardasha");
      expect(entry).toHaveProperty("reasoningMetadata");
    }
  });

  it("mapNakshatraProfile: exposes the full required profile field set, reusing the existing engine output verbatim", () => {
    const mapped = mapNakshatraProfile(insights.nakshatraProfile);
    expect(mapped.nakshatra).toBe(insights.nakshatraProfile.name);
    expect(mapped.lord).toBe(insights.nakshatraProfile.lord);
    expect(mapped.pada).toBe(insights.nakshatraProfile.pada);
    expect(mapped.symbol).toBe(insights.nakshatraProfile.symbol);
    expect(mapped.deity).toBe(insights.nakshatraProfile.deity);
    expect(mapped.gana).toBe(insights.nakshatraProfile.gana);
    expect(mapped.nadi).toBe(insights.nakshatraProfile.nadi);
    expect(mapped.yoni).toBe(insights.nakshatraProfile.yoni);
    expect(mapped.nature).toBe(insights.nakshatraProfile.nature);
    expect(mapped.personality).toBe(insights.nakshatraProfile.personalityTraits);
    expect(mapped.careerTendencies).toBe(insights.nakshatraProfile.careerTendencies);
    expect(mapped.relationshipTendencies).toBe(insights.nakshatraProfile.relationshipTendencies);
    expect(mapped.spiritualTendencies).toBe(insights.nakshatraProfile.spiritualTendencies);
  });

  it("buildPredictionApiFields: returns exactly the Phase 7.1 + Phase 5 top-level keys, and {} when insights is absent", () => {
    const fields = buildPredictionApiFields(insights);
    expect(Object.keys(fields).sort()).toEqual(
      ["nakshatraProfile", "predictionTimeline", "predictions", "transitForecast", "dasha", "transits"].sort()
    );
    expect(buildPredictionApiFields(null)).toEqual({});
    expect(buildPredictionApiFields(undefined)).toEqual({});
  });
});

describe("predictionRuleEvaluator regression: existing engine field names are untouched", () => {
  it("evaluatePrediction still returns dasha/antardasha/planet/explanationMeta (not renamed), plus the new additive fields", async () => {
    const { evaluatePrediction } = await import("../../services/rules/predictionRuleEvaluator.js");
    const planetary = {
      "Sun ☀️": { house: 10, sign: "Aries" },
      "Moon 🌙": { house: 4, sign: "Cancer" },
      "Mercury ☿": { house: 10, sign: "Gemini" },
      "Saturn ♄": { house: 6, sign: "Capricorn" },
    };
    const result = evaluatePrediction("career", {
      planetary,
      mahadasha: { lord: "Sun" },
      antardasha: { lord: "Mercury" },
      timePeriod: { startDate: "2026-01-01", endDate: "2027-01-01" },
      yogas: [],
      doshas: [],
      planetStrength: {},
    });
    // Original (pre-Phase-7.1) shape — untouched.
    expect(result.dasha).toBe("Sun");
    expect(result.antardasha).toBe("Mercury");
    expect(result.explanationMeta).toEqual(expect.any(String));
    // New, additive-only fields.
    expect(Array.isArray(result.supportingHouses)).toBe(true);
    expect(Array.isArray(result.supportingPlanets)).toBe(true);
  });
});
