// ─────────────────────────────────────────────────────────────────────────
// Life Coach Outlook Engine — V4.3 (AI Life Coach Enhancement Pass)
// Single responsibility: compute the backend-authoritative *numbers and
// dates* behind Weekly Outlook / Monthly Outlook — Weekly/Monthly Energy
// Score, Best Day, and Caution Day — by calling panchangEngine.js's
// existing computePanchang() once per day in the window and averaging/
// comparing its existing auspiciousnessScore. No new astrology or
// Panchang math happens here; this is purely a windowing/aggregation
// layer over the same per-day computation panchangEngine.js already
// performs for a single date (the exact "reuse the existing engine over
// a range" pattern predictionTimelineEngine.js already uses for Dasha).
//
// Gemini is NEVER handed this responsibility — see lifeCoachPromptBuilder
// .js, which only asks it to phrase a Theme/Opportunities/Challenges/
// Focus narrative *around* these already-computed numbers, never to
// invent or recompute them.
// ─────────────────────────────────────────────────────────────────────────
import { computePanchang } from "./panchangEngine.js";

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Reused by both Weekly and Monthly outlooks: walk `days` consecutive
// dates starting at `startDate`, computing each day's already-existing
// Panchang auspiciousness score, then reduce to an average score plus the
// single best/most-cautious day in the window.
function summarizeWindow(startDate, days, lat, lon) {
  const daily = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    try {
      const panchang = computePanchang(date, lat, lon);
      daily.push({ date, weekday: panchang.weekday, score: panchang.auspiciousnessScore });
    } catch {
      // Defensive: never let one bad date break the whole window — same
      // "skip and continue" posture as the rest of this codebase's
      // best-effort aggregations.
    }
  }
  if (!daily.length) return { energyScore: null, bestDay: null, cautionDay: null, daily: [] };

  const energyScore = Math.round(daily.reduce((sum, d) => sum + d.score, 0) / daily.length);
  const bestDay = daily.reduce((best, d) => (d.score > best.score ? d : best), daily[0]);
  const cautionDay = daily.reduce((worst, d) => (d.score < worst.score ? d : worst), daily[0]);

  return { energyScore, bestDay, cautionDay, daily };
}

export function computeWeeklyOutlookFacts({ date, lat, lon }) {
  const { energyScore, bestDay, cautionDay, daily } = summarizeWindow(date, 7, lat, lon);
  return { weeklyEnergyScore: energyScore, bestDay, cautionDay, dailyScores: daily };
}

export function computeMonthlyOutlookFacts({ date, lat, lon }) {
  const { energyScore, daily } = summarizeWindow(date, 30, lat, lon);
  return { monthlyEnergyScore: energyScore, dailyScores: daily };
}

export default { computeWeeklyOutlookFacts, computeMonthlyOutlookFacts };
