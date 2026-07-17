import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

// Set env before importing the app (config.js reads process.env at import
// time) so these tests are deterministic regardless of the real
// backend/.env on disk, and never make a real network call to Gemini.
process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_FALLBACK_MODEL = ""; // keep the 503 regression test fast and single-model

const { createApp } = await import("../../server.js");
const { clearChartCache } = await import("../../services/astrology/birthChartEngine.js");
const { clearGeminiCache } = await import("../../services/ai/geminiService.js");

const app = createApp();

const VALID_BODY = { name: "Asha", dob: "1990-05-14", tob: "08:30", pob: "Lucknow" };

const GEMINI_SUCCESS_BODY = {
  candidates: [
    {
      finishReason: "STOP",
      content: {
        parts: [
          {
            text: JSON.stringify({
              loveLife: "a", career: "b", finance: "c", health: "d",
              marriage: "e", doshas: "f", yogas: "g", remedies: "h", lifeSummary: "i",
            }),
          },
        ],
      },
    },
  ],
};

beforeEach(() => {
  clearChartCache();
  clearGeminiCache();
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/health", () => {
  it("returns 200 with the expected shape (regression)", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      apiKeyConfigured: true,
    });
    expect(res.body).toHaveProperty("port");
    expect(res.body).toHaveProperty("model");
  });
});

describe("GET /api/metrics (Priority 4, new/additive)", () => {
  it("returns a metrics snapshot without touching any existing endpoint", async () => {
    const res = await request(app).get("/api/metrics");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("uptimeSeconds");
    expect(res.body).toHaveProperty("caches.chart");
    expect(res.body).toHaveProperty("caches.gemini");
  });
});

describe("POST /api/chart", () => {
  it("returns 200 with the authoritative chart for valid input", async () => {
    const res = await request(app).post("/api/chart").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("lagna");
    expect(res.body).toHaveProperty("planetary");
    expect(res.body).toHaveProperty("numerology");
    expect(res.body.userData).toMatchObject(VALID_BODY);
  });

  it("returns 400 with a descriptive error for invalid input (regression)", async () => {
    const res = await request(app).post("/api/chart").send({ name: "Asha" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid request/);
  });

  it("returns byte-identical chart for a second identical request (served from cache)", async () => {
    const res1 = await request(app).post("/api/chart").send(VALID_BODY);
    const res2 = await request(app).post("/api/chart").send(VALID_BODY);
    expect(res2.body).toEqual(res1.body);
  });

  it("rejects malformed JSON with a 400, not a 500 (regression)", async () => {
    const res = await request(app)
      .post("/api/chart")
      .set("Content-Type", "application/json")
      .send("{not valid json");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/chart — V2.0 Phase 7.1 (Prediction & Profile Integration)", () => {
  it("exposes nakshatraProfile/predictions/predictionTimeline/transitForecast without ever calling Gemini (Gemini-disabled path)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await request(app).post("/api/chart").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled(); // no Gemini call was made
    // Backward compatibility: every pre-Phase-7.1 field is still present.
    expect(res.body).toHaveProperty("lagna");
    expect(res.body).toHaveProperty("planetary");
    expect(res.body).toHaveProperty("numerology");
    expect(res.body.userData).toMatchObject(VALID_BODY);
    // New, additive Phase 7.1 fields.
    expect(res.body).toHaveProperty("nakshatraProfile");
    expect(res.body).toHaveProperty("predictions");
    expect(res.body).toHaveProperty("predictionTimeline");
    expect(res.body).toHaveProperty("transitForecast");
    expect(res.body.predictions.length).toBe(7);
    for (const p of res.body.predictions) {
      expect(p).toHaveProperty("activeMahadasha");
      expect(p).toHaveProperty("activeAntardasha");
      expect(p).toHaveProperty("dominantPlanet");
      expect(p).toHaveProperty("supportingHouses");
      expect(p).toHaveProperty("supportingPlanets");
      expect(p).toHaveProperty("reasoningMetadata");
      expect(p).toHaveProperty("GeminiExplanationContext");
    }
    expect(res.body.nakshatraProfile).toHaveProperty("nakshatra");
    expect(res.body.nakshatraProfile).toHaveProperty("lord");
    expect(res.body.nakshatraProfile).toHaveProperty("pada");
  });
});

describe("POST /api/generate-report", () => {
  it("returns 400 for invalid userData without calling Gemini", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).post("/api/generate-report").send({ userData: { name: "Asha" } });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 200 with the report + authoritative chart for valid input", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => GEMINI_SUCCESS_BODY,
      text: async () => JSON.stringify(GEMINI_SUCCESS_BODY),
    }));

    const res = await request(app).post("/api/generate-report").send({ userData: VALID_BODY });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("loveLife");
    expect(res.body).toHaveProperty("chart");
    expect(res.body.chart.userData).toMatchObject(VALID_BODY);
    // V2.0 Phase 7.1: additive fields alongside the unchanged Gemini
    // narrative + chart fields above (backward compatibility).
    expect(res.body).toHaveProperty("nakshatraProfile");
    expect(res.body).toHaveProperty("predictions");
    expect(res.body).toHaveProperty("predictionTimeline");
    expect(res.body).toHaveProperty("transitForecast");
    expect(res.body.predictions.length).toBe(7);
  });

  it("propagates a Gemini upstream failure as a 502 with a safe message (regression)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "overloaded",
    }));

    const res = await request(app).post("/api/generate-report").send({ userData: VALID_BODY });
    expect([502, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Security hardening (Priority 4)", () => {
  it("sets defensive response headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("attaches an X-Request-Id header for traceability", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("returns a JSON 404 for unknown routes (regression)", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
