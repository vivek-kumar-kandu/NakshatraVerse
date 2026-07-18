import { describe, it, expect } from "vitest";
import { validateExplorerAiRequest, EXPLORER_ITEM_TYPES } from "../../validators/explorerAi.validator.js";

const VALID_CHART = {
  userData: { name: "Test", dob: "1990-01-01", tob: "10:00", pob: "Delhi, India" },
  planetary: { "Sun ☀️": { sign: "Aries", house: 1 } },
  numerology: { mulank: 1, bhagyank: 2 },
  lagna: "Aries",
  moonSign: "Taurus",
  sunSign: "Aries",
  nakshatra: { name: "Ashwini", pada: 1 },
};

describe("validateExplorerAiRequest", () => {
  it("exposes the exact eight Explorer selection types", () => {
    expect(EXPLORER_ITEM_TYPES).toEqual([
      "planet", "house", "sign", "yoga", "dosha", "nakshatra", "ascendant", "aspect",
    ]);
  });

  it("rejects a missing chart", () => {
    const errors = validateExplorerAiRequest({ itemType: "planet", itemLabel: "Sun" });
    expect(errors).toContain("chart is required and must be the backend-generated chart object.");
  });

  it("rejects a chart missing required fields", () => {
    const errors = validateExplorerAiRequest({ chart: { userData: {} }, itemType: "planet", itemLabel: "Sun" });
    expect(errors.some((e) => e.includes("chart.planetary"))).toBe(true);
    expect(errors.some((e) => e.includes("chart.lagna"))).toBe(true);
  });

  it("rejects a missing itemType", () => {
    const errors = validateExplorerAiRequest({ chart: VALID_CHART, itemLabel: "Sun" });
    expect(errors.some((e) => e.includes("itemType"))).toBe(true);
  });

  it("rejects an itemType outside the eight supported categories", () => {
    const errors = validateExplorerAiRequest({ chart: VALID_CHART, itemType: "comet", itemLabel: "Halley" });
    expect(errors.some((e) => e.includes("itemType"))).toBe(true);
  });

  it("rejects a missing itemLabel", () => {
    const errors = validateExplorerAiRequest({ chart: VALID_CHART, itemType: "planet" });
    expect(errors.some((e) => e.includes("itemLabel"))).toBe(true);
  });

  it("rejects a non-object contextFacts", () => {
    const errors = validateExplorerAiRequest({ chart: VALID_CHART, itemType: "planet", itemLabel: "Sun", contextFacts: "nope" });
    expect(errors.some((e) => e.includes("contextFacts"))).toBe(true);
  });

  it("rejects a malformed history entry", () => {
    const errors = validateExplorerAiRequest({
      chart: VALID_CHART, itemType: "planet", itemLabel: "Sun", history: [{ role: "system", content: "x" }],
    });
    expect(errors.some((e) => e.includes("history"))).toBe(true);
  });

  it("accepts a fully valid request for every supported item type", () => {
    for (const itemType of EXPLORER_ITEM_TYPES) {
      const errors = validateExplorerAiRequest({
        chart: VALID_CHART, itemType, itemId: `${itemType}-1`, itemLabel: "Sample Label",
        contextFacts: { foo: "bar" }, history: [{ role: "user", content: "hi" }],
      });
      expect(errors).toEqual([]);
    }
  });
});
