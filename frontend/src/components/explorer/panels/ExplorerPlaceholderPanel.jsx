import { memo } from "react";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import InsightRow from "../../common/InsightRow.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerPlaceholderPanel (V5.0 Phase 5A — Explorer Infrastructure)
//
// Shared placeholder body reused by every per-type detail panel
// (Planet/House/Sign/Yoga/Dosha/Nakshatra/Ascendant/Aspect). Phase 5A
// builds the Explorer framework only — no deep backend explorer logic and
// no Gemini explanations yet (those are later phases) — so every panel
// shows the same "here's what was selected, detail is coming" shape
// rather than eight copies of near-identical markup.
// ─────────────────────────────────────────────────────────────────────────
function ExplorerPlaceholderPanel({ icon, label, color, item }) {
  return (
    <GlassCard style={{ padding: 24, animation: "fadeIn 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <span aria-hidden="true" style={{ fontSize: 22 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 16, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif", fontWeight: 700 }}>
          {item?.label ?? label}
        </h3>
        <Badge color={color} style={{ marginLeft: "auto" }}>Explorer</Badge>
      </div>

      {item?.sublabel && <InsightRow label="Details" value={item.sublabel} color={color} />}

      <p style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
        Detailed {label.toLowerCase()} exploration — full breakdowns and AI explanations — arrives in a future phase.
        This panel confirms the Explorer framework can select, load, and display {label.toLowerCase()} entries.
      </p>
    </GlassCard>
  );
}

export default memo(ExplorerPlaceholderPanel);
