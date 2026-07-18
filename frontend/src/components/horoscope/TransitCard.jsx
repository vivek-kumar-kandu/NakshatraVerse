import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import { transitPlanetColor } from "../../utils/horoscopeCalendarUtils.js";

// ─────────────────────────────────────────────────────────────────────────
// TransitCard (V3.0 Phase 5)
// One entry of report.transits (transitEngine.js#calcTransits output,
// exposed additively this phase) — planet, transit sign, house-from-Moon,
// classical effect text, and any raised flags (Sade Sati/Kantaka Shani/
// Ashtama Shani). Purely presentational.
// ─────────────────────────────────────────────────────────────────────────
function TransitCard({ transit, idx = 0, onExplain }) {
  const color = transitPlanetColor(transit.planet);
  const caution = transit.flags?.length > 0;

  return (
    <GlassCard style={{
      padding: 18, animation: `fadeIn 0.35s ease ${idx * 0.05}s both`,
      borderColor: caution ? "rgba(255,140,120,0.35)" : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
          <h4 style={{ margin: 0, fontSize: 14.5, color, fontFamily: "Inter,sans-serif", fontWeight: 700 }}>
            {transit.planet} in {transit.transitSign}
          </h4>
        </div>
        <Badge color={caution ? "#ff8f7e" : "#7effb2"}>{caution ? "Caution" : "Favorable"}</Badge>
      </div>

      <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
        {transit.effect}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {transit.houseFromMoon != null && <Badge color="#bf7fff">House {transit.houseFromMoon} from Moon</Badge>}
        {transit.natalSign && <Badge color="#8c5adc">Natal: {transit.natalSign}</Badge>}
        {(transit.flags || []).map((f) => (
          <Badge key={f.name} color="#ff8f7e">{f.name}</Badge>
        ))}
      </div>

      {onExplain && (
        <button
          onClick={() => onExplain(transit)}
          className="pill-btn tap-scale"
          style={{
            background: "rgba(191,127,255,0.1)", border: "1px solid rgba(180,120,255,0.35)",
            color: "var(--nv-text-primary, #e8d5ff)", padding: "7px 14px", borderRadius: 20, cursor: "pointer",
            fontSize: 12, fontFamily: "Inter,sans-serif",
          }}
        >
          ✨ Explain this Transit
        </button>
      )}
    </GlassCard>
  );
}

export default memo(TransitCard);
