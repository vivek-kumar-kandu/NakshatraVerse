import { createContext, useCallback, useContext, useMemo, useRef, useState, memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Toast (Phase 1 — Loading & Feedback)
//
// A small, self-contained toast notification system: a <ToastProvider>
// (mount once, at the app root) exposing a `useToast()` hook with
// `toast.success(msg)` / `toast.error(msg)` / `toast.info(msg)`, plus a
// fixed-position stacked viewport that renders above everything else.
//
// This app previously had no shared toast system — async/operational
// errors (Dashboard list/delete/download failures, etc.) were rendered as
// plain inline `<p role="alert">` text with no auto-dismiss, no stacking,
// and no consistent animation. This component is purely additive: nothing
// existing imports or depends on it yet, so nothing breaks by adding it.
// It is then wired into the specific call sites that benefit most from a
// transient, dismissible notification (see CHANGELOG / PROJECT_STATUS).
//
// Deliberately NOT used for inline field-validation errors (email format,
// required fields, etc.) — those stay next to the field they describe,
// which is the correct pattern for that kind of feedback and is untouched
// here.
// ─────────────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

const KIND_STYLES = {
  success: { border: "rgba(120,255,120,0.35)", bg: "rgba(20,60,20,0.88)", color: "var(--nv-success, #c8ffc8)", icon: "✓" },
  error:   { border: "rgba(255,80,80,0.35)",   bg: "rgba(120,20,20,0.88)", color: "var(--nv-danger, #ffaaaa)", icon: "⚠" },
  info:    { border: "var(--nv-accent-border, rgba(180,120,255,0.35))", bg: "rgba(40,10,70,0.88)",  color: "var(--nv-text-primary, #e8d5ff)", icon: "✦" },
};

let idSeq = 0;

function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        position: "fixed", top: 16, right: 16, left: 16, zIndex: 2000,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }
        .toast-item { animation: toastSlideIn 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .toast-item.leaving { animation: toastSlideOut 0.18s cubic-bezier(0.22,1,0.36,1) both; }
        .toast-dismiss { transition: opacity var(--nv-duration-fast) var(--nv-ease-standard); }
        .toast-dismiss:hover { opacity: 1 !important; }
        @media (prefers-reduced-motion: reduce) {
          .toast-item, .toast-item.leaving { animation: none !important; }
        }
      `}</style>
      {toasts.map((t) => {
        const s = KIND_STYLES[t.kind] || KIND_STYLES.info;
        return (
          <div
            key={t.id}
            role="alert"
            className={`toast-item${t.leaving ? " leaving" : ""}`}
            style={{
              pointerEvents: "auto",
              width: "min(360px, 100%)",
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: 12,
              background: s.bg, border: `1px solid ${s.border}`, color: s.color,
              fontFamily: "Inter,sans-serif", fontSize: 13, lineHeight: 1.4,
              backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))", WebkitBackdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
              boxShadow: "var(--nv-elevation-5, var(--nv-shadow-xl, 0 8px 32px rgba(0,0,0,0.35)))",
            }}
          >
            <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 14, marginTop: 1 }}>{s.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="toast-dismiss icon-btn"
              style={{
                flexShrink: 0, background: "none", border: "none", color: "inherit",
                opacity: 0.6, cursor: "pointer", fontSize: 14, lineHeight: 1,
                padding: 6, margin: -6, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    // Mark as leaving first so the exit animation can play, then remove
    // from state shortly after — matches the timing of `toastSlideOut`.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 180);
    const existing = timers.current.get(id);
    if (existing) { clearTimeout(existing); timers.current.delete(id); }
  }, []);

  const push = useCallback((message, kind = "info", duration = 4500) => {
    const id = ++idSeq;
    setToasts((prev) => [...prev, { id, message, kind, leaving: false }]);
    if (duration > 0) {
      const handle = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, handle);
    }
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (msg, duration) => push(msg, "success", duration),
    error: (msg, duration) => push(msg, "error", duration),
    info: (msg, duration) => push(msg, "info", duration),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft rather than crashing the app if something ever renders
    // outside the provider — logs once to the console instead.
    return { success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} };
  }
  return ctx;
}

export default memo(ToastProvider);
