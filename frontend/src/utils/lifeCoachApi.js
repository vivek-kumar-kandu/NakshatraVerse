// ─────────────────────────────────────────────────────────────────────────
// AI Life Coach API client — V4.3 (AI Life Coach)
// Thin fetch wrapper for the /api/life-coach endpoint. Mirrors the exact
// style/error-handling of panchangApi.js/reportsApi.js.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
}

// POST /api/life-coach/guidance — { chart, report, date? }. Same
// backend-authority contract as every other Gemini call in this app: the
// backend never lets Gemini calculate or invent an astrological fact, only
// convert already-computed facts into practical guidance.
export async function getDailyGuidance({ chart, report, date }) {
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}/api/life-coach/guidance`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, report, date }),
    });
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. Make sure the backend server is running ` +
      `(cd backend && npm run dev) and that VITE_API_BASE_URL in frontend/.env matches its address.`
    );
  }
  return parseOrThrow(response);
}

export default { getDailyGuidance };
