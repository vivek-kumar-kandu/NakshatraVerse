import { memo, useMemo } from "react";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import InsightRow from "../../common/InsightRow.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExpandableSection from "../../report/ExpandableSection.jsx";
import PredictionCard from "../../report/PredictionCard.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";
import { PLANET_COLORS, SIGN_LORD, ZODIAC_SIGNS, SIGN_NAMES } from "../../../constants/astrology.js";
import { plainPlanetName, predictionsForPlanet } from "../../../utils/explorerData.js";

// ─────────────────────────────────────────────────────────────────────────
// SignExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure: Backend
// Integration)
//
// Connects the "sign" selection type to real backend data: which planets
// currently occupy the sign (`planetary`), whether it's this chart's
// Lagna (`userData.lagna`), its classical ruling planet (`SIGN_LORD` —
// static reference, not a calculation), and the category predictions tied
// to its occupant planets (via the shared `predictionsForPlanet` helper,
// unioned across every occupant).
// ─────────────────────────────────────────────────────────────────────────
function SignExplorerPanel({ item, userData, planetary, report, chart }) {
  const signName = item?.id;
  const glyph = ZODIAC_SIGNS[SIGN_NAMES.indexOf(signName)];
  const lord = SIGN_LORD[signName];
  const isLagna = userData?.lagna === signName;

  const occupants = useMemo(
    () => Object.entries(planetary || {}).filter(([, info]) => info?.sign === signName).map(([planet]) => planet),
    [planetary, signName]
  );

  const relatedPredictions = useMemo(() => {
    const seen = new Map();
    for (const planet of occupants) {
      for (const p of predictionsForPlanet(report, plainPlanetName(planet))) {
        seen.set(p.category, p);
      }
    }
    return [...seen.values()];
  }, [occupants, report]);

  if (!signName) {
    return (
      <ExplorerDetailShell icon="♈" label="Sign" color="#ffb347" item={item}>
        <EmptyState icon="♈" title="Sign data not available" message="Select a zodiac sign from the panel to explore it here." />
      </ExplorerDetailShell>
    );
  }

  return (
    <ExplorerDetailShell icon="♈" label="Sign" color="#ffb347" item={item}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {glyph && <Badge color="#ffb347">{glyph} {signName}</Badge>}
          {lord && <Badge color="#bf7fff">Lord: {lord}</Badge>}
          {isLagna && <Badge color="#ffd700">This chart's Lagna</Badge>}
        </div>
        <InsightRow label="Ruling Planet" value={lord || "—"} color="#bf7fff" />
        <h4 style={{ margin: "16px 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          PLANETS CURRENTLY IN THIS SIGN
        </h4>
        {occupants.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {occupants.map((planet) => (
              <Badge key={planet} color={PLANET_COLORS[planet] || "#bf7fff"}>{planet} · H{planetary[planet].house}</Badge>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", fontFamily: "Inter,sans-serif" }}>
            No planets currently occupy this sign in this chart.
          </p>
        )}
      </GlassCard>

      <ExpandableSection icon="🔮" title="Related Predictions" color="#ffd700" count={relatedPredictions.length}>
        {relatedPredictions.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {relatedPredictions.map((p, idx) => <PredictionCard key={p.category} prediction={p} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🔮" title="No linked predictions" message="No category prediction currently traces back to a planet occupying this sign." />
        )}
      </ExpandableSection>

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in this sign's own occupants/lord facts
          already rendered above. */}
      <ExplorerAIPanel
        cacheKey={`sign-${signName}`}
        itemType="sign"
        itemId={signName}
        itemLabel={item?.label ?? signName}
        chart={chart}
        report={report}
        contextFacts={{
          signName, lord, isLagna, occupants,
          relatedPredictionCategories: relatedPredictions.map((p) => p.category),
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(SignExplorerPanel);
