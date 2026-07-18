// ─────────────────────────────────────────────────────────────────────────
// Auth API client (Priority 5.2)
// Thin fetch wrappers for the new /api/auth/* endpoints. Every call sends
// credentials:"include" so the httpOnly session cookies (set by the
// backend) travel with the request — this is what makes the session
// "just work" without the frontend ever touching the token itself.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL } from "./api.js";

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
}

function networkErrorMessage() {
  return (
    `Could not reach the backend at ${API_BASE_URL}. Make sure the backend server is running ` +
    `(cd backend && npm run dev) and that VITE_API_BASE_URL in frontend/.env matches its address.`
  );
}

function post(path, payload) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  })
    .catch(() => { throw new Error(networkErrorMessage()); })
    .then(parseOrThrow);
}

export function register({ name, email, password }) {
  return post("/api/auth/register", { name, email, password });
}

export function login({ email, password }) {
  return post("/api/auth/login", { email, password });
}

export function googleLogin(idToken) {
  return post("/api/auth/google", { idToken });
}

export function logout() {
  return post("/api/auth/logout");
}

// The access-token cookie is short-lived (15m); the refresh-token cookie
// outlives it (30d). On its own, GET /me starts failing with 401 as soon
// as the access token expires — even though a valid refresh token still
// exists — which silently logs the user out on any page refresh past that
// window. Try a silent refresh before giving up, so the 30-day session
// actually persists the way it's supposed to.
export async function refresh() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    throw new Error(networkErrorMessage());
  }
  if (!response.ok) return null;
  const body = await parseOrThrow(response);
  return body.user;
}

export async function fetchCurrentUser() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
  } catch {
    throw new Error(networkErrorMessage());
  }

  if (response.status === 401) {
    // Access token missing/expired — attempt a silent refresh, then trust
    // its result. If the refresh token is also gone/expired, this falls
    // through to a normal logged-out state instead of throwing.
    const refreshedUser = await refresh().catch(() => null);
    return refreshedUser;
  }

  const body = await parseOrThrow(response);
  return body.user;
}

// ─────────────────────────────────────────────────────────────────────────
// Priority 6.2 (additive): Forgot Password UI needs somewhere to POST to.
// No backend endpoint for this exists yet (there is no
// /api/auth/forgot-password route in auth.routes.js as of this priority,
// and per scope this priority does not add or touch backend authentication
// APIs). This helper calls the conventional REST path so the frontend is
// ready to work the moment that endpoint ships, but it deliberately never
// throws: ForgotPasswordPage always shows the same generic "check your
// email" confirmation regardless of the outcome, which is standard
// account-enumeration-safe UX for this flow (a real backend would follow
// the same "don't reveal whether the email exists" contract) and also
// means this screen degrades gracefully — rather than showing a raw error
// — for as long as the endpoint doesn't exist server-side.
// ─────────────────────────────────────────────────────────────────────────
export async function requestPasswordReset(email) {
  try {
    await post("/api/auth/forgot-password", { email });
  } catch {
    // Intentionally swallowed — see note above.
  }
  return { requested: true };
}

export default { register, login, googleLogin, logout, fetchCurrentUser, refresh, requestPasswordReset };
