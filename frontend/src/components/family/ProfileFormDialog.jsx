import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../common/GlassCard.jsx";
import { RELATIONSHIPS } from "../../utils/familyProfileConstants.js";

// ─────────────────────────────────────────────────────────────────────────
// ProfileFormDialog (V4.2 — Family Profiles & Relationship Hub)
//
// Add/Edit dialog for a single Family Profile. Reuses the exact modal
// shell pattern ConfirmDialog.jsx already established (role="alertdialog",
// focus trap on open/close, Escape-to-cancel, click-backdrop-to-cancel)
// and the exact birth-data field styling PersonInputCard.jsx (Kundli
// Matching) already established — this dialog is that same birth-data
// form, plus the two fields unique to a Family Profile: Relationship and
// (when Relationship is "Custom") a free-text label.
//
// This component owns no persistence itself — `onSave` is the caller's
// familyProfilesApi.createProfile/updateProfile call (see
// FamilyProfilesPage.jsx). No astrology calculation happens here at all.
// ─────────────────────────────────────────────────────────────────────────

const INPUT_STYLE = {width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(180,120,255,0.28)",
  borderRadius: 12, color: "var(--nv-text-primary, #e8d5ff)", fontSize: 14, outline: "none",
  fontFamily: "Inter,sans-serif",
};

const LABEL_STYLE = {display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 6,
  letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500,
};

const FIELDS = [
  {key: "name", labelKey: "fields.name", type: "text", placeholderKey: "fields.namePlaceholder", icon: "✦" },
  { key: "dob", labelKey: "fields.dob", type: "date", placeholderKey: null, icon: "◈" },
  { key: "tob", labelKey: "fields.tob", type: "time", placeholderKey: null, icon: "◉" },
  { key: "pob", labelKey: "fields.pob", type: "text", placeholderKey: "fields.pobPlaceholder", icon: "◎" },
];

const GENDERS = [
  {key: "male", labelKey: "genderMale" },
  {key: "female", labelKey: "genderFemale" },
  { key: "other", labelKey: "genderOther" },
];

const RELATIONSHIP_ICONS = {father: "👨", mother: "👩", husband: "🤵", wife: "👰", son: "👦", daughter: "👧",
  brother: "🧑", sister: "👧", friend: "🤝", client: "💼", custom: "✦",
};

const EMPTY_PROFILE = { name: "", relationship: "", customRelationshipLabel: "", gender: "", dob: "", tob: "", pob: "" };

function ProfileFormDialog({ open, initialProfile, onSave, onCancel, saving = false }) {
  const { t } = useTranslation(["family"]);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [errors, setErrors] = useState({});
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    setProfile(initialProfile ? { ...EMPTY_PROFILE, ...initialProfile } : EMPTY_PROFILE);
    setErrors({});
  }, [open, initialProfile]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    dialogRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previouslyFocused.current?.focus) previouslyFocused.current.focus();
    };
  }, [open, onCancel, saving]);

  if (!open) return null;

  const set = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  function validate() {
    const errs = {};
    if (!profile.name.trim()) errs.name = t("family:formDialog.errors.nameRequired");
    if (!profile.relationship) errs.relationship = t("family:formDialog.errors.relationshipRequired");
    if (profile.relationship === "custom" && !profile.customRelationshipLabel.trim()) {
      errs.customRelationshipLabel = t("family:formDialog.errors.customRelationshipRequired");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dob)) errs.dob = t("family:formDialog.errors.dobRequired");
    if (!/^\d{2}:\d{2}$/.test(profile.tob)) errs.tob = t("family:formDialog.errors.tobRequired");
    if (!profile.pob.trim()) errs.pob = t("family:formDialog.errors.pobRequired");
    if (!profile.gender) errs.gender = t("family:formDialog.errors.genderRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(profile);
  };

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 3000, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto",
        background: "var(--nv-overlay-scrim, rgba(5,0,15,0.6))", backdropFilter: "blur(var(--nv-scrim-blur, 4px))",
        animation: "fadeIn 0.18s ease both",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
        tabIndex={-1}
        ref={dialogRef}
        className="confirm-dialog-pop"
        style={{ width: "min(520px, 100%)", margin: "24px 0" }}
      >
        <GlassCard style={{ padding: "26px 26px 22px" }}>
          <h2 id="profile-dialog-title" style={{ margin: "0 0 18px", fontSize: 18, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif" }}>
            {initialProfile ? t("family:formDialog.editTitle") : t("family:formDialog.addTitle")}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={LABEL_STYLE}>{t("family:formDialog.relationshipLabel")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {RELATIONSHIPS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="pill-btn tap-scale"
                    onClick={() => set("relationship", r)}
                    aria-pressed={profile.relationship === r}
                    style={{
                      padding: "8px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      fontFamily: "Inter,sans-serif",
                      background: profile.relationship === r ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))" : "rgba(255,255,255,0.05)",
                      border: profile.relationship === r ? "1px solid rgba(191,127,255,0.6)" : "1px solid rgba(180,120,255,0.28)",
                      color: profile.relationship === r ? "#fff" : "var(--nv-text-secondary, rgba(210,175,255,0.76))",
                    }}
                  >
                    {RELATIONSHIP_ICONS[r]} {t(`family:relationships.${r}`)}
                  </button>
                ))}
              </div>
              {errors.relationship && <p role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{errors.relationship}</p>}
            </div>

            {profile.relationship === "custom" && (
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>{t("family:formDialog.customRelationshipLabel")}</label>
                <input
                  type="text"
                  placeholder={t("family:formDialog.customRelationshipPlaceholder")}
                  value={profile.customRelationshipLabel}
                  onChange={(e) => set("customRelationshipLabel", e.target.value)}
                  style={{ ...INPUT_STYLE, ...(errors.customRelationshipLabel ? { borderColor: "rgba(255,100,100,0.5)" } : {}) }}
                />
                {errors.customRelationshipLabel && <p role="alert" style={{ margin: "5px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{errors.customRelationshipLabel}</p>}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={LABEL_STYLE}><span aria-hidden="true">⚥</span> {t("family:formDialog.genderLabel")}</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {GENDERS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    className="pill-btn tap-scale"
                    onClick={() => set("gender", g.key)}
                    aria-pressed={profile.gender === g.key}
                    style={{
                      flex: "1 1 auto", padding: "9px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "Inter,sans-serif",
                      background: profile.gender === g.key ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))" : "rgba(255,255,255,0.05)",
                      border: profile.gender === g.key ? "1px solid rgba(191,127,255,0.6)" : "1px solid rgba(180,120,255,0.28)",
                      color: profile.gender === g.key ? "#fff" : "var(--nv-text-secondary, rgba(210,175,255,0.76))",
                    }}
                  >
                    {t(`family:formDialog.${g.labelKey}`)}
                  </button>
                ))}
              </div>
              {errors.gender && <p role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{errors.gender}</p>}
            </div>

            {FIELDS.map((f) => {
              const hasError = Boolean(errors[f.key]);
              return (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={LABEL_STYLE}><span aria-hidden="true">{f.icon}</span> {t(`family:formDialog.${f.labelKey}`)}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholderKey ? t(`family:formDialog.${f.placeholderKey}`) : ""}
                    value={profile[f.key]}
                    aria-invalid={hasError || undefined}
                    onChange={(e) => set(f.key, e.target.value)}
                    style={{ ...INPUT_STYLE, ...(hasError ? { borderColor: "rgba(255,100,100,0.5)" } : {}) }}
                  />
                  {hasError && <p role="alert" style={{ margin: "5px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{errors[f.key]}</p>}
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="pill-btn tap-scale"
                style={{
                  padding: "10px 18px", borderRadius: 20, fontSize: 13, cursor: saving ? "default" : "pointer",
                  border: "1px solid rgba(180,120,255,0.3)", background: "transparent", color: "var(--nv-text-primary, #e8d5ff)",
                  fontFamily: "Inter,sans-serif", opacity: saving ? 0.5 : 1,
                }}
              >
                {t("family:formDialog.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="pill-btn tap-scale"
                style={{
                  padding: "10px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer",
                  border: "1px solid rgba(180,120,255,0.45)",
                  background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
                  color: "#fff", fontFamily: "Inter,sans-serif", opacity: saving ? 0.85 : 1,
                }}
              >
                {saving ? t("family:formDialog.saving") : (initialProfile ? t("family:formDialog.saveChanges") : t("family:formDialog.addProfile"))}
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

export default ProfileFormDialog;
