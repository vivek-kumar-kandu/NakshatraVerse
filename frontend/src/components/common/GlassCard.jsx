import { memo } from "react";

// `...rest` is forwarded onto the root <div> (e.g. `data-flip-id`, ARIA
// attributes) without changing anything for existing callers that don't
// pass extra props — purely additive, needed by the Dashboard delete
// animation (Phase 4 polish) to tag cards for FLIP position measurement.
function GlassCard({ children, style = {}, className = "", ...rest }) {
  return (
    <div className={`glass-card ${className}`} style={{
      // V3.0 Phase 1 (Design System & Theme Engine): every value below
      // now reads a `--nv-*` design token (styles/tokens.css) instead of
      // a hardcoded rgba/px value. Fallbacks are byte-for-byte the
      // original hardcoded values, so if tokens.css ever failed to load,
      // dark theme (the existing default) would render identically to
      // before this phase.
      background: "var(--nv-surface, rgba(18,0,38,0.6))",
      backdropFilter: "blur(var(--nv-glass-blur, 20px))",
      WebkitBackdropFilter: "blur(var(--nv-glass-blur, 20px))",
      border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.18))",
      borderRadius: "var(--nv-radius-lg, 16px)",
      boxShadow: "var(--nv-shadow-md, 0 4px 30px rgba(80,0,180,0.18)), inset 0 1px 0 var(--nv-surface-inset-highlight, rgba(255,255,255,0.05))",
      ...style,
    }} {...rest}>{children}</div>
  );
}

export default memo(GlassCard);
