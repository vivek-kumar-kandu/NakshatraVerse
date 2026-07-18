import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";

const REMEDY_ICONS = {
  Mantra: "🕉️", Gemstone: "💎", Fasting: "🌙", Charity: "🤲", Deity: "🛕",
};

function iconFor(type) {
  const key = Object.keys(REMEDY_ICONS).find((k) => type?.toLowerCase().includes(k.toLowerCase()));
  return REMEDY_ICONS[key] || "🪬";
}

// ─────────────────────────────────────────────────────────────────────────
// RemedyCard (V3.0 Phase 3 — reusable report component)
//
// Renders one entry of `report.chart.remedies[]` — `{ type, detail }` —
// exactly as the backend Remedy Rule Evaluator already computed it. This
// replaces the Remedies tab's previous static/hardcoded example list with
// the real backend-generated remedies, per the "use only backend-generated
// information" constraint.
// ─────────────────────────────────────────────────────────────────────────
function RemedyCard({ type, detail, idx = 0 }) {
  return (
    <GlassCard style={{ padding: 16, animation: `fadeIn 0.35s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>{iconFor(type)}</span>
        <Badge color="#ffb347">{type}</Badge>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.8))", fontFamily: "Inter,sans-serif" }}>
        {detail}
      </p>
    </GlassCard>
  );
}

export default memo(RemedyCard);
