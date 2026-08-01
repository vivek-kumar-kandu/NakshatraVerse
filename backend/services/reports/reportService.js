// ─────────────────────────────────────────────────────────────────────────
// Report Service (Priority 5.2)
// Business logic for saving/listing/retrieving/deleting a user's astrology
// reports. Ownership enforcement (a user can only ever see their own
// reports) lives here so both the controller and any future caller share
// the same guarantee.
//
// Note on data shape: this stores exactly what the frontend already has
// after a successful /api/generate-report call (userData + the
// authoritative chart + the Gemini narrative fields) — no new astrology
// calculation happens here, and the existing /api/generate-report
// response shape is completely untouched.
// ─────────────────────────────────────────────────────────────────────────
import * as reportRepository from "../../repositories/report.repository.js";
// Personalization Engine (services/personalization/personalizationService.js)
// memoizes getPersonalization() per (userId, reportId, period) for 15
// minutes. That memoization has no visibility into report mutations on its
// own, so every mutation here must explicitly invalidate it — otherwise a
// user who saves or deletes a report keeps seeing personalization results
// computed from stale report data until the TTL naturally expires.
import { clearPersonalizationCache } from "../personalization/personalizationService.js";

function assertOwnership(record, userId) {
  if (!record || record.userId !== userId) {
    const err = new Error("Report not found.");
    err.status = 404;
    throw err;
  }
}

export async function saveReport(userId, { title, userData, chart, report }) {
  if (!userData || !chart || !report) {
    const err = new Error("userData, chart, and report are all required to save a report.");
    err.status = 400;
    throw err;
  }
  const resolvedTitle = (title && String(title).trim()) || `${userData.name || "Untitled"}'s Reading`;
  const record = await reportRepository.create({
    userId,
    title: resolvedTitle,
    userData,
    chart,
    report,
  });
  // A new saved reading changes this user's Personalization Engine inputs
  // (predictionsFor/activeTimeline/history all read straight from saved
  // reports) — clear so the next /api/personalization call reflects it
  // immediately instead of the previous 15-minute-stale memoized result.
  clearPersonalizationCache();
  return record;
}

<<<<<<< HEAD
export function listReports(userId) {
  return reportRepository.findByUser(userId).map((r) => ({
=======
export async function listReports(userId) {
  const reports = await reportRepository.findByUser(userId);
  return reports.map((r) => ({
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
    id: r.id,
    title: r.title,
    createdAt: r.createdAt,
    name: r.userData?.name,
    dob: r.userData?.dob,
    lagna: r.userData?.lagna || r.chart?.lagna,
  }));
}

<<<<<<< HEAD
export function getReport(userId, id) {
  const record = reportRepository.findById(id);
=======
export async function getReport(userId, id) {
  const record = await reportRepository.findById(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  assertOwnership(record, userId);
  return record;
}

export async function deleteReport(userId, id) {
<<<<<<< HEAD
  const record = reportRepository.findById(id);
=======
  const record = await reportRepository.findById(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  assertOwnership(record, userId);
  const result = await reportRepository.remove(id);
  // Same reasoning as saveReport(): a deleted reading changes this user's
  // Personalization Engine inputs (e.g. the deleted report should stop
  // being `history[0]`/the comparison baseline), so the memoized result
  // must not survive it.
  clearPersonalizationCache();
  return result;
}

export default { saveReport, listReports, getReport, deleteReport };
