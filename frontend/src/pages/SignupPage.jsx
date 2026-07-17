import { useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import GoogleSignInButton, { isGoogleAuthAvailable } from "../components/common/GoogleSignInButton.jsx";
import AuthLocalStyles from "../components/common/auth/AuthLocalStyles.jsx";
import AuthDivider from "../components/common/auth/AuthDivider.jsx";
import PasswordField from "../components/common/auth/PasswordField.jsx";
import PasswordStrengthMeter from "../components/common/auth/PasswordStrengthMeter.jsx";
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

// ─────────────────────────────────────────────────────────────────────────
// SignupPage (Priority 5.2, refreshed in Priority 6.2)
//
// Priority 6.2 changes are presentation-only: inline per-field validation,
// a password strength meter + requirement checklist, a confirm-password
// field (client-side typo guard only — never sent to the backend), a
// password show/hide toggle, and an in-button loading spinner. The
// register()/loginWithGoogle() calls and the fields they send are
// unchanged from Priority 5.2 — see AuthContext.jsx / authApi.js.
// ─────────────────────────────────────────────────────────────────────────
const googleAvailable = isGoogleAuthAvailable();

function SignupPage({ onNavigate }) {
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const busy = submitting || googleBusy;

  const passwordTooShort = form.password && form.password.length < 8 ? "Password must be at least 8 characters." : null;
  const confirmMismatch = form.confirmPassword && form.confirmPassword !== form.password ? "Passwords don't match." : null;

  const fieldErrors = {
    name: touched.name ? requiredError(form.name, "Full name") : null,
    email: touched.email ? getEmailError(form.email) : null,
    password: touched.password ? (requiredError(form.password, "Password") || passwordTooShort) : null,
    confirmPassword: touched.confirmPassword ? (requiredError(form.confirmPassword, "Password confirmation") || confirmMismatch) : null,
  };

  const setField = (key) => (ev) => setForm((p) => ({ ...p, [key]: ev.target.value }));
  const setFieldTouched = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError(null);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (
      requiredError(form.name, "Full name") ||
      getEmailError(form.email) ||
      requiredError(form.password, "Password") ||
      passwordTooShort ||
      requiredError(form.confirmPassword, "Password confirmation") ||
      confirmMismatch
    ) {
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      // Priority 5.4 fix: see LoginPage — preserves an in-progress "Save
      // Report" redirect instead of always dropping onto the Dashboard.
      onNavigate("post-auth");
    } catch (err) {
      setError(err.message || "Sign up failed.");
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
          <div aria-hidden="true" style={{ fontSize: 46, marginBottom: 12, animation: "glow 3s infinite", display: "inline-block" }}>✨</div>
          <h1 style={{ margin: "0 0 6px", fontSize: "clamp(26px,5vw,40px)", fontWeight: 700,
            letterSpacing: 2, background: GOLD_GRADIENT, WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
            Create Your Account
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>Save readings and revisit them anytime</p>
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
              <label htmlFor="signup-name" style={{ display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 7, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500 }}>Full Name</label>
              <input id="signup-name" type="text" autoComplete="name" value={form.name} disabled={busy}
                onChange={setField("name")} onBlur={setFieldTouched("name")}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "signup-name-error" : undefined}
                className={`auth-input${fieldErrors.name ? " auth-input-invalid auth-field-error" : ""}`}
                style={INPUT_STYLE} />
              {fieldErrors.name && (
                <p id="signup-name-error" role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{fieldErrors.name}</p>
              )}
            </div>
            <div style={{ marginBottom: 18, animation: "fadeIn 0.4s ease 0.25s both" }}>
              <label htmlFor="signup-email" style={{ display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 7, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500 }}>Email</label>
              <input id="signup-email" type="email" autoComplete="email" value={form.email} disabled={busy}
                onChange={setField("email")} onBlur={setFieldTouched("email")}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
                className={`auth-input${fieldErrors.email ? " auth-input-invalid auth-field-error" : ""}`}
                style={INPUT_STYLE} />
              {fieldErrors.email && (
                <p id="signup-email-error" role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{fieldErrors.email}</p>
              )}
            </div>
            <div style={{ marginBottom: 18, animation: "fadeIn 0.4s ease 0.3s both" }}>
              <PasswordField
                id="signup-password"
                label="Password"
                autoComplete="new-password"
                value={form.password}
                disabled={busy}
                onChange={setField("password")}
                onBlur={setFieldTouched("password")}
                error={fieldErrors.password}
                hint={fieldErrors.password ? null : "At least 8 characters, including a number."}
                inputStyle={INPUT_STYLE}
              />
              <PasswordStrengthMeter password={form.password} />
            </div>
            <div style={{ marginBottom: 8, animation: "fadeIn 0.4s ease 0.35s both" }}>
              <PasswordField
                id="signup-confirm-password"
                label="Confirm Password"
                autoComplete="new-password"
                value={form.confirmPassword}
                disabled={busy}
                onChange={setField("confirmPassword")}
                onBlur={setFieldTouched("confirmPassword")}
                error={fieldErrors.confirmPassword}
                inputStyle={INPUT_STYLE}
              />
            </div>

            {error && <p role="alert" style={{ margin: "10px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{error}</p>}

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
              animation: "fadeIn 0.4s ease 0.4s both",
            }}>
              {submitting && <Spinner size={16} />}
              {submitting ? "Creating account…" : "✦ Create Account ✦"}
            </button>
            <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: 11, color: "rgba(180,130,255,0.4)" }}>
              You'll stay signed in on this device for 30 days after creating your account.
            </p>
          </form>

          <p style={{ textAlign: "center", margin: "20px 0 0", fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
            Already have an account?{" "}
            <button onClick={() => onNavigate("login")} className="auth-link-btn" style={{ background: "none", border: "none", color: "#bf7fff", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}>
              Sign in
            </button>
          </p>
          <p style={{ textAlign: "center", margin: "10px 0 0" }}>
            {/* Priority 6.2.1 fix: see LoginPage's identical fix — "landing"
                is this codebase's internal name for the old birth-details
                form, not the marketing Home page. "home" is correct here. */}
            <button onClick={() => onNavigate("home")} className="auth-link-btn" style={{ background: "none", border: "none", color: "rgba(180,130,255,0.5)", cursor: "pointer", fontSize: 12, padding: 0 }}>
              ← Back to home
            </button>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

export default SignupPage;
