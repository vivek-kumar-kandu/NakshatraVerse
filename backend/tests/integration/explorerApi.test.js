import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

// ─────────────────────────────────────────────────────────────────────────
// V5.0 Phase 5B — Explorer Infrastructure: Backend Integration
//
// Verifies the two public endpoints (/api/chart, /api/generate-report)
// now additionally expose `planetStrength` / `advancedYogas` /
// `advancedDoshas` — real, already-computed backend facts the Interactive
// Kundli Explorer needs — while every pre-Phase-5B field/behavior stays
// exactly as it was (mirrors tests/integration/api.test.js's own
// regression-first style).
// ─────────────────────────────────────────────────────────────────────────
process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_FALLBACK_MODEL = "";

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

describe("POST /api/chart — V5.0 Phase 5B (Explorer Infrastructure)", () => {
  it("exposes planetStrength/advancedYogas/advancedDoshas without ever calling Gemini", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await request(app).post("/api/chart").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();

    // Backward compatibility: every pre-Phase-5B field is still present.
    expect(res.body).toHaveProperty("lagna");
    expect(res.body).toHaveProperty("planetary");
    expect(res.body).toHaveProperty("nakshatraProfile");
    expect(res.body).toHaveProperty("predictions");

    // New, additive Phase 5B fields.
    expect(res.body).toHaveProperty("planetStrength");
    expect(res.body).toHaveProperty("advancedYogas");
    expect(res.body).toHaveProperty("advancedDoshas");
    expect(Array.isArray(res.body.advancedYogas)).toBe(true);
    expect(Array.isArray(res.body.advancedDoshas)).toBe(true);

    const sunProfile = res.body.planetStrength.Sun;
    expect(sunProfile).toHaveProperty("dignity");
    expect(sunProfile).toHaveProperty("retrograde");
    expect(sunProfile).toHaveProperty("combustion");
    expect(sunProfile).toHaveProperty("functionalNature");
    expect(sunProfile).toHaveProperty("aspectInfluence");
  });
});

describe("POST /api/generate-report — V5.0 Phase 5B (Explorer Infrastructure)", () => {
  it("returns 200 with the report + chart + Explorer fields for valid input", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => GEMINI_SUCCESS_BODY,
      text: async () => JSON.stringify(GEMINI_SUCCESS_BODY),
    }));

    const res = await request(app).post("/api/generate-report").send({ userData: VALID_BODY });

    expect(res.status).toBe(200);
    // Pre-Phase-5B fields unchanged.
    expect(res.body).toHaveProperty("loveLife");
    expect(res.body).toHaveProperty("chart");
    expect(res.body).toHaveProperty("predictions");
    expect(res.body).toHaveProperty("nakshatraProfile");

    // New, additive Phase 5B fields.
    expect(res.body).toHaveProperty("planetStrength");
    expect(res.body).toHaveProperty("advancedYogas");
    expect(res.body).toHaveProperty("advancedDoshas");
    expect(res.body.planetStrength).toHaveProperty("Moon");
    expect(res.body.planetStrength.Moon).toHaveProperty("shadbala");
  });
});
