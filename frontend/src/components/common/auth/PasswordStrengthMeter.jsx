import { getPasswordStrength, passwordRequirements } from "../../../utils/authValidation.js";

// ─────────────────────────────────────────────────────────────────────────
// PasswordStrengthMeter (Priority 6.2)
// Visual-only feedback under the signup password field: a 4-segment bar
// plus a small checklist of the requirements the backend already enforces
// (8+ characters — see SignupPage's existing client-side check and the
// backend's own validator). Nothing here changes what's validated, only
// how it's communicated while typing.
// ─────────────────────────────────────────────────────────────────────────
function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);
  const reqs = passwordRequirements(password);

  return (
    <div style={{ marginTop: 10, animation: "fadeIn 0.25s ease both" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="auth-strength-bar" style={{
            height: 4, flex: 1, borderRadius: 2,
            background: i < score ? color : "var(--nv-surface-border, rgba(180,120,255,0.15))",
          }} />
        ))}
      </div>
      {label && (
        <p style={{ margin: "0 0 6px", fontSize: 11, color, fontWeight: 600 }}>{label}</p>
      )}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        {reqs.map((r) => (
          <li key={r.label} style={{
            fontSize: 11, color: r.met ? "rgba(140,230,150,0.85)" : "var(--nv-text-faint, rgba(200,160,255,0.45))",
            display: "flex", alignItems: "center", gap: 6, transition: "color var(--nv-duration-base) var(--nv-ease-standard)",
          }}>
            <span aria-hidden="true">{r.met ? "✓" : "○"}</span>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PasswordStrengthMeter;
