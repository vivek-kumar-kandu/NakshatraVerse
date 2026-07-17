import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_FALLBACK_MODEL = "";

const { createApp } = await import("../../server.js");
const app = createApp();
const { clearGeminiCache } = await import("../../services/ai/geminiService.js");

const SAMPLE_EXPLANATION = {
  shortAnswer: "This is a favorable period for career growth.",
  detailedExplanation: "Jupiter's Antardasha strengthens the significators of career and public standing.",
  evidence: ["Jupiter: dominant planet, Gaj Kesari Yoga active"],
  confidence: { label: "High", score: 82 },
  suggestedNextQuestion: "What remedies support this period?",
};

const GEMINI_SUCCESS_BODY = {
  candidates: [
    { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(SAMPLE_EXPLANATION) }] } },
  ],
};

function mockGeminiFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => GEMINI_SUCCESS_BODY,
      text: async () => JSON.stringify(GEMINI_SUCCESS_BODY),
    })
  );
}

// Same minimal-but-fully-valid chart fixture pattern explorerAi.test.js
// already uses, for the same body-size rationale documented there.
function sampleChart() {
  return {
    userData: { name: "AI Timeline Test", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" },
    planetary: { "Sun ☀️": { house: 1, sign: "Aries" } },
    numerology: { mulank: 6, bhagyank: 1 },
    lagna: "Aries",
    moonSign: "Taurus",
    sunSign: "Aries",
    nakshatra: { name: "Ashwini", pada: 1 },
    yogas: [],
    doshas: [],
    remedies: [],
  };
}

function sampleEvent(overrides = {}) {
  return {
    id: "nextMonth-0-career",
    section: "nextMonth",
    category: "Career",
    timePeriod: { startDate: "2026-08-01", endDate: "2026-08-31" },
    contextFacts: { dominantPlanet: "Jupiter", activeMahadasha: "Jupiter" },
    ...overrides,
  };
}

describe("POST /api/ai-timeline/explain", () => {
  beforeEach(() => {
    clearGeminiCache();
  });

  it("returns 400 when chart is missing", async () => {
    const res = await request(app).post("/api/ai-timeline/explain").send({ event: sampleEvent() });
    expect(res.status).toBe(400);
  });

  it("returns 400 when event is missing", async () => {
    const chart = sampleChart();
    const res = await request(app).post("/api/ai-timeline/explain").send({ chart });
    expect(res.status).toBe(400);
  });

  it("returns 400 when event.section is invalid", async () => {
    const chart = sampleChart();
    const res = await request(app)
      .post("/api/ai-timeline/explain")
      .send({ chart, event: sampleEvent({ section: "yesterday" }) });
    expect(res.status).toBe(400);
  });

  it("returns a full structured explanation for a valid event selection", async () => {
    mockGeminiFetch();
    const chart = sampleChart();

    const res = await request(app)
      .post("/api/ai-timeline/explain")
      .send({ chart, report: { chart }, event: sampleEvent() });

    expect(res.status).toBe(200);
    expect(res.body.eventId).toBe("nextMonth-0-career");
    expect(res.body.section).toBe("nextMonth");
    expect(res.body.category).toBe("Career");
    expect(res.body.summary).toBeTruthy();
    expect(res.body.shortAnswer).toBe(res.body.summary);
    expect(res.body.detailedExplanation).toBeTruthy();
    expect(res.body.evidence).toEqual(["Jupiter: dominant planet, Gaj Kesari Yoga active"]);
    expect(res.body.confidence).toEqual({ label: "High", score: 82 });
    expect(res.body.suggestedNextQuestion).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("works for every one of the seven AI Timeline sections", async () => {
    mockGeminiFetch();
    const chart = sampleChart();
    const sections = ["past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear"];

    for (const section of sections) {
      const res = await request(app)
        .post("/api/ai-timeline/explain")
        .send({ chart, report: { chart }, event: sampleEvent({ id: `${section}-0-career`, section }) });
      expect(res.status).toBe(200);
      expect(res.body.section).toBe(section);
    }

    vi.unstubAllGlobals();
  });

  it("serves a repeated identical selection from the existing Gemini cache (no second upstream call)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => GEMINI_SUCCESS_BODY,
      text: async () => JSON.stringify(GEMINI_SUCCESS_BODY),
    });
    vi.stubGlobal("fetch", fetchSpy);
    const chart = sampleChart();
    const payload = { chart, report: { chart }, event: sampleEvent({ id: "cache-test-event" }) };

    const first = await request(app).post("/api/ai-timeline/explain").send(payload);
    const second = await request(app).post("/api/ai-timeline/explain").send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("propagates a Gemini upstream failure as a non-200 error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
        text: async () => "Service overloaded",
      })
    );
    const chart = sampleChart();

    const res = await request(app)
      .post("/api/ai-timeline/explain")
      .send({ chart, report: { chart }, event: sampleEvent({ id: "unique-failure-event-for-no-cache-hit" }) });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.error).toBeTruthy();

    vi.unstubAllGlobals();
  });
});
