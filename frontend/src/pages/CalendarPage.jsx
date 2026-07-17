import { useMemo, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import DashaCard from "../components/horoscope/DashaCard.jsx";
import TransitCard from "../components/horoscope/TransitCard.jsx";
import CalendarTimeline from "../components/horoscope/CalendarTimeline.jsx";
import CalendarEventCard from "../components/horoscope/CalendarEventCard.jsx";
import PanchangCalendarStrip from "../components/horoscope/PanchangCalendarStrip.jsx";
// V4.5 Phase 1B (Festival Frontend Integration): additive-only Festival
// markers/badges, same rationale as PanchangCalendarStrip above.
import FestivalCalendarStrip from "../components/horoscope/FestivalCalendarStrip.jsx";
import { splitTransitsByTone, buildCalendarEvents, upcomingDashaChanges } from "../utils/horoscopeCalendarUtils.js";
import { readPreferences } from "../utils/settingsStorage.js";

// V3.0 Final Enhancement (User Preferences & Personalization): "All
// Sections" is the exact page this file already rendered before this
// enhancement — every section, unchanged. "Timeline" is purely additive:
// it shows only the same "Major Astrology Events" section (still built by
// the same existing `buildCalendarEvents`/`CalendarTimeline`, no new
// calendar logic) for a more compact view. Mirrors HoroscopePage's own
// PERIODS switcher pattern exactly (same GlassCard + tab-btn styling).
const CALENDAR_VIEWS = [
  { id: "full", label: "All Sections", icon: "📋" },
  { id: "timeline", label: "Timeline", icon: "🕓" },
];

function initialCalendarView() {
  const value = readPreferences().calendarView;
  return CALENDAR_VIEWS.some((v) => v.id === value) ? value : "full";
}

// ─────────────────────────────────────────────────────────────────────────
// CalendarPage — V3.0 Phase 5 (Personalized Horoscope & Astrology
// Calendar)
//
// Dedicated Astrology Calendar page: current Mahadasha/Antardasha,
// upcoming Dasha changes, Transit events, and Auspicious/Caution days —
// all read directly from report.dasha and report.transits (both exposed
// additively this phase, see predictionApiMapper.js). No new astrology is
// calculated on this page; utils/horoscopeCalendarUtils.js only filters,
// groups, and labels data the backend already produced.
// ─────────────────────────────────────────────────────────────────────────
function CalendarPage({ userData, chart, report, onBack, onOpenAssistant, onOpenPanchang, onOpenFestivals, onOpenFestivalIntelligence }) {
  const [calendarView, setCalendarView] = useState(initialCalendarView);
  const dasha = report?.dasha;
  const transits = report?.transits;

  const upcomingChanges = useMemo(() => upcomingDashaChanges(dasha), [dasha]);
  const { auspicious, caution } = useMemo(() => splitTransitsByTone(transits), [transits]);
  const events = useMemo(() => buildCalendarEvents(dasha, transits), [dasha, transits]);

  const explain = (question) => onOpenAssistant?.(question);
  const explainDasha = () => explain("Explain my current Dasha (Mahadasha and Antardasha) and what's coming up next.");
  const explainTransit = (t) => explain(`Explain the ${t.planet} transit through ${t.transitSign} and how it affects me.`);

  if (!report) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
        <CosmicBg />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "84px 16px 60px" }}>
          <EmptyState
            icon="📅"
            title="No reading available yet"
            message="Generate or open a report first to see your Astrology Calendar."
            actionLabel="← Back"
            onAction={onBack}
          />
        </div>
      </div>
    );
  }

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
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>📅 Astrology Calendar</h1>
            {userData?.name && (
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>{userData.name}'s Dasha & Transit calendar</p>
            )}
          </div>
        </div>

        {/* View switcher — V3.0 Final Enhancement: Default Calendar View */}
        <GlassCard style={{ padding: 6, display: "flex", gap: 4 }}>
          {CALENDAR_VIEWS.map((v) => {
            const active = v.id === calendarView;
            return (
              <button
                key={v.id}
                onClick={() => setCalendarView(v.id)}
                className="tab-btn tap-scale"
                style={{
                  flex: 1, padding: "10px 14px", border: "none", borderRadius: 12, cursor: "pointer",
                  fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? "#ffd700" : "var(--nv-text-muted, rgba(200,160,255,0.65))",
                  background: active ? "rgba(255,215,0,0.12)" : "transparent",
                }}
              >
                {v.icon} {v.label}
              </button>
            );
          })}
        </GlassCard>

        {/* V4.1 Phase 2 — Daily Panchang & Muhurat Finder: additive-only
            visual indicators (Good/Neutral/Avoid days, Muhurat markers,
            Today's Panchang). Does not alter any section below. */}
        <PanchangCalendarStrip onOpenPanchang={onOpenPanchang} />

        {/* V4.5 Phase 1B (Festival Frontend Integration): additive-only
            visual indicators (Festival markers/badges, Today's Festival).
            Does not alter any section above or below it. */}
        <FestivalCalendarStrip onOpenFestivals={onOpenFestivals} />

        {/* V4.5 Phase 2 (Festival Intelligence): additive-only entry
            point — does not alter FestivalCalendarStrip or any section
            above/below it. Opens the new Festival Intelligence page,
            scoped to this Calendar's own chart/report so Personalized
            Guidance works immediately. */}
        {onOpenFestivalIntelligence && (
          <GlassCard style={{ padding: "14px 18px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
              🔮 See spiritual meaning, personalized guidance, and preparation for your next festival.
            </span>
            <button
              onClick={() => onOpenFestivalIntelligence({ chart, report })}
              className="tap-scale"
              style={{
                padding: "8px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
                color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", flexShrink: 0,
              }}
            >
              Festival Intelligence →
            </button>
          </GlassCard>
        )}


        {/* Current Dasha */}
        {calendarView === "full" && (
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
            Current Mahadasha & Antardasha
          </h2>
          {dasha?.available ? (
            <DashaCard dasha={dasha} onExplain={explainDasha} />
          ) : (
            <EmptyState icon="🪐" title="Dasha unavailable" message="Not enough data to compute a Dasha timeline for this chart." compact />
          )}
        </section>
        )}

        {/* Upcoming Dasha changes */}
        {calendarView === "full" && (
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
            Upcoming Dasha Changes
          </h2>
          {upcomingChanges.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {upcomingChanges.map((c) => (
                <CalendarEventCard
                  key={`${c.type}-${c.lord}-${c.startDate}`}
                  title={`${c.lord} ${c.type === "mahadasha" ? "Mahadasha" : "Antardasha"} begins`}
                  date={c.startDate}
                  tone="dasha"
                  badge={c.type === "mahadasha" ? "Mahadasha" : "Antardasha"}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon="🕓" title="No upcoming changes" message="No further Dasha changes were found in the current timeline window." compact />
          )}
        </section>
        )}

        {/* Important Transit Events */}
        {calendarView === "full" && (
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
            Important Transit Events
          </h2>
          {transits?.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {transits.map((t, i) => (
                <TransitCard key={t.planet} transit={t} idx={i} onExplain={explainTransit} />
              ))}
            </div>
          ) : (
            <EmptyState icon="🔭" title="No transit data" message="Transit information isn't available for this chart yet." compact />
          )}
        </section>
        )}

        {/* Auspicious / Caution days */}
        {calendarView === "full" && (
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
            Auspicious & Caution Days
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "#7effb2", fontWeight: 600 }}>✓ Auspicious</p>
              <div style={{ display: "grid", gap: 8 }}>
                {auspicious.length ? auspicious.map((t) => (
                  <CalendarEventCard key={t.planet} title={`${t.planet} in ${t.transitSign}`} date={t.asOf} detail={t.effect} tone="auspicious" />
                )) : <EmptyState icon="✓" message="No favorable transit windows detected right now." compact />}
              </div>
            </div>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "#ff8f7e", fontWeight: 600 }}>⚠ Caution</p>
              <div style={{ display: "grid", gap: 8 }}>
                {caution.length ? caution.map((t) => (
                  <CalendarEventCard key={t.planet} title={`${t.planet} in ${t.transitSign}`} date={t.asOf} detail={t.flags.map((f) => f.name).join(", ")} tone="caution" />
                )) : <EmptyState icon="✓" message="No caution flags raised on your current transits." compact />}
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Major Astrology Events — merged timeline */}
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
            Major Astrology Events
          </h2>
          <CalendarTimeline events={events} />
        </section>
      </div>
    </div>
  );
}

export default CalendarPage;
