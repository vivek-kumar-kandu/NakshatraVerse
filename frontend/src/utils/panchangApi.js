// ─────────────────────────────────────────────────────────────────────────
// Panchang / Muhurat API client (V4.1 Phase 2)
// Thin fetch wrappers for the /api/panchang endpoints. Mirrors the exact
// style/error-handling of matchingApi.js/reportsApi.js.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
}

async function getJson(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}${path}${query ? `?${query}` : ""}`, { credentials: "include" });
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. Make sure the backend server is running ` +
      `(cd backend && npm run dev) and that VITE_API_BASE_URL in frontend/.env matches its address.`
    );
  }
  return parseOrThrow(response);
}

async function postJson(path, payload) {
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. Make sure the backend server is running ` +
      `(cd backend && npm run dev) and that VITE_API_BASE_URL in frontend/.env matches its address.`
    );
  }
  return parseOrThrow(response);
}

// GET /api/panchang/daily?date=&lat=&lon= — backend-computed, no AI.
export async function getDailyPanchang(date, coords) {
  const res = await getJson("/api/panchang/daily", { date, lat: coords?.lat, lon: coords?.lon });
  return res.panchang;
}

// GET /api/panchang/month?year=&month= — day-quality overview for Calendar
// visual indicators.
export async function getMonthPanchang(year, month, coords) {
  const res = await getJson("/api/panchang/month", { year, month, lat: coords?.lat, lon: coords?.lon });
  return res.days;
}

// GET /api/panchang/muhurat/activities — the 8 supported activity keys,
// served by the backend so the frontend never hardcodes a list that could
// drift out of sync with the engine's actual supported set.
export async function getMuhuratActivities() {
  const res = await getJson("/api/panchang/muhurat/activities");
  return res.activities;
}

// POST /api/panchang/muhurat — { activity, startDate, rangeDays? }
export async function findMuhurat({ activity, startDate, rangeDays }) {
  const res = await postJson("/api/panchang/muhurat", { activity, startDate, rangeDays });
  return res.muhurat;
}

// POST /api/panchang/explain — { kind: "daily"|"muhurat", data }. Same
// natural-language-only contract as every other Gemini call in this app:
// the backend never lets Gemini invent a new Panchang/Muhurat fact.
export async function explainPanchang(kind, data) {
  const res = await postJson("/api/panchang/explain", { kind, data });
  return res.explanation;
}

export default { getDailyPanchang, getMonthPanchang, getMuhuratActivities, findMuhurat, explainPanchang };
