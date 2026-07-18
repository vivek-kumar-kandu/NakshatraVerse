import { describe, it, expect, vi } from "vitest";
import request from "supertest";

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_FALLBACK_MODEL = "";

const { createApp } = await import("../../server.js");
const app = createApp();

const GEMINI_SUCCESS_BODY = {
  candidates: [
    {
      finishReason: "STOP",
      content: {
        parts: [
          {
            text: JSON.stringify({
              panchangMeaning: "a", spiritualSignificance: "b", practicalGuidance: "c",
            }),
          },
        ],
      },
    },
  ],
};

describe("GET /api/panchang/daily", () => {
  it("returns 400 for a missing/invalid date", async () => {
    const res = await request(app).get("/api/panchang/daily");
    expect(res.status).toBe(400);
  });

  it("returns a full Panchang object for a valid date", async () => {
    const res = await request(app).get("/api/panchang/daily").query({ date: "2026-07-11" });
    expect(res.status).toBe(200);
    expect(res.body.panchang.date).toBe("2026-07-11");
    expect(res.body.panchang.weekday).toBe("Saturday");
    expect(res.body.panchang.tithi.name).toBeTruthy();
    expect(res.body.panchang.nakshatra.name).toBeTruthy();
    expect(res.body.panchang.rahuKaal.start).toBeTruthy();
    expect(res.body.panchang.abhijitMuhurat.start).toBeTruthy();
  });

  it("accepts optional lat/lon and rejects out-of-range values", async () => {
    const ok = await request(app).get("/api/panchang/daily").query({ date: "2026-07-11", lat: "19.07", lon: "72.87" });
    expect(ok.status).toBe(200);
    const bad = await request(app).get("/api/panchang/daily").query({ date: "2026-07-11", lat: "999" });
    expect(bad.status).toBe(400);
  });
});

describe("GET /api/panchang/month", () => {
  it("returns 400 for an invalid month", async () => {
    const res = await request(app).get("/api/panchang/month").query({ year: "2026", month: "13" });
    expect(res.status).toBe(400);
  });

  it("returns one day-quality entry per day of the month for Calendar indicators", async () => {
    const res = await request(app).get("/api/panchang/month").query({ year: "2026", month: "2" });
    expect(res.status).toBe(200);
    expect(res.body.days.length).toBe(28); // Feb 2026 is not a leap year
    for (const d of res.body.days) {
      expect(["good", "neutral", "avoid"]).toContain(d.quality);
    }
  });
});

describe("GET /api/panchang/muhurat/activities", () => {
  it("returns the 8 supported activity keys", async () => {
    const res = await request(app).get("/api/panchang/muhurat/activities");
    expect(res.status).toBe(200);
    expect(res.body.activities.length).toBe(8);
  });
});

describe("POST /api/panchang/muhurat", () => {
  it("returns 400 for an unknown activity", async () => {
    const res = await request(app).post("/api/panchang/muhurat").send({ activity: "skydiving", startDate: "2026-08-01" });
    expect(res.status).toBe(400);
  });

  it("returns a full Muhurat recommendation for a valid request", async () => {
    const res = await request(app).post("/api/panchang/muhurat").send({ activity: "marriage", startDate: "2026-08-01", rangeDays: 30 });
    expect(res.status).toBe(200);
    expect(res.body.muhurat.bestDate).toBeTruthy();
    expect(res.body.muhurat.confidenceLevel).toBeTruthy();
    expect(res.body.muhurat.cautionPeriod.rahuKaal.start).toBeTruthy();
  });
});

describe("POST /api/panchang/explain", () => {
  it("returns 400 without calling Gemini when the body is invalid", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).post("/api/panchang/explain").send({ kind: "bogus" });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains an already-computed daily Panchang without recalculating it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => GEMINI_SUCCESS_BODY,
      text: async () => JSON.stringify(GEMINI_SUCCESS_BODY),
    }));
    const daily = await request(app).get("/api/panchang/daily").query({ date: "2026-07-11" });
    const res = await request(app).post("/api/panchang/explain").send({ kind: "daily", data: daily.body.panchang });
    expect(res.status).toBe(200);
    expect(res.body.explanation).toHaveProperty("panchangMeaning");
  });
});

describe("Existing endpoints remain unaffected (regression)", () => {
  it("GET /api/health still works with panchang routes mounted", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
