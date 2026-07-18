// ─────────────────────────────────────────────────────────────────────────
// reportDisplay.js (Phase 4 — Dashboard & Report Management)
//
// Small, presentation-only helpers for the Dashboard's report list: text
// search, sorting, and a zodiac-symbol lookup for a lagna name. These never
// call the backend, never mutate the `reports` array in place, and never
// alter any field's value — they only decide the *order*/*subset* of the
// same records `reportsApi.listReports()` already returned, and map an
// existing string (lagna sign name) to its existing glyph
// (`ZODIAC_SIGNS`/`SIGN_NAMES`, already used elsewhere in this app).
// Mirrors the shape of Phase 3's `utils/aiText.js`.
// ─────────────────────────────────────────────────────────────────────────
import { SIGN_NAMES, ZODIAC_SIGNS } from "../constants/astrology.js";

// Maps a lagna sign name (e.g. "Aries") to its glyph (e.g. "♈"). Falls
// back to a neutral sparkle if the name isn't recognized or is missing —
// this is cosmetic only, never throws, never blocks rendering.
export function zodiacSymbol(signName) {
  if (!signName) return "✦";
  const idx = SIGN_NAMES.findIndex((n) => n.toLowerCase() === String(signName).trim().toLowerCase());
  return idx >= 0 ? ZODIAC_SIGNS[idx] : "✦";
}

// Case-insensitive substring match across every field a person might
// reasonably search by: title, birth name, and lagna sign. Returns the
// full list unchanged when the query is empty/whitespace.
export function filterReports(reports, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return reports;
  return reports.filter((r) => {
    const haystack = [r.title, r.name, r.lagna, r.dob].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
];

export function sortReports(reports, sortKey) {
  const list = [...reports];
  switch (sortKey) {
    case "oldest":
      return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case "title-asc":
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    case "title-desc":
      return list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    case "newest":
    default:
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}
