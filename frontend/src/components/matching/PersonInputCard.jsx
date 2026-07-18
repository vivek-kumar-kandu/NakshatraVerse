import GlassCard from "../common/GlassCard.jsx";

const INPUT_STYLE = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(180,120,255,0.28)",
  borderRadius: 12, color: "var(--nv-text-primary, #e8d5ff)", fontSize: 14, outline: "none",
  fontFamily: "Inter,sans-serif",
  transition: "border-color var(--nv-duration-base) var(--nv-ease-standard), box-shadow var(--nv-duration-base) var(--nv-ease-standard)",
};

const LABEL_STYLE = {
  display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 6,
  letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500,
};

const FIELDS = [
  { key: "name", label: "Full Name", type: "text", placeholder: "e.g. Arjun Sharma", icon: "✦" },
  { key: "dob", label: "Date of Birth", type: "date", placeholder: "", icon: "◈" },
  { key: "tob", label: "Time of Birth", type: "time", placeholder: "", icon: "◉" },
  { key: "pob", label: "Place of Birth", type: "text", placeholder: "e.g. Mumbai, India", icon: "◎" },
];

const GENDERS = [
  { key: "male", label: "♂ Male" },
  { key: "female", label: "♀ Female" },
  { key: "other", label: "⚧ Other" },
];

function PersonInputCard({ title, accent = "#bf7fff", person, errors, onChange }) {
  return (
    <GlassCard style={{ padding: "26px 24px", flex: "1 1 320px", minWidth: 280 }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 17, color: accent, fontFamily: "Cinzel,serif", fontWeight: 600, textAlign: "center" }}>
        {title}
      </h3>

      <div style={{ marginBottom: 18 }}>
        <label style={LABEL_STYLE}><span aria-hidden="true">⚥</span> Gender</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {GENDERS.map((g) => (
            <button
              key={g.key}
              type="button"
              className="pill-btn tap-scale"
              onClick={() => onChange("gender", g.key)}
              aria-pressed={person.gender === g.key}
              style={{
                flex: "1 1 auto", padding: "9px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "Inter,sans-serif",
                background: person.gender === g.key ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))" : "rgba(255,255,255,0.05)",
                border: person.gender === g.key ? "1px solid rgba(191,127,255,0.6)" : "1px solid rgba(180,120,255,0.28)",
                color: person.gender === g.key ? "#fff" : "var(--nv-text-secondary, rgba(210,175,255,0.76))",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
        {errors.gender && <p role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{errors.gender}</p>}
      </div>

      {FIELDS.map((f) => {
        const hasError = Boolean(errors[f.key]);
        return (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}><span aria-hidden="true">{f.icon}</span> {f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={person[f.key]}
              aria-invalid={hasError || undefined}
              onChange={(ev) => onChange(f.key, ev.target.value)}
              style={{ ...INPUT_STYLE, ...(hasError ? { borderColor: "rgba(255,100,100,0.5)" } : {}) }}
            />
            {hasError && <p role="alert" style={{ margin: "5px 0 0", fontSize: 12, color: "var(--nv-danger, #ff8888)" }}>{errors[f.key]}</p>}
          </div>
        );
      })}
    </GlassCard>
  );
}

export default PersonInputCard;
