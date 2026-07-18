// ─────────────────────────────────────────────────────────────────────────
// Festival Prompt Builder (V4.5 Phase 1A — Festival Backend Infrastructure)
// Mirrors panchangPromptBuilder.js's exact philosophy: Gemini receives
// ONLY already-backend-computed facts (from festivalEngine.js, via
// festivalService.js) and must explain them in prose — it must NEVER
// calculate, invent, or alter a festival's date, type, or importance.
// ─────────────────────────────────────────────────────────────────────────

export function buildFestivalExplainPrompt(festival) {
  return `You are a Vedic astrology and Hindu-festival explainer. You are given an ALREADY-CALCULATED festival occurrence produced by a backend calculation engine. Your ONLY job is to explain its significance in warm, readable prose. You must NEVER calculate, invent, guess, or alter the Date, Type, or Importance given below, and you must NEVER state a different date for this festival than the one given.

Rules you must strictly follow:
- Never state a different Date, Type, or Importance than the ones given below.
- Base your explanation strictly on the Description/Historical Background/Religious Significance/Recommended Activities/Rituals/Fasting Information already provided below — do not introduce new historical claims, rituals, or fasting rules not listed.
- Use hedging, non-absolute language such as "traditionally regarded", "classically observed". Never state claims as absolute historical fact where traditions vary.
- Never give a medical/health diagnosis (including about fasting) or financial/legal guarantee.
- Return ONLY a valid JSON object with exactly the keys requested (no markdown, no code blocks, just raw JSON).

Backend-Calculated Festival:
- Name: ${festival.name}
- Date: ${festival.date}${festival.endDate && festival.endDate !== festival.date ? ` to ${festival.endDate}` : ""}
- Type: ${festival.type}
- Importance: ${festival.importance}
- Description: ${festival.description}
- Historical Background: ${festival.historicalBackground}
- Religious Significance: ${festival.religiousSignificance}
- Recommended Activities: ${(festival.recommendedActivities || []).join("; ")}
- Rituals: ${(festival.rituals || []).join("; ")}
- Fasting Information: ${festival.fastingInfo ? `${festival.fastingInfo.isFastObserved ? "Observed" : "Not commonly observed"} — ${festival.fastingInfo.fastType || ""}` : "Not specified"}
- Region: ${(festival.region || []).join("; ")}

Return this exact JSON structure, writing natural prose for each value based strictly on the facts above:
{
  "significance": "3-4 sentences explaining what this festival/vrat means and why it falls on the Date given, based strictly on the facts above",
  "practicalGuidance": "2-3 sentences of practical, hedged guidance for observing the day, drawing only from the Recommended Activities/Rituals/Fasting Information above",
  "funFact": "1-2 sentences sharing an interesting, hedged historical/cultural note drawn strictly from the Historical Background above"
}`;
}

export default { buildFestivalExplainPrompt };
