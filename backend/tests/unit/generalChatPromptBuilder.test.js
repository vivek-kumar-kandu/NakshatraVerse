import { describe, it, expect } from "vitest";
import { buildGeneralChatPrompt } from "../../services/ai/chatPromptBuilder.js";

describe("buildGeneralChatPrompt (Two-Mode Chat — General Astrology Mode)", () => {
  it("carries no chart facts section", () => {
    const prompt = buildGeneralChatPrompt({ history: [], question: "What is a Nakshatra?" });
    expect(prompt).not.toContain("Backend-Calculated Astrological Facts");
    expect(prompt).not.toContain("Backend-Detected Yogas");
  });

  it("includes the question and instructs Gemini to redirect personal questions gracefully", () => {
    const prompt = buildGeneralChatPrompt({ history: [], question: "What is a Nakshatra?" });
    expect(prompt).toContain('The user\'s new question: "What is a Nakshatra?"');
    expect(prompt).toContain("generate or open");
  });

  it("renders prior conversation history", () => {
    const prompt = buildGeneralChatPrompt({
      history: [{ role: "user", content: "What is Vedic astrology?" }, { role: "assistant", content: "It's..." }],
      question: "How is it different from Western astrology?",
    });
    expect(prompt).toContain("User: What is Vedic astrology?");
    expect(prompt).toContain("Assistant: It's...");
  });

  it("requires evidence to be empty and confidence to be null in the JSON contract", () => {
    const prompt = buildGeneralChatPrompt({ history: [], question: "What is a Dasha?" });
    expect(prompt).toContain('"evidence": []');
    expect(prompt).toContain('"confidence": null');
  });
});
