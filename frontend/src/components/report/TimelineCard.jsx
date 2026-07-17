import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import { PLANET_COLORS } from "../../constants/astrology.js";
import { confidenceColor } from "./predictionDisplay.js";

// ─────────────────────────────────────────────────────────────────────────
// TimelineCard (V3.0 Phase 3 — reusable report component)
//
// Renders one entry of `report.predictionTimeline.{oneYear,fiveYear,tenYear}`
// — the same backend-computed prediction shape as PredictionCard, already
// mapped by predictionApiMapper.js#mapPredictionTimeline — as a vertical
// timeline node. This data was already returned by the backend but never
// displayed anywhere in the frontend; this card is purely a new
// presentation of it, not a new calculation.
// ─────────────────────────────────────────────────────────────────────────
function TimelineCard({ entry, isLast, highlighted = false }) {
  const color = confidenceColor(entry.confidence?.label);
  const planetColor = PLANET_COLORS[entry.dominantPlanet] || "#bf7fff";
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {/* Rail */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <span aria-hidden="true" style={{
          width: 12, height: 12, borderRadius: "50%", background: planetColor,
          boxShadow: `0 0 0 4px ${planetColor}22`, marginTop: 6,
        }} />
        {!isLast && <span aria-hidden="true" style={{ flex: 1, width: 2, background: "rgba(180,120,255,0.18)", marginTop: 4 }} />}
      </div>

      {/* Content */}
      <GlassCard
        data-highlighted={highlighted ? "true" : undefined}
        style={{
          padding: 16, marginBottom: 16, flex: 1,
          borderColor: highlighted ? "rgba(255,215,0,0.6)" : undefined,
          boxShadow: highlighted ? "0 0 0 1px rgba(255,215,0,0.35), 0 4px 30px rgba(80,0,180,0.18)" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#ffd700", fontFamily: "Inter,sans-serif" }}>
            {entry.timePeriod?.startDate ? `${entry.timePeriod.startDate} → ${entry.timePeriod.endDate}` : "Upcoming period"}
          </span>
          <Badge color={color}>{entry.confidence?.label} · {entry.confidence?.score}/100</Badge>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
          {entry.prediction}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {entry.activeMahadasha && <Badge color="#bf7fff">Mahadasha: {entry.activeMahadasha}</Badge>}
          {entry.activeAntardasha && <Badge color="#bf7fff">Antardasha: {entry.activeAntardasha}</Badge>}
          {entry.dominantPlanet && <Badge color={planetColor}>{entry.dominantPlanet}</Badge>}
        </div>
      </GlassCard>
    </div>
  );
}

export default memo(TimelineCard);
