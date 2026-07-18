import { useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import { GOLD_GRADIENT } from "../constants/astrology.js";

const FIELDS = [
  { key:"name", label:"Full Name", type:"text", placeholder:"e.g. Arjun Sharma", icon:"✦" },
  { key:"dob",  label:"Date of Birth", type:"date", placeholder:"", icon:"◈" },
  { key:"tob",  label:"Time of Birth", type:"time", placeholder:"", icon:"◉" },
  { key:"pob",  label:"Place of Birth", type:"text", placeholder:"e.g. Mumbai, India", icon:"◎" },
];

const INPUT_STYLE = {
  width:"100%", padding:"14px 18px",
  background:"rgba(255,255,255,0.05)", border:"1px solid rgba(180,120,255,0.28)",
  borderRadius:12, color:"var(--nv-text-primary, #e8d5ff)", fontSize:15, outline:"none",
  fontFamily:"Inter,sans-serif", transition:"border-color var(--nv-duration-base) var(--nv-ease-standard), box-shadow var(--nv-duration-base) var(--nv-ease-standard)",
};

// ─────────────────────────────────────────────────────────────────────────
// Priority 5.1 accessibility fixes (visual design unchanged):
//   - Each <label> now has htmlFor pointing at a matching input id, so
//     screen readers announce the correct label when an input receives
//     focus (previously the label and input were unassociated siblings).
//   - Invalid inputs get aria-invalid + aria-describedby pointing at their
//     error message, and error text has role="alert" so assistive tech
//     announces it immediately when validation fails.
//   - Decorative glyphs (✦ ◈ ◉ ◎ and the hero emoji) are aria-hidden so
//     they aren't read aloud as meaningless symbols.
// ─────────────────────────────────────────────────────────────────────────
function LandingPage({ onSubmit }) {
  const [form, setForm] = useState({ name:"", dob:"", tob:"", pob:"" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.dob) e.dob = "Date of birth is required";
    if (!form.tob) e.tob = "Time of birth is required";
    if (!form.pob.trim()) e.pob = "Place of birth is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit(form);
  };

  return (
    <div style={{ minHeight:"100vh", position:"relative", fontFamily:"Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"40px 20px" }}>
        <div style={{ textAlign:"center", marginBottom:48, animation:"fadeIn 0.8s ease both" }}>
          <div className="nv-hero-glow-wrap"><div aria-hidden="true" style={{ fontSize: 58, marginBottom: 16, animation: "glow 3s infinite", display: "inline-block" }}>🪐</div></div>
          <h1 className="nv-heading-glow" style={{ margin:"0 0 8px", fontSize:"clamp(34px,6vw,62px)", fontWeight:700,
            letterSpacing:3, background:GOLD_GRADIENT, WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent", fontFamily:"Cinzel,serif" }}>
            NakshatraVerse
          </h1>
          <p style={{ margin:0, fontSize:16, color:"var(--nv-text-secondary, rgba(200,160,255,0.7))", letterSpacing:3, fontStyle:"italic" }}>
            Ancient Wisdom · Cosmic Intelligence
          </p>
          <div aria-hidden="true" style={{ display:"flex", justifyContent:"center", gap:20, marginTop:18,
            fontSize:22, animation:"floatUp 3s ease-in-out infinite alternate" }}>
            {["☀️","🌙","⭐","🌟","✨"].map((e,i) => <span key={i}>{e}</span>)}
          </div>
        </div>

        <GlassCard style={{ width:"100%", maxWidth:500, padding:"40px 36px 36px",
          animation:"fadeIn 0.8s 0.2s ease both", opacity:0 }}>
          <h2 style={{ margin:"0 0 28px", textAlign:"center", fontSize:20, color:"#bf7fff",
            letterSpacing:1, fontFamily:"Cinzel,serif", fontWeight:600 }}>
            Reveal Your Cosmic Blueprint
          </h2>
          <form onSubmit={(ev) => { ev.preventDefault(); handleSubmit(); }} noValidate>
            {FIELDS.map(f => {
              const inputId = `birth-field-${f.key}`;
              const errorId = `${inputId}-error`;
              const hasError = Boolean(errors[f.key]);
              return (
                <div key={f.key} style={{ marginBottom:20 }}>
                  <label htmlFor={inputId} style={{ display:"block", fontSize:11, color:"var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom:7,
                    letterSpacing:1.5, textTransform:"uppercase", fontWeight:500 }}>
                    <span aria-hidden="true">{f.icon}</span> {f.label}
                  </label>
                  <input
                    id={inputId}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    aria-invalid={hasError || undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    onChange={ev => { setForm(p=>({...p,[f.key]:ev.target.value})); setErrors(p=>({...p,[f.key]:""})); }}
                    style={{ ...INPUT_STYLE, ...(hasError ? { borderColor:"rgba(255,100,100,0.5)" } : {}) }}
                  />
                  {hasError && <p id={errorId} role="alert" style={{ margin:"5px 0 0", fontSize:12, color:"var(--nv-danger, #ff8888)" }}>{errors[f.key]}</p>}
                </div>
              );
            })}
            <button type="submit" className="submit-btn" style={{
              width:"100%", marginTop:8, padding:"16px 0",
              background:"var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
              border:"1px solid rgba(180,120,255,0.45)", borderRadius:50,
              color:"var(--nv-text-on-accent, #fff)", fontSize:16, fontWeight:600, cursor:"pointer",
              letterSpacing:1, boxShadow:"0 4px 28px rgba(123,47,255,0.38)",
              transition:"all var(--nv-duration-base) var(--nv-ease-standard)", fontFamily:"Cinzel,serif",
            }}>✦ Generate My Kundli ✦</button>
          </form>
          <p style={{ textAlign:"center", margin:"18px 0 0", fontSize:12,
            color:"rgba(180,130,255,0.45)", letterSpacing:0.5 }}>
            Powered by Vedic Astrology & Gemini AI · Your data stays private
          </p>
        </GlassCard>

        <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center",
          marginTop:32, animation:"fadeIn 0.8s 0.4s both", opacity:0 }}>
          {["🔮 Birth Chart","💫 Planetary Houses","💕 Love & Marriage","💼 Career & Finance","🌿 Health","🧿 Doshas & Yogas","💊 Remedies","🤖 AI Life Summary"].map(t => (
            <span key={t} style={{ padding:"7px 14px", background:"rgba(123,47,255,0.12)",
              border:"1px solid rgba(180,120,255,0.18)", borderRadius:30,
              fontSize:12, color:"var(--nv-text-secondary, rgba(200,160,255,0.75))" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
