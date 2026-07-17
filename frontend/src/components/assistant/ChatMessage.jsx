import { memo, useState } from "react";
import MarkdownLite from "./MarkdownLite.jsx";
import Badge from "../common/Badge.jsx";
import ExpandableSection from "../common/ExpandableSection.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ChatMessage — V3.0 Phase 4 (AI Astrology Assistant)
// V4.5 Phase 4 (AI Report Chat) addition: when a message carries the new
// structured fields (shortAnswer/detailedExplanation/evidence/confidence/
// suggestedNextQuestion), render them as a small "Answer Structure"
// layout — Short Answer up front, Detailed Explanation in an expandable
// section, Relevant Backend Evidence as citation chips, a Confidence
// badge when the answer is tied to one, and a tappable Suggested Next
// Question. This is purely additive: a message with only `content` (every
// V3.0 message shape, or a legacy-format response) renders exactly as
// before via MarkdownLite. Also adds Copy Response / Regenerate actions,
// per the Phase 4 UI brief — reusing the existing pill-btn/tap-scale
// styling rather than introducing new visual language.
//
// One bubble in the chat history. User messages are plain text (right-
// aligned); assistant messages render through MarkdownLite (left-aligned).
// Reuses the same glass/gradient visual language as ActionDock/GlassCard
// rather than introducing new colors.
// ─────────────────────────────────────────────────────────────────────────

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function ActionButton({ label, icon, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      aria-label={label}
      className="tap-scale"
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none",
        cursor: "pointer", color: "var(--nv-text-faint, rgba(200,160,255,0.55))", fontSize: 11.5,
        fontFamily: "Inter,sans-serif", padding: "2px 4px",
      }}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function ChatMessage({
  role,
  content,
  timestamp,
  failed = false,
  shortAnswer,
  detailedExplanation,
  evidence,
  confidence,
  suggestedNextQuestion,
  onCopy,
  onRegenerate,
  onAskSuggested,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";
  const hasStructured = !isUser && (shortAnswer || detailedExplanation);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "82%", display: "grid", gap: 4, justifyItems: isUser ? "flex-end" : "flex-start" }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isUser
              ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))"
              : failed
              ? "rgba(120,20,20,0.55)"
              : "var(--nv-surface, rgba(18,0,38,0.6))",
            border: isUser
              ? "1px solid rgba(180,120,255,0.35)"
              : failed
              ? "1px solid rgba(255,80,80,0.35)"
              : "1px solid var(--nv-surface-border, rgba(180,120,255,0.18))",
            color: isUser ? "var(--nv-text-on-accent, #fff)" : failed ? "var(--nv-danger, #ffaaaa)" : "var(--nv-text-secondary, rgba(220,190,255,0.92))",
            fontFamily: "Inter,sans-serif",
            fontSize: 14,
            display: "grid",
            gap: 10,
          }}
        >
          {isUser ? (
            <p style={{ margin: 0, lineHeight: 1.55 }}>{content}</p>
          ) : hasStructured ? (
            <>
              {/* Short Answer */}
              {shortAnswer && (
                <div style={{ fontWeight: 600, color: "var(--nv-text-primary, #f1e4ff)", lineHeight: 1.55 }}>
                  {shortAnswer}
                </div>
              )}

              {/* Detailed Explanation */}
              {detailedExplanation && (
                shortAnswer ? (
                  <ExpandableSection icon="📖" title="Detailed Explanation" defaultOpen>
                    <MarkdownLite text={detailedExplanation} />
                  </ExpandableSection>
                ) : (
                  <MarkdownLite text={detailedExplanation} />
                )
              )}

              {/* Relevant Backend Evidence */}
              {!!evidence?.length && (
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--nv-text-faint, rgba(200,160,255,0.5))" }}>
                    Backend Evidence
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {evidence.map((fact, i) => (
                      <Badge key={i} color="#9a6bff" style={{ fontWeight: 500, letterSpacing: 0 }}>
                        {fact}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence */}
              {confidence && (confidence.label || confidence.score != null) && (
                <div>
                  <Badge color="#4fd1a5">
                    Confidence: {confidence.label || "?"}{confidence.score != null ? ` (${confidence.score}/100)` : ""}
                  </Badge>
                </div>
              )}

              {/* Suggested Next Question */}
              {suggestedNextQuestion && (
                <button
                  type="button"
                  onClick={() => onAskSuggested?.(suggestedNextQuestion)}
                  className="pill-btn tap-scale"
                  style={{
                    justifySelf: "flex-start", background: "rgba(191,127,255,0.1)",
                    border: "1px solid rgba(180,120,255,0.3)", color: "#e8d5ff",
                    padding: "7px 12px", borderRadius: 16, cursor: "pointer", fontSize: 12,
                    fontFamily: "Inter,sans-serif", textAlign: "left",
                  }}
                >
                  💡 {suggestedNextQuestion}
                </button>
              )}
            </>
          ) : (
            <MarkdownLite text={content} />
          )}

          {/* Copy / Regenerate actions */}
          {!isUser && !failed && (content || shortAnswer || detailedExplanation) && (
            <div style={{ display: "flex", gap: 14, marginTop: 2 }}>
              <ActionButton label={copied ? "Copied!" : "Copy"} icon="📋" onClick={handleCopy} title="Copy response" />
              {onRegenerate && <ActionButton label="Regenerate" icon="↻" onClick={onRegenerate} title="Regenerate this explanation" />}
            </div>
          )}
        </div>
        {timestamp && (
          <span style={{ fontSize: 11, color: "var(--nv-text-faint, rgba(200,160,255,0.4))", padding: "0 4px" }}>
            {formatTimestamp(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(ChatMessage);
