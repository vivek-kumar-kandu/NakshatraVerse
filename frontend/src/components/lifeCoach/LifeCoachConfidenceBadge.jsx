import { memo } from "react";
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
  if (!confidence || confidence.label == null) return null;
  const color = LABEL_COLOR[confidence.label] || "#bf7fff";
  return (
    <Badge color={color} style={style}>
      Confidence: {confidence.label}{typeof confidence.score === "number" ? ` (${confidence.score}/100)` : ""}
    </Badge>
  );
}

export default memo(LifeCoachConfidenceBadge);
