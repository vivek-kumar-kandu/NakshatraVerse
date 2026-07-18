import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.GOOGLE_API_KEY = "test-key-for-unit-tests";

// Mock geminiService so we control exactly what "Gemini" returns, without
// making a real network call — aiTimelineService.js never calculates
// astrology itself, so this isolates its prompt-building/normalization
// logic only. Same isolation pattern as explorerAiService.test.js.
vi.mock("../../services/ai/geminiService.js", () => ({
  callGemini: vi.fn(),
}));

const { callGemini } = await import("../../services/ai/geminiService.js");
const { explainTimelineEvent } = await import("../../services/ai/aiTimelineService.js");

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

const EVENT = {
  id: "nextMonth-0-career",
  section: "nextMonth",
  category: "Career",
  timePeriod: { startDate: "2026-08-01", endDate: "2026-08-31" },
  prediction: "A favorable period for career growth.",
  confidence: { label: "High", score: 82 },
  activeMahadasha: "Jupiter",
  activeAntardasha: "Venus",
  dominantPlanet: "Jupiter",
  supportingPlanets: ["Jupiter", "Sun"],
  supportingYogas: [{ name: "Gaj Kesari Yoga" }],
  supportingDoshas: [],
  suggestedRemedies: ["Chant the Guru mantra on Thursdays."],
  contextFacts: { dominantPlanet: "Jupiter", activeMahadasha: "Jupiter", confidenceScore: 82 },
};

describe("explainTimelineEvent", () => {
  beforeEach(() => {
    callGemini.mockReset();
  });

  it("normalizes a full structured Gemini response into all required fields", async () => {
    callGemini.mockResolvedValue({
      shortAnswer: "This is a strong period for career growth.",
      detailedExplanation: "Jupiter's dasha strengthens the 10th house significations.",
      evidence: ["Jupiter: dominant planet, Gaj Kesari Yoga active"],
      confidence: { label: "High", score: 82 },
      suggestedNextQuestion: "What remedies support this period?",
    });

    const result = await explainTimelineEvent({ chart: CHART, report: { chart: CHART }, event: EVENT });

    expect(result.eventId).toBe("nextMonth-0-career");
    expect(result.section).toBe("nextMonth");
    expect(result.category).toBe("Career");
    expect(result.summary).toBe("This is a strong period for career growth.");
    expect(result.shortAnswer).toBe("This is a strong period for career growth.");
    expect(result.detailedExplanation).toContain("10th house");
    expect(result.evidence).toEqual(["Jupiter: dominant planet, Gaj Kesari Yoga active"]);
    expect(result.confidence).toEqual({ label: "High", score: 82 });
    expect(result.suggestedNextQuestion).toBe("What remedies support this period?");
  });

  it("embeds the event's category, section, and contextFacts into the prompt sent to Gemini", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "ok", detailedExplanation: "ok" });
    await explainTimelineEvent({ chart: CHART, report: {}, event: EVENT });
    const promptArg = callGemini.mock.calls[0][0];
    expect(promptArg).toContain("Career");
    expect(promptArg).toContain("Next Month");
    expect(promptArg).toContain("Jupiter");
  });

  it("builds a distinct question for every one of the seven AI Timeline sections", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "ok", detailedExplanation: "ok" });
    const sections = ["past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear"];
    const prompts = [];
    for (const section of sections) {
      callGemini.mockClear();
      await explainTimelineEvent({ chart: CHART, report: {}, event: { ...EVENT, section } });
      prompts.push(callGemini.mock.calls[0][0]);
    }
    expect(new Set(prompts).size).toBe(sections.length);
  });

  it("falls back to a legacy {answer} response without throwing", async () => {
    callGemini.mockResolvedValue({ answer: "Legacy plain-text explanation." });
    const result = await explainTimelineEvent({ chart: CHART, report: {}, event: EVENT });
    expect(result.detailedExplanation).toContain("Legacy plain-text explanation.");
    expect(result.evidence).toEqual([]);
    expect(result.confidence).toBeNull();
  });

  it("strips code fences from every text field (defense in depth)", async () => {
    callGemini.mockResolvedValue({
      shortAnswer: "```Short```",
      detailedExplanation: "```js\nsome code\n```",
      evidence: ["```fact```"],
      suggestedNextQuestion: "```next?```",
    });
    const result = await explainTimelineEvent({ chart: CHART, report: {}, event: EVENT });
    expect(result.shortAnswer).not.toContain("```");
    expect(result.detailedExplanation).not.toContain("```");
    expect(result.evidence[0]).not.toContain("```");
    expect(result.suggestedNextQuestion).not.toContain("```");
  });

  it("throws a 502 when Gemini returns nothing usable at all", async () => {
    callGemini.mockResolvedValue({});
    await expect(
      explainTimelineEvent({ chart: CHART, report: {}, event: EVENT })
    ).rejects.toMatchObject({ status: 502 });
  });

  it("continues (defensively) even if buildStructuredInsights would fail on a malformed chart", async () => {
    callGemini.mockResolvedValue({ shortAnswer: "ok", detailedExplanation: "ok" });
    const brokenChart = { ...CHART, planetary: null };
    const result = await explainTimelineEvent({ chart: brokenChart, report: {}, event: EVENT });
    expect(result.shortAnswer).toBe("ok");
  });
});
