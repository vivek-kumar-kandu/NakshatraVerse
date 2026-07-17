// ─────────────────────────────────────────────────────────────────────────
// Numerology Engine
// Single responsibility: derive numerology figures (Mulank / Bhagyank)
// from the birth date. Logic is unchanged from the original astroEngine.js.
// ─────────────────────────────────────────────────────────────────────────
import { parseDob } from "../utils/dateTimeParser.js";

function reduceToDigit(n) {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split("").reduce((a, b) => a + parseInt(b, 10), 0);
  }
  return n;
}

export function calcNumerology(name, dob) {
  const { y, m, d } = parseDob(dob);
  const mulank = reduceToDigit(d);
  const bhagyank = reduceToDigit(d + m + y);
  return { mulank, bhagyank };
}

export default { calcNumerology };
