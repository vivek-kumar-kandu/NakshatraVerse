// ─────────────────────────────────────────────────────────────────────────
// Transit (Gochar) Engine (Priority 3.2)
// Single responsibility: compute today's deterministic transit sign for
// the four classically most-watched slow/shadow transits (Saturn, Jupiter,
// Rahu, Ketu), compare each against the natal chart (natal sign/house +
// house-counted-from-natal-Moon), and return structured transit results.
//
// Positions are derived from a deterministic, date-seeded formula — this
// backend has never used a real ephemeris (see planetPositionEngine.js),
// so transit signs follow the same documented approximation philosophy
// rather than introducing a different calculation method for "today" vs.
// "birth". This is a foundation-phase approximation, not real transit
// astronomy — see CHANGELOG for future ephemeris-integration notes.
// ─────────────────────────────────────────────────────────────────────────
import { SIGN_NAMES } from "./constants.js";
import { evaluateTransit } from "../rules/transitRuleEvaluator.js";

// Deterministic per-planet offset so each planet's transit sign advances
// at a different (but still repeatable) pace across dates — mirrors the
// index-based offsetting already used in planetPositionEngine.calcPlanetaryPositions.
const TRANSIT_PLANETS = [
  { name: "Saturn", offset: 6 },
  { name: "Jupiter", offset: 4 },
  { name: "Rahu", offset: 7 },
  { name: "Ketu", offset: 8 },
];

function transitSignFor(date, offset) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const seed = (y * 366 + m * 31 + d) % 12;
  return SIGN_NAMES[(seed + offset * 2) % 12];
}

/**
 * @param {Record<string, {house:number, sign:string}>} planetary - natal planetary positions (from planetPositionEngine)
 * @param {string} natalMoonSign
 * @param {Date} [asOf]
 */
export function calcTransits(planetary, natalMoonSign, asOf = new Date()) {
  const fullKeyByPlain = Object.keys(planetary || {}).reduce((map, fullKey) => {
    map[fullKey.split(" ")[0]] = fullKey;
    return map;
  }, {});

  return TRANSIT_PLANETS.map(({ name, offset }) => {
    const transitSign = transitSignFor(asOf, offset);
    const result = evaluateTransit(name, transitSign, natalMoonSign);
    const natalEntry = planetary?.[fullKeyByPlain[name]];
    return {
      ...result,
      natalSign: natalEntry?.sign ?? null,
      natalHouse: natalEntry?.house ?? null,
      asOf: asOf.toISOString().slice(0, 10),
    };
  });
}

export default { calcTransits };
