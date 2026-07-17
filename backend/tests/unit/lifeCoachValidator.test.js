import { describe, it, expect } from "vitest";
import { validateLifeCoachRequest } from "../../validators/lifeCoach.validator.js";

const VALID_CHART = {
  userData: { name: "Test", dob: "1990-01-01", tob: "10:00", pob: "Delhi, India" },
  planetary: { "Sun ☀️": { sign: "Aries", house: 1 } },
  numerology: { mulank: 1, bhagyank: 2 },
  lagna: "Aries",
  moonSign: "Taurus",
  sunSign: "Aries",
  nakshatra: { name: "Ashwini", pada: 1 },
};

describe("validateLifeCoachRequest", () => {
  it("rejects a missing chart", () => {
    const { errors } = validateLifeCoachRequest({});
    expect(errors).toContain("chart is required and must be the backend-generated chart object.");
  });

  it("rejects a chart missing required fields", () => {
    const { errors } = validateLifeCoachRequest({ chart: { userData: {} } });
    expect(errors.some((e) => e.includes("chart.planetary"))).toBe(true);
    expect(errors.some((e) => e.includes("chart.lagna"))).toBe(true);
  });

  it("accepts a valid chart with no date/lat/lon", () => {
    const { errors } = validateLifeCoachRequest({ chart: VALID_CHART });
    expect(errors).toEqual([]);
  });

  it("rejects an invalid date", () => {
    const { errors } = validateLifeCoachRequest({ chart: VALID_CHART, date: "not-a-date" });
    expect(errors.some((e) => e.includes("date"))).toBe(true);
  });

  it("accepts a valid date and passes it through", () => {
    const { errors, date } = validateLifeCoachRequest({ chart: VALID_CHART, date: "2026-07-12" });
    expect(errors).toEqual([]);
    expect(date).toBe("2026-07-12");
  });

  it("rejects out-of-range lat/lon", () => {
    const { errors } = validateLifeCoachRequest({ chart: VALID_CHART, lat: 999, lon: -999 });
    expect(errors.some((e) => e.includes("lat"))).toBe(true);
    expect(errors.some((e) => e.includes("lon"))).toBe(true);
  });

  it("accepts valid lat/lon and coerces them to numbers", () => {
    const { errors, lat, lon } = validateLifeCoachRequest({ chart: VALID_CHART, lat: "19.07", lon: "72.87" });
    expect(errors).toEqual([]);
    expect(lat).toBe(19.07);
    expect(lon).toBe(72.87);
  });
});
