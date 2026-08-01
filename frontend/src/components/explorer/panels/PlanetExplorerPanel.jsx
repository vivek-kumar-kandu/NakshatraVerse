import { memo, useMemo } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import InsightRow from "../../common/InsightRow.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExpandableSection from "../../report/ExpandableSection.jsx";
import PredictionCard from "../../report/PredictionCard.jsx";
import RemedyCard from "../../report/RemedyCard.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";
// V5.3 (Explainable Report Intelligence) — additive import only.
import CrossLinkPanel from "../../explanation/CrossLinkPanel.jsx";
import { PLANET_COLORS, PLANET_SIGNIFICANCE, HOUSE_MEANINGS } from "../../../constants/astrology.js";
import { plainPlanetName, predictionsForPlanet, remediesFromPredictions } from "../../../utils/explorerData.js";

// ─────────────────────────────────────────────────────────────────────────
// PlanetExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure: Backend
// Integration)
//
// Connects the "planet" selection type to real backend data:
//   - position/sign/house: `planetary[fullKey]` (Planet Position + House
//     Placement Engines — unchanged, already used elsewhere in the app).
//   - strength/dignity/retrograde/combustion/functional nature: the full
//     per-planet `report.planetStrength[plainName]` profile, newly
//     exposed this phase (see planetStrengthEngine.js) but computed by
//     the existing, untouched Planet Strength Rule Evaluator.
//   - related predictions/remedies: `report.predictions`, filtered by
//     this planet via the shared `predictionsForPlanet` helper — no new
//     scoring, just cross-referencing already-computed category
//     predictions.
// No astrology math happens in this file.
// ─────────────────────────────────────────────────────────────────────────
function DignityBadge({ dignity }) {
  if (!dignity) return null;
  const color = dignity.state === "exalted" ? "#7effb2"
    : dignity.state === "debilitated" ? "#ff7b7b"
    : dignity.state === "ownSign" ? "#ffd700"
    : "#9dc9ff";
  return <Badge color={color}>{dignity.label || dignity.state}</Badge>;
}

function PlanetExplorerPanel({ item, planetary, report, chart }) {
<<<<<<< HEAD
=======
  const { t } = useTranslation(["explorer"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  const fullKey = item?.id;
  const plain = useMemo(() => plainPlanetName(fullKey), [fullKey]);
  const position = planetary?.[fullKey];
  const strength = report?.planetStrength?.[plain];

  const relatedPredictions = useMemo(() => predictionsForPlanet(report, plain), [report, plain]);
  const relatedRemedies = useMemo(() => remediesFromPredictions(relatedPredictions), [relatedPredictions]);

  const color = PLANET_COLORS[fullKey] || "#bf7fff";

  if (!position && !strength) {
    return (
<<<<<<< HEAD
      <ExplorerDetailShell icon="🪐" label="Planet" color={color} item={item}>
        <EmptyState icon="🪐" title="Planet data not available"
          message="This chart doesn't have computed position data for this planet yet." />
=======
      <ExplorerDetailShell icon="🪐" label={t("explorer:typeSingular.planet")} color={color} item={item}>
        <EmptyState icon="🪐" title={t("explorer:planet.notAvailableTitle")}
          message={t("explorer:planet.notAvailableMessage")} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
      </ExplorerDetailShell>
    );
  }

  return (
<<<<<<< HEAD
    <ExplorerDetailShell icon="🪐" label="Planet" color={color} item={item}>
      <GlassCard style={{ padding: 24 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          POSITION & DIGNITY
        </h4>
        {position && (
          <>
            <InsightRow label="House" value={`House ${position.house} · ${HOUSE_MEANINGS[position.house] || ""}`} color={color} />
            <InsightRow label="Sign" value={position.sign} color={color} />
=======
    <ExplorerDetailShell icon="🪐" label={t("explorer:typeSingular.planet")} color={color} item={item}>
      <GlassCard style={{ padding: 24 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          {t("explorer:planet.positionDignityHeading")}
        </h4>
        {position && (
          <>
            <InsightRow label={t("explorer:planet.houseLabel")} value={t("explorer:house.itemLabel", { num: position.house }) + (HOUSE_MEANINGS[position.house] ? ` · ${HOUSE_MEANINGS[position.house]}` : "")} color={color} />
            <InsightRow label={t("explorer:planet.signLabel")} value={position.sign} color={color} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </>
        )}
        {strength && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
              <DignityBadge dignity={strength.dignity} />
<<<<<<< HEAD
              {strength.retrograde && <Badge color="#ff9ed8">Retrograde (Vakri)</Badge>}
              {strength.combustion?.combust && <Badge color="#ff7b7b">Combust (Asta)</Badge>}
              {strength.functionalNature?.nature && (
                <Badge color={strength.functionalNature.nature === "malefic" ? "#ff7b7b" : "#7effb2"}>
                  Functionally {strength.functionalNature.nature}
                </Badge>
              )}
              {strength.friendship?.relation && <Badge color="#9dc9ff">{strength.friendship.relation} sign</Badge>}
            </div>
            <InsightRow label="Adjusted Strength Score" value={strength.adjustedScore ?? "—"} color={color} />
            {strength.shadbala?.total != null && (
              <InsightRow label="Foundation Shadbala" value={strength.shadbala.total} color={color} />
=======
              {strength.retrograde && <Badge color="#ff9ed8">{t("explorer:planet.retrogradeBadge")}</Badge>}
              {strength.combustion?.combust && <Badge color="#ff7b7b">{t("explorer:planet.combustBadge")}</Badge>}
              {strength.functionalNature?.nature && (
                <Badge color={strength.functionalNature.nature === "malefic" ? "#ff7b7b" : "#7effb2"}>
                  {t("explorer:planet.functionallyNature", { nature: strength.functionalNature.nature })}
                </Badge>
              )}
              {strength.friendship?.relation && <Badge color="#9dc9ff">{t("explorer:planet.friendshipSignSuffix", { relation: strength.friendship.relation })}</Badge>}
            </div>
            <InsightRow label={t("explorer:planet.adjustedStrengthScore")} value={strength.adjustedScore ?? t("explorer:planet.notAvailableValue")} color={color} />
            {strength.shadbala?.total != null && (
              <InsightRow label={t("explorer:planet.foundationShadbala")} value={strength.shadbala.total} color={color} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
            )}
            {strength.explanation && (
              <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
                {strength.explanation}
              </p>
            )}
          </>
        )}
        {!strength && (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif" }}>
<<<<<<< HEAD
            Detailed strength scoring isn't available for this chart.
=======
            {t("explorer:planet.strengthUnavailable")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
          </p>
        )}
        <p style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif" }}>
          {PLANET_SIGNIFICANCE[fullKey] || ""}
        </p>
      </GlassCard>

<<<<<<< HEAD
      <ExpandableSection icon="🔮" title="Related Predictions" color="#ffd700" count={relatedPredictions.length}>
=======
      <ExpandableSection icon="🔮" title={t("explorer:common.relatedPredictions")} color="#ffd700" count={relatedPredictions.length}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        {relatedPredictions.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {relatedPredictions.map((p, idx) => <PredictionCard key={p.category} prediction={p} idx={idx} />)}
          </div>
        ) : (
<<<<<<< HEAD
          <EmptyState compact icon="🔮" title="No linked predictions" message={`No category prediction currently names ${plain} as its dominant or supporting planet.`} />
        )}
      </ExpandableSection>

      <ExpandableSection icon="🪬" title="Related Remedies" color="#ffb347" count={relatedRemedies.length}>
=======
          <EmptyState compact icon="🔮" title={t("explorer:common.noLinkedPredictionsTitle")} message={t("explorer:planet.noLinkedPredictionsMessage", { planet: plain })} />
        )}
      </ExpandableSection>

      <ExpandableSection icon="🪬" title={t("explorer:common.relatedRemedies")} color="#ffb347" count={relatedRemedies.length}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        {relatedRemedies.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {relatedRemedies.map((r, idx) => <RemedyCard key={`${r.type}-${idx}`} type={r.type} detail={r.detail} idx={idx} />)}
          </div>
        ) : (
<<<<<<< HEAD
          <EmptyState compact icon="🪬" title="No linked remedies" message={`No remedy is currently associated with ${plain} through this chart's predictions.`} />
=======
          <EmptyState compact icon="🪬" title={t("explorer:common.noLinkedRemediesTitle")} message={t("explorer:planet.noLinkedRemediesMessage", { planet: plain })} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        )}
      </ExpandableSection>

      {/* V5.3 (Explainable Report Intelligence): additive — related AI
          Timeline events sharing this planet, purely derived data (no
          Gemini call), cross-linking Explorer to Timeline. */}
      <CrossLinkPanel chart={chart} itemType="planet" itemId={fullKey} itemLabel={plain} planet={plain} />

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in the exact position/strength/dignity facts
          already rendered above — nothing new is computed here. */}
      <ExplorerAIPanel
        cacheKey={`planet-${fullKey}`}
        itemType="planet"
        itemId={fullKey}
        itemLabel={item?.label ?? fullKey}
        chart={chart}
        report={report}
        contextFacts={{
          position,
          strength: strength ? {
            dignity: strength.dignity, retrograde: strength.retrograde,
            combustion: strength.combustion, functionalNature: strength.functionalNature,
            friendship: strength.friendship, adjustedScore: strength.adjustedScore,
            shadbalaTotal: strength.shadbala?.total,
          } : undefined,
          relatedPredictionCategories: relatedPredictions.map((p) => p.category),
          relatedRemedyTypes: relatedRemedies.map((r) => r.type),
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(PlanetExplorerPanel);
