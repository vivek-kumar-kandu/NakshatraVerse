import { memo } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import InsightRow from "../../common/InsightRow.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";
import { PLANET_COLORS } from "../../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// AspectExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure: Backend
// Integration)
//
// Connects the "aspect" selection type to real backend data: each
// target planet's `report.planetStrength[plainName].aspectInfluence`
// object — the existing, unmodified Aspect (Drishti) Rule Evaluator
// output (aspectRuleEvaluator.js via planetStrengthRuleEvaluator.js) —
// which already contains the aspecting ("source") planets, the houses
// aspected, and benefic/malefic aspect counts. The one-line
// interpretation below only labels those existing counts; it does not
// compute a new aspect or strength value.
// ─────────────────────────────────────────────────────────────────────────
function colorFor(plainName) {
  const fullKey = Object.keys(PLANET_COLORS).find((k) => k.startsWith(plainName));
  return PLANET_COLORS[fullKey] || "#bf7fff";
}

function interpret(beneficCount, maleficCount, netInfluence, t) {
  if (beneficCount && !maleficCount) return t("explorer:aspect.interpretPureBenefic");
  if (maleficCount && !beneficCount) return t("explorer:aspect.interpretPureMalefic");
  if (netInfluence > 0) return t("explorer:aspect.interpretMixedNetBenefic");
  if (netInfluence < 0) return t("explorer:aspect.interpretMixedNetMalefic");
  return t("explorer:aspect.interpretMixedNeutral");
}

function AspectExplorerPanel({ item, report, chart }) {
  const { t } = useTranslation(["explorer"]);
  const target = item?.id?.replace("aspect-", "");
  const influence = target ? report?.planetStrength?.[target]?.aspectInfluence : undefined;

  if (!target || !influence) {
    return (
      <ExplorerDetailShell icon="🔗" label={t("explorer:typeSingular.aspect")} color="#7effb2" item={item}>
        <EmptyState icon="🔗" title={t("explorer:aspect.notAvailableTitle")} message={t("explorer:aspect.notAvailableMessage")} />
      </ExplorerDetailShell>
    );
  }

  const { aspectedBy, housesAspected, beneficAspectCount, maleficAspectCount, netInfluence } = influence;

  return (
    <ExplorerDetailShell icon="🔗" label={t("explorer:typeSingular.aspect")} color="#7effb2" item={item}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <h4 style={{ margin: 0, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
            color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
            {t("explorer:aspect.sourcesHeading")}
          </h4>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
          {aspectedBy.map((source) => <Badge key={source} color={colorFor(source)}>{source}</Badge>)}
          <span style={{ color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>→</span>
          <Badge color={colorFor(target)}>{target}</Badge>
        </div>
        <InsightRow label={t("explorer:aspect.beneficAspects")} value={beneficAspectCount} color="#7effb2" />
        <InsightRow label={t("explorer:aspect.maleficAspects")} value={maleficAspectCount} color="#ff7b7b" />
        <InsightRow label={t("explorer:aspect.netInfluenceStrength")} value={netInfluence >= 0 ? `+${netInfluence}` : netInfluence} color="#9dc9ff" />
        {housesAspected?.length > 0 && (
          <InsightRow label={t("explorer:aspect.housesAspected")} value={housesAspected.map((h) => t("explorer:aspect.houseLabel", { num: h })).join(", ")} color="#ffb347" />
        )}
        <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
          {interpret(beneficAspectCount, maleficAspectCount, netInfluence, t)}
        </p>
      </GlassCard>

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in this aspect's own Drishti-evaluator facts
          already rendered above. */}
      <ExplorerAIPanel
        cacheKey={`aspect-${target}`}
        itemType="aspect"
        itemId={item?.id ?? `aspect-${target}`}
        itemLabel={item?.label ?? t("explorer:aspect.itemLabel", { target })}
        chart={chart}
        report={report}
        contextFacts={{
          target, aspectedBy, housesAspected, beneficAspectCount, maleficAspectCount, netInfluence,
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(AspectExplorerPanel);
