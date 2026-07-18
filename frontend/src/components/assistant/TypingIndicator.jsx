import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// TypingIndicator — V3.0 Phase 4 (AI Astrology Assistant)
// Three-dot "the assistant is composing a reply" bubble, styled to match
// an assistant ChatMessage bubble so it slots seamlessly into the thread.
// Reuses the project's existing `shimmer`/pulse-style keyframe pattern
// (see global.css) rather than adding new global CSS.
// ─────────────────────────────────────────────────────────────────────────
function TypingIndicator({ label = "The assistant is typing" }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        style={{
          padding: "14px 18px", borderRadius: "16px 16px 16px 4px",
          background: "var(--nv-surface, rgba(18,0,38,0.6))",
          border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.18))",
          display: "flex", gap: 5, alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#bf7fff",
              animation: `typingDot 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
        <style>{`@keyframes typingDot { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }`}</style>
      </div>
    </div>
  );
}

export default memo(TypingIndicator);
