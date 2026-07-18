import { memo, useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import ExpandableSection from "../common/ExpandableSection.jsx";
import * as festivalIntelligenceApi from "../../utils/festivalIntelligenceApi.js";

// ─────────────────────────────────────────────────────────────────────────
// FestivalIntelligencePanel (V4.5 Phase 2 — Festival Intelligence)
//
// New, additive component — does not modify FestivalDetailCard.jsx (which
// stays exactly as V4.5 Phase 1B left it). Adds the richer, non-duplicate
// context the Phase 2 spec asks for: Spiritual Meaning, Mythological
// Story, Modern Practical Meaning, Scientific/Cultural Significance,
// Things To Avoid, and Puja Overview. Historical Background, Religious
// Importance, and Recommended Activities are intentionally NOT
// re-requested here — FestivalDetailCard.jsx already renders those
// straight from the backend-computed festival occurrence, and this phase
// must not duplicate Festival logic.
//
// Fetches on demand (button press), same UX as FestivalDetailCard's own
// "Explain This Festival" button, so opening a festival's detail view
// never makes a Gemini call the user didn't ask for.
// ─────────────────────────────────────────────────────────────────────────
function List({ items }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function FestivalIntelligencePanel({ festival }) {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!festival) return null;

  const handleFetch = () => {
    setLoading(true);
    setError(null);
    festivalIntelligenceApi.getFestivalIntelligence(festival)
      .then(setIntelligence)
      .catch((err) => setError(err.message || "Could not load festival intelligence right now."))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <GlassCard style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 15.5, color: "var(--nv-text-primary, #f1e4ff)" }}>
              🔮 Festival Intelligence
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
              Spiritual meaning, mythological story, and puja overview — beyond the basics above.
            </p>
          </div>
          {!intelligence && (
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
              ✨ {loading ? "Asking Gemini…" : "Reveal Deeper Intelligence"}
            </button>
          )}
        </div>
        {error && (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#ff8f7e" }}>{error}</p>
        )}
      </GlassCard>

      {intelligence && (
        <>
          {intelligence.spiritualMeaning && (
            <ExpandableSection icon="🕉️" title="Spiritual Meaning" defaultOpen>
              <p style={{ margin: 0 }}>{intelligence.spiritualMeaning}</p>
            </ExpandableSection>
          )}
          {intelligence.mythologicalStory && (
            <ExpandableSection icon="📖" title="Mythological Story">
              <p style={{ margin: 0 }}>{intelligence.mythologicalStory}</p>
            </ExpandableSection>
          )}
          {intelligence.modernPracticalMeaning && (
            <ExpandableSection icon="🏡" title="Modern Practical Meaning">
              <p style={{ margin: 0 }}>{intelligence.modernPracticalMeaning}</p>
            </ExpandableSection>
          )}
          {intelligence.culturalSignificance && (
            <ExpandableSection icon="🌾" title="Scientific / Cultural Significance">
              <p style={{ margin: 0 }}>{intelligence.culturalSignificance}</p>
            </ExpandableSection>
          )}
          {intelligence.pujaOverview && (
            <ExpandableSection icon="🪔" title="Puja Overview">
              <p style={{ margin: 0 }}>{intelligence.pujaOverview}</p>
            </ExpandableSection>
          )}
          {intelligence.thingsToAvoid?.length > 0 && (
            <ExpandableSection icon="🚫" title="Things To Avoid">
              <List items={intelligence.thingsToAvoid} />
            </ExpandableSection>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Badge color="#9dc9ff">AI-assisted — traditions vary by region/family</Badge>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(FestivalIntelligencePanel);
