import { describe, it, expect } from "vitest";
import { buildChatPrompt } from "../../services/ai/chatPromptBuilder.js";

// V4.5 Phase 4 — AI Report Chat
// Confirms the prompt's JSON contract now asks for the structured shape
// (shortAnswer/detailedExplanation/evidence/confidence/suggestedNextQuestion)
// and that optional Festival/Panchang/Muhurat context sections render only
// when provided — every existing caller that omits them gets a prompt
// with no such section at all.

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

describe("buildChatPrompt (Phase 4)", () => {
  it("asks for the new structured JSON shape", () => {
    const prompt = buildChatPrompt({ chart: CHART, report: {}, insights: null, history: [], question: "Why is Saturn important?" });
    expect(prompt).toContain('"shortAnswer"');
    expect(prompt).toContain('"detailedExplanation"');
    expect(prompt).toContain('"evidence"');
    expect(prompt).toContain('"confidence"');
    expect(prompt).toContain('"suggestedNextQuestion"');
  });

  it("never calculates astrology — still forbids Gemini from computing new facts", () => {
    const prompt = buildChatPrompt({ chart: CHART, report: {}, insights: null, history: [], question: "test" });
    expect(prompt).toMatch(/Never calculate astrology yourself/);
  });

  it("omits Festival/Panchang/Muhurat sections when not provided (backward compatible)", () => {
    const prompt = buildChatPrompt({ chart: CHART, report: {}, insights: null, history: [], question: "test" });
    expect(prompt).not.toContain("Backend-Computed Festival Intelligence Context");
    expect(prompt).not.toContain("Backend-Computed Panchang Context");
    expect(prompt).not.toContain("Backend-Computed Muhurat Context");
  });

  it("includes Festival Intelligence context only when passed", () => {
    const prompt = buildChatPrompt({
      chart: CHART,
      report: {},
      insights: null,
      history: [],
      question: "Why is this festival important for me?",
      festivalContext: { name: "Diwali", date: "2026-11-08", type: "Major", importance: "High" },
    });
    expect(prompt).toContain("Backend-Computed Festival Intelligence Context");
    expect(prompt).toContain("Diwali");
    expect(prompt).not.toContain("Backend-Computed Panchang Context");
  });

  it("includes Panchang and Muhurat context only when passed", () => {
    const prompt = buildChatPrompt({
      chart: CHART,
      report: {},
      insights: null,
      history: [],
      question: "test",
      panchangContext: { date: "2026-07-14", tithi: "Purnima" },
      muhuratContext: { activity: "Griha Pravesh", windows: "10:00-11:30" },
    });
    expect(prompt).toContain("Backend-Computed Panchang Context");
    expect(prompt).toContain("Purnima");
    expect(prompt).toContain("Backend-Computed Muhurat Context");
    expect(prompt).toContain("Griha Pravesh");
  });

  it("preserves the pre-existing facts section (planets, dasha, predictions, report narrative)", () => {
    const prompt = buildChatPrompt({ chart: CHART, report: { career: "Some career text" }, insights: null, history: [], question: "test" });
    expect(prompt).toContain("Backend-Calculated Astrological Facts");
    expect(prompt).toContain("Some career text");
  });
});
