import { describe, it, expect } from "vitest";
import { computeChart, clearChartCache } from "../../services/astrology/birthChartEngine.js";
import { buildStructuredInsights } from "../../services/astrology/structuredInsightsEngine.js";
import {
  buildPredictionApiFields,
  buildExplorerApiFields,
} from "../../services/astrology/predictionApiMapper.js";

// ─────────────────────────────────────────────────────────────────────────
// V5.0 Phase 5B — Explorer Infrastructure: Backend Integration
//
// Covers the new, additive-only `buildExplorerApiFields` mapper and the
// `planetStrength` field now exposed on `buildStructuredInsights`'s
// return value. Every assertion traces a mapped value back to the
// existing engine output — nothing here computes new astrology.
// ─────────────────────────────────────────────────────────────────────────
const CHARTS = [
  { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  { name: "Rahul", dob: "1985-01-01", tob: "23:45", pob: "Delhi" },
];

const PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

describe.each(CHARTS)("Phase 5B Explorer API fields — $name", (userData) => {
  clearChartCache();
  const chart = computeChart(userData);
  const insights = buildStructuredInsights(chart);

  it("buildStructuredInsights still returns every pre-Phase-5B key (regression)", () => {
    expect(insights).toHaveProperty("planetStrengthContributors");
    expect(insights).toHaveProperty("nakshatraProfile");
    expect(insights).toHaveProperty("dasha");
    expect(insights).toHaveProperty("transits");
    expect(insights).toHaveProperty("advancedYogas");
    expect(insights).toHaveProperty("advancedDoshas");
    expect(insights).toHaveProperty("predictions");
    expect(insights).toHaveProperty("predictionTimeline");
    expect(insights).toHaveProperty("transitForecast");
    expect(insights).toHaveProperty("contributingFactors");
  });

  it("buildStructuredInsights additionally exposes the full per-planet planetStrength profile", () => {
    expect(insights).toHaveProperty("planetStrength");
    for (const name of PLANET_NAMES) {
      const profile = insights.planetStrength[name];
      expect(profile).toBeTruthy();
      expect(profile).toHaveProperty("sign");
      expect(profile).toHaveProperty("dignity");
      expect(profile).toHaveProperty("retrograde");
      expect(profile).toHaveProperty("combustion");
      expect(profile).toHaveProperty("friendship");
      expect(profile).toHaveProperty("functionalNature");
      expect(profile).toHaveProperty("digBala");
      expect(profile).toHaveProperty("shadbala");
      expect(profile).toHaveProperty("aspectInfluence");
      expect(profile).toHaveProperty("explanation");
    }
  });

  it("buildPredictionApiFields' existing exact key set is unchanged by this phase (regression)", () => {
    const fields = buildPredictionApiFields(insights);
    expect(Object.keys(fields).sort()).toEqual(
      ["nakshatraProfile", "predictionTimeline", "predictions", "transitForecast", "dasha", "transits"].sort()
    );
  });

  it("buildExplorerApiFields exposes planetStrength/advancedYogas/advancedDoshas, tracing back to the raw insights object", () => {
    const fields = buildExplorerApiFields(insights);
    expect(Object.keys(fields).sort()).toEqual(["advancedDoshas", "advancedYogas", "planetStrength"].sort());
    expect(fields.planetStrength).toBe(insights.planetStrength);
    expect(fields.advancedYogas).toBe(insights.advancedYogas);
    expect(fields.advancedDoshas).toBe(insights.advancedDoshas);
  });

  it("buildExplorerApiFields returns {} when insights is absent, never throwing", () => {
    expect(buildExplorerApiFields(null)).toEqual({});
    expect(buildExplorerApiFields(undefined)).toEqual({});
  });
});
