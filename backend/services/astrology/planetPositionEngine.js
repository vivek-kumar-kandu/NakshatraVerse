// ─────────────────────────────────────────────────────────────────────────
// Planet Position Engine
// Single responsibility: deterministic, birth-data-seeded planetary
// positions, Lagna (Ascendant), and Nakshatra. Logic is unchanged from the
// original astroEngine.js.
// ─────────────────────────────────────────────────────────────────────────
import { parseDob, parseTob } from "../utils/dateTimeParser.js";
import { SIGN_NAMES, PLANETS, NAKSHATRAS } from "./constants.js";

// Small deterministic integer hash (birth data + a per-planet salt ->
// unsigned 32-bit int). Same (dob, tob, salt) always produces the same
// output, preserving the "deterministic, birth-data-seeded" contract —
// it just mixes the bits properly instead of a plain linear formula.
function hashHouseSeed(y, m, d, h, salt) {
  let x = (y * 374761393) ^ (m * 668265263) ^ (d * 2246822519) ^ (h * 3266489917) ^ salt;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x = x ^ (x >>> 16);
  return x >>> 0;
}

export function calcPlanetaryPositions(dob, tob) {
  const { y, m, d } = parseDob(dob);
  const { h } = parseTob(tob);
  const seed = (y * 366 + m * 31 + d + h) % 12;
  const positions = {};
  PLANETS.forEach((p, i) => {
    // Bug fix (Phase 6 Kaal Sarp Dosha investigation): house used to be
    // `((seed + i*3 + i) % 12) + 1`, i.e. `(seed + 4*i) % 12`. Because
    // gcd(4, 12) = 4, that step only ever produces 3 distinct house
    // values as i runs 0-8, so Sun/Mercury/Saturn (i = 0, 3, 6) were
    // always placed in the exact same house as one another, in every
    // single chart, with no exceptions. House now comes from a proper
    // per-planet hash of the full birth data instead of a linear formula
    // that collapses under mod 12, so each planet's house is genuinely
    // independent of the others. Sign is intentionally left untouched —
    // it isn't part of this bug, and every already-verified Yoga/Dosha
    // (Gajakesari, Budhaditya, Parivartana, etc.) depends on its exact
    // current values.
    const house = (hashHouseSeed(y, m, d, h, i * 97 + 13) % 12) + 1;
    const sign = SIGN_NAMES[(seed + i * 2) % 12];
    positions[p] = { house, sign };
  });

  // Rahu and Ketu (the lunar nodes) are always exactly opposite one
  // another — 180°, i.e. exactly 6 houses apart — a fixed astronomical
  // fact, not something birth data should be free to vary. Under the old
  // formula, 4*(indexRahu - indexKetu) mod 12 could never equal 6, so
  // Rahu and Ketu were never a real opposition axis to begin with. That,
  // together with the clustering bug above, is what made "all planets
  // between the Rahu-Ketu axis" structurally impossible for every chart
  // (verified exhaustively, not just empirically rare). Deriving Ketu's
  // house from Rahu's fixes the axis while keeping everything else about
  // the deterministic contract unchanged.
  const rahuKey = PLANETS.find((name) => name.startsWith("Rahu"));
  const ketuKey = PLANETS.find((name) => name.startsWith("Ketu"));
  positions[ketuKey] = {
    ...positions[ketuKey],
    house: ((positions[rahuKey].house - 1 + 6) % 12) + 1,
  };

  return positions;
}

export function calcLagna(dob, tob) {
  const { y, m, d } = parseDob(dob);
  const { h } = parseTob(tob);
  return SIGN_NAMES[(y + m + d + h) % 12];
}

// Deterministic lunar-longitude proxy (0-360°), extracted from calcNakshatra
// below so other internal-only engines (e.g. the Priority 3.2 Vimshottari
// Dasha engine, which needs the precise position-within-nakshatra to
// compute the balance of the Dasha at birth) can reuse the exact same
// formula instead of duplicating it. Not part of any API response shape —
// purely an internal helper, same convention as planetaryDegreeEngine.js.
export function calcMoonLongitude(dob, tob) {
  const { y, m, d } = parseDob(dob);
  const { h, mi } = parseTob(tob);
  return (y * 29 + m * 53 + d * 7 + h * 11 + mi) % 360;
}

// Nakshatra derived from a deterministic lunar-longitude proxy.
export function calcNakshatra(dob, tob) {
  const longitude = calcMoonLongitude(dob, tob);
  const span = 360 / 27;
  const nakIndex = Math.floor(longitude / span) % 27;
  const pada = Math.floor((longitude % span) / (span / 4)) + 1; // 1-4
  return { name: NAKSHATRAS[nakIndex], pada };
}

export default { calcPlanetaryPositions, calcLagna, calcNakshatra, calcMoonLongitude };
