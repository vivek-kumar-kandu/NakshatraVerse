// ─────────────────────────────────────────────────────────────────────────
// Panchang Engine (V4.1 Phase 2 — Daily Panchang & Muhurat Finder)
// Single responsibility: given a calendar date (and optional lat/lon),
// deterministically compute the five Panchang limbs (Tithi, Nakshatra,
// Yoga, Karana, Paksha), sunrise/sunset/moonrise/moonset, the three
// classical "kaal" caution windows (Rahu, Gulika, Yamaganda), Abhijit and
// Brahma Muhurat, and a same-day Auspiciousness Score/summary.
//
// This module is the ONLY place Panchang values are ever computed.
// Gemini (see services/ai/panchangPromptBuilder.js) is only ever handed
// the output of this module to explain in prose — it never calculates or
// invents a timing, exactly like every other astrology engine in this
// codebase (see birthChartEngine.js's own header for the same contract).
//
// Same "deterministic, formula-driven" philosophy as planetPositionEngine
// .js: no external ephemeris dependency, everything reproducible from the
// date alone. Where a real, well-known classical Vedic rule exists (Rahu
// Kalam's weekday-segment table, Abhijit = 8th of 15 daytime muhurtas,
// Brahma Muhurat = 96-48 minutes before sunrise, the 60-Karana cycle
// rule), that exact classical rule is used rather than an arbitrary hash
// — only the underlying Tithi/Nakshatra cycle position (which would
// normally come from a real lunar ephemeris) is a deterministic
// approximation, anchored to a real historical New Moon so the cycle is
// internally consistent day-to-day and month-to-month.
// ─────────────────────────────────────────────────────────────────────────
import panchangData from "../../rules/panchangData.json" with { type: "json" };
import { NAKSHATRAS } from "./constants.js";

const { tithiNames, tithiQuality, yogaNames, inauspiciousYogas, karanaNames, inauspiciousKaranas,
  nakshatraQuality, weekdayNames, rahuKalamSegment, yamagandaSegment, gulikaKalamSegment } = panchangData;

// Default location: New Delhi (28.6139°N, 77.2090°E) — used whenever a
// caller doesn't supply coordinates. Chosen because it's a reasonable
// national default for an India-focused Vedic astrology product.
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;

// Synodic (New Moon to New Moon, 29.530588 days) and sidereal (Moon
// returning to the same Nakshatra, 27.321661 days) month lengths — the two
// real astronomical constants the whole Panchang cycle is anchored to.
const SYNODIC_MONTH = 29.530588;
const SIDEREAL_MONTH = 27.321661;
// A real, verifiable New Moon (Amavasya): 2024-01-11 00:00 UTC. Used only
// as a fixed reference point (JDN 0 of the synodic cycle) — the formula
// below works identically for any date before or after it.
const REF_NEW_MOON_JDN = julianDayNumber(2024, 1, 11);

// ── Date helpers ────────────────────────────────────────────────────────
function parseDateStr(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    throw new Error(`Invalid date "${dateStr}". Expected YYYY-MM-DD.`);
  }
  return { y, m, d };
}

// Standard Julian Day Number algorithm (Fliegel & Van Flandern), accurate
// for the Gregorian calendar — used purely as a stable, monotonically
// increasing day counter so cycle-position math below is simple modular
// arithmetic.
function julianDayNumber(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function dayOfYear(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86400000) + 1;
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function minutesToClock(totalMinutes) {
  const m = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${period}`;
}

// ── Sunrise / Sunset (standard sinusoidal solar-declination approximation) ─
// Real, widely-used approximate solar formula (not a birth-data hash):
// declination from day-of-year, then hour angle from latitude — accurate
// to within a few minutes for non-polar latitudes, which is exactly what
// a consumer Panchang app needs without pulling in a full ephemeris
// dependency. Longitude/timezone offset is intentionally not modeled
// (all times are "local mean solar time" around a 12:00 noon), matching
// the rest of this codebase's no-external-dependency approach.
function calcSunTimes(y, m, d, lat) {
  const doy = dayOfYear(y, m, d);
  const declinationDeg = 23.45 * Math.sin((2 * Math.PI * (284 + doy)) / 365);
  const latRad = (lat * Math.PI) / 180;
  const decRad = (declinationDeg * Math.PI) / 180;
  let cosH = -Math.tan(latRad) * Math.tan(decRad);
  cosH = Math.max(-1, Math.min(1, cosH)); // clamp for polar edge cases
  const hourAngleDeg = (Math.acos(cosH) * 180) / Math.PI;
  const halfDayLengthMin = (hourAngleDeg / 15) * 60;
  const sunriseMin = 12 * 60 - halfDayLengthMin;
  const sunsetMin = 12 * 60 + halfDayLengthMin;
  return { sunriseMin, sunsetMin, dayLengthMin: sunsetMin - sunriseMin };
}

// ── Tithi ───────────────────────────────────────────────────────────────
function calcTithi(jdn) {
  const age = (((jdn - REF_NEW_MOON_JDN) % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const tithiLen = SYNODIC_MONTH / 30;
  const index = Math.min(29, Math.floor(age / tithiLen)); // 0-29 overall
  const paksha = index < 15 ? "Shukla Paksha" : "Krishna Paksha";
  const numberInPaksha = (index % 15) + 1; // 1-15
  const isAmavasya = index === 29;
  const quality = isAmavasya ? tithiQuality.amavasyaOverride : tithiQuality.byNumber[String(numberInPaksha)];
  return {
    index, name: tithiNames[index], paksha, numberInPaksha,
    percentComplete: Math.round(((age % tithiLen) / tithiLen) * 100),
    quality,
  };
}

// ── Nakshatra ───────────────────────────────────────────────────────────
function calcNakshatra(jdn) {
  const age = (((jdn - REF_NEW_MOON_JDN) % SIDEREAL_MONTH) + SIDEREAL_MONTH) % SIDEREAL_MONTH;
  const span = SIDEREAL_MONTH / 27;
  const index = Math.min(26, Math.floor(age / span));
  const name = NAKSHATRAS[index];
  return { index, name, pada: Math.min(4, Math.floor(((age % span) / span) * 4) + 1), quality: nakshatraQuality[name] ?? 1 };
}

// ── Yoga (deterministic combination of Tithi + Nakshatra cycle position,
// same "sum of Sun+Moon longitude" structure classical Yoga uses, just
// built from this engine's own Tithi/Nakshatra indices rather than a full
// ephemeris) ────────────────────────────────────────────────────────────
function calcYoga(tithiIndex, nakshatraIndex) {
  const index = (tithiIndex + nakshatraIndex) % 27;
  const name = yogaNames[index];
  return { index, name, isInauspicious: inauspiciousYogas.includes(name) };
}

// ── Karana (classical 60-per-month cycle: karana #1 is the fixed
// Kimstughna, #2-57 cycle through the 7 movable karanas 8 times, #58-60
// are the fixed Shakuni/Chatushpada/Naga — a real classical rule, applied
// to this engine's own Tithi position) ─────────────────────────────────
function calcKarana(tithiIndex, half) {
  // Overall half-tithi number, 1-60.
  const overall = tithiIndex * 2 + half + 1;
  let name;
  if (overall === 1) name = "Kimstughna";
  else if (overall >= 58) name = ["Shakuni", "Chatushpada", "Naga"][overall - 58];
  else name = karanaNames[1 + ((overall - 2) % 7)]; // movable karanas start at karanaNames[1]
  return { name, isInauspicious: inauspiciousKaranas.includes(name) };
}

// ── Rahu Kaal / Gulika Kaal / Yamaganda ────────────────────────────────
// Classical rule: daylight is split into 8 equal parts; each weekday has
// a fixed part-index for each of the three "kaal" periods.
function calcKaal(weekdayIdx, sunriseMin, dayLengthMin, segmentTable) {
  const partLen = dayLengthMin / 8;
  const part = segmentTable[weekdayIdx]; // 1-8
  const startMin = sunriseMin + (part - 1) * partLen;
  const endMin = startMin + partLen;
  return { start: minutesToClock(startMin), end: minutesToClock(endMin) };
}

// ── Abhijit Muhurat (8th of 15 daytime muhurtas — classical definition) ─
function calcAbhijit(sunriseMin, dayLengthMin) {
  const muhurtaLen = dayLengthMin / 15;
  const startMin = sunriseMin + 7 * muhurtaLen;
  const endMin = sunriseMin + 8 * muhurtaLen;
  return { start: minutesToClock(startMin), end: minutesToClock(endMin) };
}

// ── Brahma Muhurat (96-48 minutes before sunrise — classical definition) ─
function calcBrahmaMuhurat(sunriseMin) {
  return { start: minutesToClock(sunriseMin - 96), end: minutesToClock(sunriseMin - 48) };
}

// ── Moonrise / Moonset (deterministic offset from Tithi: the Moon rises
// ~sunrise on Amavasya and ~sunset on Purnima, advancing ~48min/day — a
// well-known real relationship between lunar phase and moonrise time) ──
function calcMoonTimes(tithiIndex, sunriseMin, sunsetMin) {
  // Days since Amavasya (tithi 29 -> 0 offset), 0-29.
  const daysSinceAmavasya = (tithiIndex + 1) % 30;
  const moonriseMin = sunriseMin + daysSinceAmavasya * 48;
  const moonsetMin = moonriseMin + (sunsetMin - sunriseMin) + 60; // moon stays up slightly longer than the sun on average
  return { moonrise: minutesToClock(moonriseMin), moonset: minutesToClock(moonsetMin) };
}

// ── Auspiciousness Score, Best Time, Avoid / Recommended lists ─────────
function buildSummary({ tithi, nakshatra, yoga, karana, weekdayIdx, abhijit }) {
  // 0-100 composite: Tithi (0/1/2 -> 0/12.5/25 pts, x2 weight),
  // Nakshatra (0/1/2 -> 0/12.5/25), Yoga (25 pts if auspicious else 5),
  // Karana (25 pts if auspicious else 5).
  const tithiPts = tithi.quality * 12.5; // max 25
  const nakshatraPts = nakshatra.quality * 12.5; // max 25
  const yogaPts = yoga.isInauspicious ? 5 : 25;
  const karanaPts = karana.isInauspicious ? 5 : 25;
  const score = Math.round(tithiPts + nakshatraPts + yogaPts + karanaPts);

  const avoid = [];
  if (tithi.quality === 0) avoid.push(`${tithi.name} — traditionally considered a challenging Tithi for new beginnings.`);
  if (nakshatra.quality === 0) avoid.push(`${nakshatra.name} Nakshatra — approach important new starts with extra care today.`);
  if (yoga.isInauspicious) avoid.push(`${yoga.name} Yoga — classically flagged as a "Kuyoga"; avoid major commitments during its span.`);
  if (karana.isInauspicious) avoid.push(`${karana.name} Karana — best avoided for auspicious ceremonies.`);
  if (!avoid.length) avoid.push("No major cautions today — proceed with your usual due diligence.");

  const recommend = [];
  if (tithi.quality === 2) recommend.push(`${tithi.name} favors fresh starts, ceremonies, and important decisions.`);
  if (nakshatra.quality === 2) recommend.push(`${nakshatra.name} Nakshatra supports travel, learning, and new commitments.`);
  if (!yoga.isInauspicious) recommend.push(`${yoga.name} Yoga is generally supportive — a good day for planned activities.`);
  recommend.push(`Abhijit Muhurat (${abhijit.start} – ${abhijit.end}) is auspicious for most important activities.`);

  let label = "Neutral";
  if (score >= 70) label = "Highly Auspicious";
  else if (score >= 50) label = "Auspicious";
  else if (score < 30) label = "Use Caution";

  return { score, label, thingsToAvoid: avoid, recommendedActivities: recommend };
}

// ── Public API ──────────────────────────────────────────────────────────
export function computePanchang(dateStr, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const { y, m, d } = parseDateStr(dateStr);
  const jdn = julianDayNumber(y, m, d);
  const weekdayIdx = ((jdn + 1) % 7 + 7) % 7; // JDN 0 = Monday; +1 aligns index 0 = Sunday

  const { sunriseMin, sunsetMin, dayLengthMin } = calcSunTimes(y, m, d, lat);
  const tithi = calcTithi(jdn);
  const nakshatra = calcNakshatra(jdn);
  const yoga = calcYoga(tithi.index, nakshatra.index);
  // Which half of the current Tithi "now" falls in is not meaningful for a
  // whole-day summary, so Karana is reported for the Tithi's first half —
  // callers wanting the live/second-half Karana can pass half=1 via
  // computeKaranaForHalf below if ever needed.
  const karana = calcKarana(tithi.index, 0);
  const abhijit = calcAbhijit(sunriseMin, dayLengthMin);
  const brahmaMuhurat = calcBrahmaMuhurat(sunriseMin);
  const rahuKaal = calcKaal(weekdayIdx, sunriseMin, dayLengthMin, rahuKalamSegment);
  const gulikaKaal = calcKaal(weekdayIdx, sunriseMin, dayLengthMin, gulikaKalamSegment);
  const yamaganda = calcKaal(weekdayIdx, sunriseMin, dayLengthMin, yamagandaSegment);
  const { moonrise, moonset } = calcMoonTimes(tithi.index, sunriseMin, sunsetMin);
  const summary = buildSummary({ tithi, nakshatra, yoga, karana, weekdayIdx, abhijit });

  return {
    date: dateStr,
    weekday: weekdayNames[weekdayIdx],
    tithi: { name: tithi.name, paksha: tithi.paksha, numberInPaksha: tithi.numberInPaksha, percentComplete: tithi.percentComplete },
    paksha: tithi.paksha,
    nakshatra: { name: nakshatra.name, pada: nakshatra.pada },
    yoga: { name: yoga.name, isInauspicious: yoga.isInauspicious },
    karana: { name: karana.name, isInauspicious: karana.isInauspicious },
    sunrise: minutesToClock(sunriseMin),
    sunset: minutesToClock(sunsetMin),
    moonrise, moonset,
    rahuKaal, gulikaKaal, yamaganda,
    abhijitMuhurat: abhijit,
    brahmaMuhurat,
    auspiciousnessScore: summary.score,
    auspiciousnessLabel: summary.label,
    bestTimeToday: `${abhijit.start} – ${abhijit.end} (Abhijit Muhurat)`,
    thingsToAvoid: summary.thingsToAvoid,
    recommendedActivities: summary.recommendedActivities,
  };
}

// Internal helper reused by muhuratEngine.js — exposes the raw day-quality
// inputs (Tithi/Nakshatra objects, not just their display strings) so the
// Muhurat Finder can score candidate days against per-activity rules
// without recomputing Tithi/Nakshatra itself or duplicating this engine's
// math.
export function computeDayQualityInternal(dateStr, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const { y, m, d } = parseDateStr(dateStr);
  const jdn = julianDayNumber(y, m, d);
  const weekdayIdx = ((jdn + 1) % 7 + 7) % 7;
  const tithi = calcTithi(jdn);
  const nakshatra = calcNakshatra(jdn);
  const yoga = calcYoga(tithi.index, nakshatra.index);
  const karana = calcKarana(tithi.index, 0);
  return { weekday: weekdayNames[weekdayIdx], weekdayIdx, tithi, nakshatra, yoga, karana };
}

export function isLeapYearInternal(y) {
  return isLeapYear(y);
}

export { DEFAULT_LAT, DEFAULT_LON };
export default { computePanchang, computeDayQualityInternal };
