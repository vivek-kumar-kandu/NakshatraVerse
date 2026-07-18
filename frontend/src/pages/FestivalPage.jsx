import { useCallback, useEffect, useMemo, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import SkeletonList from "../components/common/Skeleton.jsx";
import Timeline from "../components/common/Timeline.jsx";
import FestivalCard from "../components/festival/FestivalCard.jsx";
import FestivalDetailCard from "../components/festival/FestivalDetailCard.jsx";
import * as festivalApi from "../utils/festivalApi.js";
import { fuzzyFilter } from "../utils/fuzzySearch.js";
import { useToast } from "../components/common/Toast.jsx";

// ─────────────────────────────────────────────────────────────────────────
// FestivalPage (V4.5 Phase 1B — Festival Frontend Integration)
//
// Fully self-contained, same pattern as PanchangPage/MatchingPage — needs
// no existing chart/report context to open, reachable from anywhere
// (Dashboard, Calendar, ActionDock, CommandPalette, Notification Center)
// with nothing more than a stage change (see App.jsx). All festival data
// comes from the Festival Backend (festivalEngine.js, called via
// utils/festivalApi.js); this page only fetches, holds UI state, and
// renders. No festival calculation, recommendation, or Gemini extension
// happens here — /explain only asks Gemini to describe an occurrence the
// backend already computed.
//
// `initialFestivalKey`/`initialDate` (both optional) let a caller — most
// notably a clicked Festival notification — deep-link straight into a
// specific festival's detail view instead of landing on the list.
// ─────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "today", label: "Today", icon: "📍" },
  { id: "upcoming", label: "Upcoming", icon: "🔜" },
  { id: "browse", label: "Browse All", icon: "📚" },
];

const TYPE_FILTERS = ["All", "Festival", "Vrat"];
const IMPORTANCE_ORDER = { High: 0, Medium: 1, Low: 2 };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function FestivalPage({ onBack, initialFestivalKey, initialDate }) {
  const toast = useToast();
  const [tab, setTab] = useState(initialFestivalKey ? "detail" : "today");

  const [today, setToday] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [todayError, setTodayError] = useState(null);

  const [upcoming, setUpcoming] = useState(null);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [upcomingError, setUpcomingError] = useState(null);

  const now = new Date();
  const [browseYear, setBrowseYear] = useState(now.getFullYear());
  const [yearFestivals, setYearFestivals] = useState(null);
  const [loadingYear, setLoadingYear] = useState(true);
  const [yearError, setYearError] = useState(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [selected, setSelected] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);

  const loadToday = useCallback(() => {
    setLoadingToday(true);
    setTodayError(null);
    festivalApi.getTodaysFestivals()
      .then(setToday)
      .catch((err) => setTodayError(err.message || "Could not load today's festival."))
      .finally(() => setLoadingToday(false));
  }, []);

  const loadUpcoming = useCallback(() => {
    setLoadingUpcoming(true);
    setUpcomingError(null);
    festivalApi.getUpcomingFestivals(todayStr(), 60)
      .then(setUpcoming)
      .catch((err) => setUpcomingError(err.message || "Could not load upcoming festivals."))
      .finally(() => setLoadingUpcoming(false));
  }, []);

  const loadYear = useCallback((year) => {
    setLoadingYear(true);
    setYearError(null);
    festivalApi.getFestivalsForYear(year)
      .then(setYearFestivals)
      .catch((err) => setYearError(err.message || "Could not load the festival calendar."))
      .finally(() => setLoadingYear(false));
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => { loadUpcoming(); }, [loadUpcoming]);
  useEffect(() => { loadYear(browseYear); }, [browseYear, loadYear]);

  // Deep-link support (e.g. a clicked Festival notification): fetch the
  // requested festival's occurrence for the requested year and open it
  // straight in the detail view.
  useEffect(() => {
    if (!initialFestivalKey) return;
    const year = initialDate ? Number(initialDate.slice(0, 4)) : now.getFullYear();
    festivalApi.getFestivalByKey(initialFestivalKey, year)
      .then((result) => {
        const occurrence = initialDate
          ? (result.occurrences || []).find((o) => o.date === initialDate) || result.occurrences?.[0]
          : result.occurrences?.[0];
        if (occurrence) { setSelected(occurrence); setTab("detail"); }
      })
      .catch(() => toast?.error?.("Could not open that festival."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFestivalKey, initialDate]);

  const openDetail = useCallback((festival) => {
    setSelected(festival);
    setExplanation(null);
    setTab("detail");
  }, []);

  const handleExplain = useCallback(() => {
    if (!selected) return;
    setExplaining(true);
    festivalApi.explainFestival(selected)
      .then(setExplanation)
      .catch((err) => toast?.error?.(err.message || "AI explanation unavailable right now."))
      .finally(() => setExplaining(false));
  }, [selected, toast]);

  const filteredYearFestivals = useMemo(() => {
    if (!yearFestivals) return [];
    let list = [...yearFestivals].sort((a, b) => a.date.localeCompare(b.date));
    if (typeFilter !== "All") list = list.filter((f) => f.type === typeFilter);
    if (query.trim()) list = fuzzyFilter(query, list, (f) => `${f.name} ${f.type} ${f.description || ""}`);
    return list;
  }, [yearFestivals, typeFilter, query]);

  const sortedUpcoming = useMemo(() => {
    if (!upcoming) return [];
    return [...upcoming].sort((a, b) => a.date.localeCompare(b.date) || (IMPORTANCE_ORDER[a.importance] ?? 9) - (IMPORTANCE_ORDER[b.importance] ?? 9));
  }, [upcoming]);

  const nextFestival = sortedUpcoming[0] || null;
  const daysRemaining = nextFestival ? Math.round((new Date(`${nextFestival.date}T00:00:00Z`) - new Date(`${todayStr()}T00:00:00Z`)) / 86400000) : null;

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "84px 16px 100px", display: "grid", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={tab === "detail" ? () => setTab("today") : onBack}
            className="pill-btn tap-scale"
            style={{
              background: "rgba(20,0,40,0.55)", border: "1px solid rgba(180,120,255,0.35)",
              color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13,
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>🎉 Festival Calendar</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              Backend-computed Hindu festivals & Vrats — dates, rituals, and significance.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        {tab !== "detail" && (
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
        )}

        {/* Today tab */}
        {tab === "today" && (
          loadingToday ? <SkeletonList rows={2} /> :
          todayError ? <GlassCard style={{ padding: 20, color: "#ff8f7e", fontSize: 13 }}>{todayError}</GlassCard> :
          <>
            {today?.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", textTransform: "uppercase", letterSpacing: 1 }}>
                  Today's Festival{today.length > 1 ? "s" : ""}
                </h2>
                {today.map((f) => <FestivalCard key={f.key} festival={f} onOpen={openDetail} />)}
              </div>
            ) : (
              <EmptyState icon="📍" title="No festival today" message="There's no observed festival or Vrat on today's date." />
            )}

            {nextFestival && (
              <GlassCard style={{ padding: "18px 20px", marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", textTransform: "uppercase", letterSpacing: 1 }}>Next Up</p>
                    <p style={{ margin: "4px 0 0", fontSize: 14.5, fontWeight: 700, color: "var(--nv-text-primary, #e8d5ff)" }}>{nextFestival.name}</p>
                  </div>
                  <Badge color="#ffd700">{daysRemaining === 0 ? "Today" : `In ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}</Badge>
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* Upcoming tab */}
        {tab === "upcoming" && (
          loadingUpcoming ? <SkeletonList rows={4} /> :
          upcomingError ? <GlassCard style={{ padding: 20, color: "#ff8f7e", fontSize: 13 }}>{upcomingError}</GlassCard> :
          sortedUpcoming.length ? (
            <Timeline
              items={sortedUpcoming.map((f) => ({
                id: `${f.key}-${f.date}`, date: f.date, title: f.name,
                subtitle: f.description, color: f.importance === "High" ? "#ffd700" : "#bf7fff",
                badge: <div style={{ marginTop: 8 }}><Badge color="#7effb2">{f.type}</Badge></div>,
              }))}
              onItemClick={(item) => openDetail(sortedUpcoming.find((f) => `${f.key}-${f.date}` === item.id))}
            />
          ) : (
            <EmptyState icon="🔜" title="No upcoming festivals found" message="Nothing found in the next 60 days." />
          )
        )}

        {/* Browse All tab */}
        {tab === "browse" && (
          <>
            <GlassCard style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search festivals…"
                  aria-label="Search festivals"
                  style={{
                    width: "100%", padding: "9px 14px", borderRadius: 20, fontSize: 13,
                    border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
                    color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
                  }}
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by type"
                className="select-input"
                style={{
                  padding: "9px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
                  border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
                  color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
                }}
              >
                {TYPE_FILTERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={browseYear}
                onChange={(e) => setBrowseYear(Number(e.target.value))}
                aria-label="Select year"
                className="select-input"
                style={{
                  padding: "9px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
                  border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
                  color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
                }}
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </GlassCard>

            {loadingYear ? <SkeletonList rows={5} /> :
            yearError ? <GlassCard style={{ padding: 20, color: "#ff8f7e", fontSize: 13 }}>{yearError}</GlassCard> :
            filteredYearFestivals.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {filteredYearFestivals.map((f) => <FestivalCard key={`${f.key}-${f.date}`} festival={f} onOpen={openDetail} compact />)}
              </div>
            ) : (
              <EmptyState icon="🔍" title="No festivals match" message="Try a different search term or type filter." />
            )}
          </>
        )}

        {/* Detail tab */}
        {tab === "detail" && (
          selected ? (
            <FestivalDetailCard festival={selected} onExplain={handleExplain} explaining={explaining} explanation={explanation} />
          ) : (
            <SkeletonList rows={3} />
          )
        )}
      </div>
    </div>
  );
}

export default FestivalPage;
