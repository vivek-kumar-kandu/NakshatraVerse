// ─────────────────────────────────────────────────────────────────────────
// Notifications API client (V4.4 Phase 1 — Notification Infrastructure)
// Thin fetch wrappers for the /api/notifications endpoints. Mirrors the
// exact style/error-handling of familyProfilesApi.js/panchangApi.js.
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

export const listNotifications = withNetworkErrorMessage(async ({ search, category, priority, isRead, sort, page, limit, group } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (priority) params.set("priority", priority);
  if (isRead !== undefined && isRead !== null && isRead !== "all") params.set("isRead", String(isRead));
  if (sort) params.set("sort", sort);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (group) params.set("group", "true");
  const qs = params.toString();
  const response = await authFetch(`${API_BASE_URL}/api/notifications${qs ? `?${qs}` : ""}`, { credentials: "include" });
  return parseOrThrow(response);
});

export const getUnreadCount = withNetworkErrorMessage(async () => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/unread-count`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.unreadCount;
});

export const getLatest = withNetworkErrorMessage(async () => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/latest`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.notification;
});

export const getNotification = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/${id}`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.notification;
});

export const markRead = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
  const body = await parseOrThrow(response);
  return body.notification;
});

export const markAllRead = withNetworkErrorMessage(async () => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/mark-all-read`, { method: "POST", credentials: "include" });
  return parseOrThrow(response);
});

export const deleteNotification = withNetworkErrorMessage(async (id) => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/${id}`, { method: "DELETE", credentials: "include" });
  return parseOrThrow(response);
});

export const deleteAllRead = withNetworkErrorMessage(async () => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/read`, { method: "DELETE", credentials: "include" });
  return parseOrThrow(response);
});

// V4.4 Phase 2 (Intelligent Notification Generation) — additive. Triggers
// server-side generation from Panchang/Muhurat/Family/Festival/Transit/
// Prediction/AI Life Coach before the widget/Notification Center reads
// the list, so newly-eligible notifications appear without a page reload.
export const generateNotifications = withNetworkErrorMessage(async () => {
  const response = await authFetch(`${API_BASE_URL}/api/notifications/generate`, { method: "POST", credentials: "include" });
  return parseOrThrow(response);
});

export default {
  listNotifications, getUnreadCount, getLatest, getNotification,
  markRead, markAllRead, deleteNotification, deleteAllRead,
  generateNotifications,
};
