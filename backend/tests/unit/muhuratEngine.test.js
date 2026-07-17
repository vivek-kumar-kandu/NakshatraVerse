import { describe, it, expect } from "vitest";
import { findMuhurat, MUHURAT_ACTIVITIES } from "../../services/astrology/muhuratEngine.js";

describe("MUHURAT_ACTIVITIES", () => {
  it("exposes all 8 activities named in the V4.1 Phase 2 spec", () => {
    expect(MUHURAT_ACTIVITIES).toEqual([
      "marriage", "housewarming", "businessOpening", "travel",
      "education", "vehiclePurchase", "propertyPurchase", "namingCeremony",
    ]);
  });
});

describe("findMuhurat", () => {
  it("returns Best Date, Best Time Window, Auspicious Period, Caution Period, and Confidence Level", () => {
    const m = findMuhurat({ activity: "marriage", startDate: "2026-08-01", rangeDays: 30 });
    expect(m.bestDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(m.bestTimeWindow.start).toBeTruthy();
    expect(m.bestTimeWindow.end).toBeTruthy();
    expect(m.auspiciousPeriod.window.start).toBeTruthy();
    expect(m.cautionPeriod.rahuKaal.start).toBeTruthy();
    expect(m.cautionPeriod.yamaganda.start).toBeTruthy();
    expect(m.cautionPeriod.gulikaKaal.start).toBeTruthy();
    expect(["High", "Medium", "Low"]).toContain(m.confidenceLevel);
  });

  it("only ever picks a date inside the requested search window", () => {
    const m = findMuhurat({ activity: "travel", startDate: "2026-09-01", rangeDays: 10 });
    expect(m.bestDate >= "2026-09-01").toBe(true);
    expect(m.bestDate <= "2026-09-10").toBe(true);
    expect(m.searchWindow.endDate).toBe("2026-09-10");
  });

  it("is deterministic — same inputs always produce the same recommendation", () => {
    const a = findMuhurat({ activity: "housewarming", startDate: "2026-10-01", rangeDays: 20 });
    const b = findMuhurat({ activity: "housewarming", startDate: "2026-10-01", rangeDays: 20 });
    expect(a).toEqual(b);
  });

  it("rejects an unknown activity", () => {
    expect(() => findMuhurat({ activity: "not-a-real-activity", startDate: "2026-08-01" })).toThrow(/Unknown Muhurat activity/);
  });

  it("clamps rangeDays into a sane 1-90 window instead of trusting the caller", () => {
    const m = findMuhurat({ activity: "education", startDate: "2026-08-01", rangeDays: 5000 });
    expect(m.searchWindow.rangeDays).toBeLessThanOrEqual(90);
  });

  it("produces a plausible result for every supported activity", () => {
    for (const activity of MUHURAT_ACTIVITIES) {
      const m = findMuhurat({ activity, startDate: "2026-11-01", rangeDays: 30 });
      expect(m.activity).toBe(activity);
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    }
  });
});
