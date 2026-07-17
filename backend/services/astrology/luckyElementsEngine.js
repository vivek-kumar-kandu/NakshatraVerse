// ─────────────────────────────────────────────────────────────────────────
// Lucky Elements Engine — V4.3 (AI Life Coach Enhancement Pass)
// Single responsibility: deterministically derive Lucky Color / Lucky
// Number / Lucky Direction / Favorable Time Window, and today's suggested
// Spiritual Practice activity, purely by looking up already-computed
// backend facts — the Moon Sign's classical ruling planet (SIGN_LORD,
// already used by promptBuilder/remedy code elsewhere in this codebase),
// the birth Numerology Mulank (numerologyEngine.js, already on `chart`),
// and today's Panchang (panchangEngine.js's existing weekday/Abhijit
// Muhurat). No new astrology is calculated here — this is the same
// "read already-computed facts, apply a fixed classical lookup table"
// pattern planetPositionEngine.js's own PLANET_REMEDY table already uses.
// Gemini never generates or alters any of these values; per the Life
// Coach prompt builder, it may only explain the *significance* of the
// Spiritual Practice activity chosen here.
// ─────────────────────────────────────────────────────────────────────────
import { SIGN_LORD } from "./constants.js";

// Classical planet -> color / direction associations (same "planet
// significations" family as constants.js's own PLANET_REMEDY table, just
// the two facets that table doesn't already carry).
const PLANET_COLOR = {
  Sun: "Red / Orange", Moon: "White / Silver", Mars: "Red / Coral", Mercury: "Green",
  Jupiter: "Yellow / Gold", Venus: "White / Pastel Blue", Saturn: "Blue / Black",
  Rahu: "Smoky Grey", Ketu: "Multicolor / Brown",
};

const PLANET_DIRECTION = {
  Sun: "East", Moon: "North-West", Mars: "South", Mercury: "North",
  Jupiter: "North-East", Venus: "South-East", Saturn: "West",
  Rahu: "South-West", Ketu: "South-West",
};

// Classical weekday -> ruling planet (Vedic Panchang convention; the same
// weekday panchangEngine.js already computes and returns as `.weekday`).
const WEEKDAY_LORD = {
  Sunday: "Sun", Monday: "Moon", Tuesday: "Mars", Wednesday: "Mercury",
  Thursday: "Jupiter", Friday: "Venus", Saturday: "Saturn",
};

// Classical weekday-lord -> suggested daily spiritual activity. Backend
// selects the activity; the prompt builder only ever asks Gemini to
// explain its significance, never to choose or alter it.
const PLANET_PRACTICE = {
  Sun: "Prayer", Moon: "Meditation", Mars: "Charity", Mercury: "Reading Sacred Texts",
  Jupiter: "Mantra Chanting", Venus: "Gratitude Practice", Saturn: "Yoga",
};

function moonSignLord(chart) {
  const moonSign = chart?.planetary?.["Moon 🌙"]?.sign || chart?.moonSign;
  return { moonSign, lord: SIGN_LORD[moonSign] };
}

export function computeLuckyElements({ chart, panchang }) {
  const { moonSign, lord } = moonSignLord(chart);
  const mulank = chart?.numerology?.mulank;

  return {
    luckyColor: PLANET_COLOR[lord] || "White",
    luckyNumber: typeof mulank === "number" ? mulank : null,
    luckyDirection: PLANET_DIRECTION[lord] || "East",
    favorableTimeWindow: panchang?.abhijitMuhurat
      ? `${panchang.abhijitMuhurat.start} – ${panchang.abhijitMuhurat.end} (Abhijit Muhurat)`
      : null,
    basis: `Derived from Moon Sign (${moonSign || "N/A"}, ruled by ${lord || "N/A"}), birth numerology Mulank, and today's Panchang.`,
  };
}

export function selectSpiritualPractice({ panchang, nakshatraProfile }) {
  const lord = WEEKDAY_LORD[panchang?.weekday] || nakshatraProfile?.lord || null;
  return {
    activity: PLANET_PRACTICE[lord] || "Meditation",
    lord,
  };
}

export default { computeLuckyElements, selectSpiritualPractice };
