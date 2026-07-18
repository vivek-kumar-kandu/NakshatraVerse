import { describe, it, expect } from "vitest";
import { sanitizeNotification, validateNotification, CATEGORIES, PRIORITIES } from "../../validators/notification.validator.js";

describe("sanitizeNotification", () => {
  it("trims strings and defaults category/priority", () => {
    const result = sanitizeNotification({ title: "  Hello  ", message: "  World  " });
    expect(result.title).toBe("Hello");
    expect(result.message).toBe("World");
    expect(result.category).toBe("general");
    expect(result.priority).toBe("medium");
    expect(result.metadata).toEqual({});
  });

  it("lowercases category/priority", () => {
    const result = sanitizeNotification({ title: "T", message: "M", category: "PANCHANG", priority: "HIGH" });
    expect(result.category).toBe("panchang");
    expect(result.priority).toBe("high");
  });

  it("never throws on garbage input", () => {
    expect(() => sanitizeNotification(null)).not.toThrow();
    expect(() => sanitizeNotification({ metadata: "not-an-object" })).not.toThrow();
    expect(() => sanitizeNotification({ metadata: [1, 2, 3] })).not.toThrow();
  });
});

describe("validateNotification", () => {
  it("requires title and message", () => {
    const errors = validateNotification({ category: "general", priority: "low" });
    expect(errors).toContain("title is required");
    expect(errors).toContain("message is required");
  });

  it("rejects a category outside the closed set", () => {
    const errors = validateNotification({ title: "T", message: "M", category: "bogus", priority: "low" });
    expect(errors.some((e) => e.includes("category"))).toBe(true);
  });

  it("rejects a priority outside the closed set", () => {
    const errors = validateNotification({ title: "T", message: "M", category: "general", priority: "urgent!!" });
    expect(errors.some((e) => e.includes("priority"))).toBe(true);
  });

  it("accepts every valid category/priority combination", () => {
    for (const category of CATEGORIES) {
      for (const priority of PRIORITIES) {
        const errors = validateNotification({ title: "T", message: "M", category, priority });
        expect(errors).toEqual([]);
      }
    }
  });

  it("rejects an unparseable expiresAt", () => {
    const errors = validateNotification({ title: "T", message: "M", category: "general", priority: "low", expiresAt: "not-a-date" });
    expect(errors.some((e) => e.includes("expiresAt"))).toBe(true);
  });
});
