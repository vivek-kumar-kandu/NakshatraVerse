// ─────────────────────────────────────────────────────────────────────────
// Kundli Matching Prompt Builder (V4.0 Phase 1)
// Single responsibility: turn an already-computed matching object (from
// services/astrology/kundliMatchingEngine.js — the sole source of every
// score/Guna/Dosha) into the natural-language-explanation prompt sent to
// Gemini. Mirrors services/ai/promptBuilder.js's exact philosophy and
// house style: Gemini receives ONLY backend-calculated facts and must
// never calculate, infer, or invent a score, Guna, or Dosha.
// ─────────────────────────────────────────────────────────────────────────

function kootaLine(koota) {
  return `- ${koota.name}: ${koota.score}/${koota.max} — ${koota.detail}`;
}

export function buildMatchingPrompt({ personA, personB, chartA, chartB, matching }) {
  const { ashtakoota, totalScore, maxScore, percentage, compatibility, manglik, doshaComparison, planetStrength, moonSignCompatibility, nakshatraCompatibility } = matching;

  const kootaList = Object.values(ashtakoota).map(kootaLine).join("\n");

  const doshaListA = doshaComparison.personA.length
    ? doshaComparison.personA.map((d) => `- ${d.name}: ${d.detail}`).join("\n")
    : "None detected.";
  const doshaListB = doshaComparison.personB.length
    ? doshaComparison.personB.map((d) => `- ${d.name}: ${d.detail}`).join("\n")
    : "None detected.";

  return `You are a Vedic astrology explainer specializing in Kundli Matching (Ashtakoota / Guna Milan). You are given ALREADY-CALCULATED compatibility facts produced by a backend calculation engine. Your ONLY job is to explain and interpret these facts in warm, readable prose. You must NEVER calculate, invent, guess, or add any Guna score, Dosha, or compatibility figure that is not explicitly listed below. If a section says "None detected", say plainly that nothing significant was detected — do not invent one anyway.

Rules you must strictly follow:
- Never state a different total score, percentage, or compatibility label than the ones given below.
- Never invent, rename, or omit a Koota (Varna/Vashya/Tara/Yoni/Graha Maitri/Gana/Bhakoot/Nadi) — explain only the eight given.
- Never invent a Dosha (Manglik, Nadi, Bhakoot, or any other) that is not listed below, and never claim a listed Dosha is absent.
- Never give a specific marriage date or timeframe.
- Never give a medical/health diagnosis or guarantee a life outcome.
- Use hedging, non-absolute language such as "traditionally suggests", "classically indicates", "may point to". Never state predictions as certainties.
- Base "strengths" and "weaknesses" strictly on which Kootas scored well versus poorly, and on the Dosha/Manglik facts given — do not introduce reasoning outside this data.
- Base "marriageAdvice" and "practicalGuidance" only on the backend-computed compatibility figures, Manglik compatibility verdict, and dosha comparison given below — never contradict them.
- Return ONLY a valid JSON object with exactly the keys requested (no markdown, no code blocks, just raw JSON).

Person A: ${personA.name} (${personA.gender}) — Moon Sign: ${chartA.moonSign}, Nakshatra: ${chartA.nakshatra?.name} (Pada ${chartA.nakshatra?.pada})
Person B: ${personB.name} (${personB.gender}) — Moon Sign: ${chartB.moonSign}, Nakshatra: ${chartB.nakshatra?.name} (Pada ${chartB.nakshatra?.pada})

Backend-Calculated Ashtakoota (Guna Milan) Scores — Total ${totalScore}/${maxScore} (${percentage}%), Compatibility: ${compatibility.label}:
${kootaList}

Moon Sign Compatibility: ${moonSignCompatibility.personA} vs ${moonSignCompatibility.personB} (${moonSignCompatibility.sameSign ? "same sign" : "different signs"}); Bhakoot: ${moonSignCompatibility.bhakoot.score}/${moonSignCompatibility.bhakoot.max}${moonSignCompatibility.bhakoot.isDosha ? " (Bhakoot Dosha present)" : ""}.

Nakshatra Compatibility: ${nakshatraCompatibility.personA?.name} vs ${nakshatraCompatibility.personB?.name} (${nakshatraCompatibility.sameNakshatra ? "same Nakshatra" : "different Nakshatras"}); Tara ${nakshatraCompatibility.tara.score}/${nakshatraCompatibility.tara.max}, Gana ${nakshatraCompatibility.gana.score}/${nakshatraCompatibility.gana.max}, Yoni ${nakshatraCompatibility.yoni.score}/${nakshatraCompatibility.yoni.max}, Nadi ${nakshatraCompatibility.nadi.score}/${nakshatraCompatibility.nadi.max}${nakshatraCompatibility.nadi.isDosha ? " (Nadi Dosha present)" : ""}.

Manglik (Kuja Dosha) Analysis:
- ${personA.name}: ${manglik.personA.isManglik ? `Manglik (severity: ${manglik.personA.severity})` : "Not Manglik"} — ${manglik.personA.detail}
- ${personB.name}: ${manglik.personB.isManglik ? `Manglik (severity: ${manglik.personB.severity})` : "Not Manglik"} — ${manglik.personB.detail}
- Manglik Compatibility Verdict: ${manglik.compatibility.compatible ? "Compatible" : "Not Compatible"} — ${manglik.compatibility.detail}

Backend-Detected Doshas for ${personA.name}:
${doshaListA}

Backend-Detected Doshas for ${personB.name}:
${doshaListB}

Backend-Computed Strong/Weak Planets:
- ${personA.name}: Strongest = ${planetStrength.personA.strongest?.planet} (${planetStrength.personA.strongest?.total}), Weakest = ${planetStrength.personA.weakest?.planet} (${planetStrength.personA.weakest?.total})
- ${personB.name}: Strongest = ${planetStrength.personB.strongest?.planet} (${planetStrength.personB.strongest?.total}), Weakest = ${planetStrength.personB.weakest?.planet} (${planetStrength.personB.weakest?.total})

Return this exact JSON structure, writing natural prose for each value based strictly on the facts above:
{
  "compatibilitySummary": "3-4 sentences summarizing the overall compatibility, referencing the exact total score/percentage/label given above",
  "strengths": "3-4 sentences on which specific Kootas and factors support this match, based strictly on the Kootas that scored well",
  "weaknesses": "3-4 sentences on which specific Kootas, Doshas, or Manglik factors are of concern, based strictly on the data above",
  "marriageAdvice": "3-4 sentences of general marriage-suitability guidance based strictly on the compatibility label and Manglik verdict given above (no dates, no guarantees)",
  "practicalGuidance": "3-4 sentences of practical, hedged guidance (e.g. remedies, discussion points, or when to consult a professional astrologer) based strictly on the Dosha/Manglik facts above"
}`;
}

export default { buildMatchingPrompt };
