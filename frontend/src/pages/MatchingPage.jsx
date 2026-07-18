import { useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import ScoreRing from "../components/common/ScoreRing.jsx";
import AiText from "../components/common/AiText.jsx";
import ExpandableSection from "../components/report/ExpandableSection.jsx";
import PersonInputCard from "../components/matching/PersonInputCard.jsx";
import CompatibilityMeter from "../components/matching/CompatibilityMeter.jsx";
import { GOLD_GRADIENT } from "../constants/astrology.js";
import { computeMatch, generateMatchingReport, exportMatchingPdf } from "../utils/matchingApi.js";

const EMPTY_PERSON = { name: "", gender: "", dob: "", tob: "", pob: "" };

function validatePersonClient(person) {
  const e = {};
  if (!person.name.trim()) e.name = "Name is required";
  if (!person.gender) e.gender = "Gender is required";
  if (!person.dob) e.dob = "Date of birth is required";
  if (!person.tob) e.tob = "Time of birth is required";
  if (!person.pob.trim()) e.pob = "Place of birth is required";
  return e;
}

function DoshaColumn({ title, doshas }) {
  return (
    <div style={{ flex: "1 1 240px", minWidth: 220 }}>
      <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>{title}</h4>
      {doshas.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontStyle: "italic" }}>None detected.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {doshas.map((d, i) => (
            <div key={i} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,120,255,0.18)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--nv-text-primary, #e8d5ff)" }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "var(--nv-text-secondary, rgba(210,175,255,0.7))", marginTop: 3 }}>{d.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchingPage({ onBack }) {
  const [stage, setStage] = useState("form"); // form | loading | results
  const [personA, setPersonA] = useState(EMPTY_PERSON);
  const [personB, setPersonB] = useState(EMPTY_PERSON);
  const [errorsA, setErrorsA] = useState({});
  const [errorsB, setErrorsB] = useState({});
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null); // { personA, personB, chartA, chartB, matching, explanation }
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleSubmit = async () => {
    const eA = validatePersonClient(personA);
    const eB = validatePersonClient(personB);
    setErrorsA(eA);
    setErrorsB(eB);
    if (Object.keys(eA).length || Object.keys(eB).length) return;

    setFormError("");
    setStage("loading");
    try {
      let data;
      let aiFailed = false;
      try {
        data = await generateMatchingReport(personA, personB);
      } catch (aiErr) {
        // AI explanation failed (e.g. no Gemini key configured) — fall back
        // to the backend-only calculation so the person still sees their
        // full, correct Ashtakoota result. Per the V4.0 brief, Gemini only
        // ever explains this data; it is never required to produce it.
        aiFailed = true;
        data = await computeMatch(personA, personB);
      }
      setAiUnavailable(aiFailed);
      setResult(data);
      setStage("results");
    } catch (err) {
      setFormError(err.message || "Something went wrong while calculating your Kundli Match.");
      setStage("form");
    }
  };

  const handleReset = () => {
    setPersonA(EMPTY_PERSON);
    setPersonB(EMPTY_PERSON);
    setErrorsA({});
    setErrorsB({});
    setResult(null);
    setStage("form");
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      await exportMatchingPdf({
        personA: result.personA, personB: result.personB,
        chartA: result.chartA, chartB: result.chartB,
        matching: result.matching, explanation: result.explanation || null,
      });
    } catch (err) {
      setFormError(err.message || "Could not generate the PDF right now.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (stage === "loading") {
    return (
      <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CosmicBg animated />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: 24 }}>
          <div aria-hidden="true" style={{ fontSize: 52, marginBottom: 18, animation: "pulse 2s infinite" }}>💞</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 22, background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
            Calculating Compatibility
          </h2>
          <p aria-live="polite" style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.8))" }}>
            Computing Ashtakoota, Manglik analysis, and dosha comparison…
          </p>
        </div>
      </div>
    );
  }

  if (stage === "results" && result) {
    const { personA: pA, personB: pB, matching, explanation } = result;
    const kootas = Object.values(matching.ashtakoota);

    return (
      <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif", paddingBottom: 60 }}>
        <CosmicBg animated />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="pill-btn tap-scale" onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(180,120,255,0.28)", color: "var(--nv-text-secondary, rgba(210,175,255,0.76))", borderRadius: 20, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>
              ← Back
            </button>
            <button type="button" className="pill-btn tap-scale" onClick={handleReset} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(180,120,255,0.28)", color: "var(--nv-text-secondary, rgba(210,175,255,0.76))", borderRadius: 20, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>
              ↺ New Matching
            </button>
          </div>

          <h1 style={{ margin: "0 0 4px", textAlign: "center", fontSize: "clamp(24px,4vw,32px)", background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
            Kundli Matching Report
          </h1>
          <p style={{ margin: "0 0 28px", textAlign: "center", fontSize: 15, color: "var(--nv-text-secondary, rgba(210,175,255,0.76))" }}>
            {pA.name} <span aria-hidden="true">✦</span> {pB.name}
          </p>

          {aiUnavailable && (
            <GlassCard style={{ padding: "14px 18px", marginBottom: 20, border: "1px solid rgba(255,180,80,0.35)" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#ffcf8a" }}>
                ⚠ AI-generated explanations aren't available right now, but every score below is fully calculated. You can still download the PDF or try again later for the AI summary.
              </p>
            </GlassCard>
          )}

          {/* Summary Dashboard: Compatibility Meter */}
          <GlassCard style={{ padding: "28px 24px", marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <CompatibilityMeter
              totalScore={matching.totalScore} maxScore={matching.maxScore}
              percentage={matching.percentage} label={matching.compatibility.label}
              color={matching.compatibility.color}
            />
          </GlassCard>

          {/* Koota score cards */}
          <GlassCard style={{ padding: "24px 20px", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 16, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>Ashtakoota (Guna Milan)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
              {kootas.map((k) => (
                <div key={k.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 100 }}>
                  <ScoreRing value={k.score} max={k.max} label={k.name} color={matching.compatibility.color} />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Manglik Analysis */}
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            <ExpandableSection icon="🔥" title="Manglik Analysis & Compatibility" color="#ff9d6a">
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                {[{ label: pA.name, m: matching.manglik.personA }, { label: pB.name, m: matching.manglik.personB }].map(({ label, m }) => (
                  <div key={label} style={{ flex: "1 1 220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--nv-text-primary, #e8d5ff)" }}>{label}</span>
                      <Badge color={m.isManglik ? "#ff8888" : "#8fe58f"}>{m.isManglik ? `Manglik (${m.severity})` : "Not Manglik"}</Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-secondary, rgba(210,175,255,0.76))" }}>{m.detail}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 10, background: matching.manglik.compatibility.compatible ? "rgba(60,180,80,0.1)" : "rgba(200,60,60,0.1)", border: `1px solid ${matching.manglik.compatibility.compatible ? "rgba(80,200,100,0.3)" : "rgba(220,80,80,0.3)"}` }}>
                <strong style={{ fontSize: 13, color: matching.manglik.compatibility.compatible ? "#8fe58f" : "#ff9d9d" }}>
                  {matching.manglik.compatibility.compatible ? "Manglik Compatible" : "Manglik Not Compatible"}
                </strong>
                <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--nv-text-secondary, rgba(210,175,255,0.76))" }}>{matching.manglik.compatibility.detail}</p>
              </div>
            </ExpandableSection>

            <ExpandableSection icon="🧿" title="Major Dosha Comparison" color="#bf7fff" defaultOpen={false}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <DoshaColumn title={pA.name} doshas={matching.doshaComparison.personA} />
                <DoshaColumn title={pB.name} doshas={matching.doshaComparison.personB} />
              </div>
            </ExpandableSection>

            <ExpandableSection icon="⚡" title="Strong & Weak Planet Comparison" color="#ffd700" defaultOpen={false}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[{ label: pA.name, s: matching.planetStrength.personA }, { label: pB.name, s: matching.planetStrength.personB }].map(({ label, s }) => (
                  <div key={label} style={{ flex: "1 1 220px" }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>{label}</h4>
                    <p style={{ margin: "0 0 4px", fontSize: 13 }}><strong style={{ color: "#8fe58f" }}>Strongest:</strong> {s.strongest?.planet} ({s.strongest?.total})</p>
                    <p style={{ margin: 0, fontSize: 13 }}><strong style={{ color: "#ff9d9d" }}>Weakest:</strong> {s.weakest?.planet} ({s.weakest?.total})</p>
                  </div>
                ))}
              </div>
            </ExpandableSection>

            <ExpandableSection icon="🌙" title="Moon Sign & Nakshatra Compatibility" color="#e8d5ff" defaultOpen={false}>
              <p style={{ margin: "0 0 6px", fontSize: 13 }}>
                <strong>Moon Sign:</strong> {matching.moonSignCompatibility.personA} & {matching.moonSignCompatibility.personB}
                {matching.moonSignCompatibility.sameSign ? " (same sign)" : ""}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--nv-text-secondary, rgba(210,175,255,0.76))" }}>{matching.moonSignCompatibility.bhakoot.detail}</p>
              <p style={{ margin: "0 0 6px", fontSize: 13 }}>
                <strong>Nakshatra:</strong> {matching.nakshatraCompatibility.personA?.name} & {matching.nakshatraCompatibility.personB?.name}
                {matching.nakshatraCompatibility.sameNakshatra ? " (same Nakshatra)" : ""}
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-secondary, rgba(210,175,255,0.76))" }}>
                Tara {matching.nakshatraCompatibility.tara.score}/{matching.nakshatraCompatibility.tara.max}, Gana {matching.nakshatraCompatibility.gana.score}/{matching.nakshatraCompatibility.gana.max}, Yoni {matching.nakshatraCompatibility.yoni.score}/{matching.nakshatraCompatibility.yoni.max}, Nadi {matching.nakshatraCompatibility.nadi.score}/{matching.nakshatraCompatibility.nadi.max}
              </p>
            </ExpandableSection>

            {explanation && (
              <ExpandableSection icon="🤖" title="AI Compatibility Insights" color="#ffd700">
                {[
                  ["Compatibility Summary", explanation.compatibilitySummary],
                  ["Strengths", explanation.strengths],
                  ["Weaknesses", explanation.weaknesses],
                  ["Marriage Advice", explanation.marriageAdvice],
                  ["Practical Guidance", explanation.practicalGuidance],
                ].map(([label, text]) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: "0 0 6px", fontSize: 13, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>{label}</h4>
                    <AiText text={text} />
                  </div>
                ))}
              </ExpandableSection>
            )}
          </div>

          {formError && <p role="alert" style={{ textAlign: "center", color: "var(--nv-danger, #ff8888)", fontSize: 13, marginBottom: 16 }}>{formError}</p>}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              className="submit-btn"
              disabled={pdfLoading}
              onClick={handleDownloadPdf}
              style={{
                padding: "14px 32px", background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
                border: "1px solid rgba(180,120,255,0.45)", borderRadius: 50, color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: pdfLoading ? "default" : "pointer", letterSpacing: 0.5, fontFamily: "Cinzel,serif",
                boxShadow: "0 4px 28px rgba(123,47,255,0.38)", opacity: pdfLoading ? 0.7 : 1,
              }}
            >
              {pdfLoading ? "Preparing PDF…" : "⬇ Download PDF Report"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form stage
  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif", paddingBottom: 60 }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
        {onBack && (
          <button type="button" className="pill-btn tap-scale" onClick={onBack} style={{ marginBottom: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(180,120,255,0.28)", color: "var(--nv-text-secondary, rgba(210,175,255,0.76))", borderRadius: 20, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>
            ← Back
          </button>
        )}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 12 }}>💞</div>
          <h1 style={{ margin: "0 0 8px", fontSize: "clamp(26px,5vw,38px)", fontWeight: 700, letterSpacing: 1,
            background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
            Kundli Matching
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>
            Professional Vedic Ashtakoota (Guna Milan) Compatibility Analysis
          </p>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
          <PersonInputCard title="Person A" accent="#bf7fff" person={personA} errors={errorsA}
            onChange={(key, val) => { setPersonA((p) => ({ ...p, [key]: val })); setErrorsA((e) => ({ ...e, [key]: "" })); }} />
          <PersonInputCard title="Person B" accent="#ffd700" person={personB} errors={errorsB}
            onChange={(key, val) => { setPersonB((p) => ({ ...p, [key]: val })); setErrorsB((e) => ({ ...e, [key]: "" })); }} />
        </div>

        {formError && <p role="alert" style={{ textAlign: "center", color: "var(--nv-danger, #ff8888)", fontSize: 13, marginBottom: 16 }}>{formError}</p>}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="submit-btn"
            onClick={handleSubmit}
            style={{
              padding: "16px 40px", background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
              border: "1px solid rgba(180,120,255,0.45)", borderRadius: 50, color: "#fff", fontSize: 16, fontWeight: 600,
              cursor: "pointer", letterSpacing: 1, boxShadow: "0 4px 28px rgba(123,47,255,0.38)", fontFamily: "Cinzel,serif",
            }}
          >
            ✦ Check Compatibility ✦
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchingPage;
