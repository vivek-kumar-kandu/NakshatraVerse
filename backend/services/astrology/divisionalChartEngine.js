// ─────────────────────────────────────────────────────────────────────────
// Divisional Chart (Varga) Engine — FOUNDATION (Priority 3.2)
// Single responsibility: provide one GENERIC, registry-driven computation
// for any divisional chart listed in rules/divisionalCharts.json (D9, D10,
// D7, D12 today). Adding a future Varga (D2, D3, D24, ...) means adding a
// config entry to that JSON file only — this module never needs to change,
// and no other completed module needs to change either. This satisfies
// the "modular architecture, no changes needed to add future Vargas"
// requirement directly.
//
// SCOPE NOTE (documented approximation, foundation phase): this backend
// has never used a real ephemeris — planetPositionEngine.js's positions
// are deterministic/seeded, and planetaryDegreeEngine.js's degrees are a
// synthetic proxy (see that file's own comments). Varga sign assignment
// here uses the same "deterministic, not astronomical" philosophy: each
// planet's whole sign + synthetic degree-within-sign is split into
// `divisions` equal parts and mapped forward from its Rasi sign. This is a
// reasonable, commonly-used simplified varga formula, but is explicitly a
// foundation/approximation layer — not a substitute for a full
// classical-parashari varga engine with per-varga special-casing (e.g.
// D9's odd/even sign direction rules). Follow-up phases can swap the
// internals of `signIndexForVarga` below without touching the registry,
// the public API, or any calling code.
// ─────────────────────────────────────────────────────────────────────────
import { SIGN_NAMES } from "./constants.js";
import { calcPlanetaryDegrees } from "./planetaryDegreeEngine.js";
import { loadRules } from "../rules/ruleLoader.js";

function signIndexForVarga(signName, degreeInSign, divisions) {
  const signIndex = SIGN_NAMES.indexOf(signName);
  if (signIndex < 0) return null;
  const partSize = 30 / divisions;
  const part = Math.min(divisions - 1, Math.floor(degreeInSign / partSize));
  return (signIndex * divisions + part) % 12;
}

/**
 * Compute a single divisional chart (e.g. "D9") for every planet.
 * Returns { [planetKey]: { sign } } — sign-only in this foundation phase
 * (house placement in a varga chart requires a varga-Lagna, left as a
 * clearly-scoped follow-up; see rules/divisionalCharts.json comment).
 */
export function computeDivisionalChart(planetary, dob, tob, vargaKey) {
  const { vargas } = loadRules("divisionalCharts");
  const vargaConfig = vargas[vargaKey];
  if (!vargaConfig) {
    throw new Error(`Divisional Chart Engine: unknown varga "${vargaKey}". Add it to rules/divisionalCharts.json first.`);
  }

  const degrees = calcPlanetaryDegrees(dob, tob);
  const result = {};
  for (const [planetKey, entry] of Object.entries(planetary || {})) {
    const idx = signIndexForVarga(entry.sign, degrees[planetKey] ?? 0, vargaConfig.divisions);
    result[planetKey] = { sign: idx === null ? null : SIGN_NAMES[idx] };
  }

  return { varga: vargaKey, name: vargaConfig.name, significance: vargaConfig.significance, positions: result };
}

/** Compute every registered divisional chart at once (D9, D10, D7, D12, ...). */
export function computeAllDivisionalCharts(planetary, dob, tob) {
  const { vargas } = loadRules("divisionalCharts");
  const all = {};
  for (const vargaKey of Object.keys(vargas)) {
    all[vargaKey] = computeDivisionalChart(planetary, dob, tob, vargaKey);
  }
  return all;
}

export default { computeDivisionalChart, computeAllDivisionalCharts };
