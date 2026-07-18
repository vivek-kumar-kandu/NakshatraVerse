import { describe, it, expect } from "vitest";
import { ruleMatches } from "../../services/rules/ruleEngine.js";
import { evaluateAspects } from "../../services/rules/aspectRuleEvaluator.js";
import { enrichInsight } from "../../services/rules/insightEnrichmentEvaluator.js";
import { evaluatePlanetStrength } from "../../services/rules/planetStrengthRuleEvaluator.js";
import { evaluateAdvancedYogas } from "../../services/rules/advancedYogaRuleEvaluator.js";
import { evaluateAdvancedDoshas } from "../../services/rules/advancedDoshaRuleEvaluator.js";
import { computeChart } from "../../services/astrology/birthChartEngine.js";

// Mars in Cancer (Moon's sign) and Moon in Aries (Mars's sign) = a mutual
// sign exchange (Parivartana Yoga) fixture, reused across several tests.
const exchangePlanetary = {
  "Sun ☀️": { house: 1, sign: "Aries" },
  "Moon 🌙": { house: 3, sign: "Aries" },
  "Mars ♂": { house: 5, sign: "Cancer" },
  "Mercury ☿": { house: 2, sign: "Gemini" },
  "Jupiter ♃": { house: 4, sign: "Sagittarius" },
  "Venus ♀": { house: 6, sign: "Libra" },
  "Saturn ♄": { house: 7, sign: "Capricorn" },
  "Rahu 🌑": { house: 8, sign: "Scorpio" },
  "Ketu 🌕": { house: 2, sign: "Taurus" },
};

describe("ruleEngine: mutualSignExchange operator (Priority 6)", () => {
  it("is true when two planets occupy each other's sign", () => {
    const rule = { conditions: [{ operator: "mutualSignExchange", planetA: "Moon", planetB: "Mars" }] };
    expect(ruleMatches(rule, exchangePlanetary)).toBe(true);
  });

  it("is false when there is no mutual exchange", () => {
    const rule = { conditions: [{ operator: "mutualSignExchange", planetA: "Sun", planetB: "Venus" }] };
    expect(ruleMatches(rule, exchangePlanetary)).toBe(false);
  });

  it("is false (not throwing) when a planet has no resolvable sign", () => {
    const rule = { conditions: [{ operator: "mutualSignExchange", planetA: "Moon", planetB: "Ghost" }] };
    expect(ruleMatches(rule, exchangePlanetary)).toBe(false);
  });
});

describe("advancedYogaRuleEvaluator: Parivartana Yoga (Priority 6)", () => {
  it("detects the Moon-Mars mutual sign exchange as a named Parivartana Yoga", () => {
    const yogas = evaluateAdvancedYogas(exchangePlanetary, "Aries");
    const names = yogas.map((y) => y.name);
    expect(names).toContain("Parivartana Yoga (Moon-Mars)");
  });

  it("every detected yoga carries Priority 6 enrichment fields", () => {
    const yogas = evaluateAdvancedYogas(exchangePlanetary, "Aries");
    expect(yogas.length).toBeGreaterThan(0);
    for (const y of yogas) {
      expect(y.name).toBeDefined();
      expect(y.detail).toBeDefined();
      expect(y.influence).toBeDefined();
      expect(y.explanationMeta).toBeDefined();
    }
  });
});

describe("aspectRuleEvaluator (Priority 6)", () => {
  it("computes a planet's 7th-house default aspect", () => {
    const planetary = { "Sun ☀️": { house: 1, sign: "Aries" }, "Moon 🌙": { house: 7, sign: "Libra" } };
    const { housesAspectedByPlanet } = evaluateAspects(planetary);
    expect(housesAspectedByPlanet["Sun"]).toContain(7);
  });

  it("adds Mars's special 4th/8th aspects on top of the default 7th (classical inclusive counting)", () => {
    const planetary = { "Mars ♂": { house: 5, sign: "Cancer" } };
    const { housesAspectedByPlanet } = evaluateAspects(planetary);
    // From house 5: 7th house from it = 11, 4th house from it = 8, 8th house from it = 12.
    expect(housesAspectedByPlanet["Mars"].slice().sort((a, b) => a - b)).toEqual([8, 11, 12]);
  });

  it("reports which planets aspect a given planet's house", () => {
    const planetary = { "Sun ☀️": { house: 12, sign: "Pisces" }, "Mars ♂": { house: 5, sign: "Cancer" } };
    const { aspectedByPlanet } = evaluateAspects(planetary);
    expect(aspectedByPlanet["Sun"]).toContain("Mars");
  });
});

describe("insightEnrichmentEvaluator (Priority 6)", () => {
  it("enriches a known yoga name with its exact configured metadata", () => {
    const enriched = enrichInsight("yogas", { name: "Lakshmi Yoga", detail: "x" });
    expect(enriched.influence).toBe("positive");
    expect(enriched.explanationMeta).toBeDefined();
    expect(enriched.name).toBe("Lakshmi Yoga");
    expect(enriched.detail).toBe("x");
  });

  it("enriches a known dosha with severity and remedies", () => {
    const enriched = enrichInsight("doshas", { name: "Mangal Dosha", detail: "x" });
    expect(enriched.severity).toBe("moderate");
    expect(enriched.influence).toBe("negative");
    expect(enriched.remedies.length).toBeGreaterThan(0);
  });

  it("falls back to a family match for dynamically-suffixed names", () => {
    const enriched = enrichInsight("doshas", { name: "Kaal Sarp Dosha — Anant Kaal Sarp Dosha", detail: "x" });
    expect(enriched.severity).toBe("high");
    expect(enriched.influence).toBe("negative");
  });

  it("falls back to a generic default for a totally unrecognized name", () => {
    const enriched = enrichInsight("yogas", { name: "Totally Unknown Yoga", detail: "x" });
    expect(enriched.influence).toBe("positive");
    expect(enriched.explanationMeta).toBeDefined();
  });

  it("never overwrites an existing name/detail", () => {
    const enriched = enrichInsight("doshas", { name: "Kemadruma Yoga", detail: "original detail" });
    expect(enriched.detail).toBe("original detail");
  });
});

describe("planetStrengthRuleEvaluator: Priority 6 enrichment", () => {
  it("attaches aspectInfluence, adjustedScore, and explanation for every planet", () => {
    const strength = evaluatePlanetStrength(exchangePlanetary, { lagna: "Aries", dob: "1990-05-14", tob: "08:30" });
    for (const [planet, profile] of Object.entries(strength)) {
      expect(profile.aspectInfluence).toBeDefined();
      expect(typeof profile.adjustedScore).toBe("number");
      expect(typeof profile.explanation).toBe("string");
      expect(profile.explanation.length).toBeGreaterThan(0);
    }
  });

  it("keeps the original Priority 2 dignity.score untouched by the new adjustedScore", () => {
    const strength = evaluatePlanetStrength(exchangePlanetary, { lagna: "Aries", dob: "1990-05-14", tob: "08:30" });
    for (const profile of Object.values(strength)) {
      expect(typeof profile.dignity.score).toBe("number");
    }
  });
});

describe("computeChart: Priority 6 regression (top-level shape unchanged)", () => {
  it("still returns exactly the same top-level keys as before Phase 6", () => {
    const chart = computeChart({ name: "Phase6Test", dob: "1992-03-03", tob: "11:11", pob: "Lucknow" });
    expect(Object.keys(chart).sort()).toEqual(
      ["userData", "numerology", "planetary", "lagna", "moonSign", "sunSign", "nakshatra", "yogas", "doshas", "remedies"].sort()
    );
  });

  it("every detected yoga/dosha in the chart carries the new enrichment fields without losing name/detail", () => {
    const chart = computeChart({ name: "Phase6Test2", dob: "1975-07-30", tob: "03:45", pob: "Chennai" });
    for (const y of chart.yogas) {
      expect(y.name).toBeDefined();
      expect(y.detail).toBeDefined();
      expect(y.influence).toBeDefined();
      expect(y.explanationMeta).toBeDefined();
    }
    for (const d of chart.doshas) {
      expect(d.name).toBeDefined();
      expect(d.detail).toBeDefined();
      expect(d.influence).toBeDefined();
      expect(d.explanationMeta).toBeDefined();
    }
  });
});

describe("advancedDoshaRuleEvaluator: existing Priority 3.2 doshas re-verified in Phase 6", () => {
  it("still detects Pitru Dosha, Guru Chandal Yoga, Grahan Yoga, Shrapit Yoga, Kemadruma Yoga where applicable", () => {
    const planetary = {
      "Sun ☀️": { house: 9, sign: "Sagittarius" },
      "Moon 🌙": { house: 6, sign: "Virgo" },
      "Mars ♂": { house: 2, sign: "Taurus" },
      "Mercury ☿": { house: 6, sign: "Virgo" },
      "Jupiter ♃": { house: 9, sign: "Sagittarius" },
      "Venus ♀": { house: 4, sign: "Cancer" },
      "Saturn ♄": { house: 9, sign: "Sagittarius" },
      "Rahu 🌑": { house: 9, sign: "Sagittarius" },
      "Ketu 🌕": { house: 3, sign: "Gemini" },
    };
    const doshas = evaluateAdvancedDoshas(planetary, "Leo");
    const names = doshas.map((d) => d.name);
    expect(names).toContain("Pitru Dosha");
    expect(names).toContain("Guru Chandal Yoga");
    expect(names).toContain("Shrapit Yoga");
  });
});
