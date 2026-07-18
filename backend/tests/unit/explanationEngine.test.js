import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.GOOGLE_API_KEY = "test-key-for-unit-tests";

// Isolate explanationEngine.js's own orchestration logic from the real
// Gemini network call, same isolation pattern explorerAiService.test.js
// already establishes for its sibling module.
vi.mock("../../services/ai/geminiService.js", () => ({
  callGemini: vi.fn(),
  clearGeminiCache: vi.fn(),
}));

const { callGemini } = await import("../../services/ai/geminiService.js");
const {
  getReportSummary,
  getConfidenceExplanation,
  getPredictionEvidence,
  getRemedyExplanation,
  getCrossLinks,
} = await import("../../services/ai/explanationEngine.js");
const { clearExplanationCache } = await import("../../services/utils/explanationCache.js");
const { clearGeminiCache } = await import("../../services/ai/geminiService.js");

// A chart with just enough real astrology data to drive predictionEngine.js
// (via buildStructuredInsights -> generateCategoryPredictions) into
// producing real category predictions/timeline events — this test suite
// exercises the actual Prediction/Rule Engine output (unmodified), never
// stubs it, so the Explanation Engine's own logic is what's under test.
function makeChart(overrides = {}) {
  return {
    userData: { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
    planetary: {
      "Sun ☀️": { house: 1, sign: "Aries" },
      "Moon 🌙": { house: 2, sign: "Taurus" },
      "Mars ♂️": { house: 3, sign: "Gemini" },
      "Mercury ☿️": { house: 4, sign: "Cancer" },
      "Jupiter ♃": { house: 5, sign: "Leo" },
      "Venus ♀️": { house: 6, sign: "Virgo" },
      "Saturn ♄": { house: 7, sign: "Libra" },
      "Rahu ☊": { house: 8, sign: "Scorpio" },
      "Ketu ☋": { house: 2, sign: "Taurus" },
    },
    numerology: { mulank: 5, bhagyank: 7 },
    lagna: "Aries",
    moonSign: "Taurus",
    sunSign: "Aries",
    nakshatra: { name: "Ashwini", pada: 1 },
    yogas: [],
    doshas: [{ name: "Mangal Dosha", detail: "Mars placement causes tension." }],
    remedies: [{ type: "Gemstone", detail: "Wear a red coral on Tuesday." }],
    ...overrides,
  };
}

describe("Explanation Engine (V5.3)", () => {
  beforeEach(() => {
    callGemini.mockReset();
    clearExplanationCache();
    clearGeminiCache();
  });

  describe("getReportSummary", () => {
    it("returns a normalized summary shaped result", async () => {
      callGemini.mockResolvedValue({
        shortAnswer: "This is a pivotal Saturn-influenced period.",
        detailedExplanation: "Longer synthesis of the whole chart.",
        evidence: ["Current Mahadasha: Saturn"],
        confidence: { label: "High", score: 78 },
        suggestedNextQuestion: "What does this mean for my career?",
      });

      const result = await getReportSummary({ chart: makeChart(), report: {} });

      expect(result.summary).toBe("This is a pivotal Saturn-influenced period.");
      expect(result.shortAnswer).toBe("This is a pivotal Saturn-influenced period.");
      expect(result.detailedExplanation).toBe("Longer synthesis of the whole chart.");
      expect(result.evidence).toEqual(["Current Mahadasha: Saturn"]);
      expect(result.confidence).toEqual({ label: "High", score: 78 });
      expect(result.suggestedNextQuestion).toBe("What does this mean for my career?");
    });

    it("throws a 502 when Gemini returns nothing usable", async () => {
      callGemini.mockResolvedValue({});
      await expect(getReportSummary({ chart: makeChart({ userData: { name: "NoUse", dob: "1-1-1", tob: "0", pob: "x" } }), report: {} }))
        .rejects.toMatchObject({ status: 502 });
    });

    it("caches identical requests so a second call does not invoke Gemini again", async () => {
      callGemini.mockResolvedValue({ shortAnswer: "Cached answer.", detailedExplanation: "Detail." });
      const chart = makeChart({ userData: { name: "CacheUser", dob: "1991-01-01", tob: "10:00", pob: "Delhi" } });
      await getReportSummary({ chart, report: {} });
      await getReportSummary({ chart, report: {} });
      expect(callGemini).toHaveBeenCalledTimes(1);
    });
  });

  describe("getConfidenceExplanation", () => {
    it("returns deterministic confidence evidence even when Gemini fails", async () => {
      callGemini.mockRejectedValue(Object.assign(new Error("Gemini down"), { status: 503 }));
      const result = await getConfidenceExplanation({
        chart: makeChart({ userData: { name: "ConfUser1", dob: "1992-02-02", tob: "11:00", pob: "Pune" } }),
        report: {},
        category: "Career",
      });
      expect(result.category).toBe("Career");
      expect(result.confidence).toHaveProperty("score");
      expect(result.confidence).toHaveProperty("label");
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.narrative).toBeNull();
      expect(result.narrativeError).toBeTruthy();
    });

    it("attaches a Gemini narrative on top of the deterministic evidence when available", async () => {
      callGemini.mockResolvedValue({ detailedExplanation: "Saturn's dasha explains this confidence level." });
      const result = await getConfidenceExplanation({
        chart: makeChart({ userData: { name: "ConfUser2", dob: "1993-03-03", tob: "12:00", pob: "Mumbai" } }),
        report: {},
        category: "Career",
      });
      expect(result.narrative).toContain("Saturn");
      expect(result.narrativeError).toBeNull();
    });
  });

  describe("getPredictionEvidence", () => {
    it("returns deterministic evidence bullets grounded in the real prediction engine output", async () => {
      callGemini.mockResolvedValue({ detailedExplanation: "Here is why." });
      const result = await getPredictionEvidence({
        chart: makeChart({ userData: { name: "EvidUser1", dob: "1994-04-04", tob: "13:00", pob: "Chennai" } }),
        report: {},
        category: "Finance",
      });
      expect(result.category).toBe("Finance");
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.narrative).toBe("Here is why.");
    });

    it("still returns deterministic evidence if the Gemini narrative call fails", async () => {
      callGemini.mockRejectedValue(Object.assign(new Error("timeout"), { status: 504 }));
      const result = await getPredictionEvidence({
        chart: makeChart({ userData: { name: "EvidUser2", dob: "1995-05-05", tob: "14:00", pob: "Kolkata" } }),
        report: {},
        category: "Health",
      });
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.narrative).toBeNull();
      expect(result.narrativeError).toBeTruthy();
    });
  });

  describe("getRemedyExplanation", () => {
    it("explains an existing backend-derived remedy", async () => {
      callGemini.mockResolvedValue({ detailedExplanation: "The Gemstone remedy addresses the Mangal Dosha." });
      const chart = makeChart({ userData: { name: "RemedyUser1", dob: "1996-06-06", tob: "15:00", pob: "Jaipur" } });
      const result = await getRemedyExplanation({ chart, report: {}, remedyType: "Gemstone" });
      expect(result.found).toBe(true);
      expect(result.type).toBe("Gemstone");
      expect(result.detail).toBe("Wear a red coral on Tuesday.");
      expect(result.narrative).toContain("Mangal Dosha");
    });

    it("never invents a remedy that isn't on the chart", async () => {
      const chart = makeChart({ userData: { name: "RemedyUser2", dob: "1997-07-07", tob: "16:00", pob: "Agra" } });
      const result = await getRemedyExplanation({ chart, report: {}, remedyType: "Nonexistent Remedy" });
      expect(result.found).toBe(false);
      expect(result.detail).toBeNull();
      expect(callGemini).not.toHaveBeenCalled();
    });
  });

  describe("getCrossLinks", () => {
    it("never calls Gemini and returns related timeline events/predictions for a category", async () => {
      const chart = makeChart({ userData: { name: "CrossUser1", dob: "1998-08-08", tob: "17:00", pob: "Surat" } });
      const result = await getCrossLinks({ chart, itemType: "category", category: "Career" });
      expect(callGemini).not.toHaveBeenCalled();
      expect(result.itemType).toBe("category");
      expect(Array.isArray(result.relatedTimelineEvents)).toBe(true);
      expect(Array.isArray(result.relatedPredictions)).toBe(true);
      expect(result.relatedPredictions.some((p) => p.category === "Career")).toBe(true);
    });

    it("links a planet selection to the timeline events it dominates", async () => {
      const chart = makeChart({ userData: { name: "CrossUser2", dob: "1999-09-09", tob: "18:00", pob: "Bhopal" } });
      const result = await getCrossLinks({ chart, itemType: "planet", itemLabel: "Saturn", planet: "Saturn" });
      expect(result.itemType).toBe("planet");
      expect(Array.isArray(result.relatedTimelineEvents)).toBe(true);
    });
  });
});
