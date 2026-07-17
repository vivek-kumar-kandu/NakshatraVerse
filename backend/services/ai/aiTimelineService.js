// ─────────────────────────────────────────────────────────────────────────
// AI Timeline Service — V5.2 (AI Timeline)
//
// Turns a selected AI Timeline event into an AI-powered explanation
// WITHOUT introducing a second AI pipeline — mirrors explorerAiService.js
// (V5.0 Phase 5C) exactly, reusing the same, unmodified infrastructure:
//
//   - buildStructuredInsights()  (structuredInsightsEngine.js — read-only)
//   - buildChatPrompt()          (chatPromptBuilder.js — unmodified)
//   - callGemini()               (geminiService.js — unmodified; same
//                                  prompt-hash cache/retry/fallback logic
//                                  a repeated chat question already gets)
//
// Gemini is NEVER asked to calculate astrology here — it only explains one
// already-computed AI Timeline event (built by aiTimelineEngine.js and
// shaped by predictionApiMapper.js#mapAiTimeline), the same
// "explanation-only" contract Explorer AI already established for its own
// Kundli selections.
//
// Response normalization mirrors explorerAiService.js's own
// normalizeEvidence/normalizeConfidence/stripCodeFences helpers exactly
// (small, self-contained utilities duplicated here for the same reason
// explorerAiService.js duplicates them from assistantService.js: both
// those files are off-limits to modify this phase).
// ─────────────────────────────────────────────────────────────────────────
import logger from "../utils/logger.js";
import { buildStructuredInsights } from "../astrology/structuredInsightsEngine.js";
import { buildChatPrompt } from "./chatPromptBuilder.js";
import { callGemini } from "./geminiService.js";

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
    .slice(0, 6);
}

// Human-readable label for each AI Timeline section — used only to phrase
// the deterministic question text below, never sent anywhere else.
const SECTION_LABELS = {
  past: "the Past",
  present: "the Present",
  nearFuture: "the Near Future",
  nextMonth: "the Next Month",
  next3Months: "the Next 3 Months",
  next6Months: "the Next 6 Months",
  nextYear: "the Next Year",
};

// One deterministic, backend-authored instruction for every AI Timeline
// selection — mirrors exactly the fields TimelineCard/the AI Timeline UI
// already renders for this event (category, date range, backend
// prediction, confidence, supporting planets/yogas/doshas, related dasha,
// related transit, related remedies), so the AI explanation covers the
// same ground the event's own backend-driven data does, never more, never
// invented.
function buildTimelineQuestion({ event, sectionLabel }) {
  const period = event?.timePeriod?.startDate
    ? `${event.timePeriod.startDate} to ${event.timePeriod.endDate}`
    : "this period";
  const focus =
    `Explain this ${event?.category || "life-area"} prediction for ${period} (part of the "${sectionLabel}" section of the AI Timeline). ` +
    `Cover why this prediction was reached given the active Mahadasha/Antardasha, the supporting planets, the supporting yogas, the supporting doshas, ` +
    `the confidence level, any relevant planetary transits, and the suggested remedies already associated with it.`;

  const hasFacts = event?.contextFacts && typeof event.contextFacts === "object" && Object.keys(event.contextFacts).length > 0;
  const factsBlock = hasFacts
    ? `\n\nBackend-Computed Context For This Specific Timeline Event (already-computed facts — treat as authoritative grounding, never invent anything beyond what's given here or in the sections above):\n${JSON.stringify(event.contextFacts)}`
    : "";

  return `The person selected a "${event?.category || "life-area"}" prediction from the AI Timeline (${sectionLabel} section) and wants it explained. ${focus}${factsBlock}`;
}

export async function explainTimelineEvent({ chart, report, event, history }) {
  let insights = null;
  try {
    insights = buildStructuredInsights(chart);
  } catch (err) {
    // Same defensive pattern as explorerAiService.js: a failure here must
    // never break the explanation request — Gemini simply gets a slightly
    // smaller (but still fully backend-authoritative) fact set from
    // chatPromptBuilder's own facts section.
    logger.error("AI Timeline: buildStructuredInsights failed, continuing without it:", err);
  }

  const sectionLabel = SECTION_LABELS[event?.section] || event?.section || "this period";
  const question = buildTimelineQuestion({ event, sectionLabel });

  // Reuses buildChatPrompt() byte-for-byte — same facts renderer, same
  // absolute rules, same required JSON contract, exactly like
  // explorerAiService.js already does for Explorer selections.
  const prompt = buildChatPrompt({
    chart,
    report: report || chart.report,
    insights,
    history: Array.isArray(history) ? history.slice(-4) : [],
    question,
  });

  const result = await callGemini(prompt);

  const legacyAnswer = stripCodeFences(result?.answer);
  const shortAnswer = stripCodeFences(result?.shortAnswer);
  const detailedExplanation = stripCodeFences(result?.detailedExplanation);

  const finalShortAnswer = shortAnswer || (legacyAnswer ? legacyAnswer.split("\n").find((l) => l.trim())?.trim() || "" : "");
  const finalDetailedExplanation = detailedExplanation || legacyAnswer;

  if (!finalShortAnswer && !finalDetailedExplanation) {
    const err = new Error("AI Timeline did not return a usable explanation.");
    err.status = 502;
    throw err;
  }

  const evidence = normalizeEvidence(result?.evidence);
  const confidence = normalizeConfidence(result?.confidence);
  const suggestedNextQuestion = stripCodeFences(result?.suggestedNextQuestion) || null;

  return {
    eventId: event?.id || null,
    section: event?.section || null,
    category: event?.category || null,
    summary: finalShortAnswer || null,
    shortAnswer: finalShortAnswer || null,
    detailedExplanation: finalDetailedExplanation || null,
    evidence,
    confidence,
    suggestedNextQuestion,
  };
}

export default { explainTimelineEvent };
