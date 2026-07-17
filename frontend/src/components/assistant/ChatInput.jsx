import { memo, useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────
// ChatInput — V3.0 Phase 4 (AI Astrology Assistant)
// Auto-growing textarea + send button. Enter sends, Shift+Enter inserts a
// newline. Disabled while a request is in flight so a person can't fire
// overlapping questions.
// ─────────────────────────────────────────────────────────────────────────
function ChatInput({ onSend, disabled, autoFocus = false }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-end", gap: 10, padding: "10px 12px",
        borderRadius: 22, background: "var(--nv-surface, rgba(18,0,38,0.6))",
        border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.18))",
        backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask about your report…"
        aria-label="Ask the AI assistant about your report"
        style={{
          flex: 1, resize: "none", border: "none", outline: "none", background: "transparent",
          color: "var(--nv-text-primary, #f1e4ff)", fontFamily: "Inter,sans-serif", fontSize: 14, lineHeight: 1.5,
          padding: "6px 4px", maxHeight: 120,
        }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="pill-btn tap-scale"
        style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: "50%", border: "none",
          background: disabled || !value.trim() ? "rgba(123,47,255,0.3)" : "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
          color: "var(--nv-text-on-accent, #fff)", cursor: disabled || !value.trim() ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}
      >
        ➤
      </button>
    </div>
  );
}

export default memo(ChatInput);
