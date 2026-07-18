import { memo, useEffect, useState } from "react";
import SummaryCard from "./SummaryCard.jsx";
import Badge from "../Badge.jsx";
import * as lifeCoachApi from "../../../utils/lifeCoachApi.js";

// ─────────────────────────────────────────────────────────────────────────
// AILifeCoachWidget (V4.3 — Dashboard Integration)
// Small "AI Life Coach" dashboard widget: Daily Energy Score, Today's
// Focus, one AI Recommendation, plus an "Open AI Life Coach" action. Built
// on the existing SummaryCard (same component PanchangWidget/Astrology
// Summary already use) — no new dashboard card primitive introduced.
//
// Unlike PanchangWidget (which is fully self-contained), the AI Life Coach
// needs a chart to be grounded in, so this widget is scoped to whatever
// `reportData` (userData/chart/report) DashboardPage already fetched for
// its own Astrology Summary card — no second/duplicate report fetch.
// ─────────────────────────────────────────────────────────────────────────
function AILifeCoachWidget({ reportData, onOpenFull }) {
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!reportData?.chart) return;
    lifeCoachApi.getDailyGuidance({ chart: reportData.chart, report: reportData.report })
      .then((res) => setGuidance(res.guidance))
      .catch(() => setError(true));
  }, [reportData]);

  if (!reportData?.chart) return null; // no reading yet — nothing to ground guidance in
  if (error) return null; // fail soft — Dashboard shouldn't break if the AI Life Coach is briefly unavailable

  return (
    <SummaryCard
      icon="🧭"
      title="AI Life Coach"
      action={onOpenFull && (
        <button
          onClick={onOpenFull}
          style={{
            padding: "6px 12px", borderRadius: 16, fontSize: 11.5, cursor: "pointer",
            border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
            color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", flexShrink: 0,
          }}
        >
          Open AI Life Coach →
        </button>
      )}
    >
      {!guidance ? (
        <div style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
            <Badge color="#ffd700">Energy: {guidance.dailyEnergyScore}/100</Badge>
          </div>
          {guidance.todaysFocus && (
            <p style={{ margin: "0 0 8px", fontSize: 12.5, lineHeight: 1.5, color: "var(--nv-text-primary, #e8d5ff)" }}>
              <strong style={{ color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontWeight: 600 }}>Today's Focus: </strong>
              {guidance.todaysFocus}
            </p>
          )}
          {guidance.recommendedActions?.[0] && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "#7effb2" }}>
              ✦ {guidance.recommendedActions[0]}
            </p>
          )}
        </>
      )}
    </SummaryCard>
  );
}

export default memo(AILifeCoachWidget);
