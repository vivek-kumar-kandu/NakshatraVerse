// ─────────────────────────────────────────────────────────────────────────
// Structured Astrology JSON Builder
// Single responsibility: assemble already-computed astrology facts into
// the exact chart object shape the frontend and the Gemini prompt builder
// both expect. This is the same object literal that computeChart()
// returned inline in the original astroEngine.js — pulling it out keeps
// "shape of the data" separate from "how each fact is calculated".
// ─────────────────────────────────────────────────────────────────────────

export function buildChartJson({
  userData,
  numerology,
  planetary,
  lagna,
  moonSign,
  sunSign,
  nakshatra,
  yogas,
  doshas,
  remedies,
}) {
  return {
    userData: { ...userData, lagna },
    numerology,
    planetary,
    lagna,
    moonSign,
    sunSign,
    nakshatra,
    yogas,
    doshas,
    remedies,
  };
}

// Picks only the fields that are safe/expected to be sent back to the
// client as the "chart" portion of an API response — used by both
// /api/chart and /api/generate-report so their chart payload can never
// drift apart.
export function buildChartResponsePayload(chart) {
  return {
    userData: chart.userData,
    planetary: chart.planetary,
    numerology: chart.numerology,
    lagna: chart.lagna,
    moonSign: chart.moonSign,
    sunSign: chart.sunSign,
    nakshatra: chart.nakshatra,
    yogas: chart.yogas,
    doshas: chart.doshas,
    remedies: chart.remedies,
  };
}

export default { buildChartJson, buildChartResponsePayload };
