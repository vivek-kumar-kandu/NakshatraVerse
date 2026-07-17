// ─────────────────────────────────────────────────────────────────────────
// Festival Service (V4.5 Phase 1A — Festival Backend Infrastructure)
//
// Business logic for the Festival module: orchestrates
// festival.repository.js (static definitions + cached per-year
// occurrences) into the shapes the Controller layer and the Notification
// Generation Service need. No astrology/date-finding logic lives here —
// that is entirely festivalEngine.js's job (see its own header); this
// layer only filters/sorts/groups what the repository already returns,
// the same "service = orchestration, not calculation" split every other
// module in this codebase (familyProfileService.js, notificationService
// .js) already follows.
// ─────────────────────────────────────────────────────────────────────────
import * as festivalRepository from "../../repositories/festival.repository.js";

function yearOf(dateStr) {
  return Number(String(dateStr).slice(0, 4));
}

// A multi-day festival (currently only Navratri) "occurs on" every date
// within [date, endDate], not just its start date.
function occursOnDate(occurrence, dateStr) {
  return dateStr >= occurrence.date && dateStr <= occurrence.endDate;
}

// ── Static reference listing (no dates) ──────────────────────────────────
export function listSupportedFestivals() {
  return festivalRepository.getDefinitions();
}

// ── Full-year / single-festival lookups ──────────────────────────────────
export function getFestivalsForYear(year) {
  return festivalRepository.getFestivalsForYear(year);
}

export function getFestivalsForMonth(year, month) {
  const monthStr = String(month).padStart(2, "0");
  return festivalRepository.getFestivalsForYear(year)
    .filter((f) => f.date.slice(5, 7) === monthStr || f.endDate.slice(5, 7) === monthStr);
}

export function getFestival(key, year) {
  const def = festivalRepository.getDefinitionByKey(key);
  if (!def) {
    const err = new Error(`Unknown festival "${key}". Valid options: ${festivalRepository.getDefinitions().map((f) => f.key).join(", ")}`);
    err.status = 404;
    throw err;
  }
  const occurrences = festivalRepository.getFestivalForYear(key, year);
  return { definition: def, occurrences };
}

// ── Date-anchored lookups (power Notification Integration) ──────────────
// Every festival occurrence whose [date, endDate] span includes `dateStr`.
// Only scans the relevant year's (already-cached) occurrence list.
export function getFestivalsForDate(dateStr) {
  const year = yearOf(dateStr);
  return festivalRepository.getFestivalsForYear(year).filter((f) => occursOnDate(f, dateStr));
}

// Upcoming occurrences starting from `fromDateStr` (inclusive) through the
// next `days` days. Spans a year boundary correctly by pulling both years'
// cached lists when the window crosses Dec 31 -> Jan 1.
export function getUpcomingFestivals(fromDateStr, days = 30) {
  const fromYear = yearOf(fromDateStr);
  const end = new Date(`${fromDateStr}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + Math.max(1, Number(days) || 30));
  const toYear = end.getUTCFullYear();

  const pool = fromYear === toYear
    ? festivalRepository.getFestivalsForYear(fromYear)
    : [...festivalRepository.getFestivalsForYear(fromYear), ...festivalRepository.getFestivalsForYear(toYear)];

  const toDateStr = end.toISOString().slice(0, 10);
  return pool
    .filter((f) => f.date >= fromDateStr && f.date <= toDateStr)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export default {
  listSupportedFestivals,
  getFestivalsForYear,
  getFestivalsForMonth,
  getFestival,
  getFestivalsForDate,
  getUpcomingFestivals,
};
