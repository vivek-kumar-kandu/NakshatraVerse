import { memo, useEffect, useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import * as panchangApi from "../../utils/panchangApi.js";

const QUALITY_COLOR = { good: "#7effb2", neutral: "#ffd700", avoid: "#ff8f7e" };
const QUALITY_LABEL = { good: "Good Day", neutral: "Neutral Day", avoid: "Avoid Day" };

// ─────────────────────────────────────────────────────────────────────────
// PanchangCalendarStrip (V4.1 Phase 2 — Calendar Integration)
//
// Purely additive: a small month-grid of backend-computed day-quality dots
// (Good/Neutral/Avoid) plus a Muhurat marker on notably favorable days and
// "Today's Panchang" mini summary, with a link out to the full Panchang
// page. Does NOT touch or redesign any existing Calendar section — the
// Dasha/Transit/Auspicious-Transit sections above it are completely
// untouched; this is a new, self-contained section rendering visual
// indicators only, exactly as the spec requires.
// ─────────────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function PanchangCalendarStrip({ onOpenPanchang }) {
  const now = new Date();
  const [days, setDays] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      panchangApi.getMonthPanchang(now.getFullYear(), now.getMonth() + 1),
      panchangApi.getDailyPanchang(todayStr()),
    ])
      .then(([monthDays, todayPanchang]) => { setDays(monthDays); setToday(todayPanchang); })
      .catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return null; // fail soft — doesn't disturb the rest of the Calendar page

  const leadingBlanks = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
          🕉️ This Month's Panchang
        </h2>
        {onOpenPanchang && (
          <button
            onClick={onOpenPanchang}
            className="pill-btn tap-scale"
            style={{ padding: "6px 14px", borderRadius: 16, fontSize: 11.5, border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)", color: "var(--nv-text-primary, #e8d5ff)", cursor: "pointer" }}
          >
            View Full Panchang & Muhurat Finder →
          </button>
        )}
      </div>

      <GlassCard style={{ padding: "18px 20px" }}>
        {today && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))" }}>
            <span style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>Today ({today.weekday}):</span>
            <span style={{ fontSize: 12.5, color: "#ffd700", fontWeight: 600 }}>{today.tithi.name}</span>
            <span style={{ fontSize: 12.5, color: "#9dc9ff", fontWeight: 600 }}>{today.nakshatra.name}</span>
            <span style={{ fontSize: 12.5, color: "#7effb2", fontWeight: 600 }}>Best: {today.bestTimeToday}</span>
          </div>
        )}

        {!days ? (
          <div style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>Loading Panchang overview…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
              {days.map((d) => {
                const dayNum = Number(d.date.split("-")[2]);
                const isToday = d.date === todayStr();
                return (
                  <div
                    key={d.date}
                    title={`${d.date} — ${QUALITY_LABEL[d.quality]} · ${d.tithi} · ${d.nakshatra}${d.isAbhijitNotable ? " · Muhurat favorable" : ""}`}
                    style={{
                      aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: isToday ? "rgba(255,215,0,0.16)" : "rgba(20,0,40,0.35)",
                      border: isToday ? "1px solid rgba(255,215,0,0.5)" : "1px solid var(--nv-surface-border, rgba(180,120,255,0.12))",
                      fontSize: 10.5, color: "var(--nv-text-secondary, rgba(200,160,255,0.8))", fontFamily: "Inter,sans-serif", position: "relative",
                    }}
                  >
                    {dayNum}
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: QUALITY_COLOR[d.quality], marginTop: 2 }} />
                    {d.isAbhijitNotable && (
                      <span aria-hidden="true" style={{ position: "absolute", top: 2, right: 2, fontSize: 7 }}>✦</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {Object.entries(QUALITY_LABEL).map(([k, label]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: QUALITY_COLOR[k] }} />{label}
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
                <span aria-hidden="true">✦</span>Muhurat Favorable
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}

export default memo(PanchangCalendarStrip);
