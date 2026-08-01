import { useEffect, useState } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import SkeletonList from "../components/common/Skeleton.jsx";
import Timeline from "../components/common/Timeline.jsx";
import FestivalDetailCard from "../components/festival/FestivalDetailCard.jsx";
import FestivalIntelligencePanel from "../components/festival/FestivalIntelligencePanel.jsx";
import PersonalizedFestivalGuidance from "../components/festival/PersonalizedFestivalGuidance.jsx";
import FestivalPreparationChecklist from "../components/festival/FestivalPreparationChecklist.jsx";
import FestivalFamilySuggestions from "../components/festival/FestivalFamilySuggestions.jsx";
import * as festivalApi from "../utils/festivalApi.js";
import * as festivalIntelligenceApi from "../utils/festivalIntelligenceApi.js";

// ─────────────────────────────────────────────────────────────────────────
// FestivalIntelligencePage (V4.5 Phase 2 — Festival Intelligence)
//
// New, additive page — does not modify FestivalPage.jsx or
// FestivalDetailCard.jsx in any way; both are reused here exactly as
// Phase 1B left them (FestivalDetailCard is imported and rendered
// unchanged). This page is the new surface for everything Phase 2 adds:
// Festival Intelligence (spiritual meaning etc), Personalized Guidance,
// Festival Preparation, an enhanced ritual-flow Timeline (reusing the
// existing, unmodified Timeline component), and Family Integration.
//
// Reached from the Dashboard's (additively enhanced) Festival Widget or
// the Calendar's Festival strip — both explicitly allowed to gain
// additive Festival Intelligence entry points per this phase's spec —
// never by editing FestivalPage.jsx itself.
// ─────────────────────────────────────────────────────────────────────────
function FestivalIntelligencePage({
  onBack, festivalKey, date, year, chart, report, isAuthenticated, onOpenFamilyProfiles, onOpenReading,
}) {
<<<<<<< HEAD
=======
  const { t } = useTranslation(["festival"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timeline, setTimeline] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (festivalKey) {
      const resolvedYear = year || (date ? Number(date.slice(0, 4)) : new Date().getFullYear());
      festivalApi.getFestivalByKey(festivalKey, resolvedYear)
        .then((result) => {
          const occurrence = date
            ? (result.occurrences || []).find((o) => o.date === date) || result.occurrences?.[0]
            : result.occurrences?.[0];
          setFestival(occurrence || null);
        })
<<<<<<< HEAD
        .catch((err) => setError(err.message || "Could not load this festival."))
=======
        .catch((err) => setError(err.message || t("festival:intelligencePage.loadFailed")))
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        .finally(() => setLoading(false));
      return;
    }

    // No specific festival requested (e.g. opened from the Calendar's
    // general "Festival Intelligence" entry point) — fall back to
    // today's festival if one is happening, else the nearest upcoming
    // one, same resolution FestivalWidget already uses on the Dashboard.
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([festivalApi.getTodaysFestivals(), festivalApi.getUpcomingFestivals(today, 60)])
      .then(([todaysFestivals, upcoming]) => {
        const sorted = [...(upcoming || [])].sort((a, b) => a.date.localeCompare(b.date));
        setFestival(todaysFestivals?.[0] || sorted[0] || null);
      })
<<<<<<< HEAD
      .catch((err) => setError(err.message || "Could not load an upcoming festival."))
=======
      .catch((err) => setError(err.message || t("festival:intelligencePage.loadUpcomingFailed")))
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
      .finally(() => setLoading(false));
  }, [festivalKey, date, year]);

  useEffect(() => {
    if (!festival) return;
    festivalIntelligenceApi.getFestivalTimeline(festival)
      .then(setTimeline)
      .catch(() => setTimeline(null));
  }, [festival?.key, festival?.date]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "84px 16px 100px", display: "grid", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            className="pill-btn tap-scale"
            style={{
              background: "rgba(20,0,40,0.55)", border: "1px solid rgba(180,120,255,0.35)",
              color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13,
            }}
          >
<<<<<<< HEAD
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>🔮 Festival Intelligence</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              Deeper meaning, personalized guidance, preparation, and family suggestions for one festival.
=======
            {t("festival:intelligencePage.back")}
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>{t("festival:intelligencePage.title")}</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              {t("festival:intelligencePage.subtitle")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonList rows={3} />
        ) : error ? (
          <GlassCard style={{ padding: 20, color: "#ff8f7e", fontSize: 13 }}>{error}</GlassCard>
        ) : !festival ? (
<<<<<<< HEAD
          <EmptyState icon="🎉" title="No festival selected" message="Open a festival from the Festival Calendar, Dashboard, or Calendar page to see its full intelligence." />
=======
          <EmptyState icon="🎉" title={t("festival:intelligencePage.noFestivalTitle")} message={t("festival:intelligencePage.noFestivalMessage")} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        ) : (
          <>
            <FestivalDetailCard festival={festival} />

            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", textTransform: "uppercase", letterSpacing: 1 }}>
<<<<<<< HEAD
                Ritual Flow
              </h2>
              {timeline ? (
                <Timeline items={timeline} emptyLabel="Timeline unavailable for this festival." />
=======
                {t("festival:intelligencePage.ritualFlow")}
              </h2>
              {timeline ? (
                <Timeline items={timeline} emptyLabel={t("festival:intelligencePage.timelineUnavailable")} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              ) : (
                <SkeletonList rows={2} />
              )}
            </section>

            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", textTransform: "uppercase", letterSpacing: 1 }}>
<<<<<<< HEAD
                Festival Intelligence
=======
                {t("festival:intelligencePage.festivalIntelligence")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              </h2>
              <FestivalIntelligencePanel festival={festival} />
            </section>

            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", textTransform: "uppercase", letterSpacing: 1 }}>
<<<<<<< HEAD
                Personalized Guidance
=======
                {t("festival:intelligencePage.personalizedGuidance")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              </h2>
              <PersonalizedFestivalGuidance festival={festival} chart={chart} report={report} onOpenReading={onOpenReading} />
            </section>

            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", textTransform: "uppercase", letterSpacing: 1 }}>
<<<<<<< HEAD
                Festival Preparation
=======
                {t("festival:intelligencePage.festivalPreparation")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              </h2>
              <FestivalPreparationChecklist festival={festival} />
            </section>

            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", textTransform: "uppercase", letterSpacing: 1 }}>
<<<<<<< HEAD
                Family
=======
                {t("festival:intelligencePage.family")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              </h2>
              <FestivalFamilySuggestions festival={festival} isAuthenticated={isAuthenticated} onOpenFamilyProfiles={onOpenFamilyProfiles} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default FestivalIntelligencePage;
