import { useEffect, useMemo, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import InsightRow from "../components/common/InsightRow.jsx";
import ScoreRing from "../components/common/ScoreRing.jsx";
import CompatibilityMeter from "../components/matching/CompatibilityMeter.jsx";
import ExpandableSection from "../components/report/ExpandableSection.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { GOLD_GRADIENT } from "../constants/astrology.js";
import * as familyProfilesApi from "../utils/familyProfilesApi.js";
import * as relationshipHubApi from "../utils/relationshipHubApi.js";
import { readPreferences, writePreferences } from "../utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// RelationshipHubPage (V4.2 — Family Profiles & Relationship Hub)
//
// Lets a signed-in user pick any two saved Family Profiles and compare
// them across six dimensions. Fully self-contained (own profile pickers,
// own loading/results state), reached from Dashboard, Family Profiles,
// CommandPalette, or ActionDock.
//
// ZERO astrology calculation happens in this file — every number/label
// shown here is a direct read of relationshipHubApi.compareProfiles()'s
// response, which is itself built entirely from the existing, unmodified
// computeChart()/computeMatching()/buildStructuredInsights() pipeline (see
// backend/controllers/relationshipHub.controller.js). The Kundli Matching
// tab reuses CompatibilityMeter exactly as MatchingPage.jsx already does.
// ─────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "kundli", label: "Kundli Matching", icon: "💞" },
  { id: "chart", label: "Birth Chart", icon: "🗺️" },
  { id: "strength", label: "Planet Strength", icon: "💪" },
  { id: "dosha", label: "Dosha", icon: "⚠️" },
  { id: "nakshatra", label: "Nakshatra", icon: "⭐" },
  { id: "prediction", label: "Predictions", icon: "🔮" },
];

function ProfilePicker({ label, profiles, value, onChange, exclude }) {
  return (
    <div style={{ flex: "1 1 220px", minWidth: 200 }}>
      <label style={{ display: "block", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500 }}>
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="select-input"
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(18,0,38,0.6)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
      >
        <option value="">Choose a profile…</option>
        {profiles.filter((p) => p.id !== exclude).map((p) => (
          <option key={p.id} value={p.id}>{p.name} ({p.relationshipLabel})</option>
        ))}
      </select>
    </div>
  );
}

function PredictionColumn({ title, predictions }) {
  return (
    <div style={{ flex: "1 1 260px", minWidth: 240 }}>
      <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>{title}</h4>
      <div style={{ display: "grid", gap: 8 }}>
        {(predictions || []).slice(0, 7).map((p, i) => (
          <div key={i} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,120,255,0.18)", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--nv-text-primary, #e8d5ff)" }}>{p.category}</span>
              {p.confidence?.label && <Badge color="#ffd700">{p.confidence.label}</Badge>}
            </div>
            <div style={{ fontSize: 12, color: "var(--nv-text-secondary, rgba(210,175,255,0.7))", marginTop: 4 }}>{p.prediction}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelationshipHubPage({ onBack, initialProfileIdA }) {
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  // Falls back to the last-active profile (persisted client-side, see
  // utils/settingsStorage.js) whenever this page is reached without an
  // explicit preset — e.g. via Dashboard/ActionDock/CommandPalette rather
  // than a specific Family Profile card's "Compare" button.
  const [profileIdA, setProfileIdA] = useState(() => {
    if (initialProfileIdA) return initialProfileIdA;
    try { return readPreferences().activeProfileId || ""; } catch { return ""; }
  });
  const [profileIdB, setProfileIdB] = useState("");
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("kundli");

  useEffect(() => {
    familyProfilesApi.listProfiles({ sort: "name" })
      .then((list) => {
        setProfiles(list);
        // A persisted activeProfileId can outlive the profile it points to
        // (deleted/archived since it was last opened) — drop it rather than
        // leave the picker holding a value with no matching option.
        setProfileIdA((current) => (current && !list.some((p) => p.id === current) ? "" : current));
      })
      .catch(() => setProfiles([]))
      .finally(() => setLoadingProfiles(false));
  }, []);

  const canCompare = profileIdA && profileIdB && profileIdA !== profileIdB;

  const handleCompare = async () => {
    if (!canCompare) return;
    setComparing(true);
    setCompareError(null);
    setResult(null);
    try {
      const data = await relationshipHubApi.compareProfiles(profileIdA, profileIdB);
      setResult(data);
      setTab("kundli");
      try { writePreferences({ activeProfileId: profileIdA }); } catch { /* storage unavailable — non-fatal */ }
    } catch (err) {
      setCompareError(err.message || "Could not compare these two profiles.");
    } finally {
      setComparing(false);
    }
  };

  const nameA = useMemo(() => profiles.find((p) => p.id === profileIdA)?.name, [profiles, profileIdA]);
  const nameB = useMemo(() => profiles.find((p) => p.id === profileIdB)?.name, [profiles, profileIdB]);

  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "84px 16px 70px" }}>

        <header style={{ marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 8, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontSize: 12.5, fontFamily: "Inter,sans-serif" }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: "clamp(22px,4vw,30px)", background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif", fontWeight: 700 }}>
            Relationship Hub
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--nv-text-muted, rgba(200,160,255,0.65))" }}>
            Compare any two saved profiles — Kundli Matching, charts, strengths, doshas, Nakshatra, and predictions.
          </p>
        </header>

        <GlassCard style={{ padding: "22px 24px", marginBottom: 24 }}>
          {loadingProfiles ? (
            <p style={{ fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>Loading your profiles…</p>
          ) : profiles.length < 2 ? (
            <EmptyState icon="👨‍👩‍👧‍👦" title="Add at least two profiles" message="You need two saved Family Profiles to use the Relationship Hub." compact />
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                <ProfilePicker label="Profile A" profiles={profiles} value={profileIdA} onChange={setProfileIdA} exclude={profileIdB} />
                <ProfilePicker label="Profile B" profiles={profiles} value={profileIdB} onChange={setProfileIdB} exclude={profileIdA} />
              </div>
              {compareError && <p role="alert" style={{ margin: "0 0 12px", fontSize: 13, color: "var(--nv-danger, #ff8888)" }}>{compareError}</p>}
              <button
                onClick={handleCompare}
                disabled={!canCompare || comparing}
                aria-busy={comparing}
                className="submit-btn tap-scale"
                style={{
                  padding: "12px 26px", borderRadius: 26, border: "1px solid rgba(180,120,255,0.45)",
                  background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
                  color: "#fff", fontWeight: 600, fontSize: 14, cursor: !canCompare || comparing ? "default" : "pointer",
                  fontFamily: "Cinzel,serif", opacity: !canCompare || comparing ? 0.6 : 1,
                }}
              >
                {comparing ? "Comparing…" : "✦ Compare"}
              </button>
            </>
          )}
        </GlassCard>

        {result && (
          <>
            <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className="pill-btn tap-scale"
                  style={{
                    padding: "9px 16px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    fontFamily: "Inter,sans-serif",
                    background: tab === t.id ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))" : "rgba(255,255,255,0.05)",
                    border: tab === t.id ? "1px solid rgba(191,127,255,0.6)" : "1px solid rgba(180,120,255,0.28)",
                    color: tab === t.id ? "#fff" : "var(--nv-text-secondary, rgba(210,175,255,0.76))",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {tab === "kundli" && (
              <GlassCard style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <CompatibilityMeter
                  totalScore={result.kundliMatching.totalScore}
                  maxScore={result.kundliMatching.maxScore}
                  percentage={result.kundliMatching.percentage}
                  label={result.kundliMatching.compatibility.label}
                  color={result.kundliMatching.compatibility.color}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", width: "100%" }}>
                  {Object.entries(result.kundliMatching.ashtakoota).map(([key, k]) => (
                    <ScoreRing key={key} value={k.score} max={k.max} label={k.name || key} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", width: "100%", justifyContent: "center" }}>
                  <InsightRow
                    label={`${nameA}'s Manglik Status`}
                    value={result.kundliMatching.manglik.personA?.isManglik ? `Manglik (${result.kundliMatching.manglik.personA?.severity || "—"})` : "Not Manglik"}
                  />
                  <InsightRow
                    label={`${nameB}'s Manglik Status`}
                    value={result.kundliMatching.manglik.personB?.isManglik ? `Manglik (${result.kundliMatching.manglik.personB?.severity || "—"})` : "Not Manglik"}
                  />
                </div>
              </GlassCard>
            )}

            {tab === "chart" && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[{ label: nameA, chart: result.birthChartComparison.chartA }, { label: nameB, chart: result.birthChartComparison.chartB }].map(({ label, chart }) => (
                  <GlassCard key={label} style={{ padding: "20px 22px", flex: "1 1 320px", minWidth: 280 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>{label}</h3>
                    <InsightRow label="Lagna" value={chart.lagna} />
                    <InsightRow label="Moon Sign" value={chart.moonSign} />
                    <InsightRow label="Sun Sign" value={chart.sunSign} />
                    <InsightRow label="Nakshatra" value={chart.nakshatra?.name} />
                    <InsightRow label="Yogas" value={(chart.yogas || []).length} />
                    <InsightRow label="Doshas" value={(chart.doshas || []).length} />
                  </GlassCard>
                ))}
              </div>
            )}

            {tab === "strength" && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[{ label: nameA, summary: result.planetStrengthComparison.personA }, { label: nameB, summary: result.planetStrengthComparison.personB }].map(({ label, summary }) => (
                  <GlassCard key={label} style={{ padding: "20px 22px", flex: "1 1 320px", minWidth: 280 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>{label}</h3>
                    <InsightRow label="Strongest Planet" value={summary?.strongest ? `${summary.strongest.planet} (${summary.strongest.dignity || "—"})` : "—"} color="#7effb2" />
                    <InsightRow label="Weakest Planet" value={summary?.weakest ? `${summary.weakest.planet} (${summary.weakest.dignity || "—"})` : "—"} color="#ff9d9d" />
                  </GlassCard>
                ))}
              </div>
            )}

            {tab === "dosha" && (
              <ExpandableSection icon="⚠️" title="Dosha Comparison" color="#ff9d9d">
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, color: "var(--nv-text-secondary, rgba(210,175,255,0.76))", fontFamily: "Inter,sans-serif", margin: 0 }}>
                  {JSON.stringify(result.doshaComparison, null, 2)}
                </pre>
              </ExpandableSection>
            )}

            {tab === "nakshatra" && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[{ label: nameA, profile: result.nakshatraComparison.profileA }, { label: nameB, profile: result.nakshatraComparison.profileB }].map(({ label, profile }) => (
                  <GlassCard key={label} style={{ padding: "20px 22px", flex: "1 1 320px", minWidth: 280 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#bf7fff", fontFamily: "Cinzel,serif" }}>{label}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      <Badge color="#ffd700">{profile?.nakshatra}{profile?.pada ? ` · Pada ${profile.pada}` : ""}</Badge>
                      {profile?.lord && <Badge color="#bf7fff">Lord: {profile.lord}</Badge>}
                    </div>
                    <InsightRow label="Nature" value={profile?.nature} />
                    <InsightRow label="Gana" value={profile?.gana} />
                    <InsightRow label="Nadi" value={profile?.nadi} />
                  </GlassCard>
                ))}
                <GlassCard style={{ padding: "20px 22px", flex: "1 1 100%" }}>
                  <InsightRow label="Same Nakshatra?" value={result.nakshatraComparison.sameNakshatra ? "Yes" : "No"} />
                </GlassCard>
              </div>
            )}

            {tab === "prediction" && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <PredictionColumn title={nameA} predictions={result.predictionComparison.personA} />
                <PredictionColumn title={nameB} predictions={result.predictionComparison.personB} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RelationshipHubPage;
