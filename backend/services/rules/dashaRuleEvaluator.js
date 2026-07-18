// ─────────────────────────────────────────────────────────────────────────
// Vimshottari Dasha Rule Evaluator (Priority 3.2)
// Single responsibility: compute the Vimshottari Mahadasha/Antardasha
// timeline from the birth Nakshatra + precise Moon-longitude proxy, using
// config-driven sequence/duration data (rules/vimshottariDasha.json).
// No hardcoded astrology — sequence, durations, and total cycle length are
// all read from JSON, matching the Rule Engine's config-driven convention.
//
// Like planetaryDegreeEngine.js's degree proxy, the "balance of Dasha at
// birth" is derived from the same deterministic (non-ephemeris) Moon
// longitude used for the birth Nakshatra itself — this is a documented
// foundation-phase approximation, not real ephemeris-based Dasha.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addYears(date, years, daysPerYear) {
  return new Date(date.getTime() + years * daysPerYear * MS_PER_DAY);
}

function nextLord(sequence, lord) {
  const idx = sequence.indexOf(lord);
  return sequence[(idx + 1) % sequence.length];
}

// Fraction (0-1) of the way through the current Nakshatra, derived from the
// same longitude proxy used by planetPositionEngine.calcNakshatra, so the
// "balance of Dasha at birth" is internally consistent with the reported
// Nakshatra/Pada.
function nakshatraElapsedFraction(moonLongitude) {
  const span = 360 / 27;
  const positionInNakshatra = moonLongitude % span;
  return positionInNakshatra / span; // 0 = just entered, 1 = about to leave
}

function buildAntardashas(mahaLord, mahaStart, mahaDurationYears, sequence, durations, daysPerYear) {
  const antardashas = [];
  let cursor = mahaStart;
  let lord = mahaLord;
  for (let i = 0; i < sequence.length; i++) {
    const antarYears = (mahaDurationYears * durations[lord]) / 120;
    const start = cursor;
    const end = addYears(cursor, antarYears, daysPerYear);
    antardashas.push({ lord, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), durationYears: Number(antarYears.toFixed(3)) });
    cursor = end;
    lord = nextLord(sequence, lord);
  }
  return antardashas;
}

/**
 * @param {{name: string, pada: number}} nakshatra - already-computed birth Nakshatra
 * @param {number} moonLongitude - deterministic 0-360 longitude proxy (planetPositionEngine.calcMoonLongitude)
 * @param {string} dob - YYYY-MM-DD birth date
 * @param {Date} [asOf] - reference "current" date for locating the active Mahadasha/Antardasha (defaults to now)
 */
export function evaluateVimshottariDasha(nakshatra, moonLongitude, dob, asOf = new Date()) {
  const { sequence, durations, totalYears, daysPerYear } = loadRules("vimshottariDasha");
  const { nakshatras } = loadRules("nakshatraProfile");

  const profile = nakshatras.find((n) => n.name === nakshatra?.name);
  const startingLord = profile?.lord;
  if (!startingLord || !sequence.includes(startingLord)) {
    return {
      available: false,
      reason: "Could not resolve a Nakshatra lord to anchor the Vimshottari sequence.",
    };
  }

  const birthDate = new Date(`${dob}T00:00:00Z`);
  const elapsedFraction = nakshatraElapsedFraction(moonLongitude);
  const firstLordFullYears = durations[startingLord];
  const firstLordElapsedYears = firstLordFullYears * elapsedFraction;
  const firstLordBalanceYears = firstLordFullYears - firstLordElapsedYears;

  // First (partial) Mahadasha starts "elapsed years" before birth so its
  // remaining balance measured forward from birth is correct.
  const firstMahaStart = addYears(birthDate, -firstLordElapsedYears, daysPerYear);

  const mahadashas = [];
  let cursorLord = startingLord;
  let cursorStart = firstMahaStart;
  let yearsAccountedFor = 0;
  // One full 120-year cycle from the (virtual) start of the first Mahadasha.
  while (yearsAccountedFor < totalYears) {
    const durationYears = durations[cursorLord];
    const start = cursorStart;
    const end = addYears(start, durationYears, daysPerYear);
    mahadashas.push({
      lord: cursorLord,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      durationYears,
      antardashas: buildAntardashas(cursorLord, start, durationYears, sequence, durations, daysPerYear),
    });
    cursorStart = end;
    cursorLord = nextLord(sequence, cursorLord);
    yearsAccountedFor += durationYears;
  }

  const activeIndex = mahadashas.findIndex((md) => asOf >= new Date(md.startDate) && asOf < new Date(md.endDate));
  const active = activeIndex >= 0 ? mahadashas[activeIndex] : mahadashas[mahadashas.length - 1];
  const resolvedActiveIndex = activeIndex >= 0 ? activeIndex : mahadashas.length - 1;
  const activeAntardasha = active
    ? active.antardashas.find((ad) => asOf >= new Date(ad.startDate) && asOf < new Date(ad.endDate)) || active.antardashas[active.antardashas.length - 1]
    : null;

  const remainingMahadashaDays = active ? Math.max(0, (new Date(active.endDate) - asOf) / MS_PER_DAY) : 0;
  const remainingAntardashaDays = activeAntardasha ? Math.max(0, (new Date(activeAntardasha.endDate) - asOf) / MS_PER_DAY) : 0;

  // V2.0 Phase 7 (Prediction Engine): previous/next Mahadasha, derived
  // purely from the mahadashas array already built above — no new
  // calculation, just reading the neighboring entries by index. Every
  // field returned before this point is unchanged from Priority 3.2.
  const summarize = (md) => (md ? { lord: md.lord, startDate: md.startDate, endDate: md.endDate, durationYears: md.durationYears } : null);
  const previousMahadasha = summarize(mahadashas[resolvedActiveIndex - 1] ?? null);
  const nextMahadasha = summarize(mahadashas[resolvedActiveIndex + 1] ?? null);

  return {
    available: true,
    birthBalance: {
      lord: startingLord,
      elapsedYears: Number(firstLordElapsedYears.toFixed(3)),
      balanceYears: Number(firstLordBalanceYears.toFixed(3)),
    },
    previousMahadasha,
    currentMahadasha: active
      ? { lord: active.lord, startDate: active.startDate, endDate: active.endDate, remainingYears: Number((remainingMahadashaDays / daysPerYear).toFixed(3)) }
      : null,
    nextMahadasha,
    currentAntardasha: activeAntardasha
      ? { lord: activeAntardasha.lord, startDate: activeAntardasha.startDate, endDate: activeAntardasha.endDate, remainingYears: Number((remainingAntardashaDays / daysPerYear).toFixed(3)) }
      : null,
    timeline: mahadashas,
  };
}

export default { evaluateVimshottariDasha };
