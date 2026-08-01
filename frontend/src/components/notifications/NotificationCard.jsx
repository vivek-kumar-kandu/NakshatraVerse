import { memo } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import { CATEGORY_META, PRIORITY_META } from "../../utils/notificationConstants.js";
import { formatRelativeTime } from "../../utils/relativeTime.js";
<<<<<<< HEAD
=======
import { useLanguage } from "../../context/LanguageContext.jsx";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)

// ─────────────────────────────────────────────────────────────────────────
// NotificationCard (V4.4 Phase 1 — Notification Infrastructure)
// A single notification row. Built from the existing GlassCard/Badge
// primitives, same visual language as ReportCard/FamilyProfilesWidget's
// row items. Purely presentational — all state (read/unread, deletion)
// lives in NotificationCenterPage; this component only renders and calls
// back up.
//
// V4.4 Phase 2 — Relative Time now comes from the one shared formatter
// (utils/relativeTime.js) instead of a locally-defined timeAgo, so every
// surface that shows a notification's age formats it identically.
// ─────────────────────────────────────────────────────────────────────────

function NotificationCard({ notification, onMarkRead, onDelete, onOpen }) {
<<<<<<< HEAD
=======
  const { t } = useTranslation(["notifications", "common"]);
  const { language } = useLanguage();
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  const categoryMeta = CATEGORY_META[notification.category] || CATEGORY_META.general;
  const priorityMeta = PRIORITY_META[notification.priority] || PRIORITY_META.medium;

  return (
    <GlassCard
      style={{
        padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start",
        borderColor: notification.isRead ? undefined : "rgba(255,215,0,0.35)",
        animation: "fadeIn 0.3s ease both",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0, fontSize: 17,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--nv-accent-wash, rgba(123,47,255,0.15))",
          border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))",
        }}
      >
        {categoryMeta.icon}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          {!notification.isRead && (
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffd700", flexShrink: 0 }} />
          )}
          <h3 style={{
            margin: 0, fontSize: 14, fontFamily: "Cinzel,serif",
            color: "var(--nv-text-primary, #e8d5ff)", fontWeight: notification.isRead ? 500 : 700,
          }}>
            {notification.title}
          </h3>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 12.5, lineHeight: 1.5, color: "var(--nv-text-secondary, rgba(210,175,255,0.76))" }}>
          {notification.message}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
<<<<<<< HEAD
          <Badge color={priorityMeta.color}>{priorityMeta.label}</Badge>
          <Badge color="#9dc9ff">{categoryMeta.label}</Badge>
          <span style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>
            {formatRelativeTime(notification.createdAt)}
=======
          <Badge color={priorityMeta.color}>{t(`notifications:priorities.${notification.priority}`, priorityMeta.label)}</Badge>
          <Badge color="#9dc9ff">{t(`notifications:categories.${notification.category}`, categoryMeta.label)}</Badge>
          <span style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>
            {formatRelativeTime(notification.createdAt, t, language)}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {onOpen && notification.metadata?.destination && (
          <button
            onClick={() => onOpen(notification)}
            className="pill-btn tap-scale"
<<<<<<< HEAD
            title="Open"
            aria-label="Open related module"
=======
            title={t("notifications:card.openTitle")}
            aria-label={t("notifications:card.openAriaLabel")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
            style={{
              padding: "6px 10px", borderRadius: 14, fontSize: 11.5, cursor: "pointer",
              border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.15)",
              color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
            }}
          >
<<<<<<< HEAD
            Open →
=======
            {t("notifications:card.open")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </button>
        )}
        {!notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="pill-btn tap-scale"
<<<<<<< HEAD
            title="Mark as read"
            aria-label="Mark as read"
=======
            title={t("notifications:card.markReadTitle")}
            aria-label={t("notifications:card.markReadTitle")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
            style={{
              padding: "6px 10px", borderRadius: 14, fontSize: 11.5, cursor: "pointer",
              border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.15)",
              color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
            }}
          >
<<<<<<< HEAD
            ✓ Read
=======
            {t("notifications:card.markReadLabel")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="pill-btn tap-scale"
<<<<<<< HEAD
          title="Delete notification"
          aria-label="Delete notification"
=======
          title={t("notifications:card.deleteTitle")}
          aria-label={t("notifications:card.deleteAriaLabel")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          style={{
            padding: "6px 10px", borderRadius: 14, fontSize: 11.5, cursor: "pointer",
            border: "1px solid rgba(255,80,80,0.3)", background: "rgba(120,20,20,0.2)",
            color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif",
          }}
        >
          🗑️
        </button>
      </div>
    </GlassCard>
  );
}

export default memo(NotificationCard);
