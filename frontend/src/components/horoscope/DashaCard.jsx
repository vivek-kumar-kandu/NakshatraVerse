import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import InsightRow from "../common/InsightRow.jsx";

// ─────────────────────────────────────────────────────────────────────────
// DashaCard (V3.0 Phase 5)
// Displays the full report.dasha object (dashaEngine.js#calcDasha, exposed
// additively via predictionApiMapper.js this phase) — current Mahadasha
// and Antardasha with remaining time, plus the previous/next Mahadasha for
// context. Purely presentational; no Dasha math happens here.
// ─────────────────────────────────────────────────────────────────────────
function DashaCard({ dasha, onExplain }) {
  if (!dasha?.available) return null;
  const { currentMahadasha, currentAntardasha, previousMahadasha, nextMahadasha } = dasha;

  return (
    <GlassCard style={{ padding: 20, animation: "fadeIn 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "#ffd700", fontFamily: "Cinzel,serif" }}>🪐 Vimshottari Dasha</h3>
        {currentMahadasha?.lord && <Badge color="#bf7fff">Current: {currentMahadasha.lord}</Badge>}
      </div>

      {currentMahadasha && (
        <InsightRow
          label="Current Mahadasha"
          value={`${currentMahadasha.lord} (${currentMahadasha.startDate} → ${currentMahadasha.endDate})`}
        />
      )}
      {currentMahadasha?.remainingYears != null && (
        <InsightRow label="Remaining" value={`${currentMahadasha.remainingYears} years`} />
      )}
      {currentAntardasha && (
        <InsightRow
          label="Current Antardasha"
          value={`${currentAntardasha.lord} (${currentAntardasha.startDate} → ${currentAntardasha.endDate})`}
          color="#ffd700"
        />
      )}
      {currentAntardasha?.remainingYears != null && (
        <InsightRow label="Remaining" value={`${currentAntardasha.remainingYears} years`} color="#ffd700" />
      )}
      {previousMahadasha && (
        <InsightRow label="Previous Mahadasha" value={`${previousMahadasha.lord} (ended ${previousMahadasha.endDate})`} color="var(--nv-text-muted, rgba(200,160,255,0.6))" />
      )}
      {nextMahadasha && (
        <InsightRow label="Next Mahadasha" value={`${nextMahadasha.lord} (begins ${nextMahadasha.startDate})`} color="#7effb2" />
      )}

      {onExplain && (
        <button
          onClick={onExplain}
          className="pill-btn tap-scale"
          style={{
            marginTop: 12, background: "rgba(191,127,255,0.1)", border: "1px solid rgba(180,120,255,0.35)",
            color: "var(--nv-text-primary, #e8d5ff)", padding: "8px 16px", borderRadius: 20, cursor: "pointer",
            fontSize: 12.5, fontFamily: "Inter,sans-serif",
          }}
        >
          ✨ Explain this Dasha
        </button>
      )}
    </GlassCard>
  );
}

export default memo(DashaCard);
