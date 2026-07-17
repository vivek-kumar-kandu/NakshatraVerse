import { memo } from "react";
import GlassCard from "../GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// StatCard (V3.0 Phase 2 — Dashboard 3.0 & Home Experience)
//
// Reusable statistics tile — icon, headline value, small uppercase label,
// and an optional one-line hint underneath. Generalized from Dashboard's
// previous inline `StatTile` so Home's "Quick Summary" row and Dashboard's
// "Statistics" row render through the exact same component. Adds a subtle
// hover lift (existing `--nv-*` shadow/duration tokens only — no new
// tokens, no new keyframes) so the Statistics/Summary rows feel more
// alive without any behavior change.
// ─────────────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, hint, accent }) {
  return (
    <GlassCard
      className="tap-scale"
      style={{
        padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
        transition: "transform var(--nv-duration-base, 220ms) var(--nv-ease-standard, ease), box-shadow var(--nv-duration-base, 220ms) var(--nv-ease-standard, ease)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          background: accent ? `${accent}1f` : "var(--nv-accent-wash, rgba(123,47,255,0.15))",
          border: `1px solid ${accent ? `${accent}40` : "var(--nv-accent-border, rgba(180,120,255,0.3))"}`,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 17, fontWeight: 700, color: "var(--nv-text-primary, #e8d5ff)",
          fontFamily: "var(--nv-font-display, Cinzel,serif)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {value}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontSize: 11, marginTop: 2, color: "var(--nv-text-muted, rgba(200,160,255,0.45))" }}>
            {hint}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default memo(StatCard);
