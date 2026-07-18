import { memo, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Priority 5.1 performance note: CosmicBg is mounted on every page and its
// star field is purely decorative — it never needs to change once drawn.
// Before this change it was a plain function component defined inline in
// App.jsx, so every time a parent re-rendered for an unrelated reason
// (e.g. LoadingPage's progress bar ticking every 120ms) React re-ran this
// component, recomputing the 90-star array from scratch and re-rendering
// 90+ DOM nodes purely because a sibling's state changed.
//
// Two independent fixes:
//   1. The star array is now built once via useMemo (it's a deterministic
//      function of nothing — same 90 stars every time) instead of on
//      every render.
//   2. The whole component is wrapped in React.memo, so React skips
//      re-rendering it entirely when its props (`animated`) haven't
//      changed — which is the common case on the loading screen.
// Visual output is byte-for-byte identical to before.
// ─────────────────────────────────────────────────────────────────────────
function CosmicBg({ animated = false }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i, x: (i * 37.3 + 11) % 100, y: (i * 53.7 + 7) % 100,
        size: (i % 5 === 0 ? 2.2 : i % 3 === 0 ? 1.5 : 0.8),
        delay: (i * 0.13) % 4, dur: 2 + (i % 3),
      })),
    []
  );

  return (
    // Decorative-only background — hidden from assistive tech so screen
    // readers don't announce 90 meaningless star elements.
    // Phase 6.4 (Account Settings & Preferences — Appearance): the
    // gradient now reads a CSS custom property instead of a hardcoded
    // value, so the new Light/Dark/System theme (styles/global.css,
    // context/ThemeContext.jsx) reaches this component too. The fallback
    // value is byte-for-byte the original hardcoded gradient, so dark
    // theme (the app's existing, unchanged default) renders identically.
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
      background: "var(--nv-bg-wash, linear-gradient(145deg, #06000f 0%, #0c0020 35%, #080018 65%, #06000f 100%))",
      backgroundSize: "200% 200%", animation: "bgDrift 24s ease-in-out infinite alternate" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: "50%", background: "#fff",
          opacity: animated ? 0.6 : 0.35,
          animation: animated ? `twinkle ${s.dur}s ${s.delay}s infinite alternate` : "none",
        }} />
      ))}
      <div style={{ position:"absolute", top:"15%", left:"5%", width:500, height:500, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(120,40,220,0.1) 0%, transparent 70%)", filter:"blur(60px)" }} />
      <div style={{ position:"absolute", bottom:"10%", right:"10%", width:400, height:400, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,200,0,0.06) 0%, transparent 70%)", filter:"blur(50px)" }} />
      <div style={{ position:"absolute", top:"55%", left:"55%", width:300, height:300, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(60,0,120,0.12) 0%, transparent 70%)", filter:"blur(40px)" }} />
    </div>
  );
}

export default memo(CosmicBg);
