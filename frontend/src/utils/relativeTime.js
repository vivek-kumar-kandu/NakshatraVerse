// ─────────────────────────────────────────────────────────────────────────
// Relative Time formatter (V4.4 Phase 2 — Intelligent Notification
// Generation)
//
// One shared formatter, reused by every surface that shows a
// notification's age (NotificationCard -> Notification Center, Dashboard
// Widget, and anywhere else a notification timestamp is rendered) instead
// of each component inventing its own "Xm ago" logic. Pure function, no
// component/state coupling — mirrors how notificationConstants.js is a
// small standalone shared constants module.
//
// Phase 3.6: this used to hardcode its English strings ("Just now", "N
// minutes ago", ...) and call the bare, argument-less `toLocaleDateString()`
// (browser/OS locale, not the app's selected language) for the >5-week
// fallback. Since this is a plain utility function with no hook access of
// its own, it now takes the caller's `t` (from `useTranslation(["common"])`)
// and `lang` (from `useLanguage()`) exactly the way ReportCard.jsx/
// ProfileCard.jsx already pass `t` into their own module-level formatDate
// helpers — every call site (NotificationCard.jsx, NotificationGroup.jsx)
// is unchanged in relative-time logic, they just also had these two
// values available already at their call site to be passed in.
// ─────────────────────────────────────────────────────────────────────────

import { formatDate as formatDateIntl } from "./localeFormat.js";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

// Formats an ISO date string relative to now:
// Just now / N minutes ago / N hours ago / Yesterday / N days ago /
// N week(s) ago, falling back to a locale-aware date string beyond that.
export function formatRelativeTime(iso, t, lang, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = now - then;
  if (diffMs < 0) return formatDateIntl(iso, lang);

  const mins = Math.floor(diffMs / MINUTE);
  if (mins < 1) return t ? t("common:relativeTime.justNow") : "Just now";
  if (mins < 60) return t ? t("common:relativeTime.minutesAgo", { count: mins }) : `${mins} minutes ago`;

  const hours = Math.floor(diffMs / HOUR);
  if (hours < 24) return t ? t("common:relativeTime.hoursAgo", { count: hours }) : `${hours} hours ago`;

  const days = Math.floor(diffMs / DAY);
  if (days === 1) return t ? t("common:relativeTime.yesterday") : "Yesterday";
  if (days < 7) return t ? t("common:relativeTime.daysAgo", { count: days }) : `${days} days ago`;

  const weeks = Math.floor(diffMs / WEEK);
  if (weeks < 5) return t ? t("common:relativeTime.weeksAgo", { count: weeks }) : `${weeks} weeks ago`;

  return formatDateIntl(iso, lang);
}

export default formatRelativeTime;
