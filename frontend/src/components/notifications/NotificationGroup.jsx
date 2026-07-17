import { useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import NotificationCard from "./NotificationCard.jsx";
import { CATEGORY_META } from "../../utils/notificationConstants.js";
import { formatRelativeTime } from "../../utils/relativeTime.js";

// ─────────────────────────────────────────────────────────────────────────
// NotificationGroup (V4.4 Phase 2 — Intelligent Notification Generation)
//
// Renders a cluster of notifications that share metadata.groupKey (e.g.
// "Today's Panchang": Rahu Kaal + Brahma Muhurat + Abhijit Muhurat + …) as
// one collapsible card instead of N separate NotificationCards, per the
// Notification Grouping requirement. Built entirely from the existing
// GlassCard/Badge/NotificationCard primitives — no new visual language,
// same rationale as NotificationCard.jsx's own header comment.
// Collapsed by default with the most recent item's relative time shown;
// expanding reveals every notification in the group as normal
// NotificationCards (mark-read/delete/open all still work per-item).
// ─────────────────────────────────────────────────────────────────────────

function NotificationGroup({ group, onMarkRead, onDelete, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const { groupLabel, notifications } = group;
  const unreadInGroup = notifications.filter((n) => !n.isRead).length;
  const categoryMeta = CATEGORY_META[notifications[0]?.category] || CATEGORY_META.general;
  const mostRecent = notifications[0];

  return (
    <GlassCard style={{ padding: "14px 18px", display: "grid", gap: 10 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="tap-scale"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          width: "100%", background: "transparent", border: "none", cursor: "pointer",
          padding: 0, textAlign: "left", font: "inherit", color: "var(--nv-text-primary, #e8d5ff)",
        }}
        aria-expanded={expanded}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span aria-hidden="true" style={{ fontSize: 17 }}>{categoryMeta.icon}</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "Cinzel,serif", fontSize: 14, fontWeight: 700 }}>
              {groupLabel}
            </span>
            <span style={{ fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              {notifications.length} update{notifications.length === 1 ? "" : "s"} · {formatRelativeTime(mostRecent?.createdAt)}
            </span>
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {unreadInGroup > 0 && <Badge color="#ffd700">{unreadInGroup} unread</Badge>}
          <span aria-hidden="true" style={{ fontSize: 13, opacity: 0.7 }}>{expanded ? "▲" : "▼"}</span>
        </span>
      </button>

      {expanded && (
        <div style={{ display: "grid", gap: 8, paddingLeft: 4 }}>
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default NotificationGroup;
