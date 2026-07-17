import { memo, useCallback } from "react";
import TypingIndicator from "../assistant/TypingIndicator.jsx";
import { fetchRemedyExplanation } from "../../utils/explanationApi.js";
import { useExplanation } from "../../hooks/useExplanation.js";

// ─────────────────────────────────────────────────────────────────────────
// RemedyExplanationCard — V5.3 (Explainable Report Intelligence)
// Explains why a specific already-derived remedy (remedyEngine.js output,
// unmodified) was suggested. Never invents a new remedy — if the remedy
// type isn't present on this chart, says so plainly instead of guessing.
// ─────────────────────────────────────────────────────────────────────────
function RemedyExplanationCard({ chart, report, remedyType }) {
  const cacheKey = `remedy:${chart?.userData?.name || "?"}:${chart?.userData?.dob || "?"}:${remedyType}`;

  const fetcher = useCallback(
    () => fetchRemedyExplanation({ chart, report, remedyType }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chart, report, remedyType]
  );

  const { data, loading, error, request } = useExplanation({
    cacheKey,
    fetcher,
    enabled: Boolean(chart && remedyType),
  });

  if (!chart || !remedyType) return null;

  return (
    <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
      {!data && !loading && !error && (
        <button
          type="button"
          onClick={request}
          className="pill-btn tap-scale"
          aria-label={`Why this remedy? — ${remedyType}`}
          style={{
            justifySelf: "flex-start", padding: "6px 14px", borderRadius: 16, fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", border: "1px solid var(--nv-accent-wash-strong, rgba(180,120,255,0.35))",
            background: "transparent", color: "var(--nv-text-secondary, rgba(230,220,255,0.75))",
            fontFamily: "Inter,sans-serif",
          }}
        >
          💡 Why this remedy?
        </button>
      )}

      {loading && <TypingIndicator label={`Explaining the ${remedyType} remedy`} />}

      {error && !loading && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif" }}>
          {error}
        </p>
      )}

      {data && !loading && !data.found && (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif" }}>
          This remedy isn't part of this chart's backend-derived remedies.
        </p>
      )}

      {data && !loading && data.found && (
        <div style={{ display: "grid", gap: 8, padding: "10px 12px", borderRadius: 12,
          background: "var(--nv-glass-bg-soft, rgba(255,255,255,0.03))", border: "1px solid var(--nv-glass-border, rgba(200,160,255,0.12))" }}>
          {data.narrative && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}>
              {data.narrative}
            </p>
          )}
          {data.narrativeError && !data.narrative && (
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif" }}>
              (AI narrative unavailable — {data.detail})
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(RemedyExplanationCard);
