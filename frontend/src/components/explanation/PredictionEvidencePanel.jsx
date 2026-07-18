import { memo, useCallback } from "react";
import TypingIndicator from "../assistant/TypingIndicator.jsx";
import { fetchPredictionEvidence } from "../../utils/explanationApi.js";
import { useExplanation } from "../../hooks/useExplanation.js";

// ─────────────────────────────────────────────────────────────────────────
// PredictionEvidencePanel — V5.3 (Explainable Report Intelligence)
// Shows the exact backend facts (planets/houses/yogas/doshas/dasha window)
// supporting one category prediction, plus an optional AI walkthrough of
// that same evidence. Deterministic evidence always renders once
// requested — it comes directly from predictionEngine.js's own output via
// explanationEngine.js, so it never depends on Gemini being reachable.
// ─────────────────────────────────────────────────────────────────────────
function PredictionEvidencePanel({ chart, report, category }) {
  const cacheKey = `prediction-evidence:${chart?.userData?.name || "?"}:${chart?.userData?.dob || "?"}:${category}`;

  const fetcher = useCallback(
    () => fetchPredictionEvidence({ chart, report, category }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chart, report, category]
  );

  const { data, loading, error, request } = useExplanation({
    cacheKey,
    fetcher,
    enabled: Boolean(chart && category),
  });

  if (!chart || !category) return null;

  return (
    <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
      {!data && !loading && !error && (
        <button
          type="button"
          onClick={request}
          className="pill-btn tap-scale"
          aria-label={`Show the evidence — ${category}`}
          style={{
            justifySelf: "flex-start", padding: "6px 14px", borderRadius: 16, fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", border: "1px solid var(--nv-accent-wash-strong, rgba(180,120,255,0.35))",
            background: "transparent", color: "var(--nv-text-secondary, rgba(230,220,255,0.75))",
            fontFamily: "Inter,sans-serif",
          }}
        >
          🔎 Show the evidence
        </button>
      )}

      {loading && <TypingIndicator label={`Gathering evidence for ${category}`} />}

      {error && !loading && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif" }}>
          {error}
        </p>
      )}

      {data && !loading && (
        <div style={{ display: "grid", gap: 8, padding: "10px 12px", borderRadius: 12,
          background: "var(--nv-glass-bg-soft, rgba(255,255,255,0.03))", border: "1px solid var(--nv-glass-border, rgba(200,160,255,0.12))" }}>
          <ul style={{ margin: 0, padding: "0 0 0 18px", display: "grid", gap: 4 }}>
            {(data.evidence || []).map((line, i) => (
              <li key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--nv-text-secondary, rgba(230,220,255,0.75))", fontFamily: "Inter,sans-serif" }}>
                {line}
              </li>
            ))}
          </ul>
          {data.narrative && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}>
              {data.narrative}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(PredictionEvidencePanel);
