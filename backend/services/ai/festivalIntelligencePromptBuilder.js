// ─────────────────────────────────────────────────────────────────────────
// Festival Intelligence Prompt Builder (V4.5 Phase 2 — Festival
// Intelligence)
//
// Mirrors festivalPromptBuilder.js's / lifeCoachPromptBuilder.js's exact
// philosophy: Gemini receives ONLY already-backend-computed facts and its
// ONLY job is to turn them into richer, warm, hedged prose/lists. It must
// NEVER calculate, invent, or alter a festival's Date/Type/Importance/
// Vrat status, and (for the personalized prompt) it must NEVER calculate
// or alter a birth chart, Dasha, Transit, or Prediction value — those are
// read from structuredInsightsEngine.js / panchangEngine.js exactly as
// lifeCoachPromptBuilder.js already does, never recomputed here.
//
// Two prompts live in this file:
//   1. buildFestivalIntelligencePrompt — festival-level content that is
//      the same for every user (spiritual meaning, mythological story,
//      modern practical meaning, cultural significance, things to avoid,
//      puja overview). Historical Background, Religious Significance, and
//      Recommended Activities/Rituals are deliberately NOT re-asked for
//      here — festivalEngine.js already provides those fields (see
//      FestivalDetailCard.jsx), and this phase must not duplicate Festival
//      logic.
//   2. buildPersonalizedFestivalPrompt — the same festival facts, plus the
//      user's own already-computed Dasha/Transits/Predictions/Panchang, so
//      Gemini can explain why the festival is meaningful *for this person
//      specifically*. Only ever called when a chart is available.
// ─────────────────────────────────────────────────────────────────────────

function renderFestivalFacts(festival) {
  return `- Name: ${festival.name}
- Date: ${festival.date}${festival.endDate && festival.endDate !== festival.date ? ` to ${festival.endDate}` : ""}
- Type: ${festival.type}
- Importance: ${festival.importance}
- Description: ${festival.description}
- Historical Background (already provided to the user elsewhere — do not repeat verbatim): ${festival.historicalBackground || "Not specified"}
- Religious Significance (already provided to the user elsewhere — do not repeat verbatim): ${festival.religiousSignificance || "Not specified"}
- Recommended Activities (already provided to the user elsewhere): ${(festival.recommendedActivities || []).join("; ") || "Not specified"}
- Rituals (already provided to the user elsewhere): ${(festival.rituals || []).join("; ") || "Not specified"}
- Fasting Information: ${festival.fastingInfo ? `${festival.fastingInfo.isFastObserved ? "Observed" : "Not commonly observed"} — ${festival.fastingInfo.fastType || ""}` : "Not specified"}
- Region: ${(festival.region || []).join("; ") || "Pan-Indian"}`;
}

export function buildFestivalIntelligencePrompt(festival) {
  return `You are a Vedic astrology and Hindu-festival explainer. You are given an ALREADY-CALCULATED festival occurrence produced by a backend calculation engine. Your ONLY job is to add richer context around it in warm, readable prose and short lists. You must NEVER calculate, invent, guess, or alter the Date, Type, or Importance given below, and you must NEVER state a different date for this festival than the one given.

Rules you must strictly follow:
- Never state a different Date, Type, or Importance than the ones given below.
- Do not repeat the Historical Background, Religious Significance, Recommended Activities, or Rituals given below verbatim — the user already sees those elsewhere. Add complementary, non-duplicate context instead.
- Use hedging, non-absolute language such as "traditionally regarded", "classically observed", "many households". Never state claims as absolute historical fact where traditions vary regionally or across sects.
- Never give a medical/health diagnosis (including about fasting) or a financial/legal guarantee.
- "Things To Avoid" must stay at the level of common, widely-known customary observances (e.g. avoiding non-vegetarian food or alcohol on a Vrat day) — never medical, financial, or safety claims.
- Return ONLY a valid JSON object with exactly the keys requested (no markdown, no code blocks, just raw JSON).

Backend-Calculated Festival:
${renderFestivalFacts(festival)}

Return this exact JSON structure, writing natural prose/lists for each value based strictly on the facts above:
{
  "spiritualMeaning": "3-4 sentences on the spiritual/inner meaning of observing this day",
  "mythologicalStory": "A short (4-6 sentence), hedged retelling of the best-known traditional story associated with this occasion — note plainly if versions vary by region or text",
  "modernPracticalMeaning": "2-3 sentences on how this occasion is commonly observed today in a practical, everyday sense (family gatherings, home rituals, community events)",
  "culturalSignificance": "2-3 sentences on the broader cultural/seasonal/scientific-adjacent significance (e.g. seasonal timing, harvest, agricultural or lunar-calendar context) where genuinely applicable — otherwise focus on cultural context alone",
  "thingsToAvoid": ["3-5 short, commonly-cited customary things to avoid on this day"],
  "pujaOverview": "3-5 sentence, hedged, general overview of how the puja/ritual for this day is traditionally structured (not a full step-by-step script) — note that specific family/regional/temple traditions vary"
}`;
}

function renderInsightsForPersonalization(insights) {
  if (!insights) return "Not available.";
  const dasha = insights.dasha?.available
    ? `Current Mahadasha: ${insights.dasha.currentMahadasha?.lord} (until ${insights.dasha.currentMahadasha?.endDate}); Current Antardasha: ${insights.dasha.currentAntardasha?.lord} (until ${insights.dasha.currentAntardasha?.endDate}).`
    : "Not available.";
  const transits = insights.transits?.length
    ? insights.transits.map((t) => `${t.planet}: ${t.transitSign}${t.flags?.length ? ` (${t.flags.map((f) => f.name).join(", ")})` : ""}`).join("; ")
    : "Not available.";
  const predictions = insights.predictions?.length
    ? insights.predictions.map((p) => `- ${p.category} (Confidence: ${p.confidence?.label ?? "?"}): ${p.prediction}`).join("\n")
    : "Not available.";
  return `Dasha: ${dasha}\nTransits: ${transits}\nCategory Predictions:\n${predictions}`;
}

function renderPanchangForPersonalization(panchang) {
  if (!panchang) return "Not available.";
  return `Tithi: ${panchang.tithi?.name}; Nakshatra: ${panchang.nakshatra?.name}; Auspiciousness: ${panchang.auspiciousnessLabel} (${panchang.auspiciousnessScore}/100).`;
}

export function buildPersonalizedFestivalPrompt({ festival, insights, panchang }) {
  return `You are a Vedic astrology explainer producing PERSONALIZED festival guidance for one specific person. A backend calculation engine has ALREADY computed the festival occurrence, this person's Dasha, Transits, category Predictions, and today's Panchang below. Your ONLY job is to connect these already-computed facts into a warm, hedged, personalized explanation of why this festival is meaningful for this person right now. You must NEVER calculate, invent, guess, or alter any Dasha lord, Transit, Prediction, Panchang value, or the festival's Date/Type/Importance.

Rules you must strictly follow:
- Never introduce a planet, house, yoga, dosha, Dasha period, transit, or Panchang value that is not already given below.
- Ground every sentence in at least one of the backend facts given below — do not give generic festival advice unconnected to this person's chart.
- Use hedging, non-absolute language ("may find", "could be a favorable time to", "classically associated with"). Never state predictions as guaranteed outcomes.
- Never give a medical/health diagnosis, financial/legal guarantee, or relationship advice that assumes facts not given.
- Return ONLY a valid JSON object with exactly the keys requested (no markdown, no code blocks, just raw JSON).

Backend-Calculated Festival:
${renderFestivalFacts(festival)}

Backend-Calculated Astrology Facts for This Person:
${renderInsightsForPersonalization(insights)}

Backend-Calculated Panchang for the Festival Date:
${renderPanchangForPersonalization(panchang)}

Return this exact JSON structure:
{
  "whyMeaningful": "3-4 sentences on why this specific festival is especially meaningful for this person right now, grounded in the Dasha/Transit/Prediction facts above",
  "careerFocus": "1-2 hedged sentences connecting this festival to this person's career/professional life, grounded in the facts above",
  "financeFocus": "1-2 hedged sentences connecting this festival to this person's finances, grounded in the facts above",
  "relationshipFocus": "1-2 hedged sentences connecting this festival to this person's relationships, grounded in the facts above",
  "healthFocus": "1-2 hedged sentences connecting this festival to this person's health/wellbeing, grounded in the facts above (never a diagnosis)",
  "spiritualFocus": "1-2 hedged sentences connecting this festival to this person's spiritual practice, grounded in the facts above",
  "personalGrowthFocus": "1-2 hedged sentences connecting this festival to this person's personal growth, grounded in the facts above"
}`;
}

export default { buildFestivalIntelligencePrompt, buildPersonalizedFestivalPrompt };
