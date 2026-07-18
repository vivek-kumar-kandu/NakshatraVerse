import { describe, it, expect } from "vitest";
import request from "supertest";

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";

const { createApp } = await import("../../server.js");
const app = createApp();

describe("GET /api/festivals", () => {
  it("returns the static list of all 19 supported festivals with no dates", async () => {
    const res = await request(app).get("/api/festivals");
    expect(res.status).toBe(200);
    expect(res.body.festivals.length).toBe(19);
    expect(res.body.festivals.every((f) => f.date === undefined)).toBe(true);
    expect(res.body.festivals.some((f) => f.key === "diwali")).toBe(true);
  });
});

describe("GET /api/festivals/year", () => {
  it("defaults to the current year when no year is given", async () => {
    const res = await request(app).get("/api/festivals/year");
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(new Date().getUTCFullYear());
    expect(res.body.festivals.length).toBeGreaterThan(30);
  });

  it("returns 400 for an out-of-range year", async () => {
    const res = await request(app).get("/api/festivals/year").query({ year: 1800 });
    expect(res.status).toBe(400);
  });

  it("returns every occurrence for a valid year, sorted by date", async () => {
    const res = await request(app).get("/api/festivals/year").query({ year: 2026 });
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2026);
    const dates = res.body.festivals.map((f) => f.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });
});

describe("GET /api/festivals/month", () => {
  it("returns 400 for a missing month", async () => {
    const res = await request(app).get("/api/festivals/month").query({ year: 2026 });
    expect(res.status).toBe(400);
  });

  it("returns only festivals overlapping the requested month", async () => {
    const res = await request(app).get("/api/festivals/month").query({ year: 2026, month: 1 });
    expect(res.status).toBe(200);
    expect(res.body.festivals.some((f) => f.key === "sankranti")).toBe(true);
    expect(res.body.festivals.some((f) => f.key === "diwali")).toBe(false);
  });
});

describe("GET /api/festivals/upcoming", () => {
  it("returns 400 for a missing date", async () => {
    const res = await request(app).get("/api/festivals/upcoming");
    expect(res.status).toBe(400);
  });

  it("returns festivals within the requested window, sorted by date", async () => {
    const res = await request(app).get("/api/festivals/upcoming").query({ date: "2026-01-01", days: 60 });
    expect(res.status).toBe(200);
    expect(res.body.festivals.length).toBeGreaterThan(0);
    for (const f of res.body.festivals) {
      expect(f.date >= "2026-01-01").toBe(true);
    }
  });
});

describe("GET /api/festivals/on/:date", () => {
  it("returns 400 for an invalid date", async () => {
    const res = await request(app).get("/api/festivals/on/not-a-date");
    expect(res.status).toBe(400);
  });

  it("returns the fixed Makar Sankranti festival on Jan 14", async () => {
    const res = await request(app).get("/api/festivals/on/2026-01-14");
    expect(res.status).toBe(200);
    expect(res.body.festivals.some((f) => f.key === "sankranti")).toBe(true);
  });
});

describe("GET /api/festivals/:key", () => {
  it("returns 404 for an unknown festival key", async () => {
    const res = await request(app).get("/api/festivals/not-a-real-festival");
    expect(res.status).toBe(404);
  });

  it("returns the definition and occurrences for a known festival", async () => {
    const res = await request(app).get("/api/festivals/holi").query({ year: 2026 });
    expect(res.status).toBe(200);
    expect(res.body.definition.name).toBe("Holi");
    expect(res.body.occurrences.length).toBe(1);
    expect(res.body.occurrences[0].date).toMatch(/^2026-\d{2}-\d{2}$/);
  });
});

describe("POST /api/festivals/explain", () => {
  it("returns 400 when no festival object is provided", async () => {
    const res = await request(app).post("/api/festivals/explain").send({});
    expect(res.status).toBe(400);
  });
});
