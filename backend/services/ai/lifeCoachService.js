// ─────────────────────────────────────────────────────────────────────────
// AI Life Coach Service — V4.3 (AI Life Coach)
// Orchestrates a single daily-guidance request: build the structured
// insights the report/assistant endpoints already compute (defensively —
// never fatal, exact same pattern as assistantService.js), compute today's
// Panchang (the exact same, already-existing panchangEngine.js the
// /api/panchang endpoints use), build the Life Coach prompt from
// backend-authoritative facts only, call Gemini, and return its guidance
// object. No astrology calculation happens here or anywhere downstream of
// this file — buildStructuredInsights()/computePanchang() are the same
// read-only functions the report/assistant/panchang endpoints already use;
// this module never calls them to compute anything new, only to describe
// the chart/day the client already has (or the server's own "today").
// ─────────────────────────────────────────────────────────────────────────
import logger from "../utils/logger.js";
import { buildStructuredInsights } from "../astrology/structuredInsightsEngine.js";
import { computePanchang } from "../astrology/panchangEngine.js";
import { computeWeeklyOutlookFacts, computeMonthlyOutlookFacts } from "../astrology/lifeCoachOutlookEngine.js";
import { computeLuckyElements, selectSpiritualPractice } from "../astrology/luckyElementsEngine.js";
import { deriveOverallConfidence, deriveCategoryConfidence } from "../astrology/confidenceEngine.js";
import { buildLifeCoachPrompt } from "./lifeCoachPromptBuilder.js";
import { callGemini } from "./geminiService.js";

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

// Fields the frontend widget/page render directly, alongside the raw
// backend facts they were built from — same "return the AI text plus the
// facts it was grounded in" shape /api/panchang/explain and
// /api/assistant/chat already use.
export async function generateDailyGuidance({ chart, report, date, lat, lon }) {
  let insights = null;
  try {
    insights = buildStructuredInsights(chart);
  } catch (err) {
    // Same defensive pattern as assistantService.js: a failure here must
    // never break the guidance request — Gemini simply gets a slightly
    // smaller (but still fully backend-authoritative) fact set.
    logger.error("Life Coach: buildStructuredInsights failed, continuing without it:", err);
  }

  const resolvedDate = date || todayDateStr();
  let panchang = null;
  try {
    panchang = computePanchang(resolvedDate, lat, lon);
  } catch (err) {
    logger.error("Life Coach: computePanchang failed, continuing without it:", err);
  }

  // ── V4.3 Enhancement Pass: Weekly/Monthly Outlook facts, Lucky
  // Elements, and the day's Spiritual Practice activity — all computed
  // deterministically by dedicated engines (see each module's own
  // header), never by Gemini. Defensive try/catch matches the exact
  // posture already used above for insights/panchang: a failure here
  // must never break the daily guidance request.
  let weekly = null;
  try {
    weekly = computeWeeklyOutlookFacts({ date: resolvedDate, lat, lon });
  } catch (err) {
    logger.error("Life Coach: computeWeeklyOutlookFacts failed, continuing without it:", err);
  }

  let monthly = null;
  try {
    monthly = computeMonthlyOutlookFacts({ date: resolvedDate, lat, lon });
  } catch (err) {
    logger.error("Life Coach: computeMonthlyOutlookFacts failed, continuing without it:", err);
  }

  let luckyElements = null;
  try {
    luckyElements = computeLuckyElements({ chart, panchang });
  } catch (err) {
    logger.error("Life Coach: computeLuckyElements failed, continuing without it:", err);
  }

  let spiritualPracticeSelection = null;
  try {
    spiritualPracticeSelection = selectSpiritualPractice({ panchang, nakshatraProfile: insights?.nakshatraProfile });
  } catch (err) {
    logger.error("Life Coach: selectSpiritualPractice failed, continuing without it:", err);
  }

  const prompt = buildLifeCoachPrompt({
    chart, report, insights, panchang, date: resolvedDate,
    weekly, monthly, luckyElements,
    spiritualPracticeActivity: spiritualPracticeSelection?.activity,
  });
  const guidance = await callGemini(prompt);

  if (!guidance || typeof guidance !== "object" || typeof guidance.dailyEnergyScore !== "number") {
    const err = new Error("The AI Life Coach did not return usable guidance.");
    err.status = 502;
    throw err;
  }

  // Clamp defensively in case Gemini drifts outside the requested 1-100
  // range despite the prompt's instructions — never trust model output for
  // a value the UI renders as a percentage-style ring.
  const clampedScore = Math.max(1, Math.min(100, Math.round(guidance.dailyEnergyScore)));

  // Backend-authoritative overrides: Weekly/Monthly Energy Score, Best/
  // Caution Day, Lucky Elements, and Confidence values must always come
  // from the deterministic engines above, never from Gemini — so every
  // numeric/date field below overwrites (rather than trusts) whatever
  // Gemini may have echoed back, exactly like dailyEnergyScore's own
  // clamp above already does for the one field the original V4.3 release
  // let Gemini derive.
  const weeklyOutlook = weekly?.weeklyEnergyScore != null
    ? {
        weeklyEnergyScore: weekly.weeklyEnergyScore,
        bestDay: weekly.bestDay,
        cautionDay: weekly.cautionDay,
        weeklyTheme: guidance.weeklyOutlook?.weeklyTheme ?? null,
        weeklyOpportunities: guidance.weeklyOutlook?.weeklyOpportunities ?? [],
        weeklyChallenges: guidance.weeklyOutlook?.weeklyChallenges ?? [],
        weeklyFocus: guidance.weeklyOutlook?.weeklyFocus ?? null,
      }
    : null;

  const monthlyOutlook = monthly?.monthlyEnergyScore != null
    ? {
        monthlyEnergyScore: monthly.monthlyEnergyScore,
        monthlyTheme: guidance.monthlyOutlook?.monthlyTheme ?? null,
        majorOpportunities: guidance.monthlyOutlook?.majorOpportunities ?? [],
        majorChallenges: guidance.monthlyOutlook?.majorChallenges ?? [],
        personalGrowthGoal: guidance.monthlyOutlook?.personalGrowthGoal ?? null,
        careerFocus: guidance.monthlyOutlook?.careerFocus ?? null,
        relationshipFocus: guidance.monthlyOutlook?.relationshipFocus ?? null,
      }
    : null;

  const confidence = {
    overall: deriveOverallConfidence({ panchangScore: panchang?.auspiciousnessScore, predictions: insights?.predictions }),
    career: deriveCategoryConfidence(insights?.predictions, "career"),
    relationship: deriveCategoryConfidence(insights?.predictions, "relationship"),
    finance: deriveCategoryConfidence(insights?.predictions, "finance"),
    health: deriveCategoryConfidence(insights?.predictions, "health"),
  };

  const spiritualPractice = spiritualPracticeSelection
    ? {
        // Backend-authoritative activity name always wins over whatever
        // Gemini echoed back; only `significance` is Gemini's own text.
        activity: spiritualPracticeSelection.activity,
        significance: guidance.spiritualPractice?.significance ?? null,
      }
    : guidance.spiritualPractice ?? null;

  return {
    date: resolvedDate,
    generatedAt: new Date().toISOString(),
    guidance: {
      ...guidance,
      dailyEnergyScore: clampedScore,
      weeklyOutlook,
      monthlyOutlook,
      spiritualPractice,
    },
    // Backend-authoritative facts the guidance was grounded in — exposed
    // so the frontend can show "today's Panchang" alongside the AI text
    // without a second round trip, exactly like PanchangWidget already
    // gets `panchang` from a single call.
    panchang,
    dasha: insights?.dasha ?? null,
    transits: insights?.transits ?? null,
    luckyElements,
    confidence,
  };
}

export default { generateDailyGuidance };
