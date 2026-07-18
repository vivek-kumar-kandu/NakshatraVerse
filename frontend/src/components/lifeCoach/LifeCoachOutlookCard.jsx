import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import ScoreRing from "../common/ScoreRing.jsx";
import Badge from "../common/Badge.jsx";
import LifeCoachListCard from "./LifeCoachListCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachOutlookCard — V4.3 (AI Life Coach Enhancement Pass)
// A single reusable card for both Weekly Outlook and Monthly Outlook —
// they share the same shape (an Energy Score, a Theme, Opportunities/
// Challenges lists, and one or more short focus fields), so one
// parametrized component covers both instead of two near-duplicate ones.
//
// Purely presentational. `energyScore` is always the backend-computed
// average (lifeCoachOutlookEngine.js) — never Gemini's own number — and
// `bestDay`/`cautionDay` (Weekly Outlook only) are the actual backend-
// computed dates/weekdays. `theme`/opportunities/challenges/focusFields
// are Gemini's grounded narrative built around those backend facts.
// ─────────────────────────────────────────────────────────────────────────
function LifeCoachOutlookCard({
  icon, title, energyScoreLabel, energyScore,
  theme, opportunities, challenges,
  bestDay, cautionDay,
  focusFields, // [{ label, value }]
}) {
  const hasAnyContent = energyScore != null || theme || opportunities?.length || challenges?.length || focusFields?.some((f) => f.value);
  if (!hasAnyContent) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <GlassCard style={{ padding: "22px 24px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        {energyScore != null && <ScoreRing value={energyScore} max={100} label={energyScoreLabel} color="#ffd700" />}
        <div style={{ flex: 1, minWidth: 200, display: "grid", gap: 10 }}>
          {theme && (
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                {icon} {title}
              </p>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--nv-text-primary, #f1e4ff)", fontFamily: "Cinzel,serif" }}>
                {theme}
              </p>
            </div>
          )}
          {(bestDay || cautionDay) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {bestDay && <Badge color="#7effb2">Best Day: {bestDay.weekday} ({bestDay.date})</Badge>}
              {cautionDay && <Badge color="#ff8fa3">Caution Day: {cautionDay.weekday} ({cautionDay.date})</Badge>}
            </div>
          )}
        </div>
      </GlassCard>

      <LifeCoachListCard icon="🌟" title="Opportunities" color="#7effb2" items={opportunities} />
      <LifeCoachListCard icon="⚠️" title="Challenges" color="#ffb454" items={challenges} />

      {focusFields?.some((f) => f.value) && (
        <GlassCard style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
          {focusFields.filter((f) => f.value).map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: "0 0 3px", fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                {label}
              </p>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--nv-text-primary, #e8d5ff)" }}>
                {value}
              </p>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

export default memo(LifeCoachOutlookCard);
