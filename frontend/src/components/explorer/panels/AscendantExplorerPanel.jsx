import { memo, useMemo } from "react";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import InsightRow from "../../common/InsightRow.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExpandableSection from "../../report/ExpandableSection.jsx";
import PredictionCard from "../../report/PredictionCard.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";
import { ZODIAC_SIGNS, SIGN_NAMES, SIGN_LORD } from "../../../constants/astrology.js";
import { predictionsForPlanet } from "../../../utils/explorerData.js";

// ─────────────────────────────────────────────────────────────────────────
// AscendantExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure:
// Backend Integration)
//
// Connects the "ascendant" selection type to real backend data:
//   - Lagna: `userData.lagna` (Ascendant Engine output, unchanged).
//   - Lord: the static `SIGN_LORD` rulership table.
//   - "Characteristics": the Lagna lord's own already-computed
//     `report.planetStrength[lord].explanation` — its dignity/strength
//     narrative, which is a real, backend-derived fact about the planet
//     that rules this chart's rising sign (not an invented sign
//     description).
//   - Predictions: category predictions naming the Lagna lord, via the
//     shared `predictionsForPlanet` helper.
// ─────────────────────────────────────────────────────────────────────────
function AscendantExplorerPanel({ userData, report, chart }) {
  const lagna = userData?.lagna;
  const glyph = lagna ? ZODIAC_SIGNS[SIGN_NAMES.indexOf(lagna)] : undefined;
  const lord = lagna ? SIGN_LORD[lagna] : undefined;
  const lordStrength = lord ? report?.planetStrength?.[lord] : undefined;

  const relatedPredictions = useMemo(
    () => (lord ? predictionsForPlanet(report, lord) : []),
    [report, lord]
  );

  if (!lagna) {
    return (
      <ExplorerDetailShell icon="🌅" label="Ascendant" color="#ffd700" item={{ label: "Ascendant" }}>
        <EmptyState icon="🌅" title="Ascendant not available" message="This chart doesn't have a computed Lagna yet." />
      </ExplorerDetailShell>
    );
  }

  return (
    <ExplorerDetailShell icon="🌅" label="Ascendant" color="#ffd700" item={{ label: lagna }}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {glyph && <Badge color="#ffd700">{glyph} {lagna}</Badge>}
          {lord && <Badge color="#bf7fff">Lord: {lord}</Badge>}
        </div>
        <InsightRow label="Lagna (Rising Sign)" value={lagna} color="#ffd700" />
        <InsightRow label="Lagna Lord" value={lord || "—"} color="#bf7fff" />

        {lordStrength && (
          <>
            <h4 style={{ margin: "16px 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
              color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
              CHARACTERISTICS (via Lagna Lord's strength)
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {lordStrength.dignity?.label && <Badge color="#9dc9ff">{lordStrength.dignity.label}</Badge>}
              {lordStrength.functionalNature?.nature && (
                <Badge color={lordStrength.functionalNature.nature === "malefic" ? "#ff7b7b" : "#7effb2"}>
                  Functionally {lordStrength.functionalNature.nature}
                </Badge>
              )}
            </div>
            {lordStrength.explanation && (
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
                {lordStrength.explanation}
              </p>
            )}
          </>
        )}
      </GlassCard>

      <ExpandableSection icon="🔮" title="Predictions Linked to the Lagna Lord" color="#ffd700" count={relatedPredictions.length}>
        {relatedPredictions.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {relatedPredictions.map((p, idx) => <PredictionCard key={p.category} prediction={p} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🔮" title="No linked predictions" message={`No category prediction currently names ${lord || "the Lagna lord"} as its dominant or supporting planet.`} />
        )}
      </ExpandableSection>

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in the Lagna/lord facts already rendered
          above. */}
      <ExplorerAIPanel
        cacheKey={`ascendant-${lagna}`}
        itemType="ascendant"
        itemId={lagna}
        itemLabel={lagna}
        chart={chart}
        report={report}
        contextFacts={{
          lagna, lord,
          lordDignity: lordStrength?.dignity?.label,
          lordFunctionalNature: lordStrength?.functionalNature?.nature,
          relatedPredictionCategories: relatedPredictions.map((p) => p.category),
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(AscendantExplorerPanel);
