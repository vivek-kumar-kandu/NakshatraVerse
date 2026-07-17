import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import InsightRow from "../common/InsightRow.jsx";
import { PLANET_COLORS } from "../../constants/astrology.js";
import { confidenceColor } from "./predictionDisplay.js";

// ─────────────────────────────────────────────────────────────────────────
// PredictionCard (V3.0 Phase 3 — reusable report component)
//
// Extracted, byte-for-byte in behavior, from ResultsTabs.jsx's inline
// PredictionCard (V2.0 Phase 7.1) so it can be reused wherever a single
// backend-computed prediction needs to be shown (Predictions tab, future
// Timeline detail, etc.) — no rendering logic changed, only moved into its
// own reusable file per the Phase 3 "reusable report components" spec.
// ─────────────────────────────────────────────────────────────────────────
function PredictionCard({ prediction, idx = 0 }) {
  const color = confidenceColor(prediction.confidence?.label);
  return (
    <GlassCard style={{ padding: 20, animation: `fadeIn 0.35s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "#ffd700", fontFamily: "Cinzel,serif", fontWeight: 600 }}>{prediction.category}</h3>
        <Badge color={color}>{prediction.confidence?.label} · {prediction.confidence?.score}/100</Badge>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
        {prediction.prediction}
      </p>
      <InsightRow label="Mahadasha" value={prediction.activeMahadasha || "—"} color="#bf7fff" />
      <InsightRow label="Antardasha" value={prediction.activeAntardasha || "—"} color="#bf7fff" />
      <InsightRow label="Dominant Planet" value={prediction.dominantPlanet || "—"} color={PLANET_COLORS[prediction.dominantPlanet] || "#ffd700"} />
      {prediction.timePeriod?.startDate && (
        <InsightRow label="Time Period" value={`${prediction.timePeriod.startDate} → ${prediction.timePeriod.endDate}`} />
      )}
      {(prediction.supportingYogas?.length > 0 || prediction.supportingDoshas?.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {prediction.supportingYogas?.map((y) => <Badge key={y.name} color="#7effb2">{y.name}</Badge>)}
          {prediction.supportingDoshas?.map((d) => <Badge key={d.name} color="#ff8f7e">{d.name}</Badge>)}
        </div>
      )}
      {prediction.suggestedRemedies?.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,215,0,0.06)", borderRadius: 10, border: "1px solid rgba(255,215,0,0.15)" }}>
          {prediction.suggestedRemedies.map((r) => (
            <p key={r.type} style={{ margin: "0 0 4px", fontSize: 12, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontFamily: "Inter,sans-serif" }}>
              <strong style={{ color: "#ffd700" }}>{r.type}:</strong> {r.detail}
            </p>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(PredictionCard);
