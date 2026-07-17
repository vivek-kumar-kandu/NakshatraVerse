// ─────────────────────────────────────────────────────────────────────────
// Prompt Builder
// Single responsibility: turn an already-computed, authoritative chart
// object into the natural-language-explanation prompt sent to Gemini.
// Gemini receives ONLY these backend-calculated facts and must never
// calculate, infer, or invent new positions, houses, yogas, doshas,
// remedies, or (as of V2.0 Phase 7) predictions. Prompt text is unchanged
// from the original server.js buildPrompt except for the additive
// Phase 7 prediction/transit-forecast lines in the structured insights
// section below — the mandatory output JSON schema is untouched.
// ─────────────────────────────────────────────────────────────────────────

// Priority 3.2 — "AI Report Intelligence". `insights` is OPTIONAL and
// additive: any existing caller invoking buildPrompt(chart) with a single
// argument gets the exact same prompt text as before (insights defaults to
// null and the whole block below is skipped). When provided (see
// structuredInsightsEngine.js), this renders as one extra, clearly-labeled
// section giving Gemini richer "why" context — which planets/yogas/doshas/
// strengths contributed — while the mandatory output JSON schema at the
// bottom of the prompt is completely unchanged, so the response shape
// returned to the frontend never changes.
function buildStructuredInsightsSection(insights) {
  if (!insights) return "";

  const { nakshatraProfile, dasha, transits, contributingFactors, predictions, transitForecast } = insights;

  const transitList = transits?.length
    ? transits.map((t) => `- ${t.planet} transiting ${t.transitSign} (house ${t.houseFromMoon ?? "?"} from Moon): ${t.effect}`).join("\n")
    : "Not available.";
  const dashaSummary = dasha?.available
    ? `Current Mahadasha: ${dasha.currentMahadasha?.lord} (until ${dasha.currentMahadasha?.endDate}); Current Antardasha: ${dasha.currentAntardasha?.lord} (until ${dasha.currentAntardasha?.endDate}). Previous Mahadasha: ${dasha.previousMahadasha?.lord ?? "none"}; Next Mahadasha: ${dasha.nextMahadasha?.lord ?? "none"}.`
    : "Not available.";

  // V2.0 Phase 7 (Prediction Engine): the backend has ALREADY computed a
  // confidence-scored, remedy-attached prediction for every one of the 7
  // required life-area categories (predictionEngine.js), using only Dasha/
  // Antardasha, Planet Strength, and already-detected yogas/doshas. Gemini
  // is given the finished verdict/confidence/remedies for each — its job
  // when writing career/finance/marriage/health below is to weave these
  // specific backend conclusions into natural prose, never to reach a
  // different conclusion or invent a prediction this list doesn't contain.
  // V2.0 Phase 7.2B (Nakshatra Profile Intelligence): each prediction line
  // now also carries its already-computed Profile Alignment Score and
  // Profile Summary (predictionRuleEvaluator.js#evaluatePrediction via
  // profileAlignmentRuleEvaluator.js) — additive text only, inside this
  // same additive "Additional Backend-Computed Structured Insight Data"
  // section. The mandatory output JSON schema at the bottom of the prompt
  // is unchanged; Gemini is only ever given more already-finalized backend
  // reasoning to explain, never asked to compute anything new with it.
  const predictionList = predictions?.length
    ? predictions.map((p) =>
        `- ${p.category} (Dasha: ${p.dasha ?? "?"}, Antardasha: ${p.antardasha ?? "?"}, Dominant Planet: ${p.planet ?? "?"}, Confidence: ${p.confidence?.label ?? "?"} [${p.confidence?.score ?? "?"}/100], Profile Alignment: ${p.profileAlignmentScore ?? "?"}/100): ${p.prediction} Profile reasoning: ${p.profileSummary ?? "Not available."}`
      ).join("\n")
    : "Not available.";

  const transitForecastSummary = transitForecast
    ? [
        transitForecast.saturn ? `Saturn Transit: ${transitForecast.saturn.transitSign} (house ${transitForecast.saturn.houseFromMoon ?? "?"} from Moon) — ${transitForecast.saturn.effect}` : null,
        transitForecast.jupiter ? `Jupiter Transit: ${transitForecast.jupiter.transitSign} (house ${transitForecast.jupiter.houseFromMoon ?? "?"} from Moon) — ${transitForecast.jupiter.effect}` : null,
        transitForecast.rahuKetu?.length ? `Rahu-Ketu Axis Transit: ${transitForecast.rahuKetu.map((t) => `${t.planet} in house ${t.houseFromMoon ?? "?"} from Moon`).join(", ")}` : null,
      ].filter(Boolean).join("\n") || "Not available."
    : "Not available.";

  return `

Additional Backend-Computed Structured Insight Data (authoritative, explanation-only — use this ONLY to explain WHY the facts above matter; do not calculate, invent, or contradict anything with it):
- Nakshatra Profile: Lord=${nakshatraProfile?.lord}, Gana=${nakshatraProfile?.gana}, Yoni=${nakshatraProfile?.yoni}, Nadi=${nakshatraProfile?.nadi}, Symbol=${nakshatraProfile?.symbol}, Deity=${nakshatraProfile?.deity}, Nature=${nakshatraProfile?.nature}.
- Vimshottari Dasha: ${dashaSummary}
- Current Transits (Gochar) vs. Natal Moon:
${transitList}
- Transit Forecast (Saturn / Jupiter / Rahu-Ketu axis):
${transitForecastSummary}
- Backend-Computed Predictions (already-finalized verdict per life area — explain these exact conclusions, do not recompute or contradict them):
${predictionList}
- Contributing factors summary (planets/yogas/doshas/strengths behind this reading): ${JSON.stringify(contributingFactors)}
`;
}

export function buildPrompt(chart, insights = null) {
  const { userData, planetary, numerology, lagna, moonSign, sunSign, nakshatra, yogas, doshas, remedies } = chart;

  // Single authoritative list: base-engine yogas/doshas PLUS advanced-engine
  // yogas/doshas (insights.advancedYogas / insights.advancedDoshas), so the
  // "yogas"/"doshas" output keys below and every other free-text field
  // (career, marriage, lifeSummary, etc.) are scoped to the exact same set
  // of backend-confirmed facts. Previously advanced yogas/doshas only
  // appeared in a separate "Additional Detected" section that wasn't part
  // of what the yogas/doshas keys were told they could mention — that gap
  // is what let Gemini reference e.g. Lakshmi Yoga or Viparita Raja Yoga in
  // the life summary while the dedicated Yogas tab said "none detected".
  const allYogas = [...yogas, ...(insights?.advancedYogas || [])];
  const allDoshas = [...doshas, ...(insights?.advancedDoshas || [])];

  const yogaList = allYogas.length
    ? allYogas.map((y) => `- ${y.name}: ${y.detail}`).join("\n")
    : "None detected.";
  const doshaList = allDoshas.length
    ? allDoshas.map((d) => `- ${d.name}: ${d.detail}`).join("\n")
    : "None detected.";
  const remedyList = remedies.length
    ? remedies.map((r) => `- ${r.type}: ${r.detail}`).join("\n")
    : "None.";
  const structuredInsightsSection = buildStructuredInsightsSection(insights);

  return `You are a Vedic astrology explainer. You are given ALREADY-CALCULATED astrological facts produced by a backend calculation engine. Your ONLY job is to explain and interpret these facts in warm, readable prose. You must NEVER calculate, invent, guess, or add any planetary position, house, yoga, dosha, or remedy that is not explicitly listed below. If a section below says "None detected" or "None", you must say plainly that nothing significant was detected — do not invent one anyway.

Rules you must strictly follow:
- Use hedging, non-absolute language such as "may indicate", "suggests", "traditionally associated with", "could signify". Never state predictions as certain facts.
- Never give a specific marriage date, age, or timeframe. Only describe general relationship/partnership themes.
- Never give a specific career timing, income figure, or wealth guarantee.
- Never give a medical/health diagnosis. Only describe traditional astrological associations, and note this is not medical advice.
- Do not add any yoga, dosha, or remedy beyond what is listed below.
- If backend-computed predictions are provided below, you must base career/finance/marriage/health strictly on those specific conclusions (their dasha, dominant planet, and stated direction) — never state a different outlook than the one already computed.
- Never calculate astrology yourself — only explain the backend-generated facts and predictions given to you.
- Never infer or mention a Yoga that is not in the Backend-Detected Yogas list above.
- Never invent or mention a Dosha that is not in the Backend-Detected Doshas list above.
- Never invent or mention a Remedy that is not in the Backend-Derived Remedies list above.
- Never invent, shift, or restate a Dasha/Antardasha period other than the ones given in the Vimshottari Dasha and Backend-Computed Predictions data above.
- Never change, soften, inflate, or otherwise modify a backend-computed confidence score or label — if you mention confidence, state it exactly as given.
- Never change, rename, merge, or omit a prediction category — explain each backend-computed prediction under its own given category only.
- Never change a backend-given prediction time period (start/end dates or Dasha/Antardasha window).
- Never contradict a backend-generated result; only explain backend-confirmed information.
- Return ONLY a valid JSON object with exactly these keys (no markdown, no code blocks, just raw JSON).

Birth Data:
- Name: ${userData.name}
- Date of Birth: ${userData.dob}
- Time of Birth: ${userData.tob}
- Place of Birth: ${userData.pob}

Backend-Calculated Astrological Facts (authoritative — do not alter):
- Lagna (Ascendant): ${lagna}
- Moon Sign: ${moonSign}
- Sun Sign: ${sunSign}
- Nakshatra: ${nakshatra.name} (Pada ${nakshatra.pada})
- Mulank (Life Path): ${numerology.mulank}
- Bhagyank (Destiny): ${numerology.bhagyank}
- Planetary Positions (planet: house, sign): ${JSON.stringify(planetary)}

Backend-Detected Yogas:
${yogaList}

Backend-Detected Doshas:
${doshaList}

Backend-Derived Remedies:
${remedyList}
${structuredInsightsSection}
Return this exact JSON structure, writing natural prose for each value based strictly on the facts above:
{
  "loveLife": "3-4 sentences about love and relationships based on the given Venus and Moon positions",
  "career": "3-4 sentences about career and professional life based on the given Saturn, Sun and 10th house placement",
  "finance": "3-4 sentences about financial tendencies based on the given Jupiter and 2nd house placement (no guarantees)",
  "health": "3-4 sentences about general wellness themes based on the given Sun, Mars and 6th house placement (not a diagnosis)",
  "marriage": "3-4 sentences about general relationship/partnership themes based on the given Venus, Jupiter and 7th house placement (no timing claims)",
  "doshas": "2-3 sentences explaining ONLY the backend-detected doshas listed above, or clearly stating none were detected",
  "yogas": "2-3 sentences explaining ONLY the backend-detected yogas listed above, or clearly stating none were detected",
  "remedies": "3-4 sentences explaining ONLY the backend-derived remedies listed above, or clearly stating none are suggested",
  "lifeSummary": "5-6 sentences comprehensive life summary integrating all the facts above, personalized to ${userData.name}, using hedging language throughout"
}`;
}

export default { buildPrompt };
