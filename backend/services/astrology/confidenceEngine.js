// ─────────────────────────────────────────────────────────────────────────
// Confidence Engine — V4.3 (AI Life Coach Enhancement Pass)
// Single responsibility: turn an already-computed backend confidence
// score (0-100) into a display label. This module NEVER computes a new
// confidence score itself — every score it labels comes from
// predictionRuleEvaluator.js's existing computeConfidence() (already
// used for every category prediction, see predictionConfidence.json) or
// from panchangEngine.js's existing auspiciousnessScore. It only adds a
// finer "Very High / High / Moderate / Low" bucketing on top of those
// already-computed numbers for the Life Coach UI — Gemini never sees or
// generates any of these values.
// ─────────────────────────────────────────────────────────────────────────

const BANDS = [
  { min: 85, label: "Very High" },
  { min: 65, label: "High" },
  { min: 40, label: "Moderate" },
  { min: 0, label: "Low" },
];

export function scoreToConfidenceLabel(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return "Moderate";
  const band = BANDS.find((b) => score >= b.min);
  return band ? band.label : "Low";
}

export function deriveConfidence(score) {
  const numeric = typeof score === "number" && !Number.isNaN(score) ? Math.round(score) : null;
  return { score: numeric, label: scoreToConfidenceLabel(numeric) };
}

// Maps the Life Coach's section keys to the exact category `label` values
// predictionRuleEvaluator.js already returns on each prediction object
// (see predictionCategories.json) — "relationship" reuses the existing
// "Marriage" category prediction rather than introducing a new one.
const SECTION_TO_CATEGORY_LABEL = {
  career: "Career",
  relationship: "Marriage",
  finance: "Finance",
  health: "Health",
};

// Finds the matching backend-computed prediction (if any) for a Life
// Coach section and labels its already-computed confidence.score. Never
// recomputes confidence — only reads predictions[].confidence.score that
// generateCategoryPredictions() already produced.
export function deriveCategoryConfidence(predictions, sectionKey) {
  const label = SECTION_TO_CATEGORY_LABEL[sectionKey] || sectionKey;
  const match = (predictions || []).find((p) => p.category === label);
  return deriveConfidence(match?.confidence?.score);
}

// A single "overall" confidence for the day/week/month energy score —
// averages whatever already-computed numeric scores are available
// (today's Panchang auspiciousness score, plus every category
// prediction's already-computed confidence.score). Purely an average of
// existing numbers, not a new scoring model.
export function deriveOverallConfidence({ panchangScore, predictions } = {}) {
  const predictionScores = (predictions || [])
    .map((p) => p.confidence?.score)
    .filter((s) => typeof s === "number" && !Number.isNaN(s));
  const scores = [panchangScore, ...predictionScores].filter((s) => typeof s === "number" && !Number.isNaN(s));
  if (!scores.length) return deriveConfidence(null);
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return deriveConfidence(avg);
}

export default { scoreToConfidenceLabel, deriveConfidence, deriveCategoryConfidence, deriveOverallConfidence };
