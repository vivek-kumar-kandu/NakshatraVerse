import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// QuickActionCard (V3.0 Phase 2 — Dashboard 3.0 & Home Experience)
//
// Generalized from Dashboard's previous inline `ActionCard` so Home and
// Dashboard share one Quick Action tile implementation. Every instance is
// still just a button that calls the caller's `onClick` — it never owns
// navigation logic itself, only renders it (see `onNavigate` wiring in
// DashboardPage.jsx/HomePage.jsx).
// ─────────────────────────────────────────────────────────────────────────
function QuickActionCard({ icon, label, desc, onClick, primary, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="glass-card tap-scale"
      style={{
        textAlign: "left", cursor: disabled ? "default" : "pointer", padding: 18, borderRadius: "var(--nv-radius-lg, 16px)",
        border: primary ? "1px solid rgba(255,215,0,0.35)" : "1px solid var(--nv-surface-border, rgba(180,120,255,0.18))",
        background: primary
          ? "linear-gradient(135deg, rgba(123,47,255,0.4), rgba(74,0,160,0.4))"
          : "var(--nv-surface, rgba(18,0,38,0.6))",
        backdropFilter: "blur(var(--nv-glass-blur, 20px))", WebkitBackdropFilter: "blur(var(--nv-glass-blur, 20px))",
        boxShadow: "var(--nv-shadow-md, 0 4px 30px rgba(80,0,180,0.18)), inset 0 1px 0 var(--nv-surface-inset-highlight, rgba(255,255,255,0.05))",
        display: "flex", flexDirection: "column", gap: 6, width: "100%",
        fontFamily: "var(--nv-font-body, Inter,sans-serif)", opacity: disabled ? 0.5 : 1,
        transition: "transform var(--nv-duration-base, 220ms) var(--nv-ease-standard, ease)",
      }}
    >
      <div aria-hidden="true" style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "var(--nv-font-display, Cinzel,serif)" }}>{label}</div>
      {desc && <div style={{ fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", lineHeight: 1.4 }}>{desc}</div>}
    </button>
  );
}

export default memo(QuickActionCard);
