import { describe, it, expect } from "vitest";
import {
  scoreToConfidenceLabel,
  deriveConfidence,
  deriveCategoryConfidence,
  deriveOverallConfidence,
} from "../../services/astrology/confidenceEngine.js";

describe("scoreToConfidenceLabel", () => {
  it("labels Very High for scores >= 85", () => {
    expect(scoreToConfidenceLabel(90)).toBe("Very High");
    expect(scoreToConfidenceLabel(85)).toBe("Very High");
  });

  it("labels High for scores >= 65 and < 85", () => {
    expect(scoreToConfidenceLabel(70)).toBe("High");
  });

  it("labels Moderate for scores >= 40 and < 65", () => {
    expect(scoreToConfidenceLabel(50)).toBe("Moderate");
  });

  it("labels Low for scores < 40", () => {
    expect(scoreToConfidenceLabel(10)).toBe("Low");
  });

  it("defaults to Moderate for non-numeric input", () => {
    expect(scoreToConfidenceLabel(undefined)).toBe("Moderate");
    expect(scoreToConfidenceLabel(null)).toBe("Moderate");
    expect(scoreToConfidenceLabel(NaN)).toBe("Moderate");
  });
});

describe("deriveConfidence", () => {
  it("rounds and labels a numeric score", () => {
    expect(deriveConfidence(72.6)).toEqual({ score: 73, label: "High" });
  });

  it("returns a null score with a safe default label when no score is given", () => {
    expect(deriveConfidence(null)).toEqual({ score: null, label: "Moderate" });
  });
});

describe("deriveCategoryConfidence", () => {
  const predictions = [
    { category: "Career", confidence: { score: 88 } },
    { category: "Marriage", confidence: { score: 45 } },
  ];

  it("maps 'career' section to the Career category prediction", () => {
    expect(deriveCategoryConfidence(predictions, "career")).toEqual({ score: 88, label: "Very High" });
  });

  it("maps 'relationship' section to the Marriage category prediction", () => {
    expect(deriveCategoryConfidence(predictions, "relationship")).toEqual({ score: 45, label: "Moderate" });
  });

  it("returns a null-score confidence when no matching prediction exists", () => {
    expect(deriveCategoryConfidence(predictions, "finance")).toEqual({ score: null, label: "Moderate" });
  });

  it("handles an empty/undefined predictions list", () => {
    expect(deriveCategoryConfidence(undefined, "career")).toEqual({ score: null, label: "Moderate" });
  });
});

describe("deriveOverallConfidence", () => {
  it("averages the Panchang score and every prediction's confidence score", () => {
    const predictions = [{ confidence: { score: 80 } }, { confidence: { score: 60 } }];
    // (100 + 80 + 60) / 3 = 80
    expect(deriveOverallConfidence({ panchangScore: 100, predictions })).toEqual({ score: 80, label: "High" });
  });

  it("falls back to a null score when nothing numeric is available", () => {
    expect(deriveOverallConfidence({})).toEqual({ score: null, label: "Moderate" });
  });
});
