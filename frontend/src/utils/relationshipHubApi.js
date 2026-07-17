// ─────────────────────────────────────────────────────────────────────────
// Relationship Hub API client (V4.2 — Family Profiles & Relationship Hub)
// Thin fetch wrapper for the single /api/relationship-hub/compare
// endpoint. Mirrors the exact style/error-handling of matchingApi.js.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
}

export async function compareProfiles(profileIdA, profileIdB) {
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}/api/relationship-hub/compare`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileIdA, profileIdB }),
    });
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. Make sure the backend server is running ` +
      `(cd backend && npm run dev) and that VITE_API_BASE_URL in frontend/.env matches its address.`
    );
  }
  return parseOrThrow(response);
}

export default { compareProfiles };
