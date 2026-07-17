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

export function emailError(value) {
  const v = String(value || "").trim();
  if (!v) return "Email is required.";
  if (!isValidEmail(v)) return "Enter a valid email address.";
  return null;
}

export function requiredError(value, label = "This field") {
  return String(value || "").trim() ? null : `${label} is required.`;
}

// Lightweight, dependency-free password strength estimate. Scores 0-4
// based on length + character-class variety — intentionally simple (no
// zxcvbn/library dependency) since this only drives a visual meter, not
// any pass/fail gate enforced by the backend.
export function getPasswordStrength(password) {
  const pw = String(password || "");
  if (!pw) return { score: 0, label: "", color: "rgba(180,130,255,0.3)" };

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const clamped = Math.min(score, 4);
  const levels = [
    { label: "Very weak", color: "#ff6b6b" },
    { label: "Weak", color: "#ff9d5c" },
    { label: "Fair", color: "#ffd166" },
    { label: "Good", color: "#8ce99a" },
    { label: "Strong", color: "#51cf66" },
  ];
  return { score: clamped, ...levels[clamped] };
}

export function passwordRequirements(password) {
  const pw = String(password || "");
  return [
    { met: pw.length >= 8, label: "At least 8 characters" },
    { met: /\d/.test(pw), label: "At least one number" },
    { met: /[A-Z]/.test(pw), label: "At least one uppercase letter" },
  ];
}
