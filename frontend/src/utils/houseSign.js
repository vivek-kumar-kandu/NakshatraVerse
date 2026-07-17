import { SIGN_NAMES } from "../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// houseSign (V5.0 Phase 5B — Explorer Infrastructure: Backend Integration)
//
// Given the chart's Lagna (Ascendant) sign, derives which zodiac sign
// falls in a given whole-sign house (1-12). This is NOT a new astrology
// calculation — it is the exact inverse of the formula
// `components/common/ZodiacWheel.jsx` already uses to derive a sign's
// house number from the Lagna:
//
//   house = ((signIndex - lagnaIndex + 12) % 12) + 1
//
// Solved for signIndex given a house number:
//
//   signIndex = (lagnaIndex + house - 1) % 12
//
// Used by the House/Ascendant Explorer panels to show a house's sign (and,
// via SIGN_LORD, its ruling planet) even for houses with no occupant
// planet — something the existing `HouseCard`/`KundliTab` house grid only
// approximates today (it reads the sign off the first occupant planet, or
// shows nothing for an empty house).
// ─────────────────────────────────────────────────────────────────────────
export function signForHouse(lagna, house) {
  const lagnaIdx = SIGN_NAMES.indexOf(lagna);
  if (lagnaIdx === -1 || !house) return undefined;
  return SIGN_NAMES[(lagnaIdx + house - 1 + 12) % 12];
}

export default { signForHouse };
