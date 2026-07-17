import { memo, useCallback, useEffect, useRef, useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import TypingIndicator from "../assistant/TypingIndicator.jsx";
import ChatMessage from "../assistant/ChatMessage.jsx";
import { fetchExplorerExplanation } from "../../utils/explorerAiApi.js";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerAIPanel — V5.0 Phase 5C (Explorer AI)
//
// Turns any one of the eight Explorer detail panels into an AI-powered
// learning surface, without creating a second chat system:
//   - Calls the new POST /api/explorer-ai/explain endpoint, which itself
//     reuses buildStructuredInsights()/buildChatPrompt()/callGemini() —
//     the exact same AI Report Chat infrastructure — server-side.
//   - Renders the response through the EXISTING `ChatMessage` component
//     (AI Report Chat's own renderer for shortAnswer/detailedExplanation/
//     evidence/confidence/suggestedNextQuestion), so "Summary / Detailed
//     Explanation / Backend Evidence / Confidence / Suggested Next
//     Question" all come from infrastructure this app already ships —
//     nothing new is invented on the frontend either.
//   - Reuses the existing `TypingIndicator` for the loading state and
//     `GlassCard` for the empty/error chrome, matching the rest of the
//     app's visual language instead of introducing new UI primitives.
//
// Performance (lazy, cache-aware, no unnecessary requests):
//   - Nothing is fetched until the person explicitly taps "Explain with
//     AI" — an Explorer selection never triggers a Gemini call by itself.
//   - Once fetched, the explanation for a given (itemType, itemId) is
//     kept in a per-mount `cacheRef` Map, so flipping between two already-
//     explained items (or reopening the same one) never re-fetches.
//     Server-side, callGemini()'s own prompt-hash cache provides a second,
//     cross-session layer of reuse for identical selections.
//   - This component itself is only ever reached via each detail panel,
//     all of which are already lazy-loaded (React.lazy) by
//     ExplorerMainPanel.jsx — no separate code-splitting needed here.
//
// Conversation flow: selecting a different Explorer item changes the
// `cacheKey` prop this component receives, which resets `hasRequested`
// via the effect below — so switching selections always starts a fresh
// "Explain with AI" prompt rather than carrying over a stale answer, with
// zero new conversation/chat state machinery.
// ─────────────────────────────────────────────────────────────────────────
function ExplorerAIPanel({ cacheKey, itemType, itemId, itemLabel, chart, report, contextFacts }) {
  const cacheRef = useRef(new Map());
  const [explanation, setExplanation] = useState(() => cacheRef.current.get(cacheKey) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // A new Explorer selection (new cacheKey) always starts from whatever
  // is already cached for it (possibly nothing yet) — never shows a
  // previous selection's stale explanation while switching.
  useEffect(() => {
    setExplanation(cacheRef.current.get(cacheKey) || null);
    setError(null);
    setLoading(false);
  }, [cacheKey]);

  const requestExplanation = useCallback(async () => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setExplanation(cached);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchExplorerExplanation({ chart, report, itemType, itemId, itemLabel, contextFacts });
      cacheRef.current.set(cacheKey, result);
      setExplanation(result);
    } catch (err) {
      setError(err.message || "The Explorer AI is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [cacheKey, chart, report, itemType, itemId, itemLabel, contextFacts]);

  const handleRetry = useCallback(() => {
    cacheRef.current.delete(cacheKey);
    requestExplanation();
  }, [cacheKey, requestExplanation]);

  return (
    <GlassCard style={{ padding: 24, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span aria-hidden="true" style={{ fontSize: 18 }}>🤖</span>
        <h4 style={{ margin: 0, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
          AI EXPLANATION
        </h4>
      </div>

      {!explanation && !loading && !error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.75))", fontFamily: "Inter,sans-serif" }}>
            Get a Gemini-powered explanation of {itemLabel}, grounded entirely in this chart's own backend-computed facts.
          </p>
          <button
            type="button"
            onClick={requestExplanation}
            className="pill-btn tap-scale"
            aria-label={`Explain ${itemLabel} with AI`}
            style={{
              flexShrink: 0, padding: "10px 18px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", border: "1px solid var(--nv-accent-wash-strong, rgba(180,120,255,0.4))",
              background: "var(--nv-accent-wash, rgba(123,47,255,0.18))", color: "var(--nv-text-primary, #e8d5ff)",
              fontFamily: "Inter,sans-serif",
            }}
          >
            ✨ Explain with AI
          </button>
        </div>
      )}

      {loading && <TypingIndicator label={`Generating an AI explanation for ${itemLabel}`} />}

      {error && !loading && (
        <div role="alert" style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={handleRetry}
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

      {explanation && !loading && (
        <ChatMessage
          role="assistant"
          content={explanation.detailedExplanation || explanation.summary}
          shortAnswer={explanation.shortAnswer ?? explanation.summary}
          detailedExplanation={explanation.detailedExplanation}
          evidence={explanation.evidence}
          confidence={explanation.confidence}
          suggestedNextQuestion={explanation.suggestedNextQuestion}
          onRegenerate={handleRetry}
        />
      )}
    </GlassCard>
  );
}

export default memo(ExplorerAIPanel);
