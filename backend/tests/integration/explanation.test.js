import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_FALLBACK_MODEL = "";

const { createApp } = await import("../../server.js");
const { clearGeminiCache } = await import("../../services/ai/geminiService.js");
const { clearExplanationCache } = await import("../../services/utils/explanationCache.js");

const app = createApp();

const SAMPLE_EXPLANATION = {
  shortAnswer: "Saturn's current dasha is the main driver right now.",
  detailedExplanation: "A longer, grounded explanation referencing already-computed facts.",
  evidence: ["Current Mahadasha: Saturn"],
  confidence: { label: "High", score: 78 },
  suggestedNextQuestion: "What does this mean for my finances?",
};

const GEMINI_SUCCESS_BODY = {
  candidates: [
    { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(SAMPLE_EXPLANATION) }] } },
  ],
};

function mockGeminiFetchSuccess() {
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

function mockGeminiFetchFailure() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
      text: async () => "Service overloaded",
    })
  );
}

// Real Nakshatra ("Ashwini") so calcDasha() resolves `available: true` and
// predictionEngine.js produces real category predictions/timeline events —
// this suite exercises the actual Prediction/Rule Engine output, not a stub.
function sampleChart(overrides = {}) {
  return {
    userData: { name: "Explanation Engine Test", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" },
    planetary: {
      "Sun ☀️": { house: 1, sign: "Aries" },
      "Moon 🌙": { house: 2, sign: "Taurus" },
      "Mars ♂️": { house: 3, sign: "Gemini" },
      "Mercury ☿️": { house: 4, sign: "Cancer" },
      "Jupiter ♃": { house: 5, sign: "Leo" },
      "Venus ♀️": { house: 6, sign: "Virgo" },
      "Saturn ♄": { house: 7, sign: "Libra" },
      "Rahu ☊": { house: 8, sign: "Scorpio" },
      "Ketu ☋": { house: 2, sign: "Taurus" },
    },
    numerology: { mulank: 6, bhagyank: 1 },
    lagna: "Aries",
    moonSign: "Taurus",
    sunSign: "Aries",
    nakshatra: { name: "Ashwini", pada: 1 },
    yogas: [],
    doshas: [{ name: "Mangal Dosha", detail: "Mars placement causes tension." }],
    remedies: [{ type: "Gemstone", detail: "Wear a red coral on Tuesday." }],
    ...overrides,
  };
}

beforeEach(() => {
  clearGeminiCache();
  clearExplanationCache();
});

describe("POST /api/explanation/report-summary", () => {
  it("returns 400 when chart is missing", async () => {
    const res = await request(app).post("/api/explanation/report-summary").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns a normalized AI Report Summary for a valid chart", async () => {
    mockGeminiFetchSuccess();
    const chart = sampleChart();
    const res = await request(app).post("/api/explanation/report-summary").send({ chart, report: { chart } });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeTruthy();
    expect(res.body.shortAnswer).toBe(res.body.summary);
    expect(res.body.detailedExplanation).toBeTruthy();
    expect(res.body.confidence).toEqual({ label: "High", score: 78 });
    vi.unstubAllGlobals();
  });

  it("propagates a Gemini upstream failure as a non-200 error response", async () => {
    mockGeminiFetchFailure();
    const chart = sampleChart({ userData: { name: "Failure User", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" } });
    const res = await request(app).post("/api/explanation/report-summary").send({ chart, report: { chart } });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.error).toBeTruthy();
    vi.unstubAllGlobals();
  });
});

describe("POST /api/explanation/confidence", () => {
  it("returns 400 when category is missing", async () => {
    const chart = sampleChart();
    const res = await request(app).post("/api/explanation/confidence").send({ chart });
    expect(res.status).toBe(400);
  });

  it("returns deterministic evidence + a narrative for a real category", async () => {
    mockGeminiFetchSuccess();
    const chart = sampleChart({ userData: { name: "Confidence User", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" } });
    const res = await request(app).post("/api/explanation/confidence").send({ chart, category: "Career" });
    expect(res.status).toBe(200);
    expect(res.body.category).toBe("Career");
    expect(res.body.confidence).toHaveProperty("score");
    expect(Array.isArray(res.body.evidence)).toBe(true);
    expect(res.body.evidence.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });
});

describe("POST /api/explanation/prediction-evidence", () => {
  it("returns evidence bullets for a real category even if Gemini fails", async () => {
    mockGeminiFetchFailure();
    const chart = sampleChart({ userData: { name: "Evidence User", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" } });
    const res = await request(app).post("/api/explanation/prediction-evidence").send({ chart, category: "Finance" });
    expect(res.status).toBe(200);
    expect(res.body.category).toBe("Finance");
    expect(res.body.evidence.length).toBeGreaterThan(0);
    expect(res.body.narrative).toBeNull();
    vi.unstubAllGlobals();
  });
});

describe("POST /api/explanation/remedy", () => {
  it("returns 400 when remedyType is missing", async () => {
    const chart = sampleChart();
    const res = await request(app).post("/api/explanation/remedy").send({ chart });
    expect(res.status).toBe(400);
  });

  it("explains an existing backend-derived remedy", async () => {
    mockGeminiFetchSuccess();
    const chart = sampleChart({ userData: { name: "Remedy User", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" } });
    const res = await request(app).post("/api/explanation/remedy").send({ chart, remedyType: "Gemstone" });
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.detail).toBe("Wear a red coral on Tuesday.");
    vi.unstubAllGlobals();
  });

  it("reports found:false without calling Gemini for a nonexistent remedy", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const chart = sampleChart({ userData: { name: "No Remedy User", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" } });
    const res = await request(app).post("/api/explanation/remedy").send({ chart, remedyType: "Nonexistent" });
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("POST /api/explanation/cross-links", () => {
  it("returns 400 when neither itemLabel, planet, nor category is given", async () => {
    const chart = sampleChart();
    const res = await request(app).post("/api/explanation/cross-links").send({ chart, itemType: "planet" });
    expect(res.status).toBe(400);
  });

  it("returns related predictions/timeline events without calling Gemini", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const chart = sampleChart({ userData: { name: "Cross Link User", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" } });
    const res = await request(app).post("/api/explanation/cross-links").send({ chart, itemType: "category", category: "Career" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.relatedTimelineEvents)).toBe(true);
    expect(Array.isArray(res.body.relatedPredictions)).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
