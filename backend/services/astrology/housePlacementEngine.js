// ─────────────────────────────────────────────────────────────────────────
// House Placement Engine
// Single responsibility: resolve house placements for planets from the
// already-computed planetary position map. This was previously an inline
// `houseOf` helper in astroEngine.js — behavior is identical, just given
// its own module so yoga/dosha detection depend on an explicit "house
// placement" concept rather than reaching into the raw planetary object.
// ─────────────────────────────────────────────────────────────────────────

export function houseOf(planetary, planetKey) {
  return planetary[planetKey]?.house;
}

// Convenience: resolve houses for a whole set of planet keys at once,
// returning a plain { planetKey: house } map. Used by the yoga/dosha
// engines to keep their own code focused on rules, not lookups.
export function getHousePlacements(planetary, planetKeys) {
  const placements = {};
  for (const key of planetKeys) {
    placements[key] = houseOf(planetary, key);
  }
  return placements;
}

export default { houseOf, getHousePlacements };
