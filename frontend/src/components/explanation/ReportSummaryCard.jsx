import { memo, useCallback } from "react";
import GlassCard from "../common/GlassCard.jsx";
import TypingIndicator from "../assistant/TypingIndicator.jsx";
import ChatMessage from "../assistant/ChatMessage.jsx";
import { fetchReportSummary } from "../../utils/explanationApi.js";
import { useExplanation } from "../../hooks/useExplanation.js";

// ─────────────────────────────────────────────────────────────────────────
// ReportSummaryCard — V5.3 (Explainable Report Intelligence)
//
// "AI Report Summary": a concise, whole-report synthesis that sits above
// the existing per-section AI Life Summary (report.lifeSummary, generated
// at report-creation time by promptBuilder.js — unchanged). Built entirely
// on the new Explanation Engine (explanationEngine.js -> POST
// /api/explanation/report-summary), and rendered through the SAME
// `ChatMessage` component ExplorerAIPanel.jsx/AiTimelineAIPanel.jsx already
// use for their own AI answers — no new visual language, no UI redesign.
//
// Lazy: nothing is fetched until "Summarize with AI" is tapped. Memoized:
// useExplanation's shared cache means this card (and any other Explanation
// Engine surface requesting the same report) never re-fetches an identical
// summary.
// ─────────────────────────────────────────────────────────────────────────
function ReportSummaryCard({ chart, report, history }) {
  const cacheKey = `report-summary:${chart?.userData?.name || "?"}:${chart?.userData?.dob || "?"}:${chart?.userData?.tob || "?"}`;

  const fetcher = useCallback(
    () => fetchReportSummary({ chart, report, history }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chart, report]
  );

  const { data: summary, loading, error, request, retry } = useExplanation({
    cacheKey,
    fetcher,
    enabled: Boolean(chart),
  });

  if (!chart) return null;

  return (
    <GlassCard style={{ padding: 24, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span aria-hidden="true" style={{ fontSize: 18 }}>🧭</span>
        <h4 style={{ margin: 0, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          AI REPORT SUMMARY
        </h4>
      </div>

      {!summary && !loading && !error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.75))", fontFamily: "Inter,sans-serif" }}>
            Get a concise, whole-report synthesis — the single most important theme right now, grounded in this chart's own backend-computed facts.
          </p>
          <button
            type="button"
            onClick={request}
            className="pill-btn tap-scale"
            aria-label="Summarize with AI — this report"
            style={{
              flexShrink: 0, padding: "10px 18px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", border: "1px solid var(--nv-accent-wash-strong, rgba(180,120,255,0.4))",
              background: "var(--nv-accent-wash, rgba(123,47,255,0.18))", color: "var(--nv-text-primary, #e8d5ff)",
              fontFamily: "Inter,sans-serif",
            }}
          >
            ✨ Summarize with AI
          </button>
        </div>
      )}

      {loading && <TypingIndicator label="Generating your AI Report Summary" />}

      {error && !loading && (
        <div role="alert" style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={retry}
            className="pill-btn tap-scale"
            style={{
              justifySelf: "flex-start", padding: "8px 16px", borderRadius: 18, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "1px solid rgba(255,120,120,0.35)", background: "rgba(120,20,20,0.25)",
              color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif",
            }}
          >
            ↻ Try again
          </button>
        </div>
      )}

      {summary && !loading && (
        <ChatMessage
          role="assistant"
          content={summary.detailedExplanation || summary.summary}
          shortAnswer={summary.shortAnswer ?? summary.summary}
          detailedExplanation={summary.detailedExplanation}
          evidence={summary.evidence}
          confidence={summary.confidence}
          suggestedNextQuestion={summary.suggestedNextQuestion}
          onRegenerate={retry}
        />
      )}
    </GlassCard>
  );
}

export default memo(ReportSummaryCard);
