// ─────────────────────────────────────────────────────────────────────────
// Reports API client (Priority 5.2)
// Thin fetch wrappers for saving/listing/viewing/deleting reports and for
// PDF export. Mirrors the style of authApi.js/api.js.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL, authFetch } from "./api.js";

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
}

export async function saveReport({ title, userData, chart, report }) {
  const response = await authFetch(`${API_BASE_URL}/api/reports`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, userData, chart, report }),
  });
  const body = await parseOrThrow(response);
  return body.report;
}

export async function listReports() {
  const response = await authFetch(`${API_BASE_URL}/api/reports`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.reports;
}

export async function getReport(id) {
  const response = await authFetch(`${API_BASE_URL}/api/reports/${id}`, { credentials: "include" });
  const body = await parseOrThrow(response);
  return body.report;
}

export async function deleteReport(id) {
  const response = await authFetch(`${API_BASE_URL}/api/reports/${id}`, { method: "DELETE", credentials: "include" });
  return parseOrThrow(response);
}

async function downloadPdfBlob(response, fallbackName) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || fallbackName;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Ad hoc export — works for anonymous visitors, straight off whatever the
// client currently has in memory (no save required).
export async function exportAdHocPdf({ userData, chart, report, title }) {
  const response = await authFetch(`${API_BASE_URL}/api/reports/export-pdf`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData, chart, report, title }),
  });
  await downloadPdfBlob(response, "nakshatraverse-report.pdf");
}

export async function exportSavedReportPdf(id, fallbackName) {
  const response = await authFetch(`${API_BASE_URL}/api/reports/${id}/pdf`, { credentials: "include" });
  await downloadPdfBlob(response, fallbackName || "nakshatraverse-report.pdf");
}

// V3.0 Phase 6: "Print PDF" — reuses the exact same export-pdf endpoint
// (same PDF bytes as Download), but opens it in a new tab and triggers the
// browser print dialog instead of saving to disk. No new backend endpoint.
async function openPdfBlobForPrint(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.addEventListener("load", () => {
      try { printWindow.print(); } catch { /* browser may block programmatic print; the tab is still open */ }
    });
  }
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}

export async function printAdHocPdf({ userData, chart, report, title }) {
  const response = await authFetch(`${API_BASE_URL}/api/reports/export-pdf`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData, chart, report, title }),
  });
  await openPdfBlobForPrint(response);
}

export default {
  saveReport, listReports, getReport, deleteReport,
  exportAdHocPdf, exportSavedReportPdf, printAdHocPdf,
};
