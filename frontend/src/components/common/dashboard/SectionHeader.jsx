import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// SectionHeader (V3.0 Phase 2 — Dashboard 3.0 & Home Experience)
//
// Reusable section-title row used across Dashboard/Home: an uppercase
// eyebrow-style heading, an optional icon, and an optional trailing
// "View All →" style action. Extracted from DashboardPage's inline
// `SectionHeading` so Home and Dashboard share one implementation instead
// of two near-identical ones. Purely presentational — no data fetching,
// no navigation logic (the caller supplies `onAction`).
// ─────────────────────────────────────────────────────────────────────────
function SectionHeader({ icon, children, actionLabel, onAction, style = {} }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, marginBottom: 14, ...style,
    }}>
      <h2 style={{
        margin: 0, fontSize: "var(--nv-text-sm, 14px)", letterSpacing: 1.5, textTransform: "uppercase",
        color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontWeight: "var(--nv-weight-medium, 500)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {icon && <span aria-hidden="true" style={{ fontSize: 15 }}>{icon}</span>}
        {children}
      </h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontSize: 12.5,
            fontFamily: "var(--nv-font-body, Inter,sans-serif)", fontWeight: 600, flexShrink: 0,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default memo(SectionHeader);
