function AuthDivider({ label = "or continue with email" }) {
  return (
    <div role="separator" style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
      <span style={{ flex: 1, height: 1, background: "var(--nv-surface-border, rgba(180,120,255,0.18))" }} />
      <span style={{ fontSize: 11, letterSpacing: 0.5, color: "var(--nv-text-faint, rgba(200,160,255,0.45))", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--nv-surface-border, rgba(180,120,255,0.18))" }} />
    </div>
  );
}

export default AuthDivider;
