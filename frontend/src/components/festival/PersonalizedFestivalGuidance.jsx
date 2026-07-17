import { memo, useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import InsightRow from "../common/InsightRow.jsx";
import * as festivalIntelligenceApi from "../../utils/festivalIntelligenceApi.js";

// ─────────────────────────────────────────────────────────────────────────
// PersonalizedFestivalGuidance (V4.5 Phase 2 — Festival Intelligence)
//
// New, additive component. Only usable when a chart is available (the
// same requirement lifeCoachApi.generateDailyGuidance already has) — when
// it isn't, this renders a lightweight CTA instead of failing, since the
// Festival Page itself is intentionally chart-free (V4.5 Phase 1B). Every
// focus area returned here is grounded in the user's own already-computed
// Dasha/Transits/Predictions (see festivalIntelligencePromptBuilder.js) —
// nothing here is a new astrology calculation.
// ─────────────────────────────────────────────────────────────────────────
const FOCUS_FIELDS = [
  { key: "careerFocus", label: "Career", icon: "💼", color: "#9dc9ff" },
  { key: "financeFocus", label: "Finance", icon: "💰", color: "#ffd700" },
  { key: "relationshipFocus", label: "Relationships", icon: "💞", color: "#ff9ec9" },
  { key: "healthFocus", label: "Health", icon: "🌿", color: "#7effb2" },
  { key: "spiritualFocus", label: "Spiritual", icon: "🕉️", color: "#bf7fff" },
  { key: "personalGrowthFocus", label: "Personal Growth", icon: "🌱", color: "#ffb37e" },
];

function PersonalizedFestivalGuidance({ festival, chart, report, onOpenReading }) {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!festival) return null;

  if (!chart) {
    return (
      <GlassCard style={{ padding: "18px 20px", textAlign: "center" }}>
        <h3 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 15.5, color: "var(--nv-text-primary, #f1e4ff)" }}>
          🌟 Personalized Festival Guidance
        </h3>
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
          Open this festival from one of your saved readings to see why it's especially meaningful for you —
          career, finance, relationships, health, spiritual, and personal-growth focus, all grounded in your own chart.
        </p>
        {onOpenReading && (
          <button
            onClick={onOpenReading}
            className="pill-btn tap-scale"
            style={{
              marginTop: 14, padding: "10px 18px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: "1px solid rgba(180,120,255,0.4)", background: "rgba(123,47,255,0.18)",
              color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
            }}
          >
            Open a Saved Reading →
          </button>
        )}
      </GlassCard>
    );
  }

  const handleFetch = () => {
    setLoading(true);
    setError(null);
    festivalIntelligenceApi.getPersonalizedFestivalGuidance(festival, chart, report)
      .then((result) => setGuidance(result.guidance))
      .catch((err) => setError(err.message || "Could not load personalized guidance right now."))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <GlassCard style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 15.5, color: "var(--nv-text-primary, #f1e4ff)" }}>
              🌟 Personalized Festival Guidance
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
              Grounded in your own Dasha, Transits, and Predictions.
            </p>
          </div>
          {!guidance && (
            <button
              onClick={handleFetch}
              disabled={loading}
              className="pill-btn tap-scale"
              style={{
                padding: "10px 16px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                cursor: loading ? "default" : "pointer", border: "1px solid rgba(180,120,255,0.4)",
                background: "rgba(123,47,255,0.18)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", flexShrink: 0,
              }}
            >
              ✨ {loading ? "Asking Gemini…" : "Why Is This Meaningful For Me?"}
            </button>
          )}
        </div>
        {error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#ff8f7e" }}>{error}</p>}

        {guidance?.whyMeaningful && (
          <p style={{ margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "#e8d5ff", padding: 14, borderRadius: 10, background: "rgba(123,47,255,0.1)", border: "1px solid rgba(180,120,255,0.2)" }}>
            {guidance.whyMeaningful}
          </p>
        )}
      </GlassCard>

      {guidance && (
        <GlassCard style={{ padding: "6px 20px" }}>
          {FOCUS_FIELDS.filter((f) => guidance[f.key]).map((f) => (
            <InsightRow key={f.key} label={`${f.icon} ${f.label}`} value={guidance[f.key]} color={f.color} />
          ))}
        </GlassCard>
      )}
    </div>
  );
}

export default memo(PersonalizedFestivalGuidance);
