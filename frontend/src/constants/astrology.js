// ─────────────────────────────────────────────────────────────────────────
// Shared frontend constants — extracted verbatim from the original
// monolithic App.jsx (Priority 5.1 modularization). No values changed.
// ─────────────────────────────────────────────────────────────────────────

export const LOADING_MSGS = [
  "Reading the Stars...",
  "Calculating Planetary Positions...",
  "Mapping Your Birth Chart...",
  "Consulting Ancient Vedic Texts...",
  "Preparing Your Personalized Report...",
];

export const ZODIAC_SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
export const SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export const PLANETS = ["Sun ☀️","Moon 🌙","Mars ♂","Mercury ☿","Jupiter ♃","Venus ♀","Saturn ♄","Rahu 🌑","Ketu 🌕"];

export const PLANET_COLORS = {
  "Sun ☀️":    "#FFD700",
  "Moon 🌙":   "#C0C8FF",
  "Mars ♂":    "#FF6B6B",
  "Mercury ☿": "#7EFFB2",
  "Jupiter ♃": "#FFB347",
  "Venus ♀":   "#FF9ED8",
  "Saturn ♄":  "#9DC9FF",
  "Rahu 🌑":   "#BF7FFF",
  "Ketu 🌕":   "#FFEC8B",
};

// ─── Phase 2 additions: Interactive Birth Chart & Astrology Experience ──
// Short, static reference copy (standard Vedic astrology significations)
// used purely for presentation in tooltips/detail cards — no calculation,
// no business logic. Astrology engine / rule engine output (house, sign,
// AI report text) is untouched and remains the sole source of computed
// data.
export const PLANET_SIGNIFICANCE = {
  "Sun ☀️":    "Soul, vitality, authority, and self-expression.",
  "Moon 🌙":   "Mind, emotions, intuition, and inner nature.",
  "Mars ♂":    "Energy, courage, action, and drive.",
  "Mercury ☿": "Intellect, communication, and analytical ability.",
  "Jupiter ♃": "Wisdom, growth, fortune, and higher knowledge.",
  "Venus ♀":   "Love, beauty, harmony, and relationships.",
  "Saturn ♄":  "Discipline, karma, patience, and structure.",
  "Rahu 🌑":   "Ambition, obsession, and worldly desire.",
  "Ketu 🌕":   "Detachment, spirituality, and past-life karma.",
};

// ─── V5.0 Phase 5B addition: Explorer Infrastructure — Backend Integration
// Static classical sign-rulership reference (mirrors
// backend/services/astrology/constants.js's own `SIGN_LORD` table exactly)
// used only for presentation in the new House/Ascendant Explorer panels
// (e.g. "House 7's lord is Venus because its sign is Libra"). This is a
// fixed astrological fact, not a calculation — the same category of
// static reference data as `HOUSE_MEANINGS`/`PLANET_SIGNIFICANCE` above.
export const SIGN_LORD = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

export const HOUSE_MEANINGS = {
  1: "Self & Personality", 2: "Wealth & Family", 3: "Courage & Siblings",
  4: "Home & Emotions", 5: "Creativity & Children", 6: "Health & Service",
  7: "Partnerships & Marriage", 8: "Transformation & Mystery",
  9: "Fortune & Higher Wisdom", 10: "Career & Status",
  11: "Gains & Aspirations", 12: "Loss & Liberation",
};

export const MULANK_DESC = {
  1:"Leader & Pioneer",2:"Diplomat & Peacemaker",3:"Creative & Expressive",
  4:"Builder & Practical",5:"Adventurer & Free Spirit",6:"Nurturer & Caregiver",
  7:"Seeker & Mystic",8:"Achiever & Ambitious",9:"Humanitarian & Wise",
  11:"Intuitive Visionary",22:"Master Builder",
};

export const TABS = [
  { id:"overview",  label:"Overview",     icon:"🪐" },
  { id:"kundli",    label:"Kundli",        icon:"⭕" },
  { id:"love",      label:"Love",          icon:"💕" },
  { id:"career",    label:"Career",        icon:"💼" },
  { id:"wealth",    label:"Wealth",        icon:"💰" },
  { id:"health",    label:"Health",        icon:"🌿" },
  { id:"doshas",    label:"Doshas & Yogas",icon:"🧿" },
  { id:"remedies",  label:"Remedies",      icon:"🪬" },
  { id:"predictions", label:"Predictions", icon:"🔮" },
  // V3.0 Phase 3 (Interactive Report Experience): surfaces
  // `report.predictionTimeline` (oneYear/fiveYear/tenYear) — data the
  // backend has returned since V2.0 Phase 7.1 but which no tab rendered
  // until now. Purely a new presentation of already-computed data.
  { id:"timeline",  label:"Timeline",      icon:"🕓" },
  { id:"summary",   label:"Life Summary",  icon:"✨" },
  // V5.0 Phase 5A (Explorer Infrastructure): the one new Explorer tab this
  // phase adds. Framework/placeholder only for now — see
  // components/explorer/ExplorerTab.jsx.
  { id:"explorer",  label:"Explorer",      icon:"🧭" },
];

// ─── Shared gradients/tokens ────────────────────────────────────────────
export const GOLD_GRADIENT = "var(--nv-gold-gradient, linear-gradient(135deg, #ffd700 0%, #ffb347 50%, #ffd700 100%))";
export const PURPLE_GRADIENT = "linear-gradient(135deg, #bf7fff 0%, #9040ff 100%)";

// ─── Phase 3 addition: AI Report Premium Presentation ───────────────────
// Maps each existing `report` field (unchanged — same object the backend/
// Gemini has always returned) to the tab it lives on plus purely-cosmetic
// display metadata (icon/label/color already used at each field's own tab
// in ResultsPage.jsx). Used only by the new `KeyHighlights` panel to
// render a scannable "quick glance" strip on the Overview tab — no new
// data is fetched or computed, this only re-labels existing report text.
export const REPORT_HIGHLIGHTS = [
  { key: "loveLife", tabId: "love",    label: "Love",           icon: "💕", color: "#ff7eb3" },
  { key: "career",   tabId: "career",  label: "Career",         icon: "💼", color: "#7eb8ff" },
  { key: "finance",  tabId: "wealth",  label: "Wealth",         icon: "💰", color: "#ffd700" },
  { key: "health",   tabId: "health",  label: "Health",         icon: "🌿", color: "#7effb2" },
  { key: "doshas",   tabId: "doshas",  label: "Doshas & Yogas", icon: "🧿", color: "#ff7b7b" },
  { key: "remedies", tabId: "remedies",label: "Remedies",       icon: "🪬", color: "#ffb347" },
];
