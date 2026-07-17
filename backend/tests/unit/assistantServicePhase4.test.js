import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.GOOGLE_API_KEY = "test-key-for-unit-tests";

// Mock geminiService so we control exactly what "Gemini" returns, without
// making a real network call — assistantService.js never calculates
// astrology itself, so this isolates its normalization logic only.
vi.mock("../../services/ai/geminiService.js", () => ({
  callGemini: vi.fn(),
}));

const { callGemini } = await import("../../services/ai/geminiService.js");
const { answerChatQuestion } = await import("../../services/ai/assistantService.js");

const CHART = {
  userData: { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" },
  planetary: { Sun: { house: 1, sign: "Aries" } },
  numerology: { mulank: 5, bhagyank: 7 },
  lagna: "Aries",
  moonSign: "Taurus",
  sunSign: "Aries",
  nakshatra: { name: "Ashwini", pada: 1 },
  yogas: [],
  doshas: [],
  remedies: [],
};

describe("answerChatQuestion (Phase 4 — structured response)", () => {
  beforeEach(() => {
    callGemini.mockReset();
  });

  it("normalizes a full structured Gemini response into all Phase 4 fields plus backward-compatible answer", async () => {
    callGemini.mockResolvedValue({
      shortAnswer: "Saturn is your current Mahadasha lord.",
      detailedExplanation: "Saturn governs discipline and structure in your chart right now.",
      evidence: ["Current Mahadasha: Saturn until 2027-03-12"],
      confidence: { label: "High", score: 82 },
      suggestedNextQuestion: "What does my Antardasha indicate?",
    });

    const result = await answerChatQuestion({ chart: CHART, report: {}, history: [], question: "Why is Saturn important?" });

    expect(result.shortAnswer).toBe("Saturn is your current Mahadasha lord.");
    expect(result.detailedExplanation).toBe("Saturn governs discipline and structure in your chart right now.");
    expect(result.evidence).toEqual(["Current Mahadasha: Saturn until 2027-03-12"]);
    expect(result.confidence).toEqual({ label: "High", score: 82 });
    expect(result.suggestedNextQuestion).toBe("What does my Antardasha indicate?");
    expect(result.answer).toContain("Saturn is your current Mahadasha lord.");
    expect(result.answer).toContain("Saturn governs discipline and structure");
  });

  it("falls back to a legacy {answer} response (backward compatibility) without throwing", async () => {
    callGemini.mockResolvedValue({ answer: "Legacy plain-text answer." });

    const result = await answerChatQuestion({ chart: CHART, report: {}, history: [], question: "test" });

    expect(result.answer).toContain("Legacy plain-text answer.");
    expect(result.evidence).toEqual([]);
    expect(result.confidence).toBeNull();
  });

  it("never invents a confidence object when Gemini omits one", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "Short.", detailedExplanation: "Detail." });
    const result = await answerChatQuestion({ chart: CHART, report: {}, history: [], question: "test" });
    expect(result.confidence).toBeNull();
  });

  it("strips code fences from every text field (defense in depth)", async () => {
    callGemini.mockResolvedValue({
      shortAnswer: "```Short```",
      detailedExplanation: "```js\nsome code\n```",
      evidence: ["```fact```"],
      suggestedNextQuestion: "```next?```",
    });
    const result = await answerChatQuestion({ chart: CHART, report: {}, history: [], question: "test" });
    expect(result.shortAnswer).not.toContain("```");
    expect(result.detailedExplanation).not.toContain("```");
    expect(result.evidence[0]).not.toContain("```");
    expect(result.suggestedNextQuestion).not.toContain("```");
  });

  it("throws a 502 when Gemini returns nothing usable at all", async () => {
    callGemini.mockResolvedValue({});
    await expect(answerChatQuestion({ chart: CHART, report: {}, history: [], question: "test" })).rejects.toMatchObject({ status: 502 });
  });

  it("passes optional festivalContext/panchangContext/muhuratContext through to the prompt without erroring", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "ok", detailedExplanation: "ok" });
    await answerChatQuestion({
      chart: CHART,
      report: {},
      history: [],
      question: "Why is this festival important for me?",
      festivalContext: { name: "Diwali" },
      panchangContext: { tithi: "Purnima" },
      muhuratContext: { activity: "Griha Pravesh" },
    });
    const promptArg = callGemini.mock.calls[0][0];
    expect(promptArg).toContain("Diwali");
    expect(promptArg).toContain("Purnima");
    expect(promptArg).toContain("Griha Pravesh");
  });
});
