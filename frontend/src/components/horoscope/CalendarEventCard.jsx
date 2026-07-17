import { memo } from "react";
import Badge from "../common/Badge.jsx";

const TONE_COLORS = {
  dasha: "#bf7fff",
  caution: "#ff8f7e",
  auspicious: "#7effb2",
};

// ─────────────────────────────────────────────────────────────────────────
// CalendarEventCard (V3.0 Phase 5)
// One reusable row for the Astrology Calendar's lists (Dasha changes,
// Transit events, Auspicious/Caution days). Every field is a direct read
// of an already-built event object (see utils/horoscopeCalendarUtils.js)
// — no astrology logic here, only layout.
// ─────────────────────────────────────────────────────────────────────────
function CalendarEventCard({ title, date, detail, tone = "dasha", badge }) {
  const color = TONE_COLORS[tone] || "#bf7fff";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      padding: "14px 16px", borderRadius: 12,
      border: `1px solid ${color}33`, background: "var(--nv-surface-subtle, rgba(18,0,38,0.4))",
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: detail ? 4 : 0 }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <strong style={{ fontSize: 13.5, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}>{title}</strong>
        </div>
        {detail && <p style={{ margin: 0, fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.65))", lineHeight: 1.5 }}>{detail}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {badge && <Badge color={color}>{badge}</Badge>}
        <span style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif" }}>{date}</span>
      </div>
    </div>
  );
}

export default memo(CalendarEventCard);
