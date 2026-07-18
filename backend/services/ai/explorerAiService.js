// ─────────────────────────────────────────────────────────────────────────
// Explorer AI Service — V5.0 Phase 5C (Explorer AI Explanations)
//
// Turns the Interactive Kundli Explorer into an AI-powered learning
// experience WITHOUT introducing a second AI pipeline. This module never
// calculates astrology and never builds its own Gemini prompt from
// scratch — it reuses the exact same, unmodified infrastructure the AI
// Report Chat (V4.5 Phase 4) already ships:
//
//   - buildStructuredInsights()  (structuredInsightsEngine.js — read-only)
//   - buildChatPrompt()          (chatPromptBuilder.js — unmodified)
//   - callGemini()               (geminiService.js — unmodified; this is
//                                  also where the existing prompt-hash
//                                  cache and retry/fallback logic live, so
//                                  an Explorer explanation for the exact
//                                  same chart+selection is served from
//                                  cache exactly like a repeated chat
//                                  question would be)
//
// The only new logic here is turning a (itemType, itemLabel,
// contextFacts) Explorer selection into the deterministic, backend-
// authored "question" text that buildChatPrompt() expects — contextFacts
// itself is never computed here, it is forwarded verbatim from whatever
// the frontend's own detail panel already resolved from `report`
// (planetStrength / aspectInfluence / nakshatraProfile / etc., all
// existing, unmodified engine output). Gemini is given this as grounding
// context and is bound by chatPromptBuilder's existing rules to never
// calculate, invent, or contradict it.
//
// Response normalization mirrors assistantService.js's own
// normalizeEvidence/normalizeConfidence/stripCodeFences helpers exactly
// (small, self-contained utilities are duplicated here rather than
// imported, since assistantService.js/AI Report Chat is explicitly
// off-limits to modify this phase — even adding an export to it).
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

// One deterministic, backend-authored instruction per Explorer selection
// type — mirrors exactly the bullet points each type's detail panel
// already renders (see PlanetExplorerPanel.jsx / HouseExplorerPanel.jsx /
// etc.), so the AI explanation covers the same ground the panel's own
// backend-driven UI does, never more, never invented.
const ITEM_TYPE_FOCUS = {
  planet:
    "Explain this planet's classical role/significance, its current placement (house and sign), its house influence, its sign influence, its strength/dignity, any yogas it forms or contributes to, any doshas it forms or contributes to, its relevance to the person's current Vimshottari Dasha, its relevance to current planetary transits, its relevance to the person's category predictions, and its relevance to any suggested remedies.",
  house:
    "Explain this house's classical meaning/significance, which planets currently occupy it, its house lord, what an empty house like this traditionally means if it has no occupants, its current impact on this chart, and its impact on the person's category predictions.",
  sign:
    "Explain this zodiac sign's classical nature, which planets currently occupy it in this chart, whether it is this chart's Ascendant (Lagna) sign, its classical ruling planet, and its relevance to the person's category predictions.",
  yoga:
    "Explain how this yoga is classically formed, why it is considered important in Vedic astrology, whether and how it is currently activated in this chart, and its benefits and challenges.",
  dosha:
    "Explain the classical cause of this dosha, its severity in this chart, its current relevance to the person's life areas, and the existing remedies already suggested for it.",
  nakshatra:
    "Explain this Nakshatra's symbolism, its ruling deity, the personality traits traditionally associated with it, its typical strengths and weaknesses, and its current influence on this chart.",
  ascendant:
    "Explain the significance of this Lagna (Ascendant) sign, the personality traits traditionally associated with it, the life direction it suggests, and its relevance to the person's category predictions.",
  aspect:
    "Explain this planetary aspect (Drishti): which planet(s) are the aspect source, which planet is the aspect target, the classical nature of that influence, and its current effects on this chart.",
};

// Builds the exact same kind of free-text "question" a person could have
// typed into the AI Report Chat — buildChatPrompt() treats it identically
// either way, which is what lets this module reuse that prompt builder
// completely unmodified.
function buildExplorerQuestion({ itemType, itemLabel, contextFacts }) {
  const focus = ITEM_TYPE_FOCUS[itemType] || `Explain the selected ${itemType} ("${itemLabel}") in this chart.`;
  const hasFacts = contextFacts && typeof contextFacts === "object" && Object.keys(contextFacts).length > 0;
  const factsBlock = hasFacts
    ? `\n\nBackend-Computed Context For This Specific Explorer Selection (already-computed facts about "${itemLabel}" from this chart's own backend engines — treat as authoritative grounding, never invent anything beyond what's given here or in the sections above):\n${JSON.stringify(contextFacts)}`
    : "";
  return `The person selected "${itemLabel}" (Explorer category: ${itemType}) in the Interactive Kundli Explorer and wants it explained. ${focus}${factsBlock}`;
}

export async function explainExplorerItem({ chart, report, itemType, itemId, itemLabel, contextFacts, history }) {
  let insights = null;
  try {
    insights = buildStructuredInsights(chart);
  } catch (err) {
    // Same defensive pattern as assistantService.js/lifeCoachService.js: a
    // failure here must never break the explanation request — Gemini
    // simply gets a slightly smaller (but still fully backend-
    // authoritative) fact set from chatPromptBuilder's own facts section.
    logger.error("Explorer AI: buildStructuredInsights failed, continuing without it:", err);
  }

  const question = buildExplorerQuestion({ itemType, itemLabel, contextFacts });

  // Reuses buildChatPrompt() byte-for-byte — same facts renderer, same
  // absolute rules, same required JSON contract. Conversation history is
  // optional and only ever supplied if the frontend chooses to carry a
  // short "explore" trail forward; omitting it (every first selection)
  // keeps this a fresh, single-turn explanation.
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
    const err = new Error("Explorer AI did not return a usable explanation.");
    err.status = 502;
    throw err;
  }

  const evidence = normalizeEvidence(result?.evidence);
  const confidence = normalizeConfidence(result?.confidence);
  const suggestedNextQuestion = stripCodeFences(result?.suggestedNextQuestion) || null;

  return {
    itemType,
    itemId: itemId || null,
    itemLabel,
    // "summary" is the literal field name the Phase 5C brief asks for;
    // "shortAnswer" is kept alongside it (same value) so the frontend can
    // feed this response straight into the existing ChatMessage component
    // (AI Report Chat's own renderer for shortAnswer/detailedExplanation/
    // evidence/confidence/suggestedNextQuestion) with zero translation.
    summary: finalShortAnswer || null,
    shortAnswer: finalShortAnswer || null,
    detailedExplanation: finalDetailedExplanation || null,
    evidence,
    confidence,
    suggestedNextQuestion,
  };
}

export default { explainExplorerItem };
