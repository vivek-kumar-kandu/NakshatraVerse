// ─────────────────────────────────────────────────────────────────────────
// fuzzySearch.js — V3.0 Premium Command Palette
//
// Small, dependency-free fuzzy subsequence matcher used only by
// CommandPalette.jsx to rank commands/reports as the person types (the
// same "type part of the name in any order of characters" experience as
// Raycast/Linear/VS Code's command palettes). Pure client-side text
// ranking — no backend call, no astrology/report data is read or
// changed, nothing here is persisted.
//
// `fuzzyScore` returns -Infinity when `query` isn't a subsequence of
// `text` (i.e. no match at all), otherwise a positive score where higher
// is a better match. Consecutive-character runs and matches that land on
// a word boundary score higher, so "sr" ranks "Saved Reports" above a
// same-length coincidental scatter-match elsewhere.
// ─────────────────────────────────────────────────────────────────────────

export function fuzzyScore(query, text) {
  const q = (query || "").trim().toLowerCase();
  const t = (text || "").toLowerCase();
  if (!q) return 0;
  if (!t) return -Infinity;

  let qi = 0;
  let score = 0;
  let consecutive = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) {
      score += 10 + consecutive * 5;
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-") score += 8;
      consecutive += 1;
      qi += 1;
    } else {
      consecutive = 0;
    }
  }

  // Didn't manage to match every query character as a subsequence — not a
  // match at all, regardless of partial score accumulated above.
  if (qi < q.length) return -Infinity;

  // Slight preference for shorter overall text among equally-good matches
  // (e.g. "Dashboard" over "Dashboard Overview & Insights" for query "da").
  score -= t.length * 0.05;
  return score;
}

// Ranks `items` against `query` using `getText(item)` for the searchable
// string. Returns the original array (unranked, original order) when the
// query is empty — callers decide what "no query yet" should display.
export function fuzzyFilter(query, items, getText) {
  const q = (query || "").trim();
  if (!q) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(q, getText(item)) }))
    .filter(({ score }) => score > -Infinity)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export default { fuzzyScore, fuzzyFilter };
