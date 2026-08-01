import { memo } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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

<<<<<<< HEAD
function interpret(beneficCount, maleficCount, netInfluence) {
  if (beneficCount && !maleficCount) return "Purely benefic aspects — a supportive influence.";
  if (maleficCount && !beneficCount) return "Purely malefic aspects — a challenging influence.";
  if (netInfluence > 0) return "Mixed aspects, net benefic influence overall.";
  if (netInfluence < 0) return "Mixed aspects, net malefic influence overall.";
  return "Mixed aspects with a balanced, neutral net influence.";
}

function AspectExplorerPanel({ item, report, chart }) {
=======
function interpret(beneficCount, maleficCount, netInfluence, t) {
  if (beneficCount && !maleficCount) return t("explorer:aspect.interpretPureBenefic");
  if (maleficCount && !beneficCount) return t("explorer:aspect.interpretPureMalefic");
  if (netInfluence > 0) return t("explorer:aspect.interpretMixedNetBenefic");
  if (netInfluence < 0) return t("explorer:aspect.interpretMixedNetMalefic");
  return t("explorer:aspect.interpretMixedNeutral");
}

function AspectExplorerPanel({ item, report, chart }) {
  const { t } = useTranslation(["explorer"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  const target = item?.id?.replace("aspect-", "");
  const influence = target ? report?.planetStrength?.[target]?.aspectInfluence : undefined;

  if (!target || !influence) {
    return (
<<<<<<< HEAD
      <ExplorerDetailShell icon="🔗" label="Aspect" color="#7effb2" item={item}>
        <EmptyState icon="🔗" title="Aspect data not available" message="Select an aspect from the panel to explore it here." />
=======
      <ExplorerDetailShell icon="🔗" label={t("explorer:typeSingular.aspect")} color="#7effb2" item={item}>
        <EmptyState icon="🔗" title={t("explorer:aspect.notAvailableTitle")} message={t("explorer:aspect.notAvailableMessage")} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
      </ExplorerDetailShell>
    );
  }

  const { aspectedBy, housesAspected, beneficAspectCount, maleficAspectCount, netInfluence } = influence;

  return (
<<<<<<< HEAD
    <ExplorerDetailShell icon="🔗" label="Aspect" color="#7effb2" item={item}>
=======
    <ExplorerDetailShell icon="🔗" label={t("explorer:typeSingular.aspect")} color="#7effb2" item={item}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <h4 style={{ margin: 0, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
            color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
<<<<<<< HEAD
            ASPECT SOURCES → TARGET
=======
            {t("explorer:aspect.sourcesHeading")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </h4>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
          {aspectedBy.map((source) => <Badge key={source} color={colorFor(source)}>{source}</Badge>)}
          <span style={{ color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>→</span>
          <Badge color={colorFor(target)}>{target}</Badge>
        </div>
<<<<<<< HEAD
        <InsightRow label="Benefic Aspects" value={beneficAspectCount} color="#7effb2" />
        <InsightRow label="Malefic Aspects" value={maleficAspectCount} color="#ff7b7b" />
        <InsightRow label="Net Influence (Strength)" value={netInfluence >= 0 ? `+${netInfluence}` : netInfluence} color="#9dc9ff" />
        {housesAspected?.length > 0 && (
          <InsightRow label="Houses Aspected" value={housesAspected.map((h) => `House ${h}`).join(", ")} color="#ffb347" />
        )}
        <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
          {interpret(beneficAspectCount, maleficAspectCount, netInfluence)}
=======
        <InsightRow label={t("explorer:aspect.beneficAspects")} value={beneficAspectCount} color="#7effb2" />
        <InsightRow label={t("explorer:aspect.maleficAspects")} value={maleficAspectCount} color="#ff7b7b" />
        <InsightRow label={t("explorer:aspect.netInfluenceStrength")} value={netInfluence >= 0 ? `+${netInfluence}` : netInfluence} color="#9dc9ff" />
        {housesAspected?.length > 0 && (
          <InsightRow label={t("explorer:aspect.housesAspected")} value={housesAspected.map((h) => t("explorer:aspect.houseLabel", { num: h })).join(", ")} color="#ffb347" />
        )}
        <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
          {interpret(beneficAspectCount, maleficAspectCount, netInfluence, t)}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </p>
      </GlassCard>

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in this aspect's own Drishti-evaluator facts
          already rendered above. */}
      <ExplorerAIPanel
        cacheKey={`aspect-${target}`}
        itemType="aspect"
        itemId={item?.id ?? `aspect-${target}`}
<<<<<<< HEAD
        itemLabel={item?.label ?? `Aspects on ${target}`}
=======
        itemLabel={item?.label ?? t("explorer:aspect.itemLabel", { target })}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
