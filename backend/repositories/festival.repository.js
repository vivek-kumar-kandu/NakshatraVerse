// ─────────────────────────────────────────────────────────────────────────
// Festival Repository (V4.5 Phase 1A — Festival Backend Infrastructure)
//
// Data-access layer for the Festival module. Unlike familyProfile.
// repository.js / notification.repository.js (which persist per-user
// records via JsonFileStore), Festival data is global reference data, not
// per-user data — so this repository's job is:
//   1. Expose read access to the static Festival Data Store
//      (rules/festivalData.json), the same way panchangEngine.js reads
//      rules/panchangData.json directly, just centralized behind one
//      module for the Festival feature specifically.
//   2. Cache the per-year computed occurrence list produced by
//      festivalEngine.computeFestivalsForYear — a recurring-tithi scan
//      touches all 365/366 days of a year, so repeated requests for the
//      same year (every day of Calendar/Dashboard/Notification usage will
//      ask for "this year") are served from memory instead of
//      recomputing the full-year Tithi scan every time.
//
// This module contains NO astrology logic itself — it only calls into
// festivalEngine.js (which is the only place festival dates are computed)
// and caches its output. Safe to import from the Service layer only; the
// Controller layer never touches this directly (mirrors every other
// repository in this codebase).
// ─────────────────────────────────────────────────────────────────────────
import {
  listFestivalDefinitions,
  getFestivalDefinition,
  computeFestivalsForYear,
  computeFestivalForYear,
} from "../services/astrology/festivalEngine.js";

// year -> festival[] (already computed + sorted by festivalEngine).
const yearCache = new Map();

// Cap so a long-running process can't accumulate unbounded cache entries
// if it's ever asked about many distant years (e.g. abuse/scripted
// requests) — same defensive posture as the rate limiters in
// middleware/security.js, just applied to memory instead of request rate.
const MAX_CACHED_YEARS = 25;

export function getDefinitions() {
  return listFestivalDefinitions();
}

export function getDefinitionByKey(key) {
  return getFestivalDefinition(key);
}

export function getFestivalsForYear(year) {
  if (yearCache.has(year)) return yearCache.get(year);

  const computed = computeFestivalsForYear(year);

  if (yearCache.size >= MAX_CACHED_YEARS) {
    // Evict the oldest inserted entry (Map preserves insertion order).
    const oldestKey = yearCache.keys().next().value;
    yearCache.delete(oldestKey);
  }
  yearCache.set(year, computed);
  return computed;
}

// Single-festival lookup does not currently benefit from a separate
// cache — it re-derives from the same underlying Tithi scan festivalEngine
// itself performs, and is only ever called for one key at a time (see
// festivalService.getFestival), so it's left as a direct pass-through.
export function getFestivalForYear(key, year) {
  return computeFestivalForYear(key, year);
}

// Testing/ops utility — clears the in-memory cache. Not exposed over
// HTTP; used only by tests that need a clean cache between assertions.
export function clearCache() {
  yearCache.clear();
}

export default {
  getDefinitions,
  getDefinitionByKey,
  getFestivalsForYear,
  getFestivalForYear,
  clearCache,
};
