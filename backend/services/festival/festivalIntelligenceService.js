// ─────────────────────────────────────────────────────────────────────────
// Festival Intelligence Service (V4.5 Phase 2 — Festival Intelligence)
//
// Orchestration layer only, same "service = orchestration, not
// calculation" split every other module in this codebase already follows
// (see festivalService.js's own header). This file NEVER recalculates a
// festival's Date/Type/Importance/Vrat status, NEVER recalculates a birth
// chart/Dasha/Transit/Prediction/Panchang value, and never asks Gemini to
// determine any of those — it only:
//   - reads the already-computed festival occurrence the caller passes in
//     (exactly as festival.controller.js's /explain already does),
//   - reads the already-computed structuredInsightsEngine.js / panchangEngine
//     .js facts for personalization (exactly as lifeCoachService.js already
//     does),
//   - reads the already-computed familyProfileService.listProfiles for
//     family suggestions (exactly as notificationGenerationService.js
//     already does),
//   - and deterministically repackages already-computed festival fields
//     (rituals/recommendedActivities/fastingInfo) into a Preparation
//     checklist and an enhanced Timeline — no Gemini call required for
//     either, so both work identically whether or not the AI layer is
//     reachable (same resilience posture as notificationGenerationService
//     .js's deterministic notification text).
// ─────────────────────────────────────────────────────────────────────────
import logger from "../utils/logger.js";
import { buildStructuredInsights } from "../astrology/structuredInsightsEngine.js";
import { computePanchang } from "../astrology/panchangEngine.js";
import {
  buildFestivalIntelligencePrompt,
  buildPersonalizedFestivalPrompt,
} from "../ai/festivalIntelligencePromptBuilder.js";
import { callGemini } from "../ai/geminiService.js";
import * as familyProfileService from "../family/familyProfileService.js";

// ── Festival Intelligence (spiritual meaning, mythological story, etc) ──
// One Gemini call, grounded strictly in the already-computed festival
// object the caller passes in (never re-fetched/recalculated here).
export async function generateFestivalIntelligence(festival) {
  const prompt = buildFestivalIntelligencePrompt(festival);
  const intelligence = await callGemini(prompt);
  if (!intelligence || typeof intelligence !== "object") {
    const err = new Error("The AI did not return usable festival intelligence.");
    err.status = 502;
    throw err;
  }
  return intelligence;
}

// ── Personalized Festival Guidance ───────────────────────────────────────
// Reuses buildStructuredInsights(chart) — the exact same function
// lifeCoachService.js/notificationGenerationService.js already call — and
// computePanchang(festival.date) — the exact same function every Panchang
// endpoint already calls. Never computes new astrology.
export async function generatePersonalizedFestivalGuidance({ festival, chart, report }) {
  let insights = null;
  try {
    insights = buildStructuredInsights(chart);
  } catch (err) {
    logger.error("Festival Intelligence: buildStructuredInsights failed, continuing without it:", err);
  }

  let panchang = null;
  try {
    panchang = computePanchang(festival.date);
  } catch (err) {
    logger.error("Festival Intelligence: computePanchang failed, continuing without it:", err);
  }

  const prompt = buildPersonalizedFestivalPrompt({ festival, insights, panchang });
  const guidance = await callGemini(prompt);
  if (!guidance || typeof guidance !== "object") {
    const err = new Error("The AI did not return usable personalized guidance.");
    err.status = 502;
    throw err;
  }

  return {
    guidance,
    // Backend-authoritative facts the guidance was grounded in — exposed
    // so the frontend can show what it was personalized against, same
    // "return the AI text plus the facts it was grounded in" shape
    // lifeCoachService.js already uses.
    dasha: insights?.dasha ?? null,
    transits: insights?.transits ?? null,
    panchang,
  };
}

// ── Festival Preparation (deterministic — no Gemini call) ───────────────
// Repackages festival.rituals / festival.recommendedActivities /
// festival.fastingInfo (already computed by festivalEngine.js) into the
// seven requested checklist categories. Adds no new ritual, fact, or
// astrology of its own — every line item traces back to a field the
// backend Festival Data Store already provided.
function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function buildFestivalPreparation(festival) {
  const isVrat = festival.type === "Vrat";
  const observesFast = Boolean(festival.fastingInfo?.isFastObserved);
  const rituals = festival.rituals || [];
  const activities = festival.recommendedActivities || [];
  const isMultiDay = (festival.durationDays || 1) > 1;

  const preparationChecklist = [
    `Confirm the date${isMultiDay ? ` and full duration (${festival.date} – ${festival.endDate})` : ` (${festival.date})`} on your calendar.`,
    "Clean and tidy the home/puja space in the days before.",
    festival.importance === "High" ? "Plan any time off or schedule changes around the day, since this is a High-importance occasion." : null,
    observesFast ? "Decide in advance whether you will observe the fast, and plan meals around it." : null,
  ].filter(Boolean);

  const shoppingChecklist = [
    ...(rituals.length ? ["Puja items needed for: " + rituals.slice(0, 3).join(", ") + (rituals.length > 3 ? ", and more" : "")] : []),
    "Fresh flowers and garlands.",
    "Diyas/lamps and oil or ghee.",
    "Incense (agarbatti/dhoop).",
    festival.type === "Festival" ? "Festive clothing, as customary for the occasion." : null,
  ].filter(Boolean);

  const pujaMaterials = [
    "Idol/image or symbolic representation of the deity associated with the day.",
    "Diya, incense, and camphor for aarti.",
    "Flowers, fruits, and sweets for offering (prasad).",
    "Kalash (water vessel) and coconut, where customary.",
    ...rituals.map((r) => `Materials for: ${r}`),
  ];

  const fastingPreparation = observesFast
    ? [
        `Fast type: ${festival.fastingInfo.fastType || "as per family/regional tradition"}.`,
        ...(festival.fastingInfo.guidelines || []),
        "Keep water and any permitted fasting foods ready in advance.",
        "Plan the time of breaking the fast around the day's Muhurat, where applicable.",
      ]
    : ["No fasting is traditionally required for this occasion — light, sattvic food is customary for many households."];

  const morningRoutine = [
    "Wake before sunrise, bathe, and wear clean/fresh clothing.",
    "Clean and light the puja space.",
    isVrat ? "Take the Vrat Sankalp (resolve) for the day, if observing the fast." : "Begin the day with a short prayer or moment of gratitude.",
    ...(activities.length ? [`Morning-appropriate activity: ${activities[0]}`] : []),
  ];

  const eveningRitual = [
    "Light diyas and perform the evening aarti.",
    ...rituals.slice(0, 2).map((r) => `Evening ritual: ${r}`),
    "Share prasad with family.",
    observesFast ? "Break the fast as per family tradition, typically after the evening puja." : null,
  ].filter(Boolean);

  const postFestivalReflection = [
    "Note how the day felt and any intentions set, for your own record.",
    "Tidy and put away puja items respectfully.",
    "Consider sharing the occasion's story with younger family members.",
  ];

  return {
    festivalKey: festival.key,
    date: festival.date,
    preparationChecklist,
    shoppingChecklist,
    pujaMaterials,
    fastingPreparation,
    morningRoutine,
    eveningRitual,
    postFestivalReflection,
  };
}

// ── Enhanced Festival Timeline (deterministic — no Gemini call) ─────────
// Reuses the existing Timeline component's item shape on the frontend
// (id/date/title/subtitle) and, for the "Important Muhurat" stage, reuses
// computePanchang(festival.date)'s already-computed Abhijit Muhurat
// window rather than inventing a new one — the same reuse pattern
// muhuratEngine.js/festivalEngine.js already establish elsewhere in this
// codebase.
export function buildFestivalTimeline(festival) {
  let abhijit = null;
  try {
    abhijit = computePanchang(festival.date).abhijitMuhurat;
  } catch (err) {
    logger.error("Festival Intelligence: computePanchang failed while building timeline, continuing without Muhurat:", err);
  }

  const rituals = festival.rituals || [];
  const stages = [
    { id: "preparation", title: "Preparation", subtitle: "Clean the home, gather puja materials, and plan the day." },
    { id: "morning", title: "Morning", subtitle: rituals[0] ? `Morning rituals: ${rituals[0]}` : "Bathe, wear fresh clothing, and begin the day's observance." },
    { id: "main-ritual", title: "Main Ritual", subtitle: rituals.length ? rituals.slice(0, 3).join("; ") : festival.description },
    {
      id: "muhurat",
      title: "Important Muhurat",
      subtitle: abhijit ? `Abhijit Muhurat (favorable window): ${abhijit.start}–${abhijit.end}` : "Muhurat window unavailable for this date.",
    },
    { id: "evening", title: "Evening", subtitle: rituals[rituals.length - 1] ? `Evening rituals: ${rituals[rituals.length - 1]}` : "Evening aarti and sharing of prasad." },
    { id: "completion", title: "Completion", subtitle: "Fast broken (if observed) and puja items respectfully put away." },
  ];

  return stages.map((s) => ({ ...s, date: festival.date }));
}

// ── Family Integration ───────────────────────────────────────────────────
// Reuses familyProfileService.listProfiles(userId) exactly as
// notificationGenerationService.js's generateFamilyNotifications already
// does. Deterministic (no Gemini call) — suggestions are derived purely
// from each profile's relationship label plus the festival's own
// type/importance, never a new astrology fact.
export function getFamilyFestivalSuggestions(userId, festival) {
  let profiles = [];
  try {
    profiles = familyProfileService.listProfiles(userId, { includeArchived: false }) || [];
  } catch (err) {
    logger.error("Festival Intelligence: listProfiles failed:", err);
    profiles = [];
  }

  const familyReminders = profiles.map((p) => ({
    profileId: p.id,
    name: p.name,
    relationship: p.relationshipLabel || titleCase(p.relationship || "family member"),
    message: `Remind ${p.name} (${p.relationshipLabel || p.relationship}) about ${festival.name} on ${festival.date}.`,
  }));

  const sharedCelebrationSuggestions = profiles.length
    ? [
        `Plan a shared ${festival.name} celebration with ${profiles.length === 1 ? profiles[0].name : `your ${profiles.length} saved family members`}.`,
        festival.importance === "High" ? "Consider a family video/voice call if you can't celebrate together in person." : null,
      ].filter(Boolean)
    : [`Add family profiles to get shared ${festival.name} celebration suggestions.`];

  const suggestedFamilyActivities = [
    "Cook a traditional festive meal together.",
    "Perform the puja/aarti together where possible.",
    "Share the mythological story of the day with children in the family.",
    festival.type === "Vrat" ? "Support anyone observing the fast with meal planning." : null,
  ].filter(Boolean);

  return { familyReminders, sharedCelebrationSuggestions, suggestedFamilyActivities };
}

export default {
  generateFestivalIntelligence,
  generatePersonalizedFestivalGuidance,
  buildFestivalPreparation,
  buildFestivalTimeline,
  getFamilyFestivalSuggestions,
};
