// ─────────────────────────────────────────────────────────────────────────
// Chat Prompt Builder — V3.0 Phase 4 (AI Astrology Assistant)
// Single responsibility: turn an already-computed, authoritative chart
// (plus its optional structured insights) into the prompt sent to Gemini
// for a single chat turn. Mirrors promptBuilder.js's contract exactly:
// Gemini receives ONLY backend-calculated facts and must never calculate,
// infer, or invent a planet, house, yoga, dosha, remedy, prediction,
// confidence value, or prediction period. The only new ingredient here is
// the conversation history + the person's free-text question; the set of
// facts Gemini is allowed to draw on is identical to the report prompt.
// ─────────────────────────────────────────────────────────────────────────

// Reuses the exact same fact-rendering shape as promptBuilder.js so the
// assistant can never "see" a different picture of the chart than the
// report itself did.
function renderFacts(chart, insights) {
  const { userData, planetary, numerology, lagna, moonSign, sunSign, nakshatra, yogas, doshas, remedies, report } = chart;

  const allYogas = [...(yogas || []), ...(insights?.advancedYogas || [])];
  const allDoshas = [...(doshas || []), ...(insights?.advancedDoshas || [])];

  const yogaList = allYogas.length ? allYogas.map((y) => `- ${y.name}: ${y.detail}`).join("\n") : "None detected.";
  const doshaList = allDoshas.length ? allDoshas.map((d) => `- ${d.name}: ${d.detail}`).join("\n") : "None detected.";
  const remedyList = (remedies || []).length ? remedies.map((r) => `- ${r.type}: ${r.detail}`).join("\n") : "None.";

  const nakshatraProfile = insights?.nakshatraProfile;
  const dasha = insights?.dasha;
  const predictions = insights?.predictions;
  const transitForecast = insights?.transitForecast;

  const dashaSummary = dasha?.available
    ? `Current Mahadasha: ${dasha.currentMahadasha?.lord} (until ${dasha.currentMahadasha?.endDate}); Current Antardasha: ${dasha.currentAntardasha?.lord} (until ${dasha.currentAntardasha?.endDate}). Previous Mahadasha: ${dasha.previousMahadasha?.lord ?? "none"}; Next Mahadasha: ${dasha.nextMahadasha?.lord ?? "none"}.`
    : "Not available.";

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

  return `Birth Data:
- Name: ${userData?.name}
- Date of Birth: ${userData?.dob}
- Time of Birth: ${userData?.tob}
- Place of Birth: ${userData?.pob}

Backend-Calculated Astrological Facts (authoritative — do not alter):
- Lagna (Ascendant): ${lagna}
- Moon Sign: ${moonSign}
- Sun Sign: ${sunSign}
- Nakshatra: ${nakshatra?.name} (Pada ${nakshatra?.pada})
- Mulank (Life Path): ${numerology?.mulank}
- Bhagyank (Destiny): ${numerology?.bhagyank}
- Planetary Positions (planet: house, sign): ${JSON.stringify(planetary)}

Backend-Detected Yogas:
${yogaList}

Backend-Detected Doshas:
${doshaList}

Backend-Derived Remedies:
${remedyList}

Nakshatra Profile: Lord=${nakshatraProfile?.lord}, Gana=${nakshatraProfile?.gana}, Yoni=${nakshatraProfile?.yoni}, Nadi=${nakshatraProfile?.nadi}, Symbol=${nakshatraProfile?.symbol}, Deity=${nakshatraProfile?.deity}, Nature=${nakshatraProfile?.nature}.

Vimshottari Dasha: ${dashaSummary}

Transit Forecast (Saturn / Jupiter / Rahu-Ketu axis):
${transitForecastSummary}

Backend-Computed Predictions (already-finalized verdict per life area — explain these exact conclusions, never recompute or contradict them):
${predictionList}

Report Narrative Already Shown To The User (already-generated text — you may reference/expand on this, never contradict it):
- Love Life: ${report?.loveLife ?? "Not available."}
- Career: ${report?.career ?? "Not available."}
- Finance: ${report?.finance ?? "Not available."}
- Health: ${report?.health ?? "Not available."}
- Marriage: ${report?.marriage ?? "Not available."}
- Doshas: ${report?.doshas ?? "Not available."}
- Yogas: ${report?.yogas ?? "Not available."}
- Remedies: ${report?.remedies ?? "Not available."}
- Life Summary: ${report?.lifeSummary ?? "Not available."}`;
}

function renderHistory(history) {
  if (!history?.length) return "(This is the first message in the conversation.)";
  return history
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// V4.5 Phase 4 (AI Report Chat) addition.
// Optional extra fact blocks — Festival Intelligence / Panchang / Muhurat
// context. All three are entirely optional and, when omitted (every
// caller before this phase), render nothing, leaving the prompt byte-for-
// byte equivalent to before this phase for existing callers. Each is
// rendered the same defensive way as renderFacts() above: only fields
// that are actually present are shown, nothing is computed here.
// ─────────────────────────────────────────────────────────────────────────
function renderOptionalContext({ festivalContext, panchangContext, muhuratContext }) {
  const sections = [];

  if (festivalContext && typeof festivalContext === "object") {
    const f = festivalContext;
    sections.push(
      `Backend-Computed Festival Intelligence Context (from Festival Intelligence — V4.5 Phase 2):
- Festival: ${f.name ?? "?"} (${f.date ?? "?"})
- Type/Importance: ${f.type ?? "?"} / ${f.importance ?? "?"}
- Personalized Guidance Already Generated: ${f.personalizedGuidance ?? f.guidance ?? "Not available."}
- Spiritual Significance Already Generated: ${f.spiritualSignificance ?? "Not available."}`
    );
  }

  if (panchangContext && typeof panchangContext === "object") {
    const p = panchangContext;
    sections.push(
      `Backend-Computed Panchang Context (for ${p.date ?? "the referenced date"}):
- Tithi: ${p.tithi ?? "?"}
- Nakshatra: ${p.nakshatra ?? "?"}
- Yoga: ${p.yoga ?? "?"}
- Karana: ${p.karana ?? "?"}
- Vaara (Weekday): ${p.vaara ?? "?"}`
    );
  }

  if (muhuratContext && typeof muhuratContext === "object") {
    const m = muhuratContext;
    sections.push(
      `Backend-Computed Muhurat Context:
- Activity: ${m.activity ?? "?"}
- Recommended Window(s): ${m.windows ?? m.recommendedWindows ?? "?"}
- Quality/Reasoning Already Generated: ${m.quality ?? m.reasoning ?? "Not available."}`
    );
  }

  return sections.length ? `\n\n${sections.join("\n\n")}` : "";
}

export function buildChatPrompt({ chart, report, insights, history, question, festivalContext, panchangContext, muhuratContext }) {
  const factsSection = renderFacts({ ...chart, report }, insights);
  const optionalContextSection = renderOptionalContext({ festivalContext, panchangContext, muhuratContext });
  const historySection = renderHistory(history);

  return `You are the NakshatraVerse AI Astrology Assistant — a friendly, knowledgeable guide who explains a person's ALREADY-GENERATED Vedic astrology report. A backend calculation engine has already computed every astrological fact and prediction below; a report-writing step has already turned some of them into narrative prose (also below). Your ONLY job in this chat is to explain, clarify, and answer questions about this existing, already-finalized material in warm, conversational language.

Absolute rules — follow every one of these strictly:
- Never calculate astrology yourself. Never work out a planetary position, house, yoga, dosha, dasha period, numerology number, festival date, Panchang element, Muhurat window, or prediction from first principles — only explain the ones already given to you below.
- Never invent a planet, yoga, dosha, remedy, prediction, festival, Panchang detail, or Muhurat window that is not explicitly listed below. If asked about one that isn't listed, say plainly that it wasn't detected/computed for this chart — do not invent one to be helpful.
- Never modify, soften, inflate, or restate a confidence score/label — if you mention one, state it exactly as given.
- Never modify or invent a prediction time period (Dasha/Antardasha window or date range) — use only the ones given below.
- Never contradict any backend-generated fact, prediction, festival/Panchang/Muhurat context, or report narrative given below.
- Never give a specific marriage date, age, or timeframe, a specific career timing/income figure, or a medical diagnosis. Use hedging language ("may indicate", "traditionally associated with") for anything predictive, and note health topics are traditional associations, not medical advice.
- If the question is unrelated to this person's astrology report (e.g. general chit-chat, coding help, unrelated trivia), politely decline and steer back to what you can help with: explaining their report.
- If the question asks about a specific detail not present in the facts below, say so honestly instead of guessing.
- Use conversation history for context: if the new question is a follow-up ("what about my career instead?", "why is that?"), interpret it in light of what was just discussed, and you may reference your previous answer.
- Keep the detailed explanation focused and conversational — normally 2-5 short paragraphs or, where it genuinely helps, a short bullet list or a small markdown table. Never include code blocks or code of any kind.
- Every item you put in "evidence" must be a short (under ~20 words), literal restatement of one specific backend-computed fact from the sections above (e.g. "Current Mahadasha: Saturn until 2027-03-12", "Confidence: High [82/100] for Career prediction") — never a general statement, opinion, or something not present above.
- "confidence" must be null unless your answer is directly explaining a specific backend-computed prediction that itself carries a confidence label/score above — in that case, copy that exact label and score. Never invent a confidence value for anything else (e.g. general chart facts, Panchang, remedies).
- "suggestedNextQuestion" must be one natural, specific follow-up question the person could reasonably ask next about THIS report (never generic chit-chat), phrased as if the user is asking it.
- Return ONLY a valid JSON object of this exact shape — no markdown fences, no other keys, no prose outside the JSON:
{"shortAnswer": "...", "detailedExplanation": "...", "evidence": ["...", "..."], "confidence": {"label": "...", "score": 0} or null, "suggestedNextQuestion": "..."}
  - "shortAnswer": one or two sentences that directly answer the question, in plain language.
  - "detailedExplanation": the fuller explanation. May contain markdown (bold, bullet lists, simple tables) but never a code block (no \`\`\` anywhere). Do not repeat "shortAnswer" verbatim inside it.
  - "evidence": an array of 1-4 short strings (can be an empty array if truly nothing specific applies, but prefer citing at least one fact).
  - "suggestedNextQuestion": a single string.

${factsSection}${optionalContextSection}

Conversation so far:
${historySection}

The user's new question: "${question}"

Respond now as JSON in the exact shape described above.`;
}

export default { buildChatPrompt };
