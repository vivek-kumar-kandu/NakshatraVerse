// ─────────────────────────────────────────────────────────────────────────
// Festival Intelligence Notification Generator (V4.5 Phase 2 — Festival
// Intelligence)
//
// A sibling generator to notificationGenerationService.js's own Festival/
// Vrat generator (see its "Festival / Vrat" section) — kept in its own
// file so the existing generator's dedupeKeys and behavior are left
// completely untouched. This file only reads festivalService
// .getFestivalsForDate (the exact same read-only function the existing
// Festival/Vrat generator already calls) and turns the already-computed
// date/rituals/fastingInfo fields into five ADDITIONAL, additive
// reminder types the Phase 2 spec asks for: Preparation Reminder, Puja
// Reminder, Fasting Reminder, Festival Starting, Festival Ending. It
// never recalculates a festival date or fact, and its dedupeKeys are all
// namespaced under "festival-intel:" so they can never collide with the
// existing "festival:<key>:<date>:<today|tomorrow>" keys.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../utils/logger.js";
import * as notificationService from "./notificationService.js";
import * as festivalService from "../festival/festivalService.js";
import { resolvePriority } from "./notificationPriorityEngine.js";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysStr(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

async function emit(userId, candidate, results) {
  try {
    const { created } = await notificationService.createNotificationIfNew(userId, candidate);
    if (created) results.generated += 1; else results.skippedDuplicate += 1;
  } catch (err) {
    logger.error(`Festival Intelligence notification generation: failed to create "${candidate?.title}":`, err);
    results.errors += 1;
  }
}

// Preparation Reminder — fires two days before a Medium/High-importance
// occasion, so the user has time to plan (see Festival Preparation in the
// Phase 2 spec). Low-importance occasions are skipped to avoid over-
// notifying for routine monthly Vrats.
async function emitPreparationReminder(userId, festival, results) {
  if (festival.importance === "Low") return;
  await emit(userId, {
    title: "Festival Preparation Reminder",
    message: `${festival.name} is coming up on ${festival.date}. This is a good time to plan preparations — puja materials, shopping, and (if observed) fasting.`,
    category: "festival",
    priority: resolvePriority({ kind: "festival.today", daysAway: 2 }),
    expiresAt: `${festival.date}T23:59:59.000Z`,
    metadata: { dedupeKey: `festival-intel:preparation:${festival.key}:${festival.date}`, destination: "panchang", festivalKey: festival.key },
  }, results);
}

// Fasting Reminder — the day before, only for occasions whose
// fastingInfo.isFastObserved is true (already computed by
// festivalEngine.js — never inferred here).
async function emitFastingReminder(userId, festival, results) {
  if (!festival.fastingInfo?.isFastObserved) return;
  await emit(userId, {
    title: "Fasting Reminder",
    message: `Tomorrow (${festival.date}) is ${festival.name}${festival.fastingInfo.fastType ? ` — a ${festival.fastingInfo.fastType} fast` : " — a fasting day"}. Plan your meals accordingly.`,
    category: "festival",
    priority: resolvePriority({ kind: "festival.today", daysAway: 1 }),
    expiresAt: `${festival.date}T23:59:59.000Z`,
    metadata: { dedupeKey: `festival-intel:fasting:${festival.key}:${festival.date}`, destination: "panchang", festivalKey: festival.key },
  }, results);
}

// Puja Reminder — the morning of, referencing the festival's own
// already-computed rituals list (never inventing a new ritual).
async function emitPujaReminder(userId, festival, results) {
  const firstRitual = festival.rituals?.[0];
  await emit(userId, {
    title: "Puja Reminder",
    message: firstRitual
      ? `Today is ${festival.name}. Traditional puja for the day includes: ${firstRitual}.`
      : `Today is ${festival.name}. Time to prepare for today's puja.`,
    category: "festival",
    priority: resolvePriority({ kind: "festival.today", daysAway: 0 }),
    expiresAt: `${festival.date}T23:59:59.000Z`,
    metadata: { dedupeKey: `festival-intel:puja:${festival.key}:${festival.date}`, destination: "panchang", festivalKey: festival.key },
  }, results);
}

// Festival Starting — the morning of the festival's start date.
async function emitFestivalStarting(userId, festival, results) {
  await emit(userId, {
    title: "Festival Starting",
    message: `${festival.name} begins today (${festival.date})${festival.durationDays > 1 ? ` and continues through ${festival.endDate}` : ""}.`,
    category: "festival",
    priority: resolvePriority({ kind: "festival.today", daysAway: 0 }),
    expiresAt: `${festival.date}T23:59:59.000Z`,
    metadata: { dedupeKey: `festival-intel:starting:${festival.key}:${festival.date}`, destination: "panchang", festivalKey: festival.key },
  }, results);
}

// Festival Ending — only for multi-day festivals (currently only
// Navratri — see festivalService.js's occursOnDate), fired on the
// already-computed endDate.
async function emitFestivalEnding(userId, festival, results) {
  if (!festival.endDate || festival.endDate === festival.date) return;
  await emit(userId, {
    title: "Festival Ending",
    message: `${festival.name} concludes today (${festival.endDate}).`,
    category: "festival",
    priority: resolvePriority({ kind: "festival.today", daysAway: 0 }),
    expiresAt: `${festival.endDate}T23:59:59.000Z`,
    metadata: { dedupeKey: `festival-intel:ending:${festival.key}:${festival.endDate}`, destination: "panchang", festivalKey: festival.key },
  }, results);
}

export async function generateFestivalIntelligenceNotifications(userId, results) {
  const today = todayStr();
  const tomorrow = addDaysStr(today, 1);
  const twoDaysOut = addDaysStr(today, 2);

  let todaysFestivals = [];
  let tomorrowsFestivals = [];
  let twoDaysOutFestivals = [];
  try {
    todaysFestivals = festivalService.getFestivalsForDate(today);
    tomorrowsFestivals = festivalService.getFestivalsForDate(tomorrow);
    twoDaysOutFestivals = festivalService.getFestivalsForDate(twoDaysOut);
  } catch (err) {
    logger.error("Festival Intelligence notification generation: festivalService.getFestivalsForDate failed:", err);
    results.errors += 1;
    return;
  }

  for (const festival of twoDaysOutFestivals) await emitPreparationReminder(userId, festival, results);
  for (const festival of tomorrowsFestivals) await emitFastingReminder(userId, festival, results);
  for (const festival of todaysFestivals) {
    await emitPujaReminder(userId, festival, results);
    await emitFestivalStarting(userId, festival, results);
    await emitFestivalEnding(userId, festival, results);
  }
}

export default { generateFestivalIntelligenceNotifications };
