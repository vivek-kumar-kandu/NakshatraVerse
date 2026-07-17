import { memo } from "react";
import EmptyState from "../common/EmptyState.jsx";
import CalendarEventCard from "./CalendarEventCard.jsx";

const TONE_DOT = {
  dasha: "#bf7fff",
  caution: "#ff8f7e",
  auspicious: "#7effb2",
};

// ─────────────────────────────────────────────────────────────────────────
// CalendarTimeline (V3.0 Phase 5)
// Vertical timeline rendering of a merged event feed (see
// utils/horoscopeCalendarUtils.js#buildCalendarEvents) — upcoming Dasha
// changes and flagged Transit events, in date order. Purely presentational.
// ─────────────────────────────────────────────────────────────────────────
function CalendarTimeline({ events }) {
  if (!events?.length) {
    return (
      <EmptyState
        icon="📅"
        title="No upcoming events"
        message="No major Dasha changes or Transit events were found in the current calculation window."
        compact
      />
    );
  }

  return (
    <div>
      {events.map((e, i) => (
        <div key={e.id} style={{ display: "flex", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <span aria-hidden="true" style={{
              width: 12, height: 12, borderRadius: "50%", background: TONE_DOT[e.tone] || "#bf7fff",
              boxShadow: `0 0 0 4px ${(TONE_DOT[e.tone] || "#bf7fff")}22`, marginTop: 8,
            }} />
            {i !== events.length - 1 && (
              <span aria-hidden="true" style={{ flex: 1, width: 2, background: "rgba(180,120,255,0.18)", marginTop: 4 }} />
            )}
          </div>
          <div style={{ flex: 1, marginBottom: 14 }}>
            <CalendarEventCard title={e.title} date={e.date} detail={e.detail} tone={e.tone} badge={e.kind} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(CalendarTimeline);
