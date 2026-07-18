import { memo } from "react";
import GlassCard from "../GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ActivityCard (V3.0 Phase 2 — Dashboard 3.0 & Home Experience)
//
// A compact "single piece of activity" row — icon, title, one-line
// subtitle, a right-aligned timestamp, and an optional click target.
// Used by Home's "Last Generated Report" summary. (Dashboard's own
// Recent Reports rail continues to use the existing, more detailed
// `ReportCard` — this is a lighter-weight sibling for contexts that only
// need a single-line preview, not a full report action row.)
// ─────────────────────────────────────────────────────────────────────────
function ActivityCard({ icon = "📜", title, subtitle, meta, onClick }) {
  const interactive = typeof onClick === "function";
  return (
    <GlassCard
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } } : undefined}
      className={interactive ? "tap-scale" : ""}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
        textAlign: "left", cursor: interactive ? "pointer" : "default", width: "100%",
        border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.18))",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          background: "var(--nv-accent-wash, rgba(123,47,255,0.15))",
          border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: "var(--nv-text-primary, #e8d5ff)",
          fontFamily: "var(--nv-font-display, Cinzel,serif)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2,
          }}>
            {subtitle}
          </div>
        )}
      </div>
      {meta && (
        <div style={{ fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", flexShrink: 0 }}>
          {meta}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(ActivityCard);
