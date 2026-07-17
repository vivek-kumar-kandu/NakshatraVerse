import { describe, it, expect } from "vitest";
import { sanitizeAuthFields, validateRegisterFields, validateLoginFields } from "../../validators/auth.validator.js";

describe("validateRegisterFields", () => {
  it("passes for valid registration data", () => {
    expect(validateRegisterFields({ name: "Asha", email: "asha@example.com", password: "password123" })).toEqual([]);
  });

  it("flags a missing name", () => {
    expect(validateRegisterFields({ email: "asha@example.com", password: "password123" })).toContain("name is required");
  });

  it("flags an invalid email", () => {
    const errors = validateRegisterFields({ name: "Asha", email: "not-an-email", password: "password123" });
    expect(errors).toContain("a valid email is required");
  });

  it("flags a too-short password", () => {
    const errors = validateRegisterFields({ name: "Asha", email: "asha@example.com", password: "abc123" });
    expect(errors).toContain("password must be at least 8 characters");
  });

  it("flags a password with no digit", () => {
    const errors = validateRegisterFields({ name: "Asha", email: "asha@example.com", password: "abcdefgh" });
    expect(errors).toContain("password must contain at least one number");
  });
});

describe("validateLoginFields", () => {
  it("passes for valid login data", () => {
    expect(validateLoginFields({ email: "asha@example.com", password: "anything" })).toEqual([]);
  });

  it("flags a missing password", () => {
    expect(validateLoginFields({ email: "asha@example.com" })).toContain("password is required");
  });

  it("flags an invalid email", () => {
    expect(validateLoginFields({ email: "nope", password: "x" })).toContain("a valid email is required");
  });
});

describe("sanitizeAuthFields", () => {
  it("trims name/email but preserves password content", () => {
    const result = sanitizeAuthFields({ name: "  Asha  ", email: " asha@example.com ", password: "  spacey pw 1" });
    expect(result.name).toBe("Asha");
    expect(result.email).toBe("asha@example.com");
    expect(result.password).toBe("  spacey pw 1");
  });

  it("strips control characters from name/email", () => {
    const result = sanitizeAuthFields({ name: "Asha\x00", email: "asha@example.com", password: "password1" });
    expect(result.name).toBe("Asha");
  });

  it("never throws on undefined input", () => {
    expect(() => sanitizeAuthFields(undefined)).not.toThrow();
  });
});
