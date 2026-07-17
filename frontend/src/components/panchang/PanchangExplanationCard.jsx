import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// PanchangExplanationCard (V4.1 Phase 2)
// Pure presentation of the Gemini-generated explanation object returned
// by POST /api/panchang/explain (see utils/panchangApi.js). Gemini only
// ever explains facts the backend already computed — this component just
// renders whichever prose keys are present (panchangMeaning/
// spiritualSignificance/practicalGuidance for a daily explanation,
// whyRecommended/practicalGuidance/spiritualSignificance for a Muhurat
// explanation).
// ─────────────────────────────────────────────────────────────────────────
const FIELD_META = {
  panchangMeaning: { icon: "📖", label: "What This Means" },
  whyRecommended: { icon: "🎯", label: "Why This Was Recommended" },
  spiritualSignificance: { icon: "🕉️", label: "Spiritual Significance" },
  practicalGuidance: { icon: "💡", label: "Practical Guidance" },
};

function PanchangExplanationCard({ explanation }) {
  if (!explanation) return null;
  const keys = Object.keys(FIELD_META).filter((k) => explanation[k]);
  if (!keys.length) return null;

  return (
    <GlassCard style={{ padding: "22px 24px", animation: "fadeIn 0.35s ease both" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
        🔮 AI Explanation
      </h3>
      <div style={{ display: "grid", gap: 14 }}>
        {keys.map((k) => (
          <div key={k}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#bf7fff", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden="true">{FIELD_META[k].icon}</span>{FIELD_META[k].label}
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(200,160,255,0.85))", fontFamily: "Inter,sans-serif" }}>
              {explanation[k]}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default memo(PanchangExplanationCard);
