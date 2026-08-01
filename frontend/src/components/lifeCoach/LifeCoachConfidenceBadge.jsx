import { memo } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import Badge from "../common/Badge.jsx";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachConfidenceBadge — V4.3 (AI Life Coach Enhancement Pass)
// Renders a single "Confidence: <Label> (<score>/100)" badge on top of the
// existing Badge primitive. Purely presentational: the score/label pair
// it renders always comes from the backend's confidenceEngine.js (never
// from Gemini) — this component never computes or guesses a confidence
// value itself.
// ─────────────────────────────────────────────────────────────────────────
const LABEL_COLOR = {
  "Very High": "#7effb2",
  High: "#9dc9ff",
  Moderate: "#ffd700",
  Low: "#ff8fa3",
};

function LifeCoachConfidenceBadge({ confidence, style = {} }) {
<<<<<<< HEAD
=======
  const { t } = useTranslation(["lifeCoach"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  if (!confidence || confidence.label == null) return null;
  const color = LABEL_COLOR[confidence.label] || "#bf7fff";
  return (
    <Badge color={color} style={style}>
<<<<<<< HEAD
      Confidence: {confidence.label}{typeof confidence.score === "number" ? ` (${confidence.score}/100)` : ""}
=======
      {typeof confidence.score === "number"
        ? t("lifeCoach:confidenceBadge.withScore", { label: confidence.label, score: confidence.score })
        : t("lifeCoach:confidenceBadge.withoutScore", { label: confidence.label })}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
    </Badge>
  );
}

export default memo(LifeCoachConfidenceBadge);
