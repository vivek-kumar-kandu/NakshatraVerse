import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExpandableSection from "../../report/ExpandableSection.jsx";
import PredictionCard from "../../report/PredictionCard.jsx";
import RemedyCard from "../../report/RemedyCard.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";
import { predictionsCiting, remediesFromPredictions } from "../../../utils/explorerData.js";

// ─────────────────────────────────────────────────────────────────────────
// DoshaExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure: Backend
// Integration)
//
// Connects the "dosha" selection type to `report.chart.doshas[]` — the
// existing, unmodified Rule Engine output ({ name, detail, severity,
// remedies, explanationMeta } from doshaRuleEvaluator.js's enrichment
// step) — plus, via `predictionsCiting`, the category predictions that
// named this dosha as a supporting factor (used for "Affected houses").
// Remedies prefer the dosha's own `remedies` field when present, falling
// back to remedies pulled from citing predictions.
// ─────────────────────────────────────────────────────────────────────────
function severityColor(severity) {
  const s = (severity || "").toLowerCase();
  if (s.includes("high") || s.includes("severe")) return "#ff7b7b";
  if (s.includes("moderate") || s.includes("medium")) return "#ffb347";
  if (s.includes("low") || s.includes("mild")) return "#7effb2";
  return "#ff9ed8";
}

function DoshaExplorerPanel({ item, report, chart }) {
  const { t } = useTranslation(["explorer"]);
  const name = item?.label;
  const dosha = useMemo(
    () => (report?.chart?.doshas || []).find((d) => d.name === name),
    [report, name]
  );
  const citingPredictions = useMemo(() => predictionsCiting(report, "dosha", name), [report, name]);

  const affectedHouses = useMemo(() => {
    const set = new Set();
    citingPredictions.forEach((p) => (p.supportingHouses || []).forEach((h) => set.add(h)));
    return [...set].sort((a, b) => a - b);
  }, [citingPredictions]);

  const remedies = useMemo(() => {
    if (dosha?.remedies?.length) return dosha.remedies.map((r) => (typeof r === "string" ? { type: "General", detail: r } : r));
    return remediesFromPredictions(citingPredictions);
  }, [dosha, citingPredictions]);

  if (!dosha) {
    return (
      <ExplorerDetailShell icon="⚠️" label={t("explorer:typeSingular.dosha")} color="#ff9ed8" item={item}>
        <EmptyState icon="⚠️" title={t("explorer:dosha.notFoundTitle")} message={t("explorer:dosha.notFoundMessage")} />
      </ExplorerDetailShell>
    );
  }

  return (
    <ExplorerDetailShell icon="⚠️" label={t("explorer:typeSingular.dosha")} color="#ff9ed8" item={item}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <Badge color="#ff9ed8">{t("explorer:dosha.matchingRuleBadge", { name: dosha.name })}</Badge>
          {dosha.severity && <Badge color={severityColor(dosha.severity)}>{t("explorer:dosha.severityBadge", { severity: dosha.severity })}</Badge>}
          {dosha.influence && <Badge color={dosha.influence === "negative" ? "#ff7b7b" : "#7effb2"}>{dosha.influence}</Badge>}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
          {dosha.detail}
        </p>
        {dosha.explanationMeta && (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif" }}>
            {dosha.explanationMeta}
          </p>
        )}

        <h4 style={{ margin: "18px 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          {t("explorer:dosha.affectedHousesHeading")}
        </h4>
        {affectedHouses.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {affectedHouses.map((h) => <Badge key={h} color="#9dc9ff">{t("explorer:dosha.houseBadge", { num: h })}</Badge>)}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", fontFamily: "Inter,sans-serif" }}>
            {t("explorer:dosha.noAffectedHouses")}
          </p>
        )}
      </GlassCard>

      <ExpandableSection icon="🪬" title={t("explorer:dosha.remedies")} color="#ffb347" count={remedies.length}>
        {remedies.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {remedies.map((r, idx) => <RemedyCard key={`${r.type}-${idx}`} type={r.type} detail={r.detail} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🪬" title={t("explorer:common.noRemediesTitle")} message={t("explorer:dosha.noRemediesMessage")} />
        )}
      </ExpandableSection>

      <ExpandableSection icon="🔮" title={t("explorer:dosha.linkedPredictions")} color="#ffd700" count={citingPredictions.length}>
        {citingPredictions.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {citingPredictions.map((p, idx) => <PredictionCard key={p.category} prediction={p} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🔮" title={t("explorer:common.noLinkedPredictionsTitle")} message={t("explorer:dosha.noLinkedPredictionsMessage")} />
        )}
      </ExpandableSection>

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in this dosha's own rule-engine facts already
          rendered above. */}
      <ExplorerAIPanel
        cacheKey={`dosha-${name}`}
        itemType="dosha"
        itemId={item?.id ?? name}
        itemLabel={name}
        chart={chart}
        report={report}
        contextFacts={{
          name: dosha.name, detail: dosha.detail, severity: dosha.severity, influence: dosha.influence,
          affectedHouses, remedies: remedies.map((r) => r.type),
          citingPredictionCategories: citingPredictions.map((p) => p.category),
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(DoshaExplorerPanel);
