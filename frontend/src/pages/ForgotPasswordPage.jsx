import { useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import AuthLocalStyles from "../components/common/auth/AuthLocalStyles.jsx";
import Spinner from "../components/common/auth/Spinner.jsx";
import { GOLD_GRADIENT } from "../constants/astrology.js";
import { emailError as getEmailError } from "../utils/authValidation.js";
import { requestPasswordReset } from "../utils/authApi.js";

const INPUT_STYLE = {
  width: "100%", padding: "14px 18px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(180,120,255,0.28)",
  borderRadius: 12, color: "var(--nv-text-primary, #e8d5ff)", fontSize: 15, outline: "none",
  fontFamily: "Inter,sans-serif", transition: "border-color var(--nv-duration-base) var(--nv-ease-standard), box-shadow var(--nv-duration-base) var(--nv-ease-standard)",
};

// ─────────────────────────────────────────────────────────────────────────
// ForgotPasswordPage (Priority 6.2 — new)
// Email-only request form. There is no backend password-reset endpoint yet
// (see the Priority 6.2 comment in utils/authApi.js) — this screen always
// resolves to the same generic confirmation state, which is both the
// correct account-enumeration-safe behavior for this flow and a graceful
// degradation while the backend endpoint doesn't exist yet. Visually
// matches LoginPage/SignupPage (CosmicBg, GlassCard, gold-gradient title).
// ─────────────────────────────────────────────────────────────────────────
function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validationError = touched ? getEmailError(email) : null;

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setTouched(true);
    if (getEmailError(email)) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
      <AuthLocalStyles />
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px" }}>

        <div style={{ textAlign: "center", marginBottom: 36, animation: "fadeIn 0.8s ease both" }}>
          <div aria-hidden="true" style={{ fontSize: 46, marginBottom: 12, animation: "glow 3s infinite", display: "inline-block" }}>🔑</div>
          <h1 style={{ margin: "0 0 6px", fontSize: "clamp(26px,5vw,40px)", fontWeight: 700,
            letterSpacing: 2, background: GOLD_GRADIENT, WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
            Reset Your Password
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>
            {sent ? "Check your inbox for next steps" : "We'll email you a link to get back in"}
          </p>
        </div>

        <GlassCard style={{ width: "100%", maxWidth: 420, padding: "36px 32px", animation: "fadeIn 0.5s ease 0.1s both" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div className="auth-success-icon" aria-hidden="true" style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 18px",
                background: "rgba(140,230,150,0.12)", border: "1px solid rgba(140,230,150,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
              }}>
                ✓
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 14, color: "var(--nv-text-primary, #e8d5ff)", lineHeight: 1.6 }}>
                If an account exists for <strong style={{ color: "#bf7fff" }}>{email.trim()}</strong>, we've sent a
                password reset link to it.
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                Didn't get it? Check your spam folder, or try again in a few minutes.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="submit-btn"
                style={{
                  width: "100%", padding: "16px 0",
                  background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
                  border: "1px solid rgba(180,120,255,0.45)", borderRadius: 50,
                  color: "var(--nv-text-on-accent, #fff)", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  letterSpacing: 1, boxShadow: "0 4px 28px rgba(123,47,255,0.38)",
                  transition: "all var(--nv-duration-base) var(--nv-ease-standard)", fontFamily: "Cinzel,serif",
                }}
              >
                ← Back to Sign In
              </button>
              <p style={{ textAlign: "center", margin: "16px 0 0" }}>
                <button onClick={() => onNavigate("home")} className="auth-link-btn" style={{ background: "none", border: "none", color: "rgba(180,130,255,0.5)", cursor: "pointer", fontSize: 12, padding: 0 }}>
                  ← Back to home
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.65))", lineHeight: 1.6 }}>
                Enter the email address on your account and we'll send you a link to reset your password.
              </p>
              <div style={{ marginBottom: 8, animation: "fadeIn 0.4s ease 0.05s both" }}>
                <label htmlFor="forgot-email" style={{ display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 7, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500 }}>
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={submitting}
                  onChange={(ev) => setEmail(ev.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={Boolean(validationError)}
                  aria-describedby={validationError ? "forgot-email-error" : undefined}
                  className={`auth-input${validationError ? " auth-input-invalid auth-field-error" : ""}`}
                  style={INPUT_STYLE}
                />
                {validationError && (
                  <p id="forgot-email-error" role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>
                    {validationError}
                  </p>
                )}
              </div>

              <button type="submit" className="submit-btn" disabled={submitting} style={{
                width: "100%", marginTop: 18, padding: "16px 0",
                background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
                border: "1px solid rgba(180,120,255,0.45)", borderRadius: 50,
                color: "var(--nv-text-on-accent, #fff)", fontSize: 16, fontWeight: 600,
                cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.85 : 1,
                letterSpacing: 1, boxShadow: "0 4px 28px rgba(123,47,255,0.38)",
                transition: "all var(--nv-duration-base) var(--nv-ease-standard)", fontFamily: "Cinzel,serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                {submitting && <Spinner size={16} />}
                {submitting ? "Sending link…" : "Send Reset Link"}
              </button>
            </form>
          )}

          {!sent && (
            <>
              <p style={{ textAlign: "center", margin: "20px 0 0" }}>
                <button onClick={() => onNavigate("login")} className="auth-link-btn" style={{ background: "none", border: "none", color: "rgba(180,130,255,0.6)", cursor: "pointer", fontSize: 12, padding: 0 }}>
                  ← Back to Sign In
                </button>
              </p>
              <p style={{ textAlign: "center", margin: "10px 0 0" }}>
                {/* Priority 6.2.1: Forgot Password previously had no way
                    back to the marketing Home page at all — only a link
                    back to Sign In. */}
                <button onClick={() => onNavigate("home")} className="auth-link-btn" style={{ background: "none", border: "none", color: "rgba(180,130,255,0.5)", cursor: "pointer", fontSize: 12, padding: 0 }}>
                  ← Back to home
                </button>
              </p>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
