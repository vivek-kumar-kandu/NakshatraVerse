import { useEffect, useRef } from "react";
import GlassCard from "./GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ConfirmDialog (Phase 4 — Dashboard & Report Management)
//
// A small, accessible confirmation dialog. Previously, Dashboard's delete
// action used the browser's native `window.confirm()` — functional, but
// unstyled and inconsistent with the rest of this app's premium visual
// language. This replaces it 1:1 at the single call site that used it:
// same two outcomes (confirm/cancel), same "This can't be undone" copy,
// same underlying `reportsApi.deleteReport()` call once confirmed — only
// the presentation changed.
//
// `role="alertdialog"`, focus is moved to the dialog on open and returned
// to the triggering element on close, Escape cancels, and the backdrop is
// click-to-cancel. No other part of the app currently has a modal, so this
// is intentionally self-contained rather than a generic portal system.
// ─────────────────────────────────────────────────────────────────────────

// Small inline spinner for the confirm button's loading state. Reuses the
// same global `spin` keyframe (styles/global.css) already used elsewhere
// in this app (e.g. ReportCard's action-button spinner) — no new CSS
// dependency, no new keyframe.
function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block", width: 12, height: 12, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

// Phase 6.4 addition: `loadingLabel` is optional and defaults to
// "Deleting…" — byte-for-byte the same hardcoded text this component
// always showed before, so Dashboard's existing delete-confirmation call
// site (which doesn't pass this prop) renders identically. Settings page's
// Clear Cache / Reset Preferences actions pass their own accurate labels
// ("Clearing…" / "Resetting…") instead of the misleading default.
function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, loading = false, loadingLabel = "Deleting…", onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    dialogRef.current?.focus();
    const handleKey = (e) => {
      // While a delete request is in flight, Escape is ignored — this is
      // the same "prevent duplicate/conflicting actions while busy" guard
      // as the disabled buttons below, just for the keyboard path.
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previouslyFocused.current?.focus) previouslyFocused.current.focus();
    };
  }, [open, onCancel, loading]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 3000, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
        background: "var(--nv-overlay-scrim, rgba(5,0,15,0.6))", backdropFilter: "blur(var(--nv-scrim-blur, 4px))", WebkitBackdropFilter: "blur(var(--nv-scrim-blur, 4px))",
        animation: "fadeIn 0.18s ease both",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
        ref={dialogRef}
        className="confirm-dialog-pop"
        style={{ width: "min(360px, 100%)" }}
      >
        <GlassCard style={{ padding: "var(--nv-space-6, 26px)", boxShadow: "var(--nv-elevation-3, var(--nv-shadow-lg))" }}>
          <h2 id="confirm-dialog-title" style={{ margin: "0 0 10px", fontSize: 17, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "var(--nv-font-display, Cinzel,serif)" }}>
            {title}
          </h2>
          <p id="confirm-dialog-message" style={{ margin: "0 0 22px", fontSize: 13.5, lineHeight: "var(--nv-leading-normal, 1.5)", color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>
            {message}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="pill-btn tap-scale"
              style={{
                padding: "10px 18px", borderRadius: "var(--nv-radius-pill, 20px)", fontSize: 13, cursor: loading ? "default" : "pointer",
                border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "transparent", color: "var(--nv-text-primary, #e8d5ff)",
                fontFamily: "var(--nv-font-body, Inter,sans-serif)", opacity: loading ? 0.5 : 1,
              }}
            >
              {cancelLabel}
            </button>
            {/* Disabled after the first click + spinner/"Deleting…" label
                while the request is in flight — also the guard that
                prevents a duplicate delete request from a second click. */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              aria-busy={loading}
              className="pill-btn tap-scale"
              style={{
                padding: "10px 18px", borderRadius: "var(--nv-radius-pill, 20px)", fontSize: 13, cursor: loading ? "default" : "pointer", fontWeight: 600,
                border: danger ? "1px solid var(--nv-danger-border, rgba(255,100,100,0.45))" : "1px solid var(--nv-accent-border, rgba(180,120,255,0.45))",
                background: danger ? "var(--nv-danger-gradient, linear-gradient(135deg, #a02020, #601010))" : "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
                color: "var(--nv-text-on-accent, #fff)", fontFamily: "var(--nv-font-body, Inter,sans-serif)",
                display: "inline-flex", alignItems: "center", gap: 8,
                opacity: loading ? 0.85 : 1,
              }}
            >
              {loading && <ButtonSpinner />}
              {loading ? loadingLabel : confirmLabel}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default ConfirmDialog;
