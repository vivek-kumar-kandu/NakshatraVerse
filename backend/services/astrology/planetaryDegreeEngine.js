// ─────────────────────────────────────────────────────────────────────────
// Planetary Degree Engine (internal-only helper)
//
// Single responsibility: derive a deterministic, seed-based "degree within
// sign" (0-30°) per planet, purely for internal Planet Strength Engine
// calculations (combustion distance, retrograde approximation, Chesta Bala)
// that need finer granularity than the whole-house/whole-sign data already
// exposed via planetPositionEngine.js.
//
// IMPORTANT: this is NOT real ephemeris data — this engine has never done
// astronomical calculation (see planetPositionEngine.js's own seed-based
// house/sign formulas), so this follows the exact same deterministic,
// birth-data-seeded approach for consistency, rather than introducing a
// different calculation philosophy. The output of this module is never
// added to the `planetary` object returned to the frontend/API — it is
// strictly an internal input to services/rules/*RuleEvaluator.js modules,
// so it cannot change the JSON response shape.
// ─────────────────────────────────────────────────────────────────────────
import { parseDob, parseTob } from "../utils/dateTimeParser.js";
import { PLANETS } from "./constants.js";

export function calcPlanetaryDegrees(dob, tob) {
  const { y, m, d } = parseDob(dob);
  const { h, mi } = parseTob(tob);
  const degrees = {};
  PLANETS.forEach((p, i) => {
    const raw = (y * 7 + m * 11 + d * 13 + h * 17 + mi * 3 + i * 29) % 300;
    degrees[p] = raw / 10; // deterministic value in [0, 30)
  });
  return degrees;
}

export default { calcPlanetaryDegrees };
