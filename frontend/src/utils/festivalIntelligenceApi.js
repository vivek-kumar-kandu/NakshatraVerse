// ─────────────────────────────────────────────────────────────────────────
// Festival Intelligence API client (V4.5 Phase 2 — Festival Intelligence)
// Thin fetch wrappers for the /api/festival-intelligence endpoints.
// Mirrors festivalApi.js's exact style/error-handling — does not modify
// festivalApi.js in any way, this is a sibling file for the new Phase 2
// routes only.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
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

// POST /api/festival-intelligence/explain — { festival } -> richer,
// non-duplicate context (spiritual meaning, mythological story, etc).
export async function getFestivalIntelligence(festival) {
  const res = await postJson("/api/festival-intelligence/explain", { festival });
  return res.intelligence;
}

// POST /api/festival-intelligence/personalized — { festival, chart, report }.
export async function getPersonalizedFestivalGuidance(festival, chart, report) {
  return postJson("/api/festival-intelligence/personalized", { festival, chart, report });
}

// POST /api/festival-intelligence/preparation — { festival } -> deterministic
// checklist (no AI required, works even without an API key).
export async function getFestivalPreparation(festival) {
  const res = await postJson("/api/festival-intelligence/preparation", { festival });
  return res.preparation;
}

// POST /api/festival-intelligence/timeline — { festival } -> deterministic
// enhanced timeline stages (Preparation -> Morning -> Main Ritual ->
// Important Muhurat -> Evening -> Completion).
export async function getFestivalTimeline(festival) {
  const res = await postJson("/api/festival-intelligence/timeline", { festival });
  return res.timeline;
}

// GET /api/festival-intelligence/family-suggestions?festivalKey=&date=&year=
// Requires the user to be signed in (reads their own Family Profiles).
export async function getFamilyFestivalSuggestions(festivalKey, { date, year } = {}) {
  return getJson("/api/festival-intelligence/family-suggestions", { festivalKey, date, year });
}

export default {
  getFestivalIntelligence, getPersonalizedFestivalGuidance,
  getFestivalPreparation, getFestivalTimeline, getFamilyFestivalSuggestions,
};
