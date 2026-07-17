import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// PageTransition (Phase 1 — Motion & Interactions)
//
// A lightweight wrapper that cross-fades + slightly slides its children in
// whenever `stageKey` changes. This app's navigation is a single `stage`
// string switched in App.jsx's render (no router). Rather than adding a
// routing/animation library, this component uses React's own `key` remount
// behavior: giving the wrapper `key={stageKey}` means React tears down and
// re-mounts the div whenever the stage changes, which naturally re-plays
// the CSS entrance animation below — the same "component-local <style> +
// inline animation" pattern already used throughout this codebase (see
// AuthLocalStyles.jsx, and ResultsPage's `main key={activeTab}` tab-switch
// transition, which this mirrors one level up, at the page/stage level).
//
// `prefers-reduced-motion` is already handled globally (styles/global.css
// collapses every animation's duration to ~0 for that preference), so
// this component doesn't need to repeat that rule.
//
// Deliberately presentation-only: it does not read or write `stage`, does
// not touch routing/navigation, and does not change what App.jsx renders —
// it only wraps it.
// ─────────────────────────────────────────────────────────────────────────
function PageTransition({ stageKey, children, style = {} }) {
  return (
    <div key={stageKey} style={{ animation: "pageTransitionIn 0.34s cubic-bezier(0.22,1,0.36,1) both", willChange: "opacity, transform", ...style }}>
      <style>{`
        @keyframes pageTransitionIn {
          from { opacity: 0; transform: translateY(10px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {children}
    </div>
  );
}

export default memo(PageTransition);
