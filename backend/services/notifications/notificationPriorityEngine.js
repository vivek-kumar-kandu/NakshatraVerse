// ─────────────────────────────────────────────────────────────────────────
// Notification Priority Engine (V4.4 Phase 2 — Intelligent Notification
// Generation)
//
// Single responsibility: the ONE place that decides a notification's
// priority (critical/high/medium/low). notificationGenerationService.js's
// generators must call resolvePriority(...) instead of hardcoding a
// priority string inline — this is what "priority comes from a
// centralized backend engine, never hardcoded inside generators" means in
// practice, same separation notification.validator.js already documents
// for the priority *values* themselves.
//
// This file computes nothing astrological — it only maps facts a
// generator already has (a signal "kind", days-away, confidence score,
// classical flags, etc.) to one of the four canonical priorities from
// notification.validator.js's PRIORITIES list. Every branch below is a
// plain, auditable rule; there is no AI/Gemini call here, matching the
// "priority is never AI-decided" rule the rest of this module already
// follows.
// ─────────────────────────────────────────────────────────────────────────

export const PRIORITIES = ["critical", "high", "medium", "low"];
export const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const DEFAULT_PRIORITY = "medium";

// signal.kind -> rule. Every rule receives the same `signal` object a
// generator built and must return one of PRIORITIES. Kept as a lookup
// table (not a long if/else chain) so adding a new notification type is a
// one-line addition here, not a scattered change across generators.
const RULES = {
  // ── Panchang / Muhurat-of-the-day ────────────────────────────────────
  "panchang.today": () => "low",
  "panchang.brahmaMuhurat": () => "low",
  "panchang.abhijitMuhurat": () => "medium",
  "panchang.rahuKaal": () => "medium",
  "panchang.yamaganda": () => "low",
  "panchang.gulikaKaal": () => "low",
  "panchang.festival": () => "medium",

  // ── Festival / Vrat (V4.5 Phase 1A) ──────────────────────────────────
  // "Today" outranks "Tomorrow" (daysAway 0 vs 1); Important Vrats
  // (Ekadashi/Karva Chauth/Dev Uthani Ekadashi) outrank ordinary Festival
  // notifications at the same daysAway, matching the Phase 1A spec's
  // explicit "Important Vrat Today/Tomorrow" categories.
  "festival.today": ({ daysAway }) => (Number(daysAway) === 0 ? "high" : "medium"),
  "festival.importantVrat": ({ daysAway }) => (Number(daysAway) === 0 ? "high" : "medium"),

  // ── Muhurat Finder (upcoming favorable window) ───────────────────────
  "muhurat.finder": ({ daysAway }) => (Number(daysAway) <= 1 ? "high" : "medium"),

  // ── Family Profiles ───────────────────────────────────────────────────
  "family.birthday": ({ daysAway }) => {
    const d = Number(daysAway);
    if (d === 0) return "high";
    if (d <= 3) return "medium";
    return "low";
  },
  "family.checkin": () => "low",

  // ── Dasha ─────────────────────────────────────────────────────────────
  "dasha.current": () => "medium",
  "dasha.change": ({ daysAway }) => (Number(daysAway) <= 7 ? "high" : "medium"),
  "dasha.importantMahadasha": () => "high",
  "dasha.importantAntardasha": () => "medium",

  // ── Prediction Engine insights ────────────────────────────────────────
  "prediction.insight": ({ score }) => (Number(score) >= 85 ? "high" : "medium"),

  // ── Transits ──────────────────────────────────────────────────────────
  "transit.update": ({ hasClassicalFlag, isNamed }) => {
    if (hasClassicalFlag) return "high";
    return isNamed ? "medium" : "low";
  },

  // ── AI Life Coach ─────────────────────────────────────────────────────
  "ai.dailyGuidance": () => "medium",
  "ai.affirmation": () => "low",
  "ai.spiritualPractice": () => "low",
  "ai.weeklyOutlook": () => "low",
  "ai.monthlyOutlook": () => "low",
};

// Resolves a priority for a given signal. `signal.kind` selects the rule;
// `signal.critical === true` is an explicit escape hatch a generator can
// set for a genuinely urgent, unambiguous event (none do today, but the
// engine supports "Critical" as a first-class output per the Phase 2
// spec) — it always wins over the looked-up rule.
export function resolvePriority(signal = {}) {
  if (signal.critical === true) return "critical";
  const rule = RULES[signal.kind];
  const priority = rule ? rule(signal) : DEFAULT_PRIORITY;
  return PRIORITIES.includes(priority) ? priority : DEFAULT_PRIORITY;
}

export default { PRIORITIES, PRIORITY_ORDER, resolvePriority };
