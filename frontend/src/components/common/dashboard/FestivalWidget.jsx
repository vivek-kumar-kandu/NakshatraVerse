import { memo, useEffect, useState } from "react";
import SummaryCard from "./SummaryCard.jsx";
import InsightRow from "../InsightRow.jsx";
import Badge from "../Badge.jsx";
import * as festivalApi from "../../../utils/festivalApi.js";
// V4.5 Phase 2 (Festival Intelligence) — additive import. Only used for
// the new Preparation Progress/Upcoming Ritual fields below; the existing
// Today's Festival fetch/rendering above this comment is untouched.
import * as festivalIntelligenceApi from "../../../utils/festivalIntelligenceApi.js";

// ─────────────────────────────────────────────────────────────────────────
// FestivalWidget (V4.5 Phase 1B — Dashboard Integration; enhanced V4.5
// Phase 2 — Festival Intelligence)
// Small "Today's Festival" dashboard widget: today's festival (if any),
// the next upcoming festival, days remaining, and importance — plus an
// "Open Festival Calendar" action. Built on the existing SummaryCard, the
// same "own GlassCard section, own data fetch" shape as PanchangWidget/
// FamilyProfilesWidget/NotificationsWidget already use.
//
// V4.5 Phase 2 additive enhancement: Preparation Progress (a deterministic
// item count from /api/festival-intelligence/preparation — no Gemini call
// required), Upcoming Ritual (from the deterministic Timeline stages),
// and a Personalized Tip (the festival's own already-computed first
// Recommended Activity/Ritual — never a new fact). `onOpenIntelligence`
// (optional) opens the new Festival Intelligence page for the relevant
// occurrence.
// ─────────────────────────────────────────────────────────────────────────
const IMPORTANCE_COLOR = { High: "#ffd700", Medium: "#bf7fff", Low: "#9dc9ff" };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(`${a}T00:00:00Z`) - new Date(`${b}T00:00:00Z`)) / 86400000);
}

function FestivalWidget({ onViewFull, onOpenIntelligence }) {
  const [today, setToday] = useState(null);
  const [next, setNext] = useState(null);
  const [error, setError] = useState(false);
  const [prepCount, setPrepCount] = useState(null);
  const [upcomingRitual, setUpcomingRitual] = useState(null);

  useEffect(() => {
    Promise.all([
      festivalApi.getTodaysFestivals(),
      festivalApi.getUpcomingFestivals(todayStr(), 60),
    ])
      .then(([todaysFestivals, upcoming]) => {
        setToday(todaysFestivals);
        const sorted = [...(upcoming || [])].sort((a, b) => a.date.localeCompare(b.date));
        setNext(sorted[0] || null);
      })
      .catch(() => setError(true));
  }, []);

  // V4.5 Phase 2 — Preparation Progress / Upcoming Ritual: once we know
  // the relevant festival (today's, else the next one), fetch its
  // deterministic preparation checklist and ritual-flow timeline. Both
  // calls are best-effort — a failure here never breaks the widget.
  const relevant = today?.[0] || next;
  useEffect(() => {
    if (!relevant) return;
    festivalIntelligenceApi.getFestivalPreparation(relevant)
      .then((prep) => {
        const total = [
          prep.preparationChecklist, prep.shoppingChecklist, prep.pujaMaterials,
          prep.fastingPreparation, prep.morningRoutine, prep.eveningRitual, prep.postFestivalReflection,
        ].reduce((sum, list) => sum + (list?.length || 0), 0);
        setPrepCount(total);
      })
      .catch(() => setPrepCount(null));

    festivalIntelligenceApi.getFestivalTimeline(relevant)
      .then((stages) => {
        const isToday = today?.length > 0;
        const stage = isToday ? stages.find((s) => s.id === "main-ritual") : stages.find((s) => s.id === "preparation");
        setUpcomingRitual(stage || null);
      })
      .catch(() => setUpcomingRitual(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevant?.key, relevant?.date]);

  if (error) return null; // fail soft — Dashboard shouldn't break if Festival data is briefly unavailable

  const loading = today === null && !error;
  const primaryToday = today?.[0];
  const personalizedTip = relevant?.recommendedActivities?.[0] || relevant?.rituals?.[0] || null;

  return (
    <SummaryCard
      icon="🎉"
      title="Today's Festival"
      action={onViewFull && (
        <button
          onClick={onViewFull}
          style={{
            padding: "6px 12px", borderRadius: 16, fontSize: 11.5, cursor: "pointer",
            border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
            color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", flexShrink: 0,
          }}
        >
          Open Festival Calendar →
        </button>
      )}
    >
      {loading ? (
        <div style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>Loading…</div>
      ) : (
        <>
          {primaryToday ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <Badge color={IMPORTANCE_COLOR[primaryToday.importance] || "#bf7fff"}>{primaryToday.name}</Badge>
              <Badge color="#7effb2">{primaryToday.type}</Badge>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", marginBottom: 12 }}>No festival today.</div>
          )}
          {next && (
            <>
              <InsightRow label="Next Festival" value={next.name} color="#ffd700" />
              <InsightRow label="Days Remaining" value={`${daysBetween(next.date, todayStr())} day${daysBetween(next.date, todayStr()) === 1 ? "" : "s"}`} color="#9dc9ff" />
              <InsightRow label="Importance" value={next.importance} color={IMPORTANCE_COLOR[next.importance] || "#bf7fff"} />
            </>
          )}
          {/* V4.5 Phase 2 (Festival Intelligence) — additive rows below */}
          {prepCount != null && <InsightRow label="Preparation Progress" value={`${prepCount} checklist items ready`} color="#7effb2" />}
          {upcomingRitual && <InsightRow label="Upcoming Ritual" value={upcomingRitual.title} color="#bf7fff" />}
          {personalizedTip && <InsightRow label="Personalized Tip" value={personalizedTip} color="#ffd700" />}

          {relevant && onOpenIntelligence && (
            <button
              onClick={() => onOpenIntelligence(relevant)}
              className="tap-scale"
              style={{
                marginTop: 12, width: "100%", padding: "9px 14px", borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.12)",
                color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
              }}
            >
              🔮 View Festival Intelligence
            </button>
          )}
        </>
      )}
    </SummaryCard>
  );
}

export default memo(FestivalWidget);

