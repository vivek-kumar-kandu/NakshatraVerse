import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import ScoreRing from "../common/ScoreRing.jsx";
import { qualityColor } from "./panchangUiConstants.js";

// ─────────────────────────────────────────────────────────────────────────
// TodaySummaryCard (V4.1 Phase 2 — "Today's Summary" premium dashboard
// block on the Panchang page)
//
// Pure presentation of the summary fields already computed by
// panchangEngine.js: auspiciousnessScore/Label, bestTimeToday,
// thingsToAvoid[], recommendedActivities[]. Reuses the existing
// ScoreRing component (same one used elsewhere in the app for 0-N
// scores) — no new scoring visualization is invented here.
// ─────────────────────────────────────────────────────────────────────────
function TodaySummaryCard({ panchang, onExplain, explaining }) {
  if (!panchang) return null;
  const color = qualityColor(panchang.auspiciousnessScore);

  return (
    <GlassCard style={{ padding: "24px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", marginBottom: 18 }}>
        <ScoreRing value={panchang.auspiciousnessScore} max={100} label="Auspiciousness" color={color} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>
            Today's Summary
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "Cinzel,serif", marginBottom: 6 }}>
            {panchang.auspiciousnessLabel}
          </div>
          <div style={{ fontSize: 13, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontFamily: "Inter,sans-serif" }}>
            {panchang.tithi.name} · {panchang.nakshatra.name} · {panchang.weekday}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: "#ffd700", fontWeight: 700, marginBottom: 4, fontFamily: "Inter,sans-serif" }}>✨ Best Time Today</div>
        <div style={{ fontSize: 14, color: "var(--nv-text-primary, #f1e4ff)", fontFamily: "Inter,sans-serif" }}>{panchang.bestTimeToday}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "#7effb2", fontWeight: 600, marginBottom: 8 }}>✓ Recommended Activities</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {panchang.recommendedActivities.map((r, i) => (
              <li key={i} style={{ fontSize: 12.5, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", lineHeight: 1.5 }}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontSize: 12.5, color: "#ff8f7e", fontWeight: 600, marginBottom: 8 }}>⚠ Things to Avoid</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {panchang.thingsToAvoid.map((a, i) => (
              <li key={i} style={{ fontSize: 12.5, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", lineHeight: 1.5 }}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      {onExplain && (
        <button
          onClick={onExplain}
          disabled={explaining}
          className="pill-btn tap-scale"
          style={{
            marginTop: 18, padding: "10px 18px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
            cursor: explaining ? "default" : "pointer", border: "1px solid rgba(180,120,255,0.4)",
            background: "rgba(123,47,255,0.18)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
          }}
        >
          {explaining ? "Asking AI…" : "🔮 Explain Today's Panchang"}
        </button>
      )}
    </GlassCard>
  );
}

export default memo(TodaySummaryCard);
