// ─────────────────────────────────────────────────────────────────────────
// Notification Events (V4.4 Phase 2 — Intelligent Notification Generation)
//
// Read-State Synchronization: Notification Center, the Dashboard Widget,
// Command Palette, and ActionDock all read notification state from the
// same backend APIs (utils/notificationsApi.js) — there is no duplicated
// client-side notification store to keep in sync. What's missing is a way
// for one mounted component (e.g. Notification Center, after "Mark All
// Read") to tell an already-mounted sibling (e.g. the Dashboard Widget's
// unread badge) to refetch, without a full page reload/navigation. This
// is a tiny in-memory pub/sub for exactly that — it carries no
// notification data itself, only a "something changed, refetch" signal,
// so the backend API remains the single source of truth.
// ─────────────────────────────────────────────────────────────────────────

const listeners = new Set();

// Call after any mutation that changes read/unread or list contents:
// markRead, markAllRead, deleteNotification, deleteAllRead, generate.
export function notifyNotificationsChanged() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // A misbehaving listener should never break the notifier for others.
    }
  }
}

// Subscribe to change signals. Returns an unsubscribe function, meant to
// be called from a useEffect cleanup.
export function onNotificationsChanged(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export default { notifyNotificationsChanged, onNotificationsChanged };
