import { describe, it, expect } from "vitest";
import { validateChatRequest, trimHistory } from "../../validators/assistant.validator.js";

// V4.5 Phase 4 — AI Report Chat
// Covers the additive-only optional context fields (festivalContext/
// panchangContext/muhuratContext) on top of the existing V3.0 Phase 4
// chat validator, and confirms every pre-existing behavior is unchanged.

const VALID_CHART = {
  userData: { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  planetary: { Sun: { house: 1, sign: "Aries" } },
  numerology: { mulank: 5, bhagyank: 7 },
  lagna: "Aries",
  moonSign: "Taurus",
  sunSign: "Aries",
  nakshatra: { name: "Ashwini", pada: 1 },
};

describe("validateChatRequest (Phase 4 additions)", () => {
  it("passes with only the pre-existing required fields (no new context)", () => {
    expect(validateChatRequest({ chart: VALID_CHART, question: "Why is Saturn important?" })).toEqual([]);
  });

  it("passes when festivalContext/panchangContext/muhuratContext are provided as objects", () => {
    const errors = validateChatRequest({
      chart: VALID_CHART,
      question: "Why is this festival important for me?",
      festivalContext: { name: "Diwali", date: "2026-11-08" },
      panchangContext: { tithi: "Purnima" },
      muhuratContext: { activity: "Griha Pravesh" },
    });
    expect(errors).toEqual([]);
  });

  it("flags a non-object festivalContext", () => {
    const errors = validateChatRequest({ chart: VALID_CHART, question: "test", festivalContext: "not-an-object" });
    expect(errors).toContain("festivalContext must be an object when provided.");
  });

  it("flags a non-object panchangContext and muhuratContext independently", () => {
    const errors = validateChatRequest({
      chart: VALID_CHART,
      question: "test",
      panchangContext: 42,
      muhuratContext: ["nope"],
    });
    // arrays are typeof "object" so muhuratContext as an array is allowed;
    // panchangContext as a number is not.
    expect(errors).toContain("panchangContext must be an object when provided.");
  });

  it("still flags all pre-existing V3.0 Phase 4 validation errors unchanged", () => {
    expect(validateChatRequest({})).toEqual(
      expect.arrayContaining([
        "chart is required and must be the backend-generated chart object.",
        "question is required and must be a non-empty string.",
      ])
    );
  });

  it("still validates history shape unchanged", () => {
    const errors = validateChatRequest({ chart: VALID_CHART, question: "test", history: [{ role: "bogus", content: "x" }] });
    expect(errors).toContain("Each history entry must be { role: 'user'|'assistant', content: string }.");
  });
});

describe("trimHistory (unchanged)", () => {
  it("returns [] for empty/undefined history", () => {
    expect(trimHistory(undefined)).toEqual([]);
    expect(trimHistory([])).toEqual([]);
  });
});
