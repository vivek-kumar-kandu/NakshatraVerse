// ─────────────────────────────────────────────────────────────────────────
// Shared birth date/time parsing helpers.
// Extracted verbatim from the original astroEngine.js so every astrology
// engine module can reuse the exact same parsing/validation logic (DRY)
// instead of re-implementing it.
// ─────────────────────────────────────────────────────────────────────────

// Accepts YYYY-MM-DD (HTML date input format). Callers are expected to
// validate the format before reaching here (see validators/), but we guard
// anyway so a bad value fails loudly instead of silently producing NaN
// positions that would confuse the AI prompt and the UI.
export function parseDob(dob) {
  const [y, m, d] = String(dob).split("-").map(Number);
  if (!y || !m || !d) {
    throw new Error(`Invalid date of birth "${dob}". Expected YYYY-MM-DD.`);
  }
  return { y, m, d };
}

export function parseTob(tob) {
  const [h, mi] = String(tob).split(":").map(Number);
  if (Number.isNaN(h)) {
    throw new Error(`Invalid time of birth "${tob}". Expected HH:MM.`);
  }
  return { h, mi: mi || 0 };
}
