import { describe, it, expect, beforeEach } from "vitest";
import { computeChart, clearChartCache } from "../../services/astrology/birthChartEngine.js";
import { computeMatching } from "../../services/astrology/kundliMatchingEngine.js";

const PERSON_A = { name: "Arjun Sharma", gender: "male", dob: "1990-05-14", tob: "08:30", pob: "Mumbai, India" };
const PERSON_B = { name: "Priya Verma", gender: "female", dob: "1992-11-02", tob: "14:15", pob: "Delhi, India" };

function match(personA = PERSON_A, personB = PERSON_B) {
  const chartA = computeChart(personA);
  const chartB = computeChart(personB);
  return computeMatching({ chartA, chartB, personA, personB });
}

describe("computeMatching — Ashtakoota (Guna Milan) shape and invariants", () => {
  beforeEach(() => clearChartCache());

  it("returns all 8 classical Kootas with the correct max points", () => {
    const m = match();
    const expectedMax = { varna: 1, vashya: 2, tara: 3, yoni: 4, grahaMaitri: 5, gana: 6, bhakoot: 7, nadi: 8 };
    for (const [key, max] of Object.entries(expectedMax)) {
      expect(m.ashtakoota[key]).toBeDefined();
      expect(m.ashtakoota[key].max).toBe(max);
      expect(m.ashtakoota[key].score).toBeGreaterThanOrEqual(0);
      expect(m.ashtakoota[key].score).toBeLessThanOrEqual(max);
    }
  });

  it("total/max Kootas sum to exactly 36, and totalScore is the sum of the 8 Kootas", () => {
    const m = match();
    const sumMax = Object.values(m.ashtakoota).reduce((s, k) => s + k.max, 0);
    const sumScore = Object.values(m.ashtakoota).reduce((s, k) => s + k.score, 0);
    expect(sumMax).toBe(36);
    expect(m.maxScore).toBe(36);
    expect(Math.round(m.totalScore * 10) / 10).toBe(Math.round(sumScore * 10) / 10);
  });

  it("percentage is totalScore/maxScore as a percentage", () => {
    const m = match();
    expect(m.percentage).toBeCloseTo((m.totalScore / m.maxScore) * 100, 1);
  });

  it("is fully deterministic for the same two birth records", () => {
    const a = match();
    const b = match();
    expect(a).toEqual(b);
  });

  it("is symmetric on total score regardless of which person is passed as A/B, given matching genders", () => {
    const forward = match(PERSON_A, PERSON_B);
    const swapped = match(PERSON_B, PERSON_A);
    // Groom/bride resolution follows gender, not argument order, so the
    // total score (and every Koota) should be identical either way.
    expect(swapped.totalScore).toBe(forward.totalScore);
  });

  it("defaults to personA=groom/personB=bride when genders are not male+female (documented, non-silent default)", () => {
    const m = match({ ...PERSON_A, gender: "other" }, { ...PERSON_B, gender: "other" });
    expect(m.groom).toBe("personA");
    expect(m.bride).toBe("personB");
    expect(m.groomBrideAssumed).toBe(true);
  });
});

describe("computeMatching — Nadi Koota (dosha) correctness", () => {
  beforeEach(() => clearChartCache());

  it("scores 0 when both people share the same Nakshatra (guaranteed same Nadi)", () => {
    const same = { ...PERSON_B, dob: PERSON_A.dob, tob: PERSON_A.tob }; // identical birth moment => identical Nakshatra
    const m = match(PERSON_A, same);
    expect(m.ashtakoota.nadi.isDosha).toBe(true);
    expect(m.ashtakoota.nadi.score).toBe(0);
  });
});

describe("computeMatching — Manglik analysis reuses the existing Advanced Dosha Engine", () => {
  beforeEach(() => clearChartCache());

  it("produces a manglik verdict for both people with a compatibility conclusion", () => {
    const m = match();
    expect(typeof m.manglik.personA.isManglik).toBe("boolean");
    expect(typeof m.manglik.personB.isManglik).toBe("boolean");
    expect(typeof m.manglik.compatibility.compatible).toBe("boolean");
    expect(m.manglik.compatibility.detail).toBeTruthy();
  });

  it("Manglik compatibility is true whenever both people share the same manglik status", () => {
    const m = match();
    if (m.manglik.personA.isManglik === m.manglik.personB.isManglik) {
      expect(m.manglik.compatibility.compatible).toBe(true);
    } else {
      expect(m.manglik.compatibility.compatible).toBe(false);
    }
  });
});

describe("computeMatching — dosha and planet-strength comparisons reuse existing engines only", () => {
  beforeEach(() => clearChartCache());

  it("doshaComparison lists come from the same dosha names the individual chart pipeline produces", () => {
    const chartA = computeChart(PERSON_A);
    const chartB = computeChart(PERSON_B);
    const m = computeMatching({ chartA, chartB, personA: PERSON_A, personB: PERSON_B });
    const namesA = m.doshaComparison.personA.map((d) => d.name);
    for (const d of chartA.doshas) expect(namesA).toContain(d.name);
  });

  it("planetStrength exposes a strongest/weakest planet for each person", () => {
    const m = match();
    expect(m.planetStrength.personA.strongest.planet).toBeTruthy();
    expect(m.planetStrength.personA.weakest.planet).toBeTruthy();
    expect(m.planetStrength.personB.strongest.planet).toBeTruthy();
    expect(m.planetStrength.personB.weakest.planet).toBeTruthy();
  });
});

describe("computeMatching — Moon sign / Nakshatra compatibility summaries", () => {
  beforeEach(() => clearChartCache());

  it("moonSignCompatibility.sameSign matches the two charts' actual Moon signs", () => {
    const chartA = computeChart(PERSON_A);
    const chartB = computeChart(PERSON_B);
    const m = computeMatching({ chartA, chartB, personA: PERSON_A, personB: PERSON_B });
    expect(m.moonSignCompatibility.sameSign).toBe(chartA.moonSign === chartB.moonSign);
  });

  it("nakshatraCompatibility.sameNakshatra matches the two charts' actual Nakshatras", () => {
    const chartA = computeChart(PERSON_A);
    const chartB = computeChart(PERSON_B);
    const m = computeMatching({ chartA, chartB, personA: PERSON_A, personB: PERSON_B });
    expect(m.nakshatraCompatibility.sameNakshatra).toBe(chartA.nakshatra?.name === chartB.nakshatra?.name);
  });
});
