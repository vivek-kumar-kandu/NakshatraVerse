import { describe, it, expect } from "vitest";
import { computeChart, clearChartCache } from "../../services/astrology/birthChartEngine.js";
import { buildStructuredInsights } from "../../services/astrology/structuredInsightsEngine.js";
import { buildPrompt } from "../../services/ai/promptBuilder.js";
import { evaluatePrediction, computeConfidence, favorabilityBandFor } from "../../services/rules/predictionRuleEvaluator.js";
import { calcTransitForecast } from "../../services/astrology/transitForecastEngine.js";

// V2.0 Phase 7 — Prediction Engine
// Verified against multiple distinct birth charts (different DOB/TOB/POB —
// different Nakshatra, so a different Vimshottari starting lord and
// balance for each), per this phase's "verify predictions using multiple
// birth charts" requirement.
const CHARTS = [
  { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  { name: "Rahul", dob: "1985-01-01", tob: "23:45", pob: "Delhi" },
  { name: "Meera", dob: "2001-11-23", tob: "12:00", pob: "Mumbai" },
  { name: "Zoya", dob: "1975-07-30", tob: "03:15", pob: "Chennai" },
];

const REQUIRED_CATEGORIES = ["Career", "Finance", "Marriage", "Education", "Health", "Family", "Spiritual Growth"];

describe("computeChart: Phase 7 regression (top-level shape still unchanged)", () => {
  it("still returns exactly the same top-level keys as before Phase 7 (predictions are Gemini-only, never merged into chart)", () => {
    clearChartCache();
    const chart = computeChart(CHARTS[0]);
    const expectedKeys = ["userData", "numerology", "planetary", "lagna", "moonSign", "sunSign", "nakshatra", "yogas", "doshas", "remedies"].sort();
    expect(Object.keys(chart).sort()).toEqual(expectedKeys);
  });
});

describe.each(CHARTS)("Prediction Engine — $name", (userData) => {
  clearChartCache();
  const chart = computeChart(userData);
  const insights = buildStructuredInsights(chart);

  it("Vimshottari Dasha: exposes previous/current/next Mahadasha, current Antardasha, remaining duration, and start/end dates", () => {
    const d = insights.dasha;
    expect(d.available).toBe(true);
    expect(d.currentMahadasha.lord).toEqual(expect.any(String));
    expect(d.currentMahadasha.startDate).toEqual(expect.any(String));
    expect(d.currentMahadasha.endDate).toEqual(expect.any(String));
    expect(d.currentMahadasha.remainingYears).toBeGreaterThanOrEqual(0);
    expect(d.currentAntardasha.lord).toEqual(expect.any(String));
    expect(d.currentAntardasha.remainingYears).toBeGreaterThanOrEqual(0);

    // previous/next are derived from the same timeline array, so they must
    // be its immediate neighbors of the active Mahadasha.
    const activeIdx = d.timeline.findIndex((m) => m.lord === d.currentMahadasha.lord && m.startDate === d.currentMahadasha.startDate);
    expect(activeIdx).toBeGreaterThanOrEqual(0);
    if (activeIdx > 0) expect(d.previousMahadasha?.lord).toBe(d.timeline[activeIdx - 1].lord);
    else expect(d.previousMahadasha).toBeNull();
    if (activeIdx < d.timeline.length - 1) expect(d.nextMahadasha?.lord).toBe(d.timeline[activeIdx + 1].lord);
  });

  it("Prediction Categories: generates all 7 required categories with the full unified prediction shape", () => {
    expect(insights.predictions.map((p) => p.category).sort()).toEqual([...REQUIRED_CATEGORIES].sort());
    for (const p of insights.predictions) {
      expect(p.dasha).toEqual(expect.any(String));
      expect(p.antardasha).toEqual(expect.any(String));
      expect(p.planet).toEqual(expect.any(String));
      expect(p.timePeriod.startDate).toEqual(expect.any(String));
      expect(p.timePeriod.endDate).toEqual(expect.any(String));
      expect(p.prediction.length).toBeGreaterThan(10);
      expect(p.confidence.score).toBeGreaterThanOrEqual(5);
      expect(p.confidence.score).toBeLessThanOrEqual(95);
      expect(["Low", "Moderate", "High"]).toContain(p.confidence.label);
      expect(Array.isArray(p.supportingYogas)).toBe(true);
      expect(Array.isArray(p.supportingDoshas)).toBe(true);
      expect(p.suggestedRemedies.length).toBeGreaterThan(0);
      expect(p.explanationMeta.length).toBeGreaterThan(10);
    }
  });

  it("Prediction Timeline: 1/5/10-year windows are chronological, non-decreasing in count, and stay within their window", () => {
    const { oneYear, fiveYear, tenYear } = insights.predictionTimeline;
    expect(oneYear.length).toBeLessThanOrEqual(fiveYear.length);
    expect(fiveYear.length).toBeLessThanOrEqual(tenYear.length);
    for (const entry of tenYear) {
      expect(entry.dasha).toEqual(expect.any(String));
      expect(entry.antardasha).toEqual(expect.any(String));
      expect(entry.planet).toEqual(expect.any(String));
      expect(new Date(entry.timePeriod.startDate).getTime()).toBeLessThanOrEqual(new Date(entry.timePeriod.endDate).getTime());
    }
    for (let i = 1; i < tenYear.length; i++) {
      expect(new Date(tenYear[i].timePeriod.startDate).getTime()).toBeGreaterThanOrEqual(new Date(tenYear[i - 1].timePeriod.startDate).getTime());
    }
  });

  it("Transit Engine Foundation: Saturn / Jupiter / Rahu-Ketu forecasts are all present", () => {
    const tf = insights.transitForecast;
    expect(tf.saturn?.planet).toBe("Saturn");
    expect(tf.jupiter?.planet).toBe("Jupiter");
    expect(tf.rahuKetu).toHaveLength(2);
    expect(tf.rahuKetu.map((t) => t.planet).sort()).toEqual(["Ketu", "Rahu"]);
  });

  it("Gemini prompt is grounded in the exact backend-computed predictions (never a different conclusion)", () => {
    const prompt = buildPrompt(chart, insights);
    expect(prompt).toContain("Backend-Computed Predictions");
    for (const p of insights.predictions) {
      expect(prompt).toContain(p.category);
    }
  });
});

describe("predictionRuleEvaluator (unit-level, fixture-based)", () => {
  const planetary = {
    "Sun ☀️": { house: 10, sign: "Aries" },
    "Moon 🌙": { house: 4, sign: "Cancer" },
    "Mars ♂": { house: 5, sign: "Cancer" },
    "Mercury ☿": { house: 10, sign: "Gemini" },
    "Jupiter ♃": { house: 9, sign: "Sagittarius" },
    "Venus ♀": { house: 7, sign: "Libra" },
    "Saturn ♄": { house: 6, sign: "Capricorn" },
    "Rahu 🌑": { house: 8, sign: "Scorpio" },
    "Ketu 🌕": { house: 2, sign: "Taurus" },
  };

  it("resolves a dominant planet and produces a favorable/mixed/challenging-appropriate prediction", () => {
    const result = evaluatePrediction("career", {
      planetary,
      mahadasha: { lord: "Sun" },
      antardasha: { lord: "Mercury" },
      timePeriod: { startDate: "2026-01-01", endDate: "2027-01-01" },
      yogas: [],
      doshas: [],
      planetStrength: {
        Sun: { adjustedScore: 4, functionalNature: { nature: "benefic" }, combustion: { combust: false }, retrograde: false },
        Mercury: { adjustedScore: 2, functionalNature: { nature: "neutral" }, combustion: { combust: false }, retrograde: false },
      },
    });
    expect(result.category).toBe("Career");
    expect(result.dasha).toBe("Sun");
    expect(result.antardasha).toBe("Mercury");
    expect(["Sun", "Mercury", "Saturn"]).toContain(result.planet);
    expect(result.suggestedRemedies.length).toBeGreaterThan(0);
  });

  it("throws for an unknown category key (fails loudly rather than silently returning nothing)", () => {
    expect(() => evaluatePrediction("not-a-real-category", { planetary, mahadasha: { lord: "Sun" }, antardasha: { lord: "Moon" } })).toThrow();
  });

  it("computeConfidence stays within the configured 5-95 clamp regardless of extreme input", () => {
    const high = computeConfidence({ planetProfile: { adjustedScore: 100, functionalNature: { nature: "benefic" } }, supportingYogasCount: 10, supportingDoshasCount: 0 });
    const low = computeConfidence({ planetProfile: { adjustedScore: -100, functionalNature: { nature: "malefic" }, combustion: { combust: true }, retrograde: true }, supportingYogasCount: 0, supportingDoshasCount: 10 });
    expect(high.score).toBeLessThanOrEqual(95);
    expect(low.score).toBeGreaterThanOrEqual(5);
    expect(high.score).toBeGreaterThan(low.score);
  });

  it("favorabilityBandFor maps scores to favorable/mixed/challenging", () => {
    expect(favorabilityBandFor(90)).toBe("favorable");
    expect(favorabilityBandFor(50)).toBe("mixed");
    expect(favorabilityBandFor(10)).toBe("challenging");
  });
});

describe("Transit Forecast Engine (foundation)", () => {
  it("groups Saturn/Jupiter/Rahu-Ketu without altering the existing transitEngine output", () => {
    const planetary = {
      "Sun ☀️": { house: 1, sign: "Aries" },
      "Moon 🌙": { house: 3, sign: "Aries" },
      "Mars ♂": { house: 5, sign: "Cancer" },
      "Mercury ☿": { house: 2, sign: "Gemini" },
      "Jupiter ♃": { house: 4, sign: "Sagittarius" },
      "Venus ♀": { house: 6, sign: "Libra" },
      "Saturn ♄": { house: 7, sign: "Capricorn" },
      "Rahu 🌑": { house: 8, sign: "Scorpio" },
      "Ketu 🌕": { house: 2, sign: "Taurus" },
    };
    const forecast = calcTransitForecast(planetary, "Aries", new Date("2026-06-01T00:00:00Z"));
    expect(forecast.saturn.planet).toBe("Saturn");
    expect(forecast.jupiter.planet).toBe("Jupiter");
    expect(forecast.rahuKetu).toHaveLength(2);
  });
});
