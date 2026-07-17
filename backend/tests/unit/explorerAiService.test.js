import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.GOOGLE_API_KEY = "test-key-for-unit-tests";

// Mock geminiService so we control exactly what "Gemini" returns, without
// making a real network call — explorerAiService.js never calculates
// astrology itself, so this isolates its prompt-building/normalization
// logic only. Same isolation pattern as assistantServicePhase4.test.js.
vi.mock("../../services/ai/geminiService.js", () => ({
  callGemini: vi.fn(),
}));

const { callGemini } = await import("../../services/ai/geminiService.js");
const { explainExplorerItem } = await import("../../services/ai/explorerAiService.js");

const CHART = {
  userData: { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  planetary: { "Sun ☀️": { house: 1, sign: "Aries" } },
  numerology: { mulank: 5, bhagyank: 7 },
  lagna: "Aries",
  moonSign: "Taurus",
  sunSign: "Aries",
  nakshatra: { name: "Ashwini", pada: 1 },
  yogas: [],
  doshas: [],
  remedies: [],
};

describe("explainExplorerItem", () => {
  beforeEach(() => {
    callGemini.mockReset();
  });

  it("normalizes a full structured Gemini response into all required fields", async () => {
    callGemini.mockResolvedValue({
      shortAnswer: "The Sun rules your soul and vitality.",
      detailedExplanation: "Placed in House 1, the Sun gives strong leadership qualities.",
      evidence: ["Sun: House 1, Aries"],
      confidence: { label: "High", score: 80 },
      suggestedNextQuestion: "How does the Sun affect my career?",
    });

    const result = await explainExplorerItem({
      chart: CHART, report: { chart: CHART }, itemType: "planet", itemId: "Sun ☀️", itemLabel: "Sun ☀️",
      contextFacts: { position: { house: 1, sign: "Aries" } },
    });

    expect(result.itemType).toBe("planet");
    expect(result.itemLabel).toBe("Sun ☀️");
    expect(result.summary).toBe("The Sun rules your soul and vitality.");
    expect(result.shortAnswer).toBe("The Sun rules your soul and vitality.");
    expect(result.detailedExplanation).toContain("House 1");
    expect(result.evidence).toEqual(["Sun: House 1, Aries"]);
    expect(result.confidence).toEqual({ label: "High", score: 80 });
    expect(result.suggestedNextQuestion).toBe("How does the Sun affect my career?");
  });

  it("embeds itemType, itemLabel, and contextFacts into the prompt sent to Gemini", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "ok", detailedExplanation: "ok" });
    await explainExplorerItem({
      chart: CHART, report: {}, itemType: "dosha", itemId: "dosha-1", itemLabel: "Mangal Dosha",
      contextFacts: { severity: "Moderate" },
    });
    const promptArg = callGemini.mock.calls[0][0];
    expect(promptArg).toContain("Mangal Dosha");
    expect(promptArg).toContain("dosha");
    expect(promptArg).toContain("Moderate");
  });

  it("builds a distinct, type-appropriate instruction for every one of the eight item types", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "ok", detailedExplanation: "ok" });
    const types = ["planet", "house", "sign", "yoga", "dosha", "nakshatra", "ascendant", "aspect"];
    const prompts = [];
    for (const itemType of types) {
      callGemini.mockClear();
      await explainExplorerItem({ chart: CHART, report: {}, itemType, itemLabel: "Sample" });
      prompts.push(callGemini.mock.calls[0][0]);
    }
    // No two type-specific instructions collapse to the same text.
    expect(new Set(prompts).size).toBe(types.length);
  });

  it("falls back to a legacy {answer} response without throwing", async () => {
    callGemini.mockResolvedValue({ answer: "Legacy plain-text explanation." });
    const result = await explainExplorerItem({ chart: CHART, report: {}, itemType: "sign", itemLabel: "Aries" });
    expect(result.detailedExplanation).toContain("Legacy plain-text explanation.");
    expect(result.evidence).toEqual([]);
    expect(result.confidence).toBeNull();
  });

  it("never invents a confidence object when Gemini omits one", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "Short.", detailedExplanation: "Detail." });
    const result = await explainExplorerItem({ chart: CHART, report: {}, itemType: "yoga", itemLabel: "Gaj Kesari Yoga" });
    expect(result.confidence).toBeNull();
  });

  it("strips code fences from every text field (defense in depth)", async () => {
    callGemini.mockResolvedValue({
      shortAnswer: "```Short```",
      detailedExplanation: "```js\nsome code\n```",
      evidence: ["```fact```"],
      suggestedNextQuestion: "```next?```",
    });
    const result = await explainExplorerItem({ chart: CHART, report: {}, itemType: "house", itemLabel: "House 1" });
    expect(result.shortAnswer).not.toContain("```");
    expect(result.detailedExplanation).not.toContain("```");
    expect(result.evidence[0]).not.toContain("```");
    expect(result.suggestedNextQuestion).not.toContain("```");
  });

  it("throws a 502 when Gemini returns nothing usable at all", async () => {
    callGemini.mockResolvedValue({});
    await expect(
      explainExplorerItem({ chart: CHART, report: {}, itemType: "ascendant", itemLabel: "Aries" })
    ).rejects.toMatchObject({ status: 502 });
  });

  it("continues (defensively) even if buildStructuredInsights would fail on a malformed chart", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "ok", detailedExplanation: "ok" });
    const brokenChart = { ...CHART, planetary: null };
    const result = await explainExplorerItem({ chart: brokenChart, report: {}, itemType: "planet", itemLabel: "Sun ☀️" });
    expect(result.shortAnswer).toBe("ok");
  });
});
