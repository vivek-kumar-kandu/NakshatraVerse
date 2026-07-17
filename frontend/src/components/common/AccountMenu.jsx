import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { PURPLE_GRADIENT } from "../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// AccountMenu (Phase 6.2 — Premium Account Menu)
//
// Same role and same props (onNavigate, onLogout) as the Priority 5.2
// version this replaces — App.jsx renders it unchanged as a fixed,
// top-right overlay on top of landing/results/dashboard. Only the button
// and dropdown's look/feel/interactions are upgraded here; every
// destination it links to already exists:
//   - My Profile → dedicated "profile" stage (ProfilePage.jsx)
//   - Dashboard → the overview-only "dashboard" stage (DashboardPage.jsx)
//   - Saved Reports → the dedicated "reports" stage (SavedReportsPage.jsx)
//   - Settings → the unchanged "settings" stage (SettingsPage.jsx)
//     Each item now owns exactly one page — see the Dashboard & Navigation
//     Cleanup notes in those files.
//   - Help & About → Dashboard Navigation Fix: now returns to the
//     "dashboard" stage (Dashboard Overview), same as the Dashboard item
//     above, instead of the marketing Home page — see goHelp below.
//   - Logout calls the existing auth logout() / onLogout prop unchanged.
// No backend, API, auth, astrology, or Dashboard file is touched.
// ─────────────────────────────────────────────────────────────────────────

function initials(name) {
  if (!name) return "✦";
  const parts = name.trim().split(/\s+/);
  const value = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return value || "✦";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

// Circular avatar: shows the uploaded profile photo when the account has
// one (`user.picture` — already populated for Google sign-in, see
// backend/repositories/user.repository.js), otherwise the same initials
// treatment ProfilePage already uses.
function Avatar({ user, size = 34 }) {
  const commonStyle = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Cinzel,serif", fontWeight: 700, color: "var(--nv-text-on-accent, #fff)",
    fontSize: Math.round(size * 0.4),
  };
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt=""
        aria-hidden="true"
        style={{ ...commonStyle, objectFit: "cover", border: "1px solid rgba(255,255,255,0.25)" }}
      />
    );
  }
  return (
    <div aria-hidden="true" style={{ ...commonStyle, background: PURPLE_GRADIENT, boxShadow: "0 0 14px rgba(123,47,255,0.45)" }}>
      {initials(user?.name)}
    </div>
  );
}

// Each Account Menu item opens its own dedicated destination — "profile"
// (ProfilePage.jsx), "dashboard" (DashboardPage.jsx, overview only),
// "reports" (SavedReportsPage.jsx), "settings" (SettingsPage.jsx) — with
// no overlap between them. See the Dashboard & Navigation Cleanup notes in
// those files.
const MENU_ITEMS = (onNavigate, goHelp) => [
  { key: "profile", icon: "👤", label: "My Profile", onSelect: () => onNavigate("profile") },
  { key: "dashboard", icon: "📊", label: "Dashboard", onSelect: () => onNavigate("dashboard") },
  { key: "reports", icon: "📜", label: "Saved Reports", onSelect: () => onNavigate("reports") },
  { key: "settings", icon: "⚙️", label: "Settings", onSelect: () => onNavigate("settings") },
  { key: "help", icon: "❓", label: "Help & About", onSelect: goHelp },
];

function AccountMenu({ onNavigate, onLogout }) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const handleLogout = onLogout || logout;

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  const close = useCallback(() => setOpen(false), []);

  // Dashboard Navigation Fix: this previously called onNavigate("home"),
  // which sent the user to the marketing Home/Welcome page and scrolled to
  // its FAQ section. AccountMenu is only ever rendered on post-login pages
  // (landing/results/dashboard/settings/profile/reports — see
  // showAccountMenu in App.jsx; "home" is never in that list), so every
  // click of "Help & About" bounced an authenticated user out of whatever
  // page they were on and onto Home — never back to Dashboard Overview.
  // That violated the rule that internal navigation from within the
  // authenticated app must return to Dashboard Overview, not Home, unless
  // Home is explicitly chosen (which this menu item is not — it's "Help &
  // About", not "Home"). Routing to "dashboard" instead keeps this on the
  // existing stage/navigation system with no new page or redesign.
  const goHelp = useCallback(() => {
    onNavigate("dashboard");
  }, [onNavigate]);

  const items = MENU_ITEMS(onNavigate, goHelp);

  // Click-outside + Escape-to-close, same pattern as ConfirmDialog.jsx
  // (mousedown listener + keydown listener, both removed on close/unmount).
  // Escape also returns focus to the trigger button, matching that
  // component's own focus-return behavior.
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) close();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const focusable = itemRefs.current.filter(Boolean);
        if (!focusable.length) return;
        const currentIndex = focusable.indexOf(document.activeElement);
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (currentIndex + delta + focusable.length) % focusable.length;
        focusable[nextIndex]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        itemRefs.current[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        itemRefs.current[itemRefs.current.length - 1]?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    // Move focus into the menu as soon as it opens, so keyboard users land
    // straight on the first item instead of having to Tab into it.
    itemRefs.current[0]?.focus();
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  if (loading) return null;

  const pillStyle = {
    display: "flex", alignItems: "center", gap: 10, padding: "6px 14px 6px 6px",
    background: "var(--nv-surface-strong, rgba(18,0,38,0.72))", backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))", WebkitBackdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
    border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.28))", borderRadius: 30,
    color: "var(--nv-text-primary, #e8d5ff)", fontSize: 13, fontFamily: "Inter,sans-serif", cursor: "pointer",
    boxShadow: "var(--nv-shadow-md, 0 4px 20px rgba(80,0,180,0.25))", minHeight: 44,
  };

  if (!user) {
    return (
      <div style={{ position: "fixed", top: 14, right: 14, zIndex: 1000, fontFamily: "Inter,sans-serif" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate("login")} className="pill-btn account-focusable" style={{ ...pillStyle, padding: "8px 16px", color: "var(--nv-text-secondary, rgba(200,160,255,0.85))" }}>
            Sign In
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="pill-btn account-focusable"
            style={{ ...pillStyle, padding: "8px 16px", background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", border: "1px solid rgba(180,120,255,0.45)", color: "var(--nv-text-on-accent, #fff)", fontWeight: 600 }}
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 14, right: 14, zIndex: 1000, fontFamily: "Inter,sans-serif" }}>
      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          ref={triggerRef}
          onClick={() => setOpen((o) => !o)}
          className="pill-btn account-trigger account-focusable"
          style={pillStyle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Account menu for ${user.name}`}
        >
          <Avatar user={user} size={30} />
          <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
          <span aria-hidden="true" className="account-chevron" style={{ fontSize: 10, opacity: 0.7, transform: open ? "rotate(180deg)" : "none" }}>▼</span>
        </button>

        {open && (
          <div
            className="dropdown-panel account-dropdown"
            role="menu"
            aria-label="Account"
            style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0, width: "min(280px, 88vw)",
              background: "var(--nv-surface-strong, rgba(18,0,38,0.94))", backdropFilter: "blur(var(--nv-glass-blur, 20px))", WebkitBackdropFilter: "blur(var(--nv-glass-blur, 20px))",
              border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.25))", borderRadius: 16, padding: 8,
              boxShadow: "var(--nv-shadow-xl, 0 12px 40px rgba(0,0,0,0.45))", overflow: "hidden",
            }}
          >
            {/* Identity header: photo/initials, full name, email, member since */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px 14px", borderBottom: "1px solid var(--nv-surface-border, rgba(180,120,255,0.16))", marginBottom: 6 }}>
              <Avatar user={user} size={44} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.65))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
                <div style={{ fontSize: 11, color: "var(--nv-text-faint, rgba(200,160,255,0.45))", marginTop: 2 }}>
                  Member since {formatDate(user.createdAt)}
                </div>
              </div>
            </div>

            {items.map((item, i) => (
              <button
                key={item.key}
                ref={(el) => (itemRefs.current[i] = el)}
                role="menuitem"
                onClick={() => { close(); item.onSelect(); }}
                className="menu-item account-focusable"
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "11px 12px", background: "none", border: "none", color: "var(--nv-text-primary, #e8d5ff)",
                  fontSize: 13, cursor: "pointer", borderRadius: 8, minHeight: 44,
                  fontFamily: "Inter,sans-serif",
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            ))}

            <div style={{ height: 1, background: "var(--nv-surface-border, rgba(180,120,255,0.16))", margin: "6px 4px" }} />

            <button
              ref={(el) => (itemRefs.current[items.length] = el)}
              role="menuitem"
              onClick={async () => { close(); await handleLogout(); onNavigate("home"); }}
              className="menu-item account-focusable"
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                padding: "11px 12px", background: "none", border: "none", color: "var(--nv-danger, #ff9d9d)",
                fontSize: 13, cursor: "pointer", borderRadius: 8, minHeight: 44,
                fontFamily: "Inter,sans-serif",
              }}
            >
              <span aria-hidden="true">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountMenu;
