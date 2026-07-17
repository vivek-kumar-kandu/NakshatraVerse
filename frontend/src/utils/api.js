// ─────────────────────────────────────────────────────────────────────────
// Backend API client. Same endpoint, method, headers, and error-handling
// behavior as the original inline function in App.jsx — extracted for
// Separation of Concerns only.
//
// Priority 5.2: API_BASE_URL is now also imported by authApi.js and
// reportsApi.js so every backend call shares one source of truth for the
// base URL. generateAstroReport() itself is completely unchanged.
// ─────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8617";

// Phase 5 (Production Hardening): the localhost fallback above is exactly
// right for local development, but if a production build ever ships
// without VITE_API_BASE_URL set, every request would silently try to
// reach a developer's own machine — which fails in a confusing way (a
// generic network error, not an obvious "misconfigured" one). This is a
// one-time, non-fatal console warning in production builds only (never in
// dev or in tests, where `import.meta.env.PROD` is false) — it doesn't
// change what URL is used or any request behavior.
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    "NakshatraVerse: VITE_API_BASE_URL was not set for this production build — " +
    `falling back to ${API_BASE_URL}, which is almost certainly wrong outside local development.`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// authFetch — shared authenticated-request helper (fix, V5.5.1).
//
// The access-token cookie is short-lived (15m); the refresh-token cookie
// outlives it (30d). authApi.js's fetchCurrentUser() already knows to
// attempt a silent POST /api/auth/refresh and retry when GET /api/auth/me
// comes back 401 — but every *other* authenticated API module
// (notificationsApi, familyProfilesApi, reportsApi, matchingApi,
// relationshipHubApi, ...) called `fetch` directly and simply surfaced the
// backend's "Authentication required. Please sign in." the moment the
// access token expired mid-session (e.g. while a Kundli Match/AI report
// was being generated) — even though the person was still validly signed
// in and a page reload would have silently fixed it. This wraps `fetch`
// so every authenticated call gets the same silent-refresh-and-retry
// behavior: on a 401, attempt one refresh, and if it succeeds, retry the
// original request exactly once before giving up.
//
// Concurrent 401s (e.g. the Dashboard's Notifications and Family Profiles
// widgets both fetching at once) are coalesced into a single in-flight
// refresh call via `refreshInFlight`, rather than firing one refresh
// request per failed call.
// ─────────────────────────────────────────────────────────────────────────
let refreshInFlight = null;

function attemptRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export async function authFetch(url, options = {}) {
  const withCreds = { ...options, credentials: "include" };
  const response = await fetch(url, withCreds);
  if (response.status !== 401) return response;

  const refreshed = await attemptRefresh();
  if (!refreshed) return response;

  return fetch(url, withCreds);
}

export async function generateAstroReport(userData, planetaryData, numerology) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userData, planetary: planetaryData, numerology }),
    });
  } catch (networkErr) {
    // fetch() rejects with a bare "Failed to fetch"/"NetworkError" TypeError
    // when the request never reaches a server at all (backend not running,
    // wrong VITE_API_BASE_URL, CORS preflight blocked, etc.) — that message
    // alone gives a developer nothing to act on, so replace it with the
    // most common actual cause plus the URL that was actually tried.
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. Make sure the backend server is running ` +
      `(cd backend && npm run dev) and that VITE_API_BASE_URL in frontend/.env matches its address.`
    );
  }
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Backend error: ${response.status}`);
  }
  return response.json();
}
