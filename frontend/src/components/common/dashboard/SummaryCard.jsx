import { memo } from "react";
import GlassCard from "../GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// SummaryCard (V3.0 Phase 2 — Dashboard 3.0 & Home Experience)
//
// A reusable "icon + title (+ optional badge) + body content" card, used
// for Dashboard's Astrology Summary block and Home's Quick Summary block.
// Purely presentational — it renders whatever `children` the caller
// passes (rows, badges, etc. built from existing components like
// InsightRow/Badge), it never fetches or computes astrology data itself.
// ─────────────────────────────────────────────────────────────────────────
function SummaryCard({ icon, title, action, children, style = {} }) {
  return (
    <GlassCard style={{ padding: "22px 24px", animation: "fadeIn 0.35s ease both", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && <span aria-hidden="true" style={{ fontSize: 20 }}>{icon}</span>}
          <h3 style={{
            margin: 0, fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase",
            color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "var(--nv-font-body, Inter,sans-serif)",
            fontWeight: "var(--nv-weight-medium, 500)",
          }}>
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </GlassCard>
  );
}

export default memo(SummaryCard);
