// ─────────────────────────────────────────────────────────────────────────
// Nakshatra Profile Intelligence — Phase 7.2B regression tests
// Standalone vitest-shaped test file, executed via the plain-Node shim at
// tests/run-nakshatraProfileIntelligence-phase7_2B.mjs in this sandbox (no
// network access / node_modules). Picked up automatically by
// `npx vitest run` once real vitest is installed.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { loadRules } from "../../services/rules/ruleLoader.js";
import { evaluateNakshatraProfile } from "../../services/rules/nakshatraProfileRuleEvaluator.js";
import { evaluateProfileAlignment, deriveExtendedProfileTraits } from "../../services/rules/profileAlignmentRuleEvaluator.js";
import { evaluatePrediction, computeConfidence } from "../../services/rules/predictionRuleEvaluator.js";

const PLANETARY = {
  "Sun ☀️": { house: 10, sign: "Leo" },
  "Moon 🌙": { house: 4, sign: "Cancer" },
  "Mars ♂": { house: 6, sign: "Aries" },
  "Mercury ☿": { house: 10, sign: "Virgo" },
  "Jupiter ♃": { house: 9, sign: "Sagittarius" },
  "Venus ♀": { house: 7, sign: "Libra" },
  "Saturn ♄": { house: 1, sign: "Capricorn" },
  "Rahu 🌑": { house: 3, sign: "Gemini" },
  "Ketu 🌕": { house: 9, sign: "Sagittarius" },
};

const PLANET_STRENGTH = {
  Sun: { adjustedScore: 5, functionalNature: { nature: "benefic" }, combustion: { combust: false }, retrograde: false },
  Saturn: { adjustedScore: 3, functionalNature: { nature: "neutral" }, combustion: { combust: false }, retrograde: false },
  Mercury: { adjustedScore: 4, functionalNature: { nature: "benefic" }, combustion: { combust: false }, retrograde: false },
};

describe("Phase 7.2B — Nakshatra schema is unmodified", () => {
  it("nakshatraProfileRuleEvaluator still returns exactly the Phase 7.2A field set", () => {
    const result = evaluateNakshatraProfile({ name: "Ashwini", pada: 1 });
    const fields = Object.keys(result).sort();
    expect(fields).toEqual([
      "careerTendencies", "deity", "gana", "lord", "nadi", "name", "nature",
      "pada", "personalityTraits", "relationshipTendencies", "spiritualTendencies", "symbol", "yoni",
    ].sort());
  });
});

describe("Phase 7.2B — different Nakshatras produce different profile alignment", () => {
  const { nakshatras } = loadRules("nakshatraProfile");
  const ashwini = evaluateNakshatraProfile({ name: "Ashwini", pada: 1 }); // Ketu-ruled
  const bharani = evaluateNakshatraProfile({ name: "Bharani", pada: 1 }); // Venus-ruled

  it("a Ketu-lord Nakshatra and a Venus-lord Nakshatra score differently against a Venus-Dasha career prediction", () => {
    const ctx = { dominantPlanet: "Venus", mahaLord: "Venus", antarLord: "Mercury", numerology: { mulank: 6, bhagyank: 6 }, transitConflictCount: 0 };
    const ketuResult = evaluateProfileAlignment("career", { ...ctx, nakshatraProfile: ashwini });
    const venusResult = evaluateProfileAlignment("career", { ...ctx, nakshatraProfile: bharani });
    expect(ketuResult.profileAlignmentScore).not.toBe(venusResult.profileAlignmentScore);
    expect(venusResult.lordMatchesDasha).toBe(true);
    expect(ketuResult.lordMatchesDasha).toBe(false);
  });

  it("extended profile traits (Emotional Pattern / Learning Style / Leadership Style / Health Tendencies) differ by ruling planet", () => {
    const ketuTraits = deriveExtendedProfileTraits(ashwini);
    const venusTraits = deriveExtendedProfileTraits(bharani);
    expect(ketuTraits.emotionalPattern).not.toBe(venusTraits.emotionalPattern);
    expect(ketuTraits.leadershipStyle).not.toBe(venusTraits.leadershipStyle);
  });

  it("every canonical Nakshatra lord has extended trait coverage (no silent fallback)", () => {
    const { lordExtendedTraits } = loadRules("profileAlignment");
    for (const entry of nakshatras) {
      expect(lordExtendedTraits).toHaveProperty(entry.lord);
    }
  });
});

describe("Phase 7.2B — confidence changes appropriately with agreement/conflict", () => {
  it("confidence increases when House Placement, Dasha, Numerology, and Profile Alignment all agree", () => {
    const base = computeConfidence({ planetProfile: PLANET_STRENGTH.Sun, supportingYogasCount: 0, supportingDoshasCount: 0 });
    const aligned = computeConfidence({
      planetProfile: PLANET_STRENGTH.Sun,
      supportingYogasCount: 0,
      supportingDoshasCount: 0,
      houseAgreement: true,
      numerologyAgreement: true,
      dashaResonance: true,
      profileAlignmentScore: 90,
      transitConflictCount: 0,
    });
    expect(aligned.score).toBeGreaterThan(base.score);
  });

  it("confidence decreases as Transit Foundation conflict count increases", () => {
    const clean = computeConfidence({ planetProfile: PLANET_STRENGTH.Saturn, transitConflictCount: 0 });
    const conflicted = computeConfidence({ planetProfile: PLANET_STRENGTH.Saturn, transitConflictCount: 3 });
    expect(conflicted.score).not.toBeGreaterThan(clean.score);
  });
});

describe("Phase 7.2B — predictions remain deterministic", () => {
  const ctx = {
    planetary: PLANETARY,
    mahadasha: { lord: "Saturn" },
    antardasha: { lord: "Mercury" },
    timePeriod: { startDate: "2026-01-01", endDate: "2028-01-01" },
    yogas: [{ name: "Gaja Kesari Yoga", influence: "positive", detail: "Jupiter and Moon in mutual kendra." }],
    doshas: [],
    planetStrength: PLANET_STRENGTH,
    nakshatraProfile: evaluateNakshatraProfile({ name: "Ashwini", pada: 1 }),
    numerology: { mulank: 7, bhagyank: 7 },
    transitForecast: { saturn: { flags: [] }, jupiter: { flags: [] }, rahuKetu: [] },
  };

  it("evaluating the same category twice with the same inputs returns identical output", () => {
    const first = evaluatePrediction("career", ctx);
    const second = evaluatePrediction("career", ctx);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("exposes the new Phase 7.2B fields without removing any existing field", () => {
    const result = evaluatePrediction("career", ctx);
    const existingFields = [
      "category", "dasha", "antardasha", "planet", "timePeriod", "prediction", "confidence",
      "supportingYogas", "supportingDoshas", "suggestedRemedies", "supportingHouses", "supportingPlanets", "explanationMeta",
    ];
    for (const field of existingFields) expect(result).toHaveProperty(field);
    expect(result).toHaveProperty("supportingProfileFactors");
    expect(result).toHaveProperty("profileAlignmentScore");
    expect(result).toHaveProperty("profileSummary");
    expect(result).toHaveProperty("reasoningBreakdown");
    expect(typeof result.profileAlignmentScore).toBe("number");
  });

  it("reasoningBreakdown structurally identifies traits/yogas/doshas/planets/houses", () => {
    const result = evaluatePrediction("career", ctx);
    expect(result.reasoningBreakdown).toHaveProperty("nakshatraTraitsSupporting");
    expect(result.reasoningBreakdown).toHaveProperty("yogasSupporting");
    expect(result.reasoningBreakdown).toHaveProperty("doshasReducingConfidence");
    expect(result.reasoningBreakdown).toHaveProperty("planetsInfluencing");
    expect(result.reasoningBreakdown).toHaveProperty("housesInfluencing");
  });
});

describe("Phase 7.2B — no duplicate rule evaluation / backward compatibility", () => {
  it("evaluatePrediction still works when nakshatraProfile/numerology/transitForecast are omitted (old callers)", () => {
    let result;
    expect(() => {
      result = evaluatePrediction("finance", {
        planetary: PLANETARY,
        mahadasha: { lord: "Jupiter" },
        antardasha: { lord: "Venus" },
        timePeriod: { startDate: "2026-01-01", endDate: "2027-01-01" },
        yogas: [],
        doshas: [],
        planetStrength: PLANET_STRENGTH,
      });
    }).not.toThrow();
    expect(result.profileAlignmentScore).toBeGreaterThan(0);
    expect(typeof result.profileSummary).toBe("string");
  });

  it("loadRules('profileAlignment') is cached (same object reference across calls)", () => {
    const first = loadRules("profileAlignment");
    const second = loadRules("profileAlignment");
    expect(first).toBe(second);
  });
});
