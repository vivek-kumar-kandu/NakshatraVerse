import { describe, it, expect } from "vitest";
import { validateAiTimelineRequest, AI_TIMELINE_SECTIONS } from "../../validators/aiTimeline.validator.js";

const VALID_CHART = {
  userData: { name: "Test", dob: "1990-01-01", tob: "10:00", pob: "Delhi, India" },
  planetary: { "Sun ☀️": { sign: "Aries", house: 1 } },
  numerology: { mulank: 1, bhagyank: 2 },
  lagna: "Aries",
  moonSign: "Taurus",
  sunSign: "Aries",
  nakshatra: { name: "Ashwini", pada: 1 },
};

const VALID_EVENT = {
  id: "nextMonth-0-career",
  section: "nextMonth",
  category: "career",
  contextFacts: { dominantPlanet: "Jupiter" },
};

describe("validateAiTimelineRequest", () => {
  it("exposes the exact seven AI Timeline sections", () => {
    expect(AI_TIMELINE_SECTIONS).toEqual([
      "past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear",
    ]);
  });

  it("rejects a missing chart", () => {
    const errors = validateAiTimelineRequest({ event: VALID_EVENT });
    expect(errors).toContain("chart is required and must be the backend-generated chart object.");
  });

  it("rejects a chart missing required fields", () => {
    const errors = validateAiTimelineRequest({ chart: { userData: {} }, event: VALID_EVENT });
    expect(errors.some((e) => e.includes("chart.planetary"))).toBe(true);
    expect(errors.some((e) => e.includes("chart.lagna"))).toBe(true);
  });

  it("rejects a missing event", () => {
    const errors = validateAiTimelineRequest({ chart: VALID_CHART });
    expect(errors.some((e) => e.includes("event is required"))).toBe(true);
  });

  it("rejects an event missing an id", () => {
    const errors = validateAiTimelineRequest({ chart: VALID_CHART, event: { ...VALID_EVENT, id: undefined } });
    expect(errors.some((e) => e.includes("event.id"))).toBe(true);
  });

  it("rejects an event with a section outside the seven supported sections", () => {
    const errors = validateAiTimelineRequest({ chart: VALID_CHART, event: { ...VALID_EVENT, section: "yesterday" } });
    expect(errors.some((e) => e.includes("event.section"))).toBe(true);
  });

  it("rejects a non-object event.contextFacts", () => {
    const errors = validateAiTimelineRequest({ chart: VALID_CHART, event: { ...VALID_EVENT, contextFacts: "nope" } });
    expect(errors.some((e) => e.includes("event.contextFacts"))).toBe(true);
  });

  it("rejects a malformed history entry", () => {
    const errors = validateAiTimelineRequest({
      chart: VALID_CHART, event: VALID_EVENT, history: [{ role: "system", content: "x" }],
    });
    expect(errors.some((e) => e.includes("history"))).toBe(true);
  });

  it("accepts a fully valid request for every supported section", () => {
    for (const section of AI_TIMELINE_SECTIONS) {
      const errors = validateAiTimelineRequest({
        chart: VALID_CHART,
        event: { ...VALID_EVENT, id: `${section}-0-career`, section },
        history: [{ role: "user", content: "hi" }],
      });
      expect(errors).toEqual([]);
    }
  });
});
