import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import { PLANET_COLORS } from "../../constants/astrology.js";
import { confidenceColor } from "../report/predictionDisplay.js";
import { categoryMetaFromLabel } from "../../utils/horoscopeCalendarUtils.js";

// ─────────────────────────────────────────────────────────────────────────
// HoroscopeCard (V3.0 Phase 5)
// Renders one backend-computed category prediction (report.predictions[]
// — the exact same shape PredictionCard already displays on the
// Predictions tab) with a Horoscope-page framing: category icon, the
// prediction text, and an "Explain" action that hands this same object
// off to the existing AI Assistant. No prediction text is generated here
// — every word comes from predictionApiMapper.js's existing API contract.
// ─────────────────────────────────────────────────────────────────────────
function HoroscopeCard({ prediction, idx = 0, onExplain }) {
  const meta = categoryMetaFromLabel(prediction.category);
  const confColor = confidenceColor(prediction.confidence?.label);

  return (
    <GlassCard style={{ padding: 20, animation: `fadeIn 0.35s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true" style={{ fontSize: 18 }}>{meta.icon}</span>
          <h3 style={{ margin: 0, fontSize: 15, color: meta.color, fontFamily: "Cinzel,serif", fontWeight: 600 }}>
            {meta.label}
          </h3>
        </div>
        {prediction.confidence?.label && (
          <Badge color={confColor}>{prediction.confidence.label} · {prediction.confidence.score}/100</Badge>
        )}
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
        {prediction.prediction}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: onExplain ? 12 : 0 }}>
        {prediction.activeMahadasha && <Badge color="#bf7fff">Mahadasha: {prediction.activeMahadasha}</Badge>}
        {prediction.activeAntardasha && <Badge color="#bf7fff">Antardasha: {prediction.activeAntardasha}</Badge>}
        {prediction.dominantPlanet && (
          <Badge color={PLANET_COLORS[prediction.dominantPlanet] || "#ffd700"}>{prediction.dominantPlanet}</Badge>
        )}
      </div>

      {onExplain && (
        <button
          onClick={() => onExplain(prediction)}
          className="pill-btn tap-scale"
          style={{
            background: "rgba(191,127,255,0.1)", border: "1px solid rgba(180,120,255,0.35)",
            color: "var(--nv-text-primary, #e8d5ff)", padding: "8px 16px", borderRadius: 20, cursor: "pointer",
            fontSize: 12.5, fontFamily: "Inter,sans-serif",
          }}
        >
          ✨ Explain this
        </button>
      )}
    </GlassCard>
  );
}

export default memo(HoroscopeCard);
