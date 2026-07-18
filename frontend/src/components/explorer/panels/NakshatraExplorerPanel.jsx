import { memo } from "react";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import InsightRow from "../../common/InsightRow.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";

// ─────────────────────────────────────────────────────────────────────────
// NakshatraExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure:
// Backend Integration)
//
// Connects the "nakshatra" selection type to `report.nakshatraProfile` —
// the existing, unmodified Nakshatra Profile mapper output. Only the
// fields the backend actually returns are shown (nakshatra, lord, pada,
// symbol, deity, gana, nadi, yoni, nature, personality traits, career /
// relationship / spiritual tendencies); a generic "Strengths/Weaknesses"
// split is deliberately not invented since the backend doesn't compute
// that discrete distinction.
// ─────────────────────────────────────────────────────────────────────────
function NakshatraExplorerPanel({ report, chart }) {
  const profile = report?.nakshatraProfile;

  if (!profile) {
    return (
      <ExplorerDetailShell icon="🌟" label="Nakshatra" color="#ffd700" item={{ label: "Nakshatra" }}>
        <EmptyState icon="🌟" title="Nakshatra profile not available" message="This chart doesn't have a computed Nakshatra profile yet." />
      </ExplorerDetailShell>
    );
  }

  return (
    <ExplorerDetailShell icon="🌟" label="Nakshatra" color="#ffd700" item={{ label: profile.nakshatra }}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {profile.pada && <Badge color="#ffd700">Pada {profile.pada}</Badge>}
          {profile.lord && <Badge color="#bf7fff">Lord: {profile.lord}</Badge>}
          {profile.gana && <Badge color="#9dc9ff">{profile.gana} Gana</Badge>}
          {profile.nature && <Badge color="#ff9ed8">{profile.nature}</Badge>}
        </div>
        <InsightRow label="Deity" value={profile.deity || "—"} color="#ffd700" />
        <InsightRow label="Symbol" value={profile.symbol || "—"} color="#ffd700" />
        {profile.nadi && <InsightRow label="Nadi" value={profile.nadi} color="#ffd700" />}
        {profile.yoni && <InsightRow label="Yoni" value={profile.yoni} color="#ffd700" />}
      </GlassCard>

      {profile.personality && (
        <GlassCard style={{ padding: 24 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
            color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
            PERSONALITY
          </h4>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
            {profile.personality}
          </p>
        </GlassCard>
      )}

      {(profile.careerTendencies || profile.relationshipTendencies || profile.spiritualTendencies) && (
        <GlassCard style={{ padding: 24, display: "grid", gap: 14 }}>
          {profile.careerTendencies && <InsightRow label="Career Tendencies" value={profile.careerTendencies} color="#7effb2" />}
          {profile.relationshipTendencies && <InsightRow label="Relationship Tendencies" value={profile.relationshipTendencies} color="#ff9ed8" />}
          {profile.spiritualTendencies && <InsightRow label="Spiritual Tendencies" value={profile.spiritualTendencies} color="#9dc9ff" />}
        </GlassCard>
      )}

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in the Nakshatra profile facts already
          rendered above. */}
      <ExplorerAIPanel
        cacheKey={`nakshatra-${profile.nakshatra}`}
        itemType="nakshatra"
        itemId={profile.nakshatra}
        itemLabel={profile.nakshatra}
        chart={chart}
        report={report}
        contextFacts={{
          nakshatra: profile.nakshatra, pada: profile.pada, lord: profile.lord,
          gana: profile.gana, nadi: profile.nadi, yoni: profile.yoni, nature: profile.nature,
          deity: profile.deity, symbol: profile.symbol, personality: profile.personality,
          careerTendencies: profile.careerTendencies,
          relationshipTendencies: profile.relationshipTendencies,
          spiritualTendencies: profile.spiritualTendencies,
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(NakshatraExplorerPanel);
