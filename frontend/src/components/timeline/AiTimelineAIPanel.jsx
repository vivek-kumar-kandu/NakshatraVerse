import { memo, useCallback, useEffect, useRef, useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import TypingIndicator from "../assistant/TypingIndicator.jsx";
import ChatMessage from "../assistant/ChatMessage.jsx";
import { fetchAiTimelineExplanation } from "../../utils/aiTimelineApi.js";

// ─────────────────────────────────────────────────────────────────────────
// AiTimelineAIPanel — V5.2 (AI Timeline)
//
// The "Selecting any event should generate an AI explanation" surface,
// built by cloning ExplorerAIPanel.jsx's established pattern (V5.0 Phase
// 5C) rather than inventing a new one:
//   - Calls the new POST /api/ai-timeline/explain endpoint, which itself
//     reuses buildStructuredInsights()/buildChatPrompt()/callGemini() —
//     the exact same AI Report Chat infrastructure — server-side. Gemini
//     never calculates astrology; it only explains the already-computed
//     `event` passed in.
//   - Renders the response through the EXISTING `ChatMessage` component,
//     the same renderer AI Report Chat and Explorer AI already use for
//     shortAnswer/detailedExplanation/evidence/confidence/
//     suggestedNextQuestion — nothing new invented on the frontend either.
//   - Reuses `TypingIndicator` for the loading state and `GlassCard` for
//     the empty/error chrome.
//
// Performance: nothing is fetched until "Explain with AI" is tapped.
// Once fetched, the explanation for a given event id is kept in a
// per-mount `cacheRef` Map (selecting an already-explained event never
// re-fetches); callGemini()'s own prompt-hash cache is a second,
// cross-session layer of reuse for identical selections.
// ─────────────────────────────────────────────────────────────────────────
function AiTimelineAIPanel({ event, chart, report, history }) {
  const cacheKey = event?.id;
  const cacheRef = useRef(new Map());
  const [explanation, setExplanation] = useState(() => cacheRef.current.get(cacheKey) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Identifies the "current" request. Bumped whenever the selected event
  // changes or the component unmounts, so a still-in-flight fetch for a
  // previously-selected event (or one issued right before unmount) can
  // recognize it's stale and skip its setState calls instead of
  // overwriting the newer selection's state / updating after unmount.
  const requestIdRef = useRef(0);

  // A new event selection always starts from whatever is already cached
  // for it (possibly nothing yet) — never shows a previous event's stale
  // explanation while switching.
  useEffect(() => {
    requestIdRef.current += 1;
    setExplanation(cacheRef.current.get(cacheKey) || null);
    setError(null);
    setLoading(false);
  }, [cacheKey]);

  // Invalidate on unmount too, so a request still in flight when this
  // panel goes away never calls setState afterwards.
  useEffect(() => () => {
    requestIdRef.current += 1;
  }, []);

  const requestExplanation = useCallback(async () => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setExplanation(cached);
      return;
    }
    const myRequestId = requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAiTimelineExplanation({ chart, report, event, history });
      cacheRef.current.set(cacheKey, result);
      if (requestIdRef.current === myRequestId) setExplanation(result);
    } catch (err) {
      if (requestIdRef.current === myRequestId) {
        setError(err.message || "The AI Timeline explanation is unavailable right now.");
      }
    } finally {
      if (requestIdRef.current === myRequestId) setLoading(false);
    }
  }, [cacheKey, chart, report, event, history]);

  const handleRetry = useCallback(() => {
    cacheRef.current.delete(cacheKey);
    requestExplanation();
  }, [cacheKey, requestExplanation]);

  const eventLabel = `this ${event?.category || "life-area"} prediction`;

  return (
    <GlassCard style={{ padding: 20, display: "grid", gap: 14 }}>
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
            Get a Gemini-powered explanation of {eventLabel}, grounded entirely in this chart's own backend-computed facts.
          </p>
          <button
            type="button"
            onClick={requestExplanation}
            className="pill-btn tap-scale"
            aria-label={`Explain ${eventLabel} with AI`}
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

      {loading && <TypingIndicator label={`Generating an AI explanation for ${eventLabel}`} />}

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

export default memo(AiTimelineAIPanel);
