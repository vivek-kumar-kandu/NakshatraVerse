import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachAffirmationCard — V4.3 (AI Life Coach Enhancement Pass)
// Displays the Daily Affirmation and today's Spiritual Practice
// (activity + significance). Purely presentational: `affirmation` is
// Gemini's grounded text (see lifeCoachPromptBuilder.js's dailyAffirmation
// rules); `spiritualPractice.activity` is always the backend-selected
// value (luckyElementsEngine.js's selectSpiritualPractice) and
// `spiritualPractice.significance` is Gemini's explanation of it.
// ─────────────────────────────────────────────────────────────────────────
function LifeCoachAffirmationCard({ affirmation, spiritualPractice }) {
  if (!affirmation && !spiritualPractice?.activity) return null;
  return (
    <GlassCard style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
      {affirmation && (
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
            ✦ Daily Affirmation
          </p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, fontStyle: "italic", color: "#ffd700" }}>
            "{affirmation}"
          </p>
        </div>
      )}
      {spiritualPractice?.activity && (
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
            🕉️ Today's Spiritual Practice
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 14.5, fontFamily: "Cinzel,serif", color: "var(--nv-text-primary, #f1e4ff)" }}>
            {spiritualPractice.activity}
          </p>
          {spiritualPractice.significance && (
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--nv-text-primary, #e8d5ff)" }}>
              {spiritualPractice.significance}
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(LifeCoachAffirmationCard);
