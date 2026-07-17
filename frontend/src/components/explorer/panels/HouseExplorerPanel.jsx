import { memo, useMemo } from "react";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";
import InsightRow from "../../common/InsightRow.jsx";
import EmptyState from "../../common/EmptyState.jsx";
import ExpandableSection from "../../report/ExpandableSection.jsx";
import PredictionCard from "../../report/PredictionCard.jsx";
import RemedyCard from "../../report/RemedyCard.jsx";
import ExplorerDetailShell from "./ExplorerDetailShell.jsx";
import ExplorerAIPanel from "../ExplorerAIPanel.jsx";
import { PLANET_COLORS, HOUSE_MEANINGS, SIGN_LORD } from "../../../constants/astrology.js";
import { signForHouse } from "../../../utils/houseSign.js";
import { plainPlanetName, predictionsForHouse, remediesFromPredictions } from "../../../utils/explorerData.js";

// ─────────────────────────────────────────────────────────────────────────
// HouseExplorerPanel (V5.0 Phase 5B — Explorer Infrastructure: Backend
// Integration)
//
// Connects the "house" selection type to real backend data:
//   - occupants: derived from `planetary` (House Placement Engine output),
//     the same grouping KundliTab already computes.
//   - sign/lord: `signForHouse` (inverse of ZodiacWheel's own house-from-
//     sign formula) + the static `SIGN_LORD` rulership table — a fixed
//     astrological fact, not a calculation.
//   - occupant strength: `report.planetStrength[plainName].dignity`.
//   - predictions/remedies: `report.predictions` filtered by
//     `supportingHouses` via the shared `predictionsForHouse` helper.
// ─────────────────────────────────────────────────────────────────────────
function HouseExplorerPanel({ item, userData, planetary, report, chart }) {
  const houseNum = Number(item?.id?.replace("house-", ""));

  const occupants = useMemo(
    () => Object.entries(planetary || {}).filter(([, info]) => info?.house === houseNum).map(([planet]) => planet),
    [planetary, houseNum]
  );
  const sign = signForHouse(userData?.lagna, houseNum);
  const lord = sign ? SIGN_LORD[sign] : undefined;

  const relatedPredictions = useMemo(() => predictionsForHouse(report, houseNum), [report, houseNum]);
  const relatedRemedies = useMemo(() => remediesFromPredictions(relatedPredictions), [relatedPredictions]);

  if (!Number.isFinite(houseNum)) {
    return (
      <ExplorerDetailShell icon="🏠" label="House" color="#9dc9ff" item={item}>
        <EmptyState icon="🏠" title="House data not available" message="Select a house from the panel to explore it here." />
      </ExplorerDetailShell>
    );
  }

  return (
    <ExplorerDetailShell icon="🏠" label="House" color="#9dc9ff" item={item}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {sign && <Badge color="#ffb347">Sign: {sign}</Badge>}
          {lord && <Badge color="#bf7fff">Lord: {lord}</Badge>}
        </div>
        <InsightRow label="Meaning" value={HOUSE_MEANINGS[houseNum] || "—"} />
        <h4 style={{ margin: "16px 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          OCCUPANTS
        </h4>
        {occupants.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {occupants.map((planet) => {
              const dignity = report?.planetStrength?.[plainPlanetName(planet)]?.dignity;
              return (
                <Badge key={planet} color={PLANET_COLORS[planet] || "#bf7fff"}>
                  {planet}{dignity && dignity.state !== "neutral" ? ` · ${dignity.label}` : ""}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", fontFamily: "Inter,sans-serif" }}>
            No planets currently occupy this house.
          </p>
        )}
      </GlassCard>

      <ExpandableSection icon="🔮" title="Related Predictions" color="#ffd700" count={relatedPredictions.length}>
        {relatedPredictions.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {relatedPredictions.map((p, idx) => <PredictionCard key={p.category} prediction={p} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🔮" title="No linked predictions" message={`No category prediction currently names House ${houseNum} as a supporting house.`} />
        )}
      </ExpandableSection>

      <ExpandableSection icon="🪬" title="Related Remedies" color="#ffb347" count={relatedRemedies.length}>
        {relatedRemedies.length > 0 ? (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {relatedRemedies.map((r, idx) => <RemedyCard key={`${r.type}-${idx}`} type={r.type} detail={r.detail} idx={idx} />)}
          </div>
        ) : (
          <EmptyState compact icon="🪬" title="No linked remedies" message={`No remedy is currently associated with House ${houseNum} through this chart's predictions.`} />
        )}
      </ExpandableSection>

      {/* V5.0 Phase 5C (Explorer AI): additive-only AI explanation
          section, grounded in this house's own occupants/sign/lord facts
          already rendered above. */}
      <ExplorerAIPanel
        cacheKey={`house-${houseNum}`}
        itemType="house"
        itemId={item?.id}
        itemLabel={item?.label ?? `House ${houseNum}`}
        chart={chart}
        report={report}
        contextFacts={{
          houseNumber: houseNum, sign, lord, occupants,
          relatedPredictionCategories: relatedPredictions.map((p) => p.category),
        }}
      />
    </ExplorerDetailShell>
  );
}

export default memo(HouseExplorerPanel);
