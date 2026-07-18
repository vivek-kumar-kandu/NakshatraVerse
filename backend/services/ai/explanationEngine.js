// ─────────────────────────────────────────────────────────────────────────
// Explanation Engine — V5.3 (Explainable Report Intelligence)
//
// The ONE unified service that powers every AI explanation surface across
// Explorer, Timeline, Reports, and AI Life Coach:
//   - AI Report Summary        (getReportSummary)
//   - Confidence Explanations  (getConfidenceExplanation)
//   - Prediction Evidence      (getPredictionEvidence)
//   - Remedy Explanations      (getRemedyExplanation)
//   - Explorer <-> Timeline cross-linking (getCrossLinks)
//
// This module NEVER calculates astrology, NEVER duplicates a calculation
// already owned by the Astrology Engine / Prediction Engine / Rule Engine,
// and NEVER modifies them. It is a thin, additive orchestration layer that:
//   1. Reuses buildStructuredInsights() (structuredInsightsEngine.js —
//      UNMODIFIED, read-only) for every already-computed fact it needs
//      (predictions, dasha, transits, yogas/doshas, remedies, AI Timeline).
//   2. Reuses buildChatPrompt() (chatPromptBuilder.js — UNMODIFIED) via the
//      new, shared explanationPromptBuilder.js for every Gemini call —
//      exactly the infrastructure Explorer AI (V5.0) and AI Timeline (V5.2)
//      already established, just consolidated behind ONE service instead
//      of duplicated per feature.
//   3. Reuses callGemini() (geminiService.js — UNMODIFIED; this is also
//      where the existing prompt-hash cache/retry/fallback logic lives).
//   4. Adds ONE additional shared cache layer (explanationCache.js) on top
//      of that, so an identical explanation request from ANY of the four
//      surfaces this engine powers is served instantly.
//
// Confidence Explanations, Prediction Evidence, and Remedy Explanations are
// designed to always return a useful, deterministic result derived
// directly from already-computed backend facts (confidenceEngine.js /
// predictionEngine.js / remedyEngine.js output) even if the optional
// Gemini narrative layer on top of them fails — explainability should not
// go dark just because the upstream Gemini call is briefly unavailable.
// Report Summary and Cross-Links follow the same "never invents, only
// explains/links what's already computed" contract as every other AI
// surface in this codebase.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../utils/logger.js";
import { buildStructuredInsights } from "../astrology/structuredInsightsEngine.js";
import { buildChatPrompt } from "./chatPromptBuilder.js";
import { buildExplanationPrompt } from "./explanationPromptBuilder.js";
import { callGemini } from "./geminiService.js";
import { memoizeExplanation } from "../utils/explanationCache.js";
import { deriveConfidence } from "../astrology/confidenceEngine.js";

// ── Shared normalization helpers ────────────────────────────────────────
// Defined ONCE here rather than duplicated per feature the way
// explorerAiService.js/aiTimelineService.js each currently do (both of
// those files are off-limits to modify this phase, so this is where the
// V5.3 "unify" step lives for every NEW explanation capability).
function stripCodeFences(text) {
  return typeof text === "string" ? text.replace(/```/g, "").trim() : "";
}

function normalizeConfidence(confidence) {
  if (!confidence || typeof confidence !== "object") return null;
  const label = typeof confidence.label === "string" ? confidence.label.trim() : "";
  const score = typeof confidence.score === "number" && Number.isFinite(confidence.score) ? confidence.score : null;
  if (!label && score === null) return null;
  return { label: label || null, score };
}

function normalizeEvidence(evidence) {
  if (!Array.isArray(evidence)) return [];
  return evidence
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => stripCodeFences(item))
    .slice(0, 8);
}

function safeInsights(chart, label) {
  try {
    return buildStructuredInsights(chart);
  } catch (err) {
    // Same defensive pattern explorerAiService.js/aiTimelineService.js
    // already use: a failure here must never break the request — every
    // caller below tolerates `insights === null`.
    logger.error(`Explanation Engine (${label}): buildStructuredInsights failed, continuing without it:`, err);
    return null;
  }
}

// One deterministic cache key builder shared by every memoized function
// below — a short string built from the explanation kind, the subject
// identity, and only the specific chart facts that could change the
// answer (never the whole chart object).
function cacheKey(kind, subjectId, chart) {
  const dob = chart?.userData?.dob || "?";
  const tob = chart?.userData?.tob || "?";
  const name = chart?.userData?.name || "?";
  return `${kind}::${subjectId}::${name}|${dob}|${tob}`;
}

async function runExplanationPrompt({ kind, subject, focusInstruction, contextFacts, chart, report, history }) {
  const insights = safeInsights(chart, kind);
  const prompt = buildExplanationPrompt({
    buildChatPrompt,
    chart,
    report: report || chart?.report,
    insights,
    history,
    kind,
    subject,
    focusInstruction,
    contextFacts,
  });
  const result = await callGemini(prompt);
  const shortAnswer = stripCodeFences(result?.shortAnswer) || stripCodeFences(result?.answer);
  const detailedExplanation = stripCodeFences(result?.detailedExplanation) || stripCodeFences(result?.answer);
  return {
    shortAnswer: shortAnswer || null,
    detailedExplanation: detailedExplanation || null,
    evidence: normalizeEvidence(result?.evidence),
    confidence: normalizeConfidence(result?.confidence),
    suggestedNextQuestion: stripCodeFences(result?.suggestedNextQuestion) || null,
    insights,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. AI Report Summary
// A concise, whole-report synthesis that sits above the per-section
// narrative (report.lifeSummary etc., already generated by promptBuilder.js
// at report-generation time). Grounded in the same contributingFactors /
// predictions / dasha / transitForecast every other explanation surface
// uses — nothing new is computed, only summarized.
// ─────────────────────────────────────────────────────────────────────────
async function _getReportSummary({ chart, report, history }) {
  const focusInstruction =
    "Write a concise, whole-report synthesis (not a repeat of any single section) covering: the single most " +
    "important theme of this chart right now, how the current Mahadasha/Antardasha and active transits are " +
    "shaping that theme, which 1-2 category predictions currently carry the highest confidence and why, and " +
    "which single remedy (if any) is most relevant right now. Keep it tightly scoped to facts already computed " +
    "for this chart.";

  const outcome = await runExplanationPrompt({
    kind: "report-summary",
    subject: "your overall report",
    focusInstruction,
    contextFacts: null,
    chart,
    report,
    history,
  });

  if (!outcome.shortAnswer && !outcome.detailedExplanation) {
    const err = new Error("The AI Report Summary is unavailable right now.");
    err.status = 502;
    throw err;
  }

  return {
    summary: outcome.shortAnswer,
    shortAnswer: outcome.shortAnswer,
    detailedExplanation: outcome.detailedExplanation,
    evidence: outcome.evidence,
    confidence: outcome.confidence,
    suggestedNextQuestion: outcome.suggestedNextQuestion,
  };
}

export const getReportSummary = memoizeExplanation(
  _getReportSummary,
  ({ chart }) => cacheKey("report-summary", "whole-report", chart)
);

// ─────────────────────────────────────────────────────────────────────────
// 2. Confidence Explanations
// Explains WHY a specific category prediction carries the confidence
// score/label it does. The deterministic part (score/label/evidence
// bullets) is built directly from the already-computed prediction object
// — this never fails and never needs Gemini. The optional `narrative`
// field is a best-effort Gemini prose explanation on top of it.
// ─────────────────────────────────────────────────────────────────────────
function findPrediction(insights, category) {
  const list = insights?.predictions || [];
  const needle = String(category || "").toLowerCase();
  return list.find((p) => String(p.category || "").toLowerCase() === needle) || null;
}

function buildDeterministicConfidenceEvidence(prediction) {
  if (!prediction) return [];
  const bullets = [];
  bullets.push(`Confidence: ${prediction.confidence?.label ?? "?"} [${prediction.confidence?.score ?? "?"}/100]`);
  if (prediction.dasha) bullets.push(`Active Mahadasha: ${prediction.dasha}`);
  if (prediction.antardasha) bullets.push(`Active Antardasha: ${prediction.antardasha}`);
  if (prediction.planet) bullets.push(`Dominant planet: ${prediction.planet}`);
  if (prediction.supportingYogas?.length) bullets.push(`Supporting yogas: ${prediction.supportingYogas.map((y) => y.name).join(", ")}`);
  if (prediction.supportingDoshas?.length) bullets.push(`Supporting doshas: ${prediction.supportingDoshas.map((d) => d.name).join(", ")}`);
  if (typeof prediction.profileAlignmentScore === "number") bullets.push(`Profile alignment: ${prediction.profileAlignmentScore}/100`);
  return bullets.slice(0, 8);
}

async function _getConfidenceExplanation({ chart, report, category, history }) {
  const insights = safeInsights(chart, "confidence");
  const prediction = findPrediction(insights, category);

  const deterministic = {
    category: prediction?.category || category,
    confidence: normalizeConfidence(prediction?.confidence) || deriveConfidence(null),
    evidence: buildDeterministicConfidenceEvidence(prediction),
  };

  let narrative = null;
  let narrativeError = null;
  if (prediction) {
    try {
      const focusInstruction =
        `Explain, in plain language, why the "${prediction.category}" prediction currently carries a confidence ` +
        `level of ${prediction.confidence?.label ?? "?"} [${prediction.confidence?.score ?? "?"}/100]. Reference the ` +
        `active Mahadasha/Antardasha, the dominant planet, and any supporting yogas/doshas already listed below — ` +
        `never invent a different confidence value or a reason not present in the given facts.`;
      const outcome = await runExplanationPrompt({
        kind: "confidence",
        subject: `the ${prediction.category} prediction's confidence level`,
        focusInstruction,
        contextFacts: {
          category: prediction.category,
          confidence: prediction.confidence,
          dasha: prediction.dasha,
          antardasha: prediction.antardasha,
          planet: prediction.planet,
          supportingYogas: prediction.supportingYogas,
          supportingDoshas: prediction.supportingDoshas,
          profileAlignmentScore: prediction.profileAlignmentScore,
        },
        chart,
        report,
        history,
      });
      narrative = outcome.detailedExplanation || outcome.shortAnswer || null;
    } catch (err) {
      // Deterministic evidence above must still be returned even if the
      // optional Gemini narrative layer is unavailable.
      logger.error("Explanation Engine: confidence narrative unavailable, returning deterministic evidence only:", err);
      narrativeError = err.message || "AI narrative unavailable.";
    }
  }

  return {
    category: deterministic.category,
    confidence: deterministic.confidence,
    evidence: deterministic.evidence,
    narrative,
    narrativeError,
  };
}

export const getConfidenceExplanation = memoizeExplanation(
  _getConfidenceExplanation,
  ({ chart, category }) => cacheKey("confidence", category, chart)
);

// ─────────────────────────────────────────────────────────────────────────
// 3. Prediction Evidence
// Returns the exact backend facts that support one category prediction —
// planets, yogas, doshas, houses, dasha window, profile alignment — as a
// deterministic list (always available), plus an optional Gemini prose
// walkthrough of that same evidence (never a new conclusion).
// ─────────────────────────────────────────────────────────────────────────
function buildDeterministicPredictionEvidence(prediction) {
  if (!prediction) return [];
  const bullets = [];
  if (prediction.timePeriod?.startDate) bullets.push(`Time period: ${prediction.timePeriod.startDate} → ${prediction.timePeriod.endDate}`);
  if (prediction.dasha) bullets.push(`Mahadasha: ${prediction.dasha}`);
  if (prediction.antardasha) bullets.push(`Antardasha: ${prediction.antardasha}`);
  if (prediction.planet) bullets.push(`Dominant planet: ${prediction.planet}`);
  (prediction.supportingPlanets || []).forEach((p) => bullets.push(`Supporting planet: ${p}`));
  (prediction.supportingHouses || []).forEach((h) => bullets.push(`Supporting house: ${h}`));
  (prediction.supportingYogas || []).forEach((y) => bullets.push(`Supporting yoga: ${y.name}`));
  (prediction.supportingDoshas || []).forEach((d) => bullets.push(`Supporting dosha: ${d.name}`));
  if (prediction.profileSummary) bullets.push(`Profile reasoning: ${prediction.profileSummary}`);
  return bullets.slice(0, 12);
}

async function _getPredictionEvidence({ chart, report, category, history }) {
  const insights = safeInsights(chart, "prediction-evidence");
  const prediction = findPrediction(insights, category);
  const deterministicEvidence = buildDeterministicPredictionEvidence(prediction);

  let narrative = null;
  let narrativeError = null;
  if (prediction) {
    try {
      const focusInstruction =
        `Walk through the specific backend-computed evidence supporting the "${prediction.category}" prediction ` +
        `listed below — do not draw a different conclusion than the prediction already given, only explain why ` +
        `each piece of evidence is relevant to it.`;
      const outcome = await runExplanationPrompt({
        kind: "prediction-evidence",
        subject: `the evidence behind the ${prediction.category} prediction`,
        focusInstruction,
        contextFacts: {
          category: prediction.category,
          prediction: prediction.prediction,
          evidence: deterministicEvidence,
        },
        chart,
        report,
        history,
      });
      narrative = outcome.detailedExplanation || outcome.shortAnswer || null;
    } catch (err) {
      logger.error("Explanation Engine: prediction evidence narrative unavailable, returning deterministic evidence only:", err);
      narrativeError = err.message || "AI narrative unavailable.";
    }
  }

  return {
    category: prediction?.category || category,
    evidence: deterministicEvidence,
    narrative,
    narrativeError,
  };
}

export const getPredictionEvidence = memoizeExplanation(
  _getPredictionEvidence,
  ({ chart, category }) => cacheKey("prediction-evidence", category, chart)
);

// ─────────────────────────────────────────────────────────────────────────
// 4. Remedy Explanations
// Explains WHY a specific already-derived remedy (remedyEngine.js output,
// unchanged) was suggested — grounded in the Lagna lord / detected doshas
// that produced it. Never invents a new remedy; if the named remedy isn't
// present on the chart, says so plainly.
// ─────────────────────────────────────────────────────────────────────────
function findRemedy(chart, remedyType) {
  const list = chart?.remedies || [];
  const needle = String(remedyType || "").toLowerCase();
  return list.find((r) => String(r.type || "").toLowerCase() === needle) || null;
}

async function _getRemedyExplanation({ chart, report, remedyType, history }) {
  const remedy = findRemedy(chart, remedyType);
  const insights = safeInsights(chart, "remedy");

  if (!remedy) {
    return {
      type: remedyType,
      found: false,
      detail: null,
      narrative: null,
      narrativeError: null,
    };
  }

  let narrative = null;
  let narrativeError = null;
  try {
    const doshaNames = (chart?.doshas || []).map((d) => d.name);
    const focusInstruction =
      `Explain why the "${remedy.type}" remedy was suggested for this chart — reference the Lagna lord and any ` +
      `backend-detected doshas it addresses. Never invent a different remedy or contradict the remedy detail given ` +
      `below.`;
    const outcome = await runExplanationPrompt({
      kind: "remedy",
      subject: `the ${remedy.type} remedy`,
      focusInstruction,
      contextFacts: {
        remedyType: remedy.type,
        remedyDetail: remedy.detail,
        lagna: chart?.lagna,
        detectedDoshas: doshaNames,
      },
      chart,
      report,
      history,
    });
    narrative = outcome.detailedExplanation || outcome.shortAnswer || null;
  } catch (err) {
    logger.error("Explanation Engine: remedy narrative unavailable, returning deterministic detail only:", err);
    narrativeError = err.message || "AI narrative unavailable.";
  }

  return {
    type: remedy.type,
    found: true,
    detail: remedy.detail,
    narrative,
    narrativeError,
    _insightsAvailable: Boolean(insights),
  };
}

export const getRemedyExplanation = memoizeExplanation(
  _getRemedyExplanation,
  ({ chart, remedyType }) => cacheKey("remedy", remedyType, chart)
);

// ─────────────────────────────────────────────────────────────────────────
// 5. Explorer <-> Timeline Cross-Linking
// Pure, deterministic linking — no Gemini call. Given one Explorer
// selection (planet/yoga/dosha/category), finds every already-computed AI
// Timeline event (insights.aiTimeline, built by aiTimelineEngine.js —
// unmodified) that shares the same dominant planet, category, or a named
// supporting yoga/dosha, and vice versa. This is what makes Explorer and
// Timeline browsable as one connected graph instead of two islands.
// ─────────────────────────────────────────────────────────────────────────
const TIMELINE_SECTION_KEYS = ["past", "present", "nearFuture", "nextMonth", "next3Months", "next6Months", "nextYear"];

// insights.aiTimeline[section] is an array of aiTimelineEngine.js event
// objects shaped { id, section, filterCategory, raw }, where `raw` is the
// same evaluatePrediction() output insights.predictions holds (see
// predictionApiMapper.js#mapAiTimelineEvent for the equivalent unwrap used
// on the public API side). Flatten `raw`'s fields alongside the event's own
// id/section so cross-link matching can read `event.planet`/`event.category`
// directly, without duplicating that raw astrological data anywhere new.
function flattenTimelineEvents(aiTimeline) {
  if (!aiTimeline) return [];
  const events = [];
  for (const section of TIMELINE_SECTION_KEYS) {
    for (const event of aiTimeline[section] || []) {
      events.push({ ...(event.raw || {}), id: event.id, section, filterCategory: event.filterCategory });
    }
  }
  return events;
}

function eventMatchesItem(event, { itemType, itemLabel, planet, category }) {
  const label = String(itemLabel || "").toLowerCase();
  if (planet && String(event.planet || "").toLowerCase() === String(planet).toLowerCase()) return true;
  if (category && String(event.category || "").toLowerCase() === String(category).toLowerCase()) return true;
  if (itemType === "yoga" && (event.supportingYogas || []).some((y) => String(y.name).toLowerCase() === label)) return true;
  if (itemType === "dosha" && (event.supportingDoshas || []).some((d) => String(d.name).toLowerCase() === label)) return true;
  if (itemType === "planet" && String(event.planet || "").toLowerCase() === label) return true;
  return false;
}

async function _getCrossLinks({ chart, itemType, itemId, itemLabel, planet, category }) {
  const insights = safeInsights(chart, "cross-link");
  const events = flattenTimelineEvents(insights?.aiTimeline);
  const matches = events.filter((event) => eventMatchesItem(event, { itemType, itemLabel, planet, category }));

  const relatedTimelineEvents = matches.slice(0, 8).map((event) => ({
    id: event.id,
    section: event.section,
    category: event.category,
    prediction: event.prediction,
    confidence: normalizeConfidence(event.confidence),
    timePeriod: event.timePeriod,
  }));

  const relatedPredictions = (insights?.predictions || [])
    .filter((p) =>
      (planet && String(p.planet || "").toLowerCase() === String(planet).toLowerCase()) ||
      (category && String(p.category || "").toLowerCase() === String(category).toLowerCase())
    )
    .map((p) => ({ category: p.category, confidence: normalizeConfidence(p.confidence) }));

  return {
    itemType: itemType || null,
    itemId: itemId || null,
    itemLabel: itemLabel || null,
    relatedTimelineEvents,
    relatedPredictions,
  };
}

export const getCrossLinks = memoizeExplanation(
  _getCrossLinks,
  ({ chart, itemType, itemId, itemLabel, planet, category }) =>
    cacheKey("cross-link", `${itemType || "?"}:${itemId || itemLabel || "?"}:${planet || ""}:${category || ""}`, chart)
);

export default {
  getReportSummary,
  getConfidenceExplanation,
  getPredictionEvidence,
  getRemedyExplanation,
  getCrossLinks,
};
