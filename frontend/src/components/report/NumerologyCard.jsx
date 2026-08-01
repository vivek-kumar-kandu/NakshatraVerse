import { memo } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import GlassCard from "../common/GlassCard.jsx";
import ScoreRing from "../common/ScoreRing.jsx";
import { MULANK_DESC } from "../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// NumerologyCard (V3.0 Phase 3 — reusable report component)
//
// Renders `report.chart.numerology` (mulank/bhagyank) exactly as already
// computed by numerologyEngine.js — no new calculation, only a reusable
// presentation extracted from the Overview tab so Numerology reads as its
// own clear section, per the Phase 3 report-layout spec.
// ─────────────────────────────────────────────────────────────────────────
function NumerologyCard({ numerology }) {
<<<<<<< HEAD
=======
  const { t } = useTranslation(["results"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  if (!numerology) return null;
  return (
    <GlassCard style={{ padding: 24, animation: "fadeIn 0.35s ease 0.1s both" }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase",
<<<<<<< HEAD
        color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>NUMEROLOGY</h3>
      <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
        <ScoreRing value={numerology.mulank} label="Mulank" color="#ffd700" />
        <ScoreRing value={numerology.bhagyank} label="Bhagyank" color="#bf7fff" />
      </div>
      <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(255,215,0,0.06)", borderRadius: 10, border: "1px solid rgba(255,215,0,0.15)" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", lineHeight: 1.6, fontFamily: "Inter,sans-serif" }}>
          <strong style={{ color: "#ffd700" }}>Life Path {numerology.mulank}</strong> — {MULANK_DESC[numerology.mulank] || "A unique soul number"}
=======
        color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>{t("results:numerologyCard.heading")}</h3>
      <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
        <ScoreRing value={numerology.mulank} label={t("results:numerologyCard.mulankLabel")} color="#ffd700" />
        <ScoreRing value={numerology.bhagyank} label={t("results:numerologyCard.bhagyankLabel")} color="#bf7fff" />
      </div>
      <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(255,215,0,0.06)", borderRadius: 10, border: "1px solid rgba(255,215,0,0.15)" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", lineHeight: 1.6, fontFamily: "Inter,sans-serif" }}>
          <strong style={{ color: "#ffd700" }}>{t("results:numerologyCard.lifePath", { number: numerology.mulank })}</strong> — {MULANK_DESC[numerology.mulank] || t("results:numerologyCard.defaultDescription")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </p>
      </div>
    </GlassCard>
  );
}

export default memo(NumerologyCard);
