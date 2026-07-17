// ─────────────────────────────────────────────────────────────────────────
// Notification constants (V4.4 Phase 1 — Notification Infrastructure)
// Mirrors backend/validators/notification.validator.js's CATEGORIES/
// PRIORITIES lists exactly — kept as a small, standalone frontend
// constant (like familyProfileConstants.js already does) rather than
// importing backend code into the frontend bundle.
// ─────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "system", "reminder", "ai", "panchang", "muhurat",
  "prediction", "transit", "family", "festival", "general",
];

export const PRIORITIES = ["critical", "high", "medium", "low"];

export const CATEGORY_META = {
  system: { label: "System", icon: "⚙️" },
  reminder: { label: "Reminder", icon: "⏰" },
  ai: { label: "AI", icon: "✨" },
  panchang: { label: "Panchang", icon: "🕉️" },
  muhurat: { label: "Muhurat", icon: "🔍" },
  prediction: { label: "Prediction", icon: "🔮" },
  transit: { label: "Transit", icon: "🪐" },
  family: { label: "Family", icon: "👨‍👩‍👧‍👦" },
  festival: { label: "Festival", icon: "🎉" },
  general: { label: "General", icon: "🔔" },
};

export const PRIORITY_META = {
  critical: { label: "Critical", color: "#ff5c5c" },
  high: { label: "High", color: "#ffb347" },
  medium: { label: "Medium", color: "#bf7fff" },
  low: { label: "Low", color: "#9dc9ff" },
};

export default { CATEGORIES, PRIORITIES, CATEGORY_META, PRIORITY_META };
