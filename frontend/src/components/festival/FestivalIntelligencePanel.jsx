import { memo, useState } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
  if (!items?.length) return null;
=======
  if (!items?.length) return null; // eslint-disable-line
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function FestivalIntelligencePanel({ festival }) {
<<<<<<< HEAD
=======
  const { t } = useTranslation(["festival"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!festival) return null;

  const handleFetch = () => {
    setLoading(true);
    setError(null);
    festivalIntelligenceApi.getFestivalIntelligence(festival)
      .then(setIntelligence)
<<<<<<< HEAD
      .catch((err) => setError(err.message || "Could not load festival intelligence right now."))
=======
      .catch((err) => setError(err.message || t("festival:intelligencePanel.loadFailed")))
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <GlassCard style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 15.5, color: "var(--nv-text-primary, #f1e4ff)" }}>
<<<<<<< HEAD
              🔮 Festival Intelligence
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
              Spiritual meaning, mythological story, and puja overview — beyond the basics above.
=======
              {t("festival:intelligencePanel.title")}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
              {t("festival:intelligencePanel.subtitle")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
              ✨ {loading ? "Asking Gemini…" : "Reveal Deeper Intelligence"}
=======
              ✨ {loading ? t("festival:intelligencePanel.askingGemini") : t("festival:intelligencePanel.revealDeeper")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
            <ExpandableSection icon="🕉️" title="Spiritual Meaning" defaultOpen>
=======
            <ExpandableSection icon="🕉️" title={t("festival:intelligencePanel.spiritualMeaning")} defaultOpen>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              <p style={{ margin: 0 }}>{intelligence.spiritualMeaning}</p>
            </ExpandableSection>
          )}
          {intelligence.mythologicalStory && (
<<<<<<< HEAD
            <ExpandableSection icon="📖" title="Mythological Story">
=======
            <ExpandableSection icon="📖" title={t("festival:intelligencePanel.mythologicalStory")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              <p style={{ margin: 0 }}>{intelligence.mythologicalStory}</p>
            </ExpandableSection>
          )}
          {intelligence.modernPracticalMeaning && (
<<<<<<< HEAD
            <ExpandableSection icon="🏡" title="Modern Practical Meaning">
=======
            <ExpandableSection icon="🏡" title={t("festival:intelligencePanel.modernPracticalMeaning")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              <p style={{ margin: 0 }}>{intelligence.modernPracticalMeaning}</p>
            </ExpandableSection>
          )}
          {intelligence.culturalSignificance && (
<<<<<<< HEAD
            <ExpandableSection icon="🌾" title="Scientific / Cultural Significance">
=======
            <ExpandableSection icon="🌾" title={t("festival:intelligencePanel.culturalSignificance")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              <p style={{ margin: 0 }}>{intelligence.culturalSignificance}</p>
            </ExpandableSection>
          )}
          {intelligence.pujaOverview && (
<<<<<<< HEAD
            <ExpandableSection icon="🪔" title="Puja Overview">
=======
            <ExpandableSection icon="🪔" title={t("festival:intelligencePanel.pujaOverview")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              <p style={{ margin: 0 }}>{intelligence.pujaOverview}</p>
            </ExpandableSection>
          )}
          {intelligence.thingsToAvoid?.length > 0 && (
<<<<<<< HEAD
            <ExpandableSection icon="🚫" title="Things To Avoid">
=======
            <ExpandableSection icon="🚫" title={t("festival:intelligencePanel.thingsToAvoid")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              <List items={intelligence.thingsToAvoid} />
            </ExpandableSection>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
<<<<<<< HEAD
            <Badge color="#9dc9ff">AI-assisted — traditions vary by region/family</Badge>
=======
            <Badge color="#9dc9ff">{t("festival:intelligencePanel.aiAssistedBadge")}</Badge>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </div>
        </>
      )}
    </div>
  );
}

export default memo(FestivalIntelligencePanel);
