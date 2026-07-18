import { describe, it, expect } from "vitest";
import { requiresPersonalChart } from "../../services/ai/personalIntentDetector.js";

describe("requiresPersonalChart", () => {
  it("flags questions that explicitly reference the person's own chart", () => {
    expect(requiresPersonalChart("Explain my Nakshatra.")).toBe(true);
    expect(requiresPersonalChart("Which planet is strongest in my chart?")).toBe(true);
    expect(requiresPersonalChart("Explain my current Dasha.")).toBe(true);
    expect(requiresPersonalChart("What does my Antardasha indicate?")).toBe(true);
    expect(requiresPersonalChart("Explain my remedies.")).toBe(true);
    expect(requiresPersonalChart("Explain my numerology.")).toBe(true);
  });

  it("flags direct personal-fortune phrasing even without a domain keyword", () => {
    expect(requiresPersonalChart("Will I get married soon?")).toBe(true);
    expect(requiresPersonalChart("When will I get a promotion?")).toBe(true);
    expect(requiresPersonalChart("Am I going to be successful?")).toBe(true);
  });

  it("does not flag general/educational astrology questions", () => {
    expect(requiresPersonalChart("What is a Nakshatra?")).toBe(false);
    expect(requiresPersonalChart("What is a Dasha period?")).toBe(false);
    expect(requiresPersonalChart("How does Vedic astrology differ from Western astrology?")).toBe(false);
    expect(requiresPersonalChart("What are yogas and doshas in general?")).toBe(false);
    expect(requiresPersonalChart("How is planetary strength traditionally assessed?")).toBe(false);
  });

  it("does not flag unrelated chit-chat", () => {
    expect(requiresPersonalChart("Hello, how are you?")).toBe(false);
    expect(requiresPersonalChart("Can you write me a poem?")).toBe(false);
  });

  it("handles empty/non-string input safely", () => {
    expect(requiresPersonalChart("")).toBe(false);
    expect(requiresPersonalChart(undefined)).toBe(false);
    expect(requiresPersonalChart(null)).toBe(false);
  });
});
