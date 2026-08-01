import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["explorer"]);
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
      <ExplorerDetailShell icon="🌅" label={t("explorer:typeSingular.ascendant")} color="#ffd700" item={{ label: t("explorer:ascendant.itemLabel") }}>
        <EmptyState icon="🌅" title={t("explorer:ascendant.notAvailableTitle")} message={t("explorer:ascendant.notAvailableMessage")} />
      </ExplorerDetailShell>
    );
  }

  return (
    <ExplorerDetailShell icon="🌅" label={t("explorer:typeSingular.ascendant")} color="#ffd700" item={{ label: lagna }}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {glyph && <Badge color="#ffd700">{glyph} {lagna}</Badge>}
          {lord && <Badge color="#bf7fff">{t("explorer:ascendant.lordBadge", { lord })}</Badge>}
        </div>
        <InsightRow label={t("explorer:ascendant.risingSign")} value={lagna} color="#ffd700" />
        <InsightRow label={t("explorer:ascendant.lagnaLord")} value={lord || t("explorer:ascendant.notAvailableValue")} color="#bf7fff" />

        {lordStrength && (
          <>
            <h4 style={{ margin: "16px 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
              color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
              {t("explorer:ascendant.characteristicsHeading")}
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {lordStrength.dignity?.label && <Badge color="#9dc9ff">{lordStrength.dignity.label}</Badge>}
              {lordStrength.functionalNature?.nature && (
                <Badge color={lordStrength.functionalNature.nature === "malefic" ? "#ff7b7b" : "#7effb2"}>
                  {t("explorer:ascendant.functionallyNature", { nature: lordStrength.functionalNature.nature })}
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

      <ExpandableSection icon="🔮" title={t("explorer:ascendant.predictionsLinkedTitle")} color="#ffd700" count={relatedPredictions.length}>
        {relatedPredictions.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {relatedPredictions.map((p, idx) => <PredictionCard key={p.category} prediction={p} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🔮" title={t("explorer:common.noLinkedPredictionsTitle")} message={t("explorer:ascendant.noLinkedPredictionsMessage", { lord: lord || t("explorer:ascendant.lagnaLordFallback") })} />
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
