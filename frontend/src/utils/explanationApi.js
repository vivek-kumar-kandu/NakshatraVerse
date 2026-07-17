// ─────────────────────────────────────────────────────────────────────────
// Explanation API client — V5.3 (Explainable Report Intelligence)
// Thin fetch wrapper for the five POST /api/explanation/* endpoints,
// mirroring explorerAiApi.js/aiTimelineApi.js's style exactly (same base
// URL source, same credentials handling, same error-shaping) — this is
// the ONE shared client every new Explanation Engine surface (Explorer,
// Timeline, Reports, AI Life Coach) imports from, instead of each one
// hand-rolling its own fetch wrapper the way explorerAiApi.js/aiTimelineApi.js
// each currently do for their own single endpoint.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

async function postExplanation(path, body, label) {
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(`Could not reach ${label} at ${API_BASE_URL}. Check your connection and try again.`);
  }
  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responseBody.error || `${label} error: ${response.status}`);
  }
  return responseBody;
}

/** AI Report Summary — a concise, whole-report synthesis. */
export function fetchReportSummary({ chart, report, history }) {
  return postExplanation("/api/explanation/report-summary", { chart, report, history }, "the AI Report Summary");
}

/** Confidence Explanation — why a category prediction carries its confidence score/label. */
export function fetchConfidenceExplanation({ chart, report, category, history }) {
  return postExplanation("/api/explanation/confidence", { chart, report, category, history }, "the Confidence Explanation");
}

/** Prediction Evidence — the backend facts supporting one category prediction. */
export function fetchPredictionEvidence({ chart, report, category, history }) {
  return postExplanation("/api/explanation/prediction-evidence", { chart, report, category, history }, "the Prediction Evidence");
}

/** Remedy Explanation — why a specific already-derived remedy was suggested. */
export function fetchRemedyExplanation({ chart, report, remedyType, history }) {
  return postExplanation("/api/explanation/remedy", { chart, report, remedyType, history }, "the Remedy Explanation");
}

/** Explorer <-> Timeline Cross-Links — related items across both surfaces. */
export function fetchCrossLinks({ chart, itemType, itemId, itemLabel, planet, category }) {
  return postExplanation("/api/explanation/cross-links", { chart, itemType, itemId, itemLabel, planet, category }, "Explorer/Timeline cross-linking");
}

export default {
  fetchReportSummary,
  fetchConfidenceExplanation,
  fetchPredictionEvidence,
  fetchRemedyExplanation,
  fetchCrossLinks,
};
