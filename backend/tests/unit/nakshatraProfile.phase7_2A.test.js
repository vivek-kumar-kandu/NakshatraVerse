// ─────────────────────────────────────────────────────────────────────────
// Nakshatra Profile — Phase 7.2A data-completion tests
// Standalone vitest-shaped test file. In this sandbox (no network access,
// no node_modules), this file is executed via the plain-Node shim script
// at tests/run-nakshatraProfile-phase7_2A.mjs, which mimics describe/it/
// expect just enough to run these assertions. When network access is
// available, `npx vitest run tests/unit/nakshatraProfile.phase7_2A.test.js`
// will pick this file up automatically via the existing vitest.config.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { loadRules } from "../../services/rules/ruleLoader.js";
import { evaluateNakshatraProfile } from "../../services/rules/nakshatraProfileRuleEvaluator.js";

const REQUIRED_FIELDS = [
  "name",
  "lord",
  "gana",
  "yoni",
  "nadi",
  "symbol",
  "deity",
  "nature",
  "personalityTraits",
  "careerTendencies",
  "relationshipTendencies",
  "spiritualTendencies",
];

const VALID_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const VALID_GANAS = ["Deva", "Manushya", "Rakshasa"];
const VALID_NADIS = ["Vata", "Pitta", "Kapha"];

describe("Phase 7.2A — Nakshatra Profile data completeness", () => {
  const { nakshatras } = loadRules("nakshatraProfile");

  it("contains exactly all 27 canonical Nakshatras, no duplicates", () => {
    expect(nakshatras.length).toBe(27);
    const names = nakshatras.map((n) => n.name);
    expect(new Set(names).size).toBe(27);
  });

  it("every Nakshatra has all required fields, non-empty", () => {
    for (const entry of nakshatras) {
      for (const field of REQUIRED_FIELDS) {
        expect(entry).toHaveProperty(field);
        const value = entry[field];
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("lord/gana/nadi values are drawn from the normalized canonical vocabulary", () => {
    for (const entry of nakshatras) {
      expect(VALID_LORDS).toContain(entry.lord);
      expect(VALID_GANAS).toContain(entry.gana);
      expect(VALID_NADIS).toContain(entry.nadi);
    }
  });

  it("no field contains placeholder or TODO-style text", () => {
    const bannedPatterns = [/placeholder/i, /\btodo\b/i, /lorem ipsum/i, /\bTBD\b/i, /\bXXX\b/];
    for (const entry of nakshatras) {
      for (const field of REQUIRED_FIELDS) {
        for (const pattern of bannedPatterns) {
          expect(pattern.test(entry[field])).toBe(false);
        }
      }
    }
  });

  it("no two Nakshatras share identical descriptive text (no copy-paste duplicates)", () => {
    const descriptiveFields = ["personalityTraits", "careerTendencies", "relationshipTendencies", "spiritualTendencies"];
    for (const field of descriptiveFields) {
      const values = nakshatras.map((n) => n[field]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("generator/source data is deterministic across repeated loads", () => {
    const first = loadRules("nakshatraProfile");
    const second = loadRules("nakshatraProfile");
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

describe("Phase 7.2A — nakshatraProfileRuleEvaluator hardening", () => {
  it("returns a complete profile for every known Nakshatra name", () => {
    const { nakshatras } = loadRules("nakshatraProfile");
    for (const entry of nakshatras) {
      const result = evaluateNakshatraProfile({ name: entry.name, pada: 2 });
      expect(result.name).toBe(entry.name);
      expect(result.pada).toBe(2);
      for (const field of REQUIRED_FIELDS) {
        if (field === "name") continue;
        expect(result[field]).toBe(entry[field]);
      }
    }
  });

  it("never throws and falls back gracefully for an unknown Nakshatra name", () => {
    let result;
    expect(() => {
      result = evaluateNakshatraProfile({ name: "NotARealNakshatra", pada: 1 });
    }).not.toThrow();
    expect(result.name).toBe("NotARealNakshatra");
    expect(result.pada).toBe(1);
    expect(result.lord).toBe(null);
    expect(typeof result.personalityTraits).toBe("string");
    expect(result.personalityTraits.length).toBeGreaterThan(0);
  });

  it("never throws and falls back gracefully for null/undefined input", () => {
    let r1, r2;
    expect(() => {
      r1 = evaluateNakshatraProfile(null);
    }).not.toThrow();
    expect(() => {
      r2 = evaluateNakshatraProfile(undefined);
    }).not.toThrow();
    expect(r1.name).toBe(null);
    expect(r1.pada).toBe(null);
    expect(r2.name).toBe(null);
    expect(r2.pada).toBe(null);
  });

  it("never throws for missing/malformed pada", () => {
    let result;
    expect(() => {
      result = evaluateNakshatraProfile({ name: "Ashwini" });
    }).not.toThrow();
    expect(result.name).toBe("Ashwini");
    expect(result.pada).toBe(undefined);
  });
});
