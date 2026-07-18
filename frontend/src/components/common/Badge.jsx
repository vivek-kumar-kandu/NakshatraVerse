import { memo } from "react";

// V3.0 Phase 1: radius/spacing/typography now come from design tokens
// (styles/tokens.css); the per-badge accent `color` prop is unchanged —
// Badge is intentionally colorable per call site (e.g. ReportCard's
// name/dob/lagna badges each use a different accent), so tokenizing that
// specific hue isn't appropriate. The `${color}18`/`${color}40` hex-alpha
// background/border derivation is unchanged too.
function Badge({ children, color = "#bf7fff", style = {} }) {
  return (
    <span style={{
      display:"inline-block", padding:"3px var(--nv-space-3, 10px)",
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: "var(--nv-radius-pill, 20px)", fontSize: "var(--nv-text-xs, 11px)", color,
      fontWeight: "var(--nv-weight-semibold, 600)",
      letterSpacing: 0.5, fontFamily: "var(--nv-font-body, Inter,sans-serif)", ...style,
    }}>{children}</span>
  );
}

export default memo(Badge);
