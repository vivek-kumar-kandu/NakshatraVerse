// ─────────────────────────────────────────────────────────────────────────
// Kundli Matching API client (V4.0 Phase 1)
// Thin fetch wrappers for the three /api/matching endpoints. Mirrors the
// exact style/error-handling of reportsApi.js/api.js.
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

// Backend-only calculation (no AI) — Ashtakoota scores, Manglik analysis,
// dosha comparison, planet strength comparison, etc.
export async function computeMatch(personA, personB) {
  return postJson("/api/matching/compute", { personA, personB });
}

// Same calculation, plus a Gemini-generated natural-language explanation
// of the already-computed facts.
export async function generateMatchingReport(personA, personB) {
  return postJson("/api/matching/generate-report", { personA, personB });
}

export async function exportMatchingPdf({ personA, personB, chartA, chartB, matching, explanation }) {
  const response = await authFetch(`${API_BASE_URL}/api/matching/export-pdf`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personA, personB, chartA, chartB, matching, explanation }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || "nakshatraverse-kundli-match.pdf";

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default { computeMatch, generateMatchingReport, exportMatchingPdf };
