// ─────────────────────────────────────────────────────────────────────────
// AI Timeline API client — V5.2 (AI Timeline)
// Thin fetch wrapper for POST /api/ai-timeline/explain, mirroring
// explorerAiApi.js's style byte-for-byte (same base URL source, same
// credentials handling, same error-shaping).
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

export async function fetchAiTimelineExplanation({ chart, report, event, history }) {
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}/api/ai-timeline/explain`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, report, event, history }),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the AI Timeline at ${API_BASE_URL}. Check your connection and try again.`
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `AI Timeline error: ${response.status}`);
  }
  return body; // { eventId, section, category, summary, shortAnswer, detailedExplanation, evidence, confidence, suggestedNextQuestion }
}

export default { fetchAiTimelineExplanation };
