// ─────────────────────────────────────────────────────────────────────────
// Muhurat Finder Engine (V4.1 Phase 2 — Daily Panchang & Muhurat Finder)
// Single responsibility: given an activity type and a search window,
// score each candidate day using computeDayQualityInternal +
// computePanchang from panchangEngine.js (never recalculates Tithi/
// Nakshatra/Yoga/Karana itself) against the activity's classical
// favorable/avoid rules (rules/panchangData.json), and return the best
// date, its best time window, an auspicious period, a caution period, and
// a confidence level.
// ─────────────────────────────────────────────────────────────────────────
import panchangData from "../../rules/panchangData.json" with { type: "json" };
import { computePanchang, computeDayQualityInternal } from "./panchangEngine.js";

const { muhuratActivities } = panchangData;

export const MUHURAT_ACTIVITIES = Object.keys(muhuratActivities);

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// Score a single day, 0-100, for a specific activity's rules. Reuses the
// exact same Tithi/Nakshatra/Yoga/Karana quality signals as the general
// Auspiciousness Score, plus activity-specific favorable-Nakshatra /
// avoid-Tithi / avoid-weekday bonuses and penalties.
function scoreDayForActivity(dateStr, activityRules) {
  const q = computeDayQualityInternal(dateStr);
  let score = q.tithi.quality * 12.5 + q.nakshatra.quality * 12.5;
  score += q.yoga.isInauspicious ? 5 : 25;
  score += q.karana.isInauspicious ? 5 : 25;

  if (activityRules.favorableNakshatras.includes(q.nakshatra.name)) score += 20;
  if (activityRules.avoidTithiNumbers.includes(q.tithi.numberInPaksha) || q.tithi.index === 29) score -= 30;
  if (activityRules.avoidWeekdays.includes(q.weekday)) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function confidenceLabel(score, spread) {
  // High confidence when the winning day both scores well in absolute
  // terms AND clearly separates itself from the field (spread = winning
  // score minus the average of the rest); otherwise Medium/Low.
  if (score >= 70 && spread >= 15) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

// Finds the best date+window for `activity` within [startDate, startDate +
// rangeDays). Returns backend-computed facts only — no Gemini call here.
export function findMuhurat({ activity, startDate, rangeDays = 30 }) {
  const rules = muhuratActivities[activity];
  if (!rules) {
    throw new Error(`Unknown Muhurat activity "${activity}". Valid options: ${MUHURAT_ACTIVITIES.join(", ")}`);
  }
  const span = Math.max(1, Math.min(90, Number(rangeDays) || 30));

  const candidates = [];
  for (let i = 0; i < span; i++) {
    const dateStr = addDays(startDate, i);
    const score = scoreDayForActivity(dateStr, rules);
    candidates.push({ dateStr, score });
  }
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const rest = candidates.slice(1);
  const restAvg = rest.length ? rest.reduce((s, c) => s + c.score, 0) / rest.length : best.score;
  const spread = Math.round(best.score - restAvg);

  const panchang = computePanchang(best.dateStr);

  const topAlternatives = candidates.slice(1, 4).map((c) => ({ date: c.dateStr, score: c.score }));

  return {
    activity,
    activityLabel: rules.label,
    searchWindow: { startDate, rangeDays: span, endDate: addDays(startDate, span - 1) },
    bestDate: best.dateStr,
    bestDateWeekday: panchang.weekday,
    bestTimeWindow: panchang.abhijitMuhurat,
    auspiciousPeriod: {
      window: panchang.abhijitMuhurat,
      tithi: panchang.tithi.name,
      nakshatra: panchang.nakshatra.name,
      note: "Abhijit Muhurat — the classical mid-day auspicious window, clear of the day's caution periods below.",
    },
    cautionPeriod: {
      rahuKaal: panchang.rahuKaal,
      yamaganda: panchang.yamaganda,
      gulikaKaal: panchang.gulikaKaal,
      note: "Avoid starting the activity during these classical caution windows on the chosen date.",
    },
    confidenceLevel: confidenceLabel(best.score, spread),
    score: best.score,
    topAlternatives,
  };
}

export default { findMuhurat, MUHURAT_ACTIVITIES };
