import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import InsightRow from "../common/InsightRow.jsx";

// ─────────────────────────────────────────────────────────────────────────
// NakshatraCard (V3.0 Phase 3 — reusable report component)
//
// Renders `report.nakshatraProfile` exactly as predictionApiMapper.js
// already shapes it (mapNakshatraProfile) — no new interpretation, only a
// reusable presentation extracted from the Predictions tab.
// ─────────────────────────────────────────────────────────────────────────
function NakshatraCard({ nakshatraProfile }) {
  if (!nakshatraProfile) return null;
  return (
    <GlassCard style={{ padding: 24, animation: "fadeIn 0.35s ease both" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase",
        color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>NAKSHATRA PROFILE</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <Badge color="#ffd700">{nakshatraProfile.nakshatra} · Pada {nakshatraProfile.pada}</Badge>
        <Badge color="#bf7fff">Lord: {nakshatraProfile.lord}</Badge>
        <Badge color="#9dc9ff">Gana: {nakshatraProfile.gana}</Badge>
        <Badge color="#9dc9ff">Nadi: {nakshatraProfile.nadi}</Badge>
        <Badge color="#9dc9ff">Yoni: {nakshatraProfile.yoni}</Badge>
      </div>
      <InsightRow label="Symbol" value={nakshatraProfile.symbol} />
      <InsightRow label="Deity" value={nakshatraProfile.deity} />
      <InsightRow label="Nature" value={nakshatraProfile.nature} />
      {nakshatraProfile.personality && (
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontFamily: "Inter,sans-serif" }}>
          {nakshatraProfile.personality}
        </p>
      )}
      {(nakshatraProfile.careerTendencies || nakshatraProfile.relationshipTendencies || nakshatraProfile.spiritualTendencies) && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(180,120,255,0.12)", display: "grid", gap: 6 }}>
          {nakshatraProfile.careerTendencies && <InsightRow label="Career" value={nakshatraProfile.careerTendencies} />}
          {nakshatraProfile.relationshipTendencies && <InsightRow label="Relationships" value={nakshatraProfile.relationshipTendencies} />}
          {nakshatraProfile.spiritualTendencies && <InsightRow label="Spiritual" value={nakshatraProfile.spiritualTendencies} />}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(NakshatraCard);
