// ─────────────────────────────────────────────────────────────────────────
// Auth form validation helpers (Priority 6.2)
// Pure, presentation-only helpers used by LoginPage / SignupPage /
// ForgotPasswordPage for real-time field feedback. These never talk to the
// network and never change what gets sent to the backend — they only
// decide what inline copy/color to show while the person is typing.
// ─────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || "").trim());
}

export function emailError(value, t) {
  const v = String(value || "").trim();
  if (!v) return t ? t("auth:validation.emailRequired") : "Email is required.";
  if (!isValidEmail(v)) return t ? t("auth:validation.emailInvalid") : "Enter a valid email address.";
  return null;
}

export function requiredError(value, label = "This field", t) {
  if (String(value || "").trim()) return null;
  return t ? t("auth:validation.requiredField", { label }) : `${label} is required.`;
}

// Lightweight, dependency-free password strength estimate. Scores 0-4
// based on length + character-class variety — intentionally simple (no
// zxcvbn/library dependency) since this only drives a visual meter, not
// any pass/fail gate enforced by the backend.
export function getPasswordStrength(password, t) {
  const pw = String(password || "");
  if (!pw) return { score: 0, label: "", color: "rgba(180,130,255,0.3)" };

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const clamped = Math.min(score, 4);
  const levelKeys = ["veryWeak", "weak", "fair", "good", "strong"];
  const levels = [
    { label: "Very weak", color: "#ff6b6b" },
    { label: "Weak", color: "#ff9d5c" },
    { label: "Fair", color: "#ffd166" },
    { label: "Good", color: "#8ce99a" },
    { label: "Strong", color: "#51cf66" },
  ];
  const level = levels[clamped];
  const label = t ? t(`auth:validation.passwordStrength.${levelKeys[clamped]}`) : level.label;
  return { score: clamped, label, color: level.color };
}

export function passwordRequirements(password, t) {
  const pw = String(password || "");
  return [
    { met: pw.length >= 8, label: t ? t("auth:validation.passwordRequirements.minLength") : "At least 8 characters" },
    { met: /\d/.test(pw), label: t ? t("auth:validation.passwordRequirements.number") : "At least one number" },
    { met: /[A-Z]/.test(pw), label: t ? t("auth:validation.passwordRequirements.uppercase") : "At least one uppercase letter" },
  ];
}
