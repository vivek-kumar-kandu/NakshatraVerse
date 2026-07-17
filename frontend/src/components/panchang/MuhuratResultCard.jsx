import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import InsightRow from "../common/InsightRow.jsx";

const CONFIDENCE_COLOR = { High: "#7effb2", Medium: "#ffd700", Low: "#ff8f7e" };

// ─────────────────────────────────────────────────────────────────────────
// MuhuratResultCard (V4.1 Phase 2)
// Pure presentation of an already-backend-computed Muhurat recommendation
// (see utils/panchangApi.js's findMuhurat / backend muhuratEngine.js).
// Renders exactly the fields the spec calls for: Best Date, Best Time
// Window, Auspicious Period, Caution Period, Confidence Level.
// ─────────────────────────────────────────────────────────────────────────
function MuhuratResultCard({ muhurat, onExplain, explaining }) {
  if (!muhurat) return null;
  const confColor = CONFIDENCE_COLOR[muhurat.confidenceLevel] || "#bf7fff";

  return (
    <GlassCard style={{ padding: "22px 24px", animation: "fadeIn 0.35s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontFamily: "Cinzel,serif", color: "var(--nv-text-primary, #f1e4ff)" }}>
          Best Muhurat for {muhurat.activityLabel}
        </h3>
        <Badge color={confColor}>{muhurat.confidenceLevel} Confidence</Badge>
      </div>

      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: "#ffd700", fontWeight: 700, marginBottom: 4 }}>📅 Best Date</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--nv-text-primary, #f1e4ff)", fontFamily: "Cinzel,serif" }}>
          {muhurat.bestDate} ({muhurat.bestDateWeekday})
        </div>
        <div style={{ fontSize: 13, color: "var(--nv-text-secondary, rgba(200,160,255,0.8))", marginTop: 6 }}>
          Best Time Window: {muhurat.bestTimeWindow.start} – {muhurat.bestTimeWindow.end}
        </div>
      </div>

      <InsightRow label="Tithi" value={muhurat.auspiciousPeriod.tithi} color="#ffd700" />
      <InsightRow label="Nakshatra" value={muhurat.auspiciousPeriod.nakshatra} color="#9dc9ff" />
      <InsightRow label="Auspicious Window" value={`${muhurat.auspiciousPeriod.window.start} – ${muhurat.auspiciousPeriod.window.end}`} color="#7effb2" />

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12.5, color: "#ff8f7e", fontWeight: 600, marginBottom: 8 }}>⚠ Caution Period (avoid)</div>
        <InsightRow label="Rahu Kaal" value={`${muhurat.cautionPeriod.rahuKaal.start} – ${muhurat.cautionPeriod.rahuKaal.end}`} color="#ff8f7e" />
        <InsightRow label="Yamaganda" value={`${muhurat.cautionPeriod.yamaganda.start} – ${muhurat.cautionPeriod.yamaganda.end}`} color="#ff8f7e" />
        <InsightRow label="Gulika Kaal" value={`${muhurat.cautionPeriod.gulikaKaal.start} – ${muhurat.cautionPeriod.gulikaKaal.end}`} color="#ff8f7e" />
      </div>

      {muhurat.topAlternatives?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, color: "#9dc9ff", fontWeight: 600, marginBottom: 8 }}>Other strong dates</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {muhurat.topAlternatives.map((a) => (
              <Badge key={a.date} color="#9dc9ff">{a.date} · {a.score}/100</Badge>
            ))}
          </div>
        </div>
      )}

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
          {explaining ? "Asking AI…" : "🔮 Explain Why This Muhurat"}
        </button>
      )}
    </GlassCard>
  );
}

export default memo(MuhuratResultCard);
