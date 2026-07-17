import { describe, it, expect } from "vitest";
import { computeWeeklyOutlookFacts, computeMonthlyOutlookFacts } from "../../services/astrology/lifeCoachOutlookEngine.js";
import { computePanchang } from "../../services/astrology/panchangEngine.js";

const START_DATE = "2026-07-12";

describe("computeWeeklyOutlookFacts", () => {
  it("averages exactly 7 days of the existing Panchang engine's auspiciousness score", () => {
    const result = computeWeeklyOutlookFacts({ date: START_DATE });
    expect(result.dailyScores).toHaveLength(7);
    expect(typeof result.weeklyEnergyScore).toBe("number");
    expect(result.weeklyEnergyScore).toBeGreaterThanOrEqual(0);
    expect(result.weeklyEnergyScore).toBeLessThanOrEqual(100);
  });

  it("picks the actual max/min-scoring day as Best Day / Caution Day", () => {
    const result = computeWeeklyOutlookFacts({ date: START_DATE });
    const maxScore = Math.max(...result.dailyScores.map((d) => d.score));
    const minScore = Math.min(...result.dailyScores.map((d) => d.score));
    expect(result.bestDay.score).toBe(maxScore);
    expect(result.cautionDay.score).toBe(minScore);
  });

  it("never recomputes Panchang itself — every daily score matches computePanchang() directly", () => {
    const result = computeWeeklyOutlookFacts({ date: START_DATE });
    result.dailyScores.forEach((day) => {
      const direct = computePanchang(day.date);
      expect(day.score).toBe(direct.auspiciousnessScore);
      expect(day.weekday).toBe(direct.weekday);
    });
  });
});

describe("computeMonthlyOutlookFacts", () => {
  it("averages exactly 30 days of the existing Panchang engine's auspiciousness score", () => {
    const result = computeMonthlyOutlookFacts({ date: START_DATE });
    expect(result.dailyScores).toHaveLength(30);
    expect(typeof result.monthlyEnergyScore).toBe("number");
    expect(result.monthlyEnergyScore).toBeGreaterThanOrEqual(0);
    expect(result.monthlyEnergyScore).toBeLessThanOrEqual(100);
  });
});
