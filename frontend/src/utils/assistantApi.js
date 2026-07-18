// ─────────────────────────────────────────────────────────────────────────
// Assistant API client — V3.0 Phase 4 (AI Astrology Assistant)
// V4.5 Phase 4 (AI Report Chat): now also forwards three optional context
// objects (festivalContext/panchangContext/muhuratContext) when the
// caller supplies them, and returns the full structured response
// ({ answer, shortAnswer, detailedExplanation, evidence, confidence,
// suggestedNextQuestion }) instead of just { answer }. Existing callers
// that only read `answer` keep working unchanged.
// Thin fetch wrapper for POST /api/assistant/chat, mirroring the style of
// api.js/reportsApi.js exactly (same base URL, same error-shaping).
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

export async function sendChatMessage({ chart, report, history, question, festivalContext, panchangContext, muhuratContext }) {
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}/api/assistant/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, report, history, question, festivalContext, panchangContext, muhuratContext }),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the AI assistant at ${API_BASE_URL}. Check your connection and try again.`
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Assistant error: ${response.status}`);
  }
  return body; // { answer, shortAnswer, detailedExplanation, evidence, confidence, suggestedNextQuestion }
}

export default { sendChatMessage };
