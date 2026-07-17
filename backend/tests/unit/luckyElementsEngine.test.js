import { describe, it, expect } from "vitest";
import { computeLuckyElements, selectSpiritualPractice } from "../../services/astrology/luckyElementsEngine.js";

const CHART = {
  planetary: { "Moon 🌙": { sign: "Cancer", house: 4 } },
  numerology: { mulank: 5, bhagyank: 7 },
};

const PANCHANG = {
  weekday: "Thursday",
  abhijitMuhurat: { start: "11:48", end: "12:36" },
};

describe("computeLuckyElements", () => {
  it("derives lucky color/direction from the Moon sign's ruling planet", () => {
    const result = computeLuckyElements({ chart: CHART, panchang: PANCHANG });
    // Cancer is ruled by Moon
    expect(result.luckyColor).toBe("White / Silver");
    expect(result.luckyDirection).toBe("North-West");
  });

  it("derives the lucky number from birth numerology Mulank (never invents one)", () => {
    const result = computeLuckyElements({ chart: CHART, panchang: PANCHANG });
    expect(result.luckyNumber).toBe(5);
  });

  it("derives the favorable time window from today's Abhijit Muhurat", () => {
    const result = computeLuckyElements({ chart: CHART, panchang: PANCHANG });
    expect(result.favorableTimeWindow).toContain("11:48");
    expect(result.favorableTimeWindow).toContain("Abhijit Muhurat");
  });

  it("degrades gracefully when Moon sign/numerology/Panchang are missing", () => {
    const result = computeLuckyElements({ chart: {}, panchang: null });
    expect(result.luckyColor).toBeTruthy();
    expect(result.luckyDirection).toBeTruthy();
    expect(result.luckyNumber).toBeNull();
    expect(result.favorableTimeWindow).toBeNull();
  });
});

describe("selectSpiritualPractice", () => {
  it("selects a practice deterministically from today's weekday ruling planet", () => {
    // Thursday -> Jupiter -> Mantra Chanting
    const result = selectSpiritualPractice({ panchang: PANCHANG, nakshatraProfile: null });
    expect(result.activity).toBe("Mantra Chanting");
    expect(result.lord).toBe("Jupiter");
  });

  it("falls back to the Nakshatra Profile lord when weekday is unavailable", () => {
    const result = selectSpiritualPractice({ panchang: null, nakshatraProfile: { lord: "Saturn" } });
    expect(result.activity).toBe("Yoga");
  });

  it("falls back to Meditation when no lord can be determined", () => {
    const result = selectSpiritualPractice({ panchang: null, nakshatraProfile: null });
    expect(result.activity).toBe("Meditation");
  });
});
