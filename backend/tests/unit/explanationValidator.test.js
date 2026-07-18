import { describe, it, expect } from "vitest";
import {
  validateReportSummaryRequest,
  validateConfidenceExplanationRequest,
  validatePredictionEvidenceRequest,
  validateRemedyExplanationRequest,
  validateCrossLinkRequest,
} from "../../validators/explanation.validator.js";

const VALID_CHART = {
  userData: { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  planetary: { "Sun ☀️": { house: 1, sign: "Aries" } },
  numerology: { mulank: 5, bhagyank: 7 },
  lagna: "Aries",
  moonSign: "Taurus",
  sunSign: "Aries",
  nakshatra: { name: "Ashwini", pada: 1 },
};

describe("validateReportSummaryRequest", () => {
  it("passes for a valid chart", () => {
    expect(validateReportSummaryRequest({ chart: VALID_CHART })).toEqual([]);
  });
  it("fails when chart is missing", () => {
    expect(validateReportSummaryRequest({})).not.toEqual([]);
  });
  it("fails when a required chart field is missing", () => {
    const { lagna, ...rest } = VALID_CHART;
    expect(validateReportSummaryRequest({ chart: rest })).not.toEqual([]);
  });
  it("fails when history entries are malformed", () => {
    expect(validateReportSummaryRequest({ chart: VALID_CHART, history: [{ role: "bot", content: "x" }] })).not.toEqual([]);
  });
});

describe("validateConfidenceExplanationRequest", () => {
  it("passes for a valid chart + category", () => {
    expect(validateConfidenceExplanationRequest({ chart: VALID_CHART, category: "Career" })).toEqual([]);
  });
  it("fails when category is missing", () => {
    expect(validateConfidenceExplanationRequest({ chart: VALID_CHART })).not.toEqual([]);
  });
  it("fails when category exceeds the max label length", () => {
    expect(
      validateConfidenceExplanationRequest({ chart: VALID_CHART, category: "x".repeat(500) })
    ).not.toEqual([]);
  });
});

describe("validatePredictionEvidenceRequest", () => {
  it("passes for a valid chart + category", () => {
    expect(validatePredictionEvidenceRequest({ chart: VALID_CHART, category: "Finance" })).toEqual([]);
  });
  it("fails when category is missing", () => {
    expect(validatePredictionEvidenceRequest({ chart: VALID_CHART })).not.toEqual([]);
  });
});

describe("validateRemedyExplanationRequest", () => {
  it("passes for a valid chart + remedyType", () => {
    expect(validateRemedyExplanationRequest({ chart: VALID_CHART, remedyType: "Gemstone" })).toEqual([]);
  });
  it("fails when remedyType is missing", () => {
    expect(validateRemedyExplanationRequest({ chart: VALID_CHART })).not.toEqual([]);
  });
});

describe("validateCrossLinkRequest", () => {
  it("passes when category is given", () => {
    expect(validateCrossLinkRequest({ chart: VALID_CHART, itemType: "category", category: "Career" })).toEqual([]);
  });
  it("passes when planet is given", () => {
    expect(validateCrossLinkRequest({ chart: VALID_CHART, itemType: "planet", planet: "Saturn" })).toEqual([]);
  });
  it("fails when itemType is invalid", () => {
    expect(validateCrossLinkRequest({ chart: VALID_CHART, itemType: "comet", planet: "Saturn" })).not.toEqual([]);
  });
  it("fails when none of itemLabel/planet/category is given", () => {
    expect(validateCrossLinkRequest({ chart: VALID_CHART, itemType: "planet" })).not.toEqual([]);
  });
});
