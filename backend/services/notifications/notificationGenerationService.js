// ─────────────────────────────────────────────────────────────────────────
// Notification Generation Service (V4.4 Phase 2 — Intelligent Notification
// Generation)
//
// Single responsibility: connect the Phase 1 Notification Infrastructure
// (notificationService.createNotificationIfNew) to the existing,
// unmodified backend engines/services — Panchang, Muhurat, Family
// Profiles, the Prediction/Transit/Dasha facts already assembled by
// structuredInsightsEngine.js, and the AI Life Coach service — and turn
// their already-computed facts into notification rows.
//
// Hard rule this whole file follows: it never computes astrology, never
// decides a Tithi/Nakshatra/Yoga/Karana/Muhurat/Dasha/Transit/Prediction
// value itself, and never asks Gemini to invent timing, priority, or
// astrology. It only reads what the existing engines already returned and
// maps that into { title, message, category, priority, expiresAt,
// metadata } — the same "shape of the data, not how it's calculated"
// separation the rest of this codebase already uses (see
// structuredJsonBuilder.js / predictionApiMapper.js). Every notification's
// message is deterministic, backend-authored text — no network/Gemini
// call is required for a notification to be generated, so this feature
// works identically whether or not the AI layer is reachable.
//
// Duplicate prevention: every candidate below sets metadata.dedupeKey to a
// value that is stable for "the same underlying event" (e.g. a date, a
// Dasha-lord pair, a family profile id + year) and calls
// notificationService.createNotificationIfNew, which no-ops if a live
// notification with that key already exists (see notification.repository
// .js#findByUserAndDedupeKey). This is what satisfies the "Duplicate
// notification prevention" requirement.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../utils/logger.js";
import * as notificationService from "./notificationService.js";
import * as reportRepository from "../../repositories/report.repository.js";
import * as familyProfileService from "../family/familyProfileService.js";
import { computePanchang } from "../astrology/panchangEngine.js";
import { findMuhurat, MUHURAT_ACTIVITIES } from "../astrology/muhuratEngine.js";
import { buildStructuredInsights } from "../astrology/structuredInsightsEngine.js";
import { generateDailyGuidance } from "../ai/lifeCoachService.js";
// V4.5 Phase 1A (Festival Backend Infrastructure) — additive import.
import * as festivalService from "../festival/festivalService.js";
// V4.5 Phase 2 (Festival Intelligence) — additive import. This generator
// lives entirely in its own file (see its own header) so this file's
// existing Festival/Vrat generator above/below is left byte-for-byte
// unchanged; only the single call in generateForUser below is new.
import { generateFestivalIntelligenceNotifications } from "./festivalIntelligenceNotificationGenerator.js";
// V4.4 Phase 2 — centralized Priority Engine (see its own file header).
// Every candidate below now obtains `priority` from resolvePriority(...)
// instead of a hardcoded string/ternary.
import { resolvePriority } from "./notificationPriorityEngine.js";

// ── Small date helpers (no astrology — plain calendar math only) ────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function daysUntilNextOccurrence(dob) {
  if (!dob || typeof dob !== "string") return null;
  const [, mm, dd] = dob.split("-").map(Number);
  if (!mm || !dd) return null;
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  let next = new Date(Date.UTC(now.getFullYear(), mm - 1, dd));
  if (next < today) next = new Date(Date.UTC(now.getFullYear() + 1, mm - 1, dd));
  return { days: Math.round((next - today) / 86400000), year: next.getUTCFullYear() };
}

function daysBetween(dateStr) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const target = new Date(`${dateStr}T00:00:00Z`);
  return Math.round((target - today) / 86400000);
}

// V4.5 Phase 1A (Festival Backend Infrastructure) — plain calendar math
// only, used to compute "tomorrow" for Festival/Vrat notifications.
function addDaysStrLocal(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// ── V4.4 Phase 2 — Notification Expiration helpers (plain calendar math,
// no astrology). Used so "Weekly Outlook expires after one week" / "Monthly
// Outlook expires after month end" are real, not left as expiresAt: null.
function endOfWeekIso(date = new Date()) {
  const end = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  end.setUTCDate(end.getUTCDate() + 6);
  return `${end.toISOString().slice(0, 10)}T23:59:59.000Z`;
}

function endOfMonthIso(date = new Date()) {
  const end = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0));
  return `${end.toISOString().slice(0, 10)}T23:59:59.000Z`;
}

// Every generator below returns candidate notification objects (never
// throws); the orchestrator is responsible for calling
// createNotificationIfNew and tallying results.
async function emit(userId, candidate, results) {
  try {
    const { created } = await notificationService.createNotificationIfNew(userId, candidate);
    if (created) results.generated += 1; else results.skippedDuplicate += 1;
  } catch (err) {
    logger.error(`Notification generation: failed to create "${candidate?.title}":`, err);
    results.errors += 1;
  }
}

// ── Panchang ──────────────────────────────────────────────────────────
// Reuses panchangEngine.computePanchang exactly as /api/panchang does.
// V4.5 Phase 1A note: the inline Ekadashi/Purnima/Amavasya Tithi-name
// check that used to live at the end of this function has been removed —
// it was a deliberate stopgap (see its old comment) for the period before
// a real Festival Calendar engine existed. That engine now exists (see
// festivalEngine.js/festivalService.js) and covers Ekadashi/Purnima/
// Amavasya plus 16 more festivals with real backend-computed
// dates/type/importance, so festival notifications are now generated by
// generateFestivalAndVratNotifications below instead, avoiding duplicate/
// conflicting notifications for the same day.
async function generatePanchangAndFestivalNotifications(userId, results) {
  const date = todayStr();
  let panchang;
  try {
    panchang = computePanchang(date);
  } catch (err) {
    logger.error("Notification generation: computePanchang failed:", err);
    results.errors += 1;
    return;
  }

  // V4.4 Phase 2 — Notification Grouping: every window sharing today's
  // date carries the same metadata.groupKey/groupLabel so the (unchanged)
  // Notification Center UI can render them as one "Today's Panchang"
  // group instead of six separate rows — see notificationService.js's
  // groupNotifications helper for how this key is consumed.
  const panchangGroupKey = `panchang-today:${date}`;
  const panchangGroupLabel = "Today's Panchang";

  await emit(userId, {
    title: "Today's Panchang is Ready",
    message: `${panchang.weekday}, ${date}: ${panchang.tithi.name} (${panchang.paksha}), ${panchang.nakshatra.name} Nakshatra. Auspiciousness: ${panchang.auspiciousnessLabel}.`,
    category: "panchang",
    priority: resolvePriority({ kind: "panchang.today" }),
    expiresAt: `${date}T23:59:59.000Z`,
    metadata: { dedupeKey: `panchang:${date}`, destination: "panchang", groupKey: panchangGroupKey, groupLabel: panchangGroupLabel },
  }, results);

  await emit(userId, {
    title: "Brahma Muhurat Today",
    message: `Brahma Muhurat falls between ${panchang.brahmaMuhurat.start} and ${panchang.brahmaMuhurat.end} today — classically favored for meditation and spiritual practice.`,
    category: "panchang",
    priority: resolvePriority({ kind: "panchang.brahmaMuhurat" }),
    expiresAt: `${date}T23:59:59.000Z`,
    metadata: { dedupeKey: `brahma-muhurat:${date}`, destination: "panchang", groupKey: panchangGroupKey, groupLabel: panchangGroupLabel },
  }, results);

  await emit(userId, {
    title: "Abhijit Muhurat Today",
    message: `Abhijit Muhurat — today's classical auspicious window — falls between ${panchang.abhijitMuhurat.start} and ${panchang.abhijitMuhurat.end}.`,
    category: "muhurat",
    priority: resolvePriority({ kind: "panchang.abhijitMuhurat" }),
    expiresAt: `${date}T23:59:59.000Z`,
    metadata: { dedupeKey: `abhijit-muhurat:${date}`, destination: "panchang", groupKey: panchangGroupKey, groupLabel: panchangGroupLabel },
  }, results);

  await emit(userId, {
    title: "Rahu Kaal Today",
    message: `Rahu Kaal falls between ${panchang.rahuKaal.start} and ${panchang.rahuKaal.end} today — classically avoided for starting new activities.`,
    category: "panchang",
    priority: resolvePriority({ kind: "panchang.rahuKaal" }),
    expiresAt: `${date}T23:59:59.000Z`,
    metadata: { dedupeKey: `rahu-kaal:${date}`, destination: "panchang", groupKey: panchangGroupKey, groupLabel: panchangGroupLabel },
  }, results);

  await emit(userId, {
    title: "Yamaganda Today",
    message: `Yamaganda falls between ${panchang.yamaganda.start} and ${panchang.yamaganda.end} today.`,
    category: "panchang",
    priority: resolvePriority({ kind: "panchang.yamaganda" }),
    expiresAt: `${date}T23:59:59.000Z`,
    metadata: { dedupeKey: `yamaganda:${date}`, destination: "panchang", groupKey: panchangGroupKey, groupLabel: panchangGroupLabel },
  }, results);

  await emit(userId, {
    title: "Gulika Kaal Today",
    message: `Gulika Kaal falls between ${panchang.gulikaKaal.start} and ${panchang.gulikaKaal.end} today.`,
    category: "panchang",
    priority: resolvePriority({ kind: "panchang.gulikaKaal" }),
    expiresAt: `${date}T23:59:59.000Z`,
    metadata: { dedupeKey: `gulika-kaal:${date}`, destination: "panchang", groupKey: panchangGroupKey, groupLabel: panchangGroupLabel },
  }, results);
}

// ── Festival / Vrat (V4.5 Phase 1A — Festival Backend Infrastructure) ───
// Reuses festivalService.getFestivalsForDate exactly as /api/festivals/on
// /:date does — this generator performs NO astrology/date-finding of its
// own; every date/type/importance value below was already computed by
// festivalEngine.js. "Festival Today"/"Festival Tomorrow" fire for every
// occurrence; "Important Vrat Today"/"Important Vrat Tomorrow" fire only
// for the subset flagged type === "Vrat" && importance === "High"
// (Ekadashi, Karva Chauth, Dev Uthani Ekadashi) so routine monthly Vrats
// (Pradosh, Chaturthi, ordinary Purnima/Amavasya) still surface under the
// generic "Festival" notifications rather than the "Important Vrat" ones.
function emitFestivalNotification(userId, festival, when, results) {
  const isVrat = festival.type === "Vrat" && festival.importance === "High";
  const title = isVrat
    ? (when === "today" ? "Important Vrat Today" : "Important Vrat Tomorrow")
    : (when === "today" ? "Festival Today" : "Festival Tomorrow");
  const message = when === "today"
    ? `Today is ${festival.name}${festival.type === "Vrat" ? " — a Vrat day" : ""} (${festival.date}). ${festival.description}`
    : `Tomorrow is ${festival.name}${festival.type === "Vrat" ? " — a Vrat day" : ""} (${festival.date}). ${festival.description}`;
  return emit(userId, {
    title,
    message,
    category: "festival",
    priority: resolvePriority({ kind: isVrat ? "festival.importantVrat" : "festival.today", daysAway: when === "today" ? 0 : 1 }),
    expiresAt: `${festival.date}T23:59:59.000Z`,
    metadata: { dedupeKey: `festival:${festival.key}:${festival.date}:${when}`, destination: "panchang", festivalKey: festival.key },
  }, results);
}

async function generateFestivalAndVratNotifications(userId, results) {
  const todayStrLocal = todayStr();
  const tomorrowStrLocal = addDaysStrLocal(todayStrLocal, 1);

  let todaysFestivals = [];
  let tomorrowsFestivals = [];
  try {
    todaysFestivals = festivalService.getFestivalsForDate(todayStrLocal);
    tomorrowsFestivals = festivalService.getFestivalsForDate(tomorrowStrLocal);
  } catch (err) {
    logger.error("Notification generation: festivalService.getFestivalsForDate failed:", err);
    results.errors += 1;
    return;
  }

  for (const festival of todaysFestivals) {
    await emitFestivalNotification(userId, festival, "today", results);
  }
  for (const festival of tomorrowsFestivals) {
    await emitFestivalNotification(userId, festival, "tomorrow", results);
  }
}

// ── Muhurat Finder (all 8 activities) ────────────────────────────────────
// Reuses muhuratEngine.findMuhurat exactly as /api/muhurat does. Only
// notifies when a genuinely favorable window ("High" confidence) falls
// within the next 5 days, so this doesn't spam a notification for every
// activity every day.
async function generateMuhuratNotifications(userId, results) {
  const start = todayStr();
  for (const activity of MUHURAT_ACTIVITIES) {
    try {
      const result = findMuhurat({ activity, startDate: start, rangeDays: 14 });
      const daysAway = daysBetween(result.bestDate);
      if (result.confidenceLevel !== "High" || daysAway < 0 || daysAway > 5) continue;

      await emit(userId, {
        title: `${result.activityLabel} Muhurat Coming Up`,
        message: `${result.bestDate} (${result.bestDateWeekday}) is a favorable day for ${result.activityLabel} — best window ${result.bestTimeWindow.start}–${result.bestTimeWindow.end} (${result.confidenceLevel} confidence).`,
        category: "muhurat",
        priority: resolvePriority({ kind: "muhurat.finder", daysAway }),
        expiresAt: `${result.bestDate}T23:59:59.000Z`,
        metadata: { dedupeKey: `muhurat:${activity}:${result.bestDate}`, destination: "panchang", activity },
      }, results);
    } catch (err) {
      logger.error(`Notification generation: findMuhurat("${activity}") failed:`, err);
      results.errors += 1;
    }
  }
}

// ── Family Profiles (Birthday / Relationship / Family Event) ────────────
// Reuses familyProfileService.listProfiles exactly as the Family Profiles
// page does — reads dob/relationship/lastOpenedAt, never adds a field to
// the Family Profiles model. There is no Anniversary field in the Family
// Profiles model (only name/relationship/gender/dob/tob/pob), so a true
// "Anniversary Reminder" cannot be generated without modifying Family
// Profiles, which this phase must not do — it is intentionally not
// generated here.
async function generateFamilyNotifications(userId, results) {
  let profiles;
  try {
    profiles = familyProfileService.listProfiles(userId, { includeArchived: false });
  } catch (err) {
    logger.error("Notification generation: listProfiles failed:", err);
    results.errors += 1;
    return;
  }
  if (!Array.isArray(profiles)) return;

  for (const profile of profiles) {
    const occurrence = daysUntilNextOccurrence(profile.dob);
    if (occurrence && occurrence.days >= 0 && occurrence.days <= 7) {
      const priority = resolvePriority({ kind: "family.birthday", daysAway: occurrence.days });
      const isSpouse = profile.relationship === "husband" || profile.relationship === "wife";
      await emit(userId, {
        title: occurrence.days === 0 ? `${profile.name}'s Birthday is Today!` : `${profile.name}'s Birthday Coming Up`,
        message: occurrence.days === 0
          ? `It's ${profile.name}'s (${profile.relationshipLabel}) birthday today!`
          : `${profile.name}'s (${profile.relationshipLabel}) birthday is in ${occurrence.days} day${occurrence.days === 1 ? "" : "s"}.`,
        category: "family",
        priority,
        expiresAt: null,
        metadata: {
          dedupeKey: `family-birthday:${profile.id}:${occurrence.year}`,
          destination: "family-profiles",
          profileId: profile.id,
          reminderType: isSpouse ? "relationship" : "birthday",
        },
      }, results);
    }

    // Relationship Reminder (spouse) / Family Event Reminder (everyone
    // else) — a gentle monthly nudge reusing only the existing
    // lastOpenedAt field, never inventing a new event date.
    const staleForDays = profile.lastOpenedAt
      ? Math.round((Date.now() - new Date(profile.lastOpenedAt).getTime()) / 86400000)
      : Infinity;
    if (staleForDays >= 21) {
      const isSpouse = profile.relationship === "husband" || profile.relationship === "wife";
      await emit(userId, {
        title: isSpouse ? "Relationship Check-In" : "Family Profile Reminder",
        message: isSpouse
          ? `It's been a while since you last checked ${profile.name}'s (${profile.relationshipLabel}) reading — a fresh look at the Relationship Hub could be worthwhile.`
          : `You haven't looked at ${profile.name}'s (${profile.relationshipLabel}) profile in a while — their reports may be worth revisiting.`,
        category: "family",
        priority: resolvePriority({ kind: "family.checkin" }),
        expiresAt: null,
        metadata: {
          dedupeKey: `family-checkin:${profile.id}:${monthKey()}`,
          destination: isSpouse ? "relationship-hub" : "family-profiles",
          profileId: profile.id,
          reminderType: isSpouse ? "relationship" : "family-event",
        },
      }, results);
    }
  }
}

// ── Transit / Dasha / Prediction ─────────────────────────────────────────
// Reuses buildStructuredInsights(chart) — the exact same function
// lifeCoachService.js and the report/assistant endpoints already call —
// against the user's most recently saved chart. No new astrology
// calculation happens here; dasha/transits/predictions are read directly
// off its return value.
//
// Eclipse and Mercury Retrograde are NOT generated here — this codebase's
// transitEngine.js only computes Saturn/Jupiter/Rahu/Ketu sign transits
// (see its own header); it has no eclipse or retrograde-detection logic,
// and this phase must not invent a new astrology calculation to add one.
async function generateChartBasedNotifications(userId, results) {
  const [latestSummary] = reportRepository.findByUser(userId);
  if (!latestSummary) return;

  const chart = latestSummary.chart;
  const savedReport = latestSummary.report;
  if (!chart) return;

  let insights;
  try {
    insights = buildStructuredInsights(chart);
  } catch (err) {
    logger.error("Notification generation: buildStructuredInsights failed:", err);
    results.errors += 1;
    return;
  }

  // Current Dasha Period (unchanged from before Phase 2 completion).
  const maha = insights.dasha?.currentMahadasha?.lord;
  const antar = insights.dasha?.currentAntardasha?.lord;
  if (maha) {
    await emit(userId, {
      title: "Current Dasha Period",
      message: antar
        ? `You are currently in ${maha} Mahadasha, ${antar} Antardasha.`
        : `You are currently in ${maha} Mahadasha.`,
      category: "prediction",
      priority: resolvePriority({ kind: "dasha.current" }),
      expiresAt: null,
      metadata: { dedupeKey: `dasha:${maha}:${antar || "none"}`, destination: "horoscope" },
    }, results);
  }

  // ── Dasha Change / Important Mahadasha / Important Antardasha ─────────
  // Reads only the startDate/endDate already computed by dashaEngine.js
  // (calcDasha -> evaluateVimshottariDasha's currentMahadasha/
  // currentAntardasha) — no new Dasha math. "Change" fires when the
  // active period is ending soon; "Important" fires once, right after a
  // new Mahadasha/Antardasha has begun, since a period boundary is the
  // single most consequential Dasha event for a person to be told about.
  const currentMaha = insights.dasha?.currentMahadasha;
  const currentAntar = insights.dasha?.currentAntardasha;

  if (currentMaha?.endDate) {
    const daysToMahaEnd = daysBetween(currentMaha.endDate);
    if (daysToMahaEnd >= 0 && daysToMahaEnd <= 30) {
      await emit(userId, {
        title: "Dasha Change Approaching",
        message: `Your ${currentMaha.lord} Mahadasha ends on ${currentMaha.endDate} (in ${daysToMahaEnd} day${daysToMahaEnd === 1 ? "" : "s"}).`,
        category: "prediction",
        priority: resolvePriority({ kind: "dasha.change", daysAway: daysToMahaEnd }),
        expiresAt: `${currentMaha.endDate}T23:59:59.000Z`,
        metadata: { dedupeKey: `dasha-change-maha:${currentMaha.lord}:${currentMaha.endDate}`, destination: "horoscope" },
      }, results);
    }
  }

  if (currentAntar?.endDate) {
    const daysToAntarEnd = daysBetween(currentAntar.endDate);
    if (daysToAntarEnd >= 0 && daysToAntarEnd <= 15) {
      await emit(userId, {
        title: "Dasha Change Approaching",
        message: `Your ${currentAntar.lord} Antardasha ends on ${currentAntar.endDate} (in ${daysToAntarEnd} day${daysToAntarEnd === 1 ? "" : "s"}).`,
        category: "prediction",
        priority: resolvePriority({ kind: "dasha.change", daysAway: daysToAntarEnd }),
        expiresAt: `${currentAntar.endDate}T23:59:59.000Z`,
        metadata: { dedupeKey: `dasha-change-antar:${currentAntar.lord}:${currentAntar.endDate}`, destination: "horoscope" },
      }, results);
    }
  }

  if (currentMaha?.startDate) {
    const daysSinceMahaStart = -daysBetween(currentMaha.startDate);
    if (daysSinceMahaStart >= 0 && daysSinceMahaStart <= 7) {
      await emit(userId, {
        title: "Important Mahadasha",
        message: `A new Mahadasha has begun: ${currentMaha.lord} Mahadasha started on ${currentMaha.startDate} and runs through ${currentMaha.endDate}.`,
        category: "prediction",
        priority: resolvePriority({ kind: "dasha.importantMahadasha" }),
        expiresAt: null,
        metadata: { dedupeKey: `dasha-important-maha:${currentMaha.lord}:${currentMaha.startDate}`, destination: "horoscope" },
      }, results);
    }
  }

  if (currentAntar?.startDate) {
    const daysSinceAntarStart = -daysBetween(currentAntar.startDate);
    if (daysSinceAntarStart >= 0 && daysSinceAntarStart <= 7) {
      await emit(userId, {
        title: "Important Antardasha",
        message: `A new Antardasha has begun: ${currentAntar.lord} Antardasha started on ${currentAntar.startDate} and runs through ${currentAntar.endDate}.`,
        category: "prediction",
        priority: resolvePriority({ kind: "dasha.importantAntardasha" }),
        expiresAt: null,
        metadata: { dedupeKey: `dasha-important-antar:${currentAntar.lord}:${currentAntar.startDate}`, destination: "horoscope" },
      }, results);
    }
  }

  // Career / Relationship / Finance / Health / Personal Growth predictions
  // — surfaced only when the Prediction Engine's own confidence score is
  // strong, using its text/label/score exactly as computed.
  const categoryToTitle = {
    career: "Career Opportunity",
    marriage: "Relationship Insight",
    relationship: "Relationship Insight",
    finance: "Finance Insight",
    health: "Health Reminder",
    "spiritual growth": "Personal Growth Reminder",
    education: "Education Insight",
    family: "Family Insight",
  };
  for (const p of insights.predictions || []) {
    const score = typeof p.confidence === "object" ? p.confidence?.score : p.confidence;
    if (typeof score !== "number" || score < 65) continue;
    const key = String(p.category || "").toLowerCase();
    const title = categoryToTitle[key] || `${p.category} Insight`;
    await emit(userId, {
      title,
      message: p.prediction,
      category: "prediction",
      priority: resolvePriority({ kind: "prediction.insight", score }),
      expiresAt: null,
      metadata: { dedupeKey: `prediction:${key}:${maha}:${antar || "none"}`, destination: "horoscope" },
    }, results);
  }

  // Major Planetary Transit / Jupiter Transit / Saturn Transit — only
  // Saturn/Jupiter are surfaced by name per the Phase 2 spec; Rahu/Ketu
  // still roll into the generic "Major Planetary Transit" bucket when
  // they carry a flagged effect.
  for (const t of insights.transits || []) {
    const hasRealEffect = t.houseFromMoon && !String(t.effect).startsWith("Not enough data");
    if (!hasRealEffect) continue;
    const isNamed = t.planet === "Jupiter" || t.planet === "Saturn";
    const hasClassicalFlag = Array.isArray(t.flags) && t.flags.length > 0;
    const flagNote = hasClassicalFlag ? ` (${t.flags.map((f) => f.name).join(", ")})` : "";
    await emit(userId, {
      title: isNamed ? `${t.planet} Transit Update` : "Major Planetary Transit",
      message: `${t.planet} is transiting ${t.transitSign}${t.natalMoonSign ? ` (from your natal Moon in ${t.natalMoonSign})` : ""}${flagNote}. ${t.effect}`,
      category: "transit",
      priority: resolvePriority({ kind: "transit.update", hasClassicalFlag, isNamed }),
      expiresAt: null,
      metadata: { dedupeKey: `transit:${t.planet}:${t.transitSign}`, destination: "horoscope" },
    }, results);
  }
}

// ── AI Life Coach (Daily/Weekly/Monthly + Affirmation + Spiritual Practice)
// Reuses lifeCoachService.generateDailyGuidance exactly as
// /api/life-coach/guidance does. Deduped per-day (and per-week/per-month
// for the outlook variants) so Gemini is called at most once per user per
// day here, regardless of how often this generator itself is invoked.
// Wrapped defensively: if Gemini is unreachable, this generator simply
// produces nothing rather than failing the whole batch.
async function generateAiLifeCoachNotifications(userId, results) {
  const [latestSummary] = reportRepository.findByUser(userId);
  if (!latestSummary) return;

  const date = todayStr();
  let result;
  try {
    result = await generateDailyGuidance({ chart: latestSummary.chart, report: latestSummary.report, date });
  } catch (err) {
    logger.error("Notification generation: generateDailyGuidance failed/unavailable, skipping AI Life Coach notifications:", err);
    return;
  }
  const { guidance } = result || {};
  if (!guidance) return;

  await emit(userId, {
    title: "Daily Guidance Ready",
    message: guidance.todaysFocus || "Your daily AI Life Coach guidance is ready.",
    category: "ai",
    priority: resolvePriority({ kind: "ai.dailyGuidance" }),
    expiresAt: `${date}T23:59:59.000Z`,
    metadata: { dedupeKey: `lifecoach-daily:${date}`, destination: "ai-life-coach" },
  }, results);

  if (guidance.dailyAffirmation) {
    await emit(userId, {
      title: "Daily Affirmation Ready",
      message: guidance.dailyAffirmation,
      category: "ai",
      priority: resolvePriority({ kind: "ai.affirmation" }),
      expiresAt: `${date}T23:59:59.000Z`,
      metadata: { dedupeKey: `lifecoach-affirmation:${date}`, destination: "ai-life-coach" },
    }, results);
  }

  if (guidance.spiritualPractice?.activity) {
    await emit(userId, {
      title: "Spiritual Practice Ready",
      message: guidance.spiritualPractice.significance || `Today's recommended practice: ${guidance.spiritualPractice.activity}.`,
      category: "ai",
      priority: resolvePriority({ kind: "ai.spiritualPractice" }),
      expiresAt: `${date}T23:59:59.000Z`,
      metadata: { dedupeKey: `lifecoach-spiritual:${date}`, destination: "ai-life-coach" },
    }, results);
  }

  // Weekly/Monthly Outlook now carry a real expiresAt (see Notification
  // Expiration in the Phase 2 spec) instead of null — "Weekly Outlook
  // expires after one week" / "Monthly Outlook expires after month end",
  // computed with plain calendar math only (endOfWeekIso/endOfMonthIso
  // above), no astrology involved.
  if (guidance.weeklyOutlook?.weeklyEnergyScore != null) {
    await emit(userId, {
      title: "Weekly Outlook Ready",
      message: guidance.weeklyOutlook.weeklyTheme || `Your weekly energy score is ${guidance.weeklyOutlook.weeklyEnergyScore}/100.`,
      category: "ai",
      priority: resolvePriority({ kind: "ai.weeklyOutlook" }),
      expiresAt: endOfWeekIso(),
      metadata: { dedupeKey: `lifecoach-weekly:${isoWeekKey()}`, destination: "ai-life-coach" },
    }, results);
  }

  if (guidance.monthlyOutlook?.monthlyEnergyScore != null) {
    await emit(userId, {
      title: "Monthly Outlook Ready",
      message: guidance.monthlyOutlook.monthlyTheme || `Your monthly energy score is ${guidance.monthlyOutlook.monthlyEnergyScore}/100.`,
      category: "ai",
      priority: resolvePriority({ kind: "ai.monthlyOutlook" }),
      expiresAt: endOfMonthIso(),
      metadata: { dedupeKey: `lifecoach-monthly:${monthKey()}`, destination: "ai-life-coach" },
    }, results);
  }
}

// Orchestrator — runs every generator for one user. Each generator is
// independently defensive (a failure in one never stops the others).
// Called from POST /api/notifications/generate (see notification.routes
// .js), which the frontend triggers once per dashboard/session load (see
// NotificationsWidget.jsx) — there is no cron/scheduler in this codebase,
// so "automatic" generation is request-triggered rather than time-
// triggered, same posture as every other on-demand engine here.
export async function generateForUser(userId) {
  const results = { generated: 0, skippedDuplicate: 0, errors: 0 };

  await generatePanchangAndFestivalNotifications(userId, results);
  await generateFestivalAndVratNotifications(userId, results);
  // V4.5 Phase 2 (Festival Intelligence) — additive: Preparation/Puja/
  // Fasting/Starting/Ending reminders, namespaced under "festival-intel:"
  // dedupeKeys so they never collide with the generator above.
  await generateFestivalIntelligenceNotifications(userId, results);
  await generateMuhuratNotifications(userId, results);
  await generateFamilyNotifications(userId, results);
  await generateChartBasedNotifications(userId, results);
  await generateAiLifeCoachNotifications(userId, results);

  return results;
}

export default { generateForUser };
