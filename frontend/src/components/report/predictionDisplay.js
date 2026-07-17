// Purely cosmetic mapping from the backend-computed confidence label
// (report.predictions[].confidence.label) to a display color. No scoring
// logic lives here — the label/score themselves are backend-authoritative.
export function confidenceColor(label) {
  if (label === "High") return "#7effb2";
  if (label === "Moderate") return "#ffd700";
  return "#ff8f7e";
}
