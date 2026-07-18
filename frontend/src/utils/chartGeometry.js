import { SIGN_NAMES } from "../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// chartGeometry (V5.1 — Interactive Kundli)
//
// Pure SVG-coordinate math, mirroring the private `polar`/wedge helpers
// already inside ZodiacWheel.jsx (same cx/cy/radius constants, same
// whole-sign wedge angles: `angle = signIndex * 30 - 90`). Nothing here
// computes astrology — it only re-derives *where on screen* a
// sign/planet/house already sits, so a second, independent SVG overlay
// (aspect lines, sign/ascendant hit-targets, transit markers) can be laid
// on top of the existing, unmodified ZodiacWheel without ZodiacWheel
// itself needing to expose internal state.
//
// Kept in its own module (rather than duplicated inline) so every new
// Explorer-sync piece that needs "where is X on the wheel" agrees on the
// exact same numbers.
// ─────────────────────────────────────────────────────────────────────────

export const WHEEL_CX = 130;
export const WHEEL_CY = 130;
export const WHEEL_R = 100;   // sign-glyph ring radius
export const WHEEL_INNER = 60;  // inner circle (Lagna) radius
export const WHEEL_MID = 82;   // mid ring (house-number label sits just inside this)
export const WHEEL_OUTER = WHEEL_R + 20; // 120 — outer ring, matches ZodiacWheel's `outer`
export const PLANET_RING_RADIUS = WHEEL_MID + 12; // 94 — where planet glyphs sit
export const TRANSIT_RING_RADIUS = WHEEL_OUTER + 12; // 132 — outside the natal wheel entirely

export function polar(cx, cy, radius, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

// Whole-sign angle for a given zodiac sign index (0 = Aries), identical
// convention to ZodiacWheel's own `i * 30 - 90`.
export function signAngle(signIndex) {
  return signIndex * 30 - 90;
}

export function signPosition(signName, radius = WHEEL_R) {
  const i = SIGN_NAMES.indexOf(signName);
  if (i < 0) return null;
  return { ...polar(WHEEL_CX, WHEEL_CY, radius, signAngle(i)), angle: signAngle(i), signIndex: i };
}

// Re-derives the same per-sign "stack and spread" placement ZodiacWheel
// uses for planet glyphs sharing a sign, keyed by the exact planet key
// (e.g. "Sun ☀️") used throughout `planetary`. Object key ordering here
// intentionally mirrors ZodiacWheel's own `Object.entries(planetary)`
// grouping so positions line up with what's actually rendered on screen.
export function computePlanetPositions(planetary) {
  const bySign = {};
  Object.entries(planetary || {}).forEach(([name, info]) => {
    const sign = info?.sign;
    if (!sign) return;
    if (!bySign[sign]) bySign[sign] = [];
    bySign[sign].push({ name, house: info.house, sign });
  });

  const positions = {};
  Object.entries(bySign).forEach(([sign, list]) => {
    const i = SIGN_NAMES.indexOf(sign);
    if (i < 0) return;
    const angle = signAngle(i);
    const spread = 9;
    list.forEach((p, pi) => {
      const pAngle = angle + (pi - (list.length - 1) / 2) * spread;
      const pos = polar(WHEEL_CX, WHEEL_CY, PLANET_RING_RADIUS, pAngle);
      positions[p.name] = { x: pos.x, y: pos.y, angle: pAngle, sign, house: p.house };
    });
  });
  return positions;
}

export default {
  WHEEL_CX, WHEEL_CY, WHEEL_R, WHEEL_INNER, WHEEL_MID, WHEEL_OUTER,
  PLANET_RING_RADIUS, TRANSIT_RING_RADIUS,
  polar, signAngle, signPosition, computePlanetPositions,
};
