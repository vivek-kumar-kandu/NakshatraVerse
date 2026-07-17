// ─────────────────────────────────────────────────────────────────────────
// Transit Forecast Engine — Foundation (V2.0 Phase 7 — Prediction Engine)
// Single responsibility: group the existing transitEngine.js's flat
// per-planet transit results (Priority 3.2) into named Saturn / Jupiter /
// Rahu-Ketu forecasts, so the Prediction Engine (and any future frontend
// "Transit Forecast" view) can address them individually instead of
// scanning an array by planet name.
//
// This is deliberately a thin wrapper, NOT a reimplementation:
// transitEngine.js/transitRuleEvaluator.js (Saturn/Jupiter/Rahu/Ketu
// transit-sign calculation, house-from-Moon, Sade Sati/Kantaka Shani/
// Ashtama Shani flags) are completely untouched — every fact below comes
// from calling calcTransits() exactly as structuredInsightsEngine.js
// already does.
//
// "Foundation for future expansion": adding a new transit group (e.g. a
// future Mars or Venus transit) only ever requires (1) adding the planet
// to transitEngine.js's own TRANSIT_PLANETS list — its one existing,
// documented extension point — and (2) adding one line to TRANSIT_GROUPS
// below. Nothing else in this file, or in any caller of it, needs to
// change.
// ─────────────────────────────────────────────────────────────────────────
import { calcTransits } from "./transitEngine.js";

// Group key -> the transit planet name(s) (as returned by calcTransits)
// that belong to it. Saturn and Jupiter are each their own group (the two
// classically most life-impacting slow transits); Rahu/Ketu are grouped
// together since they are always exactly opposite each other on one axis
// and are traditionally read as a single "nodal axis" transit.
const TRANSIT_GROUPS = {
  saturn: ["Saturn"],
  jupiter: ["Jupiter"],
  rahuKetu: ["Rahu", "Ketu"],
};

/**
 * @param {Record<string, {house:number, sign:string}>} planetary - natal planetary positions
 * @param {string} natalMoonSign
 * @param {Date} [asOf]
 * @returns {{saturn: object|null, jupiter: object|null, rahuKetu: object[]}}
 */
export function calcTransitForecast(planetary, natalMoonSign, asOf = new Date()) {
  const all = calcTransits(planetary, natalMoonSign, asOf);
  const byPlanet = Object.fromEntries(all.map((t) => [t.planet, t]));

  const forecast = {};
  for (const [groupKey, planetNames] of Object.entries(TRANSIT_GROUPS)) {
    const entries = planetNames.map((name) => byPlanet[name]).filter(Boolean);
    // Single-planet groups (Saturn/Jupiter) resolve to one object (or null
    // if that transit couldn't be computed); the Rahu-Ketu axis always
    // resolves to an array, even if only one side is available.
    forecast[groupKey] = planetNames.length === 1 ? (entries[0] || null) : entries;
  }
  return forecast;
}

export default { calcTransitForecast };
