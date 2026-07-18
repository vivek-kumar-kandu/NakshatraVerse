// ─────────────────────────────────────────────────────────────────────────
// Kundli Matching Engine (V4.0 Phase 1 — Professional Kundli Matching)
//
// Single responsibility: given two already-computed birth charts (each
// produced by the existing, unmodified birthChartEngine.computeChart()),
// calculate a complete Vedic Ashtakoota (Guna Milan) compatibility report
// plus the additional professional checks requested — Manglik analysis
// and compatibility, dosha comparison, strong/weak planet comparison,
// Moon-sign compatibility, and Nakshatra compatibility.
//
// This module NEVER calls Gemini and NEVER re-derives planetary positions
// itself — every fact it uses comes from:
//   - computeChart() (Moon sign / Nakshatra / doshas — completely reused)
//   - detectAdvancedDoshas() (Manglik severity — completely reused)
//   - calcPlanetStrength() (Shadbala totals — completely reused, same
//     function the existing PDF report already calls)
// New reference tables (Varna/Vashya/Yoni/Gana/Graha-Maitri/Bhakoot/Nadi
// scoring) live in rules/kundliMatching.json and are read the same
// config-driven way every other rule file in this codebase is (via
// ruleLoader.js), following doshaRuleEvaluator.js's exact pattern.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "../rules/ruleLoader.js";
import { SIGN_NAMES, SIGN_LORD, NAKSHATRAS } from "./constants.js";
import { detectAdvancedDoshas } from "./advancedDoshaEngine.js";
import { calcPlanetStrength } from "./planetStrengthEngine.js";

function round1(n) {
  return Math.round(n * 10) / 10;
}

// ── Groom/Bride resolution ──────────────────────────────────────────────
// Several Ashtakoota kootas (Varna, Gana, Bhakoot) are classically
// asymmetric — computed from groom -> bride, not simply "person A -> person
// B". Gender is used to resolve which supplied person is which; if genders
// are equal, unspecified, or otherwise ambiguous, person A is treated as
// the reference ("groom" row) and person B as the target ("bride" column)
// — an explicit, documented default rather than a silent guess.
function resolveGroomBride(personA, personB) {
  const genderA = String(personA?.gender || "").trim().toLowerCase();
  const genderB = String(personB?.gender || "").trim().toLowerCase();
  if (genderA === "male" && genderB === "female") return { groomKey: "personA", brideKey: "personB", assumed: false };
  if (genderA === "female" && genderB === "male") return { groomKey: "personB", brideKey: "personA", assumed: false };
  return { groomKey: "personA", brideKey: "personB", assumed: true };
}

// ── Individual Nakshatra/Moon-sign facts, read straight off the chart ───
function personFacts(chart, nakshatraProfileData) {
  const nakIndex = NAKSHATRAS.indexOf(chart.nakshatra?.name);
  const profile = nakshatraProfileData.find((n) => n.name === chart.nakshatra?.name) || {};
  return {
    moonSign: chart.moonSign,
    nakshatra: chart.nakshatra?.name,
    pada: chart.nakshatra?.pada,
    nakshatraIndex: nakIndex, // 0-26
    gana: profile.gana,
    yoni: profile.yoni,
    nadi: profile.nadi,
    signLord: SIGN_LORD[chart.moonSign],
  };
}

// ── 1. Varna Koota (max 1) ───────────────────────────────────────────────
function calcVarnaKoota(groomFacts, brideFacts, rules) {
  const groomVarna = rules.bySign[groomFacts.moonSign];
  const brideVarna = rules.bySign[brideFacts.moonSign];
  const groomRank = rules.rank[groomVarna] ?? 0;
  const brideRank = rules.rank[brideVarna] ?? 0;
  const score = groomRank >= brideRank ? rules.maxPoints : 0;
  return {
    name: "Varna",
    score,
    max: rules.maxPoints,
    groomVarna,
    brideVarna,
    detail: `Groom's Moon sign (${groomFacts.moonSign}) carries ${groomVarna} Varna; bride's Moon sign (${brideFacts.moonSign}) carries ${brideVarna} Varna. ${
      score ? "The groom's Varna rank meets or exceeds the bride's, so full points are awarded." : "The bride's Varna rank exceeds the groom's, traditionally associated with reduced ego/spiritual compatibility."
    }`,
  };
}

// ── 2. Vashya Koota (max 2) ──────────────────────────────────────────────
function calcVashyaKoota(groomFacts, brideFacts, rules) {
  const groomGroup = rules.groupBySign[groomFacts.moonSign];
  const brideGroup = rules.groupBySign[brideFacts.moonSign];
  const score = rules.matrix?.[groomGroup]?.[brideGroup] ?? 0;
  return {
    name: "Vashya",
    score,
    max: rules.maxPoints,
    groomGroup,
    brideGroup,
    detail: `Groom's Moon sign belongs to the ${groomGroup} Vashya group; bride's to ${brideGroup}. This combination traditionally scores ${score} of ${rules.maxPoints} points for mutual attraction/control.`,
  };
}

// ── 3. Tara Koota (max 3) ────────────────────────────────────────────────
function taraNumber(fromIndex, toIndex) {
  // Count inclusively from `fromIndex` to `toIndex` (0-based), wrapping
  // through 27 Nakshatras, then reduce mod 9 (the classical 9-fold Tara
  // cycle), mapping a 0 remainder to 9.
  const count = ((toIndex - fromIndex + 27) % 27) + 1;
  const mod = count % 9;
  return mod === 0 ? 9 : mod;
}

function calcTaraKoota(groomFacts, brideFacts, rules) {
  const groomToBride = taraNumber(groomFacts.nakshatraIndex, brideFacts.nakshatraIndex);
  const brideToGroom = taraNumber(brideFacts.nakshatraIndex, groomFacts.nakshatraIndex);
  const inauspicious = new Set(rules.inauspiciousTaraNumbers);
  const p1 = inauspicious.has(groomToBride) ? 0 : rules.pointsPerDirection;
  const p2 = inauspicious.has(brideToGroom) ? 0 : rules.pointsPerDirection;
  const score = round1(p1 + p2);
  return {
    name: "Tara",
    score,
    max: rules.maxPoints,
    groomToBrideTara: groomToBride,
    brideToGroomTara: brideToGroom,
    detail: `Counting groom-to-bride Nakshatra gives Tara ${groomToBride}${inauspicious.has(groomToBride) ? " (inauspicious)" : ""}; bride-to-groom gives Tara ${brideToGroom}${inauspicious.has(brideToGroom) ? " (inauspicious)" : ""}.`,
  };
}

// ── 4. Yoni Koota (max 4) ────────────────────────────────────────────────
function calcYoniKoota(groomFacts, brideFacts, rules) {
  const a = groomFacts.yoni, b = brideFacts.yoni;
  let relation = "neutral";
  if (a && b && a === b) relation = "same";
  else if (rules.enemyPairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) relation = "enemy";
  const score = rules.scores[relation];
  return {
    name: "Yoni",
    score,
    max: rules.maxPoints,
    groomYoni: a,
    brideYoni: b,
    relation,
    detail: `Groom's Yoni (${a || "—"}) and bride's Yoni (${b || "—"}) are classified as "${relation}", scoring ${score} of ${rules.maxPoints}.`,
  };
}

// ── 5. Graha Maitri Koota (max 5) ────────────────────────────────────────
function classifyFriendship(table, fromPlanet, toPlanet) {
  if (fromPlanet === toPlanet) return "self";
  const rel = table[fromPlanet];
  if (rel?.friends?.includes(toPlanet)) return "friend";
  if (rel?.enemies?.includes(toPlanet)) return "enemy";
  return "neutral";
}

function calcGrahaMaitriKoota(groomFacts, brideFacts, rules) {
  const table = loadRules("planetaryFriendship");
  const lordA = groomFacts.signLord, lordB = brideFacts.signLord;

  if (!lordA || !lordB) {
    return { name: "Graha Maitri", score: 0, max: rules.maxPoints, detail: "Sign lord could not be resolved." };
  }
  if (lordA === lordB) {
    return {
      name: "Graha Maitri",
      score: rules.sameLordPoints,
      max: rules.maxPoints,
      groomLord: lordA,
      brideLord: lordB,
      detail: `Both Moon signs share the same lord (${lordA}), the maximum possible planetary friendship.`,
    };
  }

  const relAtoB = classifyFriendship(table, lordA, lordB);
  const relBtoA = classifyFriendship(table, lordB, lordA);
  const key = [relAtoB, relBtoA].sort().join("+");
  const score = rules.combinedScores[key] ?? rules.combinedScores["neutral+neutral"];
  return {
    name: "Graha Maitri",
    score,
    max: rules.maxPoints,
    groomLord: lordA,
    brideLord: lordB,
    detail: `Groom's Moon-sign lord ${lordA} is ${relAtoB} to bride's lord ${lordB}, and ${lordB} is ${relBtoA} to ${lordA} — combined relation scores ${score} of ${rules.maxPoints}.`,
  };
}

// ── 6. Gana Koota (max 6) ────────────────────────────────────────────────
function calcGanaKoota(groomFacts, brideFacts, rules) {
  const g = groomFacts.gana, b = brideFacts.gana;
  const score = rules.matrix?.[g]?.[b] ?? 0;
  return {
    name: "Gana",
    score,
    max: rules.maxPoints,
    groomGana: g,
    brideGana: b,
    detail: `Groom's Gana (${g || "—"}) paired with bride's Gana (${b || "—"}) scores ${score} of ${rules.maxPoints} for temperament compatibility.`,
  };
}

// ── 7. Bhakoot Koota (max 7) ─────────────────────────────────────────────
function calcBhakootKoota(groomFacts, brideFacts, rules) {
  const groomIdx = SIGN_NAMES.indexOf(groomFacts.moonSign);
  const brideIdx = SIGN_NAMES.indexOf(brideFacts.moonSign);
  if (groomIdx < 0 || brideIdx < 0) {
    return { name: "Bhakoot", score: 0, max: rules.maxPoints, detail: "Moon sign could not be resolved." };
  }
  const distance = ((brideIdx - groomIdx + 12) % 12) + 1; // 1-12, groom's own sign = 1
  const isDosha = rules.doshaDistances.includes(distance);
  const score = isDosha ? 0 : rules.maxPoints;
  return {
    name: "Bhakoot",
    score,
    max: rules.maxPoints,
    distance,
    isDosha,
    detail: isDosha
      ? `The bride's Moon sign falls ${distance} positions from the groom's, a classical Bhakoot Dosha (Shadashtak/Navapancham/Dwirdwadash) configuration.`
      : `The bride's Moon sign falls ${distance} positions from the groom's — no Bhakoot Dosha configuration; full points awarded.`,
  };
}

// ── 8. Nadi Koota (max 8) ────────────────────────────────────────────────
function calcNadiKoota(groomFacts, brideFacts, rules) {
  const same = Boolean(groomFacts.nadi) && groomFacts.nadi === brideFacts.nadi;
  const score = same ? rules.scores.same : rules.scores.different;
  return {
    name: "Nadi",
    score,
    max: rules.maxPoints,
    groomNadi: groomFacts.nadi,
    brideNadi: brideFacts.nadi,
    isDosha: same,
    detail: same
      ? `Both partners share the same Nadi (${groomFacts.nadi}) — classical Nadi Dosha, traditionally the most significant of the eight Kootas.`
      : `Groom's Nadi (${groomFacts.nadi || "—"}) differs from bride's Nadi (${brideFacts.nadi || "—"}) — no Nadi Dosha; full points awarded.`,
  };
}

// ── Manglik (Kuja Dosha) — reuses the existing Advanced Dosha Engine ────
// exactly as-is (services/astrology/advancedDoshaEngine.js), which itself
// reuses the same manglikHouses houseGroup as the base doshas.json rule.
// No Manglik detection logic is duplicated here.
function manglikStatus(chart) {
  const advanced = detectAdvancedDoshas(chart.planetary, chart.lagna);
  const entry = advanced.find((d) => d.name === "Manglik Dosha (Detailed)");
  return {
    isManglik: Boolean(entry),
    severity: entry?.severity || null,
    detail: entry?.detail || "No Manglik (Mangal) Dosha configuration was detected in this chart.",
  };
}

function manglikCompatibility(statusA, statusB) {
  if (statusA.isManglik === statusB.isManglik) {
    return {
      compatible: true,
      detail: statusA.isManglik
        ? "Both partners are Manglik — classically considered compatible, since a shared Manglik status is traditionally understood to cancel the individual effect."
        : "Neither partner is Manglik, so Manglik Dosha is not a compatibility concern for this pairing.",
    };
  }
  return {
    compatible: false,
    detail: "Only one partner is Manglik. Classical texts generally advise remedial measures (or consultation with a knowledgeable astrologer) before proceeding, though a mild-severity Manglik Dosha (see each partner's severity above) is traditionally considered easier to reconcile.",
  };
}

// ── Major dosha comparison — reuses the SAME dosha lists the individual
// report already computes (chart.doshas, from the unmodified base Dosha
// Detection Engine) plus the Advanced Dosha Engine, exactly as
// birthChartEngine.js's own internal pipeline does.
function doshaComparison(chartA, chartB) {
  const advancedA = detectAdvancedDoshas(chartA.planetary, chartA.lagna);
  const advancedB = detectAdvancedDoshas(chartB.planetary, chartB.lagna);
  return {
    personA: [...chartA.doshas, ...advancedA],
    personB: [...chartB.doshas, ...advancedB],
  };
}

// ── Strong/weak planet comparison — reuses the existing, unmodified
// Planet Strength Engine (the exact same function the PDF report already
// calls) rather than deriving strength independently.
function planetStrengthSummary(chart, userData) {
  const strength = calcPlanetStrength(chart.planetary, chart.lagna, userData.dob, userData.tob);
  const entries = Object.entries(strength).map(([planet, s]) => ({
    planet,
    total: s?.shadbala?.total ?? 0,
    dignity: s?.dignity?.label || s?.dignity?.state || null,
  }));
  entries.sort((a, b) => b.total - a.total);
  return {
    strongest: entries[0] || null,
    weakest: entries[entries.length - 1] || null,
    all: entries,
  };
}

export function computeMatching({ chartA, chartB, personA, personB }) {
  const rules = loadRules("kundliMatching");
  const nakshatraProfileData = loadRules("nakshatraProfile").nakshatras;

  const { groomKey, brideKey, assumed } = resolveGroomBride(personA, personB);
  const chartsByKey = { personA: chartA, personB: chartB };
  const groomChart = chartsByKey[groomKey];
  const brideChart = chartsByKey[brideKey];

  const groomFacts = personFacts(groomChart, nakshatraProfileData);
  const brideFacts = personFacts(brideChart, nakshatraProfileData);

  const varna = calcVarnaKoota(groomFacts, brideFacts, rules.varna);
  const vashya = calcVashyaKoota(groomFacts, brideFacts, rules.vashya);
  const tara = calcTaraKoota(groomFacts, brideFacts, rules.tara);
  const yoni = calcYoniKoota(groomFacts, brideFacts, rules.yoni);
  const grahaMaitri = calcGrahaMaitriKoota(groomFacts, brideFacts, rules.grahaMaitri);
  const gana = calcGanaKoota(groomFacts, brideFacts, rules.gana);
  const bhakoot = calcBhakootKoota(groomFacts, brideFacts, rules.bhakoot);
  const nadi = calcNadiKoota(groomFacts, brideFacts, rules.nadi);

  const kootas = [varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, nadi];
  const totalScore = round1(kootas.reduce((sum, k) => sum + k.score, 0));
  const maxScore = rules.totalMaxPoints;
  const percentage = round1((totalScore / maxScore) * 100);

  let band = rules.compatibilityBands[rules.compatibilityBands.length - 1];
  for (const b of rules.compatibilityBands) {
    if (totalScore >= b.min) { band = b; break; }
  }

  const manglikA = manglikStatus(chartA);
  const manglikB = manglikStatus(chartB);

  return {
    groom: groomKey,
    bride: brideKey,
    groomBrideAssumed: assumed,
    ashtakoota: { varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, nadi },
    totalScore,
    maxScore,
    percentage,
    compatibility: { label: band.label, color: band.color },
    manglik: {
      personA: manglikA,
      personB: manglikB,
      compatibility: manglikCompatibility(manglikA, manglikB),
    },
    doshaComparison: doshaComparison(chartA, chartB),
    planetStrength: {
      personA: planetStrengthSummary(chartA, chartA.userData),
      personB: planetStrengthSummary(chartB, chartB.userData),
    },
    moonSignCompatibility: {
      personA: chartA.moonSign,
      personB: chartB.moonSign,
      sameSign: chartA.moonSign === chartB.moonSign,
      bhakoot,
    },
    nakshatraCompatibility: {
      personA: chartA.nakshatra,
      personB: chartB.nakshatra,
      sameNakshatra: chartA.nakshatra?.name === chartB.nakshatra?.name,
      tara,
      gana,
      yoni,
      nadi,
    },
  };
}

export default { computeMatching };
