import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import ScoreRing from "../common/ScoreRing.jsx";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachScoreCard — V4.3 (AI Life Coach)
// Daily Energy Score (via the existing ScoreRing component, same one the
// report already uses for other 0-100-ish scores), Today's Focus, and the
// Motivation Message. Purely presentational — every value is a direct
// read of the AI-Life-Coach guidance object the backend already computed.
// ─────────────────────────────────────────────────────────────────────────
function LifeCoachScoreCard({ dailyEnergyScore, todaysFocus, motivationMessage }) {
  return (
    <GlassCard style={{ padding: "22px 24px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <ScoreRing value={dailyEnergyScore} max={100} label="Daily Energy" color="#ffd700" />
      <div style={{ flex: 1, minWidth: 200, display: "grid", gap: 10 }}>
        {todaysFocus && (
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              Today's Focus
            </p>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--nv-text-primary, #f1e4ff)", fontFamily: "Cinzel,serif" }}>
              {todaysFocus}
            </p>
          </div>
        )}
        {motivationMessage && (
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#ffd700", fontStyle: "italic" }}>
            ✦ {motivationMessage}
          </p>
        )}
      </div>
    </GlassCard>
  );
}

export default memo(LifeCoachScoreCard);
