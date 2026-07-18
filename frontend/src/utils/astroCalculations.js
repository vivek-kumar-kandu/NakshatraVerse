import { PLANETS, SIGN_NAMES } from "../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// NOTE: These local calculations are used ONLY as an instant preview while
// the loading screen animates. The moment the backend responds, App
// overwrites this state with the backend's authoritative chart (see
// useAstrologyReport.js) so the AI narrative and the displayed numbers can
// never disagree — all real astrology math lives on the server
// (backend/services/astrology/*), matching these functions exactly.
//
// Priority 5.1: extracted verbatim from App.jsx into their own module
// (Separation of Concerns) — no calculation logic changed.
// ─────────────────────────────────────────────────────────────────────────

export function calcNumerology(name, dob) {
  // dob comes from a native <input type="date">, which always yields
  // "YYYY-MM-DD" — parse in that order (previously this destructured as
  // [d,m,y], which silently produced wrong Mulank/Bhagyank numbers).
  const reduce = (n) => { while(n > 9 && n !== 11 && n !== 22) { n = String(n).split("").reduce((a,b)=>a+parseInt(b),0); } return n; };
  const [y,m,d] = dob.split("-").map(Number);
  const mulank = reduce(d);
  const bhagyank = reduce(d+m+y);
  return { mulank, bhagyank };
}

export function calcPlanetaryPositions(dob, tob) {
  const [y,m,d] = dob.split("-").map(Number);
  const [h] = tob.split(":").map(Number);
  const seed = (y * 366 + m * 31 + d + h) % 12;
  const positions = {};
  PLANETS.forEach((p, i) => {
    const house = ((seed + i * 3 + i) % 12) + 1;
    const sign = SIGN_NAMES[(seed + i * 2) % 12];
    positions[p] = { house, sign };
  });
  return positions;
}

export function getLagna(dob, tob) {
  const [y,m,d] = dob.split("-").map(Number);
  const [h] = tob.split(":").map(Number);
  return SIGN_NAMES[(y + m + d + h) % 12];
}
