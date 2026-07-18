import { useCallback, useEffect, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import SkeletonList from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import NotificationCard from "../components/notifications/NotificationCard.jsx";
import NotificationGroup from "../components/notifications/NotificationGroup.jsx";
import * as notificationsApi from "../utils/notificationsApi.js";
import { CATEGORIES, CATEGORY_META, PRIORITIES, PRIORITY_META } from "../utils/notificationConstants.js";
import { useToast } from "../components/common/Toast.jsx";
import { notifyNotificationsChanged, onNotificationsChanged } from "../utils/notificationEvents.js";

// ─────────────────────────────────────────────────────────────────────────
// NotificationCenterPage (V4.4 Phase 1 — Notification Infrastructure)
//
// Fully self-contained, same rationale as PanchangPage/MatchingPage — no
// existing chart/report context needed, reachable from Dashboard,
// CommandPalette, and ActionDock with nothing more than a stage change
// (see App.jsx). All data comes from /api/notifications via
// utils/notificationsApi.js; this page only fetches, holds UI state, and
// renders.
//
// The filter/sort/pagination bar below is a purpose-built control (not a
// reuse of components/common/SearchFilterBar.jsx) because that component
// is hard-wired to Saved Reports' SORT_OPTIONS and view-toggle — it isn't
// a generic bar. This uses the exact same visual language (same input/
// select styling, same layout shape) so it reads as the same design
// system throughout.
// ─────────────────────────────────────────────────────────────────────────

const selectStyle = {
  padding: "10px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
  border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
  color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", appearance: "none",
};

const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "priority", label: "Priority" },
];

function NotificationCenterPage({ onBack, onNavigate }) {
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [readStatus, setReadStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [notifications, setNotifications] = useState(null); // null = loading
  const [groups, setGroups] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [error, setError] = useState(null);
  const [confirmClearRead, setConfirmClearRead] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(() => {
    setError(null);
    notificationsApi.listNotifications({
      search: query, category, priority, isRead: readStatus, sort, page, limit: 10, group: true,
    })
      .then((res) => {
        setNotifications(res.notifications);
        setGroups(res.groups || res.notifications.map((n) => ({ notification: n })));
        setPagination(res.pagination);
      })
      .catch((err) => setError(err.message || "Could not load notifications."));
  }, [query, category, priority, readStatus, sort, page]);

  useEffect(() => { load(); }, [load]);

  // V4.4 Phase 2 — Read-State Synchronization: refetch whenever another
  // mounted surface (e.g. the Dashboard Widget's own generate-on-mount
  // call) announces a change, so this page never shows stale unread state.
  useEffect(() => onNotificationsChanged(load), [load]);

  // Reset to page 1 whenever a filter changes (not on page changes themselves).
  useEffect(() => { setPage(1); }, [query, category, priority, readStatus, sort]);

  const patchGroups = useCallback((updater) => {
    setGroups((prev) => {
      if (!prev) return prev;
      const next = prev.map((item) => {
        if (item.notifications) {
          const updated = item.notifications.map(updater).filter(Boolean);
          return updated.length ? { ...item, notifications: updated } : null;
        }
        const updated = updater(item.notification);
        return updated ? { notification: updated } : null;
      });
      return next.filter(Boolean);
    });
  }, []);

  const handleMarkRead = useCallback((id) => {
    setNotifications((prev) => prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? prev);
    patchGroups((n) => (n.id === id ? { ...n, isRead: true } : n));
    notificationsApi.markRead(id)
      .then(() => notifyNotificationsChanged())
      .catch((err) => {
        toast?.error?.(err.message || "Could not mark notification as read.");
        load();
      });
  }, [toast, load, patchGroups]);

  const handleMarkAllRead = useCallback(() => {
    notificationsApi.markAllRead()
      .then(() => { toast?.success?.("All notifications marked as read."); load(); notifyNotificationsChanged(); })
      .catch((err) => toast?.error?.(err.message || "Could not mark all as read."));
  }, [toast, load]);

  const handleDelete = useCallback((id) => {
    setNotifications((prev) => prev?.filter((n) => n.id !== id) ?? prev);
    patchGroups((n) => (n.id === id ? null : n));
    notificationsApi.deleteNotification(id)
      .then(() => { load(); notifyNotificationsChanged(); })
      .catch((err) => {
        toast?.error?.(err.message || "Could not delete notification.");
        load();
      });
  }, [toast, load, patchGroups]);

  const handleClearRead = useCallback(() => {
    setClearing(true);
    notificationsApi.deleteAllRead()
      .then(() => { toast?.success?.("Read notifications cleared."); setConfirmClearRead(false); load(); notifyNotificationsChanged(); })
      .catch((err) => toast?.error?.(err.message || "Could not clear read notifications."))
      .finally(() => setClearing(false));
  }, [toast, load]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "84px 16px 100px", display: "grid", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            className="pill-btn tap-scale"
            style={{
              background: "rgba(20,0,40,0.55)", border: "1px solid rgba(180,120,255,0.35)",
              color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13,
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>🔔 Notification Center</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              {pagination.total} notification{pagination.total === 1 ? "" : "s"} total
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <GlassCard style={{ padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 10 }}>
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <span aria-hidden="true" style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", pointerEvents: "none",
            }}>
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notifications…"
              aria-label="Search notifications"
              style={{
                width: "100%", padding: "10px 14px 10px 36px", borderRadius: 20, fontSize: 13,
                border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
                color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
              }}
            />
          </div>

          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" style={selectStyle}>
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_META[c]?.icon} {CATEGORY_META[c]?.label || c}</option>)}
          </select>

          <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority" style={selectStyle}>
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p]?.label || p}</option>)}
          </select>

          <select value={readStatus} onChange={(e) => setReadStatus(e.target.value)} aria-label="Filter by read status" style={selectStyle}>
            <option value="all">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort notifications" style={selectStyle}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </GlassCard>

        {/* Bulk actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleMarkAllRead}
            className="pill-btn tap-scale"
            style={{ padding: "9px 16px", borderRadius: 18, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.15)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
          >
            ✓ Mark All Read
          </button>
          <button
            onClick={() => setConfirmClearRead(true)}
            className="pill-btn tap-scale"
            style={{ padding: "9px 16px", borderRadius: 18, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,80,80,0.3)", background: "rgba(120,20,20,0.18)", color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif" }}
          >
            🗑️ Clear Read
          </button>
        </div>

        {/* List */}
        {error && (
          <EmptyState icon="⚠️" title="Could not load notifications" message={error} actionLabel="Retry" onAction={load} />
        )}

        {!error && notifications === null && <SkeletonList rows={4} variant="row" />}

        {!error && notifications?.length === 0 && (
          <EmptyState icon="🔔" title="No notifications" message="You're all caught up — nothing here matches your current filters." />
        )}

        {!error && notifications?.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {(groups || notifications.map((n) => ({ notification: n }))).map((item) => (
              item.notifications ? (
                <NotificationGroup
                  key={item.groupKey}
                  group={item}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onOpen={onNavigate ? (notification) => {
                    if (!notification.isRead) handleMarkRead(notification.id);
                    // V4.5 Phase 1B (Festival Frontend Integration): pass
                    // the full metadata object (not just `destination`)
                    // so a Festival notification can be routed to the
                    // correct festival + date instead of the generic
                    // `destination` the backend already stores for it.
                    // Backend notification data/logic is untouched.
                    onNavigate(notification.metadata.destination, notification.metadata);
                  } : undefined}
                />
              ) : (
                <NotificationCard
                  key={item.notification.id}
                  notification={item.notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onOpen={onNavigate ? (notification) => {
                    if (!notification.isRead) handleMarkRead(notification.id);
                    onNavigate(notification.metadata.destination, notification.metadata);
                  } : undefined}
                />
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {!error && pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="pill-btn tap-scale"
              style={{ padding: "8px 14px", borderRadius: 16, fontSize: 12.5, cursor: pagination.page <= 1 ? "default" : "pointer", opacity: pagination.page <= 1 ? 0.4 : 1, border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.1)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="pill-btn tap-scale"
              style={{ padding: "8px 14px", borderRadius: 16, fontSize: 12.5, cursor: pagination.page >= pagination.totalPages ? "default" : "pointer", opacity: pagination.page >= pagination.totalPages ? 0.4 : 1, border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.1)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmClearRead}
        title="Clear read notifications?"
        message="This deletes every read notification. This can't be undone."
        confirmLabel="Clear Read"
        loadingLabel="Clearing…"
        danger
        loading={clearing}
        onConfirm={handleClearRead}
        onCancel={() => setConfirmClearRead(false)}
      />
    </div>
  );
}

export default NotificationCenterPage;
