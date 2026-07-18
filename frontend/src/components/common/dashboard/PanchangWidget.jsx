import { memo, useEffect, useState } from "react";
import SummaryCard from "./SummaryCard.jsx";
import InsightRow from "../InsightRow.jsx";
import Badge from "../Badge.jsx";
import * as panchangApi from "../../../utils/panchangApi.js";

// ─────────────────────────────────────────────────────────────────────────
// PanchangWidget (V4.1 Phase 2 — Dashboard Integration)
// Small "Today's Panchang" dashboard widget: Tithi, Nakshatra, Best Time
// Today, plus a "View Full Panchang" action. Built on the existing
// SummaryCard (same component the Astrology Summary widget already uses)
// — no new dashboard card primitive was introduced. Fetches today's
// already-backend-computed Panchang itself so DashboardPage.jsx doesn't
// need to touch its own data-loading logic to show it.
// ─────────────────────────────────────────────────────────────────────────
function PanchangWidget({ onViewFull }) {
  const [panchang, setPanchang] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    panchangApi.getDailyPanchang(today).then(setPanchang).catch(() => setError(true));
  }, []);

  if (error) return null; // fail soft — Dashboard shouldn't break if Panchang is briefly unavailable

  return (
    <SummaryCard
      icon="🕉️"
      title="Today's Panchang"
      action={onViewFull && (
        <button
          onClick={onViewFull}
          style={{
            padding: "6px 12px", borderRadius: 16, fontSize: 11.5, cursor: "pointer",
            border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
            color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", flexShrink: 0,
          }}
        >
          View Full Panchang →
        </button>
      )}
    >
      {!panchang ? (
        <div style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <Badge color="#ffd700">{panchang.tithi.name}</Badge>
            <Badge color="#9dc9ff">{panchang.nakshatra.name}</Badge>
          </div>
          <InsightRow label="Best Time Today" value={panchang.bestTimeToday} color="#7effb2" />
        </>
      )}
    </SummaryCard>
  );
}

export default memo(PanchangWidget);
