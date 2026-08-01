<<<<<<< HEAD
function AuthDivider({ label = "or continue with email" }) {
=======
import { useTranslation } from "react-i18next";

function AuthDivider({ label }) {
  const { t } = useTranslation(["auth"]);
  const resolvedLabel = label ?? t("auth:divider.orContinueWithEmail");
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  return (
    <div role="separator" style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
      <span style={{ flex: 1, height: 1, background: "var(--nv-surface-border, rgba(180,120,255,0.18))" }} />
      <span style={{ fontSize: 11, letterSpacing: 0.5, color: "var(--nv-text-faint, rgba(200,160,255,0.45))", whiteSpace: "nowrap" }}>
<<<<<<< HEAD
        {label}
=======
        {resolvedLabel}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--nv-surface-border, rgba(180,120,255,0.18))" }} />
    </div>
  );
}

export default AuthDivider;
