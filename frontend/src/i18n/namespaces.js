// Namespace list per the migration spec (Phase 2). Each maps 1:1 to a
// src/locales/<lang>/<namespace>.json file. Namespaces are loaded lazily
// (see i18n/index.js's dynamic-import backend) — a page that only ever
// needs "dashboard" + "common" never pays for "festival" or "lifeCoach"'s
// JSON in its bundle.
export const NAMESPACES = [
  "common",
  "auth",
  "dashboard",
  "reports",
  "results",
  "home",
  "family",
  "notifications",
  "settings",
  "festival",
  "explorer",
  "timeline",
  "lifeCoach",
  "validation",
  "errors",
  "profile",
  "navigation",
];

export const DEFAULT_NAMESPACE = "common";

export default NAMESPACES;
