import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachLuckyElementsCard — V4.3 (AI Life Coach Enhancement Pass)
// Displays today's Lucky Color / Lucky Number / Lucky Direction /
// Favorable Time Window. Purely presentational — every value comes from
// the backend's luckyElementsEngine.js (deterministic lookups over the
// already-computed Moon Sign, birth numerology, and today's Panchang);
// Gemini never generates or sees these values.
// ─────────────────────────────────────────────────────────────────────────
function Item({ icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120, flex: "1 1 120px" }}>
      <span style={{ fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: 14.5, fontFamily: "Cinzel,serif", color: "var(--nv-text-primary, #f1e4ff)" }}>
        {value}
      </span>
    </div>
  );
}

function LifeCoachLuckyElementsCard({ luckyElements }) {
  if (!luckyElements) return null;
  const { luckyColor, luckyNumber, luckyDirection, favorableTimeWindow } = luckyElements;
  if (!luckyColor && luckyNumber == null && !luckyDirection && !favorableTimeWindow) return null;

  return (
    <GlassCard style={{ padding: "18px 20px" }}>
      <p style={{ margin: "0 0 12px", fontSize: 13, fontFamily: "Cinzel,serif", color: "#ffd700" }}>🍀 Lucky Elements Today</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <Item icon="🎨" label="Color" value={luckyColor} />
        <Item icon="🔢" label="Number" value={luckyNumber} />
        <Item icon="🧭" label="Direction" value={luckyDirection} />
        <Item icon="⏰" label="Favorable Time" value={favorableTimeWindow} />
      </div>
    </GlassCard>
  );
}

export default memo(LifeCoachLuckyElementsCard);
