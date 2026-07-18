// ─────────────────────────────────────────────────────────────────────────
// Panchang UI constants (V4.1 Phase 2)
// Pure presentation metadata only — the actual list of supported Muhurat
// activities is fetched from the backend (GET /api/panchang/muhurat/
// activities, see utils/panchangApi.js) so this map only supplies a label
// + icon for each key the backend already returned; it never invents a
// new activity or Panchang value itself.
// ─────────────────────────────────────────────────────────────────────────

export const ACTIVITY_META = {
  marriage: { label: "Marriage", icon: "💍" },
  housewarming: { label: "House Warming", icon: "🏠" },
  businessOpening: { label: "Business Opening", icon: "🏢" },
  travel: { label: "Travel", icon: "✈️" },
  education: { label: "Education", icon: "📚" },
  vehiclePurchase: { label: "Vehicle Purchase", icon: "🚗" },
  propertyPurchase: { label: "Property Purchase", icon: "🏡" },
  namingCeremony: { label: "Naming Ceremony", icon: "👶" },
};

export function activityMeta(key) {
  return ACTIVITY_META[key] || { label: key, icon: "✨" };
}

export function qualityColor(scoreOrLabel) {
  const s = typeof scoreOrLabel === "number" ? scoreOrLabel : null;
  if (s !== null) {
    if (s >= 60) return "#7effb2";
    if (s < 30) return "#ff8f7e";
    return "#ffd700";
  }
  const label = String(scoreOrLabel || "").toLowerCase();
  if (label.includes("good") || label.includes("auspicious")) return "#7effb2";
  if (label.includes("avoid") || label.includes("caution")) return "#ff8f7e";
  return "#ffd700";
}

export default { ACTIVITY_META, activityMeta, qualityColor };
