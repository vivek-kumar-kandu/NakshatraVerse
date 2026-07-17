import { memo, useMemo } from "react";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExpandableSection from "../../report/ExpandableSection.jsx";
import PredictionCard from "../../report/PredictionCard.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";
import { PLANET_COLORS } from "../../../constants/astrology.js";
import { predictionsCiting } from "../../../utils/explorerData.js";

// ─────────────────────────────────────────────────────────────────────────
// YogaExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure: Backend
// Integration)
//
// Connects the "yoga" selection type to `report.chart.yogas[]` — the
// existing, unmodified Rule Engine output ({ name, detail, influence,
// explanationMeta, ... } from doshaRuleEvaluator.js's yoga counterpart) —
// plus, via the shared `predictionsCiting` helper, every category
// prediction that named this yoga as a supporting factor. "Confidence"
// and "Contributing planets" are read from those citing predictions
// (report.predictions[].confidence / .dominantPlanet / .supportingPlanets)
// rather than invented here, since no confidence score exists on the
// yoga record itself.
// ─────────────────────────────────────────────────────────────────────────
function YogaExplorerPanel({ item, report, chart }) {
  const name = item?.label;
  const yoga = useMemo(
    () => (report?.chart?.yogas || []).find((y) => y.name === name),
    [report, name]
  );
  const citingPredictions = useMemo(() => predictionsCiting(report, "yoga", name), [report, name]);

  const contributingPlanets = useMemo(() => {
    const set = new Set();
    for (const p of citingPredictions) {
      if (p.dominantPlanet) set.add(p.dominantPlanet);
      (p.supportingPlanets || []).forEach((pl) => set.add(pl));
    }
    return [...set];
  }, [citingPredictions]);

  if (!yoga) {
    return (
      <ExplorerDetailShell icon="⭐" label="Yoga" color="#c9ff7e" item={item}>
        <EmptyState icon="⭐" title="Yoga not found" message="This yoga isn't part of the currently detected set for this chart." />
      </ExplorerDetailShell>
    );
  }

  return (
    <ExplorerDetailShell icon="⭐" label="Yoga" color="#c9ff7e" item={item}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <Badge color="#c9ff7e">Rule matched: {yoga.name}</Badge>
          {yoga.influence && <Badge color={yoga.influence === "negative" ? "#ff7b7b" : "#7effb2"}>{yoga.influence}</Badge>}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
          {yoga.detail}
        </p>
        {yoga.explanationMeta && (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif" }}>
            {yoga.explanationMeta}
          </p>
        )}

        <h4 style={{ margin: "18px 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          CONTRIBUTING PLANETS
        </h4>
        {contributingPlanets.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {contributingPlanets.map((planet) => {
              const fullKey = Object.keys(PLANET_COLORS).find((k) => k.startsWith(planet));
              return <Badge key={planet} color={PLANET_COLORS[fullKey] || "#bf7fff"}>{planet}</Badge>;
            })}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", fontFamily: "Inter,sans-serif" }}>
            No category prediction currently attributes this yoga to specific planets.
          </p>
        )}
      </GlassCard>

      <ExpandableSection icon="🔮" title="Confidence & Effects (from linked predictions)" color="#ffd700" count={citingPredictions.length}>
        {citingPredictions.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {citingPredictions.map((p, idx) => <PredictionCard key={p.category} prediction={p} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🔮" title="No linked predictions"
            message="No category prediction currently cites this yoga as a supporting factor." />
        )}
      </ExpandableSection>

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in this yoga's own rule-engine facts already
          rendered above. */}
      <ExplorerAIPanel
        cacheKey={`yoga-${name}`}
        itemType="yoga"
        itemId={item?.id ?? name}
        itemLabel={name}
        chart={chart}
        report={report}
        contextFacts={{
          name: yoga.name, detail: yoga.detail, influence: yoga.influence,
          contributingPlanets,
          citingPredictionCategories: citingPredictions.map((p) => p.category),
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(YogaExplorerPanel);
