// ─────────────────────────────────────────────────────────────────────────
// Explorer AI API client — V5.0 Phase 5C (Explorer AI Explanations)
// Thin fetch wrapper for POST /api/explorer-ai/explain, mirroring the
// style of assistantApi.js/reportsApi.js exactly (same base URL, same
// error-shaping, same credentials handling).
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

export async function fetchExplorerExplanation({ chart, report, itemType, itemId, itemLabel, contextFacts, history }) {
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}/api/explorer-ai/explain`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, report, itemType, itemId, itemLabel, contextFacts, history }),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the Explorer AI at ${API_BASE_URL}. Check your connection and try again.`
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Explorer AI error: ${response.status}`);
  }
  return body; // { itemType, itemId, itemLabel, summary, shortAnswer, detailedExplanation, evidence, confidence, suggestedNextQuestion }
}

export default { fetchExplorerExplanation };
