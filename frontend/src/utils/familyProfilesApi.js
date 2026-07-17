// ─────────────────────────────────────────────────────────────────────────
// Family Profiles API client (V4.2 — Family Profiles & Relationship Hub)
// Thin fetch wrappers for the /api/family-profiles endpoints. Mirrors the
// exact style/error-handling of reportsApi.js/matchingApi.js.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
}

function withNetworkErrorMessage(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error(
          `Could not reach the backend at ${API_BASE_URL}. Make sure the backend server is running ` +
          `(cd backend && npm run dev) and that VITE_API_BASE_URL in frontend/.env matches its address.`
        );
      }
      throw err;
    }
  };
}

export const createProfile = withNetworkErrorMessage(async (profile) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  const body = await parseOrThrow(response);
  return body.profile;
});

export const listProfiles = withNetworkErrorMessage(async ({ search, relationship, sort, includeArchived } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (relationship) params.set("relationship", relationship);
  if (sort) params.set("sort", sort);
  if (includeArchived) params.set("includeArchived", "true");
  const qs = params.toString();
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles${qs ? `?${qs}` : ""}`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.profiles;
});

export const getStats = withNetworkErrorMessage(async () => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/stats`, { credentials: "include" });
  return parseOrThrow(response);
});

export const getRecentlyOpened = withNetworkErrorMessage(async (limit = 5) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/recent?limit=${limit}`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.profiles;
});

export const getProfile = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/${id}`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.profile;
});

export const updateProfile = withNetworkErrorMessage(async (id, profile) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  const body = await parseOrThrow(response);
  return body.profile;
});

export const deleteProfile = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/${id}`, { method: "DELETE", credentials: "include" });
  return parseOrThrow(response);
});

export const duplicateProfile = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/${id}/duplicate`, { method: "POST", credentials: "include" });
  const body = await parseOrThrow(response);
  return body.profile;
});

export const archiveProfile = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/${id}/archive`, { method: "POST", credentials: "include" });
  const body = await parseOrThrow(response);
  return body.profile;
});

export const restoreProfile = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/${id}/restore`, { method: "POST", credentials: "include" });
  const body = await parseOrThrow(response);
  return body.profile;
});

export const touchProfile = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/family-profiles/${id}/touch`, { method: "POST", credentials: "include" });
  const body = await parseOrThrow(response);
  return body.profile;
});

export default {
  createProfile, listProfiles, getStats, getRecentlyOpened, getProfile,
  updateProfile, deleteProfile, duplicateProfile, archiveProfile, restoreProfile, touchProfile,
};
