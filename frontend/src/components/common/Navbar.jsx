import { useState, memo } from "react";
import { GOLD_GRADIENT } from "../../constants/astrology.js";
import { scrollBehavior } from "../../utils/motionPreference.js";

// ─────────────────────────────────────────────────────────────────────────
// Navbar (Priority 6.1)
// Responsive top navigation for the new marketing HomePage. Two variants
// driven entirely by `isAuthenticated`:
//   Guest:      Home | Features | About | FAQ | Sign In | Get Started
//   Logged-in:  Home | Dashboard | Reports | Profile | Logout
//
// "Reports" and "Profile" both route to the existing Dashboard stage —
// DashboardPage already *is* the account's profile summary + saved-report
// history (see its Priority 5.2 header comment), so this reuses existing
// functionality instead of inventing new pages, per this priority's scope.
//
// No router/animation library: section links smoothly scroll to in-page
// anchors via the native scrollIntoView, and the mobile menu is a simple
// toggled panel — matching the rest of the app's dependency-free approach.
// ─────────────────────────────────────────────────────────────────────────
function scrollToId(id) {
  // Final V1.0 UI Polish Patch: respects prefers-reduced-motion instead of
  // always animating (see utils/motionPreference.js).
  document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

// Priority 6.2.1: Navbar only ever renders on HomePage today, so
// scrollToId("home-hero") alone happened to work — but nothing guaranteed
// "Home" and the logo actually landed on the marketing Home page (stage
// "home") rather than merely scrolling within whatever page was mounted.
// Explicitly navigating to "home" first, then scrolling once there, makes
// both affordances correct on their own terms instead of relying on an
// implicit assumption about where Navbar is rendered.
function goHome(onNavigate) {
  onNavigate("home");
  requestAnimationFrame(() => scrollToId("home-hero"));
}

const linkStyle = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--nv-text-secondary, rgba(220,190,255,0.85))", fontSize: 14, fontFamily: "var(--nv-font-body, Inter,sans-serif)",
  padding: "8px 4px", borderRadius: "var(--nv-radius-sm, 6px)",
};

function Navbar({ isAuthenticated, userName, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  const guestLinks = (
    <>
      <button className="navbar-link" style={linkStyle} onClick={() => { goHome(onNavigate); close(); }}>Home</button>
      <button className="navbar-link" style={linkStyle} onClick={() => { scrollToId("features"); close(); }}>Features</button>
      <button className="navbar-link" style={linkStyle} onClick={() => { scrollToId("about"); close(); }}>About</button>
      <button className="navbar-link" style={linkStyle} onClick={() => { scrollToId("faq"); close(); }}>FAQ</button>
    </>
  );

  const authLinks = (
    <>
      <button className="navbar-link" style={linkStyle} onClick={() => { goHome(onNavigate); close(); }}>Home</button>
      <button className="navbar-link" style={linkStyle} onClick={() => { onNavigate("dashboard"); close(); }}>Dashboard</button>
      <button className="navbar-link" style={linkStyle} onClick={() => { onNavigate("dashboard"); close(); }}>Reports</button>
      <button className="navbar-link" style={linkStyle} onClick={() => { onNavigate("dashboard"); close(); }}>Profile</button>
    </>
  );

  const guestCtas = (
    <>
      <button
        onClick={() => { onNavigate("login"); close(); }}
        className="navbar-cta"
        style={{ ...linkStyle, border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))", borderRadius: "var(--nv-radius-pill, 30px)", padding: "9px 18px", color: "var(--nv-text-secondary, rgba(220,190,255,0.9))" }}
      >
        Sign In
      </button>
      <button
        onClick={() => { onNavigate("signup"); close(); }}
        className="navbar-cta"
        style={{
          padding: "9px 20px", borderRadius: "var(--nv-radius-pill, 30px)", border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.45))",
          background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)",
          fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--nv-font-body, Inter,sans-serif)",
          boxShadow: "var(--nv-shadow-sm, 0 4px 18px rgba(123,47,255,0.4))",
        }}
      >
        Get Started
      </button>
    </>
  );

  const authCta = (
    <button
      onClick={async () => { await onLogout(); close(); }}
      className="navbar-cta"
      style={{
        padding: "9px 20px", borderRadius: "var(--nv-radius-pill, 30px)", border: "1px solid var(--nv-danger-border, rgba(255,100,100,0.35))",
        background: "var(--nv-danger-bg, rgba(120,20,20,0.25))", color: "var(--nv-danger, #ff9d9d)",
        fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--nv-font-body, Inter,sans-serif)",
      }}
    >
      🚪 Logout
    </button>
  );

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "var(--nv-surface-strong, rgba(10,0,22,0.72))", backdropFilter: "blur(var(--nv-glass-blur, 16px))", WebkitBackdropFilter: "blur(var(--nv-glass-blur, 16px))",
      borderBottom: "1px solid var(--nv-surface-border, rgba(180,120,255,0.15))",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <button
          onClick={() => goHome(onNavigate)}
          aria-label="NakshatraVerse — home"
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <span aria-hidden="true" style={{ fontSize: 24 }}>🪐</span>
          <span style={{
            fontSize: 18, fontWeight: 700, fontFamily: "Cinzel,serif",
            background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            NakshatraVerse
          </span>
        </button>

        {/* Desktop nav */}
        <nav aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 20 }} className="navbar-desktop">
          {isAuthenticated ? authLinks : guestLinks}
          <span style={{ width: 1, height: 20, background: "rgba(180,120,255,0.2)" }} aria-hidden="true" />
          {isAuthenticated ? (
            <>
              {userName && (
                <span style={{ fontSize: 13, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>👋 {userName}</span>
              )}
              {authCta}
            </>
          ) : guestCtas}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="navbar-mobile-toggle navbar-hamburger"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(o => !o)}
          style={{
            display: "none", background: "none", border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))",
            borderRadius: "var(--nv-radius-md, 10px)", width: 44, height: 44, cursor: "pointer", color: "var(--nv-text-primary, #e8d5ff)", fontSize: 18,
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="navbar-mobile-panel" style={{
          display: "none", flexDirection: "column", gap: 4, padding: "8px 20px 20px",
          borderTop: "1px solid var(--nv-surface-border, rgba(180,120,255,0.15))",
        }}>
          {isAuthenticated ? authLinks : guestLinks}
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {isAuthenticated ? authCta : guestCtas}
          </div>
        </div>
      )}

      {/* Priority 6.1: minimal, self-contained responsive rule — collapses
          the inline desktop nav into the hamburger below 860px. Scoped to
          this component's own classnames so nothing else on the page is
          affected.
          Phase 1 additions: hover feedback for nav links/CTAs/hamburger
          (previously none beyond the default cursor), and a fade+slide
          entrance for the mobile panel when it opens — reusing the
          project's existing `fadeIn` keyframe from styles/global.css. */}
      <style>{`
        @media (max-width: 860px) {
          .navbar-desktop { display: none !important; }
          .navbar-mobile-toggle { display: flex !important; align-items: center; justify-content: center; }
          .navbar-mobile-panel { display: flex !important; animation: fadeIn 0.25s ease both; }
        }
        .navbar-link { transition: background-color var(--nv-duration-fast) var(--nv-ease-standard), color var(--nv-duration-fast) var(--nv-ease-standard), transform var(--nv-duration-fast) var(--nv-ease-standard); }
        .navbar-link:hover { background-color: var(--nv-accent-wash, rgba(180,120,255,0.12)); color: var(--nv-text-primary, #e8d5ff) !important; }
        .navbar-link:active { transform: scale(0.96); }
        .navbar-cta { transition: transform var(--nv-duration-fast) var(--nv-ease-standard), box-shadow var(--nv-duration-fast) var(--nv-ease-standard), filter var(--nv-duration-fast) var(--nv-ease-standard); }
        .navbar-cta:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .navbar-cta:active { transform: scale(0.97); }
        .navbar-hamburger { transition: border-color var(--nv-duration-fast) var(--nv-ease-standard), background-color var(--nv-duration-fast) var(--nv-ease-standard), transform var(--nv-duration-fast) var(--nv-ease-standard); }
        .navbar-hamburger:hover { border-color: var(--nv-surface-border-hover, rgba(191,127,255,0.6)); background-color: var(--nv-accent-wash, rgba(180,120,255,0.1)); }
        .navbar-hamburger:active { transform: scale(0.93); }
      `}</style>
    </header>
  );
}

export default memo(Navbar);
