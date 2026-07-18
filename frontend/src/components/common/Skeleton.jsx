import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Skeleton (Phase 1 — Loading & Feedback)
//
// Reusable skeleton-loader primitives (a shimmering block, plus a couple
// of composed shapes for common layouts: a report-row skeleton and a
// report-card skeleton). Uses the project's existing `shimmer` @keyframes
// (already defined in styles/global.css but previously unused anywhere),
// so no new global CSS is added — only the moving-gradient background
// that consumes it lives here, scoped to this component.
// ─────────────────────────────────────────────────────────────────────────

function SkeletonBlock({ width = "100%", height = 14, radius = 6, style = {} }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width, height, borderRadius: radius,
        background: "linear-gradient(90deg, var(--nv-accent-wash, rgba(180,120,255,0.08)) 25%, var(--nv-surface-border, rgba(180,120,255,0.18)) 50%, var(--nv-accent-wash, rgba(180,120,255,0.08)) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// Skeleton for a single saved-report row (title + meta line + action pills).
function SkeletonReportRow() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      padding: 20, borderRadius: 16, border: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.12))", background: "var(--nv-surface-subtle, rgba(18,0,38,0.4))",
    }}>
      <div style={{ minWidth: 0, flex: 1, display: "grid", gap: 8 }}>
        <SkeletonBlock width="45%" height={16} />
        <SkeletonBlock width="70%" height={11} />
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <SkeletonBlock width={54} height={28} radius={20} />
        <SkeletonBlock width={54} height={28} radius={20} />
        <SkeletonBlock width={54} height={28} radius={20} />
      </div>
    </div>
  );
}

// Skeleton for a Recent Reports strip card (used while `reports === null`).
function SkeletonReportCard() {
  return (
    <div style={{
      padding: 18, minWidth: 220, flex: "0 0 auto", borderRadius: 16,
      border: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.12))", background: "var(--nv-surface-subtle, rgba(18,0,38,0.4))",
      display: "grid", gap: 10,
    }}>
      <SkeletonBlock width="70%" height={15} />
      <SkeletonBlock width="50%" height={11} />
      <SkeletonBlock width={64} height={26} radius={20} />
    </div>
  );
}

// Skeleton for a Saved Reports *grid*-view card (V1.0 polish) — mirrors
// ReportCard's "grid" variant shape (header strip with emblem + title,
// a badge row, an action row) so switching Saved Reports' view toggle to
// "Grid" while data is still loading doesn't show a mismatched (row-shaped)
// skeleton, and there's no layout shift once real cards arrive.
function SkeletonReportGridCard() {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden", border: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.12))",
      background: "var(--nv-surface-subtle, rgba(18,0,38,0.4))", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))",
      }}>
        <SkeletonBlock width={44} height={44} radius="50%" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1, display: "grid", gap: 8 }}>
          <SkeletonBlock width="75%" height={15} />
          <SkeletonBlock width="45%" height={10} />
        </div>
      </div>
      <div style={{ padding: "16px 20px", display: "flex", gap: 8, flex: 1 }}>
        <SkeletonBlock width={64} height={22} radius={20} />
        <SkeletonBlock width={72} height={22} radius={20} />
      </div>
      <div style={{ padding: "14px 20px 18px", display: "flex", gap: 8, borderTop: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.08))" }}>
        <SkeletonBlock width={54} height={28} radius={20} />
        <SkeletonBlock width={54} height={28} radius={20} />
        <SkeletonBlock width={54} height={28} radius={20} />
      </div>
    </div>
  );
}

function SkeletonList({ rows = 3, variant = "row" }) {
  const Item = variant === "card" ? SkeletonReportCard : variant === "grid" ? SkeletonReportGridCard : SkeletonReportRow;
  const wrapperStyle = variant === "card"
    ? { display: "flex", gap: 14, overflowX: "hidden" }
    : variant === "grid"
      ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }
      : { display: "grid", gap: 14 };
  return (
    <div style={{ ...wrapperStyle, animation: "fadeIn 0.3s ease both" }} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <Item key={i} />)}
    </div>
  );
}

export default memo(SkeletonList);
export { SkeletonBlock };
