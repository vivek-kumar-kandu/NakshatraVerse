import { memo } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import InsightRow from "../common/InsightRow.jsx";
import { PLANET_COLORS } from "../../constants/astrology.js";
import { confidenceColor } from "./predictionDisplay.js";

function PredictionCard({ prediction, idx = 0 }) {
  const { t } = useTranslation(["results"]);
  const color = confidenceColor(prediction.confidence?.label);
  const confLabel = prediction.confidence?.label ? t(`results:confidence.${prediction.confidence.label.toLowerCase()}`, prediction.confidence.label) : "";
  const catLabel = prediction.category ? t(`results:categories.${prediction.category.toLowerCase()}`, prediction.category) : "";

  return (
    <GlassCard style={{ padding: 20, animation: `fadeIn 0.35s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "#ffd700", fontFamily: "Cinzel,serif", fontWeight: 600 }}>{catLabel}</h3>
        <Badge color={color}>{confLabel} · {prediction.confidence?.score}/100</Badge>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
        {prediction.prediction}
      </p>
      <InsightRow label={t("results:predictionFields.mahadasha", "Mahadasha")} value={prediction.activeMahadasha ? t(`results:planets.${prediction.activeMahadasha.toLowerCase()}`, prediction.activeMahadasha) : "—"} color="#bf7fff" />
      <InsightRow label={t("results:predictionFields.antardasha", "Antardasha")} value={prediction.activeAntardasha ? t(`results:planets.${prediction.activeAntardasha.toLowerCase()}`, prediction.activeAntardasha) : "—"} color="#bf7fff" />
      <InsightRow label={t("results:predictionFields.dominantPlanet", "Dominant Planet")} value={prediction.dominantPlanet ? t(`results:planets.${prediction.dominantPlanet.toLowerCase()}`, prediction.dominantPlanet) : "—"} color={PLANET_COLORS[prediction.dominantPlanet] || "#ffd700"} />
      {prediction.timePeriod?.startDate && (
        <InsightRow label={t("results:predictionFields.timePeriod", "Time Period")} value={`${prediction.timePeriod.startDate} → ${prediction.timePeriod.endDate}`} />
      )}
      {(prediction.supportingYogas?.length > 0 || prediction.supportingDoshas?.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {prediction.supportingYogas?.map((y) => <Badge key={y.name} color="#7effb2">{y.name}</Badge>)}
          {prediction.supportingDoshas?.map((d) => <Badge key={d.name} color="#ff8f7e">{d.name}</Badge>)}
        </div>
      )}
      {prediction.suggestedRemedies?.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,215,0,0.06)", borderRadius: 10, border: "1px solid rgba(255,215,0,0.15)" }}>
          {prediction.suggestedRemedies.map((r) => (
            <p key={r.type} style={{ margin: "0 0 4px", fontSize: 12, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontFamily: "Inter,sans-serif" }}>
              <strong style={{ color: "#ffd700" }}>{r.type}:</strong> {r.detail}
            </p>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(PredictionCard);
