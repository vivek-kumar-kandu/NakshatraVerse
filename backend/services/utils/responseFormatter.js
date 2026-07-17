// ─────────────────────────────────────────────────────────────────────────
// Response Formatter
// Single responsibility: take the raw Gemini narrative + the authoritative
// backend chart and produce the exact response shape the frontend expects.
// Also enforces backend authority over the AI output — Gemini is never
// allowed to invent doshas/yogas/remedies that the engine did not detect.
// Logic/text is unchanged from the original server.js /api/generate-report
// handler.
// ─────────────────────────────────────────────────────────────────────────
import { buildChartResponsePayload } from "../astrology/structuredJsonBuilder.js";
// V2.0 Phase 7.1 (Prediction & Profile Integration): the backend has
// already computed these via structuredInsightsEngine.js — this call only
// reshapes that existing data into the public API contract. See
// predictionApiMapper.js's header for why the reshaping happens here
// rather than by renaming the engine's own fields.
import { buildPredictionApiFields, buildExplorerApiFields, buildAiTimelineApiFields } from "../astrology/predictionApiMapper.js";

export const NOT_ENOUGH_DATA = "Not enough astrological data to provide this interpretation.";
export const NO_DOSHA_TEXT = "No major yoga or dosha detected based on available calculations.";
export const NO_YOGA_TEXT = "No major yoga or dosha detected based on available calculations.";
export const NO_REMEDY_TEXT = "No traditional remedy is suggested based on the currently calculated chart.";

const NARRATIVE_KEYS = ["loveLife", "career", "finance", "health", "marriage", "lifeSummary"];

export function formatGenerateReportResponse(chart, report, insights = null) {
  // Enforce backend authority: if the engine found nothing, override
  // whatever Gemini wrote with the mandated fallback text — Gemini is
  // never allowed to invent doshas/yogas/remedies that don't exist.
  //
  // chart.yogas/chart.doshas only ever hold BASE-engine results —
  // advanced yogas/doshas (Lakshmi, Parivartana, Viparita Raja, Guru
  // Chandal, etc.) live in insights.advancedYogas/insights.advancedDoshas
  // (see structuredInsightsEngine.js) and are never merged into chart.yogas/
  // chart.doshas, by design (birthChartEngine.js keeps that array
  // byte-identical for the API/frontend). Checking chart.yogas.length /
  // chart.doshas.length alone meant this override fired — stomping
  // Gemini's correct, backend-grounded explanation with the canned "none
  // detected" text — on every chart where ONLY advanced yogas/doshas were
  // present and the base set was empty, which is common. The override must
  // instead look at the full backend-confirmed set (base + advanced).
  const totalYogas = chart.yogas.length + (insights?.advancedYogas?.length || 0);
  const totalDoshas = chart.doshas.length + (insights?.advancedDoshas?.length || 0);
  if (totalDoshas === 0) report.doshas = NO_DOSHA_TEXT;
  if (totalYogas === 0) report.yogas = NO_YOGA_TEXT;
  if (chart.remedies.length === 0) report.remedies = NO_REMEDY_TEXT;

  for (const key of NARRATIVE_KEYS) {
    if (!report[key] || typeof report[key] !== "string" || !report[key].trim()) {
      report[key] = NOT_ENOUGH_DATA;
    }
  }

  // Attach the raw backend chart so the frontend can rely on the
  // authoritative server-calculated values instead of re-deriving them.
  //
  // V2.0 Phase 7.1: additionally, and purely additively, expose
  // nakshatraProfile/predictions/predictionTimeline/transitForecast —
  // optional fields, present only when `insights` was supplied. Every
  // existing key returned here (loveLife, career, ..., chart) is
  // completely unchanged; this only ever adds new top-level keys, never
  // renames or removes one, preserving backward compatibility for any
  // existing frontend consumer.
  return {
    ...report,
    chart: buildChartResponsePayload(chart),
    ...buildPredictionApiFields(insights),
    // V5.0 Phase 5B (Explorer Infrastructure — Backend Integration):
    // purely additive, optional fields (planetStrength/advancedYogas/
    // advancedDoshas) for the new Explorer tab — same "only ever adds new
    // top-level keys" guarantee as buildPredictionApiFields above.
    ...buildExplorerApiFields(insights),
    // V5.2 (AI Timeline): purely additive, optional `aiTimeline` field —
    // same "only ever adds new top-level keys" guarantee as
    // buildPredictionApiFields/buildExplorerApiFields above.
    ...buildAiTimelineApiFields(insights),
  };
}

export default { formatGenerateReportResponse, NOT_ENOUGH_DATA, NO_DOSHA_TEXT, NO_YOGA_TEXT, NO_REMEDY_TEXT };
