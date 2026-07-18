// ─────────────────────────────────────────────────────────────────────────
// Festival API client (V4.5 Phase 1B — Festival Frontend Integration)
// Thin fetch wrappers for the /api/festivals endpoints added by Festival
// Backend Infrastructure (V4.5 Phase 1A). Mirrors the exact style/
// error-handling of panchangApi.js/notificationsApi.js — same
// API_BASE_URL, same credentials/JSON/error-message conventions. No
// festival logic lives here: every date/importance/ritual/etc. value is
// exactly what festivalEngine.js already computed on the backend.
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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/festivals — static list of every supported festival (no dates).
// Used to power the Festival Page's category/type filter without needing
// a whole year computed first.
export async function listSupportedFestivals() {
  const res = await getJson("/api/festivals");
  return res.festivals;
}

// GET /api/festivals/on/:date — festivals occurring on a specific date.
// "Today's Festival" is just this called with today's date — there's no
// separate backend endpoint for it (mirrors how PanchangWidget calls
// getDailyPanchang(today) rather than a dedicated "today" route).
export async function getFestivalsOnDate(date) {
  const res = await getJson(`/api/festivals/on/${encodeURIComponent(date)}`);
  return res.festivals;
}

export async function getTodaysFestivals() {
  return getFestivalsOnDate(todayStr());
}

// GET /api/festivals/year?year=YYYY
export async function getFestivalsForYear(year) {
  const res = await getJson("/api/festivals/year", { year });
  return res.festivals;
}

// GET /api/festivals/month?year=YYYY&month=MM
export async function getFestivalsForMonth(year, month) {
  const res = await getJson("/api/festivals/month", { year, month });
  return res.festivals;
}

// GET /api/festivals/upcoming?date=YYYY-MM-DD&days=N
export async function getUpcomingFestivals(date = todayStr(), days) {
  const res = await getJson("/api/festivals/upcoming", { date, days });
  return res.festivals;
}

// GET /api/festivals/:key?year=YYYY — a single festival's definition +
// its occurrence(s) in the given year.
export async function getFestivalByKey(key, year) {
  return getJson(`/api/festivals/${encodeURIComponent(key)}`, { year });
}

// POST /api/festivals/explain — { festival: <already-computed occurrence> }.
// Same natural-language-only contract as panchangApi.explainPanchang:
// Gemini only ever explains data the backend already computed and the
// client already has; it never calculates a festival, date, or fact.
export async function explainFestival(festival) {
  const res = await postJson("/api/festivals/explain", { festival });
  return res.explanation;
}

export default {
  listSupportedFestivals, getFestivalsOnDate, getTodaysFestivals,
  getFestivalsForYear, getFestivalsForMonth, getUpcomingFestivals,
  getFestivalByKey, explainFestival,
};
