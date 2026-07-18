import { useState } from "react";

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {open ? (
      <>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      </>
    ) : (
      <>
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10.6 5.2C11 5.1 11.5 5 12 5c7 0 11 7 11 7-.6 1-1.5 2.3-2.8 3.5M6.6 6.6C3.7 8.4 2 11 2 12c0 0 4 7 11 7 1.3 0 2.5-.2 3.6-.6"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    )}
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────
// PasswordField (Priority 6.2)
// Shared password input for Login/Signup: adds a show/hide toggle and an
// (optional) inline validation message, on top of the same visual language
// (border/radius/colors) LoginPage/SignupPage already used inline. Purely
// a presentation component — the value/onChange contract is unchanged, so
// wiring it into the existing forms doesn't touch any auth logic.
// ─────────────────────────────────────────────────────────────────────────
function PasswordField({ id, label, value, onChange, onBlur, autoComplete, name, error, hint, disabled, inputStyle }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} style={{
        display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 7,
        letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500,
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={name || autoComplete}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`auth-input${error ? " auth-input-invalid" : ""}${error ? " auth-field-error" : ""}`}
          style={{ ...inputStyle, paddingRight: 46 }}
        />
        <button
          type="button"
          className="auth-icon-btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          tabIndex={0}
          disabled={disabled}
          style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: disabled ? "default" : "pointer",
            color: "var(--nv-text-muted, rgba(200,160,255,0.55))", padding: 4, display: "flex",
          }}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(180,130,255,0.45)" }}>{hint}</p>
      ) : null}
    </div>
  );
}

export default PasswordField;
