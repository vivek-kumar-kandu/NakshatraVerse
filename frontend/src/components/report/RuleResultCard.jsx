import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";

// ─────────────────────────────────────────────────────────────────────────
// RuleResultCard (V3.0 Phase 3 — reusable report component)
//
// Renders one backend Rule Engine finding — a detected Yoga or Dosha —
// exactly as `report.chart.yogas[]` / `report.chart.doshas[]` already
// return it: `{ name, detail }`. No detection or interpretation happens
// here, only display. `kind` only changes the accent color/icon.
// ─────────────────────────────────────────────────────────────────────────
function RuleResultCard({ name, detail, kind = "yoga", idx = 0 }) {
  const color = kind === "dosha" ? "#ff8f7e" : "#c9ff7e";
  const icon = kind === "dosha" ? "🧿" : "⭐";
  return (
    <GlassCard style={{ padding: 16, borderLeft: `3px solid ${color}`, borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
      animation: `fadeIn 0.35s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>{icon}</span>
        <h4 style={{ margin: 0, fontSize: 13.5, color, fontFamily: "Cinzel,serif", fontWeight: 600, flex: 1 }}>{name}</h4>
        <Badge color={color}>{kind === "dosha" ? "Dosha" : "Yoga"}</Badge>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.8))", fontFamily: "Inter,sans-serif" }}>
        {detail}
      </p>
    </GlassCard>
  );
}

export default memo(RuleResultCard);
