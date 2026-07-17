// ─────────────────────────────────────────────────────────────────────────
// Festival Engine (V4.5 Phase 1A — Festival Backend Infrastructure)
//
// Single responsibility: given a Gregorian year (and, for month/day
// helpers, a month or date), deterministically locate the calendar date
// (or dates, for multi-day festivals) of each of the 19 supported
// festivals defined in rules/festivalData.json.
//
// HARD RULE: this module NEVER recomputes Tithi/Nakshatra/Yoga/Karana
// itself. Every festival date is located purely by reading the Tithi
// already produced by panchangEngine.computeDayQualityInternal for each
// candidate day — exactly the same reuse pattern muhuratEngine.js already
// established for the Muhurat Finder. This file adds no new planetary or
// lunar math; it only maps an existing daily Tithi output to a named
// festival occasion.
//
// Two determination strategies are used, matching each festival's real
// classical rule:
//   1. "recurring-tithi" — a Tithi/Paksha combination that recurs every
//      lunar month (Ekadashi, Purnima, Amavasya, Pradosh, Chaturthi).
//      Found by scanning every day of the year and keeping every day
//      whose Tithi matches the rule.
//   2. "tithi-in-window" — a Tithi/Paksha combination anchored to a
//      specific Hindu lunar month (Diwali/Kartik Amavasya, Holi/Phalguna
//      Purnima, etc). This codebase's Panchang Engine deterministically
//      computes Tithi/Paksha from a Gregorian date but does not track
//      Hindu lunar month names (see panchangEngine.js's own header on its
//      deterministic-approximation philosophy). Rather than inventing a
//      new lunar-month-naming calculation, each such festival instead
//      carries a real, well-documented Gregorian search window (the
//      calendar range that Hindu lunar month is known to fall within in
//      any given year) — the same "search a date range, take the best/
//      first match" technique muhuratEngine.findMuhurat already uses —
//      and the engine returns the first day in that window whose Tithi
//      matches the festival's rule.
//   3. "fixed-solar" — Sankranti, a solar (not lunar) transition that
//      falls on a near-fixed Gregorian date every year; stored directly
//      as a fixed month/day in the Festival Data Store.
// ─────────────────────────────────────────────────────────────────────────
import festivalData from "../../rules/festivalData.json" with { type: "json" };
import { computeDayQualityInternal } from "./panchangEngine.js";

const { festivals: FESTIVAL_DEFINITIONS } = festivalData;

export const FESTIVAL_KEYS = FESTIVAL_DEFINITIONS.map((f) => f.key);

// ── Date helpers (plain calendar math only — no astrology) ──────────────
function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateStr(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function addDaysStr(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// Iterates every calendar date from Jan 1 to Dec 31 of `year`.
function* eachDateOfYear(year) {
  for (let m = 1; m <= 12; m++) {
    const dim = daysInMonth(year, m);
    for (let d = 1; d <= dim; d++) yield toDateStr(year, m, d);
  }
}

// Iterates every calendar date within a festival's searchWindow for
// `year`. Windows are always within a single Gregorian year in this data
// set (no wraparound), matching every entry in festivalData.json.
function* eachDateInWindow(year, window) {
  const start = toDateStr(year, window.startMonth, window.startDay);
  const endDay = Math.min(window.endDay, daysInMonth(year, window.endMonth));
  const end = toDateStr(year, window.endMonth, endDay);
  let cur = start;
  while (cur <= end) {
    yield cur;
    cur = addDaysStr(cur, 1);
  }
}

// Does a given day's already-computed Tithi (from panchangEngine) match a
// festival's rule? Reused by both determination strategies below.
function tithiMatchesRule(dateStr, rule) {
  const { tithi } = computeDayQualityInternal(dateStr);
  // panchangEngine's Tithi.paksha is the full classical label ("Shukla
  // Paksha" / "Krishna Paksha"), not a bare "Shukla"/"Krishna" — matched
  // with .includes() so festivalData.json's rules can stay written as the
  // short form without this engine ever touching how panchangEngine
  // itself computes or names Paksha.
  if (rule.isAmavasya) {
    return tithi.paksha.includes("Krishna") && tithi.numberInPaksha === 15;
  }
  if (rule.paksha === "both") {
    return tithi.numberInPaksha === rule.tithiNumberInPaksha;
  }
  return tithi.paksha.includes(rule.paksha) && tithi.numberInPaksha === rule.tithiNumberInPaksha;
}

// ── Per-determination-type date finders ──────────────────────────────────
function findRecurringTithiOccurrences(year, rule) {
  const dates = [];
  for (const dateStr of eachDateOfYear(year)) {
    if (tithiMatchesRule(dateStr, rule)) dates.push(dateStr);
  }
  return dates;
}

function findTithiInWindowOccurrence(year, rule, window) {
  const matches = [];
  const start = toDateStr(year, window.startMonth, window.startDay);
  const end = toDateStr(year, window.endMonth, Math.min(window.endDay, daysInMonth(year, window.endMonth)));

  for (const dateStr of eachDateInWindow(year, window)) {
    if (tithiMatchesRule(dateStr, rule)) matches.push(dateStr);
  }

  if (matches.length === 0) {
    // Rare fallback: panchangEngine samples Tithi once per calendar day,
    // so on an occasional day the Tithi index can advance by more than
    // one step between samples (a real, classically-recognized
    // phenomenon called Tithi Kshaya, a "lost"/skipped Tithi) and the
    // exact index this rule is looking for is never sampled that month.
    // Rather than silently omitting the festival for that year, take the
    // closest-matching Paksha/Tithi day in the window as its occurrence —
    // still entirely reused from panchangEngine's own output, just
    // tolerant of its day-level sampling granularity.
    return findClosestTithiInWindow(year, rule, window);
  }
  if (matches.length === 1) return matches[0];

  // A window can occasionally contain two candidate matches (the intended
  // lunar month's occurrence, plus a neighboring lunar month's occurrence
  // that happens to fall just inside the window edge — lunar months drift
  // against the Gregorian calendar year over year). When that happens,
  // the occurrence closest to the window's midpoint is taken as the
  // intended one, since these windows are deliberately centered on each
  // festival's classically-known Gregorian timing.
  const windowMidpoint = addDaysStr(start, Math.floor(daysBetweenStr(start, end) / 2));
  matches.sort((a, b) => Math.abs(daysBetweenStr(a, windowMidpoint)) - Math.abs(daysBetweenStr(b, windowMidpoint)));
  return matches[0];
}

function findClosestTithiInWindow(year, rule, window) {
  const targetIndex = rule.isAmavasya ? 15 : rule.tithiNumberInPaksha;
  const targetPaksha = rule.isAmavasya ? "Krishna" : rule.paksha;
  let best = null;
  let bestDistance = Infinity;
  for (const dateStr of eachDateInWindow(year, window)) {
    const { tithi } = computeDayQualityInternal(dateStr);
    if (targetPaksha !== "both" && !tithi.paksha.includes(targetPaksha)) continue;
    const distance = Math.abs(tithi.numberInPaksha - targetIndex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = dateStr;
    }
  }
  return best;
}

function daysBetweenStr(a, b) {
  return (new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000;
}

function findFixedSolarOccurrence(year, fixedDate) {
  return toDateStr(year, fixedDate.month, fixedDate.day);
}

// Computes every occurrence date (an array — most festivals return exactly
// one date, recurring-tithi Vrats return many) for one festival definition
// in one Gregorian year. Never called with astrology math of its own.
function computeOccurrencesForDefinition(def, year) {
  switch (def.recurrence) {
    case "recurring-tithi":
      return findRecurringTithiOccurrences(year, def.rule);
    case "tithi-in-window": {
      const date = findTithiInWindowOccurrence(year, def.rule, def.searchWindow);
      return date ? [date] : [];
    }
    case "fixed-solar":
      return [findFixedSolarOccurrence(year, def.fixedDate)];
    default:
      return [];
  }
}

// Public shape returned for a single festival occurrence — the "Festival
// Data" contract requested by the Phase 1A spec (Name/Date/Type/
// Importance/Description/Historical Background/Religious Significance/
// Recommended Activities/Rituals/Fasting Information/Region), plus a
// `date`/`endDate` pair (endDate === date for single-day observances).
function toPublicOccurrence(def, date) {
  const endDate = def.durationDays && def.durationDays > 1
    ? addDaysStr(date, def.durationDays - 1)
    : date;
  return {
    key: def.key,
    name: def.name,
    date,
    endDate,
    durationDays: def.durationDays || 1,
    type: def.type,
    importance: def.importance,
    description: def.description,
    historicalBackground: def.historicalBackground,
    religiousSignificance: def.religiousSignificance,
    recommendedActivities: def.recommendedActivities,
    rituals: def.rituals,
    fastingInfo: def.fastingInfo,
    region: def.region,
  };
}

// ── Public API ────────────────────────────────────────────────────────────

// Static metadata for every supported festival, with no date attached —
// used to power a "which festivals exist" listing without computing a
// whole year's worth of Tithis.
export function listFestivalDefinitions() {
  return FESTIVAL_DEFINITIONS.map((def) => ({
    key: def.key,
    name: def.name,
    type: def.type,
    importance: def.importance,
    recurrence: def.recurrence,
    description: def.description,
    region: def.region,
  }));
}

export function getFestivalDefinition(key) {
  return FESTIVAL_DEFINITIONS.find((def) => def.key === key) || null;
}

// Every occurrence of every festival within a single Gregorian year,
// flattened and sorted by date. This is the core computation the
// repository layer caches (see festival.repository.js) since a
// recurring-tithi scan touches all 365/366 days of the year.
export function computeFestivalsForYear(year) {
  const out = [];
  for (const def of FESTIVAL_DEFINITIONS) {
    const dates = computeOccurrencesForDefinition(def, year);
    for (const date of dates) out.push(toPublicOccurrence(def, date));
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

// Every occurrence of a single festival within a single Gregorian year.
export function computeFestivalForYear(key, year) {
  const def = getFestivalDefinition(key);
  if (!def) return [];
  return computeOccurrencesForDefinition(def, year).map((date) => toPublicOccurrence(def, date));
}

export default {
  FESTIVAL_KEYS,
  listFestivalDefinitions,
  getFestivalDefinition,
  computeFestivalsForYear,
  computeFestivalForYear,
};
