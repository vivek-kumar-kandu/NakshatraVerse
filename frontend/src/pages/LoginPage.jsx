import { useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import GoogleSignInButton, { isGoogleAuthAvailable } from "../components/common/GoogleSignInButton.jsx";
import AuthLocalStyles from "../components/common/auth/AuthLocalStyles.jsx";
import AuthDivider from "../components/common/auth/AuthDivider.jsx";
import PasswordField from "../components/common/auth/PasswordField.jsx";
import Spinner from "../components/common/auth/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { GOLD_GRADIENT } from "../constants/astrology.js";
import { emailError as getEmailError, requiredError } from "../utils/authValidation.js";

const INPUT_STYLE = {
  width: "100%", padding: "14px 18px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(180,120,255,0.28)",
  borderRadius: 12, color: "var(--nv-text-primary, #e8d5ff)", fontSize: 15, outline: "none",
  fontFamily: "Inter,sans-serif", transition: "border-color var(--nv-duration-base) var(--nv-ease-standard), box-shadow var(--nv-duration-base) var(--nv-ease-standard)",
};

const REMEMBER_ME_KEY = "nv_remember_me";

// ─────────────────────────────────────────────────────────────────────────
// LoginPage (Priority 5.2, refreshed in Priority 6.2)
// Visually matches LandingPage (CosmicBg, GlassCard, gold-gradient title,
// Cinzel/Inter typography) so signing in feels like part of the same
// experience rather than a bolted-on admin screen.
//
// Priority 6.2 changes are presentation-only: inline per-field validation,
// a password show/hide toggle, an in-button loading spinner, a "Forgot
// password?" link, and a "Keep me signed in" preference. The actual
// login()/loginWithGoogle() calls, their request shape, and error handling
// are unchanged from Priority 5.2 — see AuthContext.jsx / authApi.js.
// ─────────────────────────────────────────────────────────────────────────
const googleAvailable = isGoogleAuthAvailable();

function LoginPage({ onNavigate }) {
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_ME_KEY) !== "false";
    } catch {
      return true;
    }
  });

  const fieldErrors = {
    email: touched.email ? getEmailError(form.email) : null,
    password: touched.password ? requiredError(form.password, "Password") : null,
  };
  const busy = submitting || googleBusy;

  const handleRememberChange = (ev) => {
    const next = ev.target.checked;
    setRememberMe(next);
    try {
      localStorage.setItem(REMEMBER_ME_KEY, String(next));
    } catch {
      // Preference persistence is a nice-to-have; ignore storage failures
      // (private browsing, quota, etc.) rather than breaking sign-in.
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError(null);
    setTouched({ email: true, password: true });
    if (getEmailError(form.email) || requiredError(form.password, "Password")) {
      return;
    }
    setSubmitting(true);
    try {
      await login(form);
      // Priority 5.4 fix: was hardcoded to "dashboard", which discarded an
      // in-progress "Save Report" attempt that sent the visitor here in
      // the first place. "post-auth" resolves to wherever they actually
      // meant to go (see App.jsx's postLoginTarget).
      onNavigate("post-auth");
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken) => {
    setError(null);
    setGoogleBusy(true);
    try {
      await loginWithGoogle(idToken);
      onNavigate("post-auth");
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
      <AuthLocalStyles />
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px" }}>

        <div style={{ textAlign: "center", marginBottom: 36, animation: "fadeIn 0.8s ease both" }}>
          <div aria-hidden="true" style={{ fontSize: 46, marginBottom: 12, animation: "glow 3s infinite", display: "inline-block" }}>🪐</div>
          <h1 style={{ margin: "0 0 6px", fontSize: "clamp(26px,5vw,40px)", fontWeight: 700,
            letterSpacing: 2, background: GOLD_GRADIENT, WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
            Welcome Back
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>Sign in to view your saved readings</p>
        </div>

        <GlassCard style={{ width: "100%", maxWidth: 420, padding: "36px 32px", animation: "fadeIn 0.5s ease 0.1s both" }}>
          {googleAvailable && (
            <>
              <div style={{ animation: "fadeIn 0.4s ease var(--nv-duration-fast) var(--nv-ease-standard) both", opacity: busy ? 0.6 : 1, pointerEvents: busy ? "none" : "auto", transition: "opacity var(--nv-duration-base) var(--nv-ease-standard)" }}>
                <GoogleSignInButton onCredential={handleGoogleCredential} />
              </div>
              <AuthDivider />
            </>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 18, animation: "fadeIn 0.4s ease 0.2s both" }}>
              <label htmlFor="login-email" style={{ display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 7, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500 }}>Email</label>
              <input id="login-email" name="email" type="email" autoComplete="email" value={form.email} disabled={busy}
                onChange={(ev) => setForm((p) => ({ ...p, email: ev.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                className={`auth-input${fieldErrors.email ? " auth-input-invalid auth-field-error" : ""}`}
                style={INPUT_STYLE} />
              {fieldErrors.email && (
                <p id="login-email-error" role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{fieldErrors.email}</p>
              )}
            </div>
            <div style={{ marginBottom: 8, animation: "fadeIn 0.4s ease 0.25s both" }}>
              <PasswordField
                id="login-password"
                label="Password"
                autoComplete="current-password"
                value={form.password}
                disabled={busy}
                onChange={(ev) => setForm((p) => ({ ...p, password: ev.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                error={fieldErrors.password}
                inputStyle={INPUT_STYLE}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, animation: "fadeIn 0.4s ease 0.3s both" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.65))", cursor: "pointer" }}>
                <input type="checkbox" className="auth-checkbox" checked={rememberMe} onChange={handleRememberChange} disabled={busy} />
                Keep me signed in
              </label>
              <button type="button" onClick={() => onNavigate("forgot-password")} className="auth-link-btn"
                style={{ background: "none", border: "none", color: "#bf7fff", cursor: "pointer", fontSize: 12, padding: 0 }}>
                Forgot password?
              </button>
            </div>

            {error && <p role="alert" style={{ margin: "14px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{error}</p>}

            <button type="submit" className="submit-btn" disabled={busy} style={{
              width: "100%", marginTop: 18, padding: "16px 0",
              background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
              border: "1px solid rgba(180,120,255,0.45)", borderRadius: 50,
              color: "var(--nv-text-on-accent, #fff)", fontSize: 16, fontWeight: 600, cursor: busy ? "default" : "pointer",
              // Final V1.0 UI Polish Patch: this button is `disabled={busy}`
              // (true during either local submission or Google sign-in), but
              // its dimmed/disabled look previously only keyed off
              // `submitting` — so during a Google sign-in the button was
              // unclickable yet looked fully active, with no visual
              // disabled feedback. Keying opacity off `busy` matches what
              // `disabled` actually reflects.
              opacity: busy ? 0.85 : 1,
              letterSpacing: 1, boxShadow: "0 4px 28px rgba(123,47,255,0.38)",
              transition: "all var(--nv-duration-base) var(--nv-ease-standard)", fontFamily: "Cinzel,serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              animation: "fadeIn 0.4s ease 0.35s both",
            }}>
              {submitting && <Spinner size={16} />}
              {submitting ? "Signing in…" : "✦ Sign In ✦"}
            </button>
            <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: 11, color: "rgba(180,130,255,0.4)" }}>
              {rememberMe ? "You'll stay signed in on this device for 30 days." : "You'll be signed out when you close your browser session."}
            </p>
          </form>

          <p style={{ textAlign: "center", margin: "20px 0 0", fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
            New here?{" "}
            <button onClick={() => onNavigate("signup")} className="auth-link-btn" style={{ background: "none", border: "none", color: "#bf7fff", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}>
              Create an account
            </button>
          </p>
          <p style={{ textAlign: "center", margin: "10px 0 0" }}>
            {/* Priority 6.2.1 fix: this used to call onNavigate("landing"),
                which is this codebase's internal name for the old
                birth-details form (pages/LandingPage.jsx) — not the
                marketing Home page. That meant "← Back to home" silently
                dropped a visitor onto the birth form instead of Home.
                "home" is the correct stage for the marketing HomePage. */}
            <button onClick={() => onNavigate("home")} className="auth-link-btn" style={{ background: "none", border: "none", color: "rgba(180,130,255,0.5)", cursor: "pointer", fontSize: 12, padding: 0 }}>
              ← Back to home
            </button>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

export default LoginPage;
