import { useCallback, useEffect, useState } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import GlassCard from "../GlassCard.jsx";
import Badge from "../Badge.jsx";
import SkeletonList from "../Skeleton.jsx";
import * as notificationsApi from "../../../utils/notificationsApi.js";
import { CATEGORY_META, PRIORITY_META } from "../../../utils/notificationConstants.js";
import { notifyNotificationsChanged, onNotificationsChanged } from "../../../utils/notificationEvents.js";

// ─────────────────────────────────────────────────────────────────────────
// NotificationsWidget (V4.4 Phase 1 — Notification Infrastructure)
// Dashboard widget mirroring FamilyProfilesWidget.jsx's exact shape (self-
// fetching, GlassCard shell, header + body + footer link). Shows unread
// count, the latest notification, its priority badge, and a link to the
// full Notification Center.
//
// V4.4 Phase 2 — Read-State Synchronization: this widget both listens for
// (onNotificationsChanged) and announces (notifyNotificationsChanged)
// notification-state changes, so marking something read/all-read in the
// Notification Center updates this widget's unread badge live, and vice
// versa, without a page reload. See utils/notificationEvents.js's header.
// ─────────────────────────────────────────────────────────────────────────

function NotificationsWidget({ onOpenNotifications }) {
<<<<<<< HEAD
=======
  const { t } = useTranslation(["notifications"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  const [unreadCount, setUnreadCount] = useState(null);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([notificationsApi.getUnreadCount(), notificationsApi.getLatest()])
      .then(([count, notification]) => { setUnreadCount(count); setLatest(notification); setError(false); })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    // V4.4 Phase 2: ask the backend to generate any newly-eligible
    // notifications first. Best-effort — if generation fails (e.g. no
    // saved chart yet, AI Life Coach unreachable), we still fall back to
    // whatever notifications already exist.
    notificationsApi.generateNotifications()
      .catch(() => {})
      .finally(() => {
        refresh();
        notifyNotificationsChanged();
      });
  }, [refresh]);

  useEffect(() => onNotificationsChanged(refresh), [refresh]);

  const priorityMeta = latest ? (PRIORITY_META[latest.priority] || PRIORITY_META.medium) : null;
  const categoryMeta = latest ? (CATEGORY_META[latest.category] || CATEGORY_META.general) : null;

  return (
    <GlassCard style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif" }}>
<<<<<<< HEAD
          🔔 Notifications
        </h3>
        {unreadCount !== null && (
          <span style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
            {unreadCount} unread
=======
          {t("notifications:widget.title")}
        </h3>
        {unreadCount !== null && (
          <span style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
            {t("notifications:widget.unreadCount", { count: unreadCount })}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </span>
        )}
      </div>

<<<<<<< HEAD
      {error && <p style={{ fontSize: 12.5, color: "var(--nv-danger, #ff8888)" }}>Could not load notifications.</p>}
=======
      {error && <p style={{ fontSize: 12.5, color: "var(--nv-danger, #ff8888)" }}>{t("notifications:widget.loadFailed")}</p>}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)

      {!error && unreadCount === null && <SkeletonList rows={1} variant="row" />}

      {!error && unreadCount !== null && !latest && (
        <p style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", margin: "0 0 14px" }}>
<<<<<<< HEAD
          No notifications yet — you're all caught up.
=======
          {t("notifications:widget.emptyMessage")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </p>
      )}

      {!error && latest && (
        <button
          onClick={onOpenNotifications}
          className="tap-scale"
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
            width: "100%", padding: "9px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,120,255,0.16)",
            color: "var(--nv-text-primary, #e8d5ff)", font: "inherit", fontSize: 13, marginBottom: 14,
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
            {categoryMeta.icon} {latest.title}
          </span>
<<<<<<< HEAD
          <Badge color={priorityMeta.color} style={{ flexShrink: 0 }}>{priorityMeta.label}</Badge>
=======
          <Badge color={priorityMeta.color} style={{ flexShrink: 0 }}>{t(`notifications:priorities.${latest.priority}`, priorityMeta.label)}</Badge>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </button>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onOpenNotifications}
          className="pill-btn tap-scale"
          style={{ flex: "1 1 100%", padding: "8px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer", border: "1px solid transparent", background: "transparent", color: "var(--nv-text-secondary, rgba(210,175,255,0.76))", fontFamily: "Inter,sans-serif" }}
        >
<<<<<<< HEAD
          Open Notification Center →
=======
          {t("notifications:widget.openCenter")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </button>
      </div>
    </GlassCard>
  );
}

export default NotificationsWidget;
