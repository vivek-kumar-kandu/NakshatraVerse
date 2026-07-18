import { useCallback, useEffect, useRef, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import ChatMessage from "../components/assistant/ChatMessage.jsx";
import TypingIndicator from "../components/assistant/TypingIndicator.jsx";
import SuggestedQuestions, { DEFAULT_SUGGESTIONS, GENERAL_SUGGESTIONS } from "../components/assistant/SuggestedQuestions.jsx";
import ChatInput from "../components/assistant/ChatInput.jsx";
import { sendChatMessage } from "../utils/assistantApi.js";
import { readPreferences, getAiResponseLengthHint } from "../utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// AIAssistantPage — V3.0 Phase 4 (AI Astrology Assistant)
//
// Dedicated chat page for asking natural-language questions. Two-Mode Chat:
//   - Personal Astrology Mode (a chart/report is loaded): the backend
//     remains the single source of truth for every astrological fact —
//     this page only ever sends the already-computed `chart`/`report`
//     objects it was given as props, plus the running conversation, to
//     POST /api/assistant/chat. It never computes or alters astrology
//     itself.
//   - General Astrology Mode (no chart/report loaded, e.g. reached from
//     Dashboard's "Ask AI" Quick Action or the Command Palette outside a
//     reading): the same endpoint answers general/educational astrology
//     questions from Gemini's own knowledge — `chart`/`report` are simply
//     omitted from the request. The backend (assistantService.js) decides,
//     per question, whether it actually needs a chart it doesn't have and
//     replies gracefully if so — this page never blocks the chat UI itself
//     just because no report is loaded.
//
// Conversation memory (Section 6 of the brief): this component holds its
// own `messages` state and nothing is persisted — the parent (App.jsx)
// mounts this page fresh (via React `key`) whenever the person switches
// which report they're viewing, which is what makes "switching reports
// starts a fresh conversation" true with zero extra bookkeeping here.
//
// Reuses the existing Design System exclusively: CosmicBg, the same
// `--nv-*` tokens/glass-card look as GlassCard/ActionDock, and the same
// pill-btn/tap-scale utility classes already used throughout the app.
// ─────────────────────────────────────────────────────────────────────────

// Only used to hide a suggestion chip that would obviously have nothing to
// answer (e.g. "Explain my remedies" when none were detected) — this is a
// presentational filter only, over data the backend already returned; it
// never decides *what* the answer is. When no chart/report is loaded at
// all, a different (general-knowledge) suggestion set is shown instead —
// see GENERAL_SUGGESTIONS.
function buildSuggestions(chart, report) {
  if (!chart || !report) return GENERAL_SUGGESTIONS;
  const has = {
    predictions: !!report?.predictions?.length,
    yogas: !!chart?.yogas?.length,
    dasha: true,
    remedies: !!chart?.remedies?.length,
  };
  return DEFAULT_SUGGESTIONS.filter((s) => !s.requires || has[s.requires]);
}

function AIAssistantPage({ userData, chart, report, onBack, onNavigate, initialQuestion, festivalContext, panchangContext, muhuratContext }) {
  const [messages, setMessages] = useState([]); // { id, role, content, timestamp, failed?, shortAnswer?, detailedExplanation?, evidence?, confidence?, suggestedNextQuestion? }
  const [pending, setPending] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null); // kept for retry
  const scrollRef = useRef(null);

  // Display-only: whether a report is currently loaded. This no longer
  // gates the chat itself — General Astrology Mode works fine with none —
  // it's only used to pick which suggestion chips/header copy to show.
  const hasChart = !!chart && !!report;

  // Auto-scroll to the latest message whenever the thread changes, or while
  // the typing indicator is showing.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const suggestions = buildSuggestions(chart, report);

  const askQuestion = useCallback(
    async (questionText, historyOverride) => {
      const history = (historyOverride || messages).map((m) => ({ role: m.role, content: m.content }));
      setPending(true);
      setPendingQuestion(questionText);
      try {
        // V3.0 Final Enhancement (User Preferences & Personalization): the
        // "AI Response Length" preference is applied as a short phrasing
        // hint appended only to the text sent to the backend — never to
        // `questionText` itself, which is what's already shown in the
        // chat thread (see handleSend/messages above). No new endpoint,
        // no change to sendChatMessage's shape, no AI Assistant logic
        // touched — same technique this page's own suggested questions
        // already use to phrase what they ask for.
        const lengthHint = getAiResponseLengthHint(readPreferences().aiResponseLength);
        const apiQuestion = lengthHint ? `${questionText}\n\n(${lengthHint})` : questionText;
        // V4.5 Phase 4 (AI Report Chat): the response now carries the
        // structured answer fields alongside the backward-compatible
        // `answer` string — all stored on the message so ChatMessage can
        // render the richer layout (falls back to plain `content` if a
        // caller/cache still returns the legacy shape only).
        const { answer, shortAnswer, detailedExplanation, evidence, confidence, suggestedNextQuestion } = await sendChatMessage({
          chart, report, history, question: apiQuestion, festivalContext, panchangContext, muhuratContext,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`, role: "assistant", content: answer, timestamp: Date.now(),
            shortAnswer, detailedExplanation, evidence, confidence, suggestedNextQuestion,
          },
        ]);
        setPendingQuestion(null);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: err.message || "Something went wrong reaching the assistant.",
            timestamp: Date.now(),
            failed: true,
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [messages, chart, report, festivalContext, panchangContext, muhuratContext]
  );

  const handleSend = useCallback(
    (text) => {
      const userMsg = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      askQuestion(text, [...messages, userMsg]);
    },
    [askQuestion, messages]
  );

  // V3.0 Phase 5: if the page was opened with a pre-filled question (e.g.
  // "Explain Today's Horoscope" from HoroscopePage, or "Explain this
  // Transit"/"Explain this Dasha" from CalendarPage), ask it automatically
  // exactly once, as if the person had typed and sent it themselves. Runs
  // only on mount and only when the conversation is still empty, so it
  // never re-fires or clobbers an in-progress chat.
  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    if (!pendingQuestion) return;
    // Drop the trailing failed bubble before retrying so it isn't
    // duplicated once a real answer lands.
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.failed);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== realIdx);
    });
    askQuestion(pendingQuestion);
  }, [askQuestion, pendingQuestion]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setPendingQuestion(null);
  }, []);

  // V4.5 Phase 4 (AI Report Chat) — "Regenerate Explanation": re-asks the
  // exact same preceding question, dropping only the stale answer being
  // regenerated (never re-computes astrology; this is just another
  // /api/assistant/chat turn, same as any other question). Scoped to the
  // most recent assistant message only, so message ordering never gets
  // scrambled — matches the existing "Retry" affordance's semantics.
  const handleRegenerate = useCallback(
    (messageId) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx <= 0) return;
      const questionMsg = messages[idx - 1];
      if (!questionMsg || questionMsg.role !== "user") return;
      const historyOverride = messages.slice(0, idx);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      askQuestion(questionMsg.content, historyOverride);
    },
    [messages, askQuestion]
  );

  // V4.5 Phase 4 (AI Report Chat) — "Copy Response": copies the full
  // combined answer text (same string already shown/sent to `content`)
  // to the clipboard. Silently no-ops if the Clipboard API is unavailable
  // (e.g. insecure context) rather than throwing.
  const handleCopy = useCallback((text) => {
    if (!text || !navigator?.clipboard?.writeText) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const lastFailed = messages[messages.length - 1]?.failed;
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant" && !m.failed)?.id;

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div
        style={{
          position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto",
          padding: "84px 16px 24px", display: "flex", flexDirection: "column",
          minHeight: "100vh", boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={onBack}
              className="pill-btn tap-scale"
              style={{
                background: "rgba(20,0,40,0.55)", border: "1px solid rgba(180,120,255,0.35)",
                color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                fontSize: 13,
              }}
            >
              ← Back
            </button>
            <div>
              <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 20, color: "var(--nv-text-primary, #f1e4ff)" }}>
                AI Astrology Assistant
              </h1>
              {hasChart && userData?.name ? (
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                  Ask about {userData.name}'s reading
                </p>
              ) : (
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                  General Astrology Mode — ask me anything about astrology
                </p>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="pill-btn tap-scale"
              style={{
                background: "none", border: "1px solid rgba(180,120,255,0.25)",
                color: "var(--nv-text-secondary, rgba(220,190,255,0.7))", padding: "8px 14px", borderRadius: 20,
                cursor: "pointer", fontSize: 12,
              }}
            >
              🗑 Clear conversation
            </button>
          )}
        </div>

        {/* General Astrology Mode banner — only shown when no report is
            loaded. Purely informational/a soft nudge, never a blocker: the
            chat below works either way, and the backend gracefully handles
            any question that turns out to need a chart it doesn't have. */}
        {!hasChart && (
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              marginBottom: 14, padding: "10px 14px", borderRadius: 14,
              background: "rgba(123,47,255,0.1)", border: "1px solid rgba(180,120,255,0.25)",
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--nv-text-secondary, rgba(220,190,255,0.75))" }}>
              🔮 No reading loaded — I can answer general astrology questions. For questions about your own chart, open or generate your report.
            </span>
            {onNavigate && (
              <button
                onClick={() => onNavigate("reports")}
                className="pill-btn tap-scale"
                style={{
                  background: "rgba(191,127,255,0.15)", border: "1px solid rgba(180,120,255,0.35)",
                  color: "var(--nv-text-primary, #e8d5ff)", padding: "6px 12px", borderRadius: 16,
                  cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
                }}
              >
                📚 My Reports
              </button>
            )}
          </div>
        )}

        {/* Chat history */}
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          style={{ flex: 1, overflowY: "auto", display: "grid", gap: 14, paddingBottom: 16 }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 8px", color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontSize: 13.5 }}>
              {hasChart
                ? "I can explain anything in your report — planets, houses, yogas, doshas, your Dasha, remedies, or predictions. Nothing here is recalculated; I only explain what your report already found. Try a suggestion below, or ask your own question."
                : "Ask me anything about astrology — what a Nakshatra or Dasha is, how yogas and doshas work, planetary strength, and more. Open or generate your report if you'd like personalized guidance about your own chart."}
            </div>
          )}
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              content={m.content}
              timestamp={m.timestamp}
              failed={m.failed}
              shortAnswer={m.shortAnswer}
              detailedExplanation={m.detailedExplanation}
              evidence={m.evidence}
              confidence={m.confidence}
              suggestedNextQuestion={m.suggestedNextQuestion}
              onCopy={m.role === "assistant" ? () => handleCopy(m.content) : undefined}
              onRegenerate={m.role === "assistant" && m.id === lastAssistantId && !pending ? () => handleRegenerate(m.id) : undefined}
              onAskSuggested={m.role === "assistant" ? (q) => handleSend(q) : undefined}
            />
          ))}
          {pending && <TypingIndicator />}
          {lastFailed && !pending && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button
                onClick={handleRetry}
                className="pill-btn tap-scale"
                style={{
                  background: "rgba(191,127,255,0.1)", border: "1px solid rgba(180,120,255,0.35)",
                  color: "#bf7fff", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 12.5,
                }}
              >
                ↻ Retry
              </button>
            </div>
          )}
        </div>

        {/* Suggested questions — V4.5 Phase 4 (AI Report Chat): "Ask About My
            Report" label made explicit above the existing suggestion chips,
            same chips/behavior as V3.0 Phase 4 (no redesign). When no report
            is loaded, a general-knowledge suggestion set is shown instead
            (see buildSuggestions/GENERAL_SUGGESTIONS above). */}
        <div style={{ marginBottom: 12 }}>
          {suggestions.length > 0 && (
            <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--nv-text-faint, rgba(200,160,255,0.5))", marginBottom: 8 }}>
              {hasChart ? "Ask About My Report" : "Ask About Astrology"}
            </div>
          )}
          <SuggestedQuestions suggestions={suggestions} onPick={handleSend} disabled={pending} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={pending} autoFocus />
      </div>
    </div>
  );
}

export default AIAssistantPage;
