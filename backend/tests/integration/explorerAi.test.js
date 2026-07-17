import { describe, it, expect, vi } from "vitest";
import request from "supertest";

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_FALLBACK_MODEL = "";

const { createApp } = await import("../../server.js");
const app = createApp();

const SAMPLE_EXPLANATION = {
  shortAnswer: "The Sun is your soul planet, placed in your 1st house.",
  detailedExplanation: "With the Sun in House 1, you naturally carry strong leadership qualities and vitality.",
  evidence: ["Sun: House 1, Aries"],
  confidence: { label: "Medium", score: 60 },
  suggestedNextQuestion: "How does the Sun's placement affect my career?",
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

// A small, hand-rolled but fully valid chart fixture — same shape/fields
// validateExplorerAiRequest requires (mirrors the CHART fixture already
// used by explorerAiService.test.js). The real /api/chart response is
// ~110KB (it embeds the full Explorer planetStrength/predictions payload,
// V5.0 Phase 5B), which is fine for a browser client but would blow past
// this test suite's default 100kb JSON body-size cap once wrapped in a
// second `report` copy — a minimal fixture keeps these tests fast and
// well under that cap while still exercising every validated field.
function sampleChart() {
  return {
    userData: { name: "Explorer AI Test", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" },
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

describe("POST /api/explorer-ai/explain", () => {
  it("returns 400 when chart is missing", async () => {
    const res = await request(app).post("/api/explorer-ai/explain").send({ itemType: "planet", itemLabel: "Sun" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when itemType is missing or invalid", async () => {
    const chart = sampleChart();
    const res = await request(app)
      .post("/api/explorer-ai/explain")
      .send({ chart, itemType: "comet", itemLabel: "Halley" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when itemLabel is missing", async () => {
    const chart = sampleChart();
    const res = await request(app).post("/api/explorer-ai/explain").send({ chart, itemType: "planet" });
    expect(res.status).toBe(400);
  });

  it("returns a full structured explanation for a valid planet selection", async () => {
    mockGeminiFetch();
    const chart = sampleChart();

    const res = await request(app)
      .post("/api/explorer-ai/explain")
      .send({
        chart,
        report: { chart, planetStrength: {} },
        itemType: "planet",
        itemId: "Sun ☀️",
        itemLabel: "Sun ☀️",
        contextFacts: { position: { house: 1, sign: "Aries" } },
      });

    expect(res.status).toBe(200);
    expect(res.body.itemType).toBe("planet");
    expect(res.body.itemLabel).toBe("Sun ☀️");
    expect(res.body.summary).toBeTruthy();
    expect(res.body.shortAnswer).toBe(res.body.summary);
    expect(res.body.detailedExplanation).toBeTruthy();
    expect(res.body.evidence).toEqual(["Sun: House 1, Aries"]);
    expect(res.body.confidence).toEqual({ label: "Medium", score: 60 });
    expect(res.body.suggestedNextQuestion).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("works for every one of the eight Explorer item types", async () => {
    mockGeminiFetch();
    const chart = sampleChart();
    const types = ["planet", "house", "sign", "yoga", "dosha", "nakshatra", "ascendant", "aspect"];

    for (const itemType of types) {
      const res = await request(app)
        .post("/api/explorer-ai/explain")
        .send({ chart, report: { chart }, itemType, itemLabel: "Sample Label" });
      expect(res.status).toBe(200);
      expect(res.body.itemType).toBe(itemType);
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
    const payload = { chart, report: { chart }, itemType: "sign", itemLabel: "Aries" };

    const first = await request(app).post("/api/explorer-ai/explain").send(payload);
    const second = await request(app).post("/api/explorer-ai/explain").send(payload);

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
      .post("/api/explorer-ai/explain")
      .send({ chart, report: { chart }, itemType: "dosha", itemLabel: "Mangal Dosha (unique-for-no-cache-hit)" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.error).toBeTruthy();

    vi.unstubAllGlobals();
  });
});
