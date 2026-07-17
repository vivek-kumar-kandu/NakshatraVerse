import { PLANETS, PLANET_COLORS, HOUSE_MEANINGS } from "../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// explorerItemBuilders (V5.1 — Interactive Kundli / Explorer Integration)
//
// ExplorerSidePanel.jsx builds its own `{ id, label, sublabel, color }`
// item shape per selection type (see its `buildItems()`). The Interactive
// Kundli needs to hand `selectItem(type, item)` an item in that *exact*
// same shape so clicking a planet/house/sign/etc. on the chart opens the
// identical detail panel a side-panel click would — otherwise the two
// entry points would silently drift apart.
//
// Rather than reach into ExplorerSidePanel's internals (or duplicate its
// logic inline in the chart component), that convention is captured once
// here. Every function only reformats data the backend/constants already
// provide — no calculation.
// ─────────────────────────────────────────────────────────────────────────

// "Sun" -> "Sun ☀️" — the reverse of explorerData.js's plainPlanetName().
export function fullPlanetName(plainName) {
  return PLANETS.find((p) => p.split(" ")[0] === plainName) || plainName;
}

export function buildPlanetItem(planetFullName, planetary) {
  const info = planetary?.[planetFullName];
  return {
    id: planetFullName,
    label: planetFullName,
    sublabel: info ? `H${info.house}` : undefined,
    color: PLANET_COLORS[planetFullName],
  };
}

export function buildHouseItem(houseNumber) {
  return {
    id: `house-${houseNumber}`,
    label: `House ${houseNumber}`,
    sublabel: HOUSE_MEANINGS[houseNumber],
  };
}

export function buildSignItem(signName) {
  return { id: signName, label: signName };
}

export function buildAscendantItem(lagna) {
  return { id: "ascendant", label: lagna };
}

export function buildNakshatraItem(nakshatraProfile) {
  if (!nakshatraProfile) return null;
  return {
    id: "nakshatra-profile",
    label: nakshatraProfile.nakshatra || nakshatraProfile.name,
    sublabel: nakshatraProfile.lord ? `Lord: ${nakshatraProfile.lord}` : undefined,
  };
}

export function buildYogaItem(yoga, idx) {
  return { id: `yoga-${idx}-${yoga.name}`, label: yoga.name, sublabel: yoga.detail };
}

export function buildDoshaItem(dosha, idx) {
  return { id: `dosha-${idx}-${dosha.name}`, label: dosha.name, sublabel: dosha.detail };
}

// Mirrors ExplorerSidePanel's "aspect" case exactly: one item per planet
// currently receiving at least one aspect, sourced from the same
// report.planetStrength[<plainName>].aspectInfluence the Aspect (Drishti)
// Rule Evaluator already computed.
export function buildAspectItems(report) {
  const strength = report?.planetStrength;
  if (!strength) return [];
  return Object.entries(strength)
    .filter(([, profile]) => (profile?.aspectInfluence?.aspectedBy || []).length > 0)
    .map(([plainName, profile]) => {
      const { aspectedBy, netInfluence } = profile.aspectInfluence;
      return {
        id: `aspect-${plainName}`,
        label: `${plainName} ← ${aspectedBy.join(", ")}`,
        sublabel: `${aspectedBy.length} aspect${aspectedBy.length === 1 ? "" : "s"} · net ${netInfluence >= 0 ? "+" : ""}${netInfluence}`,
        targetPlain: plainName,
        aspectedBy,
        netInfluence,
      };
    });
}

export default {
  fullPlanetName,
  buildPlanetItem,
  buildHouseItem,
  buildSignItem,
  buildAscendantItem,
  buildNakshatraItem,
  buildYogaItem,
  buildDoshaItem,
  buildAspectItems,
};
