import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import { transitPlanetColor } from "../../utils/horoscopeCalendarUtils.js";

// ─────────────────────────────────────────────────────────────────────────
// DailyInsightCard (V3.0 Phase 5)
// "Today" snapshot for the Horoscope Dashboard — the currently active
// Antardasha (report.dasha.currentAntardasha) plus today's transit
// effects (report.transits, each already dated `asOf` == today by
// transitEngine.js). Every value shown is a direct read of backend data;
// no interpretation or new text is produced here.
// ─────────────────────────────────────────────────────────────────────────
function DailyInsightCard({ dasha, transits, onExplain }) {
  const antar = dasha?.currentAntardasha;
  const maha = dasha?.currentMahadasha;
  const today = transits?.[0]?.asOf;

  return (
    <GlassCard style={{ padding: 22, animation: "fadeIn 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#ffd700", fontFamily: "Cinzel,serif" }}>
          🌅 Today's Insight
        </h3>
        {today && <span style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>{today}</span>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {maha?.lord && <Badge color="#bf7fff">Mahadasha: {maha.lord}</Badge>}
        {antar?.lord && <Badge color="#bf7fff">Antardasha: {antar.lord}</Badge>}
        {antar?.remainingYears != null && (
          <Badge color="#ffd700">{antar.remainingYears} yrs left in this Antardasha</Badge>
        )}
      </div>

      {transits?.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: onExplain ? 14 : 0 }}>
          {transits.map((t) => (
            <div key={t.planet} style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
              padding: "10px 0", borderBottom: "1px solid rgba(180,120,255,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span aria-hidden="true" style={{
                  width: 8, height: 8, borderRadius: "50%", background: transitPlanetColor(t.planet),
                }} />
                <strong style={{ fontSize: 13, color: transitPlanetColor(t.planet), fontFamily: "Inter,sans-serif" }}>
                  {t.planet} in {t.transitSign}
                </strong>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--nv-text-secondary, rgba(230,220,255,0.75))", textAlign: "right", maxWidth: "60%" }}>
                {t.effect}
              </span>
            </div>
          ))}
        </div>
      )}

      {onExplain && (
        <button
          onClick={onExplain}
          className="pill-btn tap-scale"
          style={{
            background: "rgba(191,127,255,0.1)", border: "1px solid rgba(180,120,255,0.35)",
            color: "var(--nv-text-primary, #e8d5ff)", padding: "8px 16px", borderRadius: 20, cursor: "pointer",
            fontSize: 12.5, fontFamily: "Inter,sans-serif",
          }}
        >
          ✨ Explain Today's Horoscope
        </button>
      )}
    </GlassCard>
  );
}

export default memo(DailyInsightCard);
