// ─────────────────────────────────────────────────────────────────────────
// Explorer constants (V5.0 Phase 5A — Explorer Infrastructure)
//
// Static, presentation-only reference data for the new Interactive Kundli
// Explorer tab. Follows the exact same pattern as `TABS` / `PLANET_COLORS`
// elsewhere in this file: plain data, no computation, no backend calls.
//
// This phase builds ONLY the Explorer's framework (context, layout,
// side/main panels, placeholder detail panels). The eight selection types
// below are the full set the framework must support; later phases will
// connect real backend-computed detail (rule engine output, Gemini
// explanations, etc.) behind these same ids without any change to this
// list or the components that read it.
// ─────────────────────────────────────────────────────────────────────────

export const EXPLORER_SELECTION_TYPES = [
  { id: "planet",     label: "Planets",      icon: "🪐", color: "#bf7fff" },
  { id: "house",      label: "Houses",       icon: "🏠", color: "#9dc9ff" },
  { id: "sign",       label: "Zodiac Signs", icon: "♈", color: "#ffb347" },
  { id: "yoga",       label: "Yogas",        icon: "⭐", color: "#c9ff7e" },
  { id: "dosha",      label: "Doshas",       icon: "🧿", color: "#ff7b7b" },
  { id: "nakshatra",  label: "Nakshatras",   icon: "🌟", color: "#ffd700" },
  { id: "ascendant",  label: "Ascendant",    icon: "⬆️", color: "#ff9ed8" },
  { id: "aspect",     label: "Aspects",      icon: "🔗", color: "#7effb2" },
];

// Quick id -> metadata lookup, used by components that only have a type id
// on hand (e.g. the main panel resolving a header color/icon).
export const EXPLORER_TYPE_MAP = EXPLORER_SELECTION_TYPES.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

export const EXPLORER_DEFAULT_EXPANDED = EXPLORER_SELECTION_TYPES.reduce((acc, t, idx) => {
  // First category starts expanded so the panel isn't empty on first
  // render; the rest start collapsed to keep the list scannable.
  acc[t.id] = idx === 0;
  return acc;
}, {});
