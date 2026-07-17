import { memo } from "react";
import GlassCard from "./GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// EmptyState (V1.0 — Skeleton Loaders & Empty States polish)
//
// A single, reusable "nothing here yet" presentation — a subtle icon, a
// short title, one line of supporting copy, and an optional call-to-action
// button. Used everywhere the Dashboard previously showed a plain
// one-line message: no reports yet, no search matches, and (in
// ReportPreviewDrawer) no extra detail to preview. Purely presentational,
// exactly like `GlassCard`/`Badge` already are — no data fetching, no
// business logic, no new backend calls.
//
// Built on the existing `GlassCard` + the existing `fadeIn` keyframe
// (styles/global.css) so it matches the app's current visual language
// and animates in the same way loading/content already do — this is what
// keeps the Loading → Empty → Content swap from feeling abrupt.
// ─────────────────────────────────────────────────────────────────────────

function EmptyState({ icon = "✦", title, message, actionLabel, onAction, compact = false }) {
  return (
    <GlassCard
      style={{
        padding: compact ? "26px 22px" : "40px 28px",
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        animation: "fadeIn 0.35s ease both",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: compact ? 18 : 22, color: "var(--nv-color-brand-gold, #ffd700)",
          background: "linear-gradient(135deg, rgba(123,47,255,0.28), rgba(255,180,0,0.12))",
          border: "1px solid rgba(255,215,0,0.25)",
          boxShadow: "var(--nv-shadow-glow-purple, 0 0 20px rgba(123,47,255,0.3))",
          marginBottom: 4,
        }}
      >
        {icon}
      </div>

      {title && (
        <h3 style={{ margin: 0, fontSize: compact ? 14 : 15.5, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif", fontWeight: 700 }}>
          {title}
        </h3>
      )}

      {message && (
        <p style={{
          margin: 0, maxWidth: 360, fontSize: compact ? 12.5 : 13.5, lineHeight: 1.55,
          color: "var(--nv-text-muted, rgba(200,160,255,0.6))",
        }}>
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="pill-btn tap-scale"
          style={{
            marginTop: 6, padding: "10px 20px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
            cursor: "pointer", border: "1px solid var(--nv-accent-wash-strong, rgba(180,120,255,0.4))",
            background: "var(--nv-accent-wash, rgba(123,47,255,0.18))", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
          }}
        >
          {actionLabel}
        </button>
      )}
    </GlassCard>
  );
}

export default memo(EmptyState);
