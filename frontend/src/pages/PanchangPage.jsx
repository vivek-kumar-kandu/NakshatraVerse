import { useCallback, useEffect, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import SkeletonList from "../components/common/Skeleton.jsx";
import PanchangDetailCard from "../components/panchang/PanchangDetailCard.jsx";
import TodaySummaryCard from "../components/panchang/TodaySummaryCard.jsx";
import MuhuratFinderForm from "../components/panchang/MuhuratFinderForm.jsx";
import MuhuratResultCard from "../components/panchang/MuhuratResultCard.jsx";
import PanchangExplanationCard from "../components/panchang/PanchangExplanationCard.jsx";
import * as panchangApi from "../utils/panchangApi.js";
import { useToast } from "../components/common/Toast.jsx";

// ─────────────────────────────────────────────────────────────────────────
// PanchangPage (V4.1 Phase 2 — Professional Daily Panchang & Muhurat
// Finder)
//
// Fully self-contained, like MatchingPage.jsx — needs no existing chart/
// report context to open, so it's reachable from anywhere (Dashboard,
// ActionDock, Calendar) with nothing more than a stage change (see
// App.jsx). All Panchang/Muhurat calculation happens on the backend
// (panchangEngine.js / muhuratEngine.js, called via utils/panchangApi.js);
// this page only fetches, holds UI state, and renders.
// ─────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "daily", label: "Daily Panchang", icon: "🕉️" },
  { id: "summary", label: "Today's Summary", icon: "✨" },
  { id: "muhurat", label: "Muhurat Finder", icon: "🔍" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function PanchangPage({ onBack }) {
  const toast = useToast();
  const [tab, setTab] = useState("summary");

  const [date, setDate] = useState(todayStr());
  const [panchang, setPanchang] = useState(null);
  const [loadingPanchang, setLoadingPanchang] = useState(true);
  const [panchangError, setPanchangError] = useState(null);
  const [dailyExplanation, setDailyExplanation] = useState(null);
  const [explainingDaily, setExplainingDaily] = useState(false);

  const [activities, setActivities] = useState([]);
  const [activity, setActivity] = useState("marriage");
  const [muhuratStartDate, setMuhuratStartDate] = useState(todayStr());
  const [rangeDays, setRangeDays] = useState(30);
  const [muhurat, setMuhurat] = useState(null);
  const [searching, setSearching] = useState(false);
  const [muhuratError, setMuhuratError] = useState(null);
  const [muhuratExplanation, setMuhuratExplanation] = useState(null);
  const [explainingMuhurat, setExplainingMuhurat] = useState(false);

  const loadPanchang = useCallback((d) => {
    setLoadingPanchang(true);
    setPanchangError(null);
    setDailyExplanation(null);
    panchangApi.getDailyPanchang(d)
      .then(setPanchang)
      .catch((err) => setPanchangError(err.message || "Could not load today's Panchang."))
      .finally(() => setLoadingPanchang(false));
  }, []);

  useEffect(() => { loadPanchang(date); }, [date, loadPanchang]);

  useEffect(() => {
    panchangApi.getMuhuratActivities()
      .then((list) => { setActivities(list); if (list.length) setActivity((prev) => (list.includes(prev) ? prev : list[0])); })
      .catch(() => setActivities(["marriage", "housewarming", "businessOpening", "travel", "education", "vehiclePurchase", "propertyPurchase", "namingCeremony"]));
  }, []);

  const handleExplainDaily = useCallback(() => {
    if (!panchang) return;
    setExplainingDaily(true);
    panchangApi.explainPanchang("daily", panchang)
      .then(setDailyExplanation)
      .catch((err) => toast?.error?.(err.message || "AI explanation unavailable right now."))
      .finally(() => setExplainingDaily(false));
  }, [panchang, toast]);

  const handleSearchMuhurat = useCallback(() => {
    setSearching(true);
    setMuhuratError(null);
    setMuhuratExplanation(null);
    panchangApi.findMuhurat({ activity, startDate: muhuratStartDate, rangeDays })
      .then(setMuhurat)
      .catch((err) => setMuhuratError(err.message || "Could not find a Muhurat for this activity."))
      .finally(() => setSearching(false));
  }, [activity, muhuratStartDate, rangeDays]);

  const handleExplainMuhurat = useCallback(() => {
    if (!muhurat) return;
    setExplainingMuhurat(true);
    panchangApi.explainPanchang("muhurat", muhurat)
      .then(setMuhuratExplanation)
      .catch((err) => toast?.error?.(err.message || "AI explanation unavailable right now."))
      .finally(() => setExplainingMuhurat(false));
  }, [muhurat, toast]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "84px 16px 100px", display: "grid", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            className="pill-btn tap-scale"
            style={{
              background: "rgba(20,0,40,0.55)", border: "1px solid rgba(180,120,255,0.35)",
              color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13,
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>🕉️ Daily Panchang & Muhurat</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              Backend-calculated Vedic timing — Tithi, Nakshatra, auspicious windows, and Muhurat selection.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <GlassCard style={{ padding: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="tab-btn tap-scale"
                style={{
                  flex: "1 1 120px", padding: "10px 14px", border: "none", borderRadius: 12, cursor: "pointer",
                  fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? "#ffd700" : "var(--nv-text-muted, rgba(200,160,255,0.65))",
                  background: active ? "rgba(255,215,0,0.12)" : "transparent",
                }}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </GlassCard>

        {/* Date picker (Daily Panchang / Today's Summary tabs only) */}
        {(tab === "daily" || tab === "summary") && (
          <GlassCard style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif" }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 10, border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.25))",
                background: "rgba(20,0,40,0.5)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", fontSize: 13,
              }}
            />
            {date !== todayStr() && (
              <button onClick={() => setDate(todayStr())} className="pill-btn tap-scale" style={{ padding: "8px 14px", borderRadius: 16, fontSize: 12, border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.15)", color: "var(--nv-text-primary, #e8d5ff)", cursor: "pointer" }}>
                Today
              </button>
            )}
          </GlassCard>
        )}

        {/* Daily Panchang tab */}
        {tab === "daily" && (
          loadingPanchang ? <SkeletonList count={4} /> :
          panchangError ? <GlassCard style={{ padding: 20, color: "#ff8f7e", fontSize: 13 }}>{panchangError}</GlassCard> :
          <PanchangDetailCard panchang={panchang} />
        )}

        {/* Today's Summary tab */}
        {tab === "summary" && (
          loadingPanchang ? <SkeletonList count={2} /> :
          panchangError ? <GlassCard style={{ padding: 20, color: "#ff8f7e", fontSize: 13 }}>{panchangError}</GlassCard> :
          <>
            <TodaySummaryCard panchang={panchang} onExplain={handleExplainDaily} explaining={explainingDaily} />
            <PanchangExplanationCard explanation={dailyExplanation} />
          </>
        )}

        {/* Muhurat Finder tab */}
        {tab === "muhurat" && (
          <>
            <MuhuratFinderForm
              activities={activities}
              activity={activity}
              setActivity={setActivity}
              startDate={muhuratStartDate}
              setStartDate={setMuhuratStartDate}
              rangeDays={rangeDays}
              setRangeDays={setRangeDays}
              onSearch={handleSearchMuhurat}
              searching={searching}
            />
            {muhuratError && <GlassCard style={{ padding: 20, color: "#ff8f7e", fontSize: 13 }}>{muhuratError}</GlassCard>}
            {searching && <SkeletonList count={3} />}
            {muhurat && !searching && (
              <>
                <MuhuratResultCard muhurat={muhurat} onExplain={handleExplainMuhurat} explaining={explainingMuhurat} />
                <PanchangExplanationCard explanation={muhuratExplanation} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PanchangPage;
