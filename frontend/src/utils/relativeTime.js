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
// ─────────────────────────────────────────────────────────────────────────

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

// Formats an ISO date string relative to now:
// Just now / N minutes ago / N hours ago / Yesterday / N days ago /
// N week(s) ago, falling back to a locale date string beyond that.
export function formatRelativeTime(iso, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = now - then;
  if (diffMs < 0) return new Date(iso).toLocaleDateString();

  const mins = Math.floor(diffMs / MINUTE);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;

  const hours = Math.floor(diffMs / HOUR);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(diffMs / DAY);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(diffMs / WEEK);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;

  return new Date(iso).toLocaleDateString();
}

export default formatRelativeTime;
