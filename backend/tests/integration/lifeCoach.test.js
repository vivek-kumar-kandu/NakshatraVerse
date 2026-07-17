import { describe, it, expect, vi } from "vitest";
import request from "supertest";

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_FALLBACK_MODEL = "";

const { createApp } = await import("../../server.js");
const app = createApp();

const SAMPLE_GUIDANCE = {
  dailyEnergyScore: 72,
  todaysFocus: "Focus on clear communication today.",
  opportunities: ["A good day to reconnect with a mentor."],
  challenges: ["Avoid rushing financial decisions."],
  recommendedActions: ["Spend 10 minutes in quiet reflection this morning."],
  thingsToAvoid: ["Avoid starting new ventures during Rahu Kaal."],
  spiritualGuidance: "A brief morning prayer can set a steady tone for the day.",
  motivationMessage: "Small, steady steps compound into real progress.",
  career: {
    progress: "Steady progress continues in your current role.",
    skillDevelopmentAdvice: "Consider brushing up a core skill this week.",
    promotionGuidance: "This period traditionally favors patience over pushing.",
    businessSuggestions: "A good time to research rather than commit.",
    bestTimeForDecisions: "Favorable during the current Antardasha.",
  },
  relationship: {
    guidance: "Open conversations go further than assumptions today.",
    marriageAdvice: "No major decisions needed right now — let things settle.",
    familyHarmonyTips: "A small gesture of appreciation goes a long way.",
    communicationSuggestions: "Listen more than you speak in disagreements.",
    emotionalWellbeing: "Give yourself permission to rest.",
  },
  finance: {
    outlook: "Generally stable, with room for cautious planning.",
    spendingSuggestions: "Track discretionary spending this week.",
    savingAdvice: "Even a small, consistent saving habit helps.",
    investmentAwareness: "Research thoroughly before committing anywhere new.",
    businessOpportunities: "Worth exploring, not yet worth committing to.",
  },
  health: {
    energyTrends: "Energy is steady with a dip in the afternoon.",
    stressAwareness: "Watch for tension building around midday.",
    meditationSuggestions: "A short breathing practice can help reset focus.",
    yogaRecommendations: "Gentle stretching or restorative yoga suits today.",
    spiritualPractices: "A few minutes of quiet gratitude practice.",
    lifestyleSuggestions: "Prioritize a consistent sleep schedule this week.",
  },
  personalGrowth: {
    dailyGoals: ["Write down three priorities each morning."],
    weeklyGoals: ["Reconnect with one old friend or mentor."],
    monthlyFocus: "Building a steadier daily routine.",
    habitSuggestions: ["A five-minute journaling habit."],
    learningRecommendations: ["Read one article on a topic you're curious about."],
  },
};

const GEMINI_SUCCESS_BODY = {
  candidates: [
    { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(SAMPLE_GUIDANCE) }] } },
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

async function getSampleChart() {
  const res = await request(app)
    .post("/api/chart")
    .send({ name: "Life Coach Test", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" });
  expect(res.status).toBe(200);
  return res.body;
}

describe("POST /api/life-coach/guidance", () => {
  it("returns 400 when chart is missing", async () => {
    const res = await request(app).post("/api/life-coach/guidance").send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when chart is missing required fields", async () => {
    const res = await request(app).post("/api/life-coach/guidance").send({ chart: { userData: {} } });
    expect(res.status).toBe(400);
  });

  it("returns full daily guidance for a valid chart", async () => {
    mockGeminiFetch();
    const chart = await getSampleChart();

    const res = await request(app)
      .post("/api/life-coach/guidance")
      .send({ chart, report: {}, date: "2026-07-12" });

    expect(res.status).toBe(200);
    expect(res.body.date).toBe("2026-07-12");
    expect(res.body.guidance.dailyEnergyScore).toBe(72);
    expect(res.body.guidance.todaysFocus).toBeTruthy();
    expect(res.body.guidance.career.progress).toBeTruthy();
    expect(res.body.guidance.relationship.guidance).toBeTruthy();
    expect(res.body.guidance.finance.outlook).toBeTruthy();
    expect(res.body.guidance.health.energyTrends).toBeTruthy();
    expect(res.body.guidance.personalGrowth.dailyGoals.length).toBeGreaterThan(0);
    // Backend-authoritative facts the guidance was grounded in, echoed back.
    expect(res.body.panchang.date).toBe("2026-07-12");
    expect(res.body.panchang.tithi.name).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("defaults to today's date when none is supplied", async () => {
    mockGeminiFetch();
    const chart = await getSampleChart();

    const res = await request(app).post("/api/life-coach/guidance").send({ chart, report: {} });

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(new Date().toISOString().slice(0, 10));

    vi.unstubAllGlobals();
  });

  it("clamps an out-of-range dailyEnergyScore into 1-100", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: JSON.stringify({ ...SAMPLE_GUIDANCE, dailyEnergyScore: 500 }) }] },
            },
          ],
        }),
        text: async () => "",
      })
    );
    const chart = await getSampleChart();

    const res = await request(app)
      .post("/api/life-coach/guidance")
      .send({ chart, report: {}, date: "2026-07-13" });

    expect(res.status).toBe(200);
    expect(res.body.guidance.dailyEnergyScore).toBe(100);

    vi.unstubAllGlobals();
  });
});
