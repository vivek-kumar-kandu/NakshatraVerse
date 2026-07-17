import { describe, it, expect } from "vitest";
import { validateBirthFields, sanitizeBirthFields } from "../../validators/birthData.validator.js";

describe("validateBirthFields (regression — must match pre-Priority-4 behavior exactly)", () => {
  it("passes for valid, complete birth data", () => {
    expect(validateBirthFields({ name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" })).toEqual([]);
  });

  it("flags a missing name", () => {
    expect(validateBirthFields({ dob: "1990-05-14", tob: "08:30", pob: "Lucknow" })).toContain("name is required");
  });

  it("flags a malformed dob", () => {
    const errors = validateBirthFields({ name: "Asha", dob: "14-05-1990", tob: "08:30", pob: "Lucknow" });
    expect(errors).toContain("dob must be in YYYY-MM-DD format");
  });

  it("flags a malformed tob", () => {
    const errors = validateBirthFields({ name: "Asha", dob: "1990-05-14", tob: "8:30am", pob: "Lucknow" });
    expect(errors).toContain("tob must be in HH:MM format");
  });

  it("flags a missing pob", () => {
    const errors = validateBirthFields({ name: "Asha", dob: "1990-05-14", tob: "08:30" });
    expect(errors).toContain("pob is required");
  });

  it("returns all applicable errors at once, same as before", () => {
    expect(validateBirthFields({})).toEqual([
      "name is required",
      "dob must be in YYYY-MM-DD format",
      "tob must be in HH:MM format",
      "pob is required",
    ]);
  });

  it("handles undefined input without throwing", () => {
    expect(() => validateBirthFields(undefined)).not.toThrow();
  });
});

describe("sanitizeBirthFields (Priority 4 addition)", () => {
  it("trims surrounding whitespace", () => {
    const result = sanitizeBirthFields({ name: "  Asha  ", dob: " 1990-05-14 ", tob: " 08:30 ", pob: " Lucknow " });
    expect(result).toEqual({ name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" });
  });

  it("strips control characters without altering visible content", () => {
    const result = sanitizeBirthFields({ name: "Asha\x00\x07", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" });
    expect(result.name).toBe("Asha");
  });

  it("never rejects/throws on its own — validation stays the sole gatekeeper", () => {
    expect(() => sanitizeBirthFields({})).not.toThrow();
    expect(() => sanitizeBirthFields(undefined)).not.toThrow();
  });

  it("does not change already-clean input (idempotent, backward compatible)", () => {
    const clean = { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" };
    expect(sanitizeBirthFields(clean)).toEqual(clean);
  });

  it("caps pathologically long input instead of rejecting normal-length input", () => {
    const huge = "a".repeat(20000);
    const result = sanitizeBirthFields({ name: huge, dob: "1990-05-14", tob: "08:30", pob: "Lucknow" });
    expect(result.name.length).toBeLessThanOrEqual(10000);
  });
});
