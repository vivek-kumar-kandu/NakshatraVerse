import { memo, useCallback } from "react";
import Badge from "../common/Badge.jsx";
import TypingIndicator from "../assistant/TypingIndicator.jsx";
import { fetchConfidenceExplanation } from "../../utils/explanationApi.js";
import { useExplanation } from "../../hooks/useExplanation.js";

// ─────────────────────────────────────────────────────────────────────────
// ConfidenceExplanation — V5.3 (Explainable Report Intelligence)
//
// A small, droppable-in "Why this confidence?" widget for any place a
// category's confidence badge is already shown (PredictionCard.jsx,
// LifeCoachConfidenceBadge.jsx usages) — additive only, does not replace
// or restyle the existing badge, just adds an expandable explanation
// beneath it.
//
// The deterministic evidence bullets (score/label/dasha/planet/supporting
// yogas & doshas) always render immediately once requested — they come
// straight from confidenceEngine.js/predictionEngine.js's own already-
// computed output via explanationEngine.js, so they never depend on
// Gemini being reachable. The optional AI narrative renders underneath
// once/if it resolves.
// ─────────────────────────────────────────────────────────────────────────
function ConfidenceExplanation({ chart, report, category }) {
  const cacheKey = `confidence:${chart?.userData?.name || "?"}:${chart?.userData?.dob || "?"}:${category}`;

  const fetcher = useCallback(
    () => fetchConfidenceExplanation({ chart, report, category }),
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
          aria-label={`Why this confidence? — ${category}`}
          style={{
            justifySelf: "flex-start", padding: "6px 14px", borderRadius: 16, fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", border: "1px solid var(--nv-accent-wash-strong, rgba(180,120,255,0.35))",
            background: "transparent", color: "var(--nv-text-secondary, rgba(230,220,255,0.75))",
            fontFamily: "Inter,sans-serif",
          }}
        >
          ❓ Why this confidence?
        </button>
      )}

      {loading && <TypingIndicator label={`Explaining ${category}'s confidence level`} />}

      {error && !loading && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif" }}>
          {error}
        </p>
      )}

      {data && !loading && (
        <div style={{ display: "grid", gap: 8, padding: "10px 12px", borderRadius: 12,
          background: "var(--nv-glass-bg-soft, rgba(255,255,255,0.03))", border: "1px solid var(--nv-glass-border, rgba(200,160,255,0.12))" }}>
          {data.confidence && (
            <Badge color={data.confidence.score >= 70 ? "#6fe6a8" : data.confidence.score >= 40 ? "#ffd479" : "#ff9d9d"}>
              {data.confidence.label} · {data.confidence.score}/100
            </Badge>
          )}
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
          {data.narrativeError && !data.narrative && (
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif" }}>
              (AI narrative unavailable — showing the underlying backend evidence only.)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ConfidenceExplanation);
