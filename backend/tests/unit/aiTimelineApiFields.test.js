import { describe, it, expect } from "vitest";
import { computeChart, clearChartCache } from "../../services/astrology/birthChartEngine.js";
import { buildStructuredInsights } from "../../services/astrology/structuredInsightsEngine.js";
import { generateAiTimeline } from "../../services/astrology/aiTimelineEngine.js";
import {
  buildPredictionApiFields,
  buildExplorerApiFields,
  buildAiTimelineApiFields,
} from "../../services/astrology/predictionApiMapper.js";

// ─────────────────────────────────────────────────────────────────────────
// V5.2 — AI Timeline
//
// Covers the new, additive-only `generateAiTimeline` engine and
// `buildAiTimelineApiFields` mapper. Every assertion traces a mapped value
// back to the existing engine output (evaluatePrediction) — nothing here
// computes new astrology, only new windowing/tagging over facts the
// backend already produces.
// ─────────────────────────────────────────────────────────────────────────
const SECTIONS = ["past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear"];

const CHARTS = [
  { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  { name: "Rahul", dob: "1985-01-01", tob: "23:45", pob: "Delhi" },
];

describe.each(CHARTS)("V5.2 AI Timeline — $name", (userData) => {
  clearChartCache();
  const chart = computeChart(userData);
  const insights = buildStructuredInsights(chart);

  it("buildStructuredInsights still returns every pre-V5.2 key (regression)", () => {
    expect(insights).toHaveProperty("predictions");
    expect(insights).toHaveProperty("predictionTimeline");
    expect(insights).toHaveProperty("transitForecast");
    expect(insights).toHaveProperty("dasha");
  });

  it("buildStructuredInsights additionally exposes aiTimeline with all seven sections", () => {
    expect(insights).toHaveProperty("aiTimeline");
    for (const section of SECTIONS) {
      expect(insights.aiTimeline).toHaveProperty(section);
      expect(Array.isArray(insights.aiTimeline[section])).toBe(true);
    }
  });

  it("buildPredictionApiFields' existing exact key set is unchanged by this phase (regression)", () => {
    const fields = buildPredictionApiFields(insights);
    expect(Object.keys(fields).sort()).toEqual(
      ["nakshatraProfile", "predictionTimeline", "predictions", "transitForecast", "dasha", "transits"].sort()
    );
  });

  it("buildExplorerApiFields' existing exact key set is unchanged by this phase (regression)", () => {
    const fields = buildExplorerApiFields(insights);
    expect(Object.keys(fields).sort()).toEqual(["advancedDoshas", "advancedYogas", "planetStrength"].sort());
  });

  it("buildAiTimelineApiFields exposes exactly one `aiTimeline` field with all seven sections", () => {
    const fields = buildAiTimelineApiFields(insights);
    expect(Object.keys(fields)).toEqual(["aiTimeline"]);
    for (const section of SECTIONS) {
      expect(fields.aiTimeline).toHaveProperty(section);
    }
  });

  it("every mapped AI Timeline event carries the full event contract (category, dates, prediction, confidence, supporting facts, dasha, remedies)", () => {
    const fields = buildAiTimelineApiFields(insights);
    const allEvents = SECTIONS.flatMap((s) => fields.aiTimeline[s]);
    expect(allEvents.length).toBeGreaterThan(0);
    for (const event of allEvents) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("section");
      expect(event).toHaveProperty("filterCategory");
      expect(event).toHaveProperty("category");
      expect(event).toHaveProperty("prediction");
      expect(event).toHaveProperty("confidence");
      expect(event).toHaveProperty("timePeriod");
      expect(event).toHaveProperty("activeMahadasha");
      expect(event).toHaveProperty("activeAntardasha");
      expect(event).toHaveProperty("dominantPlanet");
      expect(event).toHaveProperty("supportingPlanets");
      expect(event).toHaveProperty("supportingYogas");
      expect(event).toHaveProperty("supportingDoshas");
      expect(event).toHaveProperty("suggestedRemedies");
      expect(event).toHaveProperty("relatedTransit");
      expect(event).toHaveProperty("GeminiExplanationContext");
    }
  });

  it("tags every one of the eight frontend filter categories across all sections combined", () => {
    const fields = buildAiTimelineApiFields(insights);
    const allEvents = SECTIONS.flatMap((s) => fields.aiTimeline[s]);
    const tags = new Set(allEvents.map((e) => e.filterCategory));
    for (const expected of ["career", "finance", "love", "marriage", "health", "education", "family", "spiritual"]) {
      expect(tags.has(expected)).toBe(true);
    }
  });

  it("'love' and 'marriage' events for the same segment share the identical underlying prediction (no duplicate calculation)", () => {
    const fields = buildAiTimelineApiFields(insights);
    const nextMonthEvents = fields.aiTimeline.nextMonth;
    const loveEvent = nextMonthEvents.find((e) => e.filterCategory === "love");
    const marriageEvent = nextMonthEvents.find((e) => e.filterCategory === "marriage" && e.id.replace("-marriage", "") === loveEvent?.id.replace("-love", ""));
    if (loveEvent && marriageEvent) {
      expect(loveEvent.prediction).toBe(marriageEvent.prediction);
      expect(loveEvent.confidence).toEqual(marriageEvent.confidence);
    }
  });

  it("buildAiTimelineApiFields returns {} when insights is absent or has no aiTimeline, never throwing", () => {
    expect(buildAiTimelineApiFields(null)).toEqual({});
    expect(buildAiTimelineApiFields(undefined)).toEqual({});
    expect(buildAiTimelineApiFields({})).toEqual({});
  });

  it("generateAiTimeline returns all-empty sections when dasha is unavailable", () => {
    const result = generateAiTimeline({
      planetary: {}, dasha: { available: false }, yogas: [], doshas: [],
      advancedYogas: [], advancedDoshas: [], planetStrength: {},
    });
    for (const section of SECTIONS) {
      expect(result[section]).toEqual([]);
    }
  });

  it("present section (if non-empty) reflects the currently active Mahadasha/Antardasha", () => {
    const fields = buildAiTimelineApiFields(insights);
    if (fields.aiTimeline.present.length > 0) {
      const first = fields.aiTimeline.present[0];
      expect(first.activeMahadasha).toBe(insights.dasha.currentMahadasha?.lord);
    }
  });
});
