import { memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// AuthLocalStyles (Priority 6.2)
// A handful of small, purely-decorative rules shared by LoginPage,
// SignupPage, and ForgotPasswordPage — scoped to their own classnames so
// nothing outside these three screens is affected. Follows the same
// "component-local <style> tag" pattern already used by Navbar.jsx
// (Priority 6.1) rather than editing the shared global.css, so this
// priority makes zero changes to global.css.
//
// `spin` and `fadeIn` (used via inline animationName in the components
// that import this) are the project's existing global.css keyframes —
// only `authShake` and `authCheckPop` below are new, and both live only
// inside this scoped block.
// ─────────────────────────────────────────────────────────────────────────
function AuthLocalStyles() {
  return (
    <style>{`
      @keyframes authShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(2px); }
      }
      @keyframes authCheckPop {
        0% { transform: scale(0.4); opacity: 0; }
        60% { transform: scale(1.08); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      .auth-field-error { animation: authShake 0.35s ease; }
      .auth-input:focus {
        border-color: rgba(191,127,255,0.75) !important;
        box-shadow: 0 0 0 3px var(--nv-accent-wash, rgba(123,47,255,0.18)) !important;
      }
      .auth-input-invalid, .auth-input-invalid:focus {
        border-color: rgba(255,110,110,0.65) !important;
        box-shadow: 0 0 0 3px rgba(255,80,80,0.12) !important;
      }
      .auth-icon-btn { transition: color var(--nv-duration-fast) var(--nv-ease-standard), transform var(--nv-duration-fast) var(--nv-ease-standard), opacity var(--nv-duration-fast) var(--nv-ease-standard); }
      .auth-icon-btn:hover:not(:disabled) { color: var(--nv-text-primary, #e8d5ff) !important; }
      .auth-icon-btn:active:not(:disabled) { transform: scale(0.92); }
      .auth-icon-btn:disabled { opacity: 0.4; }
      .auth-toggle-btn { transition: all var(--nv-duration-base) var(--nv-ease-standard); }
      .auth-toggle-btn:hover { border-color: rgba(191,127,255,0.55) !important; transform: translateY(-1px); }
      .auth-strength-bar { transition: width var(--nv-duration-slow) var(--nv-ease-standard), background var(--nv-duration-slow) var(--nv-ease-standard); }
      .auth-checkbox { accent-color: #9040ff; cursor: pointer; }
      .auth-link-btn { transition: color var(--nv-duration-fast) var(--nv-ease-standard); }
      .auth-link-btn:hover { color: var(--nv-text-primary, #e8d5ff) !important; }
      .auth-spinner { animation: spin 0.7s linear infinite; }
      .auth-success-icon { animation: authCheckPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      @media (prefers-reduced-motion: reduce) {
        .auth-field-error, .auth-success-icon { animation: none !important; }
      }
    `}</style>
  );
}

export default memo(AuthLocalStyles);
