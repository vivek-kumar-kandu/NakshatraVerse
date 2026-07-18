import { describe, it, expect, beforeEach } from "vitest";
import { computeChart, getChartCacheStats, clearChartCache } from "../../services/astrology/birthChartEngine.js";

const SAMPLE = { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" };

describe("computeChart (regression — output shape must be unchanged)", () => {
  beforeEach(() => clearChartCache());

  it("returns the exact top-level key set the frontend/prompt builder expect", () => {
    const chart = computeChart(SAMPLE);
    expect(Object.keys(chart).sort()).toEqual(
      ["userData", "numerology", "planetary", "lagna", "moonSign", "sunSign", "nakshatra", "yogas", "doshas", "remedies"].sort()
    );
  });

  it("is fully deterministic for the same birth data", () => {
    const a = computeChart(SAMPLE);
    clearChartCache();
    const b = computeChart(SAMPLE);
    expect(a).toEqual(b);
  });

  it("echoes back the exact userData it was given (plus computed lagna)", () => {
    const chart = computeChart(SAMPLE);
    expect(chart.userData).toMatchObject(SAMPLE);
    expect(chart.userData.lagna).toBe(chart.lagna);
  });

  it("produces a different chart for different birth data", () => {
    const a = computeChart(SAMPLE);
    const b = computeChart({ ...SAMPLE, dob: "1985-01-01" });
    expect(a.lagna === b.lagna && a.moonSign === b.moonSign).toBe(false);
  });
});

describe("computeChart caching (Priority 4)", () => {
  beforeEach(() => clearChartCache());

  it("serves a repeat request for identical birth data from cache", () => {
    computeChart(SAMPLE);
    computeChart(SAMPLE);
    const stats = getChartCacheStats();
    expect(stats.hits).toBeGreaterThanOrEqual(1);
  });

  it("cache hit returns a value deeply equal to a fresh computation", () => {
    const first = computeChart(SAMPLE);
    const second = computeChart(SAMPLE); // served from cache
    expect(second).toEqual(first);
  });

  it("treats different pob as a different cache key even though pob doesn't affect calculation", () => {
    clearChartCache();
    const a = computeChart(SAMPLE);
    const b = computeChart({ ...SAMPLE, pob: "Mumbai" });
    expect(a.userData.pob).toBe("Lucknow");
    expect(b.userData.pob).toBe("Mumbai");
  });
});
