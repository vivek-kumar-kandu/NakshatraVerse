import { memo } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import InsightRow from "../common/InsightRow.jsx";

// ─────────────────────────────────────────────────────────────────────────
// NakshatraCard (V3.0 Phase 3 — reusable report component)
//
// Renders `report.nakshatraProfile` exactly as predictionApiMapper.js
// already shapes it (mapNakshatraProfile) — no new interpretation, only a
// reusable presentation extracted from the Predictions tab.
// ─────────────────────────────────────────────────────────────────────────
function NakshatraCard({ nakshatraProfile }) {
  const { t } = useTranslation(["results"]);
  if (!nakshatraProfile) return null;
  return (
    <GlassCard style={{ padding: 24, animation: "fadeIn 0.35s ease both" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase",
        color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>{t("results:nakshatraCard.heading")}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <Badge color="#ffd700">{nakshatraProfile.nakshatra} · {t("results:nakshatraCard.pada", { number: nakshatraProfile.pada })}</Badge>
        <Badge color="#bf7fff">{t("results:nakshatraCard.lord", { value: nakshatraProfile.lord ? t(`results:planets.${nakshatraProfile.lord.toLowerCase()}`, nakshatraProfile.lord) : "" })}</Badge>
        <Badge color="#9dc9ff">{t("results:nakshatraCard.gana", { value: nakshatraProfile.gana ? t(`results:ganas.${nakshatraProfile.gana.toLowerCase()}`, nakshatraProfile.gana) : "" })}</Badge>
        <Badge color="#9dc9ff">{t("results:nakshatraCard.nadi", { value: nakshatraProfile.nadi ? t(`results:nadis.${nakshatraProfile.nadi.toLowerCase()}`, nakshatraProfile.nadi) : "" })}</Badge>
        <Badge color="#9dc9ff">{t("results:nakshatraCard.yoni", { value: nakshatraProfile.yoni ? t(`results:yonis.${nakshatraProfile.yoni.toLowerCase()}`, nakshatraProfile.yoni) : "" })}</Badge>
      </div>
      <InsightRow label={t("results:nakshatraCard.symbol")} value={nakshatraProfile.symbol} />
      <InsightRow label={t("results:nakshatraCard.deity")} value={nakshatraProfile.deity} />
      <InsightRow label={t("results:nakshatraCard.nature")} value={nakshatraProfile.nature} />
      {nakshatraProfile.personality && (
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontFamily: "Inter,sans-serif" }}>
          {nakshatraProfile.personality}
        </p>
      )}
      {(nakshatraProfile.careerTendencies || nakshatraProfile.relationshipTendencies || nakshatraProfile.spiritualTendencies) && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(180,120,255,0.12)", display: "grid", gap: 6 }}>
          {nakshatraProfile.careerTendencies && <InsightRow label={t("results:nakshatraCard.career")} value={nakshatraProfile.careerTendencies} />}
          {nakshatraProfile.relationshipTendencies && <InsightRow label={t("results:nakshatraCard.relationships")} value={nakshatraProfile.relationshipTendencies} />}
          {nakshatraProfile.spiritualTendencies && <InsightRow label={t("results:nakshatraCard.spiritual")} value={nakshatraProfile.spiritualTendencies} />}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(NakshatraCard);
