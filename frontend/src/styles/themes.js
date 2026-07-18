// ─────────────────────────────────────────────────────────────────────────
// Theme registry — NakshatraVerse V3.0 Phase 1 (Design System & Theme Engine)
//
// Display-name / metadata registry for the themes defined in
// `styles/tokens.css`. This file adds no behavior of its own — it is
// consumed by UI that needs to *label* the current theme (e.g. Settings'
// appearance picker) or *list* the available ones, without hardcoding
// theme names as string literals in multiple places.
//
// `context/ThemeContext.jsx` remains the single source of truth for which
// `data-theme` value is actually applied to <html> (unchanged from V2.0 —
// this phase doesn't touch that mechanism, auth, routing, or any backend
// endpoint). Each entry's `id` below is exactly the `data-theme` value /
// ThemeContext mode it corresponds to.
//
// Adding a future theme (e.g. a holiday palette) is: (1) add a
// `[data-theme="..."] { --nv-*: ...; }` block to styles/tokens.css, then
// (2) add one entry here. No shared component ever needs to change,
// because every component only ever reads the `--nv-*` custom properties
// — never a hardcoded color — so new themes "just work" everywhere at
// once.
// ─────────────────────────────────────────────────────────────────────────

export const THEMES = [
  {
    id: "dark",
    name: "Midnight Cosmic",
    description: "The original deep-space NakshatraVerse identity — indigo/violet gradients, glowing purple-gold glass cards.",
    isDefault: true,
    icon: "🌙",
  },
  {
    id: "light",
    name: "Sacred Dawn",
    description: "A clean white canvas with soft purple accents and white glass cards — same brand, daylight-ready contrast.",
    isDefault: false,
    icon: "☀️",
  },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.isDefault) || THEMES[0];
}

export default THEMES;
