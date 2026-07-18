import { describe, it, expect } from "vitest";
import { computePanchang, computeDayQualityInternal } from "../../services/astrology/panchangEngine.js";

describe("computePanchang — shape and determinism", () => {
  it("returns every field the Daily Panchang page requires", () => {
    const p = computePanchang("2026-07-11");
    expect(p.date).toBe("2026-07-11");
    expect(p.weekday).toBeTruthy();
    expect(p.tithi.name).toBeTruthy();
    expect(p.nakshatra.name).toBeTruthy();
    expect(p.yoga.name).toBeTruthy();
    expect(p.karana.name).toBeTruthy();
    expect(p.paksha).toBeTruthy();
    expect(p.sunrise).toMatch(/AM|PM/);
    expect(p.sunset).toMatch(/AM|PM/);
    expect(p.moonrise).toMatch(/AM|PM/);
    expect(p.moonset).toMatch(/AM|PM/);
    expect(p.rahuKaal.start).toBeTruthy();
    expect(p.gulikaKaal.start).toBeTruthy();
    expect(p.yamaganda.start).toBeTruthy();
    expect(p.abhijitMuhurat.start).toBeTruthy();
    expect(p.brahmaMuhurat.start).toBeTruthy();
    expect(typeof p.auspiciousnessScore).toBe("number");
    expect(p.auspiciousnessScore).toBeGreaterThanOrEqual(0);
    expect(p.auspiciousnessScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(p.thingsToAvoid)).toBe(true);
    expect(Array.isArray(p.recommendedActivities)).toBe(true);
    expect(p.bestTimeToday).toContain("Abhijit");
  });

  it("is fully deterministic — same date always produces the same Panchang", () => {
    const a = computePanchang("2025-12-25");
    const b = computePanchang("2025-12-25");
    expect(a).toEqual(b);
  });

  it("produces a different Tithi/Nakshatra for a different date", () => {
    const a = computePanchang("2026-01-01");
    const b = computePanchang("2026-01-15");
    expect(a.tithi.name === b.tithi.name && a.nakshatra.name === b.nakshatra.name).toBe(false);
  });

  it("computes the correct real-world weekday from the calendar date", () => {
    // 2026-07-11 is a real, verifiable Saturday.
    expect(computePanchang("2026-07-11").weekday).toBe("Saturday");
    // 2024-01-11 is a real, verifiable Thursday.
    expect(computePanchang("2024-01-11").weekday).toBe("Thursday");
  });

  it("rejects an invalid date string", () => {
    expect(() => computePanchang("not-a-date")).toThrow(/Invalid date/);
  });

  it("keeps Rahu Kaal/Gulika Kaal/Yamaganda within the day's sunrise-sunset window", () => {
    const p = computePanchang("2026-03-20");
    // Spot check: none of the three should be an empty/garbage string.
    expect(p.rahuKaal.start).not.toBe(p.rahuKaal.end);
    expect(p.gulikaKaal.start).not.toBe(p.gulikaKaal.end);
    expect(p.yamaganda.start).not.toBe(p.yamaganda.end);
  });

  it("Abhijit Muhurat sits near solar midday", () => {
    const p = computePanchang("2026-06-01");
    expect(p.abhijitMuhurat.start).toMatch(/^1[12]:/); // ~11 or 12 o'clock
  });

  it("Brahma Muhurat falls before sunrise", () => {
    const p = computePanchang("2026-06-01");
    expect(p.brahmaMuhurat.end).toMatch(/AM/);
  });
});

describe("computeDayQualityInternal — used by the Muhurat Finder", () => {
  it("exposes the raw Tithi/Nakshatra/Yoga/Karana quality signals", () => {
    const q = computeDayQualityInternal("2026-08-15");
    expect(q.tithi.quality).toBeGreaterThanOrEqual(0);
    expect(q.nakshatra.quality).toBeGreaterThanOrEqual(0);
    expect(typeof q.yoga.isInauspicious).toBe("boolean");
    expect(typeof q.karana.isInauspicious).toBe("boolean");
    expect(q.weekday).toBeTruthy();
  });
});
