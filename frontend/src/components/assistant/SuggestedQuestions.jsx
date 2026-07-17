import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// SuggestedQuestions — V3.0 Phase 4 (AI Astrology Assistant)
// Clickable chips that auto-send the tapped question. `availability` lets
// the caller only show suggestions the current report can actually answer
// (e.g. hide "Explain my remedies" if no remedies were detected) without
// hardcoding that logic here.
// ─────────────────────────────────────────────────────────────────────────

export const DEFAULT_SUGGESTIONS = [
  { id: "career", label: "Explain my career prediction.", requires: "predictions" },
  { id: "yoga", label: "Explain my strongest yoga.", requires: "yogas" },
  { id: "nakshatra", label: "Explain my Nakshatra.", requires: null },
  { id: "dasha", label: "Explain my current Dasha.", requires: "dasha" },
  { id: "strongest-planet", label: "Which planet is strongest?", requires: null },
  { id: "remedies", label: "Explain my remedies.", requires: "remedies" },
  { id: "numerology", label: "Explain my numerology.", requires: null },
];

function SuggestedQuestions({ suggestions = DEFAULT_SUGGESTIONS, onPick, disabled }) {
  if (!suggestions.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s.label)}
          className="pill-btn tap-scale"
          style={{
            background: "rgba(191,127,255,0.08)",
            border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))",
            color: "var(--nv-text-primary, #e8d5ff)", borderRadius: 20, padding: "8px 14px",
            fontSize: 12.5, fontWeight: 500, cursor: disabled ? "default" : "pointer",
            fontFamily: "Inter,sans-serif", opacity: disabled ? 0.5 : 1,
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export default memo(SuggestedQuestions);
