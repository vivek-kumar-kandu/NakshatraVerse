import { API_BASE_URL, authFetch } from "./api.js";

export async function fetchPersonalization({ reportId, period = "daily" } = {}) {
  const params = new URLSearchParams({ period });
  if (reportId) params.set("reportId", reportId);
  const response = await authFetch(`${API_BASE_URL}/api/personalization?${params}`, { credentials: "include" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Personalization request failed: ${response.status}`);
  return body;
}

export default { fetchPersonalization };
