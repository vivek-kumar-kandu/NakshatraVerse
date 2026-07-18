import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

// Same env-before-import pattern api.test.js already uses.
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
const SECTIONS = ["past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear"];

beforeEach(() => {
  clearChartCache();
  clearGeminiCache();
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

// ─────────────────────────────────────────────────────────────────────────
// V5.2 — AI Timeline
//
// Confirms `report.aiTimeline` (new, additive field) is exposed on both
// /api/chart (Gemini-disabled path) and /api/generate-report, alongside
// every pre-V5.2 field — regression coverage for backward compatibility.
// ─────────────────────────────────────────────────────────────────────────
describe("POST /api/chart — V5.2 (AI Timeline)", () => {
  it("exposes aiTimeline with all seven sections without ever calling Gemini (Gemini-disabled path)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await request(app).post("/api/chart").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();

    // Backward compatibility: every pre-V5.2 field is still present.
    expect(res.body).toHaveProperty("lagna");
    expect(res.body).toHaveProperty("planetary");
    expect(res.body).toHaveProperty("nakshatraProfile");
    expect(res.body).toHaveProperty("predictions");
    expect(res.body).toHaveProperty("predictionTimeline");
    expect(res.body).toHaveProperty("planetStrength");
    expect(res.body).toHaveProperty("advancedYogas");
    expect(res.body).toHaveProperty("advancedDoshas");

    // New, additive V5.2 field.
    expect(res.body).toHaveProperty("aiTimeline");
    for (const section of SECTIONS) {
      expect(res.body.aiTimeline).toHaveProperty(section);
      expect(Array.isArray(res.body.aiTimeline[section])).toBe(true);
    }
  });

  it("every aiTimeline event carries the fields the frontend AI Timeline UI needs", async () => {
    const res = await request(app).post("/api/chart").send(VALID_BODY);
    expect(res.status).toBe(200);

    const allEvents = SECTIONS.flatMap((s) => res.body.aiTimeline[s]);
    expect(allEvents.length).toBeGreaterThan(0);
    for (const event of allEvents) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("section");
      expect(event).toHaveProperty("filterCategory");
      expect(event).toHaveProperty("timePeriod");
      expect(event).toHaveProperty("prediction");
      expect(event).toHaveProperty("confidence");
      expect(event).toHaveProperty("supportingPlanets");
      expect(event).toHaveProperty("supportingYogas");
      expect(event).toHaveProperty("supportingDoshas");
      expect(event).toHaveProperty("suggestedRemedies");
      expect(event).toHaveProperty("relatedTransit");
    }
  });
});

describe("POST /api/generate-report — V5.2 (AI Timeline)", () => {
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

  it("exposes aiTimeline alongside every existing field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => GEMINI_SUCCESS_BODY,
        text: async () => JSON.stringify(GEMINI_SUCCESS_BODY),
      })
    );

    const res = await request(app).post("/api/generate-report").send({ userData: VALID_BODY });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("chart");
    expect(res.body).toHaveProperty("predictionTimeline");
    expect(res.body).toHaveProperty("aiTimeline");
    for (const section of SECTIONS) {
      expect(res.body.aiTimeline).toHaveProperty(section);
    }
  });
});
