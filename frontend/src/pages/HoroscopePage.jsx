import { useMemo, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import DailyInsightCard from "../components/horoscope/DailyInsightCard.jsx";
import HoroscopeCard from "../components/horoscope/HoroscopeCard.jsx";
import TimelineCard from "../components/report/TimelineCard.jsx";
import { currentMonthPredictions } from "../utils/horoscopeCalendarUtils.js";
import { readPreferences } from "../utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// HoroscopePage — V3.0 Phase 5 (Personalized Horoscope & Astrology
// Calendar)
//
// Dedicated Horoscope Dashboard: Daily / Weekly / Monthly horoscope
// cards, plus per-category cards (Career, Finance, Love & Marriage,
// Health, Education, Family, Spiritual Growth, General Guidance). Every
// word displayed is read straight from `report` — report.dasha and
// report.transits (both exposed additively this phase, see
// predictionApiMapper.js), report.predictions (the 7 category objects,
// unchanged since V2.0 Phase 7), report.predictionTimeline.oneYear
// (unchanged since V2.0 Phase 7), and report.lifeSummary (the existing
// Gemini narrative field used only as "General Guidance", never
// recalculated). No prediction text is generated on this page — Gemini
// is only ever invoked when the person taps "Explain this", scoped
// through the existing, unmodified AI Assistant.
//
// Reuses the existing Design System exclusively (CosmicBg, GlassCard,
// EmptyState, Badge, the app's pill-btn/tap-scale/fadeIn vocabulary) —
// no new visual language is introduced.
// ─────────────────────────────────────────────────────────────────────────

const PERIODS = [
  { id: "daily", label: "Daily", icon: "🌅" },
  { id: "weekly", label: "Weekly", icon: "🌓" },
  { id: "monthly", label: "Monthly", icon: "🌕" },
];

// V3.0 Final Enhancement (User Preferences & Personalization): initial
// period now comes from the "Default Horoscope View" preference instead
// of always "daily" — read once, same pattern as ResultsPage's initial
// report tab. Falls back to "daily" if the stored value isn't valid.
function initialPeriod() {
  const value = readPreferences().horoscopeView;
  return PERIODS.some((p) => p.id === value) ? value : "daily";
}

function HoroscopePage({ userData, chart, report, onBack, onOpenAssistant }) {
  const [period, setPeriod] = useState(initialPeriod);

  const dasha = report?.dasha;
  const transits = report?.transits;
  const predictions = report?.predictions || [];
  const monthlyEntries = useMemo(() => currentMonthPredictions(report?.predictionTimeline), [report?.predictionTimeline]);

  const explain = (question) => onOpenAssistant?.(question);

  const explainPrediction = (prediction) =>
    explain(`Explain my ${prediction.category} horoscope for the current ${prediction.activeMahadasha || ""} Mahadasha / ${prediction.activeAntardasha || ""} Antardasha period.`);

  const explainToday = () =>
    explain("Explain today's horoscope — my current Antardasha and today's planetary transits.");

  if (!report) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
        <CosmicBg />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "84px 16px 60px" }}>
          <EmptyState
            icon="🔮"
            title="No reading available yet"
            message="Generate or open a report first to see your personalized Horoscope Dashboard."
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
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "84px 16px 100px", display: "grid", gap: 20 }}>
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
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>🔮 Horoscope Dashboard</h1>
            {userData?.name && (
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>{userData.name}'s personalized horoscope</p>
            )}
          </div>
        </div>

        {/* Period switcher */}
        <GlassCard style={{ padding: 6, display: "flex", gap: 4 }}>
          {PERIODS.map((p) => {
            const active = p.id === period;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className="tab-btn tap-scale"
                style={{
                  flex: 1, padding: "10px 14px", border: "none", borderRadius: 12, cursor: "pointer",
                  fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? "#ffd700" : "var(--nv-text-muted, rgba(200,160,255,0.65))",
                  background: active ? "rgba(255,215,0,0.12)" : "transparent",
                }}
              >
                {p.icon} {p.label}
              </button>
            );
          })}
        </GlassCard>

        {/* Daily */}
        {period === "daily" && (
          <DailyInsightCard dasha={dasha} transits={transits} onExplain={explainToday} />
        )}

        {/* Weekly — current-period category focus (same active-Dasha
            predictions the Predictions tab already shows, framed as
            "this week's focus") */}
        {period === "weekly" && (
          predictions.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
                Based on your current Mahadasha/Antardasha period — the same active-period predictions your report has already calculated.
              </p>
              {predictions.map((p, i) => (
                <HoroscopeCard key={p.category + i} prediction={p} idx={i} onExplain={explainPrediction} />
              ))}
            </div>
          ) : (
            <EmptyState icon="🌓" title="No weekly focus available" message="Predictions will appear here once your chart's Dasha period is calculated." compact />
          )
        )}

        {/* Monthly — predictionTimeline.oneYear entries overlapping the
            current calendar month */}
        {period === "monthly" && (
          monthlyEntries.length ? (
            <div>
              {monthlyEntries.map((entry, i) => (
                <TimelineCard key={i} entry={entry} isLast={i === monthlyEntries.length - 1} />
              ))}
            </div>
          ) : (
            <EmptyState icon="🌕" title="No monthly segments this month" message="Your 1-year Dasha timeline doesn't have a segment change falling within the current calendar month." compact />
          )
        )}
      </div>
    </div>
  );
}

export default HoroscopePage;
