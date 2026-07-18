import { describe, it, expect } from "vitest";
import { ruleMatches, interpolate } from "../../services/rules/ruleEngine.js";

// Minimal synthetic planetary fixture — enough to exercise the operators
// without depending on any real chart calculation.
const planetary = {
  "Sun ☀️": { house: 1, sign: "Aries" },
  "Moon 🌙": { house: 4, sign: "Cancer" },
  "Mars ♂": { house: 4, sign: "Cancer" },
  "Mercury ☿": { house: 7, sign: "Libra" },
  "Jupiter ♃": { house: 9, sign: "Sagittarius" },
  "Venus ♀": { house: 2, sign: "Taurus" },
  "Saturn ♄": { house: 10, sign: "Capricorn" },
  "Rahu 🌑": { house: 3, sign: "Gemini" },
  "Ketu 🌕": { house: 9, sign: "Sagittarius" },
};

describe("ruleEngine operators", () => {
  it("sameHouse: true when both planets share a house", () => {
    const rule = { conditions: [{ operator: "sameHouse", planetA: "Moon", planetB: "Mars" }] };
    expect(ruleMatches(rule, planetary)).toBe(true);
  });

  it("sameHouse: false when planets are in different houses", () => {
    const rule = { conditions: [{ operator: "sameHouse", planetA: "Sun", planetB: "Moon" }] };
    expect(ruleMatches(rule, planetary)).toBe(false);
  });

  it("houseIn: matches an explicit houses list", () => {
    const rule = { conditions: [{ operator: "houseIn", planet: "Sun", houses: [1, 5, 9] }] };
    expect(ruleMatches(rule, planetary)).toBe(true);
  });

  it("signIn: matches when planet occupies a listed sign", () => {
    const rule = { conditions: [{ operator: "signIn", planet: "Venus", signs: ["Taurus", "Libra"] }] };
    expect(ruleMatches(rule, planetary)).toBe(true);
  });

  it("inOwnSign: true when the planet rules its current sign", () => {
    const rule = { conditions: [{ operator: "inOwnSign", planet: "Venus" }] }; // Venus rules Taurus
    expect(ruleMatches(rule, planetary)).toBe(true);
  });

  it("a rule with multiple AND-combined conditions requires all to pass", () => {
    const rule = {
      conditions: [
        { operator: "sameHouse", planetA: "Moon", planetB: "Mars" },
        { operator: "houseIn", planet: "Moon", houses: [4] },
      ],
    };
    expect(ruleMatches(rule, planetary)).toBe(true);

    const failing = {
      conditions: [
        { operator: "sameHouse", planetA: "Moon", planetB: "Mars" },
        { operator: "houseIn", planet: "Moon", houses: [1] }, // fails
      ],
    };
    expect(ruleMatches(failing, planetary)).toBe(false);
  });

  it("anyOf: matches if any nested sub-condition matches", () => {
    const rule = {
      conditions: [
        {
          operator: "anyOf",
          conditions: [
            { operator: "houseIn", planet: "Sun", houses: [12] }, // false
            { operator: "houseIn", planet: "Sun", houses: [1] }, // true
          ],
        },
      ],
    };
    expect(ruleMatches(rule, planetary)).toBe(true);
  });

  it("throws a clear error for an unknown operator (fail-fast on bad rule data)", () => {
    const rule = { conditions: [{ operator: "doesNotExist" }] };
    expect(() => ruleMatches(rule, planetary)).toThrow(/unknown condition operator/);
  });
});

describe("interpolate", () => {
  it("replaces {Planet_house}/{Planet_sign} tokens from the planetary fact map", () => {
    const result = interpolate("{Moon_house}, {Moon_sign}", planetary);
    expect(result).toBe("4, Cancer");
  });

  it("leaves unresolved tokens untouched instead of throwing", () => {
    expect(interpolate("{NotARealToken}", planetary)).toBe("{NotARealToken}");
  });

  it("merges in extra values for template interpolation", () => {
    expect(interpolate("Lord: {lagnaLord}", planetary, { lagnaLord: "Mars" })).toBe("Lord: Mars");
  });
});
