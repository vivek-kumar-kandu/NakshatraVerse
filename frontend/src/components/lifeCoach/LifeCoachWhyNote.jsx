import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachWhyNote — V4.3 (AI Life Coach Enhancement Pass)
// A small "Why?" explanation line shown under a recommendation. Purely
// presentational — renders whatever short grounded explanation string the
// backend-returned guidance.explainWhy object already contains for that
// section; renders nothing if that field is absent (e.g. an older cached
// guidance response from before this pass).
// ─────────────────────────────────────────────────────────────────────────
function LifeCoachWhyNote({ text }) {
  if (!text) return null;
  return (
    <p style={{
      margin: "6px 0 0", fontSize: 12, lineHeight: 1.5, fontStyle: "italic",
      color: "var(--nv-text-muted, rgba(200,160,255,0.65))",
    }}>
      <strong style={{ fontStyle: "normal", color: "#bf7fff" }}>Why? </strong>
      {text}
    </p>
  );
}

export default memo(LifeCoachWhyNote);
