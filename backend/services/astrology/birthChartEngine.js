// ─────────────────────────────────────────────────────────────────────────
// Birth Chart Engine
// Orchestrates the full astrology calculation pipeline in order:
//   Planet Position Engine → House Placement Engine → Planet Strength Engine
//   → Yoga Detection Engine → Dosha Detection Engine → Numerology Engine
//   → Structured JSON Builder
//
// This is the single source of truth for all astrological facts, exactly
// as computeChart() was in the original astroEngine.js. Gemini/AI code
// never touches this pipeline — it only ever reads the finished output.
// ─────────────────────────────────────────────────────────────────────────
import { calcNumerology } from "./numerologyEngine.js";
import { calcPlanetaryPositions, calcLagna, calcNakshatra } from "./planetPositionEngine.js";
import { calcPlanetStrength } from "./planetStrengthEngine.js";
import { detectYogas } from "./yogaDetectionEngine.js";
import { detectDoshas } from "./doshaDetectionEngine.js";
import { deriveRemedies } from "./remedyEngine.js";
import { buildChartJson } from "./structuredJsonBuilder.js";
import logger from "../utils/logger.js";
// Priority 3.2 additions — Nakshatra Profile / Dasha / Transit / Advanced
// Yoga / Advanced Dosha / Divisional Chart Foundation. Each is computed
// below purely for pipeline completeness and internal use (structured
// insights for the AI layer, future UI wiring), exactly following the
// Priority 3.1 planetStrength precedent: computed here, logged, but NOT
// merged into buildChartJson's return value — so /api/chart,
// /api/generate-report's `chart` field, and the frontend remain 100%
// byte-identical. See structuredInsightsEngine.js for where this data IS
// actually used (feeding the Gemini prompt only).
import { calcNakshatraProfile } from "./nakshatraProfileEngine.js";
import { calcDasha } from "./dashaEngine.js";
import { calcTransits } from "./transitEngine.js";
import { detectAdvancedYogas } from "./advancedYogaEngine.js";
import { detectAdvancedDoshas } from "./advancedDoshaEngine.js";
import { computeAllDivisionalCharts } from "./divisionalChartEngine.js";
import { TTLCache, memoizeSync } from "../utils/cache.js";
import config from "../../config/env.js";
import { timeSync } from "../utils/metrics.js";

function computeChartUncached(userData) {
  const { name, dob, tob } = userData;

  // 1. Planet Position Engine
  const planetary = calcPlanetaryPositions(dob, tob);
  const lagna = calcLagna(dob, tob);
  const nakshatra = calcNakshatra(dob, tob);

  // 2. House Placement Engine is used internally by the yoga/dosha engines
  //    below (they each resolve houses via housePlacementEngine.houseOf).

  // 3. Planet Strength Engine — computes the full Priority 3 strength
  //    profile (dignity, retrograde, combustion, friendship, natural/
  //    functional benefic-malefic, Dig Bala, foundation Shadbala) for
  //    internal use/diagnostics. Its result is intentionally not merged
  //    into buildChartJson's output below (see
  //    services/astrology/planetStrengthEngine.js for why) — this keeps
  //    the API response, Gemini prompt, and frontend 100% unchanged.
  const planetStrength = calcPlanetStrength(planetary, lagna, dob, tob);

  // 4. Yoga Detection Engine
  const yogas = detectYogas(planetary);

  // 5. Dosha Detection Engine
  const doshas = detectDoshas(planetary);

  // 6. Numerology Engine
  const numerology = calcNumerology(name, dob);

  // Remedies depend on the Lagna lord + detected doshas.
  const remedies = deriveRemedies({ lagna, doshas });

  const moonSign = planetary["Moon 🌙"].sign;
  const sunSign = planetary["Sun ☀️"].sign;

  // 7. Nakshatra Engine (Priority 3.2) — expands the basic {name, pada}
  //    fact already computed above into the full professional profile.
  const nakshatraProfile = calcNakshatraProfile(nakshatra);

  // 8. Vimshottari Dasha Engine (Priority 3.2)
  const dasha = calcDasha(nakshatra, dob, tob);

  // 9. Transit (Gochar) Engine (Priority 3.2) — today's transits vs. this
  //    chart's natal Moon sign.
  const transits = calcTransits(planetary, moonSign);

  // 10. Advanced Yoga & Dosha Engine (Priority 3.2) — additional classical
  //     yogas/doshas beyond the Priority 2 base rule sets.
  const advancedYogas = detectAdvancedYogas(planetary, lagna);
  const advancedDoshas = detectAdvancedDoshas(planetary, lagna);

  // 11. Divisional Chart Foundation (Priority 3.2) — D9/D10/D7/D12 today;
  //     see divisionalChartEngine.js for how future Vargas plug in.
  const divisionalCharts = computeAllDivisionalCharts(planetary, dob, tob);

  logger.debug(
    `Chart computed for "${name}": lagna=${lagna}, moonSign=${moonSign}, sunSign=${sunSign}, ` +
    `yogas=${yogas.length}, doshas=${doshas.length}, remedies=${remedies.length}, ` +
    `planetStrengthEntries=${Object.keys(planetStrength).length}, ` +
    `advancedYogas=${advancedYogas.length}, advancedDoshas=${advancedDoshas.length}, ` +
    `dashaAvailable=${dasha.available}, transits=${transits.length}, ` +
    `divisionalCharts=${Object.keys(divisionalCharts).length}`
  );

  // 12. Structured JSON Builder — assembles the final, authoritative chart
  //     object consumed by both the frontend and the AI prompt builder.
  return buildChartJson({
    userData,
    numerology,
    planetary,
    lagna,
    moonSign,
    sunSign,
    nakshatra,
    yogas,
    doshas,
    remedies,
  });
}

// ── Priority 4: caching ──────────────────────────────────────────────────
// computeChart() is a pure function of (name, dob, tob, pob) — it reads no
// external/mutable state (rules are static JSON, "today" is never
// consulted here — see transitEngine.js for the one place that is
// date-dependent, which is intentionally computed *outside* this pipeline
// via structuredInsightsEngine.js). That makes it safe to memoize: the
// exact same birth data always produces the exact same chart object, so
// repeat calls (e.g. a user opening /api/chart then /api/generate-report
// for the same data, or re-generating the same report) can skip
// recomputation entirely. This wrapper is the ONLY change to this file —
// the calculation pipeline above (computeChartUncached) is byte-identical
// to the pre-Priority-4 computeChart().
const chartCache = new TTLCache({
  name: "chartCache",
  maxEntries: config.CHART_CACHE_MAX_ENTRIES,
  ttlMs: config.CHART_CACHE_TTL_MS,
});

function chartCacheKey(userData) {
  const { name, dob, tob, pob } = userData || {};
  // JSON.stringify with explicit key order so field order in the caller's
  // object literal can never produce a spurious cache miss.
  return JSON.stringify({ name, dob, tob, pob });
}

export const computeChart = memoizeSync(
  (userData) => timeSync("chartCalculation", () => computeChartUncached(userData)),
  { cache: chartCache, keyFn: chartCacheKey }
);

// Exposed for diagnostics/tests only — not used by any production code path.
export function getChartCacheStats() {
  return chartCache.getStats();
}

export function clearChartCache() {
  chartCache.clear();
}

export default { computeChart, getChartCacheStats, clearChartCache };
