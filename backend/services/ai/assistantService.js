// ─────────────────────────────────────────────────────────────────────────
// Assistant Service — V3.0 Phase 4 (AI Astrology Assistant)
// V4.5 Phase 4 (AI Report Chat): the Gemini contract now returns a
// structured shape (shortAnswer/detailedExplanation/evidence/confidence/
// suggestedNextQuestion) instead of a single "answer" string — see
// chatPromptBuilder.js. This module normalizes that into both the new
// structured fields AND a backward-compatible `answer` string (short +
// detailed, exactly what the V3.0 chat UI already expects), so nothing
// downstream that only reads `answer` breaks.
// Two-Mode Chat: `chart` is now optional.
//   - General Astrology Mode (no chart, or a question that doesn't need
//     one): answered by Gemini using general astrology knowledge via
//     buildGeneralChatPrompt — no backend facts, no chart required.
//   - Personal Astrology Mode (chart present AND the question needs it):
//     unchanged from before — Gemini explains only backend-computed facts
//     via buildChatPrompt.
//   - Chart absent BUT the question clearly needs one (per
//     personalIntentDetector.js): short-circuits before ever calling
//     Gemini and returns a graceful, deterministic prompt to open/generate
//     a report. This is intentionally NOT left to the model to decide.
// Orchestrates a single chat turn: build the structured insights the
// report endpoints already compute (defensively — never fatal), build the
// chat prompt from backend-authoritative facts only, call Gemini, and
// return its explanation text. No astrology calculation happens here or
// anywhere downstream of this file — computeChart()/buildStructuredInsights
// are the same read-only functions /api/chart and /api/generate-report
// already use; this module never calls them to compute anything new, only
// to describe the chart object the client already sent.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../utils/logger.js";
import { buildStructuredInsights } from "../astrology/structuredInsightsEngine.js";
import { buildChatPrompt, buildGeneralChatPrompt } from "./chatPromptBuilder.js";
import { callGemini } from "./geminiService.js";
import { trimHistory } from "../../validators/assistant.validator.js";
import { requiresPersonalChart } from "./personalIntentDetector.js";

// Shown verbatim, with no Gemini call, whenever a question needs the
// person's own chart but none was sent. Deterministic and instant rather
// than relying on the model to always catch this itself.
export const PERSONAL_CHART_REQUIRED_MESSAGE =
  "Please generate or open your astrology report for personalized guidance.";

// Strips code fences (defense in depth — the prompt already forbids them,
// but a model can slip them in anyway) so the frontend's "no code blocks"
// rule always holds regardless of what Gemini sends.
function stripCodeFences(text) {
  return typeof text === "string" ? text.replace(/```/g, "").trim() : "";
}

// Confidence must only ever be either null or the exact {label, score}
// shape a backend prediction already carries — never partially-formed
// or model-invented data makes it through.
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
    .slice(0, 6);
}

export async function answerChatQuestion({
  chart,
  report,
  history,
  question,
  festivalContext,
  panchangContext,
  muhuratContext,
}) {
  const trimmedQuestion = question.trim();
  const hasChart = !!chart && typeof chart === "object";

  // Personal Astrology Mode was asked for, but there's no chart to answer
  // it from — respond gracefully and instantly, no Gemini call needed.
  if (!hasChart && requiresPersonalChart(trimmedQuestion)) {
    return {
      answer: PERSONAL_CHART_REQUIRED_MESSAGE,
      shortAnswer: PERSONAL_CHART_REQUIRED_MESSAGE,
      detailedExplanation: null,
      evidence: [],
      confidence: null,
      suggestedNextQuestion: null,
      mode: "personal-chart-required",
    };
  }

  let prompt;
  if (hasChart) {
    let insights = null;
    try {
      insights = buildStructuredInsights(chart);
    } catch (err) {
      // Same defensive pattern as astrology.controller.js#getChart: a
      // failure here must never break the chat turn — Gemini simply gets a
      // slightly smaller (but still fully backend-authoritative) fact set.
      logger.error("Assistant chat: buildStructuredInsights failed, continuing without it:", err);
    }

    prompt = buildChatPrompt({
      chart,
      report: report || chart.report,
      insights,
      history: trimHistory(history),
      question: trimmedQuestion,
      festivalContext,
      panchangContext,
      muhuratContext,
    });
  } else {
    // General Astrology Mode: no chart at all, and the question doesn't
    // need one — answer from general astrology knowledge only.
    prompt = buildGeneralChatPrompt({ history: trimHistory(history), question: trimmedQuestion });
  }

  const result = await callGemini(prompt);

  // Backward compatibility: a cached prompt from before this phase (or a
  // model that ignores the new shape) may still return {answer}. In that
  // case, treat the whole thing as the detailed explanation rather than
  // failing the turn.
  const legacyAnswer = stripCodeFences(result?.answer);
  const shortAnswer = stripCodeFences(result?.shortAnswer);
  const detailedExplanation = stripCodeFences(result?.detailedExplanation);

  const finalShortAnswer = shortAnswer || (legacyAnswer ? legacyAnswer.split("\n").find((l) => l.trim())?.trim() || "" : "");
  const finalDetailedExplanation = detailedExplanation || legacyAnswer;

  if (!finalShortAnswer && !finalDetailedExplanation) {
    const err = new Error("The assistant did not return a usable answer.");
    err.status = 502;
    throw err;
  }

  const evidence = normalizeEvidence(result?.evidence);
  const confidence = normalizeConfidence(result?.confidence);
  const suggestedNextQuestion = stripCodeFences(result?.suggestedNextQuestion) || null;

  // `answer` stays a single combined string so any existing caller that
  // only reads `answer` (V3.0 chat UI, tests, etc.) keeps working exactly
  // as before — the structured fields are purely additive alongside it.
  const answer = finalShortAnswer && finalDetailedExplanation && finalShortAnswer !== finalDetailedExplanation
    ? `${finalShortAnswer}\n\n${finalDetailedExplanation}`
    : finalDetailedExplanation || finalShortAnswer;

  return {
    answer,
    shortAnswer: finalShortAnswer || null,
    detailedExplanation: finalDetailedExplanation || null,
    evidence,
    confidence,
    suggestedNextQuestion,
    mode: hasChart ? "personal" : "general",
  };
}

export default { answerChatQuestion, PERSONAL_CHART_REQUIRED_MESSAGE };
