import { memo, useEffect, useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import * as festivalApi from "../../utils/festivalApi.js";

const IMPORTANCE_COLOR = { High: "#ffd700", Medium: "#bf7fff", Low: "#9dc9ff" };

// ─────────────────────────────────────────────────────────────────────────
// FestivalCalendarStrip (V4.5 Phase 1B — Calendar Integration)
//
// Purely additive, same shape as PanchangCalendarStrip: a small month-grid
// of backend-computed festival markers, plus a "Today's Festival" mini
// summary and a link out to the full Festival Page. Does NOT touch or
// redesign any existing Calendar section — only adds festival markers/
// badges/tooltip/highlight, exactly as the spec requires.
// ─────────────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function FestivalCalendarStrip({ onOpenFestivals }) {
  const now = new Date();
  const [monthFestivals, setMonthFestivals] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      festivalApi.getFestivalsForMonth(now.getFullYear(), now.getMonth() + 1),
      festivalApi.getTodaysFestivals(),
    ])
      .then(([festivals, todaysFestivals]) => { setMonthFestivals(festivals); setToday(todaysFestivals); })
      .catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return null; // fail soft — doesn't disturb the rest of the Calendar page

  const leadingBlanks = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const byDate = {};
  (monthFestivals || []).forEach((f) => {
    if (!byDate[f.date]) byDate[f.date] = [];
    byDate[f.date].push(f);
  });

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
          🎉 This Month's Festivals
        </h2>
        {onOpenFestivals && (
          <button
            onClick={onOpenFestivals}
            className="pill-btn tap-scale"
            style={{ padding: "6px 14px", borderRadius: 16, fontSize: 11.5, border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)", color: "var(--nv-text-primary, #e8d5ff)", cursor: "pointer" }}
          >
            View Festival Calendar →
          </button>
        )}
      </div>

      <GlassCard style={{ padding: "18px 20px" }}>
        {today && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))" }}>
            <span style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>Today:</span>
            {today.length ? today.map((f) => <Badge key={f.key} color={IMPORTANCE_COLOR[f.importance] || "#bf7fff"}>{f.name}</Badge>) : (
              <span style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>No festival today</span>
            )}
          </div>
        )}

        {!monthFestivals ? (
          <div style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>Loading festival overview…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayFestivals = byDate[dateStr] || [];
                const isToday = dateStr === todayStr();
                const highlightColor = dayFestivals.length
                  ? (IMPORTANCE_COLOR[dayFestivals[0].importance] || "#bf7fff")
                  : null;
                return (
                  <div
                    key={dateStr}
                    title={dayFestivals.length ? `${dateStr} — ${dayFestivals.map((f) => f.name).join(", ")}` : dateStr}
                    style={{
                      aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: isToday ? "rgba(255,215,0,0.16)" : dayFestivals.length ? "rgba(123,47,255,0.1)" : "rgba(20,0,40,0.35)",
                      border: isToday ? "1px solid rgba(255,215,0,0.5)" : "1px solid var(--nv-surface-border, rgba(180,120,255,0.12))",
                      fontSize: 10.5, color: "var(--nv-text-secondary, rgba(200,160,255,0.8))", fontFamily: "Inter,sans-serif", position: "relative",
                    }}
                  >
                    {dayNum}
                    {dayFestivals.length > 0 && (
                      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: highlightColor, marginTop: 2 }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {Object.entries(IMPORTANCE_COLOR).map(([k, color]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />{k} Importance
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}

export default memo(FestivalCalendarStrip);
